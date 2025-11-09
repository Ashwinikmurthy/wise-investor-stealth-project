import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, ChevronRight } from 'lucide-react';
import api from '../../../utils/axiosInstance';
import '../Dashboard.css';

const SWOTAnalysis = ({ organizationId }) => {
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
      const response = await api.get(`/api/v1/analytics/swot/${orgId}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching SWOT analysis:', err);
      setError(err.response?.data?.detail || 'Failed to load SWOT analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading SWOT analysis...</p>
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

  const categoryConfig = {
    strengths: {
      icon: TrendingUp,
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#6ee7b7',
      textColor: '#065f46',
      title: 'Strengths'
    },
    weaknesses: {
      icon: TrendingDown,
      color: '#ef4444',
      bgColor: '#fee2e2',
      borderColor: '#fca5a5',
      textColor: '#991b1b',
      title: 'Weaknesses'
    },
    opportunities: {
      icon: Target,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      borderColor: '#93c5fd',
      textColor: '#1e40af',
      title: 'Opportunities'
    },
    threats: {
      icon: AlertTriangle,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      borderColor: '#fcd34d',
      textColor: '#92400e',
      title: 'Threats'
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>SWOT Analysis</h2>
        <p>Strategic assessment of organizational position</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((category, idx) => {
          const config = categoryConfig[category.category];
          const Icon = config.icon;

          return (
            <div
              key={idx}
              className="chart-card"
              style={{
                background: config.bgColor,
                borderLeft: `4px solid ${config.color}`
              }}
            >
              <div className="chart-header" style={{ borderBottom: 'none' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="metric-icon"
                    style={{
                      background: config.color,
                      width: '48px',
                      height: '48px'
                    }}
                  >
                    <Icon size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{ color: config.textColor, marginBottom: '0.25rem' }}>
                      {config.title}
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: config.textColor,
                      opacity: 0.8,
                      margin: 0 
                    }}>
                      {category.items.length} items identified
                    </p>
                  </div>
                </div>
              </div>

              <div className="chart-body">
                <ul className="space-y-3" style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0 
                }}>
                  {category.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{
                        background: 'white',
                        border: `1px solid ${config.borderColor}`
                      }}
                    >
                      <ChevronRight
                        size={18}
                        style={{ 
                          color: config.color, 
                          flexShrink: 0, 
                          marginTop: '2px' 
                        }}
                      />
                      <span style={{ 
                        color: '#374151', 
                        lineHeight: '1.5',
                        fontSize: '0.9375rem'
                      }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="chart-card" style={{ marginTop: '2rem' }}>
        <div className="chart-header">
          <h3>Strategic Recommendations</h3>
        </div>
        <div className="chart-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Leverage Strengths</h4>
              <p className="text-sm text-blue-800">
                Capitalize on core competencies to pursue opportunities and build competitive advantage.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Seize Opportunities</h4>
              <p className="text-sm text-green-800">
                Align resources with market opportunities to maximize impact and growth potential.
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">Address Weaknesses</h4>
              <p className="text-sm text-red-800">
                Develop improvement plans for identified gaps to strengthen organizational capabilities.
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">Mitigate Threats</h4>
              <p className="text-sm text-amber-800">
                Create contingency plans and defensive strategies to protect against external risks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SWOTAnalysis;
