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

  const [spotlightRect, setSpotlightRect] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const stepTimerRef = useRef(null);

  const activeIndex = TOUR_STEPS.findIndex(s => String(s.id) === String(currentTourStep));
  const activeStep = TOUR_STEPS[activeIndex];

  // Route page tabs and open/close drawer automatically
  useEffect(() => {
    if (!isTourActive || !activeStep) return;

    setIsReady(false);
    setSpotlightRect(null);

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

  // Clean single-pass coordinate capture
  const captureTargetRect = useCallback(() => {
    if (!activeStep) return;

    const el = document.querySelector(`[data-tour="${activeStep.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSpotlightRect({
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
        setIsReady(true);
      }
    }
  }, [activeStep]);

  // Lock position after route transition settles
  useEffect(() => {
    if (!isTourActive || !activeStep) return;

    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);

    stepTimerRef.current = setTimeout(() => {
      captureTargetRect();
    }, 280);

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [isTourActive, activeStep?.id, captureTargetRect]);

  const fireCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 65,
      origin: { y: 0.6 },
      colors: [signatureColor, '#10B981', '#F97316']
    });
  };

  const handleNext = () => {
    fireCelebration();
    if (activeIndex === TOUR_STEPS.length - 1) {
      if (setIsQabOpen) setIsQabOpen(false);
      skipTour();
    } else {
      completeTourStep(currentTourStep);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      advanceTour(TOUR_STEPS[activeIndex - 1].id);
    }
  };

  if (!isTourActive || !activeStep) return null;

  const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const isLowerHalf = spotlightRect && spotlightRect.top > winHeight / 2;

  // Dynamic Theme Colors matching active QAB drawer category
  let ringColor = signatureColor;
  if (activeStep.qabTab === 'transactions') ringColor = '#F97316';
  if (activeStep.qabTab === 'income') ringColor = '#10B981';

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      
      {/* Dimmed & Blurred SVG Backdrop Mask */}
      <svg className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`}>
        <defs>
          <mask id="gold-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - 6}
                y={spotlightRect.top - 6}
                width={spotlightRect.width + 12}
                height={spotlightRect.height + 12}
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
          fill="rgba(15, 23, 42, 0.78)"
          mask="url(#gold-spotlight-mask)"
          className="backdrop-blur-sm pointer-events-none"
        />
      </svg>

      {/* Illuminated Cutout Frame */}
      {spotlightRect && isReady && (
        <div 
          className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlightRect.top - 6,
            left: spotlightRect.left - 6,
            width: spotlightRect.width + 12,
            height: spotlightRect.height + 12,
            border: `3px solid ${ringColor}`,
            boxShadow: `0 0 24px ${ringColor}99`,
          }}
        />
      )}

      {/* Floating Tutorial Card */}
      <div 
        className={`absolute pointer-events-auto rounded-3xl p-6 shadow-2xl max-w-sm w-[90%] md:w-[360px] border transition-all duration-300 ${
          isDarkMode ? "bg-[#1E293B] border-slate-700 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]" : "bg-white border-slate-100 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
        }`}
        style={{
          top: spotlightRect && isReady
            ? isLowerHalf 
              ? Math.max(24, spotlightRect.top - 235) 
              : Math.min(winHeight - 250, spotlightRect.top + spotlightRect.height + 20)
            : '50%',
          left: spotlightRect && isReady 
            ? Math.max(24, Math.min(winWidth - 384, spotlightRect.left)) 
            : '50%',
          transform: (spotlightRect && isReady) ? 'none' : 'translate(-50%, -50%)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Step {activeIndex + 1} of {TOUR_STEPS.length}
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
          {/* Progress Dots */}
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-5' : 'w-1.5 opacity-30'
                }`}
                style={{
                  backgroundColor: i === activeIndex ? ringColor : isDarkMode ? '#FFFFFF' : '#64748B'
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {activeIndex > 0 && (
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
              style={{ backgroundColor: ringColor }}
            >
              {activeIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              {activeIndex !== TOUR_STEPS.length - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
