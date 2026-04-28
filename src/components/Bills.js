import React, { useState } from "react";
import { CheckCircle2, RefreshCw, ChevronUp, ChevronDown, RotateCcw, Edit2 } from "lucide-react";

export default function Bills({
  userName,
  bills,
  paydayConfig,
  isDarkMode,
  handleBillClick,
  setSelectedEntry,
  renderHeroShell,
  handleRolloverMonth
}) {
  // TARGET 1: Boot up strictly with "Due Now" open and everything else locked shut.
  const [collapsedSections, setCollapsedSections] = useState({
    "Due Now": false,
    "Payday 1": true,
    "Payday 2": true,
    "Payday 3": true,
    "Payday 4": true,
    "Payday 5": true,
    "Unscheduled": true
  });

  const toggleCollapse = (section) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // === SURGICAL OCTAGON SORTING ENGINE ===
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

  // === MACRO MATH ENGINE ===
  const totalBillsAmount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const paidBills = bills.filter((b) => b.isPaid).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  const paidBillsAmount = paidBills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const progressPercentage = totalBillsAmount === 0 ? 0 : Math.max(0, Math.min((paidBillsAmount / totalBillsAmount) * 100, 100));

  // === PAYDAY ACCORDION ENGINE ===
  const frequency = paydayConfig?.frequency || "Weekly";
  const paydaySlots = {
      "Weekly": ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"],
      "Bi-Weekly": ["Payday 1", "Payday 2", "Payday 3"],
      "Semi-Monthly": ["Payday 1", "Payday 2"],
      "Monthly": ["Payday 1"]
  };
  
  const activeSlots = paydaySlots[frequency] || paydaySlots["Weekly"];
  // We include Unscheduled as a catch-all for bills without a payday assigned yet.
  const paydaysToRender = ["Due Now", ...activeSlots, "Unscheduled"]; 

  const billsByPayday = {};
  paydaysToRender.forEach((pd) => { billsByPayday[pd] = []; });

  const unpaidBills = bills.filter((b) => !b.isPaid);
  unpaidBills.forEach((bill) => { 
    const pd = bill.payday || "Unscheduled";
    if (billsByPayday[pd]) billsByPayday[pd].push(bill); 
    else {
      billsByPayday["Unscheduled"] = billsByPayday["Unscheduled"] || [];
      billsByPayday["Unscheduled"].push(bill);
    }
  });

  // === GRAPHIC HEADER ===
  const graphicContent = (
    <div className="flex items-center justify-between relative z-10 mb-6 w-full">
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="billGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#1E293B" : "#F1F5F9"} strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#billGlow)" strokeWidth="12" strokeLinecap="round" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{Math.round(progressPercentage)}%</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paid</span>
        </div>
      </div>
      <div className="flex-1 pl-4 text-right">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Progress</p>
        {/* TARGET 3: Forced currency symbol and decimal formatting on both parts */}
        <p className={`text-4xl font-black tracking-tighter mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          ${paidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-slate-400">/ ${totalBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </p>
        <button onClick={handleRolloverMonth} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm ${isDarkMode ? "bg-slate-800 text-[#10B981] hover:bg-slate-700" : "bg-white border-slate-200 border text-[#10B981] hover:bg-emerald-50"}`}>
          <RefreshCw size={14} strokeWidth={3} /> Start New Month
        </button>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Bills`, graphicContent)}

      <main className="px-6 space-y-8">
        
        {/* ========================================================= */}
        {/* 🔥 UNPAID BILLS (ACCORDION & TWO-ROW BENTO ARCHITECTURE) 🔥 */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Unpaid Bills</h3>
          
          {unpaidBills.length === 0 ? (
            <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-400" : "border-slate-300 bg-slate-50 text-slate-500"}`}>
              <CheckCircle2 size={32} className="mx-auto mb-3 text-[#10B981] opacity-50" />
              <p className="font-bold text-sm">All Caught Up</p>
              <p className="text-xs mt-1 opacity-70">You have no unpaid bills on the board.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paydaysToRender.map((payday) => {
                const groupBills = billsByPayday[payday] || [];
                if (groupBills.length === 0) return null; // Clean UI: Hide empty paydays

                const isDueNow = payday === "Due Now";
                const isCollapsed = collapsedSections[payday];
                const checkTotal = groupBills.reduce((sum, b) => sum + (b.amount || 0), 0);
                const sortedBills = sortBillsSurgically(groupBills);

                return (
                  <div key={payday} className="space-y-2">
                    {/* ACCORDION HEADER */}
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
                    </div>

                    {/* ACCORDION BODY (BENTO BOX DESIGN) */}
                    {!isCollapsed && (
                      <div className={`rounded-[2rem] p-4 border shadow-sm ${isDueNow ? isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100" : isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                        <div className="space-y-3">
                          {sortedBills.map((bill) => {
                            const isOverdue = bill.isOverdue || bill.payday === "Due Now";
                            const leftToPay = Math.max(0, (bill.totalAmount || 0) - (bill.paidAmount || 0));
                            const remainingPct = bill.totalAmount > 0 ? (leftToPay / bill.totalAmount) * 100 : 0;
                            
                            return (
                              <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                                
                                {/* ROW 1: Identity & Edit Pencil */}
                                <div className="flex items-start justify-between w-full mb-4">
                                   <div className="flex items-center gap-3 flex-1">
                                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isOverdue ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                          {bill.icon}
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                           <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                                               {bill.name}
                                           </p>
                                           {bill.isRecurring && !bill.isPaid && <RefreshCw size={12} className="text-[#10B981] shrink-0" />}
                                        </div>
                                      </div>
                                   </div>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                                     className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                                   >
                                      <Edit2 size={16} strokeWidth={2.5} />
                                   </button>
                                </div>

                                {/* ROW 2: Meta, Pill, Action */}
                                <div className="flex items-center justify-between gap-2">
                                   <div className="flex flex-col shrink-0">
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                                          {bill.isOverdue ? "Overdue • " : bill.payday === "Due Now" ? "Due Now • " : "Due "} {bill.fullDate}
                                      </span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                       <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 transition-colors ${isOverdue ? isDarkMode ? "bg-red-900/30 text-red-400 border-red-900/50 shadow-[0_4px_12px_rgba(239,68,68,0.2)]" : "bg-red-50 text-red-600 border-red-200 shadow-[0_4px_12px_rgba(239,68,68,0.2)]" : isDarkMode ? "bg-slate-800 text-[#1877F2] border-slate-700 shadow-sm" : "bg-blue-50 text-[#1877F2] border-blue-100 shadow-[0_4px_12px_rgba(24,119,242,0.1)]"}`}>
                                           ${(bill.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </div>
                                       <button onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }} className={`p-1.5 rounded-xl transition-all active:scale-95 border shadow-sm ${isDarkMode ? "bg-[#10B981]/20 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/30" : "bg-[#10B981] border-[#10B981] text-white hover:bg-emerald-600"}`}>
                                           <CheckCircle2 size={18} strokeWidth={2.5} />
                                       </button>
                                   </div>
                                </div>

                                {/* INSTALLMENT BAR */}
                                {bill.isInstallment && !bill.isPaid && (
                                  <div className={`mt-4 pt-3 border-t w-full animate-fade-in ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}>
                                    <div className="flex justify-between items-end mb-2 px-1">
                                      <span className="text-[8px] font-black uppercase tracking-widest text-[#1877F2]">
                                        ${leftToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} REMAINING
                                      </span>
                                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                        OF ${(bill.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900 shadow-inner" : "bg-slate-200"}`}>
                                      <div className="h-full bg-[#1877F2] transition-all duration-500 ease-out" style={{ width: `${Math.min(remainingPct, 100)}%` }}></div>
                                    </div>
                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 🔥 PAID & SETTLED (UPGRADED TO TWO-ROW BENTO ARCHITECTURE) 🔥 */}
        {/* ========================================================= */}
        {paidBills.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Paid & Settled</h3>
            <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              <div className="space-y-3">
                {paidBills.map((bill) => (
                  <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all duration-300 opacity-60 grayscale-[0.3] ${isDarkMode ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800/80 hover:opacity-100 hover:grayscale-0" : "bg-white border-slate-100 hover:bg-slate-50 hover:opacity-100 hover:grayscale-0"}`}>
                    
                    {/* ROW 1: Identity & Edit Pencil */}
                    <div className="flex items-start justify-between w-full mb-4">
                       <div className="flex items-center gap-3 flex-1">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                              {bill.icon}
                          </div>
                          <p className={`font-black text-base truncate leading-tight line-through ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              {bill.name}
                          </p>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                         className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                       >
                          <Edit2 size={16} strokeWidth={2.5} />
                       </button>
                    </div>

                    {/* ROW 2: Meta, Pill, Action */}
                    <div className="flex items-center justify-between gap-2">
                       <div className="flex flex-col shrink-0">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {bill.isRecurring === false ? "One-Time" : "Recurring"}
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                           <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 transition-colors ${isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                               ${(bill.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }} className={`p-1.5 rounded-xl transition-all active:scale-95 border ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200"}`}>
                               <RotateCcw size={18} strokeWidth={2.5} />
                           </button>
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
