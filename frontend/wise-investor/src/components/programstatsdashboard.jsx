import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Heart, Users, GraduationCap, Utensils, Home, Briefcase, 
  Leaf, DollarSign, Baby, Shield, Brain, Star, TrendingUp,
  Target, Award, ArrowRight, RefreshCw, Plus, Edit2, Check,
  AlertCircle, ChevronRight, Sparkles
} from 'lucide-react';

// UT Dallas Color Palette
const COLORS = {
  primary: '#E87500',
  secondary: '#154734',
  accent: '#5fe0b7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  bgLight: '#F8FAFC',
  textDark: '#0F172A',
  textMuted: '#334155',
  textSoft: '#64748B',
  borderLight: '#E2E8F0',
};

// Icon mapping for categories
const CATEGORY_ICONS = {
  food_security: Utensils,
  education: GraduationCap,
  healthcare: Heart,
  housing: Home,
  employment: Briefcase,
  environment: Leaf,
  community: Users,
  financial: DollarSign,
  children: Baby,
  elderly: Users,
  disaster_relief: Shield,
  mental_health: Brain,
  custom: Star,
};

const CATEGORY_COLORS = {
  food_security: { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' },
  education: { bg: '#DBEAFE', text: '#2563EB', border: '#3B82F6' },
  healthcare: { bg: '#FCE7F3', text: '#DB2777', border: '#EC4899' },
  housing: { bg: '#E0E7FF', text: '#4F46E5', border: '#6366F1' },
  employment: { bg: '#D1FAE5', text: '#059669', border: '#10B981' },
  environment: { bg: '#DCFCE7', text: '#16A34A', border: '#22C55E' },
  community: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' },
  financial: { bg: '#FEF9C3', text: '#CA8A04', border: '#EAB308' },
  children: { bg: '#FBCFE8', text: '#BE185D', border: '#EC4899' },
  elderly: { bg: '#E0E7FF', text: '#4338CA', border: '#6366F1' },
  disaster_relief: { bg: '#FED7AA', text: '#C2410C', border: '#F97316' },
  mental_health: { bg: '#F3E8FF', text: '#7C3AED', border: '#A855F7' },
  custom: { bg: '#F1F5F9', text: '#475569', border: '#64748B' },
};

/**
 * Featured Impact Card - Single impact metric display
 */
const ImpactCard = ({ impact, size = 'medium' }) => {
  const IconComponent = CATEGORY_ICONS[impact.category] || Star;
  const colors = CATEGORY_COLORS[impact.category] || CATEGORY_COLORS.custom;
  
  const sizeStyles = {
    small: { padding: '16px', iconSize: 24, valueSize: '24px', labelSize: '12px' },
    medium: { padding: '24px', iconSize: 32, valueSize: '36px', labelSize: '14px' },
    large: { padding: '32px', iconSize: 40, valueSize: '48px', labelSize: '16px' },
  };
  
  const style = sizeStyles[size];

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${colors.bg} 0%, #FFFFFF 100%)`,
        borderRadius: '20px',
        padding: style.padding,
        border: `2px solid ${colors.border}20`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="impact-card"
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          background: `${colors.border}10`,
          borderRadius: '50%',
        }}
      />
      
      {/* Icon */}
      <div
        style={{
          width: style.iconSize + 16,
          height: style.iconSize + 16,
          borderRadius: '14px',
          background: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          border: `2px solid ${colors.border}40`,
        }}
      >
        <IconComponent size={style.iconSize} color={colors.text} />
      </div>
      
      {/* Value */}
      <div
        style={{
          fontSize: style.valueSize,
          fontWeight: '800',
          color: colors.text,
          marginBottom: '8px',
          lineHeight: 1,
        }}
      >
        {impact.formatted_value}
      </div>
      
      {/* Metric Name */}
      <div
        style={{
          fontSize: style.labelSize,
          fontWeight: '600',
          color: COLORS.textDark,
          marginBottom: '4px',
        }}
      >
        {impact.metric_name}
      </div>
      
      {/* Program Name */}
      <div
        style={{
          fontSize: '12px',
          color: COLORS.textSoft,
        }}
      >
        {impact.program_name}
      </div>
      
      {/* Progress bar if target exists */}
      {impact.progress !== null && impact.progress !== undefined && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              height: '6px',
              background: '#E2E8F0',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, impact.progress)}%`,
                background: `linear-gradient(90deg, ${colors.text}, ${colors.border})`,
                borderRadius: '3px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '11px',
              color: COLORS.textSoft,
              marginTop: '4px',
              textAlign: 'right',
            }}
          >
            {impact.progress.toFixed(0)}% of {impact.target?.toLocaleString()} goal
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Impact Statement Banner - Large hero-style display
 */
const ImpactBanner = ({ impacts, title = "Our Impact" }) => {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
        borderRadius: '24px',
        padding: '32px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)',
        }}
      />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Sparkles size={28} />
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{title}</h2>
        </div>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '24px',
          }}
        >
          {impacts.slice(0, 4).map((impact, idx) => {
            const IconComponent = CATEGORY_ICONS[impact.category] || Star;
            return (
              <div key={idx} style={{ textAlign: 'center' }}>
                <IconComponent size={32} style={{ marginBottom: '8px', opacity: 0.9 }} />
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
                  {impact.formatted_value}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  {impact.metric_name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Program Impact Stats Section Component
 * Use this on the Landing Page or Program Impact Dashboard
 */
const ProgramImpactStatsSection = ({ 
  organizationId,
  showTitle = true,
  showViewAll = true,
  maxItems = 6,
  layout = 'grid', // 'grid', 'banner', 'list'
  onViewAll = null,
}) => {
  const { getToken } = useAuth();
  const [impacts, setImpacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (organizationId) {
      fetchImpactStats();
    }
  }, [organizationId]);

  const fetchImpactStats = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `/api/v1/impact-stats/${organizationId}/featured?limit=${maxItems}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch impact stats');

      const data = await response.json();
      setImpacts(data);
    } catch (err) {
      console.error('Error fetching impact stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: COLORS.primary }} />
        <p style={{ marginTop: '12px', color: COLORS.textSoft }}>Loading impact data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          background: '#FEF2F2',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <AlertCircle size={24} color={COLORS.danger} />
        <span style={{ color: COLORS.danger }}>Error loading impact data: {error}</span>
      </div>
    );
  }

  if (impacts.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          background: COLORS.bgLight,
          borderRadius: '20px',
          border: `2px dashed ${COLORS.borderLight}`,
        }}
      >
        <Target size={48} color={COLORS.textSoft} style={{ marginBottom: '16px' }} />
        <h3 style={{ color: COLORS.textDark, marginBottom: '8px' }}>No Impact Data Yet</h3>
        <p style={{ color: COLORS.textSoft, marginBottom: '16px' }}>
          Start tracking your program impacts to showcase your organization's achievements.
        </p>
        <button
          style={{
            padding: '12px 24px',
            background: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={18} />
          Add Impact Metric
        </button>
      </div>
    );
  }

  // Banner layout
  if (layout === 'banner') {
    return <ImpactBanner impacts={impacts} />;
  }

  // Grid layout (default)
  return (
    <div>
      {showTitle && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.accent}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={24} color={COLORS.primary} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: COLORS.textDark, margin: 0 }}>
                Our Impact
              </h2>
              <p style={{ fontSize: '14px', color: COLORS.textSoft, margin: 0 }}>
                Making a difference in our community
              </p>
            </div>
          </div>
          
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'transparent',
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '10px',
                color: COLORS.textMuted,
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              View All
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {impacts.map((impact, idx) => (
          <ImpactCard key={idx} impact={impact} />
        ))}
      </div>
    </div>
  );
};

/**
 * Impact Dashboard - Full page view with all metrics
 */
const ProgramImpactDashboard = ({ organizationId }) => {
  const { getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchDashboard();
    }
  }, [organizationId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/v1/impact-stats/${organizationId}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard');

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            border: `1px solid ${COLORS.borderLight}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Users size={24} color={COLORS.primary} />
            <span style={{ color: COLORS.textSoft, fontSize: '14px' }}>Total Beneficiaries</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: COLORS.textDark }}>
            {dashboardData.total_beneficiaries.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            border: `1px solid ${COLORS.borderLight}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Target size={24} color={COLORS.secondary} />
            <span style={{ color: COLORS.textSoft, fontSize: '14px' }}>Active Programs</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: COLORS.textDark }}>
            {dashboardData.total_programs}
          </div>
        </div>
      </div>

      {/* Featured Impacts */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: COLORS.textDark, marginBottom: '20px' }}>
          Featured Impact Metrics
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {dashboardData.featured_impacts.map((impact, idx) => (
            <ImpactCard key={idx} impact={impact} />
          ))}
        </div>
      </div>

      {/* Impact by Category */}
      {Object.keys(dashboardData.impact_by_category).length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: COLORS.textDark, marginBottom: '20px' }}>
            Impact by Category
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {Object.entries(dashboardData.impact_by_category).map(([category, value], idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  border: `1px solid ${COLORS.borderLight}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: COLORS.textMuted, fontWeight: '500' }}>{category}</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: COLORS.primary }}>
                  {value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact by Program */}
      {dashboardData.impact_by_program.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: COLORS.textDark, marginBottom: '20px' }}>
            Impact by Program
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dashboardData.impact_by_program.map((program, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  border: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontWeight: '600', color: COLORS.textDark }}>
                    {program.program_name}
                  </span>
                  <span style={{ color: COLORS.primary, fontWeight: '700' }}>
                    {program.total_impact.toLocaleString()} total
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {program.metrics.map((metric, mIdx) => (
                    <span
                      key={mIdx}
                      style={{
                        padding: '6px 12px',
                        background: COLORS.bgLight,
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: COLORS.textMuted,
                      }}
                    >
                      {metric.value.toLocaleString()} {metric.unit} {metric.name.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// CSS for animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .impact-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(styleSheet);

export { ProgramImpactStatsSection, ProgramImpactDashboard, ImpactCard, ImpactBanner };
export default ProgramImpactStatsSection;
