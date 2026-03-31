from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from database.models import KnowledgeChunk
from database.repositories.base import BaseRepository


class KnowledgeRepository(BaseRepository[KnowledgeChunk]):
    def __init__(self, db: AsyncSession):
        super().__init__(KnowledgeChunk, db)
    
    async def get_by_category(self, category: str, skip: int = 0, limit: int = 100) -> List[KnowledgeChunk]:
        result = await self._db.execute(select(self._model).where(self._model.category == category).offset(skip).limit(limit))
        return list(result.scalars().all())
    
    async def search_by_content(self, search_term: str, skip: int = 0, limit: int = 100) -> List[KnowledgeChunk]:
        result = await self._db.execute(select(self._model).where(self._model.content.ilike(f"%{search_term}%")).offset(skip).limit(limit))
        return list(result.scalars().all())
    
    async def get_without_embeddings(self, limit: int = 100) -> List[KnowledgeChunk]:
        result = await self._db.execute(select(self._model).where(self._model.embedding.is_(None)).limit(limit))
        return list(result.scalars().all())
    
    async def get_categories(self) -> List[str]:
        result = await self._db.execute(select(self._model.category).distinct())
        return [row[0] for row in result.fetchall()]
    
    async def delete_all(self) -> int:
        count_result = await self._db.execute(select(func.count()).select_from(self._model))
        count = count_result.scalar() or 0
        await self._db.execute(delete(self._model))
        await self._db.commit()
        return count
    
    async def count_by_category(self) -> dict:
        result = await self._db.execute(select(self._model.category, func.count()).group_by(self._model.category))
        return {row[0]: row[1] for row in result.fetchall()}
    
    async def update_embedding(self, chunk_id: UUID, embedding: List[float]) -> None:
        chunk = await self.get(chunk_id)
        if chunk:
            chunk.embedding = embedding
            await self._db.commit()
