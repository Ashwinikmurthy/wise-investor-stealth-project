# campaign_api.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from database import get_db
from user_management.auth_dependencies import get_current_user, CurrentUser
from campaign.campaign_stats_schema import CampaignOrganizationStats
from campaign.campaign_stats_service import calculate_organization_campaign_stats_optimized

router = APIRouter(prefix="/api/v1/campaigns", tags=["campaigns"])


@router.get(
    "/organization/stats",
    response_model=CampaignOrganizationStats,
    summary="Get Organization Campaign Statistics",
    description="""
    Get comprehensive campaign statistics for the authenticated user's organization.
    
    This endpoint provides:
    - Overall campaign counts and financial metrics
    - Donor and engagement statistics
    - Performance indicators (campaigns at goal, above goal, etc.)
    - Breakdown by campaign status and type
    - Top performing campaigns
    - Time-based metrics (ending soon, recently created)
    
    **Authentication Required**: Bearer token with organization_id
    
    **Authorization**: User must belong to the organization
    """,
    responses={
        200: {
            "description": "Campaign statistics retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "total_campaigns": 10,
                        "active_campaigns": 7,
                        "total_goal_amount": 5000000.00,
                        "total_raised_amount": 3250000.00,
                        "overall_completion_rate": 65.0,
                        "total_donors": 1250,
                        "by_status": {
                            "active": 7,
                            "draft": 1,
                            "completed": 2
                        }
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - Invalid or missing token"
        },
        403: {
            "description": "Forbidden - User doesn't belong to an organization"
        },
        500: {
            "description": "Internal server error"
        }
    }
)
def get_organization_campaign_stats(
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get comprehensive campaign statistics for the authenticated user's organization.

    Args:
        current_user: Current authenticated user (from JWT token)
        db: Database session

    Returns:
        CampaignOrganizationStats with all calculated metrics

    Raises:
        HTTPException 403: If user doesn't have an organization_id
        HTTPException 500: If there's an error calculating stats
    """

    # Verify user has an organization
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to an organization"
        )

    try:
        # Calculate statistics for the user's organization
        stats = calculate_organization_campaign_stats_optimized(
            db=db,
            organization_id=current_user.organization_id
        )

        return stats

    except Exception as e:
        # Log the error in production
        print(f"Error calculating campaign stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate campaign statistics"
        )


@router.get(
    "/organization/{organization_id}/stats",
    response_model=CampaignOrganizationStats,
    summary="Get Campaign Statistics for Specific Organization (Superadmin Only)",
    description="""
    Get campaign statistics for a specific organization.
    
    **Authentication Required**: Bearer token
    **Authorization**: Superadmin only
    
    This endpoint allows superadmins to view statistics for any organization.
    """
)
def get_specific_organization_campaign_stats(
        organization_id: UUID,
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get campaign statistics for a specific organization (superadmin only).

    Args:
        organization_id: UUID of the organization
        current_user: Current authenticated user (must be superadmin)
        db: Database session

    Returns:
        CampaignOrganizationStats for the specified organization

    Raises:
        HTTPException 403: If user is not a superadmin
        HTTPException 500: If there's an error calculating stats
    """

    # Verify user is superadmin
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can view stats for other organizations"
        )

    try:
        # Calculate statistics for the specified organization
        stats = calculate_organization_campaign_stats_optimized(
            db=db,
            organization_id=organization_id
        )

        return stats

    except Exception as e:
        print(f"Error calculating campaign stats for org {organization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate campaign statistics"
        )