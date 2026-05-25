import React, { useState, useEffect } from "react";
import { CheckCircle2, RefreshCw, ChevronUp, ChevronDown, RotateCcw, Edit2, Archive, Eye, Sparkles } from "lucide-react";

export default function Bills({
  userName = "Founder",
  bills = [],
  paydayConfig = {},
  accounts = [],
  isDarkMode,
  handleBillClick,
  setSelectedEntry,
  renderHeroShell
}) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Localized Accordion State to prevent global App.js runtime state crashes
  const [localCollapsedSections, setLocalCollapsedSections] = useState({});

  // Get active system clocks
  const today = new Date();
  const currentMonthIdx = today.getMonth(); // 0-11
  const currentYearIdx = today.getFullYear();

  // Selected Month Navigation State (Defaults to current active system month)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // === ARCHITECTURAL TIME-MACHINE CALENDAR ENGINE ===
  const isPastMonth = selectedMonth < currentMonthIdx;
  const isCurrentMonth = selectedMonth === currentMonthIdx;
  const isFutureMonth = selectedMonth > currentMonthIdx;

  // Filter and construct the targeted monthly array layout
  let operationalBills = [];

  if (isPastMonth || isCurrentMonth) {
    operationalBills = bills.filter((b) => {
      if (!b.rawDate) return false;
      const parts = b.rawDate.split("-");
      if (parts.length === 3) {
        const bMonth = parseInt(parts[1], 10) - 1;
        const bYear = parseInt(parts[0], 10);
        return bMonth === selectedMonth && bYear === currentYearIdx;
      }
      return false;
    });

    // Retroactively pull active overdue items strictly into the current operational window
    if (isCurrentMonth) {
      const overdueBills = bills.filter(b => b.isOverdue && !b.isPaid && !operationalBills.some(ob => ob.id === b.id));
      operationalBills = [...overdueBills, ...operationalBills];
    }
  } else if (isFutureMonth) {
    // === THE AUTOMATED PROJECTION ENGINE ===
    operationalBills = bills
      .filter((b) => b.isRecurring === true)
      .map((b) => {
        let projectedFullDate = "TBD";
        let projectedRawDate = b.rawDate;
        
        if (b.rawDate) {
          const parts = b.rawDate.split("-");
          if (parts.length === 3) {
            const dayString = parts[2];
            const paddedMonth = String(selectedMonth + 1).padStart(2, "0");
            projectedRawDate = `${currentYearIdx}-${paddedMonth}-${dayString}`;
            
            const tempDate = new Date(currentYearIdx, selectedMonth, parseInt(dayString, 10));
            projectedFullDate = tempDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          }
        }

        return {
          ...b,
          id: `projected-${b.id}-${selectedMonth}`,
          isPaid: false, 
          fullDate: projectedFullDate,
          rawDate: projectedRawDate,
          isProjection: true
        };
      });
  }

  // === REFACTOR MATHEMATICAL SUM TOTAL CALIBRATIONS ===
  const totalBillsAmount = operationalBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const paidBills = operationalBills.filter((b) => b.isPaid);
  const paidBillsAmount = paidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const unpaidBills = operationalBills.filter((b) => !b.isPaid);
  const unpaidBillsAmount = unpaidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const progressPercentage = totalBillsAmount === 0 ? 0 : Math.max(0, Math.min((paidBillsAmount / totalBillsAmount) * 100, 100));

  // Countable liquid balance aggregation (excl. goal parameters)
  const countableIncome = accounts.filter(a => !a.isGoal).reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  // Sorting layout mechanics
  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return new Date(a.rawDate) - new Date(b.rawDate);
    });
  };

  // Toggle local section visibility safely
  const toggleLocalSection = (sectionKey) => {
    setLocalCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Group unpaid items structurally for collapsible UI rows inside the targeted month layout view
  const categoryGroupings = {};
  unpaidBills.forEach((bill) => {
    const groupName = bill.category || "Fixed Obligations";
    if (!categoryGroupings[groupName]) categoryGroupings[groupName] = [];
    categoryGroupings[groupName].push(bill);
  });

  const graphicContent = (
    <div className="flex flex-col relative z-10 mb-2 w-full gap-4">
      {/* 👑 MASTER FLOATING PROGRESS SUMMARY CARD */}
      <div className={`relative p-6 rounded-[2rem] border flex items-center justify-between w-full transform transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-white via-slate-50/90 to-slate-100/60 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.3),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
        
        {/* PROGRESS RING */}
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

        {/* DATA METRICS CONTAINER */}
        <div className={`flex-1 pl-4 text-right transform transition-all duration-700 delay-300 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-[#1877F2]">Total Bills Paid</p>
          <p className="font-black tracking-tighter mb-0 leading-none sm:leading-tight">
            <span className={`text-2xl min-[380px]:text-3xl sm:text-4xl block sm:inline ${paidBillsAmount === 0 ? "text-red-500" : "text-[#10B981]"}`}>
              ${paidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm min-[380px]:text-base sm:text-xl text-slate-400 opacity-60 block sm:inline sm:ml-1 mt-1 sm:mt-0">
              / ${totalBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </div>

      {/* === TELEMETRY DUAL METRIC BAR === */}
      <div className={`w-full p-2 rounded-2xl border flex flex-col gap-1.5 transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] font-black tracking-widest uppercase text-slate-400">Telemetry Allocation Ratio</span>
          <span className={`text-[9px] font-black uppercase ${isPastMonth ? "text-slate-500" : isCurrentMonth ? "text-[#10B981]" : "text-orange-500 animate-pulse"}`}>
            {isPastMonth && "Historical Archive"}
            {isCurrentMonth && "Live Operation View"}
            {isFutureMonth && "Projection Model"}
          </span>
        </div>
        
        <div className={`w-full h-6 rounded-xl overflow-hidden flex font-black text-[9px] tracking-wider text-white select-none shadow-inner ${isDarkMode ? "bg-slate-900" : "bg-slate-100"}`}>
          {countableIncome > 0 && (
            <div 
              className="bg-[#10B981] h-full flex items-center pl-2.5 transition-all duration-1000 shadow-md whitespace-nowrap overflow-hidden" 
              style={{ width: `${(countableIncome / Math.max(countableIncome + unpaidBillsAmount, 1)) * 100}%` }}
            >
              {((countableIncome / Math.max(countableIncome + unpaidBillsAmount, 1)) * 100) > 20 && `CASH CAP: $${Math.round(countableIncome).toLocaleString()}`}
            </div>
          )}
          
          {unpaidBillsAmount > 0 && (
            <div 
              className="bg-[#1877F2] h-full flex items-center justify-end pr-2.5 transition-all duration-1000 shadow-md whitespace-nowrap overflow-hidden ml-auto text-right" 
              style={{ width: `${(unpaidBillsAmount / Math.max(countableIncome + unpaidBillsAmount, 1)) * 100}%` }}
            >
              {((unpaidBillsAmount / Math.max(countableIncome + unpaidBillsAmount, 1)) * 100) > 20 && `UNPAID: $${Math.round(unpaidBillsAmount).toLocaleString()}`}
            </div>
          )}

          {countableIncome === 0 && unpaidBillsAmount === 0 && (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">
              No Telemetry Bounds Calculated
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`pb-32 transition-colors duration-500 min-h-screen ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Bills`, graphicContent)}
      
      {/* 📅 12-MONTH HORIZONTAL SCROLLER NAV CONTAINER */}
      <div className="w-full overflow-x-auto hide-scrollbar pl-6 pr-6 mb-2 mt-4 relative z-10">
        <div className="flex gap-2.5 pr-6 pb-2">
          {monthNames.map((name, idx) => {
            const isNavSelected = idx === selectedMonth;
            
            let cardStyle = "";
            let textStyle = "";
            let badgeBlock = null;

            if (isNavSelected) {
              cardStyle = "bg-[#1877F2] text-white border-transparent shadow-[0_4px_15px_rgba(24,119,242,0.4)] scale-105";
              textStyle = "text-white font-black";
            } else {
              cardStyle = isDarkMode ? "bg-[#1E293B] border-slate-800 text-slate-400 hover:text-slate-200" : "bg-white border-slate-100 text-slate-500 hover:text-slate-900 shadow-sm";
              textStyle = isDarkMode ? "text-slate-300 font-bold" : "text-slate-700 font-bold";
            }

            if (idx < currentMonthIdx) {
              badgeBlock = <Archive size={10} className={isNavSelected ? "text-white/80" : "text-slate-400"} />;
            } else if (idx === currentMonthIdx) {
              badgeBlock = <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${isNavSelected ? "bg-white text-[#1877F2]" : "bg-[#10B981]/20 text-[#10B981]"}`}>LIVE</span>;
            } else {
              badgeBlock = <Sparkles size={10} className={isNavSelected ? "text-white/80" : "text-orange-400 animate-pulse"} />;
            }

            return (
              <button
                key={name}
                onClick={() => setSelectedMonth(idx)}
                className={`shrink-0 px-4 py-3 rounded-2xl border flex items-center gap-2.5 transition-all active:scale-95 text-xs uppercase tracking-wider ${cardStyle}`}
              >
                <div className="flex flex-col items-start leading-none">
                  <span className={textStyle}>{name.substring(0, 3)}</span>
                </div>
                {badgeBlock}
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-6 space-y-8 mt-4 relative z-10">
        
        {/* OBLIGATIONS DISPLAY COMPONENT CONTAINER */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {monthNames[selectedMonth]} Obligations
            </h3>
            {isPastMonth && (
              <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                <Archive size={12} /> ARCHIVED LEDGER
              </span>
            )}
            {isFutureMonth && (
              <span className="text-[10px] font-black uppercase text-orange-400 flex items-center gap-1 animate-pulse">
                <Sparkles size={12} /> PROJECTION ENGINE
              </span>
            )}
          </div>

          {operationalBills.length === 0 ? (
            <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-400" : "border-slate-300 bg-slate-50 text-slate-500"}`}>
              <CheckCircle2 size={32} className="mx-auto mb-3 text-[#10B981] opacity-50" />
              <p className="font-bold text-sm">No Bills Identified</p>
              <p className="text-xs mt-1 opacity-70">
                {isPastMonth && "No records exist inside this historical calendar block."}
                {isCurrentMonth && "You have zero unpaid items left on your active grid."}
                {isFutureMonth && "No recurring parameters flag found inside your current database."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(categoryGroupings).map((groupName) => {
                const groupBills = categoryGroupings[groupName] || [];
                const sectionKey = `${selectedMonth}-${groupName}`;
                const isCollapsed = localCollapsedSections[sectionKey];
                const sortedBills = sortBillsSurgically(groupBills);
                const groupSum = groupBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

                return (
                  <div key={groupName} className="space-y-2">
                    {/* SAFE LOCALIZED EXPANDABLE ACCORDION HEADER */}
                    <div 
                      className={`flex justify-between items-center px-4 py-3.5 rounded-2xl border transition-all cursor-pointer ${isDarkMode ? "bg-[#1E293B] border-slate-800/60 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm"}`}
                      onClick={() => toggleLocalSection(sectionKey)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</span>
                        <h4 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{groupName}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isDarkMode ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-500"}`}>{groupBills.length}</span>
                      </div>
                      <span className={`text-xs font-black ${isPastMonth ? "text-slate-400" : "text-[#1877F2]"}`}>
                        ${groupSum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* INTERACTIVE ROWS TREE BLOCK */}
                    {!isCollapsed && (
                      <div className="space-y-2.5 pl-2 transition-all">
                        {sortedBills.map((bill) => {
                          const isUrgent = (bill.isOverdue || bill.payday === "Due Now") && !bill.isPaid;
                          
                          return (
                            <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all ${isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-slate-100/80"}`}>
                              
                              {/* LEVEL 1: Identity Matrix */}
                              <div className="flex items-start justify-between w-full mb-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isUrgent ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                    {bill.icon || "🧾"}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className={`font-black text-sm truncate leading-tight ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                                        {bill.name}
                                      </p>
                                      {bill.isRecurring && <RefreshCw size={10} className="text-[#10B981] shrink-0" />}
                                    </div>
                                    <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase mt-0.5">{bill.payday || "Unscheduled Group"}</span>
                                  </div>
                                </div>
                                
                                {!bill.isProjection && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                                    className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                                  >
                                    <Edit2 size={14} strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>

                              {/* LEVEL 2: Action Controls */}
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex flex-col shrink-0">
                                  <span className={`text-[9px] font-black uppercase tracking-wider ${isUrgent ? "text-red-500" : "text-slate-400"}`}>
                                    {bill.isOverdue && !bill.isPaid ? "OVERDUE" : "DUE DATE"}
                                  </span>
                                  <span className={`text-xs font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                                    {bill.fullDate || "TBD"}
                                  </span>
                                </div>

                                <div className="flex-1 flex justify-center px-1">
                                  {isPastMonth && (
                                    <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center gap-1.5">
                                      <Archive size={12} /> Closed State
                                    </div>
                                  )}

                                  {isFutureMonth && (
                                    <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/10 flex items-center gap-1.5">
                                      <Eye size={12} /> Forecast Node
                                    </div>
                                  )}

                                  {isCurrentMonth && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }}
                                      className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#1877F2] text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                                    >
                                      <CheckCircle2 size={12} strokeWidth={3} /> MARK AS PAID
                                    </button>
                                  )}
                                </div>

                                <div className={`px-2.5 py-1 rounded-[8px] border font-black text-sm tracking-tighter shrink-0 text-[#1877F2] bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/20 drop-shadow-[0_0_10px_rgba(24,119,242,0.4)] whitespace-nowrap`}>
                                  ${(Number(bill.amount) || 0).toFixed(2)}
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SETTLED HISTORICAL BLOCK */}
        {paidBills.length > 0 && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2 px-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paid & Settled</h3>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${isDarkMode ? "bg-emerald-950 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                ${paidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              <div className="space-y-3">
                {sortBillsSurgically(paidBills).map((bill) => (
                  <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all opacity-55 grayscale-[0.2] hover:opacity-100 hover:grayscale-0 ${isDarkMode ? "bg-slate-800/20 border-slate-700/60" : "bg-white border-slate-100"}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                          {bill.icon || "🧾"}
                        </div>
                        <p className="font-black text-sm truncate text-slate-400 line-through leading-tight">
                          {bill.name}
                        </p>
                      </div>

                      {isCurrentMonth ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }}
                          className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-1 shrink-0 ${isDarkMode ? "bg-red-900/10 border-red-900/30 text-red-400 hover:bg-red-900/30" : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"}`}
                        >
                          <RotateCcw size={12} /> Revert
                        </button>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Settled</span>
                      )}
                      
                      <div className="px-2 py-0.5 rounded border font-black text-xs tracking-tight text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        ${(Number(bill.amount) || 0).toFixed(2)}
                      </div>
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
