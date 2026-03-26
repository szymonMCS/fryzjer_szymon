"""
Skrypt seedujący dane do bazy.
Uruchom: python seed_data.py
"""
import asyncio
import uuid
from datetime import time
from database.config import init_db, AsyncSessionLocal
from database.models import Service, TeamMember, WorkingHours


async def seed_services(session):
    """Dodaje przykladowe uslugi"""
    services = [
        {
            "id": uuid.uuid4(),
            "name": "Strzyżenie męskie",
            "description": "Klasyczne strzyżenie włosów z użyciem maszynki i nożyczek.",
            "price": 7000,
            "duration": 30,
            "category": "haircut",
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "name": "Strzyżenie brody",
            "description": "Precyzyjne modelowanie brody z użyciem maszynki i nożyczek.",
            "price": 5000,
            "duration": 20,
            "category": "beard",
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "name": "Combo - Włosy + Broda",
            "description": "Kompleksowa usługa obejmująca strzyżenie włosów i brody.",
            "price": 11000,
            "duration": 50,
            "category": "combo",
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "name": "Koloryzacja włosów",
            "description": "Profesjonalna koloryzacja włosów z użyciem premium produktów.",
            "price": 15000,
            "duration": 90,
            "category": "coloring",
            "is_active": True,
        },
    ]
    
    for svc_data in services:
        service = Service(**svc_data)
        session.add(service)
        print(f"Added service ID: {svc_data['id']}")
    
    await session.commit()


async def seed_team(session):
    """Dodaje pracownikow"""
    team_members = [
        {
            "id": uuid.uuid4(),
            "name": "Szymon",
            "role": "Mistrz Fryzjerstwa",
            "bio": "Założyciel salonu z 15-letnim doświadczeniem. Specjalista w strzyżeniu klasycznym i nowoczesnych trendach.",
            "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
            "specialties": ["Strzyżenie klasyczne", "Koloryzacja", "Stylizacja"],
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "name": "Ola",
            "role": "Stylistka",
            "bio": "Kreatywna stylistka z pasją do nowoczesnych fryzur. Specjalizuje się w koloryzacji i stylizacji.",
            "image_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
            "specialties": ["Koloryzacja", "Balayage", "Strzyżenie"],
            "is_active": True,
        },
    ]
    
    for tm_data in team_members:
        member = TeamMember(**tm_data)
        session.add(member)
        print(f"Added team member ID: {tm_data['id']}")
    
    await session.commit()


async def seed_working_hours(session):
    """Dodaje godziny pracy salonu"""
    working_hours = [
        {"day_of_week": "monday", "start_time": time(9, 0), "end_time": time(18, 0), "is_closed": False},
        {"day_of_week": "tuesday", "start_time": time(9, 0), "end_time": time(18, 0), "is_closed": False},
        {"day_of_week": "wednesday", "start_time": time(9, 0), "end_time": time(18, 0), "is_closed": False},
        {"day_of_week": "thursday", "start_time": time(9, 0), "end_time": time(18, 0), "is_closed": False},
        {"day_of_week": "friday", "start_time": time(9, 0), "end_time": time(18, 0), "is_closed": False},
        {"day_of_week": "saturday", "start_time": time(9, 0), "end_time": time(14, 0), "is_closed": False},
        {"day_of_week": "sunday", "start_time": None, "end_time": None, "is_closed": True},
    ]
    
    for wh_data in working_hours:
        wh = WorkingHours(**wh_data)
        session.add(wh)
        print(f"Added working hours: {wh_data['day_of_week']}")
    
    await session.commit()


async def main():
    print("Initializing database...")
    await init_db()
    
    async with AsyncSessionLocal() as session:
        print("\n=== Seeding Services ===")
        await seed_services(session)
        
        print("\n=== Seeding Team ===")
        await seed_team(session)
        
        print("\n=== Seeding Working Hours ===")
        await seed_working_hours(session)
        
        print("\n=== Done! ===")


if __name__ == "__main__":
    asyncio.run(main())
