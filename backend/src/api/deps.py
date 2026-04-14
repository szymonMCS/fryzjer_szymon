from typing import AsyncGenerator
from fastapi import Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.config import get_async_session
from database.repositories.working_hours_repository import WorkingHoursRepository
from database.repositories.service_repository import ServiceRepository
from database.repositories.team_repository import TeamRepository
from database.repositories.booking_repository import BookingRepository
from database.repositories.blacklist_repository import BlacklistRepository
from database.repositories.member_working_hours_repository import MemberWorkingHoursRepository
from src.services.admin import AdminAuthService
from src.services.service import ServiceService
from src.services.team import TeamService
from src.services.booking.service import BookingService
from src.services.rag.knowledge_service import KnowledgeRAGService
from src.services.rag.booking_agent import BookingAgentService
from src.core.exceptions import AuthenticationException


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_async_session():
        yield session


def get_admin_auth_service() -> AdminAuthService:
    return AdminAuthService()

def get_service_service(db: AsyncSession = Depends(get_db)) -> ServiceService:
    return ServiceService(ServiceRepository(db))

def get_team_service(db: AsyncSession = Depends(get_db)) -> TeamService:
    return TeamService(TeamRepository(db))

def get_booking_service(db: AsyncSession = Depends(get_db)) -> BookingService:
    return BookingService(
        booking_repo=BookingRepository(db),
        working_hours_repo=WorkingHoursRepository(db),
        service_repo=ServiceRepository(db),
        team_repo=TeamRepository(db),
        blacklist_repo=BlacklistRepository(db),
        member_working_hours_repo=MemberWorkingHoursRepository(db),
    )

def get_knowledge_service(db: AsyncSession = Depends(get_db)) -> KnowledgeRAGService:
    return KnowledgeRAGService(db)

def get_booking_agent_service(db: AsyncSession = Depends(get_db)) -> BookingAgentService:
    return BookingAgentService(db)

def get_working_hours_repo(db: AsyncSession = Depends(get_db)) -> WorkingHoursRepository:
    return WorkingHoursRepository(db)

def get_service_repo(db: AsyncSession = Depends(get_db)) -> ServiceRepository:
    return ServiceRepository(db)

def get_team_repo(db: AsyncSession = Depends(get_db)) -> TeamRepository:
    return TeamRepository(db)

async def get_current_admin(request: Request, auth_service: AdminAuthService = Depends(get_admin_auth_service)) -> bool:
    is_valid = await auth_service.verify_session(request)
    if not is_valid:
        raise AuthenticationException("Sesja wygasla lub jest nieprawidlowa")
    return True
