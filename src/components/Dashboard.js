import React, { useState, useEffect } from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List, AlertCircle, RefreshCw, Zap, Calendar as CalendarIcon, Edit2, Clock } from "lucide-react";

export default function Dashboard({
  userName = "Founder",
  accounts = [],
  bills = [],
  transactions = [],
  paydayConfig = {},
  setEditPaydayConfig,
  setIsPaydaySetupOpen,
  setIsNotificationsOpen,
  collapsedPaydays = {},
  toggleCollapse,
  handleBillClick,
  setSelectedEntry,
  isDarkMode,
  formatPaydayDateStr,
  renderHeroShell,
  changeTab,
  hasConsumedAMBriefing,
  setHasConsumedAMBriefing,
  hasConsumedPMBriefing,
  setHasConsumedPMBriefing,
  isEntrepreneurMode = false // Dynamic pivot prop for Variable Income
}) {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [displaySafeToSpend, setDisplaySafeToSpend] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsPushEnabled(Notification.permission === "granted");
    }
    // Trigger Cascade Reveal
    setTimeout(() => setIsLoaded(true), 50);
  }, []);

  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
      if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
      return new Date(a.rawDate || 0) - new Date(b.rawDate || 0);
    });
  };

  const currentHour = new Date().getHours();
  let greetingStr = `Evening, ${userName}`;
  if (currentHour >= 5 && currentHour < 12) { greetingStr = `Morning, ${userName}`; }
  if (currentHour >= 12 && currentHour < 17) { greetingStr = `Afternoon, ${userName}`; }
  if (currentHour >= 17 && currentHour < 22) { greetingStr = `Evening, ${userName}`; }
  if (currentHour >= 22 || currentHour < 5) { greetingStr = `Up late, ${userName}?`; }

  const todayForMath = new Date();
  const currentMonthName = todayForMath.toLocaleString("en-US", { month: "long" });
  const currentMonthIdx = todayForMath.getMonth(); 
  const currentYearIdx = todayForMath.getFullYear(); 

  const totalIncomeBalance = accounts.reduce((sum, a) => sum + (Number(a?.balance) || 0), 0);
  
  // ⏳ TIME-BOXED MATH ENGINE (The "False Red" Fix)
  // Strictly filter liabilities to the current active month + overdue items
  const timeBoxedUnpaidBills = bills.filter((b) => {
    if (b.isPaid) return false;
    if (b.isOverdue || b.payday === "Due Now") return true;
    
    if (b.rawDate) {
      const parts = b.rawDate.split("-");
      if (parts.length === 3) {
        const bMonth = parseInt(parts[1], 10) - 1;
        const bYear = parseInt(parts[0], 10);
        return bMonth === currentMonthIdx && bYear === currentYearIdx;
      }
    }
    return false;
  }).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  
  // 🛡️ THE "SAFE TO SPEND" ANCHOR
  const safeToSpend = totalIncomeBalance < 0 
    ? -(Math.abs(timeBoxedUnpaidBills) - Math.abs(totalIncomeBalance))
    : totalIncomeBalance - timeBoxedUnpaidBills;

  // 🎰 ODOMETER ROLL-UP ANIMATION
  useEffect(() => {
    let startTimestamp = null;
    const duration = 800; // 0.8 seconds

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function for fluid deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplaySafeToSpend(easeOutQuart * safeToSpend);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [safeToSpend]);

  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((timeBoxedUnpaidBills / totalIncomeBalance) * 100, 100)) : (timeBoxedUnpaidBills > 0 ? 100 : 0);
  
  const strokeDasharray = 251.2;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * debtRatio) / 100;

  const billsByPayday = {};
  ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach((pd) => { billsByPayday[pd] = []; });
  bills.forEach((bill) => { if (bill?.payday && billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });

  const freq = paydayConfig?.frequency || "Weekly";
  let allowedPaydays = [];
  if (freq === "Monthly") allowedPaydays = ["Payday 1"];
  else if (freq === "Semi-Monthly") allowedPaydays = ["Payday 1", "Payday 2"];
  else if (freq === "Bi-Weekly") allowedPaydays = ["Payday 1", "Payday 2", "Payday 3"];
  else allowedPaydays = ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"];
  
  const hzPaydays = ["Due Now", ...allowedPaydays];

  let runningBalance = totalIncomeBalance;
  const hzBalances = {};

  hzPaydays.forEach((pd) => {
    const groupBills = billsByPayday[pd] || [];
    const pdSettings = paydayConfig?.[pd] || {};

    if (pd !== "Due Now" && !pdSettings?.date) {
      hzBalances[pd] = runningBalance;
      return;
    }

    const unpaidTotal = groupBills.filter(b => !b.isPaid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    let income = 0;
    if (pd !== "Due Now") {
      income = Number(pdSettings.income) || 0;
    }

    runningBalance = runningBalance + income - unpaidTotal;
    hzBalances[pd] = runningBalance;
  });

  // ⏱️ NEXT PAYDAY COUNTDOWN CALCULATION
  let daysUntilNextPayday = null;
  let nextPaydayLabel = "";
  
  for (const pd of allowedPaydays) {
    const pdDateStr = paydayConfig?.[pd]?.date;
    if (pdDateStr) {
      const pdDate = new Date(pdDateStr);
      const diffTime = pdDate - todayForMath;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0) {
        daysUntilNextPayday = diffDays;
        nextPaydayLabel = pdDate.toLocaleDateString("en-US", { weekday: 'long' });
        break;
      }
    }
  }

  // 🌊 BREATHING GRADIENT + 🛗 CASCADE REVEAL
  const graphicContent = (
    <div className={`flex items-center justify-between relative z-10 mb-6 w-full p-4 rounded-3xl transition-all duration-1000 ${isDarkMode ? "bg-gradient-to-br from-slate-900 via-[#0F172A] to-blue-900/10" : "bg-gradient-to-br from-blue-50/50 via-slate-50 to-emerald-50/30"} ${isLoaded ? "opacity-100" : "opacity-0 translate-y-4"}`}>
      
      <div className={`relative w-36 h-36 flex-shrink-0 transition-all duration-700 delay-100 transform ${isLoaded ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}>
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#334155" : "#E2E8F0"} strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={safeToSpend < 0 ? "#EF4444" : "#3B82F6"} strokeWidth="12" strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Debt Load</span>
          <span className={`text-2xl font-black ${safeToSpend < 0 ? "text-red-500" : "text-[#1877F2]"}`}>{Math.round(debtRatio)}%</span>
        </div>
      </div>
      
      <div className="flex-1 pl-4 flex flex-col items-end">
        {/* Cascade Step 1: Label */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-2 transition-all duration-700 delay-200 ${isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"} ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-white border-slate-200 text-slate-500 shadow-sm"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${safeToSpend < 0 ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></div>
          <span className="text-[9px] font-black uppercase tracking-wider">SAFE TO SPEND</span>
        </div>
        
        {/* Cascade Step 2: Odometer Value */}
        <p className={`text-3xl min-[360px]:text-4xl font-black tracking-tighter mb-2 transition-all duration-700 delay-300 ${isLoaded ? "opacity-100" : "opacity-0"} ${safeToSpend < 0 ? "text-red-500" : safeToSpend > 0 ? "text-[#10B981]" : (isDarkMode ? "text-white" : "text-slate-900")}`}>
          {safeToSpend < 0 ? "-" : ""}${Math.abs(displaySafeToSpend).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        
        {/* Cascade Step 3: Next Payday Lifeline */}
        {daysUntilNextPayday !== null && (
          <div className={`flex items-center gap-1 mt-1 transition-all duration-700 delay-500 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <Clock size={12} className={isDarkMode ? "text-slate-500" : "text-slate-400"} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              {isEntrepreneurMode ? "Next Revenue:" : "Next Payday:"} {nextPaydayLabel} <span className="text-[#1877F2]">({daysUntilNextPayday === 0 ? "Today" : `${daysUntilNextPayday} Days`})</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(greetingStr, graphicContent)}

      <div className="flex justify-center px-6 mb-5 -mt-2">
         {/* DYNAMIC PIVOT: Variable Income / Entrepreneur Mode Button Text */}
         <button onClick={() => setIsPaydaySetupOpen(true)} className={`w-full max-w-sm py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border shadow-sm transition-all active:scale-95 ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-[#1877F2]" : "bg-white border-slate-200 text-[#1877F2]"}`}>
            <Settings2 size={18} strokeWidth={2.5} /> 
            {isEntrepreneurMode ? "Set Monthly Revenue Target" : "Set Your Pay Dates & Amounts"}
         </button>
      </div>

      <div className="w-full overflow-x-auto hide-scrollbar pl-6 pr-6 mb-6">
        {/* DYNAMIC HEADER: Pay Schedule */}
        <div className="flex items-center gap-2 mb-3 pl-2">
            <CalendarIcon size={14} className="text-[#1877F2]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{currentMonthName}'s {isEntrepreneurMode ? "Checkpoints" : "Pay Schedule"}</h3>
        </div>

        <div className="flex gap-4 pr-6 pb-2 min-h-[170px]">
          {hzPaydays.map((pd) => {
            const pdSettings = paydayConfig?.[pd] || {};
            const groupBills = billsByPayday[pd] || [];
            if (pd !== "Due Now" && !pdSettings?.date) return null;

            const unpaidBills = groupBills.filter(b => !b.isPaid);
            const unpaidCount = unpaidBills.length;
            const unpaidTotal = unpaidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

            if (pd === "Due Now" && unpaidCount === 0) return null;

            const totalExpectedIncome = Number(pdSettings.income) || 0;
            const expectedDateStr = pd === "Due Now" ? "ACTION REQ" : formatPaydayDateStr(pdSettings.date).toUpperCase();

            const waterfallBalance = hzBalances[pd];
            const isDeficit = waterfallBalance < 0;
            const subLabelStr = pd === "Due Now" ? "AVAILABLE NOW" : "AVAILABLE THIS WEEK";
            
            // DYNAMIC PIVOT: Rename Payday 1 to Week 1 for Entrepreneurs
            const pdDisplayLabel = isEntrepreneurMode ? pd.replace("Payday", "Week") : pd;

            return (
              <div key={`hz-${pd}`} onClick={() => { if(collapsedPaydays[pd]) toggleCollapse(pd); document.getElementById(`vert-${pd}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className={`shrink-0 w-52 p-5 rounded-[1.75rem] border cursor-pointer active:scale-95 transition-all shadow-md flex flex-col justify-between h-40 ${pd === "Due Now" ? (isDarkMode ? "bg-red-900/10 border-red-900/40" : "bg-red-50 border-red-100") : (isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100")}`}>
                
                <div className="flex justify-between items-center w-full">
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${pd === "Due Now" ? "text-red-500" : "text-slate-400"}`}>{pdDisplayLabel}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{expectedDateStr}</span>
                </div>

                <div className="text-center py-2">
                   <p className={`text-2xl font-black tracking-tighter ${isDeficit ? "text-red-500" : "text-[#10B981]"}`}>
                     {isDeficit ? "-" : ""}${Math.abs(waterfallBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                   </p>
                   <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 opacity-60">{subLabelStr}</span>
                </div>

                <div className="flex justify-between items-end w-full pt-3 border-t border-dashed border-slate-700/30">
                  {pd === "Due Now" ? (
                    <div className="flex flex-col flex-1"></div> 
                  ) : (
                    <div className="flex flex-col flex-1">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{isEntrepreneurMode ? "Target Rev" : "Expected Pay"}</span>
                      <span className={`text-[10px] font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>+${totalExpectedIncome.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                    </div>
                  )}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{unpaidCount} Bills Out</span>
                    <span className={`text-[10px] font-black ${isDarkMode ? "text-red-400" : "text-red-500"}`}>-${unpaidTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-6 mb-6 border-t border-slate-200 dark:border-slate-800"></div>

      <main className="px-6 space-y-4">
        <div className="space-y-4">
          {["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((payday) => {
            const groupBills = billsByPayday[payday] || [];
            const activeGroupBills = groupBills.filter(b => !b.isPaid); 
            const pdSettings = paydayConfig?.[payday] || {};
            const isDueNow = payday === "Due Now";
            
            if (isDueNow && activeGroupBills.length === 0) return null;
            if (!isDueNow && !pdSettings?.date) return null;

            const isCollapsed = collapsedPaydays?.[payday];
            const checkTotal = activeGroupBills.reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);
            const expectedDateStr = isDueNow ? "Currently Due" : formatPaydayDateStr(pdSettings.date);
            const sortedBills = sortBillsSurgically(activeGroupBills);
            
            const listDisplayLabel = isEntrepreneurMode && !isDueNow ? payday.replace("Payday", "Week") : payday;

            return (
              <div key={payday} id={`vert-${payday}`} className="space-y-2 scroll-mt-24">
                <div className="flex flex-col px-3 py-3 cursor-pointer" onClick={() => toggleCollapse(payday)}>
                  <div className="flex items-center justify-between w-full mb-1">
                     <div className="flex items-center gap-2">
                       <h3 className={`text-sm font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{listDisplayLabel}</h3>
                       <div className="text-slate-400">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                     </div>
                     <span className={`text-sm font-black ${isDueNow ? "text-red-500" : "text-[#1877F2]"}`}>${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{expectedDateStr}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isDueNow ? "text-red-500/80" : "text-slate-400"}`}>Total Due</span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className={`rounded-[2rem] p-4 border ${isDueNow ? (isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100") : (isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50")}`}>
                    <div className="space-y-3">
                      {sortedBills.length === 0 ? (
                        <p className="text-center py-4 text-xs font-bold text-slate-400">All caught up!</p>
                      ) : (
                        sortedBills.map((bill) => (
                          <div key={bill?.id} className={`flex flex-col p-4 rounded-2xl border shadow-sm ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}>
                            
                            <div className="flex items-start justify-between w-full mb-4">
                               <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setSelectedEntry(bill)}>
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                     {bill?.icon || "🧾"}
                                  </div>
                                  <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                     {bill?.name || "Unnamed"}
                                  </p>
                               </div>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }} 
                                 className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                               >
                                  <Edit2 size={16} strokeWidth={2.5} />
                               </button>
                            </div>

                            <div className="flex items-center justify-between gap-1 min-[360px]:gap-2 w-full">
                               <div className="flex flex-col shrink-0">
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${(bill?.isOverdue || bill?.payday === "Due Now") ? "text-red-500" : "text-slate-400"}`}>
                                     {bill?.isOverdue ? "Overdue" : bill?.payday === "Due Now" ? "Due Now" : "Due"}
                                  </span>
                                  <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                                     {bill?.fullDate || "TBD"}
                                  </span>
                               </div>
                               
                               <div className="flex-1 flex justify-center px-1">
                                  {!bill?.isPaid ? (
                                      <button onClick={(e) => { e.stopPropagation(); handleBillClick(bill?.id); }} className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#1877F2] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 min-[360px]:gap-1.5 whitespace-nowrap shrink-0">
                                        <CheckCircle2 size={14} />
                                        <span className="hidden min-[360px]:inline">MARK AS PAID</span>
                                        <span className="min-[360px]:hidden">PAY</span>
                                      </button>
                                  ) : (
                                      <div className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"><CheckCircle2 size={14} /> Paid</div>
                                  )}
                               </div>

                               <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 text-[#1877F2] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] whitespace-nowrap`}>
                                  ${(Number(bill?.amount) || 0).toFixed(2)}
                               </div>
                            </div>

                            {/* INSTALLMENT TYPOGRAPHY BOOST */}
                            {bill?.isInstallment && (
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Installment Plan</span>
                                        <span className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300">
                                            ${(Number(bill?.paidAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${(Number(bill?.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900" : "bg-slate-100"}`}>
                                        <div className="h-full bg-[#1877F2] transition-all duration-1000" style={{ width: `${Math.min(((Number(bill?.paidAmount) || 0) / (Number(bill?.totalAmount) || 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200 mt-8 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Recent Activity</h3>
          <div className={`rounded-[2rem] p-4 border ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {transactions.length === 0 ? ( <p className="text-center py-8 font-bold text-slate-400">No activity yet.</p> ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => {
                  const isBillTx = tx?.isBillPayment || tx?.type === "Bill" || (tx?.category && tx?.category.toLowerCase().includes("bill"));
                  let txColorStr = "";
                  let txBgBorderStr = "";
                  let txShadowStr = "";
                  let txPrefix = "";

                  if (tx?.type === "Income") {
                      txColorStr = "text-emerald-500";
                      txBgBorderStr = isDarkMode ? "bg-emerald-900/20 border-emerald-500/30" : "bg-emerald-50 border-emerald-200";
                      txShadowStr = "drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]";
                      txPrefix = "+";
                  } else if (isBillTx) {
                      txColorStr = "text-[#1877F2]";
                      txBgBorderStr = isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200";
                      txShadowStr = "drop-shadow-[0_0_12px_rgba(24,119,242,0.7)]";
                      txPrefix = "-";
                  } else {
                      txColorStr = "text-orange-500";
                      txBgBorderStr = isDarkMode ? "bg-orange-900/20 border-orange-500/30" : "bg-orange-50 border-orange-200";
                      txShadowStr = "drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]";
                      txPrefix = "-";
                  }

                  return (
                    <div key={tx?.id} className={`flex flex-col p-4 rounded-[1.5rem] border transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm"}`}>
                      
                      <div className="flex items-start justify-between w-full mb-3 gap-2">
                         <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                               {tx?.icon || "💳"}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 pt-1">
                               <p className={`font-black text-base leading-tight break-words whitespace-normal ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                  {tx?.name || "Transaction"}
                               </p>
                            </div>
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedEntry(tx); }} 
                           className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                         >
                            <Edit2 size={16} strokeWidth={2.5} />
                         </button>
                      </div>

                      <div className={`w-full border-t mb-3 ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}></div>

                      <div className="flex items-center justify-between gap-2 w-full">
                         <div className="flex flex-col flex-1 min-w-0 pr-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest truncate w-full ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{tx?.category || "General"}</span>
                            <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 truncate w-full ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{tx?.date || "Recent"}</span>
                         </div>
                         <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 ${txColorStr} ${txBgBorderStr} ${txShadowStr} whitespace-nowrap`}>
                            {txPrefix}${(Number(tx?.amount) || 0).toFixed(2)}
                         </div>
                      </div>

                    </div>
                  );
                })}
                
                <button onClick={() => changeTab("activity")} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-[0_8px_16px_rgba(24,119,242,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95">
                  <List size={16} /> See All Recent Activity
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
