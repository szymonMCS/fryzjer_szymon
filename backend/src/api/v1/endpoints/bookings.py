from typing import Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException, status
from src.services.interfaces.booking import IBookingService
from src.schemas.booking import (
    BookingCreateRequest,
    BookingCancelRequest,
    BookingResponse,
    AvailabilityResponse,
    AvailabilitySlot
)
from src.api.deps import get_booking_service, get_current_admin
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

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(data: BookingCreateRequest, booking_service: IBookingService = Depends(get_booking_service)):
    try:
        booking = await booking_service.create_booking(data.model_dump())
        return booking
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
    admin: bool = Depends(get_current_admin)
):
    bookings = await booking_service.get_filtered_bookings(
        start_date=start_date,
        end_date=end_date,
        team_member_id=team_member_id,
        status=status,
        limit=100
    )
    return bookings
