from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date, time
from typing import Optional


class MemberWorkingHoursBase(BaseModel):
    team_member_id: UUID
    work_date: date
    is_working: bool = True
    start_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    reason: Optional[str] = Field(None, max_length=100)


class MemberWorkingHoursCreate(MemberWorkingHoursBase):
    pass


class MemberWorkingHoursUpdate(BaseModel):
    is_working: Optional[bool] = None
    start_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    reason: Optional[str] = Field(None, max_length=100)


class MemberWorkingHoursResponse(BaseModel):
    id: UUID
    team_member_id: UUID
    work_date: date
    is_working: bool
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class MemberWorkingHoursWithName(MemberWorkingHoursResponse):
    team_member_name: str
