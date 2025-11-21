import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Heart, Users, TrendingUp, Award, Target, Activity, CheckCircle } from 'lucide-react';

/**
 * Program Impact Dashboard
 * Track beneficiaries, services, and program outcomes
 *
 * API Endpoints:
 * - /api/v1/program-impact/summary/{orgId}
 * - /api/v1/program-impact/programs/{programId}/performance
 * - /api/v1/program-impact/beneficiaries/demographics/{orgId}
 * - /api/v1/program-impact/outcomes/{programId}
 */

const ProgramImpactDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programPerformance, setProgramPerformance] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const { user, getToken, getOrganizationId } = useAuth();

    // HARDCODE THE ORGANIZATION ID FOR NOW - Replace with your actual method
  const organizationId = '772effb4-35a3-40c6-8555-4d8c732cf656';
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramDetails(selectedProgram);
    }
  }, [selectedProgram]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [summaryRes, demoRes, programsRes] = await Promise.all([
        fetch(`/api/v1/program-impact/summary/${organizationId}`, { headers }),
        fetch(`/api/v1/program-impact/beneficiaries/demographics/${organizationId}`, { headers }),
        fetch(`/api/v1/programs?organization_id=${organizationId}`, { headers })
      ]);

      const summaryData = await summaryRes.json();
      const demoData = await demoRes.json();
      const programsData = await programsRes.json();

      setSummary(summaryData);
      setDemographics(demoData);
      setPrograms(programsData);

      if (programsData.length > 0 && !selectedProgram) {
        setSelectedProgram(programsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramDetails = async (programId) => {
    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [perfRes, outcomesRes] = await Promise.all([
        fetch(`/api/v1/program-impact/programs/${programId}/performance?organization_id=${organizationId}`, { headers }),
        fetch(`/api/v1/program-impact/outcomes/${programId}?organization_id=${organizationId}`, { headers })
      ]);

      const perfData = await perfRes.json();
      const outcomesData = await outcomesRes.json();

      setProgramPerformance(perfData);
      setOutcomes(outcomesData);
    } catch (error) {
      console.error('Error fetching program details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Program Impact Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Track beneficiaries served and program outcomes</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ImpactCard
            title="Total Beneficiaries"
            value={summary?.total_beneficiaries_served?.toLocaleString() || '0'}
            subtitle={`${summary?.new_beneficiaries_ytd || 0} new this year`}
            icon={<Users className="h-6 w-6" />}
            color="blue"
          />
          <ImpactCard
            title="Active Programs"
            value={summary?.active_programs || 0}
            subtitle={`${summary?.total_programs || 0} total programs`}
            icon={<Activity className="h-6 w-6" />}
            color="green"
          />
          <ImpactCard
            title="Services Delivered"
            value={summary?.total_services_delivered?.toLocaleString() || '0'}
            subtitle={`${summary?.services_this_month || 0} this month`}
            icon={<Heart className="h-6 w-6" />}
            color="red"
          />
          <ImpactCard
            title="Positive Outcomes"
            value={`${summary?.positive_outcome_rate?.toFixed(1) || 0}%`}
            subtitle={`${summary?.total_outcomes_recorded || 0} outcomes tracked`}
            icon={<Award className="h-6 w-6" />}
            color="purple"
          />
        </div>

        {/* Demographics Overview */}
        {demographics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Beneficiary Demographics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Age Distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Age Distribution</h4>
                <div className="space-y-3">
                  {Object.entries(demographics.age_groups || {}).map(([ageGroup, count]) => (
                    <DemoBar key={ageGroup} label={ageGroup} count={count} total={demographics.total_beneficiaries} />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Average Age: <span className="font-semibold text-gray-900">{demographics.average_age?.toFixed(1) || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {/* Gender Distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Gender Distribution</h4>
                <div className="space-y-3">
                  {Object.entries(demographics.gender_distribution || {}).map(([gender, count]) => (
                    <DemoBar key={gender} label={gender} count={count} total={demographics.total_beneficiaries} />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Beneficiaries</span>
                    <span className="font-semibold text-gray-900">{demographics.total_beneficiaries}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Active Beneficiaries</span>
                    <span className="font-semibold text-green-600">{demographics.active_beneficiaries}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Program Selector and Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Program</label>
            <select
              value={selectedProgram || ''}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          {programPerformance && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Program Performance</h3>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Beneficiaries</p>
                  <p className="text-3xl font-bold text-blue-600">{programPerformance.total_beneficiaries}</p>
                  <p className="text-xs text-gray-500 mt-1">{programPerformance.active_beneficiaries} currently active</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Services Delivered</p>
                  <p className="text-3xl font-bold text-green-600">{programPerformance.total_services_delivered}</p>
                  <p className="text-xs text-gray-500 mt-1">{programPerformance.services_per_beneficiary?.toFixed(1)} per person</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{programPerformance.completion_rate?.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">{programPerformance.dropout_rate?.toFixed(1)}% dropout rate</p>
                </div>
              </div>

              {/* Outcome Success */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Outcome Success Rate</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">
                      {programPerformance.outcome_success_rate?.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {programPerformance.positive_outcomes} positive outcomes out of {programPerformance.outcomes_tracked} tracked
                    </p>
                  </div>
                  <CheckCircle className="h-16 w-16 text-green-500 opacity-50" />
                </div>
              </div>

              {/* Cost Efficiency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Program Budget</p>
                  <p className="text-xl font-bold text-gray-900">${programPerformance.program_budget?.toLocaleString()}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Cost per Beneficiary</p>
                  <p className="text-xl font-bold text-gray-900">${programPerformance.cost_per_beneficiary?.toFixed(2)}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Cost per Service</p>
                  <p className="text-xl font-bold text-gray-900">${programPerformance.cost_per_service?.toFixed(2)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Outcomes Tracking */}
        {outcomes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Outcome Tracking</h3>
            <div className="space-y-6">
              {outcomes.map((outcome, index) => (
                <OutcomeCard key={index} outcome={outcome} />
              ))}
            </div>
          </div>
        )}

        {/* Top Program */}
        {summary?.top_program && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 mt-8 text-white">
            <div className="flex items-center mb-4">
              <Award className="h-8 w-8 mr-3" />
              <h3 className="text-xl font-bold">Top Performing Program</h3>
            </div>
            <p className="text-2xl font-bold mb-2">{summary.top_program.name}</p>
            <p className="text-blue-100">
              {summary.top_program.services_delivered?.toLocaleString()} services delivered
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const ImpactCard = ({ title, value, subtitle, icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};

const DemoBar = ({ label, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const OutcomeCard = ({ outcome }) => {
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-100';
      case 'declining': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return '↑';
    if (trend === 'declining') return '↓';
    return '→';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-gray-900">{outcome.metric_name}</h4>
          <p className="text-sm text-gray-500 mt-1">Type: {outcome.metric_type}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTrendColor(outcome.trend_direction)}`}>
          {getTrendIcon(outcome.trend_direction)} {outcome.trend_direction}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600">Baseline</p>
          <p className="text-lg font-bold text-gray-900">{outcome.baseline_average?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Current</p>
          <p className="text-lg font-bold text-blue-600">{outcome.current_average?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Change</p>
          <p className={`text-lg font-bold ${outcome.improvement_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {outcome.improvement_percentage >= 0 ? '+' : ''}{outcome.improvement_percentage?.toFixed(1)}%
          </p>
        </div>
      </div>

      {outcome.target_value && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress to Target</span>
            <span className="font-semibold">{outcome.progress_to_target?.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${outcome.target_achieved ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, outcome.progress_to_target)}%` }}
            />
          </div>
          {outcome.target_achieved && (
            <p className="text-xs text-green-600 mt-2 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Target achieved!
            </p>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        {outcome.total_measurements} measurements recorded
      </div>
    </div>
  );
};

export default ProgramImpactDashboard;