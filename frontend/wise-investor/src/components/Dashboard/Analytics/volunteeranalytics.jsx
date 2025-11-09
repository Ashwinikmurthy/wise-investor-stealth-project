import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter
} from 'recharts';
import {
  Users, Clock, Award, Calendar, TrendingUp, Heart,
  Activity, Star, UserCheck, UserX, MapPin, Briefcase,
  Gift, ChevronRight, Download, Filter, RefreshCw,
  Medal, Target, Zap, AlertCircle
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const VolunteerAnalyticsDashboard = ({ organizationId, authToken }) => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('current_year');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [data, setData] = useState({
    overview: null,
    engagement: null,
    retention: null,
    activities: null,
    skills: null,
    impact: null,
    recognition: null,
    scheduling: null
  });

  const fetchVolunteerData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      const [overview, engagement, retention, activities, skills, impact, recognition, scheduling] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/${organizationId}/volunteers/overview?period=${timeRange}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/volunteers/engagement`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/volunteers/retention`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/volunteers/activities`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/volunteers/skills`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/volunteers/impact`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/volunteers/recognition`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/volunteers/scheduling`, { headers }).then(r => r.json())
      ]);

      setData({
        overview,
        engagement,
        retention,
        activities,
        skills,
        impact,
        recognition,
        scheduling
      });
    } catch (error) {
      console.error('Error fetching volunteer data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId && authToken) {
      fetchVolunteerData();
    }
  }, [organizationId, authToken, timeRange]);

  // Engagement Level Component
  const EngagementLevelIndicator = ({ level, percentage, count }) => {
    const getColor = () => {
      switch(level) {
        case 'Highly Engaged': return 'bg-green-500';
        case 'Engaged': return 'bg-blue-500';
        case 'Moderate': return 'bg-yellow-500';
        case 'At Risk': return 'bg-orange-500';
        case 'Inactive': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getColor()}`}></div>
          <div>
            <p className="text-sm font-medium text-gray-900">{level}</p>
            <p className="text-xs text-gray-500">{count} volunteers</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{percentage}%</p>
        </div>
      </div>
    );
  };

  // Volunteer Card Component
  const VolunteerSpotlight = ({ volunteer }) => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {volunteer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-medium text-gray-900">{volunteer.name}</p>
              <p className="text-sm text-gray-600">{volunteer.role}</p>
            </div>
          </div>
          <Medal className="text-yellow-500" size={20} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Hours Contributed</span>
            <span className="font-medium">{volunteer.hours}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Impact Score</span>
            <span className="font-medium">{volunteer.impactScore}/100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tenure</span>
            <span className="font-medium">{volunteer.tenure}</span>
          </div>
        </div>
        <button className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          View Profile
        </button>
      </div>
    );
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Volunteer Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and optimize volunteer engagement and impact</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="current_month">Current Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="all_time">All Time</option>
            </select>
            <button
              onClick={fetchVolunteerData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-indigo-500" size={24} />
            <span className={`text-sm font-medium ${
              data.overview?.volunteer_growth > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.overview?.volunteer_growth > 0 ? '+' : ''}{data.overview?.volunteer_growth}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Active Volunteers</p>
          <p className="text-2xl font-bold text-gray-900">{data.overview?.active_volunteers || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.overview?.new_this_month || 0} new this month
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-green-500" size={24} />
            <Activity className="text-green-400" size={16} />
          </div>
          <p className="text-sm text-gray-600">Total Hours</p>
          <p className="text-2xl font-bold text-gray-900">{data.overview?.total_hours?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            ${(data.overview?.total_hours * 29.95).toLocaleString()} value
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="text-blue-500" size={24} />
            <span className="text-sm font-medium text-blue-600">
              {data.retention?.rate || 0}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Retention Rate</p>
          <p className="text-2xl font-bold text-gray-900">{data.retention?.retained || 0}</p>
          <p className="text-xs text-gray-500 mt-1">volunteers retained</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="text-yellow-500" size={24} />
            <Zap className="text-yellow-400" size={16} />
          </div>
          <p className="text-sm text-gray-600">Avg Satisfaction</p>
          <p className="text-2xl font-bold text-gray-900">{data.engagement?.avg_satisfaction || 0}/5</p>
          <p className="text-xs text-gray-500 mt-1">
            from {data.engagement?.survey_responses || 0} responses
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-purple-500" size={24} />
            <TrendingUp className="text-purple-400" size={16} />
          </div>
          <p className="text-sm text-gray-600">Task Completion</p>
          <p className="text-2xl font-bold text-gray-900">{data.activities?.completion_rate || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.activities?.completed_tasks || 0} tasks completed
          </p>
        </div>
      </div>

      {/* Engagement & Retention Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Engagement Levels */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Volunteer Engagement Levels</h3>
          <div className="space-y-3 mb-4">
            {data.engagement?.levels?.map((level, idx) => (
              <EngagementLevelIndicator
                key={idx}
                level={level.name}
                percentage={level.percentage}
                count={level.count}
              />
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.engagement?.levels || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.engagement?.levels?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Retention Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retention Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.retention?.monthly_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="retention_rate" stroke="#3b82f6" name="Retention Rate (%)" />
              <Line type="monotone" dataKey="new_volunteers" stroke="#10b981" name="New Volunteers" />
              <Line type="monotone" dataKey="churned" stroke="#ef4444" name="Churned" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Skills Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.skills?.distribution || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Available" dataKey="available" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Radar name="Needed" dataKey="needed" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Types */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.activities?.types || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Impact Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Volunteer Impact</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Heart className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Lives Impacted</p>
                  <p className="text-xs text-gray-600">Direct beneficiaries</p>
                </div>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {data.impact?.lives_impacted?.toLocaleString() || 0}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Gift className="text-green-500" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Services Delivered</p>
                  <p className="text-xs text-gray-600">This period</p>
                </div>
              </div>
              <p className="text-xl font-bold text-green-600">
                {data.impact?.services_delivered || 0}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Briefcase className="text-purple-500" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Projects Completed</p>
                  <p className="text-xs text-gray-600">Team efforts</p>
                </div>
              </div>
              <p className="text-xl font-bold text-purple-600">
                {data.impact?.projects_completed || 0}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <DollarSign className="text-yellow-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Economic Value</p>
                  <p className="text-xs text-gray-600">Based on hourly rate</p>
                </div>
              </div>
              <p className="text-xl font-bold text-yellow-600">
                ${data.impact?.economic_value?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling Heatmap */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Volunteer Availability Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <th key={day} className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.scheduling?.heatmap?.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.time}</td>
                  {row.days.map((value, i) => (
                    <td
                      key={i}
                      className="px-4 py-2 text-center text-sm"
                      style={{
                        backgroundColor: `rgba(99, 102, 241, ${value / 100})`,
                        color: value > 50 ? 'white' : 'black'
                      }}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volunteer Spotlight */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Volunteer Spotlight</h3>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.recognition?.spotlight?.map((volunteer, idx) => (
            <VolunteerSpotlight key={idx} volunteer={volunteer} />
          ))}
        </div>
      </div>

      {/* Recognition & Awards */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Recognition Program</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="text-yellow-300" size={24} />
              <span className="text-2xl font-bold">{data.recognition?.awards_given || 0}</span>
            </div>
            <p className="text-sm font-medium">Awards Given</p>
            <p className="text-xs opacity-90 mt-1">This period</p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Medal className="text-yellow-300" size={24} />
              <span className="text-2xl font-bold">{data.recognition?.milestones_reached || 0}</span>
            </div>
            <p className="text-sm font-medium">Milestones Reached</p>
            <p className="text-xs opacity-90 mt-1">Hour milestones</p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="text-yellow-300" size={24} />
              <span className="text-2xl font-bold">{data.recognition?.top_performers || 0}</span>
            </div>
            <p className="text-sm font-medium">Top Performers</p>
            <p className="text-xs opacity-90 mt-1">This month</p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="text-red-300" size={24} />
              <span className="text-2xl font-bold">{data.recognition?.appreciation_sent || 0}</span>
            </div>
            <p className="text-sm font-medium">Thank You Notes</p>
            <p className="text-xs opacity-90 mt-1">Sent this month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerAnalyticsDashboard;