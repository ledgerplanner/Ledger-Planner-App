import React, { useState, useEffect } from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List, AlertCircle, RefreshCw, Zap, Calendar as CalendarIcon } from "lucide-react";
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

  // === SURGICAL SORTING ===
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
  if (currentHour >= 5 && currentHour < 17) { greetingStr = `Morning, ${userName}`; }
  if (currentHour >= 12 && currentHour < 17) { greetingStr = `Afternoon, ${userName}`; }
  if (currentHour >= 22 || currentHour < 5) { greetingStr = `Up late, ${userName}?`; }

  // === MATH ENGINE & HERO LOGIC ===
  const totalIncomeBalance = accounts.reduce((sum, a) => sum + (Number(a?.balance) || 0), 0);
  const unpaidBillsAmount = bills.filter((b) => !b?.isPaid).reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);
  const safeToSpend = totalIncomeBalance - unpaidBillsAmount;
  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((unpaidBillsAmount / totalIncomeBalance) * 100, 100)) : (unpaidBillsAmount > 0 ? 100 : 0);
  
  const strokeDasharray = 251.2;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * debtRatio) / 100;
  const percentageLeft = Math.max(0, 100 - debtRatio);

  const billsByPayday = {};
  ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach((pd) => { billsByPayday[pd] = []; });
  bills.forEach((bill) => { if (bill?.payday && billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });

  const graphicContent = (
    <div className="flex items-center justify-between relative z-10 mb-6 w-full">
      <div className="relative w-36 h-36 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={safeToSpend < 0 ? "#EF4444" : "#3B82F6"} strokeWidth="12" strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Left</span>
          <span className={`text-2xl font-black ${safeToSpend < 0 ? "text-red-500" : "text-[#1877F2]"}`}>{Math.round(percentageLeft)}%</span>
        </div>
      </div>
      
      <div className="flex-1 pl-4 flex flex-col items-end">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-2 ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${safeToSpend < 0 ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></div>
          <span className="text-[9px] font-black uppercase tracking-wider">{userName.toUpperCase()}'S BALANCE</span>
        </div>
        <p className={`text-4xl font-black tracking-tighter mb-3 ${safeToSpend < 0 ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>${safeToSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        
        <div className="flex flex-col items-end gap-1.5 w-full">
           <div className="flex justify-between items-center w-full max-w-[160px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Income</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${isDarkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>${totalIncomeBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
           </div>
           <div className="flex justify-between items-center w-full max-w-[160px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unpaid</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200"}`}>${unpaidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
           </div>
        </div>
      </div>
    </div>
  );

  // === FREQUENCY LOGIC FOR HORIZONTAL CARDS ===
  const freq = paydayConfig?.frequency || "Weekly";
  let allowedPaydays = [];
  if (freq === "Monthly") allowedPaydays = ["Payday 1"];
  else if (freq === "Semi-Monthly") allowedPaydays = ["Payday 1", "Payday 2"];
  else if (freq === "Bi-Weekly") allowedPaydays = ["Payday 1", "Payday 2", "Payday 3"];
  else allowedPaydays = ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"];
  
  const hzPaydays = ["Due Now", ...allowedPaydays];

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(greetingStr, graphicContent)}

      {/* HORIZONTAL WEEKLY PREDICTIVE CARDS */}
      <div className="w-full overflow-x-auto hide-scrollbar pl-6 pr-6 mb-6 -mt-4">
        <div className="flex gap-3 w-max pr-6">
          {hzPaydays.map((pd) => {
            const pdSettings = paydayConfig?.[pd] || {};
            const groupBills = billsByPayday[pd] || [];
            
            // Hide unscheduled if it's not Due Now
            if (pd !== "Due Now" && !pdSettings?.date) return null;
            
            const unpaidForPd = groupBills.filter(b => !b.isPaid).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
            
            // Hide Due Now if $0 (No fires to put out)
            if (pd === "Due Now" && unpaidForPd === 0) return null;

            const expectedIncome = Number(pdSettings.income) || 0;
            const netAmount = expectedIncome - unpaidForPd;
            const isDeficit = netAmount < 0;
            const expectedDateStr = pd === "Due Now" ? "Action Required" : formatPaydayDateStr(pdSettings.date);

            return (
              <div key={`hz-${pd}`} onClick={() => { if(collapsedPaydays[pd]) toggleCollapse(pd); document.getElementById(`vert-${pd}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className={`shrink-0 w-36 p-4 rounded-[1.5rem] border cursor-pointer active:scale-95 transition-transform shadow-sm ${pd === "Due Now" ? (isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/50 border-red-100") : (isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100")}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${pd === "Due Now" ? "text-red-500" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{pd}</h4>
                
                {pd === "Due Now" ? (
                   <p className={`text-lg font-black tracking-tighter mb-3 text-red-500`}>
                     -${unpaidForPd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                   </p>
                ) : (
                   <p className={`text-lg font-black tracking-tighter mb-3 ${isDeficit ? "text-red-500" : "text-[#10B981]"}`}>
                     {isDeficit ? "" : "+"}${Math.abs(netAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                   </p>
                )}
                
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                  <CalendarIcon size={10} /> {expectedDateStr}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <main className="px-6 space-y-4">
        <div className="flex justify-center px-1 mb-5">
           <button onClick={() => setIsPaydaySetupOpen(true)} className={`w-full max-w-sm py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border shadow-sm transition-all active:scale-95 ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-[#1877F2]" : "bg-white border-slate-200 text-[#1877F2]"}`}>
              <Settings2 size={18} strokeWidth={2.5} /> Set Your Pay Dates & Amounts
           </button>
        </div>

        {/* ALIGNED VERTICAL PAY CARDS */}
        <div className="space-y-4">
          {["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((payday) => {
            const groupBills = billsByPayday[payday] || [];
            const pdSettings = paydayConfig?.[payday] || {};
            const isDueNow = payday === "Due Now";
            
            if (isDueNow && groupBills.length === 0) return null;
            if (!isDueNow && !pdSettings?.date) return null;

            const isCollapsed = collapsedPaydays?.[payday];
            const checkTotal = groupBills.filter((b) => !b?.isPaid).reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);
            const expectedDateStr = isDueNow ? "Currently Due" : formatPaydayDateStr(pdSettings.date);
            const sortedBills = sortBillsSurgically(groupBills);

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
                            
                            <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                               <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                  {bill?.icon || "🧾"}
                               </div>
                               <p className={`font-black text-base truncate flex-1 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                  {bill?.name || "Unnamed"}
                               </p>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                               <div className="flex flex-col shrink-0">
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${bill?.isOverdue ? "text-red-500" : "text-slate-400"}`}>
                                     {bill?.isOverdue ? "Overdue" : "Due"}
                                  </span>
                                  <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                                     {bill?.fullDate || "TBD"}
                                  </span>
                               </div>
                               
                               <div className="flex-1 flex justify-center">
                                  {!bill?.isPaid ? (
                                      <button onClick={(e) => { e.stopPropagation(); handleBillClick(bill?.id); }} className="px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#1877F2] text-white shadow-lg active:scale-95 transition-all flex items-center gap-1.5"><CheckCircle2 size={14} /> Mark as Paid</button>
                                  ) : (
                                      <div className="px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 size={14} /> Paid</div>
                                  )}
                               </div>

                               <div className={`font-black text-lg tracking-tighter shrink-0 text-[#1877F2] drop-shadow-[0_0_8px_rgba(24,119,242,0.6)]`}>
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

        {/* RECENT ACTIVITY */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Recent Activity</h3>
          <div className={`rounded-[2rem] p-4 border ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {transactions.length === 0 ? ( <p className="text-center py-8 font-bold text-slate-400">No activity yet.</p> ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx?.id} onClick={() => setSelectedEntry(tx)} className={`flex flex-col p-4 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}>
                    
                    <div className="flex items-center gap-3 mb-4">
                       <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                          {tx?.icon || "💳"}
                       </div>
                       <p className={`font-black text-base truncate flex-1 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                          {tx?.name || "Transaction"}
                       </p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                       <div className="flex flex-col shrink-0">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{tx?.category || "General"}</span>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{tx?.date || "Recent"}</span>
                       </div>
                       <div className={`font-black text-lg tracking-tighter shrink-0 ${tx?.type === "Income" ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"}`}>
                          {tx?.type === "Income" ? "+" : "-"}${(Number(tx?.amount) || 0).toFixed(2)}
                       </div>
                    </div>

                  </div>
                ))}
                
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
