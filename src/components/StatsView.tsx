/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  PieChart,
  FileSpreadsheet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Play,
  X,
  CreditCard
} from 'lucide-react';
import { Expense, CurrencyInfo, CATEGORIES } from '../types';
import { MockAdOverlay } from './MockAdOverlay';
import { CategoryIcon } from './CategoryIcon';
import { admobService } from '../utils/admobService';

interface StatsViewProps {
  expenses: Expense[];
  currentCurrency: CurrencyInfo;
  monthlyIncome?: number;
  initialActiveTab?: 'categories' | 'weekly' | 'monthly' | null;
  onClearActiveTab?: () => void;
  onNavigateToSettingsBudget?: () => void;
  highlightConfig?: {
    targetId: string | null;
    color: string;
    statsTab?: 'donut' | 'line' | 'bar' | 'area' | 'compare';
    highlightCategory?: string;
  };
}

// Relative conversion factors where base is INR (Indian Rupee)
const INR_EXCHANGE_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  CAD: 0.016,
  AUD: 0.018,
  JPY: 1.88,
  SGD: 0.016,
  CNY: 0.087,
  CHF: 0.011,
  NZD: 0.020,
};

const TARGET_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
];

export const StatsView: React.FC<StatsViewProps> = ({
  expenses,
  currentCurrency,
  monthlyIncome,
  initialActiveTab,
  onClearActiveTab,
  onNavigateToSettingsBudget,
  highlightConfig,
}) => {
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'categories' | 'weekly' | 'monthly'>('categories');
  const [visualizationTab, setVisualizationTab] = useState<'donut' | 'line' | 'bar' | 'area' | 'compare'>('donut');
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  // Prefilled income or default
  const defaultIncome = monthlyIncome || parseFloat(localStorage.getItem('spend_smart_income') || '5000');

  // Currency converter internal states
  const [converterAmount, setConverterAmount] = useState<string>(String(defaultIncome));
  const [converterTargetCode, setConverterTargetCode] = useState<string>('USD');

  // Highlight scroll and tab router
  React.useEffect(() => {
    if (highlightConfig?.statsTab) {
      setVisualizationTab(highlightConfig.statsTab);
    }
    if (highlightConfig?.targetId) {
      setTimeout(() => {
        const element = document.getElementById(highlightConfig.targetId!);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
    }
  }, [highlightConfig]);

  // Auto sync from prop trigger
  React.useEffect(() => {
    if (initialActiveTab) {
      setActiveChartTab(initialActiveTab);
      if (initialActiveTab === 'categories') {
        setVisualizationTab('donut');
      } else if (initialActiveTab === 'weekly') {
        setVisualizationTab('bar');
      } else if (initialActiveTab === 'monthly') {
        setVisualizationTab('compare');
      }
      if (onClearActiveTab) {
        onClearActiveTab();
      }
    }
  }, [initialActiveTab]);

  // Selected weekly bar index for detail exploration
  const [selectedWeekDayIndex, setSelectedWeekDayIndex] = useState<number | null>(null);

  // Retrieve user defined budgets dynamically from localStorage (linked block)
  const savedBudgetRaw = localStorage.getItem('spend_smart_budget');
  const budget = savedBudgetRaw ? JSON.parse(savedBudgetRaw) : { total: 0, categories: {} };

  // Date controls
  const now = new Date();
  
  // Format Month Year
  const getDisplayMonthYear = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  };

  const displayDate = getDisplayMonthYear();
  const displayYear = displayDate.getFullYear();
  const displayMonthValue = displayDate.getMonth();
  const daysInMonth = new Date(displayYear, displayMonthValue + 1, 0).getDate();

  // Convert month representation e.g. "May 2026"
  const formattedMonthLabel = displayDate.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });

  // Filters for display offset month
  const displayExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date + 'T00:00:00');
    return (
      expDate.getFullYear() === displayYear &&
      expDate.getMonth() === displayMonthValue
    );
  });

  // Filters for previous offset month to do delta analysis
  const prevMonthDate = new Date(displayYear, displayMonthValue - 1, 1);
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthValue = prevMonthDate.getMonth();

  const prevMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date + 'T00:00:00');
    return (
      expDate.getFullYear() === prevMonthYear &&
      expDate.getMonth() === prevMonthValue
    );
  });

  const totalSpentThisMonth = displayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalSpentPrevMonth = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Growth / shrinkage rate versus last month
  const getOverviewComparisonMetric = () => {
    if (totalSpentPrevMonth === 0) {
      return { text: 'First tracking month', isFirstMonth: true, isDown: true, colored: 'text-slate-400' };
    }

    const diffPct = ((totalSpentThisMonth - totalSpentPrevMonth) / totalSpentPrevMonth) * 100;
    const rounded = Math.abs(Math.round(diffPct));

    if (diffPct < 0) {
      return {
        text: `↓ ${rounded}% less than last month`,
        isDown: true,
        colored: 'text-[#22C55E]'
      };
    } else if (diffPct > 0) {
      return {
        text: `↑ ${rounded}% more than last month`,
        isDown: false,
        colored: 'text-[#EF4444]'
      };
    } else {
      return {
        text: 'Equal spending vs last month',
        isDown: true,
        colored: 'text-slate-400'
      };
    }
  };

  const overviewMetric = getOverviewComparisonMetric();

  // Combine standard and custom categories for breakdown metrics
  const displayCategoryBreakdown = CATEGORIES.map((cat) => {
    const total = displayExpenses
      .filter(exp => exp.id && exp.category === cat.name)
      .reduce((sum, exp) => sum + exp.amount, 0);

    const prevTotal = prevMonthExpenses
      .filter(exp => exp.id && exp.category === cat.name)
      .reduce((sum, exp) => sum + exp.amount, 0);

    const percent = totalSpentThisMonth > 0 ? (total / totalSpentThisMonth) * 100 : 0;

    // Delta calculations
    let changePct = 0;
    let changeDirection: 'up' | 'down' | 'none' = 'none';

    if (prevTotal > 0) {
      const diff = ((total - prevTotal) / prevTotal) * 100;
      changePct = Math.abs(Math.round(diff));
      if (diff > 0) changeDirection = 'up';
      else if (diff < 0) changeDirection = 'down';
    } else if (total > 0) {
      changePct = 100;
      changeDirection = 'up';
    }

    return {
      name: cat.name,
      color: cat.color,
      total,
      percent,
      changePct,
      changeDirection,
    };
  }).filter(c => c.total > 0 || prevMonthExpenses.some(pe => pe.category === c.name))
    .sort((a, b) => b.total - a.total);

  // WEEKLY TAB AGGREGATIONS (Past 7 Days Profile)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailySpending = Array.from({ length: 7 })
    .map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - i);
      return d;
    })
    .reverse()
    .map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = weekdays[date.getDay()];
      
      const dayExpenses = expenses.filter(exp => exp.date === dateStr);
      const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      return {
        dateStr,
        label: dayLabel,
        dayNum: date.getDate(),
        total,
        entries: dayExpenses,
      };
    });

  const maxDailySpend = Math.max(...dailySpending.map(d => d.total), 1);
  const weeklyTotalSum = dailySpending.reduce((sum, d) => sum + d.total, 0);

  // Weekly Category Split Pie chart
  const getWeeklyCategoryTotals = () => {
    const weeklyExps = dailySpending.reduce((all, d) => [...all, ...d.entries], [] as Expense[]);
    const totals: Record<string, { total: number; color: string }> = {};
    weeklyExps.forEach((exp) => {
      const col = CATEGORIES.find(c => c.name === exp.category)?.color || '#94A3B8';
      if (!totals[exp.category]) {
        totals[exp.category] = { total: 0, color: col };
      }
      totals[exp.category].total += exp.amount;
    });

    const sum = Object.values(totals).reduce((s, item) => s + item.total, 0);
    return Object.entries(totals).map(([name, val]) => ({
      name,
      color: val.color,
      total: val.total,
      percent: sum > 0 ? (val.total / sum) * 100 : 0
    }));
  };

  const weeklyCategoryTotals = getWeeklyCategoryTotals();

  // MONTHLY TAB AGGREGATIONS (Jan-Dec for display year)
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySpendingOfYear = monthsShort.map((monthLabel, monthIdx) => {
    const monthlyExps = expenses.filter(exp => {
      const expDate = new Date(exp.date + 'T00:00:00');
      return expDate.getFullYear() === displayYear && expDate.getMonth() === monthIdx;
    });
    const total = monthlyExps.reduce((sum, e) => sum + e.amount, 0);
    return {
      label: monthLabel,
      total,
    };
  });

  const maxMonthlySpendAmt = Math.max(...monthlySpendingOfYear.map(m => m.total), 1);

  // New Trend metadata calculations
  const dailyTrendData = Array.from({ length: daysInMonth }).map((_, idx) => {
    const dayStr = `${displayYear}-${String(displayMonthValue + 1).padStart(2, '0')}-${String(idx + 1).padStart(2, '0')}`;
    const total = displayExpenses
      .filter((exp) => exp.date === dayStr)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { dayNum: idx + 1, total };
  });
  const maxTrendSpend = Math.max(...dailyTrendData.map((d) => d.total), 1);

  const maxCategorySpend = Math.max(...displayCategoryBreakdown.map((c) => c.total), 1);

  let cumulativeSpentTemp = 0;
  const monthlyBudgetLimit = budget.total || 1000;
  const corridorData = Array.from({ length: daysInMonth }).map((_, idx) => {
    const dayStr = `${displayYear}-${String(displayMonthValue + 1).padStart(2, '0')}-${String(idx + 1).padStart(2, '0')}`;
    const spentOnDay = displayExpenses
      .filter((exp) => exp.date === dayStr)
      .reduce((sum, exp) => sum + exp.amount, 0);
    cumulativeSpentTemp += spentOnDay;
    const limitOnDay = (monthlyBudgetLimit / daysInMonth) * (idx + 1);
    return {
      dayNum: idx + 1,
      actual: cumulativeSpentTemp,
      limit: limitOnDay
    };
  });
  const maxCorridorVal = Math.max(...corridorData.map((d) => Math.max(d.actual, d.limit)), 1);

  // Dynamic Trend highlights insights cards
  const getTrendInsights = () => {
    const insights: Array<{ text: string; isIncrease: boolean }> = [];
    
    // Compare category spending with previous period
    displayCategoryBreakdown.forEach((cat) => {
      // Show only major changes
      if (cat.changePct >= 10 && cat.total > 0) {
        if (cat.changeDirection === 'up') {
          insights.push({
            text: `${cat.name} spending up ${cat.changePct}% this month`,
            isIncrease: true,
          });
        } else if (cat.changeDirection === 'down') {
          insights.push({
            text: `${cat.name} spending down ${cat.changePct}% this month`,
            isIncrease: false,
          });
        }
      }
    });

    // If no specific category insights found, suggest general saving
    if (insights.length === 0) {
      if (totalSpentThisMonth < totalSpentPrevMonth) {
        insights.push({
          text: `Overall spending successfully decreased by ${overviewMetric.text.match(/\d+/)?.[0] || 'some'}%`,
          isIncrease: false,
        });
      } else if (totalSpentThisMonth > totalSpentPrevMonth) {
        insights.push({
          text: `Overall spending increased by ${overviewMetric.text.match(/\d+/)?.[0] || 'some'}% this period`,
          isIncrease: true,
        });
      } else {
        insights.push({
          text: 'Maintain consistent habit rules to establish savings',
          isIncrease: false,
        });
      }
    }

    return insights;
  };

  const trendInsights = getTrendInsights();

  // Coordinates helper for custom SVG donut chart (Tab 1)
  const getCoordinatesForPercent = (percent: number) => {
    const angle = 2 * Math.PI * percent - Math.PI / 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    return [x, y];
  };

  const drawDonutChartSlices = (data: Array<{ percent: number; color: string }>) => {
    const cx = 100;
    const cy = 100;
    const r = 70;
    let cumulativePercent = 0;

    const activeSlices = data.filter(d => d.percent > 0);
    if (activeSlices.length === 0) {
      return (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E293B" strokeWidth="20" />
      );
    }

    return activeSlices.map((slice, idx) => {
      const fraction = slice.percent / 100;
      const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
      cumulativePercent += fraction;
      const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

      const largeArcFlag = fraction > 0.5 ? 1 : 0;

      if (fraction >= 0.999) {
        return (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={slice.color}
            strokeWidth="20"
          />
        );
      }

      const pathData = [
        `M ${cx + startX * r} ${cy + startY * r}`,
        `A ${r} ${r} 0 ${largeArcFlag} 1 ${cx + endX * r} ${cy + endY * r}`,
      ].join(' ');

      return (
        <path
          key={idx}
          d={pathData}
          fill="none"
          stroke={slice.color}
          strokeWidth="20"
          strokeLinecap="round"
        />
      );
    });
  };

  // Cross-Currency Converter calculation
  const getConvertedOutput = () => {
    const amountVal = parseFloat(converterAmount);
    if (isNaN(amountVal) || amountVal <= 0) return '0.00';

    const sourceRate = INR_EXCHANGE_RATES[currentCurrency.code] || 1;
    const targetRate = INR_EXCHANGE_RATES[converterTargetCode] || 1;

    // Convert amount from currentCurrency to INR base, then to target currency
    const amountInINR = amountVal / sourceRate;
    const result = amountInINR * targetRate;

    const symbol = TARGET_CURRENCIES.find(c => c.code === converterTargetCode)?.symbol || '$';
    return `${symbol} ${result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // CSV Report file creator
  const triggerExportFlow = () => {
    if (admobService.isNativePlatform()) {
      admobService.playRewardedAd(
        () => {
          handleClaimAdRewardAndExport();
        },
        (errorMsg) => {
          alert(errorMsg);
        }
      );
    } else {
      setIsAdOpen(true);
    }
  };

  const handleClaimAdRewardAndExport = () => {
    setIsAdOpen(false);

    // Format expenses to CSV of the current selected month
    const headings = 'ID,Date,Category,Note,Amount\n';
    const rows = displayExpenses.map((e) => {
      const sanitizedNote = (e.note || '').replace(/"/g, '""');
      return `${e.id},"${e.date}","${e.category}","${sanitizedNote}",${e.amount}`;
    }).join('\n');

    const csvContent = headings + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpendSmart_Report_${formattedMonthLabel.replace(' ', '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasAnyExpenses = expenses.length > 0;

  // Track Daily budgets limits diagnostics
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyTrackerCategories = CATEGORIES.map((cat) => {
    const limitRaw = budget.categories?.[cat.name] || 0;
    if (limitRaw <= 0) return null;

    const dailyAllowance = limitRaw / daysInMonth;
    const spentToday = expenses
      .filter((exp) => exp.date === todayStr && exp.category === cat.name)
      .reduce((sum, exp) => sum + exp.amount, 0);

    return {
      name: cat.name,
      color: cat.color,
      dailyAllowance,
      spentToday,
      percent: dailyAllowance > 0 ? (spentToday / dailyAllowance) * 100 : 0
    };
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div id="stats-tab-screen" className="flex flex-col flex-1 px-4 pt-4 pb-24 text-white overflow-y-auto no-scrollbar bg-[#0F172A] text-left select-none relative">
      {/* Ad Mock Screen overlay trigger */}
      <MockAdOverlay
        isOpen={isAdOpen}
        onAdComplete={handleClaimAdRewardAndExport}
        onClose={() => setIsAdOpen(false)}
      />

      <div className="flex items-center justify-between mb-4 mt-1 select-none">
        <h2 className="font-sans text-xl font-black text-white">Stats Overview</h2>
        
        {/* Small icon button for Currency Converter bottom sheet */}
        <button
          onClick={() => setIsConverterOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E293B] hover:bg-slate-800 text-[#22C55E] transition-colors border border-white/5 cursor-pointer bg-transparent"
          title="Currency Converter"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* 1. MONTH NAVIGATION BAR HEADER */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1E293B] border border-white/5 mb-4">
        <button
          id="prev-month-nav-btn"
          onClick={() => setSelectedMonthOffset((prev) => prev - 1)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="font-sans text-sm font-black text-slate-100 uppercase tracking-wider">
          {formattedMonthLabel}
        </span>

        <button
          id="next-month-nav-btn"
          onClick={() => setSelectedMonthOffset((prev) => prev + 1)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 2. SUMMARY TOTAL CARD */}
      <div className="rounded-3xl bg-[#1E293B] p-5 border border-white/5 shadow-xl text-left mb-5 select-text">
        <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest block mb-1">
          Total Spent
        </span>
        <h2 className="font-sans text-3.5xl font-black text-[#F8FAFC] tracking-tight leading-none mb-2">
          {currentCurrency.symbol}
          {totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </h2>

        {/* Delta percent comparison inline layout */}
        {overviewMetric.isFirstMonth ? (
          <p className="font-sans text-xs font-bold text-slate-400">
            First tracking month
          </p>
        ) : (
          <p className={`font-sans text-xs font-black flex items-center gap-1.5 ${overviewMetric.colored}`}>
            {overviewMetric.isDown ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            {overviewMetric.text}
          </p>
        )}
      </div>

      {/* 3. CHART SWITCHING TABS NAVIGATION */}
      <div className="flex border-b border-white/5 mb-5 select-none overflow-x-auto no-scrollbar gap-2 pl-0.5 scroll-smooth">
        {[
          { key: 'donut', label: 'By Category' },
          { key: 'line', label: 'Daily Trend' },
          { key: 'bar', label: 'Split Bar' },
          { key: 'area', label: 'Corridor' },
          { key: 'compare', label: 'Comparison' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setVisualizationTab(tab.key as any)}
            className={`pb-2.5 px-3.5 whitespace-nowrap font-sans text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              visualizationTab === tab.key
                ? 'text-[#3B82F6] border-[#3B82F6]'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. ACTIVE TAB VISUAL CHANNELS */}
      <div className="mb-6">
        {/* DONUT VISUALIZATION */}
        {visualizationTab === 'donut' && (
          <div id="stats-category-tracker" className="flex flex-col items-center justify-center py-4 bg-[#1E293B]/45 border border-white/5 rounded-3xl p-4">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                {drawDonutChartSlices(displayCategoryBreakdown)}
              </svg>
              {/* Center volume overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 select-none pointer-events-none">
                <span className="font-sans text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest leading-none mb-1">
                  Volume
                </span>
                <span className="font-mono text-sm font-black text-[#F8FAFC] truncate max-w-[110px]">
                  {currentCurrency.symbol}
                  {totalSpentThisMonth > 9999 ? Math.round(totalSpentThisMonth / 1000) + 'k' : Math.round(totalSpentThisMonth)}
                </span>
              </div>
            </div>

            {/* Custom donut category layout rows */}
            <div className="w-full mt-6 space-y-3.5 select-text">
              {displayCategoryBreakdown.length === 0 ? (
                <p className="text-center italic text-slate-500 font-sans text-xs py-2">
                  No expense category allocation tracked this month
                </p>
              ) : (
                displayCategoryBreakdown.map((cat) => (
                  <div
                    key={cat.name}
                    className={`flex flex-col gap-1.5 p-2 rounded-xl transition-all ${
                      highlightConfig?.highlightCategory === cat.name
                        ? 'border border-[#22C55E]/30 bg-[#22C55E]/10 ring-4 ring-[#22C55E]/20 animate-pulse'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      {/* Name tag with colored indicator dot */}
                      <span className="font-sans font-bold text-slate-205 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <CategoryIcon categoryName={cat.name} className="h-3.5 w-3.5 inline text-slate-400" />
                        {cat.name}
                      </span>
                      
                      {/* Amount and percentage spent */}
                      <span className="font-mono text-slate-300 font-bold">
                        {currentCurrency.symbol}{cat.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <span className="text-[10px] text-slate-500 font-sans font-bold ml-1.5">
                          {Math.round(cat.percent)}%
                        </span>
                      </span>
                    </div>

                    {/* Category specific comparative indicators */}
                    {cat.changeDirection !== 'none' && (
                      <span className={`font-sans text-[10px] font-bold uppercase tracking-wider pl-4 flex items-center gap-0.5 leading-none ${cat.changeDirection === 'up' ? 'text-red-400' : 'text-[#22C55E]'}`}>
                        {cat.changeDirection === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {cat.changePct}% vs last month
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TREND / LINE CHART VISUALIZATION */}
        {visualizationTab === 'line' && (
          <div id="stats-trend-container" className={`flex flex-col w-full bg-[#1E293B]/45 border ${
            highlightConfig?.targetId === 'stats-trend-container'
              ? 'border-[#22C55E] ring-4 ring-[#22C55E]/20 animate-pulse scale-[1.01]'
              : 'border-white/5'
          } rounded-3xl p-5 select-none transition-all`}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest leading-none">
                Daily Trend Outline
              </span>
              <span className="font-sans text-[10px] font-black text-[#3B82F6] uppercase">
                {formattedMonthLabel}
              </span>
            </div>

            <div className="h-44 w-full relative">
              <svg viewBox="0 0 380 180" className="w-full h-full">
                {/* Horizontal gridlines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                  <line
                    key={idx}
                    x1="25"
                    y1={20 + frac * 130}
                    x2="370"
                    y2={20 + frac * 130}
                    stroke="#1E293B"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Trend line path */}
                {(() => {
                  const data = dailyTrendData;
                  if (data.length <= 1) return null;
                  const points = data.map((d, i) => {
                    const x = 30 + (i / (daysInMonth - 1)) * 330;
                    const y = 150 - (d.total / maxTrendSpend) * 120;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      {/* Gradient fill */}
                      <path
                        d={`M 30 150 ${points} L 360 150 Z`}
                        fill="url(#trend-gradient)"
                        opacity="0.15"
                      />
                      <defs>
                        <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Main Line with custom blue styling */}
                      <polyline
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />

                      {/* Accent highlight peak dot */}
                      {data.map((d, i) => {
                        if (d.total <= 0) return null;
                        const x = 30 + (i / (daysInMonth - 1)) * 330;
                        const y = 150 - (d.total / maxTrendSpend) * 120;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill="#3B82F6"
                            className="hover:r-5 cursor-pointer duration-150 transition-all"
                          />
                        );
                      })}
                    </>
                  );
                })()}

                {/* Base axis */}
                <line x1="25" y1="150" x2="370" y2="150" stroke="#475569" strokeWidth="1" />
              </svg>
            </div>

            <div className="flex justify-between items-center text-[9px] text-[#94A3B8] font-bold font-sans mt-3.5 select-none pt-1">
              <span>Day 1</span>
              <span>Day {Math.round(daysInMonth / 2)}</span>
              <span>Day {daysInMonth}</span>
            </div>
          </div>
        )}

        {/* BAR CHART VISUALIZATION */}
        {visualizationTab === 'bar' && (
          <div id="stats-weekly-report" className={`flex flex-col w-full bg-[#1E293B]/45 border ${
            highlightConfig?.targetId === 'stats-weekly-report'
              ? 'border-[#22C55E] ring-4 ring-[#22C55E]/20 animate-pulse'
              : 'border-white/5'
          } rounded-3xl p-5 select-none transition-all`}>
            <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest block mb-4">
              Category Totals Split
            </span>
            <div className="space-y-4">
              {displayCategoryBreakdown.length === 0 ? (
                <p className="text-center italic text-slate-500 font-sans text-xs py-4">
                  No tracking spend data cataloged
                </p>
              ) : (
                displayCategoryBreakdown.map(cat => {
                  const hPercent = (cat.total / maxCategorySpend) * 100;
                  return (
                    <div key={cat.name} className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-205 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                        <span className="font-mono text-slate-300">
                          {currentCurrency.symbol}{cat.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${hPercent}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* AREA / CORRIDOR CHART VISUALIZATION */}
        {visualizationTab === 'area' && (
          <div className="flex flex-col w-full bg-[#1E293B]/45 border border-white/5 rounded-3xl p-5 select-none">
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest leading-none">
                Safe Cumulative Space Corridor
              </span>
              <span className="font-sans text-[9px] font-black text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/10 px-2 py-0.5 rounded-full uppercase leading-none">
                Danger limit
              </span>
            </div>

            <div className="h-44 w-full relative">
              <svg viewBox="0 0 380 180" className="w-full h-full">
                {/* Horizontal gridlines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                  <line
                    key={idx}
                    x1="25"
                    y1={20 + frac * 130}
                    x2="370"
                    y2={20 + frac * 130}
                    stroke="#1E293B"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {(() => {
                  const limitPoints = corridorData.map((d, i) => {
                    const x = 30 + (i / (daysInMonth - 1)) * 330;
                    const y = 155 - (d.limit / maxCorridorVal) * 115;
                    return `${x},${y}`;
                  }).join(' ');

                  const actualPoints = corridorData.map((d, i) => {
                    const x = 30 + (i / (daysInMonth - 1)) * 330;
                    const y = 155 - (d.actual / maxCorridorVal) * 115;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      {/* Budget Target Corridor (dashed line) */}
                      <polyline
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        points={limitPoints}
                      />

                      {/* Cumulative Spent Filled Area */}
                      <path
                        d={`M 30 155 ${actualPoints} L 360 155 Z`}
                        fill="url(#corridor-gradient)"
                        opacity="0.2"
                      />
                      <defs>
                        <linearGradient id="corridor-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      <polyline
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3.5"
                        points={actualPoints}
                      />
                    </>
                  );
                })()}

                {/* Base axis */}
                <line x1="25" y1="155" x2="370" y2="155" stroke="#475569" strokeWidth="1" />
              </svg>
            </div>

            <div className="flex justify-between items-center text-[9px] font-bold font-sans text-slate-500 mt-2 select-none">
              <span className="text-[#3B82F6]">● Cumulative Spent</span>
              <span className="text-[#EF4444]">--- Day Allowance Boundary</span>
            </div>
          </div>
        )}

        {/* COMPARISON CHART VISUALIZATION */}
        {visualizationTab === 'compare' && (
          <div className="flex flex-col w-full bg-[#1E293B]/45 border border-white/5 rounded-3xl p-5 select-none">
            <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest block mb-4">
              Previous Month Comparative Split
            </span>

            <div className="grid grid-cols-2 gap-4 h-40 items-end px-4 border-b border-slate-800 pb-2 relative">
              {/* Previous Month column block */}
              <div className="flex flex-col items-center h-full justify-end">
                <span className="font-mono text-[10.5px] font-semibold text-slate-400 mb-2 truncate max-w-full">
                  {currentCurrency.symbol}{Math.round(totalSpentPrevMonth).toLocaleString()}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${totalSpentPrevMonth > 0 ? Math.max(8, (totalSpentPrevMonth / Math.max(totalSpentThisMonth, totalSpentPrevMonth)) * 100) : 4}%` }}
                  className="w-14 rounded-t-xl bg-[#475569]/35 hover:bg-slate-700 border border-white/5 transition-all"
                />
                <span className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-2 block select-none">
                  Prev Month
                </span>
              </div>

              {/* Current Month column block */}
              <div className="flex flex-col items-center h-full justify-end">
                <span className={`font-mono text-[10.5px] font-black mb-2 truncate max-w-full ${totalSpentThisMonth > totalSpentPrevMonth ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                  {currentCurrency.symbol}{Math.round(totalSpentThisMonth).toLocaleString()}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${totalSpentThisMonth > 0 ? Math.max(8, (totalSpentThisMonth / Math.max(totalSpentThisMonth, totalSpentPrevMonth)) * 100) : 4}%` }}
                  className={`w-14 rounded-t-xl transition-all ${
                    totalSpentThisMonth > totalSpentPrevMonth 
                      ? 'bg-[#EF4444]/80 hover:bg-[#EF4444] border border-[#EF4444]/20' 
                      : 'bg-[#22C55E]/80 hover:bg-[#22C55E] border border-[#22C55E]/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                  }`}
                />
                <span className="font-sans text-[10px] text-slate-200 font-black uppercase tracking-wide mt-2 block select-none">
                  This Month
                </span>
              </div>
            </div>

            <div className="mt-4 pt-1 text-left">
              {totalSpentPrevMonth > 0 ? (
                <p className="font-sans text-xs text-slate-400 leading-relaxed">
                  You spent{' '}
                  <span className={`font-black ${totalSpentThisMonth > totalSpentPrevMonth ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                    {totalSpentThisMonth > totalSpentPrevMonth ? 'more' : 'less'}
                  </span>{' '}
                  than previous period. Keep managing budgets to lower allocations!
                </p>
              ) : (
                <p className="font-sans text-xs text-slate-400 leading-relaxed">
                  Excellent! Start tracking regular recurring transactions to populate a complete history comparatives chart.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. DAILY BUDGET BREAKDOWN MANAGER (Only show if budget IS set) */}
      {budget.total > 0 && dailyTrackerCategories.length > 0 && (
        <div className="mb-6 select-text text-left">
          <h3 className="font-sans text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest pl-1 mb-3">
            Daily Budget Tracker
          </h3>

          <div className="space-y-3">
            {dailyTrackerCategories.map((c) => {
              const remainsVal = c.dailyAllowance - c.spentToday;
              const isOver = c.spentToday > c.dailyAllowance;
              return (
                <div key={c.name} className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-sans font-bold text-slate-205 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <CategoryIcon categoryName={c.name} className="h-3.5 w-3.5 text-slate-450 inline" />
                      {c.name}
                    </span>
                    <span className={`font-mono font-black ${isOver ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                      {currentCurrency.symbol}
                      {remainsVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  {/* Daily Progress visual bar */}
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}
                      style={{ width: `${Math.min(100, c.percent)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold font-sans">
                    <span>Allowance: {currentCurrency.symbol}{Math.round(c.dailyAllowance)}/day</span>
                    <span>Spent today: {currentCurrency.symbol}{Math.round(c.spentToday)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. BUDGET OVERVIEW SECTION */}
      <div id="budget-overview-card" className="rounded-3xl bg-[#1E293B] p-5 border border-white/5 shadow-xl text-left mb-6 select-none">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans text-[10px] text-[#22C55E] font-black uppercase tracking-widest">
            ✦ Category Budgets Overview
          </h3>
        </div>

        {(() => {
          const categoryBudgetsList = Object.entries(budget.categories || {}).map(([catName, limitStr]) => {
            const limit = parseFloat(limitStr as string) || 0;
            const spent = displayExpenses
              .filter(exp => exp.category === catName)
              .reduce((sum, exp) => sum + exp.amount, 0);
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            return { name: catName, limit, spent, percent };
          }).filter(item => item.limit > 0);

          if (categoryBudgetsList.length === 0) {
            return (
              <div className="text-center py-4">
                <p className="font-sans text-xs text-slate-400 mb-4 leading-relaxed">
                  No category limits configured. Set up alerts to avoid overspending on Food, Transport, and more.
                </p>
                <button
                  onClick={onNavigateToSettingsBudget}
                  className="w-full py-3.5 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-slate-950 font-sans text-xs font-black uppercase tracking-wide cursor-pointer text-center border-0"
                >
                  Establish Budget Limits
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {categoryBudgetsList.map((cb) => {
                const isExceeded = cb.percent >= 100;
                const isWarning = cb.percent >= 80 && cb.percent < 100;
                const progressColor = isExceeded ? 'bg-[#EF4444]' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#22C55E]';
                const textColor = isExceeded ? 'text-[#EF4444]' : isWarning ? 'text-[#F59E0B]' : 'text-[#22C55E]';

                return (
                  <div key={cb.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="font-sans text-slate-205 flex items-center gap-2">
                        <CategoryIcon categoryName={cb.name} className="h-4 w-4 text-slate-400" />
                        {cb.name}
                      </span>
                      <span className="font-mono text-slate-300">
                        {currentCurrency.symbol}{Math.round(cb.spent)} of{' '}
                        <span className="text-slate-500 font-black">
                          {currentCurrency.symbol}{Math.round(cb.limit)}
                        </span>
                      </span>
                    </div>

                    {/* Category budget bar visualizer */}
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                        style={{ width: `${Math.min(100, cb.percent)}%` }}
                      />
                    </div>

                    <div className={`text-[10px] font-black font-sans ${textColor} text-right uppercase tracking-wide`}>
                      {isExceeded ? 'limit exceeded' : isWarning ? 'warning (80%+ used)' : `${Math.round(cb.percent)}% used`}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={onNavigateToSettingsBudget}
                className="w-full py-3.5 rounded-xl border border-slate-700 hover:border-[#22C55E]/40 text-slate-205 hover:text-white font-sans text-xs font-bold uppercase tracking-wider text-center cursor-pointer mt-2 bg-transparent"
              >
                Manage Budget Limits
              </button>
            </div>
          );
        })()}
      </div>

      {/* 6.5. PERMANENT CURRENCY CONVERTER SECTION */}
      <div
        id="stats-currency-converter"
        className={`rounded-3xl bg-[#1E293B] p-5 border transition-all duration-300 select-none text-left mb-6 relative overflow-hidden ${
          highlightConfig?.targetId === 'stats-currency-converter'
            ? 'border-[#3B82F6] ring-4 ring-[#3B82F6]/20 animate-pulse scale-[1.01]'
            : 'border-white/5 shadow-xl'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sans text-[10px] text-[#3B82F6] font-black uppercase tracking-widest flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4.5 w-4.5 text-[#3B82F6] stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.57-.57M2.5 22v-6h6M2.66 8.43a10 10 0 0 1 .57 8.38l-.57.57" />
            </svg>
            Currency Converter
          </h3>
          <span className="font-sans text-[8px] font-black text-[#F59E0B] border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Live Approx
          </span>
        </div>

        <div className="space-y-4">
          {/* Sum input */}
          <div>
            <label className="font-sans text-[9px] text-[#94A3B8] font-bold uppercase tracking-wide block mb-1">
              Sum to Convert
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans font-black text-slate-500 text-xs">
                {currentCurrency.symbol}
              </span>
              <input
                id="converter-amount-text"
                type="number"
                value={converterAmount}
                onChange={(e) => setConverterAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 text-xs font-mono rounded-xl border border-white/5 bg-slate-950 text-white focus:outline-none focus:border-[#3B82F6]/40 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs select-none">
            {/* From base label */}
            <div>
              <span className="font-sans text-[9px] text-[#94A3B8] font-bold uppercase block mb-1">
                From Base
              </span>
              <div className="p-3 bg-slate-950 rounded-xl font-sans font-bold border border-white/5 text-slate-400 text-xs">
                {currentCurrency.code} ({currentCurrency.symbol})
              </div>
            </div>

            {/* Target currency dropdown selector */}
            <div>
              <span className="font-sans text-[9px] text-[#94A3B8] font-bold uppercase block mb-1">
                To Target
              </span>
              <select
                id="converter-target-code-select"
                value={converterTargetCode}
                onChange={(e) => setConverterTargetCode(e.target.value)}
                className="w-full p-3 bg-slate-950 rounded-xl font-sans text-xs font-bold border border-white/5 text-slate-200 cursor-pointer focus:outline-none"
              >
                {TARGET_CURRENCIES.map((tc) => (
                  <option key={tc.code} value={tc.code}>
                    {tc.code} ({tc.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Approx readout Output */}
          <div className="border-t border-slate-800 pt-3.5 mt-2 text-left">
            <span className="font-sans text-[9px] text-[#94A3B8] font-bold uppercase leading-none block mb-1">
              Output Approximation
            </span>
            <div id="converter-approximated-box" className="font-sans text-xl font-black text-[#10B981] md:text-2xl">
              ≈ {getConvertedOutput()}
            </div>
            <span className="font-sans text-[9px] text-slate-550 font-semibold leading-relaxed block mt-1.5">
              Note: Exchange rates are approximate and parsed from open financial data indices. Local bank charges may apply.
            </span>
          </div>
        </div>
      </div>

      {/* 7. EXPORT CSV BUTTON */}
      {hasAnyExpenses && (
        <button
          id="export-csv-reports-watch-ad-btn"
          onClick={triggerExportFlow}
          className="w-full py-4 rounded-2xl border border-slate-700 hover:border-[#22C55E]/40 text-slate-205 hover:text-white font-sans text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer mb-8 animate-none"
        >
          <FileSpreadsheet className="h-4.5 w-4.5" />
          Download My Report — Watch Short Ad
        </button>
      )}

      {/* 8. ADVERTISEMENT BLOCK (Strictly bottom of page only) */}
      <div id="bottom-ad-card-banner" className="mt-auto py-3 bg-slate-900 border border-white/5 text-slate-500 text-center font-sans text-[10px] font-bold uppercase tracking-widest rounded-2xl select-none relative mb-4">
        Advertisement
      </div>
    </div>
  );
};
