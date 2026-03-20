import uuid
import enum
import os
from datetime import datetime, timezone, date, time
from typing import Optional, List, Any

from sqlalchemy import (
    String,
    Integer,
    Text,
    Boolean,
    DateTime,
    Date,
    Time as SQLTime,
    ForeignKey,
    JSON,
    Column,
    Table,
)
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


team_member_services = Table(
    "team_member_services",
    Base.metadata,
    Column("team_member_id", String(36), ForeignKey("team_members.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", String(36), ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
)


class ServiceCategory(str, enum.Enum):
    HAIRCUT = "haircut"
    BEARD = "beard"
    COMBO = "combo"
    COLORING = "coloring"
    TREATMENT = "treatment"
    OTHER = "other"


class Service(Base):
    __tablename__ = "services"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)
    image_url = Column(String(500), nullable=True)
    category = Column(String(50), default=ServiceCategory.HAIRCUT.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    bookings = relationship("Booking", back_populates="service")
    team_members = relationship("TeamMember", secondary=team_member_services, back_populates="team_members")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    specialties = Column(JSON, default=list)
    experience_years = Column(Integer, default=None)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    bookings = relationship("Booking", back_populates="team_member")
    working_hours = relationship("WorkingHours", back_populates="team_member", cascade="all, delete-orphan")
    services = relationship("Service", secondary=team_member_services, back_populates="team_members")


class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class WorkingHours(Base):
    __tablename__ = "working_hours"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    team_member_id = Column(String(36), ForeignKey("team_members.id", ondelete="CASCADE"), nullable=True)
    team_member = relationship("TeamMember", back_populates="working_hours")
    
    day_of_week = Column(String(20), nullable=True)
    start_time = Column(SQLTime, nullable=True)
    end_time = Column(SQLTime, nullable=True)
    is_closed = Column(Boolean, default=False, nullable=False)
    break_start = Column(SQLTime, nullable=True)
    break_end = Column(SQLTime, nullable=True)
    slot_duration = Column(Integer, default=30, nullable=False)
    special_date = Column(Date, nullable=True)
    is_vacation = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    
    service_id = Column(String(36), ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    service = relationship("Service", back_populates="bookings", lazy="joined")
    
    team_member_id = Column(String(36), ForeignKey("team_members.id", ondelete="SET NULL"), nullable=True)
    team_member = relationship("TeamMember", back_populates="bookings", lazy="joined")
    
    date = Column(Date, nullable=False)
    time = Column(String(5), nullable=False)
    duration = Column(Integer, nullable=False)
    end_time = Column(String(5), nullable=True)
    
    status = Column(String(20), default=BookingStatus.PENDING.value, nullable=False)
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    
    price = Column(Integer, nullable=False)
    
    confirmation_code = Column(String(10), nullable=False)
    reminder_sent = Column(Boolean, default=False, nullable=False)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_reason = Column(Text, nullable=True)


is_postgres = "postgresql" in os.getenv("DATABASE_URL", "")

if is_postgres:
    from pgvector.sqlalchemy import Vector
    embedding_type = Vector(1536)
else:
    embedding_type = JSON


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    category = Column(String(50), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(embedding_type, nullable=True)
    source = Column(String(100), nullable=True)
    tags = Column(JSON, default=list)
    chunk_index = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
