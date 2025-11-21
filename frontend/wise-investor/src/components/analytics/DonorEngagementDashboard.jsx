import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  AlertCircle, TrendingUp, TrendingDown, Users, Phone, Mail,
  Calendar, CheckCircle, Clock, AlertTriangle, Target, Activity,
  Zap, Star, MessageCircle, Award, Filter, RefreshCw, Download
} from 'lucide-react';

// ============================================================================
// UT DALLAS BRAND COLORS
// ============================================================================
const COLORS = {
  primary: '#C75B12',      // UT Dallas Orange
  secondary: '#008542',     // UT Dallas Green
  accent: '#00A8E1',        // UT Dallas Blue
  warning: '#F0AD4E',
  danger: '#D9534F',
  success: '#5CB85C',
  dark: '#1F2937',
  light: '#F3F4F6',
  white: '#FFFFFF',
  gray: {
    100: '#F9FAFB',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
};

const ENGAGEMENT_COLORS = {
  on_fire: '#D9534F',
  hot: '#F0AD4E',
  warm: '#5CB85C',
  lukewarm: '#00A8E1',
  cold: '#6B7280'
};

const RISK_COLORS = {
  critical: '#DC2626',
  high: '#F59E0B',
  medium: '#10B981',
  low: '#3B82F6'
};

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================
const DonorEngagementDashboard = () => {
  const { getToken } = useAuth();

  // HARDCODE THE ORGANIZATION ID FOR NOW
  const organizationId = '772effb4-35a3-40c6-8555-4d8c732cf656';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');

  // Data states
  const [engagementSummary, setEngagementSummary] = useState(null);
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [engagementTrends, setEngagementTrends] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [pendingFollowUps, setPendingFollowUps] = useState([]);
  const [nextBestActions, setNextBestActions] = useState([]);
  const [topDonorMetrics, setTopDonorMetrics] = useState([]);

  // ============================================================================
  // API CALLS
  // ============================================================================
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, selectedRiskLevel]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all data in parallel
      const [
        summaryRes,
        interactionsRes,
        trendsRes,
        predictionsRes,
        followUpsRes,
        actionsRes,
        metricsRes
      ] = await Promise.all([
        fetch(`/api/v1/engagement-analytics/summary?organization_id=${organizationId}`, { headers }),
        fetch(`/api/v1/interactions/recent?organization_id=${organizationId}&limit=50`, { headers }),
        fetch(`/api/v1/engagement-analytics/trends?organization_id=${organizationId}&time_range=${timeRange}`, { headers }),
        fetch(`/api/v1/engagement-analytics/predictions?organization_id=${organizationId}&risk_level=${selectedRiskLevel !== 'all' ? selectedRiskLevel : ''}&limit=100`, { headers }),
        fetch(`/api/v1/interactions/follow-ups/pending?organization_id=${organizationId}&limit=50`, { headers }),
        fetch(`/api/v1/engagement-analytics/next-best-actions/${organizationId}?priority=high&limit=20`, { headers }),
        fetch(`/api/v1/engagement-analytics/donors/top-engaged?organization_id=${organizationId}&limit=10`, { headers })
      ]);

      const summary = await summaryRes.json();
      const interactions = await interactionsRes.json();
      const trends = await trendsRes.json();
      const predictionsData = await predictionsRes.json();
      const followUps = await followUpsRes.json();
      const actions = await actionsRes.json();
      const metrics = await metricsRes.json();

      setEngagementSummary(summary);
      setRecentInteractions(interactions);
      setEngagementTrends(trends);
      setPredictions(predictionsData);
      setPendingFollowUps(followUps);
      setNextBestActions(actions);
      setTopDonorMetrics(metrics);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // OVERVIEW TAB - KEY METRICS
  // ============================================================================
  const renderOverviewTab = () => {
    if (!engagementSummary) return null;

    const keyMetrics = [
      {
        title: 'Total Donors',
        value: engagementSummary.total_donors?.toLocaleString() || 0,
        icon: Users,
        color: COLORS.primary,
        bgColor: `${COLORS.primary}15`
      },
      {
        title: 'Engaged (30d)',
        value: engagementSummary.engaged_donors_30d?.toLocaleString() || 0,
        subtitle: `${((engagementSummary.engaged_donors_30d / engagementSummary.total_donors) * 100).toFixed(1)}% of total`,
        icon: Activity,
        color: COLORS.success,
        bgColor: `${COLORS.success}15`
      },
      {
        title: 'At Risk Donors',
        value: engagementSummary.at_risk_donors?.toLocaleString() || 0,
        subtitle: `${((engagementSummary.at_risk_donors / engagementSummary.total_donors) * 100).toFixed(1)}% of total`,
        icon: AlertTriangle,
        color: COLORS.danger,
        bgColor: `${COLORS.danger}15`
      },
      {
        title: 'High Opportunity',
        value: engagementSummary.high_opportunity_donors?.toLocaleString() || 0,
        icon: Star,
        color: COLORS.accent,
        bgColor: `${COLORS.accent}15`
      },
      {
        title: 'Avg Engagement',
        value: engagementSummary.average_engagement_score?.toFixed(1) || '0.0',
        subtitle: 'out of 100',
        icon: Target,
        color: COLORS.secondary,
        bgColor: `${COLORS.secondary}15`
      },
      {
        title: 'Response Rate',
        value: `${(engagementSummary.response_rate || 0).toFixed(1)}%`,
        icon: CheckCircle,
        color: COLORS.primary,
        bgColor: `${COLORS.primary}15`
      }
    ];

    return (
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4"
                 style={{ borderLeftColor: metric.color }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-3xl font-bold" style={{ color: metric.color }}>
                    {metric.value}
                  </p>
                  {metric.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                  )}
                </div>
                <div className="rounded-full p-3" style={{ backgroundColor: metric.bgColor }}>
                  <metric.icon size={24} style={{ color: metric.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Engagement Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="mr-2" style={{ color: COLORS.primary }} />
              Engagement Level Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(engagementSummary.engagement_distribution || {}).map(([key, value]) => ({
                    name: key.replace('_', ' ').toUpperCase(),
                    value: value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(engagementSummary.engagement_distribution || {}).map((key, index) => (
                    <Cell key={`cell-${index}`} fill={ENGAGEMENT_COLORS[key] || COLORS.gray[400]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Interaction Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2" style={{ color: COLORS.secondary }} />
              Interaction Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={engagementTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total_interactions"
                  stroke={COLORS.primary}
                  fill={`${COLORS.primary}40`}
                  name="Interactions"
                />
                <Area
                  type="monotone"
                  dataKey="unique_donors_engaged"
                  stroke={COLORS.secondary}
                  fill={`${COLORS.secondary}40`}
                  name="Donors Engaged"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Engaged Donors */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="mr-2" style={{ color: COLORS.primary }} />
            Top Engaged Donors
          </h3>
          <div className="space-y-3">
            {topDonorMetrics.slice(0, 10).map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                       style={{ backgroundColor: COLORS.primary }}>
                    {index + 1}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-medium text-gray-900">{donor.donor_name}</p>
                    <p className="text-sm text-gray-500">
                      {donor.total_interactions} interactions · Last: {donor.last_interaction_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{
                      color: ENGAGEMENT_COLORS[donor.engagement_level] || COLORS.gray[500]
                    }}>
                      {donor.engagement_level?.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">Score: {donor.engagement_score.toFixed(1)}</p>
                  </div>
                  <div className="w-16 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { metric: 'Score', value: donor.engagement_score },
                        { metric: 'Freq', value: Math.min(100, donor.interaction_frequency_days * 10) },
                        { metric: 'Response', value: donor.response_rate * 100 }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8 }} />
                        <Radar dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // CHURN RISK TAB
  // ============================================================================
  const renderChurnRiskTab = () => {
    const highRiskDonors = predictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical');

    return (
      <div className="space-y-6">
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['critical', 'high', 'medium', 'low'].map((level) => {
            const count = predictions.filter(p => p.risk_level === level).length;
            return (
              <div
                key={level}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedRiskLevel(level)}
                style={{
                  borderTop: `4px solid ${RISK_COLORS[level]}`,
                  backgroundColor: selectedRiskLevel === level ? `${RISK_COLORS[level]}10` : 'white'
                }}
              >
                <p className="text-sm font-medium text-gray-600 uppercase">{level} Risk</p>
                <p className="text-3xl font-bold mt-2" style={{ color: RISK_COLORS[level] }}>
                  {count}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((count / predictions.length) * 100).toFixed(1)}% of donors
                </p>
              </div>
            );
          })}
        </div>

        {/* High Risk Donors Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100">
            <h3 className="text-lg font-semibold flex items-center text-red-800">
              <AlertCircle className="mr-2" />
              Critical & High Risk Donors - Immediate Action Required
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Since Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Contact</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {highRiskDonors.map((donor, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                             style={{ backgroundColor: RISK_COLORS[donor.risk_level] }}>
                          {donor.donor_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{donor.donor_name}</div>
                          <div className="text-sm text-gray-500">
                            {donor.predicted_engagement_level?.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: RISK_COLORS[donor.risk_level] }}>
                            {donor.churn_risk_score.toFixed(1)}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${donor.churn_risk_score}%`,
                                backgroundColor: RISK_COLORS[donor.risk_level]
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        donor.days_since_last_interaction > 90 ? 'bg-red-100 text-red-800' :
                        donor.days_since_last_interaction > 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {donor.days_since_last_interaction} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {donor.interaction_trend === 'declining' && (
                          <TrendingDown size={16} className="text-red-600 mr-1" />
                        )}
                        {donor.interaction_trend === 'stable' && (
                          <Activity size={16} className="text-yellow-600 mr-1" />
                        )}
                        {donor.interaction_trend === 'increasing' && (
                          <TrendingUp size={16} className="text-green-600 mr-1" />
                        )}
                        <span className="text-sm text-gray-700 capitalize">{donor.interaction_trend}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {donor.recommended_actions?.slice(0, 2).map((action, i) => (
                          <div key={i} className="flex items-start mb-1">
                            <CheckCircle size={12} className="mr-1 mt-1 flex-shrink-0" style={{ color: COLORS.primary }} />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{donor.predicted_channel || 'Email'}</div>
                        <div className="text-gray-500">
                          {donor.predicted_next_interaction ?
                            new Date(donor.predicted_next_interaction).toLocaleDateString() :
                            'Schedule ASAP'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Churn Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { risk: 'Critical', count: predictions.filter(p => p.risk_level === 'critical').length, fill: RISK_COLORS.critical },
              { risk: 'High', count: predictions.filter(p => p.risk_level === 'high').length, fill: RISK_COLORS.high },
              { risk: 'Medium', count: predictions.filter(p => p.risk_level === 'medium').length, fill: RISK_COLORS.medium },
              { risk: 'Low', count: predictions.filter(p => p.risk_level === 'low').length, fill: RISK_COLORS.low }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="risk" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {[
                  { risk: 'Critical', count: predictions.filter(p => p.risk_level === 'critical').length },
                  { risk: 'High', count: predictions.filter(p => p.risk_level === 'high').length },
                  { risk: 'Medium', count: predictions.filter(p => p.risk_level === 'medium').length },
                  { risk: 'Low', count: predictions.filter(p => p.risk_level === 'low').length }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk.toLowerCase()]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ============================================================================
  // FOLLOW-UPS TAB
  // ============================================================================
  const renderFollowUpsTab = () => {
    const overdueFollowUps = pendingFollowUps.filter(f =>
      new Date(f.follow_up_date) < new Date()
    );
    const upcomingFollowUps = pendingFollowUps.filter(f =>
      new Date(f.follow_up_date) >= new Date()
    );

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Follow-ups</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{overdueFollowUps.length}</p>
                <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
              </div>
              <AlertTriangle size={32} className="text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {upcomingFollowUps.filter(f => {
                    const diff = new Date(f.follow_up_date) - new Date();
                    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
                  }).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Plan accordingly</p>
              </div>
              <Calendar size={32} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{pendingFollowUps.length}</p>
                <p className="text-xs text-gray-500 mt-1">All follow-ups</p>
              </div>
              <Clock size={32} className="text-green-500" />
            </div>
          </div>
        </div>

        {/* Overdue Follow-ups */}
        {overdueFollowUps.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <h3 className="text-lg font-semibold flex items-center text-red-800">
                <AlertTriangle className="mr-2" />
                Overdue Follow-ups
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {overdueFollowUps.map((followUp, index) => (
                <div key={index} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-lg font-medium text-gray-900">{followUp.donor_name}</h4>
                        <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Overdue {Math.floor((new Date() - new Date(followUp.follow_up_date)) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{followUp.subject}</p>
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          Due: {new Date(followUp.follow_up_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          {followUp.channel === 'phone' && <Phone size={14} className="mr-1" />}
                          {followUp.channel === 'email' && <Mail size={14} className="mr-1" />}
                          {followUp.channel === 'in_person' && <Users size={14} className="mr-1" />}
                          {followUp.channel || 'Not specified'}
                        </span>
                        <span className="capitalize">{followUp.interaction_type?.replace('_', ' ')}</span>
                      </div>
                      {followUp.notes && (
                        <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">{followUp.notes}</p>
                      )}
                    </div>
                    <button
                      className="ml-4 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Follow-ups */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <h3 className="text-lg font-semibold flex items-center text-blue-800">
              <Clock className="mr-2" />
              Upcoming Follow-ups
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingFollowUps.slice(0, 15).map((followUp, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900">{followUp.donor_name}</h4>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                        new Date(followUp.follow_up_date) - new Date() <= 3 * 24 * 60 * 60 * 1000
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        In {Math.ceil((new Date(followUp.follow_up_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{followUp.subject}</p>
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {new Date(followUp.follow_up_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        {followUp.channel === 'phone' && <Phone size={14} className="mr-1" />}
                        {followUp.channel === 'email' && <Mail size={14} className="mr-1" />}
                        {followUp.channel === 'in_person' && <Users size={14} className="mr-1" />}
                        {followUp.channel || 'Not specified'}
                      </span>
                    </div>
                  </div>
                  <button
                    className="ml-4 px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-100"
                    style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // NEXT BEST ACTIONS TAB
  // ============================================================================
  const renderNextBestActionsTab = () => {
    const actionsByType = nextBestActions.reduce((acc, action) => {
      acc[action.action_type] = (acc[action.action_type] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {/* Action Type Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(actionsByType).map(([type, count]) => (
            <div key={type} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{type} Actions</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: COLORS.primary }}>{count}</p>
                </div>
                <div className="rounded-full p-3" style={{ backgroundColor: `${COLORS.primary}15` }}>
                  {type === 'phone' && <Phone size={20} style={{ color: COLORS.primary }} />}
                  {type === 'email' && <Mail size={20} style={{ color: COLORS.primary }} />}
                  {type === 'meeting' && <Users size={20} style={{ color: COLORS.primary }} />}
                  {type === 'event' && <Calendar size={20} style={{ color: COLORS.primary }} />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended Actions List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: `${COLORS.primary}10` }}>
            <h3 className="text-lg font-semibold flex items-center" style={{ color: COLORS.primary }}>
              <Zap className="mr-2" />
              AI-Recommended Next Best Actions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Prioritized actions based on predictive analytics and engagement patterns
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {nextBestActions.map((action, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                           style={{ backgroundColor: COLORS.primary }}>
                        {index + 1}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <h4 className="text-lg font-medium text-gray-900">{action.donor_name}</h4>
                          <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full"
                                style={{
                                  backgroundColor: `${COLORS.accent}20`,
                                  color: COLORS.accent
                                }}>
                            {action.confidence_score.toFixed(0)}% Confidence
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1" style={{ color: COLORS.primary }}>
                          {action.recommended_action}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{action.reason}</p>
                        <div className="mt-3 flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-gray-500">
                            {action.recommended_channel === 'phone' && <Phone size={14} className="mr-1" />}
                            {action.recommended_channel === 'email' && <Mail size={14} className="mr-1" />}
                            {action.recommended_channel === 'in_person' && <Users size={14} className="mr-1" />}
                            Channel: {action.recommended_channel}
                          </span>
                          <span className="flex items-center text-gray-500">
                            <Calendar size={14} className="mr-1" />
                            Best time: {new Date(action.recommended_timing).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800">Expected Outcome:</p>
                          <p className="text-sm text-green-700">{action.expected_outcome}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      Take Action
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-100"
                      style={{ borderColor: COLORS.gray[300], color: COLORS.gray[700] }}
                    >
                      Snooze
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RECENT ACTIVITY TAB
  // ============================================================================
  const renderRecentActivityTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center">
              <Activity className="mr-2" style={{ color: COLORS.primary }} />
              Recent Interactions
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentInteractions.map((interaction, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: `${COLORS.primary}20` }}>
                      {interaction.interaction_type === 'phone_call' && <Phone size={20} style={{ color: COLORS.primary }} />}
                      {interaction.interaction_type === 'email' && <Mail size={20} style={{ color: COLORS.primary }} />}
                      {interaction.interaction_type === 'meeting' && <Users size={20} style={{ color: COLORS.primary }} />}
                      {interaction.interaction_type === 'event' && <Calendar size={20} style={{ color: COLORS.primary }} />}
                      {!['phone_call', 'email', 'meeting', 'event'].includes(interaction.interaction_type) && (
                        <MessageCircle size={20} style={{ color: COLORS.primary }} />
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{interaction.donor_name}</h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {interaction.interaction_type.replace('_', ' ')} ·
                          {new Date(interaction.interaction_date).toLocaleDateString()} ·
                          {interaction.channel && ` via ${interaction.channel}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {interaction.sentiment && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            interaction.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            interaction.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {interaction.sentiment}
                          </span>
                        )}
                        {interaction.outcome && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ['positive', 'conversion'].includes(interaction.outcome) ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {interaction.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900">{interaction.subject}</p>
                    {interaction.notes && (
                      <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">{interaction.notes}</p>
                    )}
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      {interaction.duration_minutes && (
                        <span>Duration: {interaction.duration_minutes} min</span>
                      )}
                      {interaction.engagement_score > 0 && (
                        <span>
                          Engagement Score:
                          <span className="font-medium ml-1" style={{ color: COLORS.primary }}>
                            {interaction.engagement_score.toFixed(1)}
                          </span>
                        </span>
                      )}
                      {interaction.follow_up_required && (
                        <span className="flex items-center text-orange-600">
                          <Clock size={14} className="mr-1" />
                          Follow-up needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4"
               style={{ borderColor: COLORS.primary }} />
          <p className="text-lg font-medium text-gray-700">Loading engagement data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Error Loading Dashboard</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full px-4 py-2 text-white rounded-md hover:opacity-90"
            style={{ backgroundColor: COLORS.primary }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>
                Donor Engagement Intelligence
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive analytics and predictive insights for donor engagement
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchDashboardData}
                className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                style={{ borderColor: COLORS.gray[300] }}
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
              <button
                className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-90"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Download size={16} className="mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} style={{ color: COLORS.gray[600] }} />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2"
              style={{ focusRingColor: COLORS.primary }}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="12m">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'churn-risk', label: 'Churn Risk', icon: AlertTriangle },
              { id: 'follow-ups', label: 'Follow-ups', icon: Clock },
              { id: 'next-actions', label: 'Next Best Actions', icon: Zap },
              { id: 'activity', label: 'Recent Activity', icon: MessageCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-current'
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  color: activeTab === tab.id ? COLORS.primary : COLORS.gray[600],
                  borderColor: activeTab === tab.id ? COLORS.primary : 'transparent'
                }}
              >
                <tab.icon size={16} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'churn-risk' && renderChurnRiskTab()}
        {activeTab === 'follow-ups' && renderFollowUpsTab()}
        {activeTab === 'next-actions' && renderNextBestActionsTab()}
        {activeTab === 'activity' && renderRecentActivityTab()}
      </div>
    </div>
  );
};

export default DonorEngagementDashboard;