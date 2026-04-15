import os
import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from database.config import init_db, close_db, AsyncSessionLocal
from src.core.exceptions import DomainException

logger = logging.getLogger(__name__)
from database.repositories.knowledge_repository import KnowledgeRepository
from src.config import settings, PROJECT_ROOT
from src.api.v1.router import api_router
from src.services.rag.ingest_service import IngestService

UPLOAD_DIR = PROJECT_ROOT / "backend" / "database" / "member_photos"
DATA_DIR = PROJECT_ROOT / "backend" / "database" / "data"
ALLOWED_EXTS = {'.md', '.txt'}

os.makedirs(UPLOAD_DIR, exist_ok=True)

async def _auto_ingest_knowledge():
    if not settings.OPENAI_API_KEY:
        print("[KNOWLEDGE] No OpenAI API key - skipping auto-ingest")
        return

    if not DATA_DIR.exists():
        print("[KNOWLEDGE] Data directory not found - skipping")
        return

    files = [f for f in sorted(DATA_DIR.iterdir()) if f.is_file() and f.suffix.lower() in ALLOWED_EXTS]
    if not files:
        print("[KNOWLEDGE] No knowledge files found in data directory")
        return

    total_size = sum(f.stat().st_size for f in files)
    expected_min_chunks = max(total_size // 1200, len(files) * 5)

    async with AsyncSessionLocal() as db:
        repo = KnowledgeRepository(db)
        count = await repo.count()

        if count >= expected_min_chunks:
            print(f"[KNOWLEDGE] Knowledge base has {count} chunks (expected >={expected_min_chunks}) - OK")
            return

        if count > 0:
            print(f"[KNOWLEDGE] Knowledge base has {count} chunks but expected >={expected_min_chunks} - rebuilding...")
            await repo.delete_all()
        else:
            print(f"[KNOWLEDGE] Knowledge base is empty - ingesting {len(files)} files...")

        ingest_service = IngestService(db)
        total = 0
        for file_path in files:
            chunks = await ingest_service.ingest_file(file_path=file_path, rebuild=False)
            total += chunks
            print(f"[KNOWLEDGE] Ingested {file_path.name} -> {chunks} chunks")
        print(f"[KNOWLEDGE] Auto-ingest complete: {total} total chunks")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up hairdresser API...")
    print(f"Debug mode: {settings.DEBUG}")

    try:
        await init_db()
        print("Database initialized - tables created")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        print("Check if PostgreSQL is running: docker-compose ps")
        raise

    try:
        await _auto_ingest_knowledge()
    except Exception as e:
        print(f"Warning: Knowledge base auto-ingest failed: {e}")

    yield

    print("Shutting down hairdresser API...")
    await close_db()
    print("Database connections closed")


app = FastAPI(
    title="hairdresser API",
    description="API dla systemu umawiania wizyt fryzjerskich",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}\n{traceback.format_exc()}")
    return JSONResponse(status_code=500, content={"detail": "Wystąpił nieoczekiwany błąd serwera"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "name": "hairdresser API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "hairdresser API is running"}

app.include_router(api_router, prefix="/api/v1")
app.mount("/photos", StaticFiles(directory=str(UPLOAD_DIR)), name="photos")
