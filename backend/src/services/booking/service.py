import random
import string
import time
from datetime import date, datetime, timedelta, time as dt_time
from typing import Optional, List, Dict
from uuid import UUID
from src.services.interfaces.booking import IBookingService
from database.models import Booking
from database.repositories.booking_repository import BookingRepository
from database.repositories.working_hours_repository import WorkingHoursRepository
from database.repositories.service_repository import ServiceRepository
from database.repositories.team_repository import TeamRepository
from database.repositories.blacklist_repository import BlacklistRepository
from database.repositories.member_working_hours_repository import MemberWorkingHoursRepository
from src.core.exceptions import NotFoundException, ConflictException


class BookingService(IBookingService):
    def __init__(
        self,
        booking_repo: BookingRepository,
        working_hours_repo: WorkingHoursRepository,
        service_repo: ServiceRepository,
        team_repo: TeamRepository,
        blacklist_repo: Optional[BlacklistRepository] = None,
        member_working_hours_repo: Optional[MemberWorkingHoursRepository] = None
    ):
        self._booking_repo = booking_repo
        self._working_hours_repo = working_hours_repo
        self._service_repo = service_repo
        self._team_repo = team_repo
        self._blacklist_repo = blacklist_repo
        self._member_working_hours_repo = member_working_hours_repo

    async def _generate_confirmation_code(self) -> str:
        max_attempts = 10
        for _ in range(max_attempts):
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            existing = await self._booking_repo.get_by_confirmation_code(code)
            if not existing:
                return code
        return f"{int(time.time()) % 1000000:06d}"

    def _get_day_of_week(self, booking_date: date) -> str:
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        return days[booking_date.weekday()]

    def _time_to_minutes(self, time_str: str) -> int:
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes

    def _minutes_to_time(self, minutes: int) -> str:
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"

    async def get_availability(self, booking_date: date, service_id: UUID, team_member_id: Optional[UUID] = None) -> Dict[str, List[str]]:
        service = await self._service_repo.get(service_id)
        if not service:
            raise NotFoundException(f"Service {service_id} not found")

        team_members: List = []
        if team_member_id:
            member = await self._team_repo.get(team_member_id)
            if not member:
                raise NotFoundException(f"Team member {team_member_id} not found")
            team_members = [member]
        else:
            team_members = await self._team_repo.get_active()

        day_of_week = self._get_day_of_week(booking_date)
        service_duration = service.duration
        availability: Dict[str, List[str]] = {}

        for member in team_members:
            member_exception = None
            if self._member_working_hours_repo:
                member_exception = await self._member_working_hours_repo.get_by_member_and_date(
                    member.id, booking_date
                )
            if member_exception and not member_exception.is_working:
                continue
            if member_exception and member_exception.start_time and member_exception.end_time:
                start_time = member_exception.start_time.strftime("%H:%M")
                end_time = member_exception.end_time.strftime("%H:%M")
            else:
                working_hours = await self._working_hours_repo.get_by_day(day_of_week)
                if not working_hours or working_hours.is_closed:
                    continue
                if not working_hours.start_time or not working_hours.end_time:
                    continue
                start_time = working_hours.start_time.strftime("%H:%M")
                end_time = working_hours.end_time.strftime("%H:%M")

            existing_bookings = await self._booking_repo.get_by_team_member(member.id, booking_date)
            start_minutes = self._time_to_minutes(start_time)
            end_minutes = self._time_to_minutes(end_time)
            slot_duration = 30
            current_slot = start_minutes

            while current_slot + service_duration <= end_minutes:
                slot_time = self._minutes_to_time(current_slot)
                slot_end = current_slot + service_duration
                is_available = True
                for booking in existing_bookings:
                    booking_start = self._time_to_minutes(booking.booking_time)
                    booking_end = booking_start + booking.duration
                    if (current_slot < booking_end and slot_end > booking_start):
                        is_available = False
                        break
                if is_available:
                    if slot_time not in availability:
                        availability[slot_time] = []
                    availability[slot_time].append(str(member.id))
                current_slot += slot_duration
        return availability

    async def create_booking(self, data: dict) -> Booking:
        service_id = data.get("service_id")
        team_member_id = data.get("team_member_id")
        booking_date = data.get("booking_date")
        booking_time = data.get("booking_time")
        customer_phone = data.get("customer_phone")

        if not service_id or not booking_date or not booking_time:
            raise ValueError("service_id, booking_date, and booking_time are required")
        
        if self._blacklist_repo:
            customer_email = data.get("customer_email")
            is_blacklisted = await self._blacklist_repo.is_blacklisted(
                phone_number=customer_phone, 
                email=customer_email
            )
            if is_blacklisted:
                raise ConflictException("Ten numer telefonu lub email został zablokowany. Skontaktuj się z salonem.")
        
        service = await self._service_repo.get(service_id)
        if not service:
            raise NotFoundException(f"Service {service_id} not found")
        if not team_member_id:
            availability = await self.get_availability(booking_date, service_id)
            available_members = availability.get(str(booking_time), [])
            if not available_members:
                raise ConflictException("Selected time slot is not available")
            team_member_id = UUID(available_members[0])
            data["team_member_id"] = team_member_id
        has_conflict = await self._booking_repo.check_time_conflict(team_member_id, booking_date, str(booking_time), service.duration)
        if has_conflict:
            raise ConflictException("Selected time slot is already booked")

        confirmation_code = await self._generate_confirmation_code()

        booking_data = {
            "customer_name": data["customer_name"],
            "customer_email": data["customer_email"],
            "customer_phone": data["customer_phone"],
            "service_id": service_id,
            "team_member_id": team_member_id,
            "booking_date": booking_date,
            "booking_time": booking_time,
            "duration": service.duration,
            "status": "confirmed",
            "confirmation_code": confirmation_code,
            "notes": data.get("notes"),
            "created_at": datetime.utcnow()
        }
        return await self._booking_repo.create(booking_data)

    async def get_booking(self, booking_id: UUID) -> Optional[Booking]:
        return await self._booking_repo.get(booking_id)

    async def cancel_booking(self, booking_id: UUID, phone: str, code: str) -> bool:
        booking = await self._booking_repo.get(booking_id)
        if not booking:
            raise NotFoundException(f"Booking {booking_id} not found")
        if booking.customer_phone != phone:
            return False
        if booking.confirmation_code != code:
            return False
        if booking.status == "cancelled":
            return False
        await self._booking_repo.update(booking, {"status": "cancelled"})
        return True

    async def get_upcoming_bookings(self, limit: int = 50) -> List[Booking]:
        today = date.today()
        try:
            end_date = today.replace(year=today.year + 1)
        except ValueError:
            end_date = today.replace(year=today.year + 1, day=28)
        bookings = await self._booking_repo.get_by_date_range(today, end_date)
        return bookings[:limit]

    async def get_filtered_bookings(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        team_member_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Booking]:
        if not start_date:
            start_date = date.today()
        if not end_date:
            try:
                end_date = start_date.replace(year=start_date.year + 1)
            except ValueError:
                end_date = start_date.replace(year=start_date.year + 1, day=28)

        bookings = await self._booking_repo.get_by_date_range(start_date, end_date)

        if team_member_id:
            bookings = [b for b in bookings if b.team_member_id == team_member_id]
        if status:
            bookings = [b for b in bookings if b.status == status]

        return bookings[:limit]

    async def update_booking_status(self, booking_id: UUID, status: str) -> Optional[Booking]:
        booking = await self._booking_repo.get(booking_id)
        if not booking:
            return None
        await self._booking_repo.update(booking, {"status": status})
        return await self._booking_repo.get(booking_id)
