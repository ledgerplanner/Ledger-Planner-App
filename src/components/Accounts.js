import React, { useState, useEffect } from "react";
import { ArrowRightLeft, PlusCircle, Edit2, Target, CheckCircle2, Calendar as CalendarIcon, ArrowDown, X } from "lucide-react";
 
export default function Accounts({
  userName,
  accounts = [],
  transactions = [],
  isDarkMode,
  setIsTransferOpen,
  setIsAddAccountOpen,
  setIsAddGoalOpen,
  setSelectedAccount,
  setEditAccountBalance,
  renderHeroShell,
  isDemoMode,
  triggerCelebration,
  setIsCashOutOpen,
  setCashOutGoal
}) {
  const [activeChartNode, setActiveChartNode] = useState(5);
  const [timeframe, setTimeframe] = useState("6M");
  
  // Animation Triggers
  const [showContent, setShowContent] = useState(false);
  const [showChart, setShowChart] = useState(false);
 
  // QAB Icon Selector State (for Goal Drawer)
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [selectedGoalIcon, setSelectedGoalIcon] = useState("🎯");
  const categoryEmojis = ["🎯", "🏖️", "🚗", "🏠", "💍", "🎓", "👶", "🐶", "🏥", "🛡️", "💰", "🚀", "📱", "💻", "🎮", "✈️", "🏍️", "🎸", "🚲", "⛵"];
 
  // === ARCHITECTURAL ACCOUNT BOUNDARY SEPARATION ===
  const liquidAccounts = accounts.filter(a => !a.isGoal);
  const goalAccounts = accounts.filter(a => a.isGoal);
 
  // === ITEM #1: PURE LIQUID NET WORTH CALCULATION MATRIX ===
  const netWorth = liquidAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  
  const today = new Date();
  
  let inceptionDate = today;
  if (transactions && transactions.length > 0) {
    const validDates = transactions
      .map(tx => {
          if (!tx.rawDate && !tx.date) return null;
          let parsedDate = new Date(tx.rawDate || tx.date);
          if (parsedDate.getFullYear() === 2001) {
              parsedDate.setFullYear(today.getFullYear());
          }
          return parsedDate;
      })
      .filter(d => d && !isNaN(d.getTime())); 
      
    if (validDates.length > 0) {
      inceptionDate = new Date(Math.min(...validDates));
    }
  }
 
  let monthsToGenerate = 6;
  if (timeframe === "1M") monthsToGenerate = 2;
  if (timeframe === "3M") monthsToGenerate = 3;
  if (timeframe === "6M") monthsToGenerate = 6;
  if (timeframe === "YTD") monthsToGenerate = today.getMonth() + 1;
 
  const historyData = [];
  let currentCalcNW = netWorth;
 
  for(let i = 0; i < monthsToGenerate; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = targetDate.toLocaleString('default', { month: 'short' });
    const tMonth = targetDate.getMonth();
    const tYear = targetDate.getFullYear();
    
    if (i === 0) {
        historyData.unshift({ label: monthName, val: currentCalcNW, month: tMonth, year: tYear });
    } else {
        if (isDemoMode) {
          const variance = 1 - (Math.random() * (0.06 - 0.02) + 0.02);
          currentCalcNW = currentCalcNW * variance;
          historyData.unshift({ label: monthName, val: currentCalcNW, month: tMonth, year: tYear });
        } else {
          const monthAhead = historyData[0]; 
          const txsInMonthAhead = transactions.filter(tx => {
              let d = new Date(tx.rawDate || tx.date || today);
              if (d.getFullYear() === 2001) d.setFullYear(today.getFullYear()); 
              
              return d.getMonth() === monthAhead.month && d.getFullYear() === monthAhead.year;
          });
          
          const netCashFlowMonthAhead = txsInMonthAhead.reduce((sum, tx) => {
              return sum + (tx.type === "Income" ? Number(tx.amount) : -Number(tx.amount));
          }, 0);
          
          currentCalcNW -= netCashFlowMonthAhead;
 
          let displayVal = currentCalcNW;
          if (tYear < inceptionDate.getFullYear() || (tYear === inceptionDate.getFullYear() && tMonth < inceptionDate.getMonth())) {
              displayVal = 0;
          }
 
          historyData.unshift({ label: monthName, val: displayVal, month: tMonth, year: tYear });
        }
    }
  }
  
  useEffect(() => {
    setActiveChartNode(historyData.length - 1);
  }, [timeframe, historyData.length]);
 
  // Entrance Animation Sequence
  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 100);
    const t2 = setTimeout(() => setShowChart(true), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
 
  const maxChartVal = Math.max(...historyData.map((d) => Math.abs(d.val)), 1);
  const activeDataPoint = historyData[activeChartNode] || historyData[historyData.length - 1];
  const isNetWorthNegative = activeDataPoint?.val < 0;
 
  const createSpline = (data, maxVal) => {
    if (data.length < 2) return "";
    let path = "";
    data.forEach((d, i) => {
       const x = (i / (data.length - 1)) * 100;
       const y = 100 - ((Math.abs(d.val) / (maxVal || 1)) * 100);
       if (i === 0) {
         path += `M ${x} ${y} `;
       } else {
         const prevX = ((i - 1) / (data.length - 1)) * 100;
         const prevY = 100 - ((Math.abs(data[i-1].val) / (maxVal || 1)) * 100);
         const cpX = prevX + (x - prevX) / 2;
         path += `C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y} `;
       }
    });
    return path;
  };
 
  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;
 
  const graphicContent = (
    <div className="flex flex-col relative z-10 mb-2 w-full">
      {/* 👑 MASTER FLOATING NET WORTH SUMMARY CARD */}
      <div className={`relative pt-10 pb-6 px-6 rounded-[2rem] border flex flex-col w-full transform transition-all duration-700 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-white via-slate-50/90 to-slate-100/60 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.3),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
         
        {/* INNER HERO CARD TITLE: PERFECT COMPLIANCE BLUEPRINT POSITIONING */}
        <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-black"}`}>
            Total Wealth Blueprint
          </span>
        </div>
 
        <div className={`flex justify-between items-end mb-4 transform transition-all duration-700 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Liquid Net Worth • <span className={`${isNetWorthNegative ? "text-red-500" : "text-[#1877F2]"}`}>{activeDataPoint?.label} {activeDataPoint?.year}</span></p>
            <p className={`text-4xl font-black tracking-tighter transition-colors duration-300 ${isNetWorthNegative ? "text-red-500" : activeDataPoint?.val > 0 ? "text-[#10B981]" : isDarkMode ? "text-white" : "text-slate-900"}`}>
              {isNetWorthNegative ? "-" : ""}${Math.abs(activeDataPoint?.val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
 
        <div className={`flex gap-2 transform transition-all duration-700 delay-100 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {["1M", "3M", "6M", "YTD"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === tf ? "bg-[#1877F2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.3)]" : (isDarkMode ? "bg-slate-800/50 text-slate-500 hover:text-slate-300" : "bg-white/80 text-slate-400 hover:text-slate-600 border border-slate-200")}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
 
      {/* 📊 CHART CANVAS CONTAINER */}
      <div className={`relative flex items-end justify-between h-28 gap-2 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2 mt-4 transform transition-all duration-1000 ease-out origin-bottom ${showChart ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95"}`}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md z-20" preserveAspectRatio="none" viewBox="0 0 100 100">
          <style>{`
            @keyframes drawTrendLine {
              from { stroke-dashoffset: 1000; }
              to { stroke-dashoffset: 0; }
            }
            .animate-trend-line {
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              animation: drawTrendLine 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
          `}</style>
          {showChart && (
            <path 
              key={timeframe}
              d={createSpline(historyData, maxChartVal)} 
              fill="none" 
              stroke="#1877F2" 
              strokeWidth="3" 
              vectorEffect="non-scaling-stroke" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="animate-trend-line"
            />
          )}
        </svg>
 
        {historyData.map((item, i) => {
          const heightPct = (Math.abs(item.val) / maxChartVal) * 100;
          const isActive = activeChartNode === i;
          
          const isSampleZero = item.val === 0;
          const isSamplePositive = item.val > 0;
          const isSampleNegative = item.val < 0;
 
          let barBgClass = "";
          if (isActive) {
            if (isSampleZero) barBgClass = isDarkMode ? "bg-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.4)]" : "bg-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.6)]";
            else if (isSamplePositive) barBgClass = "bg-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.4)]";
            else barBgClass = "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
          } else {
            if (isSampleZero) barBgClass = isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200";
            else if (isSamplePositive) barBgClass = isDarkMode ? "bg-emerald-900/20 group-hover:bg-emerald-900/40 opacity-50" : "bg-emerald-50 group-hover:bg-emerald-100 opacity-60";
            else barBgClass = isDarkMode ? "bg-red-900/20 group-hover:bg-red-900/40 opacity-50" : "bg-red-50 group-hover:bg-red-100 opacity-60";
          }
 
          return (
            <div key={i} onClick={() => setActiveChartNode(i)} className="flex flex-col items-center justify-end h-full flex-1 cursor-pointer group relative z-10">
              <div className="w-full relative flex justify-center h-full items-end">
                <div className={`w-full max-w-[32px] rounded-t-xl transition-all duration-500 ease-out ${barBgClass}`} style={{ height: `${heightPct}%`, minHeight: Math.abs(item.val) > 0 ? "12px" : "4px" }}></div>
              </div>
              <span className={`text-[9px] font-black mt-3 uppercase tracking-wider transition-colors duration-300 ${isActive ? (isSampleZero ? (isDarkMode ? "text-slate-300" : "text-slate-500") : isSampleNegative ? "text-red-500" : "text-[#10B981]") : "text-slate-400"}`}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
 
  return (
    {/* 🎨 MASTER LAYOUT CHASSIS */}
    <div className={`pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
       
      {/* PAGE TITLE COLOR PASS: FORCED PURE CRISP WHITE IN DARK MODE / CRISP BLACK IN LIGHT MODE */}
      <div className="relative z-10 Accounts-Master-Header">
        <style>{`
          .Accounts-Master-Header h1, 
          .Accounts-Master-Header h2,
          .Accounts-Master-Header h3 { 
            color: ${isDarkMode ? "#FFFFFF" : "#000000"} !important; 
            font-weight: 900 !important;
          }
        `}</style>
        {renderHeroShell(`${userName}'s Accounts`, graphicContent)}
      </div>
 
      <main className="px-6 space-y-8 mt-4">
        
        {/* LIQUID BANK ASSET ROW */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">All Accounts</h3>
          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {liquidAccounts.length === 0 ? (
                <p className="text-center text-xs font-bold text-slate-400 py-6">No liquid accounts added.</p>
            ) : (
                <div className="space-y-3">
                {liquidAccounts.map((acc) => {
                    const isNegative = acc.balance < 0;
                    const isPositive = acc.balance > 0;
                    return (
                    <div key={acc.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                        
                        <div className="flex items-start justify-between w-full mb-4">
                           <div className="flex items-center gap-3 flex-1">
                              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                  {acc.icon}
                              </div>
                              <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                                  {acc.name}
                              </p>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedAccount(acc); setEditAccountBalance(acc.balance.toString()); }}
                             className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                           >
                              <Edit2 size={16} strokeWidth={2.5} />
                           </button>
                        </div>
 
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex flex-col shrink-0">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {acc.description || acc.type}
                              </span>
                           </div>
                           <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 transition-colors whitespace-nowrap ${
                               isNegative 
                                   ? isDarkMode ? "bg-red-900/30 text-red-400 border-red-900/50 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" : "bg-red-50 text-red-600 border-red-200 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                                   : isPositive 
                                   ? isDarkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-900/50 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]" : "bg-emerald-50 text-emerald-600 border-emerald-200 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                                   : isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
                           }`}>
                               {isNegative ? "-" : ""}${Math.abs(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                           </div>
                        </div>
 
                    </div>
                    );
                })}
                </div>
            )}
          </div>
        </div>
 
        <div className={`border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}></div>
 
        {/* TARGET OBJECTIVE GOAL ROW */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">My Goals</h3>
          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {goalAccounts.length === 0 ? (
                <p className="text-center text-xs font-bold text-slate-400 py-6">No goals actively tracked.</p>
            ) : (
                <div className="space-y-4">
                {goalAccounts.map((goal) => {
                    const targetAmt = Number(goal.targetAmount) || 1;
                    const balanceAmt = Number(goal.balance) || 0;
                    const isComplete = balanceAmt >= targetAmt;
                    const progressPct = Math.min((balanceAmt / targetAmt) * 100, 100);
                    
                    const isPositive = balanceAmt > 0;
                    const isNegative = balanceAmt < 0;
 
                    // === ITEM #4: REAL-TIME SMART INTERCEPTOR RENDER GUARD EVENT ===
                    if (!goal.hasCelebratedOnce && isComplete) {
                      goal.hasCelebratedOnce = true;
                      if (typeof triggerCelebration === "function") {
                        setTimeout(() => triggerCelebration(), 250);
                      }
                    }
 
                    return (
                    <div key={goal.id} className={`flex flex-col p-5 rounded-[1.5rem] border shadow-sm transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                        
                        <div className="flex items-start justify-between w-full mb-5">
                           <div className="flex items-center gap-3 flex-1">
                              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                  {goal.icon || "🎯"}
                              </div>
                              <div className="flex flex-col">
                                <p className={`font-black text-base truncate leading-tight mb-1 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                                    {goal.name}
                                </p>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target: ${targetAmt.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                              </div>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedAccount(goal); setEditAccountBalance(goal.balance.toString()); }}
                             className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                           >
                              <Edit2 size={16} strokeWidth={2.5} />
                           </button>
                        </div>
 
                        <div className="flex items-end justify-between gap-2 mb-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Balance</span>
                           {/* === ITEM #2: PREMIUM UNIQUE ORANGE GLOW THEME UPGRADE CHASSIS === */}
                           <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 transition-all whitespace-nowrap ${
                               isComplete
                                   ? "bg-orange-500/10 text-[#F97316] border-orange-500/30 dark:border-orange-500/40 drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]"
                                   : isNegative 
                                   ? isDarkMode ? "bg-red-900/30 text-red-400 border-red-900/50 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" : "bg-red-50 text-red-600 border-red-200 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                                   : isPositive 
                                   ? "bg-orange-500/10 text-[#F97316] border-orange-500/20 dark:border-orange-500/30 drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                                   : isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
                           }`}>
                               ${balanceAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                           </div>
                        </div>
 
                        {/* === REVERTED FROM ORANGE BACK TO SIGNATURE BRAND BLUE TO CRUSH ORANGE OVERLOAD === */}
                        <div className={`w-full h-2.5 rounded-full overflow-hidden border mb-2 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                             <div className="h-full transition-all duration-1000 bg-[#1877F2]" style={{ width: `${progressPct}%` }}></div>
                        </div>
 
                        {goal.targetDate && (
                           <div className="flex justify-center items-center mt-2 mb-2 w-full">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Target Goal Date: {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                           </div>
                        )}
 
                        {balanceAmt > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof setCashOutGoal === "function") setCashOutGoal(goal);
                              if (typeof setIsCashOutOpen === "function") setIsCashOutOpen(true);
                            }}
                            className="w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-[#F97316] hover:bg-[#EA580C] shadow-[0_8px_20px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 mt-2 border border-transparent"
                          >
                            <CheckCircle2 size={14} strokeWidth={3} /> Cash Out From This Goal
                          </button>
                        )}
 
                    </div>
                    );
                })}
                </div>
            )}
          </div>
        </div>
 
        {/* PLATFORM METRIC ACCELERATORS */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setIsAddAccountOpen(true)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#10B981] text-white shadow-emerald-900/20" : "bg-[#10B981] text-white shadow-emerald-500/30"}`}>
              <PlusCircle size={18} /> Add Account
            </button>
            <button onClick={() => setIsTransferOpen(true)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1877F2] text-white shadow-blue-900/20" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
              <ArrowRightLeft size={18} /> Transfer
            </button>
          </div>
          <button onClick={() => { if (typeof setIsAddGoalOpen === "function") setIsAddGoalOpen(true); }} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-orange-500 text-white shadow-orange-900/20" : "bg-[#F97316] text-white shadow-orange-500/30"}`}>
            <Target size={18} /> Add Goal
          </button>
        </div>
 
      </main>
 
      {/* ICON DRAWER WRAPPER */}
      {isIconSelectorOpen && (
         <div className={`absolute inset-0 z-[150] flex flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
               <h3 className={`font-black uppercase text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Icon</h3>
               <button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button>
            </div>
            <div className={`flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] p-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
               <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">
                 {categoryEmojis.map(emoji => (
                   <button 
                      key={emoji} 
                      onClick={() => { 
                          setSelectedGoalIcon(emoji); 
                          setIsIconSelectorOpen(false); 
                      }} 
                      className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 ${selectedGoalIcon === emoji ? `bg-[#F97316] text-white border-transparent shadow-md` : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                   >
                     {emoji}
                   </button>
                 ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
