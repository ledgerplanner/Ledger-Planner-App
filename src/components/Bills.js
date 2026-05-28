import React, { useState, useEffect } from "react";
import { CheckCircle2, RefreshCw, ChevronUp, ChevronDown, RotateCcw, Edit2, AlertCircle } from "lucide-react";
 
export default function Bills({
  userName,
  bills,
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
  const [selectedMonth, setSelectedMonth] = useState(4); // Default to May 2026
  const [expandedMonths, setExpandedMonths] = useState({ 4: true }); // Expand May 2026 by default
 
  useEffect(() => {
    setIsMounted(true);
  }, []);
 
  const currentYear = 2026;
  const currentMonthIndex = 4; // May 2026
 
  const monthsData = [
    { name: "January", short: "Jan", idx: 0 },
    { name: "February", short: "Feb", idx: 1 },
    { name: "March", short: "Mar", idx: 2 },
    { name: "April", short: "Apr", idx: 3 },
    { name: "May", short: "May", idx: 4 },
    { name: "June", short: "Jun", idx: 5 },
    { name: "July", short: "Jul", idx: 6 },
    { name: "August", short: "Aug", idx: 7 },
    { name: "September", short: "Sep", idx: 8 },
    { name: "October", short: "Oct", idx: 9 },
    { name: "November", short: "Nov", idx: 10 },
    { name: "December", short: "Dec", idx: 11 }
  ];
 
  const getMonthMetrics = (mIdx) => {
    let monthBills = [];
    if (mIdx <= currentMonthIndex) {
      monthBills = bills.filter((b) => {
        if (!b.rawDate) return false;
        const parts = b.rawDate.split("-");
        return parts.length === 3 && parseInt(parts[1], 10) - 1 === mIdx && parseInt(parts[0], 10) === currentYear;
      });
    } else {
      monthBills = bills.filter((b) => b.isRecurring);
    }
 
    const totalDue = monthBills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalPaid = mIdx <= currentMonthIndex
      ? monthBills.filter((b) => b.isPaid).reduce((sum, b) => sum + (b.amount || 0), 0)
      : 0;
 
    return { monthBills, totalDue, totalPaid };
  };
 
  const handleMonthCardClick = (mIdx) => {
    setSelectedMonth(mIdx);
    setExpandedMonths((prev) => ({ ...prev, [mIdx]: true }));
    setTimeout(() => {
      document.getElementById(`month-accordion-${mIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };
 
  const toggleMonthAccordion = (mIdx) => {
    setExpandedMonths((prev) => ({ ...prev, [mIdx]: !prev[mIdx] }));
  };
 
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
 
  const activeMetrics = getMonthMetrics(selectedMonth);
  const progressPercentage = activeMetrics.totalDue === 0 ? 0 : Math.max(0, Math.min((activeMetrics.totalPaid / activeMetrics.totalDue) * 100, 100));
 
  const urgentBills = bills.filter((b) => !b.isPaid && (b.isOverdue || b.payday === "Due Now"));
  const horizonBills = bills.filter((b) => {
    if (!b.rawDate) return false;
    const parts = b.rawDate.split("-");
    return parts.length === 3 && parseInt(parts[0], 10) >= 2027;
  });
 
  const baseMonthlyIncome = Object.values(paydayConfig || {}).reduce((sum, slot) => sum + (Number(slot?.income) || 0), 0);
 
  const graphicContent = (
    <div className="flex flex-col relative z-10 mb-2 w-full overflow-hidden">
      {/* 👑 MASTER FLOATING PROGRESS SUMMARY CARD */}
      <div className={`relative pt-10 pb-6 px-6 rounded-[2rem] border flex flex-col w-full transform transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-white via-slate-50/90 to-slate-100/60 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.3),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
          
        {/* INNER HERO CARD TITLE: PERFECT COMPLIANCE BLUEPRINT POSITIONING */}
        <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-black"}`}>
            Master Bills List
          </span>
        </div>
 
        {/* METRICS ROW CONTENT CONTAINER */}
        <div className="flex items-center justify-between w-full">
          {/* 1️⃣ POINT 1 ANIMATION: THE GRAPHIC ANIMATES (Radial progress stroke fills gracefully) */}
          <div className="relative w-28 h-28 flex-shrink-0">
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
              <span className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{Math.round(progressPercentage)}%</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Paid</span>
            </div>
          </div>
   
          {/* 2️⃣ POINT 2 ANIMATION: TEXT SCROLLS UP (Total settled / due balances lift upward into frame) */}
          <div className={`flex-1 pl-4 text-right transform transition-all duration-700 delay-200 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Total Bills Paid</p>
            <p className="font-black tracking-tighter mb-0 leading-none sm:leading-tight">
              <span className={`text-2xl min-[380px]:text-3xl sm:text-4xl block sm:inline ${activeMetrics.totalPaid === 0 ? "text-red-500" : "text-[#10B981]"}`}>
                ${activeMetrics.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm min-[380px]:text-base sm:text-xl text-[#1877F2] block sm:inline sm:ml-1 mt-1 sm:mt-0 font-black">
                 / ${activeMetrics.totalDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>
 
      </div>
    </div>
  );
 
  const formatAccordionDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
  };
 
  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 min-h-screen ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        
      {/* PAGE TITLE COLOR PASS: FORCED PURE CRISP WHITE IN DARK MODE / CRISP BLACK IN LIGHT MODE */}
      <div className="relative z-10 Bills-Master-Header">
        <style>{`
          .Bills-Master-Header h1, 
          .Bills-Master-Header h2,
          .Bills-Master-Header h3 { 
            color: ${isDarkMode ? "#FFFFFF" : "#000000"} !important; 
            font-weight: 900 !important;
          }
        `}</style>
        {renderHeroShell(`${userName}'s Bills`, graphicContent)}
      </div>
      
      {/* 3️⃣ POINT 3 ANIMATION: TEXT SCROLLS FROM SIDE (12-month timeline ribbon glides horizontally from right edge) */}
      <div className={`w-full overflow-x-auto hide-scrollbar pl-6 pr-6 mb-6 relative z-10 transform transition-all duration-700 delay-400 cubic-bezier(0.16, 1, 0.3, 1) ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>
        <div className="flex gap-4 pr-6 pb-2 min-h-[170px]">
          {monthsData.map((m) => {
            const { totalDue, totalPaid } = getMonthMetrics(m.idx);
            const isSelected = selectedMonth === m.idx;
            
            return (
              <div
                key={m.idx}
                onClick={() => handleMonthCardClick(m.idx)}
                className={`shrink-0 w-52 p-5 rounded-[1.75rem] border cursor-pointer active:scale-95 transition-all flex flex-col justify-between h-44 ${isSelected ? (isDarkMode ? "bg-blue-900/20 border-blue-500 shadow-md scale-[1.01]" : "bg-blue-50/80 border-blue-300 shadow-[0_4px_20px_rgba(24,119,242,0.15)] scale-[1.01]") : (isDarkMode ? "bg-[#1E293B] border-slate-700 shadow-md" : "bg-white/90 backdrop-blur-sm border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]")}`}
              >
                <div className="flex justify-between items-center w-full">
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-[#1877F2]" : "text-slate-400"}`}>{m.name}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{currentYear}</span>
                </div>
 
                <div className="text-center pt-1.5 pb-1">
                  <p className={`text-2xl font-black tracking-tighter leading-none mb-1 ${totalDue === 0 ? "text-slate-400" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                    ${totalDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${isDarkMode ? "text-slate-400" : "text-slate-500"} leading-none block`}>
                    {m.idx > currentMonthIndex ? "PROJECTED DUE" : "TOTAL DUE"}
                  </span>
                </div>
 
                <div className={`w-full py-1.5 rounded-xl text-center font-black text-[9px] tracking-wider transition-all uppercase ${isSelected ? "bg-[#1877F2] text-white shadow-md" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  {isSelected ? "VIEWING MONTH" : "SELECT MONTH"}
                </div>
 
                <div className="flex justify-between items-end w-full pt-2">
                  <div className="flex flex-col flex-1">
                    <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white opacity-40" : "text-black opacity-40"}`}>Income</span>
                    <span className={`text-[10px] font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>+${baseMonthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white opacity-40" : "text-black opacity-40"}`}>Paid</span>
                    <span className="text-[10px] font-black text-[#10B981]">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
 
      {/* SIGNATURE DIVIDER LINE */}
      <div className={`mx-6 mb-6 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}></div>
 
      <main className="px-6 space-y-8 mt-2">
          
        {/* SECTION TITLE */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Unpaid Bills</h3>
 
          {/* URGENT AREA CARD */}
          {urgentBills.length > 0 && (
            <div className={`p-4 rounded-[2rem] border mb-6 ${isDarkMode ? "bg-red-950/20 border-red-900/40" : "bg-red-50/60 border-red-100"}`}>
              <div className="flex items-center gap-2 mb-3 px-2">
                <AlertCircle size={16} className="text-red-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Urgent Attention Required</h4>
              </div>
              <div className="space-y-3">
                {sortBillsSurgically(urgentBills).map((bill) => (
                  <div key={`urgent-${bill.id}`} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-100"}`}>
                    {/* LEVEL 1 */}
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
                        className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500" : "hover:bg-slate-100 text-slate-400"}`}
                      >
                        <Edit2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                    {/* LEVEL 2 */}
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
                    {/* LEVEL 3 */}
                    {bill.isInstallment && !bill.isPaid && (
                      <div className="mt-5 pt-3 border-t border-slate-200 w-full animate-fade-in">
                        <div className="flex justify-between items-end mb-2 px-1">
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">Installment Plan</span>
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
 
          {/* 12 CHRONOLOGICAL ACCORDIONS */}
          <div className="space-y-4">
            {monthsData.map((m) => {
              const { monthBills, totalDue } = getMonthMetrics(m.idx);
              const isCollapsed = !expandedMonths[m.idx];
              const sortedBills = sortBillsSurgically(monthBills.filter((b) => !b.isPaid));
 
              return (
                <div key={m.idx} id={`month-accordion-${m.idx}`} className="space-y-2 scroll-mt-24">
                  {/* ACCORDION HEADER */}
                  <div
                    className="flex flex-col px-2 py-4 cursor-pointer transition-colors"
                    onClick={() => toggleMonthAccordion(m.idx)}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-black uppercase tracking-widest ${selectedMonth === m.idx ? "text-[#1877F2]" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {m.name} {currentYear}
                          </h3>
                          <div className="text-slate-500">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {m.idx > currentMonthIndex ? "Projected Recurring Timeline" : `${monthBills.filter(b => b.isPaid).length} Settled / ${monthBills.length} Total`}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-black mb-1 ${selectedMonth === m.idx ? "text-[#1877F2]" : isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                          ${totalDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {m.idx > currentMonthIndex ? "Projected" : "Total Due"}
                        </span>
                      </div>
                    </div>
                  </div>
 
                  {/* ACCORDION BODY */}
                  {!isCollapsed && (
                    <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                      {sortedBills.length === 0 ? (
                        <p className="text-center py-5 text-xs font-bold text-slate-400">No unpaid bills on the board for this month.</p>
                      ) : (
                        <div className="space-y-3">
                          {sortedBills.map((bill) => {
                            const isStrictlyOverdue = bill.isOverdue;
                            const isDueToday = bill.payday === "Due Now";
                            const isUrgent = isStrictlyOverdue || isDueToday;
 
                            return (
                              <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                                {/* LEVEL 1: Identity & Edit Pencil */}
                                <div className="flex items-start justify-between w-full mb-6">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isUrgent ? (isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100") : (isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200")}`}>
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
                                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        Installment Plan
                                      </span>
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
          </div>
        </div>
 
        {/* SETTLED HISTORICAL AREA LOOP */}
        {bills.filter(b => b.isPaid).length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Paid & Settled (All History)</h3>
            <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              <div className="space-y-3">
                {bills.filter(b => b.isPaid).map((bill) => (
                  <div key={`settled-${bill.id}`} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all duration-300 opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 ${isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-white border-slate-100"}`}>
                    <div className="flex items-start justify-between w-full mb-6">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                          {bill.icon}
                        </div>
                        <p className={`font-black text-base truncate leading-tight line-through ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {bill.name}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                        className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500" : "hover:bg-slate-100 text-slate-400"}`}
                      >
                        <Edit2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-1 min-[360px]:gap-2 w-full">
                      <div className="flex flex-col shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</span>
                        <span className={`text-xs font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>Settled</span>
                      </div>
                      <div className="flex-1 flex justify-center px-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }}
                          className={`px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${isDarkMode ? "bg-red-900/20 border-red-900/50 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}
                        >
                          <RotateCcw size={14} strokeWidth={2} /> Revert
                        </button>
                      </div>
                      <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 transition-colors ${isDarkMode ? "bg-slate-800/50 text-slate-400 border-slate-700" : "bg-slate-50 text-slate-500 border-slate-200"} whitespace-nowrap`}>
                        {(Number(bill.amount) || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
 
        {/* HORIZON CARD */}
        {horizonBills.length > 0 && (
          <div className="space-y-4 pt-6 mt-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">2027 Bills</h3>
            <div className={`rounded-[2rem] p-5 border shadow-sm ${isDarkMode ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-800" : "bg-gradient-to-br from-white to-slate-50 border-slate-200"}`}>
              <div className="mb-3 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1877F2] block mb-0.5">A look into Next Year</span>
                <p className="text-xs text-slate-400">Future scheduled obligations outside the current 12-month calendar horizon framework.</p>
              </div>
              <div className="space-y-3">
                {horizonBills.map((bill) => (
                  <div key={`horizon-${bill.id}`} className={`flex items-center justify-between p-4 rounded-2xl border ${isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-100"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{bill.icon}</span>
                      <div>
                        <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{bill.fullDate}</span>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-[8px] font-black text-sm text-[#1877F2] ${isDarkMode ? "bg-blue-900/20" : "bg-blue-50"}`}>
                      ${(Number(bill.amount) || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
 
      </main>
    </div>
  );
}
