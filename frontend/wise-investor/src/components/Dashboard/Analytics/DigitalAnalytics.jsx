import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import {
  Globe,
  Mail,
  MousePointerClick,
  Users,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import '../Dashboard.css';

const DigitalPerformance = () => {
  const { getOrganizationId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDigitalPerformance();
  }, []);

  const fetchDigitalPerformance = async () => {
    try {
      setLoading(true);
      const orgId = getOrganizationId();
      if (!orgId) throw new Error('Organization ID not found');
      
      const response = await api.get(`/api/v1/analytics/digital-performance/${orgId}`);
      console.log('Digital Performance Response:', response.data);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching digital performance:', err);
      setError('Failed to load digital performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading digital performance metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} color="#f5576c" />
        <h3>Unable to Load Data</h3>
        <p>{error}</p>
        <button onClick={fetchDigitalPerformance} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="error-container">No digital performance data available</div>;
  }

  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0);

  const website = data.website || {};
  const email = data.email || {};
  const conversions = data.conversions || {};
  const social = data.social || {};
  const trafficSources = data.traffic_sources || [];

  const COLORS = ['#667eea', '#43e97b', '#f093fb', '#fa709a', '#4facfe'];

  return (
    <div className="analytics-container digital-performance">
      <div className="analytics-header">
        <div>
          <h2>Digital Performance</h2>
          <p>Track online engagement and digital marketing effectiveness</p>
        </div>
      </div>

      {/* Website Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Globe size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Sessions</p>
            <h3 className="metric-value">{formatNumber(website.total_sessions)}</h3>
            <p className="metric-subtitle">Website visits</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Users size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Unique Users</p>
            <h3 className="metric-value">{formatNumber(website.unique_users)}</h3>
            <p className="metric-subtitle">Unique visitors</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Mail size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Email Open Rate</p>
            <h3 className="metric-value">{email.open_rate || 0}%</h3>
            <p className="metric-subtitle">Email engagement</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <MousePointerClick size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Click Rate</p>
            <h3 className="metric-value">{email.click_rate || 0}%</h3>
            <p className="metric-subtitle">Email clicks</p>
          </div>
        </div>
      </div>

      {/* Website Stats */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Website Performance</h3>
          <p>Key website metrics</p>
        </div>
        <div className="chart-body">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Avg Session Duration</span>
              <span className="stat-value">{website.avg_session_duration || 'N/A'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bounce Rate</span>
              <span className="stat-value">{website.bounce_rate || 0}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pages per Session</span>
              <span className="stat-value">{website.pages_per_session || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Traffic Sources</h3>
            <p>Where your visitors come from</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trafficSources}
                  dataKey="sessions"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ source, percentage }) => `${source}: ${percentage}%`}
                >
                  {trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatNumber(value)}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Traffic Volume</h3>
            <p>Sessions by source</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trafficSources}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="source" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  formatter={(value) => formatNumber(value)}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="sessions" fill="#667eea" radius={[8, 8, 0, 0]}>
                  {trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Email Performance */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Email Campaign Performance</h3>
          <p>Email marketing metrics</p>
        </div>
        <div className="chart-body">
          <div className="email-stats-grid">
            <div className="email-stat-card">
              <h4>Campaigns Sent</h4>
              <p className="big-number">{email.campaigns_sent || 0}</p>
            </div>
            <div className="email-stat-card">
              <h4>Emails Delivered</h4>
              <p className="big-number">{formatNumber(email.total_emails_delivered)}</p>
            </div>
            <div className="email-stat-card">
              <h4>Open Rate</h4>
              <p className="big-number">{email.open_rate || 0}%</p>
            </div>
            <div className="email-stat-card">
              <h4>Click Rate</h4>
              <p className="big-number">{email.click_rate || 0}%</p>
            </div>
            <div className="email-stat-card">
              <h4>Unsubscribe Rate</h4>
              <p className="big-number">{email.unsubscribe_rate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversions */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Conversions</h3>
          <p>Digital conversion metrics</p>
        </div>
        <div className="chart-body">
          <div className="conversions-grid">
            <div className="conversion-item">
              <span className="conversion-label">Donation Conversion</span>
              <span className="conversion-value">{conversions.donation_conversion_rate || 0}%</span>
            </div>
            <div className="conversion-item">
              <span className="conversion-label">Newsletter Signups</span>
              <span className="conversion-value">{formatNumber(conversions.newsletter_signups)}</span>
            </div>
            <div className="conversion-item">
              <span className="conversion-label">Volunteer Registrations</span>
              <span className="conversion-value">{formatNumber(conversions.volunteer_registrations)}</span>
            </div>
            <div className="conversion-item">
              <span className="conversion-label">Event Registrations</span>
              <span className="conversion-value">{formatNumber(conversions.event_registrations)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Social Media Performance</h3>
          <p>Social engagement metrics</p>
        </div>
        <div className="chart-body">
          <div className="social-stats-grid">
            <div className="social-stat">
              <span className="stat-label">Total Followers</span>
              <span className="stat-value">{formatNumber(social.total_followers)}</span>
            </div>
            <div className="social-stat">
              <span className="stat-label">Follower Growth</span>
              <span className="stat-value">{social.follower_growth || 0}%</span>
            </div>
            <div className="social-stat">
              <span className="stat-label">Engagement Rate</span>
              <span className="stat-value">{social.engagement_rate || 0}%</span>
            </div>
            <div className="social-stat">
              <span className="stat-label">Total Posts</span>
              <span className="stat-value">{formatNumber(social.total_posts)}</span>
            </div>
            <div className="social-stat">
              <span className="stat-label">Total Reach</span>
              <span className="stat-value">{formatNumber(social.total_reach)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalPerformance;
