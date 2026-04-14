from typing import List, Optional
from dataclasses import dataclass
import tiktoken
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from src.config import settings, EMBEDDING_DIMS, MAX_EMBEDDING_TOKENS
from database.models import KnowledgeChunk
from database.repositories.knowledge_repository import KnowledgeRepository

_encoder = tiktoken.encoding_for_model("text-embedding-3-large")


def truncate_text(text: str, max_tokens: int = MAX_EMBEDDING_TOKENS) -> str:
    try:
        tokens = _encoder.encode(text)
        if len(tokens) <= max_tokens:
            return text
        return _encoder.decode(tokens[:max_tokens])
    except Exception:
        return text[:max_tokens * 4]


@dataclass
class SearchResult:
    chunk: KnowledgeChunk
    similarity: float


class KnowledgeRAGService:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.repo = KnowledgeRepository(db_session)

    async def search_similar(self, query: str, k: int = 5, category: Optional[str] = None) -> List[SearchResult]:
        if not self.openai_client:
            return []

        response = await self.openai_client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=truncate_text(query),
            dimensions=EMBEDDING_DIMS
        )
        query_embedding = response.data[0].embedding
        rows = await self.repo.search_similar_chunks(
            query_embedding=query_embedding,
            similarity_threshold=settings.RAG_SIMILARITY_THRESHOLD,
            k=k,
            category=category
        )
        return [SearchResult(chunk=r.chunk, similarity=r.similarity) for r in rows]

