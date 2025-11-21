import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  ArrowUp,
  ArrowDown,
  Activity,
  Download,
  RefreshCw,
  Percent,
  UserPlus,
  Gift,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  PieChart,
  LineChart,
  Grid,
} from 'lucide-react';

// ===============================
// UTD Enterprise-Luxe Palette
// ===============================
const COLORS = {
  utdOrange: '#E87500',
  utdOrangeLight: '#FF9B3B',
  utdOrangeSoft: 'rgba(232,117,0,0.12)',
  utdGreen: '#154734',
  utdGreenLight: '#1E6045',
  utdGreenSoft: 'rgba(21,71,52,0.12)',
  bgLight: '#F8FAFC',
  bgLighter: '#FFFFFF',

  // Darker, more readable text
  textDark: '#0F172A',   // headings, key numbers
  textMuted: '#334155',  // subtitles, body text
  textSoft: '#64748B',   // labels, helper text

  borderLight: '#E2E8F0',
  borderMid: '#CBD5E1',
  shadowSoft: '0 10px 35px rgba(15,23,42,0.10)',
  shadowGlowOrange: '0 16px 45px rgba(232,117,0,0.30)',
  shadowGlowGreen: '0 16px 45px rgba(21,71,52,0.28)',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
  purple: '#7C3AED',
};

const CHART_COLORS = [
  COLORS.utdOrange,
  COLORS.utdGreen,
  COLORS.info,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  '#0EA5E9',
  '#F97316',
];

// Required 5 categories for revenue breakdown
const REQUIRED_CATEGORIES = [
  'Individuals',
  'Corporate',
  'Foundations',
  'Government Grants',
  'Other Revenue'
];

// Utility function for formatting currency
const formatCurrency = (value, decimals = 0) => {
  if (value === undefined || value === null) return '-';
  const num = Number(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(decimals)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
};

// Utility function for formatting large numbers
const formatNumber = (value) => {
  if (value === undefined || value === null) return '-';
  const num = Number(value);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

/**
 * Enhanced Campaign Performance Dashboard
 * UTD-branded, enterprise-luxe hybrid glass design
 */
const EnhancedCampaignDashboard = () => {
  const { getToken,getOrganizationId } = useAuth();
  const navigate = useNavigate();
  const organizationId = getOrganizationId();

  const [activeSection, setActiveSection] = useState('overview');
  const [timeRange, setTimeRange] = useState('365d');
  const [revenueDiversification, setRevenueDiversification] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [gridViewMode, setGridViewMode] = useState('all'); // 'all', 'ytd'
  const [gridMetric, setGridMetric] = useState('revenue'); // 'revenue', 'gifts', 'donors'
  const [multiYearData, setMultiYearData] = useState({
    revenue: null,
    donors: null,
    gifts: null,
    retention: null,
    selectedMetric: 'revenue',
    selectedYears: 3
  });
  const [cashflowGrid, setCashflowGrid] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    activeCampaigns: null,
    roiAnalysis: null,
    costAnalysis: null,
    revenueBySource: null,
    forecastData: null,
    benchmarks: null,
    attribution: null,
    participationMetrics: null,
    abTestResults: null,
    matchingGifts: null,
    loading: true,
    error: null,
  });

  const subNavTabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'roi-analysis', label: 'ROI Analysis', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'donor-acquisition', label: 'Donor Acquisition', icon: <UserPlus className="h-4 w-4" /> },
    { id: 'revenue-diversification', label: 'Revenue Mix', icon: <PieChart className="h-4 w-4" /> },
    { id: 'multi-year', label: 'Multi-Year Trends', icon: <LineChart className="h-4 w-4" /> },
    { id: 'cashflow-grid', label: '3-Year Grid', icon: <Grid className="h-4 w-4" /> }

  ];

  useEffect(() => {
    fetchCampaignData();
    fetchRevenueDiversification();
   fetchMultiYearTrends(
       multiYearData.selectedMetric,
       multiYearData.selectedYears
   );
    fetchCashflowGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange,multiYearData.selectedMetric, multiYearData.selectedYears]);

  const fetchCampaignData = async () => {
    try {
      setDashboardData((prev) => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      const baseUrl = '';

      const [
        activeRes,
        roiRes,
        costRes,
        revenueSourceRes,
        forecastRes,
        benchmarkRes,
        attributionRes,
        participationRes,
        abTestRes,
        matchingRes,
      ] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/campaigns/active/${organizationId}?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/roi-analysis/${organizationId}?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/cost-analysis/${organizationId}?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/revenue-by-source/${organizationId}?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/revenue-forecast/${organizationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/benchmarks/${organizationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/attribution/${organizationId}?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/participation-rates/${organizationId}?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/ab-tests/${organizationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/matching-gifts/${organizationId}?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [
        activeCampaigns,
        roiAnalysis,
        costAnalysis,
        revenueBySource,
        forecastData,
        benchmarks,
        attribution,
        participationMetrics,
        abTestResults,
        matchingGifts,
      ] = await Promise.all([
        activeRes.ok ? activeRes.json() : null,
        roiRes.ok ? roiRes.json() : null,
        costRes.ok ? costRes.json() : null,
        revenueSourceRes.ok ? revenueSourceRes.json() : null,
        forecastRes.ok ? forecastRes.json() : null,
        benchmarkRes.ok ? benchmarkRes.json() : null,
        attributionRes.ok ? attributionRes.json() : null,
        participationRes.ok ? participationRes.json() : null,
        abTestRes.ok ? abTestRes.json() : null,
        matchingRes.ok ? matchingRes.json() : null,
      ]);

      setDashboardData({
        activeCampaigns,
        roiAnalysis,
        costAnalysis,
        revenueBySource,
        forecastData,
        benchmarks,
        attribution,
        participationMetrics,
        abTestResults,
        matchingGifts,
        loading: false,
        error: null,
      });
    } catch (error) {
      setDashboardData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Error loading campaign analytics',
      }));
    }
  };

  const fetchRevenueDiversification = async () => {
    try {
      const token = await getToken();
      const baseUrl = '';
      const response = await fetch(
        `${baseUrl}/api/v1/analytics/${organizationId}/revenue/diversification?period=${timeRange}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setRevenueDiversification(data);
      }
    } catch (error) {
      console.error('Error fetching revenue diversification:', error);
    }
  };

  const fetchMultiYearTrends = async (metric = 'revenue', years = 3) => {
    try {
      const token = await getToken();
      const baseUrl = '';
      const response = await fetch(
        `${baseUrl}/api/v1/analytics/${organizationId}/trends/multi-year?metric=${metric}&years=${years}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setMultiYearData(prev => ({
          ...prev,
          [metric]: data,
          selectedMetric: metric,
          selectedYears: years
        }));
      }
    } catch (error) {
      console.error('Error fetching multi-year trends:', error);
    }
  };

  const fetchCashflowGrid = async () => {
    try {
      const token = await getToken();
      const baseUrl = '';
      const response = await fetch(
        `${baseUrl}/api/v1/analytics/${organizationId}/cashflow/three-year-grid`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setCashflowGrid(data);
      }
    } catch (error) {
      console.error('Error fetching cashflow grid:', error);
    }
  };

  // Toggle category expansion for drill-down
  const toggleCategoryExpansion = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // ===============================
  // Loading State
  // ===============================
  if (dashboardData.loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{
          background:
            'radial-gradient(circle at top, #ffffff 0%, #F8FAFC 45%, #E2E8F0 100%)',
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
              Loading Campaign Analytics
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Preparing your performance dashboard…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===============================
  // Error State
  // ===============================
  if (dashboardData.error) {
    return (
      <div
        className="flex items-center justify-center min-h-screen px-4"
        style={{
          background:
            'radial-gradient(circle at top, #ffffff 0%, #F8FAFC 45%, #E2E8F0 100%)',
        }}
      >
        <div
          className="max-w-md w-full rounded-3xl p-6 shadow-xl border"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.98))',
            borderColor: COLORS.borderLight,
          }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.textDark }}>
            Unable to load campaign dashboard
          </h2>
          <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
            {dashboardData.error}
          </p>
          <button
            onClick={fetchCampaignData}
            className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{
              background:
                `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`,
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // SECTION 10: REVENUE DIVERSIFICATION TAB - ENHANCED
  // ============================================================

  const RevenueDiversificationTab = () => {
    const diversityData = revenueDiversification;
    //const normalizedBreakdown = ensureRequiredCategories(diversityData.breakdown);

    if (!diversityData) return <div>Loading...</div>;


    // Ensure all 5 required categories exist with fallback values
    const ensureRequiredCategories = (breakdown) => {
      const categoryMap = {};
      breakdown?.forEach(item => {
        categoryMap[item.category] = item;
      });

      return REQUIRED_CATEGORIES.map((category, idx) => {
        if (categoryMap[category]) {
          return categoryMap[category];
        }
        return {
          category,
          amount: 0,
          percentage: 0,
          donor_count: 0,
          yoy_growth: 0,
          subcategories: []
        };
      });
    };

   const normalizedBreakdown = ensureRequiredCategories(diversityData.breakdown);
       // ============================================
       // CEO MANDATED BREAKOUT — FULL EXPLICIT REVENUE SEPARATION
       // ============================================

       const ceoBreakout = {
         total_revenue: (diversityData.total_revenue || 0),
         contributed_revenue: (diversityData.contributed_revenue || 0),
         earned_revenue: (diversityData.earned_revenue || 0),

         individuals: normalizedBreakdown.find(c => c.category === 'Individuals')?.amount || 0,
         corporate: normalizedBreakdown.find(c => c.category === 'Corporate')?.amount || 0,
         foundations: normalizedBreakdown.find(c => c.category === 'Foundations')?.amount || 0,
         government_grants: normalizedBreakdown.find(c => c.category === 'Government Grants')?.amount || 0,
         other_revenue: normalizedBreakdown.find(c => c.category === 'Other Revenue')?.amount || 0,
       };

       // Chart for explicit CEO breakout
       const getCeoBreakoutChart = () => ({
         tooltip: {
           trigger: 'axis',
           formatter: params => {
             const p = params[0];
             return `${p.name}<br/>$${p.value.toLocaleString()}`;
           }
         },
         xAxis: {
           type: 'category',
           data: [
             'Total Revenue',
             'Contributed',
             'Individuals',
             'Corporate',
             'Foundations',
             'Gov Grants',
             'Other'
           ],
           axisLabel: { rotate: 25, color: COLORS.textSoft }
         },
         yAxis: {
           type: 'value',
           axisLabel: {
             formatter: val => `$${(val/1000000).toFixed(1)}M`
           }
         },
         series: [
           {
             type: 'bar',
             data: [
               ceoBreakout.total_revenue,
               ceoBreakout.contributed_revenue,
               ceoBreakout.individuals,
               ceoBreakout.corporate,
               ceoBreakout.foundations,
               ceoBreakout.government_grants,
               ceoBreakout.other_revenue
             ],
             itemStyle: {
               color: COLORS.utdOrange,
               borderRadius: [6,6,0,0]
             }
           }
         ]
       });

    // Total Revenue Pie Chart (Contributed vs Earned)
    const getTotalRevenuePieChart = () => ({
      tooltip: {
        trigger: 'item',
        formatter: (params) => `${params.name}: $${(params.value / 1000000).toFixed(2)}M (${params.percent}%)`
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        textStyle: { color: COLORS.textMuted, fontSize: 12 }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => 'Total\nRevenue',
          fontSize: 14,
          fontWeight: 'bold',
          color: COLORS.textDark
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          {
            value: diversityData.contributed_revenue || 0,
            name: 'Contributed Revenue',
            itemStyle: { color: COLORS.utdOrange }
          },
          {
            value: diversityData.earned_revenue || 0,
            name: 'Earned Revenue',
            itemStyle: { color: COLORS.utdGreen }
          }
        ]
      }]
    });


    // Contributed Revenue Breakdown Pie Chart (5 categories)
    const getContributedRevenuePieChart = () => ({
      tooltip: {
        trigger: 'item',
        formatter: (params) => `${params.name}: $${(params.value / 1000).toFixed(0)}K (${params.percent}%)`
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        textStyle: { color: COLORS.textMuted, fontSize: 11 }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => 'Contributed\nRevenue',
          fontSize: 14,
          fontWeight: 'bold',
          color: COLORS.textDark
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: normalizedBreakdown
          .filter(item => item.category !== 'Other Revenue' || item.amount > 0)
          .map((item, idx) => ({
            value: item.amount,
            name: item.category,
            itemStyle: {
              color: CHART_COLORS[idx % CHART_COLORS.length]
            }
          }))
      }]
    });

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>Total Revenue</p>
            <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>
              ${((diversityData.total_revenue || 0) / 1000000).toFixed(2)}M
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>Contributed Revenue</p>
            <p className="text-3xl font-bold" style={{ color: COLORS.utdOrange }}>
              ${((diversityData.contributed_revenue || 0) / 1000000).toFixed(2)}M
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>Earned Revenue</p>
            <p className="text-3xl font-bold" style={{ color: COLORS.utdGreen }}>
              ${((diversityData.earned_revenue || 0) / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>Diversity Score</p>
            <p className="text-3xl font-bold" style={{
              color: diversityData.diversity_score > 70 ? COLORS.success : COLORS.warning
            }}>
              {diversityData.diversity_score}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.textSoft }}>
              Risk: {diversityData.concentration_risk}
            </p>
          </div>
        </div>

        {/* DUAL PIE CHARTS - Total Revenue vs Contributed Revenue */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Total Revenue Pie */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.textDark }}>
              Total Revenue Distribution
            </h3>
            <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
              Breakdown of all revenue sources
            </p>
            <div className="h-[350px]">
              <ReactECharts option={getTotalRevenuePieChart()} style={{ height: '100%' }} />
            </div>
          </div>
            {/* CEO REQUIRED BREAKOUT SECTION */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border mb-10"
                 style={{ borderColor: COLORS.borderLight }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
                Revenue Breakout (CEO View)
              </h3>

              <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
                Explicit separation of revenue types as requested by leadership.
              </p>

              <div className="h-96">
                <ReactECharts
                  option={getCeoBreakoutChart()}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </div>

          {/* Contributed Revenue Pie */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.textDark }}>
              Contributed Revenue Breakdown
            </h3>
            <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
              5 required categories with drill-down
            </p>
            <div className="h-[350px]">
              <ReactECharts option={getContributedRevenuePieChart()} style={{ height: '100%' }} />
            </div>
          </div>
        </div>

        {/* DRILL-DOWN TABLE - Revenue by Category with Subcategories */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
            Revenue by Category (Click to Expand)
          </h3>
          <div className="space-y-2">
            {normalizedBreakdown.map((item, idx) => (
              <div key={idx}>
                {/* Main Category Row */}
                <div
                  className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-md"
                  style={{
                    background: expandedCategories[item.category] ? COLORS.utdOrangeSoft : COLORS.bgLight,
                    border: expandedCategories[item.category] ? `2px solid ${COLORS.utdOrange}` : '2px solid transparent'
                  }}
                  onClick={() => toggleCategoryExpansion(item.category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {/* Expand/Collapse Icon */}
                      {item.subcategories && item.subcategories.length > 0 ? (
                        expandedCategories[item.category] ? (
                          <ChevronDown className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
                        ) : (
                          <ChevronRight className="h-5 w-5" style={{ color: COLORS.textSoft }} />
                        )
                      ) : (
                        <div className="w-5" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: CHART_COLORS[idx % CHART_COLORS.length]
                        }}
                      />
                      <span className="font-semibold" style={{ color: COLORS.textDark }}>
                        {item.category}
                      </span>
                      {item.subcategories && item.subcategories.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100" style={{ color: COLORS.textSoft }}>
                          {item.subcategories.length} subcategories
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-lg" style={{ color: COLORS.textDark }}>
                      ${(item.amount / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm ml-11">
                    <span style={{ color: COLORS.textSoft }}>{item.donor_count} donors</span>
                    <span style={{ color: COLORS.textMuted }}>{item.percentage}% of total</span>
                    <span style={{
                      color: item.yoy_growth > 0 ? COLORS.success : item.yoy_growth < 0 ? COLORS.danger : COLORS.textSoft
                    }}>
                      {item.yoy_growth > 0 ? '+' : ''}{item.yoy_growth}% YoY
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden ml-11">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                        background: CHART_COLORS[idx % CHART_COLORS.length]
                      }}
                    />
                  </div>
                </div>

                {/* Subcategories - Drill-down */}
                {expandedCategories[item.category] && item.subcategories && item.subcategories.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2">
                    {item.subcategories.map((sub, subIdx) => (
                      <div
                        key={subIdx}
                        className="p-3 rounded-lg border-l-4 bg-white shadow-sm"
                        style={{ borderColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: COLORS.textMuted }}>
                              {sub.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100" style={{ color: COLORS.textSoft }}>
                              {sub.count} gifts
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold" style={{ color: COLORS.textDark }}>
                              ${(sub.amount / 1000).toFixed(0)}K
                            </span>
                            <span className="text-sm" style={{ color: COLORS.textMuted }}>
                              {sub.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${sub.percentage}%`,
                              background: CHART_COLORS[idx % CHART_COLORS.length],
                              opacity: 0.6
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark Comparison */}
        {diversityData.benchmarks && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
              Industry Benchmark Comparison
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {REQUIRED_CATEGORIES.map((category, idx) => {
                const actual = normalizedBreakdown.find(b => b.category === category);
                const benchmarkKey = category.toLowerCase().replace(/\s+/g, '_').replace('government_grants', 'government') + '_target';
                const benchmark = diversityData.benchmarks[benchmarkKey] || 0;
                const actualPct = actual?.percentage || 0;
                const diff = actualPct - benchmark;

                return (
                  <div key={idx} className="p-4 rounded-xl" style={{ background: COLORS.bgLight }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textSoft }}>
                      {category}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                        {actualPct.toFixed(0)}%
                      </span>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>
                        vs {benchmark}%
                      </span>
                    </div>
                    <div className={`text-xs mt-1 font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {diversityData.recommendations && diversityData.recommendations.length > 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4" style={{ borderColor: COLORS.utdOrange }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: COLORS.textDark }}>
              Recommendations
            </h3>
            <ul className="space-y-2">
              {diversityData.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span style={{ color: COLORS.textMuted }}>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : diversityData.recommendation && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4" style={{ borderColor: COLORS.utdOrange }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.textDark }}>
              Recommendation
            </h3>
            <p style={{ color: COLORS.textMuted }}>{diversityData.recommendation}</p>
          </div>
        )}
      </>
    );
  };

  // ============================================================
  // SECTION 11: MULTI-YEAR COMPARISON TAB
  // ============================================================

const MultiYearTab = () => {
  const metrics = ['revenue', 'donors', 'gifts', 'retention', 'new_donors', 'lapsed'];
  const yearOptions = [3, 5, 10];

  const currentData = multiYearData[multiYearData.selectedMetric];

  const handleYearChange = (years) => {
    setMultiYearData(prev => ({
      ...prev,
      selectedYears: years
    }));
    fetchMultiYearTrends(multiYearData.selectedMetric, years);
  };

  const handleMetricChange = (metric) => {
    setMultiYearData(prev => ({
      ...prev,
      selectedMetric: metric
    }));
    fetchMultiYearTrends(metric, multiYearData.selectedYears);
  };

  const getMultiYearChart = () => {
    if (!currentData?.data) return {};

    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: currentData.data.map(d => d.year).reverse(),
        axisLabel: { color: COLORS.textMuted }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: COLORS.textMuted,
          formatter: (value) => {
            if (multiYearData.selectedMetric === 'revenue') {
              return `$${(value / 1000000).toFixed(1)}M`;
            } else if (multiYearData.selectedMetric === 'retention') {
              return `${value}%`;
            }
            return value.toLocaleString();
          }
        }
      },
      series: [{
        type: 'bar',
        data: currentData.data.map(d => d.value).reverse(),
        itemStyle: {
          color: COLORS.utdOrange,
          borderRadius: [6, 6, 0, 0]
        },
        markLine: {
          data: [{ type: 'average', name: 'Avg' }],
          lineStyle: { color: COLORS.utdGreen }
        }
      }]
    };
  };

  return (
    <>
      {/* Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.textDark }}>
              Multi-Year Comparison
            </h3>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Compare trends across 3, 5, or 10 years
            </p>
          </div>

          <div className="flex gap-4">
            {/* Year selector */}
            <div className="flex gap-2">
              {yearOptions.map(years => (
                <button
                  key={years}
                  onClick={() => handleYearChange(years)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    multiYearData.selectedYears === years
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {years}yr
                </button>
              ))}
            </div>

            {/* Metric selector */}
            <select
              value={multiYearData.selectedMetric}
              onChange={(e) => handleMetricChange(e.target.value)}
              className="px-4 py-2 rounded-lg border text-sm font-semibold"
              style={{ borderColor: COLORS.borderLight }}
            >
              {metrics.map(metric => (
                <option key={metric} value={metric}>
                  {metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {currentData && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.textMuted }}>
              {multiYearData.selectedYears}-Year CAGR
            </p>
            <p className="text-4xl font-bold"
              style={{ color: currentData.cagr > 0 ? COLORS.success : COLORS.danger }}>
              {currentData.cagr > 0 ? '+' : ''}{currentData.cagr}%
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.textMuted }}>
              Total Growth
            </p>
            <p className="text-4xl font-bold"
              style={{ color: currentData.total_growth > 0 ? COLORS.success : COLORS.danger }}>
              {currentData.total_growth > 0 ? '+' : ''}{currentData.total_growth}%
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.textMuted }}>
              Latest Year
            </p>
            <p className="text-4xl font-bold" style={{ color: COLORS.utdOrange }}>
              {multiYearData.selectedMetric === 'revenue'
                ? `$${(currentData.data[0]?.value / 1000000).toFixed(1)}M`
                : multiYearData.selectedMetric === 'retention'
                ? `${currentData.data[0]?.value}%`
                : currentData.data[0]?.value?.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
          {multiYearData.selectedMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Trend
        </h3>
        <div className="h-[400px]">
          <ReactECharts option={getMultiYearChart()} style={{ height: '100%' }} />
        </div>
      </div>
    </>
  );
};


  // ============================================================
  // SECTION 12: 3-YEAR CASHFLOW GRID TAB - THREE SEPARATE GRIDS
  // ============================================================

  const CashflowGridTab = () => {
    if (!cashflowGrid) return <div className="text-center py-12" style={{ color: COLORS.textMuted }}>Loading...</div>;

    // Handle both possible API response formats
    const gridData = cashflowGrid.grid_data || cashflowGrid.grid || [];

    // Check if we have valid data
    if (!gridData.length || !gridData[0]?.monthly) {
      return (
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.textDark }}>
            No Grid Data Available
          </h3>
          <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
            The 3-year cashflow grid requires monthly data from the API.
          </p>
          <p className="text-xs" style={{ color: COLORS.textSoft }}>
            Expected format: grid_data[].monthly[] with revenue, gifts, donors
          </p>
          <pre className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto" style={{ color: COLORS.textMuted }}>
            {JSON.stringify(cashflowGrid, null, 2).slice(0, 500)}...
          </pre>
        </div>
      );
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth(); // 0-11

    // Get color for heatmap cell (red → yellow → green gradient)
    const getHeatmapColor = (value, maxValue, minValue) => {
      if (maxValue === minValue) return COLORS.warning;
      const normalized = (value - minValue) / (maxValue - minValue);

      if (normalized >= 0.8) return '#059669'; // Dark green
      if (normalized >= 0.6) return '#10b981'; // Green
      if (normalized >= 0.4) return '#fbbf24'; // Yellow
      if (normalized >= 0.2) return '#f97316'; // Orange
      return '#dc2626'; // Red
    };

    // Calculate max/min for each metric across all data
    const getMetricRange = (metric) => {
      let allValues = [];
      gridData.forEach(year => {
        year.monthly?.forEach(month => {
          allValues.push(month[metric] || 0);
        });
      });
      return {
        max: Math.max(...allValues, 1),
        min: Math.min(...allValues, 0)
      };
    };

    const revenueRange = getMetricRange('revenue');
    const giftsRange = getMetricRange('gifts');
    const donorsRange = getMetricRange('donors');

    // Filter months based on YTD setting
    const getFilteredMonths = () => {
      if (gridViewMode === 'ytd') {
        return months.slice(0, currentMonth + 1);
      }
      return months;
    };

    const filteredMonths = getFilteredMonths();

    // Render a single metric grid
    const renderMetricGrid = (metric, title, range, formatValue, unit) => (
      <div className="bg-white rounded-2xl p-6 shadow-xl overflow-x-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: COLORS.textDark }}>
            {title}
          </h3>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: '#dc2626' }} />
                <div className="w-3 h-3 rounded" style={{ background: '#f97316' }} />
                <div className="w-3 h-3 rounded" style={{ background: '#fbbf24' }} />
                <div className="w-3 h-3 rounded" style={{ background: '#10b981' }} />
                <div className="w-3 h-3 rounded" style={{ background: '#059669' }} />
              </div>
              <span className="text-xs" style={{ color: COLORS.textSoft }}>Low → High</span>
            </div>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textSoft }}>Year</th>
              {filteredMonths.map(month => (
                <th key={month} className="text-center py-3 px-1 text-xs font-semibold uppercase"
                    style={{ color: COLORS.textSoft }}>{month}</th>
              ))}
              <th className="text-right py-3 px-2 text-xs font-semibold uppercase"
                  style={{ color: COLORS.textSoft }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {gridData.map((yearData, yearIdx) => {
              // Calculate total based on filtered months
              const filteredTotal = yearData.monthly
                ?.slice(0, filteredMonths.length)
                .reduce((sum, m) => sum + (m[metric] || 0), 0) || 0;

              return (
                <tr key={yearIdx} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                  <td className="py-3 px-2 font-bold" style={{ color: COLORS.textDark }}>
                    {yearData.year}
                  </td>
                  {yearData.monthly?.slice(0, filteredMonths.length).map((month, monthIdx) => {
                    const value = month[metric] || 0;
                    const bgColor = getHeatmapColor(value, range.max, range.min);

                    return (
                      <td key={monthIdx} className="py-2 px-1">
                        <div
                          className="rounded-lg p-2 text-center transition-all hover:scale-105 cursor-default"
                          style={{
                            background: bgColor,
                            color: '#ffffff'
                          }}
                          title={`${months[monthIdx]} ${yearData.year}: ${formatValue(value)}`}
                        >
                          <p className="text-xs font-bold">
                            {formatValue(value)}
                          </p>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 px-2 text-right">
                    <p className="font-bold text-lg" style={{ color: COLORS.utdOrange }}>
                      {formatValue(filteredTotal)}
                    </p>
                    {gridViewMode === 'ytd' && (
                      <p className="text-[10px]" style={{ color: COLORS.textSoft }}>YTD</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

    return (
      <>
        {/* Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.textDark }}>
                3-Year Performance Grids
              </h3>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                Month-by-month breakdown with color-coded heatmaps
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* YTD Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: COLORS.textMuted }}>View:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setGridViewMode('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      gridViewMode === 'all'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Full Year
                  </button>
                  <button
                    onClick={() => setGridViewMode('ytd')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      gridViewMode === 'ytd'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    YTD ({months[currentMonth]})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* YoY Growth Summary */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.textMuted }}>Revenue YoY</p>
            <p className="text-4xl font-bold" style={{
              color: cashflowGrid.yoy_growth?.revenue > 0 ? COLORS.success : COLORS.danger
            }}>
              {cashflowGrid.yoy_growth?.revenue > 0 ? '+' : ''}{cashflowGrid.yoy_growth?.revenue || 0}%
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.textMuted }}>Gifts YoY</p>
            <p className="text-4xl font-bold" style={{
              color: cashflowGrid.yoy_growth?.gifts > 0 ? COLORS.success : COLORS.danger
            }}>
              {cashflowGrid.yoy_growth?.gifts > 0 ? '+' : ''}{cashflowGrid.yoy_growth?.gifts || 0}%
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.textMuted }}>Donors YoY</p>
            <p className="text-4xl font-bold" style={{
              color: cashflowGrid.yoy_growth?.donors > 0 ? COLORS.success : COLORS.danger
            }}>
              {cashflowGrid.yoy_growth?.donors > 0 ? '+' : ''}{cashflowGrid.yoy_growth?.donors || 0}%
            </p>
          </div>
        </div>

        {/* THREE SEPARATE GRIDS */}

        {/* 1. Revenue Grid */}
        {renderMetricGrid(
          'revenue',
          '💰 Revenue by Month',
          revenueRange,
          (val) => val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${(val / 1000).toFixed(0)}K`,
          'dollars'
        )}

        {/* 2. Gifts Grid */}
        {renderMetricGrid(
          'gifts',
          '🎁 Number of Gifts by Month',
          giftsRange,
          (val) => val.toLocaleString(),
          'gifts'
        )}

        {/* 3. Donors Grid */}
        {renderMetricGrid(
          'donors',
          '👥 Unique Donors by Month',
          donorsRange,
          (val) => val.toLocaleString(),
          'donors'
        )}

        {/* Year Summaries */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {gridData.map((yearData, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg">
              <h4 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
                {yearData.year} Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: COLORS.textMuted }}>Total Revenue</span>
                  <span className="font-bold" style={{ color: COLORS.textDark }}>
                    ${((yearData.totals?.revenue || 0) / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.textMuted }}>Total Gifts</span>
                  <span className="font-bold" style={{ color: COLORS.textDark }}>
                    {(yearData.totals?.gifts || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.textMuted }}>Unique Donors</span>
                  <span className="font-bold" style={{ color: COLORS.textDark }}>
                    {(yearData.totals?.donors || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t" style={{ borderColor: COLORS.borderLight }}>
                  <span style={{ color: COLORS.textMuted }}>Avg Gift</span>
                  <span className="font-bold" style={{ color: COLORS.utdOrange }}>
                    ${yearData.totals?.gifts ? ((yearData.totals?.revenue || 0) / yearData.totals.gifts).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // ===============================
  // Main Layout
  // ===============================
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at top left, #FFFFFF 0%, #F8FAFC 40%, #E2E8F0 100%)',
      }}
    >
      {/* Glass Header Strip */}
      <div
        className="border-b sticky top-0 z-20 backdrop-blur-xl"
        style={{
          borderColor: 'rgba(148,163,184,0.35)',
          background:
            'linear-gradient(135deg, rgba(248,250,252,0.92), rgba(255,255,255,0.90))',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate('/analytics/executiveDashboard')}
                className="inline-flex items-center text-[11px] sm:text-xs font-medium rounded-full px-3 py-1 border transition-all hover:bg-slate-50"
                style={{
                  borderColor: COLORS.borderLight,
                  color: COLORS.utdOrange,
                }}
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back to Dashboard
              </button>

              <div className="mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="text-2xl sm:text-3xl font-semibold tracking-tight"
                    style={{ color: COLORS.textDark }}
                  >
                    Campaign Performance
                  </h1>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                    style={{
                      borderColor: 'rgba(15,118,110,0.18)',
                      color: COLORS.utdGreen,
                      background:
                        'linear-gradient(135deg, rgba(209,250,229,0.8), rgba(255,255,255,0.8))',
                    }}
                  >
                    Executive Analytics View
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                  UTD-branded, board-ready insight into campaign ROI, efficiency, and donor acquisition.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 shrink-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 rounded-2xl text-xs sm:text-sm font-medium border shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300/70"
                style={{
                  borderColor: COLORS.borderLight,
                  color: COLORS.textDark,
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))',
                }}
              >
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="365d">Last 12 Months</option>
              </select>

              <button
                onClick={fetchCampaignData}
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-2xl text-xs font-semibold border shadow-sm hover:bg-slate-50 transition-all"
                style={{
                  borderColor: COLORS.borderLight,
                  color: COLORS.textMuted,
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </button>

              <button
                className="inline-flex items-center px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background:
                    `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`,
                  boxShadow: COLORS.shadowGlowOrange,
                }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export Report
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs in Glass Panel */}
          <div className="mt-4">
            <div
              className="inline-flex rounded-2xl p-1 shadow-sm border"
              style={{
                borderColor: 'rgba(148,163,184,0.4)',
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.92))',
              }}
            >
              {subNavTabs.map((tab) => {
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className="inline-flex items-center px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${COLORS.utdGreen} 0%, ${COLORS.utdGreenLight} 100%)`
                        : 'transparent',
                      color: isActive ? '#FFFFFF' : COLORS.textMuted,
                      boxShadow: isActive ? COLORS.shadowGlowGreen : 'none',
                      transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                    }}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeSection === 'overview' && <CampaignOverviewSection data={dashboardData} />}
        {activeSection === 'roi-analysis' && <ROIAnalysisSection data={dashboardData} />}
        {activeSection === 'donor-acquisition' && <DonorAcquisitionSection data={dashboardData} />}
        {activeSection === 'revenue-diversification' && <RevenueDiversificationTab />}
        {activeSection === 'multi-year' && <MultiYearTab
                                               multiYearData={multiYearData}
                                               setMultiYearData={setMultiYearData}
                                               fetchMultiYearTrends={fetchMultiYearTrends}
                                           />}
        {activeSection === 'cashflow-grid' && <CashflowGridTab />}
      </div>
    </div>
  );
};

// ============================================
// Metric Card – hybrid glass + solid
// ============================================
const MetricCard = ({ title, value, subtitle, icon, color = 'primary', trend, trendValue }) => {
  const colorConfig = {
    primary: { chip: COLORS.utdOrange, soft: COLORS.utdOrangeSoft },
    secondary: { chip: COLORS.utdGreen, soft: COLORS.utdGreenSoft },
    success: { chip: COLORS.success, soft: 'rgba(5,150,105,0.12)' },
    warning: { chip: COLORS.warning, soft: 'rgba(217,119,6,0.12)' },
    danger: { chip: COLORS.danger, soft: 'rgba(220,38,38,0.12)' },
    info: { chip: COLORS.info, soft: 'rgba(37,99,235,0.12)' },
    purple: { chip: COLORS.purple, soft: 'rgba(124,58,237,0.12)' },
  };

  const palette = colorConfig[color] || colorConfig.primary;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
      style={{
        borderColor: COLORS.borderLight,
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
      }}
    >
      {/* Soft gradient accent corner */}
      <div
        className="absolute inset-y-0 right-0 w-20 opacity-70 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top, ${palette.soft} 0%, transparent 60%)`,
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p
            className="uppercase text-[10px] tracking-[0.18em] font-semibold mb-2"
            style={{ color: COLORS.textSoft }}
          >
            {title}
          </p>
          <p
            className="text-2xl sm:text-3xl font-semibold tracking-tight truncate"
            style={{ color: COLORS.textDark }}
          >
            {value ?? '-'}
          </p>
          <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
            {subtitle}
          </p>
        </div>

        <div
          className="rounded-2xl p-3 flex items-center justify-center shrink-0"
          style={{
            background: `radial-gradient(circle at top, ${palette.soft}, rgba(255,255,255,0.8))`,
            color: palette.chip,
          }}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center justify-between">
          <span
            className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUp className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 mr-1" />
            )}
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// Campaign Infographic Card (A1, compact)
// ============================================
const CampaignInfographicCard = ({ campaign }) => {
  const name = campaign.campaign_name || 'Unknown Campaign';
  const type = campaign.campaign_type?.replace(/_/g, ' ') || '—';

  const raised = campaign.total_raised || 0;
  const expenses = campaign.total_expenses || 0;
  const net = campaign.net_revenue ?? (raised - expenses);

  const roi = (campaign.roi_percentage || 0) / 100;
  const efficiency = campaign.efficiency_score || 0;

  // For bar lengths (compact)
  const totalForScale = Math.max(raised, expenses, 1);
  const raisedPct = Math.max(8, (raised / totalForScale) * 100);
  const expensePct = Math.max(4, (expenses / totalForScale) * 100);

  const efficiencyColor =
    efficiency >= 60 ? COLORS.success : efficiency >= 40 ? COLORS.warning : COLORS.danger;

  const roiPillBg =
    roi >= 5
      ? 'rgba(5,150,105,0.12)'
      : roi >= 1
      ? 'rgba(217,119,6,0.12)'
      : 'rgba(220,38,38,0.12)';

  const roiPillColor =
    roi >= 5 ? COLORS.success : roi >= 1 ? COLORS.warning : COLORS.danger;

  return (
    <div
      className="relative rounded-3xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all duration-200"
      style={{
        minHeight: 240, // H1 compact
        borderColor: COLORS.borderLight,
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
      }}
    >
      {/* subtle corner accent */}
      <div
        className="absolute inset-y-0 right-0 w-16 pointer-events-none opacity-80"
        style={{
          background: `radial-gradient(circle at top, ${COLORS.utdOrangeSoft} 0%, transparent 60%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: COLORS.textDark }}
            title={name}
          >
            {name}
          </p>
          <p className="text-[11px] mt-1 capitalize" style={{ color: COLORS.textSoft }}>
            {type}
          </p>
        </div>

        {/* ROI pill */}
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
          style={{ backgroundColor: roiPillBg, color: roiPillColor }}
        >
          ROI&nbsp;{roi.toFixed(1)}x
        </span>
      </div>

      {/* Bars: Raised vs Expenses */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span style={{ color: COLORS.textSoft }}>Raised</span>
          <span style={{ color: COLORS.textDark }}>{formatCurrency(raised, 1)}</span>
        </div>
        <div
          className="w-full h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: '#E5E7EB' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${raisedPct}%`,
              background: `linear-gradient(90deg, ${COLORS.utdOrange}, ${COLORS.utdOrangeLight})`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium mt-1">
          <span style={{ color: COLORS.textSoft }}>Expenses</span>
          <span style={{ color: COLORS.textMuted }}>{formatCurrency(expenses, 1)}</span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: '#E5E7EB' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${expensePct}%`,
              backgroundColor: COLORS.utdGreen,
            }}
          />
        </div>
      </div>

      {/* Net + Efficiency row */}
      <div className="flex items-center justify-between gap-3 mt-2">
        {/* Net / summary */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium" style={{ color: COLORS.textSoft }}>
            Net Revenue
          </p>
          <p className="text-sm font-semibold" style={{ color: COLORS.textDark }}>
            {formatCurrency(net, 1)}
          </p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            {roi >= 3
              ? 'High performing campaign'
              : roi >= 1
              ? 'Positive ROI'
              : 'Below break-even'}
          </p>
        </div>

        {/* Efficiency ring */}
        <div className="flex items-center gap-3">
          <div
            className="relative flex items-center justify-center"
            style={{ width: 52, height: 52 }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(${efficiencyColor} ${Math.min(
                  efficiency,
                  100
                )}%, #E5E7EB 0)`,
              }}
            />
            <div
              className="absolute inset-[6px] rounded-full"
              style={{ backgroundColor: '#FFFFFF' }}
            />
            <span
              className="relative text-xs font-semibold"
              style={{ color: COLORS.textDark }}
            >
              {efficiency.toFixed(0)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium" style={{ color: COLORS.textSoft }}>
              Efficiency
            </p>
            <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
              {efficiency >= 60
                ? 'Excellent'
                : efficiency >= 40
                ? 'Good'
                : 'Needs improvement'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 1: OVERVIEW
// ============================================
const CampaignOverviewSection = ({ data }) => {
  const { roiAnalysis, revenueBySource } = data;

  const totalRaised =
    roiAnalysis?.summary?.total_raised ||
    roiAnalysis?.campaigns?.reduce((sum, c) => sum + (c.total_raised || 0), 0) ||
    0;
  const totalExpenses =
    roiAnalysis?.summary?.total_expenses ||
    roiAnalysis?.campaigns?.reduce((sum, c) => sum + (c.total_expenses || 0), 0) ||
    0;
  const netRevenue = roiAnalysis?.summary?.total_net_revenue || totalRaised - totalExpenses;
  const campaignCount =
    roiAnalysis?.summary?.total_campaigns_analyzed || roiAnalysis?.campaigns?.length || 0;

  const avgROI = roiAnalysis?.summary?.avg_campaign_roi
    ? roiAnalysis.summary.avg_campaign_roi / 100
    : roiAnalysis?.campaigns?.length > 0
    ? roiAnalysis.campaigns.reduce((sum, c) => sum + (c.roi_percentage || 0) / 100, 0) /
      roiAnalysis.campaigns.length
    : 0;

  const getCampaignProgressChart = () => {
    if (!roiAnalysis?.campaigns) return {};
    const campaigns = roiAnalysis.campaigns.slice(0, 6);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: COLORS.textMuted, fontSize: 12 },
        formatter: (params) => {
          let result = `<div style="font-weight:600;margin-bottom:6px;font-size:13px;color:${COLORS.textDark}">${params[0].name}</div>`;
          params.forEach((p) => {
            result += `<div style="display:flex;justify-content:space-between;gap:16px;margin:4px 0">
              <span style="display:flex;align-items:center">${p.marker}<span style="margin-left:6px">${p.seriesName}</span></span>
              <span style="font-weight:600;color:${COLORS.textDark}">${formatCurrency(p.value * 1000, 1)}</span>
            </div>`;
          });
          return result;
        },
      },
      legend: {
        data: ['Raised', 'Expenses'],
        bottom: 0,
        textStyle: { color: COLORS.textSoft, fontSize: 11 },
        itemGap: 18,
      },
      grid: { left: '3%', right: '4%', top: '10%', bottom: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: campaigns.map((c) => (c.campaign_name || 'Unknown').substring(0, 18)),
        axisLabel: {
          rotate: 25,
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: COLORS.borderMid } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (val) => formatCurrency(val * 1000, 0),
          color: COLORS.textSoft,
          fontSize: 11,
        },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
        axisLine: { show: false },
      },
      series: [
        {
          name: 'Raised',
          type: 'bar',
          data: campaigns.map((c) => Number(((c.total_raised || 0) / 1000).toFixed(1))),
          itemStyle: {
            color: COLORS.utdOrange,
            borderRadius: [10, 10, 0, 0],
          },
          barMaxWidth: 40,
        },
        {
          name: 'Expenses',
          type: 'bar',
          data: campaigns.map((c) =>
            Number(((c.total_expenses || 0) / 1000).toFixed(1))
          ),
          itemStyle: {
            color: '#CBD5E1',
            borderRadius: [10, 10, 0, 0],
          },
          barMaxWidth: 40,
        },
      ],
    };
  };

  const getRevenueSourceChart = () => {
    if (!revenueBySource?.sources) return {};

    let sources = Array.isArray(revenueBySource.sources)
      ? revenueBySource.sources.map((s) => ({
          name: s.source.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          value: Math.round(s.revenue),
        }))
      : Object.entries(revenueBySource.sources).map(([name, value]) => ({
          name,
          value: Math.round(value),
        }));

    // Sort by value descending and limit to top 10, group rest as "Others"
    sources = sources.sort((a, b) => b.value - a.value);
    if (sources.length > 10) {
      const top10 = sources.slice(0, 10);
      const othersTotal = sources.slice(10).reduce((sum, s) => sum + s.value, 0);
      if (othersTotal > 0) {
        top10.push({ name: 'Others', value: othersTotal });
      }
      sources = top10;
    }

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: COLORS.textMuted, fontSize: 12 },
        formatter: (params) =>
          `<div style="font-weight:600;font-size:13px;color:${COLORS.textDark}">${params.name}</div>
           <div style="margin-top:6px;font-size:12px">
             <span style="font-weight:600">${formatCurrency(params.value, 0)}</span>
             <span style="color:${COLORS.textSoft}"> (${params.percent}%)</span>
           </div>`,
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: '2%',
        top: 'middle',
        textStyle: { color: '#475569', fontSize: 10 },
        itemGap: 8,
        itemWidth: 14,
        itemHeight: 10,
        icon: 'circle',
        pageIconSize: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '78%'],
          center: ['30%', '52%'],
          data: sources,
          color: CHART_COLORS,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#FFFFFF',
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: 'rgba(15,23,42,0.12)',
          },
          label: {
            show: true,
            position: 'inside',
            formatter: (params) => params.percent >= 5 ? `${params.percent}%` : '',
            fontSize: 10,
            fontWeight: 600,
            color: '#FFFFFF',
          },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(15,23,42,0.25)',
            },
          },
        },
      ],
    };
  }

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold" style={{ color: COLORS.textDark }}>
            Executive Snapshot
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
            High-level view of fundraising performance, spend, and ROI across active campaigns.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Raised"
          value={formatCurrency(totalRaised, 1)}
          subtitle="Gross revenue from all campaigns in this period."
          icon={<DollarSign className="h-5 w-5" />}
          color="success"
          trend="up"
          trendValue="12.5%"
        />
        <MetricCard
          title="Net Revenue"
          value={formatCurrency(netRevenue, 1)}
          subtitle="Total raised minus all campaign expenses."
          icon={<TrendingUp className="h-5 w-5" />}
          color="primary"
        />
        <MetricCard
          title="Campaigns Analyzed"
          value={formatNumber(campaignCount)}
          subtitle="Number of campaigns included in this view."
          icon={<Target className="h-5 w-5" />}
          color="info"
        />
        <MetricCard
          title="Average ROI"
          value={`${avgROI.toFixed(1)}x`}
          subtitle="Average return on every dollar invested."
          icon={<Percent className="h-5 w-5" />}
          color={avgROI >= 3 ? 'success' : avgROI >= 1 ? 'warning' : 'danger'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
                Campaign Performance
              </h3>
              <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                Revenue vs. expenses comparison for top-performing campaigns.
              </p>
            </div>
            <span
              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{
                backgroundColor: 'rgba(148,163,184,0.10)',
                color: COLORS.textSoft,
              }}
            >
              Top 6 Campaigns
            </span>
          </div>
          <ReactECharts option={getCampaignProgressChart()} style={{ height: '340px' }} />
        </div>

        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
                Revenue by Source
              </h3>
              <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                Distribution of revenue across channels and fundraising sources.
              </p>
            </div>
            <span
              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{
                backgroundColor: 'rgba(148,163,184,0.10)',
                color: COLORS.textSoft,
              }}
            >
              {(revenueBySource?.sources && revenueBySource.sources.length) || 0} Sources
            </span>
          </div>
          <ReactECharts option={getRevenueSourceChart()} style={{ height: '340px' }} />
        </div>
      </div>

      {/* Campaign Detail – Infographic Cards Grid */}
      <div
        className="rounded-3xl border shadow-sm"
        style={{
          borderColor: COLORS.borderLight,
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
        }}
      >
        <div
          className="px-5 sm:px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: COLORS.borderLight }}
        >
          <div>
            <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
              Campaign Detail View
            </h3>
            <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
              Fundraising performance, ROI &amp; efficiency for each campaign.
            </p>
          </div>
          <span
            className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{
              backgroundColor: 'rgba(148,163,184,0.10)',
              color: COLORS.textSoft,
            }}
          >
            {roiAnalysis?.campaigns?.length || 0} Campaigns
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {roiAnalysis?.campaigns?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {roiAnalysis.campaigns.slice(0, 9).map((campaign, idx) => (
                <CampaignInfographicCard key={idx} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div
              className="h-40 flex items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#F8FAFC' }}
            >
              <p className="font-medium text-sm" style={{ color: COLORS.textMuted }}>
                No campaign data available for the selected period.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 2: ROI ANALYSIS
// ============================================
const ROIAnalysisSection = ({ data }) => {
  const { roiAnalysis, costAnalysis } = data;
  const analysisData = roiAnalysis || costAnalysis;

  const avgROI = (analysisData?.summary?.avg_campaign_roi || 0) / 100;
  const totalExpenses = analysisData?.summary?.total_expenses || 0;
  const avgEfficiency = analysisData?.summary?.avg_efficiency_score || 0;
  const bestCampaign = analysisData?.summary?.best_roi_campaign || 'N/A';

  const getROIComparisonChart = () => {
    if (!analysisData?.campaigns) return {};
    const campaigns = analysisData.campaigns.slice(0, 8);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: COLORS.textMuted, fontSize: 12 },
        formatter: (params) => {
          const data = params[0];
          const value = parseFloat(data.value);
          const color =
            value >= 5 ? COLORS.success : value >= 1 ? COLORS.utdOrange : COLORS.danger;
          return `<div style="font-weight:600;margin-bottom:6px;font-size:13px;color:${COLORS.textDark}">${data.name}</div>
            <div style="font-size:12px">ROI: <span style="font-weight:600;color:${color}">${value.toFixed(
            2
          )}x</span></div>`;
        },
      },
      grid: { left: '3%', right: '4%', top: '10%', bottom: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: campaigns.map((c) => (c.campaign_name || 'Unknown').substring(0, 18)),
        axisLabel: {
          rotate: 30,
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: COLORS.borderMid } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'ROI (x)',
        nameTextStyle: {
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLabel: { color: COLORS.textSoft, fontSize: 11 },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: campaigns.map((c) =>
            Number(((c.roi_percentage || 0) / 100).toFixed(2))
          ),
          itemStyle: {
            borderRadius: [10, 10, 0, 0],
            color: (params) => {
              const value = parseFloat(params.value);
              if (value >= 5) return COLORS.success;
              if (value >= 1) return COLORS.utdOrange;
              return COLORS.danger;
            },
          },
          barMaxWidth: 50,
          markLine: {
            data: [{ yAxis: 1 }],
            label: {
              formatter: 'Break-even',
              color: COLORS.warning,
              fontSize: 10,
            },
            lineStyle: {
              color: COLORS.warning,
              type: 'dashed',
            },
          },
        },
      ],
    };
  };

  const getCostPerDollarChart = () => {
    if (!analysisData?.campaigns) return {};
    const campaigns = analysisData.campaigns.slice(0, 8);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: COLORS.textMuted, fontSize: 12 },
        formatter: (params) => {
          const data = params[0];
          return `<div style="font-weight:600;margin-bottom:6px;font-size:13px;color:${COLORS.textDark}">${data.name}</div>
            <div style="font-size:12px">Cost per $1 raised: <span style="font-weight:600;color:${COLORS.utdGreen}">$${Number(
            data.value
          ).toFixed(2)}</span></div>`;
        },
      },
      grid: { left: '3%', right: '4%', top: '10%', bottom: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: campaigns.map((c) => (c.campaign_name || 'Unknown').substring(0, 18)),
        axisLabel: {
          rotate: 30,
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: COLORS.borderMid } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Cost ($)',
        nameTextStyle: {
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLabel: {
          formatter: (val) => `$${val}`,
          color: COLORS.textSoft,
          fontSize: 11,
        },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: campaigns.map((c) => Number((c.cost_per_dollar || 0).toFixed(2))),
          itemStyle: {
            color: COLORS.utdGreen,
            borderRadius: [10, 10, 0, 0],
          },
          barMaxWidth: 50,
        },
      ],
    };
  };

  const getEfficiencyChart = () => {
    if (!analysisData?.campaigns) return {};
    const campaigns = analysisData.campaigns.slice(0, 8);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: COLORS.textMuted, fontSize: 12 },
        formatter: (params) => {
          const data = params[0];
          return `<div style="font-weight:600;margin-bottom:6px;font-size:13px;color:${COLORS.textDark}">${data.name}</div>
            <div style="font-size:12px">Efficiency Score: <span style="font-weight:600">${Number(
            data.value
          ).toFixed(1)}</span></div>`;
        },
      },
      grid: { left: '3%', right: '4%', top: '10%', bottom: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: campaigns.map((c) => (c.campaign_name || 'Unknown').substring(0, 18)),
        axisLabel: {
          rotate: 30,
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: COLORS.borderMid } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Score',
        max: 100,
        nameTextStyle: {
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLabel: { color: COLORS.textSoft, fontSize: 11 },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: campaigns.map((c) => Number((c.efficiency_score || 0).toFixed(1))),
          itemStyle: {
            borderRadius: [10, 10, 0, 0],
            color: (params) => {
              const value = parseFloat(params.value);
              if (value >= 60) return COLORS.success;
              if (value >= 40) return COLORS.warning;
              return COLORS.danger;
            },
          },
          barMaxWidth: 50,
        },
      ],
    };
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold" style={{ color: COLORS.textDark }}>
            ROI & Efficiency Deep-Dive
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
            Compare ROI, cost per dollar raised, and efficiency scores across campaigns.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Average ROI"
          value={`${avgROI.toFixed(1)}x`}
          subtitle="Average return across all analyzed campaigns."
          icon={<TrendingUp className="h-5 w-5" />}
          color="success"
        />
        <MetricCard
          title="Total Spend"
          value={formatCurrency(totalExpenses, 1)}
          subtitle="Total marketing and fundraising expenses."
          icon={<DollarSign className="h-5 w-5" />}
          color="warning"
        />
        <MetricCard
          title="Avg Efficiency Score"
          value={avgEfficiency.toFixed(1)}
          subtitle="Composite performance score."
          icon={<Activity className="h-5 w-5" />}
          color="info"
        />
        <MetricCard
          title="Best Campaign"
          value={bestCampaign.substring(0, 15)}
          subtitle="Highest ROI campaign in this cohort."
          icon={<Award className="h-5 w-5" />}
          color="primary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
                ROI by Campaign
              </h3>
              <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                Return on investment for each campaign compared to break-even.
              </p>
            </div>
            <span
              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: COLORS.success }}
            >
              Higher is better
            </span>
          </div>
          <ReactECharts option={getROIComparisonChart()} style={{ height: '340px' }} />
        </div>

        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
                Cost per Dollar Raised
              </h3>
              <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                Fundraising efficiency across campaigns based on cost to generate $1.
              </p>
            </div>
            <span
              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: COLORS.info }}
            >
              Lower is better
            </span>
          </div>
          <ReactECharts option={getCostPerDollarChart()} style={{ height: '340px' }} />
        </div>
      </div>

      {/* Efficiency Chart */}
      <div
        className="rounded-3xl p-5 sm:p-6 border shadow-sm"
        style={{
          borderColor: COLORS.borderLight,
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
              Campaign Efficiency Scores
            </h3>
            <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
              Performance rating across financial and engagement dimensions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
              Excellent (60+)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.warning }} />
              Good (40–59)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.danger }} />
              Needs Work (&lt;40)
            </span>
          </div>
        </div>
        <ReactECharts option={getEfficiencyChart()} style={{ height: '320px' }} />
      </div>

      {/* Recommendations */}
      {analysisData?.recommendations && analysisData.recommendations.length > 0 && (
        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
          }}
        >
          <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>
            Recommendations
          </h3>
          <div className="space-y-3">
            {analysisData.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-2xl border"
                style={{
                  borderColor: COLORS.borderLight,
                  background:
                    'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(255,255,255,0.95))',
                }}
              >
                <div
                  className="mt-0.5 rounded-full p-1.5"
                  style={{
                    backgroundColor: 'rgba(232,117,0,0.12)',
                    color: COLORS.utdOrange,
                  }}
                >
                  <Award className="h-4 w-4" />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SECTION 3: DONOR ACQUISITION
// ============================================
const DonorAcquisitionSection = ({ data }) => {
  const { matchingGifts, roiAnalysis, abTestResults } = data;
  const campaigns = roiAnalysis?.campaigns || [];

  const getDonorAcquisitionCostChart = () => {
    if (!campaigns.length) return {};
    const campaignData = campaigns.slice(0, 8);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: COLORS.textMuted, fontSize: 12 },
        formatter: (params) => {
          const data = params[0];
          return `<div style="font-weight:600;margin-bottom:6px;font-size:13px;color:${COLORS.textDark}">${data.name}</div>
            <div style="font-size:12px">Acquisition Cost: <span style="font-weight:600;color:${COLORS.info}">${formatCurrency(
            data.value,
            0
          )}</span></div>`;
        },
      },
      grid: { left: '3%', right: '4%', top: '10%', bottom: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: campaignData.map((c) => (c.campaign_name || 'Unknown').substring(0, 18)),
        axisLabel: {
          rotate: 30,
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: COLORS.borderMid } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Cost ($)',
        nameTextStyle: { color: COLORS.textSoft, fontSize: 11 },
        axisLabel: {
          formatter: (val) => formatCurrency(val, 0),
          color: COLORS.textSoft,
          fontSize: 11,
        },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: campaignData.map((c) => c.donor_acquisition_cost || 0),
          itemStyle: {
            color: COLORS.info,
            borderRadius: [10, 10, 0, 0],
          },
          barMaxWidth: 50,
        },
      ],
    };
  };

  const getLTVtoCACChart = () => {
    if (!campaigns.length) return {};
    const campaignData = campaigns.slice(0, 8);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: COLORS.textMuted, fontSize: 12 },
        formatter: (params) => {
          const data = params[0];
          const value = parseFloat(data.value);
          const color =
            value >= 3 ? COLORS.success : value >= 1 ? COLORS.warning : COLORS.danger;
          return `<div style="font-weight:600;margin-bottom:6px;font-size:13px;color:${COLORS.textDark}">${data.name}</div>
            <div style="font-size:12px">LTV:CAC Ratio: <span style="font-weight:600;color:${color}">${value.toFixed(
            2
          )}x</span></div>`;
        },
      },
      grid: { left: '3%', right: '4%', top: '10%', bottom: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: campaignData.map((c) => (c.campaign_name || 'Unknown').substring(0, 18)),
        axisLabel: {
          rotate: 30,
          color: COLORS.textSoft,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: COLORS.borderMid } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Ratio (x)',
        nameTextStyle: { color: COLORS.textSoft, fontSize: 11 },
        axisLabel: { color: COLORS.textSoft, fontSize: 11 },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: campaignData.map((c) => Number((c.ltv_to_cac_ratio || 0).toFixed(2))),
          itemStyle: {
            borderRadius: [10, 10, 0, 0],
            color: (params) => {
              const value = parseFloat(params.value);
              if (value >= 3) return COLORS.success;
              if (value >= 1) return COLORS.warning;
              return COLORS.danger;
            },
          },
          barMaxWidth: 50,
          markLine: {
            data: [{ yAxis: 3 }],
            label: {
              formatter: 'Target: 3x',
              color: COLORS.success,
              fontSize: 10,
            },
            lineStyle: {
              color: COLORS.success,
              type: 'dashed',
            },
          },
        },
      ],
    };
  };

  const avgCAC =
    campaigns.reduce((sum, c) => sum + (c.donor_acquisition_cost || 0), 0) /
    (campaigns.length || 1);
  const avgLTV =
    campaigns.reduce((sum, c) => sum + (c.donor_lifetime_value || 0), 0) /
    (campaigns.length || 1);
  const avgLTVtoCAC =
    campaigns.reduce((sum, c) => sum + (c.ltv_to_cac_ratio || 0), 0) /
    (campaigns.length || 1);
  const totalMatchingAmount = matchingGifts?.total_matched || 0;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold" style={{ color: COLORS.textDark }}>
            Donor Acquisition & Value
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
            Understand acquisition costs, donor value, matching gifts, and experiment outcomes.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Avg Acquisition Cost"
          value={formatCurrency(avgCAC, 0)}
          subtitle="Average cost required to acquire a new donor."
          icon={<UserPlus className="h-5 w-5" />}
          color="info"
        />
        <MetricCard
          title="Avg Lifetime Value"
          value={formatCurrency(avgLTV, 0)}
          subtitle="Average projected lifetime value per donor."
          icon={<DollarSign className="h-5 w-5" />}
          color="success"
        />
        <MetricCard
          title="Avg LTV:CAC Ratio"
          value={`${avgLTVtoCAC.toFixed(2)}x`}
          subtitle={
            avgLTVtoCAC >= 3 ? 'Excellent economics' : avgLTVtoCAC >= 1 ? 'Acceptable' : 'Needs improvement'
          }
          icon={<TrendingUp className="h-5 w-5" />}
          color={avgLTVtoCAC >= 3 ? 'success' : avgLTVtoCAC >= 1 ? 'warning' : 'danger'}
        />
        <MetricCard
          title="Matching Gifts"
          value={formatCurrency(totalMatchingAmount, 0)}
          subtitle="Total matched gift value in the selected period."
          icon={<Gift className="h-5 w-5" />}
          color="primary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
                Donor Acquisition Cost
              </h3>
              <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                Cost to bring new donors into each campaign.
              </p>
            </div>
            <span
              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: COLORS.info }}
            >
              Lower is better
            </span>
          </div>
          <ReactECharts option={getDonorAcquisitionCostChart()} style={{ height: '340px' }} />
        </div>

        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
                LTV to CAC Ratio
              </h3>
              <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                Donor value relative to cost of acquisition by campaign.
              </p>
            </div>
            <span
              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: COLORS.success }}
            >
              Target: 3x or higher
            </span>
          </div>
          <ReactECharts option={getLTVtoCACChart()} style={{ height: '340px' }} />
        </div>
      </div>

      {/* Matching Gifts & A/B Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Matching Gifts */}
        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          }}
        >
          <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>
            Matching Gifts Program
          </h3>
          {matchingGifts ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.08), #FFFFFF)',
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: COLORS.textSoft }}
                  >
                    Total Matched
                  </p>
                  <p
                    className="text-xl sm:text-2xl font-semibold mt-2"
                    style={{ color: COLORS.success }}
                  >
                    {formatCurrency(matchingGifts.total_matched || 0, 0)}
                  </p>
                </div>
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(232,117,0,0.10), #FFFFFF)',
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: COLORS.textSoft }}
                  >
                    Eligible Donors
                  </p>
                  <p
                    className="text-xl sm:text-2xl font-semibold mt-2"
                    style={{ color: COLORS.utdOrange }}
                  >
                    {formatNumber(matchingGifts.eligible_donors || 0)}
                  </p>
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border"
                style={{ borderColor: COLORS.borderLight }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: COLORS.textDark }}
                  >
                    Capture Rate
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: COLORS.textDark }}
                  >
                    {(matchingGifts.capture_rate || 0).toFixed(1)}%
                  </span>
                </div>
                <div
                  className="w-full h-3 rounded-full overflow-hidden"
                  style={{ backgroundColor: '#E5E7EB' }}
                >
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${matchingGifts.capture_rate || 0}%`,
                      background: `linear-gradient(90deg, #34D399, #10B981)`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              className="h-52 flex items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#F8FAFC' }}
            >
              <p className="font-medium text-sm" style={{ color: COLORS.textMuted }}>
                No matching gifts data available for the selected period.
              </p>
            </div>
          )}
        </div>

        {/* A/B Test Results */}
        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-sm"
          style={{
            borderColor: COLORS.borderLight,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          }}
        >
          <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: COLORS.textDark }}>
            A/B Test Results
          </h3>
          {(() => {
            // Combine active and completed tests from API response
            const allTests = [
              ...(abTestResults?.active_tests || []),
              ...(abTestResults?.completed_tests || [])
            ];

            return allTests.length > 0 ? (
              <div className="space-y-3">
                {allTests.slice(0, 3).map((test, idx) => (
                  <div
                    key={test.test_id || idx}
                    className="p-4 rounded-2xl border hover:shadow-sm transition-shadow"
                    style={{ borderColor: COLORS.borderLight }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4
                        className="font-semibold text-sm"
                        style={{ color: COLORS.textDark }}
                      >
                        {test.test_name}
                      </h4>
                      <span
                        className={`px-2.5 py-1 text-[11px] rounded-full font-bold ${
                          test.winner
                            ? 'bg-emerald-50 text-emerald-700'
                            : test.status === 'completed'
                            ? 'bg-gray-50 text-gray-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {test.winner ? `Winner: ${test.winner}` : test.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: '#F8FAFC' }}
                      >
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: COLORS.textSoft }}
                        >
                          {test.variant_a?.name || 'Variant A'} ({test.variant_a?.donations || 0} donations)
                        </span>
                        <p
                          className="font-semibold mt-1"
                          style={{ color: COLORS.textDark }}
                        >
                          {((test.variant_a?.conversion_rate || 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: '#F8FAFC' }}
                      >
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: COLORS.textSoft }}
                        >
                          {test.variant_b?.name || 'Variant B'} ({test.variant_b?.donations || 0} donations)
                        </span>
                        <p
                          className="font-semibold mt-1"
                          style={{ color: COLORS.textDark }}
                        >
                          {((test.variant_b?.conversion_rate || 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="h-52 flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: '#F8FAFC' }}
              >
                <p className="font-medium text-sm" style={{ color: COLORS.textMuted }}>
                  No A/B tests running or recorded for this period.
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Acquisition Metrics Table */}
      <div
        className="rounded-3xl border shadow-sm overflow-hidden"
        style={{
          borderColor: COLORS.borderLight,
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
        }}
      >
        <div
          className="px-5 sm:px-6 py-4 border-b"
          style={{ borderColor: COLORS.borderLight }}
        >
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.textDark }}>
            Acquisition Metrics by Campaign
          </h3>
          <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
            Compare acquisition cost, lifetime value, LTV:CAC and payback period across campaigns.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.borderLight}` }}>
                <th
                  className="text-left py-3.5 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: COLORS.textSoft }}
                >
                  Campaign
                </th>
                <th
                  className="text-right py-3.5 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: COLORS.textSoft }}
                >
                  Acquisition Cost
                </th>
                <th
                  className="text-right py-3.5 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: COLORS.textSoft }}
                >
                  Lifetime Value
                </th>
                <th
                  className="text-right py-3.5 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: COLORS.textSoft }}
                >
                  LTV:CAC
                </th>
                <th
                  className="text-right py-3.5 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: COLORS.textSoft }}
                >
                  Payback (Years)
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 12).map((c, idx) => {
                const ltv = c.donor_lifetime_value || 0;
                const cac = c.donor_acquisition_cost || 0;
                const ratio = c.ltv_to_cac_ratio || (cac ? ltv / cac : 0);
                const payback = c.payback_period_years ?? (ratio > 0 ? 1 / ratio : 0);

                return (
                  <tr
                    key={idx}
                    className="transition-colors"
                    style={{
                      borderBottom: `1px solid ${COLORS.borderLight}`,
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                    }}
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: COLORS.textDark }}
                        >
                          {c.campaign_name || 'Unknown'}
                        </p>
                        <p
                          className="text-[11px] mt-0.5 font-medium"
                          style={{ color: COLORS.textMuted }}
                        >
                          {c.campaign_type?.replace(/_/g, ' ') || '—'}
                        </p>
                      </div>
                    </td>
                    <td
                      className="py-3.5 px-4 text-right font-medium text-sm"
                      style={{ color: COLORS.textMuted }}
                    >
                      {formatCurrency(c.donor_acquisition_cost || 0, 0)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right font-medium text-sm"
                      style={{ color: COLORS.textDark }}
                    >
                      {formatCurrency(c.donor_lifetime_value || 0, 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor:
                            ratio >= 3
                              ? 'rgba(5,150,105,0.12)'
                              : ratio >= 1
                              ? 'rgba(217,119,6,0.12)'
                              : 'rgba(220,38,38,0.12)',
                          color:
                            ratio >= 3
                              ? COLORS.success
                              : ratio >= 1
                              ? COLORS.warning
                              : COLORS.danger,
                        }}
                      >
                        {ratio.toFixed(2)}x
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-4 text-right text-[13px] font-medium"
                      style={{ color: COLORS.textDark }}
                    >
                      {payback > 0 ? payback.toFixed(2) : '—'}
                    </td>
                  </tr>
                );
              })}

              {!campaigns.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 px-4 text-center text-sm font-medium"
                    style={{ color: COLORS.textMuted }}
                  >
                    No acquisition metrics available for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCampaignDashboard;