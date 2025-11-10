"""
Public Organizations API
Provides unauthenticated access to list organizations for user registration
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from pydantic import BaseModel, Field
from uuid import UUID
from database import get_db
from models import Organizations
# Import your database session dependency
# Adjust this import based on your project structure
# from app.database import get_db
# from app.models import Organizations

router = APIRouter(prefix="/api/v1/public", tags=["Public"])


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class OrganizationPublicResponse(BaseModel):
    """Public information about an organization"""
    id: str
    name: str
    description: str | None = None
    industry: str | None = None
    website: str | None = None
    city: str | None = None
    state: str | None = None

    class Config:
        from_attributes = True


# ============================================================================
# PUBLIC ENDPOINTS (NO AUTHENTICATION REQUIRED)
# ============================================================================

@router.get("/organizations", response_model=List[OrganizationPublicResponse])
async def list_all_organizations(
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100
):
    """
    Get list of all organizations for registration purposes.

    **This endpoint does not require authentication.**

    Parameters:
    - skip: Number of records to skip (pagination)
    - limit: Maximum number of records to return (max 100)

    Returns:
    - List of organizations with basic public information

    Example response:
    ```json
    [
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Hope Foundation",
            "description": "Providing hope to communities in need",
            "industry": "Healthcare",
            "website": "https://hopefoundation.org",
            "city": "New York",
            "state": "NY"
        }
    ]
    ```
    """
    try:
        # Limit the maximum records that can be fetched
        if limit > 100:
            limit = 100

        # Query organizations
        stmt = select(Organizations).offset(skip).limit(limit)
        result = db.execute(stmt)
        organizations = result.scalars().all()

        # Convert to response model
        org_list = []
        for org in organizations:
            org_list.append(OrganizationPublicResponse(
                id=str(org.id),
                name=org.name,
                mission=org.mission,
                #industry=org.industry,
                website=org.website,
                city=org.city,
                state=org.state
            ))

        return org_list

    except Exception as e:
        print(f"Error fetching organizations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve organizations"
        )


@router.get("/organizations/search", response_model=List[OrganizationPublicResponse])
async def search_organizations(
        query: str,
        db: Session = Depends(get_db),
        limit: int = 20
):
    """
    Search organizations by name.

    **This endpoint does not require authentication.**

    Parameters:
    - query: Search term (searches in organization name)
    - limit: Maximum number of results to return (max 50)

    Returns:
    - List of matching organizations

    Example:
    ```
    GET /api/v1/public/organizations/search?query=foundation
    ```
    """
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(
                status_code=400,
                detail="Search query must be at least 2 characters"
            )

        if limit > 50:
            limit = 50

        # Search organizations by name (case-insensitive)
        stmt = select(Organizations).where(
            Organizations.name.ilike(f"%{query}%")
        ).limit(limit)

        result = db.execute(stmt)
        organizations = result.scalars().all()

        # Convert to response model
        org_list = []
        for org in organizations:
            org_list.append(OrganizationPublicResponse(
                id=str(org.id),
                name=org.name,
                description=org.description,
                industry=org.industry,
                website=org.website,
                city=org.city,
                state=org.state
            ))

        return org_list

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching organizations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to search organizations"
        )


@router.get("/organizations/count")
async def get_organizations_count(db: Session = Depends(get_db)):
    """
    Get the total count of organizations.

    **This endpoint does not require authentication.**

    Returns:
    - Total number of organizations in the system

    Example response:
    ```json
    {
        "count": 42,
        "message": "Total organizations available for registration"
    }
    ```
    """
    try:
        stmt = select(Organizations)
        result = db.execute(stmt)
        count = len(result.scalars().all())

        return {
            "count": count,
            "message": "Total organizations available for registration"
        }

    except Exception as e:
        print(f"Error counting organizations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to count organizations"
        )


# ============================================================================
# INTEGRATION NOTES
# ============================================================================

"""
INTEGRATION INSTRUCTIONS:

1. Add this router to your main FastAPI application:

   from organizations_public_api import router as public_org_router
   
   app.include_router(public_org_router)

2. Make sure your Organizations model has these fields:
   - id (UUID)
   - name (String)
   - description (String, optional)
   - industry (String, optional)
   - website (String, optional)
   - city (String, optional)
   - state (String, optional)

3. Update the imports at the top of this file:
   - Replace 'get_db' with your actual database session dependency
   - Replace 'Organizations' with your actual Organizations model

4. Test the endpoint:
   
   # List all organizations
   curl http://localhost:8000/api/v1/public/organizations
   
   # Search organizations
   curl http://localhost:8000/api/v1/public/organizations/search?query=hope
   
   # Get count
   curl http://localhost:8000/api/v1/public/organizations/count

5. Use in your React registration form:

   const fetchOrganizations = async () => {
     const response = await fetch(
       'http://your-api-url/api/v1/public/organizations'
     );
     const data = await response.json();
     setOrganizations(data);
   };

6. SECURITY NOTES:
   - This endpoint is PUBLIC (no authentication required)
   - Only exposes non-sensitive organization information
   - Rate limiting recommended in production
   - Consider caching the results for better performance
"""
