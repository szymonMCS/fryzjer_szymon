import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from datetime import time
from sqlalchemy import select

from database.models import (
    Service, ServiceCategory,
    TeamMember,
    WorkingHours, DayOfWeek,
    Booking
)
from database.config import AsyncSessionLocal, init_db, close_db


async def seed_services(session):
    result = await session.execute(select(Service).limit(1))
    if result.scalar_one_or_none():
        result = await session.execute(select(Service))
        return list(result.scalars().all())
    
    services_data = [
        {
            "name": "Strzyzenie meskie",
            "description": "Profesjonalne strzyzenie wlosow z myciem i stylizacja.",
            "price": 6000,
            "duration": 30,
            "category": ServiceCategory.HAIRCUT.value,
            "display_order": 1,
        },
        {
            "name": "Strzyzenie maszynka",
            "description": "Szybkie strzyzenie maszynka.",
            "price": 4000,
            "duration": 20,
            "category": ServiceCategory.HAIRCUT.value,
            "display_order": 2,
        },
        {
            "name": "Strzyzenie brody",
            "description": "Precyzyjne modelowanie brody.",
            "price": 4000,
            "duration": 25,
            "category": ServiceCategory.BEARD.value,
            "display_order": 3,
        },
        {
            "name": "Strzyzenie + Broda",
            "description": "Kompletny pakiet.",
            "price": 9000,
            "duration": 50,
            "category": ServiceCategory.COMBO.value,
            "display_order": 4,
        },
        {
            "name": "Golenie brzytwa",
            "description": "Tradycyjne golenie brzytwa.",
            "price": 5000,
            "duration": 30,
            "category": ServiceCategory.BEARD.value,
            "display_order": 5,
        },
        {
            "name": "Koloryzacja wlosow",
            "description": "Profesjonalna koloryzacja.",
            "price": 12000,
            "duration": 90,
            "category": ServiceCategory.COLORING.value,
            "display_order": 6,
        },
        {
            "name": "Regeneracja wlosow",
            "description": "Zabieg regenerujacy.",
            "price": 8000,
            "duration": 45,
            "category": ServiceCategory.TREATMENT.value,
            "display_order": 7,
        },
        {
            "name": "Strzyzenie dzieciece",
            "description": "Dla chlopcow do 12 lat.",
            "price": 4500,
            "duration": 25,
            "category": ServiceCategory.HAIRCUT.value,
            "display_order": 8,
        },
    ]
    
    services = []
    for service_data in services_data:
        service = Service(**service_data)
        session.add(service)
        services.append(service)
    
    await session.commit()
    print(f"  + Dodano {len(services_data)} uslug")
    return services


async def seed_team_members(session):
    team_data = [
        {
            "name": "Bartek",
            "role": "Wlasciciel",
            "description": "15 lat doswiadczenia.",
            "specialties": ["fade", "klasyczne"],
            "experience_years": 15,
            "display_order": 1,
        },
        {
            "name": "Michal",
            "role": "Fryzjer",
            "description": "Ekspert od nowoczesnych ciec.",
            "specialties": ["nowoczesne", "fade"],
            "experience_years": 7,
            "display_order": 2,
        },
        {
            "name": "Kasia",
            "role": "Kolorystka",
            "description": "Specjalistka od koloru.",
            "specialties": ["koloryzacja"],
            "experience_years": 10,
            "display_order": 3,
        },
    ]
    
    members = []
    for member_data in team_data:
        member = TeamMember(**member_data)
        session.add(member)
        members.append(member)
    
    await session.commit()
    print(f"  + Dodano {len(team_data)} pracownikow")
    return members


async def seed_working_hours(session, team_members):
    salon_hours = [
        (DayOfWeek.MONDAY, time(9, 0), time(18, 0), False),
        (DayOfWeek.TUESDAY, time(9, 0), time(18, 0), False),
        (DayOfWeek.WEDNESDAY, time(9, 0), time(18, 0), False),
        (DayOfWeek.THURSDAY, time(9, 0), time(20, 0), False),
        (DayOfWeek.FRIDAY, time(9, 0), time(20, 0), False),
        (DayOfWeek.SATURDAY, time(9, 0), time(14, 0), False),
        (DayOfWeek.SUNDAY, time(0, 0), time(0, 0), True),
    ]
    
    for day, start, end, is_closed in salon_hours:
        wh = WorkingHours(
            team_member_id=None,
            day_of_week=day.value,
            start_time=start,
            end_time=end,
            is_closed=is_closed,
            slot_duration=30,
        )
        session.add(wh)
    
    for member in team_members:
        for day, start, end, is_closed in salon_hours:
            wh = WorkingHours(
                team_member_id=member.id,
                day_of_week=day.value,
                start_time=start,
                end_time=end,
                is_closed=is_closed,
                slot_duration=30,
            )
            session.add(wh)
    
    await session.commit()
    print(f"  + Dodano godziny pracy")


async def seed_team_member_services(session, team_members, services):
    bartek, michal, kasia = team_members[0], team_members[1], team_members[2]
    
    haircut = next(s for s in services if s.name == "Strzyzenie meskie")
    machine = next(s for s in services if s.name == "Strzyzenie maszynka")
    beard = next(s for s in services if s.name == "Strzyzenie brody")
    combo = next(s for s in services if s.name == "Strzyzenie + Broda")
    shave = next(s for s in services if s.name == "Golenie brzytwa")
    coloring = next(s for s in services if s.name == "Koloryzacja wlosow")
    treatment = next(s for s in services if s.name == "Regeneracja wlosow")
    kids = next(s for s in services if s.name == "Strzyzenie dzieciece")
    
    bartek.services = [haircut, machine, beard, combo, shave, kids]
    michal.services = [haircut, machine, beard, combo, shave, kids]
    kasia.services = [haircut, coloring, treatment, kids]
    
    await session.commit()
    print(f"  + Przypisano uslugi do pracownikow")


async def seed_knowledge_base():
    import os
    from src.services.vector_service import VectorService
    from database.models import KnowledgeChunk
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(KnowledgeChunk).limit(1))
        if result.scalar_one_or_none():
            print("  ! Baza wiedzy juz istnieje.")
            return
        
        vector_service = VectorService(session)
        
        kb_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge_base.md")
        if os.path.exists(kb_path):
            count = await vector_service.process_knowledge_base_file(kb_path)
            print(f"  + Dodano {count} chunkow z pliku knowledge_base.md")
        
        synced = await vector_service.sync_from_services()
        print(f"  + Zsynchronizowano {synced} elementow z bazy danych")


async def seed_database():
    print("\n=== Seedowanie bazy danych ===\n")
    
    await init_db()
    
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(Service).limit(1))
            if result.scalar_one_or_none():
                print("! Baza danych juz zawiera dane. Pomijam seedowanie.")
                return
            
            services = await seed_services(session)
            team_members = await seed_team_members(session)
            await seed_working_hours(session, team_members)
            await seed_team_member_services(session, team_members, services)
            
            print("\n=== Seedowanie zakonczone sukcesem! ===\n")
            
        except Exception as e:
            await session.rollback()
            print(f"\n!!! Blad podczas seedowania: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    print("\n=== Inicjalizacja bazy wiedzy RAG ===\n")
    await seed_knowledge_base()
    print("\n=== Baza wiedzy gotowa! ===\n")
    
    await close_db()


if __name__ == "__main__":
    asyncio.run(seed_database())
