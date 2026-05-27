import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, RefreshCw, ChevronUp, ChevronDown, RotateCcw, Edit2, AlertCircle } from "lucide-react";

export default function Bills({
  userName,
  bills = [],
  paydayConfig,
  isDarkMode,
  handleBillClick,
  setSelectedEntry,
  renderHeroShell,
  handleRolloverMonth,
  collapsedPaydays,
  toggleCollapse
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeMonthIndex, setActiveMonthIndex] = useState(4); // Defaults to May (Index 4 for May 2026)
  const monthRefs = useRef([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // === DUAL-TIMELINE MONTHLY DATA CONTEXT ENGINE ===
  const getMonthlyData = (monthIdx) => {
    const isPastOrCurrent = monthIdx <= 4; // May 2026 or earlier
    let monthlyBills = [];

    if (isPastOrCurrent) {
      // Read actual database records filtering by rawDate calendar month
      monthlyBills = bills.filter((b) => {
        if (!b.rawDate) return false;
        const d = new Date(b.rawDate);
        return d.getFullYear() === 2026 && d.getMonth() === monthIdx;
      });
    } else {
      // Future Projection Matrix: Project active recurring templates
      monthlyBills = bills.filter((b) => b.isRecurring).map((b) => ({
        ...b,
        isPaid: false, // Projections default to unpaid
        fullDate: `${months[monthIdx]} 2026`
      }));
    }

    const totalDue = monthlyBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const totalPaid = isPastOrCurrent 
      ? monthlyBills.filter((b) => b.isPaid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
      : 0;
    
    // Fallback income estimator from payday setup config or system defaults
    const baseIncome = Number(paydayConfig?.paydayAmount) || 1250;
    const frequency = paydayConfig?.frequency || "Weekly";
    let calculatedIncome = baseIncome * 4;
    if (frequency === "Weekly") calculatedIncome = baseIncome * 4;
    if (frequency === "Bi-Weekly") calculatedIncome = baseIncome * 2;
    if (frequency === "Semi-Monthly") calculatedIncome = baseIncome * 2;
    if (frequency === "Monthly") calculatedIncome = baseIncome;

    return {
      billsList: monthlyBills,
      totalDue,
      totalPaid,
      estimatedIncome: calculatedIncome
    };
  };

  // Compute active focus metrics for the Master Progress Ring
  const activeMonthData = getMonthlyData(activeMonthIndex);
  const totalBillsAmount = activeMonthData.totalDue;
  const paidBillsAmount = activeMonthData.totalPaid;
  const progressPercentage = totalBillsAmount === 0 ? 0 : Math.max(0, Math.min((paidBillsAmount / totalBillsAmount) * 100, 100));

  // Global Urgent Alert Extractor (Overdue or Due Now)
  const urgentBills = bills.filter((b) => !b.isPaid && (b.isOverdue || b.payday === "Due Now"));

  // Future Horizon Extractor (2027 and beyond)
  const horizonBills = bills.filter((b) => {
    if (!b.rawDate) return false;
    const d = new Date(b.rawDate);
    return d.getFullYear() >= 2027;
  });

  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
      if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return new Date(a.rawDate) - new Date(b.rawDate);
    });
  };

  const handleMonthCardTap = (idx, monthName) => {
    setActiveMonthIndex(idx);
    if (collapsedPaydays?.[monthName] && typeof toggleCollapse === "function") {
      toggleCollapse(monthName);
    }
    setTimeout(() => {
      monthRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const graphicContent = (
    <div className="flex flex-col relative z-10 mb-2 w-full">
      {/* 👑 MASTER FLOATING PROGRESS SUMMARY CARD */}
      <div className={`relative p-6 rounded-[2rem] border flex flex-col w-full transform transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-white via-slate-50/90 to-slate-100/60 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.3),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
        
        {/* LAYER 2: INNER HERO CARD TITLE */}
        <div className="mb-4">
          <h4 className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Master Bills List • <span className="text-[#1877F2]">{months[activeMonthIndex]} Focus</span>
          </h4>
        </div>

        <div className="flex items-center justify-between w-full">
          {/* PROGRESS RING */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="billGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#1E293B" : "rgba(226, 232, 240, 0.9)"} strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#billGlow)" strokeWidth="12" strokeLinecap="round" strokeDasharray={251.2} strokeDashoffset={isMounted ? (251.2 - (251.2 * progressPercentage) / 100) : 251.2} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className={`absolute inset-0 flex flex-col items-center justify-center transform transition-all duration-700 delay-300 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              <span className={`text-lg font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{Math.round(progressPercentage)}%</span>
              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Paid</span>
            </div>
          </div>

          {/* DATA METRICS CONTAINER */}
          <div className={`flex-1 pl-4 text-right transform transition-all duration-700 delay-300 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">Month Metrics Breakdown</p>
            <p className="font-black tracking-tighter mb-0 leading-none">
              <span className={`text-xl min-[380px]:text-2xl block ${paidBillsAmount === 0 ? "text-red-500" : "text-[#10B981]"}`}>
                ${paidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 opacity-60 block mt-1">
                Allocated / ${totalBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* LAYER 1: PAGE TITLE ACCESSED VIA SHELL */}
      {renderHeroShell(`${userName}'s Bills`, graphicContent)}
      
      <main className="px-6 mt-4">

        {/* LAYER 3: HORIZONTAL 12-MONTH RIBBON SWIPE VIEW */}
        <div className="flex gap-3 overflow-x-auto pb-4 pt-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {months.map((monthName, idx) => {
            const mData = getMonthlyData(idx);
            const isSelected = activeMonthIndex === idx;
            const isFuture = idx > 4;

            return (
              <div
                key={monthName}
                onClick={() => handleMonthCardTap(idx, monthName)}
                className={`snap-center shrink-0 min-w-[125px] p-4 rounded-2xl border transition-all duration-300 cursor-pointer transform active:scale-95 flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#1877F2] text-white border-transparent shadow-[0_8px_20px_rgba(24,119,242,0.4)] scale-105 relative z-20"
                    : isDarkMode
                    ? "bg-[#1E293B] border-slate-800 text-slate-300 hover:bg-slate-800"
                    : "bg-white border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <div>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                    {monthName.substring(0, 3)} 2026
                  </p>
                  <p className={`text-sm font-black tracking-tight mt-1`}>
                    ${mData.totalDue.toLocaleString("en-US", { maximumFractionDigits: 0 })} Due
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-current opacity-70 flex flex-col gap-0.5">
                  <span className="text-[8px] font-bold uppercase tracking-wider">
                    Inc: ${mData.estimatedIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider">
                    {isFuture ? "Projected" : `Paid: $${mData.totalPaid.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* LAYER 4: SIGNATURE DIVIDER LINE */}
        <div className={`border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"} my-4`}></div>

        {/* LAYER 5: SECTION TITLE */}
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 mb-4">Unpaid Bills</h3>

        <div className="space-y-6">
          
          {/* LAYER 6: 🚨 DYNAMIC URGENT AREA CARD CONTAINER */}
          {urgentBills.length > 0 && (
            <div className={`p-4 rounded-[2rem] border transition-all duration-300 ${isDarkMode ? "bg-red-950/20 border-red-900/40" : "bg-red-50/50 border-red-100"}`}>
              <div className="flex items-center gap-2 mb-3 px-2">
                <AlertCircle size={14} className="text-red-500" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-red-500">Immediate Action Required</h4>
              </div>
              <div className="space-y-3">
                {sortBillsSurgically(urgentBills).map((bill) => (
                  /* PINKY PROMISE LAYER CELL GUARD: KEEPING ORIGINAL 3-LEVEL BENTO CELL DESIGN 100% INTACT */
                  <div key={`urgent-${bill.id}`} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-100"}`}>
                    {/* LEVEL 1: Identity & Edit Pencil */}
                    <div className="flex items-start justify-between w-full mb-6">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100"}`}>
                          {bill.icon}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                              {bill.name}
                            </p>
                            {bill.isRecurring && !bill.isPaid && <RefreshCw size={12} strokeWidth={2} className="text-[#10B981] shrink-0" />}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                        className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                      >
                        <Edit2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                    {/* LEVEL 2: Action Row */}
                    <div className="flex items-center justify-between gap-1 min-[360px]:gap-2 w-full">
                      <div className="flex flex-col shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-500">
                          {bill.isOverdue ? "OVERDUE" : "DUE NOW"}
                        </span>
                        <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                          {bill.fullDate || "TBD"}
                        </span>
                      </div>
                      <div className="flex-1 flex justify-center px-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }}
                          className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#1877F2] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 min-[360px]:gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 size={14} strokeWidth={2.5} />
                          <span className="hidden min-[360px]:inline">MARK AS PAID</span>
                          <span className="min-[360px]:hidden">PAY</span>
                        </button>
                      </div>
                      <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 text-[#1877F2] drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} whitespace-nowrap`}>
                        {(Number(bill.amount) || 0).toFixed(2)}
                      </div>
                    </div>
                    {/* LEVEL 3: Installment Plan */}
                    {bill.isInstallment && !bill.isPaid && (
                      <div className="mt-5 pt-3 border-t border-slate-200 w-full animate-fade-in">
                        <div className="flex justify-between items-end mb-2 px-1">
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Installment Plan</span>
                          <span className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300">
                            ${(Number(bill.paidAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${(Number(bill.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900 shadow-inner" : "bg-slate-100"}`}>
                          <div className="h-full bg-[#1877F2] transition-all duration-500 ease-out" style={{ width: `${Math.min(((Number(bill.paidAmount) || 0) / (Number(bill.totalAmount) || 1)) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LAYER 7: 📅 12 CHRONOLOGICAL ACCORDIONS */}
          {months.map((monthName, index) => {
            const { billsList, totalDue } = getMonthlyData(index);
            const unpaidMonthBills = billsList.filter((b) => !b.isPaid);
            const isCollapsed = collapsedPaydays?.[monthName] ?? true;
            const sortedMonthBills = sortBillsSurgically(unpaidMonthBills);

            return (
              <div 
                key={monthName} 
                ref={(el) => (monthRefs.current[index] = el)} 
                className="space-y-2 scroll-mt-24 border-b pb-2 dark:border-slate-800/40"
              >
                {/* ACCORDION HEADER CHASSIS */}
                <div 
                  className="flex justify-between items-start w-full px-2 py-3 cursor-pointer select-none transition-opacity hover:opacity-80" 
                  onClick={() => typeof toggleCollapse === "function" && toggleCollapse(monthName)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {monthName} 2026
                      </h3>
                      <div className="text-slate-500">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {index <= 4 ? "Operational Board" : "Forecast Projection Engine"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black mb-1 text-[#1877F2]">
                      ${totalDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Total Due
                    </span>
                  </div>
                </div>

                {/* ACCORDION CONTENT PANEL */}
                {!isCollapsed && (
                  <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                    {sortedMonthBills.length === 0 ? (
                      <p className="text-center py-5 text-xs font-bold text-slate-400">No active liabilities tracked for this month slot.</p>
                    ) : (
                      <div className="space-y-3">
                        {sortedMonthBills.map((bill) => {
                          const isStrictlyOverdue = bill.isOverdue;
                          const isDueToday = bill.payday === "Due Now";
                          const isUrgent = isStrictlyOverdue || isDueToday;

                          return (
                            /* PINKY PROMISE LAYER CELL GUARD: ORIGINAL 3-LEVEL BENTO PRESERVED EXACTLY */
                            <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all hover:scale-[0.99] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                              {/* LEVEL 1: Identity & Edit Pencil */}
                              <div className="flex items-start justify-between w-full mb-6">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isUrgent ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                    {bill.icon}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                                        {bill.name}
                                      </p>
                                      {bill.isRecurring && !bill.isPaid && <RefreshCw size={12} strokeWidth={2} className="text-[#10B981] shrink-0" />}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                                  className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                                >
                                  <Edit2 size={16} strokeWidth={2} />
                                </button>
                              </div>
                              {/* LEVEL 2: Action Row */}
                              <div className="flex items-center justify-between gap-1 min-[360px]:gap-2 w-full">
                                <div className="flex flex-col shrink-0">
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${isUrgent ? "text-red-500" : "text-slate-400"}`}>
                                    {isStrictlyOverdue ? "OVERDUE" : isDueToday ? "DUE NOW" : "DUE"}
                                  </span>
                                  <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                                    {bill.fullDate || `${monthName} 2026`}
                                  </span>
                                </div>
                                <div className="flex-1 flex justify-center px-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }}
                                    className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#1877F2] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 min-[360px]:gap-1.5 whitespace-nowrap shrink-0"
                                  >
                                    <CheckCircle2 size={14} strokeWidth={2.5} />
                                    <span className="hidden min-[360px]:inline">MARK AS PAID</span>
                                    <span className="min-[360px]:hidden">PAY</span>
                                  </button>
                                </div>
                                <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 text-[#1877F2] drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} whitespace-nowrap`}>
                                  {(Number(bill.amount) || 0).toFixed(2)}
                                </div>
                              </div>
                              {/* LEVEL 3: Installment Plan */}
                              {bill.isInstallment && !bill.isPaid && (
                                <div className="mt-5 pt-3 border-t border-slate-200 w-full animate-fade-in">
                                  <div className="flex justify-between items-end mb-2 px-1">
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Installment Plan</span>
                                    <span className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300">
                                      ${(Number(bill.paidAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${(Number(bill.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900 shadow-inner" : "bg-slate-100"}`}>
                                    <div className="h-full bg-[#1877F2] transition-all duration-500 ease-out" style={{ width: `${Math.min(((Number(bill.paidAmount) || 0) / (Number(bill.totalAmount) || 1)) * 100, 100)}%` }}></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* LAYER 8: 🔮 THE HORIZON CARD (2027 and Beyond) */}
          <div className="space-y-2 pt-4">
            <div 
              className="flex justify-between items-start w-full px-2 py-3 cursor-pointer select-none"
              onClick={() => typeof toggleCollapse === "function" && toggleCollapse("2027 Horizon")}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                    2027 Bills
                  </h3>
                  <div className="text-slate-500">{collapsedPaydays?.["2027 Horizon"] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  A look into Next Year
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black mb-1 text-amber-500">
                  ${horizonBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Long Horizon
                </span>
              </div>
            </div>

            {!collapsedPaydays?.["2027 Horizon"] && (
              <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                {horizonBills.length === 0 ? (
                  <p className="text-center py-5 text-xs font-bold text-slate-400">No multi-year annual configurations detected.</p>
                ) : (
                  <div className="space-y-3">
                    {sortBillsSurgically(horizonBills).map((bill) => (
                      /* PINKY PROMISE CEL GUARD: PRESERVING ORIGINAL 3-LEVEL BENTO UNTOUCHED */
                      <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}>
                        {/* LEVEL 1 */}
                        <div className="flex items-start justify-between w-full mb-6">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                              {bill.icon}
                            </div>
                            <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                              {bill.name}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                            className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                          >
                            <Edit2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                        {/* LEVEL 2 */}
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">ANNUAL MATURITY</span>
                            <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{bill.fullDate || "2027 Future"}</span>
                          </div>
                          <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 text-amber-500 bg-amber-500/10 border-amber-500/20 whitespace-nowrap`}>
                            {(Number(bill.amount) || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
