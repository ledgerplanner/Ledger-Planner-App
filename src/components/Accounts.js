import React, { useState, useEffect, useRef } from "react";
import { ArrowRightLeft, PlusCircle, Edit2, Target, CheckCircle2, Calendar as CalendarIcon, ArrowDown, X, TrendingUp } from "lucide-react";
import { useLedger } from "../context/LedgerContext";

export default function Accounts({ 
  userName,
  accounts = [],
  transactions = [],
  paydayConfig = {},
  isEntrepreneurMode = false,
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
  const { user, currencySymbol = "$" } = useLedger();
  const creditStatus = user?.creditStatus || null;
  const userId = user?.uid || "UNKNOWN_USER";

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const chartScrollRef = useRef(null);

  const [todayMidnight, setTodayMidnight] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  });

  useEffect(() => {
    const dismissedMonth = localStorage.getItem('ledger_credit_dismissed_month');
    const currentMonth = new Date().getMonth().toString();
    if (dismissedMonth === currentMonth) {
      setIsBannerDismissed(true);
    }

    const midnightInterval = setInterval(() => {
      const d = new Date();
      const currentMid = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (currentMid !== todayMidnight) {
        setTodayMidnight(currentMid);
      }
    }, 60000); 

    return () => clearInterval(midnightInterval);
  }, [todayMidnight]);

  const handleDismissBanner = () => {
    localStorage.setItem('ledger_credit_dismissed_month', new Date().getMonth().toString());
    setIsBannerDismissed(true);
  };

  const [activeChartNode, setActiveChartNode] = useState(0);
  const [timeframe, setTimeframe] = useState("6M");
  
  const [showContent, setShowContent] = useState(false);
  const [showChart, setShowChart] = useState(false);
  
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [selectedGoalIcon, setSelectedGoalIcon] = useState("🎯");
  const categoryEmojis = ["🎯", "🏖️", "🚗", "🏠", "💍", "🎓", "👶", "🐶", "🏥", "🛡️", "💰", "🚀", "📱", "💻", "🎮", "✈️", "🏍️", "🎸", "🚲", "⛵"];
  
  const liquidAccounts = accounts.filter(a => !a.isGoal);
  const goalAccounts = accounts.filter(a => a.isGoal);
  
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
  
  const historyData = [];
  let monthOffsets = [];

  if (timeframe === "3M") {
    monthOffsets = [-1, 0, 1];
  } else if (timeframe === "6M") {
    monthOffsets = [-3, -2, -1, 0, 1, 2, 3];
  } else if (timeframe === "YTD") {
    const startOffset = -today.getMonth();
    for (let offset = startOffset; offset <= (11 + startOffset); offset++) {
      monthOffsets.push(offset);
    }
  }

  let currentCalcNW = netWorth;
  const historicalCalculatedMap = {};
  
  for (let i = 0; i <= 12; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
    
    if (i === 0) {
      historicalCalculatedMap[key] = netWorth;
    } else {
      if (isDemoMode) {
        const variance = 1 - (Math.random() * (0.06 - 0.02) + 0.02);
        currentCalcNW = currentCalcNW * variance;
        historicalCalculatedMap[key] = currentCalcNW;
      } else {
        const monthAheadDate = new Date(today.getFullYear(), today.getMonth() - (i - 1), 1);
        const txsInMonthAhead = transactions.filter(tx => {
          let d = new Date(tx.rawDate || tx.date || today);
          if (d.getFullYear() === 2001) d.setFullYear(today.getFullYear()); 
          return d.getMonth() === monthAheadDate.getMonth() && d.getFullYear() === monthAheadDate.getFullYear();
        });
        
        const netCashFlowMonthAhead = txsInMonthAhead.reduce((sum, tx) => {
          return sum + (tx.type === "Income" ? Number(tx.amount) : -Number(tx.amount));
        }, 0);
        
        currentCalcNW -= netCashFlowMonthAhead;
        
        let displayVal = currentCalcNW;
        if (targetDate.getFullYear() < inceptionDate.getFullYear() || (targetDate.getFullYear() === inceptionDate.getFullYear() && targetDate.getMonth() < inceptionDate.getMonth())) {
          displayVal = 0;
        }
        historicalCalculatedMap[key] = displayVal;
      }
    }
  }

  monthOffsets.forEach(offset => {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const monthName = targetDate.toLocaleString('default', { month: 'short' });
    const tMonth = targetDate.getMonth();
    const tYear = targetDate.getFullYear();
    const key = `${tYear}-${tMonth}`;

    let val = 0;
    if (offset <= 0) {
      val = historicalCalculatedMap[key] !== undefined ? historicalCalculatedMap[key] : 0;
    } else {
      val = 0;
    }

    historyData.push({ label: monthName, val, month: tMonth, year: tYear, offset });
  });

  useEffect(() => {
    const currentMonthNodeIdx = historyData.findIndex(d => d.offset === 0);
    setActiveChartNode(currentMonthNodeIdx !== -1 ? currentMonthNodeIdx : historyData.length - 1);
  }, [timeframe, historyData.length]);
  
  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 100);
    const t2 = setTimeout(() => setShowChart(true), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const centerCurrentMonthBar = () => {
      if (chartScrollRef.current) {
        const container = chartScrollRef.current;
        const anchorEl = document.getElementById("current-month-bar-anchor");
        if (anchorEl) {
          const containerWidth = container.clientWidth;
          const anchorLeft = anchorEl.offsetLeft;
          const anchorWidth = anchorEl.clientWidth;
          const targetScroll = anchorLeft - (containerWidth / 2) + (anchorWidth / 2);
          container.scrollTo({
            left: Math.max(0, targetScroll),
            behavior: "smooth"
          });
        }
      }
    };

    const timer = setTimeout(centerCurrentMonthBar, 350);
    window.addEventListener("resize", centerCurrentMonthBar);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", centerCurrentMonthBar);
    };
  }, [timeframe, historyData.length]);
  
  const maxChartVal = Math.max(...historyData.map((d) => Math.abs(d.val)), 1);
  const activeDataPoint = historyData[activeChartNode] || historyData[historyData.length - 1];
  const isNetWorthNegative = activeDataPoint?.val < 0;

  let daysUntilNextPayday = 0;
  let hasValidPayday = false;

  if (!isEntrepreneurMode && paydayConfig) {
    const freq = paydayConfig.frequency || "Weekly";
    let allowedPaydays = [];
    if (freq === "Monthly") allowedPaydays = ["Payday 1"];
    else if (freq === "Semi-Monthly") allowedPaydays = ["Payday 1", "Payday 2"];
    else if (freq === "Bi-Weekly") allowedPaydays = ["Payday 1", "Payday 2", "Payday 3"];
    else allowedPaydays = ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"];

    const activePaydaysWithDates = allowedPaydays
      .filter(pd => paydayConfig[pd]?.date)
      .map(pd => {
        const parts = paydayConfig[pd].date.split("-");
        if (parts.length === 3) {
          return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]).getTime();
        }
        return 0;
      })
      .filter(t => t > 0)
      .sort((a, b) => a - b);

    const upcoming = activePaydaysWithDates.filter(millis => millis >= todayMidnight);
    
    if (upcoming.length > 0) {
      hasValidPayday = true;
      daysUntilNextPayday = Math.ceil((upcoming[0] - todayMidnight) / (1000 * 60 * 60 * 24));
    }
  }

  let calculatedDailyRate = 0;
  if (hasValidPayday) {
    const divisor = Math.max(1, daysUntilNextPayday - 1);
    calculatedDailyRate = isNetWorthNegative ? 0 : (activeDataPoint?.val || 0) / divisor;
  }

  const createTaperedSpline = (data, maxVal) => {
    if (data.length < 2) return "";

    const basePoints = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const normalizedVal = Math.abs(d.val) / (maxVal || 1);
      const y = 90 - (normalizedVal * 80);
      return { x, y };
    });

    const segments = 50; 
    const interpolated = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const globalX = t * 100;
      
      let p0Idx = Math.floor(t * (basePoints.length - 1));
      if (p0Idx >= basePoints.length - 1) p0Idx = basePoints.length - 2;
      
      const p0 = basePoints[p0Idx];
      const p1 = basePoints[p0Idx + 1];
      const segmentWidth = 100 / (basePoints.length - 1);
      const localT = (globalX - p0.x) / segmentWidth;

      const cpX = p0.x + (p1.x - p0.x) / 2;
      
      const x = Math.pow(1 - localT, 3) * p0.x + 
                3 * Math.pow(1 - localT, 2) * localT * cpX + 
                3 * (1 - localT) * Math.pow(localT, 2) * cpX + 
                Math.pow(localT, 3) * p1.x;

      const y = Math.pow(1 - localT, 3) * p0.y + 
                3 * Math.pow(1 - localT, 2) * localT * p0.y + 
                3 * (1 - localT) * Math.pow(localT, 2) * p1.y + 
                Math.pow(localT, 3) * p1.y;

      interpolated.push({ x, y });
    }

    const topPoints = [];
    const bottomPoints = [];

    interpolated.forEach((p, i) => {
      const progress = i / segments;
      const thickness = Math.sin(progress * Math.PI) * 2.2;
      topPoints.push({ x: p.x, y: p.y - thickness });
      bottomPoints.push({ x: p.x, y: p.y + thickness });
    });

    let topPath = `M ${topPoints[0].x} ${topPoints[0].y} `;
    for (let i = 1; i < topPoints.length; i++) {
      topPath += `L ${topPoints[i].x} ${topPoints[i].y} `;
    }

    const revBottom = [...bottomPoints].reverse();
    let bottomPath = `L ${revBottom[0].x} ${revBottom[0].y} `;
    for (let i = 1; i < revBottom.length; i++) {
      bottomPath += `L ${revBottom[i].x} ${revBottom[i].y} `;
    }

    return `${topPath} ${bottomPath} Z`;
  };
  
  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;
  
  const graphicContent = (
    <div className="flex flex-col relative z-10 mb-2 w-full">
      <div className={`relative pt-10 pb-6 px-6 rounded-[2rem] border flex flex-col w-full transform transition-all duration-700 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-blue-600/20 via-white via-25% to-slate-50 border-slate-200/60 border-t-white shadow-[0_12px_24px_rgba(24,119,242,0.15)]"}`}>
          
        <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none">
          <span className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${isDarkMode ? "text-white" : "text-black"}`}>
            TOTAL LIQUID NET WORTH
          </span>
        </div>

        <div className={`flex flex-col items-center justify-center text-center mt-5 mb-5 w-full transform transition-all duration-700 delay-200 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div>
            <p className={`text-5xl font-black tracking-tighter transition-colors duration-300 ${isNetWorthNegative ? "text-red-500" : activeDataPoint?.val > 0 ? "text-[#10B981]" : isDarkMode ? "text-white" : "text-slate-900"}`}>
              {isNetWorthNegative ? "-" : ""}{currencySymbol}{Math.abs(activeDataPoint?.val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {!isEntrepreneurMode && hasValidPayday && (
            <div className={`mt-3 px-4 py-2 rounded-xl border shadow-sm font-black text-[10px] uppercase tracking-widest transition-all ${
              isNetWorthNegative 
                ? (isDarkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200')
                : (isDarkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]' : 'bg-emerald-50 text-emerald-600 border-emerald-200 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]')
            }`}>
              That's {currencySymbol}{isNetWorthNegative ? "0.00" : Math.max(0, calculatedDailyRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / Day Until PayDay
            </div>
          )}
        </div>
  
        <div className={`flex justify-center w-full gap-2 transform transition-all duration-700 delay-400 cubic-bezier(0.16, 1, 0.3, 1) ${showContent ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>
          {["3M", "6M", "YTD"].map((tf) => (
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
  
      <div className={`relative mt-4 transform transition-all duration-1000 ease-out origin-bottom ${showChart ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95"}`}>
        <div ref={chartScrollRef} className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div 
            className="relative flex items-end justify-between h-28 gap-2 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2 px-2"
            style={{ minWidth: historyData.length > 6 ? `${historyData.length * 60}px` : '100%' }}
          >
            <svg key={`svg-mask-${timeframe}`} className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md z-20" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <clipPath id={`sweepRevealClip-${timeframe}`}>
                  <rect x="0" y="0" height="100" className="animate-sweep-curtain" />
                </clipPath>
              </defs>
              <style>{`
                @keyframes sweepCurtainAnimation {
                  from { width: 0%; }
                  to { width: 100%; }
                }
                .animate-sweep-curtain {
                  animation: sweepCurtainAnimation 2.2s linear forwards;
                }
              `}</style>
              {showChart && (
                <path 
                  d={createTaperedSpline(historyData, maxChartVal)} 
                  fill="#1877F2"
                  clipPath={`url(#sweepRevealClip-${timeframe})`}
                />
              )}
            </svg>
    
            {historyData.map((item, i) => {
              const heightPct = (Math.abs(item.val) / maxChartVal) * 100;
              const isActive = activeChartNode === i;
              const isCurrentMonthAnchor = item.offset === 0;
              
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
                else if (isSamplePositive) barBgClass = "bg-[#10B981] opacity-20 group-hover:opacity-40";
                else barBgClass = "bg-red-500 opacity-20 group-hover:opacity-40";
              }
    
              return (
                <div 
                  key={i} 
                  id={isCurrentMonthAnchor ? "current-month-bar-anchor" : undefined}
                  onClick={() => setActiveChartNode(i)} 
                  className="flex flex-col items-center justify-end h-full flex-1 cursor-pointer group relative z-10"
                >
                  <div className="w-full relative flex justify-center h-full items-end">
                    <div className={`w-full max-w-[32px] rounded-t-xl transition-all duration-500 ease-out ${barBgClass}`} style={{ height: `${heightPct}%`, minHeight: Math.abs(item.val) > 0 ? "12px" : "4px" }}></div>
                  </div>
                  <span className={`text-[9px] font-black mt-3 uppercase tracking-wider transition-colors duration-300 ${isActive ? (isSampleZero ? (isDarkMode ? "text-slate-300" : "text-slate-500") : isSampleNegative ? "text-red-500" : "text-[#10B981]") : "text-slate-400"}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        
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

        {creditStatus !== "active" && !isBannerDismissed && (
          <div className="flex flex-col gap-6">
            <div className={`relative rounded-[2rem] p-5 sm:p-6 border flex flex-col items-center text-center overflow-hidden transition-all duration-300 ${
              isDarkMode 
                ? "bg-gradient-to-br from-slate-900 via-slate-800 to-black border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.5)]" 
                : "bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200 shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/15 blur-2xl rounded-full pointer-events-none"></div>
              
              <button 
                onClick={handleDismissBanner}
                className={`absolute top-4 right-4 p-1.5 rounded-full z-20 transition-colors ${isDarkMode ? "text-slate-600 hover:text-slate-400 hover:bg-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
              >
                <X size={16} strokeWidth={3} />
              </button>

              <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                <TrendingUp size={16} strokeWidth={2.5} color="#A855F7" className="text-[#A855F7] shrink-0" />
                <h3 className={`text-sm sm:text-base font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Exclusive Credit Offer!</h3>
              </div>
              
              <p className={`text-[10px] sm:text-xs font-bold mb-5 px-4 relative z-10 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                <span className="block">Access your 3-Bureau Credit Score</span>
                <span className="block">with 24/7 monitoring and identity protection.</span>
              </p>
              
              <a 
                href={`https://www.smartcredit.com/join/?pid=65366&sid=${userId}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="relative z-10 w-full py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: creditStatus === "trial_active" ? "#64748B" : "#1877F2" }}
              >
                {creditStatus === "trial_active" ? (
                  <>⏳ Credit Trial Linked</>
                ) : (
                  <>Unlock My 7-Day Credit Trial for $1</>
                )}
              </a>

              {/* 70% Width Borderless Bureau Logos */}
              <div className="mt-6 pt-5 border-t border-slate-500/20 flex flex-col items-center w-full relative z-10">
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] mb-4 opacity-60 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Verified Data Partners
                </span>
                <div className="flex items-center justify-between opacity-90 grayscale w-[75%] py-1">
                   <div className={`font-black text-base sm:text-lg lg:text-xl tracking-tighter shrink-0 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                     EQUIFAX
                   </div>
                   <div className={`font-black text-base sm:text-lg lg:text-xl tracking-tight flex items-center shrink-0 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                     <span className="text-blue-500 text-lg sm:text-xl lg:text-2xl font-black mr-0.5 leading-none">e</span>xperian
                   </div>
                   <div className={`font-bold text-base sm:text-lg lg:text-xl tracking-tight shrink-0 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                     TransUnion<sup className="text-[10px] sm:text-xs ml-0.5 font-black text-blue-500 leading-none">tu</sup>
                   </div>
                </div>
              </div>

            </div>
            
            <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">All Accounts</h3>
          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {liquidAccounts.length === 0 ? (
                <p className="text-center text-xs font-bold text-slate-400 py-6">No liquid accounts added.</p>
            ) : (
                <div className="space-y-3">
                {liquidAccounts.map((acc) => {
                    const isZero = Number(acc.balance) === 0;
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
                               isZero
                                   ? isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
                                   : isNegative 
                                   ? isDarkMode ? "bg-red-900/30 text-red-400 border-red-900/50 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" : "bg-red-50 text-red-600 border-red-200 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                                   : isDarkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-900/50 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]" : "bg-emerald-50 text-emerald-600 border-emerald-200 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                           }`}>
                               {isNegative ? "-" : ""}{currencySymbol}{Math.abs(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                           </div>
                        </div>
  
                    </div>
                    );
                })}
                </div>
            )}
          </div>
        </div>
  
        <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>
  
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
                    
                    const isZero = balanceAmt === 0;
                    const isPositive = balanceAmt > 0;
                    const isNegative = balanceAmt < 0;
  
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
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target: {currencySymbol}{targetAmt.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
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
                           <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 transition-all whitespace-nowrap ${
                               isComplete
                                   ? "bg-orange-500/10 text-[#F97316] border-orange-500/30 dark:border-orange-500/40 drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]"
                                   : isZero
                                   ? isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
                                   : isNegative 
                                   ? isDarkMode ? "bg-red-900/30 text-red-400 border-red-900/50 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" : "bg-red-50 text-red-600 border-red-200 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                                   : "bg-orange-500/10 text-[#F97316] border-orange-500/20 dark:border-orange-500/30 drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                           }`}>
                               {currencySymbol}{balanceAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                           </div>
                        </div>
  
                        <div className={`w-full h-2.5 rounded-full overflow-hidden border mb-2 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100"}`}>
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
  
        <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>
  
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
