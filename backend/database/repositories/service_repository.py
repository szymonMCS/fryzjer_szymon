from uuid import UUID
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Service
from database.repositories.base import BaseRepository


class ServiceRepository(BaseRepository[Service]):
    def __init__(self, db: AsyncSession):
        super().__init__(Service, db)
    
    async def get_by_category(self, category: str) -> List[Service]:
        result = await self._db.execute(select(self._model).where(self._model.category == category))
        return list(result.scalars().all())
    
    async def get_active(self) -> List[Service]:
        result = await self._db.execute(select(self._model).where(self._model.is_active == True).order_by(self._model.display_order))
        return list(result.scalars().all())
