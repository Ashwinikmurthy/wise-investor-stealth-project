# schemas/major_gifts.py
"""
Pydantic schemas for Major Gift Development API endpoints
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class MovesStageEnum(str, Enum):
    IDENTIFICATION = "identification"
    QUALIFICATION = "qualification"
    CULTIVATION = "cultivation"
    SOLICITATION = "solicitation"
    STEWARDSHIP = "stewardship"


class DonorLevelEnum(str, Enum):
    MEGA_DONOR = "mega_donor"
    MAJOR_DONOR = "major_donor"
    MID_LEVEL = "mid_level"
    UPPER_DONOR = "upper_donor"
    LOWER_DONOR = "lower_donor"


class PortfolioRoleEnum(str, Enum):
    CEO = "ceo"
    CDO = "cdo"
    MAJOR_GIFT_OFFICER_A = "major_gift_officer_a"
    MAJOR_GIFT_OFFICER_B = "major_gift_officer_b"
    MAJOR_GIFT_OFFICER_C = "major_gift_officer_c"
    MAJOR_GIFT_OFFICER_D = "major_gift_officer_d"
    MAJOR_GIFT_OFFICER_E = "major_gift_officer_e"


class PriorityLevelEnum(str, Enum):
    PRIORITY_1 = "priority_1"
    PRIORITY_2 = "priority_2"
    PRIORITY_3 = "priority_3"
    PRIORITY_4 = "priority_4"
    PRIORITY_5 = "priority_5"


class ExclusionTagEnum(str, Enum):
    ESTATE_GIFT = "estate_gift"
    BEQUEST = "bequest"
    FOUNDATION_GRANT = "foundation_grant"
    PLANNED_GIFT = "planned_gift"


class MeetingTypeEnum(str, Enum):
    SUBSTANTIVE = "substantive"
    INFORMATIONAL = "informational"
    SOCIAL = "social"
    CULTIVATION = "cultivation"
    SOLICITATION = "solicitation"
    STEWARDSHIP = "stewardship"


class ProposalStatusEnum(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    WITHDRAWN = "withdrawn"


# ============================================================================
# MAJOR GIFT OFFICER SCHEMAS
# ============================================================================

class MajorGiftOfficerBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=100)
    portfolio_role: PortfolioRoleEnum
    is_active: bool = True
    hire_date: Optional[date] = None
    departure_date: Optional[date] = None


class MajorGiftOfficerCreate(MajorGiftOfficerBase):
    user_id: Optional[UUID] = None


class MajorGiftOfficerUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=100)
    portfolio_role: Optional[PortfolioRoleEnum] = None
    is_active: Optional[bool] = None
    hire_date: Optional[date] = None
    departure_date: Optional[date] = None


class MajorGiftOfficer(MajorGiftOfficerBase):
    id: UUID
    organization_id: UUID
    user_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# OFFICER ANNUAL TARGET SCHEMAS
# ============================================================================

class OfficerAnnualTargetBase(BaseModel):
    fiscal_year: int
    target_dollars: Decimal = Field(default=Decimal(0), ge=0)
    target_gift_count: int = Field(default=0, ge=0)
    target_new_donors: int = Field(default=0, ge=0)
    target_meetings: int = Field(default=0, ge=0)
    target_proposals: int = Field(default=0, ge=0)


class OfficerAnnualTargetCreate(OfficerAnnualTargetBase):
    officer_id: UUID


class OfficerAnnualTargetUpdate(BaseModel):
    target_dollars: Optional[Decimal] = Field(None, ge=0)
    target_gift_count: Optional[int] = Field(None, ge=0)
    target_new_donors: Optional[int] = Field(None, ge=0)
    target_meetings: Optional[int] = Field(None, ge=0)
    target_proposals: Optional[int] = Field(None, ge=0)
    actual_dollars: Optional[Decimal] = Field(None, ge=0)
    actual_gift_count: Optional[int] = Field(None, ge=0)
    actual_new_donors: Optional[int] = Field(None, ge=0)
    actual_meetings: Optional[int] = Field(None, ge=0)
    actual_proposals: Optional[int] = Field(None, ge=0)


class OfficerAnnualTarget(OfficerAnnualTargetBase):
    id: UUID
    organization_id: UUID
    officer_id: UUID
    actual_dollars: Decimal
    actual_gift_count: int
    actual_new_donors: int
    actual_meetings: int
    actual_proposals: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# MOVES MANAGEMENT STAGE SCHEMAS
# ============================================================================

class MovesManagementStageBase(BaseModel):
    current_stage: MovesStageEnum
    previous_stage: Optional[MovesStageEnum] = None
    stage_entered_date: date = Field(default_factory=date.today)
    expected_next_stage_date: Optional[date] = None
    last_stage_change_date: Optional[date] = None
    total_interactions: int = Field(default=0, ge=0)
    last_interaction_date: Optional[date] = None
    stage_notes: Optional[str] = None
    next_steps: Optional[str] = None


class MovesManagementStageCreate(MovesManagementStageBase):
    donor_id: UUID
    officer_id: UUID


class MovesManagementStageUpdate(BaseModel):
    current_stage: Optional[MovesStageEnum] = None
    previous_stage: Optional[MovesStageEnum] = None
    expected_next_stage_date: Optional[date] = None
    last_stage_change_date: Optional[date] = None
    total_interactions: Optional[int] = Field(None, ge=0)
    last_interaction_date: Optional[date] = None
    stage_notes: Optional[str] = None
    next_steps: Optional[str] = None


class MovesManagementStage(MovesManagementStageBase):
    id: UUID
    organization_id: UUID
    donor_id: UUID
    officer_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# GIFT GOAL SCHEMAS
# ============================================================================

class GiftGoalBase(BaseModel):
    goal_description: str
    goal_amount: Decimal = Field(..., ge=0)
    campaign_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    program_id: Optional[UUID] = None
    target_date: Optional[date] = None
    target_fiscal_year: Optional[int] = None
    current_committed_amount: Decimal = Field(default=Decimal(0), ge=0)
    current_received_amount: Decimal = Field(default=Decimal(0), ge=0)
    probability_percentage: int = Field(default=50, ge=0, le=100)
    status: str = Field(default="active", max_length=50)
    is_realized: bool = False
    date_realized: Optional[date] = None
    notes: Optional[str] = None


class GiftGoalCreate(GiftGoalBase):
    donor_id: UUID
    officer_id: UUID


class GiftGoalUpdate(BaseModel):
    goal_description: Optional[str] = None
    goal_amount: Optional[Decimal] = Field(None, ge=0)
    campaign_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    program_id: Optional[UUID] = None
    target_date: Optional[date] = None
    target_fiscal_year: Optional[int] = None
    current_committed_amount: Optional[Decimal] = Field(None, ge=0)
    current_received_amount: Optional[Decimal] = Field(None, ge=0)
    probability_percentage: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = Field(None, max_length=50)
    is_realized: Optional[bool] = None
    date_realized: Optional[date] = None
    notes: Optional[str] = None


class GiftGoal(GiftGoalBase):
    id: UUID
    organization_id: UUID
    donor_id: UUID
    officer_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# SOLICITATION PROPOSAL SCHEMAS
# ============================================================================

class SolicitationProposalBase(BaseModel):
    proposal_title: str = Field(..., max_length=255)
    proposal_description: Optional[str] = None
    requested_amount: Decimal = Field(..., ge=0)
    campaign_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    program_id: Optional[UUID] = None
    status: ProposalStatusEnum = ProposalStatusEnum.DRAFT
    date_sent: Optional[date] = None
    expected_decision_date: Optional[date] = None
    date_responded: Optional[date] = None
    response_notes: Optional[str] = None
    committed_amount: Decimal = Field(default=Decimal(0), ge=0)
    received_amount: Decimal = Field(default=Decimal(0), ge=0)
    proposal_document_url: Optional[str] = None


class SolicitationProposalCreate(SolicitationProposalBase):
    donor_id: UUID
    officer_id: UUID


class SolicitationProposalUpdate(BaseModel):
    proposal_title: Optional[str] = Field(None, max_length=255)
    proposal_description: Optional[str] = None
    requested_amount: Optional[Decimal] = Field(None, ge=0)
    campaign_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    program_id: Optional[UUID] = None
    status: Optional[ProposalStatusEnum] = None
    date_sent: Optional[date] = None
    expected_decision_date: Optional[date] = None
    date_responded: Optional[date] = None
    response_notes: Optional[str] = None
    committed_amount: Optional[Decimal] = Field(None, ge=0)
    received_amount: Optional[Decimal] = Field(None, ge=0)
    proposal_document_url: Optional[str] = None


class SolicitationProposal(SolicitationProposalBase):
    id: UUID
    organization_id: UUID
    donor_id: UUID
    officer_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# DONOR MEETING SCHEMAS
# ============================================================================

class DonorMeetingBase(BaseModel):
    meeting_title: str = Field(..., max_length=255)
    meeting_type: MeetingTypeEnum = MeetingTypeEnum.SUBSTANTIVE
    scheduled_date: date
    scheduled_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=255)
    is_virtual: bool = False
    meeting_link: Optional[str] = None
    status: str = Field(default="scheduled", max_length=50)
    is_completed: bool = False
    actual_date: Optional[date] = None
    attendees: Optional[List[str]] = None
    agenda: Optional[str] = None
    meeting_notes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    moves_stage_advanced: bool = False
    gift_discussed: bool = False
    proposal_presented: bool = False


class DonorMeetingCreate(DonorMeetingBase):
    donor_id: UUID
    officer_id: UUID


class DonorMeetingUpdate(BaseModel):
    meeting_title: Optional[str] = Field(None, max_length=255)
    meeting_type: Optional[MeetingTypeEnum] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=255)
    is_virtual: Optional[bool] = None
    meeting_link: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    is_completed: Optional[bool] = None
    actual_date: Optional[date] = None
    attendees: Optional[List[str]] = None
    agenda: Optional[str] = None
    meeting_notes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    moves_stage_advanced: Optional[bool] = None
    gift_discussed: Optional[bool] = None
    proposal_presented: Optional[bool] = None


class DonorMeeting(DonorMeetingBase):
    id: UUID
    organization_id: UUID
    donor_id: UUID
    officer_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# DONOR PORTFOLIO ASSIGNMENT SCHEMAS
# ============================================================================

class DonorPortfolioAssignmentBase(BaseModel):
    assignment_date: date = Field(default_factory=date.today)
    is_primary: bool = True
    is_active: bool = True
    deactivation_date: Optional[date] = None
    deactivation_reason: Optional[str] = None
    assignment_notes: Optional[str] = None


class DonorPortfolioAssignmentCreate(DonorPortfolioAssignmentBase):
    donor_id: UUID
    officer_id: UUID


class DonorPortfolioAssignmentUpdate(BaseModel):
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    deactivation_date: Optional[date] = None
    deactivation_reason: Optional[str] = None
    assignment_notes: Optional[str] = None


class DonorPortfolioAssignment(DonorPortfolioAssignmentBase):
    id: UUID
    organization_id: UUID
    donor_id: UUID
    officer_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# DONOR EXCLUSION TAG SCHEMAS
# ============================================================================

class DonorExclusionTagBase(BaseModel):
    exclusion_tag: ExclusionTagEnum
    tag_applied_date: date = Field(default_factory=date.today)
    tag_removed_date: Optional[date] = None
    is_active: bool = True
    notes: Optional[str] = None


class DonorExclusionTagCreate(DonorExclusionTagBase):
    donor_id: UUID


class DonorExclusionTagUpdate(BaseModel):
    tag_removed_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class DonorExclusionTag(DonorExclusionTagBase):
    id: UUID
    organization_id: UUID
    donor_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# DONOR PRIORITY CACHE SCHEMAS
# ============================================================================

class DonorPriorityCacheBase(BaseModel):
    current_donor_level: Optional[DonorLevelEnum] = None
    priority_level: Optional[PriorityLevelEnum] = None
    current_year_total: Decimal = Field(default=Decimal(0), ge=0)
    last_year_total: Decimal = Field(default=Decimal(0), ge=0)
    two_years_ago_total: Decimal = Field(default=Decimal(0), ge=0)
    year_2023_total: Decimal = Field(default=Decimal(0), ge=0)
    year_2022_total: Decimal = Field(default=Decimal(0), ge=0)
    largest_gift_amount: Decimal = Field(default=Decimal(0), ge=0)
    largest_gift_date: Optional[date] = None
    opportunity_amount: Decimal = Field(default=Decimal(0), ge=0)
    opportunity_basis: Optional[str] = None
    yoy_dollar_change: Decimal = Decimal(0)
    yoy_percentage_change: Optional[Decimal] = None
    gift_count_current_year: int = Field(default=0, ge=0)
    gift_count_last_year: int = Field(default=0, ge=0)
    gift_count_two_years_ago: int = Field(default=0, ge=0)
    last_gift_date: Optional[date] = None
    days_since_last_gift: Optional[int] = Field(None, ge=0)
    assigned_officer_id: Optional[UUID] = None
    portfolio_role: Optional[PortfolioRoleEnum] = None
    has_exclusion_tag: bool = False
    exclusion_tags: Optional[List[str]] = None
    calculation_date: date = Field(default_factory=date.today)
    is_current: bool = True


class DonorPriorityCacheCreate(DonorPriorityCacheBase):
    donor_id: UUID


class DonorPriorityCache(DonorPriorityCacheBase):
    id: UUID
    organization_id: UUID
    donor_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# DONOR GIVING SEGMENT SCHEMAS
# ============================================================================

class DonorGivingSegmentBase(BaseModel):
    fiscal_year: int
    reporting_date: date = Field(default_factory=date.today)

    # Mega Donors
    mega_donor_ytd_amount: Decimal = Field(default=Decimal(0), ge=0)
    mega_donor_ytd_count: int = Field(default=0, ge=0)
    mega_donor_ly_amount: Decimal = Field(default=Decimal(0), ge=0)
    mega_donor_ly_count: int = Field(default=0, ge=0)
    mega_donor_2ya_amount: Decimal = Field(default=Decimal(0), ge=0)
    mega_donor_2ya_count: int = Field(default=0, ge=0)
    mega_donor_yoy_variance_pct: Optional[Decimal] = None

    # Major Donors
    major_donor_ytd_amount: Decimal = Field(default=Decimal(0), ge=0)
    major_donor_ytd_count: int = Field(default=0, ge=0)
    major_donor_ly_amount: Decimal = Field(default=Decimal(0), ge=0)
    major_donor_ly_count: int = Field(default=0, ge=0)
    major_donor_2ya_amount: Decimal = Field(default=Decimal(0), ge=0)
    major_donor_2ya_count: int = Field(default=0, ge=0)
    major_donor_yoy_variance_pct: Optional[Decimal] = None

    # Mid-Level
    mid_level_ytd_amount: Decimal = Field(default=Decimal(0), ge=0)
    mid_level_ytd_count: int = Field(default=0, ge=0)
    mid_level_ly_amount: Decimal = Field(default=Decimal(0), ge=0)
    mid_level_ly_count: int = Field(default=0, ge=0)
    mid_level_2ya_amount: Decimal = Field(default=Decimal(0), ge=0)
    mid_level_2ya_count: int = Field(default=0, ge=0)
    mid_level_yoy_variance_pct: Optional[Decimal] = None

    # Totals
    total_ytd_amount: Decimal = Field(default=Decimal(0), ge=0)
    total_ytd_count: int = Field(default=0, ge=0)
    total_ly_amount: Decimal = Field(default=Decimal(0), ge=0)
    total_ly_count: int = Field(default=0, ge=0)
    total_2ya_amount: Decimal = Field(default=Decimal(0), ge=0)
    total_2ya_count: int = Field(default=0, ge=0)
    total_yoy_variance_pct: Optional[Decimal] = None


class DonorGivingSegmentCreate(DonorGivingSegmentBase):
    pass


class DonorGivingSegment(DonorGivingSegmentBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# KPI SUMMARY SCHEMAS (FOR DASHBOARD)
# ============================================================================

class OfficerKPISummary(BaseModel):
    """Summary of officer KPIs for dashboard"""
    officer_id: UUID
    officer_name: str
    portfolio_role: PortfolioRoleEnum

    # Portfolio breakdown by stage
    identification_count: int
    qualification_count: int
    cultivation_count: int
    solicitation_count: int
    stewardship_count: int
    total_donors: int

    # Gift goals
    total_goal_value: Decimal
    total_committed: Decimal
    total_received: Decimal

    # Proposals
    proposals_sent_count: int
    proposals_sent_value: Decimal

    # Meetings
    meetings_last_week: int
    meetings_upcoming_week: int

    # YTD Performance
    ytd_dollars: Decimal
    ytd_gift_count: int
    target_dollars: Decimal
    target_gift_count: int
    dollars_vs_target: Decimal
    percent_of_dollar_target: Decimal

    model_config = ConfigDict(from_attributes=True)


class PriorityOpportunitySummary(BaseModel):
    """Summary of opportunities by priority level"""
    priority_level: PriorityLevelEnum
    donor_count: int
    total_opportunity_value: Decimal
    avg_opportunity_value: Decimal
    current_year_total: Decimal
    last_year_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class SegmentYTDComparison(BaseModel):
    """YTD segment comparison across years"""
    fiscal_year: int
    reporting_date: date

    # Totals
    current_ytd_amount: Decimal
    current_ytd_count: int
    last_year_ytd_amount: Decimal
    last_year_ytd_count: int
    two_years_ago_ytd_amount: Decimal
    two_years_ago_ytd_count: int
    yoy_variance_pct: Optional[Decimal]

    # By donor level
    mega_donors: dict
    major_donors: dict
    mid_level: dict

    model_config = ConfigDict(from_attributes=True)
class MeetingBase(BaseModel):
    donor_id: UUID
    officer_id: Optional[UUID] = None
    meeting_date: datetime
    meeting_type: str = Field(..., description="e.g., Discovery, Cultivation, Solicitation, Stewardship")
    purpose: Optional[str] = None
    outcome: Optional[str] = None
    next_steps: Optional[str] = None
class MeetingUpdate(BaseModel):
    """Schema for updating a meeting"""
    officer_id: Optional[UUID] = None
    meeting_date: Optional[datetime] = None
    meeting_type: Optional[str] = None
    purpose: Optional[str] = None
    outcome: Optional[str] = None
    next_steps: Optional[str] = None

class MeetingResponse(MeetingBase):
    """Schema for meeting response - THIS IS WHAT YOU NEED"""
    id: UUID
    organization_id: UUID
    donor_name: str
    officer_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
class ProposalBase(BaseModel):
    donor_id: UUID
    officer_id: Optional[UUID] = None
    proposal_date: datetime
    requested_amount: Decimal
    purpose: Optional[str] = None
    status: str = Field(default="draft", description="draft, sent, under_review, accepted, declined")
    decision_date: Optional[datetime] = None
    received_amount: Optional[Decimal] = None

class ProposalCreate(ProposalBase):
    """Schema for creating a new proposal"""
    pass

class ProposalUpdate(BaseModel):
    """Schema for updating a proposal"""
    officer_id: Optional[UUID] = None
    proposal_date: Optional[datetime] = None
    requested_amount: Optional[Decimal] = None
    purpose: Optional[str] = None
    status: Optional[str] = None
    decision_date: Optional[datetime] = None
    received_amount: Optional[Decimal] = None

class ProposalResponse(ProposalBase):
    """Schema for proposal response"""
    id: UUID
    organization_id: UUID
    donor_name: str
    officer_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            Decimal: lambda v: float(v) if v else None
        }

class ProposalSummaryResponse(BaseModel):
    """Summary statistics for proposals by officer"""
    officer_id: Optional[UUID]
    officer_name: str
    officer_role: Optional[str] = None
    total_proposals_sent: int
    total_proposal_amount: Decimal
    proposals_accepted: int
    proposals_pending: int
    proposals_declined: int
    total_accepted_amount: Decimal

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v else 0.0
        }

# ========================================
# PORTFOLIO SCHEMAS
# ========================================

class PortfolioAssignmentBase(BaseModel):
    donor_id: UUID
    officer_id: UUID
    stage_id: UUID
    assignment_date: datetime
    expected_ask_amount: Optional[Decimal] = None
    expected_ask_date: Optional[datetime] = None
    priority_score: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None

class PortfolioAssignmentCreate(PortfolioAssignmentBase):
    """Schema for creating a portfolio assignment"""
    pass

class PortfolioAssignmentUpdate(BaseModel):
    """Schema for updating a portfolio assignment"""
    officer_id: Optional[UUID] = None
    stage_id: Optional[UUID] = None
    assignment_date: Optional[datetime] = None
    expected_ask_amount: Optional[Decimal] = None
    expected_ask_date: Optional[datetime] = None
    priority_score: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None

class PortfolioAssignmentResponse(PortfolioAssignmentBase):
    """Schema for portfolio assignment response"""
    id: UUID
    organization_id: UUID
    donor_name: str
    officer_name: str
    stage_name: str
    last_contact_date: Optional[datetime] = None
    next_action: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            Decimal: lambda v: float(v) if v else None
        }

# ========================================
# OFFICER SCHEMAS
# ========================================

class OfficerBase(BaseModel):
    user_id: Optional[UUID] = None
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    officer_role: Optional[str] = None
    portfolio_name: Optional[str] = None
    max_portfolio_size: Optional[int] = Field(None, ge=1)
    annual_goal: Optional[Decimal] = None

class OfficerCreate(OfficerBase):
    """Schema for creating an officer"""
    pass

class OfficerUpdate(BaseModel):
    """Schema for updating an officer"""
    user_id: Optional[UUID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    officer_role: Optional[str] = None
    portfolio_name: Optional[str] = None
    max_portfolio_size: Optional[int] = Field(None, ge=1)
    annual_goal: Optional[Decimal] = None

class OfficerResponse(OfficerBase):
    """Schema for officer response"""
    id: UUID
    organization_id: UUID
    current_portfolio_size: int = 0
    ytd_raised: Decimal = Decimal("0.00")
    goal_progress_percentage: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            Decimal: lambda v: float(v) if v else None
        }

# ========================================
# MOVES MANAGEMENT STAGE SCHEMAS
# ========================================

class StageBase(BaseModel):
    stage_name: str = Field(..., description="e.g., Identification, Qualification, Cultivation, Solicitation, Stewardship")
    stage_order: int = Field(..., ge=1, le=10)
    description: Optional[str] = None
    typical_duration_days: Optional[int] = None

class StageCreate(StageBase):
    """Schema for creating a stage"""
    pass

class StageResponse(StageBase):
    """Schema for stage response"""
    id: UUID
    organization_id: UUID
    active_donors_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# ========================================
# ANALYTICS SCHEMAS
# ========================================

class PipelineMetrics(BaseModel):
    """Schema for pipeline analytics"""
    stage_name: str
    donor_count: int
    total_expected_amount: Decimal
    average_expected_amount: Decimal
    average_days_in_stage: float

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v else 0.0
        }

class OfficerProductivity(BaseModel):
    """Schema for officer productivity metrics"""
    officer_id: UUID
    officer_name: str
    total_meetings: int
    total_proposals: int
    total_raised: Decimal
    portfolio_size: int
    avg_days_to_move: float

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v else 0.0
        }

class GiftGoalBase(BaseModel):
    officer_id: UUID
    fiscal_year: int
    annual_goal: Decimal
    q1_goal: Optional[Decimal] = None
    q2_goal: Optional[Decimal] = None
    q3_goal: Optional[Decimal] = None
    q4_goal: Optional[Decimal] = None

class GiftGoalCreate(GiftGoalBase):
    """Schema for creating a gift goal"""
    pass
class MeetingCreate(MeetingBase):
    """Schema for creating a new meeting"""
    pass

class GiftGoalResponse(GiftGoalBase):
    """Schema for gift goal response"""
    id: UUID
    organization_id: UUID
    officer_name: str
    ytd_raised: Decimal = Decimal("0.00")
    goal_progress_percentage: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            Decimal: lambda v: float(v) if v else None
        }

# ========================================
# EXPORT FOR EASY IMPORTING
# ========================================

__all__ = [
    # Meeting schemas
    "MeetingBase",
    "MeetingCreate",
    "MeetingUpdate",
    "MeetingResponse",

    # Proposal schemas
    "ProposalBase",
    "ProposalCreate",
    "ProposalUpdate",
    "ProposalResponse",
    "ProposalSummaryResponse",

    # Portfolio schemas
    "PortfolioAssignmentBase",
    "PortfolioAssignmentCreate",
    "PortfolioAssignmentUpdate",
    "PortfolioAssignmentResponse",

    # Officer schemas
    "OfficerBase",
    "OfficerCreate",
    "OfficerUpdate",
    "OfficerResponse",

    # Stage schemas
    "StageBase",
    "StageCreate",
    "StageResponse",

    # Analytics schemas
    "PipelineMetrics",
    "OfficerProductivity",
    "GiftGoalBase",
    "GiftGoalCreate",
    "GiftGoalResponse",
]
