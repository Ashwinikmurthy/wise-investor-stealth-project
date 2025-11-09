import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Users, Target, Award } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../../utils/axiosInstance';
import '../Dashboard.css';

const RevenueRollup = ({ organizationId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('ytd'); // ytd, quarterly, monthly

  useEffect(() => {
    fetchData();
  }, [organizationId, timeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const orgId = getOrganizationId();
      if (!orgId) {
        throw new Error('Organization ID not found. Please login again.');
      }

      const response = await api.get(`/api/v1/analytics/revenue-rollup/${orgId}?timeframe=${timeframe}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching revenue rollup:', err);
      setError(err.response?.data?.detail || 'Failed to load revenue rollup data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading revenue rollup...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchData} className="btn-primary">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Calculate totals
  const totalRevenue = data.revenue_by_source?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalDonors = data.donor_metrics?.total_donors || 0;
  const avgDonation = totalDonors > 0 ? totalRevenue / totalDonors : 0;

  // Prepare chart data
  const revenueBySourceData = data.revenue_by_source?.map(item => ({
    name: item.source,
    amount: item.amount,
    count: item.donation_count,
    percentage: (item.amount / totalRevenue * 100).toFixed(1)
  })) || [];

  const monthlyTrendData = data.monthly_trend?.map(item => ({
    month: item.month,
    revenue: item.revenue,
    donors: item.unique_donors,
    donations: item.donation_count
  })) || [];

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h2>Revenue Rollup</h2>
          <p>Comprehensive revenue analysis and breakdown</p>
        </div>
        <div className="header-actions">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="ytd">Year to Date</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <DollarSign size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Revenue</p>
            <h3 className="metric-value">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <p className="metric-subtitle">
              {data.growth_rate > 0 ? (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={16} />
                  +{data.growth_rate?.toFixed(1)}% vs last period
                </span>
              ) : (
                <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingDown size={16} />
                  {data.growth_rate?.toFixed(1)}% vs last period
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            <Users size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Donors</p>
            <h3 className="metric-value">{totalDonors.toLocaleString()}</h3>
            <p className="metric-subtitle">Active contributors</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
            <Target size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Average Donation</p>
            <h3 className="metric-value">${avgDonation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <p className="metric-subtitle">Per donor</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Award size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Largest Gift</p>
            <h3 className="metric-value">${(data.largest_donation || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <p className="metric-subtitle">Single donation</p>
          </div>
        </div>
      </div>

      {/* Revenue by Source */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue by Source</h3>
            <p>Where your funding comes from</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={revenueBySourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={120}
                  dataKey="amount"
                >
                  {revenueBySourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '0.75rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue by Source Detail</h3>
            <p>Amount and donation count</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueBySourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="amount" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Revenue Trend</h3>
          <p>Monthly revenue performance</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Revenue') return `$${value.toLocaleString()}`;
                  return value;
                }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Revenue"
                dot={{ fill: '#3b82f6', r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="donors" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Unique Donors"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Revenue Source Breakdown</h3>
          <p>Detailed analysis by source</p>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Revenue</th>
                <th>% of Total</th>
                <th>Donations</th>
                <th>Avg Gift</th>
                <th>Donors</th>
              </tr>
            </thead>
            <tbody>
              {revenueBySourceData.map((source, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div 
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: COLORS[idx % COLORS.length]
                        }}
                      ></div>
                      <span className="font-semibold">{source.name}</span>
                    </div>
                  </td>
                  <td className="font-semibold">${source.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>
                    <span className="status-badge status-blue">{source.percentage}%</span>
                  </td>
                  <td>{source.count}</td>
                  <td>${(source.amount / source.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>{Math.floor(source.count * 0.7)}</td>
                </tr>
              ))}
              <tr style={{ 
                backgroundColor: '#f9fafb', 
                fontWeight: 'bold',
                borderTop: '2px solid #e5e7eb' 
              }}>
                <td>TOTAL</td>
                <td>${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td>100%</td>
                <td>{revenueBySourceData.reduce((sum, s) => sum + s.count, 0)}</td>
                <td>${avgDonation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td>{totalDonors}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Key Insights & Recommendations</h3>
        </div>
        <div className="chart-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <TrendingUp size={20} />
                Top Performing Source
              </h4>
              <p className="text-sm text-blue-800">
                {revenueBySourceData[0]?.name} generated ${revenueBySourceData[0]?.amount.toLocaleString()} 
                ({revenueBySourceData[0]?.percentage}% of total revenue). 
                Consider increasing investment in this channel.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Target size={20} />
                Revenue Concentration
              </h4>
              <p className="text-sm text-green-800">
                Top 2 sources account for {(parseFloat(revenueBySourceData[0]?.percentage || 0) + 
                parseFloat(revenueBySourceData[1]?.percentage || 0)).toFixed(1)}% of revenue. 
                Diversification may reduce risk.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Users size={20} />
                Donor Engagement
              </h4>
              <p className="text-sm text-purple-800">
                Average donation of ${avgDonation.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
                across {totalDonors} donors. Focus on upgrading mid-tier donors.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Calendar size={20} />
                Growth Trend
              </h4>
              <p className="text-sm text-amber-800">
                {data.growth_rate > 0 ? (
                  <>Revenue is up {data.growth_rate?.toFixed(1)}% compared to last period. 
                  Maintain momentum with consistent donor communication.</>
                ) : (
                  <>Revenue declined {Math.abs(data.growth_rate)?.toFixed(1)}%. 
                  Review recent campaigns and consider reactivation strategies.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueRollup;
