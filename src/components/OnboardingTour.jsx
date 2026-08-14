import React, { useEffect, useState, useCallback, useRef } from 'react';
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
    qabTab: 'bills',
    title: 'Cash Defense (Bills)',
    text: "Plug in your recurring obligations—rent, utilities, or credit cards. We'll track due dates so you never get hit with late fees.",
  },
  {
    id: '3B',
    target: 'qab-expense',
    tab: 'home',
    openQab: true,
    qabTab: 'transactions',
    title: 'Variable Spend (Expenses)',
    text: "Log daily variable purchases like groceries or dining out on the fly to keep your liquid buffer accurate.",
  },
  {
    id: '3C',
    target: 'qab-income',
    tab: 'home',
    openQab: true,
    qabTab: 'income',
    title: 'Capital Inflow (Income)',
    text: "Got side hustle cash, client invoices, or a bonus? Log extra incoming funds here to instantly expand your runway.",
  },
  {
    id: '7',
    target: 'todo-input',
    tab: 'todo',
    title: 'Action Command (To-Do)',
    text: "Keep your operational focus razor-sharp. Organize financial errands, pending calls, or reminders right inside your vault.",
  },
  {
    id: '8',
    target: 'notification-bell',
    tab: 'home',
    title: 'Command Center',
    text: "Your central intelligence hub. Tap the bell anytime for critical system briefings, overdue alerts, and live AI guidance.",
  },
  {
    id: '9',
    target: 'settings-btn',
    tab: 'home',
    title: 'Settings Vault',
    text: "Personalize your system. Customize theme palettes, switch currency presets, manage subscription status, or export master ledgers.",
  }
];

export default function OnboardingTour({ setActiveTab, setIsQabOpen, setQabDrawerTab }) {
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
  const lastScrolledStep = useRef(null);

  const activeStepIndex = TOUR_STEPS.findIndex(step => String(step.id) === String(currentTourStep));
  const activeStep = TOUR_STEPS[activeStepIndex];

  // Route tabs, modals, and internal QAB tabs automatically
  useEffect(() => {
    if (!isTourActive || !activeStep) return;

    if (activeStep.tab && setActiveTab) {
      setActiveTab(activeStep.tab);
    }

    if (setIsQabOpen) {
      if (activeStep.openQab) {
        setIsQabOpen(true);
        if (activeStep.qabTab && setQabDrawerTab) {
          setQabDrawerTab(activeStep.qabTab);
        }
      } else {
        setIsQabOpen(false);
      }
    }
  }, [isTourActive, activeStep, setActiveTab, setIsQabOpen, setQabDrawerTab]);

  // Precise Target Calculation without infinite scrolling loops
  const updateSpotlight = useCallback(() => {
    if (!activeStep) return;

    const element = document.querySelector(`[data-tour="${activeStep.target}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      
      // Smooth scroll ONLY ONCE per step transition to eliminate bouncing
      if (lastScrolledStep.current !== activeStep.id) {
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        lastScrolledStep.current = activeStep.id;
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

      const interval = setInterval(updateSpotlight, 150);
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

  const isTargetInBottomHalf = targetRect && targetRect.top > window.innerHeight / 2;

  // Dynamic Highlight Ring Colors matching QAB Tabs
  let highlightBorderColor = signatureColor;
  if (activeStep.qabTab === 'transactions') highlightBorderColor = '#F97316'; // Orange
  if (activeStep.qabTab === 'income') highlightBorderColor = '#10B981'; // Green

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      
      {/* SVG Mask: Crisp Unblurred Cut-out Window over Blurred Background (Pointer Events Disabled to Prevent Lock) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.75)"
          mask="url(#tour-spotlight-mask)"
          className="backdrop-blur-md pointer-events-none"
        />
      </svg>

      {/* Glowing Cut-out Border Frame */}
      {targetRect && (
        <div 
          className="absolute rounded-2xl transition-all duration-300 ease-out pointer-events-none"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            border: `3px solid ${highlightBorderColor}`,
            boxShadow: `0 0 20px ${highlightBorderColor}88`,
          }}
        />
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
                  backgroundColor: i === activeStepIndex ? highlightBorderColor : isDarkMode ? '#FFFFFF' : '#64748B'
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
              style={{ backgroundColor: highlightBorderColor }}
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
