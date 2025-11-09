"""
Enhanced Analytics Router with Time-Based Filtering
Adds support for monthly, yearly, and weekly analytics views
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, case, desc
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional, Literal
from decimal import Decimal
import jwt
from jwt import PyJWTError, ExpiredSignatureError
from database import get_db
from models import Organizations as Organization, Users as User, Donations as Donation, Donors as Donor, Programs as Program

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics with Time Filtering"])

# Production Authentication
SECRET_KEY = "IfGoOOnglgp65RIbY3pfx8E787Nute-_3Wkv6lCvEKlhC0oLmavChErNr-EtvRNEntHYt15mblG4tn9nJK0zsg"
ALGORITHM = "HS256"


def get_current_user(
        authorization: str = Header(..., description="Bearer token"),
        db: Session = Depends(get_db)
) -> User:
    """Production JWT authentication"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        if not authorization.startswith("Bearer "):
            raise credentials_exception
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


def verify_organization_access(user: User, organization_id: UUID) -> None:
    """Verify user has access to the requested organization"""
    if user.is_superadmin:
        return
    if user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this organization's data"
        )


def calculate_date_range(
        period_type: str = "year",
        year: Optional[int] = None,
        month: Optional[int] = None,
        week: Optional[int] = None
):
    """
    Calculate start and end dates based on period type

    Args:
        period_type: 'year', 'month', 'week', 'ytd', 'custom'
        year: Specific year (defaults to current)
        month: Specific month (1-12)
        week: Specific week number (1-52)

    Returns:
        tuple: (start_date, end_date, period_label)
    """
    now = datetime.now()
    current_year = year or now.year

    if period_type == "year":
        start_date = datetime(current_year, 1, 1)
        end_date = datetime(current_year, 12, 31, 23, 59, 59)
        period_label = f"Year {current_year}"

    elif period_type == "ytd":
        start_date = datetime(current_year, 1, 1)
        end_date = now
        period_label = f"YTD {current_year}"

    elif period_type == "month":
        month = month or now.month
        start_date = datetime(current_year, month, 1)
        # Calculate last day of month
        if month == 12:
            end_date = datetime(current_year, 12, 31, 23, 59, 59)
        else:
            end_date = datetime(current_year, month + 1, 1) - timedelta(seconds=1)
        period_label = start_date.strftime("%B %Y")

    elif period_type == "week":
        # Calculate week start (Monday)
        week_num = week or now.isocalendar()[1]
        start_date = datetime.strptime(f'{current_year}-W{week_num}-1', "%Y-W%W-%w")
        end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
        period_label = f"Week {week_num}, {current_year}"

    elif period_type == "quarter":
        # Determine quarter
        quarter = ((now.month - 1) // 3) + 1
        start_month = (quarter - 1) * 3 + 1
        start_date = datetime(current_year, start_month, 1)
        end_month = start_month + 2
        if end_month == 12:
            end_date = datetime(current_year, 12, 31, 23, 59, 59)
        else:
            end_date = datetime(current_year, end_month + 1, 1) - timedelta(seconds=1)
        period_label = f"Q{quarter} {current_year}"

    elif period_type == "last30days":
        end_date = now
        start_date = now - timedelta(days=30)
        period_label = "Last 30 Days"

    elif period_type == "last90days":
        end_date = now
        start_date = now - timedelta(days=90)
        period_label = "Last 90 Days"

    else:  # default to YTD
        start_date = datetime(current_year, 1, 1)
        end_date = now
        period_label = f"YTD {current_year}"

    return start_date, end_date, period_label


# =====================================================================
# EXECUTIVE DASHBOARD WITH TIME FILTERING
# =====================================================================

@router.get("/executive-dashboard-filtered/{organization_id}")
async def get_executive_dashboard_filtered(
        organization_id: UUID,
        period_type: str = Query("ytd", description="Period type: year, ytd, month, week, quarter, last30days, last90days"),
        year: Optional[int] = Query(None, description="Specific year (defaults to current)"),
        month: Optional[int] = Query(None, description="Specific month (1-12)"),
        week: Optional[int] = Query(None, description="Specific week number (1-52)"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Executive Dashboard with Time Filtering

    Examples:
    - Current year: ?period_type=year
    - Specific year: ?period_type=year&year=2024
    - YTD: ?period_type=ytd
    - Specific month: ?period_type=month&month=6&year=2024
    - Specific week: ?period_type=week&week=25&year=2024
    - Quarter: ?period_type=quarter
    - Last 30 days: ?period_type=last30days
    """
    verify_organization_access(current_user, organization_id)

    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Calculate date range
    start_date, end_date, period_label = calculate_date_range(period_type, year, month, week)

    # Total Revenue for period
    total_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date
    ).scalar() or 0

    # Total Donors
    total_donors = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == organization_id
    ).scalar() or 0

    # Active Donors (donated in period)
    active_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date
    ).scalar() or 0

    # Average Gift Size
    avg_gift = db.query(func.avg(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date
    ).scalar() or 0

    # Number of donations in period
    donation_count = db.query(func.count(Donation.id)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date
    ).scalar() or 0

    # Donor Retention Rate (compare with previous period)
    period_days = (end_date - start_date).days
    prev_start = start_date - timedelta(days=period_days)
    prev_end = start_date - timedelta(seconds=1)

    prev_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= prev_start,
        Donation.donation_date <= prev_end
    ).scalar() or 1

    retained_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date,
        Donation.donor_id.in_(
            db.query(Donation.donor_id).filter(
                Donation.organization_id == organization_id,
                Donation.donation_date >= prev_start,
                Donation.donation_date <= prev_end
            )
        )
    ).scalar() or 0

    retention_rate = (retained_donors / prev_donors * 100) if prev_donors > 0 else 0

    # Compare with previous period
    prev_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= prev_start,
        Donation.donation_date <= prev_end
    ).scalar() or 0

    revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0

    return {
        "organization_id": str(organization_id),
        "organization_name": organization.name,
        "period": {
            "type": period_type,
            "label": period_label,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "key_metrics": {
            "total_revenue": float(total_revenue),
            "total_donors": total_donors,
            "active_donors": active_donors,
            "donation_count": donation_count,
            "donor_retention_rate": round(retention_rate, 1),
            "avg_gift_size": round(float(avg_gift), 2)
        },
        "comparisons": {
            "previous_period_revenue": float(prev_revenue),
            "revenue_growth_percent": round(revenue_growth, 1),
            "previous_period_donors": prev_donors,
            "retained_donors": retained_donors
        },
        "health_indicators": {
            "fundraising_health": "Excellent" if total_revenue > 1000000 else "Good" if total_revenue > 500000 else "Needs Attention",
            "donor_pipeline": "Healthy" if retention_rate > 60 else "Needs Improvement",
            "donor_engagement": "Strong" if active_donors > 100 else "Moderate" if active_donors > 50 else "Low"
        }
    }


# =====================================================================
# REVENUE TRENDS WITH TIME FILTERING
# =====================================================================

@router.get("/revenue-trends/{organization_id}")
async def get_revenue_trends(
        organization_id: UUID,
        period_type: str = Query("month", description="Breakdown by: month, week, day, quarter"),
        year: Optional[int] = Query(None, description="Specific year (defaults to current)"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get revenue trends broken down by time period

    Examples:
    - Monthly breakdown: ?period_type=month
    - Weekly breakdown: ?period_type=week
    - Daily breakdown: ?period_type=day
    - Quarterly breakdown: ?period_type=quarter
    """
    verify_organization_access(current_user, organization_id)

    year = year or datetime.now().year
    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31, 23, 59, 59)

    if period_type == "month":
        # Group by month
        query = db.query(
            extract('month', Donation.donation_date).label('period'),
            extract('year', Donation.donation_date).label('year'),
            func.sum(Donation.amount).label('revenue'),
            func.count(Donation.id).label('count'),
            func.count(func.distinct(Donation.donor_id)).label('donors')
        ).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= start_date,
            Donation.donation_date <= end_date
        ).group_by('year', 'period').order_by('year', 'period')

        results = query.all()
        data = []
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        for row in results:
            data.append({
                "period": month_names[int(row.period) - 1],
                "period_num": int(row.period),
                "year": int(row.year),
                "revenue": float(row.revenue or 0),
                "donation_count": int(row.count),
                "unique_donors": int(row.donors)
            })

    elif period_type == "week":
        # Group by week
        query = db.query(
            extract('week', Donation.donation_date).label('period'),
            extract('year', Donation.donation_date).label('year'),
            func.sum(Donation.amount).label('revenue'),
            func.count(Donation.id).label('count'),
            func.count(func.distinct(Donation.donor_id)).label('donors')
        ).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= start_date,
            Donation.donation_date <= end_date
        ).group_by('year', 'period').order_by('year', 'period')

        results = query.all()
        data = [{
            "period": f"Week {int(row.period)}",
            "period_num": int(row.period),
            "year": int(row.year),
            "revenue": float(row.revenue or 0),
            "donation_count": int(row.count),
            "unique_donors": int(row.donors)
        } for row in results]

    elif period_type == "quarter":
        # Group by quarter
        query = db.query(
            case(
                (extract('month', Donation.donation_date) <= 3, 1),
                (extract('month', Donation.donation_date) <= 6, 2),
                (extract('month', Donation.donation_date) <= 9, 3),
                else_=4
            ).label('period'),
            extract('year', Donation.donation_date).label('year'),
            func.sum(Donation.amount).label('revenue'),
            func.count(Donation.id).label('count'),
            func.count(func.distinct(Donation.donor_id)).label('donors')
        ).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= start_date,
            Donation.donation_date <= end_date
        ).group_by('year', 'period').order_by('year', 'period')

        results = query.all()
        data = [{
            "period": f"Q{int(row.period)}",
            "period_num": int(row.period),
            "year": int(row.year),
            "revenue": float(row.revenue or 0),
            "donation_count": int(row.count),
            "unique_donors": int(row.donors)
        } for row in results]

    else:  # day
        # Group by day (limited to last 90 days to avoid too much data)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)

        query = db.query(
            func.date(Donation.donation_date).label('period'),
            func.sum(Donation.amount).label('revenue'),
            func.count(Donation.id).label('count'),
            func.count(func.distinct(Donation.donor_id)).label('donors')
        ).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= start_date,
            Donation.donation_date <= end_date
        ).group_by('period').order_by('period')

        results = query.all()
        data = [{
            "period": str(row.period),
            "revenue": float(row.revenue or 0),
            "donation_count": int(row.count),
            "unique_donors": int(row.donors)
        } for row in results]

    return {
        "organization_id": str(organization_id),
        "period_type": period_type,
        "year": year,
        "data": data,
        "summary": {
            "total_revenue": sum(d["revenue"] for d in data),
            "total_donations": sum(d["donation_count"] for d in data),
            "avg_revenue_per_period": sum(d["revenue"] for d in data) / len(data) if data else 0
        }
    }


# =====================================================================
# DONOR LIFECYCLE WITH TIME FILTERING
# =====================================================================

@router.get("/donor-lifecycle-filtered/{organization_id}")
async def get_donor_lifecycle_filtered(
        organization_id: UUID,
        period_type: str = Query("ytd", description="Period type: year, ytd, month, week, quarter"),
        year: Optional[int] = Query(None),
        month: Optional[int] = Query(None),
        week: Optional[int] = Query(None),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get donor lifecycle metrics for a specific time period"""
    verify_organization_access(current_user, organization_id)

    start_date, end_date, period_label = calculate_date_range(period_type, year, month, week)

    # Get donors by status in the period
    donors_by_status = db.query(
        Donor.donor_status,
        func.count(Donor.id).label('count')
    ).filter(
        Donor.organization_id == organization_id
    ).group_by(Donor.donor_status).all()

    # Get new donors in period (first donation in this period)
    new_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date,
        Donation.donor_id.notin_(
            db.query(Donation.donor_id).filter(
                Donation.organization_id == organization_id,
                Donation.donation_date < start_date
            )
        )
    ).scalar() or 0

    # Get recurring donors in period (2+ donations)
    recurring_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date,
        Donation.donor_id.in_(
            db.query(Donation.donor_id).filter(
                Donation.organization_id == organization_id,
                Donation.donation_date >= start_date,
                Donation.donation_date <= end_date
            ).group_by(Donation.donor_id).having(func.count(Donation.id) > 1)
        )
    ).scalar() or 0

    lifecycle_data = {
        status: count for status, count in donors_by_status
    }

    return {
        "organization_id": str(organization_id),
        "period": {
            "type": period_type,
            "label": period_label,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "lifecycle_stages": lifecycle_data,
        "period_metrics": {
            "new_donors": new_donors,
            "recurring_donors": recurring_donors,
            "total_active": lifecycle_data.get('active', 0)
        }
    }


# =====================================================================
# FUNDRAISING VITALS WITH TIME FILTERING
# =====================================================================

@router.get("/fundraising-vitals-filtered/{organization_id}")
async def get_fundraising_vitals_filtered(
        organization_id: UUID,
        period_type: str = Query("ytd", description="Period type: year, ytd, month, week, quarter"),
        year: Optional[int] = Query(None),
        month: Optional[int] = Query(None),
        week: Optional[int] = Query(None),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get fundraising vitals for a specific time period"""
    verify_organization_access(current_user, organization_id)

    start_date, end_date, period_label = calculate_date_range(period_type, year, month, week)

    # Total raised in period
    total_raised = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date
    ).scalar() or 0

    # Average gift
    avg_gift = db.query(func.avg(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date
    ).scalar() or 0

    # Donation count
    donation_count = db.query(func.count(Donation.id)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date
    ).scalar() or 0

    # Unique donors
    unique_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date
    ).scalar() or 0

    # Online vs Offline (assuming payment_method field)
    online_donations = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= start_date,
        Donation.donation_date <= end_date,
        Donation.payment_method.in_(['credit_card', 'paypal', 'online'])
    ).scalar() or 0

    # Compare with previous period
    period_days = (end_date - start_date).days
    prev_start = start_date - timedelta(days=period_days)
    prev_end = start_date - timedelta(seconds=1)

    prev_raised = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= prev_start,
        Donation.donation_date <= prev_end
    ).scalar() or 0

    growth_rate = ((total_raised - prev_raised) / prev_raised * 100) if prev_raised > 0 else 0

    return {
        "organization_id": str(organization_id),
        "period": {
            "type": period_type,
            "label": period_label,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "vitals": {
            "total_raised": float(total_raised),
            "donation_count": donation_count,
            "unique_donors": unique_donors,
            "average_gift": round(float(avg_gift), 2),
            "online_percentage": round((online_donations / total_raised * 100) if total_raised > 0 else 0, 1)
        },
        "comparison": {
            "previous_period_raised": float(prev_raised),
            "growth_rate": round(growth_rate, 1),
            "period_over_period_change": float(total_raised - prev_raised)
        }
    }


# =====================================================================
# TIME PERIOD OPTIONS ENDPOINT
# =====================================================================

@router.get("/time-periods/available")
async def get_available_time_periods():
    """Get available time period options for filtering"""
    current_year = datetime.now().year
    current_month = datetime.now().month

    return {
        "period_types": [
            {"value": "ytd", "label": "Year to Date", "description": f"Jan 1 - Today ({current_year})"},
            {"value": "year", "label": "Full Year", "description": "January - December"},
            {"value": "month", "label": "Monthly", "description": "Specific month view"},
            {"value": "week", "label": "Weekly", "description": "Specific week view"},
            {"value": "quarter", "label": "Quarterly", "description": "Q1, Q2, Q3, or Q4"},
            {"value": "last30days", "label": "Last 30 Days", "description": "Rolling 30 day window"},
            {"value": "last90days", "label": "Last 90 Days", "description": "Rolling 90 day window"}
        ],
        "available_years": list(range(current_year - 5, current_year + 1)),
        "available_months": [
            {"value": 1, "label": "January"}, {"value": 2, "label": "February"},
            {"value": 3, "label": "March"}, {"value": 4, "label": "April"},
            {"value": 5, "label": "May"}, {"value": 6, "label": "June"},
            {"value": 7, "label": "July"}, {"value": 8, "label": "August"},
            {"value": 9, "label": "September"}, {"value": 10, "label": "October"},
            {"value": 11, "label": "November"}, {"value": 12, "label": "December"}
        ],
        "current_period": {
            "year": current_year,
            "month": current_month,
            "week": datetime.now().isocalendar()[1]
        }
    }