from pathlib import Path
from typing import List
from pydantic import BaseModel, Field
from tenacity import retry, wait_exponential, stop_after_attempt
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from src.config import settings
from database.models import KnowledgeChunk
from database.repositories.knowledge_repository import KnowledgeRepository

MODEL = settings.OPENAI_LLM_MODEL
EMBEDDING_MODEL = settings.OPENAI_EMBEDDING_MODEL
wait = wait_exponential(multiplier=1, min=2, max=10)
stop = stop_after_attempt(3)


class Result(BaseModel):
    page_content: str
    metadata: dict


class Chunk(BaseModel):
    headline: str = Field(description="Nagłówek prawdopodobnie będzie użyty w zapytaniu")
    summary: str = Field(description="Podsumowanie zawartości fragmentu")
    original_text: str = Field(description="Oryginalna zawartość fragmentu")

    def as_result(self, source: str):
        return Result(page_content=self.headline + "\n\n" + self.summary + "\n\n" + self.original_text, metadata={"source": source})


class Chunks(BaseModel):
    chunks: list[Chunk]


class IngestService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = KnowledgeRepository(db)
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, timeout=120.0)

    def _make_prompt(self, document_text: str, source: str, average_chunk_size: int = 500):
        how_many = (len(document_text) // average_chunk_size) + 1
        return f"""Podziel dokument na nakładające się fragmenty (chunki) do Bazy Wiedzy.

Dokument pochodzi z salonu fryzjerskiego.
Źródło: {source}

Chatbot będzie wykorzystywał te fragmenty do odpowiadania na pytania klientów.
Podziel dokument według własnego uznania, upewniając się, że cała treść dokumentu została uwzględniona.

Dokument powinien zostać podzielony na co najmniej {how_many} fragmentów.
Pomiędzy fragmentami musi występować zakładka (overlap) ~25% lub ~50 słów.

Dla każdego fragmentu podaj:
1. headline - krótki nagłówek odpowiadający potencjalnemu zapytaniu
2. summary - kilka zdań podsumowujących treść
3. original_text - dokładny, oryginalny tekst fragmentu

Dokument:
{document_text}

Zwróć fragmenty w formacie JSON."""

    @retry(wait=wait, stop=stop, reraise=True)
    async def _process_document(self, document_text: str, source: str):
        messages = [{"role": "user", "content": self._make_prompt(document_text, source)}]
        response = await self.openai_client.chat.completions.create(model=MODEL, messages=messages, response_format={"type": "json_object"})
        reply = response.choices[0].message.content
        chunks_data = Chunks.model_validate_json(reply)
        return [chunk.as_result(source) for chunk in chunks_data.chunks]

    async def _create_embeddings(self, chunks: List[Result]):
        texts = [chunk.page_content for chunk in chunks]
        response = await self.openai_client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
        return [e.embedding for e in response.data]

    async def _save_to_db(self, chunks: List[Result], embeddings: list):
        for chunk, emb in zip(chunks, embeddings):
            self.db.add(KnowledgeChunk(
                category="general",
                title=chunk.page_content[:100],
                content=chunk.page_content,
                source=chunk.metadata["source"],
                embedding=emb
            ))
        await self.db.commit()

    async def ingest_file(self, file_path: Path, rebuild: bool = False):
        if not file_path.exists():
            raise FileNotFoundError(f"Plik nie istnieje: {file_path}")

        if rebuild:
            await self.repo.delete_by_source(file_path.name)

        with open(file_path, "r", encoding="utf-8") as f:
            document_text = f.read()

        print(f"[INGEST] Processing {file_path.name} ({len(document_text)} chars)...")
        chunks = await self._process_document(document_text, file_path.name)
        print(f"[INGEST] Created {len(chunks)} chunks, generating embeddings...")
        embeddings = await self._create_embeddings(chunks)
        print(f"[INGEST] Saving {len(chunks)} chunks to DB...")
        await self._save_to_db(chunks, embeddings)
        print(f"[INGEST] Done: {file_path.name} -> {len(chunks)} chunks")
        return len(chunks)
