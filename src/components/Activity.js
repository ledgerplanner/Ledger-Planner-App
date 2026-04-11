import React from "react";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";

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

  // === CASH FLOW MATH (IN / OUT BAR) ===
  const totalIncome = transactions.filter(t => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;
  const totalVolume = totalIncome + totalExpense;
  const inPercentage = totalVolume > 0 ? (totalIncome / totalVolume) * 100 : 50;

  // === TRUE CATEGORY DONUT CHART MATH ===
  const expenses = transactions.filter(t => t.type === "Expense");
  const totalExpensesAmount = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by their new TRUE CATEGORY
  const expensesByCategory = expenses.reduce((acc, t) => {
    const catName = t.category || "Uncategorized";
    acc[catName] = (acc[catName] || 0) + t.amount;
    return acc;
  }, {});

  // Sort them largest to smallest and take the top 4
  const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
  const topCategories = sortedCategories.slice(0, 4);
  
  // Group anything else into a general "Other" box
  const otherAmount = sortedCategories.slice(4).reduce((sum, [_, amt]) => sum + amt, 0);
  if (otherAmount > 0) topCategories.push(["Other Expenses", otherAmount]);

  // Chart Rendering Setup
  const colors = ["#1877F2", "#F59E0B", "#10B981", "#8B5CF6", "#64748B"];
  let currentOffset = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const chartSegments = topCategories.map(([name, amount], index) => {
    const percentage = totalExpensesAmount > 0 ? amount / totalExpensesAmount : 0;
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

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex gap-2">
          <div className={`flex-1 flex items-center px-4 rounded-2xl border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800 text-white" : "bg-white border-slate-50 text-slate-900"}`}>
            <Search size={16} className="text-slate-400 shrink-0" />
            <input 
              type="text" placeholder="Search transactions..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full py-4 px-3 bg-transparent text-sm font-bold outline-none placeholder-slate-400"
            />
          </div>
        </div>

        <div className="flex gap-2">
           <button onClick={() => setActivityFilter("All")} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activityFilter === "All" ? "bg-[#1877F2] text-white shadow-lg shadow-blue-500/30" : isDarkMode ? "bg-[#1E293B] text-slate-400 border border-slate-800" : "bg-white text-slate-500 border border-slate-50"}`}>All</button>
           <button onClick={() => setActivityFilter("Income")} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activityFilter === "Income" ? "bg-[#10B981] text-white shadow-lg shadow-emerald-500/30" : isDarkMode ? "bg-[#1E293B] text-slate-400 border border-slate-800" : "bg-white text-slate-500 border border-slate-50"}`}>Income</button>
           <button onClick={() => setActivityFilter("Expense")} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activityFilter === "Expense" ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/30" : isDarkMode ? "bg-[#1E293B] text-slate-400 border border-slate-800" : "bg-white text-slate-500 border border-slate-50"}`}>Expense</button>
        </div>

        {/* 📊 MASSIVE CATEGORY DONUT CHART */}
        {totalExpensesAmount > 0 && activityFilter !== "Income" && (
          <div className={`p-5 rounded-3xl border shadow-sm flex items-center gap-6 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
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
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outflow</span>
              </div>
            </div>
            
            {/* Chart Legend (True Categories) */}
            <div className="flex-1 space-y-3">
              {chartSegments.slice(0, 3).map((seg, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></div>
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

        {/* TRUE CATEGORY ACTIVITY LIST */}
        <div className="space-y-4">
          <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-bold text-sm">No transactions found.</div>
            ) : (
              filteredTransactions.map((tx, idx) => (
                <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== filteredTransactions.length - 1 ? "mb-1" : ""}`}>
                  <div className="flex items-center gap-4 truncate">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0 relative ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>
                      {tx.icon}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 ${isDarkMode ? "border-[#1E293B]" : "border-white"} ${tx.type === 'Income' ? "bg-[#10B981]" : "bg-slate-800"}`}>
                         {tx.type === 'Income' ? <ArrowUpRight size={8} className="text-white"/> : <ArrowDownRight size={8} className="text-white"/>}
                      </div>
                    </div>
                    <div className="truncate">
                      <p className={`font-bold text-sm truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                        <span className={tx.type === 'Income' ? "text-[#10B981]" : "text-[#F97316]"}>{tx.category || "Uncategorized"}</span> • {tx.date}
                      </p>
                    </div>
                  </div>
                  <div className={`font-black text-sm tracking-tight shrink-0 pl-2 ${tx.type === "Income" ? "text-[#10B981]" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
