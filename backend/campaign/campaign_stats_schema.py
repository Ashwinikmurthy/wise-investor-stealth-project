# campaign_schemas.py
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class CampaignStatusStats(BaseModel):
    """Statistics broken down by campaign status"""
    active: int = 0
    draft: int = 0
    completed: int = 0
    paused: int = 0
    archived: int = 0

class CampaignTypeStats(BaseModel):
    """Statistics broken down by campaign type"""
    general: int = 0
    project: int = 0
    emergency: int = 0
    capital: int = 0
    endowment: int = 0
    annual: int = 0

class CampaignOrganizationStats(BaseModel):
    """Comprehensive organization-level campaign statistics"""

    # Overall Counts
    total_campaigns: int = Field(0, description="Total number of campaigns")
    active_campaigns: int = Field(0, description="Number of active campaigns")
    featured_campaigns: int = Field(0, description="Number of featured campaigns")

    # Financial Metrics
    total_goal_amount: Decimal = Field(Decimal('0.00'), description="Sum of all campaign goals")
    total_raised_amount: Decimal = Field(Decimal('0.00'), description="Total amount raised across all campaigns")
    total_remaining_amount: Decimal = Field(Decimal('0.00'), description="Remaining amount to reach all goals")
    overall_completion_rate: float = Field(0.0, description="Overall fundraising completion percentage")
    average_completion_rate: float = Field(0.0, description="Average completion rate per campaign")

    # Donor Metrics
    total_donors: int = Field(0, description="Total unique donors across all campaigns")
    total_donations: int = Field(0, description="Total number of donations")
    average_donation: Decimal = Field(Decimal('0.00'), description="Average donation amount")

    # Campaign Performance
    campaigns_at_goal: int = Field(0, description="Number of campaigns that reached their goal")
    campaigns_above_goal: int = Field(0, description="Number of campaigns that exceeded their goal")
    campaigns_below_50_percent: int = Field(0, description="Campaigns with less than 50% funding")

    # Engagement Metrics
    total_views: int = Field(0, description="Total campaign views")
    total_shares: int = Field(0, description="Total campaign shares")
    average_views_per_campaign: float = Field(0.0, description="Average views per campaign")

    # Breakdown by Status
    by_status: CampaignStatusStats = Field(default_factory=CampaignStatusStats)

    # Breakdown by Type
    by_type: CampaignTypeStats = Field(default_factory=CampaignTypeStats)

    # Top Performers
    highest_raised_campaign_id: Optional[str] = Field(None, description="Campaign with highest amount raised")
    highest_raised_amount: Decimal = Field(Decimal('0.00'), description="Highest amount raised by a single campaign")
    most_donors_campaign_id: Optional[str] = Field(None, description="Campaign with most donors")
    most_donors_count: int = Field(0, description="Highest donor count")

    # Time-based Metrics
    campaigns_ending_soon: int = Field(0, description="Campaigns ending within 30 days")
    campaigns_recently_created: int = Field(0, description="Campaigns created in last 30 days")

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }
        schema_extra = {
            "example": {
                "total_campaigns": 10,
                "active_campaigns": 7,
                "featured_campaigns": 3,
                "total_goal_amount": 5000000.00,
                "total_raised_amount": 3250000.00,
                "total_remaining_amount": 1750000.00,
                "overall_completion_rate": 65.0,
                "average_completion_rate": 62.5,
                "total_donors": 1250,
                "total_donations": 2100,
                "average_donation": 1547.62,
                "campaigns_at_goal": 2,
                "campaigns_above_goal": 1,
                "campaigns_below_50_percent": 3,
                "total_views": 15000,
                "total_shares": 450,
                "average_views_per_campaign": 1500.0,
                "by_status": {
                    "active": 7,
                    "draft": 1,
                    "completed": 2,
                    "paused": 0,
                    "archived": 0
                },
                "by_type": {
                    "general": 2,
                    "project": 4,
                    "emergency": 1,
                    "capital": 2,
                    "endowment": 1,
                    "annual": 0
                },
                "campaigns_ending_soon": 3,
                "campaigns_recently_created": 2
            }
        }