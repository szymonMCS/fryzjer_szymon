from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from database.repositories.working_hours_repository import WorkingHoursRepository
from src.schemas.working_hours import WorkingHoursResponse, WorkingHoursUpdate
from src.api.deps import get_working_hours_repo, get_current_admin
from src.core.exceptions import NotFoundException

router = APIRouter(prefix="/working-hours", tags=["working-hours"])


@router.get("", response_model=List[WorkingHoursResponse])
async def get_schedule(repo: WorkingHoursRepository = Depends(get_working_hours_repo)):
    return await repo.get_week_schedule()

@router.get("/{day}", response_model=WorkingHoursResponse)
async def get_day(day: str, repo: WorkingHoursRepository = Depends(get_working_hours_repo)):
    result = await repo.get_by_day(day)
    if not result:
        raise NotFoundException(f"Working hours for {day} not found")
    return result

@router.put("/{day}", response_model=WorkingHoursResponse)
async def update_hours(
    day: str,
    data: WorkingHoursUpdate,
    repo: WorkingHoursRepository = Depends(get_working_hours_repo),
    admin: bool = Depends(get_current_admin)
):
    working_hours = await repo.get_by_day(day)
    if not working_hours:
        raise NotFoundException(f"Working hours for {day} not found")
    
    update_data = data.model_dump(exclude_unset=True)
    return await repo.update(working_hours, update_data)
