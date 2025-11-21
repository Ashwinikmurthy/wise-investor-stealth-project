import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  Heart, Users, TrendingUp, Award, Target, Activity, CheckCircle,
  ChevronLeft, RefreshCw, Download, Globe, DollarSign, BarChart3,
  PieChart, MapPin, AlertTriangle, ArrowUp, ArrowDown, Zap
} from 'lucide-react';

// UT Dallas Color Palette - Standardized
const COLORS = {
  // Brand colors
  utdOrange: '#E87500',
  utdOrangeLight: '#FF9B3B',
  utdOrangeSoft: 'rgba(232,117,0,0.12)',
  utdGreen: '#154734',
  utdGreenLight: '#1E6045',
  utdGreenSoft: 'rgba(21,71,52,0.12)',

  // Backgrounds
  bgLight: '#F8FAFC',
  bgLighter: '#FFFFFF',

  // Text colors
  textDark: '#0F172A',
  textMuted: '#334155',
  textSoft: '#64748B',

  // Borders and shadows
  borderLight: '#E2E8F0',
  borderMid: '#CBD5E1',
  shadowSoft: '0 10px 35px rgba(15,23,42,0.10)',

  // Semantic colors
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  accent: '#5fe0b7',
};

const CHART_COLORS = ['#E87500', '#154734', '#5fe0b7', '#2563EB', '#D97706', '#DC2626', '#7C3AED'];

/**
 * Enhanced Program Impact Dashboard
 * With 3 sub-sections like Donor Intelligence
 */
const EnhancedProgramImpactDashboard = () => {
  const { getToken, getOrganizationId } = useAuth();
  const navigate = useNavigate();
  const organizationId = getOrganizationId();

  // Sub-navigation state
  const [activeSection, setActiveSection] = useState('overview');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [impactData, setImpactData] = useState({
    summary: null,
    programs: [],
    demographics: null,
    outcomes: [],
    sdgAlignment: null,
    costEffectiveness: null,
    socialReturn: null,
    stories: null,
    geographicReach: null
  });

  const [selectedProgram, setSelectedProgram] = useState(null);

  // Sub-navigation tabs
  const subNavTabs = [
    { id: 'overview', label: 'Overview', icon: <Heart className="h-4 w-4" /> },
    { id: 'outcomes-sdg', label: 'Outcomes & SDG', icon: <Target className="h-4 w-4" /> },
    { id: 'efficiency-sroi', label: 'Efficiency & SROI', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  useEffect(() => {
    fetchAllImpactData();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramSpecificData(selectedProgram);
    }
  }, [selectedProgram]);

  const fetchAllImpactData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const baseUrl = '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [summaryRes, programsRes, demoRes, sdgRes, sroiRes, storiesRes, geoRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/program-impact/summary/${organizationId}`, { headers }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/programs/list`, { headers }),
        fetch(`${baseUrl}/api/v1/program-impact/beneficiaries/demographics/${organizationId}`, { headers }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/impact/sdg-alignment`, { headers }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/impact/social-return`, { headers }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/impact/stories?limit=5`, { headers }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/impact/geographic-reach`, { headers })
      ]);

      const [summary, programsList, demographics, sdgAlignment, socialReturn, stories, geographicReach] = await Promise.all([
        summaryRes.json(),
        programsRes.ok ? programsRes.json() : { programs: [] },
        demoRes.ok ? demoRes.json() : null,
        sdgRes.ok ? sdgRes.json() : null,
        sroiRes.ok ? sroiRes.json() : null,
        storiesRes.ok ? storiesRes.json() : null,
        geoRes.ok ? geoRes.json() : null
      ]);

      const programs = programsList.programs || [];

      setImpactData({
        summary,
        programs,
        demographics,
        sdgAlignment,
        socialReturn,
        stories,
        geographicReach,
        outcomes: [],
        costEffectiveness: null
      });

      if (programs.length > 0 && !selectedProgram) {
        setSelectedProgram(programs[0].program_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramSpecificData = async (programId) => {
    try {
      const token = await getToken();
      const baseUrl = '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [outcomesRes, costRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/impact/outcomes?program=${programId}&period=year`, { headers }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/impact/cost-effectiveness?program=${programId}`, { headers })
      ]);

      const [outcomes, costEffectiveness] = await Promise.all([
        outcomesRes.ok ? outcomesRes.json() : { metrics: [] },
        costRes.ok ? costRes.json() : null
      ]);

      setImpactData(prev => ({
        ...prev,
        outcomes: outcomes.metrics || [],
        costEffectiveness
      }));
    } catch (err) {
      console.error('Error fetching program specific data:', err);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{
          background: 'radial-gradient(circle at top, #ffffff 0%, #F8FAFC 45%, #E2E8F0 100%)',
        }}
      >
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-slate-200" />
            <div
              className="animate-spin rounded-full h-16 w-16 border-[3px] border-t-transparent absolute inset-0 m-auto"
              style={{ borderColor: `${COLORS.utdOrange} transparent transparent transparent` }}
            />
          </div>
          <div>
            <p className="text-lg font-semibold" style={{ color: COLORS.textDark }}>
              Loading Program Impact
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Analyzing outcomes and metrics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(circle at top left, #FFFFFF 0%, #F8FAFC 40%, #E2E8F0 100%)',
      }}
    >
      {/* Header */}
      <div
        className="border-b sticky top-0 z-20 backdrop-blur-xl"
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderColor: COLORS.borderLight,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate('/analytics/executiveDashboard')}
                className="inline-flex items-center text-[11px] sm:text-xs font-medium rounded-full px-3 py-1 border transition-all hover:bg-slate-50"
                style={{ color: COLORS.textMuted, borderColor: COLORS.borderLight }}
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </button>
              <div className="mt-2">
                <h1
                  className="text-2xl sm:text-3xl font-semibold tracking-tight"
                  style={{ color: COLORS.textDark }}
                >
                  Program Impact
                </h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                  Track beneficiaries, outcomes, and social return on investment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <select
                value={selectedProgram || ''}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="px-3 py-2 rounded-2xl text-xs sm:text-sm font-medium border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300/70"
                style={{ borderColor: COLORS.borderLight, color: COLORS.textDark }}
              >
                <option value="">All Programs</option>
                {impactData.programs.map(p => (
                  <option key={p.program_id} value={p.program_id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={fetchAllImpactData}
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-2xl text-xs font-semibold border shadow-sm hover:bg-slate-50 transition-all"
                style={{ color: COLORS.textDark, borderColor: COLORS.borderLight }}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </button>
              <button
                className="inline-flex items-center px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`,
                }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </button>
            </div>
          </div>

          {/* Sub-navigation */}
          <div className="mt-4">
            <div
              className="inline-flex rounded-2xl p-1 shadow-sm border"
              style={{
                background: COLORS.bgLight,
                borderColor: COLORS.borderLight,
              }}
            >
              {subNavTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className="inline-flex items-center px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all"
                  style={{
                    background: activeSection === tab.id
                      ? `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`
                      : 'transparent',
                    color: activeSection === tab.id ? 'white' : COLORS.textMuted,
                    boxShadow: activeSection === tab.id ? COLORS.shadowSoft : 'none',
                  }}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeSection === 'overview' && <ImpactOverviewSection data={impactData} />}
        {activeSection === 'outcomes-sdg' && <OutcomesSDGSection data={impactData} />}
        {activeSection === 'efficiency-sroi' && <EfficiencySROISection data={impactData} />}
      </div>
    </div>
  );
};

// ============================================
// SECTION 1: OVERVIEW
// ============================================
const ImpactOverviewSection = ({ data }) => {
  const { summary, demographics, geographicReach, stories } = data;

  const getAgeDistributionChart = () => {
    if (!demographics?.age_groups) return {};
    const ageData = Object.entries(demographics.age_groups).map(([name, value]) => ({ name, value }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { color: COLORS.textDark }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemGap: 12,
        textStyle: {
          color: COLORS.textMuted,
          fontSize: 12
        }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data: ageData,
        color: CHART_COLORS,
        label: {
          show: true,
          position: 'outside',
          formatter: '{d}%',
          fontSize: 11,
          color: COLORS.textMuted
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        }
      }]
    };
  };

  const getGenderDistributionChart = () => {
    if (!demographics?.gender_distribution) return {};
    const genderData = Object.entries(demographics.gender_distribution).map(([name, value]) => ({ name, value }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { color: COLORS.textDark }
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        itemGap: 20,
        textStyle: {
          color: COLORS.textMuted,
          fontSize: 12
        }
      },
      series: [{
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '45%'],
        data: genderData,
        color: [COLORS.utdOrange, COLORS.utdGreen, COLORS.accent],
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        }
      }]
    };
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Beneficiaries" value={summary?.total_beneficiaries_served?.toLocaleString() || 0}
          subtitle={`${summary?.new_beneficiaries_ytd || 0} new this year`} icon={<Users className="h-6 w-6" />} color="info" />
        <MetricCard title="Active Programs" value={summary?.active_programs || 0}
          subtitle={`${summary?.total_programs || 0} total`} icon={<Activity className="h-6 w-6" />} color="success" />
        <MetricCard title="Services Delivered" value={summary?.total_services_delivered?.toLocaleString() || 0}
          subtitle={`${summary?.services_this_month || 0} this month`} icon={<Heart className="h-6 w-6" />} color="danger" />
        <MetricCard title="Positive Outcomes" value={`${summary?.positive_outcome_rate?.toFixed(1) || 0}%`}
          subtitle={`${summary?.total_outcomes_recorded || 0} tracked`} icon={<Award className="h-6 w-6" />} color="primary" />
      </div>

      {/* Demographics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Age Distribution</h3>
          {demographics?.age_groups ? (
            <ReactECharts option={getAgeDistributionChart()} style={{ height: '300px' }} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No age data available</div>
          )}
          {demographics?.average_age && (
            <div className="mt-4 text-center">
              <span className="text-sm" style={{ color: COLORS.textMuted }}>Average Age: </span>
              <span className="font-bold" style={{ color: COLORS.textDark }}>{demographics.average_age.toFixed(1)} years</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Gender Distribution</h3>
          {demographics?.gender_distribution ? (
            <ReactECharts option={getGenderDistributionChart()} style={{ height: '300px' }} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No gender data available</div>
          )}
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div><span style={{ color: COLORS.textMuted }}>Total: </span><span className="font-bold">{demographics?.total_beneficiaries || 0}</span></div>
            <div><span style={{ color: COLORS.textMuted }}>Active: </span><span className="font-bold text-green-600">{demographics?.active_beneficiaries || 0}</span></div>
          </div>
        </div>
      </div>

      {/* Geographic Reach & Stories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Reach */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Geographic Reach</h3>
          {geographicReach?.regions ? (
            <div className="space-y-3">
              {Object.entries(geographicReach.regions).slice(0, 5).map(([country, states]) => (
                <div key={country} className="p-3 rounded-lg" style={{ background: COLORS.bgLight }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium flex items-center gap-2" style={{ color: COLORS.textDark }}>
                      <Globe className="h-4 w-4" />{country}
                    </span>
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>
                      {states.reduce((sum, s) => sum + s.beneficiaries, 0).toLocaleString()} beneficiaries
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {states.slice(0, 3).map((state, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs rounded" style={{ background: COLORS.borderLight, color: COLORS.textMuted }}>
                        {state.state}: {state.beneficiaries}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <span className="text-sm font-medium" style={{ color: COLORS.utdOrange }}>
                  Total: {geographicReach.total_beneficiaries?.toLocaleString()} across {Object.keys(geographicReach.regions).length} countries
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">No geographic data available</div>
          )}
        </div>

        {/* Impact Stories */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Impact Stories</h3>
          {stories?.stories?.length > 0 ? (
            <div className="space-y-4">
              {stories.stories.slice(0, 3).map((story, idx) => (
                <div key={idx} className="p-4 rounded-lg border" style={{ borderColor: COLORS.borderLight }}>
                  <h4 className="font-medium mb-2" style={{ color: COLORS.textDark }}>{story.title}</h4>
                  <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>{story.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: COLORS.textSoft }}>{story.date}</span>
                    {story.program_name && (
                      <span className="text-xs px-2 py-1 rounded" style={{ background: COLORS.bgLight, color: COLORS.textMuted }}>
                        {story.program_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">No stories available</div>
          )}
        </div>
      </div>

      {/* Top Program */}
      {summary?.top_program && (
        <div className="rounded-xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${COLORS.utdGreen} 0%, ${COLORS.accent} 100%)` }}>
          <div className="flex items-center mb-3">
            <Award className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-bold">Top Performing Program</h3>
          </div>
          <p className="text-2xl font-bold mb-1">{summary.top_program.name}</p>
          <p className="opacity-80">{summary.top_program.services_delivered?.toLocaleString()} services delivered</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// SECTION 2: OUTCOMES & SDG
// ============================================
const OutcomesSDGSection = ({ data }) => {
  const { outcomes, sdgAlignment, summary } = data;

  const getOutcomesTrendChart = () => {
    if (!outcomes || outcomes.length === 0) return {};

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { color: COLORS.textDark },
        formatter: function(params) {
          const item = params[0];
          const outcome = outcomes[item.dataIndex];
          return `<div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${outcome.name}</div>
            <div>Value: <strong>${outcome.value}</strong> ${outcome.unit || ''}</div>
            ${outcome.target ? `<div>Target: ${outcome.target}</div>` : ''}
            ${outcome.progress ? `<div>Progress: ${outcome.progress.toFixed(1)}%</div>` : ''}
          </div>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: outcomes.map(o => o.name.length > 15 ? o.name.substring(0, 12) + '...' : o.name),
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontSize: 11,
          color: COLORS.textMuted
        },
        axisLine: { lineStyle: { color: COLORS.borderLight } }
      },
      yAxis: {
        type: 'value',
        name: 'Progress %',
        nameTextStyle: { color: COLORS.textMuted, fontSize: 11 },
        axisLabel: {
          fontSize: 11,
          color: COLORS.textMuted,
          formatter: '{value}%'
        },
        axisLine: { lineStyle: { color: COLORS.borderLight } },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
      },
      series: [{
        name: 'Progress',
        type: 'bar',
        data: outcomes.map(o => ({
          value: o.progress || 0,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: COLORS.utdOrange },
                { offset: 1, color: COLORS.utdOrangeLight }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          }
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 11,
          color: COLORS.textDark
        }
      }]
    };
  };

  // SDG Goals mapping
  const sdgNames = {
    '1': 'No Poverty', '2': 'Zero Hunger', '3': 'Good Health', '4': 'Quality Education',
    '5': 'Gender Equality', '6': 'Clean Water', '7': 'Clean Energy', '8': 'Decent Work',
    '9': 'Innovation', '10': 'Reduced Inequalities', '11': 'Sustainable Cities', '12': 'Responsible Consumption',
    '13': 'Climate Action', '14': 'Life Below Water', '15': 'Life on Land', '16': 'Peace & Justice', '17': 'Partnerships'
  };

  return (
    <div className="space-y-6">
      {/* Outcomes Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Outcomes Tracked" value={summary?.total_outcomes_recorded || 0}
          subtitle="All programs" icon={<Target className="h-6 w-6" />} color="info" />
        <MetricCard title="Positive Outcome Rate" value={`${summary?.positive_outcome_rate?.toFixed(1) || 0}%`}
          subtitle="Success rate" icon={<CheckCircle className="h-6 w-6" />} color="success" />
        <MetricCard title="Programs with Outcomes" value={data.programs?.length || 0}
          subtitle="Active tracking" icon={<Activity className="h-6 w-6" />} color="primary" />
      </div>

      {/* Outcomes Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Outcome Metrics</h3>
        {outcomes?.length > 0 ? (
          <ReactECharts option={getOutcomesTrendChart()} style={{ height: '350px' }} />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">Select a program to view outcomes</div>
        )}
      </div>

      {/* SDG Alignment */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
        <h3 className="text-lg font-semibold mb-6" style={{ color: COLORS.textDark }}>SDG Alignment</h3>
        {sdgAlignment?.sdg_alignment ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(sdgAlignment.sdg_alignment).map(([goal, programs]) => {
              const avgScore = programs.reduce((sum, p) => sum + p.score, 0) / programs.length;

              // Extract SDG number from various formats
              // Could be "10", "SDG 10", "SDG 10: Reduced Inequalities", etc.
              const sdgMatch = goal.match(/\d+/);
              const sdgNumber = sdgMatch ? sdgMatch[0] : goal;
              const sdgName = sdgNames[sdgNumber] || 'Unknown Goal';

              return (
                <div key={goal} className="p-4 rounded-lg border" style={{ borderColor: COLORS.borderLight }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium" style={{ color: COLORS.textDark }}>SDG {sdgNumber}: {sdgName}</span>
                    <span className="text-sm px-2 py-1 rounded" style={{ background: `${COLORS.accent}20`, color: COLORS.utdGreen }}>
                      {avgScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ background: COLORS.borderLight }}>
                    <div className="h-2 rounded-full" style={{ width: `${avgScore}%`, background: COLORS.accent }} />
                  </div>
                  <p className="text-xs mt-2" style={{ color: COLORS.textSoft }}>{programs.length} program(s) aligned</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500">No SDG alignment data available</div>
        )}
      </div>

      {/* Outcomes Detail List */}
      {outcomes?.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Detailed Outcomes</h3>
          <div className="space-y-4">
            {outcomes.map((outcome, idx) => (
              <div key={idx} className="p-4 rounded-lg border" style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium" style={{ color: COLORS.textDark }}>{outcome.name}</h4>
                  <span className="text-lg font-bold" style={{ color: COLORS.utdOrange }}>
                    {outcome.value}{outcome.unit ? ` ${outcome.unit}` : ''}
                  </span>
                </div>
                {outcome.target && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1" style={{ color: COLORS.textSoft }}>
                      <span>Progress to target</span>
                      <span>{outcome.progress?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: COLORS.borderLight }}>
                      <div className="h-2 rounded-full" style={{
                        width: `${Math.min(outcome.progress || 0, 100)}%`,
                        background: (outcome.progress || 0) >= 100 ? COLORS.success : COLORS.utdOrange
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SECTION 3: EFFICIENCY & SROI
// ============================================
const EfficiencySROISection = ({ data }) => {
  const { costEffectiveness, socialReturn, programs } = data;

  const getSROIChart = () => {
    if (!socialReturn?.programs) return {};
    const progs = socialReturn.programs.slice(0, 8);
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: progs.map(p => (p.program_name || `Program ${p.program_id.substring(0, 6)}`).substring(0, 12)), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: 'SROI (x)' },
      series: [{
        type: 'bar',
        data: progs.map(p => p.sroi),
        itemStyle: {
          color: (params) => params.value >= 1 ? COLORS.success : COLORS.warning
        },
        markLine: { data: [{ yAxis: 1, name: 'Break Even', lineStyle: { color: COLORS.danger, type: 'dashed' } }] }
      }]
    };
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Cost per Beneficiary" value={`$${costEffectiveness?.cost_per_beneficiary?.toFixed(2) || 0}`}
          subtitle="Program efficiency" icon={<DollarSign className="h-6 w-6" />} color="info" />
        <MetricCard title="Average SROI" value={`${socialReturn?.average_sroi?.toFixed(1) || 0}x`}
          subtitle="Social return" icon={<TrendingUp className="h-6 w-6" />} color={socialReturn?.average_sroi >= 1 ? 'success' : 'warning'} />
        <MetricCard title="Total Beneficiaries" value={costEffectiveness?.beneficiaries?.toLocaleString() || 0}
          subtitle="Selected program" icon={<Users className="h-6 w-6" />} color="primary" />
        <MetricCard title="Program Budget" value={`$${((costEffectiveness?.program_budget || 0) / 1000).toFixed(0)}K`}
          subtitle="Total investment" icon={<BarChart3 className="h-6 w-6" />} color="warning" />
      </div>

      {/* SROI Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Social Return on Investment by Program</h3>
        {socialReturn?.programs?.length > 0 ? (
          <ReactECharts option={getSROIChart()} style={{ height: '350px' }} />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">No SROI data available</div>
        )}
      </div>

      {/* Cost Effectiveness Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Cost Efficiency Breakdown</h3>
          {costEffectiveness ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: COLORS.bgLight }}>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>Program Budget</p>
                  <p className="text-2xl font-bold" style={{ color: COLORS.textDark }}>${costEffectiveness.program_budget?.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: COLORS.bgLight }}>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>Actual Spending</p>
                  <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>${costEffectiveness.actual_spending?.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: COLORS.bgLight }}>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>Beneficiaries Served</p>
                  <p className="text-2xl font-bold" style={{ color: COLORS.utdOrange }}>{costEffectiveness.beneficiaries?.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: COLORS.bgLight }}>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>Budget Utilization</p>
                  <p className="text-2xl font-bold" style={{ color: COLORS.info }}>{costEffectiveness.budget_utilization?.toFixed(1) || 0}%</p>
                </div>
              </div>
              <div className="p-4 rounded-lg border-2" style={{ borderColor: COLORS.accent, background: `${COLORS.accent}10` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: COLORS.textMuted }}>Cost per Beneficiary</span>
                  <span className="text-2xl font-bold" style={{ color: COLORS.utdGreen }}>${costEffectiveness.cost_per_beneficiary?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">Select a program to view cost data</div>
          )}
        </div>

        {/* SROI Details */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>SROI Summary</h3>
          {socialReturn ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg text-center" style={{ background: `linear-gradient(135deg, ${COLORS.utdGreen}20 0%, ${COLORS.accent}20 100%)` }}>
                <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>Average Social Return</p>
                <p className="text-4xl font-bold" style={{ color: COLORS.utdGreen }}>{socialReturn.average_sroi?.toFixed(1)}x</p>
                <p className="text-sm mt-2" style={{ color: COLORS.textSoft }}>
                  For every $1 invested, ${socialReturn.average_sroi?.toFixed(2)} in social value created
                </p>
              </div>
              <div className="space-y-2">
                {socialReturn.programs?.slice(0, 4).map((prog, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded" style={{ background: COLORS.bgLight }}>
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>Program {idx + 1}</span>
                    <span className={`font-bold ${prog.sroi >= 1 ? 'text-green-600' : 'text-yellow-600'}`}>{prog.sroi?.toFixed(1)}x</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">No SROI data available</div>
          )}
        </div>
      </div>

      {/* Programs Overview Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>Programs Efficiency Overview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ background: COLORS.bgLight }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: COLORS.textSoft }}>Program</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: COLORS.textSoft }}>Budget</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: COLORS.textSoft }}>Social Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: COLORS.textSoft }}>Investment</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: COLORS.textSoft }}>SROI</th>
              </tr>
            </thead>
            <tbody>
              {socialReturn?.programs?.map((prog, idx) => (
                <tr key={idx} className="border-t" style={{ borderColor: COLORS.borderLight }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: COLORS.textDark }}>Program {idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: COLORS.textDark }}>${programs[idx]?.budget?.toLocaleString() || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">${prog.social_value?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: COLORS.textDark }}>${prog.investment?.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${prog.sroi >= 1 ? 'text-green-600' : 'text-yellow-600'}`}>{prog.sroi?.toFixed(1)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================
const MetricCard = ({ title, value, subtitle, icon, color }) => {
  const colorMap = {
    success: { bg: 'bg-green-100', text: 'text-green-600' },
    danger: { bg: 'bg-red-100', text: 'text-red-600' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    info: { bg: 'bg-blue-100', text: 'text-blue-600' },
    primary: { bg: 'bg-orange-100', text: 'text-orange-600' }
  };
  const colors = colorMap[color] || colorMap.info;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: COLORS.textMuted }}>{title}</p>
        <div className={`p-2 rounded-lg ${colors.bg}`}>{React.cloneElement(icon, { className: `h-5 w-5 ${colors.text}` })}</div>
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: COLORS.textDark }}>{value}</p>
      <p className="text-xs" style={{ color: COLORS.textSoft }}>{subtitle}</p>
    </div>
  );
};

export default EnhancedProgramImpactDashboard;
