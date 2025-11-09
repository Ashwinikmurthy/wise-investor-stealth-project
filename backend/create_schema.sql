-- ============================================================================
-- Database Schema Creation Script
-- Generated from schema.json for testing_db
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- BASE TABLES (No foreign key dependencies)
-- ============================================================================

-- Organizations table (referenced by many tables)
CREATE TABLE organizations (
    id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    mission TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    organization_type VARCHAR(100),
    annual_revenue NUMERIC,
    fiscal_year_end VARCHAR(20),
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(100) DEFAULT 'UTC',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_superadmin BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Permissions table
CREATE TABLE permissions (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Roles table
CREATE TABLE roles (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Parties table
CREATE TABLE parties (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    party_type VARCHAR(50) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    organization_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    preferred_contact VARCHAR(50),
    relationship_status VARCHAR(50),
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donors table
CREATE TABLE donors (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    party_id UUID,
    donor_type VARCHAR(50),
    constituent_code VARCHAR(100),
    salutation VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    donor_status VARCHAR(50) DEFAULT 'active',
    total_donations NUMERIC DEFAULT 0,
    lifetime_value NUMERIC DEFAULT 0,
    average_gift_amount NUMERIC DEFAULT 0,
    largest_gift_amount NUMERIC DEFAULT 0,
    first_gift_date TIMESTAMP WITH TIME ZONE,
    last_gift_date TIMESTAMP WITH TIME ZONE,
    giving_frequency VARCHAR(50),
    preferred_contact_method VARCHAR(50),
    communication_preferences JSONB DEFAULT '{}'::jsonb,
    interests TEXT[],
    tags TEXT[],
    wealth_rating VARCHAR(50),
    capacity_rating VARCHAR(50),
    affinity_score NUMERIC,
    engagement_score NUMERIC,
    retention_risk VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(100),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    goal_amount NUMERIC,
    raised_amount NUMERIC DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Programs table
CREATE TABLE programs (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_type VARCHAR(100),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    budget NUMERIC,
    status VARCHAR(50) DEFAULT 'active',
    location TEXT,
    target_beneficiaries INTEGER,
    actual_beneficiaries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    program_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    budget NUMERIC,
    spent_amount NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    location TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    target_beneficiaries INTEGER,
    actual_beneficiaries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Funds table
CREATE TABLE funds (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    fund_code VARCHAR(50) NOT NULL,
    fund_name VARCHAR(255) NOT NULL,
    description TEXT,
    fund_type VARCHAR(100),
    is_restricted BOOLEAN DEFAULT false,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Expense Categories table
CREATE TABLE expense_categories (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Events table
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    campaign_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    start_datetime TIMESTAMP WITH TIME ZONE,
    end_datetime TIMESTAMP WITH TIME ZONE,
    location TEXT,
    venue VARCHAR(255),
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    attended_count INTEGER DEFAULT 0,
    ticket_price NUMERIC,
    goal_amount NUMERIC,
    raised_amount NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Volunteers table
CREATE TABLE volunteers (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    user_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    skills TEXT[],
    availability JSONB DEFAULT '{}'::jsonb,
    total_hours NUMERIC DEFAULT 0,
    status VARCHAR(100),
    background_check_status VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Beneficiaries table
CREATE TABLE beneficiaries (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    identification_number VARCHAR(100),
    household_size INTEGER,
    income_level VARCHAR(50),
    needs_assessment JSONB DEFAULT '{}'::jsonb,
    enrollment_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Major Gift Officers table
CREATE TABLE major_gift_officers (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    user_id UUID,
    officer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    territory VARCHAR(255),
    specialization VARCHAR(255),
    start_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donor Giving Segments table
CREATE TABLE donor_giving_segments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    segment_name VARCHAR(255) NOT NULL,
    min_lifetime_giving NUMERIC,
    max_lifetime_giving NUMERIC,
    min_last_gift NUMERIC,
    max_last_gift NUMERIC,
    min_gifts_count INTEGER,
    max_gifts_count INTEGER,
    recency_days INTEGER,
    priority_level VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Moves Management Stages table
CREATE TABLE moves_management_stages (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID,
    officer_id UUID,
    stage VARCHAR(100) NOT NULL,
    sub_stage VARCHAR(100),
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_close_date TIMESTAMP WITH TIME ZONE,
    projected_amount NUMERIC,
    probability NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donor Exclusion Tags table
CREATE TABLE donor_exclusion_tags (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    tag_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- User Registration Requests table
CREATE TABLE user_registration_requests (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    role_requested VARCHAR(100),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donors Backup table
CREATE TABLE donors_backup (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    party_id UUID,
    donor_type VARCHAR(50),
    constituent_code VARCHAR(100),
    salutation VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    donor_status VARCHAR(50) DEFAULT 'active',
    total_donations NUMERIC DEFAULT 0,
    lifetime_value NUMERIC DEFAULT 0,
    average_gift_amount NUMERIC DEFAULT 0,
    largest_gift_amount NUMERIC DEFAULT 0,
    first_gift_date TIMESTAMP WITH TIME ZONE,
    last_gift_date TIMESTAMP WITH TIME ZONE,
    giving_frequency VARCHAR(50),
    preferred_contact_method VARCHAR(50),
    communication_preferences JSONB DEFAULT '{}'::jsonb,
    interests TEXT[],
    tags TEXT[],
    wealth_rating VARCHAR(50),
    capacity_rating VARCHAR(50),
    affinity_score NUMERIC,
    engagement_score NUMERIC,
    retention_risk VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    changes JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Reports table
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    created_by UUID,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    schedule VARCHAR(100),
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ============================================================================
-- DEPENDENT TABLES (With foreign key relationships)
-- ============================================================================

-- Addresses table
CREATE TABLE addresses (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    party_id UUID NOT NULL,
    addr_lines TEXT,
    city_region VARCHAR(200),
    postal_country VARCHAR(100),
    is_primary BOOLEAN,
    valid_from_to VARCHAR(100),
    PRIMARY KEY (id)
);

-- Contact Points table
CREATE TABLE contact_points (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    party_id UUID NOT NULL,
    contact_type VARCHAR(50) NOT NULL,
    value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN,
    valid_from_to VARCHAR(100),
    PRIMARY KEY (id)
);

-- Party Roles table
CREATE TABLE party_roles (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    party_id UUID NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (id)
);

-- Appeals table
CREATE TABLE appeals (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    code VARCHAR(100) NOT NULL,
    channel VARCHAR(100),
    start_end VARCHAR(100),
    PRIMARY KEY (id)
);

-- Packages table
CREATE TABLE packages (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    appeal_id UUID NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    description TEXT,
    cost NUMERIC,
    PRIMARY KEY (id)
);

-- Donations table
CREATE TABLE donations (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID,
    campaign_id UUID,
    fund_id UUID,
    amount NUMERIC NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    donation_type VARCHAR(50),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    receipt_number VARCHAR(100),
    is_recurring BOOLEAN DEFAULT false,
    anonymous BOOLEAN DEFAULT false,
    tribute_type VARCHAR(50),
    tribute_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donation Lines table
CREATE TABLE donation_lines (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donation_id UUID NOT NULL,
    fund_id UUID,
    project_id UUID,
    amount NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donation Campaigns table
CREATE TABLE donation_campaigns (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donation_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Pledges table
CREATE TABLE pledges (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID,
    campaign_id UUID,
    pledge_amount NUMERIC NOT NULL,
    paid_amount NUMERIC DEFAULT 0,
    balance NUMERIC,
    pledge_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    payment_schedule VARCHAR(50),
    installment_count INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Pledge Installments table
CREATE TABLE pledge_installments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    pledge_id UUID NOT NULL,
    installment_number INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    paid_amount NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Recurring Gifts table
CREATE TABLE recurring_gifts (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID,
    campaign_id UUID,
    fund_id UUID,
    amount NUMERIC NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    next_charge_date TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    total_collected NUMERIC DEFAULT 0,
    payment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Matching Claims table
CREATE TABLE matching_claims (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donation_id UUID NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    match_amount NUMERIC NOT NULL,
    claim_status VARCHAR(50) DEFAULT 'pending',
    submitted_date TIMESTAMP WITH TIME ZONE,
    approved_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Soft Credits table
CREATE TABLE soft_credits (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donation_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    credit_amount NUMERIC NOT NULL,
    credit_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donation_id UUID,
    pledge_installment_id UUID,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Payment Methods table
CREATE TABLE payment_methods (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID,
    payment_type VARCHAR(50) NOT NULL,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    bank_name VARCHAR(255),
    account_last4 VARCHAR(4),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Expenses table
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    project_id UUID,
    program_id UUID,
    category_id UUID,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    vendor VARCHAR(255),
    description TEXT,
    receipt_url TEXT,
    approved_by UUID,
    approval_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Campaign Updates table
CREATE TABLE campaign_updates (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    campaign_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Stories table
CREATE TABLE stories (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    beneficiary_id UUID,
    program_id UUID,
    project_id UUID,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    story_type VARCHAR(100),
    impact_summary TEXT,
    media_urls TEXT[],
    is_published BOOLEAN DEFAULT false,
    published_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Impact Metrics table
CREATE TABLE impact_metrics (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    program_id UUID,
    project_id UUID,
    metric_name VARCHAR(255) NOT NULL,
    metric_type VARCHAR(100),
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit VARCHAR(50),
    measurement_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Outcome Metrics table
CREATE TABLE outcome_metrics (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    program_id UUID,
    project_id UUID,
    metric_name VARCHAR(255) NOT NULL,
    description TEXT,
    target_value NUMERIC,
    baseline_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit VARCHAR(50),
    measurement_frequency VARCHAR(50),
    last_measured_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Outcome Records table
CREATE TABLE outcome_records (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    outcome_metric_id UUID NOT NULL,
    beneficiary_id UUID,
    measured_value NUMERIC NOT NULL,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- SDG Alignment table
CREATE TABLE sdg_alignment (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    program_id UUID,
    project_id UUID,
    sdg_number INTEGER NOT NULL,
    sdg_target VARCHAR(50),
    alignment_level VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Program Enrollments table
CREATE TABLE program_enrollments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    program_id UUID NOT NULL,
    beneficiary_id UUID NOT NULL,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'enrolled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Service Events table
CREATE TABLE service_events (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    program_id UUID,
    project_id UUID,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    participants_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Service Beneficiaries table
CREATE TABLE service_beneficiaries (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    service_event_id UUID NOT NULL,
    beneficiary_id UUID NOT NULL,
    service_received TEXT,
    satisfaction_rating INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Project Team table
CREATE TABLE project_team (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(100),
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (id)
);

-- Tasks table
CREATE TABLE tasks (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    project_id UUID,
    assigned_to UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Event Registrations table
CREATE TABLE event_registrations (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    event_id UUID NOT NULL,
    donor_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(50) DEFAULT 'registered',
    ticket_type VARCHAR(100),
    amount_paid NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Event Tickets table
CREATE TABLE event_tickets (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    event_id UUID NOT NULL,
    ticket_type VARCHAR(100) NOT NULL,
    price NUMERIC NOT NULL,
    quantity_available INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Volunteer Skills table
CREATE TABLE volunteer_skills (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    volunteer_id UUID NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50),
    years_of_experience INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Volunteer Activities table
CREATE TABLE volunteer_activities (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    volunteer_id UUID NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    hours NUMERIC NOT NULL,
    activity_date TIMESTAMP WITH TIME ZONE,
    supervisor VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Volunteer Events table
CREATE TABLE volunteer_events (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    required_volunteers INTEGER,
    registered_volunteers INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Volunteer Assignments table
CREATE TABLE volunteer_assignments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    volunteer_id UUID NOT NULL,
    event_id UUID NOT NULL,
    role VARCHAR(100),
    shift_start TIMESTAMP WITH TIME ZONE,
    shift_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Email Campaigns table
CREATE TABLE email_campaigns (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    campaign_name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    scheduled_send TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Email Campaign Recipients table
CREATE TABLE email_campaign_recipients (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    campaign_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced BOOLEAN DEFAULT false,
    unsubscribed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Consents table
CREATE TABLE consents (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID,
    consent_type VARCHAR(100) NOT NULL,
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- User Roles table
CREATE TABLE user_roles (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Role Permissions table
CREATE TABLE role_permissions (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donor Portfolio Assignments table
CREATE TABLE donor_portfolio_assignments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID NOT NULL,
    officer_id UUID NOT NULL,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_primary BOOLEAN DEFAULT true,
    portfolio_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Officer Annual Targets table
CREATE TABLE officer_annual_targets (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    officer_id UUID NOT NULL,
    fiscal_year VARCHAR(10) NOT NULL,
    revenue_target NUMERIC NOT NULL,
    visits_target INTEGER,
    proposals_target INTEGER,
    solicitations_target INTEGER,
    actual_revenue NUMERIC DEFAULT 0,
    actual_visits INTEGER DEFAULT 0,
    actual_proposals INTEGER DEFAULT 0,
    actual_solicitations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Gift Goals table
CREATE TABLE gift_goals (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    goal_name VARCHAR(255) NOT NULL,
    goal_type VARCHAR(100),
    target_amount NUMERIC NOT NULL,
    target_donor_count INTEGER,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    current_amount NUMERIC DEFAULT 0,
    current_donor_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Solicitation Proposals table
CREATE TABLE solicitation_proposals (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID NOT NULL,
    officer_id UUID,
    proposal_amount NUMERIC NOT NULL,
    proposal_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ask_date TIMESTAMP WITH TIME ZONE,
    close_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    probability NUMERIC,
    campaign_id UUID,
    fund_id UUID,
    proposal_text TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donor Meetings table
CREATE TABLE donor_meetings (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID NOT NULL,
    officer_id UUID,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_type VARCHAR(100),
    location TEXT,
    attendees TEXT,
    purpose TEXT,
    outcome TEXT,
    next_steps TEXT,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Donor Priority Cache table
CREATE TABLE donor_priority_cache (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    organization_id UUID,
    donor_id UUID NOT NULL,
    priority_score NUMERIC,
    segment_id UUID,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    calculation_factors JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Users foreign keys
ALTER TABLE users ADD CONSTRAINT users_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Roles foreign keys
ALTER TABLE roles ADD CONSTRAINT roles_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Parties foreign keys
ALTER TABLE parties ADD CONSTRAINT parties_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donors foreign keys
ALTER TABLE donors ADD CONSTRAINT donors_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donors ADD CONSTRAINT donors_party_id_fkey 
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Campaigns foreign keys
ALTER TABLE campaigns ADD CONSTRAINT campaigns_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Programs foreign keys
ALTER TABLE programs ADD CONSTRAINT programs_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Projects foreign keys
ALTER TABLE projects ADD CONSTRAINT projects_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE projects ADD CONSTRAINT projects_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Funds foreign keys
ALTER TABLE funds ADD CONSTRAINT funds_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Expense Categories foreign keys
ALTER TABLE expense_categories ADD CONSTRAINT expense_categories_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE expense_categories ADD CONSTRAINT expense_categories_parent_category_id_fkey 
    FOREIGN KEY (parent_category_id) REFERENCES expense_categories(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Events foreign keys
ALTER TABLE events ADD CONSTRAINT events_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE events ADD CONSTRAINT events_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Beneficiaries foreign keys
ALTER TABLE beneficiaries ADD CONSTRAINT beneficiaries_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Major Gift Officers foreign keys
ALTER TABLE major_gift_officers ADD CONSTRAINT major_gift_officers_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE major_gift_officers ADD CONSTRAINT major_gift_officers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donor Giving Segments foreign keys
ALTER TABLE donor_giving_segments ADD CONSTRAINT donor_giving_segments_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Moves Management Stages foreign keys
ALTER TABLE moves_management_stages ADD CONSTRAINT moves_management_stages_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE moves_management_stages ADD CONSTRAINT moves_management_stages_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE moves_management_stages ADD CONSTRAINT moves_management_stages_officer_id_fkey 
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donor Exclusion Tags foreign keys
ALTER TABLE donor_exclusion_tags ADD CONSTRAINT donor_exclusion_tags_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- User Registration Requests foreign keys
ALTER TABLE user_registration_requests ADD CONSTRAINT user_registration_requests_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE user_registration_requests ADD CONSTRAINT user_registration_requests_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donors Backup foreign keys
ALTER TABLE donors_backup ADD CONSTRAINT donors_backup_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donors_backup ADD CONSTRAINT donors_backup_party_id_fkey 
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Addresses foreign keys
ALTER TABLE addresses ADD CONSTRAINT addresses_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE addresses ADD CONSTRAINT addresses_party_id_fkey 
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Contact Points foreign keys
ALTER TABLE contact_points ADD CONSTRAINT contact_points_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE contact_points ADD CONSTRAINT contact_points_party_id_fkey 
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Party Roles foreign keys
ALTER TABLE party_roles ADD CONSTRAINT party_roles_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE party_roles ADD CONSTRAINT party_roles_party_id_fkey 
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Appeals foreign keys
ALTER TABLE appeals ADD CONSTRAINT appeals_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE appeals ADD CONSTRAINT appeals_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Packages foreign keys
ALTER TABLE packages ADD CONSTRAINT packages_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE packages ADD CONSTRAINT packages_appeal_id_fkey 
    FOREIGN KEY (appeal_id) REFERENCES appeals(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donations foreign keys
ALTER TABLE donations ADD CONSTRAINT donations_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donations ADD CONSTRAINT donations_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donations ADD CONSTRAINT donations_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donations ADD CONSTRAINT donations_fund_id_fkey 
    FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donation Lines foreign keys
ALTER TABLE donation_lines ADD CONSTRAINT donation_lines_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donation_lines ADD CONSTRAINT donation_lines_donation_id_fkey 
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donation_lines ADD CONSTRAINT donation_lines_fund_id_fkey 
    FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donation_lines ADD CONSTRAINT donation_lines_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donation Campaigns foreign keys
ALTER TABLE donation_campaigns ADD CONSTRAINT donation_campaigns_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donation_campaigns ADD CONSTRAINT donation_campaigns_donation_id_fkey 
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donation_campaigns ADD CONSTRAINT donation_campaigns_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Pledges foreign keys
ALTER TABLE pledges ADD CONSTRAINT pledges_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE pledges ADD CONSTRAINT pledges_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE pledges ADD CONSTRAINT pledges_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Pledge Installments foreign keys
ALTER TABLE pledge_installments ADD CONSTRAINT pledge_installments_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE pledge_installments ADD CONSTRAINT pledge_installments_pledge_id_fkey 
    FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Recurring Gifts foreign keys
ALTER TABLE recurring_gifts ADD CONSTRAINT recurring_gifts_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE recurring_gifts ADD CONSTRAINT recurring_gifts_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE recurring_gifts ADD CONSTRAINT recurring_gifts_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE recurring_gifts ADD CONSTRAINT recurring_gifts_fund_id_fkey 
    FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Matching Claims foreign keys
ALTER TABLE matching_claims ADD CONSTRAINT matching_claims_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE matching_claims ADD CONSTRAINT matching_claims_donation_id_fkey 
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Soft Credits foreign keys
ALTER TABLE soft_credits ADD CONSTRAINT soft_credits_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE soft_credits ADD CONSTRAINT soft_credits_donation_id_fkey 
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE soft_credits ADD CONSTRAINT soft_credits_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Payments foreign keys
ALTER TABLE payments ADD CONSTRAINT payments_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE payments ADD CONSTRAINT payments_donation_id_fkey 
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE payments ADD CONSTRAINT payments_pledge_installment_id_fkey 
    FOREIGN KEY (pledge_installment_id) REFERENCES pledge_installments(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Payment Methods foreign keys
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Expenses foreign keys
ALTER TABLE expenses ADD CONSTRAINT expenses_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE expenses ADD CONSTRAINT expenses_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE expenses ADD CONSTRAINT expenses_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE expenses ADD CONSTRAINT expenses_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE expenses ADD CONSTRAINT expenses_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Campaign Updates foreign keys
ALTER TABLE campaign_updates ADD CONSTRAINT campaign_updates_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE campaign_updates ADD CONSTRAINT campaign_updates_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Stories foreign keys
ALTER TABLE stories ADD CONSTRAINT stories_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE stories ADD CONSTRAINT stories_beneficiary_id_fkey 
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE stories ADD CONSTRAINT stories_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE stories ADD CONSTRAINT stories_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Impact Metrics foreign keys
ALTER TABLE impact_metrics ADD CONSTRAINT impact_metrics_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE impact_metrics ADD CONSTRAINT impact_metrics_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE impact_metrics ADD CONSTRAINT impact_metrics_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Outcome Metrics foreign keys
ALTER TABLE outcome_metrics ADD CONSTRAINT outcome_metrics_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE outcome_metrics ADD CONSTRAINT outcome_metrics_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE outcome_metrics ADD CONSTRAINT outcome_metrics_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Outcome Records foreign keys
ALTER TABLE outcome_records ADD CONSTRAINT outcome_records_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE outcome_records ADD CONSTRAINT outcome_records_outcome_metric_id_fkey 
    FOREIGN KEY (outcome_metric_id) REFERENCES outcome_metrics(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE outcome_records ADD CONSTRAINT outcome_records_beneficiary_id_fkey 
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- SDG Alignment foreign keys
ALTER TABLE sdg_alignment ADD CONSTRAINT sdg_alignment_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE sdg_alignment ADD CONSTRAINT sdg_alignment_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE sdg_alignment ADD CONSTRAINT sdg_alignment_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Program Enrollments foreign keys
ALTER TABLE program_enrollments ADD CONSTRAINT program_enrollments_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE program_enrollments ADD CONSTRAINT program_enrollments_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE program_enrollments ADD CONSTRAINT program_enrollments_beneficiary_id_fkey 
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Service Events foreign keys
ALTER TABLE service_events ADD CONSTRAINT service_events_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE service_events ADD CONSTRAINT service_events_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE service_events ADD CONSTRAINT service_events_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Service Beneficiaries foreign keys
ALTER TABLE service_beneficiaries ADD CONSTRAINT service_beneficiaries_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE service_beneficiaries ADD CONSTRAINT service_beneficiaries_service_event_id_fkey 
    FOREIGN KEY (service_event_id) REFERENCES service_events(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE service_beneficiaries ADD CONSTRAINT service_beneficiaries_beneficiary_id_fkey 
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Project Team foreign keys
ALTER TABLE project_team ADD CONSTRAINT project_team_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE project_team ADD CONSTRAINT project_team_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE project_team ADD CONSTRAINT project_team_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Tasks foreign keys
ALTER TABLE tasks ADD CONSTRAINT tasks_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Event Registrations foreign keys
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Event Tickets foreign keys
ALTER TABLE event_tickets ADD CONSTRAINT event_tickets_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE event_tickets ADD CONSTRAINT event_tickets_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Volunteer Skills foreign keys
ALTER TABLE volunteer_skills ADD CONSTRAINT volunteer_skills_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE volunteer_skills ADD CONSTRAINT volunteer_skills_volunteer_id_fkey 
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Volunteer Activities foreign keys
ALTER TABLE volunteer_activities ADD CONSTRAINT volunteer_activities_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE volunteer_activities ADD CONSTRAINT volunteer_activities_volunteer_id_fkey 
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Volunteer Events foreign keys
ALTER TABLE volunteer_events ADD CONSTRAINT volunteer_events_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Volunteer Assignments foreign keys
ALTER TABLE volunteer_assignments ADD CONSTRAINT volunteer_assignments_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE volunteer_assignments ADD CONSTRAINT volunteer_assignments_volunteer_id_fkey 
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE volunteer_assignments ADD CONSTRAINT volunteer_assignments_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES volunteer_events(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Email Campaigns foreign keys
ALTER TABLE email_campaigns ADD CONSTRAINT email_campaigns_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Email Campaign Recipients foreign keys
ALTER TABLE email_campaign_recipients ADD CONSTRAINT email_campaign_recipients_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE email_campaign_recipients ADD CONSTRAINT email_campaign_recipients_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE email_campaign_recipients ADD CONSTRAINT email_campaign_recipients_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Consents foreign keys
ALTER TABLE consents ADD CONSTRAINT consents_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE consents ADD CONSTRAINT consents_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- User Roles foreign keys
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Role Permissions foreign keys
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey 
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donor Portfolio Assignments foreign keys
ALTER TABLE donor_portfolio_assignments ADD CONSTRAINT donor_portfolio_assignments_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donor_portfolio_assignments ADD CONSTRAINT donor_portfolio_assignments_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donor_portfolio_assignments ADD CONSTRAINT donor_portfolio_assignments_officer_id_fkey 
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Officer Annual Targets foreign keys
ALTER TABLE officer_annual_targets ADD CONSTRAINT officer_annual_targets_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE officer_annual_targets ADD CONSTRAINT officer_annual_targets_officer_id_fkey 
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Gift Goals foreign keys
ALTER TABLE gift_goals ADD CONSTRAINT gift_goals_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Solicitation Proposals foreign keys
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_officer_id_fkey 
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_fund_id_fkey 
    FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donor Meetings foreign keys
ALTER TABLE donor_meetings ADD CONSTRAINT donor_meetings_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donor_meetings ADD CONSTRAINT donor_meetings_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donor_meetings ADD CONSTRAINT donor_meetings_officer_id_fkey 
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Donor Priority Cache foreign keys
ALTER TABLE donor_priority_cache ADD CONSTRAINT donor_priority_cache_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donor_priority_cache ADD CONSTRAINT donor_priority_cache_donor_id_fkey 
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE donor_priority_cache ADD CONSTRAINT donor_priority_cache_segment_id_fkey 
    FOREIGN KEY (segment_id) REFERENCES donor_giving_segments(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Reports foreign keys
ALTER TABLE reports ADD CONSTRAINT reports_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE reports ADD CONSTRAINT reports_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Organizations indexes
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Users indexes
CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE UNIQUE INDEX users_username_key ON users(username);
CREATE INDEX idx_users_organization ON users(organization_id);

-- Donors indexes
CREATE UNIQUE INDEX donors_email_key ON donors(email);
CREATE INDEX idx_donors_donor_status ON donors(donor_status);
CREATE INDEX idx_donors_organization ON donors(organization_id);
CREATE INDEX idx_donors_party ON donors(party_id);

-- Donations indexes
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_donation_date ON donations(donation_date);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_organization ON donations(organization_id);
CREATE INDEX idx_donations_payment_status ON donations(payment_status);

-- Campaigns indexes
CREATE INDEX idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Programs indexes
CREATE INDEX idx_programs_organization ON programs(organization_id);
CREATE INDEX idx_programs_status ON programs(status);

-- Projects indexes
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_program ON projects(program_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Expenses indexes
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_organization ON expenses(organization_id);
CREATE INDEX idx_expenses_program ON expenses(program_id);
CREATE INDEX idx_expenses_project ON expenses(project_id);

-- Beneficiaries indexes
CREATE INDEX idx_beneficiaries_organization ON beneficiaries(organization_id);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status);

-- Volunteers indexes
CREATE INDEX idx_volunteers_organization ON volunteers(organization_id);
CREATE INDEX idx_volunteers_status ON volunteers(status);

-- Tasks indexes
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_organization ON tasks(organization_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Events indexes
CREATE INDEX idx_events_campaign ON events(campaign_id);
CREATE INDEX idx_events_organization ON events(organization_id);
CREATE INDEX idx_events_status ON events(status);

-- Pledges indexes
CREATE INDEX idx_pledges_campaign ON pledges(campaign_id);
CREATE INDEX idx_pledges_donor ON pledges(donor_id);
CREATE INDEX idx_pledges_organization ON pledges(organization_id);
CREATE INDEX idx_pledges_status ON pledges(status);

-- Stories indexes
CREATE INDEX idx_stories_beneficiary ON stories(beneficiary_id);
CREATE INDEX idx_stories_organization ON stories(organization_id);
CREATE INDEX idx_stories_program ON stories(program_id);

-- Outcome Metrics indexes
CREATE INDEX idx_outcome_metrics_organization ON outcome_metrics(organization_id);
CREATE INDEX idx_outcome_metrics_program ON outcome_metrics(program_id);
CREATE INDEX idx_outcome_metrics_project ON outcome_metrics(project_id);

-- Impact Metrics indexes
CREATE INDEX idx_impact_metrics_organization ON impact_metrics(organization_id);
CREATE INDEX idx_impact_metrics_program ON impact_metrics(program_id);
CREATE INDEX idx_impact_metrics_project ON impact_metrics(project_id);

-- Payments indexes
CREATE INDEX idx_payments_donation ON payments(donation_id);
CREATE INDEX idx_payments_organization ON payments(organization_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================

-- Total tables created: 60+
-- This script recreates the complete schema structure with all tables,
-- columns, data types, primary keys, foreign keys, and indexes as defined
-- in the source schema.json file.
