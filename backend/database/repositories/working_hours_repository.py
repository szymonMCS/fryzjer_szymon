from uuid import UUID
from typing import Optional, List
from sqlalchemy import select, case
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import WorkingHours
from database.repositories.base import BaseRepository


class WorkingHoursRepository(BaseRepository[WorkingHours]):
    def __init__(self, db: AsyncSession):
        super().__init__(WorkingHours, db)
    
    async def get_week_schedule(self) -> List[WorkingHours]:
        result = await self._db.execute(
            select(self._model).order_by(
                case(
                    (self._model.day_of_week == "monday", 1),
                    (self._model.day_of_week == "tuesday", 2),
                    (self._model.day_of_week == "wednesday", 3),
                    (self._model.day_of_week == "thursday", 4),
                    (self._model.day_of_week == "friday", 5),
                    (self._model.day_of_week == "saturday", 6),
                    (self._model.day_of_week == "sunday", 7),
                )
            )
        )
        return list(result.scalars().all())
    
    async def get_by_day(self, day: str) -> Optional[WorkingHours]:
        result = await self._db.execute(
            select(self._model).where(self._model.day_of_week == day)
        )
        return result.scalar_one_or_none()
