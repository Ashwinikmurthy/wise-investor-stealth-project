import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Award,
  Calendar,
  Lock
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import '../Dashboard.css';

const ExecutiveReport = () => {
  const { API_BASE_URL, getOrganizationId, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Check role access
    if (!user) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    const userRole = user.role?.toLowerCase();
    const allowedRoles = ['admin', 'board', 'superadmin'];
    
    if (!user.is_superadmin && !allowedRoles.includes(userRole)) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    fetchExecutiveReport();
  }, [user]);

  const fetchExecutiveReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const orgId = getOrganizationId();
      if (!orgId) {
        throw new Error('Organization ID not found. Please login again.');
      }
      
      // UPDATED API ENDPOINT
      const response = await api.get(`/api/v1/analytics/executive-report/${orgId}`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching executive report:', err);
      
      if (err.response?.status === 403) {
        setAccessDenied(true);
      } else {
        setError(err.response?.data?.detail || err.message);
        setData(getMockData());
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => ({
    period: 'Q2 2024',
    executive_summary: {
      total_revenue: 2487650,
      revenue_growth: 18.3,
      donor_count: 1247,
      donor_growth: 12.5,
      beneficiaries: 15420,
      program_efficiency: 92.5,
      roi: 4.8,
    },
    financial_overview: [
      { quarter: 'Q1 2023', revenue: 485000, expenses: 425000, net: 60000 },
      { quarter: 'Q2 2023', revenue: 520000, expenses: 445000, net: 75000 },
      { quarter: 'Q3 2023', revenue: 495000, expenses: 438000, net: 57000 },
      { quarter: 'Q4 2023', revenue: 680000, expenses: 595000, net: 85000 },
      { quarter: 'Q1 2024', revenue: 610000, expenses: 520000, net: 90000 },
      { quarter: 'Q2 2024', revenue: 720000, expenses: 615000, net: 105000 },
    ],
    strategic_metrics: [
      { metric: 'Donor Retention', score: 78, target: 75 },
      { metric: 'Program Impact', score: 92, target: 85 },
      { metric: 'Digital Engagement', score: 88, target: 80 },
      { metric: 'Operational Efficiency', score: 90, target: 85 },
      { metric: 'Brand Awareness', score: 82, target: 75 },
      { metric: 'Stakeholder Satisfaction', score: 89, target: 85 },
    ],
    key_initiatives: [
      {
        initiative: 'Major Gifts Campaign',
        status: 'On Track',
        progress: 85,
        impact: 'High',
        budget: 850000,
        raised: 722500,
      },
      {
        initiative: 'Digital Transformation',
        status: 'Ahead',
        progress: 92,
        impact: 'Medium',
        budget: 150000,
        raised: 138000,
      },
      {
        initiative: 'Community Expansion',
        status: 'On Track',
        progress: 78,
        impact: 'High',
        budget: 480000,
        raised: 374400,
      },
      {
        initiative: 'Education Programs',
        status: 'On Track',
        progress: 88,
        impact: 'Critical',
        budget: 620000,
        raised: 545600,
      },
    ],
    risk_assessment: [
      { area: 'Funding Diversification', level: 'Low', score: 85 },
      { area: 'Donor Retention', level: 'Medium', score: 65 },
      { area: 'Market Competition', level: 'Medium', score: 70 },
      { area: 'Operational Capacity', level: 'Low', score: 88 },
      { area: 'Regulatory Compliance', level: 'Low', score: 92 },
    ],
    quarterly_highlights: [
      'Exceeded fundraising goal by 18%, raising $720,000',
      'Launched new digital engagement platform, increasing online donations by 34%',
      'Served 15,420 beneficiaries across 8 active programs',
      'Achieved 92.5% program efficiency rating from external audit',
      'Secured three major corporate partnerships worth $450,000',
    ],
  });

  if (accessDenied) {
    return (
      <div className="analytics-container">
        <div className="access-denied-card">
          <div className="access-denied-icon">
            <Lock size={64} color="#ef4444" />
          </div>
          <h2>Access Denied</h2>
          <p>You don't have permission to view executive reports.</p>
          <p className="role-required">Required role: Admin or Board Member</p>
          <p className="current-role">Your role: {user?.role || 'Unknown'}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/dashboard')}
            style={{ marginTop: '20px' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading executive report...</p>
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

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here');
  };

  return (
    <div className="analytics-container executive-report">
      <div className="analytics-header">
        <div>
          <h2>Executive Report</h2>
          <p>Comprehensive performance summary for board presentations - {data.period}</p>
        </div>
        <button className="btn btn-primary" onClick={handleExportPDF}>
          <Download size={20} />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Executive Summary */}
      <div className="executive-summary-card">
        <h3>Executive Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <DollarSign size={28} />
            </div>
            <div className="summary-content">
              <p className="summary-label">Total Revenue</p>
              <h3 className="summary-value">{formatCurrency(data.executive_summary.total_revenue)}</h3>
              <div className="metric-change positive">
                <TrendingUp size={16} />
                <span>{data.executive_summary.revenue_growth}% YoY</span>
              </div>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <Users size={28} />
            </div>
            <div className="summary-content">
              <p className="summary-label">Active Donors</p>
              <h3 className="summary-value">{formatNumber(data.executive_summary.donor_count)}</h3>
              <div className="metric-change positive">
                <TrendingUp size={16} />
                <span>{data.executive_summary.donor_growth}% growth</span>
              </div>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Target size={28} />
            </div>
            <div className="summary-content">
              <p className="summary-label">Beneficiaries Served</p>
              <h3 className="summary-value">{formatNumber(data.executive_summary.beneficiaries)}</h3>
              <p className="summary-subtitle">Total impact</p>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <Award size={28} />
            </div>
            <div className="summary-content">
              <p className="summary-label">Program Efficiency</p>
              <h3 className="summary-value">{data.executive_summary.program_efficiency}%</h3>
              <p className="summary-subtitle">ROI: {data.executive_summary.roi}x</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Performance */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Financial Performance Trend</h3>
          <p>Quarterly revenue, expenses, and net income</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data.financial_overview}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="quarter" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                fill="#667eea"
                stroke="#667eea"
                fillOpacity={0.3}
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                fill="#f5576c"
                stroke="#f5576c"
                fillOpacity={0.3}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#43e97b"
                strokeWidth={3}
                name="Net Income"
                dot={{ fill: '#43e97b', r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategic Metrics & Key Initiatives */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Strategic Performance Scorecard</h3>
            <p>Key metrics vs targets</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={data.strategic_metrics}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#64748b" />
                <Radar
                  name="Actual"
                  dataKey="score"
                  stroke="#667eea"
                  fill="#667eea"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Key Initiatives Progress</h3>
            <p>Strategic project tracking</p>
          </div>
          <div className="chart-body initiatives-list">
            {data.key_initiatives.map((initiative, index) => (
              <div key={index} className="initiative-item">
                <div className="initiative-header">
                  <div>
                    <h4>{initiative.initiative}</h4>
                    <span className={`status-badge ${initiative.status.toLowerCase().replace(' ', '-')}`}>
                      {initiative.status}
                    </span>
                    <span className={`impact-badge ${initiative.impact.toLowerCase()}`}>
                      {initiative.impact} Impact
                    </span>
                  </div>
                  <div className="initiative-progress-label">
                    {initiative.progress}%
                  </div>
                </div>
                <div className="initiative-progress-bar">
                  <div
                    className="initiative-progress-fill"
                    style={{ width: `${initiative.progress}%` }}
                  ></div>
                </div>
                <div className="initiative-stats">
                  <span>Budget: {formatCurrency(initiative.budget)}</span>
                  <span>Raised: {formatCurrency(initiative.raised)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quarterly Highlights */}
      <div className="highlights-card">
        <h3>
          <Calendar size={24} />
          Quarterly Highlights
        </h3>
        <ul className="highlights-list">
          {data.quarterly_highlights.map((highlight, index) => (
            <li key={index}>{highlight}</li>
          ))}
        </ul>
      </div>

      {/* Risk Assessment */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Risk Assessment Matrix</h3>
          <p>Organizational risk levels across key areas</p>
        </div>
        <div className="chart-body risk-matrix">
          {data.risk_assessment.map((risk, index) => (
            <div key={index} className="risk-item">
              <div className="risk-info">
                <span className="risk-area">{risk.area}</span>
                <span className={`risk-level ${risk.level.toLowerCase()}`}>{risk.level} Risk</span>
              </div>
              <div className="risk-score-bar">
                <div
                  className="risk-score-fill"
                  style={{
                    width: `${risk.score}%`,
                    background: risk.level === 'Low' ? '#43e97b' : risk.level === 'Medium' ? '#fbbf24' : '#f5576c',
                  }}
                ></div>
              </div>
              <span className="risk-score">{risk.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReport;
