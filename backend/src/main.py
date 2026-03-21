from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.config import init_db, close_db
from src.config import settings


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
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