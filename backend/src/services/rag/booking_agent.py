import json
import uuid
import re
import logging
from datetime import datetime, date
from uuid import UUID
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI
from agents import Agent, Runner, function_tool, RunContextWrapper, TResponseInputItem, Tool
from agents.items import ToolCallItem, ToolCallOutputItem
from src.config import settings, EMBEDDING_DIMS
from dataclasses import dataclass
from src.services.booking.service import BookingService
from database.repositories.service_repository import ServiceRepository
from database.repositories.team_repository import TeamRepository
from database.repositories.booking_repository import BookingRepository
from database.repositories.working_hours_repository import WorkingHoursRepository
from database.repositories.member_working_hours_repository import MemberWorkingHoursRepository
from database.repositories.blacklist_repository import BlacklistRepository
from database.repositories.conversation_repository import ConversationRepository
from database.repositories.knowledge_repository import KnowledgeRepository


@dataclass
class ConversationResponseDTO:
    answer: str
    session_id: str
    requires_confirmation: bool
    sources: List[Dict[str, Any]]
    booking_state: Dict[str, Any]

logger = logging.getLogger(__name__)


class BookingContext:
    def __init__(self, service_repo, team_repo, booking_service, openai_client, knowledge_repo, session_state):
        self.service_repo: ServiceRepository = service_repo
        self.team_repo: TeamRepository = team_repo
        self.booking_service: BookingService = booking_service
        self.openai_client: AsyncOpenAI = openai_client
        self.knowledge_repo: KnowledgeRepository = knowledge_repo
        self.session_state: dict = session_state


def _build_instructions() -> str:
    today = date.today()
    return f"""Jesteś asystentem salonu fryzjerskiego Szymon. Dzisiejsza data: {today.isoformat()}

NAJWAŻNIEJSZA ZASADA:
Na KAŻDE pytanie informacyjne (usługi, ceny, adres, godziny, zespół, porady, trendy) — ZAWSZE najpierw wywołaj search_knowledge. Odpowiadaj WYŁĄCZNIE na podstawie wyników z search_knowledge. NIGDY nie wymyślaj informacji.

STYL ODPOWIEDZI:
- Odpowiadaj krótko, 1-3 zdania
- Podawaj konkrety od razu (ceny, adresy, godziny)
- Nie pytaj "czy chcesz żebym sprawdził?" — po prostu sprawdź i odpowiedz

PROCES REZERWACJI:
Gdy klient chce się umówić, zbieraj dane krok po kroku:

1. Usługa → wywołaj get_services, pokaż listę, po wyborze wywołaj save_service
2. Fryzjer → wywołaj get_team, pokaż listę, po wyborze wywołaj save_barber
3. Data i godzina → po podaniu wywołaj get_available_slots aby sprawdzić dostępność, potem save_datetime
4. Dane kontaktowe (imię, email, telefon) → po podaniu wywołaj save_client_data
5. Podsumowanie → pokaż zebrane dane, zapytaj o potwierdzenie
6. Po potwierdzeniu "tak" → wywołaj create_booking

WAŻNE ZASADY REZERWACJI:
- Po KAŻDYM wyborze klienta NATYCHMIAST wywołaj odpowiedni save_* tool
- Jeśli klient podał kilka informacji naraz (np. "strzyżenie męskie u Szymona jutro o 10") — zapisz wszystkie dane wywołując odpowiednie save_* tools
- Przed pytaniem o kolejne dane wywołaj get_booking_summary żeby sprawdzić co już masz
- NIGDY nie pytaj ponownie o dane które już zebrałeś
- NIGDY nie wywołuj create_booking bez wyraźnego potwierdzenia klienta

KRYTYCZNE ZASADY ANTY-HALUCYNACYJNE:
- NIGDY nie mów że rezerwacja jest potwierdzona jeśli NIE wywołałeś narzędzia create_booking
- NIGDY nie wymyślaj kodów rezerwacji — kod pochodzi WYŁĄCZNIE z wyniku narzędzia create_booking
- NIGDY nie zmieniaj daty ani godziny podanej przez klienta bez jego zgody
- Jeśli create_booking zwróci błąd — poinformuj klienta o błędzie, NIE udawaj że rezerwacja się udała
- Rezerwacja jest potwierdzona TYLKO gdy create_booking zwróci {{"success": true}}"""


@function_tool
async def search_knowledge(ctx: RunContextWrapper[BookingContext], query: str) -> str:
    try:
        if not ctx.context.openai_client:
            return json.dumps({"error": "Brak klienta OpenAI"})

        response = await ctx.context.openai_client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=query,
            dimensions=EMBEDDING_DIMS
        )
        query_embedding = response.data[0].embedding

        results = await ctx.context.knowledge_repo.search_similar_chunks(
            query_embedding=query_embedding,
            similarity_threshold=settings.RAG_SIMILARITY_THRESHOLD,
            k=8
        )

        if not results:
            return json.dumps({"results": [], "message": "Brak wyników w bazie wiedzy"})

        formatted = [
            {"title": r.chunk.title, "content": r.chunk.content, "similarity": round(r.similarity, 3)}
            for r in results
        ]
        return json.dumps({"results": formatted, "count": len(formatted)}, ensure_ascii=False)
    except Exception as e:
        logger.error(f"search_knowledge error: {e}")
        return json.dumps({"error": f"Błąd wyszukiwania: {str(e)}"})


@function_tool
async def get_services(ctx: RunContextWrapper[BookingContext]) -> str:
    try:
        services = await ctx.context.service_repo.get_active()
        return json.dumps([
            {"id": str(s.id), "name": s.name, "price": s.price, "duration_minutes": s.duration}
            for s in services
        ], ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@function_tool
async def get_team(ctx: RunContextWrapper[BookingContext]) -> str:
    try:
        barbers = await ctx.context.booking_service.get_available_barbers()
        return json.dumps(barbers, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@function_tool
async def get_available_slots(ctx: RunContextWrapper[BookingContext], service_id: str, date_str: str, team_member_id: str) -> str:
    try:
        booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        if booking_date < date.today():
            return json.dumps({"error": f"Data {date_str} jest w przeszłości"})

        availability = await ctx.context.booking_service.get_availability(
            booking_date=booking_date,
            service_id=UUID(service_id),
            team_member_id=UUID(team_member_id)
        )

        if not availability:
            return json.dumps({"slots": [], "message": "Brak wolnych terminów na ten dzień"})

        slots = sorted(availability.keys())
        return json.dumps({"slots": slots}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@function_tool
async def save_service(ctx: RunContextWrapper[BookingContext], service_name: str) -> str:
    try:
        services = await ctx.context.service_repo.get_active()
        for s in services:
            if service_name.lower() in s.name.lower():
                ctx.context.session_state["service_id"] = str(s.id)
                ctx.context.session_state["service_name"] = s.name
                return json.dumps({"ok": True, "service": s.name, "id": str(s.id)})
        return json.dumps({"ok": False, "error": f"Nie znaleziono usługi: {service_name}"})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})


@function_tool
async def save_barber(ctx: RunContextWrapper[BookingContext], barber_name: str) -> str:
    try:
        members = await ctx.context.team_repo.get_active()
        for m in members:
            if barber_name.lower() in m.name.lower():
                ctx.context.session_state["team_member_id"] = str(m.id)
                ctx.context.session_state["barber_name"] = m.name
                return json.dumps({"ok": True, "barber": m.name, "id": str(m.id)})
        return json.dumps({"ok": False, "error": f"Nie znaleziono fryzjera: {barber_name}"})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})


@function_tool
async def save_datetime(ctx: RunContextWrapper[BookingContext], date_str: str, time_str: str) -> str:
    ctx.context.session_state["date"] = date_str
    ctx.context.session_state["time"] = time_str
    return json.dumps({"ok": True, "date": date_str, "time": time_str})


@function_tool
async def save_client_data(ctx: RunContextWrapper[BookingContext], name: str, email: str, phone: str) -> str:
    ctx.context.session_state["name"] = name
    ctx.context.session_state["email"] = email
    ctx.context.session_state["phone"] = re.sub(r'\D', '', phone)
    return json.dumps({"ok": True, "name": name, "email": email, "phone": phone})


@function_tool
async def get_booking_summary(ctx: RunContextWrapper[BookingContext]) -> str:
    state = ctx.context.session_state
    fields = {
        "service_id": "usługa", "team_member_id": "fryzjer",
        "date": "data", "time": "godzina",
        "name": "imię", "email": "email", "phone": "telefon"
    }
    missing = [label for key, label in fields.items() if key not in state]
    return json.dumps({
        "collected": {k: v for k, v in state.items() if k in fields or k in ("service_name", "barber_name")},
        "missing": missing,
        "is_complete": len(missing) == 0
    }, ensure_ascii=False)


@function_tool
async def create_booking(ctx: RunContextWrapper[BookingContext]) -> str:
    try:
        state = ctx.context.session_state

        required = ["service_id", "team_member_id", "date", "time", "name", "email", "phone"]
        missing = [f for f in required if f not in state]
        if missing:
            return json.dumps({"error": f"Brak danych: {', '.join(missing)}"})

        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', state["email"]):
            return json.dumps({"error": "Nieprawidłowy email"})

        phone_clean = re.sub(r'\D', '', state["phone"])
        if len(phone_clean) != 9:
            return json.dumps({"error": "Telefon musi mieć 9 cyfr"})

        booking = await ctx.context.booking_service.create_booking({
            "customer_name": state["name"].strip(),
            "customer_email": state["email"].strip(),
            "customer_phone": phone_clean,
            "service_id": UUID(state["service_id"]),
            "team_member_id": UUID(state["team_member_id"]),
            "booking_date": datetime.strptime(state["date"], "%Y-%m-%d").date(),
            "booking_time": state["time"],
            "notes": ""
        })

        return json.dumps({
            "success": True,
            "code": booking.confirmation_code,
            "message": f"Rezerwacja potwierdzona! Kod: {booking.confirmation_code}"
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


ALL_TOOLS: list[Tool] = [
    search_knowledge, get_services, get_team, get_available_slots,
    save_service, save_barber, save_datetime, save_client_data,
    get_booking_summary, create_booking
]

_CONFIRMATION_PATTERNS = re.compile(
    r'rezerwacja\s+(jest\s+)?potwierdzona|'
    r'rezerwacja\s+została\s+(utworzona|potwierdzona|zapisana)|'
    r'wizyta\s+(jest\s+)?zarezerwowana|'
    r'wizyta\s+została\s+(zarezerwowana|potwierdzona)|'
    r'kod\s+(rezerwacji|potwierdzenia)\s*[:\-]?\s*\w',
    re.IGNORECASE
)


def _validate_booking_response(answer: str, result) -> str:
    if not _CONFIRMATION_PATTERNS.search(answer):
        return answer

    create_booking_called = False
    create_booking_succeeded = False

    for item in result.new_items:
        if isinstance(item, ToolCallItem):
            raw = item.raw_item
            name = getattr(raw, "name", None) or (raw.get("name") if isinstance(raw, dict) else None)
            if name == "create_booking":
                create_booking_called = True
        elif isinstance(item, ToolCallOutputItem):
            try:
                output = item.output if isinstance(item.output, dict) else json.loads(str(item.output))
                if output.get("success") is True:
                    create_booking_succeeded = True
            except (json.JSONDecodeError, TypeError, ValueError):
                pass

    if not create_booking_called:
        logger.warning("HALLUCINATION DETECTED: Agent claimed booking confirmed without calling create_booking")
        return (
            "Przepraszam, wystąpił problem z finalizacją rezerwacji. "
            "Spróbujmy jeszcze raz — czy potwierdzasz rezerwację?"
        )

    if create_booking_called and not create_booking_succeeded:
        logger.warning("Agent claimed booking confirmed but create_booking failed")
        return (
            "Przepraszam, nie udało się utworzyć rezerwacji. "
            "Spróbuj ponownie lub skontaktuj się z salonem telefonicznie."
        )

    return answer


class BookingAgentService:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

        service_repo = ServiceRepository(db_session)
        team_repo = TeamRepository(db_session)
        knowledge_repo = KnowledgeRepository(db_session)
        openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

        booking_service = BookingService(
            booking_repo=BookingRepository(db_session),
            working_hours_repo=WorkingHoursRepository(db_session),
            service_repo=service_repo,
            team_repo=team_repo,
            blacklist_repo=BlacklistRepository(db_session),
            member_working_hours_repo=MemberWorkingHoursRepository(db_session)
        )

        self.session_state: dict = {}
        self.context = BookingContext(
            service_repo=service_repo,
            team_repo=team_repo,
            booking_service=booking_service,
            openai_client=openai_client,
            knowledge_repo=knowledge_repo,
            session_state=self.session_state
        )

        self.agent = Agent(
            name="SalonAssistant",
            model=settings.OPENAI_LLM_MODEL,
            instructions=_build_instructions(),
            tools=ALL_TOOLS
        )

    async def ask(self, query: str, history: Optional[List[Dict[str, Any]]] = None, session_id: Optional[str] = None) -> ConversationResponseDTO:
        session_id = session_id or f"s_{uuid.uuid4().hex[:12]}"
        conv_repo = ConversationRepository(self.db)

        session = await conv_repo.get_session(session_id)
        if session and session.booking_state:
            self.session_state.update(session.booking_state)

        conversation: List[TResponseInputItem] = []
        if history:
            for msg in history[-20:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    conversation.append({"role": role, "content": content})
        elif session:
            for msg in session.messages[-20:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    conversation.append({"role": role, "content": content})

        if self.session_state:
            conversation.append({
                "role": "developer",
                "content": f"Aktualny stan rezerwacji (NIE pytaj ponownie o te dane): {json.dumps(self.session_state, ensure_ascii=False)}"
            })

        conversation.append({"role": "user", "content": query})

        try:
            self.agent.instructions = _build_instructions()
            result = await Runner.run(self.agent, input=conversation, context=self.context)

            answer = _validate_booking_response(result.final_output, result)

            messages_for_db = []
            for m in result.to_input_list():
                role = m.get("role")
                content = m.get("content", "")
                if role in ("user", "assistant") and content:
                    messages_for_db.append({"role": role, "content": content})

            await conv_repo.save_session(session_id, messages_for_db, booking_state=self.session_state)

            return ConversationResponseDTO(
                answer=answer,
                session_id=session_id,
                requires_confirmation=False,
                sources=[],
                booking_state=self.session_state.copy()
            )
        except Exception as e:
            logger.exception("Agent error")
            return ConversationResponseDTO(
                answer="Przepraszam, wystąpił błąd. Spróbuj ponownie.",
                session_id=session_id,
                requires_confirmation=False,
                sources=[],
                booking_state={}
            )
