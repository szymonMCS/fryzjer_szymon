from uuid import UUID
from typing import Optional, List
from database.models import TeamMember
from database.repositories.team_repository import TeamRepository
from src.services.interfaces.team import ITeamService
from src.core.exceptions import NotFoundException


class TeamService(ITeamService):
    def __init__(self, repository: TeamRepository):
        self._repo = repository
    
    async def list_team(self) -> List[TeamMember]:
        return await self._repo.get_active()
    
    async def get_member(self, member_id: UUID) -> Optional[TeamMember]:
        return await self._repo.get(member_id)
    
    async def create_member(self, data: dict) -> TeamMember:
        return await self._repo.create(data)
    
    async def update_member(self, member_id: UUID, data: dict) -> Optional[TeamMember]:
        member = await self._repo.get(member_id)
        if not member:
            raise NotFoundException(f"TeamMember with id {member_id} not found")
        return await self._repo.update(member, data)
    
    async def delete_member(self, member_id: UUID) -> bool:
        return await self._repo.delete(member_id)
