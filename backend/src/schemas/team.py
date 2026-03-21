from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID


class TeamMemberBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., min_length=2, max_length=100)
    bio: Optional[str] = None
    image_url: Optional[str] = None
    specialties: List[str] = Field(default_factory=list)
    is_active: bool = True
    display_order: int = Field(default=0)


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = None
    image_url: Optional[str] = None
    specialties: Optional[List[str]] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class TeamMemberResponse(TeamMemberBase):
    id: UUID
    
    class Config:
        from_attributes = True
