from uuid import UUID
from datetime import date, datetime, timedelta, time as dt_time
from typing import Optional, List
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Booking
from database.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    def __init__(self, db: AsyncSession):
        super().__init__(Booking, db)
    
    async def get_by_date_range(self, start_date: date, end_date: date) -> List[Booking]:
        result = await self._db.execute(
            select(self._model)
            .where(
                and_(
                    self._model.booking_date >= start_date,
                    self._model.booking_date <= end_date
                )
            )
            .order_by(self._model.booking_date, self._model.booking_time)
        )
        return list(result.scalars().all())
    
    async def get_by_team_member(self, member_id: UUID, booking_date: date) -> List[Booking]:
        result = await self._db.execute(
            select(self._model)
            .where(
                and_(
                    self._model.team_member_id == member_id,
                    self._model.booking_date == booking_date,
                    self._model.status != "cancelled"
                )
            )
            .order_by(self._model.booking_time)
        )
        return list(result.scalars().all())
    
    async def check_time_conflict(
        self, 
        member_id: UUID, 
        booking_date: date, 
        start_time: str, 
        duration: int,
        exclude_booking_id: Optional[UUID] = None
    ) -> bool:
        bookings = await self.get_by_team_member(member_id, booking_date)
        new_start = dt_time.fromisoformat(start_time)
        new_end_dt = datetime.combine(booking_date, new_start) + timedelta(minutes=duration)
        new_end = new_end_dt.time()
        
        for booking in bookings:
            if exclude_booking_id and booking.id == exclude_booking_id:
                continue
            existing_start = dt_time.fromisoformat(booking.booking_time)
            existing_end_dt = datetime.combine(booking_date, existing_start) + timedelta(minutes=booking.duration)
            existing_end = existing_end_dt.time()
            if new_start < existing_end and new_end > existing_start:
                return True
        return False
    
    async def get_by_confirmation_code(self, code: str) -> Optional[Booking]:
        result = await self._db.execute(select(self._model).where(self._model.confirmation_code == code))
        return result.scalar_one_or_none()
