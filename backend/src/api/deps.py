from fastapi import Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.config import AsyncSessionLocal
from src.services.factories import ServiceFactory
from src.services.interfaces.admin import IAdminAuthService


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

get_db_session = get_db

def get_service_factory(db: AsyncSession = Depends(get_db)) -> ServiceFactory:
    return ServiceFactory(db)

def get_admin_auth_service(factory: ServiceFactory = Depends(get_service_factory)) -> IAdminAuthService:
    return factory.create_admin_auth_service()

async def get_current_admin(request: Request, auth_service: IAdminAuthService = Depends(get_admin_auth_service)) -> bool:
    is_valid = await auth_service.verify_session(request)
    if not is_valid:
        raise AuthenticationException("Invalid or expired session")
    return True
