import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, DollarSign, Target, Activity, Globe,
  Gift, Calendar, Shield, Zap, Settings, LogOut, Bell,
  ChevronRight, Search, Menu, X, TrendingUp, Award,
  Heart, Building, CreditCard, Mail, Phone, Download,Brain,HandHeart, Home,
  FileText, MessageSquare, Video, Share2, Eye, Plus, UserPlus,
  Sparkles, Clock, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ComprehensiveAnalytics from './Dashboard/ComprehensiveAnalytics_UTD_colors.jsx';
import CampaignManagement from './campaignManagement';
import MajorGiftsDashboardComplete from './MajorGiftsDashBoardComplete'; // ✅ NEW: Major Gifts Dashboard
import DonorPortalWithAPI from './DonorportalUpdated';
import SmartCheckout from './SmartCheckout';
import AdminCreateStaff from './Auth/AdminCreateStaff';
import LandingPage from './EnhancedLandingPageAfterLogin';
import EventManagement from './Eventmanagement'; // ✅ NEW: Full Event Management

// UT Dallas Brand Colors
const colors = {
  primary: '#e87500',      // UT Dallas Orange
  secondary: '#154734',    // UT Dallas Green
  accent: '#5fe0b7',       // Accent Green
  light: '#FFF5ED',        // Light Orange
  dark: '#0A1F16',         // Dark Green
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
};

const MainApplication = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Tab definitions with icons and descriptions
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      description: 'Welcome to your dashboard',
      color: colors.primary,
      component: <LandingPage />
    },
    {
      id: 'dashboard',
      label: 'Analytics Dashboard',
      icon: BarChart3,
      description: 'Real-time insights and performance metrics',
      color: colors.primary,
      component: <ComprehensiveAnalytics />
    },
    // ✅ REMOVED: Executive Dashboard tab (lines 81-87 from original)
    // ✅ NEW: Major Gifts Dashboard
    {
      id: 'major-gifts',
      label: 'Major Gifts',
      icon: Award,
      description: 'Major donor pipeline and officer performance',
      color: colors.secondary,
      component: <MajorGiftsDashboardComplete />
    },
    {
      id: 'campaigns',
      label: 'Campaign Pages',
      icon: Target,
      description: 'Create and manage fundraising campaigns',
      color: colors.secondary,
      component: <CampaignManagement />
    },
    {
      id: 'donors',
      label: 'Donor Portal',
      icon: Users,
      description: 'Donor management and engagement tools',
      color: colors.accent,
      component: <DonorPortalWithAPI />
    },
    {
      id: 'checkout',
      label: 'Smart Checkout',
      icon: CreditCard,
      description: 'Optimized donation processing',
      color: colors.primary,
      component: <SmartCheckout />
    },
    {
      id: 'admin-staff',
      label: 'Create Staff',
      icon: UserPlus,
      description: 'Add new team members to your organization',
      color: colors.secondary,
      component: <AdminCreateStaff />
    },
    {
      id: 'elements',
      label: 'Elements',
      icon: Gift,
      description: 'Customizable donation widgets',
      color: colors.secondary,
      component: <Elements />
    },
    {
      id: 'ai',
      label: 'AI Intelligence',
      icon: Zap,
      description: 'Predictive analytics and insights',
      color: colors.accent,
      component: <AIIntelligence />
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      description: 'Event management and ticketing',
      color: colors.primary,
      component: <EventManagement />
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Globe,
      description: 'Connect with your favorite tools',
      color: colors.secondary,
      component: <Integrations />
    }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Organization */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                     style={{ backgroundColor: colors.primary }}>
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold" style={{ color: colors.secondary }}>
                    Wise Investor
                  </h1>
                  <p className="text-xs text-gray-500">Enterprise Platform</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns, donors, reports..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                  style={{ focusRingColor: colors.primary }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings */}
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white"
                     style={{ backgroundColor: colors.primary }}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.email || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="border-t border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      isActive
                        ? 'text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: isActive ? tab.color : 'transparent'
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: isActive ? tab.color : 'transparent'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{tab.label}</p>
                      <p className="text-xs opacity-75">{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-4 top-16 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={() => setShowNotifications(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { title: 'New donation received', time: '5 min ago', type: 'success' },
              { title: 'Campaign goal reached', time: '1 hour ago', type: 'success' },
              { title: 'Donor follow-up needed', time: '2 hours ago', type: 'warning' }
            ].map((notif, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  notif.type === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{notif.title}</p>
                  <p className="text-xs text-gray-500">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="transition-all duration-300">
        {currentTab?.component}
      </main>
    </div>
  );
};

// Placeholder Components
const Elements = () => (
  <div className="p-8">
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: colors.secondary }}>
          Donation Elements
        </h2>
        <p className="text-gray-600 mb-6">
          Customize and embed donation widgets across your website
        </p>
        <div className="grid grid-cols-3 gap-6">
          {['Quick Donate Button', 'Donation Form', 'Campaign Widget'].map((element) => (
            <div key={element} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <Gift className="w-8 h-8 mb-3" style={{ color: colors.primary }} />
              <h3 className="font-semibold mb-2">{element}</h3>
              <p className="text-sm text-gray-600 mb-4">Embed on your website</p>
              <button className="text-sm font-medium" style={{ color: colors.primary }}>
                Configure →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AIIntelligence = () => {
  const [activeView, setActiveView] = useState('overview');
  const [aiMetrics, setAIMetrics] = useState(null);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: colors.secondary }}>
            AI Intelligence Center
          </h2>
          <p className="text-gray-600">
            Leverage artificial intelligence to optimize your fundraising strategy
          </p>
        </div>

        {/* AI Views Toggle */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Brain },
            { id: 'donor-retention', label: 'Donor Retention', icon: Users },
            { id: 'campaigns', label: 'Campaign Optimization', icon: Target },
            { id: 'financial', label: 'Financial Forecasting', icon: TrendingUp },
            { id: 'impact', label: 'Impact Analysis', icon: Heart }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeView === view.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <view.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{view.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeView === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Insights */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6" />
                  <h3 className="font-semibold text-lg">AI-Powered Insights</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">Top Recommendation</p>
                    <p className="text-2xl font-bold mb-2">Focus on Lapsed Donors</p>
                    <p className="text-sm opacity-90">
                      AI predicts 34% higher success rate in re-engaging donors who gave 12-18 months ago
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <p className="text-xs opacity-75">Confidence Score</p>
                      <p className="text-xl font-bold">94%</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <p className="text-xs opacity-75">Potential Impact</p>
                      <p className="text-xl font-bold">$45K</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4">AI Performance Today</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Predictions Made</p>
                        <p className="text-lg font-bold">127</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Donors Analyzed</p>
                        <p className="text-lg font-bold">1,234</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Campaigns Optimized</p>
                        <p className="text-lg font-bold">8</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Recent AI Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
                <h3 className="font-semibold text-lg mb-4">Recent AI Actions</h3>
                <div className="space-y-3">
                  {[
                    { action: 'Identified 23 high-value prospects', time: '2 hours ago', icon: Users, color: 'blue' },
                    { action: 'Optimized "Spring Campaign" messaging', time: '5 hours ago', icon: Target, color: 'green' },
                    { action: 'Predicted $125K revenue for Q2', time: '1 day ago', icon: TrendingUp, color: 'purple' },
                    { action: 'Segmented donors into 5 groups', time: '2 days ago', icon: Users, color: 'indigo' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <div className={`w-10 h-10 rounded-full bg-${item.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.action}</p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                      </div>
                      <button className="text-xs text-indigo-600">View Details</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'donor-retention' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6">Donor Retention Analysis</h3>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-red-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">At-Risk Donors</p>
                  <p className="text-3xl font-bold text-red-600">23</p>
                  <p className="text-xs text-gray-500 mt-2">Predicted to lapse</p>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Engagement Needed</p>
                  <p className="text-3xl font-bold text-yellow-600">67</p>
                  <p className="text-xs text-gray-500 mt-2">Low activity score</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Highly Engaged</p>
                  <p className="text-3xl font-bold text-green-600">234</p>
                  <p className="text-xs text-gray-500 mt-2">Strong retention</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Recommended Actions</h4>
                <div className="space-y-3">
                  {[
                    'Schedule personalized outreach for 23 at-risk donors',
                    'Send re-engagement campaign to 67 low-activity donors',
                    'Request testimonials from 15 highly engaged donors'
                  ].map((action, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{action}</span>
                      <button className="ml-auto text-xs text-indigo-600">Schedule</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'campaigns' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6">Campaign Optimization</h3>
              <div className="grid grid-cols-2 gap-6">
                {['Spring Fundraiser', 'Annual Gala'].map((campaign) => (
                  <div key={campaign} className="border border-gray-200 rounded-xl p-6">
                    <h4 className="font-semibold mb-4">{campaign}</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Predicted Success Rate</span>
                          <span className="font-medium">87%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Optimal Send Time</span>
                        <span className="font-medium">Tuesday 10 AM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Best Channel</span>
                        <span className="font-medium">Email + Social</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'financial' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6">Financial Forecasting</h3>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Next Month', value: '$45K', confidence: '92%' },
                  { label: 'Next Quarter', value: '$135K', confidence: '88%' },
                  { label: 'Next 6 Months', value: '$280K', confidence: '84%' },
                  { label: 'Next Year', value: '$560K', confidence: '79%' }
                ].map((forecast) => (
                  <div key={forecast.label} className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">{forecast.label}</p>
                    <p className="text-2xl font-bold text-indigo-600">{forecast.value}</p>
                    <p className="text-xs text-gray-500 mt-1">±{forecast.confidence}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Key Drivers</h4>
                <div className="space-y-2">
                  {[
                    { factor: 'Seasonal giving patterns', impact: 'High' },
                    { factor: 'Donor retention rate', impact: 'High' },
                    { factor: 'Campaign performance', impact: 'Medium' },
                    { factor: 'Economic indicators', impact: 'Medium' }
                  ].map((driver) => (
                    <div key={driver.factor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{driver.factor}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        driver.impact === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {driver.impact} Impact
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'impact' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6">Impact Analysis</h3>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { metric: 'Lives Impacted', value: '2,345', change: '+12%' },
                  { metric: 'Programs Funded', value: '18', change: '+3' },
                  { metric: 'Community Reach', value: '12K', change: '+8%' }
                ].map((stat) => (
                  <div key={stat.metric} className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">{stat.metric}</p>
                    <p className="text-3xl font-bold text-purple-600">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-2">{stat.change} vs last year</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <h4 className="font-semibold mb-4">Program Performance</h4>
                <div className="space-y-3">
                  {[
                    { program: 'Education Initiative', efficiency: 92, impact: 'High' },
                    { program: 'Healthcare Access', efficiency: 88, impact: 'High' },
                    { program: 'Community Development', efficiency: 85, impact: 'Medium' }
                  ].map((program) => (
                    <div key={program.program} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{program.program}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          program.impact === 'High' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {program.impact} Impact
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${program.efficiency}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{program.efficiency}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const Integrations = () => (
  <div className="p-8">
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: colors.secondary }}>
          Integrations Hub
        </h2>
        <div className="grid grid-cols-4 gap-6">
          {[
            { name: 'Salesforce', status: 'Connected', icon: Building },
            { name: 'Mailchimp', status: 'Connected', icon: Mail },
            { name: 'QuickBooks', status: 'Connected', icon: FileText },
            { name: 'Stripe', status: 'Connected', icon: CreditCard },
            { name: 'Google Analytics', status: 'Available', icon: BarChart3 },
            { name: 'Zoom', status: 'Available', icon: Video },
            { name: 'Slack', status: 'Available', icon: MessageSquare },
            { name: 'Microsoft Teams', status: 'Available', icon: Users }
          ].map((integration) => (
            <div key={integration.name} className="border border-gray-200 rounded-xl p-4 text-center hover:shadow-lg transition-all">
              <integration.icon className="w-8 h-8 mx-auto mb-2" style={{
                color: integration.status === 'Connected' ? colors.secondary : colors.gray[400]
              }} />
              <p className="font-medium text-sm">{integration.name}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                integration.status === 'Connected'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {integration.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default MainApplication;
