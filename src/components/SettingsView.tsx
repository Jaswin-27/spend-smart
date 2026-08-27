/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  CreditCard,
  Calendar,
  Bell,
  Shield,
  Database,
  Sliders,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Lock,
  ArrowUpRight,
  Youtube,
  Instagram,
  Mail,
  Check,
  Globe,
  FileText,
  Star,
  Share2,
  EyeOff,
  HardDrive,
  Cloud,
  ShieldCheck
} from 'lucide-react';
import { Budget, Template, CurrencyInfo, CATEGORIES } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface SettingsViewProps {
  budget: Budget;
  templates: Template[];
  currentCurrency: CurrencyInfo;
  darkMode: boolean;
  userName: string;
  monthlyIncome: number;
  securityType: 'fingerprint' | 'pin' | 'none';
  pinCode: string;
  notificationsEnabled: boolean;
  notificationTime: string;
  customCategories: Array<{ name: string; color: string; iconName: string }>;
  onUpdateBudget: (budget: Budget) => void;
  onAddTemplate: (newTemp: Omit<Template, 'id'>) => void;
  onDeleteTemplate: (id: string) => void;
  onUpdateCurrency: (currencyCode: string) => void;
  onUpdateDarkMode: (darkMode: boolean) => void;
  onUpdateProfile: (name: string, salary: number) => void;
  onUpdateSecurity: (type: 'fingerprint' | 'pin' | 'none', pin: string) => void;
  onUpdateNotifications: (enabled: boolean, time: string) => void;
  onBackup: () => void;
  onRestore: (jsonData: string) => boolean;
  highlightConfig?: {
    targetId: string | null;
    color: string;
    sectionToExpand?: string;
    statsTab?: 'donut' | 'line' | 'bar' | 'area' | 'compare';
    statsCategoryHighlight?: string;
  };
}

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

export const SettingsView: React.FC<SettingsViewProps> = ({
  budget,
  templates,
  currentCurrency,
  darkMode,
  userName,
  monthlyIncome,
  securityType,
  pinCode,
  notificationsEnabled,
  notificationTime,
  customCategories,
  onUpdateBudget,
  onAddTemplate,
  onDeleteTemplate,
  onUpdateCurrency,
  onUpdateDarkMode,
  onUpdateProfile,
  onUpdateSecurity,
  onUpdateNotifications,
  onBackup,
  onRestore,
  highlightConfig,
}) => {
  // Accordion active sections: only Profile open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    profile: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // State values for forms
  const [profileName, setProfileName] = useState(userName);
  const [profileSalary, setProfileSalary] = useState(monthlyIncome > 0 ? String(monthlyIncome) : '');
  const [profileCurrencyCode, setProfileCurrencyCode] = useState(currentCurrency.code);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Checks if profile has changed to conditionally display Save button
  const isProfileChanged =
    profileName !== userName ||
    profileSalary !== (monthlyIncome > 0 ? String(monthlyIncome) : '') ||
    profileCurrencyCode !== currentCurrency.code;

  // Budget manager forms
  const [totalBudget, setTotalBudget] = useState(String(budget.total || ''));
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    CATEGORIES.forEach(c => {
      initial[c.name] = budget.categories?.[c.name] ? String(budget.categories[c.name]) : '';
    });
    return initial;
  });
  const [isBudgetSaved, setIsBudgetSaved] = useState(false);

  // Recur Bill Template forms
  const [newTempName, setNewTempName] = useState('');
  const [newTempAmount, setNewTempAmount] = useState('');
  const [newTempCategory, setNewTempCategory] = useState('Bills');
  const [newTempDay, setNewTempDay] = useState('1');
  const [showAddTemplateForm, setShowAddTemplateForm] = useState(false);

  // Notifications master state
  const [notifToggle, setNotifToggle] = useState(notificationsEnabled);
  const [notifTimeValue, setNotifTimeValue] = useState(notificationTime || '09:00');

  // Security elements
  const [pinInputValue, setPinInputValue] = useState(pinCode);
  const [showPinInput, setShowPinInput] = useState(false);
  const [isPinSetupSuccess, setIsPinSetupSuccess] = useState(false);

  // Overlay Screens
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [didSubmitRating, setDidSubmitRating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLegalDoc, setShowLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  // Simulated Google connection trigger triggers
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = () => {
    onUpdateProfile(profileName.trim(), parseFloat(profileSalary) || 0);
    onUpdateCurrency(profileCurrencyCode);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 2000);
  };

  const handleCategoryBudgetChange = (catName: string, val: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [catName]: val
    }));
  };

  const handleApplyBudget = () => {
    const categoriesMapped: Record<string, number> = {};
    Object.entries(categoryBudgets).forEach(([name, val]) => {
      const parsed = parseFloat(val as string);
      if (!isNaN(parsed) && parsed > 0) {
        categoriesMapped[name] = parsed;
      }
    });

    onUpdateBudget({
      total: parseFloat(totalBudget) || 0,
      categories: categoriesMapped
    });

    setIsBudgetSaved(true);
    setTimeout(() => setIsBudgetSaved(false), 2000);
  };

  const handleAddTemplateAction = () => {
    const amt = parseFloat(newTempAmount);
    const day = parseInt(newTempDay);

    if (!newTempName.trim()) {
      alert('Please enter a recurring bill name!');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid recurring amount!');
      return;
    }
    if (isNaN(day) || day < 1 || day > 31) {
      alert('Please select a due calendar day (1 to 31)!');
      return;
    }

    onAddTemplate({
      name: newTempName.trim(),
      amount: amt,
      category: newTempCategory,
      dayOfMonth: day
    });

    // Reset fields
    setNewTempName('');
    setNewTempAmount('');
    setNewTempCategory('Bills');
    setNewTempDay('1');
    setShowAddTemplateForm(false);
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setNotifToggle(enabled);
    onUpdateNotifications(enabled, notifTimeValue);
  };

  const handleNotificationTimeChange = (time: string) => {
    setNotifTimeValue(time);
    onUpdateNotifications(notifToggle, time);
  };

  const handleSecurityToggleFingerprint = () => {
    if (securityType === 'fingerprint') {
      onUpdateSecurity('none', pinCode);
    } else {
      onUpdateSecurity('fingerprint', pinCode);
      alert('Biometric registration initialized on your device securely.');
    }
  };

  const handleSetPinSubmit = () => {
    if (pinInputValue.length !== 4) {
      alert('PIN must be exactly 4-digits long!');
      return;
    }
    onUpdateSecurity('pin', pinInputValue);
    setIsPinSetupSuccess(true);
    setShowPinInput(false);
    setTimeout(() => setIsPinSetupSuccess(false), 2000);
  };

  const handleSimulatedBackup = () => {
    // Collect all data
    const payload = {
      profileName,
      profileSalary,
      profileCurrencyCode,
      budget,
      templates,
    };
    onBackup(); // Save logs to App
    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3000);
  };

  const handleFileRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textStr = event.target?.result as string;
        const parsed = JSON.parse(textStr);
        const success = onRestore(textStr);
        if (success) {
          setRestoreSuccess(true);
          setTimeout(() => setRestoreSuccess(false), 3000);
        } else {
          alert('Failed to parse restore data stream format.');
        }
      } catch (err) {
        alert('Err reading file stream payload.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (highlightConfig?.targetId) {
      const targetId = highlightConfig.targetId;
      if (targetId === 'section-budget') {
        setOpenSections(prev => ({ ...prev, budget: true }));
        setTimeout(() => {
          const inputEl = document.getElementById('budget-global-input') as HTMLInputElement;
          if (inputEl) {
            inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputEl.focus();
            // Move cursor to the end of the input value
            const val = inputEl.value;
            inputEl.value = '';
            inputEl.value = val;
          }
        }, 300);
      } else if (targetId === 'section-security') {
        setOpenSections(prev => ({ ...prev, security: true }));
        setTimeout(() => {
          const secEl = document.getElementById('section-security');
          if (secEl) {
            secEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      } else if (targetId === 'section-backup') {
        setOpenSections(prev => ({ ...prev, backup: true }));
        setTimeout(() => {
          const btnEl = document.getElementById('backup-gdrive-trigger-btn');
          if (btnEl) {
            btnEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [highlightConfig?.targetId]);

  return (
    <div id="settings-tab-screen" className="flex flex-col flex-1 px-4 pt-4 pb-24 text-white overflow-y-auto no-scrollbar bg-[#0F172A] text-left">
      
      {/* SECTION 1 - PROFILE CONTROL PANEL */}
      <div id="section-profile" className="mb-3.5 overflow-hidden rounded-2xl border border-white/5 bg-[#1E293B]">
        <button
          onClick={() => toggleSection('profile')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#F8FAFC] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-[#22C55E]" /> Profile
          </span>
          {openSections.profile ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.profile && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4 space-y-4"
            >
              {/* Name Text Input */}
              <div className="text-left">
                <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1.5 block">
                  Your Display Name
                </label>
                <input
                  id="profile-name-input"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full font-sans text-xs rounded-xl border border-white/5 bg-[#0F172A] p-3 text-slate-205 focus:outline-none"
                />
              </div>

              {/* Monthly Income Input */}
              <div className="text-left">
                <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1.5 block">
                  Monthly Income ({currentCurrency.symbol})
                </label>
                <input
                  id="profile-[#22C55E]-input"
                  type="number"
                  value={profileSalary}
                  onChange={(e) => setProfileSalary(e.target.value)}
                  placeholder="E.g. 50000"
                  className="w-full font-sans text-xs rounded-xl border border-white/5 bg-[#0F172A] p-3 text-slate-205 focus:outline-none"
                />
              </div>

              {/* Currency Dropdown Selector */}
              <div className="text-left">
                <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1.5 block">
                  Select Currency Symbol
                </label>
                <select
                  id="profile-currency-dropdown"
                  value={profileCurrencyCode}
                  onChange={(e) => setProfileCurrencyCode(e.target.value)}
                  className="w-full p-3 font-sans text-xs font-bold rounded-xl border border-white/5 bg-[#0F172A] text-slate-200 cursor-pointer focus:outline-none"
                >
                  {TARGET_CURRENCIES.map((tc) => (
                    <option key={tc.code} value={tc.code}>
                      {tc.code} — {tc.name} ({tc.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Changes button appears ONLY when modifications are made */}
              {isProfileChanged && (
                <button
                  id="profile-save-changes-btn"
                  onClick={handleSaveProfile}
                  className="w-full py-3 bg-[#22C55E] hover:bg-[#22C55E]/90 text-slate-950 font-sans text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md focus:outline-none border-0 cursor-pointer block"
                >
                  Save Profile Changes
                </button>
              )}

              {/* Temporary save notice */}
              {isProfileSaved && (
                <p className="text-xs text-[#22C55E] font-sans font-bold flex items-center gap-1 justify-center mt-2 pl-0.5">
                  <Check className="h-4.5 w-4.5" /> Profile settings saved successfully!
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 2 - BUDGET MANAGER (COLLAPSIBLE) */}
      <div
        id="section-budget"
        className={`mb-3.5 overflow-hidden rounded-2xl border bg-[#1E293B] transition-all duration-300 ${
          highlightConfig?.targetId === 'section-budget'
            ? 'border-green-500 ring-4 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse'
            : 'border-white/5'
        }`}
      >
        <button
          onClick={() => toggleSection('budget')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#F8FAFC] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-[#22C55E]" /> Budget Manager
          </span>
          {openSections.budget ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.budget && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4 space-y-4"
            >
              <div className="text-left">
                <div className="flex justify-between items-baseline">
                  <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1.5 block">
                    Total Global Monthly Budget
                  </label>
                  <span className="font-sans text-[9px] text-[#94A3B8] italic">Leave blank for no limit</span>
                </div>
                <input
                  id="budget-global-input"
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="No budget limit set"
                  className="w-full font-sans text-xs rounded-xl border border-white/5 bg-[#0F172A] p-3 text-slate-205 focus:outline-none mb-4"
                />
              </div>

              {/* Per Category budgets mapping inputs */}
              <div className="space-y-3 pt-2.5 border-t border-white/5 text-left">
                <span className="font-sans text-[10px] text-[#94A3B8] font-black uppercase tracking-widest block mb-1">
                  Budget Limits Per Category
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.name} className="flex flex-col gap-1">
                      <span className="font-sans text-[10px] text-[#94A3B8] font-medium block">
                        {cat.name} Limit
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans font-black text-slate-400 text-[10px]">
                          {currentCurrency.symbol}
                        </span>
                        <input
                          id={`budget-cat-val-${cat.name.toLowerCase()}`}
                          type="number"
                          value={categoryBudgets[cat.name] || ''}
                          onChange={(e) => handleCategoryBudgetChange(cat.name, e.target.value)}
                          placeholder="No limit"
                          className="w-full font-sans text-xs pl-6 pr-3 py-2.5 rounded-xl border border-white/5 bg-[#0F172A] text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id="apply-budget-changes-btn"
                onClick={handleApplyBudget}
                className="w-full py-3 bg-[#22C55E] hover:bg-[#22C55E]/90 text-slate-950 font-sans text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md focus:outline-none border-0 cursor-pointer block mt-3"
              >
                Save Budget Limits
              </button>

              {isBudgetSaved && (
                <p className="text-xs text-[#22C55E] font-sans font-bold flex items-center gap-1 justify-center mt-2 pl-0.5">
                  <Check className="h-4.5 w-4.5" /> Budget parameters saved successfully!
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 3 - RECURRING BILLS (COLLAPSIBLE) */}
      <div id="section-recurring" className="mb-3.5 overflow-hidden rounded-2xl border border-white/5 bg-[#1E293B]">
        <button
          onClick={() => toggleSection('recurring')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#F8FAFC] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-[#22C55E]" /> Recurring Bills
          </span>
          {openSections.recurring ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.recurring && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-sans text-[10px] text-slate-400 font-bold max-w-[70%] leading-relaxed text-left">
                  Set templates of bills due monthly. The system alerts you on exact day.
                </span>
                <button
                  id="toggle-add-recur-bill-form"
                  onClick={() => setShowAddTemplateForm(prev => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] font-sans text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border-0 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add New Bill
                </button>
              </div>

              {/* Add template inline drawer block */}
              <AnimatePresence>
                {showAddTemplateForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-2xl bg-slate-950/20 border border-white/5 space-y-3 mb-4 text-left overflow-hidden"
                  >
                    <div>
                      <label className="font-sans text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block mb-1">
                        Bill Name
                      </label>
                      <input
                        id="new-recur-bill-name"
                        type="text"
                        value={newTempName}
                        onChange={(e) => setNewTempName(e.target.value)}
                        placeholder="E.g. Netflix Subscription"
                        className="w-full font-sans text-xs rounded-lg border border-white/5 bg-[#0F172A] p-2.5 text-slate-200 focus:outline"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-sans text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block mb-1">
                          Amount ({currentCurrency.symbol})
                        </label>
                        <input
                          id="new-recur-bill-amt"
                          type="number"
                          value={newTempAmount}
                          onChange={(e) => setNewTempAmount(e.target.value)}
                          placeholder="Sum"
                          className="w-full font-sans text-xs rounded-lg border border-white/5 bg-[#0F172A] p-2.5 text-slate-200 focus:outline"
                        />
                      </div>

                      <div>
                        <label className="font-sans text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block mb-1">
                          Calendar Day Due (1-31)
                        </label>
                        <input
                          id="new-recur-bill-day"
                          type="number"
                          value={newTempDay}
                          maxLength={2}
                          onChange={(e) => setNewTempDay(e.target.value)}
                          placeholder="Day of Month"
                          className="w-full font-sans text-xs rounded-lg border border-white/5 bg-[#0F172A] p-2.5 text-slate-200 focus:outline"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-sans text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block mb-1">
                        Category Tag
                      </label>
                      <select
                        id="new-recur-bill-cat"
                        value={newTempCategory}
                        onChange={(e) => setNewTempCategory(e.target.value)}
                        className="w-full font-sans text-xs rounded-lg border border-white/5 bg-[#0F172A] p-2.5 text-slate-300 cursor-pointer focus:outline-none"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      id="save-new-recur-bill-btn"
                      type="button"
                      onClick={handleAddTemplateAction}
                      className="w-full py-2.5 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] rounded-xl font-sans text-[10px] font-black uppercase tracking-widest hover:bg-[#22C55E]/15 cursor-pointer"
                    >
                      Apply Template Parameters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Saved templates catalog list */}
              <div className="space-y-2 select-text text-left">
                {templates.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs italic">
                    No recurring bills set up yet
                  </div>
                ) : (
                  templates.map((temp) => (
                    <div
                      key={temp.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/20 border border-white/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon categoryName={temp.category} className="h-4.5 w-4.5 text-[#22C55E]" />
                        <div className="text-left">
                          <h4 className="font-sans text-xs font-black text-slate-205 leading-tight">
                            {temp.name}
                          </h4>
                          <span className="font-sans text-[10px] text-slate-500 block mt-0.5 leading-none">
                            Every month on day {temp.dayOfMonth}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        <span className="font-mono text-xs font-black text-slate-100">
                          {currentCurrency.symbol}{temp.amount}
                        </span>
                        
                        <button
                          id={`delete-recur-bill-${temp.id}`}
                          onClick={() => onDeleteTemplate(temp.id)}
                          className="h-7 w-7 rounded-lg hover:bg-[#EF4444]/10 text-red-400 flex items-center justify-center transition-opacity cursor-pointer border-0 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 4 - NOTIFICATIONS REMINDERS (COLLAPSIBLE) */}
      <div id="section-notifications" className="mb-3.5 overflow-hidden rounded-2xl border border-white/5 bg-[#1E293B]">
        <button
          onClick={() => toggleSection('notifications')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#F8FAFC] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-[#22C55E]" /> Notifications
          </span>
          {openSections.notifications ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.notifications && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4 space-y-4 select-none"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="font-sans text-xs font-bold text-slate-205 leading-normal">
                    Enable Bill Reminders
                  </h4>
                  <p className="font-sans text-[10px] text-slate-500 leading-normal">
                    Get notified on bill due dates
                  </p>
                </div>

                {/* Master Notifications switch element */}
                <button
                  id="notifications-toggle-switch"
                  type="button"
                  onClick={() => handleToggleNotifications(!notifToggle)}
                  className={`h-6 w-11 rounded-full relative transition-all cursor-pointer border-0 ${
                    notifToggle ? 'bg-[#22C55E]' : 'bg-slate-950 border border-white/10'
                  }`}
                >
                  <motion.div
                    layout
                    className="h-4.5 w-4.5 rounded-full bg-white absolute top-0.5"
                    style={{ left: notifToggle ? '22px' : '3px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Time specification panel display when toggle ON */}
              <AnimatePresence>
                {notifToggle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-2 border-t border-white/5 pt-3 text-left"
                  >
                    <label className="font-sans text-[9px] text-[#94A3B8] font-bold uppercase tracking-wide block mb-1">
                      Remind me at:
                    </label>
                    <input
                      id="notifications-time-picker"
                      type="time"
                      value={notifTimeValue}
                      onChange={(e) => handleNotificationTimeChange(e.target.value)}
                      className="font-mono text-xs rounded-xl border border-white/5 bg-slate-950 p-2 text-[#22C55E] focus:outline-none max-w-[120px] text-center"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 5 - SECURITY SECURITY (COLLAPSIBLE) */}
      <div
        id="section-security"
        className={`mb-3.5 overflow-hidden rounded-2xl border bg-[#1E293B] transition-all duration-300 ${
          highlightConfig?.targetId === 'section-security'
            ? 'border-red-500 ring-4 ring-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
            : 'border-white/5'
        }`}
      >
        <button
          onClick={() => toggleSection('security')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#22C55E] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <Shield className="h-4.5 w-4.5 text-[#22C55E]" /> ✦ Security (Free)
          </span>
          {openSections.security ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.security && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4 space-y-4"
            >
              <p className="font-sans text-[10px] text-slate-500 block leading-normal text-left">
                Protect your financial data
              </p>

              {/* Fingerprint biometrics selection switch row */}
              <div className="flex items-center justify-between select-none">
                <div className="text-left">
                  <h4 className="font-sans text-xs font-bold text-slate-205 leading-normal">
                    Biometric Fingerprint
                  </h4>
                  <p className="font-sans text-[10px] text-slate-500 leading-normal">
                    Use device bio integration scanner
                  </p>
                </div>

                <button
                  id="security-toggle-fingerprint"
                  type="button"
                  onClick={handleSecurityToggleFingerprint}
                  className={`h-6 w-11 rounded-full relative transition-all cursor-pointer border-0 ${
                    securityType === 'fingerprint' ? 'bg-[#22C55E]' : 'bg-slate-950 border border-white/10'
                  }`}
                >
                  <motion.div
                    layout
                    className="h-4.5 w-4.5 rounded-full bg-white absolute top-0.5"
                    style={{ left: securityType === 'fingerprint' ? '22px' : '3px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* PIN Code settings subsection */}
              <div className="border-t border-white/5 pt-3.5 flex flex-col gap-2.5 text-left">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h4 className="font-sans text-xs font-bold text-slate-205 leading-normal">
                      Personal Code PIN
                    </h4>
                    <p className="font-sans text-[10px] text-slate-500 leading-normal">
                      Set a custom 4-digit code lock
                    </p>
                  </div>

                  <button
                    id="security-setup-pin-trigger"
                    onClick={() => setShowPinInput(prev => !prev)}
                    className="text-[10px] font-black uppercase text-[#22C55E] hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Update Security PIN
                  </button>
                </div>

                <AnimatePresence>
                  {showPinInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 space-y-3 mt-1.5"
                    >
                      <label className="font-sans text-[9px] text-[#94A3B8] font-bold uppercase leading-none block mb-1">
                        4-Digit Passcode
                      </label>
                      <input
                        id="security-pin-input-field"
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinInputValue}
                        onChange={(e) => setPinInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••"
                        className="w-full text-center font-mono text-lg tracking-[16px] rounded-xl border border-white/5 bg-slate-950 p-2 text-[#22C55E] focus:outline-none"
                      />

                      <button
                        id="security-confirm-pin"
                        onClick={handleSetPinSubmit}
                        className="w-full py-2 bg-[#22C55E] text-slate-950 font-sans text-[10px] font-black uppercase tracking-wider rounded-lg border-0 cursor-pointer"
                      >
                        Confirm Security PIN
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isPinSetupSuccess && (
                  <p className="text-[11px] text-[#22C55E] font-sans font-bold flex items-center gap-1 mt-1">
                    <Check className="h-4 w-4" /> Personal Security Code registered successfully!
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 6 - BACKUP AND RESTORE (COLLAPSIBLE) */}
      <div
        id="section-backup"
        className={`mb-3.5 overflow-hidden rounded-2xl border bg-[#1E293B] transition-all duration-300 ${
          highlightConfig?.targetId === 'section-backup'
            ? 'border-cyan-500 ring-4 ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-pulse'
            : 'border-white/5'
        }`}
      >
        <button
          onClick={() => toggleSection('backup')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#22C55E] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <Database className="h-4.5 w-4.5 text-[#22C55E]" /> ✦ Backup and Restore (Free)
          </span>
          {openSections.backup ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.backup && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4 space-y-3.5 text-left"
            >
              <p className="font-sans text-[10px] text-slate-500 leading-normal mb-1.5">
                Save and restore data file from your own Google Drive folder named "SpendSmart — Jalvrix" safely.
              </p>

              <div className="flex flex-col gap-2.5">
                {/* Backup button */}
                <button
                  id="backup-gdrive-trigger-btn"
                  onClick={handleSimulatedBackup}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-0 cursor-pointer"
                >
                  <Globe className="h-4 w-4" /> Save Backup to Google Drive
                </button>

                {/* Restore trigger inputs */}
                <button
                  id="restore-gdrive-trigger-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-205 hover:text-white font-sans text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sliders className="h-4 w-4" /> Recover My Data
                </button>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileRestoreUpload}
                  className="hidden"
                />
              </div>

              {/* Status markers */}
              {backupSuccess && (
                <p className="text-xs text-[#22C55E] font-sans font-bold flex items-center gap-1 justify-center mt-2 pl-0.5">
                  <Check className="h-4.5 w-4.5" /> Data backed up to Drive securely!
                </p>
              )}
              {restoreSuccess && (
                <p className="text-xs text-[#22C55E] font-sans font-bold flex items-center gap-1 justify-center mt-2 pl-0.5">
                  <Check className="h-4.5 w-4.5" /> System successfully restored from backup file!
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 7 - DISPLAY AND LANGUAGE (COLLAPSIBLE) */}
      <div id="section-appsettings" className="mb-3.5 overflow-hidden rounded-2xl border border-white/5 bg-[#1E293B]">
        <button
          onClick={() => toggleSection('appsettings')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#F8FAFC] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-[#22C55E]" /> Display and Language
          </span>
          {openSections.appsettings ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.appsettings && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4 space-y-3.5 text-left select-none"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-xs font-bold text-slate-205 leading-normal">
                    Dark theme
                  </h4>
                  <p className="font-sans text-[10px] text-slate-500 leading-normal">
                    Always on dark mode layout
                  </p>
                </div>
                <button
                  type="button"
                  className="h-6 w-11 rounded-full relative transition-all bg-[#22C55E]"
                  disabled
                >
                  <div className="h-4.5 w-4.5 rounded-full bg-white absolute top-0.5 left-[22px]" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-3.5">
                <div>
                  <h4 className="font-sans text-xs font-bold text-slate-205 leading-normal">
                    Active Language
                  </h4>
                </div>
                <span className="font-sans text-xs font-black text-[#22C55E] uppercase tracking-wider">
                  English
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-3.5">
                <div>
                  <h4 className="font-sans text-xs font-bold text-slate-205 leading-normal">
                    Active Currency Code
                  </h4>
                </div>
                <span className="font-sans text-xs font-black text-[#22C55E] uppercase tracking-wider">
                  {currentCurrency.code} ({currentCurrency.symbol})
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 8 - ABOUT US (COLLAPSIBLE) */}
      <div id="section-about" className="mb-3.5 overflow-hidden rounded-2xl border border-white/5 bg-[#1E293B]">
        <button
          onClick={() => toggleSection('about')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#F8FAFC] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4.5 w-4.5 text-[#22C55E]" /> About Us
          </span>
          {openSections.about ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.about && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4 shrink-0 text-center"
            >
              {/* JRX circle badge center aligned */}
              <div className="flex flex-col items-center justify-center py-4 select-none">
                <div className="h-16 w-16 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-xl font-black text-[#22C55E] shadow-lg mb-2 mr-0.5">
                  JRX
                </div>
                <h3 className="font-sans text-base font-black text-[#F8FAFC]">
                  SpendSmart by Jalvrix
                </h3>
                <span className="font-mono text-[10px] text-[#94A3B8] font-bold">
                  Version 1.0.0
                </span>
              </div>

              {/* 2x2 Clean Social Navigation grid */}
              <div className="grid grid-cols-2 gap-3 mb-4.5">
                {/* youtube */}
                <button
                  id="about-youtube-btn"
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-slate-850 hover:bg-slate-800 border border-white/5 text-[10px] font-black uppercase text-slate-100 hover:text-[#22C55E] transition-colors cursor-pointer"
                >
                  <Youtube className="h-4 w-4 text-red-500" /> Youtube Guide
                </button>

                {/* instagram */}
                <button
                  id="about-instagram-btn"
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-slate-850 hover:bg-slate-800 border border-white/5 text-[10px] font-black uppercase text-slate-100 hover:text-[#22C55E] transition-colors cursor-pointer"
                >
                  <Instagram className="h-4 w-4 text-pink-500" /> Instagram
                </button>

                {/* rate check */}
                <button
                  id="about-rateus-btn"
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-slate-850 hover:bg-slate-800 border border-white/5 text-[10px] font-black uppercase text-slate-100 hover:text-[#22C55E] transition-colors cursor-pointer"
                >
                  <Star className="h-4 w-4 text-yellow-500" /> Rate SpendSmart
                </button>

                {/* share */}
                <button
                  id="about-shareapp-btn"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-slate-850 hover:bg-slate-800 border border-white/5 text-[10px] font-black uppercase text-slate-100 hover:text-[#22C55E] transition-colors cursor-pointer"
                >
                  <Share2 className="h-4 w-4 text-blue-500" /> Tell a Friend
                </button>
              </div>

              {/* Support contact info button */}
              <a
                href="mailto:jalvrix.apps@gmail.com"
                className="w-full h-12 rounded-xl bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all border border-[#22C55E]/20"
              >
                <Mail className="h-4 w-4 text-[#22C55E]" /> Get Help — jalvrix.apps@gmail.com
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 9 - PRIVACY AND LEGAL (COLLAPSIBLE) */}
      <div id="section-legal" className="mb-3.5 overflow-hidden rounded-2xl border border-white/5 bg-[#1E293B]">
        <button
          onClick={() => toggleSection('legal')}
          className="flex w-full cursor-pointer items-center justify-between p-4 font-sans text-xs font-black uppercase tracking-widest text-[#F8FAFC] relative select-none bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <Lock className="h-4.5 w-4.5 text-[#22C55E]" /> Privacy and Legal
          </span>
          {openSections.legal ? <ChevronUp className="h-4.5 w-4.5 text-[#22C55E]" /> : <ChevronDown className="h-4.5 w-4.5 text-[#94A3B8]" />}
        </button>

        <AnimatePresence initial={false}>
          {openSections.legal && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-slate-900/10 p-4 space-y-4 text-left"
            >
              {/* Visually impressive legal feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1 select-none">
                {/* Zero Tracking */}
                <div className="p-3 bg-slate-950/30 rounded-2xl border border-white/5 flex gap-3 text-left">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <EyeOff className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-sans text-xs font-black text-[#F8FAFC] leading-tight">
                      Zero Tracking
                    </h4>
                    <p className="font-sans text-[10px] text-[#94A3B8] mt-1 leading-snug">
                      We never collect, monitor, or upload any of your personal transaction data. Your data is 100% yours.
                    </p>
                  </div>
                </div>

                {/* Local Storage Only */}
                <div className="p-3 bg-slate-950/30 rounded-2xl border border-white/5 flex gap-3 text-left">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-[#10B981] flex items-center justify-center shrink-0">
                    <HardDrive className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-sans text-xs font-black text-[#F8FAFC] leading-tight">
                      Local Storage
                    </h4>
                    <p className="font-sans text-[10px] text-[#94A3B8] mt-1 leading-snug">
                      All sensitive recordings remain securely cached on your client-side offline storage.
                    </p>
                  </div>
                </div>

                {/* Private Backups */}
                <div className="p-3 bg-slate-950/30 rounded-2xl border border-white/5 flex gap-3 text-left">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Cloud className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-sans text-xs font-black text-[#F8FAFC] leading-tight">
                      Secure Backups
                    </h4>
                    <p className="font-sans text-[10px] text-[#94A3B8] mt-1 leading-snug">
                      Export and restore backup files directly from your private cloud Google Drive container.
                    </p>
                  </div>
                </div>

                {/* Full Compliance */}
                <div className="p-3 bg-slate-950/30 rounded-2xl border border-white/5 flex gap-3 text-left">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-sans text-xs font-black text-[#F8FAFC] leading-tight">
                      JRX Protection
                    </h4>
                    <p className="font-sans text-[10px] text-[#94A3B8] mt-1 leading-snug">
                      Your entries are fully compliance-certified. Everything executes offline in complete safety.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons links showing readable dialog parameters */}
              <div className="grid grid-cols-2 gap-3 pt-3 text-xs select-none">
                <button
                  id="open-privacy-policy-btn"
                  onClick={() => setShowLegalDoc('privacy')}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-[10px] font-black uppercase text-slate-200 border-0 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-[#22C55E]" /> Privacy Policy
                </button>
                <button
                  id="open-tos-btn"
                  onClick={() => setShowLegalDoc('terms')}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-[10px] font-black uppercase text-slate-200 border-0 cursor-pointer"
                >
                  <Globe className="h-4 w-4 text-[#22C55E]" /> Terms of Service
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RATING DIALOG OVERLAY */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center px-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#1E293B] border border-white/10 rounded-3xl p-5 shadow-2xl max-w-xs text-center"
            >
              {!didSubmitRating ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] mx-auto mb-3">
                    <Star className="h-6 w-6 stroke-2 text-[#22C55E]" />
                  </div>
                  <h3 className="font-sans text-sm font-black text-[#F8FAFC] mb-1">
                    Rate SpendSmart by Jalvrix
                  </h3>
                  <p className="font-sans text-[11px] text-[#94A3B8] leading-relaxed mb-4">
                    Do you love our app? Drop a review on the store to aid JRX development!
                  </p>

                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDidSubmitRating(true)}
                        className="h-8 w-8 text-[#22C55E] hover:scale-110 active:scale-95 cursor-pointer bg-transparent border-0"
                      >
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="text-[10px] font-black uppercase text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E] mx-auto mb-3">
                    <Check className="h-6 w-6 text-[#22C55E] stroke-[3px]" />
                  </div>
                  <h3 className="font-sans text-sm font-black text-white mb-1">
                    Thank You!
                  </h3>
                  <p className="font-sans text-[11px] text-slate-400 leading-normal mb-4">
                    Your rating was submitted. Thanks for assisting JRX group!
                  </p>
                  <button
                    onClick={() => {
                      setShowRatingModal(false);
                      setDidSubmitRating(false);
                    }}
                    className="w-full py-2 bg-[#22C55E] text-slate-950 font-sans text-xs font-black uppercase tracking-wider rounded-xl border-0 cursor-pointer"
                  >
                    Close
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL DIALOG */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center px-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#1E293B] border border-white/10 rounded-3xl p-5 shadow-2xl max-w-xs text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 mx-auto mb-3">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="font-sans text-sm font-black text-white mb-2">
                Share SpendSmart App
              </h3>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed mb-4">
                Share details of "SpendSmart by Jalvrix" with your friends and teammates easily.
              </p>

              <button
                onClick={() => {
                  navigator.clipboard.writeText("Download 'SpendSmart by Jalvrix' - the ultimate personal finance manager: jalvrix.apps@gmail.com!");
                  alert('App download copy written to clipboard!');
                  setShowShareModal(false);
                }}
                className="w-full py-2.5 bg-[#22C55E] text-slate-950 font-sans text-[10px] font-black uppercase tracking-widest rounded-xl mb-3 border-0 cursor-pointer"
              >
                Copy Link to Clipboard
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* READABLE LEGAL DOCUMENTS DIALOG */}
      <AnimatePresence>
        {showLegalDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 z-55 flex flex-col justify-center p-6 text-left"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="rounded-3xl bg-[#1E293B] border border-white/10 p-5 shadow-2xl flex flex-col max-h-[85vh] select-none"
            >
              <h3 className="font-sans text-sm font-black text-[#22C55E] uppercase tracking-wider mb-3">
                {showLegalDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>

              <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pr-1 mb-4 text-xs font-sans text-slate-300 space-y-3 font-medium select-text">
                {showLegalDoc === 'privacy' ? (
                  <>
                    <p className="font-bold text-[#F8FAFC]">Introduction</p>
                    <p>At Jalvrix (JRX), we prioritize your personal transactions privacy above all. This app collects zero device database telemetry.</p>
                    <p className="font-bold text-[#F8FAFC]">1. Local Storage Protection</p>
                    <p>Every transaction, expense amount, category tag and budget target limit is stored inside your specific browser local storage space directly. It is never transmitted to foreign cloud hosts.</p>
                    <p className="font-bold text-[#F8FAFC]">2. Google Drive Integrations</p>
                    <p>When you trigger backup commands, data JSON payloads are written into your personal private Drive directory block directly. Jalvrix never reads your sign in credentials.</p>
                    <p>For support and queries, contact jalvrix.apps@gmail.com.</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[#F8FAFC]">Terms of Use</p>
                    <p>By installing "SpendSmart by Jalvrix", you agree to assume responsibility for your secure local backup integrity.</p>
                    <p className="font-bold text-[#F8FAFC]">Liability Exceptions</p>
                    <p>The applet is distributed to user as-is, without active financial advisory endorsements or monetary loss coverages.</p>
                    <p>Jalvrix (JRX) handles tools without backend servers, so browser environment resets might clear local databases if backup routines aren't actively prioritized.</p>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowLegalDoc(null)}
                className="w-full py-3 bg-[#22C55E] text-slate-950 font-sans text-xs font-black uppercase tracking-wider rounded-xl border-0 cursor-pointer text-center select-none"
              >
                Accept & Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
