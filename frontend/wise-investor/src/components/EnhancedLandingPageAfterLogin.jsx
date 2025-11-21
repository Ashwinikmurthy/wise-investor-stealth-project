import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, DollarSign, Target, Heart, Award,
  Activity, Sparkles, ArrowRight, CheckCircle, Eye, Gift,
  BarChart3, Calendar, MessageCircle, Shield, Zap, Globe,
  Bell, Clock, AlertCircle, ChevronRight, TrendingDown,
  MapPin, Mail, Phone, ExternalLink, Download, Filter,
  PieChart, LineChart, Plus, Search, Folder, AlertTriangle,
  UserPlus, X, Check, Play, Send, FileText, Megaphone,
  Star, Layers, CircleDot, CreditCard, Building, User
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
  const [timePeriod, setTimePeriod] = useState('month');
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
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [swotData, setSwotData] = useState([]);

  // Modal states
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [recentDonors, setRecentDonors] = useState([]);
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Pending user requests states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Consolidated loading states
  const [loadingStates, setLoadingStates] = useState({
    requests: false,
    activity: false,
    tasks: false,
    insights: false,
    health: false,
    okrs: false,
    programs: false,
    deadlines: false
  });

  const setLoadingState = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Check if user is admin
  const isAdmin = () => {
    if (!user) return false;
    const adminRoles = ['org_admin', 'ceo', 'superadmin', 'admin'];
    return adminRoles.includes(user.role) || user.is_superadmin;
  };

  useEffect(() => {
    if (user) {
      loadAllDashboardData();
      if (isAdmin()) {
        loadPendingRequests();
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const orgId = getOrganizationId();
      if (orgId) {
        loadCoreMetrics(orgId, timePeriod);
      }
    }
  }, [timePeriod]);

  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  const loadPendingRequests = async () => {
    setLoadingState('requests', true);
    try {
      const orgId = getOrganizationId();
      if (!orgId) {
        setPendingRequests([]);
        return;
      }
      const data = await apiCall(`/api/v1/admin/pending-requests/${orgId}?status_filter=pending`);
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]);
    } finally {
      setLoadingState('requests', false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/approve-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_id: requestId, notes: null })
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

  const handleRejectRequest = async (requestId, email) => {
    const reason = prompt(`Enter reason for rejecting ${email}:`);
    if (!reason || reason.trim() === '') return;

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/reject-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_id: requestId, reason: reason })
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
        setLoading(false);
        return;
      }

      const metricsPromise = loadAnalyticsMetrics(orgId).then(metrics => {
        if (metrics) setAnalyticsMetrics(metrics);
      });

      await Promise.all([
        loadCoreMetrics(orgId, timePeriod),
        loadRecentActivity(orgId),
        loadTasks(orgId),
        loadInsights(orgId),
        loadHealthScore(orgId),
        loadOkrs(orgId),
        loadPrograms(orgId),
        loadUpcomingDeadlines(orgId),
        loadSwotAnalysis(orgId),
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
      const periodMap = { 'month': 'month', 'ytd': 'ytd', 'year': 'year' };
      const apiPeriod = periodMap[period] || 'month';

      const missionData = await apiCall(`/api/v1/analytics/mission-vision/${orgId}`);
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

  const loadAnalyticsMetrics = async (orgId) => {
    try {
      const [avgDonationData, retentionData, lapsedData] = await Promise.allSettled([
        apiCall(`/api/v1/analytics/avg-donation/${orgId}`),
        apiCall(`/api/v1/analytics/executive-dashboard/${orgId}`),
        apiCall(`/api/v1/analytics/lapsed-rate/${orgId}`)
      ]);

      return {
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
    } catch (error) {
      console.error('Error loading analytics metrics:', error);
      return null;
    }
  };

  const loadPrograms = async (orgId) => {
    setLoadingState('programs', true);
    try {
      const data = await apiCall(`/api/programs/?organization_id=${orgId}`);
      setPrograms(data || []);
    } catch (error) {
      console.error('Error loading programs:', error);
      setPrograms([]);
    } finally {
      setLoadingState('programs', false);
    }
  };

  const loadRecentActivity = async (orgId) => {
    setLoadingState('activity', true);
    try {
      const activities = [];
      const [donationsResult, programsResult] = await Promise.allSettled([
        apiCall(`/api/donations/?organization_id=${orgId}&limit=5`),
        apiCall(`/api/programs/?organization_id=${orgId}&limit=5`)
      ]);

      if (donationsResult.status === 'fulfilled' && donationsResult.value) {
        const donations = Array.isArray(donationsResult.value) ? donationsResult.value : [];
        donations.forEach(donation => {
          if (donation.id) {
            const amount = typeof donation.amount === 'number' ? donation.amount : parseFloat(donation.amount) || 0;
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

      if (programsResult.status === 'fulfilled' && programsResult.value) {
        const progs = Array.isArray(programsResult.value) ? programsResult.value : [];
        progs.forEach(program => {
          if (program.id) {
            activities.push({
              id: `program-${program.id}`,
              type: 'program',
              title: program.name || 'Unnamed Program',
              description: `${program.program_type || 'Program'} • ${(program.current_beneficiaries || 0).toLocaleString()} beneficiaries served`,
              timestamp: program.updated_at || program.created_at || new Date().toISOString(),
              icon: 'program',
              status: program.status || 'active'
            });
          }
        });
      }

      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setRecentActivity([]);
    } finally {
      setLoadingState('activity', false);
    }
  };

  const loadTasks = async (orgId) => {
    setLoadingState('tasks', true);
    try {
      const data = await apiCall(`/api/v1/dashboard/tasks/${orgId}?limit=3`);
      setUpcomingTasks(data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setUpcomingTasks([]);
    } finally {
      setLoadingState('tasks', false);
    }
  };

  const loadInsights = async (orgId) => {
    setLoadingState('insights', true);
    try {
      const data = await apiCall(`/api/v1/dashboard/insights/${orgId}?limit=3`);
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsights([]);
    } finally {
      setLoadingState('insights', false);
    }
  };

  const loadHealthScore = async (orgId) => {
    setLoadingState('health', true);
    try {
      const data = await apiCall(`/api/v1/dashboard/health-score/${orgId}`);
      setHealthScore(data);
    } catch (error) {
      console.error('Error loading health score:', error);
      setHealthScore(null);
    } finally {
      setLoadingState('health', false);
    }
  };

  const loadOkrs = async (orgId) => {
    setLoadingState('okrs', true);
    try {
      const data = await apiCall(`/api/v1/analytics/okrs/${orgId}?period=2025`);
      const transformedOkrs = data.objectives.map((obj, index) => {
        const avgProgress = obj.key_results.reduce((sum, kr) => sum + kr.progress, 0) / obj.key_results.length;
        return {
          id: index + 1,
          objective: obj.objective,
          progress: Math.round(avgProgress),
          keyResults: obj.key_results.map(kr => {
            let unit = '';
            let current = kr.current;
            let target = kr.target;

            if (kr.target >= 100000) {
              unit = 'M';
              current = (kr.current / 1000000).toFixed(1);
              target = (kr.target / 1000000).toFixed(1);
            } else if (kr.target >= 75 && kr.target <= 100 && kr.current >= 0 && kr.current <= 100) {
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
      setLoadingState('okrs', false);
    }
  };

  const loadUpcomingDeadlines = async (orgId) => {
    setLoadingState('deadlines', true);
    try {
      const data = await apiCall(`/api/v1/dashboard/deadlines/${orgId}?days=30`);
      setUpcomingDeadlines(data.deadlines || []);
    } catch (error) {
      console.error('Error loading deadlines:', error);
      setUpcomingDeadlines([]);
    } finally {
      setLoadingState('deadlines', false);
    }
  };

  const loadSwotAnalysis = async (orgId) => {
    try {
      const data = await apiCall(`/api/v1/analytics/swot/${orgId}`);
      console.log('SWOT Data loaded:', data);
      setSwotData(data || []);
    } catch (error) {
      console.error('Error loading SWOT analysis:', error);
      setSwotData([]);
    }
  };

  // Load recent donors for thank you modal
  const loadRecentDonors = async () => {
    try {
      const orgId = getOrganizationId();
      const data = await apiCall(`/api/v1/donors/recent-donations/${orgId}?days=7&limit=50`);
      setRecentDonors(data.donors || []);
    } catch (error) {
      console.error('Error loading recent donors:', error);
      setRecentDonors([]);
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
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getIconForActivityType = (type) => {
    switch (type) {
      case 'donation': return <DollarSign size={16} color={colors.success} />;
      case 'campaign': return <Megaphone size={16} color={colors.info} />;
      case 'program': return <Heart size={16} color={colors.primary} />;
      default: return <Activity size={16} color={colors.gray[500]} />;
    }
  };

  const getIconForInsightType = (type) => {
    switch (type) {
      case 'success': return <TrendingUp size={16} color={colors.success} />;
      case 'warning': return <AlertTriangle size={16} color={colors.warning} />;
      default: return <Sparkles size={16} color={colors.info} />;
    }
  };

  const getDeadlineIcon = (iconType) => {
    switch (iconType) {
      case 'target': return <Target size={16} color={colors.primary} />;
      case 'check-circle': return <CheckCircle size={16} color={colors.info} />;
      case 'gift': return <Gift size={16} color={colors.purple} />;
      case 'heart': return <Heart size={16} color={colors.danger} />;
      default: return <Calendar size={16} color={colors.gray[500]} />;
    }
  };

  // ============== MODAL HANDLERS ==============

  const openThankYouModal = async () => {
    setShowThankYouModal(true);
    setModalLoading(true);
    await loadRecentDonors();
    setModalLoading(false);
  };

  const handleSendThankYou = async (formData) => {
    try {
      setModalLoading(true);
      const orgId = getOrganizationId();
      const response = await apiCall(`/api/v1/communications/thank-you/${orgId}`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      alert(`${response.sent_count} thank you messages sent successfully!`);
      setShowThankYouModal(false);
      setSelectedDonors([]);
    } catch (error) {
      console.error('Error sending thank you:', error);
      alert('Failed to send thank you messages');
    } finally {
      setModalLoading(false);
    }
  };

  const handleExportData = async (formData) => {
    try {
      setModalLoading(true);
      const orgId = getOrganizationId();
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/reports/export/${orgId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.split('filename=')[1] ||
        `export_${Date.now()}.${formData.format}`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/"/g, '');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowExportModal(false);
      alert('Export downloaded successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateTask = async (formData) => {
    try {
      setModalLoading(true);
      const orgId = getOrganizationId();

      const token = getToken();
      const response = await apiCall(`/api/v1/tasks/${orgId}`, {
        method: 'POST',
        headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
        body: JSON.stringify(formData)
      });

      alert('Task created successfully!');
      setShowTaskModal(false);
      // Reload tasks
      loadTasks(orgId);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setModalLoading(false);
    }
  };

  // ============== MODAL COMPONENTS ==============

  // Thank You Modal
  const ThankYouModal = () => {
    const [templateType, setTemplateType] = useState('standard');
    const [customMessage, setCustomMessage] = useState('');

    return (
      <div style={styles.modalOverlay} onClick={() => setShowThankYouModal(false)}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Send Thank You</h2>
            <button onClick={() => setShowThankYouModal(false)} style={styles.modalClose}>
              <X size={20} />
            </button>
          </div>

          <div style={styles.modalBody}>
            {modalLoading ? (
              <div style={styles.modalLoading}>
                <Activity size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p>Loading donors...</p>
              </div>
            ) : (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Select Donors (Recent 7 days)</label>
                  <div style={styles.donorList}>
                    {recentDonors.length === 0 ? (
                      <p style={styles.emptyText}>No recent donations found</p>
                    ) : (
                      recentDonors.map(donor => (
                        <label key={donor.id} style={styles.donorItem}>
                          <input
                            type="checkbox"
                            checked={selectedDonors.includes(donor.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDonors([...selectedDonors, donor.id]);
                              } else {
                                setSelectedDonors(selectedDonors.filter(id => id !== donor.id));
                              }
                            }}
                            style={styles.checkbox}
                          />
                          <div style={styles.donorInfo}>
                            <span style={styles.donorName}>{donor.name}</span>
                            <span style={styles.donorAmount}>${donor.amount.toLocaleString()}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedDonors.length > 0 && (
                    <p style={styles.selectedCount}>{selectedDonors.length} donors selected</p>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Template Type</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    style={styles.formSelect}
                  >
                    <option value="standard">Standard Thank You</option>
                    <option value="major_gift">Major Gift Thank You</option>
                    <option value="first_time">First-Time Donor Welcome</option>
                    <option value="recurring">Recurring Donor Thank You</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Custom Message (Optional)</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    style={styles.formTextarea}
                    placeholder="Add a personal touch to your thank you message..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <div style={styles.modalFooter}>
            <button onClick={() => setShowThankYouModal(false)} style={styles.modalButtonSecondary}>
              Cancel
            </button>
            <button
              onClick={() => handleSendThankYou({
                donor_ids: selectedDonors,
                template_type: templateType,
                custom_message: customMessage,
                send_method: 'email'
              })}
              style={styles.modalButtonPrimary}
              disabled={selectedDonors.length === 0 || modalLoading}
            >
              <Send size={16} />
              Send Thank You
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Export Data Modal
  const ExportModal = () => {
    const [exportType, setExportType] = useState('executive_summary');
    const [format, setFormat] = useState('pdf');
    const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    return (
      <div style={styles.modalOverlay} onClick={() => setShowExportModal(false)}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Export Data</h2>
            <button onClick={() => setShowExportModal(false)} style={styles.modalClose}>
              <X size={20} />
            </button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Report Type</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                style={styles.formSelect}
              >
                <option value="executive_summary">Executive Summary</option>
                <option value="donations">Donations Report</option>
                <option value="donors">Donors Report</option>
                <option value="campaigns">Campaigns Report</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Format</label>
              <div style={styles.formatButtons}>
                <button
                  onClick={() => setFormat('pdf')}
                  style={format === 'pdf' ? styles.formatButtonActive : styles.formatButton}
                >
                  <FileText size={16} />
                  PDF
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  style={format === 'csv' ? styles.formatButtonActive : styles.formatButton}
                >
                  <BarChart3 size={16} />
                  CSV
                </button>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={styles.formInput}
                />
              </div>
            </div>
          </div>

          <div style={styles.modalFooter}>
            <button onClick={() => setShowExportModal(false)} style={styles.modalButtonSecondary}>
              Cancel
            </button>
            <button
              onClick={() => handleExportData({
                export_type: exportType,
                format: format,
                date_from: new Date(dateFrom).toISOString(),
                date_to: new Date(dateTo).toISOString()
              })}
              style={styles.modalButtonPrimary}
              disabled={modalLoading}
            >
              <Download size={16} />
              {modalLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create Task Modal
  const TaskModal = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [taskType, setTaskType] = useState('general');

    return (
      <div style={styles.modalOverlay} onClick={() => setShowTaskModal(false)}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Create Task</h2>
            <button onClick={() => setShowTaskModal(false)} style={styles.modalClose}>
              <X size={20} />
            </button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Task Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.formInput}
                placeholder="Enter task title..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.formTextarea}
                placeholder="Add task details..."
                rows={3}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                style={styles.formSelect}
              >
                <option value="general">General</option>
                <option value="stewardship">Stewardship</option>
                <option value="follow_up">Follow Up</option>
                <option value="outreach">Outreach</option>
              </select>
            </div>
          </div>

          <div style={styles.modalFooter}>
            <button onClick={() => setShowTaskModal(false)} style={styles.modalButtonSecondary}>
              Cancel
            </button>
            <button
              onClick={() => handleCreateTask({
                title,
                description,
                due_date: new Date(dueDate).toISOString(),
                priority,
                task_type: taskType
              })}
              style={styles.modalButtonPrimary}
              disabled={!title || !dueDate || modalLoading}
            >
              <Plus size={16} />
              {modalLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Quick Actions Component
  const QuickActions = () => {
    const actions = [
      { icon: <Send size={18} />, label: 'Send Thank You', action: openThankYouModal, color: colors.primary },
      { icon: <Download size={18} />, label: 'Export Data', action: () => setShowExportModal(true), color: colors.info },
      { icon: <Plus size={18} />, label: 'Create Task', action: () => setShowTaskModal(true), color: colors.success },
    ];

    return (
      <div style={styles.quickActionsGrid}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            style={styles.quickActionButton}
            className="quick-action-button"
          >
            <div style={{ ...styles.quickActionIcon, backgroundColor: `${action.color}15` }}>
              {React.cloneElement(action.icon, { color: action.color })}
            </div>
            <span style={styles.quickActionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    );
  };

  // Upcoming Deadlines Component
  const UpcomingDeadlines = () => {
    if (loadingStates.deadlines) {
      return <div style={styles.loadingText}>Loading deadlines...</div>;
    }

    if (upcomingDeadlines.length === 0) {
      return (
        <div style={styles.emptyState}>
          <Calendar size={48} color={colors.gray[300]} />
          <p style={styles.emptyStateText}>No upcoming deadlines</p>
        </div>
      );
    }

    return (
      <div style={styles.deadlinesList}>
        {upcomingDeadlines.slice(0, 6).map((deadline) => (
          <div key={deadline.id} style={styles.deadlineItem}>
            <div style={{
              ...styles.deadlineIcon,
              backgroundColor: deadline.priority === 'high' ? `${colors.danger}15` :
                deadline.priority === 'medium' ? `${colors.warning}15` : `${colors.info}15`
            }}>
              {getDeadlineIcon(deadline.icon)}
            </div>
            <div style={styles.deadlineContent}>
              <div style={styles.deadlineTitle}>{deadline.title}</div>
              <div style={styles.deadlineMeta}>
                <Clock size={12} />
                <span>
                  {deadline.days_until === 0 ? 'Today' :
                    deadline.days_until === 1 ? 'Tomorrow' :
                      `${deadline.days_until} days`}
                </span>
                {deadline.type === 'campaign_end' && deadline.details?.progress && (
                  <span style={styles.deadlineProgress}>
                    {deadline.details.progress}% complete
                  </span>
                )}
              </div>
            </div>
            <div style={{
              ...styles.deadlineBadge,
              backgroundColor: deadline.priority === 'high' ? `${colors.danger}15` :
                deadline.priority === 'medium' ? `${colors.warning}15` : `${colors.success}15`,
              color: deadline.priority === 'high' ? colors.danger :
                deadline.priority === 'medium' ? colors.warning : colors.success
            }}>
              {deadline.type === 'campaign_end' ? 'Campaign' :
                deadline.type === 'anniversary' ? 'Anniversary' :
                  deadline.type === 'stewardship' ? 'Stewardship' : 'Task'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // OKRs Progress Component
  const OKRsProgress = () => {
    if (loadingStates.okrs) {
      return <div style={styles.loadingText}>Loading OKRs...</div>;
    }

    if (okrs.length === 0) {
      return (
        <div style={styles.emptyState}>
          <Target size={48} color={colors.gray[300]} />
          <p style={styles.emptyStateText}>No OKRs defined</p>
        </div>
      );
    }

    return (
      <div style={styles.okrsList}>
        {okrs.slice(0, 3).map((okr) => (
          <div key={okr.id} style={styles.okrItem}>
            <div style={styles.okrHeader}>
              <h4 style={styles.okrObjective}>{okr.objective}</h4>
              <span style={{
                ...styles.okrProgress,
                color: okr.progress >= 70 ? colors.success : okr.progress >= 40 ? colors.warning : colors.danger
              }}>
                {okr.progress}%
              </span>
            </div>
            <div style={styles.okrProgressBar}>
              <div
                style={{
                  ...styles.okrProgressFill,
                  width: `${okr.progress}%`,
                  backgroundColor: okr.progress >= 70 ? colors.success : okr.progress >= 40 ? colors.warning : colors.danger
                }}
              />
            </div>
            <div style={styles.keyResultsList}>
              {okr.keyResults.slice(0, 2).map((kr, idx) => (
                <div key={idx} style={styles.keyResult}>
                  <CircleDot size={12} color={colors.gray[400]} />
                  <span style={styles.keyResultText}>
                    {kr.name}: {kr.current}{kr.unit} / {kr.target}{kr.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Programs Grid Component
  const ProgramsGrid = () => {
    if (loadingStates.programs) {
      return <div style={styles.loadingText}>Loading programs...</div>;
    }

    if (programs.length === 0) {
      return (
        <div style={styles.emptyState}>
          <Layers size={48} color={colors.gray[300]} />
          <p style={styles.emptyStateText}>No active programs</p>
        </div>
      );
    }

    return (
      <div style={styles.programsGrid}>
        {programs.slice(0, 4).map((program) => (
          <div key={program.id} style={styles.programCard} className="program-card">
            <div style={styles.programHeader}>
              <div style={styles.programIcon}>
                <Heart size={16} color={colors.primary} />
              </div>
              <span style={{
                ...styles.programStatus,
                backgroundColor: program.status === 'active' ? `${colors.success}15` : `${colors.gray[200]}`,
                color: program.status === 'active' ? colors.success : colors.gray[600]
              }}>
                {program.status}
              </span>
            </div>
            <h4 style={styles.programName}>{program.name}</h4>
            <div style={styles.programStats}>
              <div style={styles.programStat}>
                <Users size={14} color={colors.gray[500]} />
                <span>{formatNumber(program.current_beneficiaries || 0)} beneficiaries</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Notification Bell Component
  const NotificationBell = () => (
    <div style={styles.notificationContainer}>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={styles.notificationButton}
        className="notification-button"
      >
        <Bell size={20} color="#ffffff" />
        {pendingRequests.length > 0 && (
          <span style={styles.notificationBadge}>{pendingRequests.length}</span>
        )}
      </button>

      {showNotifications && (
        <div style={styles.notificationDropdown}>
          <div style={styles.notificationHeader}>
            <h3 style={styles.notificationTitle}>Pending User Requests</h3>
            <button onClick={() => setShowNotifications(false)} style={styles.closeButton}>
              <X size={18} />
            </button>
          </div>

          <div style={styles.notificationList}>
            {loadingStates.requests ? (
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
                      <p style={styles.requestName}>{request.first_name} {request.last_name}</p>
                      <p style={styles.requestRole}>
                        Role: <span style={styles.roleBadge}>{request.role}</span>
                      </p>
                    </div>
                  </div>
                  <div style={styles.requestActions}>
                    <button onClick={() => handleApproveRequest(request.id)} style={styles.approveButton}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => handleRejectRequest(request.id, request.email)} style={styles.rejectButton}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {pendingRequests.length > 0 && (
            <div style={styles.notificationFooter}>
              <button onClick={() => { navigate('/users'); setShowNotifications(false); }} style={styles.viewAllButton2}>
                Manage All Users <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

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
      {/* Modals */}
      {showThankYouModal && <ThankYouModal />}
      {showExportModal && <ExportModal />}
      {showTaskModal && <TaskModal />}

      {/* Hero Section */}
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
            </div>
            <div style={styles.heroRight}>
              <NotificationBell />
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </section>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {dashboardData.missionVision && (
          <section style={styles.missionVisionSection}>
            <div style={styles.missionVisionContainer}>
              <div style={styles.missionVisionCard} className="mission-vision-card">
                <div style={styles.missionVisionHeader}>
                  <div style={styles.missionVisionIconWrapper}>
                    <Target size={28} color={colors.primary} />
                  </div>
                  <h2 style={styles.missionVisionTitle}>Our Mission</h2>
                </div>
                <div style={styles.missionVisionContent}>
                  <p style={styles.missionVisionText}>
                    {dashboardData.missionVision.mission || "Empowering communities through sustainable impact."}
                  </p>
                </div>
              </div>

              <div style={styles.missionVisionCard} className="mission-vision-card">
                <div style={styles.missionVisionHeader}>
                  <div style={styles.missionVisionIconWrapper}>
                    <Eye size={28} color={colors.secondary} />
                  </div>
                  <h2 style={styles.missionVisionTitle}>Our Vision</h2>
                </div>
                <div style={styles.missionVisionContent}>
                  <p style={styles.missionVisionText}>
                    {dashboardData.missionVision.vision || "Creating a world where every individual has access to opportunities."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SWOT Analysis Section */}
        <section style={styles.swotSection}>
          <div style={styles.swotHeader}>
            <div style={styles.swotHeaderLeft}>
              <div style={styles.swotIconWrapper}>
                <Target size={32} color={colors.primary} />
              </div>
              <div>
                <h2 style={styles.swotTitle}>Strategic Analysis</h2>
                <p style={styles.swotSubtitle}>Comprehensive SWOT Overview</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/analytics/swot')}
              style={styles.swotViewButton}
            >
              View Full Analysis <ArrowRight size={18} />
            </button>
          </div>

{swotData && swotData.length > 0 ? (
            <div style={styles.swotGrid}>
              {/* Strengths */}
              {(() => {
                const strengthsData = swotData.find(cat => cat.category === 'strengths');
                return (
                  <div style={{...styles.swotCard, ...styles.swotStrengths}} className="swot-card">
                    <div style={styles.swotCardHeader}>
                      <div style={styles.swotCardIcon}>
                        <Award size={24} color={colors.success} />
                      </div>
                      <h3 style={styles.swotCardTitle}>Strengths</h3>
                    </div>
                    <ul style={styles.swotList}>
                      {strengthsData && strengthsData.items && strengthsData.items.length > 0 ? (
                        strengthsData.items.map((item, idx) => (
                          <li key={idx} style={styles.swotListItem}>
                            <CheckCircle size={16} color={colors.success} style={{flexShrink: 0}} />
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li style={styles.emptyText}>No data available</li>
                      )}
                    </ul>
                  </div>
                );
              })()}

              {/* Weaknesses */}
              {(() => {
                const weaknessesData = swotData.find(cat => cat.category === 'weaknesses');
                return (
                  <div style={{...styles.swotCard, ...styles.swotWeaknesses}} className="swot-card">
                    <div style={styles.swotCardHeader}>
                      <div style={styles.swotCardIcon}>
                        <AlertTriangle size={24} color={colors.warning} />
                      </div>
                      <h3 style={styles.swotCardTitle}>Weaknesses</h3>
                    </div>
                    <ul style={styles.swotList}>
                      {weaknessesData && weaknessesData.items && weaknessesData.items.length > 0 ? (
                        weaknessesData.items.map((item, idx) => (
                          <li key={idx} style={styles.swotListItem}>
                            <AlertCircle size={16} color={colors.warning} style={{flexShrink: 0}} />
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li style={styles.emptyText}>No data available</li>
                      )}
                    </ul>
                  </div>
                );
              })()}

              {/* Opportunities */}
              {(() => {
                const opportunitiesData = swotData.find(cat => cat.category === 'opportunities');
                return (
                  <div style={{...styles.swotCard, ...styles.swotOpportunities}} className="swot-card">
                    <div style={styles.swotCardHeader}>
                      <div style={styles.swotCardIcon}>
                        <TrendingUp size={24} color={colors.info} />
                      </div>
                      <h3 style={styles.swotCardTitle}>Opportunities</h3>
                    </div>
                    <ul style={styles.swotList}>
                      {opportunitiesData && opportunitiesData.items && opportunitiesData.items.length > 0 ? (
                        opportunitiesData.items.map((item, idx) => (
                          <li key={idx} style={styles.swotListItem}>
                            <Sparkles size={16} color={colors.info} style={{flexShrink: 0}} />
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li style={styles.emptyText}>No data available</li>
                      )}
                    </ul>
                  </div>
                );
              })()}

              {/* Threats */}
              {(() => {
                const threatsData = swotData.find(cat => cat.category === 'threats');
                return (
                  <div style={{...styles.swotCard, ...styles.swotThreats}} className="swot-card">
                    <div style={styles.swotCardHeader}>
                      <div style={styles.swotCardIcon}>
                        <Shield size={24} color={colors.danger} />
                      </div>
                      <h3 style={styles.swotCardTitle}>Threats</h3>
                    </div>
                    <ul style={styles.swotList}>
                      {threatsData && threatsData.items && threatsData.items.length > 0 ? (
                        threatsData.items.map((item, idx) => (
                          <li key={idx} style={styles.swotListItem}>
                            <AlertTriangle size={16} color={colors.danger} style={{flexShrink: 0}} />
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li style={styles.emptyText}>No data available</li>
                      )}
                    </ul>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Activity size={48} color={colors.gray[400]} />
              <p style={styles.emptyStateText}>Loading SWOT analysis...</p>
            </div>
          )}
        </section>


        {/* Two Column Layout */}
        <div style={styles.twoColumnLayout}>
          {/* Left Column */}
          <div style={styles.leftColumn}>
            {/* Upcoming Deadlines & Events - NEW */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <Calendar size={20} color={colors.primary} />
                  <h3 style={styles.cardTitle}>Upcoming Deadlines & Events</h3>
                </div>
                <button onClick={() => navigate('/calendar')} style={styles.viewAllButton} className="view-all-button">
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <UpcomingDeadlines />
            </section>

            {/* OKRs Progress */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <Target size={20} color={colors.secondary} />
                  <h3 style={styles.cardTitle}>Strategic OKRs</h3>
                </div>
                <button onClick={() => navigate('/analytics/okrs')} style={styles.viewAllButton} className="view-all-button">
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <OKRsProgress />
            </section>

            {/* Programs */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <Layers size={20} color={colors.info} />
                  <h3 style={styles.cardTitle}>Active Programs</h3>
                </div>
                <button onClick={() => navigate('/programs')} style={styles.viewAllButton} className="view-all-button">
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <ProgramsGrid />
            </section>
          </div>

          {/* Right Column */}
          <div style={styles.rightColumn}>
            {/* Recent Activity */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <Activity size={20} color={colors.primary} />
                  <h3 style={styles.cardTitle}>Recent Activity</h3>
                </div>
                <button style={styles.viewAllButton} className="view-all-button">
                  View All <ChevronRight size={16} />
                </button>
              </div>

              <div style={styles.activityList}>
                {loadingStates.activity ? (
                  <div style={styles.loadingText}>Loading activity...</div>
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
                          <Clock size={12} />
                          <span>{new Date(activity.timestamp).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Upcoming Tasks */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <CheckCircle size={20} color={colors.warning} />
                  <h3 style={styles.cardTitle}>Upcoming Tasks</h3>
                </div>
                <button onClick={() => setShowTaskModal(true)} style={styles.addButton} className="add-button">
                  <Plus size={16} />
                </button>
              </div>

              <div style={styles.taskList}>
                {loadingStates.tasks ? (
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

            {/* AI Insights */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <Sparkles size={20} color={colors.info} />
                  <h3 style={styles.cardTitle}>AI Insights</h3>
                </div>
              </div>

              <div style={styles.insightsList}>
                {loadingStates.insights ? (
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
                  <div style={{ ...styles.healthScoreProgress, width: `${healthScore.score}%` }} />
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Mission & Vision Section */}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.gray[50],
  },
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

  // Hero
  hero: {
    position: 'relative',
    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
    padding: '48px 80px',
    color: '#ffffff',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
  heroLeft: { flex: 1 },
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
  heroName: { color: colors.accent },
  heroSubtitle: {
    fontSize: '18px',
    opacity: 0.9,
    marginBottom: '24px',
  },

  // Quick Actions
  quickActionsGrid: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  quickActionIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.gray[800],
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: `1px solid ${colors.gray[200]}`,
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
  },
  modalClose: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    color: colors.gray[500],
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    maxHeight: '60vh',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: `1px solid ${colors.gray[200]}`,
  },
  modalLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    gap: '12px',
  },
  modalButtonPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: colors.primary,
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalButtonSecondary: {
    padding: '12px 20px',
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Form Styles
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: '8px',
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: '10px',
    fontSize: '14px',
    color: colors.gray[900],
    boxSizing: 'border-box',
  },
  formSelect: {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: '10px',
    fontSize: '14px',
    color: colors.gray[900],
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  formTextarea: {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: '10px',
    fontSize: '14px',
    color: colors.gray[900],
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formatButtons: {
    display: 'flex',
    gap: '12px',
  },
  formatButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: colors.gray[100],
    border: `2px solid ${colors.gray[200]}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.gray[600],
    cursor: 'pointer',
  },
  formatButtonActive: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: `${colors.primary}10`,
    border: `2px solid ${colors.primary}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.primary,
    cursor: 'pointer',
  },
  donorList: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: '10px',
    padding: '8px',
  },
  donorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: colors.primary,
  },
  donorInfo: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donorName: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.gray[800],
  },
  donorAmount: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.success,
  },
  selectedCount: {
    fontSize: '12px',
    color: colors.primary,
    fontWeight: '600',
    marginTop: '8px',
  },

  // Main Content
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '48px 80px',
  },
  section: { marginBottom: '48px' },
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
    gap: '20px',
  },
  metricCardEnhanced: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${colors.gray[200]}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  metricCardHeader: {},
  metricCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  metricCardIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: `${colors.primary}15`,
    color: colors.primary,
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  metricCardLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: '8px',
  },
  metricCardValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: '4px',
  },
  metricCardSubtext: {
    fontSize: '12px',
    color: colors.gray[500],
  },

  // Two Column Layout
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${colors.gray[200]}`,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
  },
  viewAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: colors.gray[100],
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gray[600],
    cursor: 'pointer',
  },
  addButton: {
    padding: '8px',
    backgroundColor: colors.gray[100],
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.gray[600],
  },

  // Deadlines
  deadlinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  deadlineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: colors.gray[50],
    borderRadius: '10px',
  },
  deadlineIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: '4px',
  },
  deadlineMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: colors.gray[500],
  },
  deadlineProgress: {
    marginLeft: '8px',
    color: colors.info,
    fontWeight: '600',
  },
  deadlineBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // OKRs
  okrsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  okrItem: {
    padding: '16px',
    backgroundColor: colors.gray[50],
    borderRadius: '12px',
  },
  okrHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  okrObjective: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
    flex: 1,
  },
  okrProgress: {
    fontSize: '16px',
    fontWeight: '800',
  },
  okrProgressBar: {
    height: '8px',
    backgroundColor: colors.gray[200],
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  okrProgressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  keyResultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  keyResult: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  keyResultText: {
    fontSize: '12px',
    color: colors.gray[600],
  },

  // Programs
  programsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  programCard: {
    padding: '16px',
    backgroundColor: colors.gray[50],
    borderRadius: '12px',
    transition: 'all 0.2s ease',
  },
  programHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  programIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: `${colors.primary}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programStatus: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  programName: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.secondary,
    margin: '0 0 12px 0',
  },
  programStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  programStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: colors.gray[600],
  },

  // Activity
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
    transition: 'background-color 0.2s ease',
  },
  activityIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: colors.gray[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: { flex: 1 },
  activityTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: '4px',
  },
  activityDescription: {
    fontSize: '13px',
    color: colors.gray[600],
    marginBottom: '6px',
  },
  activityTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: colors.gray[500],
  },

  // Tasks
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: colors.gray[50],
  },
  taskCheckbox: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: `2px solid ${colors.gray[300]}`,
    flexShrink: 0,
  },
  taskContent: { flex: 1 },
  taskTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: '4px',
  },
  taskMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: colors.gray[500],
  },
  taskPriority: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Insights
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  insightItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: colors.gray[50],
  },
  insightIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightContent: { flex: 1 },
  insightText: {
    fontSize: '13px',
    color: colors.gray[700],
    margin: 0,
    lineHeight: '1.5',
  },

  // Health Score
  healthScoreCard: {
    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
    borderRadius: '16px',
    padding: '24px',
    color: '#ffffff',
  },
  healthScoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  healthScoreTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0,
  },
  healthScoreValue: {
    fontSize: '48px',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '4px',
  },
  healthScoreLabel: {
    fontSize: '14px',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: '16px',
  },
  healthScoreBar: {
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  healthScoreProgress: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
  },

  // Mission Vision
  missionVisionSection: {
    marginTop: '48px',
  },
  missionVisionContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  missionVisionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '40px',
    border: `2px solid ${colors.gray[200]}`,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
  },
  missionVisionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  missionVisionIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(232, 117, 0, 0.1) 0%, rgba(21, 71, 52, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  missionVisionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
  },
  missionVisionContent: {},
  missionVisionText: {
    fontSize: '16px',
    color: colors.gray[700],
    lineHeight: '1.8',
    margin: 0,
  },
  // SWOT Analysis Section
  swotSection: {
    marginTop: '48px',
    marginBottom: '48px',
  },
  swotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  swotHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  swotIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(232, 117, 0, 0.25)',
  },
  swotTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
  },
  swotSubtitle: {
    fontSize: '15px',
    color: colors.gray[600],
    margin: '4px 0 0 0',
  },
  swotViewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    backgroundColor: colors.primary,
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(232, 117, 0, 0.2)',
  },
  swotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  swotCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    border: '2px solid',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  swotStrengths: {
    borderColor: `${colors.success}40`,
    background: `linear-gradient(135deg, #ffffff 0%, ${colors.success}05 100%)`,
  },
  swotWeaknesses: {
    borderColor: `${colors.warning}40`,
    background: `linear-gradient(135deg, #ffffff 0%, ${colors.warning}05 100%)`,
  },
  swotOpportunities: {
    borderColor: `${colors.info}40`,
    background: `linear-gradient(135deg, #ffffff 0%, ${colors.info}05 100%)`,
  },
  swotThreats: {
    borderColor: `${colors.danger}40`,
    background: `linear-gradient(135deg, #ffffff 0%, ${colors.danger}05 100%)`,
  },
  swotCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid',
    borderColor: 'inherit',
  },
  swotCardIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  swotCardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.secondary,
    margin: 0,
  },
  swotList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  swotListItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    fontSize: '14px',
    color: colors.gray[700],
    lineHeight: '1.6',
  },


  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
  },
  emptyStateText: {
    fontSize: '14px',
    color: colors.gray[500],
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: colors.gray[500],
    margin: 0,
  },

  // Notifications
  notificationContainer: { position: 'relative' },
  notificationButton: {
    position: 'relative',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
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
  notificationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.gray[100]}`,
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
  requestDetails: { flex: 1 },
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
    margin: 0,
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
  },
};

// CSS Animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
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
  .quick-action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .mission-vision-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border-color: ${colors.primary};
  }
  .program-card:hover {
    background-color: ${colors.gray[100]};
  }
  .notification-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
  .swot-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  }
  .swotViewButton:hover {
    background-color: ${colors.secondary};
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 117, 0, 0.35);
  }
`;
document.head.appendChild(styleSheet);

export default EnhancedLandingPage;