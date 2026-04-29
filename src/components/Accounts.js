import React, { useState } from "react";
import { ArrowRightLeft, PlusCircle, Edit2 } from "lucide-react";

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

  // === DYNAMIC TIME-MACHINE CHART ENGINE (Precision & Zero-Rule Unlocked) ===
  const netWorth = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  
  const today = new Date();
  
  // Find Account Inception Date (to enforce the Zero-Rule and kill the 2001 Ghost)
  let inceptionDate = today;
  if (transactions && transactions.length > 0) {
    const validDates = transactions
      .map(tx => {
          if (!tx.rawDate && !tx.date) return null;
          
          let parsedDate = new Date(tx.rawDate || tx.date);
          
          // THE 2001 GHOST INTERCEPTOR
          // If the mobile browser panicked and assigned the year 2001, forcefully correct it.
          if (parsedDate.getFullYear() === 2001) {
              parsedDate.setFullYear(today.getFullYear());
          }

          return parsedDate;
      })
      .filter(d => d && !isNaN(d.getTime())); 
      
    if (validDates.length > 0) {
      inceptionDate = new Date(Math.min(...validDates));
    }
  }

  const historyData = [];
  let currentCalcNW = netWorth;

  for(let i=0; i<6; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = targetDate.toLocaleString('default', { month: 'short' });
    const tMonth = targetDate.getMonth();
    const tYear = targetDate.getFullYear();
    
    if (i === 0) {
        historyData.unshift({ label: monthName, val: currentCalcNW, month: tMonth, year: tYear });
    } else {
        if (isDemoMode) {
          const variance = 1 - (Math.random() * (0.06 - 0.02) + 0.02);
          currentCalcNW = currentCalcNW * variance;
          historyData.unshift({ label: monthName, val: currentCalcNW, month: tMonth, year: tYear });
        } else {
          const monthAhead = historyData[0]; 
          const txsInMonthAhead = transactions.filter(tx => {
              let d = new Date(tx.rawDate || tx.date || today);
              if (d.getFullYear() === 2001) d.setFullYear(today.getFullYear()); // Ghost interceptor
              
              return d.getMonth() === monthAhead.month && d.getFullYear() === monthAhead.year;
          });
          
          const netCashFlowMonthAhead = txsInMonthAhead.reduce((sum, tx) => {
              return sum + (tx.type === "Income" ? Number(tx.amount) : -Number(tx.amount));
          }, 0);
          
          currentCalcNW -= netCashFlowMonthAhead;

          // ZERO-RULE: If the month predates the user's true first transaction, force $0.00
          let displayVal = currentCalcNW;
          if (tYear < inceptionDate.getFullYear() || (tYear === inceptionDate.getFullYear() && tMonth < inceptionDate.getMonth())) {
              displayVal = 0;
          }

          historyData.unshift({ label: monthName, val: displayVal, month: tMonth, year: tYear });
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
      <div className="flex items-end justify-between h-28 gap-2 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
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

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Accounts`, graphicContent)}
      <main className="px-6 space-y-6 mt-4">
        
        {/* ========================================== */}
        {/* 🔥 STANDARD LIQUID ACCOUNTS (BENTO BOX) 🔥 */}
        {/* ========================================== */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">All Accounts</h3>
          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {accounts.length === 0 ? (
                <p className="text-center text-xs font-bold text-slate-400 py-6">No accounts added.</p>
            ) : (
                <div className="space-y-3">
                {accounts.map((acc) => {
                    const isNegative = acc.balance < 0;
                    const isPositive = acc.balance > 0;
                    return (
                    <div key={acc.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                        
                        {/* ROW 1: Identity & Scroll-Protector Pencil */}
                        <div className="flex items-start justify-between w-full mb-4">
                           <div className="flex items-center gap-3 flex-1">
                              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                  {acc.icon}
                              </div>
                              <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                                  {acc.name}
                              </p>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedAccount(acc); setEditAccountBalance(acc.balance.toString()); }}
                             className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                           >
                              <Edit2 size={16} strokeWidth={2.5} />
                           </button>
                        </div>

                        {/* ROW 2: Description & Shrunken Amount Pill */}
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex flex-col shrink-0">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {acc.description || acc.type}
                              </span>
                           </div>
                           <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 transition-colors ${
                               isNegative 
                                   ? isDarkMode ? "bg-red-900/30 text-red-400 border-red-900/50 shadow-[0_4px_12px_rgba(239,68,68,0.2)]" : "bg-red-50 text-red-600 border-red-200 shadow-[0_4px_12px_rgba(239,68,68,0.2)]"
                                   : isPositive 
                                   ? isDarkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-900/50 shadow-[0_4px_12px_rgba(16,185,129,0.2)]" : "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                                   : isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
                           }`}>
                               {isNegative ? "-" : ""}${Math.abs(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                           </div>
                        </div>

                    </div>
                    );
                })}
                </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* THE GREAT DIVIDE (SIGNATURE SEPARATOR)                      */}
        {/* ========================================================= */}
        <div className={`border-t ${isDarkMode ? "border-white" : "border-slate-200"}`}></div>

        {/* COMMAND GRID */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setIsTransferOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1877F2] text-white shadow-blue-900/20" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
            <ArrowRightLeft size={20} /> Transfer
          </button>
          <button onClick={() => setIsAddAccountOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#10B981] text-white shadow-emerald-900/20" : "bg-[#10B981] text-white shadow-emerald-500/30"}`}>
            <PlusCircle size={20} /> Add Account
          </button>
        </div>

      </main>
    </div>
  );
}
