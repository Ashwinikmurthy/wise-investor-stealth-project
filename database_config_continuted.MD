# Wise Investor - Part 3B: Backend API Documentation (Continued)
## Complete Endpoint Reference - Part 2

**Version**: 1.0.0  
**Last Updated**: November 2025

---

## Table of Contents

7. [Donation Management](#7-donation-management)
8. [Major Gifts Management](#8-major-gifts-management)
9. [Analytics & Reporting](#9-analytics--reporting)
10. [Event Management](#10-event-management)
11. [Segment Management](#11-segment-management)
12. [File Upload & Export](#12-file-upload--export)
13. [Settings & Configuration](#13-settings--configuration)
14. [Webhooks](#14-webhooks)
15. [Rate Limiting](#15-rate-limiting)

---

## 7. Donation Management

### 7.1 GET /api/v1/donations

List donations with filtering and pagination.

**Request:**

```http
GET /api/v1/donations?start_date=2024-01-01&end_date=2024-12-31&status=completed&page=1&per_page=50
Authorization: Bearer <token>
```

**Query Parameters:**

- `start_date` (date): Filter by donation date (from)
- `end_date` (date): Filter by donation date (to)
- `donor_id` (integer): Filter by specific donor
- `campaign_id` (integer): Filter by campaign
- `status` (string): Filter by status (pending, completed, failed, refunded)
- `payment_method` (string): Filter by payment method
- `amount_min` (number): Minimum amount
- `amount_max` (number): Maximum amount
- `is_recurring` (boolean): Filter recurring donations
- `designation` (string): Filter by designation
- `page` (integer): Page number
- `per_page` (integer): Items per page (max 100)
- `sort` (string): Sort field(s)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 8523,
      "donor": {
        "id": 1001,
        "name": "Robert Johnson",
        "email": "robert.j@email.com"
      },
      "campaign": {
        "id": 15,
        "name": "Annual Fund 2024"
      },
      "donation_date": "2024-10-25T10:30:00Z",
      "amount": 5000.00,
      "currency": "USD",
      "payment_method": "credit_card",
      "designation": "General Operating",
      "is_recurring": false,
      "status": "completed",
      "receipt_number": "2024-8523",
      "receipt_sent_at": "2024-10-25T11:00:00Z",
      "thank_you_sent_at": "2024-10-25T12:00:00Z",
      "is_tax_deductible": true,
      "is_anonymous": false,
      "created_at": "2024-10-25T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 8500,
    "total_pages": 170,
    "summary": {
      "total_amount": 2750000.00,
      "average_amount": 323.53,
      "count": 8500
    }
  }
}
```

### 7.2 POST /api/v1/donations

Record a new donation.

**Request:**

```http
POST /api/v1/donations
Authorization: Bearer <token>
Content-Type: application/json

{
  "donor_id": 1001,
  "campaign_id": 15,
  "donation_date": "2024-11-08T10:30:00Z",
  "amount": 500.00,
  "currency": "USD",
  "payment_method": "credit_card",
  "designation": "Scholarship Fund",
  "is_restricted": false,
  "is_recurring": false,
  "check_number": null,
  "transaction_id": "txn_abc123xyz",
  "is_tribute": false,
  "is_anonymous": false,
  "is_tax_deductible": true,
  "notes": "Donation made through website",
  "send_receipt": true,
  "send_thank_you": true
}
```

**Response (201 Created):**

```json
{
  "id": 8524,
  "donor_id": 1001,
  "campaign_id": 15,
  "donation_date": "2024-11-08T10:30:00Z",
  "amount": 500.00,
  "status": "completed",
  "receipt_number": "2024-8524",
  "receipt_sent_at": "2024-11-08T10:31:00Z",
  "created_at": "2024-11-08T10:30:00Z",
  "message": "Donation recorded successfully. Receipt sent to donor."
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Donation amount must be greater than 0",
    "details": {
      "amount": ["Must be greater than 0"]
    }
  }
}
```

### 7.3 GET /api/v1/donations/{donation_id}

Get donation details.

**Request:**

```http
GET /api/v1/donations/8523
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "id": 8523,
  "donor": {
    "id": 1001,
    "first_name": "Robert",
    "last_name": "Johnson",
    "email": "robert.j@email.com",
    "phone": "+1-555-7890"
  },
  "campaign": {
    "id": 15,
    "name": "Annual Fund 2024",
    "campaign_code": "AF2024"
  },
  "donation_date": "2024-10-25T10:30:00Z",
  "amount": 5000.00,
  "currency": "USD",
  "donation_type": "monetary",
  "payment_method": "credit_card",
  "card_last4": "4242",
  "transaction_id": "ch_3AbCdEfGhIjKlMnO",
  "designation": "General Operating",
  "fund": "General Fund",
  "is_restricted": false,
  "is_recurring": false,
  "is_matched": false,
  "is_tribute": false,
  "is_anonymous": false,
  "is_tax_deductible": true,
  "tax_deductible_amount": 5000.00,
  "receipt_number": "2024-8523",
  "receipt_sent_at": "2024-10-25T11:00:00Z",
  "thank_you_sent_at": "2024-10-25T12:00:00Z",
  "acknowledged_by": {
    "id": 45,
    "name": "Sarah Davis"
  },
  "status": "completed",
  "processed_at": "2024-10-25T10:30:15Z",
  "notes": "Major gift donation",
  "internal_notes": "Follow up with thank you call",
  "source": "website",
  "utm_source": "email_campaign",
  "utm_medium": "email",
  "utm_campaign": "annual_fund_2024",
  "created_at": "2024-10-25T10:30:00Z",
  "updated_at": "2024-10-25T12:00:00Z",
  "created_by": {
    "id": 123,
    "name": "John Doe"
  }
}
```

### 7.4 PUT /api/v1/donations/{donation_id}

Update donation information.

**Request:**

```http
PUT /api/v1/donations/8524
Authorization: Bearer <token>
Content-Type: application/json

{
  "designation": "Building Fund",
  "notes": "Updated designation per donor request",
  "internal_notes": "Donor called to change designation"
}
```

**Response (200 OK):**

```json
{
  "id": 8524,
  "designation": "Building Fund",
  "notes": "Updated designation per donor request",
  "updated_at": "2024-11-08T11:00:00Z"
}
```

### 7.5 DELETE /api/v1/donations/{donation_id}

Delete (soft delete) a donation.

**Request:**

```http
DELETE /api/v1/donations/8524
Authorization: Bearer <token>
```

**Response (204 No Content)**

### 7.6 POST /api/v1/donations/{donation_id}/refund

Process a donation refund.

**Request:**

```http
POST /api/v1/donations/8524/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "refund_amount": 500.00,
  "reason": "Duplicate donation",
  "notes": "Donor accidentally donated twice",
  "notify_donor": true
}
```

**Response (200 OK):**

```json
{
  "id": 8524,
  "status": "refunded",
  "refund_amount": 500.00,
  "refunded_at": "2024-11-08T11:15:00Z",
  "refund_reason": "Duplicate donation",
  "message": "Refund processed successfully. Donor notified."
}
```

### 7.7 GET /api/v1/donations/{donation_id}/receipt

Get donation receipt (PDF).

**Request:**

```http
GET /api/v1/donations/8523/receipt
Authorization: Bearer <token>
```

**Response (200 OK):**
Returns PDF file with receipt.

### 7.8 POST /api/v1/donations/{donation_id}/resend-receipt

Resend donation receipt to donor.

**Request:**

```http
POST /api/v1/donations/8523/resend-receipt
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "robert.j@email.com",
  "message": "As requested, here is your donation receipt."
}
```

**Response (200 OK):**

```json
{
  "message": "Receipt resent successfully",
  "sent_to": "robert.j@email.com",
  "sent_at": "2024-11-08T11:20:00Z"
}
```

### 7.9 POST /api/v1/donations/recurring

Set up recurring donation.

**Request:**

```http
POST /api/v1/donations/recurring
Authorization: Bearer <token>
Content-Type: application/json

{
  "donor_id": 1001,
  "campaign_id": 15,
  "amount": 100.00,
  "frequency": "monthly",
  "start_date": "2024-12-01",
  "end_date": null,
  "payment_method_id": 42,
  "designation": "General Operating",
  "day_of_month": 1
}
```

**Response (201 Created):**

```json
{
  "id": 156,
  "donor_id": 1001,
  "amount": 100.00,
  "frequency": "monthly",
  "status": "active",
  "next_donation_date": "2024-12-01",
  "created_at": "2024-11-08T11:25:00Z"
}
```

### 7.10 GET /api/v1/donations/recurring/{recurring_id}

Get recurring donation details.

**Request:**

```http
GET /api/v1/donations/recurring/156
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "id": 156,
  "donor": {
    "id": 1001,
    "name": "Robert Johnson"
  },
  "campaign": {
    "id": 15,
    "name": "Annual Fund 2024"
  },
  "amount": 100.00,
  "frequency": "monthly",
  "day_of_month": 1,
  "start_date": "2024-12-01",
  "end_date": null,
  "status": "active",
  "next_donation_date": "2024-12-01",
  "payment_method": {
    "id": 42,
    "type": "credit_card",
    "last4": "4242"
  },
  "total_donations": 0,
  "total_amount": 0.00,
  "created_at": "2024-11-08T11:25:00Z"
}
```

### 7.11 PATCH /api/v1/donations/recurring/{recurring_id}/pause

Pause recurring donation.

**Request:**

```http
PATCH /api/v1/donations/recurring/156/pause
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "id": 156,
  "status": "paused",
  "paused_at": "2024-11-08T11:30:00Z"
}
```

### 7.12 PATCH /api/v1/donations/recurring/{recurring_id}/resume

Resume paused recurring donation.

**Request:**

```http
PATCH /api/v1/donations/recurring/156/resume
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "id": 156,
  "status": "active",
  "resumed_at": "2024-11-08T11:35:00Z",
  "next_donation_date": "2024-12-01"
}
```

---

## 8. Major Gifts Management

### 8.1 GET /api/v1/major-gifts

List major gift prospects.

**Request:**

```http
GET /api/v1/major-gifts?stage=cultivation&sort=-capacity
Authorization: Bearer <token>
```

**Query Parameters:**

- `stage` (string): Filter by pipeline stage
- `assigned_to` (integer): Filter by relationship manager
- `capacity_min` (number): Minimum capacity
- `capacity_max` (number): Maximum capacity
- `sort` (string): Sort field(s)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 45,
      "donor": {
        "id": 1001,
        "name": "Robert Johnson",
        "email": "robert.j@email.com"
      },
      "stage": "cultivation",
      "estimated_capacity": 250000.00,
      "ask_amount": 100000.00,
      "probability": 75,
      "expected_close_date": "2025-03-31",
      "relationship_manager": {
        "id": 45,
        "name": "Sarah Davis"
      },
      "last_contact": "2024-11-01T14:30:00Z",
      "next_action": "Schedule site visit",
      "next_action_date": "2024-11-15",
      "lifetime_value": 125000.00,
      "interactions_count": 23,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "total": 48,
    "pipeline_value": 4800000.00,
    "weighted_pipeline_value": 3200000.00
  }
}
```

### 8.2 POST /api/v1/major-gifts

Create major gift prospect.

**Request:**

```http
POST /api/v1/major-gifts
Authorization: Bearer <token>
Content-Type: application/json

{
  "donor_id": 1523,
  "estimated_capacity": 100000.00,
  "ask_amount": 50000.00,
  "stage": "qualification",
  "relationship_manager_id": 45,
  "probability": 50,
  "expected_close_date": "2025-06-30",
  "interests": ["education", "scholarship"],
  "strategy": "Build relationship through events, schedule discovery meeting",
  "notes": "Identified through wealth screening"
}
```

**Response (201 Created):**

```json
{
  "id": 49,
  "donor_id": 1523,
  "stage": "qualification",
  "estimated_capacity": 100000.00,
  "ask_amount": 50000.00,
  "created_at": "2024-11-08T12:00:00Z"
}
```

### 8.3 GET /api/v1/major-gifts/{id}

Get major gift prospect details.

**Request:**

```http
GET /api/v1/major-gifts/45
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "id": 45,
  "donor": {
    "id": 1001,
    "first_name": "Robert",
    "last_name": "Johnson",
    "email": "robert.j@email.com",
    "phone": "+1-555-7890",
    "lifetime_value": 125000.00,
    "largest_gift": 50000.00
  },
  "stage": "cultivation",
  "stage_history": [
    {
      "stage": "identification",
      "entered_at": "2024-01-15",
      "duration_days": 30
    },
    {
      "stage": "qualification",
      "entered_at": "2024-02-14",
      "duration_days": 45
    },
    {
      "stage": "cultivation",
      "entered_at": "2024-03-31",
      "duration_days": 221
    }
  ],
  "estimated_capacity": 250000.00,
  "wealth_rating": "A",
  "ask_amount": 100000.00,
  "probability": 75,
  "weighted_value": 75000.00,
  "expected_close_date": "2025-03-31",
  "proposal": {
    "title": "Scholarship Endowment",
    "amount": 100000.00,
    "purpose": "Establish named scholarship fund",
    "status": "draft"
  },
  "relationship_manager": {
    "id": 45,
    "name": "Sarah Davis",
    "email": "sarah.davis@sample.org"
  },
  "last_contact": "2024-11-01T14:30:00Z",
  "next_action": "Schedule site visit",
  "next_action_date": "2024-11-15",
  "interests": ["education", "scholarship", "youth_development"],
  "strategy": "Continue cultivation through quarterly meetings...",
  "interactions": [
    {
      "date": "2024-11-01",
      "type": "meeting",
      "description": "Lunch meeting to discuss scholarship program",
      "outcome": "Very positive, asked for proposal"
    }
  ],
  "notes": "Strong interest in education. Has capacity for $250k+",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-11-01T15:00:00Z"
}
```

### 8.4 PUT /api/v1/major-gifts/{id}

Update major gift prospect.

**Request:**

```http
PUT /api/v1/major-gifts/45
Authorization: Bearer <token>
Content-Type: application/json

{
  "stage": "solicitation",
  "ask_amount": 100000.00,
  "probability": 85,
  "next_action": "Send proposal",
  "next_action_date": "2024-11-10",
  "notes": "Proposal approved by development committee"
}
```

**Response (200 OK):**

```json
{
  "id": 45,
  "stage": "solicitation",
  "ask_amount": 100000.00,
  "probability": 85,
  "updated_at": "2024-11-08T12:15:00Z"
}
```

### 8.5 POST /api/v1/major-gifts/{id}/interactions

Record interaction with major gift prospect.

**Request:**

```http
POST /api/v1/major-gifts/45/interactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "interaction_date": "2024-11-08T10:00:00Z",
  "interaction_type": "phone_call",
  "subject": "Follow up on proposal",
  "description": "Discussed timeline and naming opportunities. Very excited about the project.",
  "outcome": "positive",
  "next_steps": "Send formal proposal by end of week",
  "participants": [45, 67]
}
```

**Response (201 Created):**

```json
{
  "id": 892,
  "interaction_date": "2024-11-08T10:00:00Z",
  "interaction_type": "phone_call",
  "subject": "Follow up on proposal",
  "created_at": "2024-11-08T12:20:00Z"
}
```

### 8.6 GET /api/v1/major-gifts/pipeline-summary

Get major gifts pipeline summary.

**Request:**

```http
GET /api/v1/major-gifts/pipeline-summary
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "total_prospects": 48,
  "total_pipeline_value": 4800000.00,
  "weighted_pipeline_value": 3200000.00,
  "average_probability": 67,
  "by_stage": {
    "identification": {
      "count": 8,
      "value": 800000.00,
      "weighted_value": 240000.00
    },
    "qualification": {
      "count": 12,
      "value": 1200000.00,
      "weighted_value": 480000.00
    },
    "cultivation": {
      "count": 18,
      "value": 1800000.00,
      "weighted_value": 1260000.00
    },
    "solicitation": {
      "count": 8,
      "value": 800000.00,
      "weighted_value": 680000.00
    },
    "stewardship": {
      "count": 2,
      "value": 200000.00,
      "weighted_value": 200000.00
    }
  },
  "by_manager": [
    {
      "manager_id": 45,
      "manager_name": "Sarah Davis",
      "prospects": 15,
      "pipeline_value": 1500000.00
    }
  ],
  "average_time_in_pipeline": 180,
  "projected_closures_this_quarter": 3,
  "projected_value_this_quarter": 250000.00
}
```

---

## 9. Analytics & Reporting

### 9.1 GET /api/v1/dashboard/executive

Get executive dashboard metrics.

**Request:**

```http
GET /api/v1/dashboard/executive?period=ytd
Authorization: Bearer <token>
```

**Query Parameters:**

- `period` (string): Time period (ytd, mtd, qtd, custom)
- `start_date` (date): For custom period
- `end_date` (date): For custom period

**Response (200 OK):**

```json
{
  "period": "ytd",
  "start_date": "2024-01-01",
  "end_date": "2024-11-08",
  "revenue": {
    "total": 2750000.00,
    "vs_last_period": 15.5,
    "vs_goal": 91.7,
    "goal": 3000000.00,
    "by_month": [
      {"month": "2024-01", "amount": 245000.00},
      {"month": "2024-02", "amount": 235000.00}
    ]
  },
  "donors": {
    "total_active": 1245,
    "new": 287,
    "repeat": 958,
    "lapsed": 156,
    "retention_rate": 78.5,
    "vs_last_period": 8.2
  },
  "donations": {
    "count": 8500,
    "average_amount": 323.53,
    "median_amount": 150.00,
    "largest": 50000.00
  },
  "campaigns": {
    "active": 8,
    "goal_met": 5,
    "total_goal": 2500000.00,
    "total_raised": 2100000.00,
    "completion_rate": 84.0
  },
  "major_gifts": {
    "pipeline_value": 4800000.00,
    "prospects": 48,
    "expected_closures": 8,
    "ytd_closed": 12,
    "ytd_value": 850000.00
  },
  "top_campaigns": [
    {
      "id": 15,
      "name": "Annual Fund 2024",
      "raised": 412350.00,
      "goal": 500000.00,
      "percentage": 82.47
    }
  ],
  "top_donors": [
    {
      "id": 1001,
      "name": "Robert Johnson",
      "ytd_total": 22000.00
    }
  ],
  "recent_activity": [
    {
      "type": "donation",
      "description": "Robert Johnson donated $5,000",
      "timestamp": "2024-11-08T10:30:00Z"
    }
  ]
}
```

### 9.2 GET /api/v1/analytics/fundraising-vitals

Get real-time fundraising metrics.

**Request:**

```http
GET /api/v1/analytics/fundraising-vitals
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "updated_at": "2024-11-08T12:30:00Z",
  "today": {
    "donations": 12,
    "amount": 4250.00,
    "unique_donors": 11
  },
  "this_week": {
    "donations": 87,
    "amount": 32150.00,
    "unique_donors": 78
  },
  "this_month": {
    "donations": 328,
    "amount": 95210.00,
    "unique_donors": 287,
    "new_donors": 45,
    "average_gift": 290.27
  },
  "active_campaigns": [
    {
      "id": 15,
      "name": "Annual Fund 2024",
      "progress": 82.47,
      "days_remaining": 53
    }
  ],
  "donation_velocity": {
    "per_day": 28.1,
    "per_week": 196.7,
    "trend": "up"
  },
  "pipeline": {
    "major_gifts_value": 4800000.00,
    "pledges_outstanding": 425000.00
  },
  "alerts": [
    {
      "type": "milestone",
      "message": "Annual Fund reached 80% of goal!",
      "timestamp": "2024-11-05T14:20:00Z"
    }
  ]
}
```

### 9.3 GET /api/v1/analytics/donor-lifecycle

Get donor lifecycle distribution and trends.

**Request:**

```http
GET /api/v1/analytics/donor-lifecycle?period=ytd
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "current_distribution": {
    "prospect": {
      "count": 450,
      "percentage": 18.0
    },
    "first_time": {
      "count": 287,
      "percentage": 11.5
    },
    "repeat": {
      "count": 958,
      "percentage": 38.3
    },
    "major_donor": {
      "count": 237,
      "percentage": 9.5
    },
    "lapsed": {
      "count": 568,
      "percentage": 22.7
    }
  },
  "transitions": {
    "prospect_to_first_time": 287,
    "first_time_to_repeat": 178,
    "repeat_to_major": 23,
    "active_to_lapsed": 156,
    "lapsed_to_active": 89
  },
  "revenue_by_stage": {
    "first_time": 125000.00,
    "repeat": 1250000.00,
    "major_donor": 1350000.00
  },
  "retention_metrics": {
    "overall_retention": 78.5,
    "first_time_retention": 62.1,
    "repeat_retention": 84.3,
    "major_donor_retention": 92.7
  },
  "trends": [
    {
      "month": "2024-01",
      "stages": {
        "first_time": 245,
        "repeat": 892,
        "major_donor": 231
      }
    }
  ]
}
```

### 9.4 GET /api/v1/analytics/revenue

Get revenue analysis and breakdown.

**Request:**

```http
GET /api/v1/analytics/revenue?period=monthly&year=2024
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "period": "monthly",
  "year": 2024,
  "total_revenue": 2750000.00,
  "by_month": [
    {
      "month": "2024-01",
      "revenue": 245000.00,
      "donations": 756,
      "average_gift": 324.07,
      "unique_donors": 687
    }
  ],
  "by_source": {
    "website": 1375000.00,
    "events": 550000.00,
    "direct_mail": 412500.00,
    "phone": 275000.00,
    "other": 137500.00
  },
  "by_designation": {
    "general_operating": 1650000.00,
    "scholarship": 550000.00,
    "building": 412500.00,
    "program_specific": 137500.00
  },
  "by_campaign": [
    {
      "campaign_id": 15,
      "campaign_name": "Annual Fund 2024",
      "revenue": 412350.00,
      "percentage": 15.0
    }
  ],
  "by_donor_type": {
    "individual": 2200000.00,
    "corporate": 412500.00,
    "foundation": 137500.00
  },
  "payment_methods": {
    "credit_card": 1925000.00,
    "check": 550000.00,
    "ach": 220000.00,
    "cash": 55000.00
  },
  "comparison": {
    "vs_last_year": 15.5,
    "vs_goal": 91.7
  }
}
```

### 9.5 GET /api/v1/analytics/donor-retention

Get donor retention analysis.

**Request:**

```http
GET /api/v1/analytics/donor-retention?cohort_year=2020
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "cohort_year": 2020,
  "initial_cohort_size": 450,
  "retention_by_year": {
    "2020": {
      "retained": 450,
      "rate": 100.0,
      "revenue": 135000.00
    },
    "2021": {
      "retained": 342,
      "rate": 76.0,
      "revenue": 145800.00
    },
    "2022": {
      "retained": 284,
      "rate": 63.1,
      "revenue": 156420.00
    },
    "2023": {
      "retained": 241,
      "rate": 53.6,
      "revenue": 169182.00
    },
    "2024": {
      "retained": 215,
      "rate": 47.8,
      "revenue": 183500.00
    }
  },
  "cumulative_lifetime_value": 790902.00,
  "average_lifetime_value": 1757.56,
  "insights": {
    "best_retention_year": "2021",
    "highest_revenue_year": "2024",
    "churn_rate": {
      "year_1": 24.0,
      "year_2": 17.0,
      "year_3": 15.1,
      "year_4": 10.8
    }
  }
}
```

---

## 10. Event Management

### 10.1 GET /api/v1/events

List events.

**Request:**

```http
GET /api/v1/events?status=upcoming&sort=event_date
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (string): Filter by status (upcoming, ongoing, past, cancelled)
- `event_type` (string): Filter by event type
- `start_date` (date): Filter by event date (from)
- `end_date` (date): Filter by event date (to)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 45,
      "name": "Gala Fundraiser 2024",
      "event_type": "gala",
      "event_date": "2024-12-15T18:00:00Z",
      "location": "Grand Hotel Ballroom",
      "capacity": 300,
      "registrations": 245,
      "revenue": 147000.00,
      "status": "upcoming",
      "registration_deadline": "2024-12-10",
      "campaign": {
        "id": 18,
        "name": "Winter Gala Campaign"
      }
    }
  ]
}
```

### 10.2 POST /api/v1/events

Create new event.

**Request:**

```http
POST /api/v1/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Spring Auction 2025",
  "event_type": "auction",
  "description": "Annual spring fundraising auction",
  "event_date": "2025-04-20T18:00:00Z",
  "end_time": "2025-04-20T22:00:00Z",
  "location": "Community Center",
  "address": "123 Main St, City, ST 12345",
  "capacity": 200,
  "ticket_tiers": [
    {
      "name": "General Admission",
      "price": 50.00,
      "quantity": 150
    },
    {
      "name": "VIP",
      "price": 150.00,
      "quantity": 50
    }
  ],
  "registration_deadline": "2025-04-15",
  "campaign_id": 20
}
```

**Response (201 Created):**

```json
{
  "id": 52,
  "name": "Spring Auction 2025",
  "event_date": "2025-04-20T18:00:00Z",
  "status": "planning",
  "created_at": "2024-11-08T13:00:00Z"
}
```

### 10.3 POST /api/v1/events/{event_id}/register

Register attendee for event.

**Request:**

```http
POST /api/v1/events/45/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "donor_id": 1523,
  "ticket_tier": "VIP",
  "quantity": 2,
  "guests": [
    {
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane@example.com"
    }
  ],
  "special_requirements": "Vegetarian meal",
  "payment_method": "credit_card",
  "amount": 300.00
}
```

**Response (201 Created):**

```json
{
  "registration_id": 892,
  "event_id": 45,
  "donor_id": 1523,
  "ticket_tier": "VIP",
  "quantity": 2,
  "amount_paid": 300.00,
  "status": "confirmed",
  "confirmation_number": "EVT45-892",
  "confirmation_sent": true
}
```

---

## 11. Segment Management

### 11.1 GET /api/v1/segments

List donor segments.

**Request:**

```http
GET /api/v1/segments
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 5,
      "name": "Major Donors",
      "description": "Donors with lifetime value > $10,000",
      "segment_type": "system",
      "donor_count": 237,
      "total_lifetime_value": 8950000.00,
      "average_gift": 37762.66,
      "is_dynamic": true,
      "last_calculated": "2024-11-08T12:00:00Z"
    }
  ]
}
```

### 11.2 POST /api/v1/segments

Create custom segment.

**Request:**

```http
POST /api/v1/segments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tech Industry Donors",
  "description": "Donors working in technology sector",
  "segment_type": "custom",
  "criteria": {
    "industry": "technology",
    "lifetime_value_min": 1000,
    "lifecycle_stage": ["repeat", "major_donor"],
    "tags": ["tech_industry"]
  },
  "is_dynamic": true
}
```

**Response (201 Created):**

```json
{
  "id": 28,
  "name": "Tech Industry Donors",
  "donor_count": 156,
  "created_at": "2024-11-08T13:15:00Z"
}
```

### 11.3 GET /api/v1/segments/{id}/members

Get segment members.

**Request:**

```http
GET /api/v1/segments/5/members?page=1&per_page=50
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1001,
      "name": "Robert Johnson",
      "email": "robert.j@email.com",
      "lifetime_value": 125000.00,
      "lifecycle_stage": "major_donor"
    }
  ],
  "meta": {
    "page": 1,
    "total": 237
  }
}
```

---

## 12. File Upload & Export

### 12.1 POST /api/v1/donors/import

Bulk import donors from file.

**Request:**

```http
POST /api/v1/donors/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [CSV or Excel file]
mapping: {
  "First Name": "first_name",
  "Last Name": "last_name",
  "Email Address": "email",
  "Phone Number": "phone"
}
options: {
  "skip_duplicates": true,
  "update_existing": false,
  "send_welcome_email": false
}
```

**Response (202 Accepted):**

```json
{
  "import_id": "imp_abc123xyz",
  "status": "processing",
  "total_rows": 500,
  "message": "Import job started. You'll receive an email when complete.",
  "estimated_completion": "2024-11-08T13:45:00Z"
}
```

### 12.2 GET /api/v1/imports/{import_id}/status

Check import status.

**Request:**

```http
GET /api/v1/imports/imp_abc123xyz/status
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "import_id": "imp_abc123xyz",
  "status": "completed",
  "total_rows": 500,
  "processed": 500,
  "successful": 487,
  "failed": 13,
  "duplicates_skipped": 25,
  "started_at": "2024-11-08T13:30:00Z",
  "completed_at": "2024-11-08T13:42:00Z",
  "errors": [
    {
      "row": 15,
      "error": "Invalid email format"
    }
  ]
}
```

### 12.3 GET /api/v1/donors/export

Export donors to file.

**Request:**

```http
GET /api/v1/donors/export?format=csv&lifecycle_stage=major_donor&fields=first_name,last_name,email,lifetime_value
Authorization: Bearer <token>
```

**Query Parameters:**

- `format` (string): File format (csv, xlsx, pdf)
- `fields` (string): Comma-separated fields to include
- Plus any filter parameters from GET /api/v1/donors

**Response (200 OK):**
Returns file download (CSV, Excel, or PDF)

### 12.4 GET /api/v1/reports/{report_id}/export

Export report to file.

**Request:**

```http
GET /api/v1/reports/42/export?format=pdf
Authorization: Bearer <token>
```

**Response (200 OK):**
Returns PDF file with formatted report.

---

## 13. Settings & Configuration

### 13.1 GET /api/v1/settings/organization

Get organization settings.

**Request:**

```http
GET /api/v1/settings/organization
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "currency": "USD",
  "fiscal_year_start": "01-01",
  "timezone": "America/New_York",
  "date_format": "MM/DD/YYYY",
  "number_format": "1,234.56",
  "major_gift_threshold": 10000.00,
  "donation_receipt_template": "default",
  "email_from_name": "Sample Nonprofit",
  "email_from_address": "noreply@sample.org",
  "enable_recurring_donations": true,
  "enable_tribute_donations": true,
  "enable_matching_gifts": true
}
```

### 13.2 PUT /api/v1/settings/organization

Update organization settings.

**Request:**

```http
PUT /api/v1/settings/organization
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fiscal_year_start": "07-01",
  "major_gift_threshold": 25000.00,
  "enable_recurring_donations": true
}
```

**Response (200 OK):**

```json
{
  "message": "Settings updated successfully",
  "updated_at": "2024-11-08T14:00:00Z"
}
```

---

## 14. Webhooks

### 14.1 POST /api/v1/webhooks

Create webhook.

**Request:**

```http
POST /api/v1/webhooks
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/wise-investor",
  "events": ["donation.created", "donor.created", "campaign.completed"],
  "secret": "your_webhook_secret",
  "is_active": true
}
```

**Response (201 Created):**

```json
{
  "id": "wh_abc123",
  "url": "https://your-app.com/webhooks/wise-investor",
  "events": ["donation.created", "donor.created", "campaign.completed"],
  "is_active": true,
  "created_at": "2024-11-08T14:15:00Z"
}
```

### 14.2 Webhook Payload Example

When a donation is created:

```json
{
  "event": "donation.created",
  "timestamp": "2024-11-08T14:20:00Z",
  "data": {
    "id": 8525,
    "donor_id": 1001,
    "amount": 500.00,
    "campaign_id": 15,
    "status": "completed"
  },
  "webhook_id": "wh_abc123"
}
```

---

## 15. Rate Limiting

### 15.1 Rate Limit Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1699451200
```

### 15.2 Rate Limits by Plan

| Plan | Requests/Hour | Burst |
|------|--------------|-------|
| Starter | 1,000 | 50 |
| Professional | 10,000 | 100 |
| Enterprise | Unlimited | 200 |

### 15.3 Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retry_after": 3600
  }
}
```

---

**End of API Documentation**

This completes the comprehensive API reference for Wise Investor, covering all endpoints from authentication through webhooks and rate limiting.
