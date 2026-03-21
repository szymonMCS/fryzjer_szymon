from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from database.models import Service


class IServiceService(ABC):
    @abstractmethod
    async def list_services(self, category: str | None = None) -> List[Service]: ...
    @abstractmethod
    async def get_service(self, service_id: UUID) -> Optional[Service]: ...
    @abstractmethod
    async def create_service(self, data: dict) -> Service: ...
    @abstractmethod
    async def update_service(self, service_id: UUID, data: dict) -> Optional[Service]: ...
    @abstractmethod
    async def delete_service(self, service_id: UUID) -> bool: ...
