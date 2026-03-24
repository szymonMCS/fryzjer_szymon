from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from uuid import UUID
from datetime import date
from database.models import Booking


class IBookingService(ABC):
    @abstractmethod
    async def get_availability(self, booking_date: date, service_id: UUID, team_member_id: Optional[UUID] = None) -> Dict[str, List[str]]: ...
    @abstractmethod
    async def create_booking(self, data: dict) -> Booking: ...
    @abstractmethod
    async def get_booking(self, booking_id: UUID) -> Optional[Booking]: ...
    @abstractmethod
    async def cancel_booking(self, booking_id: UUID, phone: str, code: str) -> bool: ...
    @abstractmethod
    async def get_upcoming_bookings(self, limit: int = 50) -> List[Booking]: ...
    @abstractmethod
    async def get_filtered_bookings(self, start_date: Optional[date] = None, end_date: Optional[date] = None, team_member_id: Optional[UUID] = None, status: Optional[str] = None, limit: int = 50) -> List[Booking]: ...
