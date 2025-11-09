# ===========================
# NEW: Pydantic models
# ===========================
from dateutil.relativedelta import relativedelta
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from database import get_db
#from services.major_gift_potential import compute_major_gift_potential
import models
from models import Donations as Donation
from pydantic import BaseModel, Field
from decimal import Decimal
from enum import Enum
from collections import defaultdict
import io
import csv


router = APIRouter(prefix="/api/v1/analytics", tags=["Donor Analytics"])

class AvgDonationResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    total_donations: float
    gift_count: int
    average_donation_amount: float  # Total Donations / Number of Gifts

class SimpleRateResponse(BaseModel):
    organization_id: str
    period_prev_label: str
    period_curr_label: str
    numerator: int
    denominator: int
    rate_percent: float

class CpdrResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    fundraising_expenses: float
    total_funds_raised: float
    cpdr: float  # Fundraising Expenses / Total Funds Raised

class AcquisitionCostResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    acquisition_expenses: float
    donors_acquired: int
    donor_acquisition_cost: float  # Total acquisition cost / # new donors

class AffinityDetail(BaseModel):
    donor_id: str
    donor_name: Optional[str]
    cause_alignment_score: float  # 0..1
    engagement_score: float       # 0..1 (events, volunteering, advocacy)
    affinity_score: float         # weighted blend 0..1
    signals: List[str] = []

class AffinityResponse(BaseModel):
    organization_id: str
    as_of_date: datetime
    weight_cause_alignment: float
    weight_engagement: float
    donors: List[AffinityDetail]
    summary: Dict[str, Any]

class CapacityDetail(BaseModel):
    donor_id: str
    donor_name: Optional[str]
    net_worth_estimate: Optional[float] = None
    real_estate_estimate: Optional[float] = None
    stock_estimate: Optional[float] = None
    political_giving_5y: Optional[float] = None
    capacity_score: float  # 0..1 after normalization
    notes: List[str] = []

class CapacityResponse(BaseModel):
    organization_id: str
    as_of_date: datetime
    donors: List[CapacityDetail]
    summary: Dict[str, Any]

class MajorGiftPotentialDetail(BaseModel):
    donor_id: str
    donor_name: Optional[str]
    affinity_score: float  # 0..1
    capacity_score: float  # 0..1
    mgp_score: float       # blended 0..1
    recommended_ask_floor: float
    rationale: List[str]

class MajorGiftPotentialResponse(BaseModel):
    organization_id: str
    as_of_date: datetime
    alpha_affinity: float
    alpha_capacity: float
    donors: List[MajorGiftPotentialDetail]

class FormulaLtvResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    average_donation_amount: float
    average_donation_frequency: float   # gifts per donor per year (or per period scaled annualized)
    average_donor_lifespan_years: float
    ltv: float  # lifespan * avg_amount * avg_frequency


# ===========================
# NEW: Helpers (safe getters)
# ===========================

def _safe_model(name: str):
    return getattr(models, name, None)

def _daterange_defaults(start: Optional[datetime], end: Optional[datetime]):
    if not end:
        end = datetime.now()
    if not start:
        # default = trailing 365 days
        start = end - timedelta(days=365)
    return start, end

def _period_label(start: datetime, end: datetime) -> str:
    return f"{start.date()}→{end.date()}"

def _normalize_0_1(value: float, vmin: float, vmax: float) -> float:
    if vmax <= vmin:
        return 0.0
    return max(0.0, min(1.0, (value - vmin) / (vmax - vmin)))


# ===========================
# NEW: Average Donation Amount
# ===========================

@router.get("/avg-donation/{organization_id}", response_model=AvgDonationResponse)
def get_average_donation_amount(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Average Donation Amount = Total Donations / Number of Gifts
    """
    start, end = _daterange_defaults(start, end)

    total = db.query(func.coalesce(func.sum(models.Donation.amount), 0.0)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= start,
        models.Donation.donation_date < end
    ).scalar() or 0.0

    count = db.query(func.count(models.Donation.id)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= start,
        models.Donation.donation_date < end
    ).scalar() or 0

    avg_amt = float(total) / count if count > 0 else 0.0

    return AvgDonationResponse(
        organization_id=organization_id,
        start=start, end=end,
        total_donations=float(total),
        gift_count=int(count),
        average_donation_amount=round(avg_amt, 2)
    )


# ===========================
# NEW: CPDR
# ===========================

@router.get("/cpdr/{organization_id}", response_model=CpdrResponse)
def get_cpdr(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    CPDR = Fundraising Expenses / Total Funds Raised
    Expected optional model: models.FundraisingExpense(amount, date, organization_id).
    If not present, cpdr=0 unless funds_raised=0.
    """
    start, end = _daterange_defaults(start, end)

    Expense = _safe_model("FundraisingExpense")
    fundraising_expenses = 0.0
    if Expense:
        fundraising_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
            Expense.organization_id == organization_id,
            Expense.date >= start, Expense.date < end
        ).scalar() or 0.0

    funds_raised = db.query(func.coalesce(func.sum(models.Donation.amount), 0.0)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= start, models.Donation.donation_date < end
    ).scalar() or 0.0

    cpdr = (float(fundraising_expenses) / float(funds_raised)) if funds_raised > 0 else 0.0

    return CpdrResponse(
        organization_id=organization_id,
        start=start, end=end,
        fundraising_expenses=round(float(fundraising_expenses), 2),
        total_funds_raised=round(float(funds_raised), 2),
        cpdr=round(cpdr, 4)
    )


# ===========================
# NEW: Donor Acquisition Cost
# ===========================

@router.get("/acquisition-cost/{organization_id}", response_model=AcquisitionCostResponse)
def get_donor_acquisition_cost(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Donor Acquisition Cost = Total cost to acquire / # of new donors in period
    Expected optional models:
      - models.MarketingSpend(category='acquisition', amount, date, organization_id)
    """
    start, end = _daterange_defaults(start, end)

    # New donors in period = donors whose FIRST gift falls within [start, end)
    first_gifts_subq = db.query(
        models.Donation.party_id,
        func.min(models.Donation.donation_date).label("first_gift")
    ).filter(
        models.Donation.organization_id == organization_id
    ).group_by(models.Donation.party_id).subquery()

    new_donors_count = db.query(func.count()).filter(
        first_gifts_subq.c.first_gift >= start,
        first_gifts_subq.c.first_gift < end
    ).scalar() or 0

    MarketingSpend = _safe_model("MarketingSpend")
    acquisition_expenses = 0.0
    if MarketingSpend:
        acquisition_expenses = db.query(func.coalesce(func.sum(MarketingSpend.amount), 0.0)).filter(
            MarketingSpend.organization_id == organization_id,
            MarketingSpend.date >= start, MarketingSpend.date < end,
            or_(getattr(MarketingSpend, "category", None) == "acquisition", True if not hasattr(MarketingSpend, "category") else False)
        ).scalar() or 0.0

    dac = (float(acquisition_expenses) / new_donors_count) if new_donors_count > 0 else 0.0

    return AcquisitionCostResponse(
        organization_id=organization_id,
        start=start, end=end,
        acquisition_expenses=round(float(acquisition_expenses), 2),
        donors_acquired=int(new_donors_count),
        donor_acquisition_cost=round(dac, 2)
    )


# ===========================
# NEW: Retention & Lapsed Rates
# ===========================

@router.get("/retention-rate/{organization_id}", response_model=SimpleRateResponse)
def get_retention_rate(
    organization_id: str,
    prev_start: datetime, prev_end: datetime,
    curr_start: datetime, curr_end: datetime,
    db: Session = Depends(get_db)
):
    """
    Retention Rate = (# donors who gave in BOTH periods) / (# donors in previous period) * 100
    """
    pre:v_donors = db.query(func.distinct(models.Donation.party_id)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= prev_start, models.Donation.donation_date < prev_end
    ).subquery()

    curr_donors = db.query(func.distinct(models.Donation.party_id)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= curr_start, models.Donation.donation_date < curr_end
    ).subquery()

    prev_count = db.query(func.count()).select_from(prev_donors).scalar() or 0
    both_count = db.query(func.count()).filter(
        models.Donation.party_id.in_(db.query(curr_donors))
    ).select_from(prev_donors).scalar()  # safe: any scalar() call returns int

    # Workaround for cross-subquery: fetch IDs explicitly
    prev_ids = [r[0] for r in db.query(prev_donors).all()]
    curr_ids = set([r[0] for r in db.query(curr_donors).all()])
    both = len([pid for pid in prev_ids if pid in curr_ids])

    rate = (both / prev_count * 100.0) if prev_count > 0 else 0.0
    return SimpleRateResponse(
        organization_id=organization_id,
        period_prev_label=_period_label(prev_start, prev_end),
        period_curr_label=_period_label(curr_start, curr_end),
        numerator=both,
        denominator=prev_count,
        rate_percent=round(rate, 2)
    )

@router.get("/lapsed-rate/{organization_id}", response_model=SimpleRateResponse)
def get_lapsed_rate(
    organization_id: str,
    prev_start: datetime, prev_end: datetime,
    curr_start: datetime, curr_end: datetime,
    db: Session = Depends(get_db)
):
    """
    Lapsed Donor Rate = (# donors who STOPPED giving) / (total donors in previous period) * 100
    Stopped = present in previous, absent in current.
    """
    prev_ids = {r[0] for r in db.query(func.distinct(models.Donation.party_id)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= prev_start, models.Donation.donation_date < prev_end
    ).all()}

    curr_ids = {r[0] for r in db.query(func.distinct(models.Donation.party_id)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= curr_start, models.Donation.donation_date < curr_end
    ).all()}

    prev_count = len(prev_ids)
    lapsed = len(prev_ids - curr_ids)
    rate = (lapsed / prev_count * 100.0) if prev_count > 0 else 0.0

    return SimpleRateResponse(
        organization_id=organization_id,
        period_prev_label=_period_label(prev_start, prev_end),
        period_curr_label=_period_label(curr_start, curr_end),
        numerator=lapsed,
        denominator=prev_count,
        rate_percent=round(rate, 2)
    )


# ===========================
# NEW: Affinity to Give
# ===========================

@router.get("/affinity/{organization_id}", response_model=AffinityResponse)
def get_affinity_to_give(
    organization_id: str,
    weight_cause_alignment: float = Query(0.6, ge=0.0, le=1.0),
    weight_engagement: float = Query(0.4, ge=0.0, le=1.0),
    min_gifts_to_include: int = Query(1, ge=0),
    db: Session = Depends(get_db)
):
    """
    Affinity blends:
      - Cause alignment: overlap between donor interests & your program/cause tags (0..1)
      - Engagement: events attended, volunteer hours, advocacy actions normalized (0..1)
    Expected optional models:
      DonorInterestTag(party_id, tag), ProgramTag(program_id, tag), EventAttendance(party_id, ...),
      VolunteerShift(party_id, hours), AdvocacyAction(party_id, ...)

    Fallback:
      - Cause alignment = 0 if interest/tag tables absent
      - Engagement = scaled from donation recency & count if event/volunteer tables absent
    """
    now = datetime.now()
    print("Donation columns:", [c.name for c in Donation.__table__.columns])
    #Donation = models.Donation

    # Base donor population (at least min gifts)
    donors = db.query(
        models.Party.id, models.Party.display_name,
        func.count(Donation.id).label("gift_count"),
        func.max(Donation.donation_date).label("last_gift")
    ).join(Donation, models.Party.id == Donation.party_id
    ).filter(
        models.Party.organization_id == organization_id
    ).group_by(models.Party.id, models.Party.display_name
    ).having(func.count(Donation.id) >= min_gifts_to_include).all()

    # Optional tables
    DonorInterestTag = _safe_model("DonorInterestTag")
    ProgramTag = _safe_model("ProgramTag")
    EventAttendance = _safe_model("EventAttendance")
    VolunteerShift = _safe_model("VolunteerShift")
    AdvocacyAction = _safe_model("AdvocacyAction")

    # Preload tag universe for alignment (if available)
    donor_tags = defaultdict(set)
    program_tags = set()
    if DonorInterestTag:
        for pid, tag in db.query(DonorInterestTag.party_id, DonorInterestTag.tag).all():
            donor_tags[str(pid)].add(tag)
    if ProgramTag:
        for tag, in db.query(ProgramTag.tag).distinct():
            program_tags.add(tag)

    # Engagement histograms (if available)
    evt_counts = defaultdict(int)
    vol_hours = defaultdict(float)
    adv_counts = defaultdict(int)

    if EventAttendance:
        for pid, cnt in db.query(EventAttendance.party_id, func.count(EventAttendance.id)).group_by(EventAttendance.party_id):
            evt_counts[str(pid)] = cnt
    if VolunteerShift:
        for pid, hrs in db.query(VolunteerShift.party_id, func.coalesce(func.sum(VolunteerShift.hours), 0.0)).group_by(VolunteerShift.party_id):
            vol_hours[str(pid)] = float(hrs or 0.0)
    if AdvocacyAction:
        for pid, cnt in db.query(AdvocacyAction.party_id, func.count(AdvocacyAction.id)).group_by(AdvocacyAction.party_id):
            adv_counts[str(pid)] = cnt

    # Determine normalization ranges
    max_evt = max(evt_counts.values(), default=0)
    max_hrs = max(vol_hours.values(), default=0.0)
    max_adv = max(adv_counts.values(), default=0)

    details: List[AffinityDetail] = []
    for pid, name, gcount, last_gift in donors:
        pid_str = str(pid)
        signals = []

        # Cause alignment (Jaccard overlap vs program tags)
        if DonorInterestTag and ProgramTag and donor_tags.get(pid_str) and program_tags:
            inter = len(donor_tags[pid_str] & program_tags)
            union = len(donor_tags[pid_str] | program_tags)
            cause_align = (inter / union) if union > 0 else 0.0
            if inter > 0:
                signals.append(f"Interest tags overlap: {inter}")
        else:
            cause_align = 0.0

        # Engagement score from optional tables; fallback to recency+count if none
        if (EventAttendance or VolunteerShift or AdvocacyAction):
            e = 0.0
            if max_evt > 0:
                e += _normalize_0_1(evt_counts.get(pid_str, 0), 0, max_evt)
            if max_hrs > 0:
                e += _normalize_0_1(vol_hours.get(pid_str, 0.0), 0.0, max_hrs)
            if max_adv > 0:
                e += _normalize_0_1(adv_counts.get(pid_str, 0), 0, max_adv)
            engagement = e / max(1, sum([max_evt > 0, max_hrs > 0, max_adv > 0]))
        else:
            # Fallback: recent giving + frequency (simple scaler)
            days = (now - (last_gift or now)).days
            recency = 1.0 if days <= 30 else 0.75 if days <= 90 else 0.5 if days <= 180 else 0.25 if days <= 365 else 0.0
            freq = 1.0 if gcount >= 6 else 0.8 if gcount >= 4 else 0.6 if gcount >= 2 else 0.4
            engagement = (recency * 0.6 + freq * 0.4)

        affinity = weight_cause_alignment * cause_align + weight_engagement * engagement
        details.append(AffinityDetail(
            donor_id=str(pid),
            donor_name=name,
            cause_alignment_score=round(cause_align, 3),
            engagement_score=round(engagement, 3),
            affinity_score=round(affinity, 3),
            signals=signals
        ))

    details.sort(key=lambda d: d.affinity_score, reverse=True)

    return AffinityResponse(
        organization_id=organization_id,
        as_of_date=datetime.now(),
        weight_cause_alignment=weight_cause_alignment,
        weight_engagement=weight_engagement,
        donors=details,
        summary={
            "donor_count": len(details),
            "avg_affinity": round(sum(d.affinity_score for d in details) / max(1, len(details)), 3)
        }
    )


# ===========================
# NEW: Capacity to Give
# ===========================

@router.get("/capacity/{organization_id}", response_model=CapacityResponse)
def get_capacity_to_give(
    organization_id: str,
    db: Session = Depends(get_db)
):
    """
    Capacity is estimated from wealth indicators (normalized 0..1):
      net_worth, real_estate, stock_holdings, political_giving (last 5y).
    Expected optional model: DonorWealth(party_id, net_worth, real_estate, stock, political_5y).
    """
    DonorWealth = _safe_model("DonorWealth")
    if not DonorWealth:
        # Fallback: no wealth data -> empty set
        return CapacityResponse(
            organization_id=organization_id,
            as_of_date=datetime.now(),
            donors=[],
            summary={"note": "No DonorWealth model found; capacity cannot be computed."}
        )

    recs = db.query(
        DonorWealth.party_id,
        func.coalesce(DonorWealth.net_worth, 0.0),
        func.coalesce(DonorWealth.real_estate, 0.0),
        func.coalesce(DonorWealth.stock, 0.0),
        func.coalesce(DonorWealth.political_5y, 0.0),
        models.Party.display_name
    ).join(models.Party, models.Party.id == DonorWealth.party_id
    ).filter(models.Party.organization_id == organization_id).all()

    # Compute ranges
    nw_vals = [float(r[1]) for r in recs]
    re_vals = [float(r[2]) for r in recs]
    st_vals = [float(r[3]) for r in recs]
    pg_vals = [float(r[4]) for r in recs]

    def rng(vals): 
        return (min(vals) if vals else 0.0, max(vals) if vals else 0.0)

    nw_min, nw_max = rng(nw_vals); re_min, re_max = rng(re_vals)
    st_min, st_max = rng(st_vals); pg_min, pg_max = rng(pg_vals)

    details = []
    for party_id, nw, re, st, pg, name in recs:
        s_nw = _normalize_0_1(float(nw), nw_min, nw_max)
        s_re = _normalize_0_1(float(re), re_min, re_max)
        s_st = _normalize_0_1(float(st), st_min, st_max)
        s_pg = _normalize_0_1(float(pg), pg_min, pg_max)
        # Weighted capacity (tuneable)
        cap = 0.5*s_nw + 0.2*s_re + 0.2*s_st + 0.1*s_pg
        details.append(CapacityDetail(
            donor_id=str(party_id),
            donor_name=name,
            net_worth_estimate=float(nw),
            real_estate_estimate=float(re),
            stock_estimate=float(st),
            political_giving_5y=float(pg),
            capacity_score=round(cap, 3),
            notes=[]
        ))

    details.sort(key=lambda d: d.capacity_score, reverse=True)
    return CapacityResponse(
        organization_id=organization_id,
        as_of_date=datetime.now(),
        donors=details,
        summary={
            "donor_count": len(details),
            "avg_capacity": round(sum(d.capacity_score for d in details)/max(1, len(details)), 3)
        }
    )


# ===========================
# NEW: Major Gift Potential (capacity ⨉ affinity)
# ===========================

#@router.get("/major-gift-potential/{organization_id}", response_model=MajorGiftPotentialResponse)
#def get_major_gift_potential(
#    organization_id: str,
#    alpha_affinity: float = Query(0.5, ge=0.0, le=1.0),
#    alpha_capacity: float = Query(0.5, ge=0.0, le=1.0),
#    db: Session = Depends(get_db)
#):
    """
    Major Gift Potential = blend of Affinity & Capacity (0..1).
    Recommended ask floor scales non-linearly with capacity.
    """
    # Reuse the above calculators in-process
 #   aff = get_affinity_to_give(organization_id, db=db).donors
  #  cap = get_capacity_to_give(organization_id, db=db).donors

#    cap_by_id = {d.donor_id: d for d in cap}
#    donors: List[MajorGiftPotentialDetail] = []

 #   for a in aff:
 #       c = cap_by_id.get(a.donor_id)
 #       if not c:
 #           # Skip if no capacity; you can also choose to include with capacity=0
  #          continue
        # Weighted sum (or use geometric mean). Keep it simple & tunable:
   #     mgp = alpha_affinity * a.affinity_score + alpha_capacity * c.capacity_score

        # Ask floor heuristic: $2,500 at 0.2 capacity, $10k at 0.6, $25k+ near 1.0
    #    ask_floor = 2500.0 + (c.capacity_score ** 1.5) * 40000.0

     #   donors.append(MajorGiftPotentialDetail(
      #      donor_id=a.donor_id,
       #     donor_name=a.donor_name,
        #    affinity_score=a.affinity_score,
         #   capacity_score=c.capacity_score,
          #  mgp_score=round(mgp, 3),
           # recommended_ask_floor=round(ask_floor, 0),
           # rationale=[
            #    f"Affinity {a.affinity_score:.2f} (engagement/interest)",
            #    f"Capacity {c.capacity_score:.2f} (wealth indicators)"
            #]
       # ))

    #donors.sort(key=lambda d: d.mgp_score, reverse=True)
    #return MajorGiftPotentialResponse(
     #   organization_id=organization_id,
      #  as_of_date=datetime.now(),
       # alpha_affinity=alpha_affinity,
        #alpha_capacity=alpha_capacity,
        #donors=donors
    #)

    """
@router.get(
    "/major-gift-potential/{organization_id}",
    response_model=MajorGiftPotentialResponse
)
def get_major_gift_potential(
    organization_id: str,
    alpha_affinity: float = Query(0.5, ge=0.0, le=1.0),
    alpha_capacity: float = Query(0.5, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
):
    # Pass only primitives into the pure function
    payload = compute_major_gift_potential(
        org_id=organization_id,
        alpha_affinity=alpha_affinity,
        alpha_capacity=alpha_capacity,
        db=db,
    )
    return payload
"""

# ===========================
# NEW: Formula LTV (period-aware)
# ===========================

@router.get("/ltv-formula/{organization_id}", response_model=FormulaLtvResponse)
def get_ltv_formula(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    assumed_avg_lifespan_years: float = Query(5.0, gt=0.0),
    db: Session = Depends(get_db)
):
    """
    LTV = Average Donor Lifespan × Average Donation Amount × Average Donation Frequency
    - Average Donation Amount: from gifts within [start, end)
    - Average Donation Frequency: gifts per donor per year; if period != 1y, scale to annualized
    - Average Donor Lifespan: configurable (default 5 years) or computable from first/last gift data
    """
    start, end = _daterange_defaults(start, end)
    period_days = max(1, (end - start).days)
    scale_to_year = 365.25 / period_days

    # Average donation amount
    total_amt = db.query(func.coalesce(func.sum(models.Donation.amount), 0.0)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= start, models.Donation.donation_date < end
    ).scalar() or 0.0

    gift_count = db.query(func.count(models.Donation.id)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= start, models.Donation.donation_date < end
    ).scalar() or 0

    avg_amt = float(total_amt) / gift_count if gift_count > 0 else 0.0

    # Average donation frequency (per donor, annualized)
    donor_gift_counts = db.query(
        models.Donation.party_id, func.count(models.Donation.id)
    ).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= start, models.Donation.donation_date < end
    ).group_by(models.Donation.party_id).all()

    donors_in_period = len(donor_gift_counts)
    avg_freq_period = (sum(c for _, c in donor_gift_counts) / donors_in_period) if donors_in_period > 0 else 0.0
    avg_freq_annualized = avg_freq_period * scale_to_year

    # Lifespan (use parameter; could also compute median tenure from first/last gifts across donors)
    lifespan_years = assumed_avg_lifespan_years

    ltv = lifespan_years * avg_amt * avg_freq_annualized

    return FormulaLtvResponse(
        organization_id=organization_id,
        start=start, end=end,
        average_donation_amount=round(avg_amt, 2),
        average_donation_frequency=round(avg_freq_annualized, 3),
        average_donor_lifespan_years=round(lifespan_years, 2),
        ltv=round(ltv, 2)
    )

