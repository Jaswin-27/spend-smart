/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  AlertTriangle,
  ArrowRight,
  Wallet,
  X,
  CreditCard,
  TrendingUp,
  Database,
  Lock,
  Tag,
  BarChart3,
  Calendar,
  Check,
  Search,
  Filter,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { Expense, Template, CurrencyInfo, CATEGORIES } from '../types';
import { SwipeableExpenseItem } from './SwipeableExpenseItem';

interface HomeViewProps {
  expenses: Expense[];
  templates: Template[];
  budgetTotal: number;
  currentCurrency: CurrencyInfo;
  userName: string;
  monthlyIncome: number;
  customCategories: Array<{ name: string; color: string; iconName: string }>;
  onNavigateToAddExpense: () => void;
  onQuickAddExpense: (template: Template) => void;
  onDeleteRequest: (expense: Expense) => void;
  onNavigateToTab: (
    tab: 'stats' | 'settings' | 'add_expense', 
    sectionId?: string, 
    extraConfig?: {
      statsTab?: 'donut' | 'line' | 'bar' | 'area' | 'compare';
      expandSection?: string;
      highlightId?: string;
      highlightColor?: string;
      highlightCategory?: string;
    }
  ) => void;
  onOpenCustomCategoryFromHome?: () => void; // Link to open custom category catalog if needed
  showMockBanner?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  expenses,
  templates,
  budgetTotal,
  currentCurrency,
  userName,
  monthlyIncome,
  customCategories,
  onNavigateToAddExpense,
  onQuickAddExpense,
  onDeleteRequest,
  onNavigateToTab,
  showMockBanner = false,
}) => {
  const [isCombinedBannerDismissed, setIsCombinedBannerDismissed] = useState(false);

  // Sub-view step for showing all history
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthValue = now.getMonth();

  // Filter current month expenses
  const monthlyExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date + 'T00:00:00');
    return (
      expDate.getFullYear() === currentYear &&
      expDate.getMonth() === currentMonthValue
    );
  });

  const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Remaining income/salary calculation
  const remainingIncome = Math.max(0, monthlyIncome - totalSpent);
  const incomeSpentPercentage = monthlyIncome > 0 ? Math.round((totalSpent / monthlyIncome) * 100) : 0;

  // Budget calculations
  const remainingBudget = Math.max(0, budgetTotal - totalSpent);
  const budgetProgress = budgetTotal > 0 ? (totalSpent / budgetTotal) * 100 : 0;
  const isOverBudget = totalSpent > budgetTotal;

  // Filter last month expenses for comparison card
  const lastMonthDate = new Date(currentYear, currentMonthValue - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthMonth = lastMonthDate.getMonth();

  const lastMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date + 'T00:00:00');
    return (
      expDate.getFullYear() === lastMonthYear &&
      expDate.getMonth() === lastMonthMonth
    );
  });

  const totalSpentLastMonth = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Recurring bills due today (matches exact day of month)
  const todayDay = now.getDate();
  const activeTemplates = templates.filter(t => Number(t.dayOfMonth) === todayDay);

  // Recent expenses limited strictly to 5 as instructed
  const recentExpenses = [...expenses]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  // Thursday, 28 May 2026 - en-GB to output without intermediate commas
  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const getGreeting = () => {
    if (userName && userName.trim()) {
      return `Hello ${userName.trim()}!`;
    }
    return 'Hello!';
  };

  const formatAmount = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Compare this month vs last month spending down/up progress percentage
  const getComparisonMetric = () => {
    if (totalSpentLastMonth === 0) {
      return { text: 'No prior history to compare', isIncrease: false, pct: 0 };
    }
    const diffPct = ((totalSpent - totalSpentLastMonth) / totalSpentLastMonth) * 100;
    const rounded = Math.abs(Math.round(diffPct));
    if (diffPct < 0) {
      return {
        text: `↓ Spending down ${rounded}% vs last month`,
        isIncrease: false,
        pct: rounded
      };
    } else if (diffPct > 0) {
      return {
        text: `↑ Spending up ${rounded}% vs last month`,
        isIncrease: true,
        pct: rounded
      };
    } else {
      return {
        text: 'Spending fully equal to last month',
        isIncrease: false,
        pct: 0
      };
    }
  };

  const comparisonMetric = getComparisonMetric();

  // Combine categories
  const allCategories = ['All', ...CATEGORIES.map(c => c.name), ...customCategories.map(c => c.name)];

  // Group items by date for history panel
  const groupExpensesByDate = (expList: Expense[]) => {
    const groups: Record<string, Expense[]> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    expList.forEach((exp) => {
      let groupKey = exp.date;
      if (exp.date === todayStr) {
        groupKey = 'Today';
      } else if (exp.date === yesterdayStr) {
        groupKey = 'Yesterday';
      } else {
        // Format nicely e.g. "28 May 2026"
        const d = new Date(exp.date + 'T00:00:00');
        groupKey = d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(exp);
    });

    return groups;
  };

  // Search and filter history expenses
  const filteredHistoryExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.amount.toString().includes(searchQuery);

    const matchesCategory =
      selectedFilterCategory === 'All' || exp.category === selectedFilterCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const groupedHistory = groupExpensesByDate(filteredHistoryExpenses);

  // Check budget overflows (global & categories)
  const getCombinedAlerts = () => {
    const alerts: Array<{ text: string; isExceeded: boolean }> = [];
    
    // 1. Global budget
    if (budgetTotal > 0) {
      if (isOverBudget) {
        alerts.push({ text: "Budget EXCEEDED", isExceeded: true });
      } else if (budgetProgress >= 80) {
        alerts.push({ text: `Budget at ${Math.round(budgetProgress)}%`, isExceeded: false });
      }
    }

    // 2. Categories budget
    const catSpentTotals: Record<string, number> = {};
    monthlyExpenses.forEach((e) => {
      catSpentTotals[e.category] = (catSpentTotals[e.category] || 0) + e.amount;
    });

    const savedBudgetRaw = localStorage.getItem('spend_smart_budget');
    const budgetParsed = savedBudgetRaw ? JSON.parse(savedBudgetRaw) : { total: 0, categories: {} as Record<string, number> };

    if (budgetParsed?.categories) {
      Object.entries(budgetParsed.categories).forEach(([catName, limitVal]) => {
        const limit = typeof limitVal === 'string' ? parseFloat(limitVal) : (limitVal as number);
        if (!limit || limit <= 0) return;
        const spent = catSpentTotals[catName] || 0;
        const pct = (spent / limit) * 100;
        if (pct >= 100) {
          alerts.push({ text: `${catName} EXCEEDED`, isExceeded: true });
        } else if (pct >= 80) {
          alerts.push({ text: `${catName} at ${Math.round(pct)}%`, isExceeded: false });
        }
      });
    }

    return alerts;
  };

  const activeAlerts = getCombinedAlerts();

  if (showAllHistory) {
    return (
      <div className="flex flex-col flex-1 px-4 pt-4 pb-24 text-white overflow-y-auto no-scrollbar bg-[#0F172A] text-left">
        {/* Header toolbar */}
        <div className="flex items-center gap-3.5 mb-5 select-none">
          <button
            onClick={() => setShowAllHistory(false)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-800 border border-white/5 hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5 text-slate-300" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-sans text-lg font-black text-[#F8FAFC]">
              Expense History
            </h1>
            <span className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {expenses.length} total entries
            </span>
          </div>
        </div>

        {/* Search Input and Categories Filters layout row */}
        <div className="space-y-3 mb-5 select-none">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, notes, amount..."
              className="w-full font-sans pl-10 pr-4 py-3 text-xs rounded-2xl bg-[#1E293B] border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#22C55E] shrink-0" />
            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="flex-1 font-sans text-xs bg-[#1E293B] border border-white/5 text-slate-200 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-[#22C55E]"
            >
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List of entries grouped by date */}
        <div className="space-y-6 flex-1">
          {expenses.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/5 bg-[#1E293B]/20 p-6 text-center select-none">
              <Wallet className="h-8 w-8 text-[#22C55E] mb-3" />
              <p className="font-sans text-xs font-bold text-white">No expenses tracked yet</p>
            </div>
          ) : Object.keys(groupedHistory).length === 0 ? (
            <div className="text-center py-10 font-sans text-xs text-slate-400">
              No results found matching filters
            </div>
          ) : (
            Object.entries(groupedHistory).map(([dateLabel, items]) => (
              <div key={dateLabel} className="space-y-2.5">
                <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">
                  {dateLabel}
                </span>
                
                <div className="space-y-2.5">
                  {items.map((exp) => (
                    <SwipeableExpenseItem
                      key={exp.id}
                      expense={exp}
                      currencySymbol={currentCurrency.symbol}
                      onDeleteRequest={onDeleteRequest}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-4 pt-4 pb-24 text-white overflow-y-auto no-scrollbar bg-[#0F172A] text-left select-text relative">
      {/* 1. TOP BAR WALLET */}
      <div id="home-top-bar" className="flex items-center justify-between mb-5 select-none">
        <div className="flex flex-col text-left">
          <h2 className="font-sans text-2xl font-black tracking-tight text-white leading-none mb-1">
            {getGreeting()}
          </h2>
          <span className="font-sans text-[11px] text-[#94A3B8] font-semibold">
            {formattedDate}
          </span>
        </div>

        {/* JRX badge in Green Circle */}
        <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-[#1E293B] border border-white/10 font-sans text-xs font-black text-[#22C55E] select-none shadow-[#22C55E]/10 shadow-md">
          JRX
        </div>
      </div>

      {/* 1.5. DATA PRIVACY SHIELD BADGE */}
      <div id="data-privacy-trust-badge" className="rounded-2xl border border-[#22C55E]/20 bg-[#1E293B]/60 p-4 mb-4 select-none flex items-start gap-3 shadow-[0_4px_12px_rgba(34,197,94,0.06)]">
        <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] shadow-sm shadow-[#22C55E]/5 animate-pulse">
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-sans text-[11px] font-black uppercase tracking-widest text-[#22C55E]">
            100% Secure & On-Device
          </p>
          <p className="font-sans text-[11px] text-[#94A3B8] font-medium leading-relaxed mt-0.5">
            Your financial data is 100% private, secure, and stored exclusively on this device. We never sell, share, or upload your data to any external server.
          </p>
        </div>
      </div>

      {/* 1.6. PERSISTENT CATEGORY BUDGET EXCEEDED ALERTS */}
      {(() => {
        const exceeded: Array<{ name: string; spent: number; limit: number; pct: number }> = [];
        const catSpentTotals: Record<string, number> = {};
        
        // Filter to current month
        const monthlyExps = expenses.filter(e => {
          const d = new Date(e.date + 'T00:00:00');
          return d.getFullYear() === currentYear && d.getMonth() === currentMonthValue;
        });

        monthlyExps.forEach((e) => {
          catSpentTotals[e.category] = (catSpentTotals[e.category] || 0) + e.amount;
        });

        const savedBudgetRaw = localStorage.getItem('spend_smart_budget');
        const budgetParsed = savedBudgetRaw ? JSON.parse(savedBudgetRaw) : { total: 0, categories: {} as Record<string, number> };

        if (budgetParsed?.categories) {
          Object.entries(budgetParsed.categories).forEach(([catName, limitVal]) => {
            const limit = typeof limitVal === 'string' ? parseFloat(limitVal) : (limitVal as number);
            if (!limit || limit <= 0) return;
            const spent = catSpentTotals[catName] || 0;
            if (spent > limit) {
              exceeded.push({
                name: catName,
                spent,
                limit,
                pct: Math.round((spent / limit) * 100)
              });
            }
          });
        }

        if (exceeded.length === 0) return null;

        return (
          <div id="exceeded-categories-banners" className="space-y-3.5 mb-4 select-none">
            {exceeded.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/15 p-4 flex items-start gap-3 shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
              >
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-[#EF4444]/15 border border-[#EF4444]/25 text-[#EF4444]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-sans text-[11px] font-black uppercase tracking-widest text-[#EF4444] leading-none mb-1">
                    {cat.name} Limit Exceeded!
                  </p>
                  <p className="font-sans text-xs font-black text-slate-100 mt-0.5">
                    Limit: {currentCurrency.symbol}{cat.limit.toLocaleString()} &bull; Spent: {currentCurrency.symbol}{cat.spent.toLocaleString()}
                  </p>
                  <p className="font-sans text-[10.5px] font-semibold text-[#94A3B8] leading-tight mt-1">
                    You are over budget on your {cat.name.toLowerCase()} category by {(cat.pct - 100)}% this month.
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        );
      })()}

      {/* 2. MAIN VIEWS IF NO EXPENSES */}
      {expenses.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center py-12">
          {/* Helpful friendly empty state */}
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#22C55E]/20 bg-[#1E293B]/20 p-8 text-center select-none max-w-xs mx-auto">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E] shadow-xl shadow-[#22C55E]/5">
              <Wallet className="h-8 w-8 text-[#22C55E]" />
            </div>
            <h3 className="font-sans text-sm font-black text-[#F8FAFC] leading-normal mb-1">
              No expenses yet
            </h3>
            <p className="font-sans text-xs text-[#94A3B8] max-w-[200px] leading-relaxed">
              Tap the + button to add your first expense
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* INCOME VS SPENDING CARD (Show only if income exists) */}
          {monthlyIncome > 0 && (
            <motion.div
              layoutId="income-saving-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-[#1E293B] p-5 border border-white/5 shadow-xl text-left select-none relative overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => onNavigateToTab('settings', 'section-profile', 'income')}
                  className="text-left cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all active:scale-[0.98]"
                >
                  <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest block mb-1">
                    Monthly Income
                  </span>
                  <div className="font-sans text-xl font-black text-white whitespace-nowrap truncate">
                    {currentCurrency.symbol}
                    {formatAmount(monthlyIncome)}
                  </div>
                </div>

                <div
                  onClick={() => onNavigateToTab('stats')}
                  className="text-left border-l border-white/5 pl-4 cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all active:scale-[0.98]"
                >
                  <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest block mb-1">
                    Total Spent
                  </span>
                  <div className={`font-sans text-xl font-black whitespace-nowrap truncate ${totalSpent > monthlyIncome ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                    {currentCurrency.symbol}
                    {formatAmount(totalSpent)}
                  </div>
                </div>
              </div>

              {/* Progress bar and statistics detail */}
              <div className="mt-4 pt-3.5 border-t border-white/5">
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${totalSpent > monthlyIncome ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}
                    style={{ width: `${Math.min(100, incomeSpentPercentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="font-sans text-slate-400">
                    {incomeSpentPercentage}% of income spent
                  </span>
                  <span className="font-sans text-slate-205">
                    {currentCurrency.symbol}
                    {formatAmount(remainingIncome)} remaining
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* BUDGET MANAGER CARD (Show only if budget is set) */}
          {budgetTotal > 0 && (
            <motion.div
              onClick={() => onNavigateToTab('settings', 'section-budget', 'budget')}
              layoutId="budget-total-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-[#1E293B] p-5 border border-white/5 shadow-xl text-left select-none cursor-pointer hover:bg-slate-800/80 active:scale-[0.99] transition-all"
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">
                  Monthly Budget
                </span>
                <span className="font-sans text-[10px] font-bold text-slate-400">
                  {currentCurrency.symbol}{formatAmount(budgetTotal)} limit
                </span>
              </div>

              <div className="font-sans text-3xl font-black text-[#F8FAFC] tracking-tight mb-3">
                {currentCurrency.symbol}
                {formatAmount(remainingBudget)}
                <span className="text-[11px] font-bold text-[#94A3B8] tracking-normal ml-1 mb-0.5 inline-block">
                  remaining budget
                </span>
              </div>

              {/* Budget Progress bar usage indicator */}
              <div className="h-1.5 w-full bg-slate-955 bg-slate-950 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-[#EF4444]' : budgetProgress >= 80 ? 'bg-[#F97316]' : 'bg-[#22C55E]'}`}
                  style={{ width: `${Math.min(100, budgetProgress)}%` }}
                />
              </div>

              <div className="font-sans text-[10px] text-[#94A3B8] font-bold tracking-wide">
                {currentCurrency.symbol}{formatAmount(totalSpent)} of {currentCurrency.symbol}{formatAmount(budgetTotal)} budget used
              </div>
            </motion.div>
          )}

          {/* 3. COMBINED WARNING BANNER */}
          {activeAlerts.length > 0 && !isCombinedBannerDismissed && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left shadow-lg select-none ${
                  activeAlerts.some(a => a.isExceeded)
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#F59E0B] text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <AlertTriangle className={`h-5 w-5 shrink-0 ${activeAlerts.some(a => a.isExceeded) ? 'animate-pulse text-white' : 'text-slate-950'}`} />
                  <div className="overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth flex-1 py-0.5 leading-none">
                    <span className="font-sans text-xs font-black select-text">
                      Budget alerts: {activeAlerts.map(a => a.text).join(' • ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsCombinedBannerDismissed(true)}
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                    activeAlerts.some(a => a.isExceeded) ? 'hover:bg-white/15 text-white' : 'hover:bg-black/10 text-slate-950'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            </AnimatePresence>
          )}

          {/* 4. RECURRING BILL BANNER (Exact Due Date Today Matches) */}
          <AnimatePresence>
            {activeTemplates.map((bill) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.90 }}
                className="rounded-2xl bg-[#22C55E] p-3 text-slate-950 flex items-center justify-between gap-3 text-left shadow-lg select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-950/10 text-slate-950">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-black leading-tight">
                      {bill.name} — {currentCurrency.symbol}{bill.amount} due today
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => onQuickAddExpense(bill)}
                  className="flex cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-1.5 font-sans text-[10px] font-black text-[#22C55E] uppercase tracking-wider transition-all hover:scale-105"
                >
                  <Check className="h-3 w-3 stroke-[3px]" />
                  Confirm
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 5. LAST MONTH VS THIS MONTH CARD */}
          <div className="rounded-3xl bg-[#1E293B] p-5 border border-white/5 shadow-xl text-left select-none">
            <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest block mb-4">
              Month Overview
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-sans font-medium">Last Month Expenses:</span>
                <span className="font-mono font-bold">
                  {currentCurrency.symbol}
                  {formatAmount(totalSpentLastMonth)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-100 pt-1 border-t border-white/5">
                <span className="font-sans font-medium">This Month Expenses:</span>
                <span className="font-mono font-bold">
                  {currentCurrency.symbol}
                  {formatAmount(totalSpent)}
                </span>
              </div>
            </div>

            {/* Down/Up arrow rate text indicator */}
            <div className={`mt-3 pt-2.5 border-t border-white/5 font-sans text-xs font-black flex items-center gap-1.5 ${comparisonMetric.isIncrease ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              {comparisonMetric.text}
            </div>
          </div>

          {/* 6. RECENT EXPENSES PANEL */}
          <div className="space-y-3 select-none">
            <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest pl-1 block">
              Recent Expenses
            </span>

            <div className="space-y-2.5">
              {recentExpenses.map((exp) => (
                <SwipeableExpenseItem
                  key={exp.id}
                  expense={exp}
                  currencySymbol={currentCurrency.symbol}
                  onDeleteRequest={onDeleteRequest}
                />
              ))}
            </div>

            {/* View All Button */}
            <button
              onClick={() => setShowAllHistory(true)}
              className="w-full py-3 rounded-2xl border border-slate-700 hover:border-[#22C55E]/40 text-slate-300 hover:text-white font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              Full History <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* 7. PREMIUM FEATURES SECTION */}
          <div className="space-y-3.5 select-none pt-2">
            <div className="text-left">
              <h3 className="font-sans text-[10px] text-[#22C55E] font-black uppercase tracking-widest">
                ✦ Premium Features
              </h3>
              <p className="font-sans text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5 leading-none">
                All features completely free
              </p>
            </div>

            {/* Grid of 8 precise Premium Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Currency Converter (Free) */}
              <button
                onClick={() => onNavigateToTab('stats', 'stats-currency-converter', { highlightId: 'stats-currency-converter', highlightColor: 'blue' })}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-700/60 hover:border-[#3B82F6]/50 bg-[#1E293B] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] mb-2.5">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h4 className="font-sans text-xs font-black text-slate-200 leading-tight">
                  Currency Converter
                </h4>
                <p className="font-sans text-[9px] text-slate-400 leading-tight mt-1 mb-1.5 flex-1">
                  Convert between base and top global currencies
                </p>
                <span className="font-sans text-[9px] text-[#F59E0B] font-extrabold tracking-wider uppercase">
                  (Free)
                </span>
              </button>

              {/* 2. Monthly Trends (Free) */}
              <button
                onClick={() => onNavigateToTab('stats', 'stats-trend-container', { statsTab: 'line', highlightId: 'stats-trend-container', highlightColor: 'green' })}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-700/60 hover:border-[#22C55E]/50 bg-[#1E293B] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#22C55E]/10 text-[#22C55E] mb-2.5">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h4 className="font-sans text-xs font-black text-slate-200 leading-tight">
                  Monthly Trends
                </h4>
                <p className="font-sans text-[9px] text-slate-400 leading-tight mt-1 mb-1.5 flex-1">
                  Analyze your historical spending patterns
                </p>
                <span className="font-sans text-[9px] text-[#F59E0B] font-extrabold tracking-wider uppercase">
                  (Free)
                </span>
              </button>

              {/* 3. Google Drive Backup (Free) */}
              <button
                onClick={() => onNavigateToTab('settings', undefined, { expandSection: 'section-backup', highlightId: 'section-backup', highlightColor: 'cyan' })}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-700/60 hover:border-[#06B6D4]/50 bg-[#1E293B] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#06B6D4]/10 text-[#06B6D4] mb-2.5">
                  <Database className="h-4 w-4" />
                </div>
                <h4 className="font-sans text-xs font-black text-slate-200 leading-tight">
                  Google Drive Backup
                </h4>
                <p className="font-sans text-[9px] text-slate-400 leading-tight mt-1 mb-1.5 flex-1">
                  Save and download secure cloud backup files
                </p>
                <span className="font-sans text-[9px] text-[#F59E0B] font-extrabold tracking-wider uppercase">
                  (Free)
                </span>
              </button>

              {/* 4. Passcode Lock (Free) */}
              <button
                onClick={() => onNavigateToTab('settings', undefined, { expandSection: 'section-security', highlightId: 'section-security', highlightColor: 'red' })}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-700/60 hover:border-[#EF4444]/50 bg-[#1E293B] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#EF4444]/10 text-[#EF4444] mb-2.5">
                  <Lock className="h-4 w-4" />
                </div>
                <h4 className="font-sans text-xs font-black text-slate-200 leading-tight">
                  Passcode Lock
                </h4>
                <p className="font-sans text-[9px] text-slate-400 leading-tight mt-1 mb-1.5 flex-1">
                  Lock app access behind personal security PIN
                </p>
                <span className="font-sans text-[9px] text-[#F59E0B] font-extrabold tracking-wider uppercase">
                  (Free)
                </span>
              </button>

              {/* 5. Custom Categories (Free) */}
              <button
                onClick={() => onNavigateToTab('add_expense', 'add-category-row', { highlightId: 'add-category-row', highlightColor: 'green' })}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-700/60 hover:border-[#22C55E]/50 bg-[#1E293B] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#22C55E]/10 text-[#22C55E] mb-2.5">
                  <Tag className="h-4 w-4" />
                </div>
                <h4 className="font-sans text-xs font-black text-slate-200 leading-tight">
                  Custom Categories
                </h4>
                <p className="font-sans text-[9px] text-slate-400 leading-tight mt-1 mb-1.5 flex-1">
                  Introduce and manage custom budget categories
                </p>
                <span className="font-sans text-[9px] text-[#F59E0B] font-extrabold tracking-wider uppercase">
                  (Free)
                </span>
              </button>

              {/* 6. Weekly Reports (Free) */}
              <button
                onClick={() => onNavigateToTab('stats', 'stats-weekly-report', { statsTab: 'bar', highlightId: 'stats-weekly-report', highlightColor: 'green' })}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-700/60 hover:border-[#14B8A6]/50 bg-[#1E293B] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] mb-2.5">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h4 className="font-sans text-xs font-black text-slate-200 leading-tight">
                  Weekly Reports
                </h4>
                <p className="font-sans text-[9px] text-slate-400 leading-tight mt-1 mb-1.5 flex-1">
                  Review daily allocations and weekly summaries
                </p>
                <span className="font-sans text-[9px] text-[#F59E0B] font-extrabold tracking-wider uppercase">
                  (Free)
                </span>
              </button>

              {/* 7. Savings Tracker (Free) */}
              <button
                onClick={() => onNavigateToTab('stats', 'stats-category-tracker', { statsTab: 'donut', highlightCategory: 'Savings', highlightId: 'stats-category-tracker', highlightColor: 'green' })}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-700/60 hover:border-[#10B981]/50 bg-[#1E293B] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] mb-2.5">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h4 className="font-sans text-xs font-black text-slate-200 leading-tight">
                  Savings Tracker
                </h4>
                <p className="font-sans text-[9px] text-slate-400 leading-tight mt-1 mb-1.5 flex-1">
                  Track and inspect your monthly savings rate
                </p>
                <span className="font-sans text-[9px] text-[#F59E0B] font-extrabold tracking-wider uppercase">
                  (Free)
                </span>
              </button>

              {/* 8. Budget Manager (Free) */}
              <button
                onClick={() => onNavigateToTab('settings', undefined, { expandSection: 'section-budget', highlightId: 'section-budget', highlightColor: 'green' })}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-700/60 hover:border-[#8B5CF6]/50 bg-[#1E293B] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] mb-2.5">
                  <Tag className="h-4 w-4" />
                </div>
                <h4 className="font-sans text-xs font-black text-slate-200 leading-tight">
                  Budget Manager
                </h4>
                <p className="font-sans text-[9px] text-slate-400 leading-tight mt-1 mb-1.5 flex-1">
                  Establish global or category-specific limits
                </p>
                <span className="font-sans text-[9px] text-[#F59E0B] font-extrabold tracking-wider uppercase">
                  (Free)
                </span>
              </button>
            </div>

            {/* Google AdMob bottom banner ad (Simulated on Web, Real Native Ad overlays in Android) */}
            {showMockBanner && (
              <div className="mt-8 mb-4 p-3.5 rounded-2xl border border-dashed border-[#22C55E]/30 bg-[#22C55E]/5 flex flex-col gap-2.5 relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.2)] animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 font-sans text-[8px] font-black tracking-widest text-[#22C55E] uppercase">
                    AdMob Banner (Simulated)
                  </span>
                  <span className="font-mono text-[8px] text-slate-500 tracking-wide select-all">
                    ID: ca-app-pub-4624646043793941/6600128591
                  </span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#22C55E] to-emerald-600 shadow-md">
                    <span className="font-sans text-xs font-black text-slate-950">SS</span>
                  </div>
                  <div>
                    <h5 className="font-sans text-xs font-black text-slate-200">SpendSmart Supreme Activated</h5>
                    <p className="font-sans text-[9px] text-slate-400">Maximize savings with automated category analytics and offline safety.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
