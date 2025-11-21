from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
from user_management.superadmin_api import router as superadmin_router
from user_management.auth_route import router as auth_router
from user_management.user_management_api import router as user_management_router
from analytics.analytics import router as analytics_router
from ai_analytics.strategic_planning_analytics import router as strategicplanningrouter
from ai_analytics.quick_actions_api import router as quickactionrouter
#from timeline_analytics import router as timeline_router
from analytics.new_donor_analytics import router as donor_router
from analytics.new_extra_analytics import router as extra_router
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from campaign.campaign_api import router as campaign_router
from campaign.campaign_stats_api import router as campaign_stats_router
from Donation.public_donations_api import router as donations_router
from BasicAPIEndpoints  import router as entityrouter
from org_public_api import router as puborgrouter
from Donation.donation_router import router as donations_org_router
from Donation.programs_router import router as programsrouter
from events.events_api import router as events_router
from campaign.campaign_analytics import router as campaign_analytics_router
from analytics.donor_intelligence import router as donintrouter
from majorgifts.major_gifts_prioritization import router as majorgiftspriorouter
#from user_management.registration_router import router as reg_router
from user_management.user_registration_api import router as reg_router
#from majorgifts.major_gifts_main_router import major_gifts_router as majorgiftsrouter
from majorgifts.highImpactTargets import router as high_impact_router
from majorgifts.major_gifts_api_part1 import router as part1router
from majorgifts.major_gifts_api_part2 import router as part2router
from majorgifts.major_gifts_api_part3 import router as part3router
from analytics.dashboard_endpoints import router as dashboard_router
from analytics.analytics_timeline import router as timeline_router
from analytics.cashflow_churn_api import router as cashflow_router
from analytics.donor_analytics_enhanced import router as enhanced_router
from analytics.golden_triangle_whatif_api import router as golden_router
from analytics.p2sg_dashboard_api import router as p2sg_router
from analytics.second_gift_api import router as second_router
from ai_analytics.feedback_extra_analytics import router as feedbackrouter
from analytics.wise_investor_analytics import router as wise_router
from analytics.predictiveanalytics import  router as predrouter
from analytics.engagement_analytics import router as engagerouter
from analytics.campaignpredictiveanalytics import router as camppredrouter
from analytics.campaign_new_analytics import router as campanalyticsrouter
from ai_analytics.impact_analytics import router as impactrouter
from analytics.major_gifts_api import router as giftsrouter
from analytics.programimpactanalytics import router as proganalytisrouter
from ai_analytics.financial_analytics import router as finhealthrouter
import uvicorn
from campaign.public_campaign_router import router as public_campaign_router
from database import get_db, engine, Base
import models
import schemas



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    print("🚀 Starting up Wise Investor API...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
    print("✅ Application startup complete")

    yield

    # Shutdown
    print("🛑 Shutting down application...")


# Initialize FastAPI app
app = FastAPI(
    title="Wise Investor - Nonprofit Management Platform",
    description="""
    Comprehensive nonprofit management platform with multi-tenant architecture.
    
    ## Authentication
    
    ### Regular Users
    Use `/api/v1/auth/login` endpoint with email and password to get JWT token.
    
    ### Superadmin
    Use `/api/v1/auth/superadmin/login` endpoint with username and password.
    
    **Default Superadmin Credentials:**
    - Username: `superadmin`
    - Password: `SuperAdmin@123`
    
    ### Using the Token
    1. Login and copy the `access_token` from response
    2. Click "Authorize" button (🔓) at top of page
    3. Enter token (no "Bearer" prefix needed)
    4. Click "Authorize"
    
    Now you can test all protected endpoints!
    
    ## Features
    
    - **JWT Authentication:** Secure token-based authentication
    - **Multi-tenant Architecture:** Complete organization isolation
    - **Role-based Access Control:** Admin, Manager, Staff roles
    - **Donor Management:** Track donor lifecycle and engagement
    - **Analytics Dashboard:** Comprehensive metrics and visualizations
    - **Superadmin Panel:** Manage organizations and users
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        #"http://ec2-3-80-216-214.compute-1.amazonaws.com:5173",
        "http://localhost:8000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom OpenAPI schema
def custom_openapi():
    """Custom OpenAPI schema with security configuration"""
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title="Wise Investor API",
        version="1.0.0",
        description="Nonprofit Management Platform API",
        routes=app.routes,
    )

    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter JWT token obtained from login endpoint"
        }
    }

    # Apply security to protected routes
    for path, path_item in openapi_schema["paths"].items():
        # Skip login endpoints
        if "/login" in path or path == "/":
            continue

        # Apply security to all other endpoints
        for method in path_item.values():
            if isinstance(method, dict) and "security" not in method:
                method["security"] = [{"HTTPBearer": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Include routers
app.include_router(auth_router)
app.include_router(superadmin_router)
app.include_router(user_management_router)
app.include_router(events_router)
app.include_router(analytics_router)
app.include_router(high_impact_router)
app.include_router(cashflow_router)
app.include_router(golden_router)
app.include_router(campanalyticsrouter)
app.include_router(enhanced_router)
app.include_router(second_router)
app.include_router(finhealthrouter)
app.include_router(impactrouter)
app.include_router(feedbackrouter)
app.include_router(majorgiftspriorouter)
app.include_router(quickactionrouter)
app.include_router(strategicplanningrouter)
app.include_router(p2sg_router)
app.include_router(wise_router)
app.include_router(predrouter)
app.include_router(proganalytisrouter)
app.include_router(campaign_analytics_router)
app.include_router(donor_router)
app.include_router(extra_router)
app.include_router(campaign_router)
app.include_router(campaign_stats_router)
app.include_router(entityrouter)
app.include_router(part1router)
app.include_router(part2router)
app.include_router(reg_router)
app.include_router(timeline_router)
app.include_router(programsrouter)
app.include_router(donations_org_router)
app.include_router(engagerouter)
app.include_router(camppredrouter)
app.include_router(puborgrouter)
app.include_router(dashboard_router)
#app.include_router(part3router)
app.include_router(public_campaign_router)
app.include_router(donations_router)
app.include_router(donintrouter)
app.include_router(giftsrouter)

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Wise Investor API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "user_login": "/api/v1/auth/login",
            "superadmin_login": "/api/v1/auth/superadmin/login",
            "health": "/health"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "wise-investor-api",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
