from abc import ABC, abstractmethod
from typing import Optional, List, TypeVar, Generic
from datetime import date


T = TypeVar("T")


class IRepository(ABC, Generic[T]):
    @abstractmethod
    async def get(self, id: str) -> Optional[T]: ...
    
    @abstractmethod
    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[T]: ...
    
    @abstractmethod
    async def create(self, obj_in: dict) -> T: ...
    
    @abstractmethod
    async def update(self, db_obj: T, obj_in: dict) -> T: ...
    
    @abstractmethod
    async def delete(self, id: str) -> bool: ...
    
    @abstractmethod
    async def exists(self, id: str) -> bool: ...


class IServiceRepository(ABC):
    @abstractmethod
    async def get(self, id: str) -> Optional["Service"]: ...
    
    @abstractmethod
    async def get_active(self, skip: int = 0, limit: int = 100) -> List["Service"]: ...
    
    @abstractmethod
    async def get_by_category(self, category: str) -> List["Service"]: ...
    
    @abstractmethod
    async def get_by_team_member(self, team_member_id: str) -> List["Service"]: ...
    
    @abstractmethod
    async def create(self, obj_in: dict) -> "Service": ...
    
    @abstractmethod
    async def update(self, db_obj: "Service", obj_in: dict) -> "Service": ...
    
    @abstractmethod
    async def delete(self, id: str) -> bool: ...
    
    @abstractmethod
    async def exists(self, id: str) -> bool: ...


class ITeamMemberRepository(ABC):
    @abstractmethod
    async def get(self, id: str) -> Optional["TeamMember"]: ...
    
    @abstractmethod
    async def get_with_services(self, id: str) -> Optional["TeamMember"]: ...
    
    @abstractmethod
    async def get_active(self, skip: int = 0, limit: int = 100) -> List["TeamMember"]: ...
    
    @abstractmethod
    async def get_active_with_services(self, skip: int = 0, limit: int = 100) -> List["TeamMember"]: ...
    
    @abstractmethod
    async def assign_service(self, team_member_id: str, service_id: str) -> None: ...
    
    @abstractmethod
    async def remove_service(self, team_member_id: str, service_id: str) -> None: ...
    
    @abstractmethod
    async def create(self, obj_in: dict) -> "TeamMember": ...
    
    @abstractmethod
    async def update(self, db_obj: "TeamMember", obj_in: dict) -> "TeamMember": ...
    
    @abstractmethod
    async def delete(self, id: str) -> bool: ...
    
    @abstractmethod
    async def exists(self, id: str) -> bool: ...


class IBookingRepository(ABC):
    @abstractmethod
    async def get(self, id: str) -> Optional["Booking"]: ...
    
    @abstractmethod
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> List["Booking"]: ...
    
    @abstractmethod
    async def get_by_date(self, date: date) -> List["Booking"]: ...
    
    @abstractmethod
    async def get_by_date_and_time(
        self, 
        date: date, 
        time: str,
        exclude_id: Optional[str] = None
    ) -> Optional["Booking"]: ...
    
    @abstractmethod
    async def create(self, obj_in: dict) -> "Booking": ...
    
    @abstractmethod
    async def update(self, db_obj: "Booking", obj_in: dict) -> "Booking": ...
    
    @abstractmethod
    async def update_status(self, booking_id: str, status: str) -> "Booking": ...
    
    @abstractmethod
    async def cancel(self, booking_id: str, reason: Optional[str] = None) -> "Booking": ...
    
    @abstractmethod
    async def delete(self, id: str) -> bool: ...
    
    @abstractmethod
    async def exists(self, id: str) -> bool: ...
    
    @abstractmethod
    async def count_by_date_and_status(self, date: date, statuses: List[str]) -> int: ...
    
    @abstractmethod
    async def is_slot_available(
        self, 
        date: date, 
        time: str, 
        exclude_booking_id: Optional[str] = None
    ) -> bool: ...


class IWorkingHoursRepository(ABC):
    @abstractmethod
    async def get(self, id: str) -> Optional["WorkingHours"]: ...
    
    @abstractmethod
    async def get_by_team_member(self, team_member_id: str) -> List["WorkingHours"]: ...
    
    @abstractmethod
    async def get_default_hours(self) -> List["WorkingHours"]: ...
    
    @abstractmethod
    async def get_by_date(self, target_date: date) -> List["WorkingHours"]: ...
    
    @abstractmethod
    async def get_vacations(self, team_member_id: Optional[str] = None) -> List["WorkingHours"]: ...
    
    @abstractmethod
    async def add_vacation(self, team_member_id: str, vacation_date: date, reason: Optional[str] = None) -> "WorkingHours": ...
    
    @abstractmethod
    async def create(self, obj_in: dict) -> "WorkingHours": ...
    
    @abstractmethod
    async def update(self, db_obj: "WorkingHours", obj_in: dict) -> "WorkingHours": ...
    
    @abstractmethod
    async def delete(self, id: str) -> bool: ...


class IKnowledgeChunkRepository(ABC):
    @abstractmethod
    async def get(self, id: str) -> Optional["KnowledgeChunk"]: ...
    
    @abstractmethod
    async def get_by_category(self, category: str) -> List["KnowledgeChunk"]: ...
    
    @abstractmethod
    async def get_active(self) -> List["KnowledgeChunk"]: ...
    
    @abstractmethod
    async def create(self, obj_in: dict) -> "KnowledgeChunk": ...
    
    @abstractmethod
    async def update(self, db_obj: "KnowledgeChunk", obj_in: dict) -> "KnowledgeChunk": ...
    
    @abstractmethod
    async def delete(self, id: str) -> bool: ...


from database.models import (
    Service, TeamMember, Booking, WorkingHours, KnowledgeChunk
)
