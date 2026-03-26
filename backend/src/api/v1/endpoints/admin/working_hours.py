from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.config import get_async_session
from database.repositories.working_hours_repository import WorkingHoursRepository
from database.models import WorkingHours
from src.schemas.working_hours import WorkingHoursResponse, WorkingHoursUpdate
from src.api.deps import get_working_hours_repo, get_current_admin, get_db
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


@router.post("/init", status_code=status.HTTP_201_CREATED)
async def init_default_working_hours(db: AsyncSession = Depends(get_db), admin: bool = Depends(get_current_admin)):
    default_hours = [
        {"day_of_week": "monday", "start_time": "09:00", "end_time": "18:00", "is_closed": False},
        {"day_of_week": "tuesday", "start_time": "09:00", "end_time": "18:00", "is_closed": False},
        {"day_of_week": "wednesday", "start_time": "09:00", "end_time": "18:00", "is_closed": False},
        {"day_of_week": "thursday", "start_time": "09:00", "end_time": "18:00", "is_closed": False},
        {"day_of_week": "friday", "start_time": "09:00", "end_time": "18:00", "is_closed": False},
        {"day_of_week": "saturday", "start_time": "09:00", "end_time": "14:00", "is_closed": False},
        {"day_of_week": "sunday", "start_time": None, "end_time": None, "is_closed": True},
    ]
    
    created = []
    for wh in default_hours:
        existing = await db.execute(select(WorkingHours).where(WorkingHours.day_of_week == wh["day_of_week"]))
        if existing.scalar_one_or_none() is None:
            from datetime import time
            new_wh = WorkingHours(
                day_of_week=wh["day_of_week"],
                start_time=time.fromisoformat(wh["start_time"]) if wh["start_time"] else None,
                end_time=time.fromisoformat(wh["end_time"]) if wh["end_time"] else None,
                is_closed=wh["is_closed"],
                team_member_id=None
            )
            db.add(new_wh)
            created.append(wh["day_of_week"])
    await db.commit()
    return {"message": f"Initialized working hours for: {', '.join(created) if created else 'none (already exist)'}", "days": created}
