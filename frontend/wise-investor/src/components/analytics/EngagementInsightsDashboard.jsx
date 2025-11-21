import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReactECharts from 'echarts-for-react';
import {
  Activity, Mail, MousePointer, TrendingUp, Calendar, Users,
  ArrowUp, ArrowDown, RefreshCw, Download, Filter, Clock,
  Eye, MessageCircle, Share2, AlertCircle, Award
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

const EngagementInsightsDashboard = () => {
  const { getToken } = useAuth();
  const organizationId = '772effb4-35a3-40c6-8555-4d8c732cf656';

  const [dashboardData, setDashboardData] = useState({
    emailPerformance: null,
    eventEngagement: null,
    channelEffectiveness: null,
    touchpoints: null,
    loading: true,
    error: null
  });

  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchEngagementData();
  }, [timeRange]);

  const fetchEngagementData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      const baseUrl = '';

      const [emailRes, eventRes, channelRes, touchpointsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/engagement/email/${organizationId}?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${baseUrl}/api/v1/analytics/engagement/events/${organizationId}?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${baseUrl}/api/v1/analytics/engagement/channels/${organizationId}?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${baseUrl}/api/v1/analytics/engagement/touchpoints/${organizationId}?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!emailRes.ok || !eventRes.ok || !channelRes.ok || !touchpointsRes.ok) {
        throw new Error('Failed to fetch engagement data');
      }

      const [emailPerformance, eventEngagement, channelEffectiveness, touchpoints] = await Promise.all([
        emailRes.json(),
        eventRes.json(),
        channelRes.json(),
        touchpointsRes.json()
      ]);

      setDashboardData({
        emailPerformance,
        eventEngagement,
        channelEffectiveness,
        touchpoints,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Email Performance Trends - Using API Data
  const getEmailPerformanceChart = () => {
    if (!dashboardData.emailPerformance?.trends) return {};

    const trends = dashboardData.emailPerformance.trends;
    const dates = trends.map(t => t.date);
    const openRates = trends.map(t => parseFloat(t.open_rate));
    const clickRates = trends.map(t => parseFloat(t.click_rate));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          return `${params[0].name}<br/>
                  Open Rate: ${params[0].value}%<br/>
                  Click Rate: ${params[1].value}%`;
        }
      },
      legend: {
        data: ['Open Rate', 'Click Rate'],
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
        data: dates,
        axisLabel: { color: COLORS.gray[600] }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: COLORS.gray[600],
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: 'Open Rate',
          type: 'line',
          smooth: true,
          data: openRates,
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
          name: 'Click Rate',
          type: 'line',
          smooth: true,
          data: clickRates,
          itemStyle: { color: COLORS.secondary },
          lineStyle: { width: 3 }
        }
      ]
    };
  };

  // Event Attendance Chart - Using API Data
  const getEventAttendanceChart = () => {
    if (!dashboardData.eventEngagement?.events) return {};

    const events = dashboardData.eventEngagement.events;
    const names = events.map(e => e.event_name);
    const registered = events.map(e => e.registered_count);
    const attended = events.map(e => e.attended_count);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Registered', 'Attended'],
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
        data: names,
        axisLabel: {
          color: COLORS.gray[600],
          rotate: 15,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: COLORS.gray[600] }
      },
      series: [
        {
          name: 'Registered',
          type: 'bar',
          data: registered,
          itemStyle: {
            color: COLORS.gray[300],
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: 'Attended',
          type: 'bar',
          data: attended,
          itemStyle: {
            color: COLORS.accent,
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            color: COLORS.gray[700],
            fontSize: 11,
            fontWeight: '600'
          }
        }
      ]
    };
  };

  // Channel Effectiveness Chart - Using API Data
  const getChannelEffectivenessChart = () => {
    if (!dashboardData.channelEffectiveness?.channels) return {};

    const channels = dashboardData.channelEffectiveness.channels;

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} interactions ({d}%)'
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
        data: channels.map((channel, idx) => ({
          value: channel.interaction_count,
          name: channel.channel_name,
          itemStyle: {
            color: [
              COLORS.primary,
              COLORS.secondary,
              COLORS.accent,
              COLORS.info,
              COLORS.warning
            ][idx % 5]
          }
        }))
      }]
    };
  };

  // Touchpoint Heatmap - Using API Data
  const getTouchpointHeatmapChart = () => {
    if (!dashboardData.touchpoints?.heatmap) return {};

    const heatmap = dashboardData.touchpoints.heatmap;
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const data = heatmap.map(point => [
      point.hour,
      point.day_of_week,
      point.engagement_count
    ]);

    return {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          return `${days[params.value[1]]} ${hours[params.value[0]]}<br/>
                  Engagements: ${params.value[2]}`;
        }
      },
      grid: {
        height: '70%',
        top: '5%'
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: { show: true },
        axisLabel: { color: COLORS.gray[600] }
      },
      yAxis: {
        type: 'category',
        data: days,
        splitArea: { show: true },
        axisLabel: { color: COLORS.gray[600] }
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map(d => d[2])),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#f0f9ff', COLORS.primary]
        },
        textStyle: { color: COLORS.gray[700] }
      },
      series: [{
        type: 'heatmap',
        data: data,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  // Calculate Key Metrics from API Data
  const calculateMetrics = () => {
    if (!dashboardData.emailPerformance || !dashboardData.eventEngagement || !dashboardData.channelEffectiveness) {
      return {
        totalEngagements: 0,
        emailOpenRate: 0,
        eventAttendanceRate: 0,
        avgTouchpoints: 0
      };
    }

    const totalEngagements = dashboardData.channelEffectiveness.total_interactions || 0;
    const emailOpenRate = parseFloat(dashboardData.emailPerformance.avg_open_rate || 0);
    const eventAttendanceRate = parseFloat(dashboardData.eventEngagement.avg_attendance_rate || 0);
    const avgTouchpoints = parseFloat(dashboardData.touchpoints?.avg_touchpoints_per_donor || 0);

    return {
      totalEngagements,
      emailOpenRate,
      eventAttendanceRate,
      avgTouchpoints
    };
  };

  const metrics = calculateMetrics();

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen" style={{ background: COLORS.gray[50] }}>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin" style={{ color: COLORS.primary }} />
          <span className="ml-3 text-lg" style={{ color: COLORS.gray[600] }}>Loading engagement data...</span>
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
              onClick={fetchEngagementData}
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
                Engagement Insights
              </h1>
              <p className="text-sm" style={{ color: COLORS.gray[600] }}>
                Track donor engagement across all channels and touchpoints
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: COLORS.gray[300], color: COLORS.gray[700] }}
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <button
                onClick={fetchEngagementData}
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
                <Activity className="h-6 w-6" style={{ color: COLORS.primary }} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: COLORS.success }}>
                <ArrowUp className="h-4 w-4" />
                Total
              </div>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.gray[600] }}>
              Total Engagements
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.gray[900] }}>
              {metrics.totalEngagements.toLocaleString()}
            </p>
            <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
              Across all channels
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: `${COLORS.secondary}15` }}>
                <Mail className="h-6 w-6" style={{ color: COLORS.secondary }} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: COLORS.success }}>
                <ArrowUp className="h-4 w-4" />
                Rate
              </div>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.gray[600] }}>
              Email Open Rate
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.gray[900] }}>
              {metrics.emailOpenRate.toFixed(1)}%
            </p>
            <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
              Above industry avg
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: `${COLORS.accent}15` }}>
                <Users className="h-6 w-6" style={{ color: COLORS.accent }} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: COLORS.success }}>
                <ArrowUp className="h-4 w-4" />
                Events
              </div>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.gray[600] }}>
              Event Attendance
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.gray[900] }}>
              {metrics.eventAttendanceRate.toFixed(1)}%
            </p>
            <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
              Registration to attendance
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: `${COLORS.info}15` }}>
                <MousePointer className="h-6 w-6" style={{ color: COLORS.info }} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: COLORS.success }}>
                <ArrowUp className="h-4 w-4" />
                Avg
              </div>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.gray[600] }}>
              Avg Touchpoints
            </p>
            <p className="text-3xl font-bold" style={{ color: COLORS.gray[900] }}>
              {metrics.avgTouchpoints.toFixed(1)}
            </p>
            <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
              Per donor per month
            </p>
          </div>
        </div>

        {/* Top Performing Channels - Using API Data */}
        {dashboardData.channelEffectiveness?.channels && (
          <div className="bg-white rounded-xl p-6 border mb-8" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Channel Performance
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {dashboardData.channelEffectiveness.channels.slice(0, 6).map((channel, idx) => (
                <div key={channel.id || idx} className="p-4 rounded-xl border hover:shadow-md transition-all"
                     style={{ borderColor: COLORS.gray[200] }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold" style={{ color: COLORS.gray[800] }}>
                      {channel.channel_name}
                    </h4>
                    <Award className="h-5 w-5" style={{ color: COLORS.accent }} />
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: COLORS.gray[900] }}>
                    {channel.interaction_count.toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.gray[600] }}>
                    Engagement Rate: {parseFloat(channel.engagement_rate || 0).toFixed(1)}%
                  </p>
                  <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
                    Conversion: {parseFloat(channel.conversion_rate || 0).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Email Performance Trends
            </h3>
            <div className="h-80">
              <ReactECharts option={getEmailPerformanceChart()} style={{ height: '100%' }} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Event Attendance
            </h3>
            <div className="h-80">
              <ReactECharts option={getEventAttendanceChart()} style={{ height: '100%' }} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Channel Effectiveness
            </h3>
            <div className="h-80">
              <ReactECharts option={getChannelEffectivenessChart()} style={{ height: '100%' }} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border" style={{ borderColor: COLORS.gray[200] }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: COLORS.gray[800] }}>
              Engagement Heatmap (Day/Hour)
            </h3>
            <div className="h-80">
              <ReactECharts option={getTouchpointHeatmapChart()} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementInsightsDashboard;