from fastapi import APIRouter
from src.api.v1.endpoints.admin import auth, blacklist, member_working_hours, uploads, working_hours

router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(auth.router)
router.include_router(blacklist.router)
router.include_router(member_working_hours.router)
router.include_router(uploads.router)
router.include_router(working_hours.router)
