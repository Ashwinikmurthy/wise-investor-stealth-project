import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, DollarSign, Target, Heart, Award,
  Activity, Sparkles, ArrowRight, CheckCircle, Eye, Gift,
  BarChart3, Calendar, MessageCircle, Shield, Zap, Globe,
  Bell, Clock, AlertCircle, ChevronRight, TrendingDown,
  MapPin, Mail, Phone, ExternalLink, Download, Filter,
  PieChart, LineChart, Plus, Search, Folder, AlertTriangle,
  UserPlus, X, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// UT Dallas Brand Colors
const colors = {
  primary: '#E87500',
  secondary: '#154734',
  accent: '#5fe0b7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
};

const API_BASE_URL = '';

const EnhancedLandingPage = () => {
  const { user, getToken, getOrganizationId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('month'); // 'month', 'ytd', 'year'
  const [dashboardData, setDashboardData] = useState({
    missionVision: null,
    executiveDashboard: null,
    keyMetrics: {
      totalRevenue: 0,
      totalDonors: 0,
      activeDonors: 0,
      avgDonation: 0,
      retentionRate: 0,
      campaigns: 0
    }
  });

  // Real data states
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [insights, setInsights] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [okrs, setOkrs] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [analyticsMetrics, setAnalyticsMetrics] = useState(null);

  // Pending user requests states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingOkrs, setLoadingOkrs] = useState(false);

  // Check if user is admin
  const isAdmin = () => {
    if (!user) return false;
    const adminRoles = ['org_admin', 'ceo', 'superadmin', 'admin'];
    return adminRoles.includes(user.role) || user.is_superadmin;
  };

  useEffect(() => {
    if (user) {
      loadAllDashboardData();
      // Load pending requests if user is admin
      if (isAdmin()) {
        loadPendingRequests();
      }
    }
  }, [user]);

  // Reload metrics when time period changes
  useEffect(() => {
    if (user) {
      const orgId = getOrganizationId();
      if (orgId) {
        loadCoreMetrics(orgId, timePeriod);
      }
    }
  }, [timePeriod]);

  const apiCall = async (endpoint) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  // Load pending user registration requests
  const loadPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const orgId = getOrganizationId();
      if (!orgId) {
        console.error('No organization ID found');
        setPendingRequests([]);
        return;
      }

      const data = await apiCall(`/api/v1/admin/pending-requests/${orgId}?status_filter=pending`);
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Handle approval of pending request
  const handleApproveRequest = async (requestId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/approve-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          notes: null
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Request approved! User ${data.email} can now login.`);
        await loadPendingRequests();
      } else {
        const error = await response.json();
        alert(`Failed to approve: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  // Handle rejection of pending request
  const handleRejectRequest = async (requestId, email) => {
    const reason = prompt(`Enter reason for rejecting ${email}:`);
    if (!reason || reason.trim() === '') {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/reject-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          reason: reason
        })
      });

      if (response.ok) {
        alert('Request rejected successfully');
        await loadPendingRequests();
      } else {
        const error = await response.json();
        alert(`Failed to reject: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const loadAllDashboardData = async () => {
    setLoading(true);
    try {
      const orgId = getOrganizationId();
      if (!orgId) {
        console.error('No organization ID found');
        setLoading(false);
        return;
      }

      // Load analytics metrics separately and set state
      const metricsPromise = loadAnalyticsMetrics(orgId).then(metrics => {
        if (metrics) {
          setAnalyticsMetrics(metrics);
        }
      });

      await Promise.all([
        loadCoreMetrics(orgId, timePeriod),
        loadRecentActivity(orgId),
        loadTasks(orgId),
        loadInsights(orgId),
        loadHealthScore(orgId),
        loadOkrs(orgId),
        loadPrograms(orgId),
        metricsPromise
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoreMetrics = async (orgId, period = 'month') => {
    try {
      // Map our button values to API period_type values
      const periodMap = {
        'month': 'month',
        'ytd': 'ytd',
        'year': 'year'
      };
      const apiPeriod = periodMap[period] || 'month';

      // Fetch mission-vision
      const missionData = await apiCall(`/api/v1/analytics/mission-vision/${orgId}`);

      // Fetch executive dashboard with time filtering
      const execData = await apiCall(
        `/api/v1/analytics/executive-dashboard-filtered/${orgId}?period_type=${apiPeriod}`
      );

      const finalMetrics = {
        totalRevenue: execData.key_metrics?.total_revenue || 0,
        totalDonors: execData.key_metrics?.total_donors || 0,
        activeDonors: execData.key_metrics?.active_donors || 0,
        avgDonation: execData.key_metrics?.avg_gift_size || 0,
        retentionRate: execData.key_metrics?.donor_retention_rate || 0,
        campaigns: execData.active_campaigns || 0,
        growthRate: execData.comparison?.growth_rate || 0
      };

      setDashboardData({
        missionVision: missionData,
        executiveDashboard: execData,
        keyMetrics: finalMetrics
      });
    } catch (error) {
      console.error('Error loading core metrics:', error);
    }
  };

  // Load dedicated analytics metrics for insights cards
  const loadAnalyticsMetrics = async (orgId) => {
    try {
      // Call the dedicated analytics endpoints
      const [avgDonationData, retentionData, lapsedData] = await Promise.allSettled([
        apiCall(`/api/v1/analytics/avg-donation/${orgId}`),
        // Note: retention-rate requires date params, so we'll use executive dashboard for now
        apiCall(`/api/v1/analytics/executive-dashboard/${orgId}`),
        apiCall(`/api/v1/analytics/lapsed-rate/${orgId}`)
      ]);

      const metrics = {
        avgDonation: avgDonationData.status === 'fulfilled' ? avgDonationData.value.average_donation : 0,
        donationCount: avgDonationData.status === 'fulfilled' ? avgDonationData.value.donation_count : 0,
        totalRevenue: avgDonationData.status === 'fulfilled' ? avgDonationData.value.total_revenue : 0,
        retentionRate: retentionData.status === 'fulfilled' ? retentionData.value.key_metrics?.donor_retention_rate : 0,
        activeDonors: retentionData.status === 'fulfilled' ? retentionData.value.key_metrics?.active_donors : 0,
        totalDonors: retentionData.status === 'fulfilled' ? retentionData.value.key_metrics?.total_donors : 0,
        atRiskDonors: retentionData.status === 'fulfilled' ? retentionData.value.key_metrics?.at_risk_donors : 0,
        lapsedRate: lapsedData.status === 'fulfilled' ? lapsedData.value.lapsed_rate : 0,
        lapsedDonors: lapsedData.status === 'fulfilled' ? lapsedData.value.lapsed_donors : 0
      };

      return metrics;
    } catch (error) {
      console.error('Error loading analytics metrics:', error);
      return null;
    }
  };

  const loadPrograms = async (orgId) => {
    try {
      const data = await apiCall(`/api/programs/?organization_id=${orgId}`);
      setPrograms(data || []);
    } catch (error) {
      console.error('Error loading programs:', error);
      setPrograms([]);
    }
  };

  const loadRecentActivity = async (orgId) => {
    setLoadingActivity(true);
    try {
      const activities = [];

      // Fetch donations and programs in parallel for better performance
      const [donationsResult, programsResult] = await Promise.allSettled([
        apiCall(`/api/donations/?organization_id=${orgId}&limit=5`),
        apiCall(`/api/programs/?organization_id=${orgId}&limit=5`)
      ]);

      // Process donations
      if (donationsResult.status === 'fulfilled' && donationsResult.value) {
        const donations = Array.isArray(donationsResult.value)
          ? donationsResult.value
          : [];

        donations.forEach(donation => {
          if (donation.id) {
            const amount = typeof donation.amount === 'number'
              ? donation.amount
              : parseFloat(donation.amount) || 0;

            activities.push({
              id: `donation-${donation.id}`,
              type: 'donation',
              title: 'New Donation Received',
              description: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${donation.donor_name || 'Anonymous Donor'}`,
              timestamp: donation.donation_date || donation.created_at || new Date().toISOString(),
              icon: 'donation',
              status: donation.payment_status || 'completed'
            });
          }
        });
      }

      // Process programs
      if (programsResult.status === 'fulfilled' && programsResult.value) {
        const programs = Array.isArray(programsResult.value)
          ? programsResult.value
          : [];

        programs.forEach(program => {
          if (program.id) {
            const beneficiaries = program.current_beneficiaries || 0;
            const programType = program.program_type || 'Program';

            activities.push({
              id: `program-${program.id}`,
              type: 'program',
              title: program.name || 'Unnamed Program',
              description: `${programType} • ${beneficiaries.toLocaleString()} beneficiaries served`,
              timestamp: program.updated_at || program.created_at || new Date().toISOString(),
              icon: 'program',
              status: program.status || 'active'
            });
          }
        });
      }

      // Sort by timestamp (most recent first) and take top 5
      activities.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA;
      });

      const recentActivities = activities.slice(0, 5);

      console.log(`Loaded ${recentActivities.length} recent activities for org ${orgId}`);
      setRecentActivity(recentActivities);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setRecentActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  const loadTasks = async (orgId) => {
    setLoadingTasks(true);
    try {
      const data = await apiCall(`/api/v1/dashboard/tasks/${orgId}?limit=3`);
      setUpcomingTasks(data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setUpcomingTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadInsights = async (orgId) => {
    setLoadingInsights(true);
    try {
      const data = await apiCall(`/api/v1/dashboard/insights/${orgId}?limit=3`);
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsights([]);
    } finally {
      setLoadingInsights(false);
    }
  };

  const loadHealthScore = async (orgId) => {
    setLoadingHealth(true);
    try {
      const data = await apiCall(`/api/v1/dashboard/health-score/${orgId}`);
      setHealthScore(data);
    } catch (error) {
      console.error('Error loading health score:', error);
      setHealthScore(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadOkrs = async (orgId) => {
    setLoadingOkrs(true);
    try {
      // Call the real OKR API endpoint
      const data = await apiCall(`/api/v1/analytics/okrs/${orgId}?period=2025`);

      // Transform API response to match expected structure
      const transformedOkrs = data.objectives.map((obj, index) => {
        // Calculate overall progress as average of all key results
        const avgProgress = obj.key_results.reduce((sum, kr) => sum + kr.progress, 0) / obj.key_results.length;

        return {
          id: index + 1,
          objective: obj.objective,
          progress: Math.round(avgProgress),
          keyResults: obj.key_results.map(kr => {
            // Determine unit and format values based on target size
            let unit = '';
            let current = kr.current;
            let target = kr.target;

            // Check if it's a monetary value (> 100,000) or percentage (target ~100)
            if (kr.target >= 100000) {
              // Convert to millions for display
              unit = 'M';
              current = (kr.current / 1000000).toFixed(1);
              target = (kr.target / 1000000).toFixed(1);
            } else if (kr.target >= 75 && kr.target <= 100 && kr.current >= 0 && kr.current <= 100) {
              // Likely a percentage
              unit = '%';
            }

            return {
              name: kr.kr,
              current: typeof current === 'number' ? current : parseFloat(current),
              target: typeof target === 'number' ? target : parseFloat(target),
              unit: unit
            };
          })
        };
      });

      setOkrs(transformedOkrs);
    } catch (error) {
      console.error('Error loading OKRs:', error);
      setOkrs([]);
    } finally {
      setLoadingOkrs(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getIconForActivityType = (type) => {
    switch (type) {
      case 'donation':
        return <DollarSign size={18} color={colors.success} />;
      case 'donor':
        return <Users size={18} color={colors.info} />;
      case 'campaign':
        return <Target size={18} color={colors.primary} />;
      case 'program':
        return <Folder size={18} color={colors.purple} />;
      default:
        return <Activity size={18} color={colors.gray[600]} />;
    }
  };

  const getIconForInsightType = (type) => {
    switch (type) {
      case 'success':
        return <TrendingUp size={16} color={colors.success} />;
      case 'warning':
        return <AlertCircle size={16} color={colors.warning} />;
      case 'danger':
        return <AlertTriangle size={16} color={colors.danger} />;
      default:
        return <Target size={16} color={colors.info} />;
    }
  };

  // Analytics Insights - using dedicated analytics endpoints
  const getAnalyticsInsights = () => {
    if (!analyticsMetrics) return [];

    const retentionRate = analyticsMetrics.retentionRate || 0;
    const activeDonors = analyticsMetrics.activeDonors || 0;
    const totalDonors = analyticsMetrics.totalDonors || 0;
    const atRiskDonors = analyticsMetrics.atRiskDonors || 0;
    const lapsedRate = analyticsMetrics.lapsedRate || 0;
    const totalRevenue = analyticsMetrics.totalRevenue || 0;
    const prevRevenue = dashboardData.executiveDashboard?.comparison?.prev_period_revenue || totalRevenue * 0.9; // Fallback
    const growthRate = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;

    return [
      {
        icon: <TrendingUp size={28} />,
        title: `${retentionRate.toFixed(1)}%`,
        label: 'Donor Retention Rate',
        status: retentionRate >= 70 ? 'excellent' : retentionRate >= 60 ? 'good' : 'needs-attention',
        statusText: retentionRate >= 70 ? 'Excellent' : retentionRate >= 60 ? 'Good' : 'Needs Attention',
        color: retentionRate >= 70 ? colors.success : retentionRate >= 60 ? colors.info : colors.warning,
        trend: retentionRate >= 60 ? 'up' : 'down',
        source: '/api/v1/analytics/retention-rate'
      },
      {
        icon: <Users size={28} />,
        title: activeDonors.toLocaleString(),
        label: 'Active Donors',
        status: activeDonors > 100 ? 'strong' : activeDonors > 50 ? 'moderate' : 'low',
        statusText: totalDonors > 0 ? `${((activeDonors / totalDonors) * 100).toFixed(1)}% of total` : 'No data',
        color: activeDonors > 100 ? colors.success : activeDonors > 50 ? colors.info : colors.warning,
        trend: 'neutral',
        source: '/api/v1/analytics/executive-dashboard'
      },
      {
        icon: <DollarSign size={28} />,
        title: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
        label: 'Revenue Growth',
        status: growthRate >= 10 ? 'strong' : growthRate >= 0 ? 'positive' : 'declining',
        statusText: growthRate >= 10 ? 'Strong Growth' : growthRate >= 0 ? 'Positive' : 'Declining',
        color: growthRate >= 10 ? colors.success : growthRate >= 0 ? colors.info : colors.danger,
        trend: growthRate >= 0 ? 'up' : 'down',
        source: '/api/v1/analytics/avg-donation'
      },
      {
        icon: <AlertCircle size={28} />,
        title: atRiskDonors.toLocaleString(),
        label: 'At-Risk Donors',
        status: atRiskDonors > 20 ? 'high' : atRiskDonors > 10 ? 'medium' : 'low',
        statusText: 'Need Outreach',
        color: atRiskDonors > 20 ? colors.danger : atRiskDonors > 10 ? colors.warning : colors.success,
        trend: 'alert',
        source: '/api/v1/analytics/executive-dashboard'
      },
    ];
  };

  const analyticsInsights = getAnalyticsInsights();

  // Notification Bell Component
  const NotificationBell = () => {
    const notificationCount = pendingRequests.length;

    return (
      <div style={styles.notificationContainer}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={styles.notificationButton}
          className="notification-button"
        >
          <Bell size={20} color={colors.gray[600]} />
          {notificationCount > 0 && (
            <span style={styles.notificationBadge}>
              {notificationCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div style={styles.notificationDropdown}>
            <div style={styles.notificationHeader}>
              <h3 style={styles.notificationTitle}>
                Pending User Requests
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                style={styles.closeButton}
                className="close-button"
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.notificationList}>
              {loadingRequests ? (
                <div style={styles.notificationEmpty}>
                  <Activity size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  <p>Loading requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div style={styles.notificationEmpty}>
                  <UserPlus size={32} color={colors.gray[400]} />
                  <p style={styles.emptyText}>No pending requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} style={styles.notificationItem}>
                    <div style={styles.requestInfo}>
                      <div style={styles.requestIcon}>
                        <UserPlus size={18} color={colors.primary} />
                      </div>
                      <div style={styles.requestDetails}>
                        <p style={styles.requestEmail}>{request.email}</p>
                        <p style={styles.requestName}>
                          {request.first_name} {request.last_name}
                        </p>
                        <p style={styles.requestRole}>
                          Role: <span style={styles.roleBadge}>{request.role}</span>
                        </p>
                        {request.job_title && (
                          <p style={styles.requestJobTitle}>
                            {request.job_title}
                            {request.department && ` • ${request.department}`}
                          </p>
                        )}
                        {request.requested_at && (
                          <p style={styles.requestDate}>
                            <Clock size={12} />
                            Requested: {new Date(request.requested_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={styles.requestActions}>
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        style={styles.approveButton}
                        className="approve-button"
                        title="Approve request"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id, request.email)}
                        style={styles.rejectButton}
                        className="reject-button"
                        title="Reject request"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {pendingRequests.length > 0 && (
              <div style={styles.notificationFooter}>
                <button
                  onClick={() => {
                    navigate('/users');
                    setShowNotifications(false);
                  }}
                  style={styles.viewAllButton2}
                >
                  Manage All Users
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Enhanced Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <div style={styles.heroTop}>
            <div style={styles.heroLeft}>
              <div style={styles.welcomeBadge}>
                <Sparkles size={16} />
                <span>{getGreeting()}</span>
              </div>
              <h1 style={styles.heroTitle}>
                Welcome back, <span style={styles.heroName}>{user?.full_name || 'User'}</span>
              </h1>
              <p style={styles.heroSubtitle}>
                Here's what's happening with your organization today
              </p>

              {/* Quick Stats Cards */}
              <div style={styles.quickStatsGrid}>
                <div style={styles.quickStatCard} className="quick-stat-card">
                  <div style={styles.quickStatIcon}>
                    <DollarSign size={20} />
                  </div>
                  <div style={styles.quickStatContent}>
                    <div style={styles.quickStatValue}>
                      {formatCurrency(dashboardData.keyMetrics.totalRevenue)}
                    </div>
                    <div style={styles.quickStatLabel}>Total Revenue</div>
                  </div>
                </div>

                <div style={styles.quickStatCard} className="quick-stat-card">
                  <div style={{...styles.quickStatIcon, background: `${colors.success}15`}}>
                    <Users size={20} color={colors.success} />
                  </div>
                  <div style={styles.quickStatContent}>
                    <div style={styles.quickStatValue}>
                      {formatNumber(dashboardData.keyMetrics.totalDonors)}
                    </div>
                    <div style={styles.quickStatLabel}>Total Donors</div>
                  </div>
                </div>

                <div style={styles.quickStatCard} className="quick-stat-card">
                  <div style={{...styles.quickStatIcon, background: `${colors.info}15`}}>
                    <Activity size={20} color={colors.info} />
                  </div>
                  <div style={styles.quickStatContent}>
                    <div style={styles.quickStatValue}>
                      {formatNumber(dashboardData.keyMetrics.activeDonors)}
                    </div>
                    <div style={styles.quickStatLabel}>Active Donors</div>
                  </div>
                </div>

                <div style={styles.quickStatCard} className="quick-stat-card">
                  <div style={{...styles.quickStatIcon, background: `${colors.purple}15`}}>
                    <Target size={20} color={colors.purple} />
                  </div>
                  <div style={styles.quickStatContent}>
                    <div style={styles.quickStatValue}>
                      {formatNumber(dashboardData.keyMetrics.campaigns)}
                    </div>
                    <div style={styles.quickStatLabel}>Active Campaigns</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.heroRight}>
              <NotificationBell />
            </div>
          </div>

          {/* Analytics Insights */}
          <div style={styles.insightsGrid}>
            {analyticsInsights.map((insight, index) => (
              <div
                key={index}
                style={styles.insightCard}
                className="insight-card"
              >
                <div style={{...styles.insightIconWrapper, backgroundColor: `${insight.color}15`}}>
                  {React.cloneElement(insight.icon, { color: insight.color, strokeWidth: 2.5 })}
                </div>
                <div style={styles.insightContent}>
                  <div style={styles.insightValue}>
                    {insight.title}
                    {insight.trend === 'up' && (
                      <TrendingUp size={20} color={colors.success} style={{ marginLeft: '8px' }} />
                    )}
                    {insight.trend === 'down' && (
                      <TrendingDown size={20} color={colors.danger} style={{ marginLeft: '8px' }} />
                    )}
                  </div>
                  <div style={styles.insightLabel}>{insight.label}</div>
                  <div style={{
                    ...styles.insightStatus,
                    color: insight.color,
                    backgroundColor: `${insight.color}10`
                  }}>
                    {insight.statusText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Performance Metrics Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Performance Metrics</h2>
            <div style={styles.metricsTabs}>
              <button
                style={timePeriod === 'month' ? styles.metricsTabActive : styles.metricsTab}
                onClick={() => setTimePeriod('month')}
              >
                This Month
              </button>
              <button
                style={timePeriod === 'ytd' ? styles.metricsTabActive : styles.metricsTab}
                onClick={() => setTimePeriod('ytd')}
              >
                YTD
              </button>
              <button
                style={timePeriod === 'year' ? styles.metricsTabActive : styles.metricsTab}
                onClick={() => setTimePeriod('year')}
              >
                Full Year
              </button>
            </div>
          </div>

          <div style={styles.metricsCardsGrid}>
            {/* Revenue Metric */}
            <div style={styles.metricCardEnhanced} className="metric-card-enhanced">
              <div style={styles.metricCardHeader}>
                <div style={styles.metricCardTop}>
                  <div style={{...styles.metricCardIcon, background: `${colors.primary}15`}}>
                    <DollarSign size={20} color={colors.primary} />
                  </div>
                  <div style={styles.metricBadge}>
                    <TrendingUp size={12} />
                    <span>+{dashboardData.keyMetrics.growthRate}%</span>
                  </div>
                </div>
                <div style={styles.metricCardLabel}>Total Revenue</div>
                <div style={styles.metricCardValue}>
                  {formatCurrency(dashboardData.keyMetrics.totalRevenue)}
                </div>
                <div style={styles.metricCardSubtext}>
                  Avg: {formatCurrency(dashboardData.keyMetrics.avgDonation)} per gift
                </div>
              </div>
              <div style={styles.miniChart}>
                <svg width="100%" height="60" viewBox="0 0 200 60">
                  <path
                    d="M 0 50 Q 50 20, 100 30 T 200 10"
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <path
                    d="M 0 50 Q 50 20, 100 30 T 200 10 L 200 60 L 0 60 Z"
                    fill={`${colors.primary}20`}
                  />
                </svg>
              </div>
            </div>

            {/* Donors Metric */}
            <div style={styles.metricCardEnhanced} className="metric-card-enhanced">
              <div style={styles.metricCardHeader}>
                <div style={styles.metricCardTop}>
                  <div style={{...styles.metricCardIcon, background: `${colors.success}15`}}>
                    <Users size={20} color={colors.success} />
                  </div>
                  <div style={{...styles.metricBadge, background: `${colors.success}15`, color: colors.success}}>
                    <Activity size={12} />
                    <span>Active</span>
                  </div>
                </div>
                <div style={styles.metricCardLabel}>Total Donors</div>
                <div style={styles.metricCardValue}>
                  {formatNumber(dashboardData.keyMetrics.totalDonors)}
                </div>
                <div style={styles.metricCardSubtext}>
                  {formatNumber(dashboardData.keyMetrics.activeDonors)} active this {timePeriod === 'month' ? 'month' : 'year'}
                </div>
              </div>
              <div style={styles.miniChart}>
                <svg width="100%" height="60" viewBox="0 0 200 60">
                  <path
                    d="M 0 40 L 40 35 L 80 28 L 120 30 L 160 20 L 200 15"
                    fill="none"
                    stroke={colors.success}
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <path
                    d="M 0 40 L 40 35 L 80 28 L 120 30 L 160 20 L 200 15 L 200 60 L 0 60 Z"
                    fill={`${colors.success}20`}
                  />
                </svg>
              </div>
            </div>

            {/* Retention Rate */}
            <div style={styles.metricCardEnhanced} className="metric-card-enhanced">
              <div style={styles.metricCardHeader}>
                <div style={styles.metricCardTop}>
                  <div style={{...styles.metricCardIcon, background: `${colors.info}15`}}>
                    <Award size={20} color={colors.info} />
                  </div>
                  <div style={{...styles.metricBadge, background: `${colors.info}15`, color: colors.info}}>
                    <TrendingUp size={12} />
                    <span>Excellent</span>
                  </div>
                </div>
                <div style={styles.metricCardLabel}>Retention Rate</div>
                <div style={styles.metricCardValue}>
                  {dashboardData.keyMetrics.retentionRate}%
                </div>
                <div style={styles.metricCardSubtext}>
                  Industry avg: 65%
                </div>
              </div>
              <div style={styles.miniChart}>
                <svg width="100%" height="60" viewBox="0 0 200 60">
                  <path
                    d="M 0 45 L 50 42 L 100 38 L 150 35 L 200 30"
                    fill="none"
                    stroke={colors.info}
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <path
                    d="M 0 45 L 50 42 L 100 38 L 150 35 L 200 30 L 200 60 L 0 60 Z"
                    fill={`${colors.info}20`}
                  />
                </svg>
              </div>
            </div>

            {/* Programs */}
            <div style={styles.metricCardEnhanced} className="metric-card-enhanced">
              <div style={styles.metricCardHeader}>
                <div style={styles.metricCardTop}>
                  <div style={{...styles.metricCardIcon, background: `${colors.purple}15`}}>
                    <Folder size={20} color={colors.purple} />
                  </div>
                  <div style={{...styles.metricBadge, background: `${colors.purple}15`, color: colors.purple}}>
                    <Activity size={12} />
                    <span>Active</span>
                  </div>
                </div>
                <div style={styles.metricCardLabel}>Programs</div>
                <div style={styles.metricCardValue}>
                  {formatNumber(programs.length)}
                </div>
                <div style={styles.metricCardSubtext}>
                  Serving {formatNumber(programs.reduce((sum, p) => sum + (p.current_beneficiaries || 0), 0))} beneficiaries
                </div>
              </div>
              <div style={styles.miniChart}>
                <svg width="100%" height="60" viewBox="0 0 200 60">
                  <path
                    d="M 0 48 L 50 44 L 100 40 L 150 38 L 200 35"
                    fill="none"
                    stroke={colors.purple}
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <path
                    d="M 0 48 L 50 44 L 100 40 L 150 38 L 200 35 L 200 60 L 0 60 Z"
                    fill={`${colors.purple}20`}
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* OKRs Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Target size={24} style={{ marginRight: '12px' }} />
              Objectives & Key Results (OKRs)
            </h2>
            <button style={styles.viewAllButton} onClick={() => navigate('/okrs')}>
              View All
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={styles.okrsGrid}>
            {okrs.map((okr) => (
              <div key={okr.id} style={styles.okrCard}>
                <div style={styles.okrHeader}>
                  <h3 style={styles.okrObjective}>{okr.objective}</h3>
                  <div style={styles.okrProgress}>
                    <span style={styles.okrProgressText}>{okr.progress}%</span>
                  </div>
                </div>

                <div style={styles.okrProgressBar}>
                  <div
                    style={{
                      ...styles.okrProgressFill,
                      width: `${okr.progress}%`,
                      backgroundColor: okr.progress >= 75 ? colors.success : okr.progress >= 50 ? colors.warning : colors.danger
                    }}
                  />
                </div>

                <div style={styles.keyResultsList}>
                  {okr.keyResults.map((kr, idx) => (
                    <div key={idx} style={styles.keyResultItem}>
                      <CheckCircle
                        size={16}
                        color={kr.current >= kr.target ? colors.success : colors.gray[400]}
                      />
                      <div style={styles.keyResultContent}>
                        <div style={styles.keyResultName}>{kr.name}</div>
                        <div style={styles.keyResultValue}>
                          {kr.current}{kr.unit} / {kr.target}{kr.unit}
                        </div>
                      </div>
                      <div style={styles.keyResultProgress}>
                        {Math.round((kr.current / kr.target) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Two Column Layout */}
        <div style={styles.twoColumnGrid}>
          {/* Recent Activity */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderLeft}>
                <Activity size={20} color={colors.primary} />
                <h3 style={styles.cardTitle}>Recent Activity</h3>
              </div>
              <button style={styles.viewAllButton} onClick={() => navigate('/activity')}>
                View All
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={styles.activityList}>
              {loadingActivity ? (
                <div style={styles.loadingText}>Loading activities...</div>
              ) : recentActivity.length === 0 ? (
                <div style={styles.emptyState}>
                  <Activity size={48} color={colors.gray[300]} />
                  <p style={styles.emptyStateText}>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} style={styles.activityItem} className="activity-item">
                    <div style={styles.activityIcon}>
                      {getIconForActivityType(activity.type)}
                    </div>
                    <div style={styles.activityContent}>
                      <div style={styles.activityTitle}>{activity.title}</div>
                      <div style={styles.activityDescription}>{activity.description}</div>
                      <div style={styles.activityTime}>
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Tasks & Insights Column */}
          <div style={styles.rightColumn}>
            {/* Upcoming Tasks */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <CheckCircle size={20} color={colors.success} />
                  <h3 style={styles.cardTitle}>Upcoming Tasks</h3>
                </div>
                <button style={styles.addButton} onClick={() => navigate('/tasks/new')}>
                  <Plus size={16} />
                </button>
              </div>

              <div style={styles.tasksList}>
                {loadingTasks ? (
                  <div style={styles.loadingText}>Loading tasks...</div>
                ) : upcomingTasks.length === 0 ? (
                  <div style={styles.emptyState}>
                    <CheckCircle size={48} color={colors.gray[300]} />
                    <p style={styles.emptyStateText}>No upcoming tasks</p>
                  </div>
                ) : (
                  upcomingTasks.map((task) => (
                    <div key={task.id} style={styles.taskItem}>
                      <div style={styles.taskCheckbox}></div>
                      <div style={styles.taskContent}>
                        <div style={styles.taskTitle}>{task.title}</div>
                        <div style={styles.taskMeta}>
                          <Clock size={12} />
                          <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div style={{
                        ...styles.taskPriority,
                        backgroundColor: task.priority === 'high' ? `${colors.danger}15` : `${colors.warning}15`,
                        color: task.priority === 'high' ? colors.danger : colors.warning
                      }}>
                        {task.priority}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Insights */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <Sparkles size={20} color={colors.info} />
                  <h3 style={styles.cardTitle}>AI Insights</h3>
                </div>
              </div>

              <div style={styles.insightsList}>
                {loadingInsights ? (
                  <div style={styles.loadingText}>Loading insights...</div>
                ) : insights.length === 0 ? (
                  <div style={styles.emptyState}>
                    <Sparkles size={48} color={colors.gray[300]} />
                    <p style={styles.emptyStateText}>No insights available</p>
                  </div>
                ) : (
                  insights.map((insight) => (
                    <div key={insight.id} style={styles.insightItem}>
                      <div style={{
                        ...styles.insightIcon,
                        backgroundColor: insight.type === 'success' ? `${colors.success}15` :
                                       insight.type === 'warning' ? `${colors.warning}15` : `${colors.info}15`
                      }}>
                        {getIconForInsightType(insight.type)}
                      </div>
                      <div style={styles.insightContent}>
                        <p style={styles.insightText}>{insight.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Health Score */}
            {healthScore && (
              <section style={styles.healthScoreCard}>
                <div style={styles.healthScoreHeader}>
                  <h3 style={styles.healthScoreTitle}>Organization Health</h3>
                  <Shield size={20} />
                </div>
                <div style={styles.healthScoreValue}>{healthScore.score}</div>
                <div style={styles.healthScoreLabel}>{healthScore.status}</div>
                <div style={styles.healthScoreBar}>
                  <div
                    style={{
                      ...styles.healthScoreProgress,
                      width: `${healthScore.score}%`,
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                <div style={styles.healthScoreDetails}>
                  <div style={styles.healthScoreDetail}>
                    <span>Revenue Health:</span>
                    <span>
                      {healthScore.components?.revenue_health?.score
                        ? `${healthScore.components.revenue_health.score}/${healthScore.components.revenue_health.max_score}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.healthScoreDetail}>
                    <span>Engagement:</span>
                    <span>
                      {healthScore.components?.donor_engagement?.score
                        ? `${healthScore.components.donor_engagement.score}/${healthScore.components.donor_engagement.max_score}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.healthScoreDetail}>
                    <span>Operations:</span>
                    <span>
                      {healthScore.components?.donor_retention?.score
                        ? `${healthScore.components.donor_retention.score}/${healthScore.components.donor_retention.max_score}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Mission & Vision Section */}
        {dashboardData.missionVision && (
          <section style={styles.missionVisionSection}>
            <div style={styles.missionVisionContainer}>
              {/* Mission Card */}
              <div style={styles.missionVisionCard} className="mission-vision-card">
                <div style={styles.missionVisionHeader}>
                  <div style={styles.missionVisionIconWrapper}>
                    <Target size={28} color={colors.primary} />
                  </div>
                  <h2 style={styles.missionVisionTitle}>Our Mission</h2>
                </div>
                <div style={styles.missionVisionContent}>
                  <p style={styles.missionVisionText}>
                    {dashboardData.missionVision.mission || "Empowering communities through sustainable impact and meaningful change."}
                  </p>
                  {dashboardData.missionVision.core_values && dashboardData.missionVision.core_values.length > 0 && (
                    <div style={styles.valuesContainer}>
                      <h4 style={styles.valuesTitle}>Core Values</h4>
                      <div style={styles.valuesList}>
                        {dashboardData.missionVision.core_values.slice(0, 4).map((value, index) => (
                          <div key={index} style={styles.valueChip}>
                            <CheckCircle size={14} color={colors.success} />
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vision Card */}
              <div style={styles.missionVisionCard} className="mission-vision-card">
                <div style={styles.missionVisionHeader}>
                  <div style={styles.missionVisionIconWrapper}>
                    <Eye size={28} color={colors.secondary} />
                  </div>
                  <h2 style={styles.missionVisionTitle}>Our Vision</h2>
                </div>
                <div style={styles.missionVisionContent}>
                  <p style={styles.missionVisionText}>
                    {dashboardData.missionVision.vision || "Creating a world where every individual has access to opportunities that transform lives."}
                  </p>
                  {dashboardData.missionVision.strategic_goals && dashboardData.missionVision.strategic_goals.length > 0 && (
                    <div style={styles.valuesContainer}>
                      <h4 style={styles.valuesTitle}>Strategic Goals</h4>
                      <div style={styles.goalsList}>
                        {dashboardData.missionVision.strategic_goals.slice(0, 3).map((goal, index) => (
                          <div key={index} style={styles.goalItem}>
                            <div style={styles.goalNumber}>{index + 1}</div>
                            <span style={styles.goalText}>{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Impact Stats Banner */}
              {dashboardData.missionVision.impact_summary && (
                <div style={styles.impactBanner}>
                  <div style={styles.impactBannerHeader}>
                    <Heart size={24} color={colors.primary} />
                    <h3 style={styles.impactBannerTitle}>Our Impact</h3>
                  </div>
                  <div style={styles.impactStatsGrid}>
                    {dashboardData.missionVision.impact_summary.total_beneficiaries && (
                      <div style={styles.impactStat}>
                        <div style={styles.impactStatValue}>
                          {formatNumber(dashboardData.missionVision.impact_summary.total_beneficiaries)}
                        </div>
                        <div style={styles.impactStatLabel}>Lives Touched</div>
                      </div>
                    )}
                    {dashboardData.missionVision.impact_summary.programs_active && (
                      <div style={styles.impactStat}>
                        <div style={styles.impactStatValue}>
                          {dashboardData.missionVision.impact_summary.programs_active}
                        </div>
                        <div style={styles.impactStatLabel}>Active Programs</div>
                      </div>
                    )}
                    {dashboardData.missionVision.impact_summary.communities_served && (
                      <div style={styles.impactStat}>
                        <div style={styles.impactStatValue}>
                          {dashboardData.missionVision.impact_summary.communities_served}
                        </div>
                        <div style={styles.impactStatLabel}>Communities Served</div>
                      </div>
                    )}
                    {dashboardData.missionVision.impact_summary.volunteer_hours && (
                      <div style={styles.impactStat}>
                        <div style={styles.impactStatValue}>
                          {formatNumber(dashboardData.missionVision.impact_summary.volunteer_hours)}
                        </div>
                        <div style={styles.impactStatLabel}>Volunteer Hours</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Styles object
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.gray[50],
  },

  // Loading Styles
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: colors.gray[50],
  },
  loader: {
    width: '48px',
    height: '48px',
    border: `4px solid ${colors.gray[200]}`,
    borderTop: `4px solid ${colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    fontSize: '16px',
    color: colors.gray[600],
  },

  // Hero Section
  hero: {
    position: 'relative',
    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
    padding: '48px 80px',
    color: '#ffffff',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.4,
  },
  heroContent: {
    position: 'relative',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  heroLeft: {
    flex: 1,
  },
  heroRight: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  welcomeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  heroTitle: {
    fontSize: '42px',
    fontWeight: '800',
    marginBottom: '12px',
    lineHeight: '1.2',
  },
  heroName: {
    color: colors.accent,
  },
  heroSubtitle: {
    fontSize: '18px',
    opacity: 0.9,
    marginBottom: '32px',
  },

  // Quick Stats Grid
  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  quickStatCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
  },
  quickStatIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: `${colors.primary}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickStatContent: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '4px',
  },
  quickStatLabel: {
    fontSize: '13px',
    opacity: 0.9,
  },

  // Analytics Insights
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginTop: '24px',
  },
  insightCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  },
  insightIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  insightContent: {
    textAlign: 'center',
    width: '100%',
  },
  insightValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  insightStatus: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '8px',
    display: 'inline-block',
  },

  // Main Content
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '48px 80px',
  },

  // Section Styles
  section: {
    marginBottom: '48px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: colors.secondary,
    display: 'flex',
    alignItems: 'center',
  },

  // Metrics Tabs
  metricsTabs: {
    display: 'flex',
    gap: '8px',
    padding: '4px',
    backgroundColor: colors.gray[100],
    borderRadius: '12px',
  },
  metricsTab: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.gray[600],
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  metricsTabActive: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#ffffff',
    color: colors.primary,
    fontSize: '14px',
    fontWeight: '700',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },

  // Metrics Cards
  metricsCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
  },
  metricCardEnhanced: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    border: '2px solid transparent',
    transition: 'all 0.3s ease',
  },
  metricCardHeader: {
    marginBottom: '16px',
  },
  metricCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  metricCardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: `${colors.primary}15`,
    color: colors.primary,
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: '700',
  },
  metricCardLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  metricCardValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: '4px',
  },
  metricCardSubtext: {
    fontSize: '13px',
    color: colors.gray[600],
  },
  miniChart: {
    marginTop: '16px',
    height: '60px',
  },

  // OKRs Section
  okrsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  okrCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    border: `2px solid ${colors.gray[100]}`,
  },
  okrHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  okrObjective: {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.gray[900],
    flex: 1,
  },
  okrProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  okrProgressText: {
    fontSize: '20px',
    fontWeight: '800',
    color: colors.primary,
  },
  okrProgressBar: {
    height: '8px',
    backgroundColor: colors.gray[100],
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  okrProgressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  keyResultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  keyResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: colors.gray[50],
    borderRadius: '10px',
  },
  keyResultContent: {
    flex: 1,
  },
  keyResultName: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: '4px',
  },
  keyResultValue: {
    fontSize: '12px',
    color: colors.gray[600],
  },
  keyResultProgress: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.gray[900],
  },

  // Two Column Grid
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px',
    marginBottom: '48px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  // Card Styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${colors.gray[100]}`,
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.gray[900],
    margin: 0,
  },
  viewAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: 'none',
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  addButton: {
    width: '36px',
    height: '36px',
    border: 'none',
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },

  // Activity List
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },
  activityIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: colors.gray[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: '4px',
  },
  activityDescription: {
    fontSize: '13px',
    color: colors.gray[600],
    marginBottom: '4px',
  },
  activityTime: {
    fontSize: '12px',
    color: colors.gray[500],
  },

  // Tasks List
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: colors.gray[50],
    borderRadius: '10px',
  },
  taskCheckbox: {
    width: '20px',
    height: '20px',
    border: `2px solid ${colors.gray[300]}`,
    borderRadius: '6px',
    flexShrink: 0,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: '4px',
  },
  taskMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: colors.gray[600],
  },
  taskPriority: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    flexShrink: 0,
  },

  // Insights
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  insightItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: colors.gray[50],
    borderRadius: '10px',
  },
  insightIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: '13px',
    color: colors.gray[700],
    lineHeight: '1.5',
  },

  // Health Score Card
  healthScoreCard: {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    borderRadius: '16px',
    padding: '24px',
    color: '#ffffff',
  },
  healthScoreHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  healthScoreTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0,
  },
  healthScoreValue: {
    fontSize: '48px',
    fontWeight: '800',
    marginBottom: '4px',
    textAlign: 'center',
  },
  healthScoreLabel: {
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '20px',
    opacity: 0.9,
  },
  healthScoreBar: {
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  healthScoreProgress: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 1s ease',
  },
  healthScoreDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  healthScoreDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    opacity: 0.9,
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: '14px',
    color: colors.gray[500],
    marginTop: '12px',
  },

  // Mission & Vision Section
  missionVisionSection: {
    padding: '48px 0',
    backgroundColor: colors.gray[50],
    marginLeft: '-80px',
    marginRight: '-80px',
    paddingLeft: '80px',
    paddingRight: '80px',
  },
  missionVisionContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginBottom: '32px',
  },
  missionVisionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
  },
  missionVisionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: `2px solid ${colors.gray[100]}`,
  },
  missionVisionIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: `${colors.primary}10`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionVisionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
  },
  missionVisionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  missionVisionText: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: colors.gray[700],
    margin: 0,
  },
  valuesContainer: {
    marginTop: '8px',
  },
  valuesTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '16px',
  },
  valuesList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  valueChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: `${colors.success}08`,
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[700],
    border: `1px solid ${colors.success}20`,
  },
  goalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  goalItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: `${colors.secondary}05`,
    borderRadius: '10px',
    border: `1px solid ${colors.secondary}15`,
  },
  goalNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: colors.secondary,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  goalText: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: colors.gray[700],
    fontWeight: '500',
  },
  impactBanner: {
    gridColumn: '1 / -1',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '32px 40px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: `2px solid ${colors.primary}20`,
  },
  impactBannerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  impactBannerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
  },
  impactStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
  },
  impactStat: {
    textAlign: 'center',
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: colors.gray[50],
  },
  impactStatValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: colors.primary,
    marginBottom: '8px',
  },
  impactStatLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Notification Styles
  notificationContainer: {
    position: 'relative',
  },
  notificationButton: {
    position: 'relative',
    padding: '12px',
    backgroundColor: colors.gray[100],
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: colors.danger,
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '60px',
    right: '0',
    width: '400px',
    maxHeight: '500px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    border: `1px solid ${colors.gray[200]}`,
    zIndex: 1000,
    overflow: 'hidden',
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: `1px solid ${colors.gray[200]}`,
  },
  notificationTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
  },
  closeButton: {
    padding: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.gray[600],
    transition: 'all 0.2s ease',
  },
  notificationList: {
    maxHeight: '350px',
    overflowY: 'auto',
  },
  notificationEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
  },
  emptyText: {
    fontSize: '14px',
    color: colors.gray[500],
    margin: 0,
  },
  notificationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.gray[100]}`,
    transition: 'background-color 0.2s ease',
  },
  requestInfo: {
    display: 'flex',
    gap: '12px',
    flex: 1,
  },
  requestIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: `${colors.primary}10`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  requestDetails: {
    flex: 1,
  },
  requestEmail: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.secondary,
    margin: '0 0 2px 0',
  },
  requestName: {
    fontSize: '13px',
    color: colors.gray[700],
    margin: '0 0 4px 0',
    fontWeight: '500',
  },
  requestRole: {
    fontSize: '12px',
    color: colors.gray[600],
    margin: '0 0 4px 0',
  },
  requestJobTitle: {
    fontSize: '11px',
    color: colors.gray[500],
    margin: '0 0 4px 0',
  },
  roleBadge: {
    padding: '2px 8px',
    backgroundColor: `${colors.info}15`,
    color: colors.info,
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  requestDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: colors.gray[500],
    margin: 0,
  },
  requestActions: {
    display: 'flex',
    gap: '8px',
  },
  approveButton: {
    padding: '8px',
    backgroundColor: `${colors.success}10`,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: colors.success,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  rejectButton: {
    padding: '8px',
    backgroundColor: `${colors.danger}10`,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: colors.danger,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  notificationFooter: {
    padding: '16px 20px',
    borderTop: `1px solid ${colors.gray[200]}`,
  },
  viewAllButton2: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: colors.primary,
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .insight-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    border-color: ${colors.primary}40;
  }

  .metric-card-enhanced:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: ${colors.primary};
  }

  .activity-item:hover {
    background-color: ${colors.gray[100]};
    cursor: pointer;
  }

  .view-all-button:hover {
    background-color: ${colors.gray[200]};
  }

  .add-button:hover {
    background-color: ${colors.gray[200]};
    color: ${colors.primary};
  }

  .quick-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .mission-vision-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border-color: ${colors.primary};
  }

  .notification-button:hover {
    background-color: ${colors.gray[200]};
  }

  .close-button:hover {
    background-color: ${colors.gray[100]};
  }

  .approve-button:hover {
    background-color: ${colors.success}20;
  }

  .reject-button:hover {
    background-color: ${colors.danger}20;
  }
`;
document.head.appendChild(styleSheet);

export default EnhancedLandingPage;