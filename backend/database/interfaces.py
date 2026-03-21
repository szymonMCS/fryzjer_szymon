from typing import TypeVar, Generic, Optional, List
from uuid import UUID


ModelType = TypeVar("ModelType")


class IRepository(Generic[ModelType]):
    async def get(self, id: UUID) -> Optional[ModelType]:
        raise NotImplementedError
    
    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        raise NotImplementedError
    
    async def create(self, obj_in: dict) -> ModelType:
        raise NotImplementedError
    
    async def update(self, db_obj: ModelType, obj_in: dict) -> ModelType:
        raise NotImplementedError
    
    async def delete(self, id: UUID) -> bool:
        raise NotImplementedError
    
    async def exists(self, id: UUID) -> bool:
        raise NotImplementedError
