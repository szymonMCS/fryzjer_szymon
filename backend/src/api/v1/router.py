from fastapi import APIRouter
from src.api.v1.endpoints import admin_router, services_router, team_router

api_router = APIRouter()

api_router.include_router(admin_router)
api_router.include_router(services_router)
api_router.include_router(team_router)
