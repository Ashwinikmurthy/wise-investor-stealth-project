import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  DollarSign, TrendingUp, Users, Target, Award, Calendar, 
  CheckCircle, Clock, AlertCircle, TrendingDown, Mail,
  UserCheck, Activity, FileText, Briefcase, Phone
} from 'lucide-react';

const MajorGiftsDashboardComplete = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    movesManagement: [],
    giftGoals: [],
    proposals: [],
    lastWeekMeetings: [],
    upcomingMeetings: [],
    productivity: [],
    opportunities: []
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
        opportunitiesRes
      ] = await Promise.all([
        fetchMajorGiftsAPI('moves-management-distribution'),
        fetchMajorGiftsAPI('gift-goals'),
        fetchMajorGiftsAPI('solicitation-proposals'),
        fetchMajorGiftsAPI('meetings/last-week'),
        fetchMajorGiftsAPI('meetings/upcoming'),
        fetchMajorGiftsAPI('productivity/summary'),
        fetchMajorGiftsAPI('opportunities', { limit: 50 })
      ]);

      setDashboardData({
        movesManagement: movesRes || [],
        giftGoals: goalsRes || [],
        proposals: proposalsRes || [],
        lastWeekMeetings: lastWeekRes || [],
        upcomingMeetings: upcomingRes || [],
        productivity: productivityRes || [],
        opportunities: opportunitiesRes || []
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

  const { movesManagement, giftGoals, proposals, lastWeekMeetings, upcomingMeetings, productivity, opportunities } = dashboardData;

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

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header with Officer Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
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
      </div>

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
    </div>
  );
};

export default MajorGiftsDashboardComplete;
