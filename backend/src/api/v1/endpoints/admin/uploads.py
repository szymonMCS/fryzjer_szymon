import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from src.api.deps import get_current_admin

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = r"C:\Users\szymo\Desktop\projekty llm\fryzjer_szymon\backend\database\member_photos"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/team-member-photo")
async def upload_team_member_photo(file: UploadFile = File(...), admin: bool = Depends(get_current_admin)):
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Dozwolone formaty: JPG, PNG, WEBP")
    
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd zapisu pliku: {str(e)}")
    
    return {
        "filename": filename,
        "url": f"/photos/{filename}"
    }


@router.get("/photos/{filename}")
async def get_photo(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Nie znaleziono zdjęcia")
    return FileResponse(filepath)
