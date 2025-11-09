import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ComposedChart
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle, Shield,
  Target, Calendar, PieChart as PieChartIcon, Activity,
  ArrowUpRight, ArrowDownRight, Briefcase, CreditCard
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FinancialHealthDashboard = ({ organizationId, authToken }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');
  const [comparisonMode, setComparisonMode] = useState('yoy'); // yoy, qoq, mom
  const [data, setData] = useState({
    cashFlow: null,
    burnRate: null,
    runwayAnalysis: null,
    revenueStreams: null,
    expenseBreakdown: null,
    financialRatios: null,
    budgetVariance: null,
    forecast: null
  });

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      const [cashFlow, burnRate, runway, revenue, expenses, ratios, budget, forecast] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/${organizationId}/cash-flow?period=${selectedPeriod}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/burn-rate`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/runway`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/revenue-streams`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/expense-breakdown`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/financial-ratios`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/budget-variance`, { headers }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/${organizationId}/financial-forecast`, { headers }).then(r => r.json())
      ]);

      setData({
        cashFlow,
        burnRate,
        runwayAnalysis: runway,
        revenueStreams: revenue,
        expenseBreakdown: expenses,
        financialRatios: ratios,
        budgetVariance: budget,
        forecast
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId && authToken) {
      fetchFinancialData();
    }
  }, [organizationId, authToken, selectedPeriod]);

  // Health Score Indicator
  const HealthScoreIndicator = ({ score, label }) => {
    const getColor = () => {
      if (score >= 80) return 'text-green-600 bg-green-100';
      if (score >= 60) return 'text-yellow-600 bg-yellow-100';
      if (score >= 40) return 'text-orange-600 bg-orange-100';
      return 'text-red-600 bg-red-100';
    };

    const getStatus = () => {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      if (score >= 40) return 'Fair';
      return 'Needs Attention';
    };

    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
        <div className="flex-1">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold mt-1">{score}/100</p>
          <p className="text-xs text-gray-500 mt-1">{getStatus()}</p>
        </div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getColor()}`}>
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </div>
    );
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Health Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive financial analysis and forecasting</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="current_month">Current Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="trailing_12">Trailing 12 Months</option>
            </select>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="yoy">Year over Year</option>
              <option value="qoq">Quarter over Quarter</option>
              <option value="mom">Month over Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Health Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <HealthScoreIndicator score={data.financialRatios?.overall_health || 0} label="Overall Health" />
        <HealthScoreIndicator score={data.financialRatios?.liquidity_score || 0} label="Liquidity" />
        <HealthScoreIndicator score={data.financialRatios?.efficiency_score || 0} label="Efficiency" />
        <HealthScoreIndicator score={data.financialRatios?.sustainability_score || 0} label="Sustainability" />
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-green-500" size={24} />
            <span className={`text-sm font-medium ${data.cashFlow?.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.cashFlow?.trend > 0 ? '+' : ''}{data.cashFlow?.trend}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Cash on Hand</p>
          <p className="text-2xl font-bold text-gray-900">${data.cashFlow?.cash_on_hand?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.cashFlow?.days_cash || 0} days of operations
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="text-orange-500" size={24} />
            <span className="text-sm font-medium text-orange-600">
              ${data.burnRate?.monthly_burn?.toLocaleString() || 0}/mo
            </span>
          </div>
          <p className="text-sm text-gray-600">Burn Rate</p>
          <p className="text-2xl font-bold text-gray-900">${data.burnRate?.daily_burn?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Daily average</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-blue-500" size={24} />
            <span className={`text-sm font-medium ${data.runwayAnalysis?.months > 12 ? 'text-green-600' : 'text-red-600'}`}>
              {data.runwayAnalysis?.status || 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-gray-600">Runway</p>
          <p className="text-2xl font-bold text-gray-900">{data.runwayAnalysis?.months || 0} months</p>
          <p className="text-xs text-gray-500 mt-1">At current burn rate</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-purple-500" size={24} />
            <span className={`text-sm font-medium ${data.budgetVariance?.variance_percent < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.budgetVariance?.variance_percent}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Budget Variance</p>
          <p className="text-2xl font-bold text-gray-900">
            ${Math.abs(data.budgetVariance?.variance_amount || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.budgetVariance?.variance_percent < 0 ? 'Under' : 'Over'} budget
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Shield className="text-indigo-500" size={24} />
            <span className="text-sm font-medium text-indigo-600">
              {data.financialRatios?.reserve_ratio || 0}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Reserve Ratio</p>
          <p className="text-2xl font-bold text-gray-900">
            ${data.financialRatios?.reserves?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.financialRatios?.reserve_months || 0} months coverage
          </p>
        </div>
      </div>

      {/* Cash Flow Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.cashFlow?.monthly_trend || []}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorInflow)" />
              <Area type="monotone" dataKey="outflow" stroke="#ef4444" fillOpacity={1} fill="url(#colorOutflow)" />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Streams</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.revenueStreams?.breakdown || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.revenueStreams?.breakdown?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.expenseBreakdown?.categories || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="amount" fill="#3b82f6" />
              <Line yAxisId="right" type="monotone" dataKey="percentage" stroke="#f59e0b" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Ratios</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Program Efficiency</span>
                <span className="text-sm font-medium">{data.financialRatios?.program_efficiency || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${data.financialRatios?.program_efficiency || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Fundraising Efficiency</span>
                <span className="text-sm font-medium">{data.financialRatios?.fundraising_efficiency || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${data.financialRatios?.fundraising_efficiency || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Admin Efficiency</span>
                <span className="text-sm font-medium">{data.financialRatios?.admin_efficiency || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{ width: `${data.financialRatios?.admin_efficiency || 0}%` }}
                />
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Industry benchmark: 75% program, 15% fundraising, 10% admin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Forecast */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">12-Month Financial Forecast</h3>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Conservative</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Moderate</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Optimistic</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.forecast?.monthly || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="conservative" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="moderate" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="optimistic" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600">Conservative EOY</p>
            <p className="text-xl font-bold text-blue-600">
              ${data.forecast?.conservative_eoy?.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Moderate EOY</p>
            <p className="text-xl font-bold text-green-600">
              ${data.forecast?.moderate_eoy?.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Optimistic EOY</p>
            <p className="text-xl font-bold text-purple-600">
              ${data.forecast?.optimistic_eoy?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthDashboard;