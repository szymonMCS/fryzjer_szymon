from fastapi import APIRouter
from src.api.v1.endpoints.admin import auth

router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(auth.router)
