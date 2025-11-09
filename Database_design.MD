# Wise Investor - Part 2: Database Design
## Complete Schema Documentation

**Version**: 1.0.0  
**Last Updated**: November 2025

---

## Table of Contents

1. [Database Architecture](#1-database-architecture)
2. [Core Tables](#2-core-tables)
3. [Donor Management Tables](#3-donor-management-tables)
4. [Campaign & Fundraising Tables](#4-campaign--fundraising-tables)
5. [Financial Tables](#5-financial-tables)
6. [Analytics Tables](#6-analytics-tables)
7. [Event Management Tables](#7-event-management-tables)
8. [System Tables](#8-system-tables)
9. [Relationships & Foreign Keys](#9-relationships--foreign-keys)
10. [Indexes & Performance](#10-indexes--performance)
11. [Database Migrations](#11-database-migrations)
12. [Query Examples](#12-query-examples)

---

## 1. Database Architecture

### 1.1 Database Overview

- **Database Engine**: PostgreSQL 14+
- **Character Set**: UTF8
- **Collation**: en_US.UTF-8
- **Total Tables**: 27 tables
- **Estimated Size**: 1GB - 100GB (depending on organization size)

### 1.2 Naming Conventions

- **Tables**: Lowercase with underscores (snake_case)
- **Columns**: Lowercase with underscores
- **Primary Keys**: `id` (SERIAL or BIGSERIAL)
- **Foreign Keys**: `<table>_id` (e.g., `organization_id`, `donor_id`)
- **Indexes**: `idx_<table>_<columns>` (e.g., `idx_donors_email`)
- **Constraints**: `<table>_<column>_<type>` (e.g., `donors_email_unique`)

### 1.3 Standard Fields

All core tables include these standard fields:

```sql
-- Primary key
id SERIAL PRIMARY KEY,

-- Multi-tenancy
organization_id INTEGER NOT NULL REFERENCES organizations(id),

-- Soft delete
is_deleted BOOLEAN DEFAULT FALSE,
deleted_at TIMESTAMP WITH TIME ZONE,

-- Audit timestamps
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
created_by INTEGER REFERENCES users(id),
updated_by INTEGER REFERENCES users(id)
```

---

## 2. Core Tables

### 2.1 organizations

Master table for tenant organizations.

```sql
CREATE TABLE organizations (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Contact information
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Organization details
    ein VARCHAR(20),  -- Tax ID number
    mission_statement TEXT,
    founding_year INTEGER,
    organization_type VARCHAR(50),  -- nonprofit, charity, foundation
    
    -- Status and subscription
    status VARCHAR(50) DEFAULT 'trial',  -- trial, active, suspended, cancelled
    subscription_plan VARCHAR(50),  -- starter, professional, enterprise
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Settings (JSON)
    settings JSONB DEFAULT '{}',
    
    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(10),
    secondary_color VARCHAR(10),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_organizations_subdomain ON organizations(subdomain);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_active ON organizations(is_active, is_deleted);

-- Constraints
ALTER TABLE organizations 
    ADD CONSTRAINT organizations_subdomain_format 
    CHECK (subdomain ~* '^[a-z0-9-]+$');
```

### 2.2 users

User accounts with role-based access.

```sql
CREATE TABLE users (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Authentication
    email VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- Role and permissions
    role VARCHAR(50) DEFAULT 'user',  -- superadmin, admin, manager, user, readonly
    permissions JSONB DEFAULT '[]',  -- Custom permissions array
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    
    -- Two-factor authentication (future)
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    -- Profile
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    
    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT users_email_org_unique UNIQUE (email, organization_id)
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(organization_id, is_active);
CREATE INDEX idx_users_deleted ON users(is_deleted);

-- Full-text search
CREATE INDEX idx_users_fulltext ON users 
    USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));
```

### 2.3 roles

Role definitions for RBAC system.

```sql
CREATE TABLE roles (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Role details
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Permissions
    permissions JSONB DEFAULT '[]',
    
    -- System role flag
    is_system BOOLEAN DEFAULT FALSE,  -- System roles cannot be deleted
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT roles_name_org_unique UNIQUE (name, organization_id)
);

-- Indexes
CREATE INDEX idx_roles_organization ON roles(organization_id);
CREATE INDEX idx_roles_name ON roles(name);
```

### 2.4 permissions

Permission definitions.

```sql
CREATE TABLE permissions (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Permission details
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Grouping
    category VARCHAR(50),  -- donor_management, campaign_management, reporting
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT permissions_resource_action_unique UNIQUE (resource, action)
);

-- Indexes
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_category ON permissions(category);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description, category) VALUES
('donor:create', 'donor', 'create', 'Create new donors', 'donor_management'),
('donor:read', 'donor', 'read', 'View donor information', 'donor_management'),
('donor:update', 'donor', 'update', 'Update donor information', 'donor_management'),
('donor:delete', 'donor', 'delete', 'Delete donors', 'donor_management'),
('donor:export', 'donor', 'export', 'Export donor data', 'donor_management'),
('campaign:create', 'campaign', 'create', 'Create campaigns', 'campaign_management'),
('campaign:read', 'campaign', 'read', 'View campaigns', 'campaign_management'),
('campaign:update', 'campaign', 'update', 'Update campaigns', 'campaign_management'),
('campaign:delete', 'campaign', 'delete', 'Delete campaigns', 'campaign_management'),
('donation:create', 'donation', 'create', 'Record donations', 'donation_management'),
('donation:read', 'donation', 'read', 'View donations', 'donation_management'),
('donation:update', 'donation', 'update', 'Update donations', 'donation_management'),
('donation:delete', 'donation', 'delete', 'Delete donations', 'donation_management'),
('report:view', 'report', 'view', 'View reports', 'reporting'),
('report:export', 'report', 'export', 'Export reports', 'reporting'),
('user:create', 'user', 'create', 'Create users', 'user_management'),
('user:read', 'user', 'read', 'View users', 'user_management'),
('user:update', 'user', 'update', 'Update users', 'user_management'),
('user:delete', 'user', 'delete', 'Delete users', 'user_management');
```

---

## 3. Donor Management Tables

### 3.1 donors

Core donor information.

```sql
CREATE TABLE donors (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Donor type
    donor_type VARCHAR(50) NOT NULL DEFAULT 'individual',  -- individual, organization, foundation, corporate
    
    -- Personal information (for individuals)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    name_prefix VARCHAR(20),  -- Mr., Mrs., Dr., etc.
    name_suffix VARCHAR(20),  -- Jr., Sr., III, etc.
    
    -- Organization information (for non-individuals)
    organization_name VARCHAR(255),
    
    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Demographics
    gender VARCHAR(20),
    date_of_birth DATE,
    age_range VARCHAR(20),  -- 18-24, 25-34, 35-44, etc.
    
    -- Professional information
    employer VARCHAR(255),
    job_title VARCHAR(255),
    industry VARCHAR(100),
    
    -- Donor classification
    lifecycle_stage VARCHAR(50) DEFAULT 'prospect',  -- prospect, first_time, repeat, major_donor, lapsed
    previous_lifecycle_stage VARCHAR(50),
    lifecycle_stage_changed_at TIMESTAMP WITH TIME ZONE,
    donor_category VARCHAR(50),  -- annual, major, planned_giving, corporate, foundation
    
    -- Giving statistics
    lifetime_value DECIMAL(12,2) DEFAULT 0.00,
    total_donations INTEGER DEFAULT 0,
    average_gift DECIMAL(12,2) DEFAULT 0.00,
    largest_gift DECIMAL(12,2) DEFAULT 0.00,
    smallest_gift DECIMAL(12,2) DEFAULT 0.00,
    first_donation_date TIMESTAMP WITH TIME ZONE,
    last_donation_date TIMESTAMP WITH TIME ZONE,
    
    -- Engagement
    engagement_score INTEGER DEFAULT 0,  -- 0-100
    last_contact_date TIMESTAMP WITH TIME ZONE,
    preferred_contact_method VARCHAR(50) DEFAULT 'email',  -- email, phone, mail, text
    contact_frequency VARCHAR(50),  -- weekly, monthly, quarterly, annual
    
    -- Communication preferences
    email_opt_in BOOLEAN DEFAULT TRUE,
    phone_opt_in BOOLEAN DEFAULT TRUE,
    mail_opt_in BOOLEAN DEFAULT TRUE,
    sms_opt_in BOOLEAN DEFAULT FALSE,
    
    -- Social media
    facebook_url VARCHAR(255),
    twitter_handle VARCHAR(100),
    linkedin_url VARCHAR(255),
    instagram_handle VARCHAR(100),
    
    -- Wealth indicators
    estimated_capacity DECIMAL(12,2),
    wealth_rating VARCHAR(20),  -- A, B, C, D (highest to lowest capacity)
    
    -- Relationship
    primary_contact_id INTEGER REFERENCES users(id),
    relationship_manager_id INTEGER REFERENCES users(id),
    
    -- Notes and tags
    notes TEXT,
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}',
    
    -- Source tracking
    source VARCHAR(100),  -- website, event, referral, direct_mail, etc.
    referrer_donor_id INTEGER REFERENCES donors(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',  -- active, inactive, do_not_contact, deceased
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT donors_email_org_unique UNIQUE (email, organization_id)
);

-- Indexes
CREATE INDEX idx_donors_organization ON donors(organization_id);
CREATE INDEX idx_donors_email ON donors(email);
CREATE INDEX idx_donors_name ON donors(first_name, last_name);
CREATE INDEX idx_donors_lifecycle ON donors(organization_id, lifecycle_stage);
CREATE INDEX idx_donors_last_donation ON donors(organization_id, last_donation_date DESC);
CREATE INDEX idx_donors_lifetime_value ON donors(organization_id, lifetime_value DESC);
CREATE INDEX idx_donors_engagement ON donors(organization_id, engagement_score DESC);
CREATE INDEX idx_donors_active ON donors(organization_id, is_active, is_deleted);
CREATE INDEX idx_donors_type ON donors(organization_id, donor_type);
CREATE INDEX idx_donors_category ON donors(organization_id, donor_category);

-- Composite indexes for common queries
CREATE INDEX idx_donors_org_active_lifecycle ON donors(organization_id, is_active, lifecycle_stage);
CREATE INDEX idx_donors_org_date_range ON donors(organization_id, last_donation_date) 
    WHERE is_deleted = FALSE;

-- Full-text search
CREATE INDEX idx_donors_fulltext ON donors 
    USING gin(to_tsvector('english', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(organization_name, '') || ' ' || 
        COALESCE(email, '')
    ));

-- JSON indexes
CREATE INDEX idx_donors_tags ON donors USING gin(tags);
CREATE INDEX idx_donors_custom_fields ON donors USING gin(custom_fields);
```

### 3.2 donor_profiles

Extended donor information and relationships.

```sql
CREATE TABLE donor_profiles (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Extended personal information
    nickname VARCHAR(100),
    spouse_name VARCHAR(255),
    spouse_donor_id INTEGER REFERENCES donors(id),
    anniversary_date DATE,
    children_count INTEGER,
    
    -- Interest areas
    interests TEXT[],  -- Array of interests
    preferred_programs TEXT[],
    volunteering_interests TEXT[],
    
    -- Communication history
    last_email_sent TIMESTAMP WITH TIME ZONE,
    last_email_opened TIMESTAMP WITH TIME ZONE,
    last_phone_call TIMESTAMP WITH TIME ZONE,
    last_meeting TIMESTAMP WITH TIME ZONE,
    
    -- Event participation
    events_attended INTEGER DEFAULT 0,
    last_event_attended TIMESTAMP WITH TIME ZONE,
    
    -- Volunteer information
    is_volunteer BOOLEAN DEFAULT FALSE,
    volunteer_hours DECIMAL(10,2) DEFAULT 0.00,
    volunteer_since DATE,
    
    -- Board/Committee membership
    is_board_member BOOLEAN DEFAULT FALSE,
    board_position VARCHAR(100),
    board_term_start DATE,
    board_term_end DATE,
    committee_memberships TEXT[],
    
    -- Recognition
    recognition_level VARCHAR(50),  -- bronze, silver, gold, platinum
    recognition_preferences JSONB DEFAULT '{}',
    naming_opportunities TEXT[],
    
    -- Additional contact methods
    assistant_name VARCHAR(255),
    assistant_email VARCHAR(255),
    assistant_phone VARCHAR(20),
    
    -- Preferences
    preferred_communication_time VARCHAR(50),
    preferred_solicitation_method VARCHAR(50),
    acknowledgment_preferences JSONB DEFAULT '{}',
    
    -- Custom data
    additional_info JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT donor_profiles_donor_org_unique UNIQUE (donor_id, organization_id)
);

-- Indexes
CREATE INDEX idx_donor_profiles_donor ON donor_profiles(donor_id);
CREATE INDEX idx_donor_profiles_organization ON donor_profiles(organization_id);
CREATE INDEX idx_donor_profiles_board ON donor_profiles(organization_id, is_board_member);
CREATE INDEX idx_donor_profiles_volunteer ON donor_profiles(organization_id, is_volunteer);
```

### 3.3 donor_segments

Donor segmentation for targeting.

```sql
CREATE TABLE donor_segments (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Segment details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Segment type
    segment_type VARCHAR(50) DEFAULT 'custom',  -- system, custom, dynamic
    
    -- Criteria (for dynamic segments)
    criteria JSONB DEFAULT '{}',
    
    -- Statistics
    donor_count INTEGER DEFAULT 0,
    total_lifetime_value DECIMAL(12,2) DEFAULT 0.00,
    average_gift DECIMAL(12,2) DEFAULT 0.00,
    
    -- Settings
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_calculated TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT donor_segments_name_org_unique UNIQUE (name, organization_id)
);

-- Indexes
CREATE INDEX idx_donor_segments_organization ON donor_segments(organization_id);
CREATE INDEX idx_donor_segments_type ON donor_segments(segment_type);
CREATE INDEX idx_donor_segments_active ON donor_segments(organization_id, is_active);
```

### 3.4 donor_segment_members

Many-to-many relationship between donors and segments.

```sql
CREATE TABLE donor_segment_members (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    segment_id INTEGER NOT NULL REFERENCES donor_segments(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Membership details
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by INTEGER REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT donor_segment_members_unique UNIQUE (donor_id, segment_id)
);

-- Indexes
CREATE INDEX idx_segment_members_donor ON donor_segment_members(donor_id);
CREATE INDEX idx_segment_members_segment ON donor_segment_members(segment_id);
CREATE INDEX idx_segment_members_organization ON donor_segment_members(organization_id);
```

### 3.5 donor_lifecycle

Track donor lifecycle transitions.

```sql
CREATE TABLE donor_lifecycle (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Lifecycle transition
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    
    -- Reason and notes
    reason VARCHAR(255),
    notes TEXT,
    
    -- Metrics at transition
    total_donations_at_transition INTEGER,
    lifetime_value_at_transition DECIMAL(12,2),
    
    -- Timestamps
    transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_donor_lifecycle_donor ON donor_lifecycle(donor_id);
CREATE INDEX idx_donor_lifecycle_organization ON donor_lifecycle(organization_id);
CREATE INDEX idx_donor_lifecycle_stages ON donor_lifecycle(from_stage, to_stage);
CREATE INDEX idx_donor_lifecycle_date ON donor_lifecycle(transitioned_at DESC);
```

### 3.6 donor_notes

Notes and interactions with donors.

```sql
CREATE TABLE donor_notes (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Note details
    note_type VARCHAR(50) DEFAULT 'general',  -- general, call, meeting, email, event
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Related entities
    related_campaign_id INTEGER REFERENCES campaigns(id),
    related_donation_id INTEGER REFERENCES donations(id),
    related_event_id INTEGER REFERENCES events(id),
    
    -- Visibility
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Follow-up
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_date DATE,
    followup_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_donor_notes_donor ON donor_notes(donor_id);
CREATE INDEX idx_donor_notes_organization ON donor_notes(organization_id);
CREATE INDEX idx_donor_notes_type ON donor_notes(note_type);
CREATE INDEX idx_donor_notes_followup ON donor_notes(requires_followup, followup_date) 
    WHERE requires_followup = TRUE AND followup_completed = FALSE;
CREATE INDEX idx_donor_notes_created ON donor_notes(created_at DESC);

-- Full-text search
CREATE INDEX idx_donor_notes_fulltext ON donor_notes 
    USING gin(to_tsvector('english', COALESCE(subject, '') || ' ' || content));
```

---

## 4. Campaign & Fundraising Tables

### 4.1 campaigns

Fundraising campaigns.

```sql
CREATE TABLE campaigns (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Campaign details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_code VARCHAR(50),
    
    -- Campaign type and category
    campaign_type VARCHAR(50) NOT NULL,  -- annual, major_gift, capital, planned_giving, special_event
    category VARCHAR(100),  -- general_operating, scholarship, building, program, etc.
    
    -- Goals
    goal_amount DECIMAL(12,2),
    goal_donors INTEGER,
    stretch_goal_amount DECIMAL(12,2),
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    fiscal_year INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'planning',  -- planning, active, completed, cancelled
    
    -- Target audience
    target_segment_ids INTEGER[],
    target_donor_count INTEGER,
    
    -- Communication
    primary_message TEXT,
    call_to_action VARCHAR(255),
    donation_page_url VARCHAR(500),
    
    -- Channels
    channels TEXT[],  -- email, direct_mail, social_media, phone, events, website
    
    -- Budget
    budget_amount DECIMAL(12,2),
    actual_expenses DECIMAL(12,2) DEFAULT 0.00,
    
    -- Performance metrics
    total_raised DECIMAL(12,2) DEFAULT 0.00,
    total_donors INTEGER DEFAULT 0,
    new_donors INTEGER DEFAULT 0,
    repeat_donors INTEGER DEFAULT 0,
    average_gift DECIMAL(12,2) DEFAULT 0.00,
    largest_gift DECIMAL(12,2) DEFAULT 0.00,
    
    -- Conversion metrics
    prospects_reached INTEGER DEFAULT 0,
    prospects_engaged INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- ROI
    roi_percentage DECIMAL(5,2) DEFAULT 0.00,
    cost_per_dollar_raised DECIMAL(5,2) DEFAULT 0.00,
    
    -- Team
    campaign_manager_id INTEGER REFERENCES users(id),
    team_member_ids INTEGER[],
    
    -- Settings
    is_public BOOLEAN DEFAULT TRUE,
    accepts_online_donations BOOLEAN DEFAULT TRUE,
    is_recurring_campaign BOOLEAN DEFAULT FALSE,
    
    -- Custom fields
    custom_fields JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_active ON campaigns(organization_id, is_active, status);
CREATE INDEX idx_campaigns_fiscal_year ON campaigns(organization_id, fiscal_year);
CREATE INDEX idx_campaigns_manager ON campaigns(campaign_manager_id);

-- Full-text search
CREATE INDEX idx_campaigns_fulltext ON campaigns 
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

### 4.2 campaign_metrics

Daily/periodic campaign performance metrics.

```sql
CREATE TABLE campaign_metrics (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Metric period
    metric_date DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'daily',  -- daily, weekly, monthly
    
    -- Donation metrics
    donations_count INTEGER DEFAULT 0,
    donations_amount DECIMAL(12,2) DEFAULT 0.00,
    average_donation DECIMAL(12,2) DEFAULT 0.00,
    
    -- Donor metrics
    unique_donors INTEGER DEFAULT 0,
    new_donors INTEGER DEFAULT 0,
    repeat_donors INTEGER DEFAULT 0,
    
    -- Cumulative metrics
    cumulative_donations DECIMAL(12,2) DEFAULT 0.00,
    cumulative_donors INTEGER DEFAULT 0,
    goal_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Engagement metrics
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    
    -- Conversion
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT campaign_metrics_unique UNIQUE (campaign_id, metric_date, period_type)
);

-- Indexes
CREATE INDEX idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);
CREATE INDEX idx_campaign_metrics_date ON campaign_metrics(metric_date DESC);
CREATE INDEX idx_campaign_metrics_campaign_date ON campaign_metrics(campaign_id, metric_date DESC);
```

---

## 5. Financial Tables

### 5.1 donations

Individual donation transactions.

```sql
CREATE TABLE donations (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Donation details
    donation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Donation type
    donation_type VARCHAR(50) DEFAULT 'monetary',  -- monetary, in_kind, stock, cryptocurrency
    payment_method VARCHAR(50),  -- credit_card, check, cash, wire_transfer, paypal, stripe
    
    -- Check/Transaction details
    check_number VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_processor VARCHAR(50),
    
    -- Designation
    designation VARCHAR(255),  -- general_fund, scholarship, building, program_name
    fund_id INTEGER,
    is_restricted BOOLEAN DEFAULT FALSE,
    
    -- Recurring donation
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(50),  -- monthly, quarterly, annually
    recurring_parent_id INTEGER REFERENCES donations(id),
    recurring_status VARCHAR(50),  -- active, paused, cancelled, completed
    
    -- Pledge information
    pledge_id INTEGER REFERENCES pledges(id),
    is_pledge_payment BOOLEAN DEFAULT FALSE,
    
    -- Matching gift
    is_matched BOOLEAN DEFAULT FALSE,
    matching_company VARCHAR(255),
    match_ratio VARCHAR(20),  -- 1:1, 2:1, 0.5:1
    matched_amount DECIMAL(12,2),
    matching_gift_id INTEGER REFERENCES donations(id),
    
    -- Tribute/Memorial
    is_tribute BOOLEAN DEFAULT FALSE,
    tribute_type VARCHAR(50),  -- honor, memory
    tribute_name VARCHAR(255),
    tribute_notification_name VARCHAR(255),
    tribute_notification_address TEXT,
    
    -- Anonymous donation
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Tax information
    is_tax_deductible BOOLEAN DEFAULT TRUE,
    tax_deductible_amount DECIMAL(12,2),
    receipt_number VARCHAR(100),
    receipt_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Acknowledgment
    thank_you_sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by INTEGER REFERENCES users(id),
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'pending',  -- pending, completed, failed, refunded, cancelled
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Refund information
    refund_amount DECIMAL(12,2),
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_reason TEXT,
    
    -- Source tracking
    source VARCHAR(100),  -- website, event, mail, phone, in_person
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    referrer_url VARCHAR(500),
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Custom fields
    custom_fields JSONB DEFAULT '{}',
    
    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_organization ON donations(organization_id);
CREATE INDEX idx_donations_date ON donations(donation_date DESC);
CREATE INDEX idx_donations_amount ON donations(amount DESC);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_recurring ON donations(is_recurring, recurring_status);
CREATE INDEX idx_donations_receipt ON donations(receipt_sent_at) WHERE receipt_sent_at IS NULL;
CREATE INDEX idx_donations_org_date ON donations(organization_id, donation_date DESC);
CREATE INDEX idx_donations_org_status ON donations(organization_id, status);

-- Composite indexes for common queries
CREATE INDEX idx_donations_donor_date ON donations(donor_id, donation_date DESC);
CREATE INDEX idx_donations_campaign_date ON donations(campaign_id, donation_date DESC) 
    WHERE campaign_id IS NOT NULL;
```

### 5.2 pledges

Promised future donations.

```sql
CREATE TABLE pledges (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Pledge details
    pledge_date DATE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment schedule
    payment_frequency VARCHAR(50),  -- one_time, monthly, quarterly, annually
    payment_count INTEGER,
    payment_amount DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    next_payment_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',  -- active, fulfilled, cancelled, defaulted
    
    -- Payments
    total_paid DECIMAL(12,2) DEFAULT 0.00,
    balance_remaining DECIMAL(12,2),
    payments_received INTEGER DEFAULT 0,
    
    -- Reminders
    send_reminders BOOLEAN DEFAULT TRUE,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    
    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_pledges_donor ON pledges(donor_id);
CREATE INDEX idx_pledges_campaign ON pledges(campaign_id);
CREATE INDEX idx_pledges_organization ON pledges(organization_id);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_pledges_next_payment ON pledges(next_payment_date) 
    WHERE status = 'active';
```

### 5.3 payment_methods

Stored payment methods for donors.

```sql
CREATE TABLE payment_methods (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Payment method type
    method_type VARCHAR(50) NOT NULL,  -- credit_card, bank_account, paypal
    
    -- Card information (encrypted/tokenized)
    card_type VARCHAR(50),  -- visa, mastercard, amex, discover
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_token VARCHAR(255),  -- Payment processor token
    
    -- Bank account information
    bank_name VARCHAR(255),
    account_type VARCHAR(50),  -- checking, savings
    account_last4 VARCHAR(4),
    routing_number_last4 VARCHAR(4),
    bank_token VARCHAR(255),
    
    -- Billing address
    billing_name VARCHAR(255),
    billing_address_line1 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(50),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    
    -- Settings
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payment_methods_donor ON payment_methods(donor_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(donor_id, is_default);
```

---

## 6. Analytics Tables

### 6.1 executive_dashboard_metrics

High-level KPIs for executive dashboard.

```sql
CREATE TABLE executive_dashboard_metrics (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Metric period
    metric_date DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'daily',  -- daily, weekly, monthly, quarterly, yearly
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    online_revenue DECIMAL(12,2) DEFAULT 0.00,
    offline_revenue DECIMAL(12,2) DEFAULT 0.00,
    recurring_revenue DECIMAL(12,2) DEFAULT 0.00,
    major_gift_revenue DECIMAL(12,2) DEFAULT 0.00,
    
    -- Donor metrics
    total_donors INTEGER DEFAULT 0,
    new_donors INTEGER DEFAULT 0,
    repeat_donors INTEGER DEFAULT 0,
    lapsed_donors_reactivated INTEGER DEFAULT 0,
    
    -- Retention
    donor_retention_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Campaign metrics
    active_campaigns INTEGER DEFAULT 0,
    campaigns_goal_met INTEGER DEFAULT 0,
    average_campaign_performance DECIMAL(5,2) DEFAULT 0.00,
    
    -- Averages
    average_gift_size DECIMAL(12,2) DEFAULT 0.00,
    average_donor_lifetime_value DECIMAL(12,2) DEFAULT 0.00,
    
    -- Growth metrics
    revenue_growth_rate DECIMAL(5,2) DEFAULT 0.00,
    donor_growth_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT executive_metrics_unique UNIQUE (organization_id, metric_date, period_type)
);

-- Indexes
CREATE INDEX idx_executive_metrics_organization ON executive_dashboard_metrics(organization_id);
CREATE INDEX idx_executive_metrics_date ON executive_dashboard_metrics(metric_date DESC);
CREATE INDEX idx_executive_metrics_org_date ON executive_dashboard_metrics(organization_id, metric_date DESC);
```

This is Part 2 covering the database schema. Would you like me to continue with the remaining tables (analytics, events, system tables) and then move on to Parts 3-8?
