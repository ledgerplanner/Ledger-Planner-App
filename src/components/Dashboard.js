import React, { useState, useEffect } from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, messaging } from "../firebase";

export default function Dashboard({
  userName,
  accounts,
  bills,
  transactions,
  paydayConfig,
  setEditPaydayConfig,
  setIsPaydaySetupOpen,
  setIsNotificationsOpen,
  collapsedPaydays,
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
  setHasConsumedPMBriefing
}) {
  // === 🔔 NOTIFICATION STATE ENGINE ===
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const enablePushNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setIsPushEnabled(true);
        const currentToken = await getToken(messaging, { vapidKey: "BDubfUXfP5DhFRpZ5ZwQp0o88f2avvtfu0rfFr9ySjHgTZmQ4gsr0GWzE-cJQxgbwq93GlgcCc5ip6KksvngmXY" });
        if (currentToken) {
          const userId = auth.currentUser?.uid;
          if (userId) await setDoc(doc(db, "users", userId), { fcmToken: currentToken }, { merge: true });
          alert("Push Notifications Enabled! Vault secured.");
        }
      } else {
        alert("You denied notifications. You will only see alerts inside the app.");
      }
    } catch (error) {
      console.error("An error occurred while retrieving token. ", error);
    }
  };

  // === 🔥 SURGICAL OCTAGON SORTING ENGINE ===
  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
      if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
      if (!a.rawDate) return 1; if (!b.rawDate) return -1;
      return new Date(a.rawDate) - new Date(b.rawDate);
    });
  };

  // === TIME-BASED GREETING ENGINE ===
  const currentHour = new Date().getHours();
  let greetingStr = `Evening, ${userName}`;
  if (currentHour >= 5 && currentHour < 12) { greetingStr = `Morning, ${userName}`; }
  else if (currentHour >= 12 && currentHour < 17) { greetingStr = `Afternoon, ${userName}`; }
  else if (currentHour >= 22 || currentHour < 5) { greetingStr = `Up late, ${userName}?`; }

  // === MACRO: GAS GAUGE & SHIELD MATH ENGINE (GLOBAL) ===
  const totalIncomeBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const unpaidBillsAmount = bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + (b.amount || 0), 0);
  const safeToSpend = totalIncomeBalance - unpaidBillsAmount;

  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((unpaidBillsAmount / totalIncomeBalance) * 100, 100)) : (unpaidBillsAmount > 0 ? 100 : 0);
  const isCritical = debtRatio >= 85 || safeToSpend < 0;
  const isWarning = debtRatio >= 60 && debtRatio < 85;

  const strokeDasharray = 251.2;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * debtRatio) / 100;

  // === MICRO: PAYDAY ROUTING & LIVE INCOME/EXPENSE ENGINE ===
  const frequency = paydayConfig?.frequency || "Weekly";
  const paydaySlots = {
      "Weekly": ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"],
      "Bi-Weekly": ["Payday 1", "Payday 2", "Payday 3"],
      "Semi-Monthly": ["Payday 1", "Payday 2"],
      "Monthly": ["Payday 1"]
  };
  const activeSlots = paydaySlots[frequency] || paydaySlots["Weekly"];
  const paydaysToRender = ["Due Now", ...activeSlots];

  const billsByPayday = {};
  ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach((pd) => { billsByPayday[pd] = []; });
  bills.forEach((bill) => { if (billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });

  const activePaydays = [];
  for (let i = 1; i <= 5; i++) {
    const pdId = `Payday ${i}`;
    if (paydayConfig[pdId] && paydayConfig[pdId].date) {
      const d = new Date(paydayConfig[pdId].date);
      if (!isNaN(d.getTime())) activePaydays.push({ id: pdId, date: d });
    }
  }
  activePaydays.sort((a, b) => a.date - b.date);

  const getTxDate = (tx) => {
    if (tx.rawDate) return new Date(tx.rawDate);
    if (tx.createdAt && typeof tx.createdAt.toDate === 'function') return tx.createdAt.toDate();
    let dStr = tx.date?.toUpperCase() || "";
    let d = new Date();
    if (dStr.includes("YESTERDAY")) d.setDate(d.getDate() - 1);
    else if (!dStr.includes("TODAY") && dStr.length > 3) {
      const parsed = new Date(dStr);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
    return d;
  };

  const calculateTxPayday = (txDate) => {
    if (activePaydays.length === 0) return "Payday 1";
    if (txDate < activePaydays[0].date) return activePaydays[0].id;
    let assignedPd = activePaydays[0].id;
    for (let i = 0; i < activePaydays.length; i++) {
      if (txDate >= activePaydays[i].date) assignedPd = activePaydays[i].id;
      else break;
    }
    return assignedPd;
  };

  const actualIncomeByPayday = { "Payday 1": 0, "Payday 2": 0, "Payday 3": 0, "Payday 4": 0, "Payday 5": 0 };
  const actualExpensesByPayday = { "Payday 1": 0, "Payday 2": 0, "Payday 3": 0, "Payday 4": 0, "Payday 5": 0 };
  
  transactions.forEach(tx => {
    const txDate = getTxDate(tx);
    const pd = calculateTxPayday(txDate);
    if (tx.type === "Income" && actualIncomeByPayday[pd] !== undefined) {
      actualIncomeByPayday[pd] += tx.amount;
    } else if (tx.type === "Expense" && actualExpensesByPayday[pd] !== undefined) {
      actualExpensesByPayday[pd] += tx.amount;
    }
  });

  // === 🔥 MONTHLY FOOTPRINT ENGINE 🔥 ===
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalActiveBillsAmount = bills.filter(b => {
    if (b.isPaid) return false;
    if (b.isOverdue || b.payday === "Due Now") return true;
    if (b.rawDate) {
      const bDate = new Date(b.rawDate);
      return bDate.getUTCMonth() === currentMonthIndex && bDate.getUTCFullYear() === currentYear;
    }
    return true; 
  }).reduce((sum, b) => sum + (b.amount || 0), 0);

  // === 🧠 LP ASSISTANT LIVE ORCHESTRATOR 🧠 ===
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [activeBriefingText, setActiveBriefingText] = useState("");
  
  // 🔥 ORIGINAL LOGIC RESTORED: AI Assistant sleeps from Midnight - 5 AM 🔥
  const isMorningWindow = currentHour >= 5 && currentHour < 16; 
  const isEveningWindow = currentHour >= 16; 
  const isPhantomZone = currentHour >= 0 && currentHour < 5; 

  const handleRunBriefing = async (type) => {
    setIsBriefingLoading(true);
    
    // 📡 1. THE AUDITOR (Data Extraction Node)
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Mathematical safety nets applied to prevent payload crashes
    const liquidCash = accounts.filter(a => a.type === "Checking" || a.type === "Cash").reduce((sum, a) => sum + (a.balance || 0), 0);
    const todaySpend = transactions.filter(t => t.type === "Expense" && (t.date || "").includes(todayStr)).reduce((sum, t) => sum + (t.amount || 0), 0);
    const yesterdaySpend = transactions.filter(t => t.type === "Expense" && (t.date || "").includes(yesterdayStr)).reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const overdueBills = bills.filter(b => !b.isPaid && b.isOverdue);
    const overdueTotal = overdueBills.reduce((sum, b) => sum + (b.amount || 0), 0);

    const next72Hours = new Date(now);
    next72Hours.setDate(now.getDate() + 3);
    const upcomingBills = bills.filter(b => !b.isPaid && !b.isOverdue && b.rawDate && new Date(b.rawDate) <= next72Hours);
    const upcomingTotal = upcomingBills.reduce((sum, b) => sum + (b.amount || 0), 0);

    // 💼 2. THE GENERATOR (API Hand-off) - Strict 3-Sentence Rule Enforced
    const promptPayload = `
      You are the Ledger Planner AI. Provide a highly precise, fact-based 3-sentence financial briefing based ONLY on the data below.
      Tone: The Realist. Direct, factual, no fluff, no emojis. Provide a tactical next step if cash is negative.
      CRITICAL RULE: You must output exactly 3 complete sentences. Do not cut off your response.

      DATA:
      - Liquid Cash: $${liquidCash.toFixed(2)}
      - Overdue Bills: $${overdueTotal.toFixed(2)}
      - Upcoming Bills (72h): $${upcomingTotal.toFixed(2)}
      - Spent Today: $${todaySpend.toFixed(2)}
      - Spent Yesterday: $${yesterdaySpend.toFixed(2)}
      - Context: ${type === "AM" ? "Morning Review" : "Evening Review"}
    `;

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptPayload })
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        setActiveBriefingText(data.reply);
      } else {
        console.error("API Response Error:", data.error);
        setActiveBriefingText("Ledger Warning: Intelligence network reached, but analysis failed. Review your connections.");
      }
    } catch (error) {
      console.error("Network Error:", error);
      setActiveBriefingText("Ledger Warning: Failed to establish neural link with the serverless backend. Please try again.");
    } finally {
      setIsBriefingLoading(false);
      if (type === "AM") setHasConsumedAMBriefing(true);
      else setHasConsumedPMBriefing(true);
    }
  };

  // === DYNAMIC STYLING HELPERS ===
  const getTxAmountClasses = (tx, isDark) => {
    if (tx.isBillPayment || tx.category === "Bill Payment") {
      return isDark 
        ? "bg-[#1877F2]/20 text-[#1877F2] shadow-[0_8px_16px_rgba(24,119,242,0.25)]" 
        : "bg-blue-50 text-[#1877F2] shadow-[0_8px_16px_rgba(24,119,242,0.2)]";
    }
    if (tx.type === "Income") {
      return isDark 
        ? "bg-emerald-900/30 text-emerald-400 shadow-[0_8px_16px_rgba(16,185,129,0.2)]" 
        : "bg-emerald-50 text-emerald-600 shadow-[0_8px_16px_rgba(16,185,129,0.2)]";
    }
    return isDark 
      ? "bg-orange-900/30 text-orange-400 shadow-[0_8px_16px_rgba(249,115,22,0.2)]" 
      : "bg-orange-50 text-orange-600 shadow-[0_8px_16px_rgba(249,115,22,0.2)]";
  };

  const getTxCategoryColor = (tx) => {
    if (tx.isBillPayment || tx.category === "Bill Payment") return "text-[#1877F2]";
    if (tx.type === "Income") return "text-[#10B981]";
    return "text-[#F97316]";
  };

  // === GRAPHIC HEADER (UNCHANGED MACRO VIEW) ===
  const graphicContent = (
    <div className="flex items-center justify-between relative z-10 mb-6 w-full">
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="orangeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="redGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="12" />
          <circle 
            cx="50" cy="50" r="40" fill="transparent" 
            stroke={isCritical ? "url(#redGlow)" : isWarning ? "url(#orangeGlow)" : "url(#blueGlow)"} 
            strokeWidth="12" strokeLinecap="round" 
            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} 
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Debt Load</span>
          <span className={`text-3xl font-black ${isCritical ? "text-red-500" : isWarning ? "text-orange-500" : "text-[#1877F2]"}`}>
            {Math.round(debtRatio)}%
          </span>
        </div>
      </div>
      
      <div className="flex-1 pl-4 text-right">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-3 ${isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${safeToSpend < 0 ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Safe to Spend</span>
        </div>
        <p className={`text-4xl font-black tracking-tighter mb-4 ${safeToSpend < 0 ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
          ${safeToSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-end gap-2 text-xs font-bold uppercase">
            <span className="text-slate-400 text-[10px]">Total Cash</span>
            <span className={`px-2 py-0.5 rounded ${
               totalIncomeBalance < 0 
                 ? isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
                 : totalIncomeBalance > 0 
                    ? isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                    : isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
            }`}>
              ${totalIncomeBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-end gap-2 text-xs font-bold uppercase">
            <span className="text-slate-400 text-[10px]">Unpaid Bills</span>
            <span className={isDarkMode ? "text-red-400 bg-red-900/30 px-2 rounded" : "text-red-600 bg-red-50 px-2 rounded"}>
              ${unpaidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(greetingStr, graphicContent)}

      <main className="px-6 space-y-4">
        
        {/* ====================================================================== */}
        {/* 🔥 DASHBOARD INTELLIGENCE MODULE WITH PHANTOM ZONE PROTECTION 🔥 */}
        {/* ====================================================================== */}
        {!isPhantomZone && (
          <div className={`rounded-3xl border transition-all duration-500 overflow-hidden shadow-[0_0_40px_rgba(24,119,242,0.3)] ${isDarkMode ? "bg-slate-800/60 border-[#1877F2]/50" : "bg-white border-[#1877F2]/40"} ${(hasConsumedAMBriefing && isMorningWindow) || (hasConsumedPMBriefing && isEveningWindow) ? "mb-2" : "mb-5"}`}>
            
            {/* MODULE HEADER */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${isDarkMode ? "border-[#1877F2]/20" : "border-[#1877F2]/10"}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl -mt-0.5 drop-shadow-md">🤖</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-blue-400" : "text-[#1877F2]"}`}>L.P. AI Assistant</span>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-[#1877F2]" : "text-[#1877F2]/70"}`}>
                {(hasConsumedAMBriefing && isMorningWindow) || (hasConsumedPMBriefing && isEveningWindow) ? "Consumed" : "Active"}
              </span>
            </div>

            {/* MODULE BODY */}
            <div className="p-4">
              {isBriefingLoading ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                  <div className="text-6xl animate-bounce mb-2 drop-shadow-xl">🤖</div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-[#1877F2] uppercase tracking-widest mt-1">Establishing Neural Link...</p>
                </div>
              ) : activeBriefingText ? (
                <div className="animate-fade-in space-y-4">
                  <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>"{activeBriefingText}"</p>
                  <div className="pt-4 border-t border-dashed border-[#1877F2]/20 flex flex-col">
                    <p className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{isMorningWindow ? "Let's have a great day!" : "It's been a great day, enjoy your evening!"}</p>
                    <p className={`text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] mt-1.5 text-[#1877F2] break-words leading-tight`}>
                      YOUR LEDGER PLANNER AI ASSISTANT 💼
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* MORNING WINDOW: Summarize Yesterday */}
                  {isMorningWindow && !hasConsumedAMBriefing && (
                     <button 
                       onClick={() => handleRunBriefing("AM")} 
                       className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_12px_rgba(24,119,242,0.15)] ${isDarkMode ? "bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2]" : "bg-blue-50 border border-blue-100 text-[#1877F2] hover:bg-blue-100"}`}
                     >
                       <RefreshCw size={16} className="text-[#1877F2]" /> Summarize my activity from last night L.P.
                     </button>
                  )}

                  {/* EVENING WINDOW: Summarize Today */}
                  {isEveningWindow && !hasConsumedPMBriefing && (
                     <button 
                       onClick={() => handleRunBriefing("PM")} 
                       className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_12px_rgba(24,119,242,0.15)] ${isDarkMode ? "bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2]" : "bg-blue-50 border border-blue-100 text-[#1877F2] hover:bg-blue-100"}`}
                     >
                       <CheckCircle2 size={16} className="text-[#1877F2]" /> Summarize my activity for today L.P.
                     </button>
                  )}

                  {/* EMPTY STATES */}
                  {((isMorningWindow && hasConsumedAMBriefing) || (isEveningWindow && hasConsumedPMBriefing)) && !activeBriefingText && (
                    <div className="flex flex-col items-center justify-center py-2">
                      <CheckCircle2 size={24} className="text-[#10B981] mb-2 opacity-50" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Briefing consumed.<br/>Radar resets {isMorningWindow ? "at 4:00 PM" : "at Midnight"}.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* CENTERED COMMAND BUTTON */}
        <div className="flex justify-center px-1 mt-2 mb-5">
           <button onClick={() => { setEditPaydayConfig(paydayConfig); setIsPaydaySetupOpen(true); }} className={`w-full max-w-sm py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm border ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-[#1877F2] hover:bg-slate-800" : "bg-white border-slate-200 text-[#1877F2] hover:bg-slate-50"}`}>
              <Settings2 size={18} strokeWidth={2.5} /> Set Your Pay Dates & Amounts
           </button>
        </div>

        {/* 🔥 HORIZONTAL PAYDAY CARDS 🔥 */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-2 -mx-2 px-3 snap-x">
          {paydaysToRender.map((pd) => {
            const pdSettings = paydayConfig[pd];
            const isDueNow = pd === "Due Now";
            
            if (isDueNow && billsByPayday["Due Now"]?.length === 0) return null;
            
            const isSet = isDueNow || (pdSettings && (pdSettings.date || pdSettings.income));
            
            const actualIncome = actualIncomeByPayday[pd] || 0;
            const expectedIncome = parseFloat(pdSettings?.income) || 0;
            const effectiveIncome = actualIncome > 0 ? actualIncome : expectedIncome;
            const actualExpenses = actualExpensesByPayday[pd] || 0; 
            const unpaidBillsTotal = billsByPayday[pd]?.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0) || 0;
            
            const activeWeeklyBuffer = effectiveIncome - actualExpenses - unpaidBillsTotal;
            const totalWeeklyDrain = actualExpenses + unpaidBillsTotal;
            const fuelPct = effectiveIncome > 0 ? Math.max(0, Math.min((activeWeeklyBuffer / effectiveIncome) * 100, 100)) : 0;

            return (
              <div key={pd} className={`min-w-[160px] p-5 rounded-[2rem] snap-center shrink-0 border transition-all flex flex-col ${isSet ? isDarkMode ? "bg-[#1E293B] border-slate-700 shadow-md" : "bg-white border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.04)]" : isDarkMode ? "bg-slate-800/30 border-dashed border-slate-700" : "bg-slate-50 border-dashed border-slate-200"}`}>
                
                <div className="flex justify-between items-end mb-4 w-full">
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isSet ? "text-[#1877F2]" : "text-slate-400"}`}>
                    {pd}
                  </h3>
                  {!isDueNow && isSet && (
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-[#1877F2]" : "text-[#1877F2]"}`}>
                      {formatPaydayDateStr(pdSettings?.date)}
                    </span>
                  )}
                </div>
                
                {isDueNow ? (
                  <div className="flex flex-col items-center text-center mt-2 w-full">
                    <p className={`text-3xl font-black tracking-tight mb-1 text-red-500`}>
                      ${unpaidBillsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Currently Due</p>
                  </div>
                ) : isSet ? (
                  <div className="flex flex-col items-center text-center w-full">
                    <p className={`text-3xl font-black tracking-tighter ${activeWeeklyBuffer < 0 ? "text-red-500" : activeWeeklyBuffer > 0 ? "text-[#10B981]" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                      ${activeWeeklyBuffer.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      Safe to Spend
                    </p>
                    
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                      <div 
                        className={`h-full transition-all duration-1000 ${activeWeeklyBuffer < 0 ? "bg-red-500" : activeWeeklyBuffer < effectiveIncome * 0.2 ? "bg-orange-500" : "bg-[#10B981]"}`} 
                        style={{ width: `${effectiveIncome > 0 ? fuelPct : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex flex-col items-center justify-center mt-3 gap-1 w-full">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#10B981]">IN: ${effectiveIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">OUT: ${totalWeeklyDrain.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center mt-2 w-full">
                    <p className={`text-3xl font-black tracking-tight mb-1 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>$0.00</p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>Unscheduled</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 🔥 VERTICAL COLLAPSIBLE LISTS 🔥 */}
        <div className="space-y-4">
          {paydaysToRender.map((payday) => {
            const groupBills = billsByPayday[payday] || [];
            if (payday === "Due Now" && groupBills.length === 0) return null;
            const pdSettings = paydayConfig[payday];
            if (!pdSettings?.date && !pdSettings?.income && groupBills.length === 0) return null;

            const isDueNow = payday === "Due Now";
            const isCollapsed = collapsedPaydays[payday];
            const checkTotal = groupBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
            const expectedDateStr = isDueNow ? "Currently Due" : pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled";
            
            const sortedBills = sortBillsSurgically(groupBills);

            return (
              <div key={payday} className="space-y-2">
                <div className={`flex flex-col px-3 py-2 cursor-pointer transition-colors rounded-xl ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`} onClick={() => toggleCollapse(payday)}>
                  <div className="flex items-center justify-between w-full">
                     <div className="flex items-center gap-2">
                       <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{payday}</h3>
                       <div className="text-slate-400">{isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</div>
                     </div>
                     <div className="flex flex-col items-end">
                       <span className={`text-xs font-black ${isDueNow ? "text-red-500" : "text-[#1877F2]"}`}>
                         ${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                       </span>
                       <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                         {isDueNow ? "Total Due Now" : "Total Due"}
                       </span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{expectedDateStr}</span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className={`rounded-[2rem] p-4 border shadow-sm ${isDueNow ? isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100" : isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                    {sortedBills.length === 0 ? (
                      <p className="text-center text-xs font-bold text-slate-400 py-4">No bills assigned to this payday.</p>
                    ) : (
                      <div className="space-y-3">
                        {sortedBills.map((bill) => (
                          <div key={bill.id} className={`flex flex-col p-3.5 rounded-2xl border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                                  {bill.isPaid ? <CheckCircle2 className="text-[#1877F2] hover:scale-110 transition-transform" size={28} /> : <Circle className={`${isDarkMode ? "text-slate-600 hover:text-slate-500" : "text-slate-200 hover:text-slate-300"} hover:scale-110 transition-transform`} size={28} />}
                                </div>
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${bill.isOverdue ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>{bill.icon}</div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                                      {bill.isRecurring && !bill.isPaid && <RefreshCw size={12} className="text-[#10B981] shrink-0" />}
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{bill.isOverdue ? "Overdue • " : "Due "} {bill.fullDate}</p>
                                  </div>
                                </div>
                              </div>
                              <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight cursor-pointer transition-colors ${bill.isOverdue ? isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600" : isDarkMode ? "bg-[#1877F2]/10 text-[#1877F2]" : "bg-blue-50 text-[#1877F2]"}`} onClick={() => setSelectedEntry(bill)}>
                                ${bill.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 🔥 MONTHLY FOOTPRINT VAULT 🔥 */}
        <div className={`rounded-3xl p-5 border shadow-sm flex items-center justify-between mt-6 ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Active Bills</p>
            <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>For {currentMonthName}</p>
          </div>
          <span className={`text-xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            ${totalActiveBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Recent Activity</h3>
          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {transactions.length === 0 ? (
              <div className="py-8 text-center"><p className="font-bold text-sm text-slate-400">No recent activity.</p></div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-sm cursor-pointer transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                    <div className="flex items-center gap-4 truncate">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>{tx.icon}</div>
                      <div className="flex flex-col truncate justify-center">
                        <p className={`font-bold text-sm truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                        <div className="flex flex-col mt-0.5">
                          <span className={`text-[10px] font-black uppercase tracking-widest truncate leading-tight ${getTxCategoryColor(tx)}`}>
                            {tx.category || "Uncategorized"}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest truncate leading-tight mt-0.5">
                            {tx.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight shrink-0 ml-2 transition-colors ${getTxAmountClasses(tx, isDarkMode)}`}>
                      {tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                <button onClick={() => changeTab("activity")} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 text-white bg-[#1877F2] shadow-[0_8px_16px_rgba(24,119,242,0.3)]">
                  <List size={16} /> See All Activity
                </button>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
