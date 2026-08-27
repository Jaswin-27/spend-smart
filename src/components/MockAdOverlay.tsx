/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, X, Gift, CheckCircle } from 'lucide-react';

interface MockAdOverlayProps {
  isOpen: boolean;
  onAdComplete: () => void;
  onClose: () => void;
}

export const MockAdOverlay: React.FC<MockAdOverlayProps> = ({
  isOpen,
  onAdComplete,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [adFinished, setAdFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(5);
      setAdFinished(false);
      return;
    }

    setTimeLeft(5);
    setAdFinished(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClaim = () => {
    onAdComplete();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex h-full max-h-[550px] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#0B1220] p-6 text-white shadow-2xl"
          >
            {/* Top Close Button (only after ad finishes or a skip placeholder) */}
            <div className="absolute top-4 right-4 z-10">
              {adFinished ? (
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="rounded-full bg-slate-900/80 px-3 py-1 font-mono text-xs font-semibold text-slate-400">
                  Ad closes in {timeLeft}s
                </div>
              )}
            </div>

            {/* Ad Content */}
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              {/* App Icon Placeholder */}
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-green-600 shadow-lg shadow-green-900/30">
                <span className="font-sans text-xl font-bold text-white">JRX</span>
              </div>

              <span className="mb-1 rounded-full bg-emerald-500/10 px-3 py-1 font-sans text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                Sponsor Spotlight
              </span>

              <h2 className="mb-2 font-sans text-2xl font-black tracking-tight text-white">
                Jalvrix Premium Space
              </h2>

              <p className="mb-6 max-w-[260px] font-sans text-xs text-slate-400 leading-normal">
                Unlock double categories, advanced CSV/PDF reporting, unlimited cloud backup, and safe device sync instantly!
              </p>

              {/* Progress Bar */}
              <div className="mb-8 w-full max-w-[200px]">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: adFinished ? '100%' : `${((5 - timeLeft) / 5) * 100}%` }}
                    transition={{ ease: "linear", duration: timeLeft === 5 ? 0 : 1 }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>

              {/* Promo Card Layout */}
              <div className="relative mb-6 w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-bold text-slate-200">SpendSmart Gold Elite</h4>
                    <p className="font-sans text-[10px] text-slate-400">Only $1.99/mo to support local apps.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-auto">
              {adFinished ? (
                <button
                  onClick={handleClaim}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-sans text-sm font-semibold text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:bg-emerald-600"
                >
                  <Gift className="h-4 w-4" />
                  Claim Reward & Export CSV
                </button>
              ) : (
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3.5 font-sans text-sm font-semibold text-slate-500"
                >
                  <Play className="h-4 w-4 animate-pulse" />
                  Watching Ad to Unlock... ({timeLeft}s)
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
