import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../../../utils/axiosInstance';
import '../Dashboard.css';

const DonorMovement = ({ organizationId }) => {
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

      const response = await api.get(`/api/v1/analytics/donor-movement/${orgId}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching donor movement:', err);
      setError(err.response?.data?.detail || 'Failed to load donor movement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading donor movement...</p>
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

  const netMovement = data.upgrades - data.downgrades;
  const netPositive = netMovement > 0;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Donor Movement</h2>
        <p>Tracking upgrades and downgrades: {data.period}</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <TrendingUp size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Upgrades</p>
            <h3 className="metric-value">{data.upgrades}</h3>
            <p className="metric-subtitle">Increased giving</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <TrendingDown size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Downgrades</p>
            <h3 className="metric-value">{data.downgrades}</h3>
            <p className="metric-subtitle">Decreased giving</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <Minus size={28} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Maintained</p>
            <h3 className="metric-value">{data.maintained}</h3>
            <p className="metric-subtitle">Consistent giving</p>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3>Net Movement Analysis</h3>
        </div>
        <div className="chart-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border-2 ${netPositive ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-3 mb-4">
                {netPositive ? (
                  <ArrowUpRight size={32} className="text-green-600" />
                ) : (
                  <ArrowDownRight size={32} className="text-red-600" />
                )}
                <div>
                  <p className={`text-sm font-medium ${netPositive ? 'text-green-700' : 'text-red-700'}`}>
                    Net Movement
                  </p>
                  <h3 className={`text-3xl font-bold ${netPositive ? 'text-green-900' : 'text-red-900'}`}>
                    {netPositive ? '+' : ''}{netMovement}
                  </h3>
                </div>
              </div>
              <p className={`text-sm ${netPositive ? 'text-green-800' : 'text-red-800'}`}>
                {netPositive 
                  ? 'More donors are upgrading than downgrading - a positive trend!'
                  : 'More donors are downgrading than upgrading - attention needed.'}
              </p>
            </div>

            <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={32} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Upgrade Rate</p>
                  <h3 className="text-3xl font-bold text-blue-900">
                    {data.upgrade_rate.toFixed(1)}%
                  </h3>
                </div>
              </div>
              <p className="text-sm text-blue-800">
                Percentage of donors who increased their giving level
              </p>
            </div>
          </div>

          <div className="mt-6 p-6 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-4">Movement Breakdown</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Upgrades</span>
                  <span className="font-semibold text-green-700">{data.upgrades}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: `${(data.upgrades / (data.upgrades + data.downgrades + data.maintained) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Maintained</span>
                  <span className="font-semibold text-blue-700">{data.maintained}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${(data.maintained / (data.upgrades + data.downgrades + data.maintained) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Downgrades</span>
                  <span className="font-semibold text-red-700">{data.downgrades}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500"
                    style={{ width: `${(data.downgrades / (data.upgrades + data.downgrades + data.maintained) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorMovement;
