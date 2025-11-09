"""
Dashboard Router - Insights and Health Score Endpoints
Leverages existing analytics queries to provide actionable insights and health metrics
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID
import jwt
from jwt import PyJWTError, ExpiredSignatureError

from database import get_db
from models import Organizations as Organization, Users as User, Donations as Donation, Donors as Donor, Programs as Program, Tasks as Task

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

# Production Authentication (matching analytics.py)
SECRET_KEY = "IfGoOOnglgp65RIbY3pfx8E787Nute-_3Wkv6lCvEKlhC0oLmavChErNr-EtvRNEntHYt15mblG4tn9nJK0zsg"
ALGORITHM = "HS256"


def get_current_user(
        authorization: str = Header(..., description="Bearer token"),
        db: Session = Depends(get_db)
) -> User:
    """Production JWT authentication"""
    credentials_exception = HTTPException(
        status_code=401,
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
            status_code=401,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return user


def verify_organization_access(user: User, organization_id: UUID) -> None:
    """Verify user has access to the requested organization"""
    if user.is_superadmin:
        return

    if user.organization_id != organization_id:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to access this organization's data"
        )


@router.get("/insights/{organization_id}")
async def get_dashboard_insights(
        organization_id: UUID,
        limit: int = Query(default=3, ge=1, le=10),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get actionable insights for the organization dashboard

    Analyzes:
    - Revenue trends
    - Donor retention patterns
    - At-risk donors
    - Campaign performance
    """
    verify_organization_access(current_user, organization_id)

    # Verify organization exists
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    insights = []
    current_year = datetime.now().year
    year_start = datetime(current_year, 1, 1)
    current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = current_month_start - timedelta(seconds=1)

    # Insight 1: Revenue Trend Analysis
    current_month_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= current_month_start
    ).scalar() or 0

    last_month_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= last_month_start,
        Donation.donation_date < current_month_start
    ).scalar() or 0

    if last_month_revenue > 0:
        revenue_change = ((current_month_revenue - last_month_revenue) / last_month_revenue) * 100

        if revenue_change > 10:
            insights.append({
                "id": "revenue-growth",
                "type": "success",
                "category": "revenue",
                "title": "Strong Revenue Growth",
                "message": f"Revenue is up {revenue_change:.1f}% compared to last month ({formatCurrency(current_month_revenue)} vs {formatCurrency(last_month_revenue)}). Great momentum!",
                "priority": 1,
                "action_text": "View Revenue Details",
                "action_url": "/analytics/revenue",
                "created_at": datetime.utcnow().isoformat()
            })
        elif revenue_change < -10:
            insights.append({
                "id": "revenue-decline",
                "type": "warning",
                "category": "revenue",
                "title": "Revenue Decreased",
                "message": f"Revenue is down {abs(revenue_change):.1f}% from last month. Consider launching a new campaign or re-engaging major donors.",
                "priority": 1,
                "action_text": "View Fundraising Strategy",
                "action_url": "/campaigns/new",
                "created_at": datetime.utcnow().isoformat()
            })

    # Insight 2: At-Risk Donors
    six_months_ago = datetime.now() - timedelta(days=180)
    one_year_ago = datetime.now() - timedelta(days=365)

    at_risk_count = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == organization_id,
        Donor.last_donation_date < six_months_ago,
        Donor.last_donation_date >= one_year_ago,
        Donor.total_donated > 1
    ).scalar() or 0

    if at_risk_count > 0:
        insights.append({
            "id": "at-risk-donors",
            "type": "warning",
            "category": "donors",
            "title": f"{at_risk_count} Donors At Risk",
            "message": f"You have {at_risk_count} repeat donors who haven't given in 6+ months. A targeted re-engagement campaign could win them back.",
            "priority": 2,
            "action_text": "View At-Risk Donors",
            "action_url": "/donors?status=at-risk",
            "created_at": datetime.utcnow().isoformat()
        })

    # Insight 3: Donor Retention Rate
    last_year_start = datetime(current_year - 1, 1, 1)
    last_year_end = datetime(current_year - 1, 12, 31)

    last_year_donors_count = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= last_year_start,
        Donation.donation_date <= last_year_end
    ).scalar() or 1

    retained_donors_count = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= year_start,
        Donation.donor_id.in_(
            db.query(Donation.donor_id).filter(
                Donation.organization_id == organization_id,
                Donation.donation_date >= last_year_start,
                Donation.donation_date <= last_year_end
            )
        )
    ).scalar() or 0

    retention_rate = (retained_donors_count / last_year_donors_count * 100) if last_year_donors_count > 0 else 0

    if retention_rate < 50:
        insights.append({
            "id": "low-retention",
            "type": "danger",
            "category": "donors",
            "title": "Low Donor Retention",
            "message": f"Only {retention_rate:.1f}% of last year's donors have given again this year. Industry average is 45-50%. Focus on stewardship.",
            "priority": 1,
            "action_text": "View Retention Report",
            "action_url": "/analytics/donor-lifecycle",
            "created_at": datetime.utcnow().isoformat()
        })
    elif retention_rate > 60:
        insights.append({
            "id": "strong-retention",
            "type": "success",
            "category": "donors",
            "title": "Excellent Donor Retention",
            "message": f"Your retention rate of {retention_rate:.1f}% exceeds the nonprofit average of 45%. Keep up the great donor stewardship!",
            "priority": 3,
            "action_text": "View Donor Insights",
            "action_url": "/analytics/donor-lifecycle",
            "created_at": datetime.utcnow().isoformat()
        })

    # Insight 4: Average Gift Size Trend
    current_avg_gift = db.query(func.avg(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= current_month_start
    ).scalar() or 0

    last_month_avg_gift = db.query(func.avg(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= last_month_start,
        Donation.donation_date < current_month_start
    ).scalar() or 0

    if last_month_avg_gift > 0:
        gift_size_change = ((current_avg_gift - last_month_avg_gift) / last_month_avg_gift) * 100

        if gift_size_change > 15:
            insights.append({
                "id": "gift-size-increase",
                "type": "success",
                "category": "revenue",
                "title": "Average Gift Size Increasing",
                "message": f"Average donation increased {gift_size_change:.1f}% to {formatCurrency(current_avg_gift)}. Your donors are giving more generously!",
                "priority": 2,
                "action_text": "View Donation Trends",
                "action_url": "/analytics/revenue-rollup",
                "created_at": datetime.utcnow().isoformat()
            })

    # Insight 5: New Donor Acquisition
    thirty_days_ago = datetime.now() - timedelta(days=30)
    new_donors_count = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == organization_id,
        Donor.first_donation_date >= thirty_days_ago
    ).scalar() or 0

    if new_donors_count > 20:
        insights.append({
            "id": "new-donor-growth",
            "type": "success",
            "category": "donors",
            "title": "Strong New Donor Acquisition",
            "message": f"You've acquired {new_donors_count} new donors in the last 30 days. Focus on converting them to recurring donors.",
            "priority": 2,
            "action_text": "View New Donors",
            "action_url": "/donors?filter=new",
            "created_at": datetime.utcnow().isoformat()
        })
    elif new_donors_count < 5:
        insights.append({
            "id": "low-acquisition",
            "type": "warning",
            "category": "donors",
            "title": "Low New Donor Acquisition",
            "message": f"Only {new_donors_count} new donors in 30 days. Consider increasing marketing efforts or hosting an acquisition campaign.",
            "priority": 1,
            "action_text": "Plan Acquisition Campaign",
            "action_url": "/campaigns/new",
            "created_at": datetime.utcnow().isoformat()
        })

    # Sort insights by priority and limit results
    insights_sorted = sorted(insights, key=lambda x: x['priority'])[:limit]

    return {
        "insights": insights_sorted,
        "total_insights": len(insights),
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/health-score/{organization_id}")
async def get_health_score(
        organization_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Calculate organizational health score based on multiple factors:
    - Revenue health (30%)
    - Donor retention (30%)
    - Donor acquisition (20%)
    - Engagement (20%)
    """
    verify_organization_access(current_user, organization_id)

    # Verify organization exists
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    current_year = datetime.now().year
    year_start = datetime(current_year, 1, 1)
    last_year_start = datetime(current_year - 1, 1, 1)
    last_year_end = datetime(current_year - 1, 12, 31)
    one_year_ago = datetime.now() - timedelta(days=365)

    # Component 1: Revenue Health (30 points)
    total_revenue_ytd = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= year_start
    ).scalar() or 0

    last_year_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= last_year_start,
        Donation.donation_date <= last_year_end
    ).scalar() or 1

    revenue_growth = ((total_revenue_ytd - last_year_revenue) / last_year_revenue * 100) if last_year_revenue > 0 else 0

    # Score revenue health
    if revenue_growth > 15:
        revenue_score = 30
        revenue_status = "Excellent"
    elif revenue_growth > 5:
        revenue_score = 25
        revenue_status = "Good"
    elif revenue_growth > -5:
        revenue_score = 20
        revenue_status = "Fair"
    else:
        revenue_score = 15
        revenue_status = "Needs Improvement"

    # Component 2: Donor Retention (30 points)
    last_year_donors_count = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= last_year_start,
        Donation.donation_date <= last_year_end
    ).scalar() or 1

    retained_donors_count = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= year_start,
        Donation.donor_id.in_(
            db.query(Donation.donor_id).filter(
                Donation.organization_id == organization_id,
                Donation.donation_date >= last_year_start,
                Donation.donation_date <= last_year_end
            )
        )
    ).scalar() or 0

    retention_rate = (retained_donors_count / last_year_donors_count * 100) if last_year_donors_count > 0 else 0

    # Score retention
    if retention_rate > 60:
        retention_score = 30
        retention_status = "Excellent"
    elif retention_rate > 45:
        retention_score = 25
        retention_status = "Good"
    elif retention_rate > 30:
        retention_score = 20
        retention_status = "Fair"
    else:
        retention_score = 15
        retention_status = "Needs Improvement"

    # Component 3: Donor Acquisition (20 points)
    ninety_days_ago = datetime.now() - timedelta(days=90)
    new_donors_count = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == organization_id,
        Donor.first_donation_date >= ninety_days_ago
    ).scalar() or 0

    total_donors = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == organization_id
    ).scalar() or 1

    acquisition_rate = (new_donors_count / total_donors * 100) if total_donors > 0 else 0

    # Score acquisition
    if acquisition_rate > 10:
        acquisition_score = 20
        acquisition_status = "Excellent"
    elif acquisition_rate > 5:
        acquisition_score = 16
        acquisition_status = "Good"
    elif acquisition_rate > 2:
        acquisition_score = 12
        acquisition_status = "Fair"
    else:
        acquisition_score = 8
        acquisition_status = "Needs Improvement"

    # Component 4: Donor Engagement (20 points)
    active_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= one_year_ago
    ).scalar() or 0

    engagement_rate = (active_donors / total_donors * 100) if total_donors > 0 else 0

    # Score engagement
    if engagement_rate > 60:
        engagement_score = 20
        engagement_status = "Excellent"
    elif engagement_rate > 40:
        engagement_score = 16
        engagement_status = "Good"
    elif engagement_rate > 25:
        engagement_score = 12
        engagement_status = "Fair"
    else:
        engagement_score = 8
        engagement_status = "Needs Improvement"

    # Calculate total health score
    total_score = revenue_score + retention_score + acquisition_score + engagement_score

    # Determine overall status
    if total_score >= 85:
        overall_status = "Excellent"
        status_color = "success"
    elif total_score >= 70:
        overall_status = "Good"
        status_color = "success"
    elif total_score >= 55:
        overall_status = "Fair"
        status_color = "warning"
    else:
        overall_status = "Needs Attention"
        status_color = "danger"

    return {
        "score": total_score,
        "max_score": 100,
        "status": overall_status,
        "status_color": status_color,
        "components": {
            "revenue_health": {
                "score": revenue_score,
                "max_score": 30,
                "percentage": round((revenue_score / 30) * 100, 1),
                "status": revenue_status,
                "metric": f"{revenue_growth:+.1f}% YoY",
                "description": "Year-over-year revenue growth"
            },
            "donor_retention": {
                "score": retention_score,
                "max_score": 30,
                "percentage": round((retention_score / 30) * 100, 1),
                "status": retention_status,
                "metric": f"{retention_rate:.1f}%",
                "description": "Donors retained from last year"
            },
            "donor_acquisition": {
                "score": acquisition_score,
                "max_score": 20,
                "percentage": round((acquisition_score / 20) * 100, 1),
                "status": acquisition_status,
                "metric": f"{new_donors_count} new",
                "description": "New donors in last 90 days"
            },
            "donor_engagement": {
                "score": engagement_score,
                "max_score": 20,
                "percentage": round((engagement_score / 20) * 100, 1),
                "status": engagement_status,
                "metric": f"{engagement_rate:.1f}%",
                "description": "Active donors in last 12 months"
            }
        },
        "recommendations": get_recommendations(revenue_status, retention_status, acquisition_status, engagement_status),
        "calculated_at": datetime.utcnow().isoformat()
    }



@router.get("/tasks/{organization_id}")
async def get_dashboard_tasks(
        organization_id: UUID,
        limit: int = Query(default=5, ge=1, le=20),
        status: Optional[str] = Query(default=None, description="Filter by status: pending, in_progress, completed"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get upcoming tasks for the organization dashboard

    Returns tasks sorted by priority and due date

    Parameters:
    - organization_id: Organization UUID
    - limit: Maximum number of tasks to return (default: 5, max: 20)
    - status: Optional filter by task status

    Returns:
    - List of tasks with details including title, description, due date, priority, status, assignee
    """
    verify_organization_access(current_user, organization_id)

    # Verify organization exists
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    try:
        # Build query
        query = db.query(Task).filter(
            Task.organization_id == organization_id
        )

        # Apply status filter if provided
        if status:
            valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
            if status.lower() not in valid_statuses:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )
            query = query.filter(Task.status == status.lower())
        else:
            # By default, exclude completed and cancelled tasks
            query = query.filter(Task.status.in_(['pending', 'in_progress']))

        # Sort by priority (high first) and due date (nearest first)
        # Assuming priority: 'high', 'medium', 'low'
        priority_order = case(
            (Task.priority == 'high', 1),
            (Task.priority == 'medium', 2),
            (Task.priority == 'low', 3),
            else_=4
        )

        tasks = query.order_by(
            priority_order,
            Task.due_date.asc().nullslast(),
            Task.created_at.desc()
        ).limit(limit).all()

        # Format response
        formatted_tasks = []
        for task in tasks:
            # Get assignee info if available
            assignee_info = None
            if task.assigned_to:
                assignee = db.query(User).filter(User.id == task.assigned_to).first()
                if assignee:
                    assignee_info = {
                        "id": str(assignee.id),
                        "name": assignee.full_name or assignee.email,
                        "email": assignee.email
                    }

            # Calculate if overdue
            is_overdue = False
            days_until_due = None
            if task.due_date:
                days_until_due = (task.due_date.date() - datetime.now().date()).days
                is_overdue = days_until_due < 0

            formatted_tasks.append({
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "days_until_due": days_until_due,
                "is_overdue": is_overdue,
                "assignee": assignee_info,
                "category": task.category if hasattr(task, 'category') else None,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "updated_at": task.updated_at.isoformat() if task.updated_at else None
            })

        return {
            "organization_id": str(organization_id),
            "organization_name": organization.name,
            "total_tasks": len(formatted_tasks),
            "tasks": formatted_tasks,
            "filters_applied": {
                "status": status if status else "active tasks only (pending, in_progress)",
                "limit": limit
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching tasks: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve tasks: {str(e)}"
        )


def get_recommendations(revenue_status: str, retention_status: str, acquisition_status: str, engagement_status: str) -> List[str]:
    """Generate actionable recommendations based on health scores"""

@router.get("/recent-activity/{organization_id}")
async def get_recent_activity(
        organization_id: UUID,
        limit: int = Query(default=10, ge=1, le=50),
        activity_type: Optional[str] = Query(default=None, description="Filter by type: donation, donor, task, campaign"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get recent activity feed for the organization dashboard

    Returns a chronological feed of recent activities including:
    - New donations
    - New donors
    - Completed tasks
    - Campaign updates

    Parameters:
    - organization_id: Organization UUID
    - limit: Maximum number of activities to return (default: 10, max: 50)
    - activity_type: Optional filter by activity type

    Returns:
    - List of recent activities with timestamps and details
    """
    verify_organization_access(current_user, organization_id)

    # Verify organization exists
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    try:
        activities = []

        # Get recent donations (last 30 days)
        if not activity_type or activity_type == 'donation':
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_donations = db.query(Donation).filter(
                Donation.organization_id == organization_id,
                Donation.donation_date >= thirty_days_ago
            ).order_by(Donation.donation_date.desc()).limit(limit).all()

            for donation in recent_donations:
                # Get donor info
                donor = db.query(Donor).filter(Donor.id == donation.donor_id).first()
                donor_name = f"{donor.first_name} {donor.last_name}" if donor else "Anonymous"

                activities.append({
                    "id": str(donation.id),
                    "type": "donation",
                    "title": "New Donation Received",
                    "description": f"{donor_name} donated {formatCurrency(donation.amount)}",
                    "amount": float(donation.amount) if donation.amount else 0,
                    "metadata": {
                        "donor_id": str(donation.donor_id),
                        "donor_name": donor_name,
                        "donation_type": donation.donation_type if hasattr(donation, 'donation_type') else None,
                        "campaign_id": str(donation.campaign_id) if donation.campaign_id else None
                    },
                    "timestamp": donation.donation_date.isoformat(),
                    "icon": "dollar-sign",
                    "color": "success"
                })

        # Get new donors (last 30 days)
        if not activity_type or activity_type == 'donor':
            thirty_days_ago = datetime.now() - timedelta(days=30)
            new_donors = db.query(Donor).filter(
                Donor.organization_id == organization_id,
                Donor.first_donation_date >= thirty_days_ago
            ).order_by(Donor.first_donation_date.desc()).limit(limit).all()

            for donor in new_donors:
                donor_name = f"{donor.first_name} {donor.last_name}"
                activities.append({
                    "id": str(donor.id),
                    "type": "donor",
                    "title": "New Donor",
                    "description": f"{donor_name} joined as a new donor",
                    "amount": float(donor.total_donated) if donor.total_donated else 0,
                    "metadata": {
                        "donor_id": str(donor.id),
                        "donor_name": donor_name,
                        "email": donor.email,
                        "first_donation_amount": float(donor.total_donated) if donor.total_donated else 0
                    },
                    "timestamp": donor.first_donation_date.isoformat() if donor.first_donation_date else donor.created_at.isoformat(),
                    "icon": "user-plus",
                    "color": "info"
                })

        # Get completed tasks (last 30 days)
        if not activity_type or activity_type == 'task':
            thirty_days_ago = datetime.now() - timedelta(days=30)
            completed_tasks = db.query(Task).filter(
                Task.organization_id == organization_id,
                Task.status == 'completed',
                Task.completed_at >= thirty_days_ago
            ).order_by(Task.completed_at.desc()).limit(limit).all()

            for task in completed_tasks:
                # Get assignee info
                assignee_name = "Someone"
                if task.assigned_to:
                    assignee = db.query(User).filter(User.id == task.assigned_to).first()
                    if assignee:
                        assignee_name = assignee.full_name or assignee.email

                activities.append({
                    "id": str(task.id),
                    "type": "task",
                    "title": "Task Completed",
                    "description": f"{assignee_name} completed: {task.title}",
                    "metadata": {
                        "task_id": str(task.id),
                        "task_title": task.title,
                        "assignee_id": str(task.assigned_to) if task.assigned_to else None,
                        "assignee_name": assignee_name,
                        "category": task.category if hasattr(task, 'category') else None,
                        "priority": task.priority
                    },
                    "timestamp": task.completed_at.isoformat() if task.completed_at else task.updated_at.isoformat(),
                    "icon": "check-circle",
                    "color": "success"
                })

        # Get recent program updates (if Program model has updated_at)
        if not activity_type or activity_type == 'program':
            seven_days_ago = datetime.now() - timedelta(days=7)
            try:
                # Check if Program model has updated_at field
                if hasattr(Program, 'updated_at'):
                    recent_programs = db.query(Program).filter(
                        Program.organization_id == organization_id,
                        Program.updated_at >= seven_days_ago
                    ).order_by(Program.updated_at.desc()).limit(limit).all()

                    for program in recent_programs:
                        activities.append({
                            "id": str(program.id),
                            "type": "program",
                            "title": "Program Updated",
                            "description": f"Updates to {program.name}",
                            "metadata": {
                                "program_id": str(program.id),
                                "program_name": program.name,
                                "beneficiaries": program.beneficiaries_served if hasattr(program, 'beneficiaries_served') else None
                            },
                            "timestamp": program.updated_at.isoformat(),
                            "icon": "target",
                            "color": "info"
                        })
            except Exception as e:
                # Skip program activities if there's an error
                pass

        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)

        # Apply limit
        activities = activities[:limit]

        # Calculate time ago for each activity
        for activity in activities:
            timestamp = datetime.fromisoformat(activity['timestamp'].replace('Z', '+00:00'))
            time_diff = datetime.now() - timestamp.replace(tzinfo=None)

            if time_diff.days > 0:
                activity['time_ago'] = f"{time_diff.days} day{'s' if time_diff.days != 1 else ''} ago"
            elif time_diff.seconds >= 3600:
                hours = time_diff.seconds // 3600
                activity['time_ago'] = f"{hours} hour{'s' if hours != 1 else ''} ago"
            elif time_diff.seconds >= 60:
                minutes = time_diff.seconds // 60
                activity['time_ago'] = f"{minutes} minute{'s' if minutes != 1 else ''} ago"
            else:
                activity['time_ago'] = "Just now"

        return {
            "organization_id": str(organization_id),
            "organization_name": organization.name,
            "total_activities": len(activities),
            "activities": activities,
            "filters_applied": {
                "activity_type": activity_type if activity_type else "all types",
                "limit": limit,
                "period": "last 30 days"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching recent activity: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve recent activity: {str(e)}"
        )
    recommendations = []

    if revenue_status in ["Needs Improvement", "Fair"]:
        recommendations.append("Launch a major fundraising campaign to boost revenue")

    if retention_status in ["Needs Improvement", "Fair"]:
        recommendations.append("Implement a donor stewardship program to improve retention")

    if acquisition_status in ["Needs Improvement", "Fair"]:
        recommendations.append("Increase marketing spend and donor acquisition efforts")

    if engagement_status in ["Needs Improvement", "Fair"]:
        recommendations.append("Create more touchpoints with inactive donors through newsletters and events")

    if not recommendations:
        recommendations.append("Maintain current momentum - all metrics are healthy!")
        recommendations.append("Consider expanding programs or launching new initiatives")

    return recommendations


def formatCurrency(amount: float) -> str:
    """Format amount as currency"""
    return f"${amount:,.0f}"