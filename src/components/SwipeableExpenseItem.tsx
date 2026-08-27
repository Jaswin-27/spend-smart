/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { Expense, CATEGORIES } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface SwipeableExpenseItemProps {
  expense: Expense;
  currencySymbol: string;
  onDeleteRequest: (expense: Expense) => void;
}

export const SwipeableExpenseItem: React.FC<SwipeableExpenseItemProps> = ({
  expense,
  currencySymbol,
  onDeleteRequest,
}) => {
  const controls = useAnimation();
  const [isSlid, setIsSlid] = useState(false);

  // Match category to its emoji and color
  const matchedCategory = CATEGORIES.find(c => c.name === expense.category) || {
    emoji: '📦',
    color: '#6B7280',
    name: 'Other'
  };

  const handleDragEnd = async (_event: any, info: any) => {
    // If slid left beyond threshold, trigger delete request
    if (info.offset.x < -60) {
      // Trigger deletion request
      onDeleteRequest(expense);
      // Reset position
      controls.start({ x: 0 });
      setIsSlid(false);
    } else if (info.offset.x < -20) {
      // Keep it open/revealed a bit
      controls.start({ x: -60 });
      setIsSlid(true);
    } else {
      controls.start({ x: 0 });
      setIsSlid(false);
    }
  };

  // Convert time or show date nicely
  const getFormattedTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl bg-slate-850/80 active:scale-[0.99] transition-transform">
      {/* Background delete action layer */}
      <div className="absolute inset-0 flex items-center justify-end bg-red-600/95 pr-5 rounded-2xl">
        <div className="flex flex-col items-center text-white">
          <Trash2 className="h-5 w-5 animate-pulse" />
          <span className="font-sans text-[9px] font-bold mt-0.5 uppercase tracking-wider">Delete</span>
        </div>
      </div>

      {/* Swipeable Foreground content drawer */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        animate={controls}
        onDragEnd={handleDragEnd}
        className="relative flex cursor-grab items-center justify-between bg-slate-900/90 p-4 active:cursor-grabbing border border-white/5 rounded-2xl shadow-lg"
      >
        <div className="flex items-center gap-3">
          {/* Category Icon Badge */}
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl shadow-inner"
            style={{ backgroundColor: `${matchedCategory.color}15`, color: matchedCategory.color }}
          >
            <CategoryIcon categoryName={expense.category} className="h-5 w-5" />
          </div>

          <div className="text-left">
            <h4 className="font-sans text-sm font-bold text-slate-100">
              {expense.category}
            </h4>
            <p className="max-w-[150px] truncate font-sans text-xs text-slate-400">
              {expense.note || <span className="italic text-slate-500 text-[10px]">No note</span>}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-sm font-extrabold text-[#22C55E]">
            -{currencySymbol}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="font-sans text-[10px] text-slate-500 font-medium">
            {getFormattedTime(expense.timestamp)}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
