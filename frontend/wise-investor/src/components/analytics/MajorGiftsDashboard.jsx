import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReactECharts from 'echarts-for-react';
import {
  Award, TrendingUp, DollarSign, Users, Target, Clock,
  ArrowUp, ArrowDown, Calendar, Filter, Download, RefreshCw,
  Star, CheckCircle, AlertCircle, ChevronRight, Activity
} from 'lucide-react';

// UT Dallas Color Palette
const COLORS = {
  primary: '#e87500',
  secondary: '#154734',
  accent: '#5fe0b7',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  info: '#3b82f6',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

const MajorGiftsDashboard = () => {
  const { getToken } = useAuth();
  const organizationId = '772effb4-35a3-40c6-8555-4d8c732cf656';

  const [dashboardData, setDashboardData] = useState({
    pipelineOverview: null,
    prospects: null,
    movesPipeline: null,
    giftTrends: null,
    loading: true,
    error: null
  });

  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    fetchMajorGiftsData();
  }, []);

  const fetchMajorGiftsData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      const baseUrl = '';

      const [pipelineRes, prospectsRes, movesRes, trendsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/major-gifts/pipeline/${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${baseUrl}/api/v1/analytics/major-gifts/prospects/${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${baseUrl}/api/v1/analytics/major-gifts/moves/${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${baseUrl}/api/v1/analytics/major-gifts/trends/${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!pipelineRes.ok || !prospectsRes.ok || !movesRes.ok || !trendsRes.ok) {
        throw new Error('Failed to fetch major gifts data');
      }

      const [pipelineOverview, prospects, movesPipeline, giftTrends] = await Promise.all([
        pipelineRes.json(),
        prospectsRes.json(),
        movesRes.json(),
        trendsRes.json()
      ]);

      setDashboardData({
        pipelineOverview,
        prospects,
        movesPipeline,
        giftTrends,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching major gifts data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Pipeline Funnel Chart - Using API Data
  const getPipelineFunnelChart = () => {
    if (!dashboardData.pipelineOverview?.stages) return {};

    const stages = dashboardData.pipelineOverview.stages;

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ${c}K ({d}%)'
      },
      series: [{
        type: 'funnel',
        left: '10%',
        width: '80%',
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n${c}K',
          color: '#fff',
          fontSize: 13,
          fontWeight: '600'
        },
        labelLine: {
          show: false
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          label: {
            fontSize: 16
          }
        },
        data: stages.map((stage, idx) => ({
          value: stage.total_amount / 1000, // Convert to K
          name: stage.stage_name,
          itemStyle: {
            color: [
              COLORS.primary,
              COLORS.secondary,
              COLORS.accent,
              COLORS.info,
              COLORS.success
            ][idx % 5]
          }
        })).sort((a, b) => b.value - a.value)
      }]
    };
  };

  // Gift Size Distribution - Using API Data
  const getGiftSizeDistributionChart = () => {
    if (!dashboardData.prospects?.gift_size_distribution) return {};

    const distribution = dashboardData.prospects.gift_size_distribution;

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} prospects ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: COLORS.gray[700] }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: COLORS.gray[700]
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: distribution.map((item, idx) => ({
          value: item.prospect_count,
          name: item.gift_range,
          itemStyle: {
            color: [
              COLORS.primary,
              COLORS.secondary,
              COLORS.accent,
              COLORS.info,
              COLORS.success,
              COLORS.warning
            ][idx % 6]
          }
        }))
      }]
    };
  };

  // Moves Management Timeline - Using API Data
  const getMovesTimelineChart = () => {
    if (!dashboardData.movesPipeline?.timeline) return {};

    const timeline = dashboardData.movesPipeline.timeline;
    const months = timeline.map(t => t.month);
    const moves = timeline.map(t => t.moves_count);
    const solicitations = timeline.map(t => t.solicitations_count);
    const closed = timeline.map(t => t.closed_count);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Moves', 'Solicitations', 'Closed'],
        textStyle: { color: COLORS.gray[700] }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: COLORS.gray[600] }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: COLORS.gray[600] }
      },
      series: [
        {
          name: 'Moves',
          type: 'bar',
          stack: 'total',
          data: moves,
          itemStyle: {
            color: COLORS.accent,
            borderRadius: [0, 0, 0, 0]
          }
        },
        {
          name: 'Solicitations',
          type: 'bar',
          stack: 'total',
          data: solicitations,
          itemStyle: {
            color: COLORS.info,
            borderRadius: [0, 0, 0, 0]
          }
        },
        {
          name: 'Closed',
          type: 'bar',
          stack: 'total',
          data: closed,
          itemStyle: {
            color: COLORS.success,
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  };

  // Gift Trends - Using API Data
  const getGiftTrendsChart = () => {
    if (!dashboardData.giftTrends?.trends) return {};

    const trends = dashboardData.giftTrends.trends;
    const months = trends.map(t => t.month);
    const amounts = trends.map(t => t.total_amount / 1000); // Convert to K
    const counts = trends.map(t => t.gift_count);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          return `${params[0].name}<br/>
                  Amount: $${params[0].value}K<br/>
                  Count: ${params[1].value}`;
        }
      },
      legend: {
        data: ['Gift Amount ($K)', 'Gift Count'],
        textStyle: { color: COLORS.gray[700] }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: COLORS.gray[600] }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Amount ($K)',
          axisLabel: {
            color: COLORS.gray[600],
            formatter: '${value}K'
          }
        },
        {
          type: 'value',
          name: 'Count',
          axisLabel: { color: COLORS.gray[600] }
        }
      ],
      series: [
        {
          name: 'Gift Amount ($K)',
          type: 'line',
          smooth: true,
          data: amounts,
          itemStyle: { color: COLORS.primary },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(232, 117, 0, 0.3)' },
                { offset: 1, color: 'rgba(232, 117, 0, 0.05)' }
              ]
            }
          },
          lineStyle: { width: 3 }
        },
        {
          name: 'Gift Count',
          type: 'bar',
          yAxisIndex: 1,
          data: counts,
          itemStyle: {
            color: COLORS.secondary,
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  };

  // Calculate Key Metrics from API Data
  const calculateMetrics = () => {
    if (!dashboardData.pipelineOverview || !dashboardData.prospects) {
      return {
        totalPipeline: 0,
        activeProspects: 0,
        avgGiftSize: 0,
        closeRate: 0
      };
    }

    const totalPipeline = dashboardData.pipelineOverview.total_pipeline_value || 0;
    const activeProspects = dashboardData.prospects.active_prospects_count || 0;
    const avgGiftSize = parseFloat(dashboardData.prospects.avg_gift_size || 0);
    const closeRate = parseFloat(dashboardData.pipelineOverview.close_rate || 0);

    return {
      totalPipeline,
      activeProspects,
      avgGiftSize,
      closeRate
    };
  };

  const metrics = calculateMetrics();

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen" style={{ background: COLORS.gray[50] }}>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin" style={{ color: COLORS.primary }} />
          <span className="ml-3 text-lg" style={{ color: COLORS.gray[600] }}>Loading major gifts data...</span>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="min-h-screen" style={{ background: COLORS.gray[50] }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.danger }}>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6" style={{ color: COLORS.danger }} />
              <h3 className="text-lg font-semibold" style={{ color: COLORS.danger }}>
                Error Loading Data
              </h3>
            </div>
            <p style={{ color: COLORS.gray[600] }}>{dashboardData.error}</p>
            <button
              onClick={fetchMajorGiftsData}
              className="mt-4 px-4 py-2 rounded-lg font-medium"
              style={{
                background: COLORS.primary,
                color: 'white'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.gray[50] }}>
      {/* Header */}
      <div className="border-b" style={{
        background: 'white',
        borderColor: COLORS.gray[200]
      }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.gray[900] }}>
                Major Gifts Pipeline
              </h1>
              <p className="text-sm" style={{ color: COLORS.gray[600] }}>
                Track major gift prospects, pipeline, and moves management
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchMajorGiftsData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium hover:bg-gray-50"
                style={{ borderColor: COLORS.gray[300], color: COLORS.gray[700] }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white"
                      style={{ background: COLORS.primary }}>
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: `${COLORS.primary}15` }}>
                <Award className="h-6 w-6" style={{ color: COLORS.primary }} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: COLORS.success }}>
                <ArrowUp className="h-4 w-4" />
                Pipeline
              </div>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.gray[600] }}>
              Total Pipeline
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.gray[900] }}>
              ${(metrics.totalPipeline / 1000000).toFixed(2)}M
            </p>
            <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
              Potential major gifts
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: `${COLORS.secondary}15` }}>
                <Users className="h-6 w-6" style={{ color: COLORS.secondary }} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: COLORS.success }}>
                <ArrowUp className="h-4 w-4" />
                Active
              </div>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.gray[600] }}>
              Active Prospects
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.gray[900] }}>
              {metrics.activeProspects}
            </p>
            <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
              In cultivation
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: `${COLORS.accent}15` }}>
                <DollarSign className="h-6 w-6" style={{ color: COLORS.accent }} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: COLORS.success }}>
                <ArrowUp className="h-4 w-4" />
                Avg
              </div>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.gray[600] }}>
              Avg Gift Size
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.gray[900] }}>
              ${(metrics.avgGiftSize / 1000).toFixed(0)}K
            </p>
            <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
              Expected gift amount
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: `${COLORS.info}15` }}>
                <Target className="h-6 w-6" style={{ color: COLORS.info }} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: COLORS.success }}>
                <ArrowUp className="h-4 w-4" />
                Rate
              </div>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.gray[600] }}>
              Close Rate
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.gray[900] }}>
              {metrics.closeRate.toFixed(1)}%
            </p>
            <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
              Solicitation success
            </p>
          </div>
        </div>

        {/* Top Prospects - Using API Data */}
        {dashboardData.prospects?.top_prospects && (
          <div className="bg-white rounded-xl p-6 border mb-8" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Top Priority Prospects
            </h3>

            <div className="space-y-4">
              {dashboardData.prospects.top_prospects.map((prospect, idx) => {
                const stageColors = {
                  'Identification': COLORS.info,
                  'Qualification': COLORS.accent,
                  'Cultivation': COLORS.warning,
                  'Solicitation': COLORS.primary,
                  'Stewardship': COLORS.success
                };

                return (
                  <div key={prospect.id || idx} className="p-5 rounded-xl border hover:shadow-md transition-all cursor-pointer"
                       style={{ borderColor: COLORS.gray[200] }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold mb-1" style={{ color: COLORS.gray[800] }}>
                          {prospect.prospect_name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm" style={{ color: COLORS.gray[600] }}>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            Rating: {prospect.rating || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Next action: {prospect.next_action_days || 0} days
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                              style={{
                                background: `${stageColors[prospect.stage] || COLORS.gray[400]}20`,
                                color: stageColors[prospect.stage] || COLORS.gray[700]
                              }}>
                          {prospect.stage}
                        </span>
                        <ChevronRight className="h-5 w-5" style={{ color: COLORS.gray[400] }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
                          Expected Gift
                        </p>
                        <p className="text-xl font-bold" style={{ color: COLORS.gray[900] }}>
                          ${(prospect.expected_amount / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
                          Probability
                        </p>
                        <p className="text-xl font-bold" style={{ color: COLORS.gray[900] }}>
                          {prospect.probability || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
                          Gift Officer
                        </p>
                        <p className="text-sm" style={{ color: COLORS.gray[700] }}>
                          {prospect.gift_officer || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Pipeline by Stage
            </h3>
            <div className="h-80">
              <ReactECharts option={getPipelineFunnelChart()} style={{ height: '100%' }} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Gift Size Distribution
            </h3>
            <div className="h-80">
              <ReactECharts option={getGiftSizeDistributionChart()} style={{ height: '100%' }} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Moves Management Timeline
            </h3>
            <div className="h-80">
              <ReactECharts option={getMovesTimelineChart()} style={{ height: '100%' }} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Major Gift Trends
            </h3>
            <div className="h-80">
              <ReactECharts option={getGiftTrendsChart()} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MajorGiftsDashboard;