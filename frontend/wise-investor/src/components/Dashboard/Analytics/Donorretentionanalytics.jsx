import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, AlertTriangle, Award, Calendar,
  DollarSign, Activity, Target, ChevronRight, Download, Filter,
  RefreshCw, Info, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DonorRetentionAnalytics = ({ organizationId, authToken }) => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('12months');
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [data, setData] = useState({
    retentionMetrics: null,
    cohortAnalysis: null,
    churnPrediction: null,
    ltvAnalysis: null,
    reactivationPotential: null
  });

  // Fetch all retention analytics data
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      const [retention, cohorts, churn, ltv, reactivation] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/${organizationId}/donor-retention?period=${timeRange}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/donor-cohorts`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/churn-prediction`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/donor-ltv`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/reactivation-potential`, { headers }).then(r => r.json())
      ]);

      setData({
        retentionMetrics: retention,
        cohortAnalysis: cohorts,
        churnPrediction: churn,
        ltvAnalysis: ltv,
        reactivationPotential: reactivation
      });
    } catch (error) {
      console.error('Error fetching retention data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId && authToken) {
      fetchData();
    }
  }, [organizationId, authToken, timeRange]);

  // Custom tooltip for retention curves
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm mt-1">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Churn risk indicator component
  const ChurnRiskIndicator = ({ score }) => {
    const getColor = () => {
      if (score < 30) return 'bg-green-500';
      if (score < 70) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    const getLabel = () => {
      if (score < 30) return 'Low Risk';
      if (score < 70) return 'Medium Risk';
      return 'High Risk';
    };

    return (
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getColor()} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 w-24">{getLabel()}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Donor Retention Analytics</h1>
            <p className="text-gray-600">Advanced insights into donor behavior and lifetime value</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
              <option value="24months">Last 24 Months</option>
            </select>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Refresh</span>
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.retentionMetrics?.overall_retention || '0'}%
              </p>
              <div className="flex items-center mt-2">
                {data.retentionMetrics?.retention_trend > 0 ? (
                  <ArrowUpRight className="text-green-500" size={20} />
                ) : (
                  <ArrowDownRight className="text-red-500" size={20} />
                )}
                <span className="text-sm text-gray-600 ml-1">
                  {Math.abs(data.retentionMetrics?.retention_trend || 0)}% vs last period
                </span>
              </div>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Donor LTV</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.ltvAnalysis?.avg_ltv?.toLocaleString() || '0'}
              </p>
              <div className="flex items-center mt-2">
                <Activity className="text-green-500" size={16} />
                <span className="text-sm text-gray-600 ml-1">
                  {data.ltvAnalysis?.ltv_growth || 0}% growth
                </span>
              </div>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">At-Risk Donors</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.churnPrediction?.at_risk_count || '0'}
              </p>
              <div className="flex items-center mt-2">
                <AlertTriangle className="text-yellow-500" size={16} />
                <span className="text-sm text-gray-600 ml-1">
                  ${data.churnPrediction?.at_risk_value?.toLocaleString() || '0'} value
                </span>
              </div>
            </div>
            <AlertTriangle className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reactivation Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.reactivationPotential?.count || '0'}
              </p>
              <div className="flex items-center mt-2">
                <Target className="text-purple-500" size={16} />
                <span className="text-sm text-gray-600 ml-1">
                  ${data.reactivationPotential?.potential_value?.toLocaleString() || '0'} potential
                </span>
              </div>
            </div>
            <Award className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Retention Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retention Curves by Cohort</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.cohortAnalysis?.retention_curves || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="2024Q1" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="2024Q2" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="2024Q3" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="2024Q4" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Donor Lifetime Value Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.ltvAnalysis?.distribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis label={{ value: 'Average LTV ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="current_ltv" fill="#3b82f6" name="Current LTV" />
              <Bar dataKey="projected_ltv" fill="#10b981" name="Projected LTV" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cohort Analysis Heatmap */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Retention Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cohort</th>
                {[...Array(12)].map((_, i) => (
                  <th key={i} className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                    M{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cohortAnalysis?.heatmap?.map((cohort, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 font-medium text-gray-900">{cohort.name}</td>
                  {cohort.retention.map((value, i) => (
                    <td
                      key={i}
                      className="px-4 py-2 text-center text-sm"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${value / 100})`,
                        color: value > 50 ? 'white' : 'black'
                      }}
                    >
                      {value}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Churn Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Risk Scoring</h3>
          <div className="space-y-4">
            {data.churnPrediction?.risk_segments?.map((segment, idx) => (
              <div key={idx} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{segment.name}</p>
                    <p className="text-sm text-gray-600">
                      {segment.count} donors • ${segment.value.toLocaleString()} at risk
                    </p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{segment.score}%</span>
                </div>
                <ChurnRiskIndicator score={segment.score} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={data.churnPrediction?.risk_factors || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="factor" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Risk Score" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reactivation Opportunities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reactivation Campaign Targets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.reactivationPotential?.segments?.map((segment, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  segment.priority === 'high' ? 'bg-red-100 text-red-800' :
                  segment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {segment.priority.toUpperCase()} PRIORITY
                </span>
                <Clock size={16} className="text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{segment.name}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Donors: {segment.count}</p>
                <p>Avg Last Gift: ${segment.avg_last_gift}</p>
                <p>Success Rate: {segment.predicted_success}%</p>
                <p className="font-medium text-gray-900">
                  Potential Recovery: ${segment.potential_recovery.toLocaleString()}
                </p>
              </div>
              <button className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Create Campaign
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonorRetentionAnalytics;