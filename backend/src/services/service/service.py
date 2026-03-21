from uuid import UUID
from typing import Optional, List
from database.models import Service
from database.repositories.service_repository import ServiceRepository
from src.services.interfaces.service import IServiceService


class ServiceService(IServiceService):
    def __init__(self, repository: ServiceRepository):
        self._repo = repository
    
    async def list_services(self, category: str | None = None) -> List[Service]:
        if category:
            return await self._repo.get_by_category(category)
        return await self._repo.get_active()
    
    async def get_service(self, service_id: UUID) -> Optional[Service]:
        return await self._repo.get(service_id)
    
    async def create_service(self, data: dict) -> Service:
        return await self._repo.create(data)
    
    async def update_service(self, service_id: UUID, data: dict) -> Optional[Service]:
        service = await self._repo.get(service_id)
        return await self._repo.update(service, data)
    
    async def delete_service(self, service_id: UUID) -> bool:
        return await self._repo.delete(service_id)
