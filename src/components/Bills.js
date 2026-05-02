import React from "react";
import { CheckCircle2, RefreshCw, ChevronUp, ChevronDown, RotateCcw, Edit2 } from "lucide-react";

export default function Bills({
  userName,
  bills,
  paydayConfig,
  isDarkMode,
  handleBillClick,
  setSelectedEntry,
  renderHeroShell,
  handleRolloverMonth,
  collapsedPaydays,
  toggleCollapse
}) {
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

  // === GRAPHIC HEADER (HORIZONTAL REVERT + COLOR LOGIC) ===
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
        <p className="text-4xl font-black tracking-tighter mb-4">
          <span className={paidBillsAmount === 0 ? "text-red-500" : "text-[#10B981]"}>
            ${paidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xl text-slate-400 opacity-60">
             / ${totalBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
      </div>
    </div>
  );

  const formatAccordionDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
  };

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Bills`, graphicContent)}

      <main className="px-6 space-y-8 mt-2">
        
        {/* ========================================================= */}
        {/* 🔥 UNPAID BILLS (ACCORDION & 3-LEVEL BENTO ARCHITECTURE) 🔥 */}
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
                
                // Hide Due Now and Unscheduled if they are empty, but always show active paydays.
                if (groupBills.length === 0 && (payday === "Due Now" || payday === "Unscheduled")) return null;

                const isDueNow = payday === "Due Now";
                const isCollapsed = collapsedPaydays?.[payday];
                const checkTotal = groupBills.reduce((sum, b) => sum + (b.amount || 0), 0);
                const sortedBills = sortBillsSurgically(groupBills);
                const pdSettings = paydayConfig?.[payday] || {};
                const expectedDateStr = formatAccordionDateStr(pdSettings?.date).toUpperCase();

                return (
                  <div key={payday} id={`vert-${payday}`} className="space-y-2 scroll-mt-24">
                    
                    {/* ACCORDION HEADER */}
                    <div className="flex flex-col px-2 py-4 cursor-pointer transition-colors" onClick={() => toggleCollapse(payday)}>
                      <div className="flex justify-between items-start w-full">
                         <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                               <h3 className={`text-sm font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>{payday}</h3>
                               <div className="text-slate-500">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                               {isDueNow ? "Currently Due" : expectedDateStr}
                            </span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className={`text-sm font-black mb-1 ${isDueNow ? "text-red-500" : "text-[#1877F2]"}`}>
                               ${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDueNow ? "text-red-500/80" : "text-slate-500"}`}>
                               Total Due
                            </span>
                         </div>
                      </div>
                    </div>

                    {/* ACCORDION BODY (3-LEVEL BENTO DESIGN) */}
                    {!isCollapsed && (
                      <div className={`rounded-[2rem] p-4 border shadow-sm ${isDueNow ? isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100" : isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                        {groupBills.length === 0 ? (
                           <p className="text-center py-5 text-xs font-bold text-slate-400">No bills routed to this payday.</p>
                        ) : (
                          <div className="space-y-3">
                            {sortedBills.map((bill) => {
                              // FIX 4: Decouple Strictly Overdue from Due Now
                              const isStrictlyOverdue = bill.isOverdue;
                              const isDueToday = bill.payday === "Due Now";
                              const isUrgent = isStrictlyOverdue || isDueToday;
                              
                              return (
                                <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                                  
                                  {/* LEVEL 1: Identity & Edit Pencil */}
                                  <div className="flex items-start justify-between w-full mb-6">
                                     <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isUrgent ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                            {bill.icon}
                                        </div>
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-1.5">
                                             <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                                                 {bill.name}
                                             </p>
                                             {bill.isRecurring && !bill.isPaid && <RefreshCw size={12} strokeWidth={2} className="text-[#10B981] shrink-0" />}
                                          </div>
                                        </div>
                                     </div>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); setSelectedEntry(bill); }}
                                       className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                                     >
                                        <Edit2 size={16} strokeWidth={2} />
                                     </button>
                                  </div>

                                  {/* LEVEL 2: Action Row */}
                                  <div className="flex items-center justify-between gap-1 min-[341px]:gap-2 w-full">
                                     <div className="flex flex-col shrink-0">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${isUrgent ? "text-red-500" : "text-slate-400"}`}>
                                            {isStrictlyOverdue ? "OVERDUE" : isDueToday ? "DUE NOW" : "DUE"}
                                        </span>
                                        <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                                            {bill.fullDate || "TBD"}
                                        </span>
                                     </div>
                                     
                                     <div className="flex-1 flex justify-center px-1">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }} 
                                          className="px-3 min-[341px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#1877F2] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 min-[341px]:gap-1.5 whitespace-nowrap shrink-0"
                                        >
                                          <CheckCircle2 size={14} strokeWidth={2.5} />
                                          <span className="hidden min-[341px]:inline">MARK AS PAID</span>
                                          <span className="min-[341px]:hidden">PAY</span>
                                        </button>
                                     </div>

                                     <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 text-[#1877F2] drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} whitespace-nowrap`}>
                                        ${(Number(bill.amount) || 0).toFixed(2)}
                                     </div>
                                  </div>

                                  {/* LEVEL 3: Installment Bar */}
                                  {bill.isInstallment && !bill.isPaid && (
                                    <div className="mt-5 pt-3 border-t border-slate-200 w-full animate-fade-in">
                                      <div className="flex justify-between items-end mb-2 px-1">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                          Installment Plan
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                          ${(Number(bill.paidAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${(Number(bill.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900 shadow-inner" : "bg-slate-100"}`}>
                                        <div className="h-full bg-[#1877F2] transition-all duration-500 ease-out" style={{ width: `${Math.min(((Number(bill.paidAmount) || 0) / (Number(bill.totalAmount) || 1)) * 100, 100)}%` }}></div>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* THE GREAT DIVIDE (SIGNATURE SEPARATOR - HARDCODED WHITE)  */}
        {/* ========================================================= */}
        {paidBills.length > 0 && unpaidBills.length > 0 && (
          <div className="mx-2 mt-8 mb-2 border-t border-slate-200"></div>
        )}

        {/* ========================================================= */}
        {/* 🔥 PAID & SETTLED (UPGRADED TO 3-LEVEL BENTO ARCHITECTURE) 🔥 */}
        {/* ========================================================= */}
        {paidBills.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Paid & Settled</h3>
            <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              <div className="space-y-3">
                {paidBills.map((bill) => (
                  <div key={bill.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all duration-300 opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 ${isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-white border-slate-100"}`}>
                    
                    {/* LEVEL 1: Identity & Edit Pencil */}
                    <div className="flex items-start justify-between w-full mb-6">
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
                          <Edit2 size={16} strokeWidth={2} />
                       </button>
                    </div>

                    {/* LEVEL 2: Action Row */}
                    <div className="flex items-center justify-between gap-1 min-[341px]:gap-2 w-full">
                       <div className="flex flex-col shrink-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Status
                          </span>
                          <span className={`text-xs font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                              Settled
                          </span>
                       </div>
                       
                       <div className="flex-1 flex justify-center px-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }} 
                            className={`px-3 min-[341px]:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${isDarkMode ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                          >
                             <RotateCcw size={14} strokeWidth={2} /> Revert
                          </button>
                       </div>

                       <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 transition-colors ${isDarkMode ? "bg-slate-800/50 text-slate-400 border-slate-700" : "bg-slate-50 text-slate-500 border-slate-200"} whitespace-nowrap`}>
                          ${(Number(bill.amount) || 0).toFixed(2)}
                       </div>
                    </div>
                    
                    {/* LEVEL 3: Installment Plan */}
                    {bill.isInstallment && (
                      <div className="mt-5 pt-3 border-t border-slate-200 w-full">
                        <div className="flex justify-between items-end mb-2 px-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Installment Plan</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                            ${(Number(bill.paidAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${(Number(bill.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900 shadow-inner" : "bg-slate-100"}`}>
                          <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${Math.min(((Number(bill.paidAmount) || 0) / (Number(bill.totalAmount) || 1)) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
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
