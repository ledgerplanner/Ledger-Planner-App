import React, { useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLedger } from '../context/LedgerContext';

const TOUR_STEPS = [
  {
    id: '1',
    target: 'add-account-btn',
    tab: 'accounts',
    title: 'Vault Foundation',
    text: "Let's build your vault foundation. Add your checking, savings, or cash accounts so Ledger Planner can calculate your true cash runway.",
  },
  {
    id: '2',
    target: 'payday-btn',
    tab: 'home',
    title: 'Income Engine',
    text: "Configure your pay cycle. Plug in your deposit dates and amounts so our engine can automatically align your cash flow.",
  },
  {
    id: '3_QAB_TRIGGER',
    target: 'qab-trigger-btn',
    tab: 'home',
    title: 'Quick Add Engine',
    text: "This is your central command trigger. Tap here anytime to log new transactions, bills, or incoming cash instantly.",
  },
  {
    id: '3A',
    target: 'qab-bill',
    tab: 'home',
    openQab: true,
    title: 'Cash Defense (Bills)',
    text: "Plug in your recurring obligations—rent, utilities, or credit cards. We'll track due dates so you never get hit with late fees.",
  },
  {
    id: '3B',
    target: 'qab-expense',
    tab: 'home',
    openQab: true,
    title: 'Variable Spend (Expenses)',
    text: "Log daily variable purchases like groceries or dining out on the fly to keep your liquid buffer accurate.",
  },
  {
    id: '3C',
    target: 'qab-income',
    tab: 'home',
    openQab: true,
    title: 'Capital Inflow (Income)',
    text: "Got side hustle cash, client invoices, or a bonus? Log extra incoming funds here to instantly expand your runway.",
  }
];

export default function OnboardingTour({ setActiveTab, setIsQabOpen }) {
  const { 
    isTourActive, 
    currentTourStep, 
    completeTourStep, 
    skipTour, 
    advanceTour,
    signatureColor = '#1877F2',
    isDarkMode = true
  } = useLedger();

  const [targetRect, setTargetRect] = useState(null);

  // String-safe matching against context step state
  const activeStepIndex = TOUR_STEPS.findIndex(step => String(step.id) === String(currentTourStep));
  const activeStep = TOUR_STEPS[activeStepIndex];

  // Route tabs and modals automatically when steps change
  useEffect(() => {
    if (!isTourActive || !activeStep) return;

    if (activeStep.tab && setActiveTab) {
      setActiveTab(activeStep.tab);
    }

    if (setIsQabOpen) {
      if (activeStep.openQab) {
        setIsQabOpen(true);
      } else if (activeStep.id === '3_QAB_TRIGGER') {
        setIsQabOpen(false);
      }
    }
  }, [isTourActive, activeStep, setActiveTab, setIsQabOpen]);

  // Locate the target element and scroll it into view
  const updateSpotlight = useCallback(() => {
    if (!activeStep) return;

    const element = document.querySelector(`[data-tour="${activeStep.target}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      
      // Auto-scroll if target is off-screen
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  }, [activeStep]);

  useEffect(() => {
    if (isTourActive) {
      updateSpotlight();
      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight, true);

      const interval = setInterval(updateSpotlight, 200);
      return () => {
        window.removeEventListener('resize', updateSpotlight);
        window.removeEventListener('scroll', updateSpotlight, true);
        clearInterval(interval);
      };
    }
  }, [isTourActive, updateSpotlight]);

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: [signatureColor, '#10B981', '#F97316']
    });
  };

  const handleNext = () => {
    fireConfetti();
    if (activeStepIndex === TOUR_STEPS.length - 1) {
      if (setIsQabOpen) setIsQabOpen(false);
      skipTour();
    } else {
      completeTourStep(currentTourStep);
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      advanceTour(TOUR_STEPS[activeStepIndex - 1].id);
    }
  };

  if (!isTourActive || !activeStep) return null;

  // Smart Flip Logic: Calculate if floating card should go above or below the target
  const isTargetInBottomHalf = targetRect && targetRect.top > window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      
      {/* Blurred Backdrop & Cut-out Spotlight */}
      {targetRect ? (
        <div 
          className="absolute rounded-2xl transition-all duration-300 ease-out backdrop-blur-sm"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
            border: `2px solid ${signatureColor}`,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto" />
      )}

      {/* Floating Intelligence Card */}
      <div 
        className={`absolute pointer-events-auto transition-all duration-300 ease-out rounded-3xl p-6 shadow-2xl max-w-sm w-[90%] md:w-[360px] border ${
          isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-100 text-slate-900"
        }`}
        style={{
          top: targetRect 
            ? isTargetInBottomHalf 
              ? Math.max(16, targetRect.top - 240) 
              : targetRect.top + targetRect.height + 20
            : '50%',
          left: targetRect 
            ? Math.max(16, Math.min(window.innerWidth - 376, targetRect.left)) 
            : '50%',
          transform: targetRect ? 'none' : 'translate(-50%, -50%)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Step {activeStepIndex + 1} of {TOUR_STEPS.length}
          </span>
          <button 
            onClick={() => { if (setIsQabOpen) setIsQabOpen(false); skipTour(); }} 
            className={`p-1 rounded-full transition-colors ${
              isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        <h3 className={`text-base font-black uppercase tracking-wide mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {activeStep.title}
        </h3>
        
        <p className={`text-xs font-bold leading-relaxed mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {activeStep.text}
        </p>

        <div className="flex items-center justify-between">
          {/* Progress Indicators */}
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeStepIndex 
                    ? 'w-5' 
                    : 'w-1.5 opacity-30'
                }`}
                style={{
                  backgroundColor: i === activeStepIndex ? signatureColor : isDarkMode ? '#FFFFFF' : '#64748B'
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {activeStepIndex > 0 && (
              <button 
                onClick={handlePrev}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md"
              style={{ backgroundColor: signatureColor }}
            >
              {activeStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              {activeStepIndex !== TOUR_STEPS.length - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
