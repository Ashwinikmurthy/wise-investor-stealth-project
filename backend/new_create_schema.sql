-- ============================================================================
-- Database Schema Creation Script
-- Generated from schema.json for testing_db
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- organizations table
CREATE TABLE organizations (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    ein VARCHAR(100),
    mission TEXT,
    founded_date DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(100),
    phone VARCHAR(100),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fiscal_year_end VARCHAR(5),
    annual_budget NUMERIC,
    slug VARCHAR(255),
    PRIMARY KEY (id)
);

-- parties table
CREATE TABLE parties (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    display_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(100),
    country VARCHAR(100),
    donor_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- addresses table
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

-- campaigns table
CREATE TABLE campaigns (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    code VARCHAR(100),
    start_date DATE,
    goal_amount NUMERIC,
    raised_amount NUMERIC DEFAULT 0,
    status VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255),
    description TEXT,
    end_date DATE,
    campaign_type VARCHAR(100),
    slug VARCHAR(255),
    story TEXT,
    is_featured BOOLEAN DEFAULT false,
    allow_recurring BOOLEAN DEFAULT true,
    suggested_amounts VARCHAR(255),
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description TEXT,
    donor_count INTEGER DEFAULT 0,
    donation_count INTEGER DEFAULT 0,
    average_donation DOUBLE PRECISION DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    PRIMARY KEY (id)
);

-- appeals table
CREATE TABLE appeals (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    code VARCHAR(100) NOT NULL,
    channel VARCHAR(100),
    start_end VARCHAR(100),
    PRIMARY KEY (id)
);

-- audit_logs table
CREATE TABLE audit_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    changes JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- beneficiaries table
CREATE TABLE beneficiaries (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    household_size INTEGER,
    income_level VARCHAR(50),
    needs TEXT[],
    status VARCHAR(100),
    enrolled_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- campaign_updates table
CREATE TABLE campaign_updates (
    id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    is_public BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

-- consents table
CREATE TABLE consents (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    party_id UUID NOT NULL,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    opt_in_basis VARCHAR(100),
    captured_at_by VARCHAR(200),
    source VARCHAR(200),
    PRIMARY KEY (id)
);

-- contact_points table
CREATE TABLE contact_points (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    party_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50),
    value VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id)
);

-- donation_campaigns table
CREATE TABLE donation_campaigns (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal_amount NUMERIC,
    current_amount NUMERIC DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status VARCHAR(100),
    campaign_type VARCHAR(50),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- programs table
CREATE TABLE programs (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_type VARCHAR(50),
    budget NUMERIC,
    actual_spending NUMERIC DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status VARCHAR(100),
    target_beneficiaries INTEGER,
    current_beneficiaries INTEGER DEFAULT 0,
    success_metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- funds table
CREATE TABLE funds (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    restriction VARCHAR(100),
    program_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fund_code VARCHAR(50),
    fund_type VARCHAR(50),
    target_amount NUMERIC,
    PRIMARY KEY (id)
);

-- pledges table
CREATE TABLE pledges (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    party_id UUID NOT NULL,
    pledge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC NOT NULL,
    frequency VARCHAR(50),
    schedule VARCHAR(50),
    start_end VARCHAR(100),
    goal_fund_id UUID,
    status VARCHAR(50) DEFAULT 'Active'::character varying,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- donors table
CREATE TABLE donors (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    donor_type VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(100),
    preferred_contact_method VARCHAR(50),
    total_donated NUMERIC DEFAULT 0,
    lifetime_value NUMERIC DEFAULT 0,
    last_donation_date DATE,
    first_donation_date DATE,
    donation_count INTEGER DEFAULT 0,
    average_donation NUMERIC,
    largest_donation NUMERIC,
    donor_status VARCHAR(50),
    acquisition_source VARCHAR(100),
    wealth_rating VARCHAR(50),
    engagement_score NUMERIC,
    communication_preferences JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    party_id UUID,
    donor_level VARCHAR(50),
    giving_capacity NUMERIC,
    loyalty_segment VARCHAR(50),
    planned_giving BOOLEAN DEFAULT false,
    PRIMARY KEY (id)
);

-- donations table
CREATE TABLE donations (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    donor_id UUID,
    campaign_id UUID,
    amount NUMERIC NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD'::character varying,
    donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    payment_status VARCHAR(100),
    transaction_id VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(100),
    dedication_type VARCHAR(50),
    dedication_name VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT false,
    tax_deductible_amount NUMERIC,
    receipt_sent BOOLEAN DEFAULT false,
    thank_you_sent BOOLEAN DEFAULT false,
    designation VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    gift_type VARCHAR(50),
    party_id UUID,
    pledge_id UUID,
    PRIMARY KEY (id)
);

-- donation_lines table
CREATE TABLE donation_lines (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donation_id UUID NOT NULL,
    program_id UUID,
    amount NUMERIC NOT NULL,
    PRIMARY KEY (id)
);

-- donor_exclusion_tags table
CREATE TABLE donor_exclusion_tags (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    exclusion_tag VARCHAR(100) NOT NULL,
    tag_applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tag_removed_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- donor_giving_segments table
CREATE TABLE donor_giving_segments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    fiscal_year INTEGER NOT NULL,
    reporting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mega_donor_ytd_amount NUMERIC DEFAULT 0,
    mega_donor_ytd_count INTEGER DEFAULT 0,
    mega_donor_ly_amount NUMERIC DEFAULT 0,
    mega_donor_ly_count INTEGER DEFAULT 0,
    mega_donor_2ya_amount NUMERIC DEFAULT 0,
    mega_donor_2ya_count INTEGER DEFAULT 0,
    mega_donor_yoy_variance_pct NUMERIC,
    major_donor_ytd_amount NUMERIC DEFAULT 0,
    major_donor_ytd_count INTEGER DEFAULT 0,
    major_donor_ly_amount NUMERIC DEFAULT 0,
    major_donor_ly_count INTEGER DEFAULT 0,
    major_donor_2ya_amount NUMERIC DEFAULT 0,
    major_donor_2ya_count INTEGER DEFAULT 0,
    major_donor_yoy_variance_pct NUMERIC,
    mid_level_ytd_amount NUMERIC DEFAULT 0,
    mid_level_ytd_count INTEGER DEFAULT 0,
    mid_level_ly_amount NUMERIC DEFAULT 0,
    mid_level_ly_count INTEGER DEFAULT 0,
    mid_level_2ya_amount NUMERIC DEFAULT 0,
    mid_level_2ya_count INTEGER DEFAULT 0,
    mid_level_yoy_variance_pct NUMERIC,
    total_ytd_amount NUMERIC DEFAULT 0,
    total_ytd_count INTEGER DEFAULT 0,
    total_ly_amount NUMERIC DEFAULT 0,
    total_ly_count INTEGER DEFAULT 0,
    total_2ya_amount NUMERIC DEFAULT 0,
    total_2ya_count INTEGER DEFAULT 0,
    total_yoy_variance_pct NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- users table
CREATE TABLE users (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_superadmin BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(200),
    role VARCHAR(100),
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMP WITHOUT TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    PRIMARY KEY (id)
);

-- major_gift_officers table
CREATE TABLE major_gift_officers (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    user_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    portfolio_role VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE,
    departure_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- donor_meetings table
CREATE TABLE donor_meetings (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    officer_id UUID NOT NULL,
    meeting_title VARCHAR(255) NOT NULL,
    meeting_type VARCHAR(100) NOT NULL DEFAULT 'substantive'::meeting_type_enum,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME WITHOUT TIME ZONE,
    duration_minutes INTEGER,
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT false,
    meeting_link TEXT,
    status VARCHAR(50) DEFAULT 'scheduled'::character varying,
    is_completed BOOLEAN DEFAULT false,
    actual_date DATE,
    attendees TEXT[],
    agenda TEXT,
    meeting_notes TEXT,
    follow_up_actions TEXT,
    moves_stage_advanced BOOLEAN DEFAULT false,
    gift_discussed BOOLEAN DEFAULT false,
    proposal_presented BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- donor_portfolio_assignments table
CREATE TABLE donor_portfolio_assignments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    officer_id UUID NOT NULL,
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_primary BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    deactivation_date DATE,
    deactivation_reason TEXT,
    assignment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- donor_priority_cache table
CREATE TABLE donor_priority_cache (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    current_donor_level VARCHAR(100),
    priority_level VARCHAR(100),
    current_year_total NUMERIC DEFAULT 0,
    last_year_total NUMERIC DEFAULT 0,
    two_years_ago_total NUMERIC DEFAULT 0,
    year_2023_total NUMERIC DEFAULT 0,
    year_2022_total NUMERIC DEFAULT 0,
    largest_gift_amount NUMERIC DEFAULT 0,
    largest_gift_date DATE,
    opportunity_amount NUMERIC DEFAULT 0,
    opportunity_basis TEXT,
    yoy_dollar_change NUMERIC DEFAULT 0,
    yoy_percentage_change NUMERIC,
    gift_count_current_year INTEGER DEFAULT 0,
    gift_count_last_year INTEGER DEFAULT 0,
    gift_count_two_years_ago INTEGER DEFAULT 0,
    last_gift_date DATE,
    days_since_last_gift INTEGER,
    assigned_officer_id UUID,
    portfolio_role VARCHAR(100),
    has_exclusion_tag BOOLEAN DEFAULT false,
    exclusion_tags TEXT[],
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- donors_backup table
CREATE TABLE donors_backup (
    id UUID,
    organization_id UUID,
    donor_type VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(100),
    preferred_contact_method VARCHAR(100),
    total_donated NUMERIC,
    lifetime_value NUMERIC,
    last_donation_date DATE,
    first_donation_date DATE,
    donation_count INTEGER,
    average_donation NUMERIC,
    largest_donation NUMERIC,
    donor_status VARCHAR(100),
    acquisition_source VARCHAR(100),
    wealth_rating VARCHAR(100),
    engagement_score NUMERIC,
    communication_preferences JSONB,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- email_campaigns table
CREATE TABLE email_campaigns (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT,
    template_id UUID,
    status VARCHAR(100),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    sender_email VARCHAR(255),
    sender_name VARCHAR(255),
    reply_to_email VARCHAR(255),
    segment_criteria JSONB DEFAULT '{}'::jsonb,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- email_campaign_recipients table
CREATE TABLE email_campaign_recipients (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    campaign_id UUID,
    donor_id UUID,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(100),
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    bounce_reason TEXT,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- events table
CREATE TABLE events (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    venue_address TEXT,
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    registration_fee NUMERIC,
    status VARCHAR(100),
    is_public BOOLEAN DEFAULT true,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- event_registrations table
CREATE TABLE event_registrations (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    event_id UUID,
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    participant_phone VARCHAR(100),
    number_of_tickets INTEGER DEFAULT 1,
    total_amount NUMERIC,
    payment_status VARCHAR(100),
    registration_status VARCHAR(100),
    special_requirements TEXT,
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- event_tickets table
CREATE TABLE event_tickets (
    id UUID NOT NULL,
    event_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DOUBLE PRECISION NOT NULL,
    quantity_available INTEGER,
    quantity_sold INTEGER,
    is_active BOOLEAN,
    sale_start TIMESTAMP WITHOUT TIME ZONE,
    sale_end TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

-- expense_categories table
CREATE TABLE expense_categories (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_type VARCHAR(50),
    parent_category_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- expenses table
CREATE TABLE expenses (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    category_id UUID,
    program_id UUID,
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL,
    vendor VARCHAR(255),
    description TEXT,
    receipt_url VARCHAR(500),
    payment_method VARCHAR(50),
    status VARCHAR(100),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    PRIMARY KEY (id)
);

-- projects table
CREATE TABLE projects (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    program_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50),
    status VARCHAR(100),
    priority VARCHAR(100),
    start_date DATE,
    end_date DATE,
    budget NUMERIC,
    actual_cost NUMERIC DEFAULT 0,
    completion_percentage NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- gift_goals table
CREATE TABLE gift_goals (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    officer_id UUID NOT NULL,
    goal_description TEXT NOT NULL,
    goal_amount NUMERIC NOT NULL,
    campaign_id UUID,
    project_id UUID,
    program_id UUID,
    target_date DATE,
    target_fiscal_year INTEGER,
    current_committed_amount NUMERIC DEFAULT 0,
    current_received_amount NUMERIC DEFAULT 0,
    probability_percentage INTEGER DEFAULT 50,
    status VARCHAR(50) DEFAULT 'active'::character varying,
    is_realized BOOLEAN DEFAULT false,
    date_realized DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- impact_metrics table
CREATE TABLE impact_metrics (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    program_id UUID,
    metric_name VARCHAR(255),
    social_value NUMERIC,
    investment NUMERIC,
    sroi NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- payments table
CREATE TABLE payments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donation_id UUID NOT NULL,
    payment_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD'::character varying,
    method VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- matching_claims table
CREATE TABLE matching_claims (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    donation_id UUID NOT NULL,
    matcher_party_id UUID NOT NULL,
    submitted_at TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR(50),
    paid_payment_id UUID,
    PRIMARY KEY (id)
);

-- moves_management_stages table
CREATE TABLE moves_management_stages (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    officer_id UUID NOT NULL,
    current_stage VARCHAR(100) NOT NULL,
    previous_stage VARCHAR(100),
    stage_entered_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_next_stage_date DATE,
    last_stage_change_date DATE,
    total_interactions INTEGER DEFAULT 0,
    last_interaction_date DATE,
    stage_notes TEXT,
    next_steps TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- officer_annual_targets table
CREATE TABLE officer_annual_targets (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    officer_id UUID NOT NULL,
    fiscal_year INTEGER NOT NULL,
    target_dollars NUMERIC NOT NULL DEFAULT 0,
    target_gift_count INTEGER NOT NULL DEFAULT 0,
    target_new_donors INTEGER DEFAULT 0,
    target_meetings INTEGER DEFAULT 0,
    target_proposals INTEGER DEFAULT 0,
    actual_dollars NUMERIC DEFAULT 0,
    actual_gift_count INTEGER DEFAULT 0,
    actual_new_donors INTEGER DEFAULT 0,
    actual_meetings INTEGER DEFAULT 0,
    actual_proposals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- outcome_metrics table
CREATE TABLE outcome_metrics (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    program_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(50),
    direction VARCHAR(50),
    target_value DOUBLE PRECISION,
    PRIMARY KEY (id)
);

-- outcome_records table
CREATE TABLE outcome_records (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    outcome_metric_id UUID NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    source VARCHAR(200),
    recorded_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

-- packages table
CREATE TABLE packages (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    appeal_id UUID NOT NULL,
    code VARCHAR(100) NOT NULL,
    cost_per_unit DOUBLE PRECISION,
    audience_size INTEGER,
    PRIMARY KEY (id)
);

-- party_roles table
CREATE TABLE party_roles (
    party_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    PRIMARY KEY (party_id, role_code)
);

-- payment_methods table
CREATE TABLE payment_methods (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    party_id UUID NOT NULL,
    method VARCHAR(50) NOT NULL,
    token_ref VARCHAR(255),
    exp_mo_yr VARCHAR(7),
    is_default BOOLEAN,
    PRIMARY KEY (id)
);

-- permissions table
CREATE TABLE permissions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- pledge_installments table
CREATE TABLE pledge_installments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    pledge_id UUID NOT NULL,
    due_date DATE NOT NULL,
    due_amount NUMERIC NOT NULL,
    paid_payment_id UUID,
    status VARCHAR(100) DEFAULT 'Pending'::character varying,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- program_enrollments table
CREATE TABLE program_enrollments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    program_id UUID,
    beneficiary_id UUID,
    enrollment_date DATE,
    completion_date DATE,
    status VARCHAR(100),
    progress_percentage NUMERIC,
    outcome_metrics JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- project_team table
CREATE TABLE project_team (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    project_id UUID,
    user_id UUID,
    role VARCHAR(50),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- recurring_gifts table
CREATE TABLE recurring_gifts (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    party_id UUID NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL,
    frequency VARCHAR(100),
    frequency_amount_count INTEGER,
    next_charge_on DATE,
    payment_method_id UUID,
    PRIMARY KEY (id)
);

-- reports table
CREATE TABLE reports (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50),
    parameters JSONB DEFAULT '{}'::jsonb,
    generated_by UUID,
    file_url VARCHAR(500),
    status VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- roles table
CREATE TABLE roles (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- role_permissions table
CREATE TABLE role_permissions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    role_id UUID,
    permission_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- sdg_alignment table
CREATE TABLE sdg_alignment (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    program_id UUID,
    sdg_goal VARCHAR(255),
    contribution_score NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- service_events table
CREATE TABLE service_events (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    program_id UUID,
    date DATE NOT NULL,
    location VARCHAR(255),
    units_delivered NUMERIC,
    notes TEXT,
    PRIMARY KEY (id)
);

-- service_beneficiaries table
CREATE TABLE service_beneficiaries (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    service_event_id UUID NOT NULL,
    beneficiary_id UUID NOT NULL,
    participation_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- soft_credits table
CREATE TABLE soft_credits (
    id UUID NOT NULL,
    organization_id UUID NOT NULL,
    donation_id UUID NOT NULL,
    influencer_party_id UUID NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    reason VARCHAR(200),
    notes TEXT,
    PRIMARY KEY (id)
);

-- solicitation_proposals table
CREATE TABLE solicitation_proposals (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    donor_id UUID NOT NULL,
    officer_id UUID NOT NULL,
    proposal_title VARCHAR(255) NOT NULL,
    proposal_description TEXT,
    requested_amount NUMERIC NOT NULL,
    campaign_id UUID,
    project_id UUID,
    program_id UUID,
    status VARCHAR(100) NOT NULL DEFAULT 'draft'::proposal_status_enum,
    date_sent DATE,
    expected_decision_date DATE,
    date_responded DATE,
    response_notes TEXT,
    committed_amount NUMERIC DEFAULT 0,
    received_amount NUMERIC DEFAULT 0,
    proposal_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- stories table
CREATE TABLE stories (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    program_id UUID,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    story_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- tasks table
CREATE TABLE tasks (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id UUID,
    project_id UUID,
    assigned_to UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(100),
    priority VARCHAR(100),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- user_registration_requests table
CREATE TABLE user_registration_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    job_title VARCHAR(150),
    department VARCHAR(150),
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'::character varying,
    requested_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    reviewed_by UUID,
    rejection_reason TEXT,
    PRIMARY KEY (id)
);

-- user_roles table
CREATE TABLE user_roles (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    role_id UUID,
    organization_id UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    PRIMARY KEY (id)
);

-- volunteers table
CREATE TABLE volunteers (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
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

-- volunteer_activities table
CREATE TABLE volunteer_activities (
    id UUID NOT NULL,
    organization_id UUID,
    volunteer_id UUID,
    activity_type VARCHAR(100),
    date DATE,
    hours DOUBLE PRECISION,
    notes TEXT,
    PRIMARY KEY (id)
);

-- volunteer_assignments table
CREATE TABLE volunteer_assignments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    volunteer_id UUID,
    event_id UUID,
    project_id UUID,
    assignment_date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    hours NUMERIC,
    role VARCHAR(100),
    status VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- volunteer_events table
CREATE TABLE volunteer_events (
    id UUID NOT NULL,
    organization_id UUID,
    name VARCHAR(200),
    date DATE,
    attendance_status VARCHAR(50),
    location VARCHAR(200),
    created_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

-- volunteer_skills table
CREATE TABLE volunteer_skills (
    id UUID NOT NULL,
    organization_id UUID,
    volunteer_id UUID,
    skill_name VARCHAR(100),
    proficiency_level VARCHAR(50),
    PRIMARY KEY (id)
);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- parties foreign keys
ALTER TABLE parties ADD CONSTRAINT parties_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- addresses foreign keys
ALTER TABLE addresses ADD CONSTRAINT addresses_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE addresses ADD CONSTRAINT addresses_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- campaigns foreign keys
ALTER TABLE campaigns ADD CONSTRAINT campaigns_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- appeals foreign keys
ALTER TABLE appeals ADD CONSTRAINT appeals_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE appeals ADD CONSTRAINT appeals_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- beneficiaries foreign keys
ALTER TABLE beneficiaries ADD CONSTRAINT beneficiaries_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- campaign_updates foreign keys
ALTER TABLE campaign_updates ADD CONSTRAINT campaign_updates_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- consents foreign keys
ALTER TABLE consents ADD CONSTRAINT consents_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE consents ADD CONSTRAINT consents_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- contact_points foreign keys
ALTER TABLE contact_points ADD CONSTRAINT contact_points_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE contact_points ADD CONSTRAINT contact_points_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- donation_campaigns foreign keys
ALTER TABLE donation_campaigns ADD CONSTRAINT donation_campaigns_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- programs foreign keys
ALTER TABLE programs ADD CONSTRAINT programs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- funds foreign keys
ALTER TABLE funds ADD CONSTRAINT funds_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE funds ADD CONSTRAINT funds_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- pledges foreign keys
ALTER TABLE pledges ADD CONSTRAINT pledges_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE pledges ADD CONSTRAINT pledges_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE pledges ADD CONSTRAINT pledges_goal_fund_id_fkey
    FOREIGN KEY (goal_fund_id) REFERENCES funds(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- donors foreign keys
ALTER TABLE donors ADD CONSTRAINT donors_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donors ADD CONSTRAINT donors_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- donations foreign keys
ALTER TABLE donations ADD CONSTRAINT donations_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donations ADD CONSTRAINT donations_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE donations ADD CONSTRAINT donations_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE donations ADD CONSTRAINT donations_pledge_id_fkey
    FOREIGN KEY (pledge_id) REFERENCES pledges(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- donation_lines foreign keys
ALTER TABLE donation_lines ADD CONSTRAINT donation_lines_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donation_lines ADD CONSTRAINT donation_lines_donation_id_fkey
    FOREIGN KEY (donation_id) REFERENCES donations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donation_lines ADD CONSTRAINT donation_lines_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- donor_exclusion_tags foreign keys
ALTER TABLE donor_exclusion_tags ADD CONSTRAINT donor_exclusion_tags_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donor_exclusion_tags ADD CONSTRAINT donor_exclusion_tags_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- donor_giving_segments foreign keys
ALTER TABLE donor_giving_segments ADD CONSTRAINT donor_giving_segments_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- users foreign keys
ALTER TABLE users ADD CONSTRAINT users_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- major_gift_officers foreign keys
ALTER TABLE major_gift_officers ADD CONSTRAINT major_gift_officers_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE major_gift_officers ADD CONSTRAINT major_gift_officers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- donor_meetings foreign keys
ALTER TABLE donor_meetings ADD CONSTRAINT donor_meetings_officer_id_fkey
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donor_meetings ADD CONSTRAINT donor_meetings_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donor_meetings ADD CONSTRAINT donor_meetings_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- donor_portfolio_assignments foreign keys
ALTER TABLE donor_portfolio_assignments ADD CONSTRAINT donor_portfolio_assignments_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donor_portfolio_assignments ADD CONSTRAINT donor_portfolio_assignments_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donor_portfolio_assignments ADD CONSTRAINT donor_portfolio_assignments_officer_id_fkey
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- donor_priority_cache foreign keys
ALTER TABLE donor_priority_cache ADD CONSTRAINT donor_priority_cache_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donor_priority_cache ADD CONSTRAINT donor_priority_cache_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE donor_priority_cache ADD CONSTRAINT donor_priority_cache_assigned_officer_id_fkey
    FOREIGN KEY (assigned_officer_id) REFERENCES major_gift_officers(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- email_campaigns foreign keys
ALTER TABLE email_campaigns ADD CONSTRAINT email_campaigns_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- email_campaign_recipients foreign keys
ALTER TABLE email_campaign_recipients ADD CONSTRAINT email_campaign_recipients_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE email_campaign_recipients ADD CONSTRAINT email_campaign_recipients_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- events foreign keys
ALTER TABLE events ADD CONSTRAINT events_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- event_registrations foreign keys
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- event_tickets foreign keys
ALTER TABLE event_tickets ADD CONSTRAINT event_tickets_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- expense_categories foreign keys
ALTER TABLE expense_categories ADD CONSTRAINT expense_categories_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE expense_categories ADD CONSTRAINT expense_categories_parent_category_id_fkey
    FOREIGN KEY (parent_category_id) REFERENCES expense_categories(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- expenses foreign keys
ALTER TABLE expenses ADD CONSTRAINT expenses_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE expenses ADD CONSTRAINT expenses_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES expense_categories(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE expenses ADD CONSTRAINT expenses_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- projects foreign keys
ALTER TABLE projects ADD CONSTRAINT projects_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE projects ADD CONSTRAINT projects_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- gift_goals foreign keys
ALTER TABLE gift_goals ADD CONSTRAINT gift_goals_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE gift_goals ADD CONSTRAINT gift_goals_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE gift_goals ADD CONSTRAINT gift_goals_officer_id_fkey
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE gift_goals ADD CONSTRAINT gift_goals_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE gift_goals ADD CONSTRAINT gift_goals_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE gift_goals ADD CONSTRAINT gift_goals_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- impact_metrics foreign keys
ALTER TABLE impact_metrics ADD CONSTRAINT impact_metrics_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE impact_metrics ADD CONSTRAINT impact_metrics_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- payments foreign keys
ALTER TABLE payments ADD CONSTRAINT payments_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE payments ADD CONSTRAINT payments_donation_id_fkey
    FOREIGN KEY (donation_id) REFERENCES donations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- matching_claims foreign keys
ALTER TABLE matching_claims ADD CONSTRAINT matching_claims_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE matching_claims ADD CONSTRAINT matching_claims_donation_id_fkey
    FOREIGN KEY (donation_id) REFERENCES donations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE matching_claims ADD CONSTRAINT matching_claims_matcher_party_id_fkey
    FOREIGN KEY (matcher_party_id) REFERENCES parties(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE matching_claims ADD CONSTRAINT matching_claims_paid_payment_id_fkey
    FOREIGN KEY (paid_payment_id) REFERENCES payments(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- moves_management_stages foreign keys
ALTER TABLE moves_management_stages ADD CONSTRAINT moves_management_stages_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE moves_management_stages ADD CONSTRAINT moves_management_stages_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE moves_management_stages ADD CONSTRAINT moves_management_stages_officer_id_fkey
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- officer_annual_targets foreign keys
ALTER TABLE officer_annual_targets ADD CONSTRAINT officer_annual_targets_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE officer_annual_targets ADD CONSTRAINT officer_annual_targets_officer_id_fkey
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- outcome_metrics foreign keys
ALTER TABLE outcome_metrics ADD CONSTRAINT outcome_metrics_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE outcome_metrics ADD CONSTRAINT outcome_metrics_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- outcome_records foreign keys
ALTER TABLE outcome_records ADD CONSTRAINT outcome_records_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE outcome_records ADD CONSTRAINT outcome_records_outcome_metric_id_fkey
    FOREIGN KEY (outcome_metric_id) REFERENCES outcome_metrics(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- packages foreign keys
ALTER TABLE packages ADD CONSTRAINT packages_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE packages ADD CONSTRAINT packages_appeal_id_fkey
    FOREIGN KEY (appeal_id) REFERENCES appeals(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- party_roles foreign keys
ALTER TABLE party_roles ADD CONSTRAINT party_roles_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- payment_methods foreign keys
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- pledge_installments foreign keys
ALTER TABLE pledge_installments ADD CONSTRAINT pledge_installments_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE pledge_installments ADD CONSTRAINT pledge_installments_pledge_id_fkey
    FOREIGN KEY (pledge_id) REFERENCES pledges(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE pledge_installments ADD CONSTRAINT pledge_installments_paid_payment_id_fkey
    FOREIGN KEY (paid_payment_id) REFERENCES payments(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- program_enrollments foreign keys
ALTER TABLE program_enrollments ADD CONSTRAINT program_enrollments_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE program_enrollments ADD CONSTRAINT program_enrollments_beneficiary_id_fkey
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- project_team foreign keys
ALTER TABLE project_team ADD CONSTRAINT project_team_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE project_team ADD CONSTRAINT project_team_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- recurring_gifts foreign keys
ALTER TABLE recurring_gifts ADD CONSTRAINT recurring_gifts_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE recurring_gifts ADD CONSTRAINT recurring_gifts_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES parties(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE recurring_gifts ADD CONSTRAINT recurring_gifts_payment_method_id_fkey
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- reports foreign keys
ALTER TABLE reports ADD CONSTRAINT reports_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE reports ADD CONSTRAINT reports_generated_by_fkey
    FOREIGN KEY (generated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- role_permissions foreign keys
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- sdg_alignment foreign keys
ALTER TABLE sdg_alignment ADD CONSTRAINT sdg_alignment_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE sdg_alignment ADD CONSTRAINT sdg_alignment_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- service_events foreign keys
ALTER TABLE service_events ADD CONSTRAINT service_events_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE service_events ADD CONSTRAINT service_events_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- service_beneficiaries foreign keys
ALTER TABLE service_beneficiaries ADD CONSTRAINT service_beneficiaries_service_event_id_fkey
    FOREIGN KEY (service_event_id) REFERENCES service_events(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE service_beneficiaries ADD CONSTRAINT service_beneficiaries_beneficiary_id_fkey
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- soft_credits foreign keys
ALTER TABLE soft_credits ADD CONSTRAINT soft_credits_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE soft_credits ADD CONSTRAINT soft_credits_donation_id_fkey
    FOREIGN KEY (donation_id) REFERENCES donations(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE soft_credits ADD CONSTRAINT soft_credits_influencer_party_id_fkey
    FOREIGN KEY (influencer_party_id) REFERENCES parties(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- solicitation_proposals foreign keys
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_donor_id_fkey
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_officer_id_fkey
    FOREIGN KEY (officer_id) REFERENCES major_gift_officers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE solicitation_proposals ADD CONSTRAINT solicitation_proposals_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- stories foreign keys
ALTER TABLE stories ADD CONSTRAINT stories_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE stories ADD CONSTRAINT stories_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- tasks foreign keys
ALTER TABLE tasks ADD CONSTRAINT tasks_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- user_registration_requests foreign keys
ALTER TABLE user_registration_requests ADD CONSTRAINT user_registration_requests_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE user_registration_requests ADD CONSTRAINT user_registration_requests_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- user_roles foreign keys
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- volunteer_activities foreign keys
ALTER TABLE volunteer_activities ADD CONSTRAINT volunteer_activities_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE volunteer_activities ADD CONSTRAINT volunteer_activities_volunteer_id_fkey
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- volunteer_assignments foreign keys
ALTER TABLE volunteer_assignments ADD CONSTRAINT volunteer_assignments_volunteer_id_fkey
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE volunteer_assignments ADD CONSTRAINT volunteer_assignments_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE volunteer_assignments ADD CONSTRAINT volunteer_assignments_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- volunteer_events foreign keys
ALTER TABLE volunteer_events ADD CONSTRAINT volunteer_events_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- volunteer_skills foreign keys
ALTER TABLE volunteer_skills ADD CONSTRAINT volunteer_skills_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE volunteer_skills ADD CONSTRAINT volunteer_skills_volunteer_id_fkey
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- organizations indexes
CREATE INDEX idx_org_slug ON organizations USING BTREE (slug);
CREATE INDEX idx_organizations_ein ON organizations USING BTREE (ein);
CREATE INDEX idx_organizations_is_active ON organizations USING BTREE (is_active);
CREATE UNIQUE INDEX organizations_slug_key ON organizations USING BTREE (slug);

-- parties indexes
CREATE INDEX idx_parties_display_name ON parties USING BTREE (display_name);
CREATE INDEX idx_parties_name ON parties USING BTREE (full_name);
CREATE INDEX idx_parties_org ON parties USING BTREE (organization_id);

-- campaigns indexes
CREATE UNIQUE INDEX campaigns_slug_key ON campaigns USING BTREE (slug);
CREATE INDEX idx_campaigns_active ON campaigns USING BTREE (is_active);
CREATE INDEX idx_campaigns_org ON campaigns USING BTREE (organization_id);
CREATE INDEX idx_campaigns_slug ON campaigns USING BTREE (slug);
CREATE INDEX idx_campaigns_status ON campaigns USING BTREE (status);

-- audit_logs indexes
CREATE INDEX idx_audit_logs_created ON audit_logs USING BTREE (created_at);
CREATE INDEX idx_audit_logs_organization ON audit_logs USING BTREE (organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs USING BTREE (user_id);

-- beneficiaries indexes
CREATE INDEX idx_beneficiaries_organization ON beneficiaries USING BTREE (organization_id);
CREATE INDEX idx_beneficiaries_status ON beneficiaries USING BTREE (status);

-- contact_points indexes
CREATE INDEX idx_contact_points_org ON contact_points USING BTREE (organization_id);

-- donation_campaigns indexes
CREATE INDEX idx_donation_campaigns_org ON donation_campaigns USING BTREE (organization_id);
CREATE INDEX idx_donation_campaigns_organization ON donation_campaigns USING BTREE (organization_id);
CREATE INDEX idx_donation_campaigns_status ON donation_campaigns USING BTREE (status);
CREATE INDEX idx_donation_campaigns_type ON donation_campaigns USING BTREE (campaign_type);

-- programs indexes
CREATE INDEX idx_programs_organization ON programs USING BTREE (organization_id);
CREATE INDEX idx_programs_status ON programs USING BTREE (status);

-- funds indexes
CREATE INDEX idx_funds_org ON funds USING BTREE (organization_id);
CREATE INDEX idx_funds_program ON funds USING BTREE (program_id);

-- pledges indexes
CREATE INDEX idx_pledges_org ON pledges USING BTREE (organization_id);
CREATE INDEX idx_pledges_party ON pledges USING BTREE (party_id);
CREATE INDEX idx_pledges_status ON pledges USING BTREE (status);

-- donors indexes
CREATE UNIQUE INDEX donors_party_id_key ON donors USING BTREE (party_id);
CREATE INDEX idx_donors_email ON donors USING BTREE (email);
CREATE INDEX idx_donors_organization ON donors USING BTREE (organization_id);
CREATE INDEX idx_donors_status ON donors USING BTREE (donor_status);
CREATE INDEX idx_donors_type ON donors USING BTREE (donor_type);

-- donations indexes
CREATE INDEX idx_donations_campaign ON donations USING BTREE (campaign_id);
CREATE INDEX idx_donations_date ON donations USING BTREE (donation_date);
CREATE INDEX idx_donations_donor ON donations USING BTREE (donor_id);
CREATE INDEX idx_donations_organization ON donations USING BTREE (organization_id);
CREATE INDEX idx_donations_status ON donations USING BTREE (payment_status);

-- donation_lines indexes
CREATE INDEX idx_donation_lines_org ON donation_lines USING BTREE (organization_id);

-- donor_exclusion_tags indexes
CREATE INDEX idx_exclusions_active ON donor_exclusion_tags USING BTREE (is_active);
CREATE INDEX idx_exclusions_donor ON donor_exclusion_tags USING BTREE (donor_id);
CREATE INDEX idx_exclusions_org ON donor_exclusion_tags USING BTREE (organization_id);
CREATE INDEX idx_exclusions_tag ON donor_exclusion_tags USING BTREE (exclusion_tag);
CREATE UNIQUE INDEX unique_active_exclusion_tag ON donor_exclusion_tags USING BTREE (is_active);
CREATE UNIQUE INDEX unique_active_exclusion_tag ON donor_exclusion_tags USING BTREE (donor_id);
CREATE UNIQUE INDEX unique_active_exclusion_tag ON donor_exclusion_tags USING BTREE (exclusion_tag);
CREATE UNIQUE INDEX unique_active_exclusion_tag ON donor_exclusion_tags USING BTREE (organization_id);

-- donor_giving_segments indexes
CREATE INDEX idx_segments_date ON donor_giving_segments USING BTREE (reporting_date);
CREATE INDEX idx_segments_org ON donor_giving_segments USING BTREE (organization_id);
CREATE INDEX idx_segments_year ON donor_giving_segments USING BTREE (fiscal_year);
CREATE UNIQUE INDEX unique_segment_year_date ON donor_giving_segments USING BTREE (reporting_date);
CREATE UNIQUE INDEX unique_segment_year_date ON donor_giving_segments USING BTREE (organization_id);
CREATE UNIQUE INDEX unique_segment_year_date ON donor_giving_segments USING BTREE (fiscal_year);

-- users indexes
CREATE INDEX idx_users_email ON users USING BTREE (email);
CREATE INDEX idx_users_is_active ON users USING BTREE (is_active);
CREATE INDEX idx_users_organization ON users USING BTREE (organization_id);
CREATE UNIQUE INDEX users_email_key ON users USING BTREE (email);

-- major_gift_officers indexes
CREATE INDEX idx_mgo_active ON major_gift_officers USING BTREE (is_active);
CREATE INDEX idx_mgo_organization ON major_gift_officers USING BTREE (organization_id);
CREATE INDEX idx_mgo_portfolio ON major_gift_officers USING BTREE (portfolio_role);
CREATE INDEX idx_mgo_user ON major_gift_officers USING BTREE (user_id);
CREATE UNIQUE INDEX unique_officer_email_org ON major_gift_officers USING BTREE (email);
CREATE UNIQUE INDEX unique_officer_email_org ON major_gift_officers USING BTREE (organization_id);

-- donor_meetings indexes
CREATE INDEX idx_meetings_completed ON donor_meetings USING BTREE (is_completed);
CREATE INDEX idx_meetings_donor ON donor_meetings USING BTREE (donor_id);
CREATE INDEX idx_meetings_officer ON donor_meetings USING BTREE (officer_id);
CREATE INDEX idx_meetings_org ON donor_meetings USING BTREE (organization_id);
CREATE INDEX idx_meetings_scheduled_date ON donor_meetings USING BTREE (scheduled_date);
CREATE INDEX idx_meetings_status ON donor_meetings USING BTREE (status);
CREATE INDEX idx_meetings_type ON donor_meetings USING BTREE (meeting_type);

-- donor_portfolio_assignments indexes
CREATE INDEX idx_portfolio_active ON donor_portfolio_assignments USING BTREE (is_active);
CREATE INDEX idx_portfolio_donor ON donor_portfolio_assignments USING BTREE (donor_id);
CREATE INDEX idx_portfolio_officer ON donor_portfolio_assignments USING BTREE (officer_id);
CREATE INDEX idx_portfolio_org ON donor_portfolio_assignments USING BTREE (organization_id);
CREATE INDEX idx_portfolio_primary ON donor_portfolio_assignments USING BTREE (is_primary);
CREATE UNIQUE INDEX unique_active_primary_assignment ON donor_portfolio_assignments USING BTREE (is_active);
CREATE UNIQUE INDEX unique_active_primary_assignment ON donor_portfolio_assignments USING BTREE (is_primary);
CREATE UNIQUE INDEX unique_active_primary_assignment ON donor_portfolio_assignments USING BTREE (officer_id);
CREATE UNIQUE INDEX unique_active_primary_assignment ON donor_portfolio_assignments USING BTREE (donor_id);
CREATE UNIQUE INDEX unique_active_primary_assignment ON donor_portfolio_assignments USING BTREE (organization_id);

-- donor_priority_cache indexes
CREATE INDEX idx_priority_calc_date ON donor_priority_cache USING BTREE (calculation_date);
CREATE INDEX idx_priority_current ON donor_priority_cache USING BTREE (is_current);
CREATE INDEX idx_priority_donor ON donor_priority_cache USING BTREE (donor_id);
CREATE INDEX idx_priority_donor_level ON donor_priority_cache USING BTREE (current_donor_level);
CREATE INDEX idx_priority_level ON donor_priority_cache USING BTREE (priority_level);
CREATE INDEX idx_priority_officer ON donor_priority_cache USING BTREE (assigned_officer_id);
CREATE INDEX idx_priority_opp_amount ON donor_priority_cache USING BTREE (opportunity_amount);
CREATE INDEX idx_priority_org ON donor_priority_cache USING BTREE (organization_id);
CREATE UNIQUE INDEX unique_current_donor_priority ON donor_priority_cache USING BTREE (is_current);
CREATE UNIQUE INDEX unique_current_donor_priority ON donor_priority_cache USING BTREE (donor_id);
CREATE UNIQUE INDEX unique_current_donor_priority ON donor_priority_cache USING BTREE (organization_id);

-- email_campaigns indexes
CREATE INDEX idx_email_campaigns_organization ON email_campaigns USING BTREE (organization_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns USING BTREE (status);

-- email_campaign_recipients indexes
CREATE INDEX idx_email_campaign_recipients_campaign ON email_campaign_recipients USING BTREE (campaign_id);
CREATE INDEX idx_email_campaign_recipients_donor ON email_campaign_recipients USING BTREE (donor_id);

-- events indexes
CREATE INDEX idx_events_org ON events USING BTREE (organization_id);
CREATE INDEX idx_events_organization ON events USING BTREE (organization_id);
CREATE INDEX idx_events_start_date ON events USING BTREE (start_date);
CREATE INDEX idx_events_status ON events USING BTREE (status);

-- event_registrations indexes
CREATE INDEX idx_event_registrations_email ON event_registrations USING BTREE (participant_email);
CREATE INDEX idx_event_registrations_event ON event_registrations USING BTREE (event_id);

-- event_tickets indexes
CREATE INDEX idx_event_tickets_event ON event_tickets USING BTREE (event_id);

-- expense_categories indexes
CREATE INDEX idx_expense_categories_organization ON expense_categories USING BTREE (organization_id);
CREATE INDEX idx_expense_categories_parent ON expense_categories USING BTREE (parent_category_id);

-- expenses indexes
CREATE INDEX idx_expenses_category ON expenses USING BTREE (category_id);
CREATE INDEX idx_expenses_date ON expenses USING BTREE (expense_date);
CREATE INDEX idx_expenses_organization ON expenses USING BTREE (organization_id);
CREATE INDEX idx_expenses_program ON expenses USING BTREE (program_id);

-- projects indexes
CREATE INDEX idx_projects_organization ON projects USING BTREE (organization_id);
CREATE INDEX idx_projects_program ON projects USING BTREE (program_id);
CREATE INDEX idx_projects_status ON projects USING BTREE (status);

-- gift_goals indexes
CREATE INDEX idx_goals_donor ON gift_goals USING BTREE (donor_id);
CREATE INDEX idx_goals_officer ON gift_goals USING BTREE (officer_id);
CREATE INDEX idx_goals_org ON gift_goals USING BTREE (organization_id);
CREATE INDEX idx_goals_realized ON gift_goals USING BTREE (is_realized);
CREATE INDEX idx_goals_status ON gift_goals USING BTREE (status);
CREATE INDEX idx_goals_target_date ON gift_goals USING BTREE (target_date);

-- moves_management_stages indexes
CREATE INDEX idx_moves_donor ON moves_management_stages USING BTREE (donor_id);
CREATE INDEX idx_moves_officer ON moves_management_stages USING BTREE (officer_id);
CREATE INDEX idx_moves_org ON moves_management_stages USING BTREE (organization_id);
CREATE INDEX idx_moves_stage ON moves_management_stages USING BTREE (current_stage);
CREATE INDEX idx_moves_stage_date ON moves_management_stages USING BTREE (stage_entered_date);
CREATE UNIQUE INDEX unique_donor_moves_stage ON moves_management_stages USING BTREE (donor_id);
CREATE UNIQUE INDEX unique_donor_moves_stage ON moves_management_stages USING BTREE (organization_id);

-- officer_annual_targets indexes
CREATE INDEX idx_targets_officer ON officer_annual_targets USING BTREE (officer_id);
CREATE INDEX idx_targets_org ON officer_annual_targets USING BTREE (organization_id);
CREATE INDEX idx_targets_year ON officer_annual_targets USING BTREE (fiscal_year);
CREATE UNIQUE INDEX unique_officer_year ON officer_annual_targets USING BTREE (officer_id);
CREATE UNIQUE INDEX unique_officer_year ON officer_annual_targets USING BTREE (fiscal_year);

-- permissions indexes
CREATE UNIQUE INDEX permissions_name_key ON permissions USING BTREE (name);

-- pledge_installments indexes
CREATE INDEX idx_pledge_installments_org ON pledge_installments USING BTREE (organization_id);
CREATE INDEX idx_pledge_installments_pledge ON pledge_installments USING BTREE (pledge_id);
CREATE INDEX idx_pledge_installments_status ON pledge_installments USING BTREE (status);

-- program_enrollments indexes
CREATE INDEX idx_program_enrollments_beneficiary ON program_enrollments USING BTREE (beneficiary_id);
CREATE INDEX idx_program_enrollments_program ON program_enrollments USING BTREE (program_id);

-- project_team indexes
CREATE INDEX idx_project_team_project ON project_team USING BTREE (project_id);
CREATE INDEX idx_project_team_user ON project_team USING BTREE (user_id);

-- reports indexes
CREATE INDEX idx_reports_generated_by ON reports USING BTREE (generated_by);
CREATE INDEX idx_reports_organization ON reports USING BTREE (organization_id);

-- roles indexes
CREATE UNIQUE INDEX roles_name_key ON roles USING BTREE (name);

-- role_permissions indexes
CREATE INDEX idx_role_permissions_permission ON role_permissions USING BTREE (permission_id);
CREATE INDEX idx_role_permissions_role ON role_permissions USING BTREE (role_id);
CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON role_permissions USING BTREE (role_id);
CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON role_permissions USING BTREE (permission_id);

-- service_events indexes
CREATE INDEX idx_service_events_org ON service_events USING BTREE (organization_id);

-- service_beneficiaries indexes
CREATE INDEX idx_service_beneficiaries_event ON service_beneficiaries USING BTREE (service_event_id);

-- solicitation_proposals indexes
CREATE INDEX idx_proposals_donor ON solicitation_proposals USING BTREE (donor_id);
CREATE INDEX idx_proposals_officer ON solicitation_proposals USING BTREE (officer_id);
CREATE INDEX idx_proposals_org ON solicitation_proposals USING BTREE (organization_id);
CREATE INDEX idx_proposals_sent_date ON solicitation_proposals USING BTREE (date_sent);
CREATE INDEX idx_proposals_status ON solicitation_proposals USING BTREE (status);

-- tasks indexes
CREATE INDEX idx_tasks_assigned_to ON tasks USING BTREE (assigned_to);
CREATE INDEX idx_tasks_organization ON tasks USING BTREE (organization_id);
CREATE INDEX idx_tasks_project ON tasks USING BTREE (project_id);
CREATE INDEX idx_tasks_status ON tasks USING BTREE (status);

-- user_registration_requests indexes
CREATE INDEX idx_user_reg_requests_email ON user_registration_requests USING BTREE (email);
CREATE INDEX idx_user_reg_requests_org_id ON user_registration_requests USING BTREE (organization_id);
CREATE INDEX idx_user_reg_requests_org_status ON user_registration_requests USING BTREE (status);
CREATE INDEX idx_user_reg_requests_org_status ON user_registration_requests USING BTREE (organization_id);
CREATE INDEX idx_user_reg_requests_requested_at ON user_registration_requests USING BTREE (requested_at);
CREATE INDEX idx_user_reg_requests_status ON user_registration_requests USING BTREE (status);

-- user_roles indexes
CREATE INDEX idx_user_roles_organization ON user_roles USING BTREE (organization_id);
CREATE INDEX idx_user_roles_role ON user_roles USING BTREE (role_id);
CREATE INDEX idx_user_roles_user ON user_roles USING BTREE (user_id);
CREATE UNIQUE INDEX user_roles_user_id_role_id_organization_id_key ON user_roles USING BTREE (organization_id);
CREATE UNIQUE INDEX user_roles_user_id_role_id_organization_id_key ON user_roles USING BTREE (user_id);
CREATE UNIQUE INDEX user_roles_user_id_role_id_organization_id_key ON user_roles USING BTREE (role_id);

-- volunteers indexes
CREATE INDEX idx_volunteers_organization ON volunteers USING BTREE (organization_id);
CREATE INDEX idx_volunteers_status ON volunteers USING BTREE (status);

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================
