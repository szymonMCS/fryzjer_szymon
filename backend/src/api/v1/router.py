from fastapi import APIRouter
from src.api.v1.endpoints import admin_router

api_router = APIRouter()

api_router.include_router(admin_router)