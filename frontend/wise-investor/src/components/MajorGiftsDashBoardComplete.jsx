import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  DollarSign, TrendingUp, Users, Target, Award, Calendar,
  CheckCircle, Clock, AlertCircle, TrendingDown, Mail,
  UserCheck, Activity, FileText, Briefcase, Phone, Star, Heart, AlertTriangle
} from 'lucide-react';

const MajorGiftsDashboardComplete = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    movesManagement: [],
    giftGoals: [],
    proposals: [],
    lastWeekMeetings: [],
    upcomingMeetings: [],
    productivity: [],
    opportunities: [],
    // Prioritization data
    capacityPriority: [],
    engagementPriority: [],
    likelihoodPriority: [],
    portfolioGaps: [],
    urgencyPriority: []
  });

  const API_BASE_URL = '';

  // Get authentication token and organization ID from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    const organizationId = localStorage.getItem('organization_id');

    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    if (!organizationId) {
      throw new Error('Organization ID not found. Please log in again.');
    }

    return {
      token,
      organizationId,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Generic API fetch function with authentication
  const fetchMajorGiftsAPI = async (endpoint, additionalParams = {}) => {
    try {
      const { token, organizationId, headers } = getAuthHeaders();

      // Build query parameters
      const queryParams = new URLSearchParams({
        organization_id: organizationId,
        ...additionalParams
      });

      // Add officer filter if selected
      if (selectedOfficer) {
        queryParams.append('officer_id', selectedOfficer);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/major-gifts/${endpoint}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedOfficer]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all major gifts endpoints in parallel with proper authentication
      const [
        movesRes,
        goalsRes,
        proposalsRes,
        lastWeekRes,
        upcomingRes,
        productivityRes,
        opportunitiesRes,
        // Prioritization endpoints
        capacityRes,
        engagementRes,
        likelihoodRes,
        portfolioRes,
        urgencyRes
      ] = await Promise.all([
        fetchMajorGiftsAPI('moves-management-distribution'),
        fetchMajorGiftsAPI('gift-goals'),
        fetchMajorGiftsAPI('solicitation-proposals'),
        fetchMajorGiftsAPI('meetings/last-week'),
        fetchMajorGiftsAPI('meetings/upcoming'),
        fetchMajorGiftsAPI('productivity/summary'),
        fetchMajorGiftsAPI('opportunities', { limit: 50 }),
        // Prioritization APIs
        fetchMajorGiftsAPI('prioritization/capacity', { limit: 50 }).catch(() => []),
        fetchMajorGiftsAPI('prioritization/engagement', { limit: 50 }).catch(() => []),
        fetchMajorGiftsAPI('prioritization/likelihood', { limit: 50 }).catch(() => []),
        fetchMajorGiftsAPI('prioritization/portfolio-gaps').catch(() => []),
        fetchMajorGiftsAPI('prioritization/urgency', { limit: 50 }).catch(() => [])
      ]);

      setDashboardData({
        movesManagement: movesRes || [],
        giftGoals: goalsRes || [],
        proposals: proposalsRes || [],
        lastWeekMeetings: lastWeekRes || [],
        upcomingMeetings: upcomingRes || [],
        productivity: productivityRes || [],
        opportunities: opportunitiesRes || [],
        capacityPriority: capacityRes || [],
        engagementPriority: engagementRes || [],
        likelihoodPriority: likelihoodRes || [],
        portfolioGaps: portfolioRes || [],
        urgencyPriority: urgencyRes || []
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching major gifts data:', err);
      setError(err.message || 'Failed to load dashboard data. Please check your authentication.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading Major Gifts Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-lg font-semibold text-red-600 mb-2">Error Loading Dashboard</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    movesManagement, giftGoals, proposals, lastWeekMeetings, upcomingMeetings,
    productivity, opportunities, capacityPriority, engagementPriority,
    likelihoodPriority, portfolioGaps, urgencyPriority
  } = dashboardData;

  // Calculate aggregate metrics
  const totalDonorsManaged = movesManagement.reduce((sum, officer) => sum + officer.total_donors, 0);
  const totalGoalAmount = giftGoals.reduce((sum, officer) => sum + parseFloat(officer.total_goal_amount || 0), 0);
  const totalRaisedAmount = giftGoals.reduce((sum, officer) => sum + parseFloat(officer.total_raised_amount || 0), 0);
  const totalProposalsSent = proposals.reduce((sum, officer) => sum + officer.total_proposals_sent, 0);
  const totalProposalsAccepted = proposals.reduce((sum, officer) => sum + officer.proposals_accepted, 0);

  const overallGoalProgress = totalGoalAmount > 0 ? (totalRaisedAmount / totalGoalAmount * 100) : 0;
  const proposalAcceptanceRate = totalProposalsSent > 0 ? (totalProposalsAccepted / totalProposalsSent * 100) : 0;

  // Colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const STAGE_COLORS = {
    identification: '#94a3b8',
    qualification: '#60a5fa',
    cultivation: '#34d399',
    solicitation: '#fbbf24',
    stewardship: '#10b981'
  };

  // Prepare moves management data for stacked bar chart
  const movesChartData = movesManagement.map(officer => ({
    name: officer.officer_name,
    Identification: officer.identification,
    Qualification: officer.qualification,
    Cultivation: officer.cultivation,
    Solicitation: officer.solicitation,
    Stewardship: officer.stewardship
  }));

  // Prepare productivity data for radar chart
  const radarData = productivity.slice(0, 5).map(officer => ({
    officer: officer.officer_name.split(' ')[0],
    countProgress: officer.count_progress_percent,
    amountProgress: officer.amount_progress_percent,
    efficiency: officer.ytd_closures_count > 0 ?
      (parseFloat(officer.ytd_closures_amount) / officer.ytd_closures_count / 1000) : 0
  }));

  // Get unique officers for filter
  const allOfficers = Array.from(new Set([
    ...movesManagement.map(o => ({ id: o.officer_id, name: o.officer_name })),
    ...giftGoals.map(o => ({ id: o.officer_id, name: o.officer_name })),
    ...productivity.map(o => ({ id: o.officer_id, name: o.officer_name }))
  ].filter(o => o.id).map(o => JSON.stringify(o)))).map(s => JSON.parse(s));

  // Priority opportunities grouped
  const opportunitiesByPriority = opportunities.reduce((acc, opp) => {
    const tier = opp.priority_tier || opp.priority_level;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(opp);
    return acc;
  }, {});

  // Prioritization chart data
  const capacityChartData = capacityPriority.slice(0, 10).map(d => ({
    name: d.donor_name.split(' ')[0],
    capacity: d.estimated_capacity / 1000,
    utilization: d.capacity_utilization,
    score: d.capacity_score
  }));

  const engagementChartData = engagementPriority.slice(0, 10).map(d => ({
    name: d.donor_name.split(' ')[0],
    score: d.engagement_score,
    meetings: d.meetings_last_12mo,
    events: d.events_attended
  }));

  const likelihoodChartData = likelihoodPriority.slice(0, 10).map(d => ({
    name: d.donor_name.split(' ')[0],
    likelihood: d.likelihood_score,
    predicted: d.predicted_gift_amount / 1000
  }));

  const portfolioChartData = portfolioGaps.map(g => ({
    name: g.officer_name.split(' ')[0],
    current: g.current_portfolio_size,
    target: g.target_portfolio_size,
    gap: g.portfolio_gap
  }));

  const urgencyChartData = urgencyPriority.slice(0, 10).map(d => ({
    name: d.donor_name.split(' ')[0],
    score: d.urgency_score,
    lapsed: Math.min(d.lapsed_days, 365)
  }));

  // Tier distributions for pie charts
  const capacityTierData = capacityPriority.reduce((acc, d) => {
    acc[d.capacity_tier] = (acc[d.capacity_tier] || 0) + 1;
    return acc;
  }, {});
  const capacityPieData = Object.entries(capacityTierData).map(([name, value]) => ({ name, value }));

  const engagementTierData = engagementPriority.reduce((acc, d) => {
    acc[d.engagement_tier] = (acc[d.engagement_tier] || 0) + 1;
    return acc;
  }, {});
  const engagementPieData = Object.entries(engagementTierData).map(([name, value]) => ({ name, value }));

  const urgencyTierData = urgencyPriority.reduce((acc, d) => {
    acc[d.urgency_tier] = (acc[d.urgency_tier] || 0) + 1;
    return acc;
  }, {});
  const urgencyPieData = Object.entries(urgencyTierData).map(([name, value]) => ({ name, value }));

  // Priority colors
  const PRIORITY_COLORS = {
    capacity: '#3b82f6',
    engagement: '#10b981',
    likelihood: '#f59e0b',
    portfolio: '#8b5cf6',
    urgency: '#ef4444'
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header with Officer Filter and Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Major Gifts Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive view of major gift development activities</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedOfficer || ''}
              onChange={(e) => setSelectedOfficer(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Officers</option>
              {allOfficers.map(officer => (
                <option key={officer.id} value={officer.id}>{officer.name}</option>
              ))}
            </select>
            <button
              onClick={fetchAllData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-t pt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('prioritization')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'prioritization'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Prioritization Models
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
      <>
      {/* Top-Level KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Donors Managed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalDonorsManaged}</p>
              <p className="text-sm text-gray-500 mt-1">Active portfolio</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Goal Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{overallGoalProgress.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">
                ${totalRaisedAmount.toLocaleString()} / ${totalGoalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Proposals Sent</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalProposalsSent}</p>
              <p className="text-sm text-green-600 mt-1">
                {proposalAcceptanceRate.toFixed(1)}% accepted
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meetings This Week</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{lastWeekMeetings.length}</p>
              <p className="text-sm text-blue-600 mt-1">
                {upcomingMeetings.length} upcoming
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Officer Performance Table */}
      {productivity && productivity.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Officer Performance Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Officer</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">YTD Closures</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">YTD Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Annual Goal</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Count Progress</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount Progress</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {productivity.map((officer, idx) => (
                  <tr key={officer.officer_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{officer.officer_name}</p>
                        {officer.officer_role && (
                          <p className="text-xs text-gray-500">{officer.officer_role}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900">{officer.ytd_closures_count}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">
                      ${parseFloat(officer.ytd_closures_amount).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      ${parseFloat(officer.annual_goal_amount).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              officer.count_progress_percent >= 100 ? 'bg-green-500' :
                              officer.count_progress_percent >= 75 ? 'bg-blue-500' :
                              officer.count_progress_percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(officer.count_progress_percent, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12">
                          {officer.count_progress_percent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              officer.amount_progress_percent >= 100 ? 'bg-green-500' :
                              officer.amount_progress_percent >= 75 ? 'bg-blue-500' :
                              officer.amount_progress_percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(officer.amount_progress_percent, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12">
                          {officer.amount_progress_percent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      ${parseFloat(officer.remaining_amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moves Management Pipeline & Productivity Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moves Management Distribution */}
        {movesChartData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Moves Management Distribution</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={movesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
                <Legend />
                <Bar dataKey="Identification" stackId="a" fill={STAGE_COLORS.identification} />
                <Bar dataKey="Qualification" stackId="a" fill={STAGE_COLORS.qualification} />
                <Bar dataKey="Cultivation" stackId="a" fill={STAGE_COLORS.cultivation} />
                <Bar dataKey="Solicitation" stackId="a" fill={STAGE_COLORS.solicitation} />
                <Bar dataKey="Stewardship" stackId="a" fill={STAGE_COLORS.stewardship} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Officer Performance Radar */}
        {radarData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Comparison</h2>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="officer" stroke="#6b7280" />
                <PolarRadiusAxis stroke="#6b7280" />
                <Radar name="Count Progress %" dataKey="countProgress" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Amount Progress %" dataKey="amountProgress" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gift Goals & Proposals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gift Goals Summary */}
        {giftGoals && giftGoals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Gift Goals Summary
            </h2>
            <div className="space-y-3">
              {giftGoals.map((goal, idx) => (
                <div key={goal.officer_id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{goal.officer_name}</p>
                      <p className="text-sm text-gray-600">{goal.total_goal_count} goals ({goal.goals_achieved} achieved)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{goal.completion_rate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">completion</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Raised: ${parseFloat(goal.total_raised_amount).toLocaleString()}</span>
                    <span className="text-gray-600">Goal: ${parseFloat(goal.total_goal_amount).toLocaleString()}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(goal.completion_rate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solicitation Proposals */}
        {proposals && proposals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-600" />
              Solicitation Proposals
            </h2>
            <div className="space-y-3">
              {proposals.map((proposal, idx) => (
                <div key={proposal.officer_id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{proposal.officer_name}</p>
                      <p className="text-sm text-gray-600">{proposal.total_proposals_sent} proposals sent</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${parseFloat(proposal.total_proposal_amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">total asked</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-green-100 rounded">
                      <p className="text-lg font-bold text-green-700">{proposal.proposals_accepted}</p>
                      <p className="text-xs text-green-600">Accepted</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded">
                      <p className="text-lg font-bold text-blue-700">{proposal.proposals_pending}</p>
                      <p className="text-xs text-blue-600">Pending</p>
                    </div>
                    <div className="p-2 bg-red-100 rounded">
                      <p className="text-lg font-bold text-red-700">{proposal.proposals_declined}</p>
                      <p className="text-xs text-red-600">Declined</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meeting Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last Week Meetings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Recent Meetings ({lastWeekMeetings.length})
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lastWeekMeetings.slice(0, 10).map((meeting, idx) => (
              <div key={meeting.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{meeting.donor_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {meeting.officer_name || 'Unassigned'} • {meeting.meeting_type}
                    </p>
                    {meeting.agenda && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{meeting.agenda}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(meeting.actual_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {lastWeekMeetings.length === 0 && (
              <p className="text-center text-gray-500 py-8">No meetings in the last week</p>
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Upcoming Meetings ({upcomingMeetings.length})
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {upcomingMeetings.slice(0, 10).map((officer, idx) => (
              <div key={officer.officer_id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{officer.officer_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {officer.officer_role
                        ? officer.officer_role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                        : 'No Role'
                      }
                      {' • '}
                      {officer.total_meetings || officer.meetings_count || 0} meetings
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-purple-900">
                      {officer.next_meeting_date
                        ? new Date(officer.next_meeting_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : "No Date Set"
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {upcomingMeetings.length === 0 && (
              <p className="text-center text-gray-500 py-8">No upcoming meetings scheduled</p>
            )}
          </div>
        </div>
      </div>

      {/* Priority Opportunities */}
      {opportunities && opportunities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Priority Donor Opportunities
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map(tier => {
              const tierOpportunities = opportunitiesByPriority[tier] || [];
              if (tierOpportunities.length === 0) return null;

              const tierColors = {
                1: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', badge: 'bg-red-500' },
                2: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', badge: 'bg-orange-500' },
                3: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', badge: 'bg-yellow-500' }
              };
              const colors = tierColors[tier];

              return (
                <div key={tier} className={`p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 ${colors.badge} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                      {tier}
                    </div>
                    <h3 className={`font-bold ${colors.text}`}>
                      Priority {tier}: {tierOpportunities[0].priority_description}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tierOpportunities.slice(0, 6).map((opp, idx) => (
                      <div key={opp.party_id} className="p-3 bg-white rounded border border-gray-200">
                        <p className="font-semibold text-gray-900">{opp.donor_name}</p>
                        <p className="text-sm text-gray-600 mt-1">{opp.officer_name || 'Unassigned'}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
                            {opp.donor_level}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            ${opp.opportunity_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {tierOpportunities.length > 6 && (
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      +{tierOpportunities.length - 6} more opportunities
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Actions</h2>
        <div className="space-y-3">
          {upcomingMeetings.length > 0 && (
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Prepare for {upcomingMeetings.length} upcoming meetings</p>
                <p className="text-sm text-blue-700 mt-1">Review donor profiles and prepare talking points</p>
              </div>
            </div>
          )}

          {opportunities.filter(o => (o.priority_tier || o.priority_level) === 1).length > 0 && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  {opportunities.filter(o => (o.priority_tier || o.priority_level) === 1).length} Priority 1 opportunities require immediate attention
                </p>
                <p className="text-sm text-red-700 mt-1">These donors gave last year but nothing this year - reach out now</p>
              </div>
            </div>
          )}

          {proposals.some(p => p.proposals_pending > 0) && (
            <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Follow up on pending proposals</p>
                <p className="text-sm text-amber-700 mt-1">
                  {proposals.reduce((sum, p) => sum + p.proposals_pending, 0)} proposals awaiting response
                </p>
              </div>
            </div>
          )}

          {productivity.some(p => p.count_progress_percent < 50) && (
            <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900">Support officers behind on goals</p>
                <p className="text-sm text-purple-700 mt-1">
                  Some officers need assistance to reach annual targets
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {activeTab === 'prioritization' && (
        <>
          {/* Prioritization Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">By Capacity</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{capacityPriority.length}</p>
              <p className="text-xs text-gray-500">donors scored</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">By Engagement</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{engagementPriority.length}</p>
              <p className="text-xs text-gray-500">donors scored</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-gray-700">By Likelihood</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{likelihoodPriority.length}</p>
              <p className="text-xs text-gray-500">donors scored</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-700">Portfolio Gaps</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{portfolioGaps.length}</p>
              <p className="text-xs text-gray-500">officers analyzed</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-700">By Urgency</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{urgencyPriority.filter(d => d.urgency_tier === 'Critical').length}</p>
              <p className="text-xs text-gray-500">critical actions</p>
            </div>
          </div>

          {/* 1. Priority by Capacity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Priority by Capacity
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Top Donors by Estimated Capacity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={capacityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'capacity' ? `$${value}K` : `${value}%`,
                        name === 'capacity' ? 'Est. Capacity' : 'Utilization'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="capacity" name="Capacity ($K)" fill={PRIORITY_COLORS.capacity} />
                    <Bar dataKey="utilization" name="Utilization %" fill="#93c5fd" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Distribution by Capacity Tier</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={capacityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {capacityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Top 5 by Capacity Score</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Donor</th>
                      <th className="text-right py-2">Est. Capacity</th>
                      <th className="text-right py-2">Lifetime</th>
                      <th className="text-right py-2">Utilization</th>
                      <th className="text-right py-2">Recommended Ask</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capacityPriority.slice(0, 5).map((d, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{d.donor_name}</td>
                        <td className="text-right py-2">${d.estimated_capacity?.toLocaleString()}</td>
                        <td className="text-right py-2">${d.lifetime_giving?.toLocaleString()}</td>
                        <td className="text-right py-2">{d.capacity_utilization?.toFixed(1)}%</td>
                        <td className="text-right py-2 font-bold text-blue-600">${d.recommended_ask?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. Priority by Engagement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-600" />
              Priority by Engagement
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Engagement Scores</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" fontSize={11} width={60} />
                    <Tooltip />
                    <Bar dataKey="score" name="Engagement Score" fill={PRIORITY_COLORS.engagement} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Distribution by Engagement Tier</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {engagementPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Cold Donors Needing Re-engagement</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {engagementPriority.filter(d => d.engagement_tier === 'Cold').slice(0, 6).map((d, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-gray-900">{d.donor_name}</p>
                    <p className="text-sm text-gray-600">{d.days_since_contact} days since contact</p>
                    <p className="text-xs text-red-600 mt-1">Score: {d.engagement_score}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Priority by Predicted Likelihood */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Priority by Predicted Likelihood
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Likelihood vs Predicted Gift</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="likelihood" name="Likelihood" unit="%" domain={[0, 100]} />
                    <YAxis dataKey="predicted" name="Predicted" unit="K" />
                    <ZAxis range={[50, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Donors" data={likelihoodChartData} fill={PRIORITY_COLORS.likelihood} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">High Likelihood Donors (80+)</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {likelihoodPriority.filter(d => d.likelihood_score >= 80).slice(0, 8).map((d, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{d.donor_name}</p>
                          <p className="text-xs text-gray-600">{d.recommended_action}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-600">{d.likelihood_score}%</p>
                          <p className="text-xs text-gray-500">${d.predicted_gift_amount?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {d.key_indicators?.slice(0, 2).map((ind, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white rounded text-gray-600">{ind}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Priority by Portfolio Gaps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Priority by Portfolio Gaps
            </h2>
            {portfolioGaps.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Current vs Target Portfolio Size</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={portfolioChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" name="Current" fill={PRIORITY_COLORS.portfolio} />
                      <Bar dataKey="target" name="Target" fill="#c4b5fd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Officer Portfolio Health</h3>
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {portfolioGaps.map((g, idx) => {
                      const fillRate = (g.current_portfolio_size / g.target_portfolio_size * 100);
                      return (
                        <div key={idx} className={`p-3 rounded-lg border ${fillRate < 70 ? 'bg-red-50 border-red-200' : fillRate < 90 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">{g.officer_name}</span>
                            <span className={`text-sm font-bold ${fillRate < 70 ? 'text-red-600' : fillRate < 90 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {fillRate.toFixed(0)}% filled
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${fillRate < 70 ? 'bg-red-500' : fillRate < 90 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(fillRate, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            {g.current_portfolio_size} / {g.target_portfolio_size} donors • Gap: {g.portfolio_gap}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No portfolio gap data available</p>
            )}
          </div>

          {/* 5. Priority by Urgency/Timing */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Priority by Urgency / Timing
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Urgency Scores</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={urgencyChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" fontSize={11} width={60} />
                    <Tooltip />
                    <Bar dataKey="score" name="Urgency Score" fill={PRIORITY_COLORS.urgency} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Distribution by Urgency Level</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={urgencyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {urgencyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name === 'Critical' ? '#ef4444' :
                          entry.name === 'High' ? '#f97316' :
                          entry.name === 'Medium' ? '#f59e0b' : '#22c55e'
                        } />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Critical Actions Required</h3>
              <div className="space-y-3">
                {urgencyPriority.filter(d => d.urgency_tier === 'Critical' || d.urgency_tier === 'High').slice(0, 6).map((d, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${d.urgency_tier === 'Critical' ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${d.urgency_tier === 'Critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                            {d.urgency_tier}
                          </span>
                          <span className="font-medium text-gray-900">{d.donor_name}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{d.recommended_action}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {d.urgency_reasons?.map((reason, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-white rounded text-gray-600">{reason}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gray-900">{d.urgency_score}</p>
                        <p className="text-xs text-gray-500">score</p>
                        {d.action_deadline && (
                          <p className="text-xs text-red-600 mt-1">
                            Due: {new Date(d.action_deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MajorGiftsDashboardComplete;