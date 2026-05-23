import React from "react";
import { 
  Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, ArrowRight, 
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle, RefreshCw, Clock, DollarSign, Wallet
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
  changeTab
}) {
  
  // === MASTER UTILITY STATE CALCULATIONS ===
  const liquidAccounts = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash"));
  const liquidCashBuffer = liquidAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  
  const totalUnpaidBills = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalOverdueBills = bills.filter(b => b.isOverdue && !b.isPaid).reduce((sum, b) => sum + (b.amount || 0), 0);

  // === FIX #3: TIMING & HORIZON NAVIGATION MAPPER ===
  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);

  let nextPaydayKey = "Payday 1";
  let targetPaydayDate = null;
  let daysUntilPayday = null;

  // Scan and identify the nearest upcoming true direct deposit date
  for (let i = 1; i <= 5; i++) {
    const config = paydayConfig?.[`Payday ${i}`];
    if (config?.date) {
      const pDate = new Date(config.date);
      if (!isNaN(pDate.getTime()) && pDate >= todayLocal) {
        if (!targetPaydayDate || pDate < targetPaydayDate) {
          targetPaydayDate = pDate;
          nextPaydayKey = `Payday ${i}`;
        }
      }
    }
  }

  if (targetPaydayDate) {
    daysUntilPayday = Math.max(Math.ceil((targetPaydayDate - todayLocal) / (1000 * 60 * 60 * 24)), 0);
  }

  const activePaydayConfig = paydayConfig?.[nextPaydayKey];
  const expectedIncomeAmount = parseFloat(activePaydayConfig?.income) || 0;

  // === DYNAMIC RUNWAY HERO GRAPHIC CONTENT BLOCK ===
  const graphicHeroRunway = (
    <div className="w-full flex flex-col items-center pt-2">
      <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
        True Liquid Capital
      </p>
      <h1 className={`text-5xl font-extrabold tracking-tighter my-1 text-emerald-500`}>
        ${liquidCashBuffer.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h1>
      
      {/* NEXT PAYDAY COUNTDOWN PANEL */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
        <span className={`text-[11px] font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
          Next Direct Deposit:
        </span>
        {targetPaydayDate ? (
          <>
            <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {formatPaydayDateStr(activePaydayConfig?.date)}
            </span>
            {/* FIX #5: COUNTDOWN TAG SWITCHED FORM BLUE TO EMERALD GREEN */}
            <span className="text-xs font-black text-[#10B981] animate-pulse">
              (In {daysUntilPayday} {daysUntilPayday === 1 ? "Day" : "Days"})
            </span>
          </>
        ) : (
          /* FIX #5: ACTION BUTTON TEXT & ICON RE-SKIN FROM BLUE TO EMERALD GREEN */
          <button 
            onClick={setIsPaydaySetupOpen} 
            className="text-xs font-black text-[#10B981] underline hover:opacity-80 transition-opacity uppercase tracking-wider flex items-center gap-1"
          >
            Set your pay dates <ArrowRight size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-auto px-4 sm:px-6 pb-24 lg:pb-12">
      {/* GLOBAL HERO MODULE ENTRY POINT */}
      {renderHeroShell("Active Checking Ledger", graphicHeroRunway)}

      {/* CORE RUNWAY SCORECARDS */}
      <div className="grid grid-cols-2 gap-3 min-[380px]:gap-4 mb-8">
        <div className={`p-4 sm:p-5 rounded-[2rem] border transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fixed Obligations</span>
            <div className="p-1.5 rounded-full bg-blue-500/10 text-[#1877F2]"><ArrowUpRight size={14} strokeWidth={2.5} /></div>
          </div>
          <p className={`text-lg sm:text-2xl font-black truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            ${totalUnpaidBills.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Unpaid This Cycle</span>
        </div>

        <div className={`p-4 sm:p-5 rounded-[2rem] border transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Redline</span>
            <div className={`p-1.5 rounded-full ${totalOverdueBills > 0 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-slate-500/10 text-slate-400"}`}><AlertCircle size={14} strokeWidth={2.5} /></div>
          </div>
          <p className={`text-lg sm:text-2xl font-black truncate ${totalOverdueBills > 0 ? "text-red-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            ${totalOverdueBills.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Past Due Balance</span>
        </div>
      </div>

      {/* HORIZONTAL payday CONFIGURATION MATRICES Slider Container */}
      <div className="mb-8 w-full overflow-hidden">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Payday Allocations
          </h3>
          <button onClick={setIsPaydaySetupOpen} className="text-[10px] font-black text-[#1877F2] uppercase tracking-widest hover:underline">
            Manage Schedules
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 hide-scrollbar snap-x snap-mandatory">
          {["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((pdKey) => {
            const currentConfig = paydayConfig?.[pdKey];
            const hasData = currentConfig && (currentConfig.date || currentConfig.income);
            const cycleBills = bills.filter(b => b.payday === pdKey);
            const totalCycleBillsAmount = cycleBills.reduce((sum, b) => sum + (b.amount || 0), 0);
            const totalCyclePaidAmount = cycleBills.filter(b => b.isPaid).reduce((sum, b) => sum + (b.amount || 0), 0);

            if (!hasData) return null;

            return (
              <div 
                key={pdKey} 
                className={`w-[260px] p-5 rounded-[2.2rem] border shrink-0 snap-start transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100 shadow-[0_10px_25px_rgba(0,0,0,0.02)]"}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className={`text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{pdKey}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {currentConfig.date ? formatPaydayDateStr(currentConfig.date) : "Unscheduled"}
                    </p>
                  </div>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                    +${parseFloat(currentConfig.income || 0).toFixed(0)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Cash In</span>
                    <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      ${parseFloat(currentConfig.income || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bills Out</span>
                    {/* FIX #6: BILLS OUT PROJECTION TEXT COLOR SHIFTED FROM RED TO SIGNATURE BLUE */}
                    <span className="text-xs font-black text-[#1877F2]">
                      -${totalCycleBillsAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* MINI INTERNAL CYCLICAL TRACK PROGRESS BAR */}
                  <div className="pt-2">
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                      <div 
                        className="h-full bg-[#1877F2] rounded-full transition-all duration-500"
                        style={{ width: `${totalCycleBillsAmount > 0 ? Math.min((totalCyclePaidAmount / totalCycleBillsAmount) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cycle Progress</span>
                      <span className={`text-[9px] font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        {totalCycleBillsAmount > 0 ? Math.round((totalCyclePaidAmount / totalCycleBillsAmount) * 100) : 0}% Cleared
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SPLIT BILLS AND FEED SEGMENTS */}
      <div className="w-full grid grid-cols-1 gap-6">
        {/* CRITICAL ROUTING QUEUE */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Immediate Obligations
            </h3>
            <button onClick={() => changeTab("bills")} className="text-[10px] font-black text-[#1877F2] uppercase tracking-widest hover:underline">
              View Calendar
            </button>
          </div>

          <div className="space-y-3">
            {/* DUE NOW AND OVERDUE COLLAPSE ROUTER SECTION BLOCK */}
            <div className={`rounded-[2.2rem] border overflow-hidden transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
              <button 
                onClick={() => toggleCollapse("Due Now")}
                className={`w-full p-5 flex justify-between items-center transition-colors ${isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${bills.some(b => !b.isPaid && (b.isOverdue || b.payday === "Due Now")) ? "bg-red-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`}></div>
                  <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    Action Required Queue
                  </span>
                </div>
                {collapsedPaydays["Due Now"] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
              </button>

              {!collapsedPaydays["Due Now"] && (
                <div className={`px-5 pb-5 space-y-2 border-t ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
                  {bills.filter(b => b.payday === "Due Now" || b.isOverdue).length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No immediate bills due.</p>
                    </div>
                  ) : (
                    bills.filter(b => b.payday === "Due Now" || b.isOverdue).map((bill) => (
                      <div 
                        key={bill.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${bill.isPaid ? "opacity-50" : ""} ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-slate-50 border-slate-100"}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                          <span className="text-xl leading-none shrink-0">{bill.icon || "🧾"}</span>
                          <div className="min-w-0">
                            <p className={`text-xs font-black truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>{bill.name}</p>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${bill.isOverdue ? "text-red-500" : "text-orange-500"}`}>
                              {bill.isOverdue ? "Overdue" : bill.fullDate || "Today"}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleBillClick(bill.id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-transform active:scale-95 ${bill.isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-[#1877F2] text-white shadow-sm shadow-blue-500/10"}`}
                        >
                          {bill.isPaid ? "Paid" : `$${(bill.amount || 0).toFixed(0)}`}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* UPCOMING STANDARD NEXT PAYDAY QUEUES */}
            <div className={`rounded-[2.2rem] border overflow-hidden transition-all ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
              <button 
                onClick={() => toggleCollapse("Payday 1")}
                className={`w-full p-5 flex justify-between items-center transition-colors ${isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    Upcoming Schedule Buffer
                  </span>
                </div>
                {collapsedPaydays["Payday 1"] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
              </button>

              {!collapsedPaydays["Payday 1"] && (
                <div className={`px-5 pb-5 space-y-2 border-t ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
                  {bills.filter(b => b.payday !== "Due Now" && !b.isOverdue).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No scheduled bills matching timeline.</p>
                    </div>
                  ) : (
                    bills.filter(b => b.payday !== "Due Now" && !b.isOverdue).slice(0, 5).map((bill) => (
                      <div 
                        key={bill.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${bill.isPaid ? "opacity-50" : ""} ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-slate-50 border-slate-100"}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                          <span className="text-xl leading-none shrink-0">{bill.icon || "🧾"}</span>
                          <div className="min-w-0">
                            <p className={`text-xs font-black truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>{bill.name}</p>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {bill.fullDate || "Scheduled"} — {bill.payday}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleBillClick(bill.id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-transform active:scale-95 ${bill.isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                        >
                          {bill.isPaid ? "Paid" : `$${(bill.amount || 0).toFixed(0)}`}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RECENT MONITORING ACTIVITY FEEDS */}
        <div className="w-full mt-2">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Recent Log Entries
            </h3>
            <button onClick={() => changeTab("activity")} className="text-[10px] font-black text-[#1877F2] uppercase tracking-widest hover:underline">
              Audit Vault
            </button>
          </div>

          <div className={`rounded-[2.2rem] border p-4 sm:p-5 space-y-3 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vault outbox empty. Log cash flow inputs.</p>
              </div>
            ) : (
              transactions.slice(0, 4).map((tx) => {
                const isIncome = tx.type === "Income";
                return (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedEntry(tx)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-800/60 hover:bg-slate-800/40" : "bg-slate-50/70 border-slate-100 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm text-lg shrink-0">
                        {tx.icon || (isIncome ? "💵" : "🛍️")}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-black truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>{tx.name}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block truncate">
                          {tx.date || "Recent Entry"} • {tx.category || "General"}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-black shrink-0 ${isIncome ? "text-emerald-500" : "text-[#F97316]"}`}>
                      {isIncome ? "+" : "-"}${parseFloat(tx.amount || 0).toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
