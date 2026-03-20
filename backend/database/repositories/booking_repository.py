from typing import Optional, List
from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from database.models import Booking, BookingStatus
from database.interfaces import IBookingRepository
from database.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking], IBookingRepository):
    def __init__(self, db: AsyncSession):
        super().__init__(Booking, db)
        self._db = db
    
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> List[Booking]:
        query = select(Booking)
        
        if status:
            query = query.where(Booking.status == status)
        if date_from:
            query = query.where(Booking.date >= date_from)
        if date_to:
            query = query.where(Booking.date <= date_to)
        
        query = query.offset(skip).limit(limit).order_by(Booking.date.desc(), Booking.time.desc())
        result = await self._db.execute(query)
        return list(result.scalars().all())
    
    async def get_by_date(self, date: date) -> List[Booking]:
        result = await self._db.execute(
            select(Booking)
            .where(Booking.date == date)
            .order_by(Booking.time)
        )
        return list(result.scalars().all())
    
    async def get_by_date_and_time(
        self, 
        date: date, 
        time: str,
        exclude_id: Optional[str] = None
    ) -> Optional[Booking]:
        query = select(Booking).where(
            and_(Booking.date == date, Booking.time == time)
        )
        
        if exclude_id:
            query = query.where(Booking.id != exclude_id)
            
        result = await self._db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_status(self, booking_id: str, status: str) -> Booking:
        booking = await self.get(booking_id)
        booking.status = status
        await self._db.commit()
        await self._db.refresh(booking)
        return booking
    
    async def cancel(self, booking_id: str, reason: Optional[str] = None) -> Booking:
        booking = await self.get(booking_id)
        booking.status = BookingStatus.CANCELLED.value
        booking.cancelled_at = datetime.now(timezone.utc)
        if reason:
            booking.cancelled_reason = reason
        await self._db.commit()
        await self._db.refresh(booking)
        return booking
    
    async def count_by_date_and_status(self, date: date, statuses: List[str]) -> int:
        result = await self._db.execute(
            select(func.count(Booking.id)).where(
                and_(Booking.date == date, Booking.status.in_(statuses))
            )
        )
        return result.scalar() or 0
    
    async def is_slot_available(
        self, 
        date: date, 
        time: str, 
        exclude_booking_id: Optional[str] = None
    ) -> bool:
        booking = await self.get_by_date_and_time(
            date, time, exclude_id=exclude_booking_id
        )
        return booking is None
    
    async def create(self, obj_in: dict) -> Booking:
        if "id" not in obj_in:
            import uuid
            obj_in["id"] = str(uuid.uuid4())
        if "status" not in obj_in:
            obj_in["status"] = BookingStatus.PENDING.value
        return await super().create(obj_in)
