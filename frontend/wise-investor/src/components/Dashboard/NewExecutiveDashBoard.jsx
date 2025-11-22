import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp, Users, DollarSign, Target, Gift, Calendar, Shield,
  Activity, Heart, Award, Briefcase, Eye, Info, ChevronRight,
  UserPlus, Mail, Phone, Clock, CheckCircle, AlertTriangle,
  Zap, Brain, ArrowUp, ArrowDown, Star, Lightbulb, Users2,
  BarChart3, PieChart, LineChart, Download, Maximize2,
  RefreshCw, AlertCircle, TrendingDown, Globe, MousePointer, Percent,
  Grid, Compass, ArrowLeft
} from 'lucide-react';

// PREMIUM EXECUTIVE COLOR PALETTE
const EXECUTIVE_COLORS = {
  primary: '#e87500',          // UT Dallas Orange - Premium accent
  secondary: '#154734',        // UT Dallas Green - Professional depth
  accent: '#5fe0b7',           // Accent Green - Highlights
  light: '#FFF9F5',            // Warm white background
  dark: '#0A1F16',             // Deep professional dark

  // Premium gradients and accents
  gradient: {
    primary: 'linear-gradient(135deg, #e87500 0%, #ff9933 100%)',
    secondary: 'linear-gradient(135deg, #154734 0%, #1a5c44 100%)',
    accent: 'linear-gradient(135deg, #5fe0b7 0%, #7ef5cd 100%)',
    neutral: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  },

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Professional grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Premium chart color palettes
const CHART_COLORS = {
  primary: ['#e87500', '#ff9933', '#ffad5c', '#ffc285'],
  secondary: ['#154734', '#1a5c44', '#2d7a5e', '#429878'],
  mixed: ['#e87500', '#154734', '#5fe0b7', '#3b82f6', '#f59e0b'],
  gradient: {
    orange: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
      { offset: 0, color: 'rgba(232, 117, 0, 0.8)' },
      { offset: 1, color: 'rgba(232, 117, 0, 0.1)' }
    ]},
    green: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
      { offset: 0, color: 'rgba(21, 71, 52, 0.8)' },
      { offset: 1, color: 'rgba(21, 71, 52, 0.1)' }
    ]},
  }
};

/**
 * PREMIUM P2SG EXECUTIVE DASHBOARD - COMPLETE VERSION
 * Enterprise-grade styling for board meetings with all analytics features
 */
const CompletePremiumExecutiveDashboard = () => {
  const { user, getToken, getOrganizationId } = useAuth();

  // HARDCODE THE ORGANIZATION ID FOR NOW - Replace with your actual method
  const organizationId = getOrganizationId() ;

  const [dashboardData, setDashboardData] = useState({
    executive: null,
    health: null,
    okrs: null,
    avgDonation: null,
    insights: null,
    lapsed: null,
    missionVision: null,
    goldenTriangle: null,
    donorChurnTrend: null,
    loading: true,
    error: null
  });

  const [viewScale, setViewScale] = useState('fit');
  const [activeTab, setActiveTab] = useState("overview");
  // Predictive metrics state
  const [predictiveMetrics, setPredictiveMetrics] = useState({
    forecast: null,
    churnRisk: null,
    momentum: null,
    goalAttainment: null
  });

  // Time period selection state
  const [timePeriod, setTimePeriod] = useState('YTD');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Golden Triangle What-If Calculator state
  const [goldenTriangleAdjustments, setGoldenTriangleAdjustments] = useState({
    trafficIncrease: 0,      // percentage increase
    conversionIncrease: 0,   // percentage increase
    avgGiftIncrease: 0       // percentage increase
  });

  // Financial Trends data state
  const [financialTrends, setFinancialTrends] = useState({
    revenueDiversification: null,
    multiYearData: null,
    cashflowGrid: null,
    roiAnalysis: null,
    strategicSummary: null
  });
  // Enhanced Multi-Year Trends state from Campaign Dashboard
  const [enhancedMultiYearData, setEnhancedMultiYearData] = useState({
    revenue: null,
    donors: null,
    gifts: null,
    retention: null,
    new_donors: null,
    lapsed: null,
    selectedMetric: "revenue",
    selectedYears: 3
  });


  // Time range for financial trends
  const [timeRange, setTimeRange] = useState('365d');

  // Grid view mode for 3-year cashflow
  const [gridViewMode, setGridViewMode] = useState('all'); // 'all', 'ytd'

  // Sub-navigation tabs
  const subNavTabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'financial-trends', label: 'Financial Trends', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'strategic-planning', label: 'Strategic Planning', icon: <Compass className="h-4 w-4" /> }
  ];

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    try {
      const token = await getToken();
      const baseUrl = ''

      console.log('Fetching data from:', baseUrl);
      console.log('Organization ID:', organizationId);

      const [execRes, healthRes, okrRes, avgRes, insightsRes, lapsedRes, missionRes, goldenRes, churnTrendRes, forecastRes, churnRiskRes, momentumRes, goalRes,continuumRes ] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/executive-dashboard/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/dashboard/health-score/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/okrs/${organizationId}?period=2025`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/avg-donation/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/dashboard/insights/${organizationId}?limit=3`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/lapsed-rate/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/mission-vision/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/digital/golden-triangle/${organizationId}?period_days=30`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/reports/donor-churn/${organizationId}/trend?months=12`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/predictive/revenue-forecast/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/predictive/donor-churn-risk/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/predictive/campaign-momentum/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/predictive/goal-attainment/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/engagement/investment-continuum/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [executive, health, okrs, avgDonation, insights, lapsed, missionVision, goldenTriangle, donorChurnTrend, forecast, churnRisk, momentum, goalAttainment,continuum] = await Promise.all([
        execRes.json(),
        healthRes.json(),
        okrRes.json(),
        avgRes.json(),
        insightsRes.json(),
        lapsedRes.json(),
        missionRes.json(),
        goldenRes.json(),
        churnTrendRes.json(),
        forecastRes.json(),
        churnRiskRes.json(),
        momentumRes.json(),
        goalRes.json(),
        continuumRes.json()
      ]);

      console.log('Fetched data:', { executive, health, okrs, goldenTriangle, donorChurnTrend });

      setDashboardData({
        executive,
        health,
        okrs,
        avgDonation,
        insights,
        lapsed,
        continuum,
        missionVision,
        goldenTriangle,
        donorChurnTrend,
        loading: false,
        error: null
      });

      setPredictiveMetrics({
        forecast: forecast,
        churnRisk: churnRisk,
        momentum: momentum,
        goalAttainment: goalAttainment
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Fetch Financial Trends data (for Financial Trends tab)
  const fetchFinancialTrends = async () => {
    try {
      const token = await getToken();
      const baseUrl = '';

      const [diversificationRes, multiYearRes, cashflowRes, roiRes, strategicRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/revenue/diversification?period=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/trends/multi-year?metric=revenue&years=3`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/cashflow/three-year-grid`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/campaigns/roi-analysis/${organizationId}?range=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/v1/analytics/strategic-summary/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [diversification, multiYear, cashflow, roi, strategic] = await Promise.all([
        diversificationRes.ok ? diversificationRes.json() : null,
        multiYearRes.ok ? multiYearRes.json() : null,
        cashflowRes.ok ? cashflowRes.json() : null,
        roiRes.ok ? roiRes.json() : null,
        strategicRes.ok ? strategicRes.json() : null
      ]);

      setFinancialTrends({
        revenueDiversification: diversification,
        multiYearData: multiYear,
        cashflowGrid: cashflow,
        roiAnalysis: roi,
        strategicSummary: strategic
      });
    } catch (error) {
      console.error('Error fetching financial trends:', error);
    }
  };

  // Enhanced Multi-Year Trends fetch function from Campaign Dashboard
  const fetchEnhancedMultiYearTrends = async (metric = "revenue", years = 3) => {
    try {
      const token = await getToken();
      const baseUrl = "";

      const response = await fetch(
        `${baseUrl}/api/v1/analytics/${organizationId}/trends/multi-year?metric=${metric}&years=${years}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch multi-year ${metric} data`);
      }

      const data = await response.json();

      setEnhancedMultiYearData(prev => ({
        ...prev,
        [metric]: data,
        selectedMetric: metric,
        selectedYears: years
      }));
    } catch (error) {
      console.error(`Error fetching multi-year ${metric} trends:`, error);
    }
  };


  // Fetch financial trends when tab changes or on mount
  useEffect(() => {
    if (activeTab === 'financial-trends' || activeTab === 'strategic-planning') {
      fetchFinancialTrends();
    }
  }, [activeTab, timeRange]);

  // Fetch enhanced multi-year trends when tab changes
  useEffect(() => {
    if (activeTab === "financial-trends") {
      fetchEnhancedMultiYearTrends(
        enhancedMultiYearData.selectedMetric,
        enhancedMultiYearData.selectedYears
      );
    }
  }, [activeTab, enhancedMultiYearData.selectedMetric, enhancedMultiYearData.selectedYears]);

  const calculateP2SGScores = () => {
    const { executive, health, okrs } = dashboardData;

    if (!executive || !health || !okrs) {
      return {
        vision_score: 0,
        strategy_score: 0,
        sustained_investment_score: 0,
        momentum_score: 0,
        donor_engagement_score: 0,
        donor_experience_score: 0,
        donor_retention_score: 0,
        lifetime_value_score: 0
      };
    }

    const scores = {
      vision_score: okrs.objectives?.[0]?.key_results?.[0]?.progress || 0,
      strategy_score: health.components?.revenue_health?.percentage || 0,
      sustained_investment_score: Math.min(100,
        (executive.key_metrics?.total_revenue_ytd / 10000000) * 100
      ),
      momentum_score: health.components?.donor_acquisition?.percentage || 0,
      donor_engagement_score: health.components?.donor_engagement?.percentage || 0,
      donor_experience_score: Math.round(
        (health.components?.donor_engagement?.percentage || 0) * 0.5 +
        ((executive.key_metrics?.active_donors / executive.key_metrics?.total_donors) * 100 || 0) * 0.5
      ),
      donor_retention_score: executive.key_metrics?.donor_retention_rate || 0,
      lifetime_value_score: Math.min(100,
        (executive.key_metrics?.avg_gift_size / 25000) * 100
      )
    };

    console.log('Calculated P2SG scores:', scores);
    return scores;
  };

  const getWiseInvestor2x2 = () => {
    const scores = calculateP2SGScores();
    const growthScore = scores.momentum_score;
    const sustainabilityScore = scores.donor_retention_score;

    let quadrant = '';
    if (growthScore >= 70 && sustainabilityScore >= 70) {
      quadrant = 'wise_investor';
    } else if (growthScore >= 70 && sustainabilityScore < 70) {
      quadrant = 'growth_focused';
    } else if (growthScore < 70 && sustainabilityScore >= 70) {
      quadrant = 'stable_traditional';
    } else {
      quadrant = 'needs_attention';
    }

    return {
      quadrant,
      growth: growthScore,
      sustainability: sustainabilityScore,
      x: sustainabilityScore,
      y: growthScore
    };
  };

  // WISE INVESTOR 2×2 VISUAL SCATTER CHART - NEW ADDITION
  const getWiseInvestor2x2Chart = () => {
    const wiseInvestor = getWiseInvestor2x2();

    return {
      title: {
        text: 'Wise Investor 2×2 Quadrant',
        left: 'center',
        top: 5,
        textStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: EXECUTIVE_COLORS.gray[800]
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: EXECUTIVE_COLORS.gray[200],
        borderWidth: 1,
        textStyle: {
          color: EXECUTIVE_COLORS.gray[700],
          fontSize: 13
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
        formatter: (params) => {
          if (params.componentType === 'series' && params.seriesType === 'scatter') {
            return `
              <div style="max-width: 280px;">
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px;">
                  Current Position
                </div>
                <div style="margin-bottom: 8px;">
                  <strong>Growth:</strong> ${wiseInvestor.growth.toFixed(1)}%<br/>
                  <strong>Sustainability:</strong> ${wiseInvestor.sustainability.toFixed(1)}%
                </div>
              </div>
            `;
          }
          return '';
        }
      },
      grid: {
        left: '15%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Sustainability (Retention)',
        nameLocation: 'middle',
        nameGap: 35,
        min: 0,
        max: 100,
        splitNumber: 2,
        axisLabel: {
          fontSize: 11,
          color: EXECUTIVE_COLORS.gray[600],
          formatter: '{value}%'
        },
        axisLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[400] }
        },
        splitLine: {
          lineStyle: {
            color: EXECUTIVE_COLORS.gray[300],
            type: 'dashed'
          }
        },
        nameTextStyle: {
          fontSize: 12,
          fontWeight: '600',
          color: EXECUTIVE_COLORS.gray[700]
        }
      },
      yAxis: {
        type: 'value',
        name: 'Growth (Momentum)',
        nameLocation: 'middle',
        nameGap: 50,
        min: 0,
        max: 100,
        splitNumber: 2,
        axisLabel: {
          fontSize: 11,
          color: EXECUTIVE_COLORS.gray[600],
          formatter: '{value}%'
        },
        axisLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[400] }
        },
        splitLine: {
          lineStyle: {
            color: EXECUTIVE_COLORS.gray[300],
            type: 'dashed'
          }
        },
        nameTextStyle: {
          fontSize: 12,
          fontWeight: '600',
          color: EXECUTIVE_COLORS.gray[700]
        }
      },
      series: [
        // Horizontal reference line at 70%
        {
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: EXECUTIVE_COLORS.gray[400],
              type: 'dashed',
              width: 2
            },
            data: [
              { yAxis: 70 }
            ],
            label: {
              show: false
            }
          }
        },
        // Vertical reference line at 70%
        {
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: EXECUTIVE_COLORS.gray[400],
              type: 'dashed',
              width: 2
            },
            data: [
              { xAxis: 70 }
            ],
            label: {
              show: false
            }
          }
        },
        // Organization position dot
        {
          type: 'scatter',
          symbolSize: 28,
          data: [[wiseInvestor.x, wiseInvestor.y]],
          itemStyle: {
            color: wiseInvestor.quadrant === 'wise_investor' ? EXECUTIVE_COLORS.success :
                   wiseInvestor.quadrant === 'growth_focused' ? EXECUTIVE_COLORS.warning :
                   wiseInvestor.quadrant === 'stable_traditional' ? EXECUTIVE_COLORS.info :
                   EXECUTIVE_COLORS.danger,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 10,
            shadowOffsetY: 4,
            borderColor: '#fff',
            borderWidth: 3
          },
          label: {
            show: true,
            position: 'top',
            formatter: 'You',
            fontSize: 12,
            fontWeight: '600',
            color: EXECUTIVE_COLORS.gray[800]
          },
          emphasis: {
            scale: 1.3,
            itemStyle: {
              shadowBlur: 16,
              shadowColor: 'rgba(0, 0, 0, 0.4)'
            }
          }
        }
      ],
      graphic: [
        // Top-Right: Wise Investor
        {
          type: 'rect',
          right: '10%',
          top: '15%',
          shape: { width: 180, height: 120 },
          style: {
            fill: `${EXECUTIVE_COLORS.success}15`
          },
          silent: true
        },
        {
          type: 'text',
          right: '12%',
          top: '18%',
          style: {
            text: 'Wise Investor',
            fontSize: 12,
            fontWeight: '600',
            fill: EXECUTIVE_COLORS.success
          },
          silent: true
        },
        // Top-Left: Growth Focused
        {
          type: 'rect',
          left: '15%',
          top: '15%',
          shape: { width: 180, height: 120 },
          style: {
            fill: `${EXECUTIVE_COLORS.warning}15`
          },
          silent: true
        },
        {
          type: 'text',
          left: '17%',
          top: '18%',
          style: {
            text: 'Growth Focused',
            fontSize: 12,
            fontWeight: '600',
            fill: EXECUTIVE_COLORS.warning
          },
          silent: true
        },
        // Bottom-Right: Stable Traditional
        {
          type: 'rect',
          right: '10%',
          bottom: '15%',
          shape: { width: 180, height: 120 },
          style: {
            fill: `${EXECUTIVE_COLORS.info}15`
          },
          silent: true
        },
        {
          type: 'text',
          right: '12%',
          bottom: '50%',
          style: {
            text: 'Stable Traditional',
            fontSize: 12,
            fontWeight: '600',
            fill: EXECUTIVE_COLORS.info
          },
          silent: true
        },
        // Bottom-Left: Needs Attention
        {
          type: 'rect',
          left: '15%',
          bottom: '15%',
          shape: { width: 180, height: 120 },
          style: {
            fill: `${EXECUTIVE_COLORS.danger}15`
          },
          silent: true
        },
        {
          type: 'text',
          left: '17%',
          bottom: '50%',
          style: {
            text: 'Needs Attention',
            fontSize: 12,
            fontWeight: '600',
            fill: EXECUTIVE_COLORS.danger
          },
          silent: true
        }
      ]
    };
  };
  const getMultiYearROIProjectionChart = () => {
      return {
          title: {
              text: '5-Year & 10-Year ROI Projection',
              left: 'center',
              top: 10,
              textStyle: {
                fontSize: 16,
                fontWeight: 600,
                color: EXECUTIVE_COLORS.gray[800]
              }
          },
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: EXECUTIVE_COLORS.gray[200],
            textStyle: { color: EXECUTIVE_COLORS.gray[700] }
          },
          legend: {
            top: 40,
            data: ['5-Year ROI', '10-Year ROI'],
            textStyle: { color: EXECUTIVE_COLORS.gray[600] }
          },
          grid: { top: 80, bottom: 30, left: 50, right: 30 },
          xAxis: {
              type: 'category',
              data: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 10'],
              axisLabel: { color: EXECUTIVE_COLORS.gray[600] },
              axisLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[300] } }
          },
          yAxis: {
              type: 'value',
              axisLabel: {
                formatter: value => value + '%',
                color: EXECUTIVE_COLORS.gray[600]
              },
              splitLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[200] } }
          },
          series: [
              {
                  name: '5-Year ROI',
                  type: 'line',
                  smooth: true,
                  data: [12, 22, 35, 48, 60],
                  lineStyle: { color: EXECUTIVE_COLORS.primary, width: 3 },
                  itemStyle: { color: EXECUTIVE_COLORS.primary },
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(232, 117, 0, 0.3)' },
                        { offset: 1, color: 'rgba(232, 117, 0, 0.05)' }
                      ]
                    }
                  }
              },
              {
                  name: '10-Year ROI',
                  type: 'line',
                  smooth: true,
                  data: [12, 22, 35, 48, 60, 120],
                  lineStyle: { color: EXECUTIVE_COLORS.secondary, width: 3 },
                  itemStyle: { color: EXECUTIVE_COLORS.secondary },
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(21, 71, 52, 0.3)' },
                        { offset: 1, color: 'rgba(21, 71, 52, 0.05)' }
                      ]
                    }
                  }
              }
          ]
      };
  };

   const getCumulativeROIChart = () => {
       return {
           title: {
             text: 'Cumulative ROI (Year-over-Year)',
             left: 'center',
             textStyle: {
               fontSize: 16,
               fontWeight: 600,
               color: EXECUTIVE_COLORS.gray[800]
             }
           },
           tooltip: {
             trigger: 'axis',
             backgroundColor: 'rgba(255, 255, 255, 0.95)',
             borderColor: EXECUTIVE_COLORS.gray[200],
             textStyle: { color: EXECUTIVE_COLORS.gray[700] }
           },
           grid: { top: 60, bottom: 30, left: 50, right: 30 },
           xAxis: {
               type: 'category',
               data: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
               axisLabel: { color: EXECUTIVE_COLORS.gray[600] },
               axisLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[300] } }
           },
           yAxis: {
             type: 'value',
             axisLabel: {
               formatter: v => v + '%',
               color: EXECUTIVE_COLORS.gray[600]
             },
             splitLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[200] } }
           },
           series: [{
               type: 'line',
               smooth: true,
               areaStyle: {
                 color: {
                   type: 'linear',
                   x: 0, y: 0, x2: 0, y2: 1,
                   colorStops: [
                     { offset: 0, color: 'rgba(232, 117, 0, 0.4)' },
                     { offset: 1, color: 'rgba(232, 117, 0, 0.05)' }
                   ]
                 }
               },
               lineStyle: { color: EXECUTIVE_COLORS.primary, width: 3 },
               itemStyle: { color: EXECUTIVE_COLORS.primary },
               data: [12, 27, 40, 56, 75]
           }]
       };
   };


  const getROIByChannelChart = () => {
      return {
          title: {
            text: "ROI by Acquisition Channel",
            left: "center",
            textStyle: {
              fontSize: 16,
              fontWeight: 600,
              color: EXECUTIVE_COLORS.gray[800]
            }
          },
          tooltip: {
            trigger: "axis",
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: EXECUTIVE_COLORS.gray[200],
            textStyle: { color: EXECUTIVE_COLORS.gray[700] }
          },
          xAxis: {
            type: "category",
            data: ["Email", "Events", "Social", "Ads", "Referrals"],
            axisLabel: { color: EXECUTIVE_COLORS.gray[600] },
            axisLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[300] } }
          },
          yAxis: {
            type: "value",
            axisLabel: {
              formatter: v => v + "%",
              color: EXECUTIVE_COLORS.gray[600]
            },
            splitLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[200] } }
          },
          series: [{
              type: "bar",
              data: [220, 180, 140, 90, 260],
              itemStyle: {
                color: EXECUTIVE_COLORS.primary,
                borderRadius: [4, 4, 0, 0]
              },
              barWidth: '50%'
          }]
      };
  };

  const getROIByJourneyStageChart = () => {
    return {
      title: {
        text: "ROI by Donor Journey Stage",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: EXECUTIVE_COLORS.gray[800]
        }
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: EXECUTIVE_COLORS.gray[200],
        textStyle: { color: EXECUTIVE_COLORS.gray[700] }
      },
      xAxis: {
        type: "category",
        data: [
          "Identification",
          "Qualification",
          "Cultivation",
          "Solicitation",
          "Stewardship"
        ],
        axisLabel: {
          color: EXECUTIVE_COLORS.gray[600],
          rotate: 15
        },
        axisLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[300] } }
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (v) => `${v}%`,
          color: EXECUTIVE_COLORS.gray[600]
        },
        splitLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[200] } }
      },
      series: [
        {
          type: "bar",
          data: [25, 45, 70, 85, 120],
          itemStyle: {
            color: EXECUTIVE_COLORS.secondary,
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: "50%"
        }
      ]
    };
  };

  const getROIByDonorStageChart = () => {
      return {
          title: {
            text: "ROI by Donor Journey Stage",
            left: "center",
            textStyle: {
              fontSize: 16,
              fontWeight: 600,
              color: EXECUTIVE_COLORS.gray[800]
            }
          },
          tooltip: {
            trigger: "axis",
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: EXECUTIVE_COLORS.gray[200],
            textStyle: { color: EXECUTIVE_COLORS.gray[700] }
          },
          xAxis: {
            type: "category",
            data: ["Identification", "Qualification", "Cultivation", "Solicitation", "Stewardship"],
            axisLabel: {
              color: EXECUTIVE_COLORS.gray[600],
              rotate: 15
            },
            axisLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[300] } }
          },
          yAxis: {
            type: "value",
            axisLabel: {
              formatter: v => v + "%",
              color: EXECUTIVE_COLORS.gray[600]
            },
            splitLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[200] } }
          },
          series: [{
              type: "line",
              smooth: true,
              data: [25, 45, 70, 85, 120],
              lineStyle: { color: EXECUTIVE_COLORS.accent, width: 3 },
              itemStyle: { color: EXECUTIVE_COLORS.accent },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(95, 224, 183, 0.4)' },
                    { offset: 1, color: 'rgba(95, 224, 183, 0.05)' }
                  ]
                }
              }
          }]
      };
  };


  // Chart configuration functions
  const getMonthlyRevenueTrendChart = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let displayData = [];
    let chartTitle = 'Revenue Trend';

    const ytdRevenue = dashboardData.executive?.key_metrics?.total_revenue_ytd || 3630000;
    const avgMonthly = ytdRevenue / (currentMonth + 1);

    switch (timePeriod) {
      case 'Monthly':
        chartTitle = 'Monthly Revenue (Last 12 Months)';
        months = [];
        displayData = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
          displayData.push(avgMonthly * (0.85 + Math.random() * 0.3));
        }
        break;
      case 'Quarterly':
        chartTitle = 'Quarterly Revenue';
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        months = quarters;
        displayData = [
          dashboardData.executive?.quarterly_revenue?.q1 || avgMonthly * 3,
          dashboardData.executive?.quarterly_revenue?.q2 || avgMonthly * 3,
          dashboardData.executive?.quarterly_revenue?.q3 || avgMonthly * 3,
          predictiveMetrics?.forecast?.forecast?.amount || avgMonthly * 3
        ];
        break;
      case 'YTD':
        chartTitle = `Year-to-Date Revenue (${currentYear})`;
        months = months.slice(0, currentMonth + 1);
        displayData = months.map((_, index) => {
          return avgMonthly * (0.85 + Math.random() * 0.3);
        });
        break;
      case 'Yearly':
        chartTitle = 'Yearly Revenue Comparison';
        months = [currentYear - 2, currentYear - 1, currentYear].map(y => y.toString());
        displayData = [
          ytdRevenue * 0.75,
          ytdRevenue * 0.88,
          ytdRevenue
        ];
        break;
    }

    return {
      title: {
        text: chartTitle,
        left: 'center',
        top: 5,
        textStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: EXECUTIVE_COLORS.gray[800]
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: EXECUTIVE_COLORS.gray[200],
        borderWidth: 1,
        textStyle: {
          color: EXECUTIVE_COLORS.gray[700],
          fontSize: 13
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
        formatter: (params) => {
          const value = timePeriod === 'Yearly' ?
            `$${(params[0].value / 1000000).toFixed(2)}M` :
            `$${(params[0].value / 1000).toFixed(0)}K`;
          return `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].name}</div>Revenue: ${value}`;
        }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '12%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisTick: { alignWithLabel: true },
        axisLabel: {
          fontSize: 11,
          rotate: months.length > 6 ? 30 : 0,
          color: EXECUTIVE_COLORS.gray[600]
        },
        axisLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[300] }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: value => `$${(value / 1000000).toFixed(1)}M`,
          fontSize: 11,
          color: EXECUTIVE_COLORS.gray[600]
        },
        splitLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[200] }
        },
        axisLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[300] }
        }
      },
      series: [
        {
          name: 'Revenue',
          type: timePeriod === 'Yearly' ? 'bar' : 'line',
          smooth: true,
          barWidth: '40%',
          lineStyle: timePeriod !== 'Yearly' ? {
            width: 4,
            color: EXECUTIVE_COLORS.primary,
            shadowColor: 'rgba(232, 117, 0, 0.3)',
            shadowBlur: 8,
            shadowOffsetY: 4
          } : undefined,
          itemStyle: {
            color: EXECUTIVE_COLORS.primary,
            borderRadius: timePeriod === 'Yearly' ? [6, 6, 0, 0] : 0,
            shadowColor: 'rgba(232, 117, 0, 0.3)',
            shadowBlur: 8,
            shadowOffsetY: 4
          },
          areaStyle: timePeriod !== 'Yearly' ? {
            opacity: 0.25,
            color: CHART_COLORS.gradient.orange
          } : undefined,
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 12,
              shadowOffsetY: 6
            }
          },
          data: displayData
        }
      ]
    };
  };

  const getDonorChurnChart = () => {
    const churnData = dashboardData.donorChurnTrend?.trend_data || [];

    const sampleData = churnData.length > 0 ? churnData :
      Array.from({ length: 12 }, (_, i) => ({
        date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
        new_donors: Math.floor(Math.random() * 20) + 10,
        lapsed_donors: Math.floor(Math.random() * 15) + 5,
        churn_ratio: Math.random() * 2 + 0.5
      })).reverse();

    return {
      title: {
        text: 'Donor Churn Analysis',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: EXECUTIVE_COLORS.gray[800]
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: EXECUTIVE_COLORS.gray[200],
        borderWidth: 1,
        textStyle: {
          color: EXECUTIVE_COLORS.gray[700],
          fontSize: 13
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
      },
      legend: {
        data: ['New Donors', 'Lapsed Donors', 'Churn Ratio'],
        top: 45,
        textStyle: {
          fontSize: 12,
          color: EXECUTIVE_COLORS.gray[700],
          fontWeight: '500'
        }
      },
      grid: {
        left: '12%',
        right: '12%',
        bottom: '15%',
        top: '22%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: sampleData.map(d => d.date),
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          interval: 0,
          color: EXECUTIVE_COLORS.gray[600]
        },
        axisLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[300] }
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Donors',
          position: 'left',
          nameLocation: 'middle',
          nameGap: 50,
          axisLabel: {
            fontSize: 11,
            color: EXECUTIVE_COLORS.gray[600]
          },
          nameTextStyle: {
            fontSize: 12,
            color: EXECUTIVE_COLORS.gray[700]
          },
          axisLine: { lineStyle: { color: EXECUTIVE_COLORS.secondary } },
          splitLine: {
            lineStyle: { color: EXECUTIVE_COLORS.gray[200] }
          }
        },
        {
          type: 'value',
          name: 'Ratio',
          position: 'right',
          axisLabel: {
            formatter: '{value}x',
            fontSize: 11,
            color: EXECUTIVE_COLORS.gray[600]
          },
          nameTextStyle: {
            fontSize: 12,
            color: EXECUTIVE_COLORS.gray[700]
          },
          axisLine: { lineStyle: { color: EXECUTIVE_COLORS.primary } },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'New Donors',
          type: 'bar',
          data: sampleData.map(d => d.new_donors),
          itemStyle: {
            color: EXECUTIVE_COLORS.accent,
            borderRadius: [4, 4, 0, 0],
            shadowColor: 'rgba(95, 224, 183, 0.3)',
            shadowBlur: 6,
            shadowOffsetY: 3
          }
        },
        {
          name: 'Lapsed Donors',
          type: 'bar',
          data: sampleData.map(d => d.lapsed_donors),
          itemStyle: {
            color: EXECUTIVE_COLORS.danger,
            borderRadius: [4, 4, 0, 0],
            shadowColor: 'rgba(239, 68, 68, 0.3)',
            shadowBlur: 6,
            shadowOffsetY: 3
          }
        },
        {
          name: 'Churn Ratio',
          type: 'line',
          yAxisIndex: 1,
          data: sampleData.map(d => d.churn_ratio),
          smooth: true,
          lineStyle: {
            width: 3,
            color: EXECUTIVE_COLORS.primary,
            shadowColor: 'rgba(232, 117, 0, 0.3)',
            shadowBlur: 6,
            shadowOffsetY: 3
          },
          itemStyle: {
            color: EXECUTIVE_COLORS.primary
          },
          areaStyle: {
            opacity: 0.15,
            color: CHART_COLORS.gradient.orange
          }
        }
      ]
    };
  };
  const getMajorDonorsChart = () => {
    const totalRevenue = dashboardData.executive?.key_metrics?.total_revenue_ytd || 3630000;
    const totalDonors = dashboardData.executive?.key_metrics?.total_donors || 100;

    const donorCategories = [
      {
        name: 'Major Donors ($100K+)',
        value: Math.round(totalRevenue * 0.35),
        count: Math.round(totalDonors * 0.02)
      },
      {
        name: 'Mid-Level ($10K-$100K)',
        value: Math.round(totalRevenue * 0.30),
        count: Math.round(totalDonors * 0.08)
      },
      {
        name: 'Regular ($1K-$10K)',
        value: Math.round(totalRevenue * 0.25),
        count: Math.round(totalDonors * 0.30)
      },
      {
        name: 'Small (<$1K)',
        value: Math.round(totalRevenue * 0.10),
        count: Math.round(totalDonors * 0.60)
      }
    ];

    return {
      title: {
        text: 'Donor Segmentation',
        subtext: 'Revenue Distribution by Donor Level',
        left: 'center',
        top: 5,
        textStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: EXECUTIVE_COLORS.gray[800]
        },
        subtextStyle: {
          fontSize: 13,
          color: EXECUTIVE_COLORS.gray[600]
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: EXECUTIVE_COLORS.gray[200],
        borderWidth: 1,
        textStyle: {
          color: EXECUTIVE_COLORS.gray[700],
          fontSize: 13
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
        formatter: (params) => {
          const category = donorCategories.find(c => c.name === params.name);
          return `<div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>Revenue: $${(params.value / 1000000).toFixed(2)}M (${params.percent}%)<br/>Donors: ${category.count}`;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        left: 'center',
        data: ['Major Donors ($100K+)', 'Mid-Level ($10K-$100K)', 'Regular ($1K-$10K)', 'Small (<$1K)'],
        textStyle: {
          fontSize: 12,
          color: EXECUTIVE_COLORS.gray[700],
          fontWeight: '500'
        },
        itemGap: 20,
        itemWidth: 14,
        itemHeight: 14
      },
      series: [
        {
          name: 'Revenue',
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 12,
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 10,
            shadowOffsetY: 4,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 24,
              fontWeight: 'bold',
              color: EXECUTIVE_COLORS.gray[900]
            },
            itemStyle: {
              shadowBlur: 16,
              shadowOffsetY: 6
            }
          },
          labelLine: {
            show: false
          },
          data: donorCategories.map((cat, index) => ({
            name: cat.name,
            value: cat.value,
            itemStyle: {
              color: [EXECUTIVE_COLORS.primary, EXECUTIVE_COLORS.secondary, EXECUTIVE_COLORS.accent, EXECUTIVE_COLORS.info][index],
              shadowColor: [`rgba(232, 117, 0, 0.3)`, `rgba(21, 71, 52, 0.3)`, `rgba(95, 224, 183, 0.3)`, `rgba(59, 130, 246, 0.3)`][index]
            }
          }))
        }
      ]
    };
  };





  const getCashflowChart = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let chartTitle = 'Cashflow Analysis';
    let currentYearData = [];
    let previousYearData = [];
    let xAxisData = [];

    const ytdRevenue = dashboardData.executive?.key_metrics?.total_revenue_ytd || 3630000;
    const avgMonthly = ytdRevenue / (currentMonth + 1);

    switch (timePeriod) {
      case 'Monthly':
        chartTitle = 'Monthly Cashflow (Last 6 Months)';
        xAxisData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          xAxisData.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
          currentYearData.push(avgMonthly * (0.85 + Math.random() * 0.3));
          previousYearData.push(avgMonthly * 0.85 * (0.85 + Math.random() * 0.3));
        }
        break;
      case 'Quarterly':
        chartTitle = `Quarterly Cashflow (${currentYear})`;
        xAxisData = ['Q1', 'Q2', 'Q3', 'Q4'];
        currentYearData = [
          avgMonthly * 3 * 0.9,
          avgMonthly * 3 * 1.05,
          avgMonthly * 3 * 1.1,
          predictiveMetrics?.forecast?.forecast?.amount || avgMonthly * 3 * 1.15
        ];
        previousYearData = currentYearData.map(v => v * 0.85);
        break;
      case 'YTD':
        chartTitle = `YTD Cashflow Comparison`;
        xAxisData = months.slice(0, currentMonth + 1);
        xAxisData.forEach((_, index) => {
          currentYearData.push(avgMonthly * (0.85 + Math.random() * 0.3));
          previousYearData.push(avgMonthly * 0.85 * (0.85 + Math.random() * 0.3));
        });
        break;
      case 'Yearly':
        chartTitle = `${selectedYear} Full Year Cashflow`;
        xAxisData = months;
        months.forEach((_, index) => {
          if (selectedYear === currentYear && index <= currentMonth) {
            currentYearData.push(avgMonthly * (0.85 + Math.random() * 0.3));
          } else if (selectedYear === currentYear) {
            currentYearData.push(avgMonthly * (0.9 + Math.random() * 0.2));
          } else {
            currentYearData.push(avgMonthly * 0.9 * (0.85 + Math.random() * 0.3));
          }
          previousYearData.push(currentYearData[index] * 0.85);
        });
        break;
    }

    return {
      title: {
        text: chartTitle,
        //subtext: timePeriod !== 'Yearly' ? `${currentYear - 1} vs ${currentYear}` : `${selectedYear - 1} vs ${selectedYear}`,
        left: 'center',
        top: 5,
        textStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: EXECUTIVE_COLORS.gray[800]
        },
        subtextStyle: {
          fontSize: 13,
          color: EXECUTIVE_COLORS.gray[600]
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: EXECUTIVE_COLORS.gray[200],
        borderWidth: 1,
        textStyle: {
          color: EXECUTIVE_COLORS.gray[700],
          fontSize: 13
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
        formatter: (params) => {
          let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].name}</div>`;
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: $${(param.value / 1000000).toFixed(2)}M<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: [currentYear.toString(), (currentYear - 1).toString()],
        top: 35,
        textStyle: {
          fontSize: 12,
          color: EXECUTIVE_COLORS.gray[700]
        },
        itemGap: 25
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '12%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisTick: { alignWithLabel: true },
        axisLabel: {
          fontSize: 11,
          rotate: xAxisData.length > 6 ? 30 : 0,
          color: EXECUTIVE_COLORS.gray[600]
        },
        axisLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[300] }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: value => `$${(value / 1000000).toFixed(1)}M`,
          fontSize: 11,
          color: EXECUTIVE_COLORS.gray[600]
        },
        splitLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[200] }
        },
        axisLine: {
          lineStyle: { color: EXECUTIVE_COLORS.gray[300] }
        }
      },
      series: [
        {
          name: currentYear.toString(),
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: EXECUTIVE_COLORS.primary,
            shadowColor: 'rgba(232, 117, 0, 0.3)',
            shadowBlur: 6,
            shadowOffsetY: 3
          },
          itemStyle: {
            color: EXECUTIVE_COLORS.primary
          },
          areaStyle: {
            opacity: 0.2,
            color: CHART_COLORS.gradient.orange
          },
          data: currentYearData
        },
        {
          name: (currentYear - 1).toString(),
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            type: 'dashed',
            color: EXECUTIVE_COLORS.secondary,
            shadowColor: 'rgba(21, 71, 52, 0.3)',
            shadowBlur: 6,
            shadowOffsetY: 3
          },
          itemStyle: {
            color: EXECUTIVE_COLORS.secondary
          },
          data: previousYearData
        }
      ]
    };
  };

  const getP2SGRadarChart = () => {
    const scores = calculateP2SGScores();

    return {
      title: {
        text: 'P2SG Health Framework',
        left: 'center',
        top: 5,
        textStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: EXECUTIVE_COLORS.gray[800]
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: EXECUTIVE_COLORS.gray[200],
        borderWidth: 1,
        textStyle: {
          color: EXECUTIVE_COLORS.gray[700],
          fontSize: 13
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
      },
      radar: {
        indicator: [
          { name: 'Vision & Mission', max: 100 },
          { name: 'Strategic Planning', max: 100 },
          { name: 'Sustained Investment', max: 100 },
          { name: 'Growth Momentum', max: 100 },
          { name: 'Donor Engagement', max: 100 },
          { name: 'Donor Experience', max: 100 },
          { name: 'Donor Retention', max: 100 },
          { name: 'Lifetime Value', max: 100 }
        ],
        shape: 'circle',
        splitNumber: 5,
        name: {
          textStyle: {
            color: EXECUTIVE_COLORS.gray[700],
            fontSize: 12,
            fontWeight: '500'
          }
        },
        splitLine: {
          lineStyle: {
            color: EXECUTIVE_COLORS.gray[300]
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              'rgba(255, 255, 255, 0.1)',
              'rgba(232, 117, 0, 0.05)',
              'rgba(232, 117, 0, 0.08)',
              'rgba(232, 117, 0, 0.11)',
              'rgba(232, 117, 0, 0.14)'
            ]
          }
        },
        axisLine: {
          lineStyle: {
            color: EXECUTIVE_COLORS.gray[300]
          }
        }
      },
      series: [{
        name: 'P2SG Framework',
        type: 'radar',
        data: [
          {
            value: [
              scores.vision_score,
              scores.strategy_score,
              scores.sustained_investment_score,
              scores.momentum_score,
              scores.donor_engagement_score,
              scores.donor_experience_score,
              scores.donor_retention_score,
              scores.lifetime_value_score
            ],
            name: 'Organization Performance',
            areaStyle: {
              opacity: 0.35,
              color: CHART_COLORS.gradient.orange
            },
            lineStyle: {
              color: EXECUTIVE_COLORS.primary,
              width: 3,
              shadowColor: 'rgba(232, 117, 0, 0.4)',
              shadowBlur: 8,
              shadowOffsetY: 4
            },
            itemStyle: {
              color: EXECUTIVE_COLORS.primary,
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(232, 117, 0, 0.4)',
              shadowBlur: 6,
              shadowOffsetY: 3
            }
          }
        ]
      }]
    };
  };

  // Loading state
  if (dashboardData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
        <div className="text-center">
          <div className="relative inline-block">
            <RefreshCw
              className="h-16 w-16 animate-spin"
              style={{ color: EXECUTIVE_COLORS.primary }}
            />
            <div className="absolute inset-0 rounded-full animate-ping" style={{
              background: `radial-gradient(circle, ${EXECUTIVE_COLORS.primary}40 0%, transparent 70%)`
            }} />
          </div>
          <p className="mt-6 text-xl font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
            Loading Executive Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardData.error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl border" style={{ borderColor: EXECUTIVE_COLORS.danger }}>
          <AlertCircle className="h-16 w-16 mx-auto mb-4" style={{ color: EXECUTIVE_COLORS.danger }} />
          <h2 className="text-2xl font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
            Unable to Load Dashboard
          </h2>
          <p className="text-base mb-6" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
            {dashboardData.error}
          </p>
          <button
            onClick={fetchAllDashboardData}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 hover:shadow-lg"
            style={{
              background: EXECUTIVE_COLORS.gradient.primary,
              boxShadow: '0 4px 12px rgba(232, 117, 0, 0.3)'
            }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const { executive, health, okrs } = dashboardData;
  const scores = calculateP2SGScores();
  const wiseInvestor = getWiseInvestor2x2();

  const quadrantDescriptions = {
    wise_investor: {
      name: 'Wise Investor',
      color: EXECUTIVE_COLORS.success,
      description: 'Exceptional performance with strong growth momentum and sustainable donor relationships. Organization is positioned for long-term impact and scalability.'
    },
    growth_focused: {
      name: 'Growth Focused',
      color: EXECUTIVE_COLORS.warning,
      description: 'Strong acquisition momentum but retention needs attention. Focus on strengthening donor relationships and lifetime value optimization.'
    },
    stable_traditional: {
      name: 'Stable Traditional',
      color: EXECUTIVE_COLORS.info,
      description: 'Solid retention foundation with opportunity for growth acceleration. Consider enhancing acquisition strategies and engagement innovation.'
    },
    needs_attention: {
      name: 'Needs Attention',
      color: EXECUTIVE_COLORS.danger,
      description: 'Both growth and retention require strategic focus. Prioritize donor experience enhancement and sustainable acquisition channels.'
    }
  };


  return (
    <div className="min-h-screen" style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
      {/* View Mode Toggle Header */}


      {/* Premium Header */}
      <div className="bg-white border-b shadow-sm" style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md"
              style={{
                background: 'white',
                border: `1px solid ${EXECUTIVE_COLORS.gray[300]}`,
                color: EXECUTIVE_COLORS.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${EXECUTIVE_COLORS.primary}10`;
                e.currentTarget.style.borderColor = EXECUTIVE_COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[300];
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back to Dashboard</span>
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{
                color: EXECUTIVE_COLORS.gray[900],
                letterSpacing: '-0.02em'
              }}>
                Executive Dashboard
              </h1>
              <p className="text-base" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                {executive?.organization_name || 'White-Lane'} - Comprehensive Performance Analysis
              </p>
              <div className="flex gap-4 mt-3">
                <div className="px-4 py-2 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.primary}15` }}>
                  <span className="font-semibold text-sm" style={{ color: EXECUTIVE_COLORS.primary }}>
                    V+S+SI+M = G4S2F
                  </span>
                  <span className="text-xs ml-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    (Vision + Strategy + Investment + Momentum)
                  </span>
                </div>
                <div className="px-4 py-2 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.accent}15` }}>
                  <span className="font-semibold text-sm" style={{ color: EXECUTIVE_COLORS.accent }}>
                    ↑DE + ↑DX → ↑DR → ↑LTV
                  </span>
                  <span className="text-xs ml-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    (Engagement + Experience → Retention → Value)
                  </span>
                </div>
              </div>
            </div>
             {/* ROI Button */}
            {/* ROI Analytics Jump Button */}


            <button
              onClick={fetchAllDashboardData}
              className="p-3 rounded-xl transition-all duration-200 hover:shadow-md"
              style={{
                background: 'white',
                border: `1px solid ${EXECUTIVE_COLORS.gray[300]}`,
                color: EXECUTIVE_COLORS.primary
              }}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm sticky top-[73px] z-40" style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="flex items-center gap-1 py-2">
            {subNavTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
                style={
                  activeTab === tab.id
                    ? {
                        background: `linear-gradient(135deg, ${EXECUTIVE_COLORS.primary}15, ${EXECUTIVE_COLORS.primary}08)`,
                        color: EXECUTIVE_COLORS.primary,
                        border: `1px solid ${EXECUTIVE_COLORS.primary}30`,
                      }
                    : {
                        color: EXECUTIVE_COLORS.gray[600],
                        border: '1px solid transparent',
                      }
                }
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8">

        {/* ============================================ */}
        {/* TAB 1: OVERVIEW */}
        {/* ============================================ */}
        {activeTab === 'overview' && (
        <div className="grid grid-cols-12 gap-8">

          {/* PREDICTIVE ANALYTICS ROW */}
          <div className="col-span-12 grid grid-cols-4 gap-6">
            {/* Q4 Revenue Forecast */}
            <div className="bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderTop: `4px solid ${EXECUTIVE_COLORS.info}`,
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    {predictiveMetrics?.forecast?.quarter || 'Q4'} Revenue Forecast
                  </p>
                  <p className="text-4xl font-bold mb-3" style={{
                    color: EXECUTIVE_COLORS.gray[900],
                    letterSpacing: '-0.02em'
                  }}>
                    ${((predictiveMetrics?.forecast?.forecast?.amount || 0) / 1000000).toFixed(1)}M
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>Confidence:</span>
                      <span className="text-sm font-semibold" style={{ color: EXECUTIVE_COLORS.info }}>
                        {predictiveMetrics?.forecast?.forecast?.confidence_score || 82}%
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      Progress: {predictiveMetrics?.forecast?.current_progress?.percent_complete || 36}%
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.info}15` }}>
                  <TrendingUp className="h-8 w-8" style={{ color: EXECUTIVE_COLORS.info }} />
                </div>
              </div>
            </div>

            {/* Donor Churn Risk */}
            <div className="bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderTop: `4px solid ${EXECUTIVE_COLORS.warning}`,
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Donor Churn Risk
                  </p>
                  <p className="text-4xl font-bold mb-3" style={{
                    color: EXECUTIVE_COLORS.gray[900],
                    letterSpacing: '-0.02em'
                  }}>
                    {predictiveMetrics?.churnRisk?.risk_metrics?.predicted_rate || 8.2}%
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      {predictiveMetrics?.churnRisk?.risk_metrics?.next_month_label || '6 donors'}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: EXECUTIVE_COLORS.warning }}>
                      ${((predictiveMetrics?.churnRisk?.financial_impact?.at_risk_value || 450000) / 1000).toFixed(0)}K at risk
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.warning}15` }}>
                  <AlertTriangle className="h-8 w-8" style={{ color: EXECUTIVE_COLORS.warning }} />
                </div>
              </div>
            </div>

            {/* Campaign Momentum */}
            <div className="bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderTop: `4px solid ${EXECUTIVE_COLORS.success}`,
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Campaign Momentum
                  </p>
                  <p className="text-4xl font-bold mb-3" style={{
                    color: EXECUTIVE_COLORS.gray[900],
                    letterSpacing: '-0.02em'
                  }}>
                    {predictiveMetrics?.momentum?.momentum?.revenue_change || '+24%'}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold" style={{ color: EXECUTIVE_COLORS.success }}>
                      {predictiveMetrics?.momentum?.momentum?.velocity || 'Accelerating'}
                    </p>
                    <p className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      vs 4-week average
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.success}15` }}>
                  <Zap className="h-8 w-8" style={{ color: EXECUTIVE_COLORS.success }} />
                </div>
              </div>
            </div>

            {/* Goal Attainment */}
            <div className="bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderTop: `4px solid #722ed1`,
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Goal Attainment
                  </p>
                  <p className="text-4xl font-bold mb-3" style={{
                    color: EXECUTIVE_COLORS.gray[900],
                    letterSpacing: '-0.02em'
                  }}>
                    {(predictiveMetrics?.goalAttainment?.current_status?.percent_complete || 36.3).toFixed(1)}%
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold" style={{ color: '#722ed1' }}>
                      Projected: {predictiveMetrics?.goalAttainment?.projection?.projected_attainment || 94}%
                    </p>
                    <p className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      Year-end projection
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(114, 46, 209, 0.15)' }}>
                  <Target className="h-8 w-8" style={{ color: '#722ed1' }} />
                </div>
              </div>
            </div>
          </div>

          {/* NEW: WISE INVESTOR 2×2 VISUAL QUADRANT */}
          <div className="col-span-12 grid grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl"
                 style={{
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                   border: `1px solid ${EXECUTIVE_COLORS.gray[200]}`
                 }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                Wise Investor 2×2 Quadrant
              </h3>
              <ReactECharts
                option={getWiseInvestor2x2Chart()}
                style={{ height: '320px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
              {/* Quadrant Legend */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(quadrantDescriptions).map(([key, desc]) => (
                  <div key={key}
                       className="flex items-center gap-2 p-2 rounded-lg"
                       style={{
                         background: `${desc.color}10`,
                         border: wiseInvestor.quadrant === key ? `2px solid ${desc.color}` : 'none'
                       }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: desc.color }} />
                    <span className="text-xs font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      {desc.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Performance Summary */}
            <div className="bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl"
                 style={{
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                   border: `1px solid ${EXECUTIVE_COLORS.gray[200]}`
                 }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                Key Performance Summary
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.primary}10` }}>
                  <p className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Total Revenue YTD</p>
                  <p className="text-2xl font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                    ${((executive?.key_metrics?.total_revenue_ytd || 0) / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.secondary}10` }}>
                  <p className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Active Donors</p>
                  <p className="text-2xl font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                    {(executive?.key_metrics?.active_donors || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: EXECUTIVE_COLORS.gray[50] }}>
                  <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Retention Rate</span>
                  <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.info }}>
                    {(executive?.key_metrics?.donor_retention_rate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: EXECUTIVE_COLORS.gray[50] }}>
                  <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Avg Gift Size</span>
                  <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.success }}>
                    ${(executive?.key_metrics?.avg_gift_size || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: EXECUTIVE_COLORS.gray[50] }}>
                  <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Total Donations</span>
                  <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.warning }}>
                    {(executive?.key_metrics?.total_donations || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Current Quadrant Status */}
              <div className="mt-4 p-4 rounded-xl"
                   style={{
                     background: `${quadrantDescriptions[wiseInvestor.quadrant]?.color}15`,
                     borderLeft: `4px solid ${quadrantDescriptions[wiseInvestor.quadrant]?.color}`
                   }}>
                <p className="text-sm font-semibold mb-1" style={{ color: quadrantDescriptions[wiseInvestor.quadrant]?.color }}>
                  {quadrantDescriptions[wiseInvestor.quadrant]?.name}
                </p>
                <p className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                  Growth: {wiseInvestor.growth.toFixed(1)}% | Sustainability: {wiseInvestor.sustainability.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* TIME PERIOD CONTROLS */}
          <div className="col-span-12">
            <div className="bg-white rounded-2xl p-5 border transition-all duration-300"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-base font-semibold" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                    View Period:
                  </span>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {['Monthly', 'Quarterly', 'YTD', 'Yearly'].map((period) => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                        style={{
                          background: timePeriod === period ? EXECUTIVE_COLORS.gradient.primary : 'transparent',
                          color: timePeriod === period ? '#fff' : EXECUTIVE_COLORS.gray[700],
                          boxShadow: timePeriod === period ? '0 2px 8px rgba(232, 117, 0, 0.25)' : 'none'
                        }}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {timePeriod === 'Yearly' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-2 border rounded-lg text-sm font-medium"
                      style={{
                        borderColor: EXECUTIVE_COLORS.gray[300],
                        color: EXECUTIVE_COLORS.gray[700]
                      }}
                    >
                      {[2023, 2024, 2025].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                  <Activity className="h-4 w-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PRIMARY CHARTS - 2x2 GRID */}
          <div className="col-span-12 grid grid-cols-2 gap-8">
            {/* Cashflow Comparison */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="h-96">
                <ReactECharts
                  option={getCashflowChart()}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </div>

            {/* Monthly Revenue Trend */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="h-96">
                <ReactECharts
                  option={getMonthlyRevenueTrendChart()}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </div>

            {/* Donor Churn Analysis */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="h-96">
                <ReactECharts
                  option={getDonorChurnChart()}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </div>

            {/* Major Donors Distribution */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="h-96">
                <ReactECharts
                  option={getMajorDonorsChart()}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </div>
          </div>

          {/* SECONDARY ANALYTICS ROW - 2 Charts */}
          <div className="col-span-12 grid grid-cols-2 gap-8 items-stretch">

            {/* DONOR ENGAGEMENT CONTINUUM - ENHANCED WITH PIPELINE, SLIDERS & FORECAST */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>

              {/* Header with Score */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                    Donor Engagement Continuum
                  </h3>
                  <p className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Investment levels across donor lifecycle (1-5 scale)
                  </p>
                </div>

                {/* Average Score */}
                {dashboardData.continuum?.summary && (
                  <div className="text-center px-4 py-3 rounded-xl"
                       style={{
                         background: `${EXECUTIVE_COLORS.primary}10`,
                         border: `1px solid ${EXECUTIVE_COLORS.primary}30`
                       }}>
                    <div className="text-3xl font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                      {dashboardData.continuum.summary.portfolio_health_score?.toFixed(1)}
                    </div>
                    <div className="text-xs font-medium" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Avg / 5.0
                    </div>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  VISUAL PIPELINE LAYOUT - Horizontal Flow Visualization
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="mb-6">
                <div className="text-sm font-semibold mb-3" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                  Donor Journey Pipeline
                </div>

                {/* Pipeline Flow Visualization */}
                <div className="relative">
                  {/* Connection Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2"
                       style={{ background: EXECUTIVE_COLORS.gray[200] }} />

                  {/* Pipeline Stages */}
                  <div className="relative flex justify-between items-center">
                    {dashboardData.continuum?.continuum?.map((item, idx) => {
                      const totalDonors = dashboardData.continuum?.summary?.total_donors || 1;
                      const percentage = ((item.donor_count / totalDonors) * 100).toFixed(0);
                      const barHeight = Math.max(30, (item.donor_count / totalDonors) * 150);

                      return (
                        <div key={idx} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                          {/* Stage Bar */}
                          <div
                            className="w-full max-w-16 rounded-t-lg mb-2 flex items-end justify-center transition-all duration-300 hover:scale-105"
                            style={{
                              height: `${barHeight}px`,
                              background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}90 100%)`,
                              boxShadow: `0 4px 12px ${item.color}40`
                            }}
                          >
                            <span className="text-white text-xs font-bold pb-1">
                              {percentage}%
                            </span>
                          </div>

                          {/* Stage Node */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center border-3 bg-white shadow-lg"
                            style={{
                              borderColor: item.color,
                              borderWidth: '3px'
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: item.color }}>
                              {item.investment_level}
                            </span>
                          </div>

                          {/* Stage Label */}
                          <div className="mt-2 text-center">
                            <div className="text-xs font-semibold truncate max-w-20"
                                 style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                              {item.phase?.split(' ')[0]}
                            </div>
                            <div className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                              {item.donor_count?.toLocaleString()}
                            </div>
                          </div>

                          {/* Arrow to next stage */}
                          {idx < (dashboardData.continuum?.continuum?.length || 0) - 1 && (
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-gray-300">
                              <ChevronRight className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  INVESTMENT SLIDERS - What-If Calculator
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="mb-6 p-4 rounded-xl" style={{ background: EXECUTIVE_COLORS.gray[50] }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Investment What-If Calculator
                    </div>
                    <div className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      Adjust investment levels to see projected impact
                    </div>
                  </div>
                  <Zap className="w-5 h-5" style={{ color: EXECUTIVE_COLORS.warning }} />
                </div>

                {/* Investment Sliders */}
                <div className="space-y-4">
                  {/* Acquisition Investment */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                        Acquisition Investment
                      </span>
                      <span className="text-sm font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                        +{goldenTriangleAdjustments.trafficIncrease || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={goldenTriangleAdjustments.trafficIncrease || 0}
                      onChange={(e) => setGoldenTriangleAdjustments(prev => ({
                        ...prev,
                        trafficIncrease: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${EXECUTIVE_COLORS.primary} 0%, ${EXECUTIVE_COLORS.primary} ${(goldenTriangleAdjustments.trafficIncrease || 0) * 2}%, ${EXECUTIVE_COLORS.gray[200]} ${(goldenTriangleAdjustments.trafficIncrease || 0) * 2}%, ${EXECUTIVE_COLORS.gray[200]} 100%)`
                      }}
                    />
                  </div>

                  {/* Retention Investment */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                        Retention Investment
                      </span>
                      <span className="text-sm font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                        +{goldenTriangleAdjustments.conversionIncrease || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={goldenTriangleAdjustments.conversionIncrease || 0}
                      onChange={(e) => setGoldenTriangleAdjustments(prev => ({
                        ...prev,
                        conversionIncrease: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${EXECUTIVE_COLORS.secondary} 0%, ${EXECUTIVE_COLORS.secondary} ${(goldenTriangleAdjustments.conversionIncrease || 0) * 2}%, ${EXECUTIVE_COLORS.gray[200]} ${(goldenTriangleAdjustments.conversionIncrease || 0) * 2}%, ${EXECUTIVE_COLORS.gray[200]} 100%)`
                      }}
                    />
                  </div>

                  {/* Upgrade Investment */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                        Upgrade Investment
                      </span>
                      <span className="text-sm font-bold" style={{ color: EXECUTIVE_COLORS.accent }}>
                        +{goldenTriangleAdjustments.avgGiftIncrease || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={goldenTriangleAdjustments.avgGiftIncrease || 0}
                      onChange={(e) => setGoldenTriangleAdjustments(prev => ({
                        ...prev,
                        avgGiftIncrease: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${EXECUTIVE_COLORS.accent} 0%, ${EXECUTIVE_COLORS.accent} ${(goldenTriangleAdjustments.avgGiftIncrease || 0) * 2}%, ${EXECUTIVE_COLORS.gray[200]} ${(goldenTriangleAdjustments.avgGiftIncrease || 0) * 2}%, ${EXECUTIVE_COLORS.gray[200]} 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Projected Impact Summary */}
                <div className="mt-4 pt-4 grid grid-cols-3 gap-3" style={{ borderTop: `1px solid ${EXECUTIVE_COLORS.gray[200]}` }}>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'white' }}>
                    <div className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.success }}>
                      +{((goldenTriangleAdjustments.trafficIncrease || 0) * 12).toLocaleString()}
                    </div>
                    <div className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>New Donors</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'white' }}>
                    <div className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.info }}>
                      +{((goldenTriangleAdjustments.conversionIncrease || 0) * 0.5).toFixed(1)}%
                    </div>
                    <div className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>Retention</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'white' }}>
                    <div className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                      +${(((goldenTriangleAdjustments.trafficIncrease || 0) + (goldenTriangleAdjustments.conversionIncrease || 0) + (goldenTriangleAdjustments.avgGiftIncrease || 0)) * 2500).toLocaleString()}
                    </div>
                    <div className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>Revenue</div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  MULTI-YEAR FORECAST IMPACT
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="mb-6">
                <div className="text-sm font-semibold mb-3" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                  Multi-Year Forecast Impact
                </div>

                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: 'axis',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: EXECUTIVE_COLORS.gray[200],
                      textStyle: { color: EXECUTIVE_COLORS.gray[700] },
                      formatter: (params) => {
                        let result = `<strong>${params[0].axisValue}</strong><br/>`;
                        params.forEach(param => {
                          result += `${param.marker} ${param.seriesName}: $${(param.value / 1000).toFixed(0)}K<br/>`;
                        });
                        return result;
                      }
                    },
                    legend: {
                      top: 0,
                      data: ['Current Trajectory', 'With Investment'],
                      textStyle: { fontSize: 10, color: EXECUTIVE_COLORS.gray[600] }
                    },
                    grid: {
                      left: '3%',
                      right: '4%',
                      bottom: '3%',
                      top: '15%',
                      containLabel: true
                    },
                    xAxis: {
                      type: 'category',
                      data: ['Year 1', 'Year 2', 'Year 3', 'Year 5', 'Year 10'],
                      axisLabel: { fontSize: 10, color: EXECUTIVE_COLORS.gray[600] },
                      axisLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[300] } }
                    },
                    yAxis: {
                      type: 'value',
                      axisLabel: {
                        fontSize: 9,
                        color: EXECUTIVE_COLORS.gray[500],
                        formatter: v => `$${(v / 1000000).toFixed(1)}M`
                      },
                      splitLine: { lineStyle: { color: EXECUTIVE_COLORS.gray[200], type: 'dashed' } }
                    },
                    series: [
                      {
                        name: 'Current Trajectory',
                        type: 'line',
                        smooth: true,
                        data: [
                          dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000,
                          (dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * 1.05,
                          (dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * 1.10,
                          (dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * 1.22,
                          (dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * 1.50
                        ],
                        lineStyle: { color: EXECUTIVE_COLORS.gray[400], width: 2, type: 'dashed' },
                        itemStyle: { color: EXECUTIVE_COLORS.gray[400] },
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(156, 163, 175, 0.2)' },
                              { offset: 1, color: 'rgba(156, 163, 175, 0.02)' }
                            ]
                          }
                        }
                      },
                      {
                        name: 'With Investment',
                        type: 'line',
                        smooth: true,
                        data: [
                          dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000,
                          (dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * (1.05 + ((goldenTriangleAdjustments.trafficIncrease || 0) + (goldenTriangleAdjustments.conversionIncrease || 0) + (goldenTriangleAdjustments.avgGiftIncrease || 0)) * 0.002),
                          (dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * (1.12 + ((goldenTriangleAdjustments.trafficIncrease || 0) + (goldenTriangleAdjustments.conversionIncrease || 0) + (goldenTriangleAdjustments.avgGiftIncrease || 0)) * 0.004),
                          (dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * (1.30 + ((goldenTriangleAdjustments.trafficIncrease || 0) + (goldenTriangleAdjustments.conversionIncrease || 0) + (goldenTriangleAdjustments.avgGiftIncrease || 0)) * 0.008),
                          (dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * (1.80 + ((goldenTriangleAdjustments.trafficIncrease || 0) + (goldenTriangleAdjustments.conversionIncrease || 0) + (goldenTriangleAdjustments.avgGiftIncrease || 0)) * 0.015)
                        ],
                        lineStyle: { color: EXECUTIVE_COLORS.primary, width: 3 },
                        itemStyle: { color: EXECUTIVE_COLORS.primary },
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(232, 117, 0, 0.3)' },
                              { offset: 1, color: 'rgba(232, 117, 0, 0.02)' }
                            ]
                          }
                        }
                      }
                    ]
                  }}
                  style={{ height: '200px', width: '100%' }}
                />

                {/* Forecast Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center p-3 rounded-lg" style={{ background: `${EXECUTIVE_COLORS.primary}08` }}>
                    <div className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>3-Year Impact</div>
                    <div className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                      +${((dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * ((goldenTriangleAdjustments.trafficIncrease || 0) + (goldenTriangleAdjustments.conversionIncrease || 0) + (goldenTriangleAdjustments.avgGiftIncrease || 0)) * 0.004 / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: `${EXECUTIVE_COLORS.secondary}08` }}>
                    <div className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>5-Year Impact</div>
                    <div className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                      +${((dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * ((goldenTriangleAdjustments.trafficIncrease || 0) + (goldenTriangleAdjustments.conversionIncrease || 0) + (goldenTriangleAdjustments.avgGiftIncrease || 0)) * 0.008 / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: `${EXECUTIVE_COLORS.accent}15` }}>
                    <div className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>10-Year Impact</div>
                    <div className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                      +${((dashboardData.executive?.key_metrics?.total_revenue_ytd || 3600000) * ((goldenTriangleAdjustments.trafficIncrease || 0) + (goldenTriangleAdjustments.conversionIncrease || 0) + (goldenTriangleAdjustments.avgGiftIncrease || 0)) * 0.015 / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase Cards - 2 column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {dashboardData.continuum?.continuum?.map((item, idx) => (
                  <div key={idx}
                       className="p-3 rounded-xl"
                       style={{
                         background: `${item.color}08`,
                         border: `1px solid ${item.color}20`
                       }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="font-semibold text-xs" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                          {item.phase}
                        </span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: item.color }}>
                        {item.donor_count?.toLocaleString()}
                      </span>
                    </div>

                    {/* Investment Level Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5 flex-1">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div
                            key={level}
                            className="h-4 rounded flex-1"
                            style={{
                              background: level <= item.investment_level
                                ? item.color
                                : EXECUTIVE_COLORS.gray[200],
                              opacity: level <= item.investment_level ? 1 : 0.3
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold" style={{ color: item.color }}>
                        {item.investment_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Portfolio Health Summary */}
              {dashboardData.continuum?.summary && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                     style={{
                       background: EXECUTIVE_COLORS.gray[50],
                       border: `1px solid ${EXECUTIVE_COLORS.gray[200]}`
                     }}>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1"
                         style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      Portfolio Health Assessment
                    </div>
                    <div className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      {dashboardData.continuum.summary.portfolio_health_interpretation}
                    </div>
                  </div>

                  {/* Visual Score */}
                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className="w-3 h-7 rounded-sm"
                          style={{
                            background: i <= Math.round(dashboardData.continuum.summary.portfolio_health_score)
                              ? EXECUTIVE_COLORS.primary
                              : EXECUTIVE_COLORS.gray[200]
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                      {dashboardData.continuum.summary.portfolio_health_score?.toFixed(1)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DONOR ENGAGEMENT LEVELS */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl flex flex-col"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                Donor Engagement Levels
              </h3>

              {/* Chart takes remaining space */}
              <div className="flex-1 min-h-[250px]">
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: 'axis',
                      axisPointer: { type: 'shadow' },
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderColor: EXECUTIVE_COLORS.gray[200],
                      borderWidth: 1,
                      textStyle: {
                        color: EXECUTIVE_COLORS.gray[700],
                        fontSize: 13
                      },
                      padding: [12, 16],
                      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
                      formatter: (params) => {
                        return `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].name}</div>${params[0].value} donors`;
                      }
                    },
                    grid: {
                      left: '3%',
                      right: '15%',
                      top: '5%',
                      bottom: '5%',
                      containLabel: true
                    },
                    xAxis: {
                      type: 'value',
                      axisLabel: {
                        color: EXECUTIVE_COLORS.gray[600],
                        fontSize: 11
                      },
                      splitLine: {
                        lineStyle: { color: EXECUTIVE_COLORS.gray[200] }
                      }
                    },
                    yAxis: {
                      type: 'category',
                      data: ['Sustaining', 'Major Donors', 'Engaged', 'Active', 'Total'],
                      axisLabel: {
                        color: EXECUTIVE_COLORS.gray[700],
                        fontSize: 11,
                        fontWeight: '500'
                      },
                      axisTick: { show: false },
                      axisLine: { show: false }
                    },
                    series: [
                      {
                        name: 'Donors',
                        type: 'bar',
                        barWidth: '55%',
                        label: {
                          show: true,
                          position: 'right',
                          formatter: '{c}',
                          color: EXECUTIVE_COLORS.gray[700],
                          fontSize: 12,
                          fontWeight: '600'
                        },
                        itemStyle: {
                          borderRadius: [0, 6, 6, 0]
                        },
                        data: [
                          {
                            value: Math.round((dashboardData.executive?.key_metrics?.active_donors || 78) * 0.15),
                            itemStyle: { color: '#154734' }
                          },
                          {
                            value: Math.round((dashboardData.executive?.key_metrics?.active_donors || 78) * 0.3),
                            itemStyle: { color: '#e87500' }
                          },
                          {
                            value: Math.round((dashboardData.executive?.key_metrics?.active_donors || 78) * 0.6),
                            itemStyle: { color: '#ffa64d' }
                          },
                          {
                            value: dashboardData.executive?.key_metrics?.active_donors || 78,
                            itemStyle: { color: '#5fe0b7' }
                          },
                          {
                            value: dashboardData.executive?.key_metrics?.total_donors || 100,
                            itemStyle: { color: '#4a90e2' }
                          }
                        ]
                      }
                    ]
                  }}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-xl text-center" style={{
                  background: `${EXECUTIVE_COLORS.danger}10`,
                  border: `1px solid ${EXECUTIVE_COLORS.danger}30`
                }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                     style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Churn Rate
                  </p>
                  <p className="text-xl font-bold" style={{ color: EXECUTIVE_COLORS.danger }}>
                    {dashboardData.lapsed?.lapsed_rate?.toFixed(1) || '0.0'}%
                  </p>
                </div>

                <div className="p-3 rounded-xl text-center" style={{
                  background: `${EXECUTIVE_COLORS.warning}10`,
                  border: `1px solid ${EXECUTIVE_COLORS.warning}30`
                }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                     style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    At Risk
                  </p>
                  <p className="text-xl font-bold" style={{ color: EXECUTIVE_COLORS.warning }}>
                    {dashboardData.donorChurnTrend?.trend_data?.[0]?.at_risk_donors || 0}
                  </p>
                </div>

                <div className="p-3 rounded-xl text-center" style={{
                  background: `${EXECUTIVE_COLORS.gray[100]}`,
                  border: `1px solid ${EXECUTIVE_COLORS.gray[300]}`
                }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                     style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Lapsed
                  </p>
                  <p className="text-xl font-bold" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                    {dashboardData.donorChurnTrend?.trend_data?.[0]?.lapsed_donors || 0}
                  </p>
                </div>
              </div>

              {/* Additional metrics to fill space */}
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${EXECUTIVE_COLORS.gray[200]}` }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ background: EXECUTIVE_COLORS.gray[50] }}>
                    <p className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      Engagement Rate
                    </p>
                    <p className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                      {((dashboardData.executive?.key_metrics?.active_donors / dashboardData.executive?.key_metrics?.total_donors) * 100 || 78).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: EXECUTIVE_COLORS.gray[50] }}>
                    <p className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      Active Donors
                    </p>
                    <p className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                      {dashboardData.executive?.key_metrics?.active_donors || 78}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* P2SG METRICS ROW */}
          <div className="col-span-12">

            {/* P2SG Framework Metrics */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <h3 className="text-2xl font-semibold mb-6" style={{
                color: EXECUTIVE_COLORS.gray[800],
                letterSpacing: '-0.01em'
              }}>
                P2SG Framework Scores
              </h3>

              <div className="space-y-5">
                {/* Vision Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Vision & Mission
                    </span>
                    <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                      {scores.vision_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${scores.vision_score}%`,
                        background: EXECUTIVE_COLORS.gradient.primary,
                        boxShadow: '0 2px 6px rgba(232, 117, 0, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Strategy Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Strategic Planning
                    </span>
                    <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                      {scores.strategy_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${scores.strategy_score}%`,
                        background: EXECUTIVE_COLORS.gradient.secondary,
                        boxShadow: '0 2px 6px rgba(21, 71, 52, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Sustained Investment Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Sustained Investment
                    </span>
                    <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                      {scores.sustained_investment_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${scores.sustained_investment_score}%`,
                        background: EXECUTIVE_COLORS.gradient.accent,
                        boxShadow: '0 2px 6px rgba(95, 224, 183, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Momentum Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Growth Momentum
                    </span>
                    <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                      {scores.momentum_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${scores.momentum_score}%`,
                        background: EXECUTIVE_COLORS.gradient.primary,
                        boxShadow: '0 2px 6px rgba(232, 117, 0, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Donor Engagement */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Donor Engagement
                    </span>
                    <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                      {scores.donor_engagement_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${scores.donor_engagement_score}%`,
                        background: EXECUTIVE_COLORS.gradient.accent,
                        boxShadow: '0 2px 6px rgba(95, 224, 183, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Donor Experience */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Donor Experience
                    </span>
                    <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                      {scores.donor_experience_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${scores.donor_experience_score}%`,
                        background: EXECUTIVE_COLORS.gradient.secondary,
                        boxShadow: '0 2px 6px rgba(21, 71, 52, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Donor Retention */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Donor Retention
                    </span>
                    <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                      {scores.donor_retention_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${scores.donor_retention_score}%`,
                        background: EXECUTIVE_COLORS.gradient.primary,
                        boxShadow: '0 2px 6px rgba(232, 117, 0, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Lifetime Value */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Lifetime Value
                    </span>
                    <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                      {scores.lifetime_value_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${scores.lifetime_value_score}%`,
                        background: EXECUTIVE_COLORS.gradient.accent,
                        boxShadow: '0 2px 6px rgba(95, 224, 183, 0.3)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Overall Score */}
              <div className="mt-6 pt-6 border-t" style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                    Overall P2SG Score
                  </span>
                  <span className="text-5xl font-bold" style={{
                    color: EXECUTIVE_COLORS.primary,
                    letterSpacing: '-0.02em'
                  }}>
                    {Math.round(
                      (scores.vision_score +
                       scores.strategy_score +
                       scores.sustained_investment_score +
                       scores.momentum_score) / 4
                    )}%
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* DONOR DISTRIBUTION ROW */}
          <div className="col-span-12">

            {/* Donor Distribution */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <h3 className="text-2xl font-semibold mb-6" style={{
                color: EXECUTIVE_COLORS.gray[800],
                letterSpacing: '-0.01em'
              }}>
                Donor Lifecycle Distribution
              </h3>

              <div className="h-72">
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: 'item',
                      formatter: '{b}: {c} ({d}%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderColor: EXECUTIVE_COLORS.gray[200],
                      borderWidth: 1,
                      textStyle: {
                        color: EXECUTIVE_COLORS.gray[700],
                        fontSize: 14,
                        fontWeight: '500'
                      },
                      padding: [12, 16],
                      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
                    },
                    legend: {
                      orient: 'horizontal',
                      bottom: '0%',
                      data: ['Active', 'At Risk', 'Lapsed', 'New'],
                      textStyle: {
                        fontSize: 13,
                        color: EXECUTIVE_COLORS.gray[700],
                        fontWeight: '500'
                      }
                    },
                    series: [{
                      type: 'pie',
                      radius: ['45%', '75%'],
                      center: ['50%', '45%'],
                      avoidLabelOverlap: false,
                      itemStyle: {
                        borderRadius: 12,
                        borderColor: '#fff',
                        borderWidth: 3,
                        shadowColor: 'rgba(0, 0, 0, 0.1)',
                        shadowBlur: 10,
                        shadowOffsetY: 4
                      },
                      label: {
                        show: false,
                        position: 'center'
                      },
                      emphasis: {
                        label: {
                          show: true,
                          fontSize: 28,
                          fontWeight: 'bold',
                          color: EXECUTIVE_COLORS.gray[900]
                        },
                        itemStyle: {
                          shadowBlur: 16,
                          shadowOffsetY: 6,
                          shadowColor: 'rgba(0, 0, 0, 0.2)'
                        }
                      },
                      labelLine: {
                        show: false
                      },
                      data: [
                        {
                          value: executive?.key_metrics?.active_donors || 78,
                          name: 'Active',
                          itemStyle: {
                            color: EXECUTIVE_COLORS.accent,
                            shadowColor: 'rgba(95, 224, 183, 0.3)'
                          }
                        },
                        {
                          value: executive?.key_metrics?.at_risk_donors || 54,
                          name: 'At Risk',
                          itemStyle: {
                            color: EXECUTIVE_COLORS.primary,
                            shadowColor: 'rgba(232, 117, 0, 0.3)'
                          }
                        },
                        {
                          value: dashboardData.lapsed?.lapsed_donors || 29,
                          name: 'Lapsed',
                          itemStyle: {
                            color: EXECUTIVE_COLORS.danger,
                            shadowColor: 'rgba(239, 68, 68, 0.3)'
                          }
                        },
                        {
                          value: dashboardData.donorChurnTrend?.trend_data?.[0]?.new_donors || 5,
                          name: 'New',
                          itemStyle: {
                            color: EXECUTIVE_COLORS.secondary,
                            shadowColor: 'rgba(21, 71, 52, 0.3)'
                          }
                        }
                      ]
                    }]
                  }}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>

              {/* Donor Metrics */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 rounded-xl" style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                  <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Retention Rate
                  </p>
                  <p className="text-2xl font-bold" style={{ color: EXECUTIVE_COLORS.accent }}>
                    {executive?.key_metrics?.donor_retention_rate?.toFixed(1) || 0}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                  <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Total Donors
                  </p>
                  <p className="text-2xl font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                    {executive?.key_metrics?.total_donors || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION TO DETAILED ANALYTICS */}
          <div className="col-span-12 mt-8">
            <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-2" style={{
                  color: EXECUTIVE_COLORS.gray[800],
                  letterSpacing: '-0.01em'
                }}>
                  Explore Detailed Analytics
                </h3>
                <p className="text-base" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                  Dive deeper into specific areas for comprehensive insights
                </p>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {/* Donor Analytics */}
                <button
                   onClick={() => window.location.href = '/analytics/donors'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.primary;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.primary}15` }}>
                      <Users2 className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.primary }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Donor Analytics
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Detailed donor behavior & segmentation
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.primary }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Campaign Performance */}
                <button
                   onClick={() => window.location.href = '/analytics/predictive_campaign'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.secondary;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.secondary}15` }}>
                      <BarChart3 className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.secondary }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Campaign Performance
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Track campaign ROI & effectiveness
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.secondary }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Program Impact Dashboard */}
                <button
                   onClick={() => window.location.href = '/analytics/program-impact'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.accent;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.accent}15` }}>
                      <Target className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.accent }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Program Impact
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Track program outcomes & beneficiary impact
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.accent }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Financial Health */}
                <button
                   onClick={() => window.location.href = '/analytics/finhealth'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.info;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.info}15` }}>
                      <Activity className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.info }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Financial Health
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Financial overview
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.info }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
        )}

        {/* ============================================ */}
        {/* TAB 2: FINANCIAL TRENDS */}
        {/* ============================================ */}
        {activeTab === 'financial-trends' && (
        <div className="grid grid-cols-12 gap-8">
            {/* ROI Analytics Section */}
            <div id="roi-analytics-section" className="col-span-12">
              <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                   style={{
                     borderColor: EXECUTIVE_COLORS.gray[200],
                     boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                   }}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.primary}15` }}>
                      <Percent className="h-7 w-7" style={{ color: EXECUTIVE_COLORS.primary }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{
                        color: EXECUTIVE_COLORS.gray[800],
                        letterSpacing: '-0.02em'
                      }}>
                        ROI Analytics
                      </h2>
                      <p className="text-sm mt-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                        Return on investment across channels and donor journey
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border"
                       style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      5yr / 10yr ROI Projection
                    </h3>
                    <ReactECharts option={getMultiYearROIProjectionChart()} style={{ height: 350 }} />
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border"
                       style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      Cumulative ROI
                    </h3>
                    <ReactECharts option={getCumulativeROIChart()} style={{ height: 350 }} />
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border"
                       style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      ROI by Acquisition Channel
                    </h3>
                    <ReactECharts option={getROIByChannelChart()} style={{ height: 350 }} />
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border"
                       style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      ROI by Donor Journey Stage
                    </h3>
                    <ReactECharts option={getROIByJourneyStageChart()} style={{ height: 350 }} />
                  </div>
                </div>
              </div>
            </div>

          {/* OKR, HEALTH, URGENT ACTIONS ROW */}
          <div className="col-span-12 grid grid-cols-3 gap-8">

            {/* OKR Progress */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <h3 className="text-xl font-semibold mb-6" style={{
                color: EXECUTIVE_COLORS.gray[800],
                letterSpacing: '-0.01em'
              }}>
                OKR Progress
              </h3>
              {okrs?.objectives?.slice(0, 2).map((obj, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <p className="text-base font-medium mb-3" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                    {obj.objective}
                  </p>
                  {obj.key_results?.slice(0, 1).map((kr, krIdx) => (
                    <div key={krIdx}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                          {kr.kr}
                        </span>
                        <span className="text-lg font-bold" style={{ color: EXECUTIVE_COLORS.gray[900] }}>
                          {kr.progress}%
                        </span>
                      </div>
                      <div className="w-full rounded-full h-3" style={{ background: EXECUTIVE_COLORS.gray[200] }}>
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(kr.progress, 100)}%`,
                            background: kr.status === 'exceeding' ?
                              EXECUTIVE_COLORS.gradient.accent :
                              EXECUTIVE_COLORS.gradient.primary,
                            boxShadow: kr.status === 'exceeding' ?
                              '0 2px 8px rgba(95, 224, 183, 0.4)' :
                              '0 2px 8px rgba(232, 117, 0, 0.4)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Health Score */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <h3 className="text-xl font-semibold mb-6" style={{
                color: EXECUTIVE_COLORS.gray[800],
                letterSpacing: '-0.01em'
              }}>
                Organization Health
              </h3>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold mb-3" style={{
                  color: health?.score >= 80 ? EXECUTIVE_COLORS.accent :
                         health?.score >= 60 ? EXECUTIVE_COLORS.primary : EXECUTIVE_COLORS.danger,
                  letterSpacing: '-0.03em'
                }}>
                  {health?.score || 0}/100
                </div>
                <div className="inline-block px-4 py-2 rounded-full text-base font-semibold" style={{
                  background: health?.score >= 80 ? `${EXECUTIVE_COLORS.accent}15` :
                             health?.score >= 60 ? `${EXECUTIVE_COLORS.primary}15` : `${EXECUTIVE_COLORS.danger}15`,
                  color: health?.score >= 80 ? EXECUTIVE_COLORS.accent :
                         health?.score >= 60 ? EXECUTIVE_COLORS.primary : EXECUTIVE_COLORS.danger
                }}>
                  {health?.status || 'Unknown'}
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(health?.components || {}).slice(0, 2).map(([key, comp]) => (
                  <div key={key} className="flex justify-between items-center p-3 rounded-xl"
                       style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                    <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      {comp.description}
                    </span>
                    <span className="text-base font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                      {comp.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent Actions */}
            <div className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <h3 className="text-xl font-semibold mb-6" style={{
                color: EXECUTIVE_COLORS.gray[800],
                letterSpacing: '-0.01em'
              }}>
                Urgent Actions
              </h3>
              <div className="space-y-4">
                {executive?.urgent_actions?.map((action, idx) => (
                  <div key={idx} className="flex items-start p-4 rounded-xl transition-all duration-200 hover:shadow-md"
                       style={{ background: `${EXECUTIVE_COLORS.primary}08` }}>
                    <div className="p-2 rounded-lg mr-3" style={{ background: `${EXECUTIVE_COLORS.primary}20` }}>
                      <AlertTriangle className="h-5 w-5" style={{ color: EXECUTIVE_COLORS.primary }} />
                    </div>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      {action}
                    </p>
                  </div>
                ))}
                {dashboardData.insights?.insights?.slice(0, 2).map((insight, idx) => (
                  <div key={idx} className="flex items-start p-4 rounded-xl transition-all duration-200 hover:shadow-md"
                       style={{ background: `${EXECUTIVE_COLORS.secondary}08` }}>
                    <div className="p-2 rounded-lg mr-3" style={{ background: `${EXECUTIVE_COLORS.secondary}20` }}>
                      <AlertCircle className="h-5 w-5" style={{ color: EXECUTIVE_COLORS.secondary }} />
                    </div>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      {insight.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Diversification */}
          <div className="col-span-12">
            <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <h3 className="text-2xl font-semibold mb-6" style={{
                color: EXECUTIVE_COLORS.gray[800],
                letterSpacing: '-0.01em'
              }}>
                Revenue Diversification
              </h3>
              {financialTrends.revenueDiversification ? (
                <div className="grid grid-cols-5 gap-4">
                  {(financialTrends.revenueDiversification.breakdown || []).map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl text-center"
                         style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                      <p className="text-sm font-medium mb-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                        {item.category}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                        {item.percentage?.toFixed(1)}%
                      </p>
                      <p className="text-sm mt-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                        ${(item.amount / 1000).toFixed(0)}K
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: EXECUTIVE_COLORS.gray[500] }}>Loading revenue diversification data...</p>
                </div>
              )}
            </div>
          </div>


          {/* Enhanced Multi-Year Trends Section */}
          <div className="col-span-12">
            <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              {/* Header with Controls */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold" style={{
                    color: EXECUTIVE_COLORS.gray[800],
                    letterSpacing: '-0.01em'
                  }}>
                    Multi-Year Trends Analysis
                  </h3>
                  <p className="text-sm mt-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                    Compare key metrics across multiple years
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Year selector */}
                  <div className="flex gap-2">
                    {[3, 5, 10].map(years => (
                      <button
                        key={years}
                        onClick={() => {
                          setEnhancedMultiYearData(prev => ({
                            ...prev,
                            selectedYears: years
                          }));
                          fetchEnhancedMultiYearTrends(enhancedMultiYearData.selectedMetric, years);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          enhancedMultiYearData.selectedYears === years
                            ? 'text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        style={{
                          backgroundColor: enhancedMultiYearData.selectedYears === years
                            ? EXECUTIVE_COLORS.primary
                            : 'transparent',
                          borderWidth: '1px',
                          borderColor: enhancedMultiYearData.selectedYears === years
                            ? EXECUTIVE_COLORS.primary
                            : EXECUTIVE_COLORS.gray[300]
                        }}
                      >
                        {years} Years
                      </button>
                    ))}
                  </div>

                  {/* Metric selector */}
                  <select
                    value={enhancedMultiYearData.selectedMetric}
                    onChange={(e) => {
                      const metric = e.target.value;
                      setEnhancedMultiYearData(prev => ({
                        ...prev,
                        selectedMetric: metric
                      }));
                      fetchEnhancedMultiYearTrends(metric, enhancedMultiYearData.selectedYears);
                    }}
                    className="px-4 py-2 rounded-lg border text-sm font-semibold bg-white"
                    style={{
                      borderColor: EXECUTIVE_COLORS.gray[300],
                      color: EXECUTIVE_COLORS.gray[700]
                    }}
                  >
                    {['revenue', 'donors', 'gifts', 'retention', 'new_donors', 'lapsed'].map(metric => (
                      <option key={metric} value={metric}>
                        {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chart and Stats */}
              {enhancedMultiYearData[enhancedMultiYearData.selectedMetric] ? (
                <>
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'axis',
                        backgroundColor: '#FFFFFF',
                        borderColor: EXECUTIVE_COLORS.gray[200],
                        borderWidth: 1,
                        padding: [10, 12],
                        textStyle: { color: EXECUTIVE_COLORS.gray[600], fontSize: 12 },
                        formatter: (params) => {
                          const data = params[0];
                          let formattedValue;
                          if (enhancedMultiYearData.selectedMetric === 'revenue') {
                            formattedValue = `$${(data.value / 1000000).toFixed(2)}M`;
                          } else if (enhancedMultiYearData.selectedMetric === 'retention') {
                            formattedValue = `${data.value}%`;
                          } else {
                            formattedValue = data.value.toLocaleString();
                          }
                          return `<div style="font-weight:600;margin-bottom:4px;color:${EXECUTIVE_COLORS.gray[800]}">${data.name}</div>
                                  <div style="color:${EXECUTIVE_COLORS.primary}">${enhancedMultiYearData.selectedMetric.replace('_', ' ')}: <strong>${formattedValue}</strong></div>`;
                        }
                      },
                      grid: {
                        left: '3%',
                        right: '4%',
                        top: '10%',
                        bottom: '10%',
                        containLabel: true
                      },
                      xAxis: {
                        type: 'category',
                        data: (enhancedMultiYearData[enhancedMultiYearData.selectedMetric].data || []).map(d => d.year).reverse(),
                        axisLabel: {
                          color: EXECUTIVE_COLORS.gray[600],
                          fontSize: 11
                        },
                        axisLine: {
                          lineStyle: { color: EXECUTIVE_COLORS.gray[300] }
                        },
                        axisTick: { show: false }
                      },
                      yAxis: {
                        type: 'value',
                        axisLabel: {
                          color: EXECUTIVE_COLORS.gray[600],
                          fontSize: 11,
                          formatter: (value) => {
                            if (enhancedMultiYearData.selectedMetric === 'revenue') {
                              return `$${(value / 1000000).toFixed(1)}M`;
                            } else if (enhancedMultiYearData.selectedMetric === 'retention') {
                              return `${value}%`;
                            }
                            return value.toLocaleString();
                          }
                        },
                        splitLine: {
                          lineStyle: {
                            color: EXECUTIVE_COLORS.gray[200],
                            type: 'dashed'
                          }
                        },
                        axisLine: { show: false }
                      },
                      series: [{
                        type: 'bar',
                        data: (enhancedMultiYearData[enhancedMultiYearData.selectedMetric].data || []).map(d => d.value).reverse(),
                        itemStyle: {
                          color: EXECUTIVE_COLORS.primary,
                          borderRadius: [6, 6, 0, 0]
                        },
                        barMaxWidth: 60,
                        emphasis: {
                          itemStyle: {
                            color: EXECUTIVE_COLORS.primary,
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowOffsetY: 0,
                            shadowColor: 'rgba(232, 117, 0, 0.3)'
                          }
                        },
                        markLine: {
                          data: [{ type: 'average', name: 'Average' }],
                          lineStyle: {
                            color: EXECUTIVE_COLORS.success,
                            type: 'dashed'
                          },
                          label: {
                            color: EXECUTIVE_COLORS.success,
                            fontSize: 10
                          }
                        }
                      }]
                    }}
                    style={{ height: 400 }}
                  />

                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="p-4 rounded-xl text-center"
                         style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                      <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                        {enhancedMultiYearData.selectedYears}-Year CAGR
                      </p>
                      <p className="text-2xl font-bold" style={{
                        color: enhancedMultiYearData[enhancedMultiYearData.selectedMetric].cagr > 0 ? EXECUTIVE_COLORS.success : EXECUTIVE_COLORS.danger
                      }}>
                        {enhancedMultiYearData[enhancedMultiYearData.selectedMetric].cagr > 0 ? '+' : ''}
                        {enhancedMultiYearData[enhancedMultiYearData.selectedMetric].cagr?.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 rounded-xl text-center"
                         style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                      <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                        Total Growth
                      </p>
                      <p className="text-2xl font-bold" style={{
                        color: enhancedMultiYearData[enhancedMultiYearData.selectedMetric].total_growth > 0 ? EXECUTIVE_COLORS.success : EXECUTIVE_COLORS.danger
                      }}>
                        {enhancedMultiYearData[enhancedMultiYearData.selectedMetric].total_growth > 0 ? '+' : ''}
                        {enhancedMultiYearData[enhancedMultiYearData.selectedMetric].total_growth?.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 rounded-xl text-center"
                         style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                      <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                        Latest Year
                      </p>
                      <p className="text-2xl font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                        {enhancedMultiYearData.selectedMetric === 'revenue'
                          ? `$${(enhancedMultiYearData[enhancedMultiYearData.selectedMetric].data?.[0]?.value / 1000000).toFixed(1)}M`
                          : enhancedMultiYearData.selectedMetric === 'retention'
                          ? `${enhancedMultiYearData[enhancedMultiYearData.selectedMetric].data?.[0]?.value}%`
                          : enhancedMultiYearData[enhancedMultiYearData.selectedMetric].data?.[0]?.value?.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl text-center"
                         style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                      <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                        Trend
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        {enhancedMultiYearData[enhancedMultiYearData.selectedMetric].cagr > 0 ? (
                          <TrendingUp className="h-5 w-5" style={{ color: EXECUTIVE_COLORS.success }} />
                        ) : (
                          <TrendingDown className="h-5 w-5" style={{ color: EXECUTIVE_COLORS.danger }} />
                        )}
                        <p className="text-lg font-semibold" style={{
                          color: enhancedMultiYearData[enhancedMultiYearData.selectedMetric].cagr > 0 ? EXECUTIVE_COLORS.success : EXECUTIVE_COLORS.danger
                        }}>
                          {enhancedMultiYearData[enhancedMultiYearData.selectedMetric].cagr > 0 ? 'Growing' : 'Declining'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                    Loading {enhancedMultiYearData.selectedMetric.replace(/_/g, ' ')} trends...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3-Year Cashflow Grid */}
          <div className="col-span-12">
            <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              {financialTrends.cashflowGrid?.grid_data ? (
                (() => {
                  const gridData = financialTrends.cashflowGrid.grid_data;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const currentMonth = new Date().getMonth();

                  // Get color for heatmap cell
                  const getHeatmapColor = (value, maxValue, minValue) => {
                    if (maxValue === minValue) return EXECUTIVE_COLORS.warning;
                    const normalized = (value - minValue) / (maxValue - minValue);
                    if (normalized >= 0.8) return '#059669';
                    if (normalized >= 0.6) return '#10b981';
                    if (normalized >= 0.4) return '#fbbf24';
                    if (normalized >= 0.2) return '#f97316';
                    return '#dc2626';
                  };

                  // Calculate ranges for each metric
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

                  const filteredMonths = gridViewMode === 'ytd' ? months.slice(0, currentMonth + 1) : months;

                  // Render a single metric grid
                  const renderMetricGrid = (metric, title, range, formatValue) => (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border mb-6"
                         style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                          {title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded" style={{ background: '#dc2626' }} />
                            <div className="w-3 h-3 rounded" style={{ background: '#f97316' }} />
                            <div className="w-3 h-3 rounded" style={{ background: '#fbbf24' }} />
                            <div className="w-3 h-3 rounded" style={{ background: '#10b981' }} />
                            <div className="w-3 h-3 rounded" style={{ background: '#059669' }} />
                          </div>
                          <span className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>Low → High</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-left py-2 px-2 text-xs font-semibold uppercase"
                                  style={{ color: EXECUTIVE_COLORS.gray[500] }}>Year</th>
                              {filteredMonths.map(month => (
                                <th key={month} className="text-center py-2 px-1 text-xs font-semibold uppercase"
                                    style={{ color: EXECUTIVE_COLORS.gray[500] }}>{month}</th>
                              ))}
                              <th className="text-right py-2 px-2 text-xs font-semibold uppercase"
                                  style={{ color: EXECUTIVE_COLORS.gray[500] }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gridData.map((yearData, yearIdx) => {
                              const filteredTotal = yearData.monthly
                                ?.slice(0, filteredMonths.length)
                                .reduce((sum, m) => sum + (m[metric] || 0), 0) || 0;

                              return (
                                <tr key={yearIdx} style={{ borderTop: `1px solid ${EXECUTIVE_COLORS.gray[100]}` }}>
                                  <td className="py-2 px-2 font-bold" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                                    {yearData.year}
                                  </td>
                                  {yearData.monthly?.slice(0, filteredMonths.length).map((month, monthIdx) => {
                                    const value = month[metric] || 0;
                                    const bgColor = getHeatmapColor(value, range.max, range.min);

                                    return (
                                      <td key={monthIdx} className="py-1 px-1">
                                        <div
                                          className="rounded-lg p-1.5 text-center transition-all hover:scale-105"
                                          style={{ background: bgColor, color: '#ffffff' }}
                                          title={`${months[monthIdx]} ${yearData.year}: ${formatValue(value)}`}
                                        >
                                          <p className="text-[10px] font-bold">{formatValue(value)}</p>
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td className="py-2 px-2 text-right">
                                    <p className="font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                                      {formatValue(filteredTotal)}
                                    </p>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );

                  return (
                    <>
                      {/* Header with controls */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-semibold" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                            3-Year Performance Grids
                          </h3>
                          <p className="text-sm mt-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                            Month-by-month breakdown with color-coded heatmaps
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[600] }}>View:</span>
                          <button
                            onClick={() => setGridViewMode('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              gridViewMode === 'all'
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            style={gridViewMode === 'all' ? { background: EXECUTIVE_COLORS.primary } : {}}
                          >
                            Full Year
                          </button>
                          <button
                            onClick={() => setGridViewMode('ytd')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              gridViewMode === 'ytd'
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            style={gridViewMode === 'ytd' ? { background: EXECUTIVE_COLORS.primary } : {}}
                          >
                            YTD ({months[currentMonth]})
                          </button>
                        </div>
                      </div>

                      {/* YoY Growth Summary */}
                      {financialTrends.cashflowGrid.yoy_growth && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="p-4 rounded-xl text-center" style={{
                            background: financialTrends.cashflowGrid.yoy_growth.revenue >= 0 ?
                              `${EXECUTIVE_COLORS.success}10` : `${EXECUTIVE_COLORS.danger}10`
                          }}>
                            <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Revenue YoY</p>
                            <p className={`text-2xl font-bold ${financialTrends.cashflowGrid.yoy_growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {financialTrends.cashflowGrid.yoy_growth.revenue >= 0 ? '+' : ''}{financialTrends.cashflowGrid.yoy_growth.revenue}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl text-center" style={{
                            background: financialTrends.cashflowGrid.yoy_growth.gifts >= 0 ?
                              `${EXECUTIVE_COLORS.success}10` : `${EXECUTIVE_COLORS.danger}10`
                          }}>
                            <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Gifts YoY</p>
                            <p className={`text-2xl font-bold ${financialTrends.cashflowGrid.yoy_growth.gifts >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {financialTrends.cashflowGrid.yoy_growth.gifts >= 0 ? '+' : ''}{financialTrends.cashflowGrid.yoy_growth.gifts}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl text-center" style={{
                            background: financialTrends.cashflowGrid.yoy_growth.donors >= 0 ?
                              `${EXECUTIVE_COLORS.success}10` : `${EXECUTIVE_COLORS.danger}10`
                          }}>
                            <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Donors YoY</p>
                            <p className={`text-2xl font-bold ${financialTrends.cashflowGrid.yoy_growth.donors >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {financialTrends.cashflowGrid.yoy_growth.donors >= 0 ? '+' : ''}{financialTrends.cashflowGrid.yoy_growth.donors}%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Revenue Grid */}
                      {renderMetricGrid(
                        'revenue',
                        '💰 Revenue by Month',
                        revenueRange,
                        (val) => val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${(val / 1000).toFixed(0)}K`
                      )}

                      {/* Gifts Grid */}
                      {renderMetricGrid(
                        'gifts',
                        '🎁 Number of Gifts by Month',
                        giftsRange,
                        (val) => val.toLocaleString()
                      )}

                      {/* Donors Grid */}
                      {renderMetricGrid(
                        'donors',
                        '👥 Unique Donors by Month',
                        donorsRange,
                        (val) => val.toLocaleString()
                      )}

                      {/* Year Summaries */}
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        {gridData.map((yearData, idx) => (
                          <div key={idx} className="p-5 rounded-xl border"
                               style={{
                                 borderColor: idx === gridData.length - 1 ? EXECUTIVE_COLORS.primary : EXECUTIVE_COLORS.gray[200],
                                 background: idx === gridData.length - 1 ? `${EXECUTIVE_COLORS.primary}08` : EXECUTIVE_COLORS.gradient.neutral
                               }}>
                            <h4 className="text-lg font-bold mb-4" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                              {yearData.year} Summary
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Revenue</span>
                                <span className="font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                                  ${((yearData.totals?.revenue || 0) / 1000000).toFixed(2)}M
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Gifts</span>
                                <span className="font-semibold" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                                  {(yearData.totals?.gifts || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Donors</span>
                                <span className="font-semibold" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                                  {(yearData.totals?.donors || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between pt-3 border-t" style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
                                <span className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>Avg Gift</span>
                                <span className="font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                                  ${yearData.totals?.gifts ? ((yearData.totals?.revenue || 0) / yearData.totals.gifts).toFixed(0) : '0'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-2xl font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                    3-Year Performance Grids
                  </h3>
                  <p style={{ color: EXECUTIVE_COLORS.gray[500] }}>Loading cashflow grid...</p>
                </div>
              )}
            </div>
          </div>

          {/* NAVIGATION TO DETAILED ANALYTICS */}
          <div className="col-span-12 mt-8">
            <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-2" style={{
                  color: EXECUTIVE_COLORS.gray[800],
                  letterSpacing: '-0.01em'
                }}>
                  Explore Detailed Analytics
                </h3>
                <p className="text-base" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                  Dive deeper into specific areas for comprehensive insights
                </p>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {/* Donor Analytics */}
                <button
                   onClick={() => window.location.href = '/analytics/donors'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.primary;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.primary}15` }}>
                      <Users2 className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.primary }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Donor Analytics
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Detailed donor behavior & segmentation
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.primary }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Campaign Performance */}
                <button
                   onClick={() => window.location.href = '/analytics/predictive_campaign'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.secondary;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.secondary}15` }}>
                      <BarChart3 className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.secondary }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Campaign Performance
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Track campaign ROI & effectiveness
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.secondary }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Program Impact Dashboard */}
                <button
                   onClick={() => window.location.href = '/analytics/program-impact'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.accent;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.accent}15` }}>
                      <Target className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.accent }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Program Impact
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Track program outcomes & beneficiary impact
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.accent }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Financial Health */}
                <button
                   onClick={() => window.location.href = '/analytics/finhealth'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.info;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.info}15` }}>
                      <Activity className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.info }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Financial Health
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Financial overview
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.info }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
        )}

        {/* ============================================ */}
        {/* TAB 3: STRATEGIC PLANNING */}
        {/* ============================================ */}
        {activeTab === 'strategic-planning' && (
        <div className="grid grid-cols-12 gap-8">

          {/* CEO Strategic Summary */}
          <div className="col-span-12">
            <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                 }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-xl" style={{ background: `${EXECUTIVE_COLORS.secondary}15` }}>
                  <Compass className="h-7 w-7" style={{ color: EXECUTIVE_COLORS.secondary }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                    CEO Strategic Summary
                  </h2>
                  <p className="text-sm" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                    Key insights and recommendations for executive decision-making
                  </p>
                </div>
              </div>

              {financialTrends.strategicSummary ? (
                <div className="grid grid-cols-2 gap-8">
                  {/* Strategic Gaps */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.danger }}>
                      <AlertTriangle className="h-5 w-5" />
                      Strategic Gaps
                    </h3>
                    {financialTrends.strategicSummary.strategic_gaps?.map((gap, idx) => (
                      <div key={idx} className="p-4 rounded-xl border" style={{
                        borderColor: gap.severity === 'high' ? EXECUTIVE_COLORS.danger : EXECUTIVE_COLORS.warning,
                        background: gap.severity === 'high' ? `${EXECUTIVE_COLORS.danger}08` : `${EXECUTIVE_COLORS.warning}08`
                      }}>
                        <p className="font-semibold mb-1" style={{ color: EXECUTIVE_COLORS.gray[800] }}>{gap.area}</p>
                        <p className="text-sm mb-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>{gap.description}</p>
                        <p className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>Impact: {gap.impact}</p>
                      </div>
                    ))}
                  </div>

                  {/* Strategic Opportunities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.success }}>
                      <Lightbulb className="h-5 w-5" />
                      Strategic Opportunities
                    </h3>
                    {financialTrends.strategicSummary.strategic_opportunities?.map((opp, idx) => (
                      <div key={idx} className="p-4 rounded-xl border" style={{
                        borderColor: EXECUTIVE_COLORS.success,
                        background: `${EXECUTIVE_COLORS.success}08`
                      }}>
                        <p className="font-semibold mb-1" style={{ color: EXECUTIVE_COLORS.gray[800] }}>{opp.area}</p>
                        <p className="text-sm mb-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>{opp.description}</p>
                        <p className="text-xs" style={{ color: EXECUTIVE_COLORS.success }}>Projected: {opp.projected_impact}</p>
                      </div>
                    ))}
                  </div>

                  {/* Investment Recommendations */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.info }}>
                      <DollarSign className="h-5 w-5" />
                      Investment Recommendations
                    </h3>
                    {financialTrends.strategicSummary.investment_recommendations?.slice(0, 4).map((rec, idx) => (
                      <div key={idx} className="p-4 rounded-xl border" style={{
                        borderColor: EXECUTIVE_COLORS.info,
                        background: `${EXECUTIVE_COLORS.info}08`
                      }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold" style={{ color: EXECUTIVE_COLORS.gray[800] }}>{rec.area}</p>
                          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{
                            background: rec.investment_level === 'high' ? `${EXECUTIVE_COLORS.danger}15` :
                                       rec.investment_level === 'medium' ? `${EXECUTIVE_COLORS.warning}15` : `${EXECUTIVE_COLORS.info}15`,
                            color: rec.investment_level === 'high' ? EXECUTIVE_COLORS.danger :
                                  rec.investment_level === 'medium' ? EXECUTIVE_COLORS.warning : EXECUTIVE_COLORS.info
                          }}>
                            {rec.investment_level} priority
                          </span>
                        </div>
                        <p className="text-sm mb-2" style={{ color: EXECUTIVE_COLORS.gray[600] }}>{rec.recommendation}</p>
                        <p className="text-xs" style={{ color: EXECUTIVE_COLORS.gray[500] }}>Expected ROI: {rec.expected_roi}</p>
                      </div>
                    ))}
                  </div>

                  {/* Momentum Score */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.primary }}>
                      <Activity className="h-5 w-5" />
                      Momentum vs Stagnation
                    </h3>
                    <div className="p-6 rounded-xl text-center" style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                      <p className="text-6xl font-bold mb-2" style={{
                        color: financialTrends.strategicSummary.momentum_analysis?.score >= 65 ? EXECUTIVE_COLORS.success :
                               financialTrends.strategicSummary.momentum_analysis?.score >= 45 ? EXECUTIVE_COLORS.warning : EXECUTIVE_COLORS.danger
                      }}>
                        {financialTrends.strategicSummary.momentum_analysis?.score || 0}
                      </p>
                      <p className="text-lg font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                        {financialTrends.strategicSummary.momentum_analysis?.status || 'Unknown'}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-left">
                        {Object.entries(financialTrends.strategicSummary.momentum_analysis?.factors || {}).map(([key, factor]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs capitalize" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-sm font-semibold ${factor.status === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                              {factor.value > 0 ? '+' : ''}{factor.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p style={{ color: EXECUTIVE_COLORS.gray[500] }}>Loading strategic summary...</p>
                </div>
              )}
            </div>
          </div>

          {/* GOLDEN TRIANGLE ANALYTICS */}
          <div className="col-span-12">
            <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <h3 className="text-2xl font-semibold mb-6" style={{
                color: EXECUTIVE_COLORS.gray[800],
                letterSpacing: '-0.01em'
              }}>
                Golden Triangle Revenue Lever
              </h3>

              {/* Main Layout: Triangle Visualization + What-If Calculator */}
              <div className="grid grid-cols-2 gap-8 mb-8">

                {/* Left: Triangle Visualization */}
                <div className="relative">
                  {/* SVG Triangle Diagram */}
                  <svg viewBox="0 0 400 350" className="w-full">
                    {/* Triangle Background */}
                    <polygon
                      points="200,30 380,320 20,320"
                      fill={`${EXECUTIVE_COLORS.primary}10`}
                      stroke={EXECUTIVE_COLORS.primary}
                      strokeWidth="3"
                    />

                    {/* Center Formula */}
                    <text x="200" y="200" textAnchor="middle" fontSize="14" fontWeight="600" fill={EXECUTIVE_COLORS.gray[700]}>
                      T × C × A = R
                    </text>
                    <text x="200" y="225" textAnchor="middle" fontSize="11" fill={EXECUTIVE_COLORS.gray[500]}>
                      Revenue Formula
                    </text>

                    {/* Traffic - Top vertex */}
                    <circle cx="200" cy="50" r="35" fill={EXECUTIVE_COLORS.primary} />
                    <text x="200" y="50" textAnchor="middle" fontSize="14" fontWeight="600" fill="white">Traffic</text>
                    <text x="200" y="68" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                      {(dashboardData.goldenTriangle?.current_metrics?.traffic || 1600).toLocaleString()}
                    </text>

                    {/* Conversion - Bottom left vertex */}
                    <circle cx="50" cy="308" r="35" fill={EXECUTIVE_COLORS.secondary} />
                    <text x="50" y="308" textAnchor="middle" fontSize="14" fontWeight="600" fill="white">Conv %</text>
                    <text x="50" y="330" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                      {(dashboardData.goldenTriangle?.current_metrics?.conversion_rate_pct || 2.0).toFixed(1)}%
                    </text>

                    {/* Avg Gift - Bottom right vertex */}
                    <circle cx="356" cy="308" r="35" fill={EXECUTIVE_COLORS.accent} />
                    <text x="350" y="308" textAnchor="middle" fontSize="14" fontWeight="600" fill="white">Avg Gift</text>
                    <text x="350" y="330" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                      ${((dashboardData.goldenTriangle?.current_metrics?.average_gift || 2900) / 1000).toFixed(1)}K
                    </text>
                  </svg>

                  {/* Current Revenue Display */}
                  <div className="text-center mt-4 p-4 rounded-xl" style={{ background: EXECUTIVE_COLORS.gradient.neutral }}>
                    <p className="text-sm font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Current Monthly Revenue
                    </p>
                    <p className="text-3xl font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                      ${((dashboardData.goldenTriangle?.current_metrics?.online_revenue || 92800) / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>

                {/* Right: What-If Calculator */}
                <div>
                  <div className="mb-4 p-3 rounded-lg" style={{ background: `${EXECUTIVE_COLORS.info}10` }}>
                    <p className="text-sm font-semibold" style={{ color: EXECUTIVE_COLORS.info }}>
                      💡 What-If Calculator
                    </p>
                    <p className="text-xs mt-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Adjust each lever to see projected revenue impact
                    </p>
                  </div>

                  {/* Traffic Slider */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                        Traffic Increase
                      </span>
                      <span className="text-sm font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                        +{goldenTriangleAdjustments.trafficIncrease}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goldenTriangleAdjustments.trafficIncrease}
                      onChange={(e) => setGoldenTriangleAdjustments(prev => ({
                        ...prev,
                        trafficIncrease: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${EXECUTIVE_COLORS.primary} 0%, ${EXECUTIVE_COLORS.primary} ${goldenTriangleAdjustments.trafficIncrease}%, ${EXECUTIVE_COLORS.gray[200]} ${goldenTriangleAdjustments.trafficIncrease}%, ${EXECUTIVE_COLORS.gray[200]} 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs mt-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Conversion Slider */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                        Conversion Rate Increase
                      </span>
                      <span className="text-sm font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                        +{goldenTriangleAdjustments.conversionIncrease}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goldenTriangleAdjustments.conversionIncrease}
                      onChange={(e) => setGoldenTriangleAdjustments(prev => ({
                        ...prev,
                        conversionIncrease: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${EXECUTIVE_COLORS.secondary} 0%, ${EXECUTIVE_COLORS.secondary} ${goldenTriangleAdjustments.conversionIncrease}%, ${EXECUTIVE_COLORS.gray[200]} ${goldenTriangleAdjustments.conversionIncrease}%, ${EXECUTIVE_COLORS.gray[200]} 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs mt-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Avg Gift Slider */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                        Average Gift Increase
                      </span>
                      <span className="text-sm font-bold" style={{ color: EXECUTIVE_COLORS.accent }}>
                        +{goldenTriangleAdjustments.avgGiftIncrease}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goldenTriangleAdjustments.avgGiftIncrease}
                      onChange={(e) => setGoldenTriangleAdjustments(prev => ({
                        ...prev,
                        avgGiftIncrease: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${EXECUTIVE_COLORS.accent} 0%, ${EXECUTIVE_COLORS.accent} ${goldenTriangleAdjustments.avgGiftIncrease}%, ${EXECUTIVE_COLORS.gray[200]} ${goldenTriangleAdjustments.avgGiftIncrease}%, ${EXECUTIVE_COLORS.gray[200]} 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs mt-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Projected Revenue */}
                  <div className="p-4 rounded-xl" style={{
                    background: EXECUTIVE_COLORS.gradient.primary,
                    boxShadow: '0 4px 12px rgba(232, 117, 0, 0.2)'
                  }}>
                    <p className="text-sm font-medium text-white mb-2">Projected Monthly Revenue</p>
                    <p className="text-3xl font-bold text-white">
                      ${(() => {
                        const baseRevenue = dashboardData.goldenTriangle?.current_metrics?.online_revenue || 92800;
                        const multiplier = (1 + goldenTriangleAdjustments.trafficIncrease/100) *
                                          (1 + goldenTriangleAdjustments.conversionIncrease/100) *
                                          (1 + goldenTriangleAdjustments.avgGiftIncrease/100);
                        return ((baseRevenue * multiplier) / 1000).toFixed(1);
                      })()}K
                    </p>
                    <p className="text-xs text-white mt-1" style={{ opacity: 0.8 }}>
                      {(() => {
                        const multiplier = (1 + goldenTriangleAdjustments.trafficIncrease/100) *
                                          (1 + goldenTriangleAdjustments.conversionIncrease/100) *
                                          (1 + goldenTriangleAdjustments.avgGiftIncrease/100);
                        const percentIncrease = ((multiplier - 1) * 100).toFixed(0);
                        return `+${percentIncrease}% increase from current`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-Year Projections */}
              <div className="border-t pt-6" style={{ borderColor: EXECUTIVE_COLORS.gray[200] }}>
                <h4 className="text-lg font-semibold mb-4" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                  Multi-Year Revenue Projections
                </h4>
                <p className="text-sm mb-4" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                  Based on your What-If adjustments compounded annually
                </p>

                <div className="grid grid-cols-4 gap-4">
                  {/* Current */}
                  <div className="p-4 rounded-xl text-center" style={{ background: EXECUTIVE_COLORS.gray[50] }}>
                    <p className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[500] }}>Current Annual</p>
                    <p className="text-xl font-bold" style={{ color: EXECUTIVE_COLORS.gray[700] }}>
                      ${((dashboardData.goldenTriangle?.current_metrics?.online_revenue || 92800) * 12 / 1000000).toFixed(2)}M
                    </p>
                  </div>

                  {/* 3-Year */}
                  <div className="p-4 rounded-xl text-center" style={{
                    background: `${EXECUTIVE_COLORS.primary}10`,
                    border: `1px solid ${EXECUTIVE_COLORS.primary}30`
                  }}>
                    <p className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>3-Year Projection</p>
                    <p className="text-xl font-bold" style={{ color: EXECUTIVE_COLORS.primary }}>
                      ${(() => {
                        const baseAnnual = (dashboardData.goldenTriangle?.current_metrics?.online_revenue || 92800) * 12;
                        const yearlyMultiplier = (1 + goldenTriangleAdjustments.trafficIncrease/100) *
                                                (1 + goldenTriangleAdjustments.conversionIncrease/100) *
                                                (1 + goldenTriangleAdjustments.avgGiftIncrease/100);
                        return (baseAnnual * Math.pow(yearlyMultiplier, 3) / 1000000).toFixed(2);
                      })()}M
                    </p>
                    <p className="text-xs mt-1" style={{ color: EXECUTIVE_COLORS.success }}>
                      {(() => {
                        const yearlyMultiplier = (1 + goldenTriangleAdjustments.trafficIncrease/100) *
                                                (1 + goldenTriangleAdjustments.conversionIncrease/100) *
                                                (1 + goldenTriangleAdjustments.avgGiftIncrease/100);
                        return `+${((Math.pow(yearlyMultiplier, 3) - 1) * 100).toFixed(0)}%`;
                      })()}
                    </p>
                  </div>

                  {/* 5-Year */}
                  <div className="p-4 rounded-xl text-center" style={{
                    background: `${EXECUTIVE_COLORS.secondary}10`,
                    border: `1px solid ${EXECUTIVE_COLORS.secondary}30`
                  }}>
                    <p className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>5-Year Projection</p>
                    <p className="text-xl font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                      ${(() => {
                        const baseAnnual = (dashboardData.goldenTriangle?.current_metrics?.online_revenue || 92800) * 12;
                        const yearlyMultiplier = (1 + goldenTriangleAdjustments.trafficIncrease/100) *
                                                (1 + goldenTriangleAdjustments.conversionIncrease/100) *
                                                (1 + goldenTriangleAdjustments.avgGiftIncrease/100);
                        return (baseAnnual * Math.pow(yearlyMultiplier, 5) / 1000000).toFixed(2);
                      })()}M
                    </p>
                    <p className="text-xs mt-1" style={{ color: EXECUTIVE_COLORS.success }}>
                      {(() => {
                        const yearlyMultiplier = (1 + goldenTriangleAdjustments.trafficIncrease/100) *
                                                (1 + goldenTriangleAdjustments.conversionIncrease/100) *
                                                (1 + goldenTriangleAdjustments.avgGiftIncrease/100);
                        return `+${((Math.pow(yearlyMultiplier, 5) - 1) * 100).toFixed(0)}%`;
                      })()}
                    </p>
                  </div>

                  {/* 10-Year */}
                  <div className="p-4 rounded-xl text-center" style={{
                    background: `${EXECUTIVE_COLORS.accent}15`,
                    border: `1px solid ${EXECUTIVE_COLORS.accent}50`
                  }}>
                    <p className="text-xs font-medium mb-1" style={{ color: EXECUTIVE_COLORS.gray[600] }}>10-Year Projection</p>
                    <p className="text-xl font-bold" style={{ color: EXECUTIVE_COLORS.secondary }}>
                      ${(() => {
                        const baseAnnual = (dashboardData.goldenTriangle?.current_metrics?.online_revenue || 92800) * 12;
                        const yearlyMultiplier = (1 + goldenTriangleAdjustments.trafficIncrease/100) *
                                                (1 + goldenTriangleAdjustments.conversionIncrease/100) *
                                                (1 + goldenTriangleAdjustments.avgGiftIncrease/100);
                        return (baseAnnual * Math.pow(yearlyMultiplier, 10) / 1000000).toFixed(2);
                      })()}M
                    </p>
                    <p className="text-xs mt-1" style={{ color: EXECUTIVE_COLORS.success }}>
                      {(() => {
                        const yearlyMultiplier = (1 + goldenTriangleAdjustments.trafficIncrease/100) *
                                                (1 + goldenTriangleAdjustments.conversionIncrease/100) *
                                                (1 + goldenTriangleAdjustments.avgGiftIncrease/100);
                        return `+${((Math.pow(yearlyMultiplier, 10) - 1) * 100).toFixed(0)}%`;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setGoldenTriangleAdjustments({
                      trafficIncrease: 0,
                      conversionIncrease: 0,
                      avgGiftIncrease: 0
                    })}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                    style={{
                      background: EXECUTIVE_COLORS.gray[100],
                      color: EXECUTIVE_COLORS.gray[700],
                      border: `1px solid ${EXECUTIVE_COLORS.gray[300]}`
                    }}
                  >
                    Reset Calculator
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION TO DETAILED ANALYTICS */}
          <div className="col-span-12 mt-8">
            <div className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl"
                 style={{
                   borderColor: EXECUTIVE_COLORS.gray[200],
                   boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                 }}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-2" style={{
                  color: EXECUTIVE_COLORS.gray[800],
                  letterSpacing: '-0.01em'
                }}>
                  Explore Detailed Analytics
                </h3>
                <p className="text-base" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                  Dive deeper into specific areas for comprehensive insights
                </p>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {/* Donor Analytics */}
                <button
                   onClick={() => window.location.href = '/analytics/donors'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.primary;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.primary}15` }}>
                      <Users2 className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.primary }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Donor Analytics
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Detailed donor behavior & segmentation
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.primary }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Campaign Performance */}
                <button
                   onClick={() => window.location.href = '/analytics/predictive_campaign'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.secondary;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.secondary}15` }}>
                      <BarChart3 className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.secondary }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Campaign Performance
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Track campaign ROI & effectiveness
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.secondary }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Program Impact Dashboard */}
                <button
                   onClick={() => window.location.href = '/analytics/program-impact'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.accent;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.accent}15` }}>
                      <Target className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.accent }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Program Impact
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Track program outcomes & beneficiary impact
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.accent }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Engagement Insights */}
                <button
                   onClick={() => window.location.href = '/analytics/finhealth'}
                   className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                   style={{
                     background: EXECUTIVE_COLORS.gradient.neutral,
                     border: `2px solid ${EXECUTIVE_COLORS.gray[200]}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.info;
                     e.currentTarget.style.transform = 'translateY(-4px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = EXECUTIVE_COLORS.gray[200];
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl mb-4"
                         style={{ background: `${EXECUTIVE_COLORS.info}15` }}>
                      <Activity className="h-10 w-10" style={{ color: EXECUTIVE_COLORS.info }} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: EXECUTIVE_COLORS.gray[800] }}>
                      Financial Health
                    </h4>
                    <p className="text-sm mb-3" style={{ color: EXECUTIVE_COLORS.gray[600] }}>
                      Financial overview
                    </p>
                    <div className="flex items-center gap-2" style={{ color: EXECUTIVE_COLORS.info }}>
                      <span className="text-sm font-semibold">View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
        )}

      </div>

    </div>

  );
};

export default CompletePremiumExecutiveDashboard;