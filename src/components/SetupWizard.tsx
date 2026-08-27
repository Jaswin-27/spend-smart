/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Fingerprint, Lock, Check } from 'lucide-react';

interface SetupWizardProps {
  onComplete: (data: {
    userName: string;
    userEmail: string;
    monthlyIncome: number;
    currencyCode: string;
    securityType: 'fingerprint' | 'pin' | 'none';
    pinCode: string;
  }) => void;
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

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [incomeStr, setIncomeStr] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [securityType, setSecurityType] = useState<'fingerprint' | 'pin' | 'none'>('none');
  const [pin, setPin] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showFingerprintSimulation, setShowFingerprintSimulation] = useState(false);

  const activeCurrencySymbol = TARGET_CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '₹';

  const handleNextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
  };

  const handleSkipProfile = () => {
    setName('');
    setEmail('');
    setStep(3);
  };

  const handleSkipIncome = () => {
    setIncomeStr('');
    setStep(4);
  };

  const handleSelectFingerprint = () => {
    setSecurityType('fingerprint');
    setShowFingerprintSimulation(true);
    setTimeout(() => {
      setShowFingerprintSimulation(false);
      onComplete({
        userName: name.trim(),
        userEmail: email.trim(),
        monthlyIncome: parseFloat(incomeStr) || 0,
        currencyCode: selectedCurrency,
        securityType: 'fingerprint',
        pinCode: ''
      });
    }, 1500);
  };

  const handleSelectPinSetup = () => {
    setShowPinSetup(true);
  };

  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      return;
    }
    setSecurityType('pin');
    onComplete({
      userName: name.trim(),
      userEmail: email.trim(),
      monthlyIncome: parseFloat(incomeStr) || 0,
      currencyCode: selectedCurrency,
      securityType: 'pin',
      pinCode: pin
    });
  };

  const handleSkipSecurity = () => {
    onComplete({
      userName: name.trim(),
      userEmail: email.trim(),
      monthlyIncome: parseFloat(incomeStr) || 0,
      currencyCode: selectedCurrency,
      securityType: 'none',
      pinCode: ''
    });
  };

  const renderProgressDots = () => {
    return (
      <div className="flex justify-center gap-1.5 mb-6 pt-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === s ? 'w-6 bg-[#22C55E]' : 'w-1.5 bg-slate-700'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div id="setup-wizard-container" className="absolute inset-0 bg-[#0F172A] z-45 flex flex-col justify-between p-6">
      {/* Progress Dots at top */}
      {renderProgressDots()}

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <motion.div
              key="welcome-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center text-center py-4"
            >
              {/* JRX Logo in Green Circle */}
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E] text-[#22C55E] shadow-2xl shadow-[#22C55E]/10 select-none animate-pulse">
                <span className="font-sans text-2xl font-black tracking-wider">JRX</span>
              </div>

              <h1 className="font-sans text-3.5xl font-black text-white mb-2 tracking-tight">
                SpendSmart
              </h1>
              <p className="font-sans text-sm text-slate-400 max-w-[280px] mb-8 font-medium">
                Your personal finance tracker
              </p>
              <p className="font-sans text-xs text-slate-500 font-semibold uppercase tracking-widest mt-4">
                by Jalvrix
              </p>
            </motion.div>
          )}

          {/* STEP 2: YOUR PROFILE */}
          {step === 2 && (
            <motion.div
              key="profile-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col justify-center text-left"
            >
              <h2 className="font-sans text-2xl font-black text-[#F8FAFC] mb-1.5">
                Your Profile
              </h2>
              <p className="font-sans text-xs text-slate-400 mb-6 font-medium">
                Set up your personal workspace (both fields are skippable)
              </p>

              <div className="space-y-4">
                <div>
                  <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest block mb-1.5 pl-1">
                    What should we call you?
                  </label>
                  <input
                    id="name-input-field"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={20}
                    className="w-full font-sans text-sm rounded-2xl border border-white/10 bg-[#1E293B] p-4 text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#22C55E] focus:bg-slate-850/80 transition-colors"
                  />
                </div>

                <div>
                  <label className="font-sans text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest block mb-1.5 pl-1">
                    Email Address
                  </label>
                  <input
                    id="email-input-field"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full font-sans text-sm rounded-2xl border border-[#94A3B8]/20 bg-[#1E293B] p-4 text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#22C55E] focus:bg-slate-850/80 transition-colors"
                  />
                  <span className="font-sans text-[11px] text-slate-500 font-semibold pl-1 mt-2 block">
                    Used for backup and support only
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: MONTHLY INCOME */}
          {step === 3 && (
            <motion.div
              key="income-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col justify-center text-left"
            >
              <h2 className="font-sans text-2xl font-black text-[#F8FAFC] mb-1.5">
                What is your monthly income?
              </h2>
              <p className="font-sans text-xs text-slate-400 mb-6 font-medium">
                Helps track spending vs income
              </p>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-black text-[#94A3B8] text-lg select-none">
                  {activeCurrencySymbol}
                </span>
                <input
                  id="salary-input-field"
                  type="number"
                  inputMode="decimal"
                  value={incomeStr}
                  onChange={(e) => setIncomeStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 font-mono text-base rounded-2xl border border-white/10 bg-[#1E293B] p-4 text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#22C55E] focus:bg-slate-850/80 transition-colors"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 4: CURRENCY */}
          {step === 4 && (
            <motion.div
              key="currency-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col justify-center text-left"
            >
              <h2 className="font-sans text-2xl font-black text-[#F8FAFC] mb-1.5">
                Select your currency
              </h2>
              <p className="font-sans text-[11px] text-slate-400 mb-5 font-semibold">
                You can change this later in settings
              </p>

              {/* Currency grid */}
              <div className="grid grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar mb-4">
                {TARGET_CURRENCIES.map((c) => {
                  const isSelected = selectedCurrency === c.code;
                  return (
                    <button
                      id={`currency-btn-${c.code.toLowerCase()}`}
                      key={c.code}
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#22C55E] border-transparent text-slate-950 scale-[1.03] shadow-lg shadow-[#22C55E]/15'
                          : 'bg-[#1E293B] border-white/5 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono text-base font-black leading-none mb-1">
                        {c.symbol}
                      </span>
                      <span className="font-sans text-[11px] font-bold tracking-wide">
                        {c.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 5: SECURITY */}
          {step === 5 && (
            <motion.div
              key="security-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col justify-center text-center"
            >
              <h2 className="font-sans text-2xl font-black text-[#F8FAFC] mb-1.5">
                Secure your data
              </h2>
              <p className="font-sans text-xs text-slate-400 max-w-[280px] mx-auto mb-8 leading-normal font-medium">
                Optional but recommended
              </p>

              <AnimatePresence mode="wait">
                {!showPinSetup ? (
                  <div className="space-y-4 max-w-xs mx-auto w-full">
                    <button
                      id="use-fingerprint-btn"
                      onClick={handleSelectFingerprint}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#1E293B] border border-white/5 py-4 text-sm font-black font-sans text-white hover:bg-slate-800 active:scale-98 transition-all cursor-pointer shadow-lg"
                    >
                      <Fingerprint className="h-5 w-5 text-[#22C55E]" />
                      Use Fingerprint
                    </button>

                    <button
                      id="set-pin-btn"
                      onClick={handleSelectPinSetup}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#1E293B] border border-white/5 py-4 text-sm font-black font-sans text-white hover:bg-slate-800 active:scale-98 transition-all cursor-pointer shadow-lg"
                    >
                      <Lock className="h-5 w-5 text-[#22C55E]" />
                      Set 4-digit PIN
                    </button>
                  </div>
                ) : (
                  <motion.div
                    key="pin-entry"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 max-w-xs mx-auto w-full"
                  >
                    <p className="font-sans text-xs text-slate-400 font-bold mb-1">
                      Enter a 4-digit numeric code:
                    </p>
                    <input
                      id="security-pin-input"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="— — — —"
                      className="w-full text-center font-mono text-2xl tracking-[20px] rounded-2xl border border-white/10 bg-[#1E293B] p-4 text-[#22C55E] placeholder-slate-700 focus:outline-none focus:border-[#22C55E]"
                    />
                    
                    <button
                      id="confirm-pin-setup-btn"
                      onClick={handlePinSubmit}
                      disabled={pin.length !== 4}
                      className={`w-full py-3 rounded-2xl font-sans text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        pin.length === 4
                          ? 'bg-[#22C55E] text-slate-950 font-black hover:bg-[#22C55E]/90'
                          : 'bg-slate-800 text-slate-550 cursor-not-allowed'
                      }`}
                    >
                      Confirm Code & Finish
                    </button>
                    <button
                      id="cancel-pin-btn"
                      onClick={() => {
                        setShowPinSetup(false);
                        setPin('');
                      }}
                      className="text-xs font-bold text-slate-400 hover:underline block mx-auto pt-2 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Biometrics Simulating biometrics animation */}
              {showFingerprintSimulation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-50 rounded-3xl"
                >
                  <div className="relative mb-6">
                    <Fingerprint className="h-20 w-20 text-[#22C55E] animate-pulse" />
                    <div className="absolute inset-0 border-4 border-[#22C55E] rounded-full scale-125 animate-ping opacity-25" />
                  </div>
                  <h3 className="font-sans text-lg font-black text-white mb-2">
                    Reading fingerprint...
                  </h3>
                  <p className="font-sans text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Scanning biometric device sensor
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SETUP NAV BUTTONS CONTROL */}
      <div className="pb-4 mt-6">
        {step === 1 && (
          <button
            id="get-started-btn"
            onClick={handleNextStep}
            className="w-full h-14 bg-[#22C55E] rounded-2xl font-sans text-sm font-black text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-[#22C55E]/15 hover:scale-[1.01] transition-transform cursor-pointer border-0"
          >
            Get Started
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <button
              id="name-continue-btn"
              onClick={handleNextStep}
              className="w-full h-14 bg-[#22C55E] rounded-2xl font-sans text-sm font-black text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-[#22C55E]/15 hover:scale-[1.01] transition-transform cursor-pointer border-0"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              id="name-skip-btn"
              onClick={handleSkipProfile}
              className="font-sans text-xs text-[#94A3B8] hover:text-white font-bold transition-colors block mx-auto py-1 hover:underline cursor-pointer"
            >
              Skip
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <button
              id="income-continue-btn"
              onClick={handleNextStep}
              className="w-full h-14 bg-[#22C55E] rounded-2xl font-sans text-sm font-black text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-[#22C55E]/15 hover:scale-[1.01] transition-transform cursor-pointer border-0"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              id="income-skip-btn"
              onClick={handleSkipIncome}
              className="font-sans text-xs text-[#94A3B8] hover:text-white font-bold transition-colors block mx-auto py-1 hover:underline cursor-pointer"
            >
              Skip
            </button>
          </div>
        )}

        {step === 4 && (
          <button
            id="currency-continue-btn"
            onClick={handleNextStep}
            className="w-full h-14 bg-[#22C55E] rounded-2xl font-sans text-sm font-black text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-[#22C55E]/15 hover:scale-[1.01] transition-transform cursor-pointer border-0"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {step === 5 && !showPinSetup && (
          <button
            id="security-skip-btn"
            onClick={handleSkipSecurity}
            className="font-sans text-xs text-[#94A3B8] hover:text-white font-bold block mx-auto py-2 hover:underline cursor-pointer"
          >
            Do this later
          </button>
        )}
      </div>
    </div>
  );
};
