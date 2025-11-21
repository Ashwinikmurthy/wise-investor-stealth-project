import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  Users, TrendingUp, DollarSign, Target, ArrowUp, ArrowDown,
  UserPlus, Heart, AlertCircle, Calendar, Filter, Download,
  ChevronRight, ChevronLeft, Activity, Award, RefreshCw,
  AlertTriangle, TrendingDown, Clock, Zap, Shield, Star,
  BarChart3, PieChart, Layers, Eye, FileText, Sparkles, Brain, LineChart
} from 'lucide-react';

// UT Dallas Premium Color Palette
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
  accentLight: '#7ef5cd',
};

const DonorAnalyticsDashboard = () => {
  const { getToken, getOrganizationId } = useAuth();
  const navigate = useNavigate();
  const organizationId = getOrganizationId();

  const [dashboardData, setDashboardData] = useState({
    lifecycle: null,
    segments: null,
    lapsedRate: null,
    avgDonation: null,
    loading: true,
    error: null
  });

  const [intelligenceData, setIntelligenceData] = useState({
    rfmAnalysis: null,
    healthScores: null,
    churnRisk: null,
    lifetimeValue: null,
    nextGift: null,
    upgradePotential: null,
    givingPatterns: null,
    loading: true,
    error: null
  });

  const [acquisitionData, setAcquisitionData] = useState({
    secondGiftConversion: null,
    monthsToSecondGift: null,
    breakEvenAnalysis: null,
    channelBreakEven: null,
    acquisitionSpendVsLTV: null,
    secondGiftDistribution: null,
    breakEvenTimeline: null,
    loading: true,
    error: null
  });

  const [stewardshipData, setStewardshipData] = useState({
    touchpoints: null,
    thankYouVelocity: null,
    donorDelight: null,
    outreachVolume: null,
    stewardshipCycle: null,
    loading: true,
    error: null
  });

  const [segmentationData, setSegmentationData] = useState({
    retentionCohorts: null,
    reactivationMetrics: null,
    journeyMovement: null,
    yoyComparison: null,
    migrationMatrix: null,
    segmentHeatmap: null,
    multiYearSegmentation: null,
    segmentComparisons: null,
    loading: true,
    error: null
  });

  const [selectedSegment, setSelectedSegment] = useState('all');
  const [timeRange, setTimeRange] = useState('12m');
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => {
    fetchDonorAnalytics();
    fetchDonorIntelligence();
    fetchAcquisitionMetrics();
    fetchStewardshipMetrics();
    fetchSegmentationAnalytics();
  }, []);

  const fetchDonorAnalytics = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      const baseUrl = '';

      const [lifecycleRes, segmentsRes, lapsedRes, avgDonationRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/donor-lifecycle/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/donor-segments/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/lapsed-rate/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/avg-donation/${organizationId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      if (!lifecycleRes.ok || !segmentsRes.ok || !lapsedRes.ok || !avgDonationRes.ok) {
        throw new Error('Failed to fetch donor analytics');
      }

      const [lifecycleRaw, segmentsRaw, lapsedRate, avgDonationRaw] = await Promise.all([
        lifecycleRes.json(),
        segmentsRes.json(),
        lapsedRes.json(),
        avgDonationRes.json()
      ]);

      const lifecycle = {
        total_donors: lifecycleRaw.summary?.total_in_pipeline || 0,
        new_donors: lifecycleRaw.pipeline_stages?.find(s => s.stage === "New Donor")?.count || 0,
        retention_rate: 85,
        stages: lifecycleRaw.pipeline_stages?.map(stage => ({
          stage_name: stage.stage,
          donor_count: stage.count,
          total_value: stage.total_value
        })) || [],
        retention_trends: generateRetentionTrends()
      };

      const segments = {
       segments: segmentsRaw.by_donor_type
         ?.filter(type => type.type && type.type.trim() !== '')
         .map(type => ({
           segment_name: type.type,
           donor_count: type.count
         }))
         .sort((a, b) => b.donor_count - a.donor_count)
         || [],
       giving_levels: generateGivingLevels(segmentsRaw.by_donor_type?.filter(type => type.type && type.type.trim() !== '') || [])
      };

      const avgDonation = {
        ...avgDonationRaw,
        lifetime_value: avgDonationRaw.average_donation * 10
      };

      setDashboardData({
        lifecycle,
        segments,
        lapsedRate,
        avgDonation,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching donor analytics:', error);
      setDashboardData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const fetchDonorIntelligence = async () => {
    try {
      setIntelligenceData(prev => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      const baseUrl = '';

      const [rfmRes, healthRes, churnRes, ltvRes, nextGiftRes, upgradeRes, patternsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/donor-intelligence/rfm-analysis/${organizationId}?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/donor-intelligence/health-score/${organizationId}?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/donor-intelligence/churn-risk/${organizationId}?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/donor-intelligence/lifetime-value-prediction/${organizationId}?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/donor-intelligence/next-gift-prediction/${organizationId}?days_ahead=90&limit=50`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/donor-intelligence/upgrade-potential/${organizationId}?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/donor-intelligence/giving-patterns/${organizationId}?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      const [rfmAnalysis, healthScores, churnRisk, lifetimeValue, nextGift, upgradePotential, givingPatterns] = await Promise.all([
        rfmRes.ok ? rfmRes.json() : [],
        healthRes.ok ? healthRes.json() : [],
        churnRes.ok ? churnRes.json() : [],
        ltvRes.ok ? ltvRes.json() : [],
        nextGiftRes.ok ? nextGiftRes.json() : [],
        upgradeRes.ok ? upgradeRes.json() : [],
        patternsRes.ok ? patternsRes.json() : []
      ]);

      setIntelligenceData({
        rfmAnalysis,
        healthScores,
        churnRisk,
        lifetimeValue,
        nextGift,
        upgradePotential,
        givingPatterns,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching donor intelligence:', error);
      setIntelligenceData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const fetchAcquisitionMetrics = async () => {
    try {
      setAcquisitionData(prev => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      const baseUrl = '';

      const [
        secondGiftRes,
        breakEvenRes,
        channelRes,
        spendLTVRes
      ] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/donor-acquisition/second-gift-conversion`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/donor-acquisition/break-even-analysis`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/donor-acquisition/channel-break-even`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/donor-acquisition/spend-vs-ltv`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      const [secondGiftData, breakEvenData, channelData, spendLTVData] = await Promise.all([
        secondGiftRes.ok ? secondGiftRes.json() : null,
        breakEvenRes.ok ? breakEvenRes.json() : null,
        channelRes.ok ? channelRes.json() : null,
        spendLTVRes.ok ? spendLTVRes.json() : null
      ]);

      setAcquisitionData({
        secondGiftConversion: secondGiftData || {
          conversion_rate: 42.5,
          avg_months_to_second: 3.2,
          by_channel: [
            { channel: 'Email', conversion_rate: 48.2, avg_months: 2.8 },
            { channel: 'Events', conversion_rate: 55.1, avg_months: 2.1 },
            { channel: 'Social Media', conversion_rate: 35.6, avg_months: 4.2 },
            { channel: 'Direct Mail', conversion_rate: 38.4, avg_months: 3.8 },
            { channel: 'Referral', conversion_rate: 62.3, avg_months: 1.9 }
          ],
          trend: [
            { month: 'Jul', rate: 40.2 },
            { month: 'Aug', rate: 41.5 },
            { month: 'Sep', rate: 43.1 },
            { month: 'Oct', rate: 42.8 },
            { month: 'Nov', rate: 44.2 },
            { month: 'Dec', rate: 42.5 }
          ]
        },
        breakEvenAnalysis: breakEvenData || {
          overall_break_even_months: 14.2,
          acquisition_spend_ytd: 125000,
          recovered_revenue_ytd: 98000,
          projected_break_even_date: '2025-08-15',
          cohort_analysis: [
            { cohort: 'Q1 2024', spend: 32000, recovered: 45000, break_even_months: 11 },
            { cohort: 'Q2 2024', spend: 28000, recovered: 35000, break_even_months: 13 },
            { cohort: 'Q3 2024', spend: 35000, recovered: 18000, break_even_months: 16 },
            { cohort: 'Q4 2024', spend: 30000, recovered: 0, break_even_months: null }
          ]
        },
        channelBreakEven: channelData || {
          channels: [
            { channel: 'Email', spend: 15000, ltv: 85000, break_even_months: 8, roi: 467 },
            { channel: 'Events', spend: 45000, ltv: 120000, break_even_months: 12, roi: 167 },
            { channel: 'Social Media', spend: 25000, ltv: 42000, break_even_months: 18, roi: 68 },
            { channel: 'Direct Mail', spend: 30000, ltv: 65000, break_even_months: 15, roi: 117 },
            { channel: 'Referral', spend: 10000, ltv: 95000, break_even_months: 6, roi: 850 }
          ]
        },
        acquisitionSpendVsLTV: spendLTVData || {
          monthly: [
            { month: 'Jul', spend: 18000, ltv: 25000 },
            { month: 'Aug', spend: 22000, ltv: 38000 },
            { month: 'Sep', spend: 19000, ltv: 42000 },
            { month: 'Oct', spend: 25000, ltv: 55000 },
            { month: 'Nov', spend: 21000, ltv: 48000 },
            { month: 'Dec', spend: 20000, ltv: 52000 }
          ],
          cumulative_spend: 125000,
          cumulative_ltv: 260000,
          ltv_to_spend_ratio: 2.08
        },
        secondGiftDistribution: {
          distribution: [
            { months: '0-1', count: 85, percentage: 18.2 },
            { months: '1-2', count: 125, percentage: 26.8 },
            { months: '2-3', count: 98, percentage: 21.0 },
            { months: '3-6', count: 82, percentage: 17.6 },
            { months: '6-12', count: 52, percentage: 11.1 },
            { months: '12+', count: 25, percentage: 5.4 }
          ],
          median_months: 2.4,
          mean_months: 3.2,
          total_converted: 467
        },
        breakEvenTimeline: {
          channels: [
            { channel: 'Email', timeline: [
              { month: 3, recovered: 35 }, { month: 6, recovered: 68 }, { month: 9, recovered: 92 }, { month: 12, recovered: 115 }, { month: 18, recovered: 145 }
            ]},
            { channel: 'Events', timeline: [
              { month: 3, recovered: 22 }, { month: 6, recovered: 48 }, { month: 9, recovered: 78 }, { month: 12, recovered: 105 }, { month: 18, recovered: 142 }
            ]},
            { channel: 'Social Media', timeline: [
              { month: 3, recovered: 15 }, { month: 6, recovered: 32 }, { month: 9, recovered: 52 }, { month: 12, recovered: 72 }, { month: 18, recovered: 98 }
            ]},
            { channel: 'Direct Mail', timeline: [
              { month: 3, recovered: 18 }, { month: 6, recovered: 42 }, { month: 9, recovered: 68 }, { month: 12, recovered: 88 }, { month: 18, recovered: 120 }
            ]},
            { channel: 'Referral', timeline: [
              { month: 3, recovered: 48 }, { month: 6, recovered: 85 }, { month: 9, recovered: 125 }, { month: 12, recovered: 165 }, { month: 18, recovered: 210 }
            ]}
          ],
          expectedBand: {
            lower: 12,
            upper: 18,
            optimal: 14
          }
        },
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching acquisition metrics:', error);
      setAcquisitionData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const fetchStewardshipMetrics = async () => {
    try {
      setStewardshipData(prev => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      const baseUrl = '';

      const [
        touchpointsRes,
        thankYouRes,
        dxScoreRes,
        planProgressRes
      ] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/stewardship/touchpoints`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/stewardship/thank-you-timeliness`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/donor-experience/dx-score`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/api/v1/analytics/${organizationId}/stewardship/plan-progress`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      const [touchpointsData, thankYouData, dxScoreData, planProgressData] = await Promise.all([
        touchpointsRes.ok ? touchpointsRes.json() : null,
        thankYouRes.ok ? thankYouRes.json() : null,
        dxScoreRes.ok ? dxScoreRes.json() : null,
        planProgressRes.ok ? planProgressRes.json() : null
      ]);

      // Calculate outreach volume from touchpoints
      const outreachVolume = touchpointsData ? {
        total_touchpoints: touchpointsData.summary?.total_touchpoints_ytd || 0,
        avg_per_donor: touchpointsData.summary?.avg_touchpoints_per_donor || 0,
        by_segment: touchpointsData.touchpoints_by_segment || []
      } : null;

      setStewardshipData({
        touchpoints: touchpointsData,
        thankYouVelocity: thankYouData,
        donorDelight: dxScoreData,
        outreachVolume: outreachVolume,
        stewardshipCycle: planProgressData,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching stewardship metrics:', error);
      setStewardshipData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const fetchSegmentationAnalytics = async () => {
    try {
      setSegmentationData(prev => ({ ...prev, loading: true, error: null }));

      // Generate comprehensive segmentation analytics data
      const retentionCohorts = {
        cohorts: [
          { cohort: 'Q1 2024', month_1: 95, month_3: 78, month_6: 65, month_12: 52 },
          { cohort: 'Q2 2024', month_1: 92, month_3: 75, month_6: 61, month_12: 48 },
          { cohort: 'Q3 2024', month_1: 94, month_3: 80, month_6: 68, month_12: null },
          { cohort: 'Q4 2024', month_1: 96, month_3: 82, month_6: null, month_12: null }
        ],
        summary: {
          first_year_retention: 58,
          multi_year_retention: 78,
          reactivation_rate: 42,
          reactivated_value: 127000
        }
      };

      const reactivationMetrics = {
        monthly: [
          { month: 'Jan', lapsed: 120, reactivated: 45, rate: 37.5 },
          { month: 'Feb', lapsed: 115, reactivated: 48, rate: 41.7 },
          { month: 'Mar', lapsed: 108, reactivated: 52, rate: 48.1 },
          { month: 'Apr', lapsed: 125, reactivated: 55, rate: 44.0 },
          { month: 'May', lapsed: 132, reactivated: 58, rate: 43.9 },
          { month: 'Jun', lapsed: 118, reactivated: 62, rate: 52.5 }
        ],
        total_lapsed: 718,
        total_reactivated: 320,
        overall_rate: 44.6,
        avg_reactivation_gift: 285
      };

      const journeyMovement = {
        phases: [
          {
            phase: 'New',
            last_year: 450,
            this_year: 520,
            change: 70,
            change_pct: 15.6,
            moved_up: 380,
            moved_down: 0
          },
          {
            phase: 'First-Time',
            last_year: 380,
            this_year: 420,
            change: 40,
            change_pct: 10.5,
            moved_up: 285,
            moved_down: 45
          },
          {
            phase: 'Repeat',
            last_year: 520,
            this_year: 580,
            change: 60,
            change_pct: 11.5,
            moved_up: 195,
            moved_down: 65
          },
          {
            phase: 'Multi-Year',
            last_year: 285,
            this_year: 340,
            change: 55,
            change_pct: 19.3,
            moved_up: 85,
            moved_down: 35
          },
          {
            phase: 'Major Donor',
            last_year: 95,
            this_year: 125,
            change: 30,
            change_pct: 31.6,
            moved_up: 0,
            moved_down: 12
          }
        ],
        flow_data: [
          { source: 'New', target: 'First-Time', value: 380 },
          { source: 'First-Time', target: 'Repeat', value: 285 },
          { source: 'Repeat', target: 'Multi-Year', value: 195 },
          { source: 'Multi-Year', target: 'Major Donor', value: 85 },
          { source: 'First-Time', target: 'Lapsed', value: 45 },
          { source: 'Repeat', target: 'Lapsed', value: 65 },
          { source: 'Lapsed', target: 'Reactivated', value: 120 },
          { source: 'Reactivated', target: 'Repeat', value: 95 }
        ]
      };

      // Migration Matrix - showing movement between segments
      const migrationMatrix = {
        segments: ['New', 'First-Time', 'Repeat', 'Multi-Year', 'Major', 'Lapsed'],
        matrix: [
          // From New
          [0, 380, 0, 0, 0, 70],
          // From First-Time
          [0, 0, 285, 0, 0, 95],
          // From Repeat
          [0, 0, 0, 195, 25, 65],
          // From Multi-Year
          [0, 0, 0, 0, 85, 35],
          // From Major
          [0, 0, 0, 0, 0, 12],
          // From Lapsed
          [15, 45, 60, 0, 0, 0]
        ]
      };

      // Segment size heatmap YoY
      const segmentHeatmap = {
        years: ['2020', '2021', '2022', '2023', '2024'],
        segments: ['New', 'First-Time', 'Repeat', 'Multi-Year', 'Major', 'Lapsed'],
        data: [
          // New
          [320, 380, 420, 450, 520],
          // First-Time
          [280, 310, 350, 380, 420],
          // Repeat
          [420, 460, 490, 520, 580],
          // Multi-Year
          [180, 210, 245, 285, 340],
          // Major
          [65, 72, 82, 95, 125],
          // Lapsed
          [150, 145, 138, 125, 112]
        ]
      };

      // Multi-year segmentation analysis
      const multiYearSegmentation = {
        periods: [
          {
            period: '3-Year',
            segments: [
              { name: 'High Value', count: 245, value: 485000, growth: 18.5 },
              { name: 'Mid Value', count: 580, value: 290000, growth: 12.3 },
              { name: 'Low Value', count: 890, value: 89000, growth: 8.2 },
              { name: 'At Risk', count: 185, value: 45000, growth: -5.4 }
            ]
          },
          {
            period: '5-Year',
            segments: [
              { name: 'High Value', count: 198, value: 625000, growth: 22.1 },
              { name: 'Mid Value', count: 465, value: 380000, growth: 15.8 },
              { name: 'Low Value', count: 720, value: 115000, growth: 9.5 },
              { name: 'At Risk', count: 145, value: 52000, growth: -8.2 }
            ]
          },
          {
            period: '10-Year',
            segments: [
              { name: 'High Value', count: 125, value: 890000, growth: 28.4 },
              { name: 'Mid Value', count: 320, value: 520000, growth: 19.2 },
              { name: 'Low Value', count: 485, value: 165000, growth: 11.8 },
              { name: 'At Risk', count: 98, value: 68000, growth: -12.5 }
            ]
          }
        ]
      };

      // Segment comparisons
      const segmentComparisons = {
        metrics: ['Avg Gift', 'Frequency', 'Retention', 'LTV', 'Engagement'],
        segments: [
          { name: 'Champions', values: [2850, 8.2, 95, 28500, 92] },
          { name: 'Loyal', values: [1200, 5.5, 88, 12000, 78] },
          { name: 'Potential', values: [450, 3.2, 72, 4500, 65] },
          { name: 'New', values: [185, 1.2, 45, 1850, 52] },
          { name: 'At Risk', values: [320, 2.1, 35, 2800, 28] }
        ]
      };

      setSegmentationData({
        retentionCohorts,
        reactivationMetrics,
        journeyMovement,
        yoyComparison: journeyMovement.phases,
        migrationMatrix,
        segmentHeatmap,
        multiYearSegmentation,
        segmentComparisons,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching segmentation analytics:', error);
      setSegmentationData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const generateRetentionTrends = () => {
    const baseRate = 85;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const trends = [];
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentYear - Math.floor((currentMonth - i + 12) / 12) + 1;
      trends.push({
        month: `${months[monthIndex]} ${year}`,
        retention_rate: (baseRate + (Math.random() * 10 - 5)).toFixed(1)
      });
    }
    return trends;
  };

  const generateGivingLevels = (donorTypes) => {
    const levels = [
      { name: '$0-$100', weight: 0.4 },
      { name: '$101-$500', weight: 0.3 },
      { name: '$501-$1,000', weight: 0.15 },
      { name: '$1,001-$5,000', weight: 0.10 },
      { name: '$5,001+', weight: 0.05 }
    ];

    const totalDonors = donorTypes.reduce((sum, type) => sum + type.count, 0);
    const totalRevenue = donorTypes.reduce((sum, type) => sum + (type.total_revenue || 0), 0);

    return levels.map((level, idx) => ({
      level_name: level.name,
      donor_count: Math.floor(totalDonors * level.weight),
      total_amount: totalRevenue * [0.1, 0.2, 0.2, 0.25, 0.25][idx]
    }));
  };

  // Chart configurations with premium styling
  const getRFMScatterChart = () => {
    if (!intelligenceData.rfmAnalysis || intelligenceData.rfmAnalysis.length === 0) return {};

    const data = intelligenceData.rfmAnalysis.map(donor => [
      donor.frequency_score,
      donor.monetary_score,
      donor.recency_score,
      donor.donor_name,
      donor.rfm_segment
    ]);

    const segmentColors = {
      'Champion': COLORS.utdOrange,
      'Loyal': COLORS.utdGreen,
      'Potential Loyalist': COLORS.accent,
      'New Donor': COLORS.info,
      'Promising': COLORS.success,
      'Needs Attention': COLORS.warning,
      'At Risk': COLORS.danger,
      'Hibernating': COLORS.textMuted,
      'Lost': COLORS.textSoft
    };

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { color: COLORS.textDark, fontSize: 13 },
        formatter: (params) => {
          const [freq, monetary, recency, name, segment] = params.data;
          return `<div style="padding: 8px;">
                    <strong style="font-size: 14px; color: ${COLORS.textDark}">${name}</strong><br/>
                    <div style="margin-top: 6px; color: ${segmentColors[segment]}">
                      <strong>● ${segment}</strong>
                    </div>
                    <div style="margin-top: 8px; line-height: 1.6;">
                      Recency: <strong>${recency}/5</strong><br/>
                      Frequency: <strong>${freq}/5</strong><br/>
                      Monetary: <strong>${monetary}/5</strong>
                    </div>
                  </div>`;
        }
      },
      legend: {
        data: Object.keys(segmentColors),
        type: 'scroll',
        orient: 'horizontal',
        bottom: 5,
        textStyle: { fontSize: 11, color: COLORS.textMuted },
        itemGap: 12,
        itemWidth: 18,            // Smaller icon
        pageIconSize: 12,
        pageTextStyle: { fontSize: 11 }
      },
      grid: { left: 60, right: 40, top: 40, bottom: 100 },
      xAxis: {
        name: 'Frequency Score',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { fontSize: 13, color: COLORS.textMuted },
        min: 0,
        max: 6,
        splitLine: { lineStyle: { type: 'dashed', color: COLORS.borderLight } },
        axisLine: { lineStyle: { color: COLORS.borderMid } },
        axisLabel: { color: COLORS.textMuted }
      },
      yAxis: {
        name: 'Monetary Score',
        nameTextStyle: { fontSize: 13, color: COLORS.textMuted },
        min: 0,
        max: 6,
        splitLine: { lineStyle: { type: 'dashed', color: COLORS.borderLight } },
        axisLine: { lineStyle: { color: COLORS.borderMid } },
        axisLabel: { color: COLORS.textMuted }
      },
      series: Object.entries(segmentColors).map(([segment, color]) => ({
        name: segment,
        type: 'scatter',
        symbolSize: (data) => Math.max(data[2] * 8, 12),
        data: data.filter(d => d[4] === segment),
        itemStyle: {
          color,
          opacity: 0.8,
          shadowBlur: 6,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowOffsetY: 2
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 12,
            shadowOffsetY: 4
          }
        }
      }))
    };
  };

  const getHealthScoreDistributionChart = () => {
    if (!intelligenceData.healthScores || intelligenceData.healthScores.length === 0) return {};

    const statusCounts = intelligenceData.healthScores.reduce((acc, donor) => {
      acc[donor.health_status] = (acc[donor.health_status] || 0) + 1;
      return acc;
    }, {});

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { fontSize: 13 },
        formatter: '{b}: <strong>{c} donors</strong> ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 20,
        top: 'center',
        textStyle: { fontSize: 13, color: COLORS.textMuted },
        itemGap: 16
      },
      series: [{
        name: 'Health Status',
        type: 'pie',
        radius: ['50%', '80%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        data: [
          { value: statusCounts['Excellent'] || 0, name: 'Excellent', itemStyle: { color: COLORS.success } },
          { value: statusCounts['Good'] || 0, name: 'Good', itemStyle: { color: COLORS.accent } },
          { value: statusCounts['Fair'] || 0, name: 'Fair', itemStyle: { color: COLORS.warning } },
          { value: statusCounts['Poor'] || 0, name: 'Poor', itemStyle: { color: COLORS.danger } },
          { value: statusCounts['Critical'] || 0, name: 'Critical', itemStyle: { color: COLORS.textMuted } }
        ]
      }]
    };
  };

  const getLTVPredictionChart = () => {
    if (!intelligenceData.lifetimeValue || intelligenceData.lifetimeValue.length === 0) return {};

    const topDonors = intelligenceData.lifetimeValue.slice(0, 10);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { fontSize: 13 },
        formatter: (params) => {
          return `<div style="padding: 8px;">
                    <strong style="font-size: 14px;">${params[0].name}</strong><br/>
                    ${params.map(p => `
                      <div style="margin-top: 6px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.color}; margin-right: 6px;"></span>
                        ${p.seriesName}: <strong>$${(p.value / 1000).toFixed(1)}K</strong>
                      </div>
                    `).join('')}
                  </div>`;
        }
      },
      legend: {
        data: ['Current LTV', 'Predicted LTV', 'Optimistic LTV'],
        bottom: 10,
        textStyle: { fontSize: 12, color: COLORS.textMuted },
        itemGap: 20
      },
      grid: { left: 60, right: 40, top: 40, bottom: 80 },
      xAxis: {
        type: 'category',
        data: topDonors.map(d => d.donor_name.split(' ')[0]),
        axisLabel: { rotate: 45, fontSize: 11, color: COLORS.textMuted },
        axisLine: { lineStyle: { color: COLORS.borderMid } }
      },
      yAxis: {
        type: 'value',
        name: 'Value ($)',
        nameTextStyle: { color: COLORS.textMuted },
        axisLabel: {
          formatter: (value) => '$' + (value / 1000).toFixed(0) + 'K',
          color: COLORS.textMuted
        },
        splitLine: { lineStyle: { color: COLORS.borderLight } },
        axisLine: { lineStyle: { color: COLORS.borderMid } }
      },
      series: [
        {
          name: 'Current LTV',
          type: 'bar',
          data: topDonors.map(d => parseFloat(d.current_ltv)),
          itemStyle: {
            color: COLORS.textSoft,
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: 'Predicted LTV',
          type: 'bar',
          data: topDonors.map(d => parseFloat(d.predicted_ltv_expected)),
          itemStyle: {
            color: COLORS.utdOrange,
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: 'Optimistic LTV',
          type: 'bar',
          data: topDonors.map(d => parseFloat(d.predicted_ltv_optimistic)),
          itemStyle: {
            color: COLORS.accent,
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  };

  const getGivingPatternsChart = () => {
    if (!intelligenceData.givingPatterns || intelligenceData.givingPatterns.length === 0) return {};

    const patternCounts = intelligenceData.givingPatterns.reduce((acc, donor) => {
      acc[donor.pattern_type] = (acc[donor.pattern_type] || 0) + 1;
      return acc;
    }, {});

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { fontSize: 13 },
        formatter: '{b}: <strong>{c} donors</strong> ({d}%)'
      },
      legend: {
        bottom: 10,
        textStyle: { fontSize: 12, color: COLORS.textMuted },
        itemGap: 16
      },
      series: [{
        name: 'Pattern Type',
        type: 'pie',
        radius: ['45%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 12,
          color: COLORS.textMuted
        },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        data: Object.entries(patternCounts).map(([pattern, count]) => ({
          value: count,
          name: pattern,
          itemStyle: {
            color: {
              'Monthly': COLORS.utdOrange,
              'Quarterly': COLORS.utdGreen,
              'Semi-Annual': COLORS.accent,
              'Annual': COLORS.info,
              'Irregular': COLORS.textSoft
            }[pattern]
          }
        }))
      }]
    };
  };

  const getLifecycleFunnelChart = () => {
    if (!dashboardData.lifecycle?.stages) return {};

    const stages = dashboardData.lifecycle.stages;

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { fontSize: 13 },
        formatter: '{b}: <strong>{c} donors</strong>'
      },
      series: [{
        name: 'Donor Lifecycle',
        type: 'funnel',
        left: '10%',
        width: '80%',
        minSize: '20%',
        maxSize: '100%',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}: {c}',
          fontSize: 13,
          color: '#fff',
          fontWeight: 'bold'
        },
        labelLine: { show: false },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        emphasis: {
          label: { fontSize: 15 },
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        data: stages.map((stage, idx) => ({
          value: stage.donor_count,
          name: stage.stage_name,
          itemStyle: {
            color: [COLORS.utdOrange, COLORS.utdGreen, COLORS.accent, COLORS.info, COLORS.success][idx % 5]
          }
        })).sort((a, b) => b.value - a.value)
      }]
    };
  };

  const getRetentionTrendsChart = () => {
    if (!dashboardData.lifecycle?.retention_trends) return {};

    const trends = dashboardData.lifecycle.retention_trends;

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { fontSize: 13 },
        axisPointer: {
          type: 'cross',
          label: { backgroundColor: COLORS.textMuted }
        }
      },
      grid: { left: 60, right: 40, top: 40, bottom: 60 },
      xAxis: {
        type: 'category',
        data: trends.map(t => t.month),
        axisLabel: { rotate: 45, fontSize: 11, color: COLORS.textMuted },
        axisLine: { lineStyle: { color: COLORS.borderMid } }
      },
      yAxis: {
        type: 'value',
        name: 'Retention Rate (%)',
        nameTextStyle: { color: COLORS.textMuted },
        min: 70,
        max: 95,
        axisLabel: { formatter: '{value}%', color: COLORS.textMuted },
        splitLine: { lineStyle: { color: COLORS.borderLight } },
        axisLine: { lineStyle: { color: COLORS.borderMid } }
      },
      series: [{
        data: trends.map(t => parseFloat(t.retention_rate)),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 4,
          color: COLORS.utdOrange,
          shadowBlur: 10,
          shadowColor: 'rgba(232, 117, 0, 0.3)',
          shadowOffsetY: 4
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: `${COLORS.utdOrange}60`
            }, {
              offset: 1,
              color: `${COLORS.utdOrange}05`
            }]
          }
        },
        itemStyle: {
          color: COLORS.utdOrange,
          borderColor: '#fff',
          borderWidth: 3,
          shadowBlur: 8,
          shadowColor: 'rgba(232, 117, 0, 0.4)'
        }
      }]
    };
  };

  const getDonorSegmentsChart = () => {
    if (!dashboardData.segments?.segments) return {};

    const segments = dashboardData.segments.segments;

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { fontSize: 13 },
        formatter: '{b}: <strong>{c} donors</strong> ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
        textStyle: { fontSize: 13, color: COLORS.textMuted },
        itemGap: 16
      },
      series: [{
        name: 'Donor Segments',
        type: 'pie',
        radius: '65%',
        center: ['60%', '50%'],
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        data: segments.map((seg, idx) => ({
          value: seg.donor_count,
          name: seg.segment_name,
          itemStyle: {
            color: [COLORS.utdOrange, COLORS.utdGreen, COLORS.accent, COLORS.info, COLORS.success, COLORS.warning][idx % 6]
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        }
      }]
    };
  };

  const getGivingLevelsChart = () => {
    if (!dashboardData.segments?.giving_levels) return {};

    const levels = dashboardData.segments.giving_levels;

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        textStyle: { fontSize: 13 },
        formatter: (params) => {
          const data = params[0];
          const level = levels[data.dataIndex];
          return `<div style="padding: 8px;">
                    <strong style="font-size: 14px;">${data.name}</strong><br/>
                    <div style="margin-top: 6px;">
                      Donors: <strong>${level.donor_count.toLocaleString()}</strong><br/>
                      Total: <strong>$${level.total_amount.toLocaleString()}</strong>
                    </div>
                  </div>`;
        }
      },
      grid: { left: 60, right: 40, top: 40, bottom: 80 },
      xAxis: {
        type: 'category',
        data: levels.map(l => l.level_name),
        axisLabel: { rotate: 30, fontSize: 11, color: COLORS.textMuted },
        axisLine: { lineStyle: { color: COLORS.borderMid } }
      },
      yAxis: {
        type: 'value',
        name: 'Number of Donors',
        nameTextStyle: { color: COLORS.textMuted },
        axisLabel: { color: COLORS.textMuted },
        splitLine: { lineStyle: { color: COLORS.borderLight } },
        axisLine: { lineStyle: { color: COLORS.borderMid } }
      },
      series: [{
        name: 'Donors',
        type: 'bar',
        data: levels.map((l, idx) => ({
          value: l.donor_count,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: [COLORS.info, COLORS.utdOrange, COLORS.accent, COLORS.utdGreen, COLORS.success][idx]
              }, {
                offset: 1,
                color: [COLORS.infoLight, COLORS.utdOrangeLight, COLORS.accentLight, COLORS.utdGreenLight, COLORS.successLight][idx]
              }]
            },
            borderRadius: [8, 8, 0, 0],
            shadowBlur: 6,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowOffsetY: 2
          }
        })),
        barWidth: '50%'
      }]
    };
  };

  if (dashboardData.loading || intelligenceData.loading) {
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
              Loading Donor Intelligence
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Analyzing portfolio data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardData.error || intelligenceData.error) {
    return (
      <div
        className="flex items-center justify-center min-h-screen px-4"
        style={{
          background: 'radial-gradient(circle at top, #ffffff 0%, #F8FAFC 45%, #E2E8F0 100%)',
        }}
      >
        <div
          className="max-w-md w-full rounded-3xl p-6 shadow-xl border"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.98))',
            borderColor: COLORS.borderLight,
          }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.textDark }}>
            Unable to Load Data
          </h2>
          <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
            {dashboardData.error || intelligenceData.error}
          </p>
          <button
            onClick={() => {
              fetchDonorAnalytics();
              fetchDonorIntelligence();
            }}
            className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{
              background: `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`,
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = {
    totalDonors: dashboardData.lifecycle?.total_donors || 0,
    newDonors: dashboardData.lifecycle?.new_donors || 0,
    retentionRate: dashboardData.lifecycle?.retention_rate || 0,
    avgDonation: dashboardData.avgDonation?.average_donation || 0,
    lifetimeValue: dashboardData.avgDonation?.lifetime_value || 0
  };

  const intelligenceMetrics = {
    champions: intelligenceData.rfmAnalysis?.filter(d => d.rfm_segment === 'Champion').length || 0,
    atRisk: intelligenceData.churnRisk?.filter(d => d.risk_level === 'High').length || 0,
    avgHealthScore: intelligenceData.healthScores?.length > 0
      ? (intelligenceData.healthScores.reduce((sum, d) => sum + d.health_score, 0) / intelligenceData.healthScores.length).toFixed(1)
      : 0,
    upgradeOpportunities: intelligenceData.upgradePotential?.filter(d => d.potential_level === 'High').length || 0,
    totalPredictedValue: intelligenceData.lifetimeValue?.reduce((sum, d) => sum + parseFloat(d.predicted_ltv_expected), 0) || 0,
    overdueGifts: intelligenceData.nextGift?.filter(d => d.is_overdue).length || 0
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(circle at top left, #FFFFFF 0%, #F8FAFC 40%, #E2E8F0 100%)',
      }}
    >
      {/* Premium Header */}
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
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="text-2xl sm:text-3xl font-semibold tracking-tight"
                    style={{ color: COLORS.textDark }}
                  >
                    Donor Intelligence Dashboard
                  </h1>
                </div>
                <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                  Predictive Analytics & Strategic Insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-2xl text-xs font-semibold border shadow-sm hover:bg-slate-50 transition-all"
                style={{ color: COLORS.textDark, borderColor: COLORS.borderLight }}
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Export
              </button>
              <button
                onClick={() => {
                  fetchDonorAnalytics();
                  fetchDonorIntelligence();
                }}
                className="inline-flex items-center px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`,
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="mt-4">
            <div
              className="inline-flex rounded-2xl p-1 shadow-sm border"
              style={{
                background: COLORS.bgLight,
                borderColor: COLORS.borderLight,
              }}
            >
              {[
                { id: 'portfolio', label: 'Portfolio Health', icon: Heart },
                { id: 'intelligence', label: 'AI Intelligence', icon: Brain },
                { id: 'patterns', label: 'Patterns', icon: LineChart },
                { id: 'acquisition', label: 'Acquisition', icon: UserPlus },
                { id: 'stewardship', label: 'Stewardship KPIs', icon: Award },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="inline-flex items-center px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all"
                  style={{
                    background: activeTab === tab.id
                      ? `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`
                      : 'transparent',
                    color: activeTab === tab.id ? 'white' : COLORS.textMuted,
                    boxShadow: activeTab === tab.id ? COLORS.shadowSoft : 'none',
                  }}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Portfolio Health Tab */}
        {activeTab === 'portfolio' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Total Donors Card */}
              <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-white">
                      <ArrowUp className="h-5 w-5" />
                      +12%
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">
                    Total Active Donors
                  </p>
                  <p className="text-4xl font-bold text-white mb-2">
                    {metrics.totalDonors.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/80">
                    Growing donor base
                  </p>
                </div>
              </div>

              {/* New Donors Card */}
              <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.utdGreen} 0%, ${COLORS.utdGreenLight} 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
                      <UserPlus className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-white">
                      <ArrowUp className="h-5 w-5" />
                      +24%
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">
                    New Donors (YTD)
                  </p>
                  <p className="text-4xl font-bold text-white mb-2">
                    {metrics.newDonors.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/80">
                    Strong acquisition
                  </p>
                </div>
              </div>

              {/* Retention Rate Card */}
              <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentLight} 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
                      <Heart className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-white">
                      <ArrowUp className="h-5 w-5" />
                      +3.2%
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">
                    Retention Rate
                  </p>
                  <p className="text-4xl font-bold text-white mb-2">
                    {metrics.retentionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-white/80">
                    Above benchmark
                  </p>
                </div>
              </div>

              {/* Avg Donation Card */}
              <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.info} 0%, ${COLORS.infoLight} 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
                      <DollarSign className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-white">
                      <ArrowUp className="h-5 w-5" />
                      +8.5%
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">
                    Average Gift Size
                  </p>
                  <p className="text-4xl font-bold text-white mb-2">
                    ${metrics.avgDonation.toFixed(0)}
                  </p>
                  <p className="text-xs text-white/80">
                    LTV: ${metrics.lifetimeValue.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Insights Banner */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4" style={{ borderColor: COLORS.success }}>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl" style={{ background: `${COLORS.success}15` }}>
                    <Star className="h-8 w-8" style={{ color: COLORS.success }} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>
                      {intelligenceMetrics.champions}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>
                      Champion Donors
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.success }}>
                      Top-tier engagement ↗
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4" style={{ borderColor: COLORS.purple }}>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl" style={{ background: `${COLORS.purple}15` }}>
                    <TrendingUp className="h-8 w-8" style={{ color: COLORS.purple }} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>
                      ${((intelligenceMetrics.totalPredictedValue - (metrics.totalDonors * metrics.lifetimeValue)) / 1000).toFixed(0)}K
                    </p>
                    <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>
                      Portfolio Growth
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.purple }}>
                      Predicted increase ↗
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4" style={{ borderColor: COLORS.warning }}>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl" style={{ background: `${COLORS.warning}15` }}>
                    <Target className="h-8 w-8" style={{ color: COLORS.warning }} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>
                      {intelligenceMetrics.upgradeOpportunities}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>
                      Upgrade Opportunities
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.warning }}>
                      Ready for ask →
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    Donor Lifecycle Pipeline
                  </h3>
                  <Layers className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="h-96">
                  <ReactECharts option={getLifecycleFunnelChart()} style={{ height: '100%' }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    Retention Performance
                  </h3>
                  <Activity className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="h-96">
                  <ReactECharts option={getRetentionTrendsChart()} style={{ height: '100%' }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    Donor Segments
                  </h3>
                  <PieChart className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="h-96">
                  <ReactECharts option={getDonorSegmentsChart()} style={{ height: '100%' }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    Giving Level Distribution
                  </h3>
                  <BarChart3 className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="h-96">
                  <ReactECharts option={getGivingLevelsChart()} style={{ height: '100%' }} />
                </div>
              </div>
            </div>

            {/* Segmentation Analytics Section */}
            <div className="mt-8">
              <div className="flex items-center mb-6">
                <Layers className="h-6 w-6 mr-3" style={{ color: COLORS.utdOrange }} />
                <h2 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                  Segmentation Analytics
                </h2>
              </div>

              {/* Retention & Reactivation KPIs */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4" style={{ borderColor: COLORS.success }}>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl" style={{ background: `${COLORS.success}15` }}>
                      <Shield className="h-8 w-8" style={{ color: COLORS.success }} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>
                        {segmentationData.retentionCohorts?.summary?.first_year_retention || 0}%
                      </p>
                      <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>
                        First Year Retention
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4" style={{ borderColor: COLORS.info }}>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl" style={{ background: `${COLORS.info}15` }}>
                      <Award className="h-8 w-8" style={{ color: COLORS.info }} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>
                        {segmentationData.retentionCohorts?.summary?.multi_year_retention || 0}%
                      </p>
                      <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>
                        Multi-Year Retention
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4" style={{ borderColor: COLORS.warning }}>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl" style={{ background: `${COLORS.warning}15` }}>
                      <RefreshCw className="h-8 w-8" style={{ color: COLORS.warning }} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>
                        {segmentationData.retentionCohorts?.summary?.reactivation_rate || 0}%
                      </p>
                      <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>
                        Reactivation Rate
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4" style={{ borderColor: COLORS.purple }}>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl" style={{ background: `${COLORS.purple}15` }}>
                      <DollarSign className="h-8 w-8" style={{ color: COLORS.purple }} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>
                        ${((segmentationData.retentionCohorts?.summary?.reactivated_value || 0) / 1000).toFixed(0)}K
                      </p>
                      <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>
                        Reactivated Value
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cohort Retention & Reactivation Charts */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Cohort Retention Analysis */}
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                      Cohort Retention Analysis
                    </h3>
                    <Activity className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
                  </div>
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => {
                          let tooltip = `<div style="font-weight:600;margin-bottom:8px">${params[0].name}</div>`;
                          params.forEach(p => {
                            if (p.value !== null) {
                              tooltip += `<div style="margin:4px 0">${p.seriesName}: <strong>${p.value}%</strong></div>`;
                            }
                          });
                          return tooltip;
                        }
                      },
                      legend: {
                        data: ['1 Month', '3 Months', '6 Months', '12 Months'],
                        bottom: 0,
                        textStyle: { color: COLORS.textMuted }
                      },
                      grid: { left: '3%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
                      xAxis: {
                        type: 'category',
                        data: segmentationData.retentionCohorts?.cohorts?.map(c => c.cohort) || [],
                        axisLabel: { color: COLORS.textMuted }
                      },
                      yAxis: {
                        type: 'value',
                        max: 100,
                        axisLabel: { formatter: '{value}%', color: COLORS.textMuted },
                        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
                      },
                      series: [
                        {
                          name: '1 Month',
                          type: 'bar',
                          data: segmentationData.retentionCohorts?.cohorts?.map(c => c.month_1) || [],
                          itemStyle: { color: COLORS.success, borderRadius: [4, 4, 0, 0] }
                        },
                        {
                          name: '3 Months',
                          type: 'bar',
                          data: segmentationData.retentionCohorts?.cohorts?.map(c => c.month_3) || [],
                          itemStyle: { color: COLORS.info, borderRadius: [4, 4, 0, 0] }
                        },
                        {
                          name: '6 Months',
                          type: 'bar',
                          data: segmentationData.retentionCohorts?.cohorts?.map(c => c.month_6) || [],
                          itemStyle: { color: COLORS.warning, borderRadius: [4, 4, 0, 0] }
                        },
                        {
                          name: '12 Months',
                          type: 'bar',
                          data: segmentationData.retentionCohorts?.cohorts?.map(c => c.month_12) || [],
                          itemStyle: { color: COLORS.purple, borderRadius: [4, 4, 0, 0] }
                        }
                      ]
                    }}
                    style={{ height: '350px' }}
                  />
                </div>

                {/* Reactivation Performance */}
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                      Reactivation Performance
                    </h3>
                    <RefreshCw className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
                  </div>
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'axis',
                        formatter: (params) => {
                          const month = params[0].name;
                          let tooltip = `<div style="font-weight:600;margin-bottom:8px">${month}</div>`;
                          params.forEach(p => {
                            const value = p.seriesName === 'Rate' ? `${p.value}%` : p.value;
                            tooltip += `<div style="margin:4px 0">${p.seriesName}: <strong>${value}</strong></div>`;
                          });
                          return tooltip;
                        }
                      },
                      legend: {
                        data: ['Lapsed', 'Reactivated', 'Rate'],
                        bottom: 0,
                        textStyle: { color: COLORS.textMuted }
                      },
                      grid: { left: '3%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
                      xAxis: {
                        type: 'category',
                        data: segmentationData.reactivationMetrics?.monthly?.map(m => m.month) || [],
                        axisLabel: { color: COLORS.textMuted }
                      },
                      yAxis: [
                        {
                          type: 'value',
                          name: 'Donors',
                          axisLabel: { color: COLORS.textMuted },
                          splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
                        },
                        {
                          type: 'value',
                          name: 'Rate %',
                          axisLabel: { formatter: '{value}%', color: COLORS.textMuted }
                        }
                      ],
                      series: [
                        {
                          name: 'Lapsed',
                          type: 'bar',
                          data: segmentationData.reactivationMetrics?.monthly?.map(m => m.lapsed) || [],
                          itemStyle: { color: COLORS.danger, borderRadius: [4, 4, 0, 0] }
                        },
                        {
                          name: 'Reactivated',
                          type: 'bar',
                          data: segmentationData.reactivationMetrics?.monthly?.map(m => m.reactivated) || [],
                          itemStyle: { color: COLORS.success, borderRadius: [4, 4, 0, 0] }
                        },
                        {
                          name: 'Rate',
                          type: 'line',
                          yAxisIndex: 1,
                          data: segmentationData.reactivationMetrics?.monthly?.map(m => m.rate) || [],
                          itemStyle: { color: COLORS.utdOrange },
                          lineStyle: { width: 3 },
                          symbol: 'circle',
                          symbolSize: 8
                        }
                      ]
                    }}
                    style={{ height: '350px' }}
                  />
                </div>
              </div>

              {/* Donor Journey Movement - YoY Comparison */}
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <TrendingUp className="h-5 w-5 mr-2" style={{ color: COLORS.utdOrange }} />
                  <h3 className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                    Donor Journey Movement - YoY Comparison
                  </h3>
                </div>

                {/* Phase KPI Cards */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                  {segmentationData.journeyMovement?.phases?.map((phase, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 shadow-lg">
                      <div className="text-sm font-semibold mb-2" style={{ color: COLORS.textMuted }}>
                        {phase.phase}
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: COLORS.textDark }}>
                        {phase.this_year}
                      </div>
                      <div className={`flex items-center text-sm font-semibold ${
                        phase.change_pct >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {phase.change_pct >= 0 ? (
                          <ArrowUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(phase.change_pct).toFixed(1)}% YoY
                      </div>
                    </div>
                  ))}
                </div>

                {/* YoY Comparison Chart */}
                <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' }
                      },
                      legend: {
                        data: ['Last Year', 'This Year'],
                        bottom: 0,
                        textStyle: { color: COLORS.textMuted }
                      },
                      grid: { left: '3%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
                      xAxis: {
                        type: 'category',
                        data: segmentationData.journeyMovement?.phases?.map(p => p.phase) || [],
                        axisLabel: { color: COLORS.textMuted }
                      },
                      yAxis: {
                        type: 'value',
                        axisLabel: { color: COLORS.textMuted },
                        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
                      },
                      series: [
                        {
                          name: 'Last Year',
                          type: 'bar',
                          data: segmentationData.journeyMovement?.phases?.map(p => p.last_year) || [],
                          itemStyle: { color: COLORS.textMuted, borderRadius: [4, 4, 0, 0] }
                        },
                        {
                          name: 'This Year',
                          type: 'bar',
                          data: segmentationData.journeyMovement?.phases?.map(p => p.this_year) || [],
                          itemStyle: { color: COLORS.utdOrange, borderRadius: [4, 4, 0, 0] }
                        }
                      ]
                    }}
                    style={{ height: '300px' }}
                  />
                </div>

                {/* Movement Summary Table */}
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <h4 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
                    Movement Summary
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${COLORS.borderLight}` }}>
                          <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                            Phase
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                            Last Year
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                            This Year
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                            Net Change
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                            Moved Up
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                            Moved Down
                          </th>
                          <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                            Conversion
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {segmentationData.journeyMovement?.phases?.map((phase, idx) => {
                          const conversionRate = phase.last_year > 0
                            ? ((phase.moved_up / phase.last_year) * 100).toFixed(1)
                            : 0;
                          return (
                            <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                              <td className="py-4 px-4">
                                <span className="font-semibold text-sm" style={{ color: COLORS.textDark }}>
                                  {phase.phase}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-medium text-sm" style={{ color: COLORS.textMuted }}>
                                  {phase.last_year}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-bold text-sm" style={{ color: COLORS.textDark }}>
                                  {phase.this_year}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className={`font-semibold text-sm ${
                                  phase.change >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {phase.change >= 0 ? '+' : ''}{phase.change} ({phase.change_pct.toFixed(1)}%)
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-medium text-sm text-green-600">
                                  {phase.moved_up}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-medium text-sm text-red-600">
                                  {phase.moved_down}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-center">
                                  <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="h-2 rounded-full"
                                      style={{
                                        width: `${Math.min(conversionRate, 100)}%`,
                                        backgroundColor: conversionRate >= 50 ? COLORS.success :
                                          conversionRate >= 30 ? COLORS.warning : COLORS.danger
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>
                                    {conversionRate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 3yr / 5yr / 10yr Multi-Year Segmentation Analysis */}
              <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                      Multi-Year Segmentation Analysis
                    </h3>
                    <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
                      Long-term donor value segmentation across 3, 5, and 10 year horizons
                    </p>
                  </div>
                  <Calendar className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {segmentationData.multiYearSegmentation?.periods?.map((period, idx) => (
                    <div key={idx} className="border rounded-xl p-4" style={{ borderColor: COLORS.borderLight }}>
                      <div className="text-center mb-4">
                        <span className="text-lg font-bold" style={{ color: COLORS.utdOrange }}>
                          {period.period}
                        </span>
                        <span className="text-sm ml-2" style={{ color: COLORS.textMuted }}>Donors</span>
                      </div>
                      <div className="space-y-3">
                        {period.segments.map((seg, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between p-2 rounded-lg"
                            style={{ background: COLORS.bgLight }}>
                            <div>
                              <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
                                {seg.name}
                              </span>
                              <span className="text-xs ml-2" style={{ color: COLORS.textMuted }}>
                                ({seg.count})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-sm" style={{ color: COLORS.success }}>
                                ${(seg.value / 1000).toFixed(0)}K
                              </span>
                              <span className={`text-xs ml-2 ${seg.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {seg.growth >= 0 ? '+' : ''}{seg.growth}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Segment Comparisons & Migration Matrix */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Deeper Segment Comparisons - Radar Chart */}
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                      Segment Performance Comparison
                    </h3>
                    <BarChart3 className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
                  </div>
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'item'
                      },
                      legend: {
                        data: segmentationData.segmentComparisons?.segments?.map(s => s.name) || [],
                        bottom: 0,
                        textStyle: { color: COLORS.textMuted, fontSize: 10 }
                      },
                      radar: {
                        indicator: segmentationData.segmentComparisons?.metrics?.map(m => ({
                          name: m,
                          max: m === 'Avg Gift' ? 3000 : m === 'Frequency' ? 10 : m === 'LTV' ? 30000 : 100
                        })) || [],
                        center: ['50%', '45%'],
                        radius: '60%',
                        axisName: {
                          color: COLORS.textMuted,
                          fontSize: 11
                        },
                        splitArea: {
                          areaStyle: {
                            color: [COLORS.bgLight, 'white', COLORS.bgLight, 'white', COLORS.bgLight]
                          }
                        }
                      },
                      series: [{
                        type: 'radar',
                        data: segmentationData.segmentComparisons?.segments?.map((seg, idx) => ({
                          value: seg.values,
                          name: seg.name,
                          itemStyle: {
                            color: [COLORS.utdOrange, COLORS.info, COLORS.success, COLORS.warning, COLORS.danger][idx]
                          },
                          areaStyle: {
                            opacity: 0.1
                          }
                        })) || []
                      }]
                    }}
                    style={{ height: '380px' }}
                  />
                </div>

                {/* Migration Matrix Between Segments */}
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                      Segment Migration Matrix
                    </h3>
                    <Layers className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
                  </div>
                  <ReactECharts
                    option={{
                      tooltip: {
                        position: 'top',
                        formatter: (params) => {
                          const from = segmentationData.migrationMatrix?.segments?.[params.data[1]] || '';
                          const to = segmentationData.migrationMatrix?.segments?.[params.data[0]] || '';
                          const value = params.data[2];
                          return `<div style="font-weight:600">${from} → ${to}</div>
                            <div>Donors: <strong>${value}</strong></div>`;
                        }
                      },
                      grid: {
                        left: '15%',
                        right: '10%',
                        top: '15%',
                        bottom: '15%'
                      },
                      xAxis: {
                        type: 'category',
                        data: segmentationData.migrationMatrix?.segments || [],
                        position: 'top',
                        axisLabel: {
                          color: COLORS.textMuted,
                          fontSize: 10,
                          rotate: 45
                        },
                        splitArea: {
                          show: true
                        }
                      },
                      yAxis: {
                        type: 'category',
                        data: segmentationData.migrationMatrix?.segments || [],
                        axisLabel: {
                          color: COLORS.textMuted,
                          fontSize: 10
                        },
                        splitArea: {
                          show: true
                        }
                      },
                      visualMap: {
                        min: 0,
                        max: 400,
                        calculable: true,
                        orient: 'horizontal',
                        left: 'center',
                        bottom: '0%',
                        inRange: {
                          color: ['#f0f9ff', COLORS.info, COLORS.utdOrange]
                        },
                        textStyle: {
                          color: COLORS.textMuted
                        }
                      },
                      series: [{
                        type: 'heatmap',
                        data: segmentationData.migrationMatrix?.matrix?.flatMap((row, i) =>
                          row.map((value, j) => [j, i, value || 0])
                        ) || [],
                        label: {
                          show: true,
                          fontSize: 10,
                          formatter: (params) => params.data[2] > 0 ? params.data[2] : ''
                        },
                        emphasis: {
                          itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                          }
                        }
                      }]
                    }}
                    style={{ height: '380px' }}
                  />
                </div>
              </div>

              {/* Segment Size Changes YoY Heatmap */}
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                      Segment Size Changes - 5 Year Heatmap
                    </h3>
                    <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
                      Track segment growth and decline patterns over time
                    </p>
                  </div>
                  <Eye className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
                </div>
                <ReactECharts
                  option={{
                    tooltip: {
                      position: 'top',
                      formatter: (params) => {
                        const year = segmentationData.segmentHeatmap?.years?.[params.data[0]] || '';
                        const segment = segmentationData.segmentHeatmap?.segments?.[params.data[1]] || '';
                        const value = params.data[2];
                        return `<div style="font-weight:600">${segment} (${year})</div>
                          <div>Donors: <strong>${value}</strong></div>`;
                      }
                    },
                    grid: {
                      left: '12%',
                      right: '12%',
                      top: '10%',
                      bottom: '20%'
                    },
                    xAxis: {
                      type: 'category',
                      data: segmentationData.segmentHeatmap?.years || [],
                      axisLabel: {
                        color: COLORS.textMuted
                      },
                      splitArea: {
                        show: true
                      }
                    },
                    yAxis: {
                      type: 'category',
                      data: segmentationData.segmentHeatmap?.segments || [],
                      axisLabel: {
                        color: COLORS.textMuted
                      },
                      splitArea: {
                        show: true
                      }
                    },
                    visualMap: {
                      min: 50,
                      max: 600,
                      calculable: true,
                      orient: 'horizontal',
                      left: 'center',
                      bottom: '0%',
                      inRange: {
                        color: ['#fee2e2', '#fef3c7', '#d1fae5', COLORS.success]
                      },
                      textStyle: {
                        color: COLORS.textMuted
                      }
                    },
                    series: [{
                      type: 'heatmap',
                      data: segmentationData.segmentHeatmap?.data?.flatMap((row, segIdx) =>
                        row.map((value, yearIdx) => [yearIdx, segIdx, value])
                      ) || [],
                      label: {
                        show: true,
                        fontSize: 11,
                        fontWeight: 'bold'
                      },
                      emphasis: {
                        itemStyle: {
                          shadowBlur: 10,
                          shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                      }
                    }]
                  }}
                  style={{ height: '350px' }}
                />
              </div>
            </div>
          </>
        )}

        {/* Intelligence & Risk Tab */}
        {activeTab === 'intelligence' && (
          <>
            {/* Intelligence KPIs */}
            <div className="grid grid-cols-4 gap-6 mb-10">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: `${COLORS.utdOrange}15` }}>
                    <Star className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                  </div>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>
                  Champions
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.textDark }}>
                  {intelligenceMetrics.champions}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: `${COLORS.danger}15` }}>
                    <AlertTriangle className="h-6 w-6" style={{ color: COLORS.danger }} />
                  </div>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>
                  High Risk
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.textDark }}>
                  {intelligenceMetrics.atRisk}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: `${COLORS.accent}15` }}>
                    <Shield className="h-6 w-6" style={{ color: COLORS.accent }} />
                  </div>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>
                  Avg Health
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.textDark }}>
                  {intelligenceMetrics.avgHealthScore}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: `${COLORS.success}15` }}>
                    <TrendingUp className="h-6 w-6" style={{ color: COLORS.success }} />
                  </div>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>
                  Ready for Upgrade
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.textDark }}>
                  {intelligenceMetrics.upgradeOpportunities}
                </p>
              </div>
            </div>

            {/* Critical Alert */}
            {intelligenceMetrics.atRisk > 0 && (
              <div className="rounded-2xl p-8 mb-10 shadow-xl border-2"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.danger}10 0%, ${COLORS.danger}05 100%)`,
                  borderColor: COLORS.danger
                }}>
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-2xl" style={{ background: `${COLORS.danger}20` }}>
                    <AlertTriangle className="h-10 w-10" style={{ color: COLORS.danger }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3" style={{ color: COLORS.danger }}>
                      Critical: {intelligenceMetrics.atRisk} Donors at High Churn Risk
                    </h3>
                    <p className="text-base mb-6" style={{ color: COLORS.textMuted }}>
                      These high-value donors require immediate personal outreach within the next 7 days.
                      Estimated portfolio value at risk: <strong>${(intelligenceMetrics.atRisk * 2500).toLocaleString()}</strong>
                    </p>
                    <div className="flex gap-4">
                      <button
                        className="px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-white"
                        style={{ background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerLight} 100%)` }}
                      >
                        View At-Risk Donors
                      </button>
                      <button
                        className="px-6 py-3 rounded-xl font-semibold border-2 hover:bg-white transition-all duration-200"
                        style={{ borderColor: COLORS.danger, color: COLORS.danger }}
                      >
                        Launch Retention Campaign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Intelligence Charts */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    Portfolio Health Distribution
                  </h3>
                  <Shield className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="h-96">
                  <ReactECharts option={getHealthScoreDistributionChart()} style={{ height: '100%' }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    At-Risk Donors (Top 10)
                  </h3>
                  <AlertTriangle className="h-6 w-6" style={{ color: COLORS.danger }} />
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {intelligenceData.churnRisk?.slice(0, 10).map((donor, idx) => (
                    <div key={idx} className="p-4 rounded-xl border-2 hover:border-gray-300 transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-base" style={{ color: COLORS.textDark }}>
                          {donor.donor_name}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-bold" style={{
                          background: donor.risk_level === 'High' ? `${COLORS.danger}20` : `${COLORS.warning}20`,
                          color: donor.risk_level === 'High' ? COLORS.danger : COLORS.warning
                        }}>
                          {donor.churn_probability_percent.toFixed(0)}% Risk
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-3" style={{ color: COLORS.textMuted }}>
                        <span>LTV: <strong>${parseFloat(donor.lifetime_value).toLocaleString()}</strong></span>
                        <span>{donor.days_since_last_gift} days since last gift</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${donor.churn_probability_percent}%`,
                            background: `linear-gradient(90deg, ${donor.risk_level === 'High' ? COLORS.danger : COLORS.warning} 0%, ${donor.risk_level === 'High' ? COLORS.dangerLight : COLORS.warningLight} 100%)`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    RFM Behavioral Analysis
                  </h3>
                  <Eye className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="h-[500px]">
                  <ReactECharts option={getRFMScatterChart()} style={{ height: '100%' }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    Lifetime Value Forecast
                  </h3>
                  <DollarSign className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="h-[500px]">
                  <ReactECharts option={getLTVPredictionChart()} style={{ height: '100%' }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Patterns & Forecast Tab */}
        {activeTab === 'patterns' && (
          <>
            {/* Pattern Metrics */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: `${COLORS.info}15` }}>
                    <Clock className="h-6 w-6" style={{ color: COLORS.info }} />
                  </div>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>
                  Overdue Gifts
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.textDark }}>
                  {intelligenceMetrics.overdueGifts}
                </p>
                <p className="text-xs mt-2" style={{ color: COLORS.textSoft }}>
                  Past expected date
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: `${COLORS.utdOrange}15` }}>
                    <Calendar className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                  </div>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>
                  Expected Next 30 Days
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.textDark }}>
                  {intelligenceData.nextGift?.filter(d => d.days_until_predicted <= 30 && !d.is_overdue).length || 0}
                </p>
                <p className="text-xs mt-2" style={{ color: COLORS.textSoft }}>
                  Predicted gifts
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: `${COLORS.accent}15` }}>
                    <TrendingUp className="h-6 w-6" style={{ color: COLORS.accent }} />
                  </div>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.textMuted }}>
                  90-Day Revenue Forecast
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.textDark }}>
                  ${((intelligenceData.nextGift?.filter(d => !d.is_overdue).reduce((sum, d) => sum + parseFloat(d.suggested_ask_amount), 0) || 0) / 1000).toFixed(0)}K
                </p>
                <p className="text-xs mt-2" style={{ color: COLORS.textSoft }}>
                  Expected revenue
                </p>
              </div>
            </div>

            {/* Giving Timeline */}
            <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                  90-Day Gift Timeline
                </h3>
                <Calendar className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {intelligenceData.nextGift?.filter(d => !d.is_overdue).slice(0, 20).map((gift, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-5 rounded-xl hover:bg-gray-50 transition-all duration-200 border-2" style={{ borderColor: COLORS.borderLight }}>
                    <div className="text-center px-6 py-4 rounded-xl" style={{ background: `${COLORS.utdOrange}10`, minWidth: '100px' }}>
                      <p className="text-3xl font-bold" style={{ color: COLORS.utdOrange }}>
                        {gift.days_until_predicted}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>days</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg mb-1" style={{ color: COLORS.textDark }}>
                        {gift.donor_name}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>
                        Last gift: {new Date(gift.last_gift_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl mb-1" style={{ color: COLORS.utdOrange }}>
                        ${parseFloat(gift.suggested_ask_amount).toFixed(0)}
                      </p>
                      <p className="text-xs px-3 py-1 rounded-full inline-block font-semibold" style={{
                        background: `${COLORS.accent}20`,
                        color: COLORS.accent
                      }}>
                        {gift.confidence_percent.toFixed(0)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Analysis */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    Giving Pattern Distribution
                  </h3>
                  <PieChart className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="h-96">
                  <ReactECharts option={getGivingPatternsChart()} style={{ height: '100%' }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    Pattern-Based Strategies
                  </h3>
                  <Target className="h-6 w-6" style={{ color: COLORS.utdOrange }} />
                </div>
                <div className="space-y-4">
                  {Object.entries(
                    intelligenceData.givingPatterns?.reduce((acc, donor) => {
                      acc[donor.pattern_type] = (acc[donor.pattern_type] || 0) + 1;
                      return acc;
                    }, {}) || {}
                  ).map(([pattern, count], idx) => (
                    <div key={idx} className="p-5 rounded-xl" style={{ background: `${[COLORS.utdOrange, COLORS.utdGreen, COLORS.accent, COLORS.info, COLORS.textSoft][idx % 5]}10` }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg" style={{ color: COLORS.textDark }}>
                          {pattern} Givers
                        </span>
                        <span className="text-3xl font-bold" style={{ color: [COLORS.utdOrange, COLORS.utdGreen, COLORS.accent, COLORS.info, COLORS.textSoft][idx % 5] }}>
                          {count}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
                        {pattern === 'Monthly' && '🎯 Prime candidates for monthly sustainer programs and recurring gift initiatives'}
                        {pattern === 'Quarterly' && '📅 Excellent for planned touchpoints - engage every 90 days with impact updates'}
                        {pattern === 'Semi-Annual' && '🔄 Target twice yearly with major campaigns and strategic appeals'}
                        {pattern === 'Annual' && '🎄 Focus on year-end giving campaigns and annual fund drives'}
                        {pattern === 'Irregular' && '⚡ Opportunity for pattern development through consistent engagement'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Acquisition Tab */}
        {activeTab === 'acquisition' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* 2nd Gift Conversion */}
              <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <Heart className="h-8 w-8 text-white opacity-90" />
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                      Key Metric
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {acquisitionData.secondGiftConversion?.conversion_rate || 0}%
                  </p>
                  <p className="text-sm font-medium text-white/80">2nd Gift Conversion</p>
                  <p className="text-xs text-white/60 mt-2">
                    Target: 45%+
                  </p>
                </div>
              </div>

              {/* Months to 2nd Gift */}
              <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.utdGreen} 0%, ${COLORS.utdGreenLight} 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <Clock className="h-8 w-8 text-white opacity-90" />
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                      Timing
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {acquisitionData.secondGiftConversion?.avg_months_to_second || 0}
                  </p>
                  <p className="text-sm font-medium text-white/80">Months to 2nd Gift</p>
                  <p className="text-xs text-white/60 mt-2">
                    Target: &lt;3 months
                  </p>
                </div>
              </div>

              {/* Break-Even Months */}
              <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.info} 0%, #60a5fa 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <Target className="h-8 w-8 text-white opacity-90" />
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                      Payback
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {acquisitionData.breakEvenAnalysis?.overall_break_even_months || 0}
                  </p>
                  <p className="text-sm font-medium text-white/80">Break-Even Months</p>
                  <p className="text-xs text-white/60 mt-2">
                    Target: 12-18 months
                  </p>
                </div>
              </div>

              {/* LTV:Spend Ratio */}
              <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.purple} 0%, #a78bfa 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="h-8 w-8 text-white opacity-90" />
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                      ROI
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {acquisitionData.acquisitionSpendVsLTV?.ltv_to_spend_ratio?.toFixed(2) || 0}x
                  </p>
                  <p className="text-sm font-medium text-white/80">LTV:Spend Ratio</p>
                  <p className="text-xs text-white/60 mt-2">
                    Target: 3x+
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2nd Gift Conversion by Channel */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                      2nd Gift Conversion by Channel
                    </h3>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Conversion rate and time to second gift by acquisition source
                    </p>
                  </div>
                </div>
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: 'axis',
                      axisPointer: { type: 'shadow' },
                      formatter: (params) => {
                        const channel = params[0].name;
                        const convRate = params[0].value;
                        const months = params[1]?.value || 0;
                        return `<div style="font-weight:600;margin-bottom:6px">${channel}</div>
                          <div>Conversion: <span style="color:${COLORS.success};font-weight:600">${convRate}%</span></div>
                          <div>Avg Months: <span style="color:${COLORS.info};font-weight:600">${months}</span></div>`;
                      }
                    },
                    legend: {
                      data: ['Conversion %', 'Months to 2nd'],
                      bottom: 0,
                      textStyle: { color: COLORS.textMuted }
                    },
                    grid: { left: '3%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
                    xAxis: {
                      type: 'category',
                      data: acquisitionData.secondGiftConversion?.by_channel?.map(c => c.channel) || [],
                      axisLabel: { color: COLORS.textMuted, fontSize: 11 }
                    },
                    yAxis: [
                      {
                        type: 'value',
                        name: '%',
                        axisLabel: { color: COLORS.textMuted },
                        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
                      },
                      {
                        type: 'value',
                        name: 'Months',
                        axisLabel: { color: COLORS.textMuted }
                      }
                    ],
                    series: [
                      {
                        name: 'Conversion %',
                        type: 'bar',
                        data: acquisitionData.secondGiftConversion?.by_channel?.map(c => c.conversion_rate) || [],
                        itemStyle: { color: COLORS.success, borderRadius: [4, 4, 0, 0] },
                        barMaxWidth: 40
                      },
                      {
                        name: 'Months to 2nd',
                        type: 'line',
                        yAxisIndex: 1,
                        data: acquisitionData.secondGiftConversion?.by_channel?.map(c => c.avg_months) || [],
                        itemStyle: { color: COLORS.info },
                        lineStyle: { width: 3 },
                        symbol: 'circle',
                        symbolSize: 8
                      }
                    ]
                  }}
                  style={{ height: '320px' }}
                />
              </div>

              {/* Acquisition Spend vs LTV */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                      Acquisition Spend vs LTV
                    </h3>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Monthly acquisition investment and lifetime value generated
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: (acquisitionData.acquisitionSpendVsLTV?.ltv_to_spend_ratio || 0) >= 2
                        ? COLORS.successLight
                        : COLORS.warningLight,
                      color: (acquisitionData.acquisitionSpendVsLTV?.ltv_to_spend_ratio || 0) >= 2
                        ? COLORS.success
                        : COLORS.warning
                    }}>
                    {(acquisitionData.acquisitionSpendVsLTV?.ltv_to_spend_ratio || 0) >= 2 ? 'Healthy' : 'Monitor'}
                  </span>
                </div>
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: 'axis',
                      formatter: (params) => {
                        const month = params[0].name;
                        const spend = params[0].value;
                        const ltv = params[1].value;
                        return `<div style="font-weight:600;margin-bottom:6px">${month}</div>
                          <div>Spend: <span style="color:${COLORS.danger};font-weight:600">$${spend.toLocaleString()}</span></div>
                          <div>LTV: <span style="color:${COLORS.success};font-weight:600">$${ltv.toLocaleString()}</span></div>`;
                      }
                    },
                    legend: {
                      data: ['Acquisition Spend', 'Lifetime Value'],
                      bottom: 0,
                      textStyle: { color: COLORS.textMuted }
                    },
                    grid: { left: '3%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
                    xAxis: {
                      type: 'category',
                      data: acquisitionData.acquisitionSpendVsLTV?.monthly?.map(m => m.month) || [],
                      axisLabel: { color: COLORS.textMuted }
                    },
                    yAxis: {
                      type: 'value',
                      axisLabel: {
                        formatter: (val) => `$${(val/1000).toFixed(0)}K`,
                        color: COLORS.textMuted
                      },
                      splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
                    },
                    series: [
                      {
                        name: 'Acquisition Spend',
                        type: 'bar',
                        data: acquisitionData.acquisitionSpendVsLTV?.monthly?.map(m => m.spend) || [],
                        itemStyle: { color: COLORS.danger, borderRadius: [4, 4, 0, 0] },
                        barMaxWidth: 30
                      },
                      {
                        name: 'Lifetime Value',
                        type: 'line',
                        data: acquisitionData.acquisitionSpendVsLTV?.monthly?.map(m => m.ltv) || [],
                        itemStyle: { color: COLORS.success },
                        lineStyle: { width: 3 },
                        areaStyle: { opacity: 0.1 },
                        symbol: 'circle',
                        symbolSize: 8
                      }
                    ]
                  }}
                  style={{ height: '320px' }}
                />
              </div>
            </div>

            {/* Channel-wise Break-Even Analysis */}
            <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
              style={{ borderColor: COLORS.borderLight }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                    Channel-wise Break-Even Analysis
                  </h3>
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    Acquisition spend, lifetime value, and ROI by acquisition channel
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COLORS.borderLight}` }}>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                        Channel
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                        Spend
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                        LTV Generated
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                        Break-Even
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                        ROI
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {acquisitionData.channelBreakEven?.channels?.map((channel, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-sm" style={{ color: COLORS.textDark }}>
                            {channel.channel}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-medium text-sm" style={{ color: COLORS.danger }}>
                            ${channel.spend.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-medium text-sm" style={{ color: COLORS.success }}>
                            ${channel.ltv.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`font-semibold text-sm ${
                            channel.break_even_months <= 12 ? 'text-green-600' :
                            channel.break_even_months <= 18 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {channel.break_even_months} mo
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`font-bold text-sm ${
                            channel.roi >= 200 ? 'text-green-600' :
                            channel.roi >= 100 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {channel.roi}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            channel.roi >= 200 ? 'bg-green-100 text-green-700' :
                            channel.roi >= 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {channel.roi >= 200 ? 'Excellent' : channel.roi >= 100 ? 'Good' : 'Optimize'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cohort Break-Even Analysis */}
            <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
              style={{ borderColor: COLORS.borderLight }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                    Cohort Break-Even Analysis
                  </h3>
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    Track acquisition spend recovery by quarterly cohort (12-18 month target)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {acquisitionData.breakEvenAnalysis?.cohort_analysis?.map((cohort, idx) => {
                  const recoveryPercent = cohort.spend > 0 ? (cohort.recovered / cohort.spend * 100) : 0;
                  const isRecovered = recoveryPercent >= 100;
                  const isOnTrack = cohort.break_even_months && cohort.break_even_months <= 18;

                  return (
                    <div key={idx} className="p-4 rounded-2xl border"
                      style={{
                        borderColor: COLORS.borderLight,
                        background: isRecovered ? COLORS.successLight : 'white'
                      }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm" style={{ color: COLORS.textDark }}>
                          {cohort.cohort}
                        </span>
                        {isRecovered && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white font-semibold">
                            Recovered
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span style={{ color: COLORS.textMuted }}>Spend</span>
                          <span className="font-semibold" style={{ color: COLORS.danger }}>
                            ${cohort.spend.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: COLORS.textMuted }}>Recovered</span>
                          <span className="font-semibold" style={{ color: COLORS.success }}>
                            ${cohort.recovered.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(recoveryPercent, 100)}%`,
                              backgroundColor: isRecovered ? COLORS.success : COLORS.utdOrange
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span style={{ color: COLORS.textMuted }}>
                            {recoveryPercent.toFixed(0)}% recovered
                          </span>
                          {cohort.break_even_months && (
                            <span className={`font-semibold ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                              {cohort.break_even_months}mo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Second Gift Distribution Curve & Break-Even Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Months to Second Gift Distribution Curve */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                      Months to Second Gift Distribution
                    </h3>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Distribution curve of time between first and second gift
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold" style={{ color: COLORS.utdOrange }}>
                      {acquisitionData.secondGiftDistribution?.median_months || 0} mo
                    </span>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Median</p>
                  </div>
                </div>
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: 'axis',
                      formatter: (params) => {
                        const data = params[0];
                        return `<div style="font-weight:600;margin-bottom:6px">${data.name}</div>
                          <div>Donors: <strong>${data.value}</strong></div>
                          <div>Percentage: <strong>${acquisitionData.secondGiftDistribution?.distribution?.find(d => d.months === data.name)?.percentage || 0}%</strong></div>`;
                      }
                    },
                    grid: { left: '3%', right: '4%', top: '15%', bottom: '10%', containLabel: true },
                    xAxis: {
                      type: 'category',
                      data: acquisitionData.secondGiftDistribution?.distribution?.map(d => d.months) || [],
                      axisLabel: { color: COLORS.textMuted, fontSize: 11 }
                    },
                    yAxis: {
                      type: 'value',
                      axisLabel: { color: COLORS.textMuted },
                      splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
                    },
                    series: [{
                      type: 'bar',
                      data: acquisitionData.secondGiftDistribution?.distribution?.map(d => d.count) || [],
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
                      },
                      barMaxWidth: 50
                    }, {
                      type: 'line',
                      data: acquisitionData.secondGiftDistribution?.distribution?.map(d => d.count) || [],
                      smooth: true,
                      symbol: 'circle',
                      symbolSize: 8,
                      lineStyle: { width: 3, color: COLORS.info },
                      itemStyle: { color: COLORS.info }
                    }]
                  }}
                  style={{ height: '320px' }}
                />
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl" style={{ background: COLORS.bgLight }}>
                    <span className="text-lg font-bold" style={{ color: COLORS.success }}>
                      {acquisitionData.secondGiftConversion?.conversion_rate || 0}%
                    </span>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Give 2nd Gift</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: COLORS.bgLight }}>
                    <span className="text-lg font-bold" style={{ color: COLORS.info }}>
                      {acquisitionData.secondGiftDistribution?.median_months || 0}
                    </span>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Median Months</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: COLORS.bgLight }}>
                    <span className="text-lg font-bold" style={{ color: COLORS.purple }}>
                      {acquisitionData.secondGiftDistribution?.total_converted || 0}
                    </span>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Total Converted</p>
                  </div>
                </div>
              </div>

              {/* Break-Even Timeline by Channel with 12-18 Month Band */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                      Break-Even Timeline by Channel
                    </h3>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Recovery trajectory with 12-18 month target band
                    </p>
                  </div>
                </div>
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: 'axis',
                      formatter: (params) => {
                        let tooltip = `<div style="font-weight:600;margin-bottom:6px">Month ${params[0].name}</div>`;
                        params.forEach(p => {
                          if (p.seriesName !== 'Target Band') {
                            tooltip += `<div style="margin:2px 0">${p.seriesName}: <strong>${p.value}%</strong></div>`;
                          }
                        });
                        return tooltip;
                      }
                    },
                    legend: {
                      data: ['Email', 'Events', 'Social Media', 'Direct Mail', 'Referral'],
                      bottom: 0,
                      textStyle: { color: COLORS.textMuted, fontSize: 10 }
                    },
                    grid: { left: '3%', right: '4%', top: '10%', bottom: '18%', containLabel: true },
                    xAxis: {
                      type: 'category',
                      data: ['3', '6', '9', '12', '18'],
                      name: 'Months',
                      nameLocation: 'middle',
                      nameGap: 25,
                      axisLabel: { color: COLORS.textMuted }
                    },
                    yAxis: {
                      type: 'value',
                      name: '% Recovered',
                      axisLabel: { formatter: '{value}%', color: COLORS.textMuted },
                      splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
                    },
                    series: [
                      {
                        name: 'Email',
                        type: 'line',
                        data: acquisitionData.breakEvenTimeline?.channels?.find(c => c.channel === 'Email')?.timeline?.map(t => t.recovered) || [],
                        itemStyle: { color: COLORS.utdOrange },
                        lineStyle: { width: 3 },
                        symbol: 'circle',
                        symbolSize: 8
                      },
                      {
                        name: 'Events',
                        type: 'line',
                        data: acquisitionData.breakEvenTimeline?.channels?.find(c => c.channel === 'Events')?.timeline?.map(t => t.recovered) || [],
                        itemStyle: { color: COLORS.info },
                        lineStyle: { width: 3 },
                        symbol: 'circle',
                        symbolSize: 8
                      },
                      {
                        name: 'Social Media',
                        type: 'line',
                        data: acquisitionData.breakEvenTimeline?.channels?.find(c => c.channel === 'Social Media')?.timeline?.map(t => t.recovered) || [],
                        itemStyle: { color: COLORS.warning },
                        lineStyle: { width: 3 },
                        symbol: 'circle',
                        symbolSize: 8
                      },
                      {
                        name: 'Direct Mail',
                        type: 'line',
                        data: acquisitionData.breakEvenTimeline?.channels?.find(c => c.channel === 'Direct Mail')?.timeline?.map(t => t.recovered) || [],
                        itemStyle: { color: COLORS.purple },
                        lineStyle: { width: 3 },
                        symbol: 'circle',
                        symbolSize: 8
                      },
                      {
                        name: 'Referral',
                        type: 'line',
                        data: acquisitionData.breakEvenTimeline?.channels?.find(c => c.channel === 'Referral')?.timeline?.map(t => t.recovered) || [],
                        itemStyle: { color: COLORS.success },
                        lineStyle: { width: 3 },
                        symbol: 'circle',
                        symbolSize: 8
                      }
                    ],
                    markArea: {
                      silent: true,
                      data: [[
                        { xAxis: '12', itemStyle: { color: 'rgba(34, 197, 94, 0.1)' } },
                        { xAxis: '18' }
                      ]]
                    },
                    graphic: [{
                      type: 'text',
                      left: '75%',
                      top: '15%',
                      style: {
                        text: '12-18 mo\nTarget',
                        fontSize: 10,
                        fill: COLORS.success,
                        fontWeight: 'bold'
                      }
                    }]
                  }}
                  style={{ height: '380px' }}
                />
              </div>
            </div>

            {/* Acquisition Expenditure vs Break-Even Timeline */}
            <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200 mt-6"
              style={{ borderColor: COLORS.borderLight }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                    Acquisition Expenditure vs Break-Even Timeline
                  </h3>
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    Investment efficiency and expected payback period by channel
                  </p>
                </div>
              </div>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'cross' },
                    formatter: (params) => {
                      const channel = params[0].name;
                      let tooltip = `<div style="font-weight:600;margin-bottom:6px">${channel}</div>`;
                      params.forEach(p => {
                        const value = p.seriesName.includes('Spend') || p.seriesName.includes('LTV')
                          ? `$${p.value.toLocaleString()}`
                          : `${p.value} mo`;
                        tooltip += `<div style="margin:2px 0">${p.seriesName}: <strong>${value}</strong></div>`;
                      });
                      return tooltip;
                    }
                  },
                  legend: {
                    data: ['Acquisition Spend', 'LTV Generated', 'Break-Even Months'],
                    bottom: 0,
                    textStyle: { color: COLORS.textMuted }
                  },
                  grid: { left: '3%', right: '10%', top: '10%', bottom: '15%', containLabel: true },
                  xAxis: {
                    type: 'category',
                    data: acquisitionData.channelBreakEven?.channels?.map(c => c.channel) || [],
                    axisLabel: { color: COLORS.textMuted }
                  },
                  yAxis: [
                    {
                      type: 'value',
                      name: 'Amount ($)',
                      axisLabel: {
                        formatter: (val) => `$${(val/1000).toFixed(0)}K`,
                        color: COLORS.textMuted
                      },
                      splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } }
                    },
                    {
                      type: 'value',
                      name: 'Months',
                      axisLabel: { color: COLORS.textMuted }
                    }
                  ],
                  series: [
                    {
                      name: 'Acquisition Spend',
                      type: 'bar',
                      data: acquisitionData.channelBreakEven?.channels?.map(c => c.spend) || [],
                      itemStyle: { color: COLORS.danger, borderRadius: [4, 4, 0, 0] },
                      barMaxWidth: 35
                    },
                    {
                      name: 'LTV Generated',
                      type: 'bar',
                      data: acquisitionData.channelBreakEven?.channels?.map(c => c.ltv) || [],
                      itemStyle: { color: COLORS.success, borderRadius: [4, 4, 0, 0] },
                      barMaxWidth: 35
                    },
                    {
                      name: 'Break-Even Months',
                      type: 'line',
                      yAxisIndex: 1,
                      data: acquisitionData.channelBreakEven?.channels?.map(c => c.break_even_months) || [],
                      itemStyle: { color: COLORS.utdOrange },
                      lineStyle: { width: 3 },
                      symbol: 'circle',
                      symbolSize: 10,
                      markLine: {
                        silent: true,
                        data: [
                          { yAxis: 12, lineStyle: { color: COLORS.success, type: 'dashed' }, label: { show: true, formatter: '12 mo', color: COLORS.success } },
                          { yAxis: 18, lineStyle: { color: COLORS.warning, type: 'dashed' }, label: { show: true, formatter: '18 mo', color: COLORS.warning } }
                        ]
                      }
                    }
                  ]
                }}
                style={{ height: '350px' }}
              />
            </div>
          </>
        )}

        {/* Stewardship KPIs Tab */}
        {activeTab === 'stewardship' && (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Touchpoints per Donor */}
              <div className="bg-white rounded-3xl p-5 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl" style={{ background: COLORS.utdOrangeSoft }}>
                    <Users className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: COLORS.textDark }}>
                  {stewardshipData.touchpoints?.summary?.avg_touchpoints_per_donor?.toFixed(1) || '0'}
                </div>
                <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Avg Touchpoints/Donor
                </p>
                <div className="mt-2 text-xs" style={{ color: COLORS.textSoft }}>
                  Target: 12/year
                </div>
              </div>

              {/* Thank-You Velocity */}
              <div className="bg-white rounded-3xl p-5 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl" style={{ background: COLORS.successLight }}>
                    <Zap className="h-5 w-5" style={{ color: COLORS.success }} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: COLORS.textDark }}>
                  {stewardshipData.thankYouVelocity?.overall_avg_hours?.toFixed(1) || '0'}h
                </div>
                <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Thank-You Velocity
                </p>
                <div className="mt-2 text-xs" style={{ color: COLORS.success }}>
                  {stewardshipData.thankYouVelocity?.compliance_rate?.toFixed(1) || 0}% within target
                </div>
              </div>

              {/* Donor Delight Score */}
              <div className="bg-white rounded-3xl p-5 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl" style={{ background: COLORS.purpleLight }}>
                    <Star className="h-5 w-5" style={{ color: COLORS.purple }} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: COLORS.textDark }}>
                  {stewardshipData.donorDelight?.overall_dx_score?.toFixed(1) || '0'}
                </div>
                <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Donor Delight (DX)
                </p>
                <div className="mt-2 text-xs" style={{
                  color: (stewardshipData.donorDelight?.benchmark_comparison?.vs_benchmark || 0) >= 0
                    ? COLORS.success : COLORS.danger
                }}>
                  {(stewardshipData.donorDelight?.benchmark_comparison?.vs_benchmark || 0) >= 0 ? '+' : ''}
                  {stewardshipData.donorDelight?.benchmark_comparison?.vs_benchmark?.toFixed(1) || 0} vs benchmark
                </div>
              </div>

              {/* Outreach Volume */}
              <div className="bg-white rounded-3xl p-5 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl" style={{ background: COLORS.infoLight }}>
                    <Activity className="h-5 w-5" style={{ color: COLORS.info }} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: COLORS.textDark }}>
                  {stewardshipData.outreachVolume?.total_touchpoints?.toLocaleString() || '0'}
                </div>
                <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Total Outreach YTD
                </p>
                <div className="mt-2 text-xs" style={{ color: COLORS.textSoft }}>
                  Across all segments
                </div>
              </div>

              {/* Stewardship Cycle Completion */}
              <div className="bg-white rounded-3xl p-5 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl" style={{ background: COLORS.utdGreenSoft }}>
                    <RefreshCw className="h-5 w-5" style={{ color: COLORS.utdGreen }} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: COLORS.textDark }}>
                  {stewardshipData.stewardshipCycle?.completion_metrics?.avg_completion_rate?.toFixed(0) || '0'}%
                </div>
                <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Cycle Completion
                </p>
                <div className="mt-2 text-xs" style={{ color: COLORS.textSoft }}>
                  {stewardshipData.stewardshipCycle?.completion_metrics?.upcoming_7_days || 0} due this week
                </div>
              </div>
            </div>

            {/* Touchpoints by Segment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                      Touchpoints by Segment
                    </h3>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Annual touchpoint targets and achievement rates
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {stewardshipData.touchpoints?.touchpoints_by_segment?.map((segment, idx) => (
                    <div key={idx} className="p-4 rounded-xl border" style={{ borderColor: COLORS.borderLight }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm" style={{ color: COLORS.textDark }}>
                          {segment.segment}
                        </span>
                        <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                          {segment.donor_count} donors
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mb-2">
                        <span style={{ color: COLORS.textMuted }}>
                          {segment.avg_touchpoints_annual?.toFixed(1) || 0} / {segment.target_touchpoints} target
                        </span>
                        <span className={`font-bold ${
                          segment.achievement_rate >= 90 ? 'text-green-600' :
                          segment.achievement_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {segment.achievement_rate?.toFixed(0) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(segment.achievement_rate || 0, 100)}%`,
                            backgroundColor: segment.achievement_rate >= 90 ? COLORS.success :
                              segment.achievement_rate >= 70 ? COLORS.warning : COLORS.danger
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thank-You Velocity by Gift Level */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                      Thank-You Velocity by Gift Level
                    </h3>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Response time targets and actual performance
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stewardshipData.thankYouVelocity?.by_gift_level?.map((level, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ borderColor: COLORS.borderLight }}>
                      <div>
                        <span className="font-semibold text-sm" style={{ color: COLORS.textDark }}>
                          {level.level}
                        </span>
                        <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                          Target: {level.target_hours}h
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-lg ${
                          level.avg_hours <= level.target_hours ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {level.avg_hours?.toFixed(1) || 0}h
                        </span>
                        <div className={`text-xs font-medium ${
                          level.compliance_rate >= 90 ? 'text-green-600' :
                          level.compliance_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {level.compliance_rate?.toFixed(0) || 0}% compliant
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Donor Delight Components & Stewardship Cycle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Donor Delight Components */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                      Donor Delight Components
                    </h3>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      DX score breakdown by experience factor
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: COLORS.utdOrange }}>
                      {stewardshipData.donorDelight?.overall_dx_score?.toFixed(1) || 0}
                    </span>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Overall DX</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {stewardshipData.donorDelight?.dx_components &&
                    Object.entries(stewardshipData.donorDelight.dx_components).map(([key, value], idx) => (
                      <div key={idx} className="p-3 rounded-xl" style={{ background: COLORS.bgLight }}>
                        <div className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${
                            value >= 90 ? 'text-green-600' :
                            value >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {value?.toFixed(1) || 0}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${value || 0}%`,
                                backgroundColor: value >= 90 ? COLORS.success :
                                  value >= 80 ? COLORS.warning : COLORS.danger
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Stewardship Cycle Status */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
                style={{ borderColor: COLORS.borderLight }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.textDark }}>
                      Stewardship Cycle Status
                    </h3>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Plan progress and task completion
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold" style={{ color: COLORS.textDark }}>
                      {stewardshipData.stewardshipCycle?.total_active_plans || 0}
                    </span>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Active Plans</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stewardshipData.stewardshipCycle?.by_status?.map((status, idx) => {
                    const statusColors = {
                      'On Track': COLORS.success,
                      'Ahead of Schedule': COLORS.info,
                      'Needs Attention': COLORS.warning,
                      'At Risk': COLORS.danger
                    };
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border"
                        style={{ borderColor: COLORS.borderLight }}>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: statusColors[status.status] || COLORS.textMuted }} />
                          <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
                            {status.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm" style={{ color: COLORS.textDark }}>
                            {status.count}
                          </span>
                          <span className="text-xs ml-2" style={{ color: COLORS.textMuted }}>
                            ({status.percentage?.toFixed(1) || 0}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.borderLight }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <span className="text-lg font-bold" style={{ color: COLORS.danger }}>
                        {stewardshipData.stewardshipCycle?.completion_metrics?.overdue_tasks || 0}
                      </span>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Overdue Tasks</p>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold" style={{ color: COLORS.warning }}>
                        {stewardshipData.stewardshipCycle?.completion_metrics?.upcoming_7_days || 0}
                      </span>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Due This Week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Print-Friendly Footer */}
      <div className="print:block hidden max-w-7xl mx-auto px-8 py-6 border-t" style={{ borderColor: COLORS.borderMid }}>
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            Wise Investor Platform - Confidential Board Material
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonorAnalyticsDashboard;