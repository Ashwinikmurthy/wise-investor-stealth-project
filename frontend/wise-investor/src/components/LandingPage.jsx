import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, Award, Target, Heart,
  Globe, Shield, Zap, BarChart3, ChevronRight, Star,
  Clock, CheckCircle, ArrowUpRight, Play, Building,
  Sparkles, Activity, Gift, Calendar, Eye, ArrowRight,
  TrendingDown, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

const LandingPage = () => {
  const navigate = useNavigate();
  const [counters, setCounters] = useState({
    revenue: 0,
    donors: 0,
    campaigns: 0,
    retention: 0
  });
  const [publicCampaigns, setPublicCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Animated counter effect
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      revenue: 12500000,
      donors: 48750,
      campaigns: 325,
      retention: 89
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setCounters({
        revenue: Math.floor(targets.revenue * easeOutQuart),
        donors: Math.floor(targets.donors * easeOutQuart),
        campaigns: Math.floor(targets.campaigns * easeOutQuart),
        retention: Math.floor(targets.retention * easeOutQuart)
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Fetch public campaigns
  useEffect(() => {
    const fetchPublicCampaigns = async () => {
      try {
        const response = await axios.get('/api/public/campaigns', {
          params: {
            page: 1,
            page_size: 6,
            sort_by: 'created_at'
          }
        });
        setPublicCampaigns(response.data.campaigns);
      } catch (error) {
        console.error('Error fetching public campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchPublicCampaigns();
  }, []);

  const MetricCard = ({ icon: Icon, value, label, prefix = '', suffix = '', color = colors.primary }) => (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-green-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
      <div className="relative bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-8 h-8" style={{ color }} />
          </div>
          <ArrowUpRight className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-3xl font-bold mb-2" style={{ color: colors.secondary }}>
          {prefix}{value.toLocaleString()}{suffix}
        </div>
        <div className="text-gray-600">{label}</div>
      </div>
    </div>
  );

  const CampaignCard = ({ campaign }) => {
    const daysRemaining = campaign.days_remaining;
    const isUrgent = daysRemaining && daysRemaining <= 7;

    return (
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-green-200 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity"></div>
        <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
          {/* Campaign Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors">
                  {campaign.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="w-4 h-4" />
                  <span>{campaign.organization_name}</span>
                </div>
              </div>
              {isUrgent && (
                <div className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Urgent
                </div>
              )}
            </div>

            {campaign.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mt-2">
                {campaign.description}
              </p>
            )}
          </div>

          {/* Progress Section */}
          <div className="p-6">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold" style={{ color: colors.secondary }}>
                  ${campaign.amount_raised?.toLocaleString() || '0'}
                </span>
                <span className="text-gray-500">
                  of ${campaign.goal_amount?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(campaign.progress_percentage || 0, 100)}%`,
                    background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  }}
                ></div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-lg font-bold" style={{ color: colors.primary }}>
                  {campaign.progress_percentage?.toFixed(0) || 0}%
                </span>
                <span className="text-gray-600 text-sm ml-1">funded</span>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4" style={{ color: colors.primary }} />
                  <span className="text-2xl font-bold" style={{ color: colors.secondary }}>
                    {campaign.donor_count || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Donors</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4" style={{ color: colors.accent }} />
                  <span className="text-2xl font-bold" style={{ color: colors.secondary }}>
                    {daysRemaining || '∞'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Days Left</p>
              </div>
            </div>

            {/* Donate Button */}
            <button
              onClick={() => navigate(`/donor-portal/donate/${campaign.id}`)}
              className="w-full py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
              }}
            >
              <Heart className="w-5 h-5" />
              Contribute Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-green-50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-200 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                   style={{ backgroundColor: colors.primary }}>
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: colors.secondary }}>
                  Wise Investor
                </h1>
                <p className="text-xs text-gray-500">Nonprofit Intelligence Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/donor-portal')}
                className="px-6 py-3 rounded-xl font-semibold border-2 hover:shadow-lg transition-all duration-300"
                style={{ borderColor: colors.primary, color: colors.primary }}
              >
                Donor Portal
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                style={{ backgroundColor: colors.primary }}
              >
                Sign In
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md mb-6">
                <Sparkles className="w-5 h-5" style={{ color: colors.primary }} />
                <span className="text-sm font-semibold" style={{ color: colors.secondary }}>
                  Trusted by 500+ Nonprofits Nationwide
                </span>
              </div>

              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-green-700 bg-clip-text text-transparent">
                Transform Your Fundraising
                <br />
                With AI-Powered Intelligence
              </h1>

              <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
                Unlock the full potential of your nonprofit with real-time analytics,
                donor insights, and predictive intelligence that drives unprecedented growth
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  }}
                >
                  <Zap className="w-5 h-5" />
                  Get Started Now
                </button>
                <button className="px-8 py-4 rounded-xl font-semibold border-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                        style={{ borderColor: colors.secondary, color: colors.secondary }}>
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Success Metrics Grid */}
            <div className="grid md:grid-cols-4 gap-8 mb-20">
              <MetricCard
                icon={DollarSign}
                value={counters.revenue}
                label="Total Funds Raised"
                prefix="$"
                color={colors.primary}
              />
              <MetricCard
                icon={Users}
                value={counters.donors}
                label="Active Donors"
                color={colors.secondary}
              />
              <MetricCard
                icon={Target}
                value={counters.campaigns}
                label="Active Campaigns"
                color={colors.accent}
              />
              <MetricCard
                icon={TrendingUp}
                value={counters.retention}
                label="Donor Retention"
                suffix="%"
                color={colors.primary}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Public Campaigns Section - NEW */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                 style={{ backgroundColor: `${colors.light}` }}>
              <Heart className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="text-sm font-semibold" style={{ color: colors.primary }}>
                Make a Difference Today
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: colors.secondary }}>
              Featured Campaigns
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Support causes that matter. Every contribution makes an impact.
            </p>
          </div>

          {loadingCampaigns ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : publicCampaigns.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {publicCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => navigate('/donor-portal')}
                  className="px-8 py-4 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  }}
                >
                  View All Campaigns
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No campaigns available at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4" style={{ borderColor: colors.primary }}>
              <Heart className="w-10 h-10 mb-3" style={{ color: colors.primary }} />
              <h3 className="text-lg font-bold mb-2">100% Secure</h3>
              <p className="text-gray-600">Your donations are processed securely with bank-level encryption</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4" style={{ borderColor: colors.secondary }}>
              <Shield className="w-10 h-10 mb-3" style={{ color: colors.secondary }} />
              <h3 className="text-lg font-bold mb-2">Tax Deductible</h3>
              <p className="text-gray-600">Receive instant tax receipts for all eligible donations</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4" style={{ borderColor: colors.accent }}>
              <Globe className="w-10 h-10 mb-3" style={{ color: colors.accent }} />
              <h3 className="text-lg font-bold mb-2">Global Impact</h3>
              <p className="text-gray-600">Supporting nonprofits making a difference worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: colors.secondary }}>
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to maximize your fundraising potential
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track performance with live dashboards' },
              { icon: Users, title: 'Donor Intelligence', desc: 'AI-powered insights and segmentation' },
              { icon: Target, title: 'Campaign Management', desc: 'Launch and optimize campaigns effortlessly' },
              { icon: Gift, title: 'Gift Processing', desc: 'Seamless donation processing and receipts' },
              { icon: Activity, title: 'Predictive Analytics', desc: 'Forecast trends and identify opportunities' },
              { icon: Calendar, title: 'Event Management', desc: 'Plan and execute fundraising events' }
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="p-6 rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                       style={{ backgroundColor: `${colors.primary}15` }}>
                    <feature.icon className="w-8 h-8" style={{ color: colors.primary }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20" style={{ backgroundColor: colors.light }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <h2 className="text-4xl font-bold mb-8" style={{ color: colors.secondary }}>
              See Your Potential ROI
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <p className="text-5xl font-bold" style={{ color: colors.primary }}>3.5x</p>
                <p className="text-gray-600 mt-2">Average ROI Increase</p>
              </div>
              <div>
                <p className="text-5xl font-bold" style={{ color: colors.secondary }}>45%</p>
                <p className="text-gray-600 mt-2">More Donor Engagement</p>
              </div>
              <div>
                <p className="text-5xl font-bold" style={{ color: colors.accent }}>$2.3M</p>
                <p className="text-gray-600 mt-2">Average Annual Growth</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
              }}
            >
              Calculate Your ROI
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.secondary }}>
            Trusted by Leading Organizations
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" style={{ color: colors.primary }} />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Wise Investor transformed our fundraising operations. We've seen a 250% increase in donor retention
                and doubled our annual revenue within 18 months."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-green-200"></div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-gray-600">Executive Director, Hope Foundation</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" style={{ color: colors.primary }} />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "The AI-powered insights have been game-changing. We can now predict donor behavior and optimize
                our campaigns with unprecedented accuracy."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-green-200"></div>
                <div>
                  <p className="font-semibold">Michael Chen</p>
                  <p className="text-sm text-gray-600">CFO, Global Health Initiative</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-green-700">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Fundraising?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 500+ nonprofits achieving extraordinary results with Wise Investor
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              style={{ color: colors.primary }}
            >
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white rounded-xl font-semibold text-white hover:bg-white hover:text-orange-600 transition-all duration-300">
              Schedule Demo
            </button>
          </div>
          <p className="mt-6 text-sm opacity-75">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                   style={{ backgroundColor: colors.primary }}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Wise Investor</span>
            </div>
            <p className="text-gray-400">© 2024 Wise Investor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;