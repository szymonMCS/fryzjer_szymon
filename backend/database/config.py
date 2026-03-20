from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

from database.models import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://user:password@localhost:5432/salon"
)

is_postgres = "postgresql" in DATABASE_URL

engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_size=10 if is_postgres else 0,         
    max_overflow=20 if is_postgres else 0,       
    pool_timeout=30,      
    pool_recycle=1800,      
    pool_pre_ping=True,   
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autocommit=False, autoflush=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def get_async_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def check_database_exists() -> bool:
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1 FROM services LIMIT 1"))
            return result.scalar() is not None
    except Exception:
        return False

async def init_db():
    async with engine.begin() as conn:
        if is_postgres:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database initialized (PostgreSQL)" if is_postgres else "[OK] Database initialized (SQLite)")

async def reset_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database reset complete")

async def close_db():
    await engine.dispose()
    print("[OK] Database connections closed")

async def get_db_status() -> dict:
    try:
        async with engine.connect() as conn:
            if is_postgres:
                result = await conn.execute(text("SELECT version()"))
            else:
                result = await conn.execute(text("SELECT sqlite_version()"))
            version = result.scalar()
            tables_exist = await check_database_exists()
            return {
                "connected": True,
                "type": "PostgreSQL" if is_postgres else "SQLite",
                "version": version,
                "tables_created": tables_exist
            }
    except Exception as e:
        return {
            "connected": False,
            "type": "Unknown",
            "error": str(e)
        }
