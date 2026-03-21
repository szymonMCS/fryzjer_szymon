from uuid import UUID
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import TeamMember
from database.repositories.base import BaseRepository


class TeamRepository(BaseRepository[TeamMember]):
    def __init__(self, db: AsyncSession):
        super().__init__(TeamMember, db)
    
    async def get_active(self) -> List[TeamMember]:
        result = await self._db.execute(
            select(self._model)
            .where(self._model.is_active == True)
            .order_by(self._model.display_order)
        )
        return list(result.scalars().all())
