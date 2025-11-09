import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Percent, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../../utils/axiosInstance';
import '../Dashboard.css';

const DonorSegments = ({ organizationId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const orgId = getOrganizationId();
      if (!orgId) {
        throw new Error('Organization ID not found. Please login again.');
      }

      const response = await api.get(`/api/v1/analytics/donor-segments/${orgId}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching donor segments:', err);
      setError(err.response?.data?.detail || 'Failed to load donor segments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading donor segments...</p>
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

  if (!data || !data.segments) return null;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
  
  const totalDonors = data.segments.reduce((sum, seg) => sum + seg.donor_count, 0);
  const totalValue = data.segments.reduce((sum, seg) => sum + seg.total_value, 0);

  const pieData = data.segments.map(seg => ({
    name: seg.name,
    value: seg.donor_count,
    percentage: seg.percentage
  }));

  const barData = data.segments.map(seg => ({
    name: seg.name,
    donors: seg.donor_count,
    value: seg.total_value,
    avgValue: seg.avg_value
  }));

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Donor Segments</h2>
        <p>Donor base segmented by giving levels</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <Users size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Donors</p>
            <h3 className="metric-value">{totalDonors.toLocaleString()}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <DollarSign size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Value</p>
            <h3 className="metric-value">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <TrendingUp size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Average per Donor</p>
            <h3 className="metric-value">${(totalValue / totalDonors).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Donor Count by Segment</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Total Value by Segment</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3>Segment Details</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Donor Count</th>
                <th>Total Value</th>
                <th>Avg Value</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.segments.map((seg, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="font-semibold">{seg.name}</span>
                  </td>
                  <td>{seg.donor_count.toLocaleString()}</td>
                  <td>${seg.total_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>${seg.avg_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>
                    <span className="status-badge status-blue">
                      {seg.percentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DonorSegments;
