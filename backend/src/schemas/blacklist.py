from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class BlacklistedPhoneCreate(BaseModel):
    phone_number: Optional[str] = Field(None, min_length=6, max_length=50, description="Numer telefonu do zablokowania (9 cyfr)")
    email: Optional[str] = Field(None, max_length=255, description="Email do zablokowania")
    reason: Optional[str] = Field(None, max_length=500, description="Powód blokady (opcjonalnie)")
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        if not v:
            return v
        
        digits = ''.join(c for c in v if c.isdigit())
        
        if len(digits) == 11 and digits.startswith('48'):
            digits = digits[2:]
        if len(digits) != 9:
            raise ValueError(f'Numer telefonu musi mieć dokładnie 9 cyfr (podano: {len(digits)}). Podaj numer bez kierunkowego +48.')
        return digits
    
    @field_validator('email')
    @classmethod
    def validate_email_or_phone(cls, v, info):
        values = info.data
        phone = values.get('phone_number')
        email = v
        
        if not phone and not email:
            raise ValueError('Musisz podać numer telefonu lub email')
        if email:
            return email.lower().strip()
        return email


class BlacklistedPhoneResponse(BaseModel):
    id: UUID
    phone_number: Optional[str]
    email: Optional[str]
    reason: Optional[str]
    created_at: datetime
    created_by: Optional[str]
    
    class Config:
        from_attributes = True


class BlacklistCheckResponse(BaseModel):
    is_blacklisted: bool
    reason: Optional[str] = None
