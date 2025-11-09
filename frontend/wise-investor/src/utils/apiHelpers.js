/**
 * API Utility Functions
 * Centralized API endpoint construction with organization_id
 */

/**
 * Get organization ID from localStorage
 */
export const getOrganizationId = () => {
  return localStorage.getItem('organization_id');
};

/**
 * Build analytics API endpoint with organization_id
 * @param {string} endpoint - The endpoint name (e.g., 'executive-dashboard')
 * @param {string} baseUrl - The API base URL
 * @returns {string} - Complete API endpoint URL
 */
export const buildAnalyticsEndpoint = (endpoint, baseUrl) => {
  const orgId = getOrganizationId();
  
  if (!orgId) {
    console.error('No organization_id found in localStorage');
    throw new Error('Organization ID not found. Please login again.');
  }
  
  return `${baseUrl}/api/v1/analytics/${endpoint}/${orgId}`;
};

/**
 * Analytics API endpoints map
 */
export const ANALYTICS_ENDPOINTS = {
  EXECUTIVE_DASHBOARD: 'executive-dashboard',
  DONOR_LIFECYCLE: 'donor-lifecycle',
  FUNDRAISING_VITALS: 'fundraising-vitals',
  REVENUE_ROLLUP: 'revenue-rollup',
  AUDIENCE_GROWTH: 'audience-growth',
  PROGRAM_IMPACT: 'program-impact',
  DONOR_SEGMENTS: 'donor-segments',
  MISSION_ALIGNMENT: 'mission-alignment',
  HIGH_IMPACT_TARGETS: 'high-impact-targets',
  DIGITAL_PERFORMANCE: 'digital-performance',
  CHURN_RISK: 'churn-risk',
  MISSIONAL_IMPACT: 'missional-impact',
  STRATEGIC_PORTFOLIO: 'strategic-portfolio',
};

/**
 * Fetch analytics data with proper organization_id
 * @param {string} endpoint - The endpoint name
 * @param {string} baseUrl - The API base URL
 * @param {object} axiosInstance - Axios instance with auth headers
 * @returns {Promise} - API response
 */
export const fetchAnalyticsData = async (endpoint, baseUrl, axiosInstance) => {
  const url = buildAnalyticsEndpoint(endpoint, baseUrl);
  return await axiosInstance.get(url);
};
