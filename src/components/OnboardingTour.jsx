import React, { useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLedger } from '../context/LedgerContext';

const TOUR_STEPS = [
  {
    id: 1,
    target: 'add-account-btn',
    title: 'Vault Foundation',
    text: "Let's build your vault foundation. Add your checking, savings, or cash accounts so Ledger Planner can calculate your true cash runway.",
  },
  {
    id: 2,
    target: 'payday-btn',
    title: 'Income Engine',
    text: "Configure your pay cycle. Plug in your deposit dates and amounts so our engine can automatically align your cash flow.",
  },
  {
    id: '3A',
    target: 'qab-bill',
    title: 'Cash Defense',
    text: "Plug in your recurring obligations—rent, utilities, or credit cards. We'll track due dates so you never get hit with late fees.",
  },
  {
    id: '3B',
    target: 'qab-expense',
    title: 'Variable Spend',
    text: "Log daily variable purchases like groceries or dining out on the fly to keep your liquid buffer accurate.",
  },
  {
    id: '3C',
    target: 'qab-income',
    title: 'Capital Inflow',
    text: "Got side hustle cash, client invoices, or a bonus? Log extra incoming funds here to instantly expand your runway.",
  }
];

export default function OnboardingTour() {
  const { isTourActive, currentTourStep, completeTourStep, skipTour, advanceTour } = useLedger();
  const [targetRect, setTargetRect] = useState(null);

  const activeStepIndex = TOUR_STEPS.findIndex(step => step.id === currentTourStep);
  const activeStep = TOUR_STEPS[activeStepIndex];

  // Locate the target element on the screen to position the spotlight
  const updateSpotlight = useCallback(() => {
    if (!activeStep) return;
    
    const element = document.querySelector(`[data-tour="${activeStep.target}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null); // Element not found yet
    }
  }, [activeStep]);

  // Recalculate position on scroll or resize
  useEffect(() => {
    if (isTourActive) {
      updateSpotlight();
      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight, true);
      
      // Setup a slight delay interval to catch dynamic renders (like QAB opening)
      const interval = setInterval(updateSpotlight, 300);
      return () => {
        window.removeEventListener('resize', updateSpotlight);
        window.removeEventListener('scroll', updateSpotlight, true);
        clearInterval(interval);
      };
    }
  }, [isTourActive, updateSpotlight]);

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#1877F2', '#F59E0B']
    });
  };

  const handleNext = () => {
    fireConfetti();
    completeTourStep(currentTourStep);
  };

  if (!isTourActive || !activeStep) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      
      {/* Dimmed Overlay with cut-out spotlight */}
      {targetRect && (
        <div 
          className="absolute rounded-xl transition-all duration-500 ease-in-out"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            border: '2px solid #10B981', // Glowing ring
          }}
        />
      )}

      {/* Floating Intelligence Card */}
      <div 
        className="absolute pointer-events-auto transition-all duration-500 ease-in-out bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 shadow-2xl max-w-sm w-[90%] md:w-[350px] border border-gray-100 dark:border-gray-800"
        style={{
          top: targetRect ? Math.max(20, targetRect.top + targetRect.height + 24) : '50%',
          left: targetRect ? Math.max(20, Math.min(window.innerWidth - 370, targetRect.left)) : '50%',
          transform: targetRect ? 'none' : 'translate(-50%, -50%)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
            Step {activeStepIndex + 1} of {TOUR_STEPS.length}
          </span>
          <button onClick={skipTour} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {activeStep.title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {activeStep.text}
        </p>

        <div className="flex items-center justify-between">
          {/* Progress Dots */}
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeStepIndex 
                    ? 'w-4 bg-emerald-500' 
                    : i < activeStepIndex 
                      ? 'w-1.5 bg-emerald-200 dark:bg-emerald-900' 
                      : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-2">
            {activeStepIndex > 0 && (
              <button 
                onClick={() => advanceTour(TOUR_STEPS[activeStepIndex - 1].id)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {activeStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              {activeStepIndex !== TOUR_STEPS.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
