import React from "react";
import { Search } from "lucide-react";

export default function Activity({ 
  userName, transactions, activitySearch, setActivitySearch, 
  activityFilter, setActivityFilter, isDarkMode, setSelectedEntry, renderHeroShell 
}) {

  // === SEARCH & FILTER ENGINE ===
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(activitySearch.toLowerCase()) || (tx.category && tx.category.toLowerCase().includes(activitySearch.toLowerCase()));
    const matchesFilter = activityFilter === "All" || tx.type === activityFilter;
    return matchesSearch && matchesFilter;
  });

  // === CASH FLOW MATH (IN / OUT BAR) FOR HERO ===
  const totalIncome = transactions.filter(t => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;
  const totalVolume = totalIncome + totalExpense;
  const inPercentage = totalVolume > 0 ? (totalIncome / totalVolume) * 100 : 50;

  // === DYNAMIC CATEGORY RING MATH (INCOME OR EXPENSE) ===
  const isIncomeView = activityFilter === "Income";
  const targetTransactions = isIncomeView 
    ? transactions.filter(t => t.type === "Income") 
    : transactions.filter(t => t.type === "Expense"); 

  const totalTargetAmount = targetTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by TRUE CATEGORY
  const categoriesMap = targetTransactions.reduce((acc, t) => {
    const catName = t.category || "Uncategorized";
    acc[catName] = (acc[catName] || 0) + t.amount;
    return acc;
  }, {});

  // Sort largest to smallest
  const sortedCategories = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1]);
  
  // 🔥 THE FOUNDER'S "LUCKY 8" UPGRADE
  // Cap at 8 distinct visual slices, group the rest into "Other"
  const topCategories = sortedCategories.slice(0, 8);
  const otherAmount = sortedCategories.slice(8).reduce((sum, [_, amt]) => sum + amt, 0);
  if (otherAmount > 0) topCategories.push(["Other", otherAmount]);

  // Premium Expanded Color Palette (9 Colors Total for 8 + Other)
  const colors = isIncomeView 
    ? ["#10B981", "#059669", "#34D399", "#6EE7B7", "#047857", "#064E3B", "#0D9488", "#14B8A6", "#94A3B8"] // Green & Teal shades for Income
    : ["#1877F2", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F43F5E", "#F97316", "#84CC16", "#64748B"]; // Vibrant mix for Expenses

  let currentOffset = 0;
  const radius = 42; // Expanded radius for massive ring size
  const circumference = 2 * Math.PI * radius;

  // 100% UN-CAPPED LEGEND: Maps every single category to a segment
  const chartSegments = topCategories.map(([name, amount], index) => {
    const percentage = totalTargetAmount > 0 ? amount / totalTargetAmount : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += percentage * circumference;
    return { name, amount, percentage, strokeDasharray, strokeDashoffset, color: colors[index] };
  });

  // === GRAPHIC HEADER (NET CASH & VELOCITY BAR) ===
  const graphicContent = (
    <div className="relative z-10 mb-2 w-full text-center px-4">
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Cash Flow</p>
       <p className={`text-5xl font-black tracking-tighter transition-all duration-300 mb-6 ${netCashFlow >= 0 ? "text-[#10B981]" : "text-red-500"}`}>
         {netCashFlow >= 0 ? "+" : "-"}${Math.abs(netCashFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}
       </p>

       {/* THE IN / OUT VELOCITY BAR */}
       <div className={`w-full h-10 rounded-full flex overflow-hidden shadow-inner ${isDarkMode ? "bg-[#1E293B]" : "bg-slate-100"}`}>
          <div 
            className="h-full bg-[#10B981] flex items-center justify-start px-4 transition-all duration-1000" 
            style={{ width: `${inPercentage}%` }}
          >
             {inPercentage > 15 && <span className="text-[10px] font-black text-white uppercase tracking-widest">IN</span>}
          </div>
          <div 
            className="h-full bg-[#F97316] flex items-center justify-end px-4 transition-all duration-1000" 
            style={{ width: `${100 - inPercentage}%` }}
          >
             {(100 - inPercentage) > 15 && <span className="text-[10px] font-black text-white uppercase tracking-widest">OUT</span>}
          </div>
       </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Activities`, graphicContent)}

      <main className="px-6 space-y-6 mt-4">

        {/* 📊 PREMIUM MASSIVE CATEGORY RING (ONLY SHOWS WHEN TOGGLED) */}
        {activityFilter !== "All" && totalTargetAmount > 0 && (
          <div className={`p-6 rounded-3xl border shadow-sm flex items-center gap-6 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            <div className="relative w-40 h-40 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="12" />
                {chartSegments.map((seg, i) => (
                  <circle
                    key={i} cx="50" cy="50" r={radius} fill="transparent"
                    stroke={seg.color} strokeWidth="12"
                    strokeDasharray={seg.strokeDasharray} strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round" className="transition-all duration-1000 ease-out"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {isIncomeView ? "Inflow" : "Outflow"}
                 </span>
              </div>
            </div>
            
            {/* UNCAPPED LEGEND */}
            <div className="flex-1 space-y-3 max-h-40 overflow-y-auto hide-scrollbar pr-1">
              {chartSegments.map((seg, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></div>
                      <span className={`text-[10px] font-bold uppercase truncate ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                        {seg.name}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {Math.round(seg.percentage * 100)}%
                    </span>
                  </div>
                  <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>${seg.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🎚️ TOGGLE CHIPS (Income / Expense) */}
        <div className="flex gap-3">
           <button 
             onClick={() => setActivityFilter(activityFilter === "Income" ? "All" : "Income")} 
             className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activityFilter === "Income" ? "bg-[#10B981] text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] transform -translate-y-0.5" : isDarkMode ? "bg-[#1E293B] text-slate-400 border border-slate-800" : "bg-white text-slate-400 border border-slate-100"}`}
           >
             Income
           </button>
           <button 
             onClick={() => setActivityFilter(activityFilter === "Expense" ? "All" : "Expense")} 
             className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activityFilter === "Expense" ? "bg-[#F97316] text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] transform -translate-y-0.5" : isDarkMode ? "bg-[#1E293B] text-slate-400 border border-slate-800" : "bg-white text-slate-400 border border-slate-100"}`}
           >
             Expense
           </button>
        </div>

        {/* SEARCH BAR */}
        <div className="flex gap-2">
          <div className={`flex-1 flex items-center px-4 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-800 text-white focus-within:border-slate-600" : "bg-white border-slate-100 text-slate-900 focus-within:border-[#1877F2]"}`}>
            <Search size={18} className="text-slate-400 shrink-0" />
            <input 
              type="text" placeholder="Search transactions..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full py-4 px-3 bg-transparent text-sm font-bold outline-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* LIST (THE BENTO BREAKOUT) */}
        <div className="space-y-4">
          {/* 🔥 THE BENTO BOX MAIN CARD 🔥 */}
          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {filteredTransactions.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-bold text-sm uppercase tracking-widest">No activities found.</div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  /* 🔥 THE INDIVIDUAL INNER CARD 🔥 */
                  <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-sm cursor-pointer transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                    <div className="flex items-center gap-4 truncate">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                        {tx.icon}
                      </div>
                      <div className="truncate">
                        <p className={`font-bold text-sm truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                          <span className={tx.type === 'Income' ? "text-[#10B981]" : "text-[#F97316]"}>{tx.category || "Uncategorized"}</span> • {tx.date}
                        </p>
                      </div>
                    </div>
                    {/* 🔥 THE SHADED VAULT 🔥 */}
                    <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight shrink-0 ml-2 transition-colors ${tx.type === "Income" ? isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600" : isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-900"}`}>
                      {tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
