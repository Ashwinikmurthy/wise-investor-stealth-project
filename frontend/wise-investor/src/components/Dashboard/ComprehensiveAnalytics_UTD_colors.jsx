import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertCircle, TrendingUp, Users, DollarSign, Target, Activity, Menu, X, ChevronRight, RefreshCw, Settings, Download, Award, Calendar, TrendingDown, AlertTriangle, CheckCircle, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = '';

// UT Dallas Brand Colors
const UTD_COLORS = {
  primary: '#e87500',      // UT Dallas Orange
  secondary: '#154734',    // UT Dallas Green
  accent: '#5fe0b7',       // Accent Green
  light: '#FFF5ED',        // Light Orange
  dark: '#0A1F16',         // Dark Green
};

// Chart color palettes
const CHART_COLORS = ['#e87500', '#154734', '#5fe0b7', '#FFF5ED', '#0A1F16'];
const GRADIENT_COLORS = {
  orange: 'from-orange-500 to-orange-600',
  green: 'from-green-700 to-green-800',
  accent: 'from-[#5fe0b7] to-[#154734]',
  primary: 'from-[#e87500] to-[#154734]'
};

// Utility function to format percentages consistently
const formatPercent = (value) => {
  if (value == null || isNaN(Number(value))) {
    return { display: "—", pct: 0 };
  }
  let x = Number(value);

  // If value is between 0 and 1, treat as fraction and convert to percentage
  // If value is > 1, treat as already being a percentage
  const pct = x <= 1 ? x * 100 : x;

  // Clamp between 0 and 100
  const pctClamped = Math.max(0, Math.min(100, pct));
  const display = `${pctClamped.toFixed(1)}%`;
  return { display, pct: pctClamped };
};

const ComprehensiveAnalytics = () => {
  const { user, isAuthenticated, logout, getToken, getOrganizationId, isSuperadmin } = useAuth();
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState('');
  const [currentView, setCurrentView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({});

  const apiCall = async (endpoint) => {
     try {
       const token = getToken();

       if (!token) {
         throw new Error('No authentication token found');
       }

       console.log(`🔵 API Call: ${endpoint}`);

       const response = await fetch(`${API_BASE_URL}${endpoint}`, {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
         }
       });

       if (!response.ok) {
         if (response.status === 401) {
           console.error('❌ Authentication failed - logging out');
           logout();
           navigate('/login');
           throw new Error('Session expired. Please login again.');
         }
         if (response.status === 403) {
           throw new Error('Access denied. You do not have permission to view this data.');
         }
         throw new Error(`API Error: ${response.status} ${response.statusText}`);
       }

       const data = await response.json();
       console.log(`✅ API Success: ${endpoint}`);
       return data;
     } catch (err) {
       console.error(`❌ Error calling ${endpoint}:`, err);
       return null;
     }
   };
  // ========== AUTHENTICATION CHECK ==========
    useEffect(() => {
      if (!isAuthenticated) {
        console.log('❌ User not authenticated - redirecting to login');
        navigate('/login');
      }
    }, [isAuthenticated, navigate]);

    // ========== INITIALIZE ORGANIZATION ID ==========
    useEffect(() => {
      if (isAuthenticated && user) {
        const userOrgId = getOrganizationId();
        if (userOrgId) {
          console.log('✅ Organization ID initialized:', userOrgId);
          setOrgId(userOrgId);
        } else {
          console.warn('⚠️ No organization ID found for user');
          setError('No organization assigned to your account');
        }
      }
    }, [isAuthenticated, user, getOrganizationId]);


  useEffect(() => {
    if (orgId && isAuthenticated) {
          console.log('🔄 Loading analytics for org:', orgId);
          loadDashboardData(orgId);
        }
    //if (orgId) loadDashboardData();
  }, [currentView, orgId]);
     const getAuthHeaders = () => {
        const token = getToken();
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      };

  const loadDashboardData = async (orgId) => {
    if (!orgId) return;
    setLoading(true);

        setError(null);
        const headers = getAuthHeaders();

        if (!orgId) {
          setError('Organization ID not found');
          setLoading(false);
          return;
        }

        const token = getToken();
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
    //setError(null);
    try {
      const data = {};
      const endpoints = {
        overview: ['mission-vision', 'swot', 'fundraising-vitals', 'donor-lifecycle', 'revenue-rollup', 'audience-growth'],
        mission: ['mission-vision'],
        swot: ['swot'],
        fundraising: ['fundraising-vitals'],
        lifecycle: ['donor-lifecycle'],
        revenue: ['revenue-rollup'],
        audience: ['audience-growth'],
        programs: ['program-impact'],
        digital: ['digital-performance'],
        targets: ['high-impact-targets'],
        'donor-segments': ['donor-segments'],
        'donor-movement': ['donor-movement'],
        'donor-ltv': ['donor-ltv?limit=20'],
        'donor-journey': ['donor-journey'],
        'legacy-pipeline': ['legacy-pipeline'],
        'upgrade-readiness': ['donor-segments/upgrade-readiness?min_score=0.6'],
        'advanced-lifecycle': ['advanced/donor-lifecycle?include_at_risk=true&risk_threshold=medium'],
        'impact-correlation': ['advanced/impact-correlation?lag_months=3'],
        'executive-dashboard': ['executive-dashboard?period=YTD'],
        'okrs': ['okrs?period=2025'],
        'executive-scorecard': ['executive-scorecard?period=YTD'],
        'revenue-timeline': ['timeline/revenue-trends?months=12'],
        'yoy-comparison': ['timeline/year-over-year'],
        'seasonal-patterns': ['timeline/seasonal-patterns?years=2'],
        'donor-analytics': ['avg-donation', 'cpdr', 'acquisition-cost', 'retention-rate?prev_start=2024-01-01T00:00:00Z&prev_end=2024-12-31T23:59:59Z&curr_start=2025-01-01T00:00:00Z&curr_end=2025-12-31T23:59:59Z'],
      };

      const viewEndpoints = endpoints[currentView] || [];
      for (const endpoint of viewEndpoints) {
        const key = endpoint.split('?')[0].split('/').pop();
        data[key] = await apiCall(`/api/v1/analytics/${endpoint.replace(/\?.*$/, '')}/${orgId}${endpoint.includes('?') ? '?' + endpoint.split('?')[1] : ''}`);
      }

      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity, section: 'core' },
    { id: 'executive-dashboard', label: 'Executive Dashboard', icon: Award, section: 'executive' },
    { id: 'mission', label: 'Mission & Vision', icon: Target, section: 'core' },
    { id: 'swot', label: 'SWOT Analysis', icon: Activity, section: 'core' },
    { id: 'fundraising', label: 'Fundraising Vitals', icon: DollarSign, section: 'core' },
    { id: 'lifecycle', label: 'Donor Lifecycle', icon: Users, section: 'core' },
    { id: 'revenue', label: 'Revenue Rollup', icon: TrendingUp, section: 'core' },
    { id: 'revenue-timeline', label: 'Revenue Timeline', icon: TrendingUp, section: 'timeline' },
    { id: 'yoy-comparison', label: 'Year over Year', icon: TrendingUp, section: 'timeline' },
    { id: 'seasonal-patterns', label: 'Seasonal Patterns', icon: Calendar, section: 'timeline' },
    { id: 'audience', label: 'Audience Growth', icon: Users, section: 'core' },
    { id: 'programs', label: 'Program Impact', icon: Target, section: 'core' },
    { id: 'digital', label: 'Digital KPIs', icon: Activity, section: 'core' },
    { id: 'targets', label: 'Strategic Targets', icon: Target, section: 'core' },
    { id: 'donor-segments', label: 'Donor Segments', icon: Users, section: 'donor' },
    { id: 'donor-movement', label: 'Donor Movement', icon: TrendingUp, section: 'donor' },
    { id: 'donor-ltv', label: 'Donor LTV', icon: DollarSign, section: 'donor' },
    { id: 'donor-journey', label: 'Donor Journey', icon: Activity, section: 'donor' },
    { id: 'donor-analytics', label: 'Donor Analytics', icon: Activity, section: 'donor' },
    { id: 'legacy-pipeline', label: 'Legacy Pipeline', icon: Target, section: 'donor' },
    { id: 'upgrade-readiness', label: 'Upgrade Readiness', icon: TrendingUp, section: 'donor' },
    { id: 'advanced-lifecycle', label: 'Advanced Lifecycle', icon: Users, section: 'advanced' },
    { id: 'impact-correlation', label: 'Impact Correlation', icon: TrendingUp, section: 'advanced' },
    { id: 'okrs', label: 'OKRs', icon: Target, section: 'executive' },
    { id: 'executive-scorecard', label: 'Executive Scorecard', icon: Award, section: 'executive' },
  ];



  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium">Loading analytics data...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your insights</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="bg-white border-2 border-red-200 rounded-2xl p-8 max-w-lg shadow-xl">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-3 text-center">Unable to Load Data</h3>
            <p className="text-red-700 mb-6 text-center">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={loadDashboardData}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 font-medium shadow-lg transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    const views = {
      overview: <OverviewView data={dashboardData} />,
      'executive-dashboard': <ExecutiveDashboardView data={dashboardData['executive-dashboard']} />,
      mission: <MissionView data={dashboardData['mission-vision']} />,
      swot: <SWOTView data={dashboardData.swot} />,
      fundraising: <FundraisingView data={dashboardData['fundraising-vitals']} />,
      lifecycle: <LifecycleView data={dashboardData['donor-lifecycle']} />,
      revenue: <RevenueView data={dashboardData['revenue-rollup']} />,
      'revenue-timeline': <RevenueTimelineView data={dashboardData['revenue-trends']} />,
      'yoy-comparison': <YoYComparisonView data={dashboardData['year-over-year']} />,
      'seasonal-patterns': <SeasonalPatternsView data={dashboardData['seasonal-patterns']} />,
      audience: <AudienceView data={dashboardData['audience-growth']} />,
      programs: <ProgramsView data={dashboardData['program-impact']} />,
      digital: <DigitalView data={dashboardData['digital-performance']} />,
      targets: <TargetsView data={dashboardData['high-impact-targets']} />,
      'donor-segments': <DonorSegmentsView data={dashboardData['donor-segments']} />,
      'donor-movement': <DonorMovementView data={dashboardData['donor-movement']} />,
      'donor-ltv': <DonorLTVView data={dashboardData['donor-ltv']} />,
      'donor-journey': <DonorJourneyView data={dashboardData['donor-journey']} />,
      'donor-analytics': <DonorAnalyticsView data={dashboardData} />,
      'legacy-pipeline': <LegacyPipelineView data={dashboardData['legacy-pipeline']} />,
      'upgrade-readiness': <UpgradeReadinessView data={dashboardData['upgrade-readiness']} />,
      'advanced-lifecycle': <AdvancedLifecycleView data={dashboardData['donor-lifecycle']} />,
      'impact-correlation': <ImpactCorrelationView data={dashboardData['impact-correlation']} />,
      okrs: <OKRsView data={dashboardData.okrs} />,
      'executive-scorecard': <ExecutiveScorecardView data={dashboardData['executive-scorecard']} />,
    };

    return views[currentView] || <div>Select a view</div>;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-[#154734] to-[#0A1F16] text-white transition-all duration-300 flex flex-col overflow-y-auto shadow-2xl`}>
        <div className="p-6 flex items-center justify-between border-b border-green-800 sticky top-0 bg-[#154734] z-10">
          {sidebarOpen && (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-green-800 bg-clip-text text-transparent">Analytics Hub</h2>
              <p className="text-xs text-green-200 mt-1">Executive Dashboard</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-green-700/50 rounded-lg transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-3">
          {['core', 'timeline', 'donor', 'advanced', 'executive'].map(section => (
            <div key={section} className="mb-6">
              {sidebarOpen && (
                <div className="text-xs text-green-200 px-4 py-2 font-bold uppercase tracking-wider">
                  {section} Analytics
                </div>
              )}
              {navItems.filter(item => item.section === section).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                      currentView === item.id
                        ? 'bg-gradient-to-r from-orange-500 to-green-800 text-white shadow-lg transform scale-105'
                        : 'text-slate-300 hover:bg-green-700/50 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={currentView === item.id ? 'animate-pulse' : ''} />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-800 rounded-lg flex items-center justify-center">
                  {navItems.find(item => item.id === currentView)?.icon &&
                    React.createElement(navItems.find(item => item.id === currentView).icon, { size: 20, className: "text-white" })
                  }
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{navItems.find(item => item.id === currentView)?.label}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Organization ID:</span>
                <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg">{orgId.substring(0, 8)}...</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{user?.email || 'User'}</div>
                  <div className="text-xs text-gray-500">
                    {isSuperadmin ? '👑 Superadmin' : 'Organization User'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-all font-medium border border-red-200"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-orange-50 via-white to-green-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, change, icon: Icon, trend = 'up' }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all transform hover:scale-[1.02]">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-gradient-to-br from-orange-500 to-green-800 p-4 rounded-xl shadow-lg">
        <Icon className="text-white" size={24} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
          trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{trend === 'up' ? '+' : ''}{change}</span>
        </div>
      )}
    </div>
    <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</p>
  </div>
);

const OverviewView = ({ data }) => {
  // Check if required data exists using the CORRECT keys
  if (!data['fundraising-vitals'] || !data['donor-lifecycle'] || !data['audience-growth']) {
    return <div className="text-gray-500">Loading overview data...</div>;
  }

  const fundraisingData = data['fundraising-vitals'];
  const lifecycleData = data['donor-lifecycle'];
  const audienceData = data['audience-growth'];
  const revenueData = data['revenue-rollup'];

  // Create stats using the ACTUAL data structure from your APIs
  const stats = [
    {
      label: 'Total Donors (Pipeline)',
      value: lifecycleData.summary?.total_in_pipeline || 0,
      icon: Users
    },
    {
      label: 'Current Month Revenue',
      value: `$${(fundraisingData.current_month?.revenue || 0).toLocaleString()}`,
      icon: DollarSign
    },
    {
      label: 'YTD Revenue',
      value: `$${(fundraisingData.year_to_date?.revenue || 0).toLocaleString()}`,
      icon: TrendingUp
    },
    {
      label: 'Avg Gift (YTD)',
      value: `$${(fundraisingData.year_to_date?.avg_gift || 0).toFixed(2)}`,
      icon: Target
    },
  ];

  const COLORS = ['#e87500', '#5fe0b7', '#10b981', '#f59e0b', '#ef4444'];

  // Prepare lifecycle pipeline data for the chart
  const lifecycleChartData = lifecycleData.pipeline_stages || [];

  return (
    <div className="space-y-8">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Month over Month Growth */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Month-over-Month Growth</h3>
          <div className={`px-4 py-2 rounded-lg ${
            fundraisingData.trends?.trend_direction === 'Up' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <span className={`font-semibold text-sm ${
              fundraisingData.trends?.trend_direction === 'Up' ? 'text-green-700' : 'text-red-700'
            }`}>
              {fundraisingData.trends?.trend_direction === 'Up' ? '↑' : '↓'} {fundraisingData.trends?.mom_growth_rate?.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 text-sm mb-2">Last Month Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              ${(fundraisingData.last_month?.revenue || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-2">Current Month Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              ${(fundraisingData.current_month?.revenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donor Lifecycle Pipeline */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Donor Lifecycle Pipeline</h3>
            <div className="bg-orange-50 px-4 py-2 rounded-lg">
              <span className="text-orange-600 font-semibold text-sm">Live Data</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={lifecycleChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="stage"
                angle={-45}
                textAnchor="end"
                height={100}
                style={{ fontSize: '12px', fill: '#6b7280' }}
              />
              <YAxis style={{ fontSize: '12px', fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value, name) => {
                  if (name === 'count') return [value, 'Donors'];
                  if (name === 'total_value') return [`$${value.toLocaleString()}`, 'Total Value'];
                  return [value, name];
                }}
              />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e87500" />
                  <stop offset="100%" stopColor="#0A1F16" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lifecycle Pipeline Distribution (Pie Chart) */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Pipeline Distribution</h3>
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <span className="text-green-700 font-semibold text-sm">
                {lifecycleData.summary?.total_in_pipeline || 0} Total
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={lifecycleChartData.map(stage => ({
                  name: stage.stage,
                  value: stage.count
                }))}
                cx="50%"
                cy="50%"
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                dataKey="value"
                labelStyle={{ fontSize: '12px', fontWeight: '600' }}
              >
                {lifecycleChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Three-Year Comparison */}
      {revenueData && revenueData.three_year_comparison && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Three-Year Revenue Trend</h3>
            <div className="bg-purple-50 px-4 py-2 rounded-lg">
              <span className="text-purple-700 font-semibold text-sm">
                YoY Growth: {revenueData.summary?.yoy_growth_rate?.toFixed(1)}%
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={revenueData.three_year_comparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="year"
                style={{ fontSize: '12px', fill: '#6b7280' }}
              />
              <YAxis
                style={{ fontSize: '12px', fill: '#6b7280' }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value, name) => {
                  if (name === 'total_revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                  if (name === 'unique_donors') return [value, 'Donors'];
                  if (name === 'average_gift') return [`$${value.toFixed(2)}`, 'Avg Gift'];
                  return [value, name];
                }}
              />
              <Bar dataKey="total_revenue" fill="#0A1F16" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Audience Growth Trend */}
      {audienceData && audienceData.monthly_growth && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Audience Growth Trend</h3>
            <div className="bg-cyan-50 px-4 py-2 rounded-lg">
              <span className="text-cyan-700 font-semibold text-sm">
                {audienceData.summary?.growth_trend}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={audienceData.monthly_growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                style={{ fontSize: '12px', fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis style={{ fontSize: '12px', fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="total_donors"
                stroke="#5fe0b7"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="new_donors"
                stroke="#5fe0b7"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};


const MissionView = ({ data }) => {
  if (!data) return <div>Loading...</div>;
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission Statement</h3>
        <p className="text-gray-700 text-lg leading-relaxed">{data.mission}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vision Statement</h3>
        <p className="text-gray-700 text-lg leading-relaxed">{data.vision}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Promise</h3>
        <p className="text-gray-700 text-lg leading-relaxed">{data.brand_promise}</p>
      </div>
      <div className="bg-green-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-700 mb-4">North Star Objective</h3>
        <p className="text-green-700 text-lg font-medium">{data.north_star_objective}</p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-green-700">Owner: {data.owner}</span>
          <span className="text-green-700">Last Updated: {new Date(data.last_updated).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

const SWOTView = ({ data }) => {
  if (!data) return <div>Loading...</div>;
  const colors = {
    strengths: 'bg-green-50 border-green-200 text-green-900',
    weaknesses: 'bg-red-50 border-red-200 text-red-900',
    opportunities: 'bg-orange-50 border-blue-200 text-orange-600',
    threats: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {data.map((item, idx) => (
        <div key={idx} className={`border rounded-lg p-6 ${colors[item.category]}`}>
          <h3 className="text-lg font-semibold mb-4 capitalize">{item.category}</h3>
          <ul className="space-y-2">
            {item.items.map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 flex-shrink-0" size={18} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const FundraisingView = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const monthlyComparisonData = [
    {
      name: 'Last Month',
      revenue: data.last_month?.revenue || 0
    },
    {
      name: 'Current Month',
      revenue: data.current_month?.revenue || 0
    }
  ];

  const trendColor = data.trends?.trend_direction === 'Up' ? 'text-green-600' : 'text-red-600';
  const trendIcon = data.trends?.trend_direction === 'Up' ? TrendingUp : TrendingDown;
  const TrendIconComponent = trendIcon;

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-gradient-to-r from-green-700 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{data.organization_name}</h2>
        <p className="text-green-700 text-sm">Fundraising Vitals Dashboard</p>
      </div>

      {/* Current Month Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Month Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Revenue"
            value={`$${data.current_month?.revenue?.toLocaleString() || '0'}`}
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            label="Donations"
            value={data.current_month?.donations?.toLocaleString() || '0'}
            icon={Users}
          />
          <StatCard
            label="Avg Gift"
            value={`$${data.current_month?.avg_gift?.toFixed(2) || '0'}`}
            icon={Activity}
          />
        </div>
      </div>

      {/* Year to Date Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Year to Date Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="YTD Revenue"
            value={`$${data.year_to_date?.revenue?.toLocaleString() || '0'}`}
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            label="Total Donors"
            value={data.year_to_date?.donors?.toLocaleString() || '0'}
            icon={Users}
          />
          <StatCard
            label="YTD Avg Gift"
            value={`$${data.year_to_date?.avg_gift?.toFixed(2) || '0'}`}
            icon={Activity}
          />
        </div>
      </div>

      {/* Trends Section */}
      {data.trends && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div>
                <p className="text-sm text-gray-600 mb-2">Month-over-Month Growth</p>
                <p className={`text-4xl font-bold ${trendColor}`}>
                  {data.trends.mom_growth_rate > 0 ? '+' : ''}{data.trends.mom_growth_rate?.toFixed(1)}%
                </p>
              </div>
              <TrendIconComponent size={48} className={trendColor} />
            </div>

            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl border border-blue-200">
              <div>
                <p className="text-sm text-gray-600 mb-2">Trend Direction</p>
                <p className="text-3xl font-bold text-gray-900">{data.trends.trend_direction}</p>
              </div>
              <div className={`w-16 h-16 rounded-full ${data.trends.trend_direction === 'Up' ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center`}>
                <TrendIconComponent size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Comparison Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#154734" radius={[8, 8, 0, 0]}>
              {monthlyComparisonData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 1 ? '#10b981' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const LifecycleView = ({ data }) => {
  if (!data) return <div className="text-gray-500">Loading lifecycle data...</div>;

  // Extract the correct data structure
  const pipelineStages = data.pipeline_stages || [];
  const summary = data.summary || {};
  const orgName = data.organization_name || '';

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-gradient-to-r from-purple-600 to-green-800 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{orgName}</h2>
        <p className="text-purple-100 text-sm">Donor Lifecycle Pipeline Analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total in Pipeline</p>
              <p className="text-3xl font-bold text-gray-900">
                {summary.total_in_pipeline?.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pipeline Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ${(summary.total_pipeline_value || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {summary.overall_conversion_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Donor Count by Stage - Bar Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Donor Count by Lifecycle Stage</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={pipelineStages}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="stage"
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'count') return [value, 'Donors'];
                if (name === 'avg_days_in_stage') return [value, 'Avg Days'];
                return [value, name];
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#0A1F16" name="Donor Count" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Avg Days in Stage - Bar Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Average Days in Each Stage</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={pipelineStages}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="stage"
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '12px' }}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value) => [value ? `${value} days` : 'N/A', 'Avg Days']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="avg_days_in_stage" fill="#5fe0b7" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stage Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pipelineStages.map((stage, idx) => {
          const getStageColor = (stageName) => {
            switch(stageName) {
              case 'Prospect': return 'border-gray-400 bg-gray-50';
              case 'New Donor': return 'border-blue-400 bg-orange-50';
              case 'Active': return 'border-green-400 bg-green-50';
              case 'Major Donor': return 'border-purple-400 bg-purple-50';
              case 'Lapsed': return 'border-red-400 bg-red-50';
              default: return 'border-gray-400 bg-gray-50';
            }
          };

          return (
            <div
              key={idx}
              className={`bg-white rounded-xl shadow-lg p-5 border-l-4 ${getStageColor(stage.stage)}`}
            >
              <h4 className="font-bold text-gray-900 mb-3 text-lg">{stage.stage}</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users size={14} /> Donors:
                  </span>
                  <span className="font-semibold text-gray-900">{stage.count.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <DollarSign size={14} /> Total Value:
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${stage.total_value.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock size={14} /> Avg Days:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {stage.avg_days_in_stage !== null ? `${stage.avg_days_in_stage} days` : 'N/A'}
                  </span>
                </div>

                {stage.conversion_rate !== null && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 flex items-center gap-2">
                      <TrendingUp size={14} /> Conversion:
                    </span>
                    <span className="font-semibold text-green-600">
                      {stage.conversion_rate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Value by Stage - Pie Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Total Value Distribution by Stage</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pipelineStages.map(stage => ({
                name: stage.stage,
                value: stage.total_value
              }))}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, value }) => `${name}: $${(value / 1000000).toFixed(1)}M`}
              outerRadius={120}
              dataKey="value"
            >
              {pipelineStages.map((entry, index) => {
                const colors = ['#9ca3af', '#e87500', '#10b981', '#8b5cf6', '#ef4444'];
                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
              })}
            </Pie>
            <Tooltip
              formatter={(value) => `$${value.toLocaleString()}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const RevenueView = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const trendColor = data.summary?.trend === 'Increasing' ? 'text-green-600' : data.summary?.trend === 'Decreasing' ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = data.summary?.trend === 'Increasing' ? TrendingUp : TrendingDown;

  // Prepare data for charts
  const yearlyRevenueData = data.three_year_comparison || [];
  const yearlyDonorsData = data.three_year_comparison || [];

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-gradient-to-r from-orange-500 to-green-800 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{data.organization_name}</h2>
        <p className="text-orange-600 text-sm">Three-Year Revenue Rollup</p>
      </div>

      {/* Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total 3-Year Revenue"
            value={`$${data.summary?.total_three_year_revenue?.toLocaleString() || '0'}`}
            icon={DollarSign}
            trend="up"
          />
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 font-medium">YoY Growth Rate</div>
              <TrendIcon size={20} className={trendColor} />
            </div>
            <div className={`text-4xl font-bold mb-2 ${trendColor}`}>
              {data.summary?.yoy_growth_rate > 0 ? '+' : ''}{data.summary?.yoy_growth_rate?.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 font-medium">Trend</div>
              <Activity size={20} className={trendColor} />
            </div>
            <div className={`text-3xl font-bold ${trendColor}`}>
              {data.summary?.trend || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Comparison Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Year-by-Year Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {yearlyRevenueData.map((yearData, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold text-green-700">{yearData.year}</h4>
                {idx === yearlyRevenueData.length - 1 && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <div className="text-xs text-gray-500 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${yearData.total_revenue?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Donations</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {yearData.total_donations?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unique Donors</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {yearData.unique_donors?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Avg Gift</span>
                  <span className="text-lg font-semibold text-green-700">
                    ${yearData.average_gift?.toFixed(2) || '0'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Growth Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={yearlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="total_revenue" fill="#154734" name="Total Revenue" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donors Trend Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Donor Growth Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={yearlyDonorsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="unique_donors"
              stroke="#5fe0b7"
              strokeWidth={3}
              name="Unique Donors"
              dot={{ fill: '#10b981', r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="total_donations"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Total Donations"
              dot={{ fill: '#f59e0b', r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Average Gift Comparison */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Gift Size by Year</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Bar dataKey="average_gift" fill="#0A1F16" name="Average Gift" radius={[8, 8, 0, 0]}>
              {yearlyRevenueData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#a855f7'][index % 3]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const RevenueTimelineView = ({ data }) => {
  if (!data || !data.trends) return <div>Loading...</div>;

  // Calculate summary stats from trends data
  const totalRevenue = data.trends.reduce((sum, t) => sum + t.revenue, 0);
  const totalDonations = data.trends.reduce((sum, t) => sum + t.donation_count, 0);
  const avgMonthlyRevenue = totalRevenue / data.trends.length;

  // Calculate growth rate (last month vs first month)
  const firstMonth = data.trends[0]?.revenue || 0;
  const lastMonth = data.trends[data.trends.length - 1]?.revenue || 0;
  const growthRate = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

  const growthPct = formatPercent(growthRate);

  // Format data for charts - use period as month label
  const chartData = data.trends.map(item => ({
    month: item.period.substring(5), // Extract "11" from "2024-11"
    revenue: item.revenue,
    donor_count: item.donation_count,
    avg_donation: item.avg_donation
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Total Donations" value={totalDonations} icon={Users} />
        <StatCard label="Avg Monthly Revenue" value={`$${avgMonthlyRevenue.toFixed(0).toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Growth Rate" value={growthPct.display} icon={TrendingUp} trend={growthRate >= 0 ? 'up' : 'down'} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue & Donations Over {data.months} Months</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#154734" name="Revenue" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="donor_count" stroke="#5fe0b7" name="Donations" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Average Donation Amount</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Area type="monotone" dataKey="avg_donation" stroke="#5fe0b7" fill="#5fe0b7" name="Avg Donation" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


const YoYComparisonView = ({ data }) => {
  if (!data || !data.comparison) return <div>Loading...</div>;

  // Sort comparison by year
  const sortedYears = [...data.comparison].sort((a, b) => a.year - b.year);
  const currentYear = sortedYears[1] || sortedYears[0];
  const priorYear = sortedYears[0];

  const revenueGrowthPct = formatPercent(data.yoy_revenue_growth);
  const donorGrowthPct = formatPercent(data.yoy_donor_growth);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label={`${currentYear.year} Revenue`}
          value={`$${currentYear.revenue.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label={`${priorYear.year} Revenue`}
          value={`$${priorYear.revenue.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label="Revenue Growth"
          value={revenueGrowthPct.display}
          icon={TrendingUp}
          trend={data.yoy_revenue_growth >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Donor Growth"
          value={donorGrowthPct.display}
          icon={Users}
          trend={data.yoy_donor_growth >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Year-over-Year Revenue Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedYears}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="revenue" fill="#154734" name="Revenue" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Donor Count Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedYears}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="donors" fill="#10b981" name="Donors" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Donors</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg per Donor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedYears.map((yearData, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{yearData.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${yearData.revenue.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{yearData.donors}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  ${(yearData.revenue / yearData.donors).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const SeasonalPatternsView = ({ data }) => {
  if (!data || !data.monthly_patterns) return <div>Loading...</div>;

  // Find peak and low months
  const sortedByRevenue = [...data.monthly_patterns].sort((a, b) => b.total_revenue - a.total_revenue);
  const peakMonth = sortedByRevenue[0];
  const lowMonth = sortedByRevenue[sortedByRevenue.length - 1];

  // Calculate seasonality strength (coefficient of variation)
  const revenues = data.monthly_patterns.map(m => m.total_revenue);
  const avgRevenue = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;
  const variance = revenues.reduce((sum, r) => sum + Math.pow(r - avgRevenue, 2), 0) / revenues.length;
  const stdDev = Math.sqrt(variance);
  const seasonalityStrength = (stdDev / avgRevenue) * 100;

  const seasonalityPct = formatPercent(seasonalityStrength);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" />
            <span className="text-sm text-gray-600">Peak Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{peakMonth.month}</p>
          <p className="text-sm text-gray-600">${peakMonth.total_revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-600" />
            <span className="text-sm text-gray-600">Low Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{lowMonth.month}</p>
          <p className="text-sm text-gray-600">${lowMonth.total_revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-orange-600" />
            <span className="text-sm text-gray-600">Seasonality Strength</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{seasonalityPct.display}</p>
          <p className="text-xs text-gray-600">{data.years_analyzed} years analyzed</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue Patterns</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.monthly_patterns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="total_revenue" fill="#154734" name="Total Revenue" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Average Donation & Count by Month</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.monthly_patterns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="avg_donation" stroke="#5fe0b7" strokeWidth={2} name="Avg Donation" />
            <Line yAxisId="right" type="monotone" dataKey="donation_count" stroke="#f59e0b" strokeWidth={2} name="Donation Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


const AudienceView = ({ data }) => {
  if (!data || !data.monthly_growth) return <div>Loading...</div>;

  const summary = data.summary || {};

  // Calculate growth metrics from monthly_growth data
  const firstMonth = data.monthly_growth[0] || { total_donors: 0 };
  const lastMonth = data.monthly_growth[data.monthly_growth.length - 1] || { total_donors: 0 };
  const totalGrowth = lastMonth.total_donors - firstMonth.total_donors;
  const growthRate = firstMonth.total_donors > 0
    ? ((totalGrowth / firstMonth.total_donors) * 100).toFixed(1)
    : 0;

  // Calculate total new donors over period
  const totalNewDonors = data.monthly_growth.reduce((sum, m) => sum + m.new_donors, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Audience Growth Analytics</h2>
        <p className="text-green-100">{data.organization_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Donors Now"
          value={summary.total_donors_now || lastMonth.total_donors}
          icon={Users}
        />
        <StatCard
          label="New Donors (Last Month)"
          value={summary.new_donors_last_month || lastMonth.new_donors}
          icon={TrendingUp}
        />
        <StatCard
          label="Total New Donors (Period)"
          value={totalNewDonors}
          icon={Users}
        />
        <StatCard
          label="Growth Rate"
          value={`${growthRate}%`}
          icon={Activity}
          trend={summary.growth_trend === 'Positive' ? 'up' : 'down'}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Donor Growth Trend</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.monthly_growth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total_donors"
              stroke="#5fe0b7"
              strokeWidth={3}
              name="Total Donors"
              dot={{ fill: '#10b981', r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="new_donors"
              stroke="#154734"
              strokeWidth={2}
              name="New Donors"
              dot={{ fill: '#154734', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">New Donors by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthly_growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="new_donors" fill="#154734" name="New Donors" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Growth Summary</h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Growth Trend</p>
              <p className="text-3xl font-bold text-green-600">{summary.growth_trend || 'Positive'}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Net Growth (Period)</p>
              <p className="text-3xl font-bold text-orange-600">+{totalGrowth}</p>
              <p className="text-sm text-gray-500 mt-1">donors added</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Avg New Donors/Month</p>
              <p className="text-3xl font-bold text-purple-600">
                {(totalNewDonors / data.monthly_growth.length).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Monthly Breakdown</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">New Donors</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Donors</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Growth</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.monthly_growth.map((month, idx) => {
              const prevMonth = idx > 0 ? data.monthly_growth[idx - 1] : null;
              const growth = prevMonth ? month.total_donors - prevMonth.total_donors : month.new_donors;

              return (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{month.new_donors}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">{month.total_donors}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    +{growth}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const ProgramsView = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const programs = data.programs || [];
  const summary = data.summary || {};

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{data.organization_name}</h2>
        <p className="text-purple-100 text-sm">Program Impact Dashboard - {data.period}</p>
      </div>

      {/* Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Program Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            label="Total Programs"
            value={summary.total_programs || 0}
            icon={Target}
          />
          <StatCard
            label="Total Funding"
            value={`$${summary.total_funding?.toLocaleString() || '0'}`}
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            label="Beneficiaries"
            value={summary.total_beneficiaries?.toLocaleString() || '0'}
            icon={Users}
          />
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 font-medium">Avg Efficiency</div>
              <Activity size={20} className="text-green-600" />
            </div>
            <div className="text-4xl font-bold text-green-600">
              {summary.average_efficiency || 0}%
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 font-medium">Overall Progress</div>
              <TrendingUp size={20} className="text-green-700" />
            </div>
            <div className="text-4xl font-bold text-green-700">
              {summary.overall_progress || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Total Funding Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding by Program</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={programs} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="program_name" angle={-45} textAnchor="end" height={120} />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Bar dataKey="total_funding" fill="#0A1F16" name="Total Funding" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Beneficiaries Served Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Beneficiaries Served by Program</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={programs} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="program_name" angle={-45} textAnchor="end" height={120} />
            <YAxis />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Bar dataKey="beneficiaries_served" fill="#10b981" name="Beneficiaries Served" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress vs Target Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress vs Target</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={programs}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="program_name" angle={-45} textAnchor="end" height={120} />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="progress_vs_target" fill="#f59e0b" name="Progress %" radius={[8, 8, 0, 0]}>
              {programs.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.progress_vs_target >= 80 ? '#10b981' : entry.progress_vs_target >= 60 ? '#f59e0b' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Program Details Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Program Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, idx) => {
            const progressColor = program.progress_vs_target >= 80 ? 'text-green-600' :
                                 program.progress_vs_target >= 60 ? 'text-yellow-600' : 'text-red-600';
            const efficiencyColor = program.efficiency_score >= 85 ? 'text-green-600' :
                                   program.efficiency_score >= 70 ? 'text-yellow-600' : 'text-red-600';

            return (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                <h4 className="text-lg font-bold text-green-700 mb-4 border-b pb-2">
                  {program.program_name}
                </h4>

                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Total Funding</div>
                    <div className="text-2xl font-bold text-purple-700">
                      ${program.total_funding?.toLocaleString() || '0'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Beneficiaries</div>
                      <div className="text-lg font-bold text-green-700">
                        {program.beneficiaries_served?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Donors</div>
                      <div className="text-lg font-bold text-orange-600">
                        {program.donor_count?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Avg Donation:</span>
                      <span className="font-semibold text-gray-900">
                        ${program.avg_donation?.toFixed(2) || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cost per Outcome:</span>
                      <span className="font-semibold text-gray-900">
                        ${program.cost_per_outcome?.toFixed(2) || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Efficiency Score:</span>
                      <span className={`font-bold ${efficiencyColor}`}>
                        {program.efficiency_score || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600">Progress vs Target:</span>
                      <span className={`font-bold ${progressColor}`}>
                        {program.progress_vs_target || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{program.progress_vs_target}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          program.progress_vs_target >= 80 ? 'bg-green-500' :
                          program.progress_vs_target >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(program.progress_vs_target, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Quarterly Target: ${program.quarterly_target?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Efficiency Comparison */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Score Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={programs}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="program_name" angle={-45} textAnchor="end" height={120} />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="efficiency_score" fill="#5fe0b7" name="Efficiency Score %" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DigitalView = ({ data }) => {
  if (!data || !data.website) return <div>Loading...</div>;

  const website = data.website || {};
  const email = data.email || {};
  const conversions = data.conversions || {};
  const social = data.social || {};
  const traffic = data.traffic_sources || [];

  const bounceRatePct = formatPercent(website.bounce_rate);
  const emailOpenPct = formatPercent(email.open_rate);
  const emailClickPct = formatPercent(email.click_rate);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Digital Performance Dashboard</h2>
        <p className="text-orange-600">{data.organization_name} - {data.period}</p>
      </div>

      {/* Website Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Website Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{website.total_sessions || 0}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Unique Users</p>
            <p className="text-2xl font-bold text-gray-900">{website.unique_users || 0}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Avg Duration</p>
            <p className="text-2xl font-bold text-gray-900">{website.avg_session_duration || '0:00'}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Bounce Rate</p>
            <p className="text-2xl font-bold text-red-600">{bounceRatePct.display}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Pages/Session</p>
            <p className="text-2xl font-bold text-orange-600">{website.pages_per_session || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Email Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Campaigns Sent</span>
                <span className="font-medium">{email.campaigns_sent || 0}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Total Delivered</span>
                <span className="font-medium">{email.total_emails_delivered?.toLocaleString() || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Open Rate</span>
                <span className="font-medium">{emailOpenPct.display}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${emailOpenPct.pct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Click Rate</span>
                <span className="font-medium">{emailClickPct.display}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-cyan-600 h-2 rounded-full" style={{ width: `${emailClickPct.pct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Unsubscribe Rate</span>
                <span className="font-medium">{email.unsubscribe_rate?.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Social Media</h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Followers</p>
              <p className="text-3xl font-bold text-purple-600">{social.total_followers?.toLocaleString() || 0}</p>
              <p className="text-sm text-green-600 mt-1">+{social.follower_growth?.toFixed(1)}% growth</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Engagement Rate</p>
                <p className="text-xl font-bold text-orange-600">{social.engagement_rate?.toFixed(1)}%</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Posts</p>
                <p className="text-xl font-bold text-green-600">{social.total_posts || 0}</p>
              </div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total Reach</p>
              <p className="text-xl font-bold text-orange-600">{social.total_reach?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Conversions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Donation Conv. Rate</p>
            <p className="text-2xl font-bold text-green-600">{conversions.donation_conversion_rate || 0}%</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Newsletter Signups</p>
            <p className="text-2xl font-bold text-orange-600">{conversions.newsletter_signups || 0}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Volunteer Registrations</p>
            <p className="text-2xl font-bold text-purple-600">{conversions.volunteer_registrations || 0}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Event Registrations</p>
            <p className="text-2xl font-bold text-orange-600">{conversions.event_registrations || 0}</p>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      {traffic.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={traffic}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ source, percentage }) => `${source}: ${percentage}%`}
                outerRadius={100}
                dataKey="percentage"
              >
                {traffic.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#154734', '#10b981', '#f59e0b', '#5fe0b7', '#8b5cf6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const TargetsView = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const statusColors = {
    on_track: 'text-green-600 bg-green-100',
    at_risk: 'text-yellow-600 bg-yellow-100',
    behind: 'text-red-600 bg-red-100'
  };

  return (
    <div className="space-y-4">
      {data.map((target, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{target.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {target.owner}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {new Date(target.due_date).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded ${statusColors[target.status]}`}>
                  {target.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Expected Lift</p>
              <p className="text-2xl font-bold text-green-700">${target.expected_lift.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm text-gray-700">Milestones</h4>
            {target.milestones.map((milestone, mIdx) => (
              <div key={mIdx} className="flex items-center gap-2 text-sm">
                <CheckCircle className="text-green-600" size={16} />
                <span>{milestone.title || 'Milestone'}</span>
              </div>
            ))}
          </div>

          {target.risk_flags.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2 text-yellow-800 text-sm">
                <AlertTriangle size={16} />
                <span className="font-medium">Risk Flags:</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                {target.risk_flags.map((flag, fIdx) => (
                  <li key={fIdx}>• {flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const DonorSegmentsView = ({ data }) => {
  if (!data || !data.by_donor_type) return <div>Loading...</div>;

  const totalDonors = data.by_donor_type.reduce((sum, t) => sum + t.count, 0);
  const totalRevenue = data.by_donor_type.reduce((sum, t) => sum + t.total_revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Total Donors" value={totalDonors} icon={Users} />
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Donor Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution by Donor Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.by_donor_type}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={100}
                dataKey="count"
              >
                {data.by_donor_type.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#154734', '#5fe0b7', '#10b981'][index % 3]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Donor Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.by_donor_status}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={100}
                dataKey="count"
              >
                {data.by_donor_status.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444'][index % 3]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donor Type Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.by_donor_type.map((segment, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold text-gray-900 mb-2 capitalize">{segment.type}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Donors:</span>
                <span className="font-medium">{segment.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-medium">${segment.total_revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg LTV:</span>
                <span className="font-medium">${segment.avg_lifetime_value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">% of Total:</span>
                <span className="font-medium">{((segment.count / totalDonors) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Breakdown Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Donor Status Breakdown</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.by_donor_status.map((status, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{status.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{status.count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {((status.count / totalDonors) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DonorMovementView = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const movementData = [
    { name: 'Upgrades', value: data.upgrades, color: '#10b981' },
    { name: 'Downgrades', value: data.downgrades, color: '#ef4444' },
    { name: 'Maintained', value: data.maintained, color: '#6366f1' }
  ];

  const upgradeRatePct = formatPercent(data.upgrade_rate);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-green-800 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Donor Movement Analysis</h2>
        <p className="text-orange-600">{data.period}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Upgrades"
          value={data.upgrades}
          icon={TrendingUp}
          trend="up"
          color="green"
        />
        <StatCard
          label="Downgrades"
          value={data.downgrades}
          icon={TrendingDown}
          trend="down"
          color="red"
        />
        <StatCard
          label="Maintained"
          value={data.maintained}
          icon={Activity}
        />
        <StatCard
          label="Net Movement"
          value={data.net_movement}
          icon={Target}
          trend={data.net_movement >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Movement Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={movementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                dataKey="value"
              >
                {movementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Movement Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {movementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Upgrade Rate</p>
            <p className="text-3xl font-bold text-green-600">{upgradeRatePct.display}</p>
            <p className="text-xs text-gray-500 mt-2">of total donors upgraded</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Net Movement</p>
            <p className="text-3xl font-bold text-orange-600">{data.net_movement > 0 ? '+' : ''}{data.net_movement}</p>
            <p className="text-xs text-gray-500 mt-2">net positive donor movement</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Success Ratio</p>
            <p className="text-3xl font-bold text-purple-600">
              {(data.upgrades / (data.upgrades + data.downgrades)).toFixed(2)}x
            </p>
            <p className="text-xs text-gray-500 mt-2">upgrades per downgrade</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DonorLTVView = ({ data }) => {
  if (!data || !data.top_donors) return <div>Loading...</div>;

  const totalDonors = data.top_donors.length;
  const avgLtv = data.total_ltv / totalDonors;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Top Donors Shown" value={totalDonors} icon={Users} />
        <StatCard label="Total LTV" value={`$${data.total_ltv.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Average LTV" value={`$${avgLtv.toFixed(0).toLocaleString()}`} icon={TrendingUp} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Top Donors by Lifetime Value</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lifetime Value</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Donated</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Donations</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Gift</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.top_donors.map((donor, idx) => (
              <tr key={idx} className={idx < 3 ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {donor.name}
                  {idx < 3 && <span className="ml-2">🏆</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                  ${donor.lifetime_value.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  ${donor.total_donated.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {donor.donation_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  ${donor.avg_donation.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    donor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {donor.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Donation History Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top 10 Donors - LTV Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.top_donors.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="lifetime_value" fill="#154734" name="Lifetime Value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DonorJourneyView = ({ data }) => {
  if (!data || !data.acquisition_sources) return <div>Loading...</div>;

  const totalRaised = data.acquisition_sources.reduce((sum, s) => sum + s.total_raised, 0);
  const avgFirstGift = totalRaised / data.total_new_donors;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total New Donors"
          value={data.total_new_donors}
          icon={Users}
        />
        <StatCard
          label="Total Raised"
          value={`$${totalRaised.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label="Avg First Gift"
          value={`$${avgFirstGift.toFixed(2)}`}
          icon={TrendingUp}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Acquisition Sources - New Donors</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.acquisition_sources}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="source" angle={-45} textAnchor="end" height={120} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="new_donors" fill="#154734" name="New Donors" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Total Raised by Source</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.acquisition_sources}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="source" angle={-45} textAnchor="end" height={120} />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="total_raised" fill="#10b981" name="Total Raised" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.acquisition_sources.map((source, idx) => {
          const percentOfTotal = ((source.new_donors / data.total_new_donors) * 100).toFixed(1);

          return (
            <div key={idx} className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">{source.source}</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">New Donors:</span>
                  <span className="font-medium">{source.new_donors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">% of Total:</span>
                  <span className="font-medium">{percentOfTotal}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Raised:</span>
                  <span className="font-medium">${source.total_raised.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg First Gift:</span>
                  <span className="font-medium text-green-600">${source.avg_first_gift.toFixed(2)}</span>
                </div>
              </div>

              {/* Progress bar showing percentage of total donors */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${percentOfTotal}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};




const DonorAnalyticsView = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  // Fix: Use retention_rate (underscore) instead of rate_percent
  const retentionPct = data['retention-rate']
    ? formatPercent(data['retention-rate'].retention_rate / 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fix: Use average_donation instead of average_donation_amount */}
        {data['avg-donation'] && (
          <StatCard
            label="Average Donation"
            value={`$${data['avg-donation'].average_donation.toFixed(2)}`}
            icon={DollarSign}
          />
        )}

        {data.cpdr && (
          <StatCard
            label="Cost per Dollar Raised"
            value={`$${data.cpdr.cpdr.toFixed(2)}`}
            icon={TrendingDown}
          />
        )}

        {/* Fix: Use cost_per_acquisition instead of donor_acquisition_cost */}
        {data['acquisition-cost'] && (
          <StatCard
            label="Donor Acquisition Cost"
            value={`$${data['acquisition-cost'].cost_per_acquisition.toFixed(2)}`}
            icon={Users}
          />
        )}

        {retentionPct && (
          <StatCard
            label="Retention Rate"
            value={retentionPct.display}
            icon={TrendingUp}
          />
        )}
      </div>

      {/* Detailed Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Donation Details */}
        {data['avg-donation'] && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Donation Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-medium">${data['avg-donation'].total_revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gift Count:</span>
                <span className="font-medium">{data['avg-donation'].donation_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Donation:</span>
                <span className="font-medium text-lg text-green-700">
                  ${data['avg-donation'].average_donation.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CPDR Details - Fix: Use fundraising_costs and total_revenue */}
        {data.cpdr && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Fundraising Efficiency</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Fundraising Costs:</span>
                <span className="font-medium">${data.cpdr.fundraising_costs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-medium">${data.cpdr.total_revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CPDR:</span>
                <span className="font-medium text-lg text-green-700">${data.cpdr.cpdr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  data.cpdr.status === 'good' ? 'bg-green-100 text-green-800' :
                  data.cpdr.status === 'needs_improvement' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {data.cpdr.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Benchmark:</span>
                <span className="font-medium">${data.cpdr.benchmark.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Acquisition Cost Section - Fix: Use marketing_spend and new_donors */}
      {data['acquisition-cost'] && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Donor Acquisition</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Marketing Spend</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data['acquisition-cost'].marketing_spend.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">New Donors</p>
              <p className="text-2xl font-bold text-gray-900">
                {data['acquisition-cost'].new_donors}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Cost Per Acquisition</p>
              <p className="text-2xl font-bold text-green-700">
                ${data['acquisition-cost'].cost_per_acquisition.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Status</p>
              <p className={`text-lg font-bold ${
                data['acquisition-cost'].status === 'good' ? 'text-green-600' :
                data['acquisition-cost'].status === 'needs_improvement' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data['acquisition-cost'].status.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Industry Benchmark:</span>
              <span className="font-semibold text-orange-600">
                ${data['acquisition-cost'].benchmark.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Retention Rate Section - Fix: Use retention_rate, retained_donors, previous_period_donors */}
      {data['retention-rate'] && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Donor Retention</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Retention Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {data['retention-rate'].retention_rate.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Retained Donors</p>
              <p className="text-2xl font-bold text-gray-900">
                {data['retention-rate'].retained_donors}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Previous Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {data['retention-rate'].previous_period_donors}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Status</p>
              <p className={`text-lg font-bold ${
                data['retention-rate'].status === 'good' ? 'text-green-600' :
                data['retention-rate'].status === 'needs_improvement' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data['retention-rate'].status.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Industry Benchmark:</span>
              <span className="font-semibold text-green-900">
                {data['retention-rate'].benchmark.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {data['retention-rate'].retention_rate >= data['retention-rate'].benchmark
                ? '✅ Above industry average'
                : '⚠️ Below industry average'}
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-green-700 to-purple-50 rounded-lg shadow p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold mb-4 text-green-700">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Strengths</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {data.cpdr?.status === 'good' && <li>• Efficient fundraising operations</li>}
                {data['retention-rate']?.status === 'good' && <li>• Strong donor retention</li>}
                {data['acquisition-cost']?.status === 'good' && <li>• Cost-effective donor acquisition</li>}
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Areas for Improvement</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {data.cpdr?.status === 'needs_improvement' && <li>• Optimize fundraising costs</li>}
                {data['retention-rate']?.status === 'needs_improvement' && <li>• Improve donor retention strategies</li>}
                {data['acquisition-cost']?.status === 'needs_improvement' && <li>• Reduce acquisition costs</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const LegacyPipelineView = ({ data }) => {
  if (!data || !data.prospects) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Pipeline Size"
          value={data.pipeline_size}
          icon={Users}
        />
        <StatCard
          label="Estimated Value"
          value={`$${data.estimated_value.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label="Avg Prospect Age"
          value={`${data.avg_prospect_age} years`}
          icon={Activity}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Legacy Score Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.prospects}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="legacy_score" fill="#154734" name="Legacy Score" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Top Legacy Prospects</h3>
          <p className="text-sm text-gray-600 mt-1">Donors with highest legacy giving potential</p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lifetime Value</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giving Years</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Contact</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Legacy Score</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.prospects.map((prospect, idx) => {
              const lastContactDate = new Date(prospect.last_contact).toLocaleDateString();
              return (
                <tr key={idx} className={prospect.legacy_score === 100 ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {prospect.name}
                    {prospect.legacy_score === 100 && <span className="ml-2">⭐</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                    ${prospect.lifetime_value.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{prospect.giving_years} years</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lastContactDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`px-2 py-1 rounded font-medium ${
                      prospect.legacy_score === 100
                        ? 'bg-green-100 text-green-800'
                        : prospect.legacy_score >= 80
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prospect.legacy_score}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">Legacy Pipeline Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-purple-600">Total Prospects</p>
            <p className="text-2xl font-bold text-purple-900">{data.pipeline_size}</p>
          </div>
          <div>
            <p className="text-sm text-purple-600">Perfect Scores (100)</p>
            <p className="text-2xl font-bold text-purple-900">
              {data.prospects.filter(p => p.legacy_score === 100).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-purple-600">Avg LTV per Prospect</p>
            <p className="text-2xl font-bold text-purple-900">
              ${(data.estimated_value / data.pipeline_size).toFixed(0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const UpgradeReadinessView = ({ data }) => {
  if (!data || !data.donors) return <div>Loading...</div>;

  // Group donors by readiness score ranges
  const scoreRanges = {
    'Highly Ready (1.0)': data.donors.filter(d => d.readiness_score === 1.0).length,
    'Very Ready (0.95)': data.donors.filter(d => d.readiness_score === 0.95).length,
    'Ready (0.90)': data.donors.filter(d => d.readiness_score === 0.90).length,
    'Moderately Ready (0.85)': data.donors.filter(d => d.readiness_score === 0.85).length
  };

  const chartData = Object.entries(scoreRanges).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Donors Ready for Upgrade"
          value={data.ready_count}
          icon={Users}
        />
        <StatCard
          label="Total Upgrade Potential"
          value={`$${data.total_potential.toFixed(0).toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label="Avg Potential per Donor"
          value={`$${(data.total_potential / data.ready_count).toFixed(0).toLocaleString()}`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Readiness Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name.split(' ')[0]}: ${count}`}
                outerRadius={100}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#10b981', '#5fe0b7', '#154734', '#8b5cf6'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Readiness Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#154734" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Ready for Upgrade</h3>
          <p className="text-sm text-gray-600 mt-1">Top {Math.min(20, data.donors.length)} donors ready to increase their giving</p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Readiness</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Avg</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Suggested Ask</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Increase</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Gifts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Gift</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.donors.slice(0, 20).map((donor, idx) => {
              const increase = donor.suggested_ask - donor.current_avg;
              const increasePct = (increase / donor.current_avg) * 100;
              const lastGiftDate = new Date(donor.last_gift).toLocaleDateString();
              const readinessPct = formatPercent(donor.readiness_score);

              return (
                <tr key={idx} className={donor.readiness_score === 1.0 ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {donor.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`px-2 py-1 rounded font-medium ${
                      donor.readiness_score === 1.0
                        ? 'bg-green-100 text-green-800'
                        : donor.readiness_score >= 0.9
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {readinessPct.display}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    ${donor.current_avg.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700">
                    ${donor.suggested_ask.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    +${increase.toFixed(2)} ({increasePct.toFixed(0)}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {donor.total_gifts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {lastGiftDate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


/*const AdvancedLifecycleView = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Lifecycle Stages Detail</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.lifecycle_stages}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="donor_count" fill="#154734" name="Donors" />
            <Bar dataKey="avg_lifetime_value" fill="#10b981" name="Avg LTV" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Cohort Retention Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.cohort_analysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cohort_period" />
            <YAxis />
            <Tooltip formatter={(value) => `${formatPercent(value).display}`} />
            <Legend />
            <Line type="monotone" dataKey="retention_rate_12m" stroke="#154734" name="12-Month Retention" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.at_risk_donors.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900">At-Risk Donors</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Days Since</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">LTV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.at_risk_donors.slice(0, 10).map((donor, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{donor.donor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{donor.current_stage}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{donor.days_since_last_donation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${donor.lifetime_value.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      donor.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                      donor.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {donor.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{donor.recommended_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};*/

const AdvancedLifecycleView = ({ data }) => {
  if (!data) return <div className="text-gray-500">Loading advanced lifecycle data...</div>;

  // Parse the data structure - handle both possible data structures
  const atRiskCount = data.at_risk_count || 0;
  const atRiskValue = data.at_risk_value || 0;
  const atRiskDonors = data.at_risk_donors || [];
  const summary = data.summary || {};
  const pipelineStages = data.pipeline_stages || data.lifecycle_stages || [];

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate days since last gift category
  const getDaysCategory = (days) => {
    if (days < 180) return { label: '< 6 months', color: 'text-green-600' };
    if (days < 365) return { label: '6-12 months', color: 'text-yellow-600' };
    if (days < 730) return { label: '1-2 years', color: 'text-orange-600' };
    return { label: '2+ years', color: 'text-red-600' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e87500] to-[#154734] rounded-2xl shadow-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">Advanced Lifecycle Analytics</h2>
        <p className="text-orange-100">Detailed donor lifecycle and risk analysis</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-[#e87500] to-[#154734] p-3 rounded-xl shadow-lg">
              <Users className="text-white" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-2">Total in Pipeline</p>
          <p className="text-3xl font-bold text-[#154734]">{summary.total_in_pipeline || pipelineStages.length || 0}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl shadow-lg">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">At Risk</span>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-2">At-Risk Donors</p>
          <p className="text-3xl font-bold text-red-600">{atRiskCount}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-[#5fe0b7] to-[#154734] p-3 rounded-xl shadow-lg">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-2">At-Risk Value</p>
          <p className="text-3xl font-bold text-[#154734]">{formatCurrency(atRiskValue)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-[#e87500] to-orange-700 p-3 rounded-xl shadow-lg">
              <Activity className="text-white" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-2">Avg Risk Value</p>
          <p className="text-3xl font-bold text-[#e87500]">
            {atRiskCount > 0 ? formatCurrency(atRiskValue / atRiskCount) : '$0'}
          </p>
        </div>
      </div>

      {/* Pipeline Stages Chart if available */}
      {pipelineStages.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-[#154734] mb-6">Lifecycle Stages Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineStages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#e87500" name="Donors" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* At-Risk Donors Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#154734] to-[#0A1F16] px-8 py-4">
          <h3 className="text-xl font-bold text-white">At-Risk Donors Detail</h3>
          <p className="text-green-100 text-sm mt-1">Donors requiring immediate attention</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Since Last Gift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lifetime Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {atRiskDonors && atRiskDonors.length > 0 ? (
                atRiskDonors.slice(0, 10).map((donor, idx) => {
                  const days = donor.days_since_last_gift || donor.days_since_last_donation || 0;
                  const daysCategory = getDaysCategory(days);
                  const donorName = donor.name || donor.donor_name || 'Anonymous';
                  const donorId = donor.donor_id || donor.id || `D${idx + 1000}`;
                  const ltv = donor.lifetime_value || 0;
                  const riskLevel = donor.risk_level || 'medium';

                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {typeof donorId === 'string' && donorId.length > 8
                          ? `${donorId.substring(0, 8)}...`
                          : donorId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${daysCategory.color}`}>
                          {days} days
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({daysCategory.label})</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#154734]">
                        {formatCurrency(ltv)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          riskLevel === 'high' || riskLevel === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : riskLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-[#e87500] hover:text-orange-700 font-medium text-sm">
                          Contact →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No at-risk donors identified
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {atRiskDonors && atRiskDonors.length > 10 && (
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing 10 of {atRiskDonors.length} at-risk donors
            </p>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-2xl p-8 border border-orange-200">
        <h3 className="text-xl font-bold text-[#154734] mb-4">Recommended Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Immediate Outreach</h4>
              <p className="text-sm text-gray-600 mt-1">
                Contact high-risk donors within 48 hours
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-600 font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Re-engagement Campaign</h4>
              <p className="text-sm text-gray-600 mt-1">
                Launch targeted campaign for at-risk donors
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Retention Program</h4>
              <p className="text-sm text-gray-600 mt-1">
                Implement strategies to prevent future churn
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImpactCorrelationView = ({ data }) => {
  if (!data || !data.programs) return <div>Loading...</div>;

  const totalFunding = data.programs.reduce((sum, p) => sum + p.funding, 0);
  const totalEngagement = data.programs.reduce((sum, p) => sum + p.donor_engagement, 0);
  const avgRetention = data.programs.reduce((sum, p) => sum + p.retention_impact, 0) / data.programs.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Programs"
          value={data.programs.length}
          icon={Target}
        />
        <StatCard
          label="Total Funding"
          value={`$${totalFunding.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label="Overall Correlation"
          value={data.overall_correlation.toFixed(2)}
          icon={Activity}
        />
        <StatCard
          label="Lag Period"
          value={`${data.lag_months} months`}
          icon={Clock}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Program Funding Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.programs}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="program_name" angle={-45} textAnchor="end" height={120} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value) => typeof value === 'number' && value > 100 ? `$${value.toLocaleString()}` : value} />
            <Legend />
            <Bar yAxisId="left" dataKey="funding" fill="#154734" name="Funding" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="donor_engagement" fill="#10b981" name="Donor Engagement" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Retention Impact & Correlation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.programs}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="program_name" angle={-45} textAnchor="end" height={120} />
            <YAxis yAxisId="left" domain={[0, 100]} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="retention_impact"
              stroke="#5fe0b7"
              strokeWidth={2}
              name="Retention Impact (%)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="giving_correlation"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Giving Correlation"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.programs.map((program, idx) => {
          const correlationPct = formatPercent(program.giving_correlation);
          const retentionPct = formatPercent(program.retention_impact);

          return (
            <div key={idx} className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">{program.program_name}</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Funding:</span>
                  <span className="font-medium">${program.funding.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Donors:</span>
                  <span className="font-medium">{program.donor_engagement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Gift:</span>
                  <span className="font-medium">${program.avg_gift.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Retention:</span>
                  <span className="font-medium text-green-600">{retentionPct.display}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Correlation:</span>
                  <span className="font-medium text-orange-600">{correlationPct.display}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-green-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-700 mb-4">Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-green-700">Total Investment</p>
            <p className="text-2xl font-bold text-green-700">${totalFunding.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Total Donors Engaged</p>
            <p className="text-2xl font-bold text-green-700">{totalEngagement}</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Avg Retention Rate</p>
            <p className="text-2xl font-bold text-green-700">{avgRetention.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Programs Analyzed</p>
            <p className="text-2xl font-bold text-green-700">{data.programs.length}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-indigo-200">
          <p className="text-sm text-green-700">
            <strong>Key Finding:</strong> Overall correlation of {data.overall_correlation.toFixed(2)} with a {data.lag_months}-month lag
            indicates {data.overall_correlation >= 0.6 ? 'strong' : 'moderate'} impact between program engagement and sustained giving.
          </p>
        </div>
      </div>
    </div>
  );
};

const ExecutiveDashboardView = ({ data }) => {
  if (!data || !data.key_metrics) return <div>Loading...</div>;

  const metrics = data.key_metrics;
  const health = data.health_indicators;

  const getHealthColor = (status) => {
    const colors = {
      'Excellent': 'bg-green-100 text-green-800',
      'Healthy': 'bg-green-100 text-green-800',
      'Strong': 'bg-green-100 text-green-800',
      'Good': 'bg-orange-100 text-orange-600',
      'Fair': 'bg-yellow-100 text-yellow-800',
      'At Risk': 'bg-red-100 text-red-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-700 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{data.organization_name}</h2>
        <p className="text-green-700">Dashboard as of {new Date(data.dashboard_date).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Revenue YTD</p>
          <p className="text-3xl font-bold text-gray-900">${metrics.total_revenue_ytd.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Donors</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.total_donors}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active Donors</p>
          <p className="text-3xl font-bold text-green-600">{metrics.active_donors}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Donor Retention Rate</p>
          <p className="text-3xl font-bold text-orange-600">{metrics.donor_retention_rate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg Gift Size</p>
          <p className="text-3xl font-bold text-gray-900">${metrics.avg_gift_size.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">At-Risk Donors</p>
          <p className="text-3xl font-bold text-red-600">{metrics.at_risk_donors}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-green-600" />
            <span className="text-sm text-gray-600">Fundraising Health</span>
          </div>
          <span className={`px-3 py-1 rounded font-semibold ${getHealthColor(health.fundraising_health)}`}>
            {health.fundraising_health}
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-orange-600" />
            <span className="text-sm text-gray-600">Donor Pipeline</span>
          </div>
          <span className={`px-3 py-1 rounded font-semibold ${getHealthColor(health.donor_pipeline)}`}>
            {health.donor_pipeline}
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-purple-600" />
            <span className="text-sm text-gray-600">Donor Engagement</span>
          </div>
          <span className={`px-3 py-1 rounded font-semibold ${getHealthColor(health.donor_engagement)}`}>
            {health.donor_engagement}
          </span>
        </div>
      </div>

      {data.urgent_actions && data.urgent_actions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Urgent Actions Required
          </h3>
          <div className="space-y-2">
            {data.urgent_actions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <ChevronRight className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
                <span className="text-yellow-800">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(data.quick_links).map(([key, url], idx) => (
            <a
              key={idx}
              href={url}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <ChevronRight className="text-gray-400" size={16} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const OKRsView = ({ data }) => {
  if (!data || !data.objectives) return <div>Loading...</div>;

  // Calculate summary stats
  const allKRs = data.objectives.flatMap(obj => obj.key_results);
  const onTrack = allKRs.filter(kr => kr.status === 'on_track').length;
  const exceeding = allKRs.filter(kr => kr.status === 'exceeding').length;
  const atRisk = allKRs.filter(kr => kr.status === 'at_risk').length;
  const offTrack = allKRs.filter(kr => kr.status === 'off_track').length;
  const totalProgress = allKRs.reduce((sum, kr) => sum + kr.progress, 0) / allKRs.length;

  const getStatusColor = (status) => {
    const colors = {
      'exceeding': 'bg-green-100 text-green-800',
      'on_track': 'bg-orange-100 text-orange-600',
      'at_risk': 'bg-yellow-100 text-yellow-800',
      'off_track': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'exceeding': 'Exceeding',
      'on_track': 'On Track',
      'at_risk': 'At Risk',
      'off_track': 'Off Track'
    };
    return labels[status] || status;
  };

  const overallProgressPct = formatPercent(totalProgress);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-green-800 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Objectives & Key Results</h2>
        <p className="text-orange-600">Period: {data.period}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Overall Progress</p>
          <p className="text-3xl font-bold text-green-700">{overallProgressPct.display}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">Exceeding</p>
          <p className="text-3xl font-bold text-green-700">{exceeding}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4">
          <p className="text-sm text-orange-600">On Track</p>
          <p className="text-3xl font-bold text-orange-600">{onTrack}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-600">At Risk</p>
          <p className="text-3xl font-bold text-yellow-700">{atRisk}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">Off Track</p>
          <p className="text-3xl font-bold text-red-700">{offTrack}</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.objectives.map((objective, idx) => {
          const objProgress = objective.key_results.reduce((sum, kr) => sum + kr.progress, 0) / objective.key_results.length;
          const progressPct = formatPercent(objProgress);

          return (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{objective.objective}</h3>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Objective Progress</span>
                  <span className="font-medium">{progressPct.display}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${progressPct.pct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Key Results</h4>
                {objective.key_results.map((kr, krIdx) => {
                  const krProgressPct = formatPercent(kr.progress);
                  return (
                    <div key={krIdx} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-gray-900 flex-1">{kr.kr}</p>
                        <span className={`px-2 py-1 rounded text-xs ml-2 font-medium ${getStatusColor(kr.status)}`}>
                          {getStatusLabel(kr.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 mb-2">
                        <div>
                          <span className="font-medium">Target:</span> {kr.target.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Current:</span> {kr.current.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Progress:</span> {krProgressPct.display}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            kr.status === 'exceeding' ? 'bg-green-500' :
                            kr.status === 'on_track' ? 'bg-orange-500' :
                            kr.status === 'at_risk' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${krProgressPct.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const ExecutiveScorecardView = ({ data }) => {
  if (!data) return <div>Loading...</div>;

  const financial = data.financial_metrics || {};
  const donor = data.donor_metrics || {};
  const growth = data.growth_metrics || {};
  const digital = data.digital_metrics || {};

  const getStatusColor = (status) => {
    const colors = {
      'healthy': 'text-green-600 bg-green-100',
      'warning': 'text-yellow-600 bg-yellow-100',
      'critical': 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-700 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Executive Scorecard</h2>
            <p className="text-green-700">{data.period || 'YTD'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-700 mb-1">Health Score</p>
            <p className="text-4xl font-bold">{data.health_score || 0}</p>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(data.status)}`}>
              {(data.status || 'unknown').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="text-green-600" />
          Financial Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">${financial.total_revenue?.toLocaleString() || 0}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Avg Donation</p>
            <p className="text-2xl font-bold text-gray-900">${financial.avg_donation?.toFixed(2) || 0}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Program Efficiency</p>
            <p className="text-2xl font-bold text-green-600">{financial.program_efficiency?.toFixed(1) || 0}%</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Fundraising Efficiency</p>
            <p className="text-2xl font-bold text-orange-600">{financial.fundraising_efficiency?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      {/* Donor Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="text-orange-600" />
          Donor Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Total Donors</p>
            <p className="text-2xl font-bold text-gray-900">{donor.total_donors || 0}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Active Donors</p>
            <p className="text-2xl font-bold text-green-600">{donor.active_donors || 0}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Retention Rate</p>
            <p className="text-2xl font-bold text-orange-600">{donor.retention_rate?.toFixed(1) || 0}%</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Lapsed Rate</p>
            <p className="text-2xl font-bold text-red-600">{donor.lapsed_rate?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" />
          Year-over-Year Growth
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Revenue Growth</p>
            <p className="text-2xl font-bold text-green-600">+{growth.revenue_growth_yoy?.toFixed(1) || 0}%</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Donor Growth</p>
            <p className="text-2xl font-bold text-orange-600">+{growth.donor_growth_yoy?.toFixed(1) || 0}%</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Avg Gift Growth</p>
            <p className="text-2xl font-bold text-purple-600">+{growth.avg_gift_growth?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      {/* Digital Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="text-cyan-600" />
          Digital Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Website Conversion</p>
            <p className="text-2xl font-bold text-gray-900">{digital.website_conversion?.toFixed(1) || 0}%</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Email Open Rate</p>
            <p className="text-2xl font-bold text-green-600">{digital.email_open_rate?.toFixed(1) || 0}%</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Social Engagement</p>
            <p className="text-2xl font-bold text-orange-600">{digital.social_engagement?.toFixed(2) || 0}%</p>
          </div>
        </div>
      </div>

      {/* Overall Assessment */}
      <div className={`rounded-lg p-6 ${
        data.status === 'healthy' ? 'bg-green-50 border border-green-200' :
        data.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 ${
          data.status === 'healthy' ? 'text-green-900' :
          data.status === 'warning' ? 'text-yellow-900' :
          'text-red-900'
        }`}>
          Overall Assessment
        </h3>
        <p className={`text-sm ${
          data.status === 'healthy' ? 'text-green-800' :
          data.status === 'warning' ? 'text-yellow-800' :
          'text-red-800'
        }`}>
          {data.status === 'healthy' &&
            `Organization health score of ${data.health_score} indicates strong performance across financial, donor, and growth metrics.`}
          {data.status === 'warning' &&
            `Organization health score of ${data.health_score} suggests some areas need attention to maintain optimal performance.`}
          {data.status === 'critical' &&
            `Organization health score of ${data.health_score} requires immediate attention to address underperforming metrics.`}
        </p>
      </div>
    </div>
  );
};


export default ComprehensiveAnalytics;
