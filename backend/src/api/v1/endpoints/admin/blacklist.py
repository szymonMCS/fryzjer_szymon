from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.config import get_async_session
from database.repositories.blacklist_repository import BlacklistRepository
from src.schemas.blacklist import BlacklistedPhoneCreate, BlacklistedPhoneResponse, BlacklistCheckResponse
from src.api.deps import get_current_admin

router = APIRouter(prefix="/blacklist", tags=["admin-blacklist"])


@router.get("/phones", response_model=List[BlacklistedPhoneResponse])
async def list_blacklisted(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_session),
    admin: bool = Depends(get_current_admin)
):
    repo = BlacklistRepository(db)
    return await repo.get_all_blacklisted(skip=skip, limit=limit)


@router.post("/phones", response_model=BlacklistedPhoneResponse, status_code=status.HTTP_201_CREATED)
async def add_to_blacklist(
    data: BlacklistedPhoneCreate,
    db: AsyncSession = Depends(get_async_session),
    admin: bool = Depends(get_current_admin)
):
    repo = BlacklistRepository(db)
    
    if data.phone_number:
        existing = await repo.get_by_phone_number(data.phone_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ten numer telefonu jest już na czarnej liście"
            )
    if data.email:
        existing = await repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ten email jest już na czarnej liście"
            )
    entry_data = {
        "reason": data.reason,
        "created_by": "admin"
    }
    
    if data.phone_number:
        entry_data["phone_number"] = data.phone_number
    if data.email:
        entry_data["email"] = data.email.lower().strip()
    
    blacklist_entry = await repo.create(entry_data)
    return blacklist_entry


@router.delete("/phones/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_blacklist(entry_id: UUID, db: AsyncSession = Depends(get_async_session), admin: bool = Depends(get_current_admin)):
    repo = BlacklistRepository(db)
    
    success = await repo.delete(entry_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono wpisu na czarnej liście"
        )

@router.get("/phones/check/{phone_number}", response_model=BlacklistCheckResponse)
async def check_phone_blacklist(phone_number: str, db: AsyncSession = Depends(get_async_session), admin: bool = Depends(get_current_admin)):
    repo = BlacklistRepository(db)
    entry = await repo.get_by_phone_number(phone_number)
    return BlacklistCheckResponse(
        is_blacklisted=entry is not None,
        reason=entry.reason if entry else None
    )

@router.get("/check-email/{email}", response_model=BlacklistCheckResponse)
async def check_email_blacklist(email: str, db: AsyncSession = Depends(get_async_session), admin: bool = Depends(get_current_admin)):
    repo = BlacklistRepository(db)
    entry = await repo.get_by_email(email)
    
    return BlacklistCheckResponse(
        is_blacklisted=entry is not None,
        reason=entry.reason if entry else None
    )
