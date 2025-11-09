import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  TrendingUp,
  UserPlus,
  Activity,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const API_BASE_URL = '';

const AudienceGrowth = () => {
  const { getOrganizationId, getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAudienceGrowth();
  }, []);

  const fetchAudienceGrowth = async () => {
    try {
      setLoading(true);
      setError(null);

      const orgId = getOrganizationId();
      if (!orgId) {
        throw new Error('Organization ID not found. Please log in again.');
      }

      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log('📊 Fetching audience growth for org:', orgId);

      const response = await fetch(`${API_BASE_URL}/api/v1/analytics/audience-growth/${orgId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to load data (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Audience Growth Data:', result);
      setData(result);

    } catch (err) {
      console.error('❌ Error fetching audience growth:', err);
      setError(err.message || 'Failed to load audience growth data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading audience growth metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <AlertTriangle size={48} color="#f5576c" />
        <h3 style={styles.errorTitle}>Unable to Load Data</h3>
        <p style={styles.errorText}>{error}</p>
        <button onClick={fetchAudienceGrowth} style={styles.retryButton}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.monthly_growth) {
    return (
      <div style={styles.errorContainer}>
        <AlertTriangle size={48} color="#fbbf24" />
        <h3 style={styles.errorTitle}>No Data Available</h3>
        <p style={styles.errorText}>No audience growth data found for this organization</p>
      </div>
    );
  }

  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0);

  const summary = data.summary || {};
  const monthlyGrowth = data.monthly_growth || [];

  // Calculate monthly growth rate
  const calculateGrowthRate = () => {
    if (monthlyGrowth.length < 2) return 0;
    const lastMonth = monthlyGrowth[monthlyGrowth.length - 1];
    const previousMonth = monthlyGrowth[monthlyGrowth.length - 2];
    if (previousMonth.total_donors === 0) return 0;
    return (((lastMonth.total_donors - previousMonth.total_donors) / previousMonth.total_donors) * 100).toFixed(1);
  };

  const monthlyGrowthRate = calculateGrowthRate();
  const last3MonthsNewDonors = monthlyGrowth.slice(-3).reduce((sum, month) => sum + month.new_donors, 0);

  // Format chart data
  const chartData = monthlyGrowth.map(item => ({
    ...item,
    monthLabel: new Date(item.month + '-01').toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    })
  }));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Audience Growth Analytics</h2>
          <p style={styles.subtitle}>Track donor acquisition and growth trends over time</p>
        </div>
        <button onClick={fetchAudienceGrowth} style={styles.refreshButton}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={{...styles.metricIcon, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <Users size={28} />
          </div>
          <div style={styles.metricContent}>
            <p style={styles.metricLabel}>Total Donors</p>
            <h3 style={styles.metricValue}>{formatNumber(summary.total_donors_now)}</h3>
            <p style={styles.metricSubtitle}>Current donor base</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{...styles.metricIcon, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
            <TrendingUp size={28} />
          </div>
          <div style={styles.metricContent}>
            <p style={styles.metricLabel}>Monthly Growth</p>
            <h3 style={styles.metricValue}>{monthlyGrowthRate}%</h3>
            <p style={styles.metricSubtitle}>Month-over-month</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{...styles.metricIcon, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
            <UserPlus size={28} />
          </div>
          <div style={styles.metricContent}>
            <p style={styles.metricLabel}>New Donors</p>
            <h3 style={styles.metricValue}>{formatNumber(summary.new_donors_last_month)}</h3>
            <p style={styles.metricSubtitle}>Last month</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{...styles.metricIcon, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
            <Activity size={28} />
          </div>
          <div style={styles.metricContent}>
            <p style={styles.metricLabel}>Growth Trend</p>
            <h3 style={styles.metricValue}>{summary.growth_trend || 'Stable'}</h3>
            <p style={styles.metricSubtitle}>Current quarter</p>
          </div>
        </div>
      </div>

      {/* Total Donors Trend Chart */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Total Donor Growth</h3>
          <p style={styles.chartSubtitle}>Cumulative donor base over time</p>
        </div>
        <div style={styles.chartBody}>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="monthLabel"
                stroke="#64748b"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value) => formatNumber(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="total_donors"
                stroke="#667eea"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Donors"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Donors Bar Chart */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>New Donor Acquisitions</h3>
          <p style={styles.chartSubtitle}>Monthly new donor count</p>
        </div>
        <div style={styles.chartBody}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="monthLabel"
                stroke="#64748b"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value) => formatNumber(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="new_donors"
                fill="#43e97b"
                name="New Donors"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth Comparison Line Chart */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Growth Comparison</h3>
          <p style={styles.chartSubtitle}>New vs total donors over time</p>
        </div>
        <div style={styles.chartBody}>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="monthLabel"
                stroke="#64748b"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value) => formatNumber(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_donors"
                stroke="#667eea"
                strokeWidth={3}
                name="Total Donors"
                dot={{ fill: '#667eea', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="new_donors"
                stroke="#43e97b"
                strokeWidth={3}
                name="New Donors"
                dot={{ fill: '#43e97b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  metricCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  metricIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0
  },
  metricContent: {
    flex: 1
  },
  metricLabel: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 4px 0',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },
  metricSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0
  },
  chartCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  chartHeader: {
    marginBottom: '24px'
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },
  chartSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  chartBody: {
    minHeight: '350px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '40px'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '16px',
    color: '#64748b'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '40px',
    textAlign: 'center'
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '16px 0 8px'
  },
  errorText: {
    fontSize: '16px',
    color: '#64748b',
    marginBottom: '24px'
  },
  retryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default AudienceGrowth;