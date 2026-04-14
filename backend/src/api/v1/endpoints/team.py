from uuid import UUID
from fastapi import APIRouter, Depends
from src.services.team import TeamService
from src.schemas.team import TeamMemberResponse, TeamMemberCreate, TeamMemberUpdate
from src.api.deps import get_team_service, get_current_admin
from src.core.exceptions import NotFoundException

router = APIRouter(prefix="/team", tags=["team"])

@router.get("", response_model=list[TeamMemberResponse])
async def list_team(team: TeamService = Depends(get_team_service)):
    return await team.list_team()

@router.get("/{member_id}", response_model=TeamMemberResponse)
async def get_member(member_id: UUID, team: TeamService = Depends(get_team_service)):
    result = await team.get_member(member_id)
    if not result:
        raise NotFoundException(f"Nie znaleziono pracownika {member_id}")
    return result

@router.post("", response_model=TeamMemberResponse, status_code=201)
async def create_member(data: TeamMemberCreate, team: TeamService = Depends(get_team_service), admin: bool = Depends(get_current_admin)):
    return await team.create_member(data.model_dump())

@router.patch("/{member_id}", response_model=TeamMemberResponse)
async def update_member(member_id: UUID, data: TeamMemberUpdate, team: TeamService = Depends(get_team_service), admin: bool = Depends(get_current_admin)):
    result = await team.update_member(member_id, data.model_dump(exclude_unset=True))
    return result

@router.delete("/{member_id}", status_code=204)
async def delete_member(member_id: UUID, team: TeamService = Depends(get_team_service), admin: bool = Depends(get_current_admin)):
    await team.delete_member(member_id)
    return None
