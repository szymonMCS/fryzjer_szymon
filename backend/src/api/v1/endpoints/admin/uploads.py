import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from src.api.deps import get_current_admin
from src.config import PROJECT_ROOT
from src.core.exceptions import ValidationException, NotFoundException

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = str(PROJECT_ROOT / "backend" / "database" / "member_photos")
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/team-member-photo")
async def upload_team_member_photo(file: UploadFile = File(...), admin: bool = Depends(get_current_admin)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationException("Dozwolone formaty: JPG, PNG, WEBP")

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    return {"filename": filename, "url": f"/photos/{filename}"}


@router.get("/photos/{filename}")
async def get_photo(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise NotFoundException("Nie znaleziono zdjęcia")
    return FileResponse(filepath)
