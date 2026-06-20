import React, { useState, useEffect } from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List, AlertCircle, RefreshCw, Zap, Calendar as CalendarIcon, Edit2 } from "lucide-react";

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
  isEntrepreneurMode = false // <-- INJECTED FOR ENTREPRENEUR MODE
}) {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return 0;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]).getTime();
    }
    return new Date(dateStr).getTime();
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

  const todayParts = [todayForMath.getFullYear(), todayForMath.getMonth(), todayForMath.getDate()];
  const todayMidnightMillis = new Date(todayParts[0], todayParts[1], todayParts[2]).getTime();

  // === PAYDAY INTERVAL RANGE ENGINE SYSTEM (PARALLEL TRACK ENHANCED) ===
  const freq = paydayConfig?.frequency || "Weekly";
  let allowedPaydays = [];
  
  if (isEntrepreneurMode) {
    allowedPaydays = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
  } else {
    if (freq === "Monthly") allowedPaydays = ["Payday 1"];
    else if (freq === "Semi-Monthly") allowedPaydays = ["Payday 1", "Payday 2"];
    else if (freq === "Bi-Weekly") allowedPaydays = ["Payday 1", "Payday 2", "Payday 3"];
    else allowedPaydays = ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"];
  }
  
  const hzPaydays = ["Due Now", ...allowedPaydays];

  let paydayWindows = {};
  let activePaydaysWithDates = [];

  // STANDARD MODE: Build precision windows
  if (!isEntrepreneurMode) {
    activePaydaysWithDates = allowedPaydays
      .filter(pd => paydayConfig?.[pd]?.date)
      .map(pd => ({ key: pd, date: paydayConfig[pd].date, millis: parseLocalDate(paydayConfig[pd].date) }))
      .sort((a, b) => a.millis - b.millis);

    activePaydaysWithDates.forEach((pd, idx) => {
      const startMillis = pd.millis;
      let endMillis = 0;

      if (idx < activePaydaysWithDates.length - 1) {
        endMillis = activePaydaysWithDates[idx + 1].millis - 1;
      } else {
        const lastDateObj = new Date(pd.date.split("-")[0], parseInt(pd.date.split("-")[1], 10) - 1, pd.date.split("-")[2]);
        if (freq === "Weekly") lastDateObj.setDate(lastDateObj.getDate() + 7);
        else if (freq === "Bi-Weekly") lastDateObj.setDate(lastDateObj.getDate() + 14);
        else if (freq === "Semi-Monthly") lastDateObj.setDate(lastDateObj.getDate() + 15);
        else lastDateObj.setMonth(lastDateObj.getMonth() + 1);
        endMillis = lastDateObj.getTime() - 1;
      }

      paydayWindows[pd.key] = { start: startMillis, end: endMillis };
    });
  }

  // CORE ROUTING ENGINE
  const getBillRunwayGroup = (bill) => {
    if (bill.isOverdue || bill.payday === "Due Now") return "Due Now";
    if (!bill.rawDate) return null;
    
    // ENTREPRENEUR MODE: Auto-route by numerical calendar day
    if (isEntrepreneurMode) {
      const dateParts = bill.rawDate.split("-");
      const day = dateParts.length === 3 ? parseInt(dateParts[2], 10) : new Date(bill.rawDate).getDate();
      if (day <= 7) return "Week 1";
      if (day <= 14) return "Week 2";
      if (day <= 21) return "Week 3";
      if (day <= 28) return "Week 4";
      return "Week 5";
    }

    // STANDARD MODE: Route by exact payday window parameters
    const billMillis = parseLocalDate(bill.rawDate);
    for (let i = 0; i < activePaydaysWithDates.length; i++) {
      const pdKey = activePaydaysWithDates[i].key;
      const window = paydayWindows[pdKey];
      if (window && billMillis >= window.start && billMillis <= window.end) {
        return pdKey;
      }
    }
    return null;
  };

  const billsByRunwayGroup = { "Due Now": [] };
  hzPaydays.forEach(pd => { billsByRunwayGroup[pd] = []; });
  
  bills.forEach(bill => {
    const assignedGroup = getBillRunwayGroup(bill);
    if (assignedGroup && billsByRunwayGroup[assignedGroup]) {
      billsByRunwayGroup[assignedGroup].push(bill);
    }
  });

  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
      if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
      return parseLocalDate(a.rawDate) - parseLocalDate(b.rawDate);
    });
  };

  const liquidAccounts = accounts.filter(a => !a.isGoal);
  const totalIncomeBalance = liquidAccounts.reduce((sum, a) => sum + (Number(a?.balance) || 0), 0);

  // === HERO MATH ENGINE UPGRADE ===
  const currentMonthBillsTotal = bills.reduce((sum, bill) => {
    if (bill.isPaid) return sum;
    let include = false;
    if (bill.rawDate) {
      const parts = bill.rawDate.split("-");
      if (parts.length === 3) {
        const bMonth = parseInt(parts[1], 10) - 1;
        const bYear = parseInt(parts[0], 10);
        if (bMonth === currentMonthIdx && bYear === currentYearIdx) {
          include = true;
        }
      }
    }
    if (bill.isOverdue) include = true;
    return include ? sum + (Number(bill.amount) || 0) : sum;
  }, 0);

  const safeToSpend = totalIncomeBalance < 0 
    ? -(Math.abs(currentMonthBillsTotal) - Math.abs(totalIncomeBalance))
    : totalIncomeBalance - currentMonthBillsTotal;

  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((currentMonthBillsTotal / totalIncomeBalance) * 100, 100)) : (currentMonthBillsTotal > 0 ? 100 : 0);
  
  const strokeDasharray = 251.2;
  const targetDashoffset = strokeDasharray - (strokeDasharray * debtRatio) / 100;

  let runningBalance = totalIncomeBalance;
  const hzBalances = {};

  // WATERFALL MATH ENGINE
  hzPaydays.forEach((pd) => {
    const groupBills = billsByRunwayGroup[pd] || [];
    const unpaidTotal = groupBills.filter(b => !b.isPaid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    if (isEntrepreneurMode) {
      // Variable flow tracking: Standard decay against active balance
      runningBalance = runningBalance - unpaidTotal;
      hzBalances[pd] = runningBalance;
    } else {
      // W-2 Standard Mode: Inject fixed expected income at boundaries
      const pdSettings = paydayConfig?.[pd] || {};
      if (pd !== "Due Now" && !pdSettings?.date) {
        hzBalances[pd] = runningBalance;
        return;
      }
      let income = 0;
      if (pd !== "Due Now") {
        income = Number(pdSettings.income) || 0;
      }
      runningBalance = runningBalance + income - unpaidTotal;
      hzBalances[pd] = runningBalance;
    }
  });

  let daysUntilNext = 0;
  let nextPaydayDayName = "";

  if (!isEntrepreneurMode && activePaydaysWithDates.length > 0) {
    const upcoming = activePaydaysWithDates.filter(pd => pd.millis >= todayMidnightMillis);
    if (upcoming.length > 0) {
      daysUntilNext = Math.ceil((upcoming[0].millis - todayMidnightMillis) / (1000 * 60 * 60 * 24));
      const parts = upcoming[0].date.split("-");
      const localDateObj = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
      nextPaydayDayName = localDateObj.toLocaleDateString("en-US", { weekday: 'long' }).toUpperCase();
    }
  }

  // === AUTO-COLLAPSE HEURISTIC ENGINE ===
  let defaultOpenPayday = null;
  for (const pd of hzPaydays) {
    const groupUnpaid = (billsByRunwayGroup[pd] || []).filter(b => !b.isPaid);
    if (pd === "Due Now" && groupUnpaid.length > 0) {
      defaultOpenPayday = "Due Now";
      break;
    } else if (!defaultOpenPayday) {
      if (isEntrepreneurMode) {
        defaultOpenPayday = pd; // Open the first sequential week
      } else if (pd !== "Due Now" && paydayConfig?.[pd]?.date) {
        defaultOpenPayday = pd;
      }
    }
  }

  const graphicContent = (
    <div className="flex flex-col relative z-10 mb-2 w-full">
      <div className={`relative pt-10 pb-6 px-6 rounded-[2rem] border flex items-center justify-between w-full transform transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-blue-600/20 via-white via-25% to-slate-50 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.15),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
         
        <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none">
          <span className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${isDarkMode ? "text-white" : "text-black"}`}>
            {currentMonthName}'s Monthly Snapshot
          </span>
        </div>
 
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="dashGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1877F2" />
                <stop offset="100%" stopColor="#0a56bd" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "rgba(51, 65, 85, 0.5)" : "rgba(226, 232, 240, 0.9)"} strokeWidth="12" />
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="transparent" 
              stroke={safeToSpend < 0 ? "#EF4444" : "url(#dashGlow)"} 
              strokeWidth="12" 
              strokeLinecap="round" 
              strokeDasharray={strokeDasharray} 
              strokeDashoffset={isMounted ? targetDashoffset : strokeDasharray} 
              className="transition-all duration-1000 delay-150 ease-out" 
            />
          </svg>
          <div className={`absolute inset-0 flex flex-col items-center justify-center transform transition-all duration-700 delay-300 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Debt Load</span>
            <span className={`text-xl font-black ${safeToSpend < 0 ? "text-red-500" : "text-[#1877F2]"}`}>{Math.round(debtRatio)}%</span>
          </div>
        </div>
   
        <div className="flex-1 text-right flex flex-col justify-center items-end overflow-hidden">
          
          <div className={`flex flex-col items-end transform transition-all duration-700 delay-200 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-2 shadow-sm ${isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-white/80 border-slate-200 text-slate-600"}`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${safeToSpend < 0 ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></div>
              <span className="text-[9px] font-black uppercase tracking-wider">Safe to Spend</span>
            </div>
            
            <p className={`text-2xl min-[360px]:text-3xl min-[400px]:text-4xl font-black tracking-tighter mb-1 w-full text-right break-words leading-none transition-colors duration-300 ${safeToSpend < 0 ? "text-red-500" : "text-[#10B981]"}`}>
              {safeToSpend < 0 ? "-$" : "$"}{Math.abs(safeToSpend).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          {!isEntrepreneurMode && nextPaydayDayName && (
            <div className={`mt-2 transform transition-all duration-700 delay-500 cubic-bezier(0.16, 1, 0.3, 1) w-full text-right ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest block leading-none ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                NEXT PAYDAY: {nextPaydayDayName}{" "}
                <span className="text-[#10B981]">
                  {daysUntilNext === 0 && "(TODAY)"}
                  {daysUntilNext === 1 && "(IN 1 DAY)"}
                  {daysUntilNext > 1 && `(IN ${daysUntilNext} DAYS)`}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`pb-32 transition-colors duration-500 min-h-screen relative overflow-hidden ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      
      <div className="relative z-10 Dashboard-Master-Header">
        <style>{`
          .Dashboard-Master-Header h1, 
          .Dashboard-Master-Header h2,
          .Dashboard-Master-Header h3 { 
            color: ${isDarkMode ? "#FFFFFF" : "#000000"} !important; 
            font-weight: 900 !important;
          }
        `}</style>
        {renderHeroShell(greetingStr, graphicContent)}
      </div>

      <div className="flex justify-center px-6 mb-5 -mt-2 relative z-10">
         {isEntrepreneurMode ? (
           <button className={`w-full max-w-sm py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-[#10B981] shadow-sm" : "bg-white/80 backdrop-blur-md border-slate-200 text-[#10B981] shadow-[0_4px_20px_rgba(0,0,0,0.03)]"}`}>
             <Zap size={18} strokeWidth={2.5} /> Variable Income Engine Active
           </button>
         ) : (
           <button onClick={() => setIsPaydaySetupOpen(true)} className={`w-full max-w-sm py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-95 ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-[#10B981] shadow-sm" : "bg-white/80 backdrop-blur-md border-slate-200 text-[#10B981] shadow-[0_4px_20px_rgba(0,0,0,0.03)]"}`}>
             <Settings2 size={18} strokeWidth={2.5} /> Set {currentMonthName}'s Pay Dates & Amounts
           </button>
         )}
      </div>

      <div className="w-full overflow-x-auto hide-scrollbar pl-6 pr-6 mb-6 relative z-10">
        <div className="flex gap-4 pr-6 pb-2 min-h-[170px]">
          {hzPaydays.map((pd) => {
            const pdSettings = paydayConfig?.[pd] || {};
            const groupBills = billsByRunwayGroup[pd] || [];
            
            // Standard check to hide empty unset blocks
            if (!isEntrepreneurMode && pd !== "Due Now" && !pdSettings?.date) return null;

            const unpaidBills = groupBills.filter(b => !b.isPaid);
            const unpaidCount = unpaidBills.length;
            const unpaidTotal = unpaidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

            if (pd === "Due Now" && unpaidCount === 0) return null;

            let totalExpectedIncome = 0;
            let expectedDateStr = "";

            if (isEntrepreneurMode) {
              if (pd === "Due Now") expectedDateStr = "ACTION REQ";
              else if (pd === "Week 1") expectedDateStr = "DAYS 1-7";
              else if (pd === "Week 2") expectedDateStr = "DAYS 8-14";
              else if (pd === "Week 3") expectedDateStr = "DAYS 15-21";
              else if (pd === "Week 4") expectedDateStr = "DAYS 22-28";
              else if (pd === "Week 5") expectedDateStr = "DAYS 29-31";
            } else {
              totalExpectedIncome = Number(pdSettings.income) || 0;
              expectedDateStr = pd === "Due Now" ? "ACTION REQ" : formatPaydayDateStr(pdSettings.date).toUpperCase();
            }

            const waterfallBalance = hzBalances[pd];
            const isDeficit = waterfallBalance < 0;
            const subLabelStr = pd === "Due Now" ? "AVAILABLE NOW" : "AVAILABLE THIS WEEK";

            return (
              <div key={`hz-${pd}`} onClick={() => { if(collapsedPaydays[pd] || collapsedPaydays[pd] === undefined) toggleCollapse(pd); document.getElementById(`vert-${pd}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className={`shrink-0 w-52 p-5 rounded-[1.75rem] border cursor-pointer active:scale-95 transition-all flex flex-col justify-between h-44 ${pd === "Due Now" ? (isDarkMode ? "bg-red-900/10 border-red-900/40 shadow-md" : "bg-red-50 border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.1)]") : (isDarkMode ? "bg-[#1E293B] border-slate-700 shadow-md" : "bg-white/90 backdrop-blur-sm border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]")}`}>
                
                <div className="flex justify-between items-center w-full">
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${pd === "Due Now" ? "text-red-500" : "text-slate-400"}`}>{pd}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{expectedDateStr}</span>
                </div>

                <div className="text-center pt-1.5 pb-1">
                   <p className={`text-2xl font-black tracking-tighter leading-none mb-1 ${isDeficit ? "text-red-500" : "text-[#10B981]"}`}>
                    {isDeficit ? "-$" : "$"}{Math.abs(waterfallBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-black"} leading-none block`}>
                    {subLabelStr}
                  </span>
                </div>

                <div className="w-full py-1.5 rounded-xl text-center font-black text-[9px] tracking-wider transition-all uppercase bg-[#1877F2] text-white shadow-md">
                  VIEW DETAILS
                </div>

                <div className="flex justify-between items-end w-full pt-2">
                  {pd === "Due Now" ? (
                    <div className="flex flex-col flex-1"></div> 
                  ) : (
                    <div className="flex flex-col flex-1">
                      {isEntrepreneurMode ? (
                        <>
                          <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white" : "text-black"}`}>Income</span>
                          <span className={`text-[10px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>VARIABLE</span>
                        </>
                      ) : (
                        <>
                          <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white" : "text-black"}`}>Expected Pay</span>
                          <span className={`text-[10px] font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>+${totalExpectedIncome.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col items-end shrink-0">
                     <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? "text-white" : "text-black"}`}>
                      {unpaidCount === 1 ? `${unpaidCount} Bill Out` : `${unpaidCount} Bills Out`}
                    </span>
                    <span className="text-[10px] font-black text-[#1877F2]">-${unpaidTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <div className={`mx-6 mb-6 border-t relative z-10 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

      <main className="px-6 space-y-4 relative z-10">
        
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 mb-4">
          {isEntrepreneurMode ? `${currentMonthName}'s Weekly Runway` : `${currentMonthName}'s Pay Schedule`}
        </h3>

        <div className="space-y-4">
          {["Due Now", ...allowedPaydays].map((payday) => {
            const groupBills = billsByRunwayGroup[payday] || [];
            const activeGroupBills = groupBills.filter(b => !b.isPaid); 
            const isDueNow = payday === "Due Now";
            
            if (!isEntrepreneurMode) {
              const pdSettings = paydayConfig?.[payday] || {};
              if (isDueNow && activeGroupBills.length === 0) return null;
              if (!isDueNow && !pdSettings?.date) return null;
            } else {
              // Hide empty blocks in Entrepreneur Mode
              if (activeGroupBills.length === 0) return null;
            }

            const isCollapsed = collapsedPaydays?.[payday] !== undefined 
              ? collapsedPaydays[payday] 
              : payday !== defaultOpenPayday;

            const checkTotal = activeGroupBills.reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);
            const sortedBills = sortBillsSurgically(activeGroupBills);

            let expectedDateStr = "";
            if (isEntrepreneurMode) {
              if (isDueNow) expectedDateStr = "Currently Due";
              else if (payday === "Week 1") expectedDateStr = "Days 1-7";
              else if (payday === "Week 2") expectedDateStr = "Days 8-14";
              else if (payday === "Week 3") expectedDateStr = "Days 15-21";
              else if (payday === "Week 4") expectedDateStr = "Days 22-28";
              else if (payday === "Week 5") expectedDateStr = "Days 29-31";
            } else {
              const pdSettings = paydayConfig?.[payday] || {};
              expectedDateStr = isDueNow ? "Currently Due" : formatPaydayDateStr(pdSettings.date);
            }

            return (
              <div key={payday} id={`vert-${payday}`} className="space-y-2 scroll-mt-24">
                <div className="flex flex-col px-3 py-3 cursor-pointer" onClick={() => toggleCollapse(payday)}>
                  <div className="flex items-center justify-between w-full mb-1">
                     <div className="flex items-center gap-2">
                       <h3 className={`text-sm font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{payday}</h3>
                       <div className="text-slate-400">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                     </div>
                     <span className={`text-sm font-black ${isDueNow ? "text-red-500" : "text-[#1877F2]"}`}>{`$${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{expectedDateStr}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isDueNow ? "text-red-500/80" : "text-slate-400"}`}>Total Due</span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className={`rounded-[2rem] p-4 border transition-all ${isDueNow ? (isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100") : (isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white/80 backdrop-blur-md border-white/60 shadow-sm")}`}>
                    <div className="space-y-3">
                      {sortedBills.length === 0 ? (
                        <p className="text-center py-4 text-xs font-bold text-slate-400">All caught up!</p>
                      ) : (
                        sortedBills.map((bill) => (
                          <div key={bill?.id} className={`flex flex-col p-4 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                            
                            <div className="flex items-start justify-between w-full mb-4">
                               <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => setSelectedEntry(bill)}>
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                     {bill?.icon || "🧾"}
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                       {bill?.name || "Unnamed"}
                                    </p>
                                    {bill?.isRecurring && (
                                      <RefreshCw size={12} strokeWidth={2.5} className="text-[#10B981] shrink-0" />
                                    )}
                                  </div>
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
                                      <button onClick={(e) => { e.stopPropagation(); handleBillClick(bill?.id); }} className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#1877F2] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 min-[360px]:gap-1.5 whitespace-nowrap shrink-0" >
                                        <CheckCircle2 size={14} />
                                        <span className="hidden min-[360px]:inline">MARK AS PAID</span>
                                        <span className="min-[360px]:hidden">PAY</span>
                                      </button>
                                  ) : (
                                      <div className="px-3 min-[360px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"><CheckCircle2 size={14} /> Paid</div>
                                  )}
                               </div>
                               
                               <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 text-[#1877F2] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] whitespace-nowrap`}>
                                  {(Number(bill?.amount) || 0).toFixed(2)}
                                </div>
                            </div>

                            {bill?.isInstallment && (
                                 <div className={`mt-4 pt-3 border-t ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}>
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

        <div className={`mt-6 py-4 px-5 rounded-[1.5rem] border flex flex-col items-center justify-center gap-2 transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-800 shadow-sm" : "bg-white/80 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"}`}>
           <span className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Total Bills for {currentMonthName}</span>
           <div className={`px-3 py-1.5 rounded-[8px] border font-black text-lg tracking-tighter shrink-0 text-[#1877F2] drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
             ${currentMonthBillsTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </div>
        </div>

        <div className={`space-y-4 pt-4 border-t mt-8 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Recent Activity</h3>
          <div className={`rounded-[2rem] p-4 border shadow-sm transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white/80 backdrop-blur-md border-white/60 shadow-sm"}`}>
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
                    txBgBorderStr = isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-emerald-200";
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
                          <span className={`text-[9px] font-black uppercase tracking-widest truncate w-full ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {tx?.isDirectGoalEntry ? "🔒 SAVED TO GOAL" : (tx?.category || "General")}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 truncate w-full ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            {tx?.date || "Recent"}
                          </span>
                         </div>
                         <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 ${txColorStr} ${txBgBorderStr} ${txShadowStr} whitespace-nowrap`}>
                            {txPrefix}{(Number(tx?.amount) || 0).toFixed(2)}
                         </div>
                      </div>

                    </div>
                  );
                })}
                
                <button onClick={() => changeTab("activity")} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-[0_8px_16px_rgba(24,119,242,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5">
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
