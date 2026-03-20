from typing import Optional, List
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from database.models import (
    Service, TeamMember, WorkingHours, 
    Booking, BookingStatus, KnowledgeChunk,
    team_member_services
)


class AdminRepository:
    def __init__(self, db: AsyncSession):
        self._db = db
    
    async def get_service(self, id: str) -> Optional[Service]:
        result = await self._db.execute(select(Service).where(Service.id == id))
        return result.scalar_one_or_none()
    
    async def get_services(self, active_only: bool = False) -> List[Service]:
        query = select(Service).order_by(Service.display_order, Service.name)
        if active_only:
            query = query.where(Service.is_active == True)
        result = await self._db.execute(query)
        return list(result.scalars().all())
    
    async def create_service(self, data: dict) -> Service:
        import uuid
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        service = Service(**data)
        self._db.add(service)
        await self._db.commit()
        await self._db.refresh(service)
        return service
    
    async def update_service(self, id: str, data: dict) -> Optional[Service]:
        service = await self.get_service(id)
        if not service:
            return None
        for field, value in data.items():
            setattr(service, field, value)
        await self._db.commit()
        await self._db.refresh(service)
        return service
    
    async def delete_service(self, id: str) -> bool:
        service = await self.get_service(id)
        if not service:
            return False
        service.is_active = False
        await self._db.commit()
        return True
    
    async def get_team_member(self, id: str) -> Optional[TeamMember]:
        result = await self._db.execute(
            select(TeamMember)
            .where(TeamMember.id == id)
            .options(selectinload(TeamMember.services))
        )
        return result.scalar_one_or_none()
    
    async def get_team_members(self, active_only: bool = False) -> List[TeamMember]:
        query = select(TeamMember).order_by(TeamMember.display_order, TeamMember.name)
        if active_only:
            query = query.where(TeamMember.is_active == True)
        result = await self._db.execute(query)
        return list(result.scalars().all())
    
    async def get_team_members_with_services(self) -> List[TeamMember]:
        result = await self._db.execute(
            select(TeamMember)
            .where(TeamMember.is_active == True)
            .order_by(TeamMember.display_order)
            .options(selectinload(TeamMember.services))
        )
        return list(result.scalars().all())
    
    async def create_team_member(self, data: dict) -> TeamMember:
        import uuid
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        member = TeamMember(**data)
        self._db.add(member)
        await self._db.commit()
        await self._db.refresh(member)
        return member
    
    async def update_team_member(self, id: str, data: dict) -> Optional[TeamMember]:
        member = await self.get_team_member(id)
        if not member:
            return None
        for field, value in data.items():
            setattr(member, field, value)
        await self._db.commit()
        await self._db.refresh(member)
        return member
    
    async def delete_team_member(self, id: str) -> bool:
        member = await self.get_team_member(id)
        if not member:
            return False
        member.is_active = False
        await self._db.commit()
        return True
    
    async def assign_service_to_member(self, member_id: str, service_id: str) -> bool:
        member = await self.get_team_member(member_id)
        service = await self.get_service(service_id)
        if not member or not service:
            return False
        if service not in member.services:
            member.services.append(service)
            await self._db.commit()
        return True
    
    async def remove_service_from_member(self, member_id: str, service_id: str) -> bool:
        member = await self.get_team_member(member_id)
        if not member:
            return False
        member.services = [s for s in member.services if s.id != service_id]
        await self._db.commit()
        return True
    
    async def get_working_hours(self, member_id: Optional[str] = None) -> List[WorkingHours]:
        query = select(WorkingHours)
        if member_id:
            query = query.where(WorkingHours.team_member_id == member_id)
        else:
            query = query.where(WorkingHours.team_member_id == None)
        result = await self._db.execute(query.order_by(WorkingHours.day_of_week))
        return list(result.scalars().all())
    
    async def get_working_hours_by_date(self, target_date: date) -> List[WorkingHours]:
        result = await self._db.execute(
            select(WorkingHours).where(WorkingHours.special_date == target_date)
        )
        return list(result.scalars().all())
    
    async def create_working_hours(self, data: dict) -> WorkingHours:
        import uuid
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        wh = WorkingHours(**data)
        self._db.add(wh)
        await self._db.commit()
        await self._db.refresh(wh)
        return wh
    
    async def update_working_hours(self, id: str, data: dict) -> Optional[WorkingHours]:
        result = await self._db.execute(select(WorkingHours).where(WorkingHours.id == id))
        wh = result.scalar_one_or_none()
        if not wh:
            return None
        for field, value in data.items():
            setattr(wh, field, value)
        await self._db.commit()
        await self._db.refresh(wh)
        return wh
    
    async def delete_working_hours(self, id: str) -> bool:
        result = await self._db.execute(select(WorkingHours).where(WorkingHours.id == id))
        wh = result.scalar_one_or_none()
        if not wh:
            return False
        await self._db.delete(wh)
        await self._db.commit()
        return True
    
    async def add_vacation(self, member_id: str, vacation_date: date) -> WorkingHours:
        import uuid
        vacation = WorkingHours(
            id=str(uuid.uuid4()),
            team_member_id=member_id,
            special_date=vacation_date,
            is_closed=True,
            is_vacation=True,
        )
        self._db.add(vacation)
        await self._db.commit()
        await self._db.refresh(vacation)
        return vacation
    
    async def get_vacations(self, member_id: Optional[str] = None) -> List[WorkingHours]:
        query = select(WorkingHours).where(WorkingHours.is_vacation == True)
        if member_id:
            query = query.where(WorkingHours.team_member_id == member_id)
        result = await self._db.execute(query)
        return list(result.scalars().all())
    
    async def get_bookings(
        self, 
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        member_id: Optional[str] = None
    ) -> List[Booking]:
        query = select(Booking)
        if status:
            query = query.where(Booking.status == status)
        if date_from:
            query = query.where(Booking.date >= date_from)
        if date_to:
            query = query.where(Booking.date <= date_to)
        if member_id:
            query = query.where(Booking.team_member_id == member_id)
        result = await self._db.execute(query.order_by(Booking.date.desc(), Booking.time.desc()))
        return list(result.scalars().all())
    
    async def get_booking(self, id: str) -> Optional[Booking]:
        result = await self._db.execute(select(Booking).where(Booking.id == id))
        return result.scalar_one_or_none()
    
    async def update_booking_status(self, id: str, status: str) -> Optional[Booking]:
        from datetime import datetime, timezone
        booking = await self.get_booking(id)
        if not booking:
            return None
        booking.status = status
        if status == BookingStatus.CANCELLED.value:
            booking.cancelled_at = datetime.now(timezone.utc)
        await self._db.commit()
        await self._db.refresh(booking)
        return booking
    
    async def delete_booking(self, id: str) -> bool:
        booking = await self.get_booking(id)
        if not booking:
            return False
        await self._db.delete(booking)
        await self._db.commit()
        return True
    
    async def get_knowledge_chunks(self, category: Optional[str] = None) -> List[KnowledgeChunk]:
        query = select(KnowledgeChunk).where(KnowledgeChunk.is_active == True)
        if category:
            query = query.where(KnowledgeChunk.category == category)
        result = await self._db.execute(query.order_by(KnowledgeChunk.category, KnowledgeChunk.chunk_index))
        return list(result.scalars().all())
    
    async def get_knowledge_chunk(self, id: str) -> Optional[KnowledgeChunk]:
        result = await self._db.execute(select(KnowledgeChunk).where(KnowledgeChunk.id == id))
        return result.scalar_one_or_none()
    
    async def create_knowledge_chunk(self, data: dict) -> KnowledgeChunk:
        import uuid
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        chunk = KnowledgeChunk(**data)
        self._db.add(chunk)
        await self._db.commit()
        await self._db.refresh(chunk)
        return chunk
    
    async def update_knowledge_chunk(self, id: str, data: dict) -> Optional[KnowledgeChunk]:
        chunk = await self.get_knowledge_chunk(id)
        if not chunk:
            return None
        for field, value in data.items():
            setattr(chunk, field, value)
        await self._db.commit()
        await self._db.refresh(chunk)
        return chunk
    
    async def delete_knowledge_chunk(self, id: str) -> bool:
        chunk = await self.get_knowledge_chunk(id)
        if not chunk:
            return False
        chunk.is_active = False
        await self._db.commit()
        return True
