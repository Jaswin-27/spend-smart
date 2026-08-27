/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface CustomConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomConfirm: React.FC<CustomConfirmProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-sans text-lg font-semibold tracking-wide text-slate-150">
                {title}
              </h3>
            </div>

            <p className="mb-6 font-sans text-sm text-slate-300 leading-relaxed">
              {message}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 cursor-pointer rounded-xl bg-slate-800 py-3 font-sans text-sm font-medium text-slate-300 hover:bg-slate-750 active:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                }}
                className="flex-1 cursor-pointer rounded-xl bg-red-600 py-3 font-sans text-sm font-medium text-white hover:bg-red-500 active:bg-red-700 shadow-md shadow-red-900/10"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
