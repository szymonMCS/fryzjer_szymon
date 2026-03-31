import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
from tenacity import retry, wait_exponential, stop_after_attempt
from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import KnowledgeChunk
from src.config import settings

OPENAI_API_KEY = settings.OPENAI_API_KEY
LLM_MODEL = settings.RAG_LLM_MODEL
EMBEDDING_MODEL = settings.RAG_EMBEDDING_MODEL
RETRIEVAL_K = settings.RAG_RETRIEVAL_K
FINAL_K = settings.RAG_FINAL_K
SIMILARITY_THRESHOLD = 0.7

wait = wait_exponential(multiplier=1, min=1, max=10)
stop = stop_after_attempt(3)


@dataclass
class SearchResult:
    chunk: KnowledgeChunk
    similarity: float


@dataclass
class RAGResponse:
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    query_time_ms: int


class RAGService:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    async def _generate_embedding(self, text: str) -> List[float]:
        if not self.openai_client:
            raise ValueError("Brak klucza API OpenAI")
        response = await self.openai_client.embeddings.create(
            model=EMBEDDING_MODEL, 
            input=text[:30000]
        )
        return response.data[0].embedding

    async def search_similar_chunks(self, query: str, k: int = RETRIEVAL_K, category: Optional[str] = None) -> List[SearchResult]:
        query_embedding = await self._generate_embedding(query)
        
        sql = """
            SELECT id, category, title, content, source, 1 - (embedding <=> :embedding) as similarity
            FROM knowledge_chunks
            WHERE embedding IS NOT NULL
        """
        params = {"embedding": str(query_embedding)}
        
        if category:
            sql += " AND category = :category"
            params["category"] = category
        
        sql += " ORDER BY embedding <=> :embedding LIMIT :limit"
        params["limit"] = k
        
        result = await self.db.execute(text(sql), params)
        rows = result.fetchall()
        
        search_results = []
        for row in rows:
            if row.similarity >= SIMILARITY_THRESHOLD:
                chunk = KnowledgeChunk(
                    id=row.id,
                    category=row.category,
                    title=row.title,
                    content=row.content,
                    source=row.source
                )
                search_results.append(SearchResult(chunk=chunk, similarity=row.similarity))
        
        return search_results

    @retry(wait=wait, stop=stop, reraise=True)
    async def rerank_chunks(self, query: str, chunks: List[SearchResult], k: int = FINAL_K) -> List[SearchResult]:
        if not chunks or not self.openai_client:
            return chunks[:k]
        
        system_prompt = """Jesteś systemem do rerankingu dokumentów.
Otrzymasz pytanie użytkownika i listę fragmentów tekstu z bazy wiedzy.
Twoim zadaniem jest uporządkowanie fragmentów według trafności do pytania.
Zwróć TYLKO listę numerów ID (indeksów) posortowanych od najbardziej do najmniej trafnych.

Format odpowiedzi: [3, 1, 5, 2, 4]"""

        user_prompt = f"Pytanie użytkownika: {query}\n\nFragmenty do oceny (każdy zaczyna się od # ID):\n\n"
        for i, result in enumerate(chunks, 1):
            user_prompt += f"# ID: {i}\nTytuł: {result.chunk.title}\nTreść: {result.chunk.content[:500]}...\n\n"
        
        user_prompt += "Uporządkuj ID fragmentów od najbardziej do najmniej trafnych. Odpowiedź jako lista liczb JSON."

        try:
            response = await self.openai_client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=100
            )
            content = response.choices[0].message.content
            
            try:
                order = json.loads(content).get("order", [])
                if isinstance(order, list) and all(isinstance(x, int) for x in order):
                    reranked = [chunks[i-1] for i in order if 1 <= i <= len(chunks)]
                    return reranked[:k] if reranked else chunks[:k]
            except (json.JSONDecodeError, KeyError):
                pass
                
        except Exception as e:
            print(f"Błąd podczas rerankingu: {e}")
        
        return chunks[:k]

    @retry(wait=wait, stop=stop, reraise=True)
    async def rewrite_query(self, query: str, history: List[Dict] = None) -> str:
        if not self.openai_client:
            return query
        
        system_prompt = """Jesteś asystentem salonu fryzjerskiego.
Twoim zadaniem jest przepisanie pytania użytkownika tak, aby było bardziej szczegółowe
i precyzyjne pod kątem wyszukiwania w bazie wiedzy salonu.
Zwróć TYLKO przepisane pytanie, bez dodatkowych komentarzy."""

        history_text = ""
        if history:
            history_text = "Historia rozmowy:\n"
            for msg in history[-3:]:
                role = "Użytkownik" if msg.get("role") == "user" else "Asystent"
                history_text += f"{role}: {msg.get('content', '')}\n"
        
        user_prompt = f"""{history_text}
Aktualne pytanie użytkownika: {query}

Przepisz pytanie tak, aby było bardziej szczegółowe i pomogło znaleźć odpowiednie informacje w bazie wiedzy salonu fryzjerskiego."""

        try:
            response = await self.openai_client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )
            rewritten = response.choices[0].message.content.strip()
            return rewritten if rewritten else query
            
        except Exception as e:
            print(f"Błąd podczas przepisywania zapytania: {e}")
            return query

    async def generate_answer(self, query: str, chunks: List[SearchResult], history: List[Dict] = None) -> str:
        if not self.openai_client:
            return "Przepraszam, system odpowiedzi jest tymczasowo niedostępny."
        
        if not chunks:
            return "Przepraszam, nie znalazłem informacji na ten temat w naszej bazie wiedzy. Proszę skontaktować się z salonem bezpośrednio."
        
        context_parts = []
        for i, result in enumerate(chunks, 1):
            context_parts.append(f"[DOKUMENT {i}]\nTytuł: {result.chunk.title}\nKategoria: {result.chunk.category}\nTreść: {result.chunk.content}\n")
        
        context = "\n\n".join(context_parts)
        
        system_prompt = f"""Jesteś przyjaznym i kompetentnym asystentem salonu fryzjerskiego dla mężczyzn.
Odpowiadasz na pytania klientów wyłącznie na podstawie dostarczonego kontekstu.

ZASADY:
1. Odpowiadaj w języku polskim
2. Bądź konkretny i precyzyjny
3. Jeśli nie znasz odpowiedzi, powiedz to wprost i zasugeruj kontakt z salonem
4. Nie wymyślaj informacji - bazuj TYLKO na kontekście
5. Bądź uprzejmy i profesjonalny
6. Jeśli to pomocne, przytocz konkretne ceny lub godziny z kontekstu

KONTEKST Z BAZY WIEDZY:
{context}"""

        messages = [{"role": "system", "content": system_prompt}]
        
        if history:
            for msg in history[-5:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        messages.append({"role": "user", "content": query})
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=LLM_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Błąd podczas generowania odpowiedzi: {e}")
            return "Przepraszam, wystąpił błąd podczas generowania odpowiedzi. Proszę spróbować ponownie."

    async def ask(self, query: str, history: List[Dict] = None) -> RAGResponse:
        start_time = datetime.now()
        
        rewritten_query = await self.rewrite_query(query, history)
        chunks_original = await self.search_similar_chunks(query)
        chunks_rewritten = await self.search_similar_chunks(rewritten_query)
        
        seen_ids = set()
        all_chunks = []
        for chunk in chunks_original + chunks_rewritten:
            if chunk.chunk.id not in seen_ids:
                all_chunks.append(chunk)
                seen_ids.add(chunk.chunk.id)
        
        reranked_chunks = await self.rerank_chunks(query, all_chunks)
        answer = await self.generate_answer(query, reranked_chunks, history)
        
        end_time = datetime.now()
        query_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        confidence = 0.0
        if reranked_chunks:
            confidence = sum(r.similarity for r in reranked_chunks) / len(reranked_chunks)
        
        sources = [
            {
                "title": r.chunk.title,
                "category": r.chunk.category,
                "similarity": round(r.similarity, 3),
                "content_preview": r.chunk.content[:200] + "..."
            }
            for r in reranked_chunks[:5]
        ]
        
        return RAGResponse(
            answer=answer,
            sources=sources,
            confidence=round(confidence, 3),
            query_time_ms=query_time_ms
        )
