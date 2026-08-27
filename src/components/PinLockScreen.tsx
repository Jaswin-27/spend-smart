/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, Unlock } from 'lucide-react';

interface PinLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ correctPin, onUnlock }) => {
  const [typedPin, setTypedPin] = useState('');
  const [isError, setIsError] = useState(false);

  const handleNumClick = (num: string) => {
    if (isError) {
      setIsError(false);
      setTypedPin(num);
      return;
    }

    if (typedPin.length >= 4) return;

    const nextPin = typedPin + num;
    setTypedPin(nextPin);

    if (nextPin.length === 4) {
      if (nextPin === correctPin) {
        setTimeout(() => {
          onUnlock();
        }, 300);
      } else {
        setTimeout(() => {
          setIsError(true);
          // Auto clear with a slight shake
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    if (isError) {
      setIsError(false);
      setTypedPin('');
      return;
    }
    setTypedPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setTypedPin('');
    setIsError(false);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <div className="absolute inset-0 bg-[#0F172A] z-50 flex flex-col items-center justify-between p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Lock Shield Circle */}
        <motion.div
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`relative mb-8 flex h-20 w-20 items-center justify-center rounded-full border transition-all ${
            isError
              ? 'bg-red-500/10 border-red-500/40 text-red-550'
              : typedPin.length === 4 && typedPin === correctPin
              ? 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E]'
              : 'bg-slate-800 border-white/5 text-[#22C55E] shadow-2xl'
          }`}
        >
          {typedPin.length === 4 && typedPin === correctPin ? (
            <Unlock className="h-9 w-9 animate-bounce" />
          ) : (
            <Lock className="h-9 w-9" />
          )}
        </motion.div>

        <h2 className="font-sans text-xl font-extrabold text-white mb-1">
          Lockscreen Active
        </h2>
        <p className="font-sans text-xs text-slate-400 mb-6 font-medium">
          Enter 4-digit PIN to Unlock
        </p>

        {/* PIN Indicators display */}
        <div className="flex justify-center gap-4.5 mb-8">
          {[0, 1, 2, 3].map((idx) => {
            const hasDigit = typedPin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={isError ? { scale: [1, 1.2, 1] } : {}}
                className={`h-4 w-4 rounded-full border transition-all duration-150 ${
                  isError
                    ? 'bg-red-500 border-transparent shadow-[#EF4444]/20'
                    : hasDigit
                    ? 'bg-[#22C55E] border-transparent shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                    : 'bg-transparent border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {isError && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-xs font-bold text-red-550 mb-4 text-center leading-none"
          >
            Incorrect PIN code. Try again!
          </motion.p>
        )}
      </div>

      {/* On-screen Keypad Panel */}
      <div className="w-full max-w-xs mx-auto grid grid-cols-3 gap-3 mb-6 shrink-0">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === '⌫') handleBackspace();
              else if (key === 'C') handleClear();
              else handleNumClick(key);
            }}
            className="flex h-14 cursor-pointer items-center justify-center rounded-2xl bg-slate-800/40 border border-white/5 text-lg font-bold hover:bg-slate-705 active:bg-slate-800/40 font-mono text-slate-205 py-2 select-none"
          >
            {key === '⌫' ? (
              <Delete className="h-5 w-5 text-red-405" />
            ) : (
              <span className={key === 'C' ? 'text-slate-500 font-medium' : ''}>{key}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
