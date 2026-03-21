from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID


class ServiceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    price: int = Field(..., gt=0)
    duration: int = Field(..., gt=0)
    category: str = Field(default="haircut")
    is_active: bool = True
    display_order: int = Field(default=0)


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    price: Optional[int] = Field(None, gt=0)
    duration: Optional[int] = Field(None, gt=0)
    category: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ServiceResponse(ServiceBase):
    id: UUID
    
    class Config:
        from_attributes = True
