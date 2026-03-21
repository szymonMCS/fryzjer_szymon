from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from database.models import TeamMember


class ITeamService(ABC):
    @abstractmethod
    async def list_team(self) -> List[TeamMember]: ...
    @abstractmethod
    async def get_member(self, member_id: UUID) -> Optional[TeamMember]: ...
    @abstractmethod
    async def create_member(self, data: dict) -> TeamMember: ...
    @abstractmethod
    async def update_member(self, member_id: UUID, data: dict) -> Optional[TeamMember]: ...
    @abstractmethod
    async def delete_member(self, member_id: UUID) -> bool: ...
