from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from database import get_db
import models
from pydantic import BaseModel, Field
from decimal import Decimal
from enum import Enum
from utils import _safe_model
from collections import defaultdict
import io
import csv

router = APIRouter(prefix="/analytics", tags=["Extra Analytics"])


class CPCResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    total_ad_spend: float
    total_clicks: int
    cpc: float  # spend / clicks

class BounceRateResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    single_page_sessions: int
    total_sessions: int
    bounce_rate_percent: float

class ConversionRateResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    conversions: int
    total_visitors: int
    conversion_rate_percent: float
    goal: Optional[str] = None  # e.g., 'donation' | 'event_registration'

class EmailCTRResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    emails_delivered: int
    recipients_clicked: int
    ctr_percent: float

class EmailOpenRateResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    emails_delivered: int
    recipients_opened: int
    open_rate_percent: float  # opens / delivered * 100

class SessionsSummaryResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    sessions: int
    avg_session_duration_seconds: float

class TrafficBreakdownResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    channels: Dict[str, int]  # e.g., {"direct": 1200, "organic": 3400, ...}

class SocialEngagementResponse(BaseModel):
    organization_id: str
    start: datetime
    end: datetime
    platform: Optional[str] = None
    posts: int
    total_engagements: int  # likes + shares + comments
    avg_engagement_per_post: float


@router.get("/digital/cpc/{organization_id}", response_model=CPCResponse)
def get_cpc(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    CPC = Total Advertising Spend / Number of Clicks
    Expected model: AdMetric(organization_id, date, spend, clicks, channel/campaign?)
    """
    end = datetime.utcnow()
    start = end - timedelta(days=365)
    #start, end = _daterange_defaults(start, end)
    AdMetric = _safe_model("AdMetric")

    total_spend = 0.0
    total_clicks = 0
    if AdMetric:
        q = db.query(
            func.coalesce(func.sum(getattr(AdMetric, "spend", 0.0)), 0.0),
            func.coalesce(func.sum(getattr(AdMetric, "clicks", 0)), 0)
        ).filter(
            AdMetric.organization_id == organization_id,
            AdMetric.date >= start, AdMetric.date < end
        ).one()
        total_spend, total_clicks = float(q[0] or 0.0), int(q[1] or 0)

    cpc = (total_spend / total_clicks) if total_clicks > 0 else 0.0
    return CPCResponse(
        organization_id=organization_id, start=start, end=end,
        total_ad_spend=round(total_spend, 2),
        total_clicks=total_clicks,
        cpc=round(cpc, 4)
    )


@router.get("/digital/bounce-rate/{organization_id}", response_model=BounceRateResponse)
def get_bounce_rate(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Bounce Rate = Single-Page Sessions / Total Sessions * 100
    Expected model: WebSession(session_id, organization_id, start_time, end_time, pageviews, source, medium, campaign)
    Bounce if pageviews == 1 (or stored boolean).
    """
    end = datetime.utcnow()
    start = end - timedelta(days=365)
    #start, end = _daterange_defaults(start, end)
    WebSession = _safe_model("WebSession")

    total_sessions = 0
    single_page = 0
    if WebSession:
        total_sessions = db.query(func.count(WebSession.session_id)).filter(
            WebSession.organization_id == organization_id,
            WebSession.start_time >= start, WebSession.start_time < end
        ).scalar() or 0

        # try boolean field first; fallback to pageviews
        if hasattr(WebSession, "is_bounce"):
            single_page = db.query(func.count(WebSession.session_id)).filter(
                WebSession.organization_id == organization_id,
                WebSession.start_time >= start, WebSession.start_time < end,
                WebSession.is_bounce == True
            ).scalar() or 0
        else:
            single_page = db.query(func.count(WebSession.session_id)).filter(
                WebSession.organization_id == organization_id,
                WebSession.start_time >= start, WebSession.start_time < end,
                getattr(WebSession, "pageviews", 2) == 1
            ).scalar() or 0

    rate = (single_page / total_sessions * 100.0) if total_sessions > 0 else 0.0
    return BounceRateResponse(
        organization_id=organization_id, start=start, end=end,
        single_page_sessions=single_page, total_sessions=total_sessions,
        bounce_rate_percent=round(rate, 2)
    )


@router.get("/digital/conversion-rate/{organization_id}", response_model=ConversionRateResponse)
def get_conversion_rate(
    organization_id: str,
    goal: str = Query("donation", description="Desired action key, e.g. donation|event_registration|newsletter"),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Conversion Rate = #Visitors Who Completed Desired Action / Total Visitors * 100
    Expected models:
      - WebSession(session_id, organization_id, start_time, user_id?)
      - WebEvent(session_id, event_name, event_time)
    """
    end = datetime.utcnow()
    start = end - timedelta(days=365)
    #start, end = _daterange_defaults(start, end)
    WebSession = _safe_model("WebSession")
    WebEvent   = _safe_model("WebEvent")

    visitors = 0
    conversions = 0
    if WebSession:
        visitors = db.query(func.count(WebSession.session_id)).filter(
            WebSession.organization_id == organization_id,
            WebSession.start_time >= start, WebSession.start_time < end
        ).scalar() or 0

    if WebEvent:
        conversions = db.query(func.count(WebEvent.id)).filter(
            WebEvent.organization_id == organization_id,
            WebEvent.event_time >= start, WebEvent.event_time < end,
            func.lower(WebEvent.event_name) == func.lower(goal)
        ).scalar() or 0

    rate = (conversions / visitors * 100.0) if visitors > 0 else 0.0
    return ConversionRateResponse(
        organization_id=organization_id, start=start, end=end,
        conversions=conversions, total_visitors=visitors,
        conversion_rate_percent=round(rate, 2), goal=goal
    )


@router.get("/digital/email-ctr/{organization_id}", response_model=EmailCTRResponse)
def get_email_ctr(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    CTR = Unique Recipients Who Clicked / Emails Delivered * 100
    Expected models: EmailSend(campaign_id, delivered_at, delivered_count), EmailClick(recipient_id, clicked_at)
    """
    end = datetime.utcnow()
    start = end - timedelta(days=365)
    #start, end = _daterange_defaults(start, end)
    EmailSend  = _safe_model("EmailSend")
    EmailClick = _safe_model("EmailClick")

    delivered = 0
    unique_clicked = 0
    if EmailSend:
        delivered = db.query(func.coalesce(func.sum(EmailSend.delivered_count), 0)).filter(
            EmailSend.organization_id == organization_id,
            EmailSend.delivered_at >= start, EmailSend.delivered_at < end
        ).scalar() or 0
    if EmailClick:
        unique_clicked = db.query(func.count(func.distinct(EmailClick.recipient_id))).filter(
            EmailClick.organization_id == organization_id,
            EmailClick.clicked_at >= start, EmailClick.clicked_at < end
        ).scalar() or 0

    ctr = (unique_clicked / delivered * 100.0) if delivered > 0 else 0.0
    return EmailCTRResponse(
        organization_id=organization_id, start=start, end=end,
        emails_delivered=int(delivered),
        recipients_clicked=int(unique_clicked),
        ctr_percent=round(ctr, 2)
    )


@router.get("/digital/email-open-rate/{organization_id}", response_model=EmailOpenRateResponse)
def get_email_open_rate(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Open Rate = Unique Recipients Who Opened / Emails Delivered * 100
    (Correcting the common typo where opens are confused with clicks.)
    Expected models: EmailSend(delivered_count), EmailOpen(recipient_id, opened_at)
    """
    end = datetime.utcnow()
    start = end - timedelta(days=365)
    #start, end = _daterange_defaults(start, end)
    EmailSend = _safe_model("EmailSend")
    EmailOpen = _safe_model("EmailOpen")

    delivered = 0
    unique_opened = 0
    if EmailSend:
        delivered = db.query(func.coalesce(func.sum(EmailSend.delivered_count), 0)).filter(
            EmailSend.organization_id == organization_id,
            EmailSend.delivered_at >= start, EmailSend.delivered_at < end
        ).scalar() or 0
    if EmailOpen:
        unique_opened = db.query(func.count(func.distinct(EmailOpen.recipient_id))).filter(
            EmailOpen.organization_id == organization_id,
            EmailOpen.opened_at >= start, EmailOpen.opened_at < end
        ).scalar() or 0

    open_rate = (unique_opened / delivered * 100.0) if delivered > 0 else 0.0
    return EmailOpenRateResponse(
        organization_id=organization_id, start=start, end=end,
        emails_delivered=int(delivered),
        recipients_opened=int(unique_opened),
        open_rate_percent=round(open_rate, 2)
    )


@router.get("/digital/sessions/{organization_id}", response_model=SessionsSummaryResponse)
def get_sessions_summary(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Session = single visit. Session Duration = Total Duration / Number of Sessions
    Expected model: WebSession(session_id, start_time, end_time, duration_seconds)
    """
    end = datetime.utcnow()
    start = end - timedelta(days=365)
    #start, end = _daterange_defaults(start, end)
    WebSession = _safe_model("WebSession")

    sessions = 0
    total_duration = 0.0
    if WebSession:
        sessions = db.query(func.count(WebSession.session_id)).filter(
            WebSession.organization_id == organization_id,
            WebSession.start_time >= start, WebSession.start_time < end
        ).scalar() or 0

        # Prefer explicit duration; else compute end-start
        if hasattr(WebSession, "duration_seconds"):
            total_duration = db.query(func.coalesce(func.sum(WebSession.duration_seconds), 0.0)).filter(
                WebSession.organization_id == organization_id,
                WebSession.start_time >= start, WebSession.start_time < end
            ).scalar() or 0.0
        else:
            total_duration = db.query(func.coalesce(func.sum(
                func.extract("epoch", WebSession.end_time) - func.extract("epoch", WebSession.start_time)
            ), 0.0)).filter(
                WebSession.organization_id == organization_id,
                WebSession.start_time >= start, WebSession.start_time < end,
                WebSession.end_time.isnot(None)
            ).scalar() or 0.0

    avg_duration = (total_duration / sessions) if sessions > 0 else 0.0
    return SessionsSummaryResponse(
        organization_id=organization_id, start=start, end=end,
        sessions=int(sessions),
        avg_session_duration_seconds=round(avg_duration, 2)
    )


@router.get("/digital/traffic-sources/{organization_id}", response_model=TrafficBreakdownResponse)
def get_traffic_sources(
    organization_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Traffic Sources: direct | organic | paid | referral | social | email | other
    Expected model: WebSession(source, medium) or UTM-like fields.
    """
    end = datetime.utcnow()
    start = end - timedelta(days=365)
    #start, end = _daterange_defaults(start, end)
    WebSession = _safe_model("WebSession")

    channels = defaultdict(int)
    if WebSession:
        rows = db.query(
            getattr(WebSession, "source", None),
            getattr(WebSession, "medium", None),
            func.count(WebSession.session_id)
        ).filter(
            WebSession.organization_id == organization_id,
            WebSession.start_time >= start, WebSession.start_time < end
        ).group_by(
            getattr(WebSession, "source", None),
            getattr(WebSession, "medium", None)
        ).all()

        for src, med, cnt in rows:
            src_l = (src or "").lower()
            med_l = (med or "").lower()
            # Map to common buckets
            if src_l in ("google", "bing", "duckduckgo") and med_l in ("organic", ""):
                bucket = "organic"
            elif med_l in ("cpc", "ppc", "paid", "display"):
                bucket = "paid"
            elif src_l in ("facebook", "instagram", "twitter", "x", "linkedin", "tiktok", "youtube"):
                bucket = "social"
            elif src_l in ("(direct)", "direct", ""):
                bucket = "direct"
            elif src_l in ("email", "newsletter"):
                bucket = "email"
            else:
                bucket = "referral" if src_l not in ("", "(direct)") else "direct"
            channels[bucket] += int(cnt or 0)

    return TrafficBreakdownResponse(
        organization_id=organization_id, start=start, end=end,
        channels=dict(channels)
    )


@router.get("/digital/social-engagement/{organization_id}", response_model=SocialEngagementResponse)
def get_social_engagement(
    organization_id: str,
    platform: Optional[str] = Query(None, description="e.g., instagram|facebook|linkedin|twitter|tiktok|youtube"),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Social Media Engagement = likes + shares + comments (per post or over a period)
    Expected model: SocialMetric(platform, post_id, posted_at, likes, shares, comments)
    """
    end = datetime.utcnow()
    start = end - timedelta(days=365)
    #start, end = _daterange_defaults(start, end)
    SocialMetric = _safe_model("SocialMetric")

    posts = 0
    engagements = 0
    if SocialMetric:
        filt = [
            SocialMetric.organization_id == organization_id,
            SocialMetric.posted_at >= start, SocialMetric.posted_at < end
        ]
        if platform:
            filt.append(func.lower(SocialMetric.platform) == func.lower(platform))

        rows = db.query(
            func.count(SocialMetric.post_id),
            func.coalesce(func.sum(
                func.coalesce(SocialMetric.likes, 0) +
                func.coalesce(SocialMetric.shares, 0) +
                func.coalesce(SocialMetric.comments, 0)
            ), 0)
        ).filter(*filt).one()

        posts = int(rows[0] or 0)
        engagements = int(rows[1] or 0)

    avg = (engagements / posts) if posts > 0 else 0.0
    return SocialEngagementResponse(
        organization_id=organization_id, start=start, end=end,
        platform=platform, posts=posts,
        total_engagements=engagements,
        avg_engagement_per_post=round(avg, 2)
    )

