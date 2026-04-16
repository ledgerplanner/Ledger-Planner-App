import React from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List, AlertCircle, RefreshCw } from "lucide-react";
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
  changeTab
}) {
  // === 🔔 PUSH NOTIFICATION ENGINE ===
  const enablePushNotifications = async () => {
    try {
      console.log("Requesting notification permission...");
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        console.log("Permission granted! Fetching token...");
        const currentToken = await getToken(messaging, { 
          vapidKey: "BDubfUXfP5DhFRpZ5ZwQp0o88f2avvtfu0rfFr9ySjHgTZmQ4gsr0GWzE-cJQxgbwq93GlgcCc5ip6KksvngmXY" 
        });

        if (currentToken) {
          console.log("Push Token Generated:", currentToken);
          
          // 🔥 SECURE TOKEN STORAGE TO FIRESTORE
          const userId = auth.currentUser?.uid;
          if (userId) {
            await setDoc(doc(db, "users", userId), { 
              fcmToken: currentToken 
            }, { merge: true });
          }

          alert("Push Notifications Enabled! Vault secured.");
        } else {
          console.log("No registration token available. Request permission to generate one.");
        }
      } else {
        console.log("User denied push notifications.");
        alert("You denied notifications. You will only see alerts inside the app.");
      }
    } catch (error) {
      console.error("An error occurred while retrieving token. ", error);
    }
  };

  // === 🔥 SURGICAL OCTAGON SORTING ENGINE ===
  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      // 1. Overdue pinned to the absolute top (Red Alert)
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      
      // 2. Due Now is right below Overdue (Yellow Alert)
      if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
      if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
      
      // 3. Chronological sorting for the remaining runway
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return new Date(a.rawDate) - new Date(b.rawDate);
    });
  };

  // === TIME-BASED GREETING ENGINE ===
  const currentHour = new Date().getHours();
  let greetingStr = `Evening, ${userName}`;
  if (currentHour >= 5 && currentHour < 12) { greetingStr = `Morning, ${userName}`; }
  else if (currentHour >= 12 && currentHour < 17) { greetingStr = `Afternoon, ${userName}`; }
  else if (currentHour >= 22 || currentHour < 5) { greetingStr = `Up late, ${userName}?`; }

  // === GAS GAUGE & SHIELD MATH ENGINE ===
  const totalIncomeBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const unpaidBillsAmount = bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  const safeToSpend = totalIncomeBalance - unpaidBillsAmount;

  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((unpaidBillsAmount / totalIncomeBalance) * 100, 100)) : (unpaidBillsAmount > 0 ? 100 : 0);
  
  const isCritical = debtRatio >= 85 || safeToSpend < 0;
  const isWarning = debtRatio >= 60 && debtRatio < 85;

  const strokeDasharray = 251.2;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * debtRatio) / 100;

  // === PAYDAY ROUTING & LIVE INCOME ENGINE ===
  const billsByPayday = {};
  ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach((pd) => { billsByPayday[pd] = []; });
  bills.forEach((bill) => { if (billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });

  // 1. Map Active Paydays
  const activePaydays = [];
  for (let i = 1; i <= 5; i++) {
    const pdId = `Payday ${i}`;
    if (paydayConfig[pdId] && paydayConfig[pdId].date) {
      const d = new Date(paydayConfig[pdId].date);
      if (!isNaN(d.getTime())) activePaydays.push({ id: pdId, date: d });
    }
  }
  activePaydays.sort((a, b) => a.date - b.date);

  // 2. Parse Transaction Dates
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

  // 3. Assign Transaction to Payday Window
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

  // 4. Aggregate Actual Income
  const actualIncomeByPayday = { "Payday 1": 0, "Payday 2": 0, "Payday 3": 0, "Payday 4": 0, "Payday 5": 0 };
  transactions.forEach(tx => {
    if (tx.type === "Income") {
      const txDate = getTxDate(tx);
      const pd = calculateTxPayday(txDate);
      if (actualIncomeByPayday[pd] !== undefined) {
        actualIncomeByPayday[pd] += tx.amount;
      }
    }
  });

  // === GRAPHIC HEADER ===
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
            <span className={isDarkMode ? "text-slate-300 bg-slate-800 px-2 rounded" : "text-slate-700 bg-slate-100 px-2 rounded"}>
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
        
        <div className="flex justify-between items-center px-1 mt-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pay Day Setup</h3>
          <div className="flex gap-2">
            <button onClick={enablePushNotifications} className={`text-[9px] font-black uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-md ${isDarkMode ? "bg-[#10B981] text-white shadow-emerald-900/20" : "bg-[#10B981] text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)]"}`}>
              <AlertCircle size={12} strokeWidth={3} /> Enable Notifications
            </button>
            <button onClick={() => { setEditPaydayConfig(paydayConfig); setIsPaydaySetupOpen(true); }} className={`text-[9px] font-black uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700 text-[#1877F2] hover:bg-slate-700" : "bg-white border-slate-200 text-[#1877F2] shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:bg-slate-50"}`}>
              <Settings2 size={12} strokeWidth={3} /> Configure
            </button>
          </div>
        </div>

        {/* 🔥 LIVE HORIZONTAL PAYDAY CARDS 🔥 */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-2 -mx-2 px-3 snap-x">
          {["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((pd) => {
            const pdSettings = paydayConfig[pd];
            const isDueNow = pd === "Due Now";
            
            if (isDueNow && billsByPayday["Due Now"].length === 0) return null;
            
            const isSet = isDueNow || (pdSettings && (pdSettings.date || pdSettings.income));
            const expectedIncome = parseFloat(pdSettings?.income) || 0;
            const actualIncome = actualIncomeByPayday[pd] || 0;
            
            // MATH ENGINE FIX: Separate Unpaid Bills from ALL Bills
            const unpaidBillsTotal = billsByPayday[pd]?.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0) || 0;
            const allBillsTotal = billsByPayday[pd]?.reduce((sum, b) => sum + b.amount, 0) || 0;
            
            // Post-Bills Balance calculated using actual secured income vs ALL bills assigned to this period
            const balanceAfterBills = actualIncome - allBillsTotal;

            return (
              <div key={pd} className={`min-w-[140px] p-4 rounded-3xl snap-center shrink-0 border transition-all ${isSet ? isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100 shadow-sm" : isDarkMode ? "bg-slate-800/30 border-dashed border-slate-700" : "bg-slate-50 border-dashed border-slate-200"}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDueNow ? "text-red-500" : isSet ? "text-[#1877F2]" : "text-slate-400"}`}>{pd}</p>
                
                {isDueNow ? (
                  <>
                    <p className={`text-lg font-black tracking-tight mb-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      ${unpaidBillsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Currently Due</p>
                  </>
                ) : isSet ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-end mt-1">
                      <span className={`text-xl font-black tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>${actualIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] font-bold text-slate-400 mb-1">/ ${expectedIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                      <div className={`h-full transition-all duration-1000 ${actualIncome >= expectedIncome && expectedIncome > 0 ? "bg-[#10B981]" : "bg-[#1877F2]"}`} style={{ width: `${Math.min((actualIncome / (expectedIncome || 1)) * 100, 100)}%` }}></div>
                    </div>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled"}
                    </p>
                    <div className={`mt-2.5 pt-2.5 border-t flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}>
                       <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Post-Bills</span>
                       <span className={`text-[10px] font-black ${balanceAfterBills >= 0 ? "text-[#10B981]" : "text-red-500"}`}>
                         {balanceAfterBills >= 0 ? "+" : "-"}${Math.abs(balanceAfterBills).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                       </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={`text-lg font-black tracking-tight mb-0.5 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>$0</p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>Unscheduled</p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 🔥 LIVE VERTICAL COLLAPSIBLE LISTS 🔥 */}
        <div className="space-y-4">
          {Object.entries(billsByPayday).map(([payday, groupBills]) => {
            if (payday === "Due Now" && groupBills.length === 0) return null;
            const pdSettings = paydayConfig[payday];
            if (!pdSettings?.date && !pdSettings?.income && groupBills.length === 0) return null;

            const isDueNow = payday === "Due Now";
            const isCollapsed = collapsedPaydays[payday];
            const checkTotal = groupBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
            
            const expectedDateStr = isDueNow ? "Currently Due" : pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled";
            
            // Progress Math
            const actualInc = actualIncomeByPayday[payday] || 0;
            const expectedInc = parseFloat(pdSettings?.income) || 0;
            const progressPct = expectedInc > 0 ? Math.min((actualInc / expectedInc) * 100, 100) : (actualInc > 0 ? 100 : 0);
            
            const sortedBills = sortBillsSurgically(groupBills);

            return (
              <div key={payday} className="space-y-2">
                <div className="flex flex-col px-3 py-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl" onClick={() => toggleCollapse(payday)}>
                  <div className="flex items-center justify-between w-full">
                     <div className="flex items-center gap-2">
                       <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{payday}</h3>
                       <div className="text-slate-400">{isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</div>
                     </div>
                     <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                       ${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                     </span>
                  </div>
                  
                  {/* Live Income Progress Injector */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      {expectedDateStr}
                    </span>
                    {!isDueNow && (expectedInc > 0 || actualInc > 0) && (
                      <span className={`text-[9px] font-black uppercase tracking-widest ${actualInc >= expectedInc && expectedInc > 0 ? "text-[#10B981]" : "text-[#1877F2]"}`}>
                         ${actualInc.toLocaleString("en-US", {maximumFractionDigits:0})} / ${expectedInc.toLocaleString("en-US", {maximumFractionDigits:0})} Secured
                      </span>
                    )}
                  </div>
                  {!isDueNow && (expectedInc > 0 || actualInc > 0) && (
                     <div className={`w-full h-1 mt-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                       <div className={`h-full transition-all duration-1000 ${actualInc >= expectedInc && expectedInc > 0 ? "bg-[#10B981]" : "bg-[#1877F2]"}`} style={{ width: `${progressPct}%` }}></div>
                     </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className={`rounded-[2rem] p-3 border ${isDueNow ? isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100" : isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                    {sortedBills.length === 0 ? (
                      <p className="text-center text-xs font-bold text-slate-400 py-4">No bills assigned to this payday.</p>
                    ) : (
                      sortedBills.map((bill, idx) => (
                        <div key={bill.id} className={`flex flex-col p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== sortedBills.length - 1 ? "mb-1" : ""}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                                {bill.isPaid ? <CheckCircle2 className="text-[#1877F2] hover:scale-110 transition-transform" size={28} /> : <Circle className={`${isDarkMode ? "text-slate-600 hover:text-slate-500" : "text-slate-200 hover:text-slate-300"} hover:scale-110 transition-transform`} size={28} />}
                              </div>
                              <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${bill.isOverdue ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>{bill.icon}</div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                                    {bill.isRecurring && !bill.isPaid && <RefreshCw size={12} className="text-[#10B981] shrink-0" />}
                                  </div>
                                  <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{bill.isOverdue ? "Overdue • " : "Due "} {bill.fullDate}</p>
                                </div>
                              </div>
                            </div>
                            <div className={`font-black text-sm tracking-tight cursor-pointer ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`} onClick={() => setSelectedEntry(bill)}>
                              ${bill.amount.toFixed(2)}
                            </div>
                          </div>
                          
                          {bill.isInstallment && !bill.isPaid && (
                            <div className="mt-3 ml-[4.5rem] w-full max-w-[85%] animate-fade-in pr-2">
                              <div className="flex justify-between items-end mb-1.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#1877F2]">${(bill.paidAmount || 0).toLocaleString()} PAID</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">${(bill.totalAmount || 0).toLocaleString()} TOTAL</span>
                              </div>
                              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                                <div 
                                  className="h-full bg-[#1877F2]" 
                                  style={{ width: `${Math.min(((bill.paidAmount || 0) / (bill.totalAmount || 1)) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Recent Activity</h3>
          <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {transactions.length === 0 ? (
              <div className="py-8 text-center"><p className="font-bold text-sm text-slate-400">No recent activity.</p></div>
            ) : (
              <>
                {transactions.slice(0, 5).map((tx, idx) => (
                  <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== Math.min(transactions.length, 5) - 1 ? "mb-1" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>{tx.icon}</div>
                      <div>
                        <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</p>
                      </div>
                    </div>
                    <div className={`font-black text-sm tracking-tight ${tx.type === "Income" ? "text-emerald-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                {/* PREMIUM BUTTON */}
                <button onClick={() => changeTab("activity")} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 text-white bg-[#1877F2] shadow-[0_8px_16px_rgba(24,119,242,0.3)]">
                  <List size={16} /> See All Activity
                </button>
              </>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
