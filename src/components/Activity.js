import React, { useState, useEffect, useMemo } from "react";
import { Search, Edit2, ChevronUp, ChevronDown } from "lucide-react";

export default function Activity({ 
  userName,
  transactions, 
  activitySearch, 
  setActivitySearch, 
  activityFilter,
  setActivityFilter, 
  isDarkMode, 
  setSelectedEntry, 
  renderHeroShell,
  signatureColor 
}) {
  const [isMounted, setIsMounted] = useState(false);

  // === UPGRADED SYNCHRONOUS STATE ENGINE (ZERO-FLASH GUARANTEE) ===
  const [userToggledMonths, setUserToggledMonths] = useState({});
  const [userToggledToday, setUserToggledToday] = useState(null);
  const [prevSearch, setPrevSearch] = useState(activitySearch);
  const [prevFilter, setPrevFilter] = useState(activityFilter);

  // This block catches tab-switches and filter changes instantly before the screen draws
  if (activitySearch !== prevSearch || activityFilter !== prevFilter) {
    setPrevSearch(activitySearch);
    setPrevFilter(activityFilter);
    setUserToggledMonths({});
    setUserToggledToday(null);
  }

  const isSearching = activitySearch.trim() !== "" || activityFilter !== "All";
  const actualIsTodayCollapsed = userToggledToday !== null ? userToggledToday : false;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. THE VISUAL FEED ENGINE (Lets everything through for the audit trail)
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(activitySearch.toLowerCase()) ||
      (tx.category && tx.category.toLowerCase().includes(activitySearch.toLowerCase()));
    const matchesFilter = activityFilter === "All" || tx.type === activityFilter;
    return matchesSearch && matchesFilter;
  });

  const todayTransactions = useMemo(() => {
    const todayObj = new Date();
    const currentYear = todayObj.getFullYear();
    const currentMonth = todayObj.getMonth();
    const currentDate = todayObj.getDate();

    return filteredTransactions.filter(tx => {
      const d = new Date(tx.rawDate || tx.date || todayObj);
      if (d.getFullYear() === 2001) d.setFullYear(currentYear);
      
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === currentDate;
    });
  }, [filteredTransactions]);

  // 2. THE SCOREBOARD MATH ENGINE (Strictly firewalled to external wealth - FIRST TOUCH PRINCIPLE)
  const todayTotals = useMemo(() => {
    let pureInflow = 0;
    let rawOutflow = 0;
    let refunds = 0;
    
    todayTransactions.forEach(tx => {
      const isInternalTransfer = tx.category === "Transfers (Venmo/Zelle)" && !tx.isDirectGoalEntry;

      // INFLOW: External income counts (including QAB directly to Goals). Internal Transfers & Cash Outs are ignored.
      if (tx.type === "Income" && !isInternalTransfer && !tx.isCashOut) {
        pureInflow += Number(tx.amount) || 0;
      }
      // OUTFLOW: External expenses count. Internal Transfers are ignored.
      if (tx.type === "Expense" && !isInternalTransfer) {
        rawOutflow += Number(tx.amount) || 0;
      }
      if (tx.isRefund) {
        refunds += Number(tx.amount) || 0;
      }
    });

    // SPILLOVER PROTOCOL
    let finalOutflow = rawOutflow - refunds;
    let finalInflow = pureInflow;

    if (finalOutflow < 0) {
      finalInflow += Math.abs(finalOutflow);
      finalOutflow = 0;
    }

    return { inflow: finalInflow, outflow: finalOutflow };
  }, [todayTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups = {};
    const todayObj = new Date();
    const currentYear = todayObj.getFullYear();
    const currentMonth = todayObj.getMonth();
    const currentDate = todayObj.getDate();

    filteredTransactions.forEach(tx => {
      const d = new Date(tx.rawDate || tx.date || todayObj);
      if (d.getFullYear() === 2001) d.setFullYear(currentYear);

      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === currentDate) {
        return;
      }

      const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      
      if (!groups[monthYear]) {
        groups[monthYear] = {
          label: monthYear,
          timestamp: d.getTime(), 
          transactions: [],
          pureInflow: 0,
          rawOutflow: 0,
          refunds: 0
        };
      }
      groups[monthYear].transactions.push(tx);
      
      // Localized Math Firewall: Archive Loop (FIRST TOUCH PRINCIPLE)
      const isInternalTransfer = tx.category === "Transfers (Venmo/Zelle)" && !tx.isDirectGoalEntry;

      if (tx.type === "Income" && !isInternalTransfer && !tx.isCashOut) {
        groups[monthYear].pureInflow += Number(tx.amount) || 0;
      }
      if (tx.type === "Expense" && !isInternalTransfer) {
        groups[monthYear].rawOutflow += Number(tx.amount) || 0;
      }
      if (tx.isRefund) {
        groups[monthYear].refunds += Number(tx.amount) || 0;
      }
    });

    return Object.values(groups).map(g => {
      // SPILLOVER PROTOCOL
      let outflow = g.rawOutflow - g.refunds;
      let inflow = g.pureInflow;
      
      if (outflow < 0) {
        inflow += Math.abs(outflow);
        outflow = 0;
      }
      
      return {
        label: g.label,
        timestamp: g.timestamp,
        transactions: g.transactions,
        inflow,
        outflow
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredTransactions]);

  const toggleMonth = (monthLabel, currentCollapseState) => {
    setUserToggledMonths(prev => ({ ...prev, [monthLabel]: !currentCollapseState }));
  };

  const formatActivityDate = (dateStr, groupLabel) => {
    if (!dateStr) return "TODAY";
    const groupYear = groupLabel ? (groupLabel.split(" ")[1] || new Date().getFullYear()) : new Date().getFullYear();
    return dateStr.replace(/2001/g, groupYear);
  };

  // ==========================================
  // EXPENSE REFUND & SPILLOVER PROTOCOL: HERO DATA MASTER
  // ==========================================
  
  const pureIncome = transactions
    .filter(t => {
      const isInternalTransfer = t.category === "Transfers (Venmo/Zelle)" && !t.isDirectGoalEntry;
      return t.type === "Income" && !isInternalTransfer && !t.isCashOut;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const rawExpense = transactions
    .filter(t => {
      const isInternalTransfer = t.category === "Transfers (Venmo/Zelle)" && !t.isDirectGoalEntry;
      return t.type === "Expense" && !isInternalTransfer;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const actualRefunds = transactions
    .filter(t => t.isRefund)
    .reduce((sum, t) => sum + t.amount, 0);

  let totalExpense = rawExpense - actualRefunds;
  let totalIncome = pureIncome;

  if (totalExpense < 0) {
    totalIncome += Math.abs(totalExpense);
    totalExpense = 0;
  }
  
  const netCashFlow = totalIncome - totalExpense;
  const totalVolume = totalIncome + Math.abs(totalExpense);
  const inPercentage = totalVolume > 0 ? (totalIncome / totalVolume) * 100 : 50;

  const isIncomeView = activityFilter === "Income";
  
  const targetTransactions = isIncomeView 
    ? transactions.filter(t => {
        const isInternalTransfer = t.category === "Transfers (Venmo/Zelle)" && !t.isDirectGoalEntry;
        return t.type === "Income" && !isInternalTransfer && !t.isCashOut;
      }) 
    : transactions.filter(t => {
        const isInternalTransfer = t.category === "Transfers (Venmo/Zelle)" && !t.isDirectGoalEntry;
        return t.type === "Expense" && !isInternalTransfer;
      }); 

  const totalTargetAmount = targetTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoriesMap = targetTransactions.reduce((acc, t) => {
    const catName = t.category || "Uncategorized";
    acc[catName] = (acc[catName] || 0) + t.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1]);
  
  const topCategories = sortedCategories.slice(0, 10);

  // === BRAND-SAFE CATEGORY COLOR PALETTE ===
  const colors = isIncomeView 
    ? ["#10B981", "#059669", "#047857", "#34D399", "#064E3B", "#6EE7B7", "#A7F3D0", "#0D9488", "#14B8A6", "#115E59"] 
    : ["#A855F7", "#EC4899", "#06B6D4", "#EAB308", "#14B8A6", "#F43F5E", "#6366F1", "#D946EF", "#84CC16", "#475569"]; 

  const maxCategoryValue = topCategories.length > 0 ? topCategories[0][1] : 1;

  const leaderboardSegments = topCategories.map(([name, amount], index) => {
    const overallPercentage = totalTargetAmount > 0 ? amount / totalTargetAmount : 0;
    const relativeBarWidth = maxCategoryValue > 0 ? (amount / maxCategoryValue) * 100 : 0;
    return { name, amount, overallPercentage, relativeBarWidth, color: colors[index] };
  });

  const getTxAmountClasses = (tx, isDark) => {
    if (tx.isBillPayment || tx.category === "Bill Payment") {
      return tx.isPaid === false
        ? isDark
          ? "bg-red-500/20 text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]"
          : "bg-red-50 text-red-600 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]"
        : isDark 
          ? "bg-[#1877F2]/20 text-[#1877F2] drop-shadow-[0_0_12px_rgba(24,119,242,0.7)]" 
          : "bg-blue-50 text-[#1877F2] drop-shadow-[0_0_12px_rgba(24,119,242,0.7)]";
    }
    if (tx.type === "Income") {
      return isDark 
        ? "bg-emerald-900/30 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]" 
        : "bg-emerald-50 text-emerald-600 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]";
    }
    return isDark 
      ? "bg-orange-900/30 text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]" 
      : "bg-orange-50 text-orange-600 drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]";
  };

  const getTxCategoryColor = (tx) => {
    const isInternalTransfer = tx.category === "Transfers (Venmo/Zelle)" && !tx.isDirectGoalEntry;
    if (tx.isCashOut || isInternalTransfer) return isDarkMode ? "text-slate-400" : "text-slate-500";
    if (tx.isDirectGoalEntry || tx.type === "Income") return "text-[#10B981]";
    if (tx.isBillPayment || tx.category === "Bill Payment") return "text-[#1877F2]";
    return "text-[#F97316]";
  };

  const graphicContent = useMemo(() => (
    <div className="flex flex-col relative z-10 mb-2 w-full">
      <div className={`relative pt-10 pb-6 px-6 rounded-[2rem] border flex flex-col w-full transform transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-blue-600/20 via-white via-25% to-slate-50 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.15),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
          
        <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-black"}`}>
            Net Cash Flow & Receipts
          </span>
        </div>

        <div className={`text-center w-full transform transition-all duration-700 delay-100 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className={`text-5xl font-black tracking-tighter transition-all duration-300 mb-6 ${netCashFlow >= 0 ? "text-[#10B981]" : "text-red-500"}`}>
            {netCashFlow >= 0 ? "+" : "-"}${Math.abs(netCashFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`w-full transform transition-all duration-700 delay-200 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className={`w-full h-10 rounded-full flex overflow-hidden shadow-inner ${isDarkMode ? "bg-[#1E293B]" : "bg-slate-100"}`}>
            <div 
              className="h-full bg-[#10B981] flex items-center justify-start px-4 transition-all duration-1000" 
              style={{ width: isMounted ? `${inPercentage}%` : "0%" }}
            >
              {inPercentage > 15 && <span className="text-[10px] font-black text-white uppercase tracking-widest">IN</span>}
            </div>
            <div 
              className="h-full bg-[#F97316] flex items-center justify-end px-4 transition-all duration-1000" 
              style={{ width: isMounted ? `${100 - inPercentage}%` : "0%" }}
            >
               {(100 - inPercentage) > 15 && <span className="text-[10px] font-black text-white uppercase tracking-widest">OUT</span>}
            </div>
          </div>
        </div>

        {/* SURGICAL FIX: Added responsive layout handling to the inflow/outflow scoreboard text row */}
        <div className={`flex flex-col sm:flex-row justify-center items-center w-full gap-2 sm:gap-3 mt-4 pt-2 border-t border-dashed transform transition-all duration-700 delay-300 ease-out ${isDarkMode ? "border-slate-700/50" : "border-slate-200/60"} ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}>
          <span className="text-sm font-black uppercase tracking-widest text-emerald-500 text-center">
            +${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} In
          </span>
          <span className={`hidden sm:inline text-[10px] font-black ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>|</span>
          <span className="text-sm font-black uppercase tracking-widest text-[#F97316] text-center">
            {totalExpense >= 0 ? "-" : "+"}${Math.abs(totalExpense).toLocaleString("en-US", { minimumFractionDigits: 2 })} Out
          </span>
        </div>

      </div>
    </div>
  ), [isMounted, isDarkMode, netCashFlow, inPercentage, totalIncome, totalExpense]);

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 min-h-screen ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
          
      <div className={`relative z-10 transform transition-all duration-700 delay-150 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {renderHeroShell(`${userName}'s Activities`, graphicContent)}
      </div>

      <main className="px-6 space-y-6 mt-4">

        {/* --- DYNAMIC TARGET CARD BREAKDOWN SYSTEM --- */}
        {activityFilter !== "All" && totalTargetAmount > 0 && (
          <div className={`p-6 rounded-[2rem] border flex flex-col ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-blue-600/20 via-white via-25% to-slate-50 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.15),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
            
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-slate-400/30">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {isIncomeView ? "Inflow Breakdown" : "Outflow Breakdown"}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                MY Top 10 Categories
              </span>
            </div>

            <div className="space-y-4 max-h-40 overflow-y-auto hide-scrollbar pr-2">
              {leaderboardSegments.map((seg, i) => (
                <div key={i} className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-bold uppercase truncate pr-2 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {seg.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        {Math.round(seg.overallPercentage * 100)}%
                      </span>
                      <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        ${seg.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900 shadow-inner" : "bg-slate-100"}`}>
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.max(2, seg.relativeBarWidth)}%`, backgroundColor: seg.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TOGGLE FILTER SWITCH NAVIGATION PACK --- */}
        <div className="flex gap-3">
           <button 
             onClick={() => setActivityFilter(activityFilter === "Income" ? "All" : "Income")} 
             className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all ${
               activityFilter === "Income" 
                 ? "text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] transform -translate-y-0.5" 
                 : isDarkMode ? "bg-[#1E293B] text-slate-400 border border-slate-800" : "bg-white text-slate-400 border border-slate-100"
             }`}
             style={{ backgroundColor: activityFilter === "Income" ? "#10B981" : undefined }}
           >
             <span className="font-black text-xs uppercase tracking-widest">Income</span>
             {activityFilter === "Income" && (
               <span className="text-[9px] font-bold mt-1 tracking-wider opacity-90">Tap to exit breakdown view</span>
             )}
          </button>
           <button 
             onClick={() => setActivityFilter(activityFilter === "Expense" ? "All" : "Expense")} 
             className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all ${
               activityFilter === "Expense" 
                 ? "text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] transform -translate-y-0.5" 
                 : isDarkMode ? "bg-[#1E293B] text-slate-400 border border-slate-800" : "bg-white text-slate-400 border border-slate-100"
             }`}
             style={{ backgroundColor: activityFilter === "Expense" ? "#F97316" : undefined }}
           >
             <span className="font-black text-xs uppercase tracking-widest">Expenses</span>
             {activityFilter === "Expense" && (
               <span className="text-[9px] font-bold mt-1 tracking-wider opacity-90">Tap to exit breakdown view</span>
             )}
          </button>
        </div>

        {/* === SURGICAL FIX: Repositioned Search Bar above the primary divider line === */}
        <div className="flex gap-2">
          <div className={`flex-1 flex items-center px-4 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-800 text-white focus-within:border-slate-600" : "bg-white border-slate-100 text-slate-900 focus-within:border-[#1877F2]"}`}>
            <Search size={18} className="text-slate-400 shrink-0" />
            <input 
              type="text" placeholder="Search transactions..."
              value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full py-4 px-3 bg-transparent text-sm font-bold outline-none placeholder-slate-400"
            />
          </div>
        </div>

        <div className={`border-t relative z-10 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

        {/* --- PRIMARY TRANSACTION TIMELINE CONTAINER LEDGER --- */}
        <div className="space-y-4">
         {groupedTransactions.length === 0 && todayTransactions.length === 0 ? (
            <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
               <div className="py-10 text-center text-slate-400 font-bold text-sm uppercase tracking-widest">No activities found.</div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {todayTransactions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-col px-2 py-2 cursor-pointer transition-colors" onClick={() => setUserToggledToday(!actualIsTodayCollapsed)}>
                    <div className="flex justify-between items-center w-full gap-2">
                      <div className="flex items-center gap-2 shrink-0">
                        <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: signatureColor || "#1877F2" }}>TODAY</h3>
                        <div className="text-slate-500 mb-0.5">{actualIsTodayCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                          +${todayTotals.inflow.toLocaleString("en-US", { minimumFractionDigits: 2 })} In
                        </span>
                        <span className={`text-[10px] ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>|</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">
                          {todayTotals.outflow >= 0 ? "-" : "+"}${Math.abs(todayTotals.outflow).toLocaleString("en-US", { minimumFractionDigits: 2 })} Out
                        </span>
                      </div>
                    </div>
                  </div>

                  {!actualIsTodayCollapsed && (
                    <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                      <div className="space-y-3">
                        {todayTransactions.map((tx) => (
                          <div key={tx.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                            <div className="flex items-start justify-between w-full mb-4">
                              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setSelectedEntry(tx)}>
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                  {tx.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm break-words whitespace-normal leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedEntry(tx); }}
                                className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                              >
                                <Edit2 size={16} strokeWidth={2.5} />
                              </button>
                            </div>

                            <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-2 ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}>
                              <div className="flex-1 min-w-0 flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest truncate leading-tight ${getTxCategoryColor(tx)}`}>
                                  {/* THE AUDIT TRAIL: Clear visual tagging for internal movements */}
                                  {tx.isCashOut ? "💸 CASHED OUT" : tx.isDirectGoalEntry ? "🔒 SAVED TO GOAL" : (tx.category || "Uncategorized")}
                                </span>
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest truncate leading-tight mt-0.5">
                                  {formatActivityDate(tx.date, null)}
                                </span>
                              </div>
                              <div className="shrink-0 flex justify-end">
                                <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight whitespace-nowrap transition-colors ${getTxAmountClasses(tx, isDarkMode)}`}>
                                  {tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {groupedTransactions.map((group, index) => {
                const isDefaultCollapsed = isSearching ? false : (index !== 0 || todayTransactions.length > 0);
                const isCollapsed = userToggledMonths[group.label] !== undefined 
                  ? userToggledMonths[group.label] 
                  : isDefaultCollapsed;

                return (
                 <div key={group.label} className="space-y-2">
                   
                   <div className="flex flex-col px-2 py-2 cursor-pointer transition-colors" onClick={() => toggleMonth(group.label, isCollapsed)}>
                     <div className="flex justify-between items-center w-full gap-2">
                        <div className="flex items-center gap-2 shrink-0">
                           <h3 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{group.label}</h3>
                           <div className="text-slate-500 mb-0.5">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                             +${group.inflow.toLocaleString("en-US", { minimumFractionDigits: 2 })} In
                           </span>
                           <span className={`text-[10px] ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>|</span>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">
                             {group.outflow >= 0 ? "-" : "+"}${Math.abs(group.outflow).toLocaleString("en-US", { minimumFractionDigits: 2 })} Out
                           </span>
                        </div>
                     </div>
                   </div>

                   {!isCollapsed && (
                     <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                       <div className="space-y-3">
                         {group.transactions.map((tx) => (
                           <div key={tx.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                             
                             <div className="flex items-start justify-between w-full mb-4">
                                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setSelectedEntry(tx)}>
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                    {tx.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-sm break-words whitespace-normal leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedEntry(tx); }}
                                  className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                                >
                                  <Edit2 size={16} strokeWidth={2.5} />
                                </button>
                             </div>

                             <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-2 ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className={`text-[10px] font-black uppercase tracking-widest truncate leading-tight ${getTxCategoryColor(tx)}`}>
                                    {tx.isCashOut ? "💸 CASHED OUT" : tx.isDirectGoalEntry ? "🔒 SAVED TO GOAL" : (tx.category || "Uncategorized")}
                                  </span>
                                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest truncate leading-tight mt-0.5">
                                    {formatActivityDate(tx.date, group.label)}
                                  </span>
                                </div>
                                
                                <div className="shrink-0 flex justify-end">
                                  <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight whitespace-nowrap transition-colors ${getTxAmountClasses(tx, isDarkMode)}`}>
                                    {tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}
                                  </div>
                                </div>
                             </div>

                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
