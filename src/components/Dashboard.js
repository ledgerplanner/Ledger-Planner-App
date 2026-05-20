import React, { useState, useEffect } from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List, AlertCircle, RefreshCw, Zap, Calendar as CalendarIcon, Edit2, X, Bell } from "lucide-react";

export default function Dashboard({
  userName = "Founder",
  accounts = [],
  bills = [],
  transactions = [],
  paydayConfig = {},
  setEditPaydayConfig,
  setIsPaydaySetupOpen,
  setIsNotificationsOpen, // Controlled internally now or paired with drawer state
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
  setHasConsumedPMBriefing
}) {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
      if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
      return parseLocalDate(a.rawDate) - parseLocalDate(b.rawDate);
    });
  };

  const currentHour = new Date().getHours();
  let greetingStr = `Evening, ${userName}`;
  if (currentHour >= 5 && currentHour < 12) { greetingStr = `Morning, ${userName}`; }
  if (currentHour >= 12 && currentHour < 17) { greetingStr = `Afternoon, ${userName}`; }
  if (currentHour >= 17 && currentHour < 22) { greetingStr = `Evening, ${userName}`; }
  if (currentHour >= 22 || currentHour < 5) { greetingStr = `Up late, ${userName}?`; }

  const todayForMath = new Date();
  const currentMonthIdx = todayForMath.getMonth(); 
  const currentYearIdx = todayForMath.getFullYear(); 

  const totalIncomeBalance = accounts.reduce((sum, a) => sum + (Number(a?.balance) || 0), 0);
  
  const scopedUnpaidBillsAmount = bills.reduce((sum, bill) => {
    if (bill.isPaid) return sum;
    let include = false;
    if (bill.isOverdue || bill.payday === "Due Now") {
      include = true;
    } else if (bill.rawDate) {
      const parts = bill.rawDate.split("-");
      if (parts.length === 3) {
        const bMonth = parseInt(parts[1], 10) - 1;
        const bYear = parseInt(parts[0], 10);
        if (bMonth === currentMonthIdx && bYear === currentYearIdx) {
          include = true;
        }
      }
    }
    return include ? sum + (Number(bill.amount) || 0) : sum;
  }, 0);
  
  const safeToSpend = totalIncomeBalance < 0 
    ? -(Math.abs(scopedUnpaidBillsAmount) - Math.abs(totalIncomeBalance))
    : totalIncomeBalance - scopedUnpaidBillsAmount;

  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((scopedUnpaidBillsAmount / totalIncomeBalance) * 100, 100)) : (scopedUnpaidBillsAmount > 0 ? 100 : 0);
  
  const strokeDasharray = 251.2;
  const targetDashoffset = strokeDasharray - (strokeDasharray * debtRatio) / 100;

  const billsByPayday = {};
  ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach((pd) => { billsByPayday[pd] = []; });
  bills.forEach((bill) => { if (bill?.payday && billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });

  const freq = paydayConfig?.frequency || "Weekly";
  let allowedPaydays = [];
  if (freq === "Monthly") allowedPaydays = ["Due Now", "Payday 1"];
  else if (freq === "Bi-Weekly" || freq === "Semi-Monthly") allowedPaydays = ["Due Now", "Payday 1", "Payday 2"];
  else allowedPaydays = ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"];

  // ==========================================
  // COMMAND CENTER NOTIFICATION DOT ENGINE (OPTION 1)
  // ==========================================
  const hasOverdueBills = bills.some(bill => bill.isOverdue && !bill.isPaid);
  
  const isAMWindow = currentHour >= 5 && currentHour < 12;
  const isPMWindow = currentHour >= 17 || currentHour < 5; // Evening and night frames
  
  const isAMAlertActive = isAMWindow && !hasConsumedAMBriefing;
  const isPMAlertActive = isPMWindow && !hasConsumedPMBriefing;
  
  let notificationDotColor = null;
  if (hasOverdueBills) {
    notificationDotColor = "bg-red-500"; // Critical Priority
  } else if (isAMAlertActive || isPMAlertActive) {
    notificationDotColor = "bg-[#1877F2] animate-pulse"; // Signature Blue Operational Priority
  }

  // Calculate targets for dynamic messaging
  const currentBlockKey = isAMWindow ? "Payday 1" : "Payday 1"; // Maps cleanly to current cycle structures
  const activeBlockBills = billsByPayday[currentBlockKey] || [];
  const unpaidActiveCount = activeBlockBills.filter(b => !b.isPaid).length;
  const activeBlockTotal = activeBlockBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  // Batch clear routine for the whole Command Center
  const handleDismissAll = () => {
    setHasConsumedAMBriefing(true);
    setHasConsumedPMBriefing(true);
    // If you hook other custom alert dismiss state methods up later, batch them here
  };

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${isDarkMode ? "bg-[#0F172A] text-slate-100" : "bg-[#F8FAFC] text-slate-800"}`}>
      
      {/* HEADER BAR */}
      <div className={`p-4 flex justify-between items-center border-b backdrop-blur-md sticky top-0 z-40 transition-colors ${isDarkMode ? "bg-[#1E293B]/90 border-slate-700" : "bg-white/90 border-slate-200"}`}>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{greetingStr}</h1>
          <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Ledger Planner 2.0 Command Module</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* UPDATED NOTIFICATION TRIGGER */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className={`p-2 rounded-xl relative transition-all duration-200 hover:scale-105 active:scale-95 ${isDarkMode ? "bg-[#1E293B] hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
          >
            <Bell size={20} />
            {notificationDotColor && (
              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ${notificationDotColor}`} />
            )}
          </button>

          <button 
            onClick={() => changeTab("Todo")} 
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? "bg-[#1E293B] text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* COMPONENT CONTENT BODY */}
      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {/* HERO HOOK */}
        {renderHeroShell ? (
          renderHeroShell({ safeToSpend, totalIncomeBalance, targetDashoffset, strokeDasharray, debtRatio })
        ) : (
          <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke={isDarkMode ? "#334155" : "#E2E8F0"} strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke={safeToSpend >= 0 ? "#10B981" : "#EF4444"} 
                    strokeWidth="8" fill="transparent" 
                    strokeDasharray={strokeDasharray} 
                    strokeDashoffset={targetDashoffset} 
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: safeToSpend >= 0 ? "drop-shadow(0 0 12px rgba(16,185,129,0.7))" : "none" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className={`text-3xl font-extrabold tracking-tight ${safeToSpend >= 0 ? "text-[#10B981]" : "text-red-500"}`}>
                    ${Number(safeToSpend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <p className={`text-xxs font-semibold uppercase tracking-wider mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Safe To Spend
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYDAY CALENDAR SEGMENTATION LAYOUT */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Payday Calendars</h2>
            <button 
              onClick={() => setIsPaydaySetupOpen(true)}
              className="p-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 text-[#1877F2] transition-transform hover:scale-105"
            >
              <Settings2 size={14} /> Configure
            </button>
          </div>

          {allowedPaydays.map((pdKey) => {
            const sortedGroup = sortBillsSurgically(billsByPayday[pdKey] || []);
            const isCollapsed = !!collapsedPaydays[pdKey];
            const groupTotal = sortedGroup.reduce((s, b) => s + (Number(b.amount) || 0), 0);
            const groupPaid = sortedGroup.filter(b => b.isPaid).reduce((s, b) => s + (Number(b.amount) || 0), 0);
            const displayDateStr = formatPaydayDateStr ? formatPaydayDateStr(pdKey) : pdKey;

            return (
              <div 
                key={pdKey} 
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isDarkMode ? "bg-[#1E293B] border-slate-700/60" : "bg-white border-slate-200/60"
                }`}
              >
                {/* Header Lane */}
                <div 
                  onClick={() => toggleCollapse && toggleCollapse(pdKey)}
                  className={`p-4 flex justify-between items-center cursor-pointer select-none transition-colors ${
                    isDarkMode ? "hover:bg-slate-700/40" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                      <CalendarIcon size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight">{displayDateStr}</h3>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {sortedGroup.filter(b => !b.isPaid).length} items outstanding
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-black tracking-tight">
                        ${groupTotal.toFixed(2)}
                      </p>
                      <p className={`text-xxs font-bold uppercase ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        Paid: ${groupPaid.toFixed(2)}
                      </p>
                    </div>
                    <div className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>
                  </div>
                </div>

                {/* Sub-item Lane Grid */}
                {!isCollapsed && (
                  <div className={`border-t divide-y p-2 space-y-1 ${isDarkMode ? "border-slate-700/60 divide-slate-700/40" : "border-slate-100 divide-slate-100"}`}>
                    {sortedGroup.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic">No obligations tied to this frame.</div>
                    ) : (
                      sortedGroup.map((bill) => (
                        <div 
                          key={bill.id}
                          onClick={() => handleBillClick && handleBillClick(bill)}
                          className={`p-3 rounded-xl flex justify-between items-center cursor-pointer group transition-all duration-150 ${
                            bill.isPaid 
                              ? "opacity-50" 
                              : isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (setSelectedEntry) setSelectedEntry(bill);
                              }}
                              className="transition-transform active:scale-90"
                            >
                              {bill.isPaid ? (
                                <CheckCircle2 size={18} className="text-[#10B981]" style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.4))" }} />
                              ) : (
                                <Circle size={18} className={bill.isOverdue ? "text-red-400" : "text-[#1877F2]"} />
                              )}
                            </button>
                            <div>
                              <p className={`text-sm font-bold tracking-tight ${bill.isPaid ? "line-through text-slate-400" : ""}`}>
                                {bill.name}
                              </p>
                              <p className={`text-xxs font-semibold tracking-wide ${bill.isOverdue && !bill.isPaid ? "text-red-400 font-bold" : "text-slate-400"}`}>
                                Due {bill.dueDate || bill.rawDate} {bill.isOverdue && !bill.isPaid && "• OVERDUE"}
                              </p>
                            </div>
                          </div>

                          <span className={`text-sm font-black tracking-tight ${bill.isPaid ? "text-slate-400" : bill.isOverdue ? "text-red-400" : ""}`}>
                            ${Number(bill.amount).toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          SLIDE-OUT COMMAND CENTER DRAWER (MODAL OVERLAY)
         ========================================== */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur/Dimmer */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-300 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex font-sans">
            <div className={`w-screen max-w-sm transform transition-all duration-300 ease-in-out border-l flex flex-col justify-between ${
              isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
            }`}>
              
              {/* Drawer Top Header Area */}
              <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? "border-slate-700 bg-[#1E293B]" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-[#1877F2]" />
                  <h2 className="text-base font-black tracking-tight">Command Center</h2>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"}`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Card Content Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 1. OVERDUE SYSTEM CRISIS CARD */}
                {hasOverdueBills && (
                  <div className="p-4 rounded-2xl border bg-red-500/10 border-red-500/30 flex gap-3 relative overflow-hidden">
                    <div className="text-red-500 mt-0.5 shrink-0">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-red-400">Urgent: Overdue Account Liquidation</h4>
                      <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                        You have past-due obligations active on your timeline. Resolve these items immediately to safeguard your safe-to-spend targets.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. DYNAMIC AM STRATEGY BRIEFING CARD */}
                {isAMWindow && !hasConsumedAMBriefing && (
                  <div className={`p-4 rounded-2xl border relative flex gap-3 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-[#1877F2] mt-0.5 shrink-0">
                      <Zap size={18} />
                    </div>
                    <div className="pr-6">
                      <h4 className="text-sm font-black text-[#1877F2]">AM Operational Briefing</h4>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">
                        Good morning, Residual. Your active checkpoint lifecycle has **{unpaidActiveCount} items** pending execution totaling **${activeBlockTotal.toFixed(2)}**. Assess your immediate ledger before clearing items.
                      </p>
                    </div>
                    <button 
                      onClick={() => setHasConsumedAMBriefing(true)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* 3. DYNAMIC PM STRATEGY BRIEFING CARD */}
                {isPMWindow && !hasConsumedPMBriefing && (
                  <div className={`p-4 rounded-2xl border relative flex gap-3 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-[#1877F2] mt-0.5 shrink-0">
                      <Zap size={18} />
                    </div>
                    <div className="pr-6">
                      <h4 className="text-sm font-black text-[#1877F2]">PM Tactical Overview</h4>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">
                        Good evening, Residual. Current liquid assets stand at **${totalIncomeBalance.toFixed(2)}**. Maintain tactical control over secondary transaction categories before your upcoming paycheck interval drops.
                      </p>
                    </div>
                    <button 
                      onClick={() => setHasConsumedPMBriefing(true)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* 4. TOTAL EMPTY STATE REWARD STATE */}
                {!hasOverdueBills && hasConsumedAMBriefing && hasConsumedPMBriefing && (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
                    <CheckCircle2 
                      size={44} 
                      className="text-[#10B981] drop-shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-bounce" 
                    />
                    <div>
                      <h4 className="text-sm font-black">All clear.</h4>
                      <p className="text-xs text-slate-400 mt-1 px-4">Your ledger strategies are executed and up to date for this session window.</p>
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Bottom Action Anchor */}
              <div className={`p-4 border-t ${isDarkMode ? "border-slate-700 bg-[#1E293B]" : "border-slate-200 bg-slate-50"}`}>
                <button
                  onClick={handleDismissAll}
                  disabled={hasConsumedAMBriefing && hasConsumedPMBriefing}
                  className="w-full py-3 px-4 bg-[#1877F2] text-white font-black text-sm rounded-xl tracking-tight shadow-md hover:bg-blue-600 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-98"
                >
                  Dismiss All Alerts
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
