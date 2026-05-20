import React from "react";
import { 
  TrendingUp, 
  ArrowDown, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Zap,
  ArrowRight
} from "lucide-react";

export default function Dashboard({
  userName,
  accounts,
  bills,
  transactions,
  paydayConfig,
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
  setHasConsumedAMBriefing
}) {
  
  // --- MASTER FINANCIAL CALCULATIONS ENGINE ---
  const liquidCash = accounts
    .filter(a => a.type === "Checking" || a.type === "Cash")
    .reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const upcomingBurn = bills
    .filter(b => !b.isPaid && !b.isOverdue)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const safeToSpend = liquidCash - upcomingBurn;
  const isRedline = safeToSpend < 100 && safeToSpend >= 0;

  const overdueTotal = bills
    .filter(b => b.isOverdue && !b.isPaid)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="w-full h-full animate-fade-in">
      
      {/* 1. HERO SHELL INJECTION */}
      {renderHeroShell(
        `Welcome Back, ${userName}`, 
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Liquid Cash</span>
            <span className="text-2xl font-black">${liquidCash.toFixed(2)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Safe-To-Spend</span>
            <span className={`text-2xl font-black ${isRedline ? "text-red-500" : "text-[#10B981]"}`}>
              ${safeToSpend.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="px-6 space-y-6 pb-24 lg:pb-12">
        
        {/* 2. AUTOMATED TIMELINE ITERATOR */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Cashflows Route Timeline
            </h3>
            <button 
              onClick={() => setIsPaydaySetupOpen(true)} 
              className="text-[10px] font-black uppercase tracking-widest text-[#1877F2] hover:underline"
            >
              Config Paydays
            </button>
          </div>

          {["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5", "Unscheduled"].map((groupName, idx, arr) => {
            const currentGroupBills = bills.filter(b => b.payday === groupName);
            if (currentGroupBills.length === 0) return null;

            const isCollapsed = collapsedPaydays[groupName];
            const groupTotal = currentGroupBills.reduce((sum, b) => sum + (b.amount || 0), 0);
            const currentConfig = paydayConfig?.[groupName];
            const hasGapWarning = currentConfig && groupTotal > parseFloat(currentConfig.income) && parseFloat(currentConfig.income) > 0;
            const isLast = idx === arr.length - 1;

            return (
              <div key={groupName} className="relative flex flex-col w-full">
                
                {/* VERTICAL TIMELINE TRACK THREAD */}
                {!isLast && (
                  <div 
                    className={`absolute left-4 sm:left-5 top-8 bottom-0 w-[2px] -translate-x-1/2 z-10 ${
                      isDarkMode ? "bg-slate-800" : "bg-slate-200"
                    }`} 
                  />
                )}

                {/* ACCORDION HEADER BLOCK */}
                <div className="flex items-start gap-4 sm:gap-6 w-full relative z-20">
                  <div className="mt-2 shrink-0 relative flex items-center justify-center">
                    <div 
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-4 font-black text-[10px] sm:text-xs ${
                        groupName === "Due Now"
                          ? "bg-red-500 border-red-100 dark:border-red-950/50 text-white"
                          : hasGapWarning
                          ? "bg-orange-500 border-orange-100 dark:border-orange-950/50 text-white"
                          : isDarkMode
                          ? "bg-slate-900 border-slate-800 text-slate-400"
                          : "bg-white border-slate-100 text-slate-500"
                      }`}
                    >
                      {groupName === "Due Now" ? "!" : idx}
                    </div>
                    {groupName === "Due Now" && (
                      <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
                    )}
                  </div>

                  {/* ACCORDION PLATE CARD */}
                  <div 
                    className={`flex-1 rounded-3xl border overflow-hidden shadow-sm mb-4 ${
                      isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"
                    }`}
                  >
                    <div 
                      onClick={() => toggleCollapse(groupName)}
                      className={`p-4 flex items-center justify-between cursor-pointer border-b ${
                        isDarkMode ? "border-slate-800/60 hover:bg-slate-800/50" : "border-slate-50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="truncate flex-1 mr-2">
                        <h4 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                          {groupName}
                        </h4>
                        {currentConfig?.date && (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                            Horizon: {formatPaydayDateStr(currentConfig.date)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className={`text-xs font-black block ${
                            groupName === "Due Now" ? "text-red-500" : isDarkMode ? "text-slate-300" : "text-slate-700"
                          }`}>
                            ${groupTotal.toFixed(2)}
                          </span>
                          {hasGapWarning && (
                            <span className="text-[8px] text-orange-500 font-black uppercase tracking-wider block animate-pulse">
                              Liquidity Gap
                            </span>
                          )}
                        </div>
                        <div className={`p-1.5 rounded-xl ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                          {isCollapsed ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {/* INTERIOR BILL LIST MAPPER */}
                    {!isCollapsed && (
                      <div className={`p-2 space-y-1.5 ${isDarkMode ? "bg-[#131C2E]" : "bg-slate-50/40"}`}>
                        {currentGroupBills.map((bill) => (
                          <div 
                            key={bill.id}
                            className={`p-3 rounded-2xl flex items-center justify-between border transition-all active:scale-[0.99] cursor-pointer ${
                              bill.isPaid 
                                ? isDarkMode ? "bg-slate-900/40 border-transparent opacity-40" : "bg-white border-transparent opacity-50"
                                : isDarkMode ? "bg-[#1E293B] border-slate-800/80 hover:border-slate-700" : "bg-white border-slate-100 hover:shadow-sm"
                            }`}
                            onClick={() => handleBillClick(bill.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setSelectedEntry(bill);
                            }}
                          >
                            <div className="flex items-center gap-3 truncate flex-1 mr-2">
                              <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-inner ${
                                bill.isPaid
                                  ? isDarkMode ? "bg-slate-800" : "bg-slate-100"
                                  : isDarkMode ? "bg-slate-900" : "bg-slate-50"
                              }`}>
                                {bill.icon || "🧾"}
                              </span>
                              <div className="truncate">
                                <p className={`text-xs font-black truncate tracking-wide ${
                                  bill.isPaid ? "text-slate-500 line-through" : isDarkMode ? "text-white" : "text-slate-900"
                                }`}>
                                  {bill.name}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                                  {bill.fullDate || "No Date"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className={`text-xs font-black tracking-tight ${
                                bill.isPaid ? "text-[#10B981] line-through opacity-70" : bill.isOverdue ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"
                              }`}>
                                ${(bill.amount || 0).toFixed(2)}
                              </span>
                              {bill.isPaid ? (
                                <div className="p-0.5 rounded-full bg-emerald-500/10 text-[#10B981]">
                                  <CheckCircle2 size={14} strokeWidth={3} />
                                </div>
                              ) : bill.isOverdue ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
