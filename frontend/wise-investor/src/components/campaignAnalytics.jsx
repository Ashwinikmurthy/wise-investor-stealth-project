import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, Target, Calendar, Activity,
  Award, Clock, Zap, AlertCircle, CheckCircle, BarChart3,
  PieChart, TrendingDown, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

const colors = {
  primary: '#e87500',
  secondary: '#154734',
  accent: '#5fe0b7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
  }
};

const API_BASE_URL = '';

const CampaignAnalytics = ({ campaignId, organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);
  const [segments, setSegments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [topDonors, setTopDonors] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (campaignId && organizationId) {
      loadAnalytics();
    }
  }, [campaignId, organizationId]);

  const loadAnalytics = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    
    try {
      // Load all analytics endpoints
      const [perfRes, segRes, timeRes, patRes, donorRes, healthRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/campaigns/analytics/${campaignId}/performance?organization_id=${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/campaigns/analytics/${campaignId}/donor-segments?organization_id=${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/campaigns/analytics/${campaignId}/timeline?organization_id=${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/campaigns/analytics/${campaignId}/patterns?organization_id=${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/campaigns/analytics/${campaignId}/top-donors?organization_id=${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/campaigns/analytics/${campaignId}/health-score?organization_id=${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (perfRes.ok) setPerformance(await perfRes.json());
      if (segRes.ok) setSegments(await segRes.json());
      if (timeRes.ok) {
        const data = await timeRes.json();
        setTimeline(data.timeline || []);
      }
      if (patRes.ok) setPatterns(await patRes.json());
      if (donorRes.ok) setTopDonors(await donorRes.json());
      if (healthRes.ok) setHealthScore(await healthRes.json());
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getHealthColor = (status) => {
    switch(status) {
      case 'Excellent': return colors.success;
      case 'Good': return colors.accent;
      case 'Needs Attention': return colors.warning;
      case 'Critical': return colors.danger;
      default: return colors.gray[400];
    }
  };

  const getTrendIcon = (value, isPositive = true) => {
    if (value > 0) {
      return isPositive ? <ArrowUp size={16} color={colors.success} /> : <ArrowDown size={16} color={colors.danger} />;
    } else if (value < 0) {
      return isPositive ? <ArrowDown size={16} color={colors.danger} /> : <ArrowUp size={16} color={colors.success} />;
    }
    return <Minus size={16} color={colors.gray[400]} />;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="animate-spin" style={{ display: 'inline-block' }}>
          <Activity size={40} color={colors.primary} />
        </div>
        <p style={{ marginTop: '16px', color: colors.gray[600] }}>Loading analytics...</p>
      </div>
    );
  }

  if (!performance) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: colors.gray[600] }}>
        No analytics data available
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: colors.gray[50] }}>
      {/* Health Score Banner */}
      {healthScore && (
        <div style={{
          background: `linear-gradient(135deg, ${getHealthColor(healthScore.health_status)}15, ${getHealthColor(healthScore.health_status)}05)`,
          border: `2px solid ${getHealthColor(healthScore.health_status)}40`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Activity size={24} color={getHealthColor(healthScore.health_status)} />
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: colors.gray[800] }}>
                  Campaign Health: {healthScore.health_status}
                </h3>
              </div>
              <p style={{ margin: 0, color: colors.gray[600], fontSize: '14px' }}>
                Overall Score: {healthScore.overall_score}/100
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '24px' }}>
              <MetricBadge 
                label="Conversion"
                value={`${healthScore.conversion_score}/100`}
                color={colors.primary}
              />
              <MetricBadge 
                label="Momentum"
                value={`${healthScore.momentum_score}/100`}
                color={colors.secondary}
              />
              <MetricBadge 
                label="Engagement"
                value={`${healthScore.engagement_score}/100`}
                color={colors.accent}
              />
            </div>
          </div>
          
          {healthScore.recommendations && healthScore.recommendations.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.gray[200]}` }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '14px', color: colors.gray[700] }}>
                Recommendations:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {healthScore.recommendations.map((rec, idx) => (
                  <li key={idx} style={{ color: colors.gray[600], fontSize: '14px', marginBottom: '4px' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <MetricCard
          icon={<DollarSign size={24} />}
          label="Total Raised"
          value={formatCurrency(performance.total_raised)}
          subtitle={`${performance.progress_percentage}% of goal`}
          color={colors.primary}
          trend={performance.is_on_track ? '+' : '-'}
        />
        
        <MetricCard
          icon={<Users size={24} />}
          label="Total Donors"
          value={formatNumber(performance.donor_count)}
          subtitle={`${performance.donation_count} donations`}
          color={colors.secondary}
        />
        
        <MetricCard
          icon={<TrendingUp size={24} />}
          label="Avg Donation"
          value={formatCurrency(performance.average_donation)}
          subtitle={`Largest: ${formatCurrency(performance.largest_donation)}`}
          color={colors.accent}
        />
        
        <MetricCard
          icon={<Zap size={24} />}
          label="Daily Velocity"
          value={formatCurrency(performance.velocity_per_day)}
          subtitle={`${performance.days_active} days active`}
          color={colors.success}
        />
      </div>

      {/* Progress Bar */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: colors.gray[800] }}>
              Campaign Progress
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: colors.gray[600] }}>
              {formatCurrency(performance.total_raised)} of {formatCurrency(performance.goal_amount)} goal
            </p>
          </div>
          {performance.days_remaining !== null && (
            <div style={{
              background: colors.primary + '15',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={18} color={colors.primary} />
              <span style={{ fontWeight: '600', color: colors.primary }}>
                {performance.days_remaining} days left
              </span>
            </div>
          )}
        </div>
        
        <div style={{
          width: '100%',
          height: '16px',
          background: colors.gray[200],
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${Math.min(performance.progress_percentage, 100)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
            transition: 'width 0.5s ease'
          }} />
          {performance.projected_total && (
            <div style={{
              position: 'absolute',
              left: `${Math.min((performance.projected_total / performance.goal_amount) * 100, 100)}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              background: colors.accent,
              transform: 'translateX(-1px)'
            }} />
          )}
        </div>
        
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: colors.gray[600] }}>0%</span>
          {performance.projected_total && (
            <span style={{ color: colors.accent, fontWeight: '600' }}>
              Projected: {formatCurrency(performance.projected_total)}
            </span>
          )}
          <span style={{ color: colors.gray[600] }}>100%</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: `2px solid ${colors.gray[100]}`,
          background: colors.gray[50]
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
            { id: 'donors', label: 'Donor Insights', icon: <Users size={18} /> },
            { id: 'timeline', label: 'Timeline', icon: <Calendar size={18} /> },
            { id: 'patterns', label: 'Patterns', icon: <Activity size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '16px',
                background: activeTab === tab.id ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `3px solid ${colors.primary}` : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? colors.primary : colors.gray[600],
                transition: 'all 0.2s',
                fontSize: '14px'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Donor Segments</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                {segments.map((segment, idx) => (
                  <DonorSegmentRow key={idx} segment={segment} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'donors' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Top Donors</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {topDonors.map((donor, idx) => (
                  <TopDonorCard key={idx} donor={donor} rank={idx + 1} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Donation Timeline</h3>
              {timeline.length > 0 ? (
                <SimpleLineChart data={timeline} />
              ) : (
                <p style={{ color: colors.gray[600] }}>No timeline data available</p>
              )}
            </div>
          )}

          {activeTab === 'patterns' && patterns && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Donation Patterns</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <PatternChart 
                  title="Day of Week"
                  data={patterns.day_of_week_distribution}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                />
                <PatternChart 
                  title="Recurring vs One-Time"
                  data={patterns.recurring_vs_one_time}
                  isPie={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components

const MetricCard = ({ icon, label, value, subtitle, color, trend }) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: `1px solid ${colors.gray[100]}`
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}>
        {icon}
      </div>
      {trend && (
        <div style={{
          background: trend === '+' ? colors.success + '15' : colors.danger + '15',
          color: trend === '+' ? colors.success : colors.danger,
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {trend === '+' ? '↑' : '↓'}
        </div>
      )}
    </div>
    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: colors.gray[600], fontWeight: '500' }}>
      {label}
    </p>
    <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: colors.gray[800] }}>
      {value}
    </p>
    {subtitle && (
      <p style={{ margin: 0, fontSize: '12px', color: colors.gray[500] }}>
        {subtitle}
      </p>
    )}
  </div>
);

const MetricBadge = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      background: 'white',
      border: `2px solid ${color}30`,
      borderRadius: '12px',
      padding: '12px 20px',
      minWidth: '100px'
    }}>
      <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: colors.gray[600], fontWeight: '600', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: color }}>
        {value}
      </p>
    </div>
  </div>
);

const DonorSegmentRow = ({ segment }) => {
  const maxAmount = 100000; // For bar visualization
  const barWidth = (segment.total_amount / maxAmount) * 100;
  
  return (
    <div style={{
      background: colors.gray[50],
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.gray[200]}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: colors.gray[800] }}>
            {segment.segment}
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: colors.gray[600] }}>
            {segment.donor_count} donors • Avg: ${segment.average_donation.toLocaleString()}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: colors.primary }}>
            ${segment.total_amount.toLocaleString()}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: colors.gray[600] }}>
            {segment.percentage_of_total.toFixed(1)}% of total
          </p>
        </div>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        background: colors.gray[200],
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${Math.min(barWidth, 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
};

const TopDonorCard = ({ donor, rank }) => (
  <div style={{
    background: rank <= 3 ? `${colors.primary}08` : colors.gray[50],
    border: `1px solid ${rank <= 3 ? colors.primary + '30' : colors.gray[200]}`,
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: rank <= 3 ? colors.primary : colors.gray[300],
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: '16px',
      flexShrink: 0
    }}>
      {rank}
    </div>
    <div style={{ flex: 1 }}>
      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: colors.gray[800] }}>
        {donor.donor_name}
      </h4>
      <p style={{ margin: 0, fontSize: '13px', color: colors.gray[600] }}>
        {donor.email} • {donor.donation_count} donations
      </p>
    </div>
    <div style={{ textAlign: 'right' }}>
      <p style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: colors.primary }}>
        ${donor.total_donated.toLocaleString()}
      </p>
      <p style={{ margin: 0, fontSize: '12px', color: colors.gray[600] }}>
        Avg: ${donor.average_donation.toLocaleString()}
      </p>
    </div>
  </div>
);

const SimpleLineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '200px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: colors.gray[400]
      }}>
        No data available
      </div>
    );
  }
  
  const maxAmount = Math.max(...data.map(d => d.cumulative_amount || 0));
  const height = 200;
  const width = 800; // Fixed width for calculations
  const padding = 20;
  
  return (
    <div style={{ position: 'relative', height: `${height}px`, padding: '20px 0' }}>
      <svg 
        width="100%" 
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        <polyline
          fill="none"
          stroke={colors.primary}
          strokeWidth="2"
          points={data.map((d, i) => {
            const x = padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);
            const y = height - padding - ((d.cumulative_amount / maxAmount) * (height - 2 * padding));
            return `${x},${y}`;
          }).join(' ')}
        />
      </svg>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '8px',
        fontSize: '12px',
        color: colors.gray[600]
      }}>
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

const PatternChart = ({ title, data, labels, isPie = false }) => {
  const values = Object.values(data);
  const keys = Object.keys(data);
  const max = Math.max(...values);
  
  return (
    <div style={{
      background: colors.gray[50],
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.gray[200]}`
    }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: colors.gray[800] }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {keys.map((key, idx) => {
          const value = values[idx];
          const percentage = (value / max) * 100;
          const label = labels ? labels[idx] : key;
          
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span style={{ color: colors.gray[700], fontWeight: '500' }}>{label}</span>
                <span style={{ color: colors.primary, fontWeight: '600' }}>${value.toLocaleString()}</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: colors.gray[200],
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: colors.primary,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignAnalytics;
