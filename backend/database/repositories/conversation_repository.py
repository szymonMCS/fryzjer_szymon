from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import ConversationSession


class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_session(self, session_id: str) -> Optional[ConversationSession]:
        result = await self.db.execute(
            select(ConversationSession)
            .where(ConversationSession.session_id == session_id)
            .where(ConversationSession.expires_at > datetime.now(timezone.utc))
        )
        return result.scalar_one_or_none()

    async def save_session(
        self, 
        session_id: str, 
        messages: List[Dict[str, Any]], 
        booking_state: Optional[Dict[str, Any]] = None,
        expires_in_minutes: int = 60
    ) -> None:
        session = await self.get_session(session_id)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=expires_in_minutes)
        
        if session:
            session.messages = messages
            if booking_state is not None:
                session.booking_state = booking_state
            session.updated_at = now
            session.expires_at = expires_at
        else:
            session = ConversationSession(
                session_id=session_id,
                messages=messages,
                booking_state=booking_state or {},
                expires_at=expires_at
            )
            self.db.add(session)
        
        await self.db.commit()

