from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime


class BookingCreateRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_email: EmailStr = Field(..., max_length=255)
    customer_phone: str = Field(..., min_length=6, max_length=50)
    service_id: UUID
    team_member_id: Optional[UUID] = None
    booking_date: date
    booking_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    notes: Optional[str] = Field(None, max_length=500)


class BookingCancelRequest(BaseModel):
    phone: str = Field(..., min_length=6, max_length=50)
    confirmation_code: str = Field(..., min_length=6, max_length=6)


class AvailabilityRequest(BaseModel):
    date: date
    service_id: UUID
    team_member_id: Optional[UUID] = None


class AvailabilitySlot(BaseModel):
    time: str
    available_team_members: List[UUID]


class AvailabilityResponse(BaseModel):
    date: date
    service_id: UUID
    slots: List[AvailabilitySlot]


class ServiceInfo(BaseModel):
    id: UUID
    name: str
    duration: int
    price: int

    class Config:
        from_attributes = True


class TeamMemberInfo(BaseModel):
    id: UUID
    name: str
    role: str

    class Config:
        from_attributes = True


class BookingResponse(BaseModel):
    id: UUID
    customer_name: str
    customer_email: str
    customer_phone: str
    service: ServiceInfo
    team_member: Optional[TeamMemberInfo]
    booking_date: date
    booking_time: str
    duration: int
    status: str
    confirmation_code: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    bookings: List[BookingResponse]
    total: int
