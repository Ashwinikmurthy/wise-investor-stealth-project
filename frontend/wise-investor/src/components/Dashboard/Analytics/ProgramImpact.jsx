import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import {
  Target,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import '../Dashboard.css';

const ProgramImpact = () => {
  const { getOrganizationId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgramImpact();
  }, []);

  const fetchProgramImpact = async () => {
    try {
      setLoading(true);
      const orgId = getOrganizationId();
      if (!orgId) throw new Error('Organization ID not found');
      
      const response = await api.get(`/api/v1/analytics/program-impact/${orgId}`);
      console.log('Program Impact Response:', response.data);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching program impact:', err);
      setError('Failed to load program impact data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading program impact metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} color="#f5576c" />
        <h3>Unable to Load Data</h3>
        <p>{error}</p>
        <button onClick={fetchProgramImpact} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.programs) {
    return <div className="error-container">No program data available</div>;
  }

  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0);
  const formatCurrency = (num) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(num || 0);

  const summary = data.summary || {};
  const programs = data.programs || [];

  return (
    <div className="analytics-container program-impact">
      <div className="analytics-header">
        <div>
          <h2>Program Impact Analytics</h2>
          <p>Track effectiveness and outcomes across all programs</p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Target size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Programs</p>
            <h3 className="metric-value">{summary.total_programs || 0}</h3>
            <p className="metric-subtitle">Active programs</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <DollarSign size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Funding</p>
            <h3 className="metric-value">{formatCurrency(summary.total_funding)}</h3>
            <p className="metric-subtitle">Year to date</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Users size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Beneficiaries</p>
            <h3 className="metric-value">{formatNumber(summary.total_beneficiaries)}</h3>
            <p className="metric-subtitle">People served</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <TrendingUp size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Avg Efficiency</p>
            <h3 className="metric-value">{summary.average_efficiency || 0}%</h3>
            <p className="metric-subtitle">Program efficiency</p>
          </div>
        </div>
      </div>

      {/* Program Cards */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Program Performance</h3>
          <p>Detailed metrics for each program</p>
        </div>
        <div className="chart-body">
          <div className="programs-grid">
            {programs.map((program, index) => (
              <div key={index} className="program-card">
                <div className="program-header">
                  <h4>{program.program_name}</h4>
                  <span className={`status-badge ${program.efficiency_score > 85 ? 'status-green' : 'status-amber'}`}>
                    {program.efficiency_score}% efficient
                  </span>
                </div>
                
                <div className="program-metrics">
                  <div className="metric-row">
                    <span className="metric-label">Total Funding</span>
                    <span className="metric-value">{formatCurrency(program.total_funding)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Beneficiaries</span>
                    <span className="metric-value">{formatNumber(program.beneficiaries_served)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Donors</span>
                    <span className="metric-value">{formatNumber(program.donor_count)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Avg Donation</span>
                    <span className="metric-value">{formatCurrency(program.avg_donation)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Cost per Outcome</span>
                    <span className="metric-value">{formatCurrency(program.cost_per_outcome)}</span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-header">
                    <span>Progress vs Target</span>
                    <span>{program.progress_vs_target}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.min(program.progress_vs_target, 100)}%`,
                        background: program.progress_vs_target >= 80 
                          ? 'linear-gradient(90deg, #43e97b, #38f9d7)' 
                          : 'linear-gradient(90deg, #f093fb, #f5576c)'
                      }}
                    />
                  </div>
                  <div className="progress-details">
                    <small>Target: {formatCurrency(program.quarterly_target)}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funding Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Program Funding Breakdown</h3>
          <p>Resource allocation across programs</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={programs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="program_name" 
                stroke="#64748b"
                angle={-45}
                textAnchor="end"
                height={120}
              />
              <YAxis 
                stroke="#64748b"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="total_funding" fill="#667eea" name="Total Funding" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Efficiency Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Program Efficiency Scores</h3>
          <p>Operational effectiveness by program</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={programs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="program_name" type="category" width={150} />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="efficiency_score" fill="#43e97b" name="Efficiency Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgramImpact;
