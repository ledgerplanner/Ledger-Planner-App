import React from "react";
import { 
  ArrowUpRight, ArrowDownRight, Settings, AlertCircle, ChevronRight, Wallet, CheckCircle2 
} from "lucide-react";

export default function Dashboard({ 
  userName, accounts, bills, transactions, paydayConfig, setIsPaydaySetupOpen, setIsNotificationsOpen, 
  handleBillClick, setSelectedEntry, isDarkMode, formatPaydayDateStr, renderHeroShell, changeTab 
}) {

  // --- CALCULATION ENGINE ---
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Calculate Overdue & Due Now Bills for Alerts
  const urgentBills = bills.filter(b => b.isOverdue || (!b.isPaid && b.payday === "Due Now"));
  
  // Sort Transactions for the preview list
  const recentTransactions = [...transactions].sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).slice(0, 4);

  // --- HERO CONTENT ---
  const graphicContent = (
    <div className="relative z-10 text-center pb-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Liquid</p>
      <div className="flex justify-center items-start">
        <span className={`text-2xl font-black mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>$</span>
        <h1 className={`text-6xl font-extrabold tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`Evening, ${userName}`, graphicContent)}

      <main className="px-6 space-y-6 mt-4">
        
        {/* QUICK ALERTS CARD */}
        {urgentBills.length > 0 ? (
          <div onClick={() => setIsNotificationsOpen(true)} className={`rounded-[2rem] p-5 cursor-pointer border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
                <h3 className="font-black text-sm text-red-600 uppercase tracking-widest">Action Required</h3>
              </div>
              <ChevronRight size={16} className="text-red-400" />
            </div>
            <p className="text-xs font-bold text-red-500/80">You have {urgentBills.length} bill{urgentBills.length > 1 ? 's' : ''} currently due or overdue. Tap to view.</p>
          </div>
        ) : (
          <div onClick={() => setIsNotificationsOpen(true)} className={`rounded-[2rem] p-5 cursor-pointer border shadow-sm transition-all active:scale-[0.98] flex items-center justify-between ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-[#10B981]" />
              </div>
              <div>
                <h3 className={`font-black text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>All Caught Up</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No urgent alerts</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        )}

        {/* PAYDAY ROADMAP PREVIEW */}
        <div>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>Upcoming Roadmap</h3>
            <button onClick={() => setIsPaydaySetupOpen(true)} className="text-[#1877F2] p-1 bg-blue-50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100 transition-colors">
              <Settings size={16} />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
            {["Payday 1", "Payday 2", "Payday 3"].map((pd, index) => {
               const config = paydayConfig[pd];
               if (!config || !config.date) return null;
               
               // Find bills mapped to this payday that are NOT paid
               const mappedBills = bills.filter(b => b.payday === pd && !b.isPaid);
               const totalDue = mappedBills.reduce((sum, b) => sum + b.amount, 0);
               const income = parseFloat(config.income) || 0;
               const remaining = income > 0 ? income - totalDue : 0;

               return (
                 <div key={pd} onClick={() => changeTab("bills")} className={`w-64 shrink-0 p-5 rounded-[2rem] border shadow-sm cursor-pointer transition-transform active:scale-[0.98] ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${index === 0 ? "bg-[#1877F2] text-white shadow-lg shadow-blue-500/30" : isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-slate-50 border border-slate-100"}`}>
                        📅
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-xs uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-900"}`}>{pd}</p>
                        <p className="text-[9px] font-bold text-[#1877F2] uppercase">{formatPaydayDateStr(config.date)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected</span>
                         <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>${income.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due</span>
                         <span className={`text-xs font-black ${totalDue > 0 ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>${totalDue.toLocaleString()}</span>
                       </div>
                       <div className={`h-px w-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}></div>
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leftover</span>
                         <span className={`text-sm font-black ${remaining > 0 ? "text-[#10B981]" : isDarkMode ? "text-white" : "text-slate-900"}`}>${remaining.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
               );
            })}
            
            {(!paydayConfig["Payday 1"] || !paydayConfig["Payday 1"].date) && (
              <div onClick={() => setIsPaydaySetupOpen(true)} className={`w-full p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDarkMode ? "border-slate-700 hover:bg-slate-800/50" : "border-slate-200 hover:bg-slate-50"}`}>
                 <Settings size={24} className="text-slate-400 mb-3" />
                 <h4 className={`font-black text-sm mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Setup Roadmap</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan your income & bills</p>
              </div>
            )}
          </div>
        </div>

        {/* ACCOUNTS PREVIEW */}
        <div>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>Active Vaults</h3>
            <button onClick={() => changeTab("accounts")} className="text-[10px] font-black text-[#1877F2] uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className={`rounded-[2rem] p-2 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {accounts.slice(0, 3).map((acc, idx) => (
              <div key={acc.id} onClick={() => changeTab("accounts")} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-100"}`}>{acc.icon}</div>
                  <div>
                    <p className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>{acc.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{acc.type}</p>
                  </div>
                </div>
                <div className={`font-black tracking-tight ${acc.balance < 0 ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                  ${Math.abs(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>Recent Activity</h3>
            <button onClick={() => changeTab("activity")} className="text-[10px] font-black text-[#1877F2] uppercase tracking-widest hover:underline">View All</button>
          </div>
          
          <div className={`rounded-[2rem] p-2 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {recentTransactions.length === 0 ? (
              <div className="py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent transactions</div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"}`}>
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
                        <span className={tx.type === 'Income' ? "text-[#10B981]" : "text-[#F97316]"}>{tx.category || "Uncategorized"}</span>
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
