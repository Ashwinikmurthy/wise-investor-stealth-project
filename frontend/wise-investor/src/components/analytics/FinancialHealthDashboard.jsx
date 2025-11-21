import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3,
  Wallet, Calculator, Target, AlertTriangle, CheckCircle,
  ArrowUp, ArrowDown, Clock, Percent, LineChart, RefreshCw,
  Download, ChevronRight, ChevronLeft, Activity, Shield, Zap, Calendar,
  Building2, Users, Briefcase, Eye, FileText, Sliders, Save, RotateCcw, Play
} from 'lucide-react';

// Enhanced UT Dallas Professional Color Palette
const COLORS = {
  // Brand colors
  utdOrange: '#E87500',
  utdOrangeLight: '#FF9B3B',
  utdOrangeSoft: 'rgba(232,117,0,0.12)',
  utdGreen: '#154734',
  utdGreenLight: '#1E6045',
  utdGreenSoft: 'rgba(21,71,52,0.12)',

  // Backgrounds
  bgLight: '#F8FAFC',
  bgLighter: '#FFFFFF',

  // Text colors
  textDark: '#0F172A',
  textMuted: '#334155',
  textSoft: '#64748B',

  // Borders and shadows
  borderLight: '#E2E8F0',
  borderMid: '#CBD5E1',
  shadowSoft: '0 10px 35px rgba(15,23,42,0.10)',

  // Semantic colors
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  accent: '#5fe0b7',
};

const CHART_COLORS = {
  primary: ['#E87500', '#FF9B3B', '#FFAD5C', '#FFC285', '#FFE0B3'],
  secondary: ['#154734', '#1E6045', '#2D7A5E', '#429878', '#5EB992', '#7ED4AC'],
  mixed: ['#E87500', '#154734', '#5fe0b7', '#2563EB', '#D97706', '#7C3AED'],
};

// Format utilities
const formatCurrency = (value, compact = false) => {
  if (value === null || value === undefined) return '$0';
  const num = Number(value);
  if (compact && Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (compact && Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatPercent = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(1)}%`;
};

/**
 * Financial Health Dashboard - Enhanced Executive Presentation Ready
 * With improved styling and visual clarity
 */
const FinancialHealthDashboard = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const organizationId = localStorage.getItem('organization_id') || '772effb4-35a3-40c6-8555-4d8c732cf656';

  const [activeSection, setActiveSection] = useState('overview');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState({
    cashFlow: null,
    burnRate: null,
    runway: null,
    revenueStreams: null,
    expenseBreakdown: null,
    financialRatios: null,
    budgetVariance: null,
    forecast: null
  });

  const [period, setPeriod] = useState('12m');
  const [lastUpdated, setLastUpdated] = useState(null);

  // What-If Analysis States
  const [whatIfScenario, setWhatIfScenario] = useState({
    revenueChange: 0,
    expenseChange: 0,
    majorGiftIncrease: 0,
    retentionImprovement: 0,
    newDonorGrowth: 0,
    programExpansion: 0
  });
  const [scenarioResults, setScenarioResults] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);

  useEffect(() => {
    fetchAllFinancialData();
  }, [period]);

  const fetchAllFinancialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const baseUrl = '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [
        cashFlowRes, burnRateRes, runwayRes, revenueRes,
        expenseRes, ratiosRes, varianceRes, forecastRes
      ] = await Promise.all([
        fetch(`${baseUrl}/api/v1/financial-analytics/${organizationId}/cash-flow?period=${period}`, { headers }),
        fetch(`${baseUrl}/api/v1/financial-analytics/${organizationId}/burn-rate`, { headers }),
        fetch(`${baseUrl}/api/v1/financial-analytics/${organizationId}/runway`, { headers }),
        fetch(`${baseUrl}/api/v1/financial-analytics/${organizationId}/revenue-streams?period=${period}`, { headers }),
        fetch(`${baseUrl}/api/v1/financial-analytics/${organizationId}/expense-breakdown?period=${period}`, { headers }),
        fetch(`${baseUrl}/api/v1/financial-analytics/${organizationId}/financial-ratios?period=${period}`, { headers }),
        fetch(`${baseUrl}/api/v1/financial-analytics/${organizationId}/budget-variance?period=${period}`, { headers }),
        fetch(`${baseUrl}/api/v1/financial-analytics/${organizationId}/financial-forecast`, { headers })
      ]);

      const [cashFlow, burnRate, runway, revenueStreams, expenseBreakdown, financialRatios, budgetVariance, forecast] = await Promise.all([
        cashFlowRes.json(), burnRateRes.json(), runwayRes.json(), revenueRes.json(),
        expenseRes.json(), ratiosRes.json(), varianceRes.json(), forecastRes.json()
      ]);

      setFinancialData({
        cashFlow, burnRate, runway, revenueStreams,
        expenseBreakdown, financialRatios, budgetVariance, forecast
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate What-If Scenario Impact
  useEffect(() => {
    if (!financialData.revenueStreams || !financialData.expenseBreakdown) return;

    const baseRevenue = financialData.revenueStreams?.total || 1000000;
    const baseExpenses = financialData.expenseBreakdown?.total || 900000;
    const baseDonorCount = 1500;
    const baseRetention = 0.75;
    const baseAvgGift = 350;

    // Calculate impact of each lever
    const revenueImpact = baseRevenue * (whatIfScenario.revenueChange / 100);
    const expenseImpact = baseExpenses * (whatIfScenario.expenseChange / 100);
    const majorGiftImpact = (whatIfScenario.majorGiftIncrease / 100) * baseRevenue * 0.3;
    const retentionImpact = (whatIfScenario.retentionImprovement / 100) * baseDonorCount * baseRetention * baseAvgGift;
    const newDonorImpact = (whatIfScenario.newDonorGrowth / 100) * baseDonorCount * 0.25 * baseAvgGift * 0.8;
    const programExpansionCost = (whatIfScenario.programExpansion / 100) * baseExpenses * 0.65;

    const projectedRevenue = baseRevenue + revenueImpact + majorGiftImpact + retentionImpact + newDonorImpact;
    const projectedExpenses = baseExpenses + expenseImpact + programExpansionCost;
    const projectedNetIncome = projectedRevenue - projectedExpenses;
    const projectedMargin = (projectedNetIncome / projectedRevenue) * 100;

    // Calculate new ratios
    const currentCash = financialData.runway?.available_cash || 500000;
    const newRunway = currentCash / (projectedExpenses / 12);
    const newProgramRatio = (0.65 * baseExpenses + programExpansionCost) / projectedExpenses;

    setScenarioResults({
      baseRevenue,
      baseExpenses,
      baseNetIncome: baseRevenue - baseExpenses,
      baseMargin: ((baseRevenue - baseExpenses) / baseRevenue) * 100,
      projectedRevenue,
      projectedExpenses,
      projectedNetIncome,
      projectedMargin,
      revenueChange: projectedRevenue - baseRevenue,
      expenseChange: projectedExpenses - baseExpenses,
      netIncomeChange: projectedNetIncome - (baseRevenue - baseExpenses),
      newRunway,
      newProgramRatio,
      impact: {
        revenue: revenueImpact,
        majorGifts: majorGiftImpact,
        retention: retentionImpact,
        newDonors: newDonorImpact,
        expenses: expenseImpact,
        programs: programExpansionCost
      }
    });
  }, [whatIfScenario, financialData]);

  // Reset Scenario
  const resetScenario = () => {
    setWhatIfScenario({
      revenueChange: 0,
      expenseChange: 0,
      majorGiftIncrease: 0,
      retentionImprovement: 0,
      newDonorGrowth: 0,
      programExpansion: 0
    });
  };

  // Save Scenario
  const saveScenario = () => {
    if (!scenarioResults) return;
    const newScenario = {
      id: Date.now(),
      name: `Scenario ${savedScenarios.length + 1}`,
      inputs: { ...whatIfScenario },
      results: { ...scenarioResults },
      createdAt: new Date().toISOString()
    };
    setSavedScenarios([...savedScenarios, newScenario]);
  };

  const subNavTabs = [
    { id: 'overview', label: 'Executive Summary', icon: <Eye className="h-4 w-4" /> },
    { id: 'revenue-expenses', label: 'Revenue & Expenses', icon: <PieChart className="h-4 w-4" /> },
    { id: 'ratios-forecast', label: 'Ratios & Forecast', icon: <LineChart className="h-4 w-4" /> },
    { id: 'what-if', label: 'What-If Analysis', icon: <Calculator className="h-4 w-4" /> }
  ];

  const periodLabels = {
    '3m': 'Last 3 Months',
    '6m': 'Last 6 Months',
    '12m': 'Last 12 Months',
    '24m': 'Last 24 Months'
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{
          background: 'radial-gradient(circle at top, #ffffff 0%, #F8FAFC 45%, #E2E8F0 100%)',
        }}
      >
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-slate-200" />
            <div
              className="animate-spin rounded-full h-16 w-16 border-[3px] border-t-transparent absolute inset-0 m-auto"
              style={{ borderColor: `${COLORS.utdOrange} transparent transparent transparent` }}
            />
          </div>
          <div>
            <p className="text-lg font-semibold" style={{ color: COLORS.textDark }}>
              Loading Financial Analytics
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Preparing your executive dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center min-h-screen px-4"
        style={{
          background: 'radial-gradient(circle at top, #ffffff 0%, #F8FAFC 45%, #E2E8F0 100%)',
        }}
      >
        <div
          className="max-w-md w-full rounded-3xl p-6 shadow-xl border"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.98))',
            borderColor: COLORS.borderLight,
          }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.textDark }}>
            Unable to Load Data
          </h2>
          <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
            {error}
          </p>
          <button
            onClick={fetchAllFinancialData}
            className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{
              background: `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`,
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(circle at top left, #FFFFFF 0%, #F8FAFC 40%, #E2E8F0 100%)',
      }}
    >
      {/* Executive Header */}
      <div
        className="border-b sticky top-0 z-20 backdrop-blur-xl"
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderColor: COLORS.borderLight,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate('/analytics/executiveDashboard')}
                className="inline-flex items-center text-[11px] sm:text-xs font-medium rounded-full px-3 py-1 border transition-all hover:bg-slate-50"
                style={{ color: COLORS.textMuted, borderColor: COLORS.borderLight }}
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </button>
              <div className="mt-2">
                <h1
                  className="text-2xl sm:text-3xl font-semibold tracking-tight"
                  style={{ color: COLORS.textDark }}
                >
                  Financial Health Dashboard
                </h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textMuted }}>
                  {periodLabels[period]} • Updated {lastUpdated?.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Period Selector */}
              <div
                className="hidden sm:flex items-center rounded-2xl p-1 gap-1 border"
                style={{ background: COLORS.bgLight, borderColor: COLORS.borderLight }}
              >
                {['3m', '6m', '12m', '24m'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{
                      background: period === p ? `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)` : 'transparent',
                      color: period === p ? 'white' : COLORS.textSoft,
                      boxShadow: period === p ? COLORS.shadowSoft : 'none'
                    }}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={fetchAllFinancialData}
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-2xl text-xs font-semibold border shadow-sm hover:bg-slate-50 transition-all"
                style={{ color: COLORS.textDark, borderColor: COLORS.borderLight }}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </button>

              {/* Export */}
              <button
                className="inline-flex items-center px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`,
                }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="mt-4">
            <div
              className="inline-flex rounded-2xl p-1 shadow-sm border"
              style={{
                background: COLORS.bgLight,
                borderColor: COLORS.borderLight,
              }}
            >
              {subNavTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className="inline-flex items-center px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all"
                  style={{
                    background: activeSection === tab.id
                      ? `linear-gradient(135deg, ${COLORS.utdOrange} 0%, ${COLORS.utdOrangeLight} 100%)`
                      : 'transparent',
                    color: activeSection === tab.id ? 'white' : COLORS.textMuted,
                    boxShadow: activeSection === tab.id ? COLORS.shadowSoft : 'none',
                  }}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeSection === 'overview' && <OverviewSection data={financialData} period={period} />}
        {activeSection === 'revenue-expenses' && <RevenueExpensesSection data={financialData} period={period} />}
        {activeSection === 'ratios-forecast' && <RatiosForecastSection data={financialData} period={period} />}
        {activeSection === 'what-if' && (
          <WhatIfAnalysisSection
            data={financialData}
            scenario={whatIfScenario}
            setScenario={setWhatIfScenario}
            results={scenarioResults}
            savedScenarios={savedScenarios}
            onReset={resetScenario}
            onSave={saveScenario}
            onLoadScenario={(inputs) => setWhatIfScenario(inputs)}
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// METRIC CARD COMPONENT
// ============================================
const MetricCard = ({ title, value, subtitle, icon, trend, trendValue, color = 'primary', size = 'default' }) => {
  const colorMap = {
    primary: { bg: 'rgba(232, 117, 0, 0.08)', icon: COLORS.utdOrange, border: 'rgba(232, 117, 0, 0.2)', gradient: 'linear-gradient(135deg, rgba(232, 117, 0, 0.15) 0%, rgba(232, 117, 0, 0.05) 100%)' },
    success: { bg: COLORS.successLight, icon: COLORS.success, border: 'rgba(16, 185, 129, 0.3)', gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)' },
    danger: { bg: COLORS.dangerLight, icon: COLORS.danger, border: 'rgba(239, 68, 68, 0.3)', gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)' },
    warning: { bg: COLORS.warningLight, icon: COLORS.warning, border: 'rgba(245, 158, 11, 0.3)', gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)' },
    info: { bg: COLORS.infoLight, icon: COLORS.info, border: 'rgba(59, 130, 246, 0.3)', gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)' },
    secondary: { bg: 'rgba(21, 71, 52, 0.08)', icon: COLORS.utdGreen, border: 'rgba(21, 71, 52, 0.2)', gradient: 'linear-gradient(135deg, rgba(21, 71, 52, 0.15) 0%, rgba(21, 71, 52, 0.05) 100%)' }
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className={`bg-white rounded-3xl ${size === 'compact' ? 'p-5' : 'p-5 sm:p-6'} border shadow-sm hover:shadow-lg transition-all duration-200`}
         style={{ borderColor: COLORS.borderLight }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${size === 'compact' ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center`}
             style={{ background: colors.gradient }}>
          {React.cloneElement(icon, {
            className: size === 'compact' ? 'h-5 w-5' : 'h-6 w-6',
            style: { color: colors.icon }
          })}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
            trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className={`${size === 'compact' ? 'text-xs' : 'text-xs'} font-semibold uppercase tracking-wide mb-2`} style={{ color: COLORS.textSoft, letterSpacing: '0.05em' }}>{title}</p>
      <p className={`${size === 'compact' ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: COLORS.textDark }}>{value}</p>
      {subtitle && <p className="text-xs mt-2 font-medium" style={{ color: COLORS.textSoft }}>{subtitle}</p>}
    </div>
  );
};

// ============================================
// SECTION 1: EXECUTIVE SUMMARY (OVERVIEW)
// ============================================
const OverviewSection = ({ data, period }) => {
  const { cashFlow, burnRate, runway, revenueStreams, expenseBreakdown } = data;

  const netCashFlow = cashFlow?.summary?.net_cash_flow || 0;
  const totalInflow = cashFlow?.summary?.total_inflow || 0;
  const totalOutflow = cashFlow?.summary?.total_outflow || 0;
  const avgBurnRate = burnRate?.average_burn_rate || 0;
  const availableCash = runway?.available_cash || 0;
  const runwayMonths = runway?.runway_months || 0;
  const totalRevenue = revenueStreams?.total_revenue || 0;
  const totalExpenses = expenseBreakdown?.total_expenses || 0;
  const programRatio = expenseBreakdown?.program_ratio || 0;

  const getCashFlowChartOption = () => {
    const monthlyData = cashFlow?.monthly_data || [];

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: COLORS.textMuted, fontSize: 13 },
        formatter: (params) => {
          let result = `<div style="font-weight: 700; margin-bottom: 8px; font-size: 14px; color: ${COLORS.textDark}">${params[0]?.name || ''}</div>`;
          params.forEach(param => {
            result += `<div style="display: flex; align-items: center; gap: 10px; margin: 6px 0;">
              ${param.marker}
              <span style="flex: 1;">${param.seriesName}</span>
              <span style="font-weight: 700;">${formatCurrency(param.value, true)}</span>
            </div>`;
          });
          return result;
        }
      },
      legend: {
        data: ['Inflows', 'Outflows', 'Net Flow'],
        bottom: 0,
        textStyle: { color: COLORS.textMuted, fontSize: 12, fontWeight: 500 },
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 24
      },
      grid: { top: 15, left: 55, right: 25, bottom: 50 },
      xAxis: {
        type: 'category',
        data: monthlyData.map(d => {
          const date = new Date(d.month + '-01');
          return date.toLocaleDateString('en-US', { month: 'short' });
        }),
        axisLine: { lineStyle: { color: COLORS.borderMid, width: 2 } },
        axisLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: 500 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
        axisLabel: {
          color: COLORS.textMuted,
          fontSize: 11,
          fontWeight: 500,
          formatter: (value) => formatCurrency(value, true)
        }
      },
      series: [
        {
          name: 'Inflows',
          type: 'bar',
          data: monthlyData.map(d => d.inflow),
          itemStyle: { color: COLORS.success, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 24
        },
        {
          name: 'Outflows',
          type: 'bar',
          data: monthlyData.map(d => d.outflow),
          itemStyle: { color: COLORS.danger, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 24
        },
        {
          name: 'Net Flow',
          type: 'line',
          data: monthlyData.map(d => d.net_flow),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: COLORS.utdOrange, width: 3 },
          itemStyle: { color: COLORS.utdOrange }
        }
      ]
    };
  };

  const getRunwayGaugeOption = () => ({
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 24,
      splitNumber: 4,
      axisLine: {
        lineStyle: {
          width: 24,
          color: [
            [0.25, COLORS.danger],
            [0.5, COLORS.warning],
            [1, COLORS.success]
          ]
        }
      },
      pointer: {
        itemStyle: { color: COLORS.textDark },
        width: 5,
        length: '50%'
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        distance: 30,
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: 500
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        fontSize: 36,
        fontWeight: 'bold',
        offsetCenter: [0, '20%'],
        color: COLORS.textDark
      },
      data: [{ value: Math.min(Math.round(runwayMonths), 24) }]
    }]
  });

  return (
    <div className="space-y-8">
      {/* Top KPI Row - 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue, true)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="success"
          size="compact"
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses, true)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="danger"
          size="compact"
        />
        <MetricCard
          title="Net Cash Flow"
          value={formatCurrency(netCashFlow, true)}
          icon={<DollarSign className="h-5 w-5" />}
          color={netCashFlow >= 0 ? 'success' : 'danger'}
          size="compact"
        />
        <MetricCard
          title="Available Cash"
          value={formatCurrency(availableCash, true)}
          icon={<Wallet className="h-5 w-5" />}
          color="info"
          size="compact"
        />
        <MetricCard
          title="Program Ratio"
          value={formatPercent(programRatio)}
          icon={<Target className="h-5 w-5" />}
          color={programRatio >= 70 ? 'success' : 'warning'}
          size="compact"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart - 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.textDark }}>Cash Flow Trend</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.textSoft }}>Monthly inflows and outflows</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center p-3 rounded-lg" style={{ background: COLORS.successLight }}>
                <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Total In</p>
                <p className="font-bold" style={{ color: COLORS.success }}>{formatCurrency(totalInflow, true)}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: COLORS.dangerLight }}>
                <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Total Out</p>
                <p className="font-bold" style={{ color: COLORS.danger }}>{formatCurrency(totalOutflow, true)}</p>
              </div>
            </div>
          </div>
          <ReactECharts option={getCashFlowChartOption()} style={{ height: '320px' }} />
        </div>

        {/* Runway Gauge - 1 column */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <div className="mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.textDark }}>Financial Runway</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.textSoft }}>Months at current burn rate</p>
          </div>
          <ReactECharts option={getRunwayGaugeOption()} style={{ height: '220px' }} />
          <div className="text-center mt-3">
            <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>months</p>
            <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-xs font-bold ${
              runwayMonths >= 12 ? 'bg-green-100 text-green-700' :
              runwayMonths >= 6 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {runwayMonths >= 12 ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {runwayMonths >= 12 ? 'Healthy' : runwayMonths >= 6 ? 'Moderate' : 'Critical'}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold" style={{ color: COLORS.textDark }}>Burn Rate</h4>
            <div className="p-2 rounded-lg" style={{ background: COLORS.warningLight }}>
              <Zap className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>{formatCurrency(avgBurnRate, true)}</p>
          <p className="text-xs mt-2 font-medium" style={{ color: COLORS.textSoft }}>Average monthly burn</p>
        </div>
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold" style={{ color: COLORS.textDark }}>Cash Reserve</h4>
            <div className="p-2 rounded-lg" style={{ background: COLORS.infoLight }}>
              <Shield className="w-4 h-4" style={{ color: COLORS.info }} />
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: COLORS.textDark }}>{formatCurrency(availableCash, true)}</p>
          <p className="text-xs mt-2 font-medium" style={{ color: COLORS.textSoft }}>Available liquid assets</p>
        </div>
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold" style={{ color: COLORS.textDark }}>Net Position</h4>
            <div className="p-2 rounded-lg" style={{ background: netCashFlow >= 0 ? COLORS.successLight : COLORS.dangerLight }}>
              {netCashFlow >= 0 ?
                <ArrowUp className="w-4 h-4" style={{ color: COLORS.success }} /> :
                <ArrowDown className="w-4 h-4" style={{ color: COLORS.danger }} />
              }
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: netCashFlow >= 0 ? COLORS.success : COLORS.danger }}>{formatCurrency(netCashFlow, true)}</p>
          <p className="text-xs mt-2 font-medium" style={{ color: COLORS.textSoft }}>Current period balance</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 2: REVENUE & EXPENSES
// ============================================
const RevenueExpensesSection = ({ data, period }) => {
  const { revenueStreams, expenseBreakdown, budgetVariance } = data;

  const getRevenueChart = () => {
    if (!revenueStreams?.streams) return {};
    const streams = revenueStreams.streams.slice(0, 8);
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: COLORS.textMuted, fontSize: 13 },
        formatter: (params) => `<div style="font-weight:700;font-size:14px;color:${COLORS.textDark}">${params.name}</div>
          <div style="margin-top:8px;font-size:13px"><span style="font-weight:700">${formatCurrency(params.value)}</span> <span style="color:${COLORS.textSoft}">(${params.percent}%)</span></div>`
      },
      legend: {
        orient: 'vertical',
        right: '3%',
        top: 'center',
        textStyle: { color: COLORS.textMuted, fontSize: 12, fontWeight: 500 },
        itemGap: 12
      },
      series: [{
        type: 'pie',
        radius: ['48%', '78%'],
        center: ['35%', '50%'],
        data: streams.map(s => ({ name: s.name, value: s.amount })),
        color: CHART_COLORS.mixed,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.25)' }
        }
      }]
    };
  };

  const getExpenseChart = () => {
    if (!expenseBreakdown?.categories) return {};
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: COLORS.textMuted, fontSize: 13 }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: expenseBreakdown.categories.map(c => c.category.replace(/_/g, ' ').substring(0, 12)),
        axisLabel: { rotate: 30, color: COLORS.textMuted, fontSize: 11, fontWeight: 500 },
        axisLine: { lineStyle: { color: COLORS.borderMid, width: 2 } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (val) => formatCurrency(val, true), color: COLORS.textMuted, fontSize: 11, fontWeight: 500 },
        splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
        axisLine: { show: false }
      },
      series: [{
        type: 'bar',
        data: expenseBreakdown.categories.map(c => c.amount),
        itemStyle: { color: COLORS.utdGreen, borderRadius: [6, 6, 0, 0] },
        barMaxWidth: 50
      }]
    };
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(revenueStreams?.total_revenue || 0, true)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="success"
          size="compact"
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(expenseBreakdown?.total_expenses || 0, true)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="danger"
          size="compact"
        />
        <MetricCard
          title="Revenue Streams"
          value={revenueStreams?.streams?.length || 0}
          icon={<Activity className="h-5 w-5" />}
          color="info"
          size="compact"
        />
        <MetricCard
          title="Budget Variance"
          value={formatPercent(budgetVariance?.total_variance_pct || 0)}
          icon={<Calculator className="h-5 w-5" />}
          color={(budgetVariance?.total_variance_pct || 0) >= 0 ? 'success' : 'warning'}
          size="compact"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.textDark }}>Revenue Streams</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.textSoft }}>Income distribution by source</p>
            </div>
          </div>
          {revenueStreams?.streams?.length > 0 ? (
            <ReactECharts option={getRevenueChart()} style={{ height: '380px' }} />
          ) : (
            <div className="h-96 flex items-center justify-center rounded-xl" style={{ background: COLORS.bgLight }}>
              <p className="font-medium" style={{ color: COLORS.textSoft }}>No revenue data available</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.textDark }}>Expense Breakdown</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.textSoft }}>Spending by category</p>
            </div>
          </div>
          {expenseBreakdown?.categories?.length > 0 ? (
            <ReactECharts option={getExpenseChart()} style={{ height: '380px' }} />
          ) : (
            <div className="h-96 flex items-center justify-center rounded-xl" style={{ background: COLORS.bgLight }}>
              <p className="font-medium" style={{ color: COLORS.textSoft }}>No expense data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Variance Table */}
      {budgetVariance?.line_items?.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: COLORS.textDark }}>Budget vs Actual</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `3px solid ${COLORS.borderLight}` }}>
                  <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textSoft }}>Category</th>
                  <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textSoft }}>Budget</th>
                  <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textSoft }}>Actual</th>
                  <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textSoft }}>Variance</th>
                </tr>
              </thead>
              <tbody>
                {budgetVariance.line_items.slice(0, 8).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200" style={{ borderBottom: `1px solid ${COLORS.bgLight}` }}>
                    <td className="py-5 px-4 font-semibold text-sm" style={{ color: COLORS.textDark }}>{item.category}</td>
                    <td className="py-5 px-4 text-right font-medium text-sm" style={{ color: COLORS.textMuted }}>{formatCurrency(item.budget)}</td>
                    <td className="py-5 px-4 text-right font-medium text-sm" style={{ color: COLORS.textMuted }}>{formatCurrency(item.actual)}</td>
                    <td className="py-5 px-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${
                        item.variance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.variance >= 0 ? '+' : ''}{formatPercent(item.variance_pct)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SECTION 3: RATIOS & FORECAST
// ============================================
const RatiosForecastSection = ({ data, period }) => {
  const { financialRatios, forecast } = data;

  const ratios = financialRatios?.ratios || {};
  const benchmarks = financialRatios?.benchmarks || {};

  const getForecastChartOption = () => {
    const forecastData = forecast?.forecast || [];
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: COLORS.textMuted, fontSize: 13 }
      },
      legend: {
        data: ['Revenue', 'Expenses', 'Cumulative'],
        bottom: 0,
        textStyle: { color: COLORS.textMuted, fontSize: 12, fontWeight: 500 },
        itemGap: 24
      },
      grid: { top: 15, left: 55, right: 55, bottom: 50 },
      xAxis: {
        type: 'category',
        data: forecastData.map(d => {
          const date = new Date(d.month_name + '-01');
          return date.toLocaleDateString('en-US', { month: 'short' });
        }),
        axisLine: { lineStyle: { color: COLORS.borderMid, width: 2 } },
        axisLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: 500 },
        axisTick: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          position: 'left',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: COLORS.borderLight, type: 'dashed' } },
          axisLabel: {
            color: COLORS.textMuted,
            fontSize: 11,
            fontWeight: 500,
            formatter: (value) => formatCurrency(value, true)
          }
        },
        {
          type: 'value',
          position: 'right',
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: COLORS.textMuted,
            fontSize: 11,
            fontWeight: 500,
            formatter: (value) => formatCurrency(value, true)
          }
        }
      ],
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          data: forecastData.map(d => d.projected_revenue),
          itemStyle: { color: COLORS.success, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 28
        },
        {
          name: 'Expenses',
          type: 'bar',
          data: forecastData.map(d => d.projected_expenses),
          itemStyle: { color: COLORS.danger, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 28
        },
        {
          name: 'Cumulative',
          type: 'line',
          yAxisIndex: 1,
          data: forecastData.map(d => d.cumulative_balance),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: COLORS.utdOrange, width: 3 },
          itemStyle: { color: COLORS.utdOrange }
        }
      ]
    };
  };

  const RatioCard = ({ name, value, target, industryAvg, format = 'percent' }) => {
    const formattedValue = format === 'percent' ? formatPercent(value) :
                          format === 'ratio' ? `${Number(value || 0).toFixed(1)}x` :
                          `${Number(value || 0).toFixed(1)}`;
    const isGood = value >= target;

    return (
      <div className="bg-white p-5 rounded-xl border-2 hover:shadow-md transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold" style={{ color: COLORS.textMuted }}>{name}</span>
          <div className={`w-3 h-3 rounded-full ${isGood ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        </div>
        <p className="text-2xl font-bold mb-4" style={{ color: COLORS.textDark }}>{formattedValue}</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="font-medium" style={{ color: COLORS.textSoft }}>Target</span>
            <span className="font-bold" style={{ color: COLORS.success }}>
              {format === 'percent' ? formatPercent(target) : format === 'ratio' ? `${target}x` : target}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium" style={{ color: COLORS.textSoft }}>Industry</span>
            <span className="font-semibold" style={{ color: COLORS.textMuted }}>
              {format === 'percent' ? formatPercent(industryAvg) : format === 'ratio' ? `${industryAvg}x` : industryAvg}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Financial Ratios */}
      <div>
        <h3 className="text-lg font-bold mb-5" style={{ color: COLORS.textDark }}>Key Financial Ratios</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <RatioCard
            name="Program Expense"
            value={ratios.program_expense_ratio}
            target={benchmarks.program_expense_ratio?.target || 75}
            industryAvg={benchmarks.program_expense_ratio?.industry_avg || 70}
            format="percent"
          />
          <RatioCard
            name="Fundraising Efficiency"
            value={ratios.fundraising_efficiency}
            target={benchmarks.fundraising_efficiency?.target || 4.0}
            industryAvg={benchmarks.fundraising_efficiency?.industry_avg || 3.0}
            format="ratio"
          />
          <RatioCard
            name="Operating Reserve"
            value={ratios.operating_reserve_ratio}
            target={benchmarks.operating_reserve_ratio?.target || 6}
            industryAvg={benchmarks.operating_reserve_ratio?.industry_avg || 3}
            format="number"
          />
          <RatioCard
            name="Expense Coverage"
            value={ratios.expense_coverage}
            target={benchmarks.expense_coverage?.target || 1.2}
            industryAvg={benchmarks.expense_coverage?.industry_avg || 1.0}
            format="ratio"
          />
        </div>
      </div>

      {/* Forecast */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.textDark }}>Financial Forecast</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.textSoft }}>
              {forecast?.forecast_months || 6}-month projection based on historical trends
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: COLORS.infoLight, color: COLORS.info }}>
            Projected
          </div>
        </div>
        <ReactECharts option={getForecastChartOption()} style={{ height: '340px' }} />
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-5" style={{ borderColor: COLORS.borderLight }}>
          <div className="text-center p-4 rounded-xl" style={{ background: COLORS.successLight }}>
            <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Projected Revenue</p>
            <p className="text-xl font-bold mt-1" style={{ color: COLORS.success }}>
              {formatCurrency(forecast?.projected_year_end?.total_revenue, true)}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: COLORS.dangerLight }}>
            <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Projected Expenses</p>
            <p className="text-xl font-bold mt-1" style={{ color: COLORS.danger }}>
              {formatCurrency(forecast?.projected_year_end?.total_expenses, true)}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(232, 117, 0, 0.15)' }}>
            <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Net Position</p>
            <p className="text-xl font-bold mt-1" style={{ color: COLORS.utdOrange }}>
              {formatCurrency(forecast?.projected_year_end?.net_position, true)}
            </p>
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200" style={{ borderColor: COLORS.borderLight }}>
        <h3 className="text-base font-bold mb-4" style={{ color: COLORS.textDark }}>Forecast Assumptions</h3>
        <div className="grid grid-cols-3 gap-5">
          <div className="p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${COLORS.bgLight} 0%, white 100%)` }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSoft }}>Base Monthly Revenue</p>
            <p className="text-lg font-bold mt-2" style={{ color: COLORS.textDark }}>
              {formatCurrency(forecast?.assumptions?.base_monthly_revenue, true)}
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${COLORS.bgLight} 0%, white 100%)` }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSoft }}>Recurring Monthly</p>
            <p className="text-lg font-bold mt-2" style={{ color: COLORS.textDark }}>
              {formatCurrency(forecast?.assumptions?.recurring_monthly, true)}
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${COLORS.bgLight} 0%, white 100%)` }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSoft }}>Base Monthly Expenses</p>
            <p className="text-lg font-bold mt-2" style={{ color: COLORS.textDark }}>
              {formatCurrency(forecast?.assumptions?.base_monthly_expenses, true)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 4: WHAT-IF ANALYSIS
// ============================================
const WhatIfAnalysisSection = ({
  data,
  scenario,
  setScenario,
  results,
  savedScenarios,
  onReset,
  onSave,
  onLoadScenario
}) => {

  // Slider Component
  const ScenarioSlider = ({ label, value, onChange, min = -50, max = 50, unit = '%', description }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="font-semibold text-sm" style={{ color: COLORS.textDark }}>{label}</span>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: COLORS.textSoft }}>{description}</p>
          )}
        </div>
        <span className={`font-bold text-sm ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value >= 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${COLORS.danger} 0%, ${COLORS.borderMid} 50%, ${COLORS.success} 100%)`
        }}
      />
      <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.textSoft }}>
        <span>{min}{unit}</span>
        <span>0{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );

  // Scenario Comparison Chart
  const getScenarioComparisonChart = () => {
    if (!results) return {};

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          return params.map(p => `${p.seriesName}: ${formatCurrency(p.value, true)}`).join('<br/>');
        }
      },
      legend: {
        data: ['Current', 'Projected'],
        bottom: 0,
        textStyle: { color: COLORS.textMuted }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['Revenue', 'Expenses', 'Net Income'],
        axisLabel: { color: COLORS.textMuted }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (val) => formatCurrency(val, true),
          color: COLORS.textMuted
        }
      },
      series: [
        {
          name: 'Current',
          type: 'bar',
          data: [
            results.baseRevenue,
            results.baseExpenses,
            results.baseNetIncome
          ],
          itemStyle: { color: COLORS.borderMid, borderRadius: [4, 4, 0, 0] }
        },
        {
          name: 'Projected',
          type: 'bar',
          data: [
            results.projectedRevenue,
            results.projectedExpenses,
            results.projectedNetIncome
          ],
          itemStyle: {
            color: (params) => {
              if (params.dataIndex === 2) {
                return results.projectedNetIncome > results.baseNetIncome
                  ? COLORS.success
                  : COLORS.danger;
              }
              return COLORS.utdOrange;
            },
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  };

  // Impact Breakdown Chart
  const getImpactBreakdownChart = () => {
    if (!results) return {};

    const impacts = [
      { name: 'Revenue Change', value: results.impact.revenue },
      { name: 'Major Gifts', value: results.impact.majorGifts },
      { name: 'Retention', value: results.impact.retention },
      { name: 'New Donors', value: results.impact.newDonors },
      { name: 'Expense Change', value: -results.impact.expenses },
      { name: 'Program Expansion', value: -results.impact.programs }
    ].filter(item => item.value !== 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const data = params[0];
          return `${data.name}: ${data.value >= 0 ? '+' : ''}${formatCurrency(Math.abs(data.value), true)}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (val) => formatCurrency(val, true),
          color: COLORS.textMuted
        }
      },
      yAxis: {
        type: 'category',
        data: impacts.map(i => i.name),
        axisLabel: { color: COLORS.textMuted }
      },
      series: [{
        type: 'bar',
        data: impacts.map(i => ({
          value: i.value,
          itemStyle: {
            color: i.value >= 0 ? COLORS.success : COLORS.danger,
            borderRadius: i.value >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4]
          }
        }))
      }]
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm" style={{ borderColor: COLORS.borderLight }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, rgba(232, 117, 0, 0.15) 0%, rgba(232, 117, 0, 0.05) 100%)' }}>
              <Calculator className="h-5 w-5" style={{ color: COLORS.utdOrange }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: COLORS.textDark }}>What-If Analysis Engine</h2>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>Model different scenarios and see projected impact</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Scenario Inputs */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
             style={{ borderColor: COLORS.borderLight }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: COLORS.textDark }}>
              <Sliders className="h-4 w-4" style={{ color: COLORS.utdOrange }} />
              Scenario Inputs
            </h3>
            <button
              onClick={onReset}
              className="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: COLORS.textMuted }}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          <ScenarioSlider
            label="Overall Revenue Change"
            value={scenario.revenueChange}
            onChange={(val) => setScenario({ ...scenario, revenueChange: val })}
            description="Across all sources"
          />

          <ScenarioSlider
            label="Major Gift Increase"
            value={scenario.majorGiftIncrease}
            onChange={(val) => setScenario({ ...scenario, majorGiftIncrease: val })}
            min={0}
            max={100}
            description="Impact on top donor giving"
          />

          <ScenarioSlider
            label="Retention Improvement"
            value={scenario.retentionImprovement}
            onChange={(val) => setScenario({ ...scenario, retentionImprovement: val })}
            min={0}
            max={25}
            description="Donor retention rate increase"
          />

          <ScenarioSlider
            label="New Donor Growth"
            value={scenario.newDonorGrowth}
            onChange={(val) => setScenario({ ...scenario, newDonorGrowth: val })}
            min={0}
            max={50}
            description="New donor acquisition increase"
          />

          <ScenarioSlider
            label="Operating Expense Change"
            value={scenario.expenseChange}
            onChange={(val) => setScenario({ ...scenario, expenseChange: val })}
            description="Non-program expenses"
          />

          <ScenarioSlider
            label="Program Expansion"
            value={scenario.programExpansion}
            onChange={(val) => setScenario({ ...scenario, programExpansion: val })}
            min={0}
            max={50}
            description="Program service growth"
          />

          <button
            onClick={onSave}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            style={{ background: `linear-gradient(135deg, ${COLORS.utdGreen} 0%, ${COLORS.utdGreenLight} 100%)` }}
          >
            <Save className="h-4 w-4" />
            Save Scenario
          </button>
        </div>

        {/* Scenario Results */}
        <div className="col-span-2 space-y-6">
          {/* Key Projections */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: COLORS.borderLight }}>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSoft }}>
                Projected Revenue
              </div>
              <div className="text-xl font-bold mt-2" style={{ color: COLORS.textDark }}>
                {formatCurrency(results?.projectedRevenue || 0, true)}
              </div>
              <div className={`text-xs font-semibold mt-1 ${(results?.revenueChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(results?.revenueChange || 0) >= 0 ? '+' : ''}
                {formatCurrency(results?.revenueChange || 0, true)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: COLORS.borderLight }}>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSoft }}>
                Projected Expenses
              </div>
              <div className="text-xl font-bold mt-2" style={{ color: COLORS.textDark }}>
                {formatCurrency(results?.projectedExpenses || 0, true)}
              </div>
              <div className={`text-xs font-semibold mt-1 ${(results?.expenseChange || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(results?.expenseChange || 0) >= 0 ? '+' : ''}
                {formatCurrency(results?.expenseChange || 0, true)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: COLORS.borderLight }}>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSoft }}>
                Net Income
              </div>
              <div className="text-xl font-bold mt-2" style={{ color: COLORS.textDark }}>
                {formatCurrency(results?.projectedNetIncome || 0, true)}
              </div>
              <div className={`text-xs font-semibold mt-1 ${(results?.netIncomeChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(results?.netIncomeChange || 0) >= 0 ? '+' : ''}
                {formatCurrency(results?.netIncomeChange || 0, true)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: COLORS.borderLight }}>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSoft }}>
                Runway
              </div>
              <div className="text-xl font-bold mt-2" style={{ color: COLORS.textDark }}>
                {(results?.newRunway || 0).toFixed(1)} mo
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: COLORS.textSoft }}>
                Program: {((results?.newProgramRatio || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
               style={{ borderColor: COLORS.borderLight }}>
            <h3 className="text-base font-bold mb-4" style={{ color: COLORS.textDark }}>Current vs Projected</h3>
            <ReactECharts option={getScenarioComparisonChart()} style={{ height: '280px' }} />
          </div>

          {/* Impact Breakdown */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
               style={{ borderColor: COLORS.borderLight }}>
            <h3 className="text-base font-bold mb-4" style={{ color: COLORS.textDark }}>Impact Breakdown</h3>
            <ReactECharts option={getImpactBreakdownChart()} style={{ height: '220px' }} />
          </div>
        </div>
      </div>

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border shadow-sm hover:shadow-lg transition-all duration-200"
             style={{ borderColor: COLORS.borderLight }}>
          <h3 className="text-base font-bold mb-4" style={{ color: COLORS.textDark }}>Saved Scenarios</h3>
          <div className="grid grid-cols-3 gap-4">
            {savedScenarios.map((s) => (
              <div key={s.id} className="p-4 rounded-xl" style={{ background: COLORS.bgLight }}>
                <div className="font-semibold text-sm" style={{ color: COLORS.textDark }}>{s.name}</div>
                <div className="text-xs mt-1" style={{ color: COLORS.textSoft }}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm mt-2">
                  <span className="font-medium" style={{ color: COLORS.textMuted }}>Net Income: </span>
                  <span className={s.results.projectedNetIncome > s.results.baseNetIncome ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(s.results.projectedNetIncome, true)}
                  </span>
                </div>
                <button
                  onClick={() => onLoadScenario(s.inputs)}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: COLORS.utdOrangeSoft,
                    color: COLORS.utdOrange
                  }}
                >
                  Load Scenario
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialHealthDashboard;
