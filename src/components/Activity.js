import React from "react";
import { Search } from "lucide-react";

export default function Activity({
  userName,
  transactions,
  activitySearch,
  setActivitySearch,
  activityFilter,
  setActivityFilter,
  isDarkMode,
  setSelectedEntry,
  renderHeroShell
}) {
  // === ACTIVITY MATH & FILTER ENGINE ===
  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch = tx.name.toLowerCase().includes(activitySearch.toLowerCase()) || 
                          (tx.category && tx.category.toLowerCase().includes(activitySearch.toLowerCase()));
    const matchesFilter = activityFilter === "All" || tx.type === activityFilter;
    return matchesSearch && matchesFilter;
  });

  const totalIncome = transactions.filter((t) => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
  const totalActivity = totalIncome + totalExpense;
  const incomePct = totalActivity === 0 ? 50 : (totalIncome / totalActivity) * 100;
  const netFlow = totalIncome - totalExpense;

  // === GRAPHIC HEADER ===
  const graphicContent = (
    <div className="flex flex-col relative z-10 mb-6">
      <div className="text-center mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Net Cash Flow</span>
        <p className={`text-5xl font-black tracking-tighter ${netFlow >= 0 ? "text-emerald-500" : "text-orange-500"}`}>
          {netFlow >= 0 ? "+" : "-"}${Math.abs(netFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="flex w-full h-10 rounded-2xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800">
        <div style={{ width: `${incomePct}%` }} className="bg-[#10B981] flex items-center pl-4 transition-all duration-1000">
          <span className="text-[10px] font-black text-white tracking-widest uppercase shadow-sm">In</span>
        </div>
        <div style={{ width: `${100 - incomePct}%` }} className="bg-[#F97316] flex items-center justify-end pr-4 transition-all duration-1000">
          <span className="text-[10px] font-black text-white tracking-widest uppercase shadow-sm">Out</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Activities`, graphicContent)}
      <main className="px-6 space-y-6">
        
        {/* SEARCH & FILTERS */}
        <div className="relative shadow-sm">
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={activitySearch} 
            onChange={(e) => setActivitySearch(e.target.value)} 
            className={`w-full py-4 pl-12 pr-4 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white placeholder-slate-500 focus:border-[#1877F2]" : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-[#1877F2]"}`} 
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
        
        <div className="flex gap-2">
          {["All", "Income", "Expense"].map((filterOption) => (
            <button 
              key={filterOption} 
              onClick={() => setActivityFilter(filterOption)} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${activityFilter === filterOption ? "bg-[#1877F2] text-white shadow-[0_4px_15px_rgba(24,119,242,0.3)]" : isDarkMode ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-white text-slate-500 border border-slate-100 shadow-sm"}`}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* TRANSACTIONS LIST */}
        <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
          {filteredTxs.length === 0 ? (
            <div className={`p-8 text-center rounded-xl border border-dashed ${isDarkMode ? "border-slate-700 text-slate-500" : "border-slate-200 text-slate-400"}`}>
              <p className="font-bold text-sm">No results found.</p>
              <p className="text-[10px] mt-1 uppercase tracking-widest">Try adjusting your filters</p>
            </div>
          ) : (
            filteredTxs.map((tx, idx) => (
              <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== filteredTxs.length - 1 ? "mb-1" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>
                    {tx.icon}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</p>
                  </div>
                </div>
                <div className={`font-black text-sm tracking-tight ${tx.type === "Income" ? "text-emerald-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {tx.type === "Income" ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}
