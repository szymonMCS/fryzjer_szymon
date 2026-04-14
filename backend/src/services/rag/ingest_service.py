import logging
import re
from pathlib import Path
from typing import List
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
import aiofiles
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.config import settings, EMBEDDING_DIMS, MAX_EMBEDDING_TOKENS
from src.services.rag.knowledge_service import truncate_text
from database.models import KnowledgeChunk
from database.repositories.knowledge_repository import KnowledgeRepository

logger = logging.getLogger(__name__)


class IngestService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = KnowledgeRepository(db)
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, timeout=120.0) if settings.OPENAI_API_KEY else None

    def _split_markdown_by_sections(self, text: str, source: str) -> List[dict]:
        sections: List[dict] = []
        current_headers: List[str] = []
        current_content: List[str] = []

        for line in text.split('\n'):
            header_match = re.match(r'^(#{1,4})\s+(.+)', line)
            if header_match:
                if current_content:
                    content_text = '\n'.join(current_content).strip()
                    if content_text and len(content_text) > 30:
                        title = ' > '.join(current_headers) if current_headers else content_text[:80]
                        sections.append({"title": title[:100], "content": content_text, "source": source})

                level = len(header_match.group(1))
                header_text = header_match.group(2).strip()
                current_headers = current_headers[:level - 1]
                current_headers.append(header_text)
                current_content = []
            else:
                current_content.append(line)

        if current_content:
            content_text = '\n'.join(current_content).strip()
            if content_text and len(content_text) > 30:
                title = ' > '.join(current_headers) if current_headers else content_text[:80]
                sections.append({"title": title[:100], "content": content_text, "source": source})

        final_chunks = []
        for section in sections:
            if len(section["content"]) <= settings.RAG_CHUNK_SIZE:
                final_chunks.append(section)
            else:
                sub_chunks = self._sub_split(section["content"])
                for i, sub in enumerate(sub_chunks):
                    suffix = f" (part {i+1})" if len(sub_chunks) > 1 else ""
                    final_chunks.append({
                        "title": (section["title"] + suffix)[:100],
                        "content": sub,
                        "source": section["source"],
                    })

        return final_chunks

    def _sub_split(self, text: str) -> List[str]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.RAG_CHUNK_SIZE,
            chunk_overlap=settings.RAG_CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        parts = splitter.split_text(text)
        return [p.strip() for p in parts if p.strip()]

    async def _create_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not self.openai_client:
            raise ValueError("Brak klucza API OpenAI")

        truncated_texts = [truncate_text(t, MAX_EMBEDDING_TOKENS) for t in texts]

        all_embeddings = []
        for i in range(0, len(truncated_texts), 20):
            batch = truncated_texts[i:i+20]
            response = await self.openai_client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=batch,
                dimensions=EMBEDDING_DIMS
            )
            all_embeddings.extend([e.embedding for e in response.data])

        return all_embeddings

    async def ingest_file(self, file_path: Path | str, rebuild: bool = False) -> int:
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Plik nie istnieje: {file_path}")
        if rebuild:
            await self.repo.delete_by_source(file_path.name)

        async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
            document_text = await f.read()

        logger.info(f"[INGEST] Processing {file_path.name} ({len(document_text)} chars)")

        chunks = self._split_markdown_by_sections(document_text, file_path.name)
        logger.info(f"[INGEST] Split into {len(chunks)} chunks")

        if not chunks:
            logger.warning(f"[INGEST] No chunks extracted from {file_path.name}")
            return 0

        texts = [f"{c['title']}\n\n{c['content']}" for c in chunks]
        embeddings = await self._create_embeddings(texts)

        filename_lower = file_path.name.lower()
        if "salon" in filename_lower:
            category = "salon"
        elif "fryzjer" in filename_lower:
            category = "fryzjerstwo"
        else:
            category = "general"

        for chunk, emb in zip(chunks, embeddings):
            self.db.add(KnowledgeChunk(
                category=category,
                title=chunk["title"],
                content=chunk["content"],
                embedding=emb,
                source=file_path.name
            ))
        await self.db.commit()
        logger.info(f"[INGEST] Done: {file_path.name} -> {len(chunks)} chunks (category: {category})")
        return len(chunks)
