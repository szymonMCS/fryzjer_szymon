import logging
import time
from typing import List, Optional
from pydantic import BaseModel, Field
from tenacity import retry, wait_exponential, stop_after_attempt
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from src.config import settings
from database.models import KnowledgeChunk

logger = logging.getLogger(__name__)

MODEL = settings.RAG_LLM_MODEL
EMBEDDING_MODEL = settings.RAG_EMBEDDING_MODEL
RETRIEVAL_K = 20
FINAL_K = 10
SIMILARITY_THRESHOLD = 0.7

wait = wait_exponential(multiplier=1, min=1, max=10)
stop = stop_after_attempt(3)

SYSTEM_PROMPT = """Jesteś kompetentnym i przyjaznym asystentem reprezentującym salon fryzjerski.
Rozmawiasz z użytkownikiem o firmie i oferowanych usługach.
Twoja odpowiedź będzie oceniana pod kątem dokładności, trafności i kompletności.
Jeśli nie znasz odpowiedzi, poinformuj o tym.
Dla kontekstu, oto konkretne fragmenty z Bazy Wiedzy:
{context}

Biorąc pod uwagę ten kontekst, odpowiedz na pytanie użytkownika."""


class Result(BaseModel):
    page_content: str
    metadata: dict
    similarity: float = 0.0


class RankOrder(BaseModel):
    order: List[int] = Field(description="Kolejność istotności fragmentów")


class QueryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    @retry(wait=wait, stop=stop, reraise=True)
    async def _rerank(self, question: str, chunks: List[Result]):
        logger.info(f"Rerank: start dla {len(chunks)} chunków")
        start = time.time()
        
        system_prompt = """Jesteś osobą dokonującą rerankingu dokumentów.
Otrzymujesz pytanie i listę odpowiednich fragmentów tekstu z zapytania do bazy wiedzy.
Musisz uporządkować podane fragmenty według trafności pytania.
Odpowiadaj tylko za pomocą listy uszeregowanych identyfikatorów fragmentów."""
        
        user_prompt = f"Pytanie: {question}\n\nFragmenty:\n\n"
        for index, chunk in enumerate(chunks):
            user_prompt += f"# ID: {index + 1}:\n{chunk.page_content[:500]}\n\n"
        user_prompt += "Odpowiedz listą ID w formacie JSON."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        response = await self.openai_client.chat.completions.create(
            model=MODEL, 
            messages=messages, 
            response_format={"type": "json_object"}, 
            timeout=30
        )
        reply = response.choices[0].message.content
        order = RankOrder.model_validate_json(reply).order

        logger.info(f"Rerank: zakończono w {time.time()-start:.2f}s")
        
        if not order:
            return chunks
        
        valid = [chunks[i-1] for i in order if 1 <= i <= len(chunks)]
        return valid if valid else chunks

    @retry(wait=wait, stop=stop, reraise=True)
    async def _rewrite_query(self, question: str, history: List[dict] = None):
        message = f"""Przepisz pytanie użytkownika, aby było bardziej szczegółowe.

Historia: {history or []}
Pytanie: {question}

Odpowiedz TYLKO przepisanym pytaniem."""
        
        logger.info(f"Rewrite query: start")
        start = time.time()
        response = await self.openai_client.chat.completions.create(
            model=MODEL, 
            messages=[{"role": "user", "content": message}], 
            timeout=30
        )
        result = response.choices[0].message.content
        logger.info(f"Rewrite query: zakończono w {time.time()-start:.2f}s")
        return result

    def _merge_chunks(self, chunks1: List[Result], chunks2: List[Result]):
        merged = chunks1[:]
        existing = {c.page_content for c in chunks1}
        for c in chunks2:
            if c.page_content not in existing:
                merged.append(c)
        return merged

    async def _fetch_unranked(self, question: str):
        emb_response = await self.openai_client.embeddings.create(
            model=EMBEDDING_MODEL, 
            input=[question]
        )
        query_embedding = emb_response.data[0].embedding
        
        sql = """
            SELECT id, title, content, source, 1 - (embedding <=> :embedding) as similarity
            FROM knowledge_chunks
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> :embedding
            LIMIT :limit
        """
        result = await self.db.execute(
            text(sql), 
            {"embedding": str(query_embedding), "limit": RETRIEVAL_K}
        )
        rows = result.fetchall()
        
        return [
            Result(
                page_content=row.content, 
                metadata={"source": row.source}, 
                similarity=row.similarity
            )
            for row in rows if row.similarity >= SIMILARITY_THRESHOLD
        ]

    async def fetch_context(self, question: str):
        logger.info(f"Fetch context: start dla '{question[:50]}...'")
        start = time.time()
        
        rewritten = await self._rewrite_query(question)
        chunks1 = await self._fetch_unranked(question)
        chunks2 = await self._fetch_unranked(rewritten)
        chunks = self._merge_chunks(chunks1, chunks2)
        
        if not chunks:
            logger.warning("BRAK CHUNKÓW W BAZIE!")
            return []
        
        reranked = await self._rerank(question, chunks)
        logger.info(f"Fetch context: zakończono w {time.time()-start:.2f}s")
        return reranked[:FINAL_K]

    def _make_messages(self, question: str, history: list, chunks: List[Result]):
        context = "\n\n".join(
            f"Fragment z {c.metadata['source']}:\n{c.page_content}" for c in chunks
        )
        system_prompt = SYSTEM_PROMPT.format(context=context)
        return (
            [{"role": "system", "content": system_prompt}]
            + (history or [])
            + [{"role": "user", "content": question}]
        )

    @retry(wait=wait, stop=stop, reraise=True)
    async def answer(self, question: str, history: list = None):
        logger.info(f"Answer: start dla '{question[:50]}...'")
        start = time.time()
        
        chunks = await self.fetch_context(question)
        if not chunks:
            return "Przepraszam, nie znalazłem informacji na ten temat.", []
        
        messages = self._make_messages(question, history or [], chunks)
        response = await self.openai_client.chat.completions.create(
            model=MODEL, 
            messages=messages, 
            timeout=30
        )
        result = response.choices[0].message.content
        
        logger.info(f"Answer: zakończono w {time.time()-start:.2f}s")
        return result, chunks
