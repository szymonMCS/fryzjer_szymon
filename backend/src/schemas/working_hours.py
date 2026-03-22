from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID


class WorkingHoursBase(BaseModel):
    day_of_week: str = Field(..., pattern=r"^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$")
    start_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    is_closed: bool = False


class WorkingHoursUpdate(BaseModel):
    start_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    is_closed: Optional[bool] = None


class WorkingHoursResponse(WorkingHoursBase):
    id: UUID
    
    class Config:
        from_attributes = True
