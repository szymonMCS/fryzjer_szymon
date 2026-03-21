from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from src.services.interfaces.service import IServiceService
from src.schemas.service import ServiceResponse, ServiceCreate, ServiceUpdate
from src.api.deps import get_service_service, get_current_admin
from src.core.exceptions import NotFoundException

router = APIRouter(prefix="/services", tags=["services"])

@router.get("", response_model=list[ServiceResponse])
async def list_services(
    category: Optional[str] = Query(None),
    service: IServiceService = Depends(get_service_service)
):
    return await service.list_services(category)

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: UUID,
    service: IServiceService = Depends(get_service_service)
):
    result = await service.get_service(service_id)
    if not result:
        raise NotFoundException(f"Service {service_id} not found")
    return result

@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(
    data: ServiceCreate,
    service: IServiceService = Depends(get_service_service),
    admin: bool = Depends(get_current_admin)
):
    return await service.create_service(data.model_dump())

@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: UUID,
    data: ServiceUpdate,
    service: IServiceService = Depends(get_service_service),
    admin: bool = Depends(get_current_admin)
):
    result = await service.update_service(service_id, data.model_dump(exclude_unset=True))
    return result

@router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: UUID,
    service: IServiceService = Depends(get_service_service),
    admin: bool = Depends(get_current_admin)
):
    await service.delete_service(service_id)
    return None
