import React, { useState } from "react";
import { ArrowRightLeft, PlusCircle } from "lucide-react";

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

  // === DYNAMIC TIME-MACHINE CHART ENGINE ===
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  
  const historyData = [];
  let currentCalcNW = netWorth;
  const today = new Date();

  for(let i=0; i<6; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = targetDate.toLocaleString('default', { month: 'short' });
    
    if (i === 0) {
        historyData.unshift({ label: monthName, val: Math.max(0, currentCalcNW), month: targetDate.getMonth(), year: targetDate.getFullYear() });
    } else {
        if (isDemoMode) {
          const variance = 1 - (Math.random() * (0.06 - 0.02) + 0.02);
          currentCalcNW = currentCalcNW * variance;
          historyData.unshift({ label: monthName, val: Math.max(0, currentCalcNW), month: targetDate.getMonth(), year: targetDate.getFullYear() });
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
          historyData.unshift({ label: monthName, val: Math.max(0, currentCalcNW), month: targetDate.getMonth(), year: targetDate.getFullYear() });
        }
    }
  }
  
  const maxChartVal = Math.max(...historyData.map((d) => d.val), 1);
  const activeDataPoint = historyData[activeChartNode];

  const graphicContent = (
    <div className="relative z-10 mb-2">
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth • <span className="text-[#1877F2]">{activeDataPoint.label} {activeDataPoint.year}</span></p>
          <p className={`text-5xl font-black tracking-tighter transition-all duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            ${activeDataPoint.val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <div className="flex items-end justify-between h-48 gap-2 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
        {historyData.map((item, i) => {
          const heightPct = (item.val / maxChartVal) * 100;
          const isActive = activeChartNode === i;
          return (
            <div key={i} onClick={() => setActiveChartNode(i)} className="flex flex-col items-center justify-end h-full flex-1 cursor-pointer group">
              <div className="w-full relative flex justify-center h-full items-end">
                <div className={`w-full max-w-[32px] rounded-t-xl transition-all duration-500 ease-out ${isActive ? "bg-[#1877F2] shadow-[0_0_15px_rgba(24,119,242,0.4)]" : isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"}`} style={{ height: `${heightPct}%`, minHeight: "8px" }}></div>
              </div>
              <span className={`text-[9px] font-black mt-3 uppercase tracking-wider transition-colors duration-300 ${isActive ? "text-[#1877F2]" : "text-slate-400"}`}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Accounts`, graphicContent)}
      <main className="px-6 space-y-6 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setIsTransferOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1877F2] text-white shadow-blue-900/20" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
            <ArrowRightLeft size={20} /> Transfer
          </button>
          {/* 🔥 FIX 5A: GREEN ADD ACCOUNT BUTTON 🔥 */}
          <button onClick={() => setIsAddAccountOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#10B981] text-white shadow-emerald-900/20" : "bg-[#10B981] text-white shadow-emerald-500/30"}`}>
            <PlusCircle size={20} /> Add Account
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">All Accounts</h3>
          <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {accounts.map((acc, idx) => {
              const isNegative = acc.balance < 0;
              return (
                <div key={acc.id} onClick={() => { setSelectedAccount(acc); setEditAccountBalance(Math.abs(acc.balance).toString()); }} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== accounts.length - 1 ? "mb-1" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl bg-opacity-10 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                      {acc.icon}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{acc.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.description || acc.type}</p>
                    </div>
                  </div>
                  <div className={`font-black text-sm tracking-tight ${isNegative ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {isNegative ? "-" : ""}${Math.abs(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
