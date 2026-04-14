from typing import Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query, status, BackgroundTasks
from src.services.booking.service import BookingService
from src.services.email import email_service 
from src.schemas.booking import (
    BookingCreateRequest,
    BookingCancelRequest,
    BookingResponse,
    AvailabilityResponse,
    AvailabilitySlot
)
from src.api.deps import get_booking_service, get_current_admin, get_service_repo, get_team_repo
from database.repositories.service_repository import ServiceRepository
from database.repositories.team_repository import TeamRepository
from src.core.exceptions import NotFoundException

router = APIRouter(prefix="/bookings", tags=["bookings"])

def _build_booking_response(booking, service, team_member) -> dict:
    return {
        "id": booking.id,
        "customer_name": booking.customer_name,
        "customer_email": booking.customer_email,
        "customer_phone": booking.customer_phone,
        "service": {
            "id": service.id,
            "name": service.name,
            "duration": service.duration,
            "price": service.price,
        } if service else None,
        "team_member": {
            "id": team_member.id,
            "name": team_member.name,
            "role": team_member.role,
        } if team_member else None,
        "team_member_id": team_member.id if team_member else None,
        "team_member_name": team_member.name if team_member else None,
        "booking_date": booking.booking_date,
        "booking_time": booking.booking_time,
        "duration": booking.duration,
        "status": booking.status,
        "confirmation_code": booking.confirmation_code,
        "notes": booking.notes,
        "created_at": booking.created_at,
    }

@router.get("/availability", response_model=AvailabilityResponse)
async def get_availability(
    date: date,
    service_id: UUID,
    team_member_id: Optional[UUID] = None,
    booking_service: BookingService = Depends(get_booking_service)
):
    availability = await booking_service.get_availability(date, service_id, team_member_id)
    slots = [
        AvailabilitySlot(time=time_slot, available_team_members=[UUID(m) for m in member_ids])
        for time_slot, member_ids in sorted(availability.items())
    ]
    return AvailabilityResponse(date=date, service_id=service_id, slots=slots)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreateRequest, 
    background_tasks: BackgroundTasks,
    booking_service: BookingService = Depends(get_booking_service),
    service_repo: ServiceRepository = Depends(get_service_repo),
    team_repo: TeamRepository = Depends(get_team_repo)
):
    service = await service_repo.get(data.service_id)
    if not service:
        raise NotFoundException(f"Nie znaleziono uslugi {data.service_id}")

    team_member = None
    if data.team_member_id:
        team_member = await team_repo.get(data.team_member_id)

    booking = await booking_service.create_booking(data.model_dump())

    if booking.customer_email:
        background_tasks.add_task(
            email_service.send_booking_confirmation,
            to_email=booking.customer_email,
            customer_name=booking.customer_name,
            service_name=service.name,
            booking_date=booking.booking_date,
            booking_time=booking.booking_time,
            confirmation_code=booking.confirmation_code
        )

    return _build_booking_response(booking, service, team_member)

@router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: UUID, data: BookingCancelRequest, booking_service: BookingService = Depends(get_booking_service)):
    await booking_service.cancel_booking(booking_id, data.phone, data.confirmation_code)
    return {"message": "Rezerwacja zostala anulowana"}

@router.get("/admin/bookings", response_model=list[BookingResponse])
async def list_bookings(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    team_member_id: Optional[UUID] = None,
    status: Optional[str] = Query(None),
    booking_service: BookingService = Depends(get_booking_service),
    service_repo: ServiceRepository = Depends(get_service_repo),
    team_repo: TeamRepository = Depends(get_team_repo),
    admin: bool = Depends(get_current_admin)
):
    bookings = await booking_service.get_filtered_bookings(
        start_date=start_date,
        end_date=end_date,
        team_member_id=team_member_id,
        status=status,
        limit=100
    )
    
    result = []
    for booking in bookings:
        service = await service_repo.get(booking.service_id)
        team_member = await team_repo.get(booking.team_member_id) if booking.team_member_id else None
        
        result.append(_build_booking_response(booking, service, team_member))
    return result

@router.patch("/admin/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking_status(
    booking_id: UUID,
    booking_status: str,
    booking_service: BookingService = Depends(get_booking_service),
    service_repo: ServiceRepository = Depends(get_service_repo),
    team_repo: TeamRepository = Depends(get_team_repo),
    admin: bool = Depends(get_current_admin)
):
    booking = await booking_service.update_booking_status(booking_id, booking_status)
    if not booking:
        raise NotFoundException(f"Nie znaleziono rezerwacji {booking_id}")

    service = await service_repo.get(booking.service_id)
    team_member = await team_repo.get(booking.team_member_id) if booking.team_member_id else None

    return _build_booking_response(booking, service, team_member)

@router.delete("/admin/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(
    booking_id: UUID,
    booking_service: BookingService = Depends(get_booking_service),
    admin: bool = Depends(get_current_admin)
):
    deleted = await booking_service.delete_booking(booking_id)
    if not deleted:
        raise NotFoundException(f"Nie znaleziono rezerwacji {booking_id}")
    return None