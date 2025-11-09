@app.get("/payments", response_model=List[schemas.Payment], tags=["Payment"])
def list_payments(
        donation_id: Optional[UUID] = None,
        status: Optional[str] = None,
        db: Session = Depends(get_db),
        token: str = Depends(verify_token)
):
    query = db.query(models.Payment)
    if donation_id:
        query = query.filter(models.Payment.donation_id == donation_id)
    if status:
        query = query.filter(models.Payment.status == status)
    return query.all()

@app.post("/payments", response_model=schemas.Payment, status_code=status.HTTP_201_CREATED, tags=["Payment"])
def create_payment(
        payment: schemas.PaymentCreate,
        db: Session = Depends(get_db),
        token: str = Depends(verify_token)
):
    db_payment = models.Payment(**payment.dict())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@app.get("/payments/{id}", response_model=schemas.Payment, tags=["Payment"])
def get_payment(
        id: UUID,
        db: Session = Depends(get_db),
        token: str = Depends(verify_token)
):
    payment = db.query(models.Payment).filter(models.Payment.id == id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@app.put("/payments/{id}", response_model=schemas.Payment, tags=["Payment"])
def update_payment(
        id: UUID,
        payment: schemas.PaymentUpdate,
        db: Session = Depends(get_db),
        token: str = Depends(verify_token)
):
    db_payment = db.query(models.Payment).filter(models.Payment.id == id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    for key, value in payment.dict(exclude_unset=True).items():
        setattr(db_payment, key, value)

    db.commit()
    db.refresh(db_payment)
    return db_payment
