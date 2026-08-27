/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Tag, FileText, CheckCircle, Delete, Trash2, Plus, X, Check } from 'lucide-react';
import { CurrencyInfo, Expense } from '../types';
import { CategoryIcon, ICON_CATALOG } from './CategoryIcon';

interface AddExpenseViewProps {
  currentCurrency: CurrencyInfo;
  customCategories: Array<{ name: string; color: string; iconName: string }>;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  onAddCustomCategory: (name: string, iconName: string, color: string) => void;
  onBack: () => void;
  highlightConfig?: {
    targetId: string | null;
    color: string;
  };
}

export const AddExpenseView: React.FC<AddExpenseViewProps> = ({
  currentCurrency,
  customCategories,
  onSaveExpense,
  onAddCustomCategory,
  onBack,
  highlightConfig,
}) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<string>('Food');
  const [note, setNote] = useState<string>('');
  const [showExtraFields, setShowExtraFields] = useState<boolean>(false);
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Success indicator overlay
  const [showLocalSuccess, setShowLocalSuccess] = useState(false);

  // Custom Category dialog state
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Coffee');
  const [newCatColor, setNewCatColor] = useState('#22C55E'); // Default to green

  // Pre-defined slate of colors for selection
  const COLOR_PALETTE = [
    '#22C55E', // Green
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#F43F5E', // Rose
  ];

  // Specific standard categories defined as requested by user
  const standardCategories = [
    { name: 'Food', color: '#22C55E', iconName: 'Utensils' },
    { name: 'Transport', color: '#3B82F6', iconName: 'Car' },
    { name: 'Shopping', color: '#EC4899', iconName: 'ShoppingBag' },
    { name: 'Bills', color: '#F59E0B', iconName: 'Receipt' },
    { name: 'Entertainment', color: '#8B5CF6', iconName: 'Gamepad2' },
    { name: 'Health', color: '#EF4444', iconName: 'Heart' },
    { name: 'Savings', color: '#14B8A6', iconName: 'PiggyBank' },
    { name: 'Other', color: '#94A3B8', iconName: 'Package' },
  ];

  const combinedCategories = [
    ...standardCategories,
    ...customCategories,
  ];

  // Handle keypad values click
  const handleKeyPress = (val: string) => {
    if (val === '⌫') {
      if (amountStr.length <= 1) {
        setAmountStr('0');
      } else {
        setAmountStr(amountStr.slice(0, -1));
      }
      return;
    }

    if (val === '.') {
      if (amountStr.includes('.')) return;
      setAmountStr(amountStr + '.');
      return;
    }

    if (amountStr === '0') {
      if (val === '0') return;
      setAmountStr(val);
    } else {
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length >= 2) return; // Limit decimals
      if (amountStr.replace('.', '').length >= 9) return;
      setAmountStr(amountStr + val);
    }
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amountStr);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Please enter a valid expense amount!');
      return;
    }

    // Save
    onSaveExpense({
      amount: parsedAmount,
      category: selectedCategory,
      note: note.trim(),
      date: date || new Date().toISOString().split('T')[0],
    });

    // Success transition locally as requested:
    // "After saving: brief green checkmark, clear amount to zero, keep category selected, stay on Add Expense screen, close manually with X button."
    setShowLocalSuccess(true);
    setTimeout(() => {
      setShowLocalSuccess(false);
      setAmountStr('0');
      setNote('');
      setShowExtraFields(false);
    }, 1200);
  };

  const handleCreateCustomCategory = () => {
    if (!newCatName.trim()) {
      alert('Please enter a category name!');
      return;
    }

    // Check for duplicate category name
    const matches = combinedCategories.some(
      (c) => c.name.toLowerCase() === newCatName.trim().toLowerCase()
    );
    if (matches) {
      alert('A category with this name already exists!');
      return;
    }

    onAddCustomCategory(newCatName.trim(), newCatIcon, newCatColor);
    setSelectedCategory(newCatName.trim());
    
    // Reset states
    setNewCatName('');
    setNewCatIcon('Coffee');
    setNewCatColor('#22C55E');
    setIsNewCategoryOpen(false);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  return (
    <div id="add-expense-container" className="flex flex-col flex-1 px-4 pt-4 pb-24 text-white overflow-y-auto no-scrollbar bg-[#0F172A] text-left relative">
      {/* Centered title & X close button on far right as requested */}
      <div className="flex items-center justify-between mb-4.5 relative select-none">
        <div className="w-10 h-10" /> {/* Left Spacer to perfectly center */}
        
        <h1 className="font-sans text-base font-black text-white text-center flex-1">
          Add Expense
        </h1>

        <button
          id="close-add-expense-sheet-btn"
          onClick={onBack}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-800/65 border border-white/5 hover:bg-slate-700/65"
        >
          <X className="h-5 w-5 text-slate-300" />
        </button>
      </div>

      {/* Amount Display with Currency on left and subtle Trash on far right */}
      <div className="flex flex-col items-center justify-center py-5 bg-[#1E293B] rounded-3xl border border-white/5 mb-4 relative overflow-hidden select-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#22C55E]" />
        
        {/* Subtle trash icon on far right to clear amount only */}
        <button
          id="clear-amount-pad-btn2"
          type="button"
          onClick={() => setAmountStr('0')}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer border-0"
          title="Clear typed amount to zero"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <span className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1">
          Transacted Amount
        </span>
        <div className="flex items-baseline justify-center gap-1 max-w-full px-4 overflow-hidden">
          <span className="font-sans text-2xl font-black text-[#22C55E]">
            {currentCurrency.symbol}
          </span>
          <h2 className="font-sans text-3.5xl font-black text-white whitespace-nowrap truncate leading-none">
            {amountStr}
          </h2>
        </div>
      </div>

      {/* Horizontal Category Selector with custom category add */}
      <div id="add-category-row" className="mb-4 select-none">
        <span className="flex items-center gap-1.5 font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-2.5">
          <Tag className="h-3.5 w-3.5 text-[#22C55E]" /> Select Category
        </span>
        
        <div className="flex gap-2.5 overflow-x-auto pb-2.5 no-scrollbar scroll-smooth">
          {combinedCategories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                id={`add-expense-cat-${cat.name.toLowerCase()}`}
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex cursor-pointer items-center gap-1.5 shrink-0 rounded-2xl px-3.5 py-3 border font-sans text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#22C55E] border-transparent text-slate-950 shadow-md shadow-[#22C55E]/15 scale-[1.03]'
                    : 'bg-[#1E293B] border-white/5 text-slate-350 hover:bg-slate-800'
                }`}
              >
                <CategoryIcon
                  categoryName={cat.name}
                  iconName={cat.iconName}
                  className="h-4 w-4"
                />
                {cat.name}
              </button>
            );
          })}

          {/* Special Custom Category creation triggering icon */}
          <button
            id="add-expense-custom-trigger"
            onClick={() => setIsNewCategoryOpen(true)}
            className={`flex cursor-pointer items-center gap-1.5 shrink-0 rounded-2xl px-3.5 py-3 border transition-all ${
              highlightConfig?.targetId === 'add-category-row'
                ? 'border-[#22C55E] bg-[#22C55E]/20 text-[#22C55E] ring-4 ring-[#22C55E]/40 animate-pulse scale-[1.08]'
                : 'border-[#22C55E]/20 bg-[#22C55E]/5 text-[#22C55E] hover:bg-[#22C55E]/10'
            } font-bold font-sans text-xs`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapsed input fields for notes and custom log date */}
      {!showExtraFields ? (
        <button
          id="toggle-extra-add-note-fields"
          type="button"
          onClick={() => setShowExtraFields(true)}
          className="w-fit text-left font-sans text-xs font-bold text-[#22C55E] hover:underline cursor-pointer flex items-center mb-4 pl-1"
        >
          + Add note or change date
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3.5 mb-4 select-none"
        >
          <div className="text-left">
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1.5 block">
              <FileText className="h-3.5 w-3.5 text-[#22C55E]" /> Reference Note (Optional)
            </span>
            <input
              id="expense-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={40}
              placeholder="What did you buy?"
              className="w-full font-sans text-xs rounded-xl border border-white/5 bg-[#1E293B] p-3 text-slate-205 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="text-left">
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1.5 block">
              <Calendar className="h-3.5 w-3.5 text-[#22C55E]" /> Log Date
            </span>
            <input
              id="expense-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-sans text-xs rounded-xl border border-white/5 bg-[#1E293B] p-3 text-slate-205 focus:outline-none"
            />
          </div>
        </motion.div>
      )}

      {/* Number Keypad section */}
      <div className="mb-4 grid grid-cols-3 gap-2.5 select-none">
        {keys.map((key, idx) => (
          <button
            id={`keypad-digit-${key === '⌫' ? 'delete' : key === '.' ? 'dot' : key}`}
            key={idx}
            type="button"
            onClick={() => handleKeyPress(key)}
            className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[#1E293B] border border-white/5 text-base font-black hover:bg-slate-850 active:bg-[#1E293B] font-mono text-slate-200"
          >
            {key === '⌫' ? <Delete className="h-4 w-4 text-red-500" /> : key}
          </button>
        ))}
      </div>

      {/* Primary save button styled with premium glow */}
      <button
        id="save-expense-sheet-primary-btn"
        onClick={handleSave}
        className="w-full h-13 flex items-center justify-center gap-2 rounded-xl bg-[#22C55E] text-slate-950 text-xs font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(34,197,94,0.2)] hover:bg-[#22C55E]/90 active:scale-[0.98] cursor-pointer shrink-0 border-0 mt-auto select-none"
      >
        <CheckCircle className="h-4.5 w-4.5" />
        Save Expense
      </button>

      {/* SUCCESS POPUP TRANSITIONAL CARD */}
      <AnimatePresence>
        {showLocalSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl z-40 select-none px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#22C55E] mb-3.5"
            >
              <Check className="h-8 w-8 stroke-[3.5px]" />
            </motion.div>
            <p className="font-sans text-sm font-black text-white">
              Expense Logged!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM CATEGORY CREATION OVERLAY */}
      <AnimatePresence>
        {isNewCategoryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F172A]/95 z-45 flex flex-col justify-center p-6 text-left rounded-3xl select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="rounded-3xl bg-[#1E293B] border border-white/10 p-5 shadow-2xl overflow-y-auto no-scrollbar max-h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-sans text-xs font-black text-[#22C55E] uppercase tracking-widest">
                  Create Custom Category
                </span>
                <button
                  id="close-custom-cat-dialog-btn"
                  onClick={() => setIsNewCategoryOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Input details form */}
              <div className="space-y-4">
                <div>
                  <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1.5 block">
                    Category Name
                  </label>
                  <input
                    id="new-cat-name-input-val"
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    maxLength={15}
                    placeholder="E.g. Coffee"
                    className="w-full font-sans text-xs rounded-xl border border-white/5 bg-[#0F172A] p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#22C55E]/40"
                  />
                </div>

                {/* Color Selection Palette Grid */}
                <div>
                  <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-2 block">
                    Tag Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={`h-7 w-7 rounded-full transition-transform active:scale-90 relative cursor-pointer border-0 ${
                          newCatColor === color ? 'scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {newCatColor === color && (
                          <span className="absolute inset-0 flex items-center justify-center text-slate-950 font-bold text-xs">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symbol Library Grid from Catalog */}
                <div>
                  <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-2 block">
                    Select Icon Symbol
                  </label>
                  
                  <div className="grid grid-cols-6 gap-2 bg-[#0F172A] p-2 rounded-xl max-h-[160px] overflow-y-auto no-scrollbar border border-white/5">
                    {ICON_CATALOG.map((item) => {
                      const IconComponent = item.component;
                      const isSelected = newCatIcon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setNewCatIcon(item.name)}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all bg-transparent border-0 cursor-pointer ${
                            isSelected
                              ? 'bg-[#22C55E]/20 text-[#22C55E] scale-105 border border-[#22C55E]/30'
                              : 'text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <IconComponent className="h-4.5 w-4.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm Apply Category Button */}
                <button
                  id="submit-register-custom-category-btn"
                  type="button"
                  onClick={handleCreateCustomCategory}
                  className="w-full py-3 bg-[#22C55E] hover:bg-[#22C55E]/90 text-slate-950 font-sans text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-md focus:outline-none mt-3 border-0 cursor-pointer animate-pulse"
                >
                  Save Custom Category
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
