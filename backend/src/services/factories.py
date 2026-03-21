from sqlalchemy.ext.asyncio import AsyncSession
from src.services.interfaces.admin import IAdminAuthService
from src.services.admin import AdminAuthService


class ServiceFactory:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def create_admin_auth_service(self) -> IAdminAuthService:
        return AdminAuthService()
