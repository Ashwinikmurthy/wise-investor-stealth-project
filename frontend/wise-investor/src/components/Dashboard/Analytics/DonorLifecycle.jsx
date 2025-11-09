import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  UserPlus,
  Heart,
  Award,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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

const DonorLifecycle = () => {
  const { API_BASE_URL, getOrganizationId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDonorLifecycle();
  }, []);

  const fetchDonorLifecycle = async () => {
    try {
      setLoading(true);
      
      const orgId = getOrganizationId();
      if (!orgId) {
        throw new Error('Organization ID not found. Please login again.');
      }
      
      const response = await api.get(`/api/v1/analytics/donor-lifecycle/${orgId}`);
      
      console.log('Donor Lifecycle API Response:', response.data);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching donor lifecycle:', err);
      setError('Failed to load donor lifecycle data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading donor lifecycle analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} color="#f5576c" />
        <h3>Unable to Load Data</h3>
        <p>{error}</p>
        <button onClick={fetchDonorLifecycle} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.pipeline_stages) {
    return (
      <div className="error-container">
        <p>No donor lifecycle data available</p>
      </div>
    );
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Get metrics from YOUR API structure
  const summary = data.summary || {};
  const totalDonors = summary.total_in_pipeline || 0;
  const totalValue = summary.total_pipeline_value || 0;
  const conversionRate = summary.overall_conversion_rate || 0;
  
  // Calculate metrics from pipeline stages
  const pipelineStages = data.pipeline_stages || [];
  
  // Get specific stage counts
  const activeCount = pipelineStages.find(s => s.stage === 'Active')?.count || 0;
  const newDonorCount = pipelineStages.find(s => s.stage === 'New Donor')?.count || 0;
  const lapsedCount = pipelineStages.find(s => s.stage === 'Lapsed')?.count || 0;
  
  // Calculate retention rate (active / (active + lapsed))
  const retentionRate = (activeCount + newDonorCount) > 0 
    ? ((activeCount / (activeCount + lapsedCount + newDonorCount)) * 100).toFixed(1)
    : 0;
  
  // Calculate avg lifetime value
  const avgLifetimeValue = totalDonors > 0 ? (totalValue / totalDonors) : 0;

  // Colors for pipeline stages
  const COLORS = ['#667eea', '#43e97b', '#f093fb', '#fa709a', '#f5576c'];

  // Transform data for charts - filter out stages with 0 count for better visualization
  const chartData = pipelineStages.filter(stage => stage.count > 0);

  return (
    <div className="analytics-container donor-lifecycle">
      <div className="analytics-header">
        <div>
          <h2>Donor Lifecycle Analytics</h2>
          <p>Track acquisition, retention, and lifetime value across donor segments</p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Users size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Donors</p>
            <h3 className="metric-value">{formatNumber(totalDonors)}</h3>
            <p className="metric-subtitle">In pipeline</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <UserPlus size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Acquisition Rate</p>
            <h3 className="metric-value">{conversionRate}%</h3>
            <p className="metric-subtitle">New donors this month</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Heart size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Retention Rate</p>
            <h3 className="metric-value">{retentionRate}%</h3>
            <p className="metric-subtitle">Active donor retention</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Award size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Avg Lifetime Value</p>
            <h3 className="metric-value">{formatCurrency(avgLifetimeValue)}</h3>
            <p className="metric-subtitle">Per donor</p>
          </div>
        </div>
      </div>

      {/* Pipeline Stages Cards */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Donor Pipeline Stages</h3>
          <p>Current distribution across lifecycle stages</p>
        </div>
        <div className="chart-body">
          <div className="pipeline-stages">
            {pipelineStages.map((stage, index) => {
              const percentage = totalDonors > 0 
                ? ((stage.count / totalDonors) * 100).toFixed(1) 
                : 0;
              
              return (
                <div key={index} className="pipeline-stage-card">
                  <div className="stage-header">
                    <h4>{stage.stage}</h4>
                    <span className={`status-badge ${stage.count > 0 ? 'status-green' : 'status-amber'}`}>
                      {stage.count > 0 ? 'active' : 'empty'}
                    </span>
                  </div>
                  <div className="stage-metrics">
                    <div className="stage-count">
                      <span className="count-value">{formatNumber(stage.count)}</span>
                      <span className="count-label">donors</span>
                    </div>
                    <div className="stage-value">
                      <span className="value-amount">{formatCurrency(stage.total_value)}</span>
                      <span className="value-label">total value</span>
                    </div>
                  </div>
                  <div className="stage-percentage">
                    <div
                      className="percentage-bar"
                      style={{
                        width: `${percentage}%`,
                        minWidth: '20px',
                        background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`
                      }}
                    >
                      <span className="percentage-text">{percentage}%</span>
                    </div>
                  </div>
                  {stage.conversion_rate !== null && (
                    <p className="stage-detail">
                      Conversion: {stage.conversion_rate}% | 
                      Avg days: {stage.avg_days_in_stage || 'N/A'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts - Only show if there's data */}
      {chartData.length > 0 ? (
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Donor Distribution</h3>
              <p>Breakdown by lifecycle stage</p>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ stage, count }) => `${stage}: ${formatNumber(count)}`}
                  >
                    {chartData.map((entry, index) => (
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
              <h3>Value by Stage</h3>
              <p>Total pipeline value per stage</p>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="stage" 
                    stroke="#64748b"
                    angle={-45}
                    textAnchor="end"
                    height={100}
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
                  <Bar dataKey="total_value" fill="#667eea" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="chart-card">
          <div className="chart-body" style={{ textAlign: 'center', padding: '40px' }}>
            <AlertTriangle size={48} color="#f5576c" style={{ margin: '0 auto 20px' }} />
            <h3>No Donor Data in Pipeline</h3>
            <p>All pipeline stages show 0 donors. This could mean:</p>
            <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '20px auto' }}>
              <li>Donor statuses need to be updated (run fix_donor_statuses.py)</li>
              <li>No donors have been created yet (run generate_data_FINAL.py)</li>
              <li>Donor status field values don't match expected values</li>
            </ul>
            <button onClick={fetchDonorLifecycle} className="btn-primary" style={{ marginTop: '20px' }}>
              Refresh Data
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="summary-card">
        <h3>Pipeline Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Pipeline Value:</span>
            <span className="summary-value">{formatCurrency(totalValue)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Donors:</span>
            <span className="summary-value">{formatNumber(totalDonors)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Average Value per Donor:</span>
            <span className="summary-value">{formatCurrency(avgLifetimeValue)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Conversion Rate:</span>
            <span className="summary-value">{conversionRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorLifecycle;
