import React, { useState, useEffect } from 'react';
import { Target, Calendar, User } from 'lucide-react';
import api from '../../../utils/axiosInstance';
import '../Dashboard.css';

const MissionVision = ({ organizationId }) => {
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
      const response = await api.get(`/api/v1/analytics/mission-vision/${orgId}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching mission vision:', err);
      setError(err.response?.data?.detail || 'Failed to load mission and vision data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading mission and vision...</p>
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

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Mission & Vision</h2>
        <p>Core organizational purpose and strategic direction</p>
      </div>

      <div className="space-y-6">
        {/* Mission Statement */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Mission Statement</h3>
              <p>Our purpose and what we do</p>
            </div>
            <div className="status-badge status-blue">
              <Target size={16} />
              <span>Core Purpose</span>
            </div>
          </div>
          <div className="chart-body">
            <p className="mission-text">{data.mission}</p>
          </div>
        </div>

        {/* Vision Statement */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Vision Statement</h3>
              <p>Our aspirational future state</p>
            </div>
            <div className="status-badge status-blue">
              <Target size={16} />
              <span>Future State</span>
            </div>
          </div>
          <div className="chart-body">
            <p className="mission-text">{data.vision}</p>
          </div>
        </div>

        {/* Brand Promise */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Brand Promise</h3>
              <p>What stakeholders can expect from us</p>
            </div>
          </div>
          <div className="chart-body">
            <p className="mission-text">{data.brand_promise}</p>
          </div>
        </div>

        {/* North Star Objective */}
        <div className="chart-card" style={{ 
          background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
          border: '2px solid #3b82f6'
        }}>
          <div className="chart-header">
            <div>
              <h3>North Star Objective</h3>
              <p>Our primary strategic goal</p>
            </div>
            <div className="status-badge status-blue">
              <Target size={16} />
              <span>Strategic Priority</span>
            </div>
          </div>
          <div className="chart-body">
            <p className="north-star-text" style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: '#1e40af',
              marginBottom: '1.5rem'
            }}>
              {data.north_star_objective}
            </p>
            <div className="metric-row">
              <div className="flex items-center gap-2">
                <User size={18} style={{ color: '#3b82f6' }} />
                <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>Owner:</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>{data.owner}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} style={{ color: '#3b82f6' }} />
                <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>Last Updated:</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>
                  {new Date(data.last_updated).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionVision;
