import tempfile
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from database.config import get_async_session
from database.repositories.knowledge_repository import KnowledgeRepository
from src.schemas.rag import (
    KnowledgeSyncStatus,
    KnowledgeUploadResponse,
    KnowledgeFileList,
    KnowledgeFile,
    KnowledgeFileContent,
    KnowledgeFileUpdate,
    KnowledgeSyncResponse
)
from src.api.deps import get_current_admin
from src.config import PROJECT_ROOT, settings
from src.services.rag.ingest_service import IngestService

router = APIRouter(prefix="/knowledge", tags=["admin-knowledge"])

DATA_DIR = PROJECT_ROOT / "backend" / "database" / "data"
ALLOWED_EXTS = {'.md', '.txt'}

def _validate_filename(filename: str) -> Path:
    if not filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Brak nazwy pliku")
    if '..' in filename or '/' in filename or '\\' in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowa nazwa pliku")
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Dozwolone rozszerzenia: {', '.join(ALLOWED_EXTS)}")
    file_path = DATA_DIR / filename
    try:
        file_path.relative_to(DATA_DIR)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowa ścieżka pliku")
    return file_path

@router.post("/upload", response_model=KnowledgeUploadResponse)
async def upload_knowledge_file(
    file: UploadFile = File(...),
    rebuild: bool = Query(default=False, description="Usuń istniejące chunki z tego samego źródła przed uploadem"),
    db: AsyncSession = Depends(get_async_session),
    admin: bool = Depends(get_current_admin)
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Brak nazwy pliku")
    try:
        file_path = _validate_filename(file.filename)
        ext = file_path.suffix.lower()
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix=ext) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            ingest_service = IngestService(db)
            chunks_count = await ingest_service.ingest_file(file_path=tmp_path, rebuild=rebuild)
            return KnowledgeUploadResponse(
                success=True,
                filename=file.filename,
                chunks_created=chunks_count,
                message=f"Plik '{file.filename}' został przetworzony. Utworzono {chunks_count} chunków."
            )
        finally:
            Path(tmp_path).unlink()
            
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd podczas przetwarzania pliku: {str(e)}"
        )

@router.get("/files", response_model=KnowledgeFileList)
async def list_knowledge_files(admin: bool = Depends(get_current_admin)):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    files = []
    for f in sorted(DATA_DIR.iterdir()):
        if f.is_file() and f.suffix.lower() in ALLOWED_EXTS:
            stat = f.stat()
            files.append(KnowledgeFile(
                name=f.name,
                size=stat.st_size,
                modified_at=datetime.fromtimestamp(stat.st_mtime).isoformat()
            ))
    return KnowledgeFileList(items=files, total=len(files))

@router.get("/files/{filename}", response_model=KnowledgeFileContent)
async def get_knowledge_file(filename: str, admin: bool = Depends(get_current_admin)):
    file_path = _validate_filename(filename)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plik nie istnieje")
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Błąd odczytu pliku: {str(e)}")
    return KnowledgeFileContent(name=filename, content=content)

@router.put("/files/{filename}")
async def update_knowledge_file(filename: str, data: KnowledgeFileUpdate, admin: bool = Depends(get_current_admin)):
    file_path = _validate_filename(filename)
    try:
        file_path.write_text(data.content, encoding="utf-8")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Błąd zapisu pliku: {str(e)}")
    return {"success": True, "message": f"Plik {filename} został zapisany"}

@router.delete("/files/{filename}")
async def delete_knowledge_file(filename: str, db: AsyncSession = Depends(get_async_session), admin: bool = Depends(get_current_admin)):
    file_path = _validate_filename(filename)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plik nie istnieje")
    try:
        file_path.unlink()
        repo = KnowledgeRepository(db)
        await repo.delete_by_source(filename)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Błąd usuwania pliku: {str(e)}")
    return {"success": True, "message": f"Plik {filename} został usunięty"}

def _validate_openai_key():
    key = (settings.OPENAI_API_KEY or "").strip()
    if not key or key.startswith("sk-your-") or key.startswith("sk-xxx"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Brak prawidłowego klucza OpenAI API. Uzupełnij OPENAI_API_KEY w pliku .env."
        )

@router.post("/files/{filename}/ingest", response_model=KnowledgeUploadResponse)
async def ingest_knowledge_file(
    filename: str,
    rebuild: bool = Query(default=True, description="Usuń istniejące chunki z tego samego źródła przed ingestem"),
    db: AsyncSession = Depends(get_async_session),
    admin: bool = Depends(get_current_admin)
):
    _validate_openai_key()
    file_path = _validate_filename(filename)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plik nie istnieje")
    try:
        ingest_service = IngestService(db)
        chunks_count = await ingest_service.ingest_file(file_path=file_path, rebuild=rebuild)
        return KnowledgeUploadResponse(
            success=True,
            filename=filename,
            chunks_created=chunks_count,
            message=f"Plik '{filename}' został przetworzony. Utworzono {chunks_count} chunków."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd podczas przetwarzania pliku: {str(e)}"
        )

@router.post("/sync", response_model=KnowledgeSyncResponse)
async def sync_knowledge_files(db: AsyncSession = Depends(get_async_session), admin: bool = Depends(get_current_admin)):
    _validate_openai_key()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    files = [f for f in DATA_DIR.iterdir() if f.is_file() and f.suffix.lower() in ALLOWED_EXTS]

    if not files:
        return KnowledgeSyncResponse(
            success=True,
            files_processed=0,
            chunks_created=0,
            message="Brak plików do synchronizacji w katalogu data."
        )

    try:
        repo = KnowledgeRepository(db)
        await repo.delete_all()
        ingest_service = IngestService(db)
        total_chunks = 0
        for file_path in files:
            chunks_count = await ingest_service.ingest_file(file_path=file_path, rebuild=False)
            total_chunks += chunks_count
        return KnowledgeSyncResponse(
            success=True,
            files_processed=len(files),
            chunks_created=total_chunks,
            message=f"Zsynchronizowano {len(files)} plików. Utworzono {total_chunks} chunków."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd podczas synchronizacji: {str(e)}"
        )

@router.get("/sync/status", response_model=KnowledgeSyncStatus)
async def get_sync_status(db: AsyncSession = Depends(get_async_session), admin: bool = Depends(get_current_admin)):
    try:
        repo = KnowledgeRepository(db)
        total_chunks = await repo.count()
        pending = await repo.get_without_embeddings(limit=100000)
        pending_changes = len(pending)
        
        return KnowledgeSyncStatus(
            last_sync=None,
            pending_changes=pending_changes,
            total_chunks=total_chunks,
            is_syncing=False
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Błąd podczas pobierania statusu: {str(e)}")
