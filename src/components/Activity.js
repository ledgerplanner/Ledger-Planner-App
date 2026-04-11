import React from "react";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Activity({ 
  userName, transactions, activitySearch, setActivitySearch, 
  activityFilter, setActivityFilter, isDarkMode, setSelectedEntry, renderHeroShell 
}) {

  // === SEARCH & FILTER ENGINE ===
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(activitySearch.toLowerCase());
    const matchesFilter = activityFilter === "All" || tx.type === activityFilter;
    return matchesSearch && matchesFilter;
  });

  // === DYNAMIC DONUT CHART MATH ===
  // Only calculate chart data based on "Expenses"
  const expenses = transactions.filter(t => t.type === "Expense");
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group expenses automatically by their emoji icon
  const expensesByIcon = expenses.reduce((acc, t) => {
    acc[t.icon] = (acc[t.icon] || 0) + t.amount;
    return acc;
  }, {});

  // Sort them largest to smallest and take the top 4
  const sortedIcons = Object.entries(expensesByIcon).sort((a, b) => b[1] - a[1]);
  const topCategories = sortedIcons.slice(0, 4);
  
  // Group anything else into a general "Other" box
  const otherAmount = sortedIcons.slice(4).reduce((sum, [_, amt]) => sum + amt, 0);
  if (otherAmount > 0) topCategories.push(["📦", otherAmount]);

  // Chart Rendering Setup
  const colors = ["#1877F2", "#F59E0B", "#10B981", "#8B5CF6", "#64748B"];
  let currentOffset = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const chartSegments = topCategories.map(([icon, amount], index) => {
    const percentage = totalExpenses > 0 ? amount / totalExpenses : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += percentage * circumference;
    return { icon, amount, percentage, strokeDasharray, strokeDashoffset, color: colors[index] };
  });

  // === GRAPHIC HEADER ===
  const graphicContent = (
    <div className="relative z-10 mb-2 w-full">
       <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cash Flow • <span className="text-[#1877F2]">All Time</span></p>
            <p className={`text-4xl font-black tracking-tighter transition-all duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              ${transactions.reduce((sum, t) => t.type === "Income" ? sum + t.amount : sum - t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
       </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Activity`, graphicContent)}

      <main className="px-6 space-y-6">

        {/* 📊 MASSIVE DYNAMIC DONUT CHART SECTION */}
        {totalExpenses > 0 && (
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
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spent</span>
              </div>
            </div>
            
            {/* Chart Legend */}
            <div className="flex-1 space-y-2">
              {chartSegments.slice(0, 3).map((seg, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{seg.icon}</span>
                    <span className={`text-[10px] font-bold uppercase ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {Math.round(seg.percentage * 100)}%
                    </span>
                  </div>
                  <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>${seg.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex gap-2">
          <div className={`flex-1 flex items-center px-4 rounded-2xl border ${isDarkMode ? "bg-[#1E293B] border-slate-800 text-white" : "bg-white border-slate-50 text-slate-900"}`}>
            <Search size={16} className="text-slate-400 shrink-0" />
            <input 
              type="text" placeholder="Search activity..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full py-3.5 px-3 bg-transparent text-sm font-bold outline-none placeholder-slate-400"
            />
          </div>
          <select 
            value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}
            className={`px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none border appearance-none ${isDarkMode ? "bg-[#1E293B] border-slate-800 text-slate-300" : "bg-white border-slate-50 text-slate-600"}`}
          >
            <option value="All">All</option>
            <option value="Income">Income</option>
            <option value="Expense">Expenses</option>
          </select>
        </div>

        {/* ACTIVITY LIST */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Transactions</h3>
          <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-bold text-sm">No transactions found.</div>
            ) : (
              filteredTransactions.map((tx, idx) => (
                <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== filteredTransactions.length - 1 ? "mb-1" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl relative ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>
                      {tx.icon}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 ${isDarkMode ? "border-[#1E293B]" : "border-white"} ${tx.type === 'Income' ? "bg-emerald-500" : "bg-slate-800"}`}>
                         {tx.type === 'Income' ? <ArrowUpRight size={8} className="text-white"/> : <ArrowDownRight size={8} className="text-white"/>}
                      </div>
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</p>
                    </div>
                  </div>
                  <div className={`font-black text-sm tracking-tight ${tx.type === "Income" ? "text-emerald-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
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
