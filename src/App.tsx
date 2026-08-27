/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, BarChart3, Settings, AlertCircle, AlertTriangle, Plus } from 'lucide-react';
import { Expense, Budget, Template, CURRENCIES, CurrencyInfo } from './types';

// Component Imports
import { HomeView } from './components/HomeView';
import { AddExpenseView } from './components/AddExpenseView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { CustomConfirm } from './components/CustomConfirm';
import { SetupWizard } from './components/SetupWizard';
import { PinLockScreen } from './components/PinLockScreen';
import { admobService } from './utils/admobService';

export default function App() {
  // --- Setup & Security Persistent States ---
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    return localStorage.getItem('spend_smart_setup_complete') === 'true';
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('spend_smart_user_name') || '';
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('spend_smart_user_email') || '';
  });

  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
    const saved = localStorage.getItem('spend_smart_monthly_income');
    return saved ? parseFloat(saved) : 0;
  });

  const [securityType, setSecurityType] = useState<'fingerprint' | 'pin' | 'none'>(() => {
    return (localStorage.getItem('spend_smart_security_type') as 'fingerprint' | 'pin' | 'none') || 'none';
  });

  const [pinCode, setPinCode] = useState<string>(() => {
    return localStorage.getItem('spend_smart_pin_code') || '';
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const savedType = localStorage.getItem('spend_smart_security_type');
    const savedPin = localStorage.getItem('spend_smart_pin_code');
    return savedType === 'pin' && !!savedPin && savedPin.length === 4;
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spend_smart_notifications_enabled') === 'true';
  });

  const [notificationTime, setNotificationTime] = useState<string>(() => {
    return localStorage.getItem('spend_smart_notification_time') || '09:00';
  });

  // --- Dynamic Custom Categories ---
  const [customCategories, setCustomCategories] = useState<Array<{ name: string; color: string; iconName: string }>>(() => {
    const saved = localStorage.getItem('spend_smart_custom_categories');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Core Budget & Transaction Logs Lists ---
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('spend_smart_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [templates, setTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem('spend_smart_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const [budget, setBudget] = useState<Budget>(() => {
    const saved = localStorage.getItem('spend_smart_budget');
    return saved ? JSON.parse(saved) : {
      total: 1500,
      categories: {},
    };
  });

  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    const saved = localStorage.getItem('spend_smart_currency');
    return saved || 'INR';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('spend_smart_dark_mode');
    return saved ? saved === 'true' : true; // default dark mode
  });

  // --- Screen Switch TrackingStates ---
  const [activeScreen, setActiveScreen] = useState<'home' | 'add_expense' | 'stats' | 'settings'>('home');
  const [previousTab, setPreviousTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [showSuccessCheckmark, setShowSuccessCheckmark] = useState<boolean>(false);

  // --- AdMob Banner Visibility States ---
  const [showMockBanner, setShowMockBanner] = useState<boolean>(false);

  // Initialize and handle bottom AdMob Banner lifecycle
  useEffect(() => {
    let active = true;
    admobService.initialize().then(() => {
      if (!active) return;
      if (activeScreen === 'home' && isSetupComplete && !isLocked) {
        admobService.showBanner(setShowMockBanner);
      } else {
        admobService.hideBanner(() => setShowMockBanner(false));
      }
    });

    return () => {
      active = false;
      admobService.hideBanner();
    };
  }, [activeScreen, isSetupComplete, isLocked]);

  // --- Premium highlight and targeting states ---
  const [highlightConfig, setHighlightConfig] = useState<{
    targetId: string | null;
    color: string;
    sectionToExpand?: string;
    statsTab?: 'donut' | 'line' | 'bar' | 'area' | 'compare';
    statsCategoryHighlight?: string;
  }>({ targetId: null, color: '' });

  // --- Toast notifications alerts ---
  interface ToastNotification {
    id: string;
    type: 'warning' | 'error';
    message: string;
  }
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const triggerToast = (type: 'warning' | 'error', message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  // --- Deletion Dialog Targets ---
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // --- Synchronization Handlers to LocalStorage caches ---
  useEffect(() => {
    localStorage.setItem('spend_smart_setup_complete', String(isSetupComplete));
  }, [isSetupComplete]);

  useEffect(() => {
    localStorage.setItem('spend_smart_user_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('spend_smart_user_email', userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('spend_smart_monthly_income', String(monthlyIncome));
  }, [monthlyIncome]);

  useEffect(() => {
    localStorage.setItem('spend_smart_security_type', securityType);
  }, [securityType]);

  useEffect(() => {
    localStorage.setItem('spend_smart_pin_code', pinCode);
  }, [pinCode]);

  useEffect(() => {
    localStorage.setItem('spend_smart_notifications_enabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('spend_smart_notification_time', notificationTime);
  }, [notificationTime]);

  useEffect(() => {
    localStorage.setItem('spend_smart_custom_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('spend_smart_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('spend_smart_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('spend_smart_budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('spend_smart_currency', currencyCode);
  }, [currencyCode]);

  useEffect(() => {
    localStorage.setItem('spend_smart_dark_mode', String(darkMode));
  }, [darkMode]);

  // Derive active display currency
  const activeCurrencyInfo = CURRENCIES.find(c => c.code === currencyCode) || {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
  };

  const handleTabChange = (screen: 'home' | 'stats' | 'settings') => {
    setActiveScreen(screen);
    setPreviousTab(screen);
  };

  const handleNagivateToTabFromPro = (
    tab: 'stats' | 'settings' | 'add_expense', 
    sectionId?: string,
    extraConfig?: {
      statsTab?: 'donut' | 'line' | 'bar' | 'area' | 'compare';
      expandSection?: string;
      highlightId?: string;
      highlightColor?: string;
      highlightCategory?: string;
    }
  ) => {
    setActiveScreen(tab);
    if (tab !== 'add_expense') {
      setPreviousTab(tab);
    }

    if (extraConfig) {
      setHighlightConfig({
        targetId: extraConfig.highlightId || null,
        color: extraConfig.highlightColor || '',
        sectionToExpand: extraConfig.expandSection,
        statsTab: extraConfig.statsTab,
        statsCategoryHighlight: extraConfig.highlightCategory
      });

      // Clear highlighting styling after 3.0s
      setTimeout(() => {
        setHighlightConfig(prev => ({ ...prev, targetId: null, statsCategoryHighlight: undefined }));
      }, 3000);
    }

    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  };

  // Warning diagnostics
  const checkBudgetWarnings = (addedExp: Expense, currentExpenses: Expense[]) => {
    const { category, amount: addedAmount } = addedExp;
    const limit = parseFloat(String(budget.categories?.[category])) || 0;
    if (limit <= 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Filter expenses prior to this addition
    const monthlyExpenses = currentExpenses.filter(e => {
      if (e.id === addedExp.id) return false;
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const spentBefore = monthlyExpenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);

    const spentAfter = spentBefore + addedAmount;
    const pctBefore = (spentBefore / limit) * 100;
    const pctAfter = (spentAfter / limit) * 100;

    const currencySymbol = activeCurrencyInfo.symbol;

    if (pctAfter > 100 && pctBefore <= 100) {
      const exceededPct = Math.round(((spentAfter - limit) / limit) * 100);
      const amountOver = Math.round(spentAfter - limit);
      triggerToast(
        'error',
        `${category} budget EXCEEDED by ${exceededPct}%!\nYou are ${currencySymbol}${amountOver.toLocaleString()} over your ${category.toLowerCase()} limit.`,
        5000
      );
    } else if (pctAfter >= 100 && pctBefore < 100) {
      triggerToast(
        'error',
        `${category} budget limit reached!\nYou have used your full ${category.toLowerCase()} budget.`,
        4000
      );
    } else if (pctAfter >= 80 && pctBefore < 80) {
      const remainingInLimit = Math.max(0, Math.round(limit - spentAfter));
      triggerToast(
        'warning',
        `${category} budget at 80% — ${currencySymbol}${remainingInLimit.toLocaleString()} remaining this month`,
        4000
      );
    }
  };

  // Onboard finisher callback
  const handleSetupComplete = (data: {
    userName: string;
    userEmail: string;
    monthlyIncome: number;
    currencyCode: string;
    securityType: 'fingerprint' | 'pin' | 'none';
    pinCode: string;
  }) => {
    setUserName(data.userName);
    setUserEmail(data.userEmail);
    setMonthlyIncome(data.monthlyIncome);
    setCurrencyCode(data.currencyCode);
    setSecurityType(data.securityType);
    setPinCode(data.pinCode);
    setIsLocked(false);
    setIsSetupComplete(true);
  };

  const handleSaveExpense = (newExp: Omit<Expense, 'id' | 'timestamp'>) => {
    const freshExpense: Expense = {
      ...newExp,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
    };

    setExpenses(prev => {
      const updated = [freshExpense, ...prev];
      checkBudgetWarnings(freshExpense, updated);
      return updated;
    });
  };

  const handleAddCustomCategory = (name: string, iconName: string, color: string) => {
    const newCat = { name, color, iconName };
    setCustomCategories(prev => {
      // Avoid duplicate names
      if (prev.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      return [...prev, newCat];
    });
  };

  const handleQuickAddExpense = (template: Template) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const quickExpense: Expense = {
      id: `exp-${Date.now()}`,
      amount: template.amount,
      category: template.category,
      note: `${template.name} (Recurring Due)`,
      date: todayStr,
      timestamp: Date.now(),
    };

    setExpenses(prev => {
      const updated = [quickExpense, ...prev];
      checkBudgetWarnings(quickExpense, updated);
      return updated;
    });
    setShowSuccessCheckmark(true);
    setTimeout(() => {
      setShowSuccessCheckmark(false);
    }, 1500);
  };

  const handleDeleteRequest = (expense: Expense) => {
    setDeleteTarget(expense);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setExpenses(prev => prev.filter(e => e.id !== deleteTarget.id));
    }
    setIsConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleAddTemplate = (newTemp: Omit<Template, 'id'>) => {
    const template: Template = {
      ...newTemp,
      id: `temp-${Date.now()}`,
    };
    setTemplates(prev => [...prev, template]);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleBackup = () => {
    const dataObj = {
      expenses,
      templates,
      budget,
      currencyCode,
      darkMode,
      userName,
      monthlyIncome,
      securityType,
      pinCode,
      customCategories,
      backupVersion: '1.0.0',
    };

    const strJson = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([strJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpendSmart_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      }
      if (Array.isArray(data.templates)) {
        setTemplates(data.templates);
      }
      if (data.budget && typeof data.budget.total === 'number') {
        setBudget(data.budget);
      }
      if (data.currencyCode) {
        setCurrencyCode(data.currencyCode);
      }
      if (typeof data.darkMode === 'boolean') {
        setDarkMode(data.darkMode);
      }
      if (data.userName !== undefined) {
        setUserName(data.userName);
      }
      if (data.monthlyIncome !== undefined) {
        setMonthlyIncome(Number(data.monthlyIncome) || 0);
      }
      if (data.securityType) {
        setSecurityType(data.securityType);
        if (data.securityType === 'pin' && data.pinCode) {
          setPinCode(data.pinCode);
        } else {
          setPinCode('');
        }
      }
      if (Array.isArray(data.customCategories)) {
        setCustomCategories(data.customCategories);
      }
      return true;
    } catch (e) {
      console.error('Failed to parse backup payload', e);
      return false;
    }
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 font-sans bg-[#0E1525] flex items-center justify-center p-0 md:p-4`}>
      {/* Container configured as a custom mobile mockup framing */}
      <div className={`relative w-full max-w-md min-h-screen md:min-h-[812px] md:max-h-[850px] shadow-2xl md:rounded-3xl overflow-hidden flex flex-col border transition-all bg-[#0F172A] border-slate-800 text-white shadow-emerald-500/5`}>
        
        {/* FIRST LAUNCH ONBOARDING FLOW */}
        {!isSetupComplete && (
          <SetupWizard onComplete={handleSetupComplete} />
        )}

        {/* SECURE PIN ENTRY PANEL */}
        {isSetupComplete && isLocked && (
          <PinLockScreen correctPin={pinCode} onUnlock={() => setIsLocked(false)} />
        )}

        {/* Dynamic Warning Notification Toasts */}
        <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none space-y-2.5">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25, type: 'spring', damping: 18 }}
                className={`w-full p-4 rounded-2xl shadow-2xl flex items-start gap-3 pointer-events-auto border ${
                  toast.type === 'error'
                    ? 'bg-[#EF4444] border-[#EF4444]/20 text-white font-medium'
                    : 'bg-[#F59E0B] border-[#F59E0B]/20 text-slate-950 font-medium'
                }`}
              >
                {toast.type === 'error' ? (
                  <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-white font-black animate-pulse" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-slate-950 font-black animate-bounce" />
                )}
                <div className="flex-1 text-left">
                  <p className="font-sans text-xs font-black uppercase tracking-wider mb-0.5 leading-none">
                    {toast.type === 'error' ? 'Limit Exceeded' : 'Budget Warning'}
                  </p>
                  <p className="font-sans text-[11.5px] leading-relaxed whitespace-pre-line font-medium text-inherit">
                    {toast.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* DYNAMIC SCREEN DISPLAY VIEWS */}
        <div className="flex-1 overflow-hidden flex flex-col relative pb-32">
          <AnimatePresence mode="wait">
            {activeScreen === 'home' && isSetupComplete && !isLocked && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden pb-6"
              >
                <HomeView
                  expenses={expenses}
                  templates={templates}
                  budgetTotal={budget.total}
                  currentCurrency={activeCurrencyInfo}
                  userName={userName}
                  monthlyIncome={monthlyIncome}
                  customCategories={customCategories}
                  onNavigateToAddExpense={() => setActiveScreen('add_expense')}
                  onQuickAddExpense={handleQuickAddExpense}
                  onDeleteRequest={handleDeleteRequest}
                  onNavigateToTab={handleNagivateToTabFromPro}
                  showMockBanner={showMockBanner}
                />
              </motion.div>
            )}

            {activeScreen === 'stats' && isSetupComplete && !isLocked && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden pb-6"
              >
                <StatsView
                  expenses={expenses}
                  currentCurrency={activeCurrencyInfo}
                  monthlyIncome={monthlyIncome}
                  highlightConfig={highlightConfig}
                />
              </motion.div>
            )}

            {activeScreen === 'settings' && isSetupComplete && !isLocked && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden pb-6"
              >
                <SettingsView
                  budget={budget}
                  templates={templates}
                  currentCurrency={activeCurrencyInfo}
                  darkMode={darkMode}
                  userName={userName}
                  monthlyIncome={monthlyIncome}
                  securityType={securityType}
                  pinCode={pinCode}
                  notificationsEnabled={notificationsEnabled}
                  notificationTime={notificationTime}
                  customCategories={customCategories}
                  onUpdateBudget={setBudget}
                  onAddTemplate={handleAddTemplate}
                  onDeleteTemplate={handleDeleteTemplate}
                  onUpdateCurrency={setCurrencyCode}
                  onUpdateDarkMode={setDarkMode}
                  onUpdateProfile={(name, salary) => {
                    setUserName(name);
                    setMonthlyIncome(salary);
                  }}
                  onUpdateSecurity={(type, pin) => {
                    setSecurityType(type);
                    setPinCode(pin);
                  }}
                  onUpdateNotifications={(enabled, time) => {
                    setNotificationsEnabled(enabled);
                    setNotificationTime(time);
                  }}
                  onBackup={handleBackup}
                  onRestore={handleRestore}
                  highlightConfig={highlightConfig}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ADD EXPENSE SLIDING BOTTOM SHEET */}
          <AnimatePresence>
            {activeScreen === 'add_expense' && isSetupComplete && !isLocked && (
              <motion.div
                key="add_expense"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="absolute inset-0 z-40 bg-[#0F172A] flex flex-col overflow-hidden"
              >
                <AddExpenseView
                  currentCurrency={activeCurrencyInfo}
                  customCategories={customCategories}
                  onSaveExpense={handleSaveExpense}
                  onAddCustomCategory={handleAddCustomCategory}
                  onBack={() => setActiveScreen(previousTab)}
                  highlightConfig={highlightConfig}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* "+ Add Today's Expense" FIXED ACTION BAR */}
        {activeScreen !== 'add_expense' && isSetupComplete && !isLocked && (
          <div className="absolute bottom-18 left-0 right-0 px-4 py-3 bg-[#0F172A]/90 backdrop-blur-xs border-t border-white/5 z-20">
            <button
              id="global-prominent-add-expense-btn"
              onClick={() => setActiveScreen('add_expense')}
              className="w-full text-center py-3 bg-[#22C55E] hover:bg-[#1f9f4c] hover:shadow-[0_0_15px_rgba(34,197,94,0.35)] text-slate-950 font-sans text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-1.5 shadow-md border-0"
            >
              <Plus className="h-4.5 w-4.5 stroke-[3px]" />
              + Add Today's Expense
            </button>
          </div>
        )}

        {/* BOTTOM TAB WRAP NAVIGATION BAR */}
        {activeScreen !== 'add_expense' && isSetupComplete && !isLocked && (
          <div className="absolute bottom-0 left-0 right-0 h-18 border-t flex items-center justify-around px-4 pb-1.5 transition-colors z-20 bg-[#0B111E]/95 border-slate-900/65 backdrop-blur-md">
            <button
              onClick={() => handleTabChange('home')}
              className={`flex-1 flex flex-col cursor-pointer items-center justify-center py-2 relative transition-all ${
                activeScreen === 'home'
                  ? 'text-[#22C55E] font-bold animate-pulse'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Home className="h-5.5 w-5.5" />
              <span className="font-sans text-[10px] mt-1.5 uppercase tracking-wide">Home</span>
              {activeScreen === 'home' && (
                <motion.div
                  layoutId="indicator"
                  className="absolute bottom-0 h-1 w-5 rounded-full bg-[#22C55E]"
                />
              )}
            </button>

            <button
              onClick={() => handleTabChange('stats')}
              className={`flex-1 flex flex-col cursor-pointer items-center justify-center py-2 relative transition-all ${
                activeScreen === 'stats'
                  ? 'text-[#22C55E] font-bold animate-pulse'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <BarChart3 className="h-5.5 w-5.5" />
              <span className="font-sans text-[10px] mt-1.5 uppercase tracking-wide">Stats</span>
              {activeScreen === 'stats' && (
                <motion.div
                  layoutId="indicator"
                  className="absolute bottom-0 h-1 w-5 rounded-full bg-[#22C55E]"
                />
              )}
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              className={`flex-1 flex flex-col cursor-pointer items-center justify-center py-2 relative transition-all ${
                activeScreen === 'settings'
                  ? 'text-[#22C55E] font-bold animate-pulse'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Settings className="h-5.5 w-5.5" />
              <span className="font-sans text-[10px] mt-1.5 uppercase tracking-wide">Settings</span>
              {activeScreen === 'settings' && (
                <motion.div
                  layoutId="indicator"
                  className="absolute bottom-0 h-1 w-5 rounded-full bg-[#22C55E]"
                />
              )}
            </button>
          </div>
        )}

        {/* Global Delete Confirm Modal overlay */}
        <CustomConfirm
          isOpen={isConfirmOpen}
          title="Delete Transaction?"
          message={
            deleteTarget
              ? `Are you sure you want to permanently delete the "${deleteTarget.category}" entry of ${activeCurrencyInfo.symbol}${deleteTarget.amount}?`
              : ''
          }
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />

        {/* Success checkmark micro animation popup on confirm quick adds */}
        <AnimatePresence>
          {showSuccessCheckmark && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] mb-4"
              >
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ delay: 0.2 }}
                className="font-sans text-sm font-bold text-white tracking-wide"
              >
                Expense Logged!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
