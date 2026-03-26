from uuid import UUID
from typing import Optional, List
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import BlacklistedPhone
from database.repositories.base import BaseRepository


class BlacklistRepository(BaseRepository[BlacklistedPhone]):
    def __init__(self, db: AsyncSession):
        super().__init__(BlacklistedPhone, db)
    
    def _normalize_phone(self, phone_number: str) -> str:
        return ''.join(c for c in phone_number if c.isdigit())
    
    def _get_phone_variants(self, phone_number: str) -> list[str]:
        normalized = self._normalize_phone(phone_number)
        variants = [normalized]
        if normalized.startswith('48') and len(normalized) == 11:
            variants.append(normalized[2:])
        elif len(normalized) == 9:
            variants.append('48' + normalized)
        return variants
    
    async def get_by_phone_number(self, phone_number: str) -> Optional[BlacklistedPhone]:
        variants = self._get_phone_variants(phone_number)
        result = await self._db.execute(select(self._model).where(self._model.phone_number.in_(variants)))
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[BlacklistedPhone]:
        normalized = email.lower().strip()
        result = await self._db.execute(select(self._model).where(self._model.email == normalized))
        return result.scalar_one_or_none()
    
    async def is_blacklisted(self, phone_number: Optional[str] = None, email: Optional[str] = None) -> bool:
        if phone_number:
            entry = await self.get_by_phone_number(phone_number)
            if entry:
                return True
        if email:
            entry = await self.get_by_email(email)
            if entry:
                return True
        return False
    
    async def get_all_blacklisted(self, skip: int = 0, limit: int = 100) -> List[BlacklistedPhone]:
        result = await self._db.execute(select(self._model).order_by(self._model.created_at.desc()).offset(skip).limit(limit))
        return list(result.scalars().all())
