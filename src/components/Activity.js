import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Edit2, ChevronUp, ChevronDown } from "lucide-react";
import { useLedger } from "../context/LedgerContext";

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
  const { currencySymbol = "$" } = useLedger();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const horizontalScrollRef = useRef(null);

  // === UPGRADED SYNCHRONOUS STATE ENGINE (ZERO-FLASH GUARANTEE) ===
  const [userToggledMonths, setUserToggledMonths] = useState({});
  const [userToggledToday, setUserToggledToday] = useState(null);
  const [prevSearch, setPrevSearch] = useState(activitySearch);
  const [prevFilter, setPrevFilter] = useState(activityFilter);

  // Catch tab-switches and filter changes instantly before the screen draws
  if (activitySearch !== prevSearch || activityFilter !== prevFilter) {
    setPrevSearch(activitySearch);
    setPrevFilter(activityFilter);
    setUserToggledMonths({});
    setUserToggledToday(null);
  }

  const isSearching = activitySearch.trim() !== "" || activityFilter !== "All";
  const actualIsTodayCollapsed = userToggledToday !== null ? userToggledToday : false;

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
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

  useEffect(() => {
    setIsMounted(true);
    setSelectedMonth(currentMonthIndex);

    const centerActiveMonthCard = () => {
      if (horizontalScrollRef.current) {
        const container = horizontalScrollRef.current;
        const activeCard = document.getElementById("activity-current-month-anchor");
        
        if (activeCard) {
          const containerWidth = container.clientWidth;
          const cardLeft = activeCard.offsetLeft;
          const cardWidth = activeCard.clientWidth;
          
          const targetScrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);
          
          container.scrollTo({
            left: Math.max(0, targetScrollPosition),
            behavior: "smooth"
          });
        }
      }
    };

    requestAnimationFrame(() => {
      setTimeout(centerActiveMonthCard, 350);
    });
    window.addEventListener("resize", centerActiveMonthCard);
    
    return () => {
      window.removeEventListener("resize", centerActiveMonthCard);
    };
  }, [currentMonthIndex]);

  // Monthly breakdown metrics for horizontal overview carousel
  const getMonthActivityMetrics = (mIdx) => {
    let pureIn = 0;
    let rawOut = 0;
    let ref = 0;

    transactions.forEach(tx => {
      const d = new Date(tx.rawDate || tx.date || new Date());
      if (d.getFullYear() === 2001) d.setFullYear(currentYear);

      if (d.getFullYear() === currentYear && d.getMonth() === mIdx) {
        const isInternalTransfer = tx.category === "Transfers (Venmo/Zelle)" && !tx.isDirectGoalEntry;

        if (tx.type === "Income" && !isInternalTransfer && !tx.isCashOut) {
          pureIn += Number(tx.amount) || 0;
        }
        if (tx.type === "Expense" && !isInternalTransfer) {
          rawOut += Number(tx.amount) || 0;
        }
        if (tx.isRefund) {
          ref += Number(tx.amount) || 0;
        }
      }
    });

    let finalOut = rawOut - ref;
    let finalIn = pureIn;
    if (finalOut < 0) {
      finalIn += Math.abs(finalOut);
      finalOut = 0;
    }

    const net = finalIn - finalOut;
    return { inflow: finalIn, outflow: finalOut, net };
  };

  // 1. THE VISUAL FEED ENGINE (Lets everything through for the audit trail)
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(activitySearch.toLowerCase()) ||
      (tx.category && tx.category.toLowerCase().includes(activitySearch.toLowerCase()));
    const matchesFilter = activityFilter === "All" || tx.type === activityFilter;
    return matchesSearch && matchesFilter;
  });

  const todayTransactions = useMemo(() => {
    const todayObj = new Date();
    const cYear = todayObj.getFullYear();
    const cMonth = todayObj.getMonth();
    const cDate = todayObj.getDate();

    return filteredTransactions.filter(tx => {
      const d = new Date(tx.rawDate || tx.date || todayObj);
      if (d.getFullYear() === 2001) d.setFullYear(cYear);
      
      return d.getFullYear() === cYear && d.getMonth() === cMonth && d.getDate() === cDate;
    });
  }, [filteredTransactions]);

  // 2. THE SCOREBOARD MATH ENGINE (Strictly firewalled to external wealth - FIRST TOUCH PRINCIPLE)
  const todayTotals = useMemo(() => {
    let pureInflow = 0;
    let rawOutflow = 0;
    let refunds = 0;
    
    todayTransactions.forEach(tx => {
      const isInternalTransfer = tx.category === "Transfers (Venmo/Zelle)" && !tx.isDirectGoalEntry;

      if (tx.type === "Income" && !isInternalTransfer && !tx.isCashOut) {
        pureInflow += Number(tx.amount) || 0;
      }
      if (tx.type === "Expense" && !isInternalTransfer) {
        rawOutflow += Number(tx.amount) || 0;
      }
      if (tx.isRefund) {
        refunds += Number(tx.amount) || 0;
      }
    });

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
    const cYear = todayObj.getFullYear();
    const cMonth = todayObj.getMonth();
    const cDate = todayObj.getDate();

    filteredTransactions.forEach(tx => {
      const d = new Date(tx.rawDate || tx.date || todayObj);
      if (d.getFullYear() === 2001) d.setFullYear(cYear);

      if (d.getFullYear() === cYear && d.getMonth() === cMonth && d.getDate() === cDate) {
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

  const colors = [
    "#A855F7", "#EC4899", "#06B6D4", "#EAB308",
    "#D946EF", "#F43F5E", "#6366F1", "#8B5CF6",
    "#C084FC", "#38BDF8", "#14B8A6", "#64748B"
  ];

  const maxCategoryValue = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  const leaderboardSegments = sortedCategories.map(([name, amount], index) => {
    const overallPercentage = totalTargetAmount > 0 ? amount / totalTargetAmount : 0;
    const relativeBarWidth = maxCategoryValue > 0 ? (amount / maxCategoryValue) * 100 : 0;
    return { name, amount, overallPercentage, relativeBarWidth, color: colors[index % colors.length] };
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
            {netCashFlow >= 0 ? "+" : "-"}{currencySymbol}{Math.abs(netCashFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* IN/OUT progress bar */}
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

        {/* 3-Column Grid */}
        <div className={`grid grid-cols-[1fr_auto_1fr] items-center w-full mt-4 pt-2 border-t border-dashed transform transition-all duration-700 delay-300 ease-out ${isDarkMode ? "border-slate-700/50" : "border-slate-200/60"} ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"} text-[11px] min-[360px]:text-[13px] sm:text-sm whitespace-nowrap`}>
          <div className="text-right">
            <span className="font-black uppercase tracking-widest text-emerald-500 pr-2">
              +{currencySymbol}{totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} In
            </span>
          </div>
          <span className={`text-[10px] font-black px-1 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>|</span>
          <div className="text-left">
            <span className="font-black uppercase tracking-widest text-[#F97316] pl-2">
              {totalExpense >= 0 ? "-" : "+"}{currencySymbol}{Math.abs(totalExpense).toLocaleString("en-US", { minimumFractionDigits: 2 })} Out
            </span>
          </div>
        </div>

      </div>
    </div>
  ), [isMounted, isDarkMode, netCashFlow, inPercentage, totalIncome, totalExpense, currencySymbol]);

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 min-h-screen ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
          
      <div className={`relative z-10 transform transition-all duration-700 delay-150 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {renderHeroShell(`${userName}'s Activities`, graphicContent)}
      </div>

      <div className={`mx-6 mt-6 mb-4 border-t relative z-10 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

      {/* 2026 MONTHLY OVERVIEWS SECTION */}
      <div className="px-6 relative z-10 mb-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">
          {currentYear} MONTHLY OVERVIEWS
        </h3>
      </div>
      
      <div ref={horizontalScrollRef} className="w-full overflow-x-auto hide-scrollbar pl-6 pr-6 mb-6 relative z-10 pt-2">
        <div className="flex gap-4 pr-6 pb-2 min-h-[170px] snap-x snap-mandatory">
          {monthsData.map((m) => {
            const { inflow, outflow, net } = getMonthActivityMetrics(m.idx);
            const isSelected = selectedMonth === m.idx;
            const isCurrentMonth = m.idx === currentMonthIndex;

            let cardBackgroundClass = "";
            let buttonText = "";
            let buttonStyleClass = "";
            let customIdAttribute = null;

            if (isCurrentMonth) {
              customIdAttribute = "activity-current-month-anchor";
              if (isSelected) {
                cardBackgroundClass = isDarkMode ? "bg-blue-900/20 border-blue-500 shadow-md scale-[1.01]" : "bg-blue-50/80 border-blue-300 shadow-[0_4px_20px_rgba(24,119,242,0.15)] scale-[1.01]";
                buttonText = "SELECTED MONTH";
                buttonStyleClass = "bg-[#1877F2] text-white shadow-md font-black border border-transparent";
              } else {
                cardBackgroundClass = isDarkMode ? "bg-[#1E293B] border-[#1877F2] shadow-[0_0_35px_rgba(24,119,242,0.65)] border-2 scale-[1.01]" : "bg-white border-[#1877F2] shadow-[0_0_30px_rgba(24,119,242,0.45)] border-2 scale-[1.01]";
                buttonText = "VIEW DETAILS";
                buttonStyleClass = isDarkMode ? "bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700 font-bold shadow-sm" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold shadow-sm";
              }
            } else {
              if (isSelected) {
                cardBackgroundClass = isDarkMode ? "bg-blue-900/20 border-blue-500 shadow-md scale-[1.01]" : "bg-blue-50/80 border-blue-300 shadow-[0_4px_20px_rgba(24,119,242,0.15)] scale-[1.01]";
                buttonText = "SELECTED MONTH";
                buttonStyleClass = "bg-[#1877F2] text-white shadow-md font-black border border-transparent";
              } else {
                cardBackgroundClass = isDarkMode ? "bg-[#1E293B] border-slate-700 shadow-md" : "bg-white/90 backdrop-blur-sm border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]";
                buttonText = "SELECT MONTH";
                buttonStyleClass = isDarkMode ? "bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700 font-bold shadow-sm" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold shadow-sm";
              }
            }
            
            return (
              <div
                key={m.idx}
                id={customIdAttribute}
                onClick={() => setSelectedMonth(m.idx)}
                className={`shrink-0 w-52 p-5 rounded-[1.75rem] border cursor-pointer active:scale-[0.95] snap-center transition-all flex flex-col justify-between h-44 ${cardBackgroundClass}`}
              >
                <div className="flex justify-between items-center w-full">
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-[#1877F2]" : "text-slate-400"}`}>{m.name}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{currentYear}</span>
                </div>

                <div className="text-center pt-1.5 pb-1">
                  <p className={`text-2xl font-black tracking-tighter leading-none mb-1 ${net >= 0 ? "text-[#10B981]" : "text-red-500"}`}>
                    {net >= 0 ? "+" : "-"}{currencySymbol}{Math.abs(net).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-slate-900"} leading-none block`}>
                    NET CASH FLOW
                  </span>
                </div>

                <div className={`w-full py-1.5 rounded-xl text-center text-[9px] tracking-wider transition-all uppercase ${buttonStyleClass}`}>
                  {buttonText}
                </div>

                <div className="flex justify-between items-end w-full pt-2">
                  <div className="flex flex-col flex-1">
                    <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white opacity-40" : "text-black opacity-40"}`}>Inflow</span>
                    <span className="text-[10px] font-black text-emerald-500">+{currencySymbol}{inflow.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white opacity-40" : "text-black opacity-40"}`}>Outflow</span>
                    <span className="text-[10px] font-black text-[#F97316]">-{currencySymbol}{outflow.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mx-6 mb-6 border-t relative z-10 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

      <main className="px-6 space-y-6 mt-4">

        {/* --- DYNAMIC TARGET CARD BREAKDOWN SYSTEM --- */}
        {activityFilter !== "All" && totalTargetAmount > 0 && (
          <div className={`p-6 rounded-[2rem] border flex flex-col ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-blue-600/20 via-white via-25% to-slate-50 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.15),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
            
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-slate-400/30">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {isIncomeView ? "Inflow Breakdown" : "Outflow Breakdown"}
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
                        {currencySymbol}{seg.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        {/* --- TOGGLE FILTER SWITCH NAVIGATION PACK WITH THIN GREEN & ORANGE BORDERS --- */}
        <div className="flex gap-2 min-[380px]:gap-3">
           <button 
             onClick={() => setActivityFilter(activityFilter === "Income" ? "All" : "Income")} 
             className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-2xl border border-[#10B981] transition-all ${
               activityFilter === "Income" 
                 ? "bg-[#10B981] text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] transform -translate-y-0.5" 
                 : isDarkMode ? "bg-[#1E293B] text-[#10B981] hover:bg-slate-800" : "bg-white text-[#10B981] hover:bg-emerald-50/40"
             }`}
           >
             <span className="font-black text-[10px] min-[380px]:text-xs uppercase tracking-widest text-center leading-tight">My Income Breakdown</span>
             {activityFilter === "Income" && (
               <span className="text-[8px] min-[380px]:text-[9px] font-bold mt-1 tracking-wider opacity-90 text-center">Tap to exit breakdown view</span>
             )}
          </button>
           <button 
             onClick={() => setActivityFilter(activityFilter === "Expense" ? "All" : "Expense")} 
             className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-2xl border border-[#F97316] transition-all ${
               activityFilter === "Expense" 
                 ? "bg-[#F97316] text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] transform -translate-y-0.5" 
                 : isDarkMode ? "bg-[#1E293B] text-[#F97316] hover:bg-slate-800" : "bg-white text-[#F97316] hover:bg-orange-50/40"
             }`}
           >
             <span className="font-black text-[10px] min-[380px]:text-xs uppercase tracking-widest text-center leading-tight">My Expense Breakdown</span>
             {activityFilter === "Expense" && (
               <span className="text-[8px] min-[380px]:text-[9px] font-bold mt-1 tracking-wider opacity-90 text-center">Tap to exit breakdown view</span>
             )}
          </button>
        </div>

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
                          +{currencySymbol}{todayTotals.inflow.toLocaleString("en-US", { minimumFractionDigits: 2 })} In
                        </span>
                        <span className={`text-[10px] ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>|</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">
                          {todayTotals.outflow >= 0 ? "-" : "+"}{currencySymbol}{Math.abs(todayTotals.outflow).toLocaleString("en-US", { minimumFractionDigits: 2 })} Out
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
                                  {tx.isCashOut ? "💸 CASHED OUT" : tx.isDirectGoalEntry ? "🔒 SAVED TO GOAL" : (tx.category || "Uncategorized")}
                                </span>
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest truncate leading-tight mt-0.5">
                                  {formatActivityDate(tx.date, null)}
                                </span>
                              </div>
                              <div className="shrink-0 flex justify-end">
                                <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight whitespace-nowrap transition-colors ${getTxAmountClasses(tx, isDarkMode)}`}>
                                  {tx.type === "Income" ? "+" : "-"}{currencySymbol}{tx.amount.toFixed(2)}
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
                             +{currencySymbol}{group.inflow.toLocaleString("en-US", { minimumFractionDigits: 2 })} In
                           </span>
                           <span className={`text-[10px] ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>|</span>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">
                             {group.outflow >= 0 ? "-" : "+"}{currencySymbol}{Math.abs(group.outflow).toLocaleString("en-US", { minimumFractionDigits: 2 })} Out
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
                                    {tx.type === "Income" ? "+" : "-"}{currencySymbol}{tx.amount.toFixed(2)}
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
