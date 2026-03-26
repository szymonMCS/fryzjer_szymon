from typing import Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException, status, BackgroundTasks
from src.services.interfaces.booking import IBookingService
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
from src.core.exceptions import NotFoundException, ConflictException

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.get("/availability", response_model=AvailabilityResponse)
async def get_availability(
    date: date,
    service_id: UUID,
    team_member_id: Optional[UUID] = None,
    booking_service: IBookingService = Depends(get_booking_service)
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
    booking_service: IBookingService = Depends(get_booking_service),
    service_repo: ServiceRepository = Depends(get_service_repo),
    team_repo: TeamRepository = Depends(get_team_repo)
):
    try:
        service = await service_repo.get(data.service_id)
        if not service:
            raise NotFoundException(f"Service {data.service_id} not found")
        
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
            },
            "team_member": {
                "id": team_member.id,
                "name": team_member.name,
                "role": team_member.role,
            } if team_member else None,
            "booking_date": booking.booking_date,
            "booking_time": booking.booking_time,
            "duration": booking.duration,
            "status": booking.status,
            "confirmation_code": booking.confirmation_code,
            "notes": booking.notes,
            "created_at": booking.created_at,
        }
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: UUID, data: BookingCancelRequest, booking_service: IBookingService = Depends(get_booking_service)):
    try:
        success = await booking_service.cancel_booking(booking_id, data.phone, data.confirmation_code)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number, confirmation code, or booking already cancelled"
            )
        return {"message": "Booking cancelled successfully"}
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/admin/bookings", response_model=list[BookingResponse])
async def list_bookings(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    team_member_id: Optional[UUID] = None,
    status: Optional[str] = Query(None),
    booking_service: IBookingService = Depends(get_booking_service),
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
        
        result.append({
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
            "booking_date": booking.booking_date,
            "booking_time": booking.booking_time,
            "duration": booking.duration,
            "status": booking.status,
            "confirmation_code": booking.confirmation_code,
            "notes": booking.notes,
            "created_at": booking.created_at,
        })
    
    return result

@router.patch("/admin/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking_status(
    booking_id: UUID,
    status: str,
    booking_service: IBookingService = Depends(get_booking_service),
    service_repo: ServiceRepository = Depends(get_service_repo),
    team_repo: TeamRepository = Depends(get_team_repo),
    admin: bool = Depends(get_current_admin)
):
    booking = await booking_service.update_booking_status(booking_id, status)
    if not booking:
        raise NotFoundException(f"Booking {booking_id} not found")
    
    service = await service_repo.get(booking.service_id)
    team_member = await team_repo.get(booking.team_member_id) if booking.team_member_id else None
    
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
        "booking_date": booking.booking_date,
        "booking_time": booking.booking_time,
        "duration": booking.duration,
        "status": booking.status,
        "confirmation_code": booking.confirmation_code,
        "notes": booking.notes,
        "created_at": booking.created_at,
    }