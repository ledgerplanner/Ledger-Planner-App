import React, { useState } from "react";
import { ArrowRightLeft, PlusCircle, Target } from "lucide-react";

export default function Accounts({
  userName,
  accounts,
  transactions,
  isDarkMode,
  setIsTransferOpen,
  setIsAddAccountOpen,
  setSelectedAccount,
  setEditAccountBalance,
  renderHeroShell,
  isDemoMode
}) {
  const [activeChartNode, setActiveChartNode] = useState(5);

  // === DYNAMIC TIME-MACHINE CHART ENGINE (Negative Unlocked) ===
  const netWorth = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  
  const historyData = [];
  let currentCalcNW = netWorth;
  const today = new Date();

  for(let i=0; i<6; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = targetDate.toLocaleString('default', { month: 'short' });
    
    if (i === 0) {
        historyData.unshift({ label: monthName, val: currentCalcNW, month: targetDate.getMonth(), year: targetDate.getFullYear() });
    } else {
        if (isDemoMode) {
          const variance = 1 - (Math.random() * (0.06 - 0.02) + 0.02);
          currentCalcNW = currentCalcNW * variance;
          historyData.unshift({ label: monthName, val: currentCalcNW, month: targetDate.getMonth(), year: targetDate.getFullYear() });
        } else {
          const monthAhead = historyData[0];
          const txsInMonthAhead = transactions.filter(tx => {
              if (!tx.createdAt) return false;
              const d = typeof tx.createdAt.toDate === 'function' ? tx.createdAt.toDate() : new Date(tx.createdAt);
              return d.getMonth() === monthAhead.month && d.getFullYear() === monthAhead.year;
          });
          
          const netCashFlowMonthAhead = txsInMonthAhead.reduce((sum, tx) => {
              return sum + (tx.type === "Income" ? tx.amount : -tx.amount);
          }, 0);
          
          currentCalcNW -= netCashFlowMonthAhead;
          historyData.unshift({ label: monthName, val: currentCalcNW, month: targetDate.getMonth(), year: targetDate.getFullYear() });
        }
    }
  }
  
  const maxChartVal = Math.max(...historyData.map((d) => Math.abs(d.val)), 1);
  const activeDataPoint = historyData[activeChartNode];
  const isNetWorthNegative = activeDataPoint.val < 0;

  const graphicContent = (
    <div className="relative z-10 mb-2">
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth • <span className={`${isNetWorthNegative ? "text-red-500" : "text-[#1877F2]"}`}>{activeDataPoint.label} {activeDataPoint.year}</span></p>
          <p className={`text-5xl font-black tracking-tighter transition-all duration-300 ${isNetWorthNegative ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
            {isNetWorthNegative ? "-" : ""}${Math.abs(activeDataPoint.val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <div className="flex items-end justify-between h-48 gap-2 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
        {historyData.map((item, i) => {
          const heightPct = (Math.abs(item.val) / maxChartVal) * 100;
          const isActive = activeChartNode === i;
          const isItemNegative = item.val < 0;
          
          let barBgClass = isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200";
          if (isActive) {
            barBgClass = isItemNegative ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-[#1877F2] shadow-[0_0_15px_rgba(24,119,242,0.4)]";
          } else if (isItemNegative) {
            barBgClass = isDarkMode ? "bg-red-900/30 group-hover:bg-red-900/50" : "bg-red-50 group-hover:bg-red-100";
          }

          return (
            <div key={i} onClick={() => setActiveChartNode(i)} className="flex flex-col items-center justify-end h-full flex-1 cursor-pointer group">
              <div className="w-full relative flex justify-center h-full items-end">
                <div className={`w-full max-w-[32px] rounded-t-xl transition-all duration-500 ease-out ${barBgClass}`} style={{ height: `${heightPct}%`, minHeight: "8px" }}></div>
              </div>
              <span className={`text-[9px] font-black mt-3 uppercase tracking-wider transition-colors duration-300 ${isActive ? (isItemNegative ? "text-red-500" : "text-[#1877F2]") : "text-slate-400"}`}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // === HARD-LEDGER DATA SPLIT ===
  const standardAccounts = accounts.filter(a => a.type !== "Goal");
  const goalAccounts = accounts.filter(a => a.type === "Goal");

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Accounts`, graphicContent)}
      <main className="px-6 space-y-6 mt-4">
        
        {/* COMMAND GRID */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setIsTransferOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1877F2] text-white shadow-blue-900/20" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
            <ArrowRightLeft size={20} /> Transfer
          </button>
          <button onClick={() => setIsAddAccountOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#10B981] text-white shadow-emerald-900/20" : "bg-[#10B981] text-white shadow-emerald-500/30"}`}>
            <PlusCircle size={20} /> Add Account
          </button>
        </div>

        {/* ========================================== */}
        {/* 🔥 STANDARD LIQUID ACCOUNTS (BENTO BOX) 🔥 */}
        {/* ========================================== */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">All Accounts</h3>
          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {standardAccounts.length === 0 ? (
                <p className="text-center text-xs font-bold text-slate-400 py-6">No standard accounts added.</p>
            ) : (
                <div className="space-y-3">
                {standardAccounts.map((acc) => {
                    const isNegative = acc.balance < 0;
                    const isPositive = acc.balance > 0;
                    return (
                    <div key={acc.id} onClick={() => { setSelectedAccount(acc); setEditAccountBalance(Math.abs(acc.balance).toString()); }} className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-sm cursor-pointer transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-4 flex-1 min-w-0 pr-3">
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                {acc.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm break-words whitespace-normal leading-tight mb-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{acc.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.description || acc.type}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight transition-colors shrink-0 ${
                        isNegative 
                            ? isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
                            : isPositive 
                            ? isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                            : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                        }`}>
                        {isNegative ? "-" : ""}${Math.abs(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    );
                })}
                </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* 🔥 SAVINGS GOALS VAULT (HARD-LEDGER) 🔥 */}
        {/* ========================================== */}
        <hr className="my-8 border-dashed border-slate-200 dark:border-slate-800" />
        
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#10B981]">Savings Goals Vault</h3>
            </div>
            
            <button onClick={() => setIsAddAccountOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-emerald-900/30 text-[#10B981] hover:bg-slate-800" : "bg-white border-emerald-100 text-[#10B981] hover:bg-emerald-50"}`}>
                <Target size={18} strokeWidth={2.5} /> Add New Goal
            </button>

            {goalAccounts.length > 0 && (
                <div className="space-y-3 pt-2">
                    {goalAccounts.map((goal) => {
                        const savedAmount = goal.balance || 0;
                        const targetAmount = goal.targetAmount || 0;
                        const remaining = Math.max(0, targetAmount - savedAmount);
                        const progressPct = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;
                        
                        return (
                            <div key={goal.id} onClick={() => { setSelectedAccount(goal); setEditAccountBalance(Math.abs(goal.balance).toString()); }} className={`flex flex-col p-5 rounded-[2rem] border shadow-sm cursor-pointer transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1E293B] border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                                
                                <div className="flex items-center gap-4 mb-5 flex-1 min-w-0">
                                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-emerald-900/20 border-emerald-900/50" : "bg-emerald-50 border-emerald-100"}`}>
                                        {goal.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm break-words whitespace-normal leading-tight mb-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{goal.name}</p>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{progressPct.toFixed(0)}% FUNDED</p>
                                    </div>
                                </div>

                                <div className="space-y-2 w-full">
                                    <div className="flex justify-between items-end w-full">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-[#10B981]" : "text-[#10B981]"}`}>
                                            ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })} REMAINING
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            OF ${targetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                        <div className="h-full bg-[#10B981] transition-all duration-1000 ease-out" style={{ width: `${progressPct}%` }}></div>
                                    </div>
                                </div>
                                
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

      </main>
    </div>
  );
}
