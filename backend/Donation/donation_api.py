from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
from database import get_db, engine
from models import Donations as Donation
import schemas
from user_management.auth_dependencies import decode_token

@app.get("/donations", response_model=List[schemas.Donation], tags=["Donation"])
def list_donations(
        organization_id: Optional[UUID] = None,
        party_id: Optional[UUID] = None,
        campaign_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        db: Session = Depends(get_db),
        token: str = Depends(decode_token)
):
    query = db.query(Donation)
    if organization_id:
        query = query.filter(Donation.organization_id == organization_id)
    if party_id:
        query = query.filter(Donation.party_id == party_id)
    if start_date:
        query = query.filter(Donation.donation_date >= start_date)
    if end_date:
        query = query.filter(Donation.donation_date <= end_date)
    return query.all()

@app.post("/donations", response_model=schemas.Donation, status_code=status.HTTP_201_CREATED, tags=["Donation"])
def create_donation(
        donation: schemas.DonationCreate,
        db: Session = Depends(get_db),
        token: str = Depends(decode_token)
):
    db_donation = Donation(**donation.dict())
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    return db_donation

@app.get("/donations/{id}", response_model=schemas.Donation, tags=["Donation"])
def get_donation(
        id: UUID,
        db: Session = Depends(get_db),
        token: str = Depends(decode_token)
):
    donation = db.query(Donation).filter(Donation.id == id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation

@app.put("/donations/{id}", response_model=schemas.Donation, tags=["Donation"])
def update_donation(
        id: UUID,
        donation: schemas.DonationUpdate,
        db: Session = Depends(get_db),
        token: str = Depends(verify_token)
):
    db_donation = db.query(Donation).filter(Donation.id == id).first()
    if not db_donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    for key, value in donation.dict(exclude_unset=True).items():
        setattr(db_donation, key, value)

    db.commit()
    db.refresh(db_donation)
    return db_donation
