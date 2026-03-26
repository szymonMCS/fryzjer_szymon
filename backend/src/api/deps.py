from typing import AsyncGenerator
from fastapi import Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.config import get_async_session
from database.repositories.working_hours_repository import WorkingHoursRepository
from database.repositories.service_repository import ServiceRepository
from database.repositories.team_repository import TeamRepository
from src.services.factories import ServiceFactory
from src.services.interfaces.admin import IAdminAuthService
from src.services.interfaces.service import IServiceService
from src.services.interfaces.team import ITeamService
from src.services.interfaces.booking import IBookingService
from src.core.exceptions import AuthenticationException


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_async_session():
        yield session


get_db_session = get_db


def get_service_factory(db: AsyncSession = Depends(get_db)) -> ServiceFactory:
    return ServiceFactory(db)

def get_admin_auth_service(factory: ServiceFactory = Depends(get_service_factory)) -> IAdminAuthService:
    return factory.create_admin_auth_service()

def get_service_service(factory: ServiceFactory = Depends(get_service_factory)) -> IServiceService:
    return factory.create_service_service()

def get_team_service(factory: ServiceFactory = Depends(get_service_factory)) -> ITeamService:
    return factory.create_team_service()

def get_booking_service(factory: ServiceFactory = Depends(get_service_factory)) -> IBookingService:
    return factory.create_booking_service()

def get_working_hours_repo(db: AsyncSession = Depends(get_db)) -> WorkingHoursRepository:
    return WorkingHoursRepository(db)

def get_service_repo(db: AsyncSession = Depends(get_db)) -> ServiceRepository:
    return ServiceRepository(db)

def get_team_repo(db: AsyncSession = Depends(get_db)) -> TeamRepository:
    return TeamRepository(db)

async def get_current_admin(request: Request, auth_service: IAdminAuthService = Depends(get_admin_auth_service)) -> bool:
    is_valid = await auth_service.verify_session(request)
    if not is_valid:
        raise AuthenticationException("Invalid or expired session")
    return True
