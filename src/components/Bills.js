import React, { useState, useEffect, useRef } from "react";
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
  toggleCollapse,
  liveHeroBalance,
  accountsHeroBalance,
  totalLiveIncome,
  accounts = [],
  signatureColor = "#1877F2"
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [expandedMonthIdx, setExpandedMonthIdx] = useState(() => new Date().getMonth());
  
  const horizontalScrollRef = useRef(null);
  const rawLiveIncomeValue = typeof liveHeroBalance !== "undefined" && liveHeroBalance !== null ?
    liveHeroBalance 
    : typeof accountsHeroBalance !== "undefined" && accountsHeroBalance !== null ?
    accountsHeroBalance 
    : typeof totalLiveIncome !== "undefined" && totalLiveIncome !== null ?
    totalLiveIncome 
    : null;

  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    const currentMonthIndex = today.getMonth();
    setSelectedMonth(currentMonthIndex);
    setExpandedMonthIdx(currentMonthIndex);

    const centerActiveMonthCard = () => {
      if (horizontalScrollRef.current) {
        const container = horizontalScrollRef.current;
        const activeCard = document.getElementById("current-month-scroll-anchor");
        
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
    return () => window.removeEventListener("resize", centerActiveMonthCard);
  }, []);

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

  const getClosingBalanceForMonth = (mIdx) => {
    if (mIdx === currentMonthIndex) {
      const liveAccountsTotal = accounts
        .filter(a => !a.isGoal)
        .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
      if (liveAccountsTotal !== 0) {
        return liveAccountsTotal;
      }

      if (rawLiveIncomeValue !== null && Number(rawLiveIncomeValue) !== 0) {
        return Number(rawLiveIncomeValue);
      }

      const activeMonthIncome = bills.filter((b) => {
        if (!b.isIncome || !b.rawDate) return false;
        const parts = b.rawDate.split("-");
        if (parts.length !== 3) return false;
        return (parseInt(parts[1], 10) - 1) === currentMonthIndex && parseInt(parts[0], 10) === currentYear;
      });
      if (activeMonthIncome.length > 0) {
        return activeMonthIncome.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      }
      return 0;
    }

    if (mIdx > currentMonthIndex) {
      return 0;
    }

    const historicalDeposits = bills.filter((b) => {
      if (!b.isIncome || !b.rawDate) return false;
      const parts = b.rawDate.split("-");
      if (parts.length !== 3) return false;
      const bMonth = parseInt(parts[1], 10) - 1;
      const bYear = parseInt(parts[0], 10);
      return bMonth === mIdx && bYear === currentYear;
    });
    if (historicalDeposits.length > 0) {
      return historicalDeposits.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    }

    return 0;
  };

  const getMonthMetrics = (mIdx) => {
    const monthBills = bills.filter((b) => {
      if (!b.rawDate) return false;
      const parts = b.rawDate.split("-");
      if (parts.length !== 3) return false;
      const bMonth = parseInt(parts[1], 10) - 1;
      const bYear = parseInt(parts[0], 10);

      if (bYear !== currentYear) return false;

      if (b.isPaid) {
        return bMonth === mIdx;
      }

      if (mIdx === currentMonthIndex) {
        const isPastUnpaidDebt = bMonth < currentMonthIndex && !b.isPaid;
        const isCurrentMonthItem = bMonth === currentMonthIndex;
        return isCurrentMonthItem || isPastUnpaidDebt;
      }

      if (mIdx < currentMonthIndex) {
        return false;
      }

      if (mIdx > currentMonthIndex) {
        if (bMonth === mIdx) return true;
        return b.isRecurring && bMonth !== mIdx;
      }

      return false;
    });
    const totalDue = monthBills
      .filter((b) => !b.isPaid)
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const totalPaid = monthBills
      .filter((b) => b.isPaid)
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    return { monthBills, totalDue, totalPaid };
  };

  const handleMonthCardClick = (mIdx) => {
    setSelectedMonth(mIdx);
    setExpandedMonthIdx(mIdx);
    setTimeout(() => {
      document.getElementById(`month-accordion-${mIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const toggleMonthAccordion = (mIdx) => {
    setExpandedMonthIdx(expandedMonthIdx === mIdx ? -1 : mIdx);
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
  
  const globalTotalDue = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const globalTotalPaid = bills.filter((b) => b.isPaid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const globalProgressPercentage = globalTotalDue === 0 ? 0 : Math.max(0, Math.min((globalTotalPaid / globalTotalDue) * 100, 100));
  
  const urgentBills = bills.filter((b) => !b.isPaid && (b.isOverdue || b.payday === "Due Now"));
  const horizonBills = bills.filter((b) => {
    if (!b.rawDate) return false;
    const parts = b.rawDate.split("-");
    return parts.length === 3 && parseInt(parts[0], 10) === (currentYear + 1);
  });
  const horizonTotalDue = horizonBills
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const horizonTotalPaid = horizonBills
    .filter((b) => b.isPaid)
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const baseMonthlyIncome = Object.values(paydayConfig || {}).reduce((sum, slot) => sum + (Number(slot?.income) || 0), 0);

  // HERO DATA CALCULATIONS
  const annualBills = bills.filter((b) => {
    if (!b.rawDate) return false;
    const parts = b.rawDate.split("-");
    return parseInt(parts[0], 10) === currentYear;
  });
  const annualTotal = annualBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const annualPaid = annualBills.filter((b) => b.isPaid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const annualProgressPercentage = annualTotal === 0 ? 0 : Math.max(0, Math.min((annualPaid / annualTotal) * 100, 100));

  const { totalDue: remainingThisMonth } = getMonthMetrics(currentMonthIndex);
  
  const activeRecurringSum = bills.filter(b => b.isRecurring && !b.isPaid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const monthsLeftInYear = Math.max(0, 11 - currentMonthIndex);
  const recurringThisYear = activeRecurringSum * monthsLeftInYear;

  const urgentTotal = bills.filter((b) => !b.isPaid && (b.isOverdue || b.payday === "Due Now")).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const graphicContent = (
    <div className="flex flex-col items-center relative z-10 w-full mb-2">
      <div className={`relative pt-8 pb-6 px-4 sm:px-6 rounded-[2rem] border flex flex-col items-center w-full transform transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 border-slate-700/50 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200/60 shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.10),0_4px_12px_rgba(0,0,0,0.01)]"}`}>

        {/* MIDDLE: Centered Ring */}
        <div className="relative w-48 h-48 mb-8 mt-2 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="transparent" stroke={isDarkMode ? "#1E293B" : "rgba(226, 232, 240, 0.9)"} strokeWidth="10" />
            <circle cx="50" cy="50" r="42" fill="transparent" stroke={signatureColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={263.89} strokeDashoffset={isMounted ? (263.89 - (263.89 * annualProgressPercentage) / 100) : 263.89} className="transition-all duration-1000 ease-out" />
          </svg>
          <div className={`absolute inset-0 flex flex-col items-center justify-center transform transition-all duration-700 delay-300 ease-out p-1 text-center ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <span className={`font-black tracking-tighter leading-none text-3xl ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {Math.round(annualProgressPercentage)}%
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-2">COMPLETE</span>
            <span className={`text-[11px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              ${annualPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /<br />${annualTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* BOTTOM: 3 Pills */}
        <div className="w-full space-y-3">
          {/* Pill 1: Due Now */}
          <div className={`w-full py-4 px-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${urgentTotal > 0 ? (isDarkMode ? 'bg-red-900/20 border-red-900/50' : 'bg-red-50 border-red-200') : (isDarkMode ? 'bg-[#10B981]/10 border-[#10B981]/20' : 'bg-emerald-50 border-emerald-200')}`}>
            <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${urgentTotal > 0 ? 'text-red-500' : 'text-[#10B981]'}`}>
              {urgentTotal > 0 && <AlertCircle size={14} strokeWidth={2.5}/>} 
              {urgentTotal > 0 ? 'TOTAL DUE NOW' : 'BOARD CLEAR'}
            </span>
            <span className={`text-lg font-black leading-none ${urgentTotal > 0 ? 'text-red-500' : 'text-[#10B981]'}`}>
              ${urgentTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Pill 2: Remaining This Month */}
          <div className={`w-full py-4 px-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}>
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: signatureColor }}>
              REMAINING THIS MONTH
            </span>
            <span className="text-lg font-black leading-none" style={{ color: signatureColor }}>
              ${remainingThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Pill 3: Recurring This Year */}
          <div className={`w-full py-4 px-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}>
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: signatureColor }}>
              RECURRING THIS YEAR
            </span>
            <span className="text-lg font-black leading-none" style={{ color: signatureColor }}>
              ${recurringThisYear.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 min-h-screen ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        
      <div className="relative z-10 Bills-Master-Header">
        <style>{`
          .Bills-Master-Header h1, 
          .Bills-Master-Header h2,
          .Bills-Master-Header h3 { 
            color: ${isDarkMode ? "#FFFFFF" : "#000000"} !important; 
            font-weight: 900 !important;
          }
        `}</style>
        {renderHeroShell(`MASTER BILLS LIST`, graphicContent)}
      </div>
      
      <div ref={horizontalScrollRef} className="w-full overflow-x-auto hide-scrollbar pl-6 pr-6 mb-6 relative z-10 pt-2">
        <div className="flex gap-4 pr-6 pb-2 min-h-[170px] snap-x snap-mandatory">
          {monthsData.map((m) => {
            const { totalDue, totalPaid } = getMonthMetrics(m.idx);
            const isSelected = selectedMonth === m.idx;
            const isPastMonth = m.idx < currentMonthIndex;
            const isCurrentMonth = m.idx === currentMonthIndex;

            let cardBackgroundClass = "";
            let buttonText = "";
            let buttonStyleClass = "";
            let incomeTextClass = "";
            let displayIncomeValue = "";
            let customIdAttribute = null;

            if (isPastMonth) {
              const historicalBalance = getClosingBalanceForMonth(m.idx);
              if (historicalBalance === 0) {
                incomeTextClass = "text-slate-400 dark:text-slate-500 font-bold";
                displayIncomeValue = "$0.00";
              } else {
                incomeTextClass = isDarkMode ? "text-emerald-400 font-black" : "text-emerald-600 font-black";
                displayIncomeValue = `+$${historicalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
              }

              if (isSelected) {
                cardBackgroundClass = isDarkMode ? "bg-slate-800 shadow-md scale-[1.01]" : "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] scale-[1.01]";
                buttonText = "SELECTED MONTH";
                buttonStyleClass = "text-white shadow-md font-black border border-transparent";
              } else {
                cardBackgroundClass = isDarkMode ? "bg-[#1E293B] border-slate-700 shadow-md" : "bg-white/90 backdrop-blur-sm border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]";
                buttonText = "VIEW DETAILS";
                buttonStyleClass = isDarkMode ? "bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700 font-bold shadow-sm" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold shadow-sm";
              }
            } else if (isCurrentMonth) {
              customIdAttribute = "current-month-scroll-anchor";
              const currentLiveBalance = getClosingBalanceForMonth(m.idx);
              incomeTextClass = isDarkMode ? "text-emerald-400 font-black" : "text-emerald-600 font-black";
              displayIncomeValue = `+$${currentLiveBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

              if (isSelected) {
                cardBackgroundClass = isDarkMode ? "bg-slate-800 shadow-md scale-[1.01]" : "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] scale-[1.01]";
                buttonText = "SELECTED MONTH";
                buttonStyleClass = "text-white shadow-md font-black border border-transparent";
              } else {
                cardBackgroundClass = isDarkMode ? "bg-[#1E293B] border-2 scale-[1.01]" : "bg-white border-2 scale-[1.01]";
                buttonText = "VIEW DETAILS";
                buttonStyleClass = isDarkMode ? "bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700 font-bold shadow-sm" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold shadow-sm";
              }
            } else {
              incomeTextClass = "text-slate-400 dark:text-slate-500 font-bold";
              displayIncomeValue = "$0.00";
              
              if (isSelected) {
                cardBackgroundClass = isDarkMode ? "bg-slate-800 shadow-md scale-[1.01]" : "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] scale-[1.01]";
                buttonText = "VIEWING MONTH";
                buttonStyleClass = "text-white shadow-md font-black border border-transparent";
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
                onClick={() => handleMonthCardClick(m.idx)}
                className={`shrink-0 w-52 p-5 rounded-[1.75rem] border cursor-pointer active:scale-[0.95] snap-center transition-all flex flex-col justify-between h-44 ${cardBackgroundClass}`}
                style={{ borderColor: isSelected ? signatureColor : (!isPastMonth && isCurrentMonth ? signatureColor : undefined) }}
              >
                <div className="flex justify-between items-center w-full">
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "" : "text-slate-400"}`} style={{ color: isSelected ? signatureColor : undefined }}>{m.name}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{currentYear}</span>
                </div>

                <div className="text-center pt-1.5 pb-1">
                  <p className="text-2xl font-black tracking-tighter leading-none mb-1" style={{ color: signatureColor }}>
                    ${totalDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-slate-900"} leading-none block`}>
                    TOTAL DUE
                  </span>
                </div>

                <div className={`w-full py-1.5 rounded-xl text-center text-[9px] tracking-wider transition-all uppercase ${buttonStyleClass}`} style={{ backgroundColor: isSelected ? signatureColor : undefined }}>
                  {buttonText}
                </div>

                <div className="flex justify-between items-end w-full pt-2">
                  <div className="flex flex-col flex-1">
                    <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white opacity-40" : "text-black opacity-40"}`}>Income</span>
                    <span className={`text-[10px] ${incomeTextClass}`}>{displayIncomeValue}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white opacity-40" : "text-black opacity-40"}`}>Paid</span>
                    <span className="text-[10px] font-black text-[#10B981]">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            onClick={() => {
              setSelectedMonth(12);
              setExpandedMonthIdx(12);
              setTimeout(() => {
                document.getElementById("month-accordion-12")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 150);
            }}
            className={`shrink-0 w-52 p-5 rounded-[1.75rem] border cursor-pointer active:scale-[0.95] snap-center transition-all flex flex-col justify-between h-44 ${selectedMonth === 12 ? (isDarkMode ? "bg-slate-800 shadow-md scale-[1.01]" : "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] scale-[1.01]") : (isDarkMode ? "bg-[#1E293B] border-slate-700 shadow-md" : "bg-white/90 backdrop-blur-sm border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]")}`}
            style={{ borderColor: selectedMonth === 12 ? signatureColor : undefined }}
          >
            <div className="w-full flex justify-center items-center">
              <h4 className={`text-[10px] font-black uppercase tracking-widest text-center ${selectedMonth === 12 ? "" : "text-slate-400"}`} style={{ color: selectedMonth === 12 ? signatureColor : undefined }}>
                BILLS IN {currentYear + 1}
              </h4>
            </div>
            <div className="text-center pt-1.5 pb-1">
              <p className="text-2xl font-black tracking-tighter leading-none mb-1" style={{ color: signatureColor }}>
                ${horizonTotalDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-slate-900"} leading-none block`}>
                TOTAL DUE
              </span>
            </div>
            <div className={`w-full py-1.5 rounded-xl text-center text-[9px] tracking-wider transition-all uppercase ${selectedMonth === 12 ? "text-white shadow-md font-black border border-transparent" : (isDarkMode ? "bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700 font-bold shadow-sm" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold shadow-sm")}`} style={{ backgroundColor: selectedMonth === 12 ? signatureColor : undefined }}>
              {selectedMonth === 12 ? "SELECTED VIEW" : "VIEW DETAILS"}
            </div>
            <div className="flex justify-between items-end w-full pt-2">
              <div className="flex flex-col flex-1">
                <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white opacity-40" : "text-black opacity-40"}`}>Income</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">$0.00</span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white opacity-40" : "text-black opacity-40"}`}>Paid</span>
                <span className="text-[10px] font-black text-[#10B981]">${horizonTotalPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`mx-6 mb-6 border-t ${isDarkMode ? "border-white/20" : "border-black/20"}`}></div>

      <main className="px-6 space-y-8 mt-2">
          
        {urgentBills.length > 0 && (
          <div className="space-y-4">
            <div className={`mb-4 border-t ${isDarkMode ? "border-white/20" : "border-black/20"}`}></div>
            
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Unpaid Bills</h3>

            <div className={`p-4 rounded-[2rem] border mb-6 ${isDarkMode ? "bg-red-950/20 border-red-900/40" : "bg-red-50/60 border-red-100"}`}>
              <div className="flex items-center gap-2 mb-3 px-2">
                <AlertCircle size={16} className="text-red-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Urgent Attention Required</h4>
              </div>
              <div className="space-y-3">
                {sortBillsSurgically(urgentBills).map((bill) => (
                  <div key={`urgent-${bill.id}`} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-100"}`}>
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
                        className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400"}`}
                      >
                        <Edit2 size={16} strokeWidth={2} />
                      </button>
                    </div>
    
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
                          onClick={(e) => { e.stopPropagation(); handleBillClick?.(bill.id); }}
                          className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 min-[360px]:gap-1.5 whitespace-nowrap shrink-0"
                          style={{ backgroundColor: signatureColor }}
                        >
                          <CheckCircle2 size={14} strokeWidth={2.5} />
                          <span className="hidden min-[360px]:inline">MARK AS PAID</span>
                          <span className="min-[360px]:hidden">PAY</span>
                        </button>
                      </div>
                      <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 drop-shadow-[0_0_12px_rgba(24,119,242,0.3)] ${isDarkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-slate-50 border-slate-200"} whitespace-nowrap`} style={{ color: signatureColor }}>
                        {(Number(bill.amount) || 0).toFixed(2)}
                      </div>
                    </div>
                    {bill.isInstallment && !bill.isPaid && (
                      <div className="mt-5 pt-3 border-t border-slate-200 w-full animate-fade-in">
                        <div className="flex justify-between items-end mb-2 px-1">
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">Installment Plan</span>
                          <span className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300">
                            ${(Number(bill.paidAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${(Number(bill.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900 shadow-inner" : "bg-slate-100"}`}>
                          <div className="h-full transition-all duration-500 ease-out" style={{ backgroundColor: signatureColor, width: `${Math.min(((Number(bill.paidAmount) || 0) / (Number(bill.totalAmount) || 1)) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`mx-6 my-6 border-t relative z-10 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">
            Bill Schedule For {currentYear}
          </h3>

          {monthsData.map((m) => {
            const { monthBills, totalDue } = getMonthMetrics(m.idx);
            const isCollapsed = expandedMonthIdx !== m.idx; 
            const sortedBills = sortBillsSurgically(monthBills.filter((b) => !b.isPaid));
            const isPastMonth = m.idx < currentMonthIndex;
            const isFutureMonth = m.idx > currentMonthIndex;

            const headerTextColor = isPastMonth && totalDue > 0 
              ? "text-red-500 font-black" 
              : selectedMonth === m.idx ? "" : isDarkMode ? "text-white" : "text-slate-900";

            return (
              <div key={m.idx} id={`month-accordion-${m.idx}`} className="space-y-2 scroll-mt-24">
                
                <div
                  className="flex flex-col px-2 py-4 cursor-pointer transition-colors"
                  onClick={() => toggleMonthAccordion(m.idx)}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-black uppercase tracking-widest ${headerTextColor}`} style={{ color: (selectedMonth === m.idx && !(isPastMonth && totalDue > 0)) ? signatureColor : undefined }}>
                          {m.name} {currentYear}
                        </h3>
                        <div className="text-slate-500">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {monthBills.filter(b => b.isPaid).length} Settled / {monthBills.length} Total
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black mb-1 ${headerTextColor}`} style={{ color: (selectedMonth === m.idx && !(isPastMonth && totalDue > 0)) ? signatureColor : undefined }}>
                        ${totalDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Total Due
                      </span>
                    </div>
                  </div>
                </div>

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

                          const useRecurringLabel = isFutureMonth && bill.isRecurring;
                          const displayStatusText = useRecurringLabel ? "RECURRING" : (isStrictlyOverdue ? "OVERDUE" : isDueToday ? "DUE NOW" : "DUE");
                          const statusColorClass = useRecurringLabel ? "text-slate-400 font-bold" : (isUrgent ? "text-red-500" : "text-slate-400");
                          const blockIconUrgentClass = useRecurringLabel ? (isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200") : (isUrgent ? (isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100") : (isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"));
                          
                          return (
                            <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                              <div className="flex items-start justify-between w-full mb-6">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${blockIconUrgentClass}`}>
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

                              <div className="flex items-center justify-between gap-1 min-[360px]:gap-2 w-full">
                                <div className="flex flex-col shrink-0">
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${statusColorClass}`}>
                                    {displayStatusText}
                                  </span>
                                  <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                                    {bill.fullDate || "TBD"}
                                  </span>
                                </div>
                                <div className="flex-1 flex justify-center px-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleBillClick?.(bill.id); }}
                                    className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 min-[360px]:gap-1.5 whitespace-nowrap shrink-0"
                                    style={{ backgroundColor: signatureColor }}
                                  >
                                    <CheckCircle2 size={14} strokeWidth={2.5} />
                                    <span className="hidden min-[360px]:inline">MARK AS PAID</span>
                                    <span className="min-[360px]:hidden">PAY</span>
                                  </button>
                                </div>
                                <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 drop-shadow-[0_0_12px_rgba(24,119,242,0.2)] ${isDarkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-slate-50 border-slate-200"} whitespace-nowrap`} style={{ color: signatureColor }}>
                                  {(Number(bill.amount) || 0).toFixed(2)}
                                </div>
                              </div>

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
                                    <div className="h-full transition-all duration-500 ease-out" style={{ backgroundColor: signatureColor, width: `${Math.min(((Number(bill.paidAmount) || 0) / (Number(bill.totalAmount) || 1)) * 100, 100)}%` }}></div>
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

          <div id="month-accordion-12" className="space-y-2 scroll-mt-24">
            <div
              className="flex flex-col px-2 py-4 cursor-pointer transition-colors"
              onClick={() => toggleMonthAccordion(12)}
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-black uppercase tracking-widest ${selectedMonth === 12 ? "" : isDarkMode ? "text-white" : "text-slate-900"}`} style={{ color: selectedMonth === 12 ? signatureColor : undefined }}>
                      BILLS IN {currentYear + 1}
                    </h3>
                    <div className="text-slate-500">{expandedMonthIdx !== 12 ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {horizonBills.filter(b => b.isPaid).length} Settled / {horizonBills.length} Total
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-sm font-black mb-1 ${selectedMonth === 12 ? "" : isDarkMode ? "text-slate-300" : "text-slate-700"}`} style={{ color: selectedMonth === 12 ? signatureColor : undefined }}>
                    ${horizonTotalDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Total Due
                  </span>
                </div>
              </div>
            </div>

            {expandedMonthIdx === 12 && (
              <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                {horizonBills.filter(b => !b.isPaid).length === 0 ? (
                  <p className="text-center py-5 text-xs font-bold text-slate-400">No unpaid bills on the board for {currentYear + 1}.</p>
                ) : (
                  <div className="space-y-3">
                    {sortBillsSurgically(horizonBills.filter(b => !b.isPaid)).map((bill) => (
                      <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                        <div className="flex items-start justify-between w-full mb-6">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                              {bill.icon}
                            </div>
                            <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                            className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                          >
                            <Edit2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-1 min-[360px]:gap-2 w-full">
                          <div className="flex flex-col shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">DUE</span>
                            <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{bill.fullDate}</span>
                          </div>
                          <div className="flex-1 flex justify-center px-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleBillClick?.(bill.id); }}
                              className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 min-[360px]:gap-1.5 whitespace-nowrap shrink-0"
                              style={{ backgroundColor: signatureColor }}
                            >
                              <CheckCircle2 size={14} strokeWidth={2.5} />
                              <span className="hidden min-[360px]:inline">MARK AS PAID</span>
                              <span className="min-[360px]:hidden">PAY</span>
                            </button>
                          </div>
                          <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 ${isDarkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-slate-50 border-slate-200"} whitespace-nowrap`} style={{ color: signatureColor }}>
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

        <div className={`mt-6 mb-2 border-t relative z-10 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

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
                        <p className={`font-black text-base truncate line-through leading-tight ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {bill.name}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                        className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400"}`}
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
                          onClick={(e) => { e.stopPropagation(); handleBillClick?.(bill.id); }}
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

      </main>
    </div>
  );
}
