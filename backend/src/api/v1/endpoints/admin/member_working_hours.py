from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.config import get_async_session
from database.repositories.member_working_hours_repository import MemberWorkingHoursRepository
from database.repositories.team_repository import TeamRepository
from src.schemas.member_working_hours import (
    MemberWorkingHoursCreate,
    MemberWorkingHoursUpdate,
    MemberWorkingHoursResponse,
    MemberWorkingHoursWithName
)
from src.api.deps import get_current_admin
from src.core.exceptions import NotFoundException
from datetime import datetime

router = APIRouter(prefix="/member-working-hours", tags=["member-working-hours"])


@router.get("", response_model=List[MemberWorkingHoursWithName])
async def list_member_working_hours(
    team_member_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_async_session),
    admin: bool = Depends(get_current_admin)
):
    repo = MemberWorkingHoursRepository(db)
    team_repo = TeamRepository(db)
    
    if team_member_id:
        exceptions = await repo.get_by_member(team_member_id, start_date, end_date)
    else:
        if not start_date:
            start_date = date.today()
        if not end_date:
            from datetime import timedelta
            end_date = start_date + timedelta(days=30)
        exceptions = await repo.get_all_in_date_range(start_date, end_date)
    
    result = []
    for exc in exceptions:
        member = await team_repo.get(exc.team_member_id)
        result.append(MemberWorkingHoursWithName(
            id=exc.id,
            team_member_id=exc.team_member_id,
            team_member_name=member.name if member else "Unknown",
            work_date=exc.work_date,
            is_working=exc.is_working,
            start_time=exc.start_time.strftime("%H:%M") if exc.start_time else None,
            end_time=exc.end_time.strftime("%H:%M") if exc.end_time else None,
            reason=exc.reason
        ))
    
    return result


@router.post("", response_model=MemberWorkingHoursResponse, status_code=status.HTTP_201_CREATED)
async def create_member_working_hours(
    data: MemberWorkingHoursCreate,
    db: AsyncSession = Depends(get_async_session),
    admin: bool = Depends(get_current_admin)
):
    repo = MemberWorkingHoursRepository(db)
    existing = await repo.get_by_member_and_date(data.team_member_id, data.work_date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Juz istnieje wpis dla tego pracownika w tym dniu. Uzyj PUT do aktualizacji."
        )
    from datetime import time as dt_time
    start_time = dt_time.fromisoformat(data.start_time) if data.start_time else None
    end_time = dt_time.fromisoformat(data.end_time) if data.end_time else None
    
    exception = await repo.create({
        "team_member_id": data.team_member_id,
        "work_date": data.work_date,
        "is_working": data.is_working,
        "start_time": start_time,
        "end_time": end_time,
        "reason": data.reason
    })
    
    return MemberWorkingHoursResponse(
        id=exception.id,
        team_member_id=exception.team_member_id,
        work_date=exception.work_date,
        is_working=exception.is_working,
        start_time=exception.start_time.strftime("%H:%M") if exception.start_time else None,
        end_time=exception.end_time.strftime("%H:%M") if exception.end_time else None,
        reason=exception.reason
    )


@router.patch("/{exception_id}", response_model=MemberWorkingHoursResponse)
async def update_member_working_hours(
    exception_id: UUID,
    data: MemberWorkingHoursUpdate,
    db: AsyncSession = Depends(get_async_session),
    admin: bool = Depends(get_current_admin)
):
    repo = MemberWorkingHoursRepository(db)
    
    exception = await repo.get(exception_id)
    if not exception:
        raise NotFoundException("Nie znaleziono wpisu")
    
    update_data = {}
    if data.is_working is not None:
        update_data["is_working"] = data.is_working
    if data.start_time is not None:
        from datetime import time as dt_time
        update_data["start_time"] = dt_time.fromisoformat(data.start_time)
    if data.end_time is not None:
        from datetime import time as dt_time
        update_data["end_time"] = dt_time.fromisoformat(data.end_time)
    if data.reason is not None:
        update_data["reason"] = data.reason
    
    updated = await repo.update(exception, update_data)

    return MemberWorkingHoursResponse(
        id=updated.id,
        team_member_id=updated.team_member_id,
        work_date=updated.work_date,
        is_working=updated.is_working,
        start_time=updated.start_time.strftime("%H:%M") if updated.start_time else None,
        end_time=updated.end_time.strftime("%H:%M") if updated.end_time else None,
        reason=updated.reason
    )

@router.delete("/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member_working_hours(exception_id: UUID, db: AsyncSession = Depends(get_async_session), admin: bool = Depends(get_current_admin)):
    repo = MemberWorkingHoursRepository(db)
    await repo.delete(exception_id)
    return None

@router.get("/member/{team_member_id}/date/{work_date}", response_model=MemberWorkingHoursResponse)
async def get_member_working_hours_for_date(team_member_id: UUID, work_date: date, db: AsyncSession = Depends(get_async_session)):
    repo = MemberWorkingHoursRepository(db)
    exception = await repo.get_by_member_and_date(team_member_id, work_date)
    
    if not exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brak wyjatkow dla tego dnia")
    return MemberWorkingHoursResponse(
        id=exception.id,
        team_member_id=exception.team_member_id,
        work_date=exception.work_date,
        is_working=exception.is_working,
        start_time=exception.start_time.strftime("%H:%M") if exception.start_time else None,
        end_time=exception.end_time.strftime("%H:%M") if exception.end_time else None,
        reason=exception.reason
    )
