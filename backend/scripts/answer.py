import asyncio
import sys
import argparse
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.config import settings
from src.services.rag import QueryService

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

async def main():
    parser = argparse.ArgumentParser(description="Test RAG z PostgreSQL")
    parser.add_argument("question", type=str, help="Pytanie do chatbota")
    args = parser.parse_args()

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        service = QueryService(db)
        answer, chunks = await service.answer(args.question)
        
        print(f"\n{'='*60}")
        print(f"PYTANIE: {args.question}")
        print(f"{'='*60}")
        print(f"\nODPOWIEDZ:\n{answer}")
        print(f"\n{'='*60}")
        print(f"UŻYTE ŹRÓDŁA:")
        for c in chunks:
            print(f"  - {c.metadata['source']} (similarity: {c.similarity:.3f})")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
