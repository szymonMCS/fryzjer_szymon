import asyncio
import sys
import argparse
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from tqdm import tqdm

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from src.config import settings
from src.services.rag import IngestService

DATA_DIR = backend_dir / "database" / "data"
DEFAULT_FILES = ["baza_wiedzy_fryzjerskiej.md", "baza_wiedzy_salonu.md"]


async def main():
    parser = argparse.ArgumentParser(description="Ingest documents to PostgreSQL")
    parser.add_argument("--all", action="store_true", help="Wszystkie pliki")
    parser.add_argument("--file", type=str, help="Konkretny plik")
    parser.add_argument("--rebuild", action="store_true", help="Kasuj i przeładuj")
    parser.add_argument("--index", action="store_true", help="Utwórz HNSW indeks")
    args = parser.parse_args()

    files = []
    if args.all:
        files = [DATA_DIR / f for f in DEFAULT_FILES]
    elif args.file:
        files = [Path(args.file) if Path(args.file).is_absolute() else DATA_DIR / args.file]
    else:
        files = [DATA_DIR / DEFAULT_FILES[0]]

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        service = IngestService(db)
        total = 0
        
        for file_path in tqdm(files, desc="Pliki"):
            try:
                count = await service.ingest_file(file_path, args.rebuild)
                total += count
                print(f"Zapisano {count} chunków z {file_path.name}")
            except Exception as e:
                print(f"Błąd {file_path.name}: {e}")

        print(f"\n{'='*40}")
        print(f"Łącznie chunków: {total}")

        if args.index:
            await service.create_hnsw_index()
            print("HNSW indeks utworzony")

    await engine.dispose()
    print("Gotowe!")


if __name__ == "__main__":
    asyncio.run(main())
