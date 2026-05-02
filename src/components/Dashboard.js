import React, { useState, useEffect } from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List, AlertCircle, RefreshCw, Zap, Calendar as CalendarIcon, Edit2 } from "lucide-react";
import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, messaging } from "../firebase";

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
  setHasConsumedPMBriefing
}) {
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsPushEnabled(Notification.permission === "granted");
    }
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

  // === STRICT LOCAL CALENDAR ENGINE ===
  const todayForMath = new Date();
  const currentMonthName = todayForMath.toLocaleString("en-US", { month: "long" });
  const currentMonthIdx = todayForMath.getMonth(); // Strict Local Month
  const currentYearIdx = todayForMath.getFullYear(); // Strict Local Year

  const totalIncomeBalance = accounts.reduce((sum, a) => sum + (Number(a?.balance) || 0), 0);
  
  // RESTORED: Pure global net for all unpaid bills across all months
  const unpaidBillsAmount = bills.filter((b) => !b?.isPaid).reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);
  
  const safeToSpend = totalIncomeBalance < 0 
    ? -(Math.abs(unpaidBillsAmount) - Math.abs(totalIncomeBalance))
    : totalIncomeBalance - unpaidBillsAmount;

  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((unpaidBillsAmount / totalIncomeBalance) * 100, 100)) : (unpaidBillsAmount > 0 ? 100 : 0);
  
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

  // === WATERFALL ENGINE (CUMULATIVE MATH) ===
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
    const paidTotal = groupBills.filter(b => b.isPaid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    let income = 0;
    if (pd !== "Due Now") {
      income = Math.max(0, (Number(pdSettings.income) || 0) - paidTotal);
    }

    runningBalance = runningBalance + income - unpaidTotal;
    hzBalances[pd] = runningBalance;
  });

  const graphicContent = (
    <div className="flex items-center justify-between relative z-10 mb-6 w-full">
      <div className="relative w-36 h-36 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={safeToSpend < 0 ? "#EF4444" : "#3B82F6"} strokeWidth="12" strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Debt Load</span>
          <span className={`text-2xl font-black ${safeToSpend < 0 ? "text-red-500" : "text-[#1877F2]"}`}>{Math.round(debtRatio)}%</span>
        </div>
      </div>
      
      <div className="flex-1 pl-4 flex flex-col items-end">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-2 ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${safeToSpend < 0 ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></div>
          <span className="text-[9px] font-black uppercase tracking-wider">{userName.toUpperCase()}'S BALANCE</span>
        </div>
        <p className={`text-3xl min-[350px]:text-4xl font-black tracking-tighter mb-3 ${safeToSpend < 0 ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
          {safeToSpend < 0 ? "-" : ""}${Math.abs(safeToSpend).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
        
        <div className="flex flex-col items-end gap-1.5 w-full">
           <div className="flex justify-between items-center w-full max-w-[160px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Income</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${totalIncomeBalance < 0 ? (isDarkMode ? "bg-red-900/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-600 border-red-100") : (isDarkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-50 text-emerald-600 border-emerald-100")}`}>
                {totalIncomeBalance < 0 ? "-" : ""}${Math.abs(totalIncomeBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
           </div>
           <div className="flex justify-between items-center w-full max-w-[160px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unpaid Bills</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${isDarkMode ? "bg-blue-900/30 text-[#1877F2] border-blue-900/50" : "bg-blue-50 text-[#1877F2] border-blue-100"}`}>
                ${unpaidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
           </div>
        </div>
      </div>
    </div>
  );

  // === LOCAL MONTH MATH ENGINE (BOTTOM COMPONENT) ===
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
    if (bill.isOverdue) {
      include = true;
    }
    return include ? sum + (Number(bill.amount) || 0) : sum;
  }, 0);

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(greetingStr, graphicContent)}

      <div className="flex justify-center px-6 mb-5 -mt-2">
         <button onClick={() => setIsPaydaySetupOpen(true)} className={`w-full max-w-sm py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border shadow-sm transition-all active:scale-95 ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-[#1877F2]" : "bg-white border-slate-200 text-[#1877F2]"}`}>
            <Settings2 size={18} strokeWidth={2.5} /> Set Your Pay Dates & Amounts
         </button>
      </div>

      <div className="w-full overflow-x-auto hide-scrollbar pl-6 pr-6 mb-6">
        <div className="flex gap-4 pr-6 pb-2 min-h-[170px]">
          {hzPaydays.map((pd) => {
            const pdSettings = paydayConfig?.[pd] || {};
            const groupBills = billsByPayday[pd] || [];
            if (pd !== "Due Now" && !pdSettings?.date) return null;

            const unpaidBills = groupBills.filter(b => !b.isPaid);
            const paidBills = groupBills.filter(b => b.isPaid);
            const unpaidCount = unpaidBills.length;
            const unpaidTotal = unpaidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
            const paidTotal = paidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

            if (pd === "Due Now" && unpaidCount === 0) return null;

            const totalExpectedIncome = Number(pdSettings.income) || 0;
            const remainingIncome = totalExpectedIncome - paidTotal;
            const expectedDateStr = pd === "Due Now" ? "ACTION REQ" : formatPaydayDateStr(pdSettings.date).toUpperCase();

            const waterfallBalance = hzBalances[pd];
            const isDeficit = waterfallBalance < 0;
            const subLabelStr = pd === "Due Now" ? "AVAILABLE NOW" : "AVAILABLE THIS WEEK";

            return (
              <div key={`hz-${pd}`} onClick={() => { if(collapsedPaydays[pd]) toggleCollapse(pd); document.getElementById(`vert-${pd}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className={`shrink-0 w-52 p-5 rounded-[1.75rem] border cursor-pointer active:scale-95 transition-all shadow-md flex flex-col justify-between h-40 ${pd === "Due Now" ? (isDarkMode ? "bg-red-900/10 border-red-900/40" : "bg-red-50 border-red-100") : (isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100")}`}>
                
                <div className="flex justify-between items-center w-full">
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${pd === "Due Now" ? "text-red-500" : "text-slate-400"}`}>{pd}</h4>
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
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Expected Pay</span>
                      <span className={`text-[10px] font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>+${Math.max(0, remainingIncome).toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
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

      <div className="mx-6 mb-6 border-t border-slate-200"></div>

      <main className="px-6 space-y-4">
        <div className="space-y-4">
          {["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((payday) => {
            const groupBills = billsByPayday[payday] || [];
            const activeGroupBills = groupBills.filter(b => !b.isPaid); // Filter out paid bills for a Clean Slate view
            const pdSettings = paydayConfig?.[payday] || {};
            const isDueNow = payday === "Due Now";
            
            if (isDueNow && activeGroupBills.length === 0) return null;
            if (!isDueNow && !pdSettings?.date) return null;

            const isCollapsed = collapsedPaydays?.[payday];
            const checkTotal = activeGroupBills.reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);
            const expectedDateStr = isDueNow ? "Currently Due" : formatPaydayDateStr(pdSettings.date);
            const sortedBills = sortBillsSurgically(activeGroupBills);

            return (
              <div key={payday} id={`vert-${payday}`} className="space-y-2 scroll-mt-24">
                <div className="flex flex-col px-3 py-3 cursor-pointer" onClick={() => toggleCollapse(payday)}>
                  <div className="flex items-center justify-between w-full mb-1">
                     <div className="flex items-center gap-2">
                       <h3 className={`text-sm font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{payday}</h3>
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

                            <div className="flex items-center justify-between gap-1 sm:gap-2 w-full">
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
                                      <button onClick={(e) => { e.stopPropagation(); handleBillClick(bill?.id); }} className="px-3 sm:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#1877F2] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
                                        <CheckCircle2 size={14} />
                                        <span className="hidden sm:inline">Mark as Paid</span>
                                        <span className="sm:hidden">Pay?</span>
                                      </button>
                                  ) : (
                                      <div className="px-3 sm:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"><CheckCircle2 size={14} /> Paid</div>
                                  )}
                               </div>

                               <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 text-[#1877F2] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] whitespace-nowrap`}>
                                  ${(Number(bill?.amount) || 0).toFixed(2)}
                               </div>
                            </div>

                            {bill?.isInstallment && (
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className="flex justify-between mb-1.5"><span className="text-[9px] font-bold uppercase text-slate-400">Installment Plan</span><span className="text-[9px] font-black text-slate-500">${(Number(bill?.paidAmount) || 0).toFixed(2)} / ${(Number(bill?.totalAmount) || 0).toFixed(2)}</span></div>
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

        {/* === MONTHLY SUMMARY ANCHOR === */}
        <div className={`mt-6 py-4 px-5 rounded-[1.5rem] border shadow-sm flex flex-col items-center justify-center gap-2 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
           <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Total Bills for {currentMonthName}</span>
           <div className={`px-3 py-1.5 rounded-[8px] border font-black text-lg tracking-tighter shrink-0 text-[#1877F2] drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
              ${currentMonthBillsTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200 mt-8">
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
                    <div key={tx?.id} className={`flex flex-col p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}>
                      
                      <div className="flex items-start justify-between w-full mb-4">
                         <div className="flex items-center gap-3 flex-1">
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                               {tx?.icon || "💳"}
                            </div>
                            <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                               {tx?.name || "Transaction"}
                            </p>
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedEntry(tx); }} 
                           className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                         >
                            <Edit2 size={16} strokeWidth={2.5} />
                         </button>
                      </div>

                      <div className="flex items-center justify-between gap-1 sm:gap-2 w-full">
                         <div className="flex flex-col shrink-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{tx?.category || "General"}</span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{tx?.date || "Recent"}</span>
                         </div>
                         <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 ${txColorStr} ${txBgBorderStr} ${txShadowStr} whitespace-nowrap`}>
                            {txPrefix}${(Number(tx?.amount) || 0).toFixed(2)}
                         </div>
                      </div>

                    </div>
                  );
                })}
                
                <button onClick={() => changeTab("activity")} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
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
