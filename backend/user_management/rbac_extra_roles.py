# rbac_nonprofit_enhanced.py - Nonprofit Fundraising RBAC System
"""
Enhanced RBAC system with specialized nonprofit fundraising roles
Designed for comprehensive donor development and fundraising operations
"""

from enum import Enum
from typing import Set


class RoleType(str, Enum):
    """Available roles in the nonprofit system"""
    # System & Organization Admin
    SUPERADMIN = "superadmin"
    ORG_ADMIN = "org_admin"

    # Executive Leadership
    CEO = "ceo"
    EXECUTIVE = "executive"

    # Fundraising Teams
    MAJOR_GIFTS = "major_gifts"  # Major Gifts Officers / Frontline Fundraisers
    DIRECTOR_ANNUAL_GIVING = "director_annual_giving"  # Annual Fund / Direct Response
    PLANNED_GIVING = "planned_giving"  # Planned Giving Officers
    CORPORATE_FOUNDATIONS = "corporate_foundations"  # Corporate & Foundation Relations

    # Donor Engagement
    STEWARDSHIP = "stewardship"  # Donor Relations / Stewardship
    MEMBERSHIP = "membership"  # Membership Programs

    # Marketing & Communications
    MARKETING_COMMS = "marketing_comms"  # Marketing & Communications Team
    DIGITAL_STRATEGY = "digital_strategy"  # Digital Strategy Team

    # Sales & Operations
    SALES_TEAM = "sales_team"  # Sales Team
    EVENT_ORGANIZER = "event_organizer"  # Event Management

    # Basic Access
    DONOR = "donor"  # Individual Donors


class Permission(str, Enum):
    """System permissions"""
    # Organization management (SUPERADMIN only)
    CREATE_ORGANIZATION = "create_organization"
    READ_ORGANIZATION = "read_organization"
    UPDATE_ORGANIZATION = "update_organization"
    DELETE_ORGANIZATION = "delete_organization"

    # User management
    CREATE_USER = "create_user"
    READ_USER = "read_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    ASSIGN_ROLES = "assign_roles"
    MANAGE_USER_PERMISSIONS = "manage_user_permissions"

    # Program management
    CREATE_PROGRAM = "create_program"
    READ_PROGRAM = "read_program"
    UPDATE_PROGRAM = "update_program"
    DELETE_PROGRAM = "delete_program"

    # Donation management
    CREATE_DONATION = "create_donation"
    READ_DONATIONS = "read_donations"
    READ_ALL_DONATIONS = "read_all_donations"  # Full donation access
    UPDATE_DONATION = "update_donation"
    DELETE_DONATION = "delete_donation"
    APPROVE_LARGE_DONATIONS = "approve_large_donations"  # For major gifts

    # Donor/Party management
    CREATE_PARTY = "create_party"
    READ_PARTY = "read_party"
    READ_ALL_PARTIES = "read_all_parties"  # Full donor database access
    UPDATE_PARTY = "update_party"
    DELETE_PARTY = "delete_party"
    ASSIGN_DONOR_OFFICER = "assign_donor_officer"  # Assign relationship managers
    VIEW_DONOR_WEALTH = "view_donor_wealth"  # View wealth screening data

    # Pledge management
    CREATE_PLEDGE = "create_pledge"
    READ_PLEDGES = "read_pledges"
    READ_ALL_PLEDGES = "read_all_pledges"
    UPDATE_PLEDGE = "update_pledge"
    DELETE_PLEDGE = "delete_pledge"
    MANAGE_PLEDGE_SCHEDULES = "manage_pledge_schedules"

    # Fund management
    CREATE_FUND = "create_fund"
    READ_FUND = "read_fund"
    UPDATE_FUND = "update_fund"
    DELETE_FUND = "delete_fund"

    # Beneficiary management
    CREATE_BENEFICIARY = "create_beneficiary"
    READ_BENEFICIARY = "read_beneficiary"
    UPDATE_BENEFICIARY = "update_beneficiary"
    DELETE_BENEFICIARY = "delete_beneficiary"

    # Event management
    CREATE_EVENT = "create_event"
    READ_EVENT = "read_event"
    UPDATE_EVENT = "update_event"
    DELETE_EVENT = "delete_event"
    MANAGE_EVENT_REGISTRATIONS = "manage_event_registrations"
    CHECK_IN_ATTENDEES = "check_in_attendees"

    # Campaign management
    CREATE_CAMPAIGN = "create_campaign"
    READ_CAMPAIGN = "read_campaign"
    UPDATE_CAMPAIGN = "update_campaign"
    DELETE_CAMPAIGN = "delete_campaign"
    APPROVE_CAMPAIGN_BUDGET = "approve_campaign_budget"

    # Analytics & Reporting
    READ_ANALYTICS = "read_analytics"
    READ_EXECUTIVE_DASHBOARD = "read_executive_dashboard"
    READ_FUNDRAISING_VITALS = "read_fundraising_vitals"
    READ_DONOR_LIFECYCLE = "read_donor_lifecycle"
    READ_DIGITAL_ANALYTICS = "read_digital_analytics"
    EXPORT_ANALYTICS = "export_analytics"
    EXPORT_DONOR_DATA = "export_donor_data"

    # Financial
    READ_FINANCIALS = "read_financials"
    MANAGE_FINANCIALS = "manage_financials"
    VIEW_GIFT_CAPACITY = "view_gift_capacity"  # View donor capacity ratings

    # Stewardship & Communications
    SEND_ACKNOWLEDGMENTS = "send_acknowledgments"
    MANAGE_STEWARDSHIP_PLANS = "manage_stewardship_plans"
    SEND_DONOR_COMMUNICATIONS = "send_donor_communications"
    VIEW_COMMUNICATION_HISTORY = "view_communication_history"

    # Membership
    MANAGE_MEMBERSHIP_LEVELS = "manage_membership_levels"
    PROCESS_RENEWALS = "process_renewals"
    MANAGE_MEMBER_BENEFITS = "manage_member_benefits"

    # Planned Giving
    MANAGE_PLANNED_GIFTS = "manage_planned_gifts"
    VIEW_ESTATE_INFO = "view_estate_info"
    MANAGE_BEQUEST_SOCIETY = "manage_bequest_society"

    # Proposals & Grants
    CREATE_PROPOSALS = "create_proposals"
    MANAGE_GRANT_PIPELINE = "manage_grant_pipeline"
    SUBMIT_REPORTS = "submit_reports"


# Role-Permission Mapping
ROLE_PERMISSIONS: dict[RoleType, Set[Permission]] = {
    RoleType.SUPERADMIN: {
        # Superadmin has ALL permissions across ALL organizations
        Permission.CREATE_ORGANIZATION,
        Permission.READ_ORGANIZATION,
        Permission.UPDATE_ORGANIZATION,
        Permission.DELETE_ORGANIZATION,
        Permission.CREATE_USER,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.ASSIGN_ROLES,
        Permission.MANAGE_USER_PERMISSIONS,
        Permission.CREATE_PROGRAM,
        Permission.READ_PROGRAM,
        Permission.UPDATE_PROGRAM,
        Permission.DELETE_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_DONATIONS,
        Permission.READ_ALL_DONATIONS,
        Permission.UPDATE_DONATION,
        Permission.DELETE_DONATION,
        Permission.APPROVE_LARGE_DONATIONS,
        Permission.CREATE_PARTY,
        Permission.READ_PARTY,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.DELETE_PARTY,
        Permission.ASSIGN_DONOR_OFFICER,
        Permission.VIEW_DONOR_WEALTH,
        Permission.CREATE_PLEDGE,
        Permission.READ_PLEDGES,
        Permission.READ_ALL_PLEDGES,
        Permission.UPDATE_PLEDGE,
        Permission.DELETE_PLEDGE,
        Permission.MANAGE_PLEDGE_SCHEDULES,
        Permission.CREATE_FUND,
        Permission.READ_FUND,
        Permission.UPDATE_FUND,
        Permission.DELETE_FUND,
        Permission.CREATE_BENEFICIARY,
        Permission.READ_BENEFICIARY,
        Permission.UPDATE_BENEFICIARY,
        Permission.DELETE_BENEFICIARY,
        Permission.CREATE_EVENT,
        Permission.READ_EVENT,
        Permission.UPDATE_EVENT,
        Permission.DELETE_EVENT,
        Permission.MANAGE_EVENT_REGISTRATIONS,
        Permission.CHECK_IN_ATTENDEES,
        Permission.CREATE_CAMPAIGN,
        Permission.READ_CAMPAIGN,
        Permission.UPDATE_CAMPAIGN,
        Permission.DELETE_CAMPAIGN,
        Permission.APPROVE_CAMPAIGN_BUDGET,
        Permission.READ_ANALYTICS,
        Permission.READ_EXECUTIVE_DASHBOARD,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.READ_DIGITAL_ANALYTICS,
        Permission.EXPORT_ANALYTICS,
        Permission.EXPORT_DONOR_DATA,
        Permission.READ_FINANCIALS,
        Permission.MANAGE_FINANCIALS,
        Permission.VIEW_GIFT_CAPACITY,
        Permission.SEND_ACKNOWLEDGMENTS,
        Permission.MANAGE_STEWARDSHIP_PLANS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
        Permission.MANAGE_MEMBERSHIP_LEVELS,
        Permission.PROCESS_RENEWALS,
        Permission.MANAGE_MEMBER_BENEFITS,
        Permission.MANAGE_PLANNED_GIFTS,
        Permission.VIEW_ESTATE_INFO,
        Permission.MANAGE_BEQUEST_SOCIETY,
        Permission.CREATE_PROPOSALS,
        Permission.MANAGE_GRANT_PIPELINE,
        Permission.SUBMIT_REPORTS,
    },

    RoleType.ORG_ADMIN: {
        # Organization Administrator - Full operational control
        Permission.READ_ORGANIZATION,
        Permission.UPDATE_ORGANIZATION,
        Permission.CREATE_USER,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.ASSIGN_ROLES,
        Permission.MANAGE_USER_PERMISSIONS,
        Permission.CREATE_PROGRAM,
        Permission.READ_PROGRAM,
        Permission.UPDATE_PROGRAM,
        Permission.DELETE_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.UPDATE_DONATION,
        Permission.DELETE_DONATION,
        Permission.APPROVE_LARGE_DONATIONS,
        Permission.CREATE_PARTY,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.DELETE_PARTY,
        Permission.ASSIGN_DONOR_OFFICER,
        Permission.VIEW_DONOR_WEALTH,
        Permission.CREATE_PLEDGE,
        Permission.READ_ALL_PLEDGES,
        Permission.UPDATE_PLEDGE,
        Permission.DELETE_PLEDGE,
        Permission.MANAGE_PLEDGE_SCHEDULES,
        Permission.CREATE_FUND,
        Permission.READ_FUND,
        Permission.UPDATE_FUND,
        Permission.DELETE_FUND,
        Permission.CREATE_BENEFICIARY,
        Permission.READ_BENEFICIARY,
        Permission.UPDATE_BENEFICIARY,
        Permission.DELETE_BENEFICIARY,
        Permission.CREATE_EVENT,
        Permission.READ_EVENT,
        Permission.UPDATE_EVENT,
        Permission.DELETE_EVENT,
        Permission.MANAGE_EVENT_REGISTRATIONS,
        Permission.CHECK_IN_ATTENDEES,
        Permission.CREATE_CAMPAIGN,
        Permission.READ_CAMPAIGN,
        Permission.UPDATE_CAMPAIGN,
        Permission.DELETE_CAMPAIGN,
        Permission.APPROVE_CAMPAIGN_BUDGET,
        Permission.READ_ANALYTICS,
        Permission.READ_EXECUTIVE_DASHBOARD,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.READ_DIGITAL_ANALYTICS,
        Permission.EXPORT_ANALYTICS,
        Permission.EXPORT_DONOR_DATA,
        Permission.READ_FINANCIALS,
        Permission.MANAGE_FINANCIALS,
        Permission.VIEW_GIFT_CAPACITY,
        Permission.SEND_ACKNOWLEDGMENTS,
        Permission.MANAGE_STEWARDSHIP_PLANS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
        Permission.MANAGE_MEMBERSHIP_LEVELS,
        Permission.PROCESS_RENEWALS,
        Permission.MANAGE_MEMBER_BENEFITS,
        Permission.MANAGE_PLANNED_GIFTS,
        Permission.VIEW_ESTATE_INFO,
        Permission.MANAGE_BEQUEST_SOCIETY,
        Permission.CREATE_PROPOSALS,
        Permission.MANAGE_GRANT_PIPELINE,
        Permission.SUBMIT_REPORTS,
    },

    RoleType.CEO: {
        # CEO - Executive oversight and strategic decisions
        Permission.READ_ORGANIZATION,
        Permission.UPDATE_ORGANIZATION,
        Permission.CREATE_USER,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.ASSIGN_ROLES,
        Permission.READ_PROGRAM,
        Permission.CREATE_PROGRAM,
        Permission.UPDATE_PROGRAM,
        Permission.READ_ALL_DONATIONS,
        Permission.APPROVE_LARGE_DONATIONS,
        Permission.READ_ALL_PARTIES,
        Permission.VIEW_DONOR_WEALTH,
        Permission.READ_ALL_PLEDGES,
        Permission.READ_FUND,
        Permission.READ_BENEFICIARY,
        Permission.READ_EVENT,
        Permission.READ_CAMPAIGN,
        Permission.APPROVE_CAMPAIGN_BUDGET,
        Permission.READ_ANALYTICS,
        Permission.READ_EXECUTIVE_DASHBOARD,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.READ_DIGITAL_ANALYTICS,
        Permission.EXPORT_ANALYTICS,
        Permission.EXPORT_DONOR_DATA,
        Permission.READ_FINANCIALS,
        Permission.MANAGE_FINANCIALS,
        Permission.VIEW_GIFT_CAPACITY,
        Permission.VIEW_COMMUNICATION_HISTORY,
    },

    RoleType.EXECUTIVE: {
        # Senior leadership team
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_PROGRAM,
        Permission.UPDATE_PROGRAM,
        Permission.READ_ALL_DONATIONS,
        Permission.READ_ALL_PARTIES,
        Permission.VIEW_DONOR_WEALTH,
        Permission.READ_ALL_PLEDGES,
        Permission.READ_FUND,
        Permission.READ_BENEFICIARY,
        Permission.READ_EVENT,
        Permission.READ_CAMPAIGN,
        Permission.READ_ANALYTICS,
        Permission.READ_EXECUTIVE_DASHBOARD,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.READ_DIGITAL_ANALYTICS,
        Permission.EXPORT_ANALYTICS,
        Permission.READ_FINANCIALS,
        Permission.VIEW_GIFT_CAPACITY,
        Permission.VIEW_COMMUNICATION_HISTORY,
    },

    RoleType.MAJOR_GIFTS: {
        # Major Gifts Officers / Frontline Fundraisers
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.UPDATE_DONATION,
        Permission.CREATE_PARTY,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.ASSIGN_DONOR_OFFICER,
        Permission.VIEW_DONOR_WEALTH,
        Permission.CREATE_PLEDGE,
        Permission.READ_ALL_PLEDGES,
        Permission.UPDATE_PLEDGE,
        Permission.MANAGE_PLEDGE_SCHEDULES,
        Permission.READ_FUND,
        Permission.READ_EVENT,
        Permission.CREATE_EVENT,  # Can organize cultivation events
        Permission.UPDATE_EVENT,
        Permission.READ_CAMPAIGN,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.EXPORT_ANALYTICS,
        Permission.VIEW_GIFT_CAPACITY,
        Permission.SEND_ACKNOWLEDGMENTS,
        Permission.MANAGE_STEWARDSHIP_PLANS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
        Permission.CREATE_PROPOSALS,
        Permission.MANAGE_GRANT_PIPELINE,
        Permission.SUBMIT_REPORTS,
    },

    RoleType.DIRECTOR_ANNUAL_GIVING: {
        # Annual Fund / Direct Response Team
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.UPDATE_DONATION,
        Permission.CREATE_PARTY,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.CREATE_PLEDGE,
        Permission.READ_ALL_PLEDGES,
        Permission.UPDATE_PLEDGE,
        Permission.READ_FUND,
        Permission.READ_EVENT,
        Permission.CREATE_CAMPAIGN,
        Permission.READ_CAMPAIGN,
        Permission.UPDATE_CAMPAIGN,
        Permission.DELETE_CAMPAIGN,
        Permission.READ_ANALYTICS,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.EXPORT_ANALYTICS,
        Permission.SEND_ACKNOWLEDGMENTS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
    },

    RoleType.PLANNED_GIVING: {
        # Planned Giving Officers
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.UPDATE_DONATION,
        Permission.CREATE_PARTY,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.VIEW_DONOR_WEALTH,
        Permission.CREATE_PLEDGE,
        Permission.READ_ALL_PLEDGES,
        Permission.UPDATE_PLEDGE,
        Permission.MANAGE_PLEDGE_SCHEDULES,
        Permission.READ_FUND,
        Permission.READ_EVENT,
        Permission.READ_CAMPAIGN,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.VIEW_GIFT_CAPACITY,
        Permission.SEND_ACKNOWLEDGMENTS,
        Permission.MANAGE_STEWARDSHIP_PLANS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
        Permission.MANAGE_PLANNED_GIFTS,
        Permission.VIEW_ESTATE_INFO,
        Permission.MANAGE_BEQUEST_SOCIETY,
    },

    RoleType.CORPORATE_FOUNDATIONS: {
        # Corporate & Foundation Relations
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_PROGRAM,  # Can create programs for grants
        Permission.UPDATE_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.UPDATE_DONATION,
        Permission.CREATE_PARTY,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.VIEW_DONOR_WEALTH,
        Permission.CREATE_PLEDGE,
        Permission.READ_ALL_PLEDGES,
        Permission.UPDATE_PLEDGE,
        Permission.READ_FUND,
        Permission.READ_BENEFICIARY,
        Permission.READ_EVENT,
        Permission.READ_CAMPAIGN,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.EXPORT_ANALYTICS,
        Permission.VIEW_GIFT_CAPACITY,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
        Permission.CREATE_PROPOSALS,
        Permission.MANAGE_GRANT_PIPELINE,
        Permission.SUBMIT_REPORTS,
    },

    RoleType.STEWARDSHIP: {
        # Donor Relations / Stewardship Team
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.READ_ALL_DONATIONS,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.READ_ALL_PLEDGES,
        Permission.READ_FUND,
        Permission.READ_BENEFICIARY,
        Permission.READ_EVENT,
        Permission.CREATE_EVENT,  # Can create donor appreciation events
        Permission.UPDATE_EVENT,
        Permission.READ_CAMPAIGN,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.EXPORT_ANALYTICS,
        Permission.SEND_ACKNOWLEDGMENTS,
        Permission.MANAGE_STEWARDSHIP_PLANS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
    },

    RoleType.MEMBERSHIP: {
        # Membership Programs Team
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.UPDATE_DONATION,
        Permission.CREATE_PARTY,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.CREATE_PLEDGE,
        Permission.READ_ALL_PLEDGES,
        Permission.READ_EVENT,
        Permission.CREATE_EVENT,
        Permission.UPDATE_EVENT,
        Permission.MANAGE_EVENT_REGISTRATIONS,
        Permission.READ_CAMPAIGN,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.EXPORT_ANALYTICS,
        Permission.SEND_ACKNOWLEDGMENTS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
        Permission.MANAGE_MEMBERSHIP_LEVELS,
        Permission.PROCESS_RENEWALS,
        Permission.MANAGE_MEMBER_BENEFITS,
    },

    RoleType.MARKETING_COMMS: {
        # Marketing & Communications Team
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_PROGRAM,
        Permission.UPDATE_PROGRAM,
        Permission.READ_ALL_DONATIONS,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.CREATE_EVENT,
        Permission.READ_EVENT,
        Permission.UPDATE_EVENT,
        Permission.DELETE_EVENT,
        Permission.CREATE_CAMPAIGN,
        Permission.READ_CAMPAIGN,
        Permission.UPDATE_CAMPAIGN,
        Permission.DELETE_CAMPAIGN,
        Permission.READ_ANALYTICS,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.READ_DIGITAL_ANALYTICS,
        Permission.EXPORT_ANALYTICS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
    },

    RoleType.DIGITAL_STRATEGY: {
        # Digital Strategy Team
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.CREATE_EVENT,
        Permission.READ_EVENT,
        Permission.UPDATE_EVENT,
        Permission.MANAGE_EVENT_REGISTRATIONS,
        Permission.CREATE_CAMPAIGN,
        Permission.READ_CAMPAIGN,
        Permission.UPDATE_CAMPAIGN,
        Permission.DELETE_CAMPAIGN,
        Permission.READ_ANALYTICS,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.READ_DIGITAL_ANALYTICS,
        Permission.EXPORT_ANALYTICS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
    },

    RoleType.SALES_TEAM: {
        # Sales Team
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.UPDATE_DONATION,
        Permission.CREATE_PARTY,
        Permission.READ_ALL_PARTIES,
        Permission.UPDATE_PARTY,
        Permission.DELETE_PARTY,
        Permission.CREATE_PLEDGE,
        Permission.READ_ALL_PLEDGES,
        Permission.UPDATE_PLEDGE,
        Permission.READ_EVENT,
        Permission.READ_CAMPAIGN,
        Permission.READ_FUNDRAISING_VITALS,
        Permission.READ_DONOR_LIFECYCLE,
        Permission.EXPORT_ANALYTICS,
        Permission.SEND_DONOR_COMMUNICATIONS,
        Permission.VIEW_COMMUNICATION_HISTORY,
    },

    RoleType.EVENT_ORGANIZER: {
        # Event Management Team
        Permission.READ_ORGANIZATION,
        Permission.READ_USER,
        Permission.READ_PROGRAM,
        Permission.CREATE_EVENT,
        Permission.READ_EVENT,
        Permission.UPDATE_EVENT,
        Permission.DELETE_EVENT,
        Permission.MANAGE_EVENT_REGISTRATIONS,
        Permission.CHECK_IN_ATTENDEES,
        Permission.READ_ALL_PARTIES,
        Permission.CREATE_PARTY,
        Permission.UPDATE_PARTY,
        Permission.CREATE_DONATION,
        Permission.READ_ALL_DONATIONS,
        Permission.READ_CAMPAIGN,
        Permission.READ_ANALYTICS,
        Permission.EXPORT_ANALYTICS,
        Permission.SEND_DONOR_COMMUNICATIONS,
    },

    RoleType.DONOR: {
        # Individual Donors - Basic Access
        Permission.READ_ORGANIZATION,
        Permission.READ_PROGRAM,
        Permission.CREATE_DONATION,
        Permission.READ_DONATIONS,  # Only their own
        Permission.READ_PARTY,  # Only their own profile
        Permission.UPDATE_PARTY,  # Only their own profile
        Permission.CREATE_PLEDGE,
        Permission.READ_PLEDGES,  # Only their own
        Permission.READ_EVENT,
        Permission.READ_CAMPAIGN,
    },
}


def has_permission(role: RoleType, permission: Permission) -> bool:
    """Check if a role has a specific permission"""
    return permission in ROLE_PERMISSIONS.get(role, set())


def get_role_permissions(role: RoleType) -> Set[Permission]:
    """Get all permissions for a role"""
    return ROLE_PERMISSIONS.get(role, set())


def can_access_organization(user_role: RoleType, user_org_id: str, target_org_id: str) -> bool:
    """Check if a user can access a specific organization"""
    if user_role == RoleType.SUPERADMIN:
        return True
    return user_org_id == target_org_id


def can_assign_role(assigner_role: RoleType, target_role: RoleType) -> bool:
    """
    Check if a user can assign a specific role to another user.

    Rules:
    - SUPERADMIN can assign any role
    - ORG_ADMIN can assign any role EXCEPT SUPERADMIN and ORG_ADMIN
    - CEO can assign operational roles
    - Others cannot assign roles
    """
    if assigner_role == RoleType.SUPERADMIN:
        return True

    if assigner_role == RoleType.ORG_ADMIN:
        return target_role not in [RoleType.SUPERADMIN, RoleType.ORG_ADMIN]

    if assigner_role == RoleType.CEO:
        return target_role not in [
            RoleType.SUPERADMIN,
            RoleType.ORG_ADMIN,
            RoleType.CEO
        ]

    return False


def can_access_analytics(role: RoleType, analytics_type: str) -> bool:
    """
    Check if a role can access specific analytics endpoints

    Args:
        role: User's role
        analytics_type: Type of analytics (executive, fundraising, donor, digital, etc.)
    """
    analytics_permissions = {
        "executive": Permission.READ_EXECUTIVE_DASHBOARD,
        "fundraising": Permission.READ_FUNDRAISING_VITALS,
        "donor": Permission.READ_DONOR_LIFECYCLE,
        "digital": Permission.READ_DIGITAL_ANALYTICS,
        "general": Permission.READ_ANALYTICS,
    }

    required_permission = analytics_permissions.get(analytics_type, Permission.READ_ANALYTICS)
    return has_permission(role, required_permission)


# Role descriptions for nonprofit context
ROLE_DESCRIPTIONS = {
    RoleType.SUPERADMIN: "System administrator with access to all organizations",
    RoleType.ORG_ADMIN: "Organization administrator with full operational control",
    RoleType.CEO: "Chief Executive Officer with executive oversight",
    RoleType.EXECUTIVE: "Senior leadership team member",
    RoleType.MAJOR_GIFTS: "Major gifts officer managing high-value donor relationships",
    RoleType.DIRECTOR_ANNUAL_GIVING: "Annual fund and direct response manager",
    RoleType.PLANNED_GIVING: "Planned giving officer managing legacy gifts and bequests",
    RoleType.CORPORATE_FOUNDATIONS: "Corporate and foundation relations officer",
    RoleType.STEWARDSHIP: "Donor relations and stewardship coordinator",
    RoleType.MEMBERSHIP: "Membership program manager",
    RoleType.MARKETING_COMMS: "Marketing and communications team member",
    RoleType.DIGITAL_STRATEGY: "Digital strategy and online fundraising specialist",
    RoleType.SALES_TEAM: "Sales team member focused on donor acquisition",
    RoleType.EVENT_ORGANIZER: "Event coordinator and attendee manager",
    RoleType.DONOR: "Individual donor with basic access",
}


# Typical annual gift ranges by role (for reference)
ROLE_GIFT_FOCUS = {
    RoleType.MAJOR_GIFTS: "$25,000+",
    RoleType.DIRECTOR_ANNUAL_GIVING: "$1-$24,999",
    RoleType.PLANNED_GIVING: "Estate gifts, bequests",
    RoleType.CORPORATE_FOUNDATIONS: "$10,000+ (institutional)",
    RoleType.MEMBERSHIP: "$50-$5,000",
}