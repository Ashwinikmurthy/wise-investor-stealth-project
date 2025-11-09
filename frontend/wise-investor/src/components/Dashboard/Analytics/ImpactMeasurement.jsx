import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap,
  AreaChart, Area, ComposedChart
} from 'recharts';
import {
  Heart, Users, Target, TrendingUp, Award, Activity,
  Globe, BookOpen, Home, Briefcase, DollarSign, Calendar,
  CheckCircle, AlertCircle, Info, ChevronRight, Download,
  BarChart3, Map, Zap, Star
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ImpactMeasurementDashboard = ({ organizationId, authToken }) => {
  const [loading, setLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [timeframe, setTimeframe] = useState('current_year');
  const [impactView, setImpactView] = useState('overview');
  const [data, setData] = useState({
    programs: [],
    outcomes: null,
    beneficiaries: null,
    sdgAlignment: null,
    costEffectiveness: null,
    socialReturn: null,
    impactStories: [],
    geographicReach: null
  });

  const fetchImpactData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      const [programs, outcomes, beneficiaries, sdg, costEffect, socialReturn, stories, geographic] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/${organizationId}/programs/list`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/impact/outcomes?program=${selectedProgram}&period=${timeframe}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/impact/beneficiaries?program=${selectedProgram}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/impact/sdg-alignment`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/impact/cost-effectiveness?program=${selectedProgram}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/impact/social-return`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/impact/stories?limit=5`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/impact/geographic-reach`, { headers }).then(r => r.json())
      ]);

      setData({
        programs,
        outcomes,
        beneficiaries,
        sdgAlignment: sdg,
        costEffectiveness: costEffect,
        socialReturn,
        impactStories: stories,
        geographicReach: geographic
      });
    } catch (error) {
      console.error('Error fetching impact data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId && authToken) {
      fetchImpactData();
    }
  }, [organizationId, authToken, selectedProgram, timeframe]);

  // Impact Score Visualization
  const ImpactScoreCard = ({ score, label, icon: Icon, color }) => {
    const getScoreLevel = () => {
      if (score >= 90) return 'Exceptional';
      if (score >= 75) return 'Strong';
      if (score >= 60) return 'Good';
      if (score >= 45) return 'Moderate';
      return 'Developing';
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <Icon className={`${color}`} size={32} />
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            score >= 75 ? 'bg-green-100 text-green-800' :
            score >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {getScoreLevel()}
          </span>
        </div>
        <h3 className="text-sm text-gray-600 mb-2">{label}</h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">{score}</span>
          <span className="text-lg text-gray-500 ml-1">/100</span>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${color.replace('text', 'bg')}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  };

  // SDG Alignment Badge
  const SDGBadge = ({ goal, alignment }) => {
    const sdgColors = {
      1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D',
      5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942',
      9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E',
      13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D',
      17: '#19486A'
    };

    return (
      <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-2"
          style={{ backgroundColor: sdgColors[goal.number] || '#666' }}
        >
          {goal.number}
        </div>
        <p className="text-xs text-center text-gray-700 mb-1">{goal.name}</p>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-green-500"
            style={{ width: `${alignment}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 mt-1">{alignment}% aligned</span>
      </div>
    );
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Impact Measurement Dashboard</h1>
            <p className="text-gray-600 mt-1">Track and measure your organization's social impact</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Programs</option>
              {data.programs?.map(program => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="current_month">Current Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="all_time">All Time</option>
            </select>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <Download size={18} />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Impact Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ImpactScoreCard
          score={data.outcomes?.overall_impact_score || 0}
          label="Overall Impact Score"
          icon={Target}
          color="text-blue-600"
        />
        <ImpactScoreCard
          score={data.outcomes?.efficiency_score || 0}
          label="Program Efficiency"
          icon={Activity}
          color="text-green-600"
        />
        <ImpactScoreCard
          score={data.outcomes?.reach_score || 0}
          label="Community Reach"
          icon={Users}
          color="text-purple-600"
        />
        <ImpactScoreCard
          score={data.outcomes?.sustainability_score || 0}
          label="Sustainability"
          icon={Globe}
          color="text-yellow-600"
        />
      </div>

      {/* Key Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-500" size={20} />
            <span className="text-xs text-green-600">+{data.beneficiaries?.growth || 0}%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.beneficiaries?.total?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-600">Lives Impacted</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Home className="text-green-500" size={20} />
            <span className="text-xs text-green-600">+{data.beneficiaries?.communities_growth || 0}%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.beneficiaries?.communities || 0}</p>
          <p className="text-xs text-gray-600">Communities Served</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="text-purple-500" size={20} />
            <span className="text-xs text-green-600">+{data.outcomes?.programs_growth || 0}%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.programs?.length || 0}</p>
          <p className="text-xs text-gray-600">Active Programs</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Briefcase className="text-orange-500" size={20} />
            <span className="text-xs text-green-600">New</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.outcomes?.services_provided || 0}</p>
          <p className="text-xs text-gray-600">Services Provided</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-yellow-500" size={20} />
            <Zap className="text-yellow-400" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900">${data.costEffectiveness?.cost_per_impact || 0}</p>
          <p className="text-xs text-gray-600">Cost per Impact</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-red-500" size={20} />
            <Star className="text-yellow-400" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.socialReturn?.sroi || 0}x</p>
          <p className="text-xs text-gray-600">Social ROI</p>
        </div>
      </div>

      {/* Program Outcomes & Beneficiary Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Program Outcomes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Outcomes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.outcomes?.dimensions || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Target" dataKey="target" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
              <Radar name="Achieved" dataKey="achieved" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Beneficiary Demographics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Beneficiary Demographics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.beneficiaries?.demographics || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.beneficiaries?.demographics?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SDG Alignment */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sustainable Development Goals Alignment</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-12 gap-4">
          {data.sdgAlignment?.goals?.map((goal, idx) => (
            <SDGBadge key={idx} goal={goal} alignment={goal.alignment} />
          ))}
        </div>
      </div>

      {/* Cost Effectiveness Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Effectiveness by Program</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.costEffectiveness?.programs || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="program" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="totalCost" fill="#3b82f6" name="Total Cost ($)" />
              <Bar yAxisId="left" dataKey="beneficiaries" fill="#10b981" name="Beneficiaries" />
              <Line yAxisId="right" type="monotone" dataKey="costPerBeneficiary" stroke="#f59e0b" name="Cost per Beneficiary ($)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Return on Investment</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">For every $1 invested:</p>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">
                      ${data.socialReturn?.sroi || 0}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Social Value Created</p>
                  <p className="text-xs text-gray-500">Based on {data.socialReturn?.methodology || 'SROI'} methodology</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Economic Value</span>
                <span className="text-sm font-medium">${data.socialReturn?.economic || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Social Value</span>
                <span className="text-sm font-medium">${data.socialReturn?.social || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Environmental Value</span>
                <span className="text-sm font-medium">${data.socialReturn?.environmental || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Reach */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Impact Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={data.geographicReach?.regions || []}
              dataKey="beneficiaries"
              aspectRatio={4/3}
              stroke="#fff"
              fill="#3b82f6"
            >
              <Tooltip />
            </Treemap>
          </ResponsiveContainer>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Top Impact Regions</h4>
            {data.geographicReach?.top_regions?.map((region, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Map className="text-blue-500" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">{region.name}</p>
                    <p className="text-sm text-gray-600">{region.beneficiaries.toLocaleString()} beneficiaries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{region.programs} programs</p>
                  <p className="text-sm text-gray-600">${region.investment.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Stories */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Recent Impact Stories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.impactStories?.slice(0, 3).map((story, idx) => (
            <div key={idx} className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Heart size={20} />
                <span className="text-sm font-medium">{story.program}</span>
              </div>
              <h4 className="font-medium mb-2">{story.title}</h4>
              <p className="text-sm opacity-90 mb-3">{story.summary}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-75">{story.date}</span>
                <button className="text-xs font-medium hover:underline flex items-center">
                  Read More <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImpactMeasurementDashboard;