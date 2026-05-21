import React, { useState, useEffect } from "react";
import { ArrowUpCircle, ArrowDownCircle, Filter, Edit2, List, Calendar, Search } from "lucide-react";

export default function Activity({
  userName = "Founder",
  transactions = [],
  isDarkMode,
  renderHeroShell,
  setSelectedEntry,
  changeTab
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Structural Financial Calculations
  const totalIncome = transactions
    .filter((tx) => tx?.type === "Income")
    .reduce((sum, tx) => sum + (Number(tx?.amount) || 0), 0);

  const totalExpense = transactions
    .filter((tx) => tx?.type !== "Income")
    .reduce((sum, tx) => sum + (Number(tx?.amount) || 0), 0);

  const netCashFlow = totalIncome - totalExpense;
  const isNetNegative = netCashFlow < 0;

  const totalVolume = totalIncome + totalExpense;
  const incomeRatio = totalVolume === 0 ? 50 : (totalIncome / totalVolume) * 100;

  // Transaction Sorting & Filtering Logic
  const filteredTransactions = transactions
    .filter((tx) => {
      if (activeFilter === "Income") return tx?.type === "Income";
      if (activeFilter === "Expense") return tx?.type !== "Income";
      return true;
    })
    .sort((a, b) => new Date(b?.date || b?.rawDate) - new Date(a?.date || a?.rawDate));

  const graphicContent = (
    <div className="flex flex-col relative z-10 mb-2 w-full">
      {/* 👑 MASTER FLOATING CASH FLOW SUMMARY CARD */}
      <div className={`relative p-6 rounded-[2rem] border flex flex-col w-full transform transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isDarkMode ? "bg-gradient-to-br from-blue-900/60 via-slate-800 via-25% to-slate-800 border-slate-700/50 border-t-slate-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-gradient-to-br from-white via-slate-50/90 to-slate-100/60 border-slate-200/60 border-t-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),0_12px_24px_rgba(24,119,242,0.3),0_4px_12px_rgba(0,0,0,0.01)]"}`}>
        
        {/* IDENTITY AND VALUES */}
        <div className={`flex justify-between items-start w-full transform transition-all duration-700 delay-100 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Net Cash Flow • <span className={isNetNegative ? "text-red-500" : "text-[#1877F2]"}>Active Month</span></p>
            <p className={`text-4xl font-black tracking-tighter transition-colors duration-300 ${isNetNegative ? "text-red-500" : netCashFlow > 0 ? "text-[#10B981]" : isDarkMode ? "text-white" : "text-slate-900"}`}>
              {isNetNegative ? "-" : ""}${Math.abs(netCashFlow).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm text-[9px] font-black uppercase tracking-wider ${isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-white/80 border-slate-200/60 text-slate-600"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isNetNegative ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></div>
              {isNetNegative ? "Deficit" : "Surplus"}
            </span>
          </div>
        </div>

        {/* 📊 HORIZONTAL COMPARATIVE LEDGER GRAPHIC */}
        <div className={`w-full mt-5 transform transition-all duration-700 delay-300 ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className={`w-full h-2.5 rounded-full overflow-hidden border relative flex ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
            <div 
              className="h-full bg-[#10B981] transition-all duration-1000 ease-out shrink-0" 
              style={{ width: isMounted ? `${incomeRatio}%` : "0%" }}
            />
            <div 
              className="h-full bg-orange-500 dark:bg-orange-600 transition-all duration-1000 ease-out shrink-0" 
              style={{ width: isMounted ? `${100 - incomeRatio}%` : "0%" }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2.5 px-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1 text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> In: ${totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="flex items-center gap-1 text-orange-500"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> Out: ${totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Ledger`, graphicContent)}
      
      <main className="px-6 space-y-6 mt-4 relative z-10">
        {/* TIMEFRAME & SEGMENTATION FILTERS */}
        <div className="flex gap-2 pb-1 overflow-x-auto hide-scrollbar w-full">
          {["All", "Income", "Expense"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${activeFilter === type ? "bg-[#1877F2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.3)]" : (isDarkMode ? "bg-slate-800/60 text-slate-400 hover:text-slate-200" : "bg-white text-slate-400 hover:text-slate-600 border border-slate-200")}`}
            >
              {type} Log
            </button>
          ))}
        </div>

        {/* TRANSACTION STREAM PANEL */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center justify-between">
            <span>Recent Actions ({filteredTransactions.length})</span>
          </h3>

          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-xs font-bold text-slate-400 py-12">No matching ledger statements found.</p>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx?.type === "Income";
                  const isBillPayment = tx?.isBillPayment || tx?.type === "Bill" || (tx?.category && tx?.category.toLowerCase().includes("bill"));
                  
                  let txColorStr = "";
                  let txBgBorderStr = "";
                  let txShadowStr = "";
                  let txPrefix = "";

                  if (isIncome) {
                    txColorStr = "text-emerald-500";
                    txBgBorderStr = isDarkMode ? "bg-emerald-900/20 border-emerald-500/30" : "bg-emerald-50 border-emerald-200";
                    txShadowStr = "drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]";
                    txPrefix = "+";
                  } else if (isBillPayment) {
                    txColorStr = "text-[#1877F2]";
                    txBgBorderStr = isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200";
                    txShadowStr = "drop-shadow-[0_0_12px_rgba(24,119,242,0.5)]";
                    txPrefix = "-";
                  } else {
                    txColorStr = "text-orange-500";
                    txBgBorderStr = isDarkMode ? "bg-orange-900/20 border-orange-500/30" : "bg-orange-50 border-orange-200";
                    txShadowStr = "drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]";
                    txPrefix = "-";
                  }

                  return (
                    <div key={tx?.id} className={`flex flex-col p-4 rounded-[1.5rem] border shadow-sm transition-all hover:-translate-y-0.5 ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                      
                      <div className="flex items-start justify-between w-full mb-3 gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                            {tx?.icon || "💳"}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0 pt-1">
                            <p className={`font-black text-base leading-tight break-words whitespace-normal ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                              {tx?.name || "Transaction Entry"}
                            </p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedEntry(tx); }} 
                          className={`p-2 shrink-0 rounded-full transition-all active:scale-95 ${isDarkMode ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className={`w-full border-t mb-3 ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}></div>

                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest truncate w-full ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{tx?.category || "General"}</span>
                          <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 truncate w-full ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{tx?.date || "Recent Swipes"}</span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 ${txColorStr} ${txBgBorderStr} ${txShadowStr} whitespace-nowrap`}>
                          {txPrefix}${Math.abs(Number(tx?.amount) || 0).toFixed(2)}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
