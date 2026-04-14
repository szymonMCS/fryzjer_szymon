from typing import List, Optional, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, text
from database.models import KnowledgeChunk
from database.repositories.base import BaseRepository


class SearchResultRow:
    def __init__(self, chunk: KnowledgeChunk, similarity: float):
        self.chunk = chunk
        self.similarity = similarity


class KnowledgeRepository(BaseRepository[KnowledgeChunk]):
    def __init__(self, db: AsyncSession):
        super().__init__(KnowledgeChunk, db)

    async def get_by_category(self, category: str, skip: int = 0, limit: int = 100) -> List[KnowledgeChunk]:
        result = await self._db.execute(
            select(self._model).where(self._model.category == category).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_categories(self) -> List[str]:
        result = await self._db.execute(select(self._model.category).distinct())
        return [row[0] for row in result.fetchall()]

    async def get_without_embeddings(self, limit: int = 100) -> List[KnowledgeChunk]:
        result = await self._db.execute(
            select(self._model).where(self._model.embedding.is_(None)).limit(limit)
        )
        return list(result.scalars().all())

    async def delete_all(self) -> int:
        count_result = await self._db.execute(select(func.count()).select_from(self._model))
        count = count_result.scalar() or 0
        await self._db.execute(delete(self._model))
        await self._db.commit()
        return count

    async def delete_by_source(self, source: str) -> None:
        await self._db.execute(delete(self._model).where(self._model.source == source))
        await self._db.commit()

    async def search_similar_chunks(self, query_embedding: List[float], similarity_threshold: float = 0.3, k: int = 20, category: Optional[str] = None) -> List[SearchResultRow]:
        sql = """
            SELECT id, category, title, content, source, 1 - (embedding <=> :embedding) as similarity
            FROM knowledge_chunks
            WHERE embedding IS NOT NULL
        """
        params: dict[str, Any] = {"embedding": str(query_embedding)}

        if category:
            sql += " AND category = :category"
            params["category"] = category

        sql += " ORDER BY embedding <=> :embedding LIMIT :limit"
        params["limit"] = k

        result = await self._db.execute(text(sql), params)
        rows = result.fetchall()

        return [
            SearchResultRow(
                chunk=KnowledgeChunk(
                    id=row.id,
                    category=row.category,
                    title=row.title,
                    content=row.content,
                    source=row.source
                ),
                similarity=float(row.similarity)
            )
            for row in rows
            if row.similarity >= similarity_threshold
        ]
