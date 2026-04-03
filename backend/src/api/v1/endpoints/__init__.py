from src.api.v1.endpoints.admin import router as admin_router
from src.api.v1.endpoints.services import router as services_router
from src.api.v1.endpoints.team import router as team_router
from src.api.v1.endpoints.bookings import router as bookings_router
from src.api.v1.endpoints.rag import router as rag_router

__all__ = ["admin_router", "services_router", "team_router", "bookings_router", "rag_router"]
