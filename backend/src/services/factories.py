from sqlalchemy.ext.asyncio import AsyncSession
from src.services.interfaces.admin import IAdminAuthService
from src.services.interfaces.service import IServiceService
from src.services.interfaces.team import ITeamService
from src.services.interfaces.booking import IBookingService
from src.services.admin import AdminAuthService
from src.services.service import ServiceService
from src.services.team import TeamService
from src.services.booking.service import BookingService
from database.repositories.service_repository import ServiceRepository
from database.repositories.team_repository import TeamRepository
from database.repositories.booking_repository import BookingRepository
from database.repositories.working_hours_repository import WorkingHoursRepository


class ServiceFactory:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def create_admin_auth_service(self) -> IAdminAuthService:
        return AdminAuthService()
    
    def create_service_service(self) -> IServiceService:
        repo = ServiceRepository(self.db)
        return ServiceService(repo)
    
    def create_team_service(self) -> ITeamService:
        repo = TeamRepository(self.db)
        return TeamService(repo)

    def create_booking_service(self) -> IBookingService:
        booking_repo = BookingRepository(self.db)
        working_hours_repo = WorkingHoursRepository(self.db)
        service_repo = ServiceRepository(self.db)
        team_repo = TeamRepository(self.db)
        return BookingService(booking_repo, working_hours_repo, service_repo, team_repo)
