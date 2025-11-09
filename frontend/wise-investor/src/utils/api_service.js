// apiService.js - Centralized API service for all API calls

const API_BASE_URL = '';

// Token management
const tokenManager = {
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  removeToken: () => localStorage.removeItem('authToken'),
  getOrganizationId: () => localStorage.getItem('organizationId'),
  setOrganizationId: (id) => localStorage.setItem('organizationId', id),
};

// Base API request handler
const apiRequest = async (endpoint, options = {}) => {
  const token = tokenManager.getToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Token expired or invalid
      tokenManager.removeToken();
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.access_token) {
      tokenManager.setToken(response.access_token);
      tokenManager.setOrganizationId(response.organization_id);
    }

    return response;
  },

  register: async (userData) => {
    return await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    tokenManager.removeToken();
    tokenManager.setOrganizationId(null);
  },

  getCurrentUser: async () => {
    return await apiRequest('/api/v1/auth/me');
  },
};

// User Management APIs
export const userAPI = {
  listUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/api/v1/users?${queryString}`);
  },

  getUser: async (userId) => {
    return await apiRequest(`/api/v1/users/${userId}`);
  },

  createUser: async (userData) => {
    return await apiRequest('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (userId, updateData) => {
    return await apiRequest(`/api/v1/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },

  deleteUser: async (userId, hardDelete = false) => {
    return await apiRequest(`/api/v1/users/${userId}?hard_delete=${hardDelete}`, {
      method: 'DELETE',
    });
  },

  assignRole: async (userId, role) => {
    return await apiRequest(`/api/v1/users/${userId}/assign-role`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  getAvailableRoles: async () => {
    return await apiRequest('/api/v1/users/roles/available');
  },
};

// Campaign APIs (Public and Authenticated)
export const campaignAPI = {
  // ==================== PUBLIC ENDPOINTS (No Auth Required) ====================

  // Get featured public campaigns from campaign_router.py
  listFeaturedCampaigns: async (limit = 6) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/public/featured?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch featured campaigns');
    return await response.json();
  },

  // Get all public campaigns from campaign_router.py
  listAllPublicCampaigns: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/public/all?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch public campaigns');
    return await response.json();
  },

  // Get public campaign by slug from campaign_router.py
  getPublicCampaignBySlug: async (slug) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/public/${slug}`);
    if (!response.ok) throw new Error('Failed to fetch campaign');
    return await response.json();
  },

  // Get paginated public campaigns from public_campaign_router.py
  getPublicCampaigns: async (page = 1, pageSize = 10, status = null, sortBy = 'created_at') => {
    const params = new URLSearchParams({ page, page_size: pageSize, sort_by: sortBy });
    if (status) params.append('status', status);
    const response = await fetch(`${API_BASE_URL}/api/public/campaigns?${params}`);
    if (!response.ok) throw new Error('Failed to fetch campaigns');
    return await response.json();
  },

  // Get public campaign detail from public_campaign_router.py
  getPublicCampaign: async (campaignId) => {
    const response = await fetch(`${API_BASE_URL}/api/public/campaigns/${campaignId}`);
    if (!response.ok) throw new Error('Failed to fetch campaign');
    return await response.json();
  },

  // Get campaign statistics from public_campaign_router.py
  getCampaignStats: async (campaignId) => {
    const response = await fetch(`${API_BASE_URL}/api/public/campaigns/${campaignId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch campaign stats');
    return await response.json();
  },

  // ==================== AUTHENTICATED ENDPOINTS ====================

  // List campaigns for the authenticated user's organization
  listCampaigns: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/api/v1/campaigns?${queryString}`);
  },

  // Get a specific campaign (authenticated)
  getCampaign: async (campaignId) => {
    return await apiRequest(`/api/v1/campaigns/${campaignId}`);
  },

  // Create a new campaign
  createCampaign: async (campaignData) => {
    return await apiRequest('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  },

  // Update campaign (FIXED: Changed from PATCH to PUT to match backend)
  updateCampaign: async (campaignId, updateData) => {
    return await apiRequest(`/api/v1/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete campaign
  deleteCampaign: async (campaignId) => {
    return await apiRequest(`/api/v1/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  },

  // Get organization campaign statistics
  getOrganizationCampaignStats: async () => {
    return await apiRequest('/api/v1/campaigns/organization/stats');
  },

  // Get campaign statistics for a specific organization (superadmin only)
  getSpecificOrgCampaignStats: async (organizationId) => {
    return await apiRequest(`/api/v1/campaigns/organization/${organizationId}/stats`);
  },

  // ==================== CAMPAIGN UPDATES ====================

  // Create a campaign update
  createCampaignUpdate: async (campaignId, updateData) => {
    return await apiRequest(`/api/v1/campaigns/${campaignId}/updates`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  },

  // List campaign updates
  listCampaignUpdates: async (campaignId) => {
    return await apiRequest(`/api/v1/campaigns/${campaignId}/updates`);
  },
};

// Donation APIs
export const donationAPI = {
  // Create payment intent
  createPaymentIntent: async (amount, campaignId, currency = 'usd') => {
    const params = new URLSearchParams({
      amount,
      campaign_id: campaignId,
      currency,
    });

    const response = await fetch(`${API_BASE_URL}/api/v1/donations/create-payment-intent?${params}`, {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to create payment intent');
    return await response.json();
  },

  // Create a donation (public endpoint)
  createDonation: async (donationData) => {
    const response = await fetch(`${API_BASE_URL}/api/public/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donationData),
    });

    if (!response.ok) throw new Error('Failed to create donation');
    return await response.json();
  },

  // Confirm donation
  confirmDonation: async (donationId) => {
    const response = await fetch(`${API_BASE_URL}/api/public/donations/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donation_id: donationId }),
    });

    if (!response.ok) throw new Error('Failed to confirm donation');
    return await response.json();
  },

  // Get donor portal data
  getDonorPortalData: async (donorEmail) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/donations/donor/${donorEmail}`);
    if (!response.ok) throw new Error('Failed to fetch donor data');
    return await response.json();
  },

  // Lookup donor by email
  lookupDonor: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/public/donor/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) throw new Error('Failed to lookup donor');
    return await response.json();
  },

  // Get donor dashboard
  getDonorDashboard: async (partyId) => {
    const response = await fetch(`${API_BASE_URL}/api/public/donor/${partyId}/dashboard`);
    if (!response.ok) throw new Error('Failed to fetch donor dashboard');
    return await response.json();
  },
};

// Analytics APIs
export const analyticsAPI = {
  getExecutiveDashboard: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/executive-dashboard-enhanced/${organizationId}`);
  },

  getFundraisingVitals: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/fundraising-vitals/${organizationId}`);
  },

  getDonorLifecycle: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/donor-lifecycle/${organizationId}`);
  },

  getDonorSegmentation: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/donor-segmentation/${organizationId}`);
  },

  getDonorRetention: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/donor-retention/${organizationId}`);
  },

  getCampaignPerformance: async (organizationId, campaignId = null) => {
    const endpoint = campaignId
      ? `/api/v1/analytics/campaign-performance/${organizationId}/${campaignId}`
      : `/api/v1/analytics/campaign-performance/${organizationId}`;
    return await apiRequest(endpoint);
  },

  getGivingTrends: async (organizationId, period = 'monthly') => {
    return await apiRequest(`/api/v1/analytics/giving-trends/${organizationId}?period=${period}`);
  },

  getRevenueBySource: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/revenue-by-source/${organizationId}`);
  },

  getDonorAcquisition: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/donor-acquisition/${organizationId}`);
  },

  getEngagementMetrics: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/engagement/${organizationId}`);
  },

  getDigitalMetrics: async (organizationId) => {
    return await apiRequest(`/api/v1/analytics/digital/sessions/${organizationId}`);
  },

  getExecutiveScorecard: async (organizationId, period = 'YTD') => {
    return await apiRequest(`/api/v1/analytics/executive-scorecard/${organizationId}?period=${period}`);
  },
};

// Intelligence APIs
export const intelligenceAPI = {
  getInsights: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/api/v1/intelligence/insights?${queryString}`);
  },

  generateInsights: async () => {
    return await apiRequest('/api/v1/intelligence/insights/generate', {
      method: 'POST',
    });
  },

  getDonorScores: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/api/v1/intelligence/donor-scores?${queryString}`);
  },

  calculateDonorScores: async (donorIds = null) => {
    return await apiRequest('/api/v1/intelligence/donor-scores/calculate', {
      method: 'POST',
      body: JSON.stringify({ donor_ids: donorIds }),
    });
  },

  getBenchmarks: async (benchmarkType = 'monthly') => {
    return await apiRequest(`/api/v1/intelligence/benchmarks?benchmark_type=${benchmarkType}`);
  },

  getRecommendations: async (donorId, recommendationType = null) => {
    const params = recommendationType
      ? `?recommendation_type=${recommendationType}`
      : '';
    return await apiRequest(`/api/v1/intelligence/recommendations/${donorId}${params}`);
  },

  getPortfolioAnalysis: async (segment = null) => {
    const params = segment ? `?segment=${segment}` : '';
    return await apiRequest(`/api/v1/intelligence/portfolio-analysis${params}`);
  },
};

// Wealth Screening APIs
export const wealthScreeningAPI = {
  performScreening: async (donorId, requestData) => {
    return await apiRequest(`/api/v1/wealth-screening/screen/${donorId}`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  bulkScreening: async (donorIds, screeningOptions) => {
    return await apiRequest('/api/v1/wealth-screening/bulk-screen', {
      method: 'POST',
      body: JSON.stringify({ donor_ids: donorIds, screening_options: screeningOptions }),
    });
  },

  getWealthIndicators: async (donorId) => {
    return await apiRequest(`/api/v1/wealth-screening/indicators/${donorId}`);
  },
};

// Prospect Research APIs
export const prospectAPI = {
  listProspects: async (filters = {}, skip = 0, limit = 100) => {
    const params = { ...filters, skip, limit };
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/api/v1/prospects?${queryString}`);
  },

  getProspect: async (prospectId) => {
    return await apiRequest(`/api/v1/prospects/${prospectId}`);
  },

  createProspect: async (profileData) => {
    return await apiRequest('/api/v1/prospects', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  getGivingPatterns: async (prospectId) => {
    return await apiRequest(`/api/v1/prospects/${prospectId}/giving-patterns`);
  },

  getPeerComparisons: async (prospectId) => {
    return await apiRequest(`/api/v1/prospects/${prospectId}/peer-comparison`);
  },

  updateMovesManagement: async (prospectId, movesData) => {
    return await apiRequest(`/api/v1/prospects/${prospectId}/moves`, {
      method: 'POST',
      body: JSON.stringify(movesData),
    });
  },
};

// Utility functions
export const utils = {
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  },

  calculatePercentage: (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  getDaysRemaining: (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  },
};

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};
export const registrationAPI = {
  
  // Get available roles
  getAvailableRoles: async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
    
    // Default roles if API fails
    return [
      { value: 'staff', label: 'Staff', description: 'General staff member' },
      { value: 'major_gifts', label: 'Major Gifts Officer', description: 'Manages major donor relationships' },
      { value: 'events', label: 'Events Coordinator', description: 'Manages events and campaigns' },
      { value: 'finance', label: 'Finance Manager', description: 'Handles financial operations' },
      { value: 'admin', label: 'Administrator', description: 'Full administrative access' }
    ];
  },

  // Register user - CORRECT ENDPOINT: /api/v1/auth/register
  registerUser: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Send invitation email - CORRECT ENDPOINT: /api/v1/auth/register
  // Same endpoint, but with send_invitation_email flag
  inviteUser: async (invitationData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          ...invitationData,
          send_invitation_email: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to send invitation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  },

  // Register donor (passwordless) - typically different endpoint
  registerDonor: async (donorData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/registration/donor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donorData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Donor registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering donor:', error);
      throw error;
    }
  },

  // Register organization
  registerOrganization: async (orgData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/registration/organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Organization registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering organization:', error);
      throw error;
    }
  }
};
export default {
  auth: authAPI,
  users: userAPI,
  campaigns: campaignAPI,
  donations: donationAPI,
  analytics: analyticsAPI,
  intelligence: intelligenceAPI,
  wealthScreening: wealthScreeningAPI,
  prospects: prospectAPI,
  utils,
};
