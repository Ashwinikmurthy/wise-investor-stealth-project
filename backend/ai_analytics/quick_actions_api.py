"""
Quick Actions API Endpoints
Add these endpoints to your FastAPI application

IMPORTANT: You need to add the Communications model to your models.py first (see below)
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from enum import Enum
import csv
import io

# PDF generation
from reportlab.lib import colors as pdf_colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Import from your existing codebase
from database import get_db
from models import (
    Donations as Donation,
    Donors as Donor,
    Campaigns as Campaign,
    Organizations as Organization,
    Tasks as Task,
    # Communications  # Uncomment after adding the model
)
from user_management.auth_dependencies import get_current_user

router = APIRouter(prefix="/api/v1", tags=["Quick Actions"])


# =====================================================
# ADD THIS MODEL TO YOUR models.py FILE
# =====================================================
"""
# Add this to your models.py:

class Communications(Base):
    __tablename__ = "communications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id"), nullable=True)
    
    communication_type = Column(String(50), nullable=False)  # thank_you, newsletter, appeal, receipt
    channel = Column(String(50), nullable=False)  # email, letter, sms, phone
    subject = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)
    
    status = Column(String(50), default="pending")  # pending, sent, delivered, failed, opened
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    opened_at = Column(DateTime, nullable=True)
    
    sent_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organizations", back_populates="communications")
    donor = relationship("Donors", back_populates="communications")

# Also add to Organizations model:
# communications = relationship("Communications", back_populates="organization")

# Also add to Donors model:
# communications = relationship("Communications", back_populates="donor")
"""


# ============== PYDANTIC MODELS ==============

class ThankYouRequest(BaseModel):
    donor_ids: List[str]
    template_type: str = "standard"  # standard, major_gift, first_time, recurring
    subject: Optional[str] = None
    custom_message: Optional[str] = None
    send_method: str = "email"  # email, letter, both

class ExportFormat(str, Enum):
    PDF = "pdf"
    CSV = "csv"

class ExportType(str, Enum):
    DONATIONS = "donations"
    DONORS = "donors"
    CAMPAIGNS = "campaigns"
    EXECUTIVE_SUMMARY = "executive_summary"

class ExportRequest(BaseModel):
    export_type: ExportType
    format: ExportFormat
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None
    task_type: str = "general"  # general, stewardship, follow_up, outreach


# ============== SEND THANK YOU API ==============

@router.post("/communications/thank-you/{organization_id}")
async def send_thank_you(
        organization_id: str,
        request: ThankYouRequest,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Send thank you communications to selected donors
    """
    try:
        # Get donor details
        donors = db.query(Donor).filter(
            Donor.organization_id == organization_id,
            Donor.id.in_(request.donor_ids)
        ).all()

        if not donors:
            raise HTTPException(status_code=404, detail="No donors found")

        # Get organization details for the letter
        org = db.query(Organization).filter(
            Organization.id == organization_id
        ).first()

        sent_count = 0
        failed_count = 0
        communications = []

        for donor in donors:
            try:
                # Get donor's most recent donation for personalization
                recent_donation = db.query(Donation).filter(
                    Donation.donor_id == donor.id,
                    Donation.organization_id == organization_id
                ).order_by(Donation.donation_date.desc()).first()

                # Generate thank you content based on template
                subject, content = generate_thank_you_content(
                    donor=donor,
                    donation=recent_donation,
                    organization=org,
                    template_type=request.template_type,
                    custom_message=request.custom_message
                )

                if request.subject:
                    subject = request.subject

                # For now, we'll just track it without the Communications table
                # Once you add the Communications model, uncomment this:

                communication = Communications(
                    organization_id=organization_id,
                    donor_id=donor.id,
                    communication_type="thank_you",
                    channel=request.send_method,
                    subject=subject,
                    content=content,
                    status="sent",
                    sent_at=datetime.now(),
                    sent_by=current_user.id
                )
                db.add(communication)


                communications.append({
                    "donor_id": str(donor.id),
                    "donor_name": f"{donor.first_name} {donor.last_name}",
                    "email": donor.email,
                    "subject": subject,
                    "status": "sent"
                })
                sent_count += 1

                # TODO: Integrate with actual email service (SendGrid, SES, etc.)
                # Example with SendGrid:
                # from sendgrid import SendGridAPIClient
                # from sendgrid.helpers.mail import Mail
                # message = Mail(
                #     from_email='noreply@yourorg.com',
                #     to_emails=donor.email,
                #     subject=subject,
                #     html_content=content
                # )
                # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
                # sg.send(message)

            except Exception as e:
                failed_count += 1
                communications.append({
                    "donor_id": str(donor.id),
                    "donor_name": f"{donor.first_name} {donor.last_name}",
                    "status": "failed",
                    "error": str(e)
                })

        db.commit()

        return {
            "success": True,
            "sent_count": sent_count,
            "failed_count": failed_count,
            "communications": communications,
            "message": f"Successfully prepared {sent_count} thank you messages"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def generate_thank_you_content(donor, donation, organization, template_type, custom_message=None):
    """Generate thank you letter content based on template type"""

    org_name = organization.name if organization else "Our Organization"
    donor_name = f"{donor.first_name} {donor.last_name}"

    # Handle case where there's no recent donation
    if donation:
        amount_str = f"${float(donation.amount):,.2f}"
        date_str = donation.donation_date.strftime('%B %d, %Y') if donation.donation_date else "recently"
    else:
        amount_str = "your generous gift"
        date_str = "recently"

    if template_type == "major_gift":
        subject = f"Your Extraordinary Generosity - Thank You, {donor.first_name}!"
        content = f"""Dear {donor_name},

On behalf of everyone at {org_name}, I want to express our deepest gratitude for your extraordinary gift of {amount_str} received on {date_str}.

Your remarkable generosity places you among our most valued supporters and will have a transformative impact on our mission. Gifts of this magnitude allow us to expand our programs and reach more people in need.

{custom_message if custom_message else ''}

We would love to schedule a personal meeting to share more about how your gift is making a difference. Please let us know a convenient time.

With heartfelt appreciation,

{org_name} Leadership Team"""

    elif template_type == "first_time":
        subject = f"Welcome to the {org_name} Family!"
        content = f"""Dear {donor_name},

Welcome! Your first gift of {amount_str} means the world to us at {org_name}.

As a new member of our donor family, you've taken the first step in creating lasting change. We're thrilled to have you join our community of supporters who share our vision for a better tomorrow.

{custom_message if custom_message else ''}

We look forward to keeping you updated on the impact of your generosity.

With warm regards,

{org_name} Team"""

    elif template_type == "recurring":
        subject = f"Thank You for Your Continued Support!"
        content = f"""Dear {donor_name},

Thank you for your continued commitment to {org_name} through your recurring gift of {amount_str}.

Monthly donors like you provide the reliable foundation that allows us to plan ahead and maximize our impact. Your ongoing support is truly invaluable.

{custom_message if custom_message else ''}

Gratefully yours,

{org_name} Team"""

    else:  # standard
        subject = f"Thank You for Your Gift to {org_name}"
        content = f"""Dear {donor_name},

Thank you for your generous gift of {amount_str} to {org_name}.

Your support makes a real difference in our ability to fulfill our mission and serve our community. We are deeply grateful for your trust in our work.

{custom_message if custom_message else ''}

With sincere appreciation,

{org_name} Team"""

    return subject, content


# ============== EXPORT DATA API ==============

@router.post("/reports/export/{organization_id}")
async def export_data(
        organization_id: str,
        request: ExportRequest,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Export data in PDF or CSV format
    """
    try:
        # Set default date range if not provided
        if not request.date_to:
            request.date_to = datetime.now()
        if not request.date_from:
            request.date_from = datetime(datetime.now().year, 1, 1)

        # Get organization name
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        org_name = org.name if org else "Organization"

        # Get data based on export type
        if request.export_type == ExportType.DONATIONS:
            data, headers, title = get_donations_export_data(
                db, organization_id, request.date_from, request.date_to
            )
        elif request.export_type == ExportType.DONORS:
            data, headers, title = get_donors_export_data(
                db, organization_id
            )
        elif request.export_type == ExportType.CAMPAIGNS:
            data, headers, title = get_campaigns_export_data(
                db, organization_id
            )
        elif request.export_type == ExportType.EXECUTIVE_SUMMARY:
            data, headers, title = get_executive_summary_data(
                db, organization_id, request.date_from, request.date_to
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid export type")

        # Generate file based on format
        if request.format == ExportFormat.CSV:
            return generate_csv_response(data, headers, title)
        else:  # PDF
            return generate_pdf_response(data, headers, title, org_name, request.date_from, request.date_to)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_donations_export_data(db, organization_id, date_from, date_to):
    """Get donations data for export"""
    donations = db.query(Donation).join(Donor).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= date_from,
        Donation.donation_date <= date_to
    ).order_by(Donation.donation_date.desc()).all()

    headers = ["Date", "Donor Name", "Email", "Amount", "Payment Method", "Campaign", "Status"]
    data = []

    for d in donations:
        donor = db.query(Donor).filter(Donor.id == d.donor_id).first()
        campaign = db.query(Campaign).filter(Campaign.id == d.campaign_id).first() if d.campaign_id else None

        data.append([
            d.donation_date.strftime("%Y-%m-%d") if d.donation_date else "",
            f"{donor.first_name} {donor.last_name}" if donor else "Unknown",
            donor.email if donor else "",
            f"${float(d.amount):,.2f}",
            d.payment_method or "",
            campaign.name if campaign else "",
            d.payment_status or "completed"
        ])

    return data, headers, "Donations Report"


def get_donors_export_data(db, organization_id):
    """Get donors data for export"""
    donors = db.query(Donor).filter(
        Donor.organization_id == organization_id
    ).order_by(Donor.last_name).all()

    headers = ["Name", "Email", "Phone", "City", "State", "Total Given", "Last Gift Date", "Gift Count"]
    data = []

    for donor in donors:
        # Get donation stats
        stats = db.query(
            func.sum(Donation.amount).label('total'),
            func.max(Donation.donation_date).label('last_date'),
            func.count(Donation.id).label('count')
        ).filter(
            Donation.donor_id == donor.id,
            Donation.organization_id == organization_id
        ).first()

        data.append([
            f"{donor.first_name} {donor.last_name}",
            donor.email or "",
            donor.phone or "",
            donor.city or "",
            donor.state or "",
            f"${float(stats.total or 0):,.2f}",
            stats.last_date.strftime("%Y-%m-%d") if stats.last_date else "",
            str(stats.count or 0)
        ])

    return data, headers, "Donors Report"


def get_campaigns_export_data(db, organization_id):
    """Get campaigns data for export"""
    campaigns = db.query(Campaign).filter(
        Campaign.organization_id == organization_id
    ).order_by(Campaign.start_date.desc()).all()

    headers = ["Campaign Name", "Goal", "Raised", "Progress", "Start Date", "End Date", "Status"]
    data = []

    for c in campaigns:
        # Get total raised
        raised = db.query(func.sum(Donation.amount)).filter(
            Donation.campaign_id == c.id
        ).scalar() or 0

        progress = (float(raised) / float(c.goal_amount) * 100) if c.goal_amount else 0

        data.append([
            c.name,
            f"${float(c.goal_amount):,.2f}" if c.goal_amount else "$0",
            f"${float(raised):,.2f}",
            f"{progress:.1f}%",
            c.start_date.strftime("%Y-%m-%d") if c.start_date else "",
            c.end_date.strftime("%Y-%m-%d") if c.end_date else "",
            c.status or "active"
        ])

    return data, headers, "Campaigns Report"


def get_executive_summary_data(db, organization_id, date_from, date_to):
    """Get executive summary data for export"""

    # Total revenue
    total_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= date_from,
        Donation.donation_date <= date_to
    ).scalar() or 0

    # Donation count
    donation_count = db.query(func.count(Donation.id)).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= date_from,
        Donation.donation_date <= date_to
    ).scalar() or 0

    # Unique donors
    unique_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= date_from,
        Donation.donation_date <= date_to
    ).scalar() or 0

    # Average gift
    avg_gift = float(total_revenue) / donation_count if donation_count > 0 else 0

    # New donors
    previous_donors = db.query(Donation.donor_id).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date < date_from
    ).distinct().subquery()

    new_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= date_from,
        Donation.donation_date <= date_to,
        ~Donation.donor_id.in_(db.query(previous_donors.c.donor_id))
    ).scalar() or 0

    # Active campaigns
    active_campaigns = db.query(func.count(Campaign.id)).filter(
        Campaign.organization_id == organization_id,
        Campaign.status == 'active'
    ).scalar() or 0

    # Top campaigns
    top_campaigns = db.query(
        Campaign.name,
        func.sum(Donation.amount).label('raised')
    ).join(Donation, Campaign.id == Donation.campaign_id).filter(
        Campaign.organization_id == organization_id,
        Donation.donation_date >= date_from,
        Donation.donation_date <= date_to
    ).group_by(Campaign.id).order_by(func.sum(Donation.amount).desc()).limit(5).all()

    headers = ["Metric", "Value"]
    data = [
        ["Total Revenue", f"${float(total_revenue):,.2f}"],
        ["Total Donations", str(donation_count)],
        ["Unique Donors", str(unique_donors)],
        ["New Donors", str(new_donors)],
        ["Average Gift", f"${avg_gift:,.2f}"],
        ["Active Campaigns", str(active_campaigns)],
        ["", ""],
        ["Top Campaigns", "Amount Raised"],
    ]

    for campaign_name, raised in top_campaigns:
        data.append([campaign_name, f"${float(raised):,.2f}"])

    return data, headers, "Executive Summary"


def generate_csv_response(data, headers, title):
    """Generate CSV file response"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write headers
    writer.writerow(headers)

    # Write data
    for row in data:
        writer.writerow(row)

    output.seek(0)

    filename = f"{title.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def generate_pdf_response(data, headers, title, org_name, date_from, date_to):
    """Generate PDF file response"""
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    styles = getSampleStyleSheet()

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=12,
        textColor=pdf_colors.HexColor('#154734')
    )
    elements.append(Paragraph(title, title_style))

    # Subtitle with org name and date range
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=pdf_colors.HexColor('#525252'),
        spaceAfter=20
    )
    date_range = f"{date_from.strftime('%B %d, %Y')} - {date_to.strftime('%B %d, %Y')}"
    elements.append(Paragraph(f"{org_name} | {date_range}", subtitle_style))
    elements.append(Spacer(1, 12))

    # Create table
    table_data = [headers] + data

    # Calculate column widths
    num_cols = len(headers)
    available_width = letter[0] - inch
    col_width = available_width / num_cols

    table = Table(table_data, colWidths=[col_width] * num_cols)

    # Table styling
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), pdf_colors.HexColor('#154734')),
        ('TEXTCOLOR', (0, 0), (-1, 0), pdf_colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), pdf_colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), pdf_colors.HexColor('#262626')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [pdf_colors.white, pdf_colors.HexColor('#fafafa')]),
        ('GRID', (0, 0), (-1, -1), 0.5, pdf_colors.HexColor('#e5e5e5')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ])
    table.setStyle(table_style)
    elements.append(table)

    # Footer
    elements.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=pdf_colors.HexColor('#737373')
    )
    elements.append(Paragraph(
        f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} by Wise Investor",
        footer_style
    ))

    doc.build(elements)
    buffer.seek(0)

    filename = f"{title.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ============== CREATE TASK API ==============

@router.post("/tasks/{organization_id}")
async def create_task(
        organization_id: str,
        request: CreateTaskRequest,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Create a new task
    """
    try:
        task = Task(
            organization_id=organization_id,
            title=request.title,
            description=request.description,
            due_date=request.due_date,
            priority=request.priority.value,
            #task_type=request.task_type,
            assigned_to=request.assigned_to or current_user.id,
            #created_by=current_user.id,
            status="pending",
            created_at=datetime.now()
        )

        db.add(task)
        db.commit()
        db.refresh(task)

        return {
            "success": True,
            "task_id": str(task.id),
            "message": "Task created successfully",
            "task": {
                "id": str(task.id),
                "title": task.title,
                "due_date": task.due_date.isoformat(),
                "priority": task.priority,
                "status": task.status
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============== UPCOMING DEADLINES API ==============

@router.get("/deadlines/{organization_id}")
async def get_upcoming_deadlines(
        organization_id: str,
        days: int = 30,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get upcoming deadlines and events for the dashboard
    """
    try:
        deadlines = []
        today = datetime.now()
        end_date = today + timedelta(days=days)

        # 1. Campaign end dates
        campaigns = db.query(Campaign).filter(
            Campaign.organization_id == organization_id,
            Campaign.status == 'active',
            Campaign.end_date >= today,
            Campaign.end_date <= end_date
        ).order_by(Campaign.end_date).all()

        for campaign in campaigns:
            # Get campaign progress
            raised = db.query(func.sum(Donation.amount)).filter(
                Donation.campaign_id == campaign.id
            ).scalar() or 0
            progress = (float(raised) / float(campaign.goal_amount) * 100) if campaign.goal_amount else 0

            deadlines.append({
                "id": str(campaign.id),
                "type": "campaign_end",
                "title": f"{campaign.name} ends",
                "date": campaign.end_date.isoformat(),
                "days_until": (campaign.end_date.date() - today.date()).days,
                "priority": "high" if (campaign.end_date.date() - today.date()).days <= 7 else "medium",
                "details": {
                    "progress": round(progress, 1),
                    "raised": float(raised),
                    "goal": float(campaign.goal_amount) if campaign.goal_amount else 0
                },
                "icon": "target"
            })

        # 2. Tasks due
        tasks = db.query(Task).filter(
            Task.organization_id == organization_id,
            Task.status.in_(['pending', 'in_progress']),
            Task.due_date >= today,
            Task.due_date <= end_date
        ).order_by(Task.due_date).limit(10).all()

        for task in tasks:
            deadlines.append({
                "id": str(task.id),
                "type": "task",
                "title": task.title,
                "date": task.due_date.isoformat(),
                "days_until": (task.due_date.date() - today.date()).days,
                "priority": task.priority,
                "details": {
                    "task_type": task.task_type if hasattr(task, 'task_type') else "general",
                    "status": task.status
                },
                "icon": "check-circle"
            })

        # 3. Major donor anniversaries (donors with gifts > $10,000 last year)
        one_year_ago_start = today.replace(year=today.year - 1) - timedelta(days=7)
        one_year_ago_end = today.replace(year=today.year - 1) + timedelta(days=days)

        anniversary_donations = db.query(Donation).join(Donor).filter(
            Donation.organization_id == organization_id,
            Donation.amount >= 10000,
            Donation.donation_date >= one_year_ago_start,
            Donation.donation_date <= one_year_ago_end
        ).all()

        for donation in anniversary_donations:
            donor = db.query(Donor).filter(Donor.id == donation.donor_id).first()
            if donor and donation.donation_date:
                anniversary_date = donation.donation_date.replace(year=today.year)
                if anniversary_date.date() >= today.date():
                    deadlines.append({
                        "id": f"anniversary-{donation.id}",
                        "type": "anniversary",
                        "title": f"{donor.first_name} {donor.last_name} - Gift Anniversary",
                        "date": anniversary_date.isoformat(),
                        "days_until": (anniversary_date.date() - today.date()).days,
                        "priority": "medium",
                        "details": {
                            "donor_name": f"{donor.first_name} {donor.last_name}",
                            "last_gift": float(donation.amount),
                            "donor_id": str(donor.id)
                        },
                        "icon": "gift"
                    })

        # 4. Stewardship touchpoints (tasks with stewardship type)
        if hasattr(Task, 'task_type'):
            stewardship_tasks = db.query(Task).filter(
                Task.organization_id == organization_id,
                Task.task_type == 'stewardship',
                Task.status.in_(['pending', 'in_progress']),
                Task.due_date >= today,
                Task.due_date <= end_date
            ).order_by(Task.due_date).all()

            for task in stewardship_tasks:
                # Avoid duplicates
                if not any(d['id'] == str(task.id) for d in deadlines):
                    deadlines.append({
                        "id": str(task.id),
                        "type": "stewardship",
                        "title": task.title,
                        "date": task.due_date.isoformat(),
                        "days_until": (task.due_date.date() - today.date()).days,
                        "priority": task.priority,
                        "details": {
                            "description": task.description
                        },
                        "icon": "heart"
                    })

        # Sort all deadlines by date
        deadlines.sort(key=lambda x: x['date'])

        # Limit to reasonable number
        deadlines = deadlines[:15]

        return {
            "organization_id": organization_id,
            "generated_at": datetime.now().isoformat(),
            "period_days": days,
            "total_count": len(deadlines),
            "deadlines": deadlines,
            "summary": {
                "campaigns_ending": len([d for d in deadlines if d['type'] == 'campaign_end']),
                "tasks_due": len([d for d in deadlines if d['type'] == 'task']),
                "anniversaries": len([d for d in deadlines if d['type'] == 'anniversary']),
                "stewardship": len([d for d in deadlines if d['type'] == 'stewardship'])
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== GET DONORS FOR THANK YOU ==============

@router.get("/donors/recent-donations/{organization_id}")
async def get_donors_for_thank_you(
        organization_id: str,
        days: int = 7,
        limit: int = 50,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get donors who made recent donations (for thank you selection)
    """
    try:
        since_date = datetime.now() - timedelta(days=days)

        # Get recent donations with donor info
        recent_donations = db.query(
            Donor.id,
            Donor.first_name,
            Donor.last_name,
            Donor.email,
            Donation.amount,
            Donation.donation_date,
            Donation.id.label('donation_id')
        ).join(Donation, Donor.id == Donation.donor_id).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= since_date
        ).order_by(Donation.donation_date.desc()).limit(limit).all()

        donors = []
        for d in recent_donations:
            donors.append({
                "id": str(d.id),
                "name": f"{d.first_name} {d.last_name}",
                "email": d.email,
                "amount": float(d.amount),
                "donation_date": d.donation_date.isoformat() if d.donation_date else None,
                "donation_id": str(d.donation_id)
            })

        return {
            "organization_id": organization_id,
            "period_days": days,
            "count": len(donors),
            "donors": donors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))