from src.api.v1.endpoints.admin import router as admin_router
from src.api.v1.endpoints.services import router as services_router
from src.api.v1.endpoints.team import router as team_router
from src.api.v1.endpoints.working_hours import router as working_hours_router

__all__ = ["admin_router", "services_router", "team_router", "working_hours_router"]
