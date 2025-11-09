// Role-Based Access Control Utility

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin', // Backend uses 'admin' which maps to org_admin
  ORG_ADMIN: 'org_admin',
  CEO: 'ceo',
  EXECUTIVE: 'executive',
  MARKETING: 'marketing',
  SALES: 'sales',
  EVENT_ORGANIZER: 'event_organizer',
  DONOR: 'donor'
};

// Define analytics access levels
export const ANALYTICS_MODULES = {
  OVERVIEW: 'overview',
  EXECUTIVE_REPORT: 'executive_report',
  FUNDRAISING_VITALS: 'fundraising_vitals',
  DONOR_LIFECYCLE: 'donor_lifecycle',
  PROGRAM_IMPACT: 'program_impact',
  DIGITAL_ANALYTICS: 'digital_analytics',
  AUDIENCE_GROWTH: 'audience_growth',
  SUPERADMIN_PANEL: 'superadmin_panel'
};

// Role Access Matrix
export const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: {
    canAccessAllOrgs: true,
    analytics: Object.values(ANALYTICS_MODULES),
    description: 'Full platform access across all organizations'
  },
  
  // ADMIN role - same permissions as ORG_ADMIN (backend uses 'admin')
  [ROLES.ADMIN]: {
    canAccessAllOrgs: false,
    analytics: [
      ANALYTICS_MODULES.OVERVIEW,
      ANALYTICS_MODULES.EXECUTIVE_REPORT,
      ANALYTICS_MODULES.FUNDRAISING_VITALS,
      ANALYTICS_MODULES.DONOR_LIFECYCLE,
      ANALYTICS_MODULES.PROGRAM_IMPACT,
      ANALYTICS_MODULES.DIGITAL_ANALYTICS,
      ANALYTICS_MODULES.AUDIENCE_GROWTH
    ],
    description: 'Full analytics access for organization'
  },
  
  [ROLES.ORG_ADMIN]: {
    canAccessAllOrgs: false,
    analytics: [
      ANALYTICS_MODULES.OVERVIEW,
      ANALYTICS_MODULES.EXECUTIVE_REPORT,
      ANALYTICS_MODULES.FUNDRAISING_VITALS,
      ANALYTICS_MODULES.DONOR_LIFECYCLE,
      ANALYTICS_MODULES.PROGRAM_IMPACT,
      ANALYTICS_MODULES.DIGITAL_ANALYTICS,
      ANALYTICS_MODULES.AUDIENCE_GROWTH
    ],
    description: 'Full analytics access for organization'
  },
  
  [ROLES.CEO]: {
    canAccessAllOrgs: false,
    analytics: [
      ANALYTICS_MODULES.OVERVIEW,
      ANALYTICS_MODULES.EXECUTIVE_REPORT,
      ANALYTICS_MODULES.FUNDRAISING_VITALS,
      ANALYTICS_MODULES.DONOR_LIFECYCLE,
      ANALYTICS_MODULES.PROGRAM_IMPACT,
      ANALYTICS_MODULES.DIGITAL_ANALYTICS,
      ANALYTICS_MODULES.AUDIENCE_GROWTH
    ],
    description: 'Full analytics access for organization'
  },
  
  [ROLES.EXECUTIVE]: {
    canAccessAllOrgs: false,
    analytics: [
      ANALYTICS_MODULES.OVERVIEW,
      ANALYTICS_MODULES.EXECUTIVE_REPORT,
      ANALYTICS_MODULES.FUNDRAISING_VITALS,
      ANALYTICS_MODULES.DONOR_LIFECYCLE,
      ANALYTICS_MODULES.PROGRAM_IMPACT,
      ANALYTICS_MODULES.DIGITAL_ANALYTICS,
      ANALYTICS_MODULES.AUDIENCE_GROWTH
    ],
    description: 'Full analytics access for organization'
  },
  
  [ROLES.MARKETING]: {
    canAccessAllOrgs: false,
    analytics: [
      ANALYTICS_MODULES.OVERVIEW,
      ANALYTICS_MODULES.DONOR_LIFECYCLE,
      ANALYTICS_MODULES.DIGITAL_ANALYTICS,
      ANALYTICS_MODULES.AUDIENCE_GROWTH
    ],
    description: 'Limited analytics (donor lifecycle, digital, audience growth)'
  },
  
  [ROLES.SALES]: {
    canAccessAllOrgs: false,
    analytics: [
      ANALYTICS_MODULES.OVERVIEW,
      ANALYTICS_MODULES.DONOR_LIFECYCLE,
      ANALYTICS_MODULES.DIGITAL_ANALYTICS,
      ANALYTICS_MODULES.AUDIENCE_GROWTH
    ],
    description: 'Limited analytics (donor lifecycle, digital, audience growth)'
  },
  
  [ROLES.EVENT_ORGANIZER]: {
    canAccessAllOrgs: false,
    analytics: [
      ANALYTICS_MODULES.OVERVIEW
    ],
    description: 'Basic metrics only'
  },
  
  [ROLES.DONOR]: {
    canAccessAllOrgs: false,
    analytics: [
      ANALYTICS_MODULES.OVERVIEW
    ],
    description: 'Basic metrics only'
  }
};

// Check if user has access to specific analytics module
export const hasAnalyticsAccess = (userRole, module) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  return permissions.analytics.includes(module);
};

// Get all accessible analytics modules for a role
export const getAccessibleAnalytics = (userRole) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return [];
  return permissions.analytics;
};

// Check if role can access all organizations
export const canAccessAllOrganizations = (userRole) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions?.canAccessAllOrgs || false;
};

// Get role description
export const getRoleDescription = (userRole) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions?.description || 'No access';
};

// Format role name for display
export const formatRoleName = (role) => {
  if (!role) return 'Unknown';
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get role badge color
export const getRoleBadgeColor = (role) => {
  switch (role) {
    case ROLES.SUPERADMIN:
      return 'badge-danger';
    case ROLES.ADMIN:
    case ROLES.ORG_ADMIN:
    case ROLES.CEO:
      return 'badge-primary';
    case ROLES.EXECUTIVE:
      return 'badge-success';
    case ROLES.MARKETING:
    case ROLES.SALES:
      return 'badge-warning';
    case ROLES.EVENT_ORGANIZER:
    case ROLES.DONOR:
      return 'badge-gray';
    default:
      return 'badge-gray';
  }
};

// Analytics module metadata
export const ANALYTICS_METADATA = {
  [ANALYTICS_MODULES.OVERVIEW]: {
    title: 'Overview Dashboard',
    description: 'Key metrics and performance indicators',
    icon: '📊'
  },
  [ANALYTICS_MODULES.EXECUTIVE_REPORT]: {
    title: 'Executive Report',
    description: 'Board-ready comprehensive reports',
    icon: '📈'
  },
  [ANALYTICS_MODULES.FUNDRAISING_VITALS]: {
    title: 'Fundraising Vitals',
    description: 'Revenue and fundraising metrics',
    icon: '💰'
  },
  [ANALYTICS_MODULES.DONOR_LIFECYCLE]: {
    title: 'Donor Lifecycle',
    description: 'Donor segmentation and retention',
    icon: '👥'
  },
  [ANALYTICS_MODULES.PROGRAM_IMPACT]: {
    title: 'Program Impact',
    description: 'Program effectiveness and outcomes',
    icon: '🎯'
  },
  [ANALYTICS_MODULES.DIGITAL_ANALYTICS]: {
    title: 'Digital Analytics',
    description: 'Website and digital presence metrics',
    icon: '🌐'
  },
  [ANALYTICS_MODULES.AUDIENCE_GROWTH]: {
    title: 'Audience Growth',
    description: 'Email, social media, and engagement',
    icon: '📢'
  },
  [ANALYTICS_MODULES.SUPERADMIN_PANEL]: {
    title: 'Superadmin Panel',
    description: 'Platform-wide management',
    icon: '⚙️'
  }
};

export default {
  ROLES,
  ANALYTICS_MODULES,
  ROLE_PERMISSIONS,
  hasAnalyticsAccess,
  getAccessibleAnalytics,
  canAccessAllOrganizations,
  getRoleDescription,
  formatRoleName,
  getRoleBadgeColor,
  ANALYTICS_METADATA
};
