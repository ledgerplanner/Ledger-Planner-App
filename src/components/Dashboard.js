import React from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List } from "lucide-react";

export default function Dashboard({
  userName,
  accounts,
  bills,
  transactions,
  paydayConfig,
  setEditPaydayConfig,
  setIsPaydaySetupOpen,
  collapsedPaydays,
  toggleCollapse,
  handleBillClick,
  setSelectedEntry,
  isDarkMode,
  formatPaydayDateStr,
  renderHeroShell,
  changeTab
}) {
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

  // The Gas Gauge: How much of your cash is eaten by debt? (0 = Good, 100 = Bad)
  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((unpaidBillsAmount / totalIncomeBalance) * 100, 100)) : (unpaidBillsAmount > 0 ? 100 : 0);
  
  const isCritical = debtRatio >= 85 || safeToSpend < 0;
  const isWarning = debtRatio >= 60 && debtRatio < 85;

  const strokeDasharray = 251.2;
  // Empty = 251.2, Full = 0
  const strokeDashoffset = strokeDasharray - (strokeDasharray * debtRatio) / 100;

  // === PAYDAY ROUTING LOGIC ===
  const billsByPayday = {};
  ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach((pd) => { billsByPayday[pd] = []; });
  bills.forEach((bill) => { if (billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });

  // === GRAPHIC HEADER ===
  const graphicContent = (
    <div className="flex items-center justify-between relative z-10 mb-6 w-full">
      {/* THE GAS GAUGE RING (MASSIVE w-40) */}
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
      
      {/* THE SAFE SPEND SHIELD */}
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
        
        {/* HEADER & CONFIGURE */}
        <div className="flex justify-between items-center px-1 mt-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pay Day Setup</h3>
          <button onClick={() => { setEditPaydayConfig(paydayConfig); setIsPaydaySetupOpen(true); }} className={`text-[9px] font-black uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 text-[#1877F2] hover:bg-slate-700" : "bg-white border text-[#1877F2] hover:bg-blue-50"}`}>
            <Settings2 size={12} strokeWidth={3} /> Configure
          </button>
        </div>

        {/* HORIZONTAL PAYDAY CARDS */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-2 -mx-2 px-3 snap-x">
          {["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((pd) => {
            const pdSettings = paydayConfig[pd];
            const isDueNow = pd === "Due Now";
            
            if (isDueNow && billsByPayday["Due Now"].length === 0) return null;
            
            const isSet = isDueNow || (pdSettings && (pdSettings.date || pdSettings.income));
            
            const expectedIncome = parseFloat(pdSettings?.income) || 0;
            const billsTotal = billsByPayday[pd]?.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0) || 0;
            const remaining = expectedIncome - billsTotal;

            return (
              <div key={pd} className={`min-w-[140px] p-4 rounded-3xl snap-center shrink-0 border transition-all ${isSet ? isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100 shadow-sm" : isDarkMode ? "bg-slate-800/30 border-dashed border-slate-700" : "bg-slate-50 border-dashed border-slate-200"}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDueNow ? "text-red-500" : isSet ? "text-[#1877F2]" : "text-slate-400"}`}>{pd}</p>
                <p className={`text-lg font-black tracking-tight mb-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {isDueNow ? `$${billsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : pdSettings?.income ? `$${parseFloat(pdSettings.income).toLocaleString()}` : "$0.00"}
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  {isDueNow ? "Currently Due" : pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled"}
                </p>
                {!isDueNow && isSet && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className={`text-[10px] font-black ${remaining >= 0 ? "text-[#10B981]" : "text-red-500"}`}>
                      {remaining >= 0 ? "+" : "-"}${Math.abs(remaining).toLocaleString("en-US", { minimumFractionDigits: 2 })} Left
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* VERTICAL BILLS ROUTING LIST */}
        <div className="space-y-4">
          {Object.entries(billsByPayday).map(([payday, groupBills]) => {
            if (payday === "Due Now" && groupBills.length === 0) return null;
            const pdSettings = paydayConfig[payday];
            if (!pdSettings?.date && !pdSettings?.income && groupBills.length === 0) return null;

            const isDueNow = payday === "Due Now";
            const isCollapsed = collapsedPaydays[payday];
            const checkTotal = groupBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
            const expectedDateStr = isDueNow ? "Currently Due" : pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled";
            const expectedIncomeStr = pdSettings && pdSettings.income ? `+$${parseFloat(pdSettings.income).toLocaleString()} Expected` : "";
            const sortedBills = [...groupBills].sort((a, b) => a.date - b.date);

            return (
              <div key={payday} className="space-y-2">
                <div className="flex justify-between items-center px-3 py-1 cursor-pointer" onClick={() => toggleCollapse(payday)}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{payday}</h3>
                      <div className="text-slate-400">{isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                      {expectedDateStr} {expectedIncomeStr && <span className="text-[#10B981]"> • {expectedIncomeStr}</span>}
                    </span>
                  </div>
                  <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    ${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
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
                                  <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                                  <p className={`text-[10px] font-bold uppercase tracking-wider ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{bill.isOverdue ? "Overdue • " : "Due "} {bill.fullDate}</p>
                                </div>
                              </div>
                            </div>
                            <div className={`font-black text-sm tracking-tight cursor-pointer ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`} onClick={() => setSelectedEntry(bill)}>
                              ${bill.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RECENT ACTIVITY SECTION */}
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
                <button onClick={() => changeTab("activity")} className={`w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1877F2] text-white shadow-blue-900/20" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
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
