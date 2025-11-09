import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard, TrendingUp, Users, Heart, DollarSign, Award,
  AlertTriangle, Target, Activity, Menu, LogOut, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Gift, Star, Clock, CheckCircle
} from 'lucide-react';

const API_BASE_URL = '/api/v1';
const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

const Dashboard = () => {
  const { isAuthenticated, getToken, getOrganizationId, logout, user } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('executive');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch data function
  const fetchData = async (endpoint, key) => {
    const token = getToken();
    const orgId = getOrganizationId();

    if (!token || !orgId) return;

    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const url = `${API_BASE_URL}${endpoint.replace('{organizationId}', orgId)}`;
      console.log(`Fetching ${key}:`, url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${key}:`, result);
        setData(prev => ({ ...prev, [key]: result }));
      }
    } catch (error) {
      console.error(`❌ ${key}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Load data based on active section
  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeSection === 'executive') {
      fetchData('/analytics/executive-dashboard/{organizationId}', 'executive');
      fetchData('/analytics/fundraising-vitals/{organizationId}', 'vitals');
      fetchData('/analytics/revenue-rollup/{organizationId}', 'revenue');
    } else if (activeSection === 'donors') {
      fetchData('/analytics/donor-lifecycle/{organizationId}', 'lifecycle');
      fetchData('/analytics/donor-segments/{organizationId}', 'segments');
      fetchData('/analytics/audience-growth/{organizationId}', 'growth');
    }
  }, [activeSection, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
      </div>
    </div>;
  }

  const executive = data.executive || {};
  const vitals = data.vitals || {};
  const revenue = data.revenue || {};
  const lifecycle = data.lifecycle || {};
  const segments = data.segments || {};
  const growth = data.growth || {};

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold text-blue-600">Wise Investor</h1>
              <p className="text-xs text-gray-500">Analytics Platform</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveSection('executive')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
              activeSection === 'executive' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Executive Dashboard</span>}
          </button>

          <button
            onClick={() => setActiveSection('donors')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
              activeSection === 'donors' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Donor Analytics</span>}
          </button>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-10 h-10 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center mx-auto transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Executive Dashboard Section */}
          {activeSection === 'executive' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
                  <p className="text-gray-600 mt-1">High-level overview of organizational performance</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  <Download className="w-4 h-4" />
                  <span className="font-medium">Export Report</span>
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                      {loading.executive ? (
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                          ${executive.total_revenue_ytd ? (executive.total_revenue_ytd / 1000).toFixed(0) : '0'}K
                        </h3>
                      )}
                      <p className="text-xs text-gray-500">Year to date</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Active Donors */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Active Donors</p>
                      {loading.executive ? (
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                          {(executive.active_donors || 0).toLocaleString()}
                        </h3>
                      )}
                      <p className="text-xs text-gray-500">Currently active</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Retention Rate */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Retention Rate</p>
                      {loading.executive ? (
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                          {executive.donor_retention_rate ? executive.donor_retention_rate.toFixed(1) : '0'}%
                        </h3>
                      )}
                      <p className="text-xs text-gray-500">Donor retention</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Average Gift */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Average Gift</p>
                      {loading.executive ? (
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                          ${executive.avg_gift_size ? executive.avg_gift_size.toFixed(0) : '0'}
                        </h3>
                      )}
                      <p className="text-xs text-gray-500">Per donation</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <Gift className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Indicators */}
              {executive.health_indicators && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Organization Health Indicators
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Fundraising Health</p>
                      <p className="text-2xl font-bold text-green-600">{executive.health_indicators.fundraising_health}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Donor Pipeline</p>
                      <p className="text-2xl font-bold text-green-600">{executive.health_indicators.donor_pipeline}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Donor Engagement</p>
                      <p className="text-2xl font-bold text-orange-600">{executive.health_indicators.donor_engagement}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* At Risk Alert */}
              {executive.at_risk_donors > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-900 mb-1">Attention Required</h4>
                      <p className="text-yellow-800">
                        <strong className="text-2xl">{executive.at_risk_donors}</strong> donors are at risk of lapsing and need immediate attention
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fundraising Vitals */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Key Fundraising Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">CPDR</p>
                    <p className="text-2xl font-bold text-red-600">${(vitals.cpdr || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Cost per dollar raised</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Donor LTV</p>
                    <p className="text-2xl font-bold text-yellow-600">${((vitals.avg_ltv || 0) / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-gray-500 mt-1">Lifetime value</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Acquisition Cost</p>
                    <p className="text-2xl font-bold text-indigo-600">${(vitals.acquisition_cost || 0).toFixed(0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Per new donor</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Campaign ROI</p>
                    <p className="text-2xl font-bold text-teal-600">{(vitals.campaign_roi || 0).toFixed(1)}x</p>
                    <p className="text-xs text-gray-500 mt-1">Return on investment</p>
                  </div>
                </div>
              </div>

              {/* Revenue Chart */}
              {revenue.yearly_data && revenue.yearly_data.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">3-Year Revenue Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenue.yearly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        formatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total_revenue" fill="#2563eb" name="Revenue" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="donor_count" fill="#7c3aed" name="Donors" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Donor Analytics Section */}
          {activeSection === 'donors' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Donor Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive donor insights and segmentation</p>
              </div>

              {/* Lifecycle Pipeline */}
              {lifecycle.pipeline_stages && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {lifecycle.pipeline_stages.map((stage, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 capitalize">{stage.stage}</h4>
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">{stage.count?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-gray-600">${((stage.total_value || 0) / 1000).toFixed(0)}K total value</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Donor Segments Chart */}
              {segments.segments && segments.segments.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Donor Segmentation</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={segments.segments}
                        dataKey="count"
                        nameKey="segment"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.segment}: ${entry.count}`}
                      >
                        {segments.segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Audience Growth */}
              {growth.monthly_growth && growth.monthly_growth.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Audience Growth Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={growth.monthly_growth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="new_donors" stackId="1" stroke="#2563eb" fill="#2563eb" name="New Donors" />
                      <Area type="monotone" dataKey="retained_donors" stackId="1" stroke="#16a34a" fill="#16a34a" name="Retained" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Refresh Button */}
      <button
        onClick={() => window.location.reload()}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
        title="Refresh Data"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Dashboard;