from fastapi import APIRouter, Response, Request, Depends
from src.services.admin import AdminAuthService
from src.schemas.admin import AdminLoginRequest, AdminLoginResponse
from src.api.deps import get_admin_auth_service, get_current_admin

router = APIRouter()

@router.post("/login", response_model=AdminLoginResponse)
async def login(data: AdminLoginRequest, response: Response, auth_service: AdminAuthService = Depends(get_admin_auth_service)):
    return await auth_service.authenticate(data.username, data.password, response)

@router.post("/logout", response_model=AdminLoginResponse)
async def logout(response: Response, auth_service: AdminAuthService = Depends(get_admin_auth_service)):
    return await auth_service.logout(response)

@router.get("/check")
async def check_auth(admin: bool = Depends(get_current_admin)):
    return {"authenticated": True}
