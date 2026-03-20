from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.models import KnowledgeChunk
from database.interfaces import IKnowledgeChunkRepository
from database.repositories.base import BaseRepository


class KnowledgeChunkRepository(BaseRepository[KnowledgeChunk], IKnowledgeChunkRepository):
    def __init__(self, db: AsyncSession):
        super().__init__(KnowledgeChunk, db)
        self._db = db
    
    async def get_by_category(self, category: str) -> List[KnowledgeChunk]:
        result = await self._db.execute(
            select(KnowledgeChunk)
            .where(KnowledgeChunk.category == category, KnowledgeChunk.is_active == True)
            .order_by(KnowledgeChunk.chunk_index)
        )
        return list(result.scalars().all())
    
    async def get_active(self) -> List[KnowledgeChunk]:
        result = await self._db.execute(
            select(KnowledgeChunk)
            .where(KnowledgeChunk.is_active == True)
            .order_by(KnowledgeChunk.category, KnowledgeChunk.chunk_index)
        )
        return list(result.scalars().all())
    
    async def create(self, obj_in: dict) -> KnowledgeChunk:
        if "id" not in obj_in:
            import uuid
            obj_in["id"] = str(uuid.uuid4())
        return await super().create(obj_in)
