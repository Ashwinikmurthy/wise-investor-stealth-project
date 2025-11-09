
Wise Investor - Part 3: Backend API Documentation
Complete Endpoint Reference
Version: 1.0.0
Last Updated: November 2025

Table of Contents
	1. API Overview
	2. Authentication Endpoints
	3. Organization Management
	4. User Management
	5. Donor Management
	6. Campaign Management
	7. Donation Management
	8. Major Gifts Management
	9. Analytics & Reporting
	10. Event Management
	11. Segment Management
	12. File Upload & Export

1. API Overview
1.1 Base URL
Production: https://api.wise-investor.com
Development: http://localhost:8000
1.2 API Versioning
All endpoints are versioned and prefixed with /api/v1/
/api/v1/donors
/api/v1/campaigns
/api/v1/donations
1.3 Authentication
Most endpoints require authentication using JWT Bearer tokens:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
1.4 Request Format
	• Content-Type: application/json
	• Character Encoding: UTF-8
	• Date Format: ISO 8601 (2024-11-08T10:30:00Z)
1.5 Response Format
Success Response
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Invalid email format"],
      "amount": ["Must be greater than 0"]
    },
    "timestamp": "2024-11-08T10:30:00Z",
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
1.6 HTTP Status Codes
Code	Meaning	Usage
200	OK	Successful GET, PUT, PATCH
201	Created	Successful POST
204	No Content	Successful DELETE
400	Bad Request	Invalid request data
401	Unauthorized	Missing or invalid authentication
403	Forbidden	Insufficient permissions
404	Not Found	Resource doesn't exist
409	Conflict	Resource already exists
422	Unprocessable Entity	Validation errors
429	Too Many Requests	Rate limit exceeded
500	Internal Server Error	Server error
503	Service Unavailable	Maintenance mode
1.7 Pagination
List endpoints support pagination:
GET /api/v1/donors?page=2&per_page=50
Response includes pagination metadata:
{
  "data": [...],
  "meta": {
    "page": 2,
    "per_page": 50,
    "total": 1250,
    "total_pages": 25,
    "has_next": true,
    "has_prev": true
  }
}
1.8 Filtering
GET /api/v1/donors?lifecycle_stage=major_donor&lifetime_value_min=10000
1.9 Sorting
GET /api/v1/donors?sort=-last_donation_date,first_name
Prefix with - for descending order.
1.10 Search
GET /api/v1/donors?search=john+smith
1.11 Field Selection
GET /api/v1/donors?fields=id,first_name,last_name,email,lifetime_value

2. Authentication Endpoints
2.1 POST /api/public/login
Authenticate user and receive JWT token.
Request:
POST /api/public/login
Content-Type: application/json
{
  "username": "user@example.com",
  "password": "SecurePassword123!"
}
Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "organization_id": 5,
    "organization_name": "Sample Nonprofit",
    "permissions": [
      "donor:read",
      "donor:create",
      "donor:update",
      "campaign:read",
      "donation:create"
    ]
  }
}
Error Responses:
// 401 Unauthorized
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Incorrect email or password"
  }
}
// 403 Forbidden
{
  "error": {
    "code": "ACCOUNT_INACTIVE",
    "message": "Your account has been deactivated"
  }
}
// 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Please try again in 15 minutes"
  }
}
2.2 POST /api/public/register
Register new organization (if self-registration is enabled).
Request:
POST /api/public/register
Content-Type: application/json
{
  "organization_name": "New Nonprofit",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@newnonprofit.org",
  "password": "SecurePassword123!",
  "phone": "+1-555-0123"
}
Response (201 Created):
{
  "message": "Organization created successfully",
  "organization_id": 42,
  "user_id": 150,
  "verification_email_sent": true
}
2.3 POST /api/public/forgot-password
Request password reset.
Request:
POST /api/public/forgot-password
Content-Type: application/json
{
  "email": "user@example.com"
}
Response (200 OK):
{
  "message": "Password reset instructions sent to your email"
}
2.4 POST /api/public/reset-password
Reset password with token.
Request:
POST /api/public/reset-password
Content-Type: application/json
{
  "token": "abc123xyz789",
  "new_password": "NewSecurePassword123!"
}
Response (200 OK):
{
  "message": "Password reset successfully"
}
2.5 POST /api/v1/auth/refresh
Refresh JWT token (requires valid token).
Request:
POST /api/v1/auth/refresh
Authorization: Bearer <current_token>
Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
2.6 POST /api/v1/auth/logout
Logout (invalidate token).
Request:
POST /api/v1/auth/logout
Authorization: Bearer <token>
Response (204 No Content)
2.7 GET /api/v1/auth/me
Get current user information.
Request:
GET /api/v1/auth/me
Authorization: Bearer <token>
Response (200 OK):
{
  "id": 123,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "admin",
  "organization_id": 5,
  "organization": {
    "id": 5,
    "name": "Sample Nonprofit",
    "status": "active"
  },
  "permissions": ["donor:read", "donor:create", "..."],
  "last_login": "2024-11-08T09:30:00Z",
  "created_at": "2023-01-15T10:00:00Z"
}

3. Organization Management
3.1 GET /api/v1/organizations
List all organizations (Superadmin only).
Request:
GET /api/v1/organizations?page=1&per_page=20&status=active
Authorization: Bearer <superadmin_token>
Query Parameters:
	• page (integer): Page number (default: 1)
	• per_page (integer): Items per page (default: 20, max: 100)
	• status (string): Filter by status (active, trial, suspended)
	• search (string): Search by name or email
	• sort (string): Sort field(s)
Response (200 OK):
{
  "data": [
    {
      "id": 1,
      "name": "Example Nonprofit",
      "subdomain": "example",
      "status": "active",
      "subscription_plan": "professional",
      "contact_email": "admin@example.org",
      "total_users": 15,
      "total_donors": 1250,
      "total_revenue": 450000.00,
      "created_at": "2023-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 50,
    "total_pages": 3
  }
}
3.2 POST /api/v1/organizations
Create new organization (Superadmin only).
Request:
POST /api/v1/organizations
Authorization: Bearer <superadmin_token>
Content-Type: application/json
{
  "name": "New Charity Foundation",
  "subdomain": "newcharity",
  "contact_email": "admin@newcharity.org",
  "contact_phone": "+1-555-9876",
  "admin_first_name": "Sarah",
  "admin_last_name": "Johnson",
  "admin_email": "sarah@newcharity.org",
  "subscription_plan": "professional",
  "ein": "12-3456789",
  "address": {
    "line1": "123 Charity St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94102",
    "country": "USA"
  }
}
Response (201 Created):
{
  "id": 51,
  "name": "New Charity Foundation",
  "subdomain": "newcharity",
  "status": "trial",
  "trial_end_date": "2024-12-08",
  "admin_user": {
    "id": 201,
    "email": "sarah@newcharity.org",
    "temporary_password": "TempPass123!"
  },
  "created_at": "2024-11-08T10:30:00Z"
}
3.3 GET /api/v1/organizations/{org_id}
Get organization details.
Request:
GET /api/v1/organizations/5
Authorization: Bearer <token>
Response (200 OK):
{
  "id": 5,
  "name": "Sample Nonprofit",
  "subdomain": "sample",
  "slug": "sample-nonprofit",
  "contact_email": "info@sample.org",
  "contact_phone": "+1-555-1234",
  "website": "https://sample.org",
  "address": {
    "line1": "456 Nonprofit Ave",
    "line2": "Suite 200",
    "city": "Boston",
    "state": "MA",
    "postal_code": "02108",
    "country": "USA"
  },
  "ein": "98-7654321",
  "mission_statement": "To empower communities through education...",
  "founding_year": 2010,
  "organization_type": "nonprofit",
  "status": "active",
  "subscription_plan": "professional",
  "subscription_started_at": "2023-06-01T00:00:00Z",
  "settings": {
    "currency": "USD",
    "fiscal_year_start": "01-01",
    "timezone": "America/New_York",
    "donation_receipt_template": "default"
  },
  "branding": {
    "logo_url": "https://cdn.wise-investor.com/logos/5.png",
    "primary_color": "#0066CC",
    "secondary_color": "#FF6600"
  },
  "statistics": {
    "total_users": 15,
    "total_donors": 1250,
    "total_donations": 8500,
    "lifetime_revenue": 2750000.00,
    "active_campaigns": 3
  },
  "created_at": "2023-01-15T10:00:00Z",
  "updated_at": "2024-11-08T09:00:00Z"
}
3.4 PUT /api/v1/organizations/{org_id}
Update organization (Admin+ permission).
Request:
PUT /api/v1/organizations/5
Authorization: Bearer <admin_token>
Content-Type: application/json
{
  "name": "Sample Nonprofit (Updated)",
  "contact_phone": "+1-555-5678",
  "website": "https://www.sample.org",
  "settings": {
    "currency": "USD",
    "fiscal_year_start": "07-01",
    "timezone": "America/New_York"
  }
}
Response (200 OK):
{
  "id": 5,
  "name": "Sample Nonprofit (Updated)",
  "contact_phone": "+1-555-5678",
  "website": "https://www.sample.org",
  "updated_at": "2024-11-08T10:45:00Z"
}

4. User Management
4.1 GET /api/v1/users
List users in organization.
Request:
GET /api/v1/users?role=admin&is_active=true
Authorization: Bearer <token>
Query Parameters:
	• role (string): Filter by role
	• is_active (boolean): Filter by active status
	• search (string): Search by name or email
Response (200 OK):
{
  "data": [
    {
      "id": 123,
      "email": "john.doe@sample.org",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin",
      "is_active": true,
      "last_login": "2024-11-08T09:30:00Z",
      "created_at": "2023-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 15
  }
}
4.2 POST /api/v1/users
Create new user (Admin permission required).
Request:
POST /api/v1/users
Authorization: Bearer <admin_token>
Content-Type: application/json
{
  "email": "newuser@sample.org",
  "first_name": "Alice",
  "last_name": "Williams",
  "role": "user",
  "phone": "+1-555-4321",
  "password": "TempPassword123!",
  "send_welcome_email": true
}
Response (201 Created):
{
  "id": 156,
  "email": "newuser@sample.org",
  "first_name": "Alice",
  "last_name": "Williams",
  "role": "user",
  "is_active": true,
  "created_at": "2024-11-08T10:50:00Z"
}
4.3 GET /api/v1/users/{user_id}
Get user details.
Request:
GET /api/v1/users/156
Authorization: Bearer <token>
Response (200 OK):
{
  "id": 156,
  "email": "alice.williams@sample.org",
  "first_name": "Alice",
  "last_name": "Williams",
  "phone": "+1-555-4321",
  "role": "user",
  "permissions": ["donor:read", "donor:create", "campaign:read"],
  "is_active": true,
  "is_verified": true,
  "last_login": "2024-11-08T08:15:00Z",
  "login_count": 42,
  "timezone": "America/New_York",
  "language": "en",
  "preferences": {
    "email_notifications": true,
    "dashboard_layout": "default"
  },
  "created_at": "2024-11-01T10:50:00Z",
  "updated_at": "2024-11-08T08:15:00Z"
}
4.4 PUT /api/v1/users/{user_id}
Update user.
Request:
PUT /api/v1/users/156
Authorization: Bearer <admin_token>
Content-Type: application/json
{
  "first_name": "Alice",
  "last_name": "Williams-Smith",
  "phone": "+1-555-8888",
  "role": "manager"
}
Response (200 OK):
{
  "id": 156,
  "first_name": "Alice",
  "last_name": "Williams-Smith",
  "phone": "+1-555-8888",
  "role": "manager",
  "updated_at": "2024-11-08T11:00:00Z"
}
4.5 DELETE /api/v1/users/{user_id}
Deactivate user.
Request:
DELETE /api/v1/users/156
Authorization: Bearer <admin_token>
Response (204 No Content)

5. Donor Management
5.1 GET /api/v1/donors
List donors with filtering and pagination.
Request:
GET /api/v1/donors?lifecycle_stage=major_donor&sort=-lifetime_value&page=1&per_page=50
Authorization: Bearer <token>
Query Parameters:
	• lifecycle_stage (string): Filter by lifecycle stage
	• donor_type (string): Filter by donor type (individual, organization)
	• lifetime_value_min (number): Minimum lifetime value
	• lifetime_value_max (number): Maximum lifetime value
	• last_donation_after (date): Donated after date
	• last_donation_before (date): Donated before date
	• search (string): Search by name, email, or organization
	• sort (string): Sort field(s)
	• fields (string): Comma-separated fields to return
Response (200 OK):
{
  "data": [
    {
      "id": 1001,
      "donor_type": "individual",
      "first_name": "Robert",
      "last_name": "Johnson",
      "email": "robert.j@email.com",
      "phone": "+1-555-7890",
      "address": {
        "line1": "789 Donor Ln",
        "city": "Seattle",
        "state": "WA",
        "postal_code": "98101"
      },
      "lifecycle_stage": "major_donor",
      "lifetime_value": 125000.00,
      "total_donations": 45,
      "average_gift": 2777.78,
      "largest_gift": 50000.00,
      "first_donation_date": "2018-03-15T00:00:00Z",
      "last_donation_date": "2024-10-25T00:00:00Z",
      "engagement_score": 95,
      "tags": ["board_member", "major_donor", "monthly_donor"],
      "is_active": true,
      "created_at": "2018-03-01T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 237,
    "total_pages": 5,
    "filters_applied": {
      "lifecycle_stage": "major_donor"
    }
  }
}
5.2 POST /api/v1/donors
Create new donor.
Request:
POST /api/v1/donors
Authorization: Bearer <token>
Content-Type: application/json
{
  "donor_type": "individual",
  "first_name": "Emily",
  "last_name": "Chen",
  "email": "emily.chen@email.com",
  "phone": "+1-555-9999",
  "address": {
    "line1": "456 Park Ave",
    "line2": "Apt 3B",
    "city": "New York",
    "state": "NY",
    "postal_code": "10022",
    "country": "USA"
  },
  "date_of_birth": "1985-07-20",
  "employer": "Tech Corp",
  "job_title": "Senior Engineer",
  "preferred_contact_method": "email",
  "email_opt_in": true,
  "source": "website",
  "tags": ["tech_industry", "online_donor"]
}
Response (201 Created):
{
  "id": 1523,
  "donor_type": "individual",
  "first_name": "Emily",
  "last_name": "Chen",
  "email": "emily.chen@email.com",
  "lifecycle_stage": "prospect",
  "engagement_score": 0,
  "lifetime_value": 0.00,
  "total_donations": 0,
  "created_at": "2024-11-08T11:15:00Z"
}
Error Response (409 Conflict):
{
  "error": {
    "code": "DONOR_EXISTS",
    "message": "A donor with this email already exists",
    "details": {
      "existing_donor_id": 1245,
      "email": "emily.chen@email.com"
    }
  }
}
5.3 GET /api/v1/donors/{donor_id}
Get complete donor profile.
Request:
GET /api/v1/donors/1001
Authorization: Bearer <token>
Response (200 OK):
{
  "id": 1001,
  "donor_type": "individual",
  "first_name": "Robert",
  "last_name": "Johnson",
  "email": "robert.j@email.com",
  "phone": "+1-555-7890",
  "mobile": "+1-555-7891",
  "address": {
    "line1": "789 Donor Ln",
    "city": "Seattle",
    "state": "WA",
    "postal_code": "98101",
    "country": "USA"
  },
  "date_of_birth": "1965-04-12",
  "age_range": "55-64",
  "gender": "male",
  "employer": "Johnson Consulting",
  "job_title": "Managing Partner",
  "industry": "consulting",
  "lifecycle_stage": "major_donor",
  "donor_category": "major",
  "lifetime_value": 125000.00,
  "total_donations": 45,
  "average_gift": 2777.78,
  "largest_gift": 50000.00,
  "smallest_gift": 100.00,
  "first_donation_date": "2018-03-15T00:00:00Z",
  "last_donation_date": "2024-10-25T00:00:00Z",
  "engagement_score": 95,
  "last_contact_date": "2024-11-01T00:00:00Z",
  "preferred_contact_method": "email",
  "contact_frequency": "monthly",
  "communication_preferences": {
    "email_opt_in": true,
    "phone_opt_in": true,
    "mail_opt_in": true,
    "sms_opt_in": false
  },
  "social_media": {
    "linkedin_url": "https://linkedin.com/in/robertjohnson"
  },
  "estimated_capacity": 250000.00,
  "wealth_rating": "A",
  "relationship_manager": {
    "id": 45,
    "name": "Sarah Davis",
    "email": "sarah.davis@sample.org"
  },
  "tags": ["board_member", "major_donor", "monthly_donor"],
  "custom_fields": {
    "interest_area": "education",
    "volunteer_interest": true
  },
  "source": "event",
  "status": "active",
  "is_anonymous": false,
  "profile": {
    "spouse_name": "Linda Johnson",
    "anniversary_date": "1990-06-15",
    "interests": ["education", "environment", "arts"],
    "is_volunteer": true,
    "volunteer_hours": 120.5,
    "is_board_member": true,
    "board_position": "Treasurer",
    "recognition_level": "gold"
  },
  "statistics": {
    "donations_this_year": 8,
    "amount_this_year": 22000.00,
    "donations_last_year": 12,
    "amount_last_year": 28000.00,
    "average_days_between_donations": 45,
    "consecutive_years_giving": 7,
    "events_attended": 15,
    "last_event_date": "2024-09-20T00:00:00Z"
  },
  "recent_donations": [
    {
      "id": 8523,
      "date": "2024-10-25T00:00:00Z",
      "amount": 5000.00,
      "campaign": "Annual Fund 2024",
      "designation": "General Operating"
    }
  ],
  "created_at": "2018-03-01T10:00:00Z",
  "updated_at": "2024-11-01T09:30:00Z"
}
5.4 PUT /api/v1/donors/{donor_id}
Update donor information.
Request:
PUT /api/v1/donors/1001
Authorization: Bearer <token>
Content-Type: application/json
{
  "phone": "+1-555-0000",
  "address": {
    "line1": "789 Donor Ln",
    "line2": "Suite 500",
    "city": "Seattle",
    "state": "WA",
    "postal_code": "98101"
  },
  "job_title": "CEO",
  "tags": ["board_member", "major_donor", "monthly_donor", "volunteer"]
}
Response (200 OK):
{
  "id": 1001,
  "phone": "+1-555-0000",
  "job_title": "CEO",
  "tags": ["board_member", "major_donor", "monthly_donor", "volunteer"],
  "updated_at": "2024-11-08T11:30:00Z"
}
5.5 DELETE /api/v1/donors/{donor_id}
Soft delete donor.
Request:
DELETE /api/v1/donors/1523
Authorization: Bearer <token>
Response (204 No Content)
5.6 GET /api/v1/donors/{donor_id}/donations
Get donor's donation history.
Request:
GET /api/v1/donors/1001/donations?year=2024&sort=-donation_date
Authorization: Bearer <token>
Response (200 OK):
{
  "data": [
    {
      "id": 8523,
      "donation_date": "2024-10-25T10:30:00Z",
      "amount": 5000.00,
      "campaign": {
        "id": 15,
        "name": "Annual Fund 2024"
      },
      "designation": "General Operating",
      "payment_method": "credit_card",
      "status": "completed",
      "receipt_number": "2024-8523",
      "receipt_sent_at": "2024-10-25T11:00:00Z"
    }
  ],
  "meta": {
    "total_donations": 8,
    "total_amount": 22000.00,
    "average_amount": 2750.00
  }
}
5.7 GET /api/v1/donors/{donor_id}/timeline
Get donor activity timeline.
Request:
GET /api/v1/donors/1001/timeline?limit=20
Authorization: Bearer <token>
Response (200 OK):
{
  "data": [
    {
      "id": 5421,
      "type": "donation",
      "date": "2024-10-25T10:30:00Z",
      "description": "Donated $5,000 to Annual Fund 2024",
      "details": {
        "donation_id": 8523,
        "amount": 5000.00,
        "campaign": "Annual Fund 2024"
      }
    },
    {
      "id": 5398,
      "type": "note",
      "date": "2024-10-20T14:15:00Z",
      "description": "Phone call - Discussed major gift opportunity",
      "details": {
        "note_id": 892,
        "created_by": "Sarah Davis"
      }
    },
    {
      "id": 5201,
      "type": "event",
      "date": "2024-09-20T18:00:00Z",
      "description": "Attended Gala Fundraiser 2024",
      "details": {
        "event_id": 45,
        "event_name": "Gala Fundraiser 2024"
      }
    }
  ]
}
5.8 POST /api/v1/donors/import
Bulk import donors from CSV/Excel.
Request:
POST /api/v1/donors/import
Authorization: Bearer <token>
Content-Type: multipart/form-data
file: [CSV/Excel file]
mapping: {
  "First Name": "first_name",
  "Last Name": "last_name",
  "Email": "email",
  "Phone": "phone"
}
options: {
  "skip_duplicates": true,
  "update_existing": false
}
Response (202 Accepted):
{
  "import_id": "imp_abc123",
  "status": "processing",
  "total_rows": 500,
  "message": "Import job started. You'll receive an email when complete."
}
5.9 GET /api/v1/donors/export
Export donors to CSV/Excel.
Request:
GET /api/v1/donors/export?format=csv&lifecycle_stage=major_donor
Authorization: Bearer <token>
Response (200 OK): Returns CSV file download.

6. Campaign Management
6.1 GET /api/v1/campaigns
List campaigns.
Request:
GET /api/v1/campaigns?status=active&sort=-start_date
Authorization: Bearer <token>
Query Parameters:
	• status (string): Filter by status (planning, active, completed, cancelled)
	• campaign_type (string): Filter by type
	• fiscal_year (integer): Filter by fiscal year
	• search (string): Search by name
Response (200 OK):
{
  "data": [
    {
      "id": 15,
      "name": "Annual Fund 2024",
      "campaign_code": "AF2024",
      "campaign_type": "annual",
      "status": "active",
      "start_date": "2024-01-01",
      "end_date": "2024-12-31",
      "goal_amount": 500000.00,
      "total_raised": 412350.00,
      "goal_percentage": 82.47,
      "total_donors": 1245,
      "new_donors": 287,
      "average_gift": 331.17,
      "days_remaining": 53,
      "campaign_manager": {
        "id": 45,
        "name": "Sarah Davis"
      }
    }
  ],
  "meta": {
    "page": 1,
    "total": 8
  }
}
6.2 POST /api/v1/campaigns
Create new campaign.
Request:
POST /api/v1/campaigns
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "Spring Campaign 2025",
  "description": "Annual spring fundraising campaign",
  "campaign_code": "SPRING2025",
  "campaign_type": "annual",
  "category": "general_operating",
  "goal_amount": 100000.00,
  "goal_donors": 500,
  "start_date": "2025-03-01",
  "end_date": "2025-05-31",
  "status": "planning",
  "target_segment_ids": [5, 12, 18],
  "primary_message": "Support our spring programs...",
  "channels": ["email", "direct_mail", "social_media"],
  "campaign_manager_id": 45,
  "budget_amount": 15000.00
}
Response (201 Created):
{
  "id": 22,
  "name": "Spring Campaign 2025",
  "campaign_code": "SPRING2025",
  "status": "planning",
  "goal_amount": 100000.00,
  "start_date": "2025-03-01",
  "end_date": "2025-05-31",
  "created_at": "2024-11-08T12:00:00Z"
}
6.3 GET /api/v1/campaigns/{campaign_id}
Get campaign details.
Request:
GET /api/v1/campaigns/15
Authorization: Bearer <token>
Response (200 OK):
{
  "id": 15,
  "name": "Annual Fund 2024",
  "description": "Our annual fundraising campaign to support general operations",
  "campaign_code": "AF2024",
  "campaign_type": "annual",
  "category": "general_operating",
  "status": "active",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "fiscal_year": 2024,
  "goal_amount": 500000.00,
  "goal_donors": 1500,
  "stretch_goal_amount": 600000.00,
  "budget_amount": 75000.00,
  "actual_expenses": 52340.00,
  "performance": {
    "total_raised": 412350.00,
    "goal_percentage": 82.47,
    "total_donors": 1245,
    "unique_donors": 1180,
    "new_donors": 287,
    "repeat_donors": 893,
    "average_gift": 331.17,
    "largest_gift": 50000.00,
    "conversion_rate": 15.25,
    "roi_percentage": 545.67,
    "cost_per_dollar_raised": 0.13
  },
  "timeline": {
    "days_elapsed": 312,
    "days_remaining": 53,
    "days_total": 365,
    "progress_percentage": 85.48
  },
  "target_audience": {
    "segment_ids": [5, 12, 18],
    "target_donor_count": 2000,
    "prospects_reached": 8163,
    "prospects_engaged": 1852
  },
  "channels": ["email", "direct_mail", "social_media", "phone"],
  "campaign_manager": {
    "id": 45,
    "name": "Sarah Davis",
    "email": "sarah.davis@sample.org"
  },
  "team_members": [
    {
      "id": 67,
      "name": "Mike Chen"
    }
  ],
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2024-11-08T09:00:00Z"
}
6.4 PUT /api/v1/campaigns/{campaign_id}
Update campaign.
Request:
PUT /api/v1/campaigns/22
Authorization: Bearer <token>
Content-Type: application/json
{
  "status": "active",
  "goal_amount": 120000.00,
  "actual_expenses": 8500.00
}
Response (200 OK):
{
  "id": 22,
  "status": "active",
  "goal_amount": 120000.00,
  "actual_expenses": 8500.00,
  "updated_at": "2024-11-08T12:15:00Z"
}
6.5 GET /api/v1/campaigns/{campaign_id}/metrics
Get detailed campaign metrics.
Request:
GET /api/v1/campaigns/15/metrics?period=daily&start_date=2024-10-01&end_date=2024-11-08
Authorization: Bearer <token>
Response (200 OK):
{
  "campaign_id": 15,
  "period": "daily",
  "data": [
    {
      "date": "2024-11-08",
      "donations_count": 12,
      "donations_amount": 4250.00,
      "unique_donors": 11,
      "new_donors": 2,
      "cumulative_amount": 412350.00,
      "goal_percentage": 82.47
    }
  ],
  "summary": {
    "total_donations": 328,
    "total_amount": 45210.00,
    "average_per_day": 1184.47,
    "best_day": {
      "date": "2024-10-15",
      "amount": 8500.00
    }
  }
}
6.6 GET /api/v1/campaigns/{campaign_id}/donors
Get campaign donors.
Request:
GET /api/v1/campaigns/15/donors?sort=-donation_date
Authorization: Bearer <token>
Response (200 OK):
{
  "data": [
    {
      "donor_id": 1001,
      "donor_name": "Robert Johnson",
      "donor_email": "robert.j@email.com",
      "total_donated": 12000.00,
      "donation_count": 3,
      "first_donation_date": "2024-01-15",
      "last_donation_date": "2024-10-25",
      "is_new_donor": false
    }
  ],
  "meta": {
    "total_donors": 1245,
    "total_amount": 412350.00
  }
}
