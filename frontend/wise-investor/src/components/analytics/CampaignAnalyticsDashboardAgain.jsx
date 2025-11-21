import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Target,
  Activity, Heart, Award, Calendar, ArrowRight
} from 'lucide-react';

/**
 * Executive Dashboard
 * High-level overview combining engagement, campaigns, and program impact
 *
 * API Dependencies:
 * - /api/v1/engagement-analytics/summary/{orgId}
 * - /api/v1/campaign-analytics/summary/{orgId}
 * - /api/v1/program-impact/summary/{orgId}
 */

const ExecutiveDashboard = () => {
  const { getToken } = useAuth();

  // HARDCODE THE ORGANIZATION ID FOR NOW
  const organizationId = '772effb4-35a3-40c6-8555-4d8c732cf656';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    engagement: null,
    campaigns: null,
    programs: null
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [engagementRes, campaignsRes, programsRes] = await Promise.all([
        fetch(`/api/v1/engagement-analytics/summary/${organizationId}`, { headers }),
        fetch(`/api/v1/campaign-analytics/summary/${organizationId}`, { headers }),
        fetch(`/api/v1/program-impact/summary/${organizationId}`, { headers })
      ]);

      if (!engagementRes.ok || !campaignsRes.ok || !programsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const engagement = await engagementRes.json();
      const campaigns = await campaignsRes.json();
      const programs = await programsRes.json();

      setData({ engagement, campaigns, programs });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Total Donors"
            value={data.engagement?.total_donors?.toLocaleString() || '0'}
            change={`${data.engagement?.engaged_donors_30d || 0} active`}
            icon={<Users className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Campaign Revenue"
            value={`$${(data.campaigns?.total_raised || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            change={`${data.campaigns?.active_campaigns || 0} active campaigns`}
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
          />
          <MetricCard
            title="People Served"
            value={data.programs?.total_beneficiaries_served?.toLocaleString() || '0'}
            change={`${data.programs?.unique_beneficiaries_ytd || 0} this year`}
            icon={<Heart className="h-6 w-6" />}
            color="red"
          />
          <MetricCard
            title="Services Delivered"
            value={data.programs?.total_services_delivered?.toLocaleString() || '0'}
            change={`${data.programs?.services_this_month || 0} this month`}
            icon={<Activity className="h-6 w-6" />}
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Engagement Health */}
          <DashboardCard title="Donor Engagement Health" icon={<TrendingUp className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Average Engagement Score</span>
                <span className="text-2xl font-bold text-blue-600">
                  {data.engagement?.average_engagement_score?.toFixed(1) || '0.0'}/100
                </span>
              </div>

              <div className="space-y-3">
                <EngagementBar
                  label="On Fire"
                  count={data.engagement?.engagement_distribution?.on_fire || 0}
                  color="bg-red-500"
                />
                <EngagementBar
                  label="Hot"
                  count={data.engagement?.engagement_distribution?.hot || 0}
                  color="bg-orange-500"
                />
                <EngagementBar
                  label="Warm"
                  count={data.engagement?.engagement_distribution?.warm || 0}
                  color="bg-yellow-500"
                />
                <EngagementBar
                  label="Lukewarm"
                  count={data.engagement?.engagement_distribution?.lukewarm || 0}
                  color="bg-blue-400"
                />
                <EngagementBar
                  label="Cold"
                  count={data.engagement?.engagement_distribution?.cold || 0}
                  color="bg-gray-400"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">At-Risk Donors</span>
                  <span className="font-semibold text-red-600">
                    {data.engagement?.at_risk_donors || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">High Opportunity</span>
                  <span className="font-semibold text-green-600">
                    {data.engagement?.high_opportunity_donors || 0}
                  </span>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Campaign Performance */}
          <DashboardCard title="Campaign Performance" icon={<Target className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Goal Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(data.campaigns?.total_goal || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Raised Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(data.campaigns?.total_raised || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-gray-900">
                    {data.campaigns?.overall_progress?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.campaigns?.overall_progress || 0)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Total Campaigns</p>
                  <p className="text-lg font-semibold text-gray-900">{data.campaigns?.total_campaigns || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active</p>
                  <p className="text-lg font-semibold text-blue-600">{data.campaigns?.active_campaigns || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-lg font-semibold text-green-600">{data.campaigns?.completed_campaigns || 0}</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Average Campaign ROI</span>
                  <span className={`font-semibold ${data.campaigns?.average_campaign_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.campaigns?.average_campaign_roi?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Campaign */}
          <DashboardCard title="Top Performing Campaign" icon={<Award className="h-5 w-5" />}>
            {data.campaigns?.top_performing_campaign ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {data.campaigns.top_performing_campaign.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Campaign ID: {data.campaigns.top_performing_campaign.id?.slice(0, 8)}...
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount Raised</span>
                    <span className="text-lg font-bold text-green-600">
                      ${(data.campaigns.top_performing_campaign.raised || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <button className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No campaign data available</p>
              </div>
            )}
          </DashboardCard>

          {/* Program Impact */}
          <DashboardCard title="Program Impact" icon={<Heart className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Active Programs</p>
                  <p className="text-2xl font-bold text-blue-600">{data.programs?.active_programs || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Programs</p>
                  <p className="text-2xl font-bold text-gray-900">{data.programs?.total_programs || 0}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Services/Beneficiary</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.programs?.average_services_per_beneficiary?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Positive Outcomes</span>
                  <span className="text-sm font-semibold text-green-600">
                    {data.programs?.positive_outcome_rate?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>

              {data.programs?.top_program && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Top Program</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {data.programs.top_program.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.programs.top_program.services_delivered} services delivered
                  </p>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Response Rate */}
          <DashboardCard title="Communication Metrics" icon={<Activity className="h-5 w-5" />}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Response Rate</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {data.engagement?.response_rate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${data.engagement?.response_rate || 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Interactions (30d)</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.engagement?.total_interactions_30d?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Engaged Donors (30d)</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.engagement?.engaged_donors_30d || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Engaged Donors (90d)</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.engagement?.engaged_donors_90d || 0}
                  </span>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton href="/campaigns">View All Campaigns</ActionButton>
            <ActionButton href="/engagement">Engagement Analytics</ActionButton>
            <ActionButton href="/programs">Program Dashboard</ActionButton>
            <ActionButton href="/reports">Generate Report</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value, change, icon, color }) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-500">{change}</p>
        </div>
        <div className={`${colors[color]} p-3 rounded-lg text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center mb-4">
      <div className="text-gray-700 mr-2">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const EngagementBar = ({ label, count, color }) => {
  const total = 100; // Placeholder for total calculation
  const percentage = (count / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{count}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
};

const ActionButton = ({ href, children }) => (
  <a
    href={href}
    className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
  >
    {children}
    <ArrowRight className="ml-2 h-4 w-4" />
  </a>
);

export default ExecutiveDashboard;