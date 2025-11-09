import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
  Shield,
  Building2,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import '../Dashboard.css';

const SuperadminPanel = () => {
  const { API_BASE_URL } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState('all');

  useEffect(() => {
    fetchSuperadminData();
  }, []);

  const fetchSuperadminData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/analytics/superadmin/overview`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching superadmin data:', err);
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => ({
    total_organizations: 42,
    total_users: 1847,
    total_revenue: 18450000,
    system_health: 98.5,
    organizations: [
      {
        id: 1,
        name: 'Hope Foundation',
        users: 45,
        donors: 1250,
        revenue: 2487650,
        status: 'Active',
        health: 95,
      },
      {
        id: 2,
        name: 'Education Alliance',
        users: 32,
        donors: 890,
        revenue: 1850000,
        status: 'Active',
        health: 92,
      },
      {
        id: 3,
        name: 'Community Care Network',
        users: 28,
        donors: 1580,
        revenue: 3200000,
        status: 'Active',
        health: 97,
      },
      {
        id: 4,
        name: 'Green Initiative',
        users: 18,
        donors: 420,
        revenue: 850000,
        status: 'Active',
        health: 88,
      },
      {
        id: 5,
        name: 'Youth Development Inc',
        users: 25,
        donors: 650,
        revenue: 1450000,
        status: 'Active',
        health: 91,
      },
    ],
    platform_metrics: [
      { month: 'Jan', revenue: 1420000, users: 1650, orgs: 38 },
      { month: 'Feb', month: 'Feb', revenue: 1520000, users: 1680, orgs: 39 },
      { month: 'Mar', revenue: 1650000, users: 1720, orgs: 40 },
      { month: 'Apr', revenue: 1580000, users: 1755, orgs: 41 },
      { month: 'May', revenue: 1720000, users: 1810, orgs: 42 },
      { month: 'Jun', revenue: 1850000, users: 1847, orgs: 42 },
    ],
    user_distribution: [
      { role: 'Org Admin', count: 42 },
      { role: 'CEO', count: 38 },
      { role: 'Executive', count: 125 },
      { role: 'Marketing', count: 320 },
      { role: 'Sales', count: 285 },
      { role: 'Event Organizer', count: 420 },
      { role: 'Donor', count: 617 },
    ],
    revenue_by_org: [
      { name: 'Community Care', revenue: 3200000 },
      { name: 'Hope Foundation', revenue: 2487650 },
      { name: 'Education Alliance', revenue: 1850000 },
      { name: 'Youth Development', revenue: 1450000 },
      { name: 'Green Initiative', revenue: 850000 },
      { name: 'Others', revenue: 8612350 },
    ],
    system_alerts: [
      { type: 'info', message: 'System backup completed successfully', time: '2 hours ago' },
      { type: 'warning', message: 'Organization "Tech4Good" approaching storage limit', time: '5 hours ago' },
      { type: 'success', message: '2 new organizations onboarded', time: '1 day ago' },
      { type: 'info', message: 'Monthly reports generated for all organizations', time: '2 days ago' },
    ],
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading superadmin panel...</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  return (
    <div className="analytics-container superadmin-panel">
      <div className="analytics-header">
        <div>
          <h2>
            <Shield size={28} />
            Superadmin Control Panel
          </h2>
          <p>System-wide analytics and organization management</p>
        </div>
      </div>

      {/* Platform Overview Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)' }}>
            <Building2 size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Organizations</p>
            <h3 className="metric-value">{data.total_organizations}</h3>
            <p className="metric-subtitle">Active on platform</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Users size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Users</p>
            <h3 className="metric-value">{formatNumber(data.total_users)}</h3>
            <p className="metric-subtitle">Across all organizations</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Platform Revenue</p>
            <h3 className="metric-value">{formatCurrency(data.total_revenue)}</h3>
            <p className="metric-subtitle">Total fundraising (YTD)</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <p className="metric-label">System Health</p>
            <h3 className="metric-value">{data.system_health}%</h3>
            <p className="metric-subtitle">Uptime & performance</p>
          </div>
        </div>
      </div>

      {/* Organization List */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Organization Overview</h3>
          <p>Performance metrics for all active organizations</p>
        </div>
        <div className="chart-body">
          <div className="org-table">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Users</th>
                  <th>Donors</th>
                  <th>Revenue</th>
                  <th>Health</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="org-name">
                      <Building2 size={16} />
                      {org.name}
                    </td>
                    <td>{org.users}</td>
                    <td>{formatNumber(org.donors)}</td>
                    <td>{formatCurrency(org.revenue)}</td>
                    <td>
                      <div className="health-indicator">
                        <div className="health-bar">
                          <div
                            className="health-fill"
                            style={{
                              width: `${org.health}%`,
                              background: org.health >= 90 ? '#43e97b' : org.health >= 75 ? '#fbbf24' : '#f5576c',
                            }}
                          ></div>
                        </div>
                        <span>{org.health}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${org.status.toLowerCase()}`}>
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Platform Metrics Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Platform Growth Trend</h3>
          <p>Revenue, users, and organization growth over time</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.platform_metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis yAxisId="left" stroke="#64748b" tickFormatter={(value) => `$${value / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                  name === 'revenue' ? 'Revenue' : name === 'users' ? 'Users' : 'Organizations',
                ]}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#667eea"
                strokeWidth={3}
                name="Revenue"
                dot={{ fill: '#667eea', r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="users"
                stroke="#43e97b"
                strokeWidth={2}
                name="Users"
                dot={{ fill: '#43e97b', r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orgs"
                stroke="#f093fb"
                strokeWidth={2}
                name="Organizations"
                dot={{ fill: '#f093fb', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Distribution & Revenue Breakdown */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>User Role Distribution</h3>
            <p>Platform-wide user breakdown by role</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.user_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="role" type="category" stroke="#64748b" width={120} />
                <Tooltip
                  formatter={(value) => formatNumber(value)}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="url(#colorRole)" radius={[0, 8, 8, 0]} />
                <defs>
                  <linearGradient id="colorRole" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue by Organization</h3>
            <p>Top contributors to platform revenue</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.revenue_by_org}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {data.revenue_by_org.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>System Alerts</h3>
          <p>Recent platform notifications and status updates</p>
        </div>
        <div className="chart-body">
          <div className="alerts-list">
            {data.system_alerts.map((alert, index) => (
              <div key={index} className={`alert-item alert-${alert.type}`}>
                <AlertCircle size={20} />
                <div className="alert-content">
                  <p className="alert-message">{alert.message}</p>
                  <span className="alert-time">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminPanel;
