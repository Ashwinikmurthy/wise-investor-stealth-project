"""
Events API - FastAPI Routes
Wise Investor Nonprofit Management Platform
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
import uuid

from database import get_db
from user_management.auth_dependencies import get_current_user
from models import (
    Users as User,
    Organizations as Organization,
    Events as Event,
    EventRegistrations as EventRegistration,
    EventTickets as EventTicket
)
from events.events_schema import (
    EventCreate, EventUpdate, EventResponse, EventPerformance,
    EventRegistrationCreate, EventRegistrationUpdate, EventRegistrationResponse,
    EventTicketCreate, EventTicketUpdate, EventTicketResponse,
    PublicEventSummary, EventStatus
)

router = APIRouter(prefix="/api/events", tags=["Events"])


def calculate_event_metrics(event: Event) -> dict:
    """Calculate computed metrics for an event"""
    metrics = {}

    # Days until event
    if event.start_date:
        days_until = (event.start_date - datetime.now(timezone.utc)).days
        metrics['days_until_event'] = days_until if days_until > 0 else 0
    else:
        metrics['days_until_event'] = None

    # Capacity remaining
    if event.capacity:
        remaining = event.capacity - event.registered_count
        metrics['capacity_remaining'] = max(0, remaining)
    else:
        metrics['capacity_remaining'] = None

    # Occupancy percentage
    if event.capacity and event.capacity > 0:
        metrics['occupancy_percentage'] = round((event.registered_count / event.capacity) * 100, 2)
    else:
        metrics['occupancy_percentage'] = 0.0

    # Is registration open
    now = datetime.now(timezone.utc)
    is_open = (
            event.status == "active" and
            (event.registration_deadline is None or event.registration_deadline > now) and
            (event.capacity is None or event.registered_count < event.capacity)
    )
    metrics['is_registration_open'] = is_open

    return metrics


# ==================== ORGANIZATION ADMIN ENDPOINTS ====================

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
        event_data: EventCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a new event for the organization"""

    # Validate dates
    if event_data.end_date and event_data.end_date < event_data.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date"
        )

    # Create event
    event = Event(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        **event_data.model_dump()
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    # Add computed metrics
    metrics = calculate_event_metrics(event)
    response = EventResponse.model_validate(event)
    for key, value in metrics.items():
        setattr(response, key, value)

    return response


@router.get("/", response_model=List[EventResponse])
async def list_events(
        status: Optional[EventStatus] = None,
        event_type: Optional[str] = None,
        upcoming_only: bool = False,
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """List all events for the organization"""

    query = db.query(Event).filter(Event.organization_id == current_user.organization_id)

    if status:
        query = query.filter(Event.status == status)

    if event_type:
        query = query.filter(Event.event_type == event_type)

    if upcoming_only:
        query = query.filter(Event.start_date >= datetime.now(timezone.utc))

    events = query.order_by(Event.start_date.asc()).offset(skip).limit(limit).all()

    # Add computed metrics to each event
    responses = []
    for event in events:
        metrics = calculate_event_metrics(event)
        response = EventResponse.model_validate(event)
        for key, value in metrics.items():
            setattr(response, key, value)
        responses.append(response)

    return responses


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
        event_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get a specific event by ID"""

    event = db.query(Event).filter(
        and_(
            Event.id == event_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Add computed metrics
    metrics = calculate_event_metrics(event)
    response = EventResponse.model_validate(event)
    for key, value in metrics.items():
        setattr(response, key, value)

    return response


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
        event_id: uuid.UUID,
        event_data: EventUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Update an event"""

    event = db.query(Event).filter(
        and_(
            Event.id == event_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Update fields
    update_data = event_data.model_dump(exclude_unset=True)

    # Validate dates if both are being updated
    if 'start_date' in update_data or 'end_date' in update_data:
        start = update_data.get('start_date', event.start_date)
        end = update_data.get('end_date', event.end_date)
        if end and start and end < start:
            raise HTTPException(
                status_code=400,
                detail="End date must be after start date"
            )

    for field, value in update_data.items():
        setattr(event, field, value)

    event.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(event)

    # Add computed metrics
    metrics = calculate_event_metrics(event)
    response = EventResponse.model_validate(event)
    for key, value in metrics.items():
        setattr(response, key, value)

    return response


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
        event_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Delete an event"""

    event = db.query(Event).filter(
        and_(
            Event.id == event_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()

    return None


# ==================== EVENT PERFORMANCE ====================

@router.get("/{event_id}/performance", response_model=EventPerformance)
async def get_event_performance(
        event_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get detailed performance metrics for an event"""

    event = db.query(Event).filter(
        and_(
            Event.id == event_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Calculate metrics
    occupancy_percentage = 0.0
    if event.capacity and event.capacity > 0:
        occupancy_percentage = (event.registered_count / event.capacity) * 100

    capacity_remaining = None
    if event.capacity:
        capacity_remaining = max(0, event.capacity - event.registered_count)

    # Days until event
    days_until_event = None
    is_past_event = False
    if event.start_date:
        days_until = (event.start_date - datetime.now(timezone.utc)).days
        days_until_event = max(0, days_until)
        is_past_event = days_until < 0

    # Is registration open
    now = datetime.now(timezone.utc)
    is_registration_open = (
            event.status == "active" and
            (event.registration_deadline is None or event.registration_deadline > now) and
            (event.capacity is None or event.registered_count < event.capacity) and
            not is_past_event
    )

    # Get ticket statistics
    tickets = db.query(EventTicket).filter(EventTicket.event_id == event_id).all()
    ticket_types_count = len(tickets)
    total_tickets_available = sum(t.quantity_available for t in tickets if t.quantity_available) if tickets else None
    total_tickets_sold = sum(t.quantity_sold for t in tickets if t.quantity_sold) if tickets else 0

    # Calculate total revenue
    total_revenue = Decimal('0')
    if event.registration_fee:
        total_revenue = Decimal(str(event.registration_fee)) * event.registered_count

    # Add ticket revenue
    for ticket in tickets:
        if ticket.quantity_sold and ticket.price:
            total_revenue += Decimal(str(ticket.price)) * ticket.quantity_sold

    performance = EventPerformance(
        event_id=event.id,
        event_name=event.name,
        event_type=event.event_type,
        start_date=event.start_date,
        end_date=event.end_date,
        status=event.status,
        capacity=event.capacity,
        registered_count=event.registered_count,
        capacity_remaining=capacity_remaining,
        occupancy_percentage=round(occupancy_percentage, 2),
        registration_fee=event.registration_fee,
        total_revenue=total_revenue,
        ticket_types_count=ticket_types_count,
        total_tickets_available=total_tickets_available,
        total_tickets_sold=total_tickets_sold,
        days_until_event=days_until_event,
        is_past_event=is_past_event,
        is_registration_open=is_registration_open
    )

    return performance


@router.get("/performance/all", response_model=List[EventPerformance])
async def get_all_events_performance(
        upcoming_only: bool = True,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get performance metrics for all events"""

    query = db.query(Event).filter(Event.organization_id == current_user.organization_id)

    if upcoming_only:
        query = query.filter(Event.start_date >= datetime.now(timezone.utc))

    events = query.order_by(Event.start_date.asc()).all()

    performances = []
    for event in events:
        # Calculate metrics
        occupancy_percentage = 0.0
        if event.capacity and event.capacity > 0:
            occupancy_percentage = (event.registered_count / event.capacity) * 100

        capacity_remaining = None
        if event.capacity:
            capacity_remaining = max(0, event.capacity - event.registered_count)

        days_until_event = None
        is_past_event = False
        if event.start_date:
            days_until = (event.start_date - datetime.now(timezone.utc)).days
            days_until_event = max(0, days_until)
            is_past_event = days_until < 0

        now = datetime.now(timezone.utc)
        is_registration_open = (
                event.status == "active" and
                (event.registration_deadline is None or event.registration_deadline > now) and
                (event.capacity is None or event.registered_count < event.capacity) and
                not is_past_event
        )

        # Get ticket statistics
        tickets = db.query(EventTicket).filter(EventTicket.event_id == event.id).all()
        ticket_types_count = len(tickets)
        total_tickets_available = sum(t.quantity_available for t in tickets if t.quantity_available) if tickets else None
        total_tickets_sold = sum(t.quantity_sold for t in tickets if t.quantity_sold) if tickets else 0

        # Calculate total revenue
        total_revenue = Decimal('0')
        if event.registration_fee:
            total_revenue = Decimal(str(event.registration_fee)) * event.registered_count

        for ticket in tickets:
            if ticket.quantity_sold and ticket.price:
                total_revenue += Decimal(str(ticket.price)) * ticket.quantity_sold

        performance = EventPerformance(
            event_id=event.id,
            event_name=event.name,
            event_type=event.event_type,
            start_date=event.start_date,
            end_date=event.end_date,
            status=event.status,
            capacity=event.capacity,
            registered_count=event.registered_count,
            capacity_remaining=capacity_remaining,
            occupancy_percentage=round(occupancy_percentage, 2),
            registration_fee=event.registration_fee,
            total_revenue=total_revenue,
            ticket_types_count=ticket_types_count,
            total_tickets_available=total_tickets_available,
            total_tickets_sold=total_tickets_sold,
            days_until_event=days_until_event,
            is_past_event=is_past_event,
            is_registration_open=is_registration_open
        )
        performances.append(performance)

    return performances


# ==================== EVENT REGISTRATIONS ====================

@router.post("/{event_id}/registrations", response_model=EventRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def create_event_registration(
        event_id: uuid.UUID,
        registration_data: EventRegistrationCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a registration for an event"""

    # Verify event exists and belongs to organization
    event = db.query(Event).filter(
        and_(
            Event.id == event_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check capacity
    if event.capacity and event.registered_count >= event.capacity:
        raise HTTPException(status_code=400, detail="Event is at full capacity")

    # Check registration deadline
    if event.registration_deadline and datetime.now(timezone.utc) > event.registration_deadline:
        raise HTTPException(status_code=400, detail="Registration deadline has passed")

    # Calculate total amount
    total_amount = None
    if event.registration_fee:
        total_amount = Decimal(str(event.registration_fee)) * registration_data.number_of_tickets

    registration = EventRegistration(
        id=uuid.uuid4(),
        event_id=event_id,
        total_amount=total_amount,
        payment_status="pending" if total_amount and total_amount > 0 else "not_required",
        registration_status="confirmed",
        **registration_data.model_dump()
    )

    db.add(registration)

    # Update event registered count
    event.registered_count += registration_data.number_of_tickets

    db.commit()
    db.refresh(registration)

    return registration


@router.get("/{event_id}/registrations", response_model=List[EventRegistrationResponse])
async def list_event_registrations(
        event_id: uuid.UUID,
        registration_status: Optional[str] = None,
        payment_status: Optional[str] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """List all registrations for an event"""

    # Verify event exists and belongs to organization
    event = db.query(Event).filter(
        and_(
            Event.id == event_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    query = db.query(EventRegistration).filter(EventRegistration.event_id == event_id)

    if registration_status:
        query = query.filter(EventRegistration.registration_status == registration_status)

    if payment_status:
        query = query.filter(EventRegistration.payment_status == payment_status)

    registrations = query.order_by(EventRegistration.created_at.desc()).offset(skip).limit(limit).all()

    return registrations


@router.get("/registrations/{registration_id}", response_model=EventRegistrationResponse)
async def get_event_registration(
        registration_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get a specific registration"""

    registration = db.query(EventRegistration).join(Event).filter(
        and_(
            EventRegistration.id == registration_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    return registration


@router.put("/registrations/{registration_id}", response_model=EventRegistrationResponse)
async def update_event_registration(
        registration_id: uuid.UUID,
        registration_data: EventRegistrationUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Update a registration"""

    registration = db.query(EventRegistration).join(Event).filter(
        and_(
            EventRegistration.id == registration_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    # Update fields
    update_data = registration_data.model_dump(exclude_unset=True)

    # Handle check-in
    if 'checked_in' in update_data and update_data['checked_in'] and not registration.checked_in:
        update_data['checked_in_at'] = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(registration, field, value)

    db.commit()
    db.refresh(registration)

    return registration


@router.post("/registrations/{registration_id}/check-in", response_model=EventRegistrationResponse)
async def check_in_registration(
        registration_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Check in a registration"""

    registration = db.query(EventRegistration).join(Event).filter(
        and_(
            EventRegistration.id == registration_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    if registration.checked_in:
        raise HTTPException(status_code=400, detail="Registration already checked in")

    registration.checked_in = True
    registration.checked_in_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(registration)

    return registration


# ==================== EVENT TICKETS ====================

@router.post("/{event_id}/tickets", response_model=EventTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_event_ticket(
        event_id: uuid.UUID,
        ticket_data: EventTicketCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a ticket type for an event"""

    # Verify event exists and belongs to organization
    event = db.query(Event).filter(
        and_(
            Event.id == event_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    ticket = EventTicket(
        id=uuid.uuid4(),
        event_id=event_id,
        quantity_sold=0,
        **ticket_data.model_dump()
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Add computed fields
    response = EventTicketResponse.model_validate(ticket)

    if ticket.quantity_available:
        response.tickets_remaining = max(0, ticket.quantity_available - (ticket.quantity_sold or 0))
        response.is_sold_out = response.tickets_remaining == 0

    now = datetime.now(timezone.utc)
    response.is_sale_active = (
            ticket.is_active and
            (ticket.sale_start is None or ticket.sale_start <= now) and
            (ticket.sale_end is None or ticket.sale_end >= now) and
            not response.is_sold_out
    )

    return response


@router.get("/{event_id}/tickets", response_model=List[EventTicketResponse])
async def list_event_tickets(
        event_id: uuid.UUID,
        active_only: bool = False,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """List all ticket types for an event"""

    # Verify event exists and belongs to organization
    event = db.query(Event).filter(
        and_(
            Event.id == event_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    query = db.query(EventTicket).filter(EventTicket.event_id == event_id)

    if active_only:
        query = query.filter(EventTicket.is_active == True)

    tickets = query.all()

    responses = []
    now = datetime.now(timezone.utc)

    for ticket in tickets:
        response = EventTicketResponse.model_validate(ticket)

        if ticket.quantity_available:
            response.tickets_remaining = max(0, ticket.quantity_available - (ticket.quantity_sold or 0))
            response.is_sold_out = response.tickets_remaining == 0

        response.is_sale_active = (
                ticket.is_active and
                (ticket.sale_start is None or ticket.sale_start <= now) and
                (ticket.sale_end is None or ticket.sale_end >= now) and
                not response.is_sold_out
        )

        responses.append(response)

    return responses


@router.put("/tickets/{ticket_id}", response_model=EventTicketResponse)
async def update_event_ticket(
        ticket_id: uuid.UUID,
        ticket_data: EventTicketUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Update a ticket type"""

    ticket = db.query(EventTicket).join(Event).filter(
        and_(
            EventTicket.id == ticket_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Update fields
    update_data = ticket_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)

    # Add computed fields
    response = EventTicketResponse.model_validate(ticket)

    if ticket.quantity_available:
        response.tickets_remaining = max(0, ticket.quantity_available - (ticket.quantity_sold or 0))
        response.is_sold_out = response.tickets_remaining == 0

    now = datetime.now(timezone.utc)
    response.is_sale_active = (
            ticket.is_active and
            (ticket.sale_start is None or ticket.sale_start <= now) and
            (ticket.sale_end is None or ticket.sale_end >= now) and
            not response.is_sold_out
    )

    return response


@router.delete("/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_ticket(
        ticket_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Delete a ticket type"""

    ticket = db.query(EventTicket).join(Event).filter(
        and_(
            EventTicket.id == ticket_id,
            Event.organization_id == current_user.organization_id
        )
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.quantity_sold and ticket.quantity_sold > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete ticket type with existing sales"
        )

    db.delete(ticket)
    db.commit()

    return None


# ==================== PUBLIC ENDPOINTS ====================

@router.get("/public/upcoming", response_model=List[PublicEventSummary])
async def get_public_upcoming_events(
        event_type: Optional[str] = None,
        limit: int = Query(10, ge=1, le=50),
        db: Session = Depends(get_db)
):
    """Get upcoming public events for landing page"""

    query = db.query(Event, Organization.name.label('organization_name')).join(
        Organization, Event.organization_id == Organization.id
    ).filter(
        and_(
            Event.is_public == True,
            Event.status == "active",
            Event.start_date >= datetime.now(timezone.utc)
        )
    )

    if event_type:
        query = query.filter(Event.event_type == event_type)

    events = query.order_by(Event.start_date.asc()).limit(limit).all()

    summaries = []
    for event, org_name in events:
        metrics = calculate_event_metrics(event)

        summary = PublicEventSummary(
            id=event.id,
            name=event.name,
            description=event.description,
            event_type=event.event_type,
            start_date=event.start_date,
            end_date=event.end_date,
            location=event.location,
            venue_address=event.venue_address,
            capacity=event.capacity,
            registered_count=event.registered_count,
            registration_fee=event.registration_fee,
            is_registration_open=metrics['is_registration_open'],
            days_until_event=metrics['days_until_event'],
            capacity_remaining=metrics['capacity_remaining'],
            occupancy_percentage=metrics['occupancy_percentage'],
            organization_name=org_name
        )
        summaries.append(summary)

    return summaries


@router.get("/public/{event_id}", response_model=PublicEventSummary)
async def get_public_event(
        event_id: uuid.UUID,
        db: Session = Depends(get_db)
):
    """Get a specific public event"""

    result = db.query(Event, Organization.name.label('organization_name')).join(
        Organization, Event.organization_id == Organization.id
    ).filter(
        and_(
            Event.id == event_id,
            Event.is_public == True
        )
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Event not found")

    event, org_name = result
    metrics = calculate_event_metrics(event)

    summary = PublicEventSummary(
        id=event.id,
        name=event.name,
        description=event.description,
        event_type=event.event_type,
        start_date=event.start_date,
        end_date=event.end_date,
        location=event.location,
        venue_address=event.venue_address,
        capacity=event.capacity,
        registered_count=event.registered_count,
        registration_fee=event.registration_fee,
        is_registration_open=metrics['is_registration_open'],
        days_until_event=metrics['days_until_event'],
        capacity_remaining=metrics['capacity_remaining'],
        occupancy_percentage=metrics['occupancy_percentage'],
        organization_name=org_name
    )

    return summary