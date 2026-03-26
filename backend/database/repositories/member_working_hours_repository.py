from uuid import UUID
from datetime import date
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import MemberWorkingHours
from database.repositories.base import BaseRepository


class MemberWorkingHoursRepository(BaseRepository[MemberWorkingHours]):
    def __init__(self, db: AsyncSession):
        super().__init__(MemberWorkingHours, db)
    
    async def get_by_member_and_date(self, team_member_id: UUID, work_date: date) -> Optional[MemberWorkingHours]:
        result = await self._db.execute(
            select(self._model).where(
                and_(
                    self._model.team_member_id == team_member_id,
                    self._model.work_date == work_date
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_by_member(self, team_member_id: UUID, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[MemberWorkingHours]:
        query = select(self._model).where(self._model.team_member_id == team_member_id)
        
        if start_date:
            query = query.where(self._model.work_date >= start_date)
        if end_date:
            query = query.where(self._model.work_date <= end_date)
            
        query = query.order_by(self._model.work_date)
        result = await self._db.execute(query)
        return list(result.scalars().all())
    
    async def get_all_in_date_range(self, start_date: date, end_date: date) -> List[MemberWorkingHours]:
        result = await self._db.execute(
            select(self._model).where(
                and_(
                    self._model.work_date >= start_date,
                    self._model.work_date <= end_date
                )
            ).order_by(self._model.work_date)
        )
        return list(result.scalars().all())
