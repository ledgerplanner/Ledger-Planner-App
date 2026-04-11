import React from "react";
import { CheckCircle2, Circle, RefreshCw, ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, ArrowRight } from "lucide-react";

export default function Dashboard({ 
  userName, accounts, bills, transactions, 
  paydayConfig, setEditPaydayConfig, setIsPaydaySetupOpen, 
  collapsedPaydays, toggleCollapse, handleBillClick, 
  setSelectedEntry, isDarkMode, formatPaydayDateStr, renderHeroShell, changeTab 
}) {

  // === MACRO MATH ===
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const liquidCash = accounts.filter(a => a.type === "Checking" || a.type === "Cash").reduce((sum, acc) => sum + acc.balance, 0);
  
  // Safe to Spend = Liquid Cash minus Unpaid Bills due in the next 14 days
  const upcomingBills = bills.filter(b => !b.isPaid && !b.isOverdue);
  const upcomingBurn = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
  const safeToSpend = liquidCash - upcomingBurn;

  // === PREMIUM HERO CONTENT ===
  const graphicContent = (
    <div className="relative z-10 w-full text-center px-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Net Worth</p>
      <p className={`text-6xl font-black tracking-tighter transition-colors duration-300 ${totalBalance >= 0 ? isDarkMode ? "text-white" : "text-slate-900" : "text-red-500"}`}>
        ${Math.abs(totalBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>

      {/* Safe to Spend Shield */}
      <div className={`mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full border shadow-sm ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white/80 border-slate-100 backdrop-blur-md"}`}>
         <ShieldCheck size={16} className={safeToSpend >= 0 ? "text-[#10B981]" : "text-red-500"} />
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Safe to Spend</span>
         <span className={`text-sm font-black ${safeToSpend >= 0 ? "text-[#10B981]" : "text-red-500"}`}>${Math.abs(safeToSpend).toLocaleString()}</span>
      </div>
    </div>
  );

  // === 🔥 THE NEW BILL CARD (WITH PROGRESS BAR & ARROWS) ===
  const renderBillCard = (bill) => (
    <div key={bill.id} className={`relative flex items-center justify-between p-4 rounded-2xl transition-all shadow-sm border mb-2 
      ${bill.isPaid 
        ? isDarkMode ? "bg-slate-800 border-transparent" : "bg-white border-transparent" 
        : bill.isOverdue 
          ? isDarkMode ? "bg-[#1E293B] border-red-900/50" : "bg-white border-red-100"
          : isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-slate-100"
      }`}
    >
      <div className="flex items-center gap-4 w-full">
        <button onClick={(e) => { e.stopPropagation(); handleBillClick(bill.id); }} className={`shrink-0 transition-colors ${bill.isPaid ? "text-[#10B981]" : bill.isOverdue ? "text-red-500" : "text-slate-300 hover:text-[#1877F2]"}`}>
          {bill.isPaid ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
          
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col truncate pr-2">
              <div className="flex items-center gap-1.5">
                <p className={`font-bold text-sm truncate ${bill.isPaid ? "text-slate-400 line-through" : isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                  {bill.name}
                </p>
                {/* 🔄 The Recurring Icon */}
                {bill.isRecurring && !bill.isPaid && <RefreshCw size={10} className="text-slate-400 shrink-0" />}
              </div>
              <p className={`text-[9px] font-bold uppercase tracking-widest truncate mt-0.5 ${bill.isPaid ? "text-slate-400" : bill.isOverdue ? "text-red-500" : "text-slate-400"}`}>
                {bill.isPaid ? `Paid • ${bill.fullDate}` : bill.isOverdue ? `Overdue • ${bill.fullDate}` : `Due ${bill.fullDate}`}
              </p>
            </div>
            <div className={`font-black text-sm tracking-tight shrink-0 pl-2 ${bill.isPaid ? "text-slate-400" : isDarkMode ? "text-white" : "text-slate-900"}`}>
              ${bill.amount.toFixed(2)}
            </div>
          </div>

          {/* 📊 The Installment Progress Bar */}
          {bill.isInstallment && !bill.isPaid && (
            <div className="mt-3 w-full animate-fade-in pr-2">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-[#1877F2]">${(bill.paidAmount || 0).toLocaleString()} PAID</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">${(bill.totalAmount || 0).toLocaleString()} TOTAL</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                <div 
                  className="h-full bg-[#1877F2]" 
                  style={{ width: `${Math.min(((bill.paidAmount || 0) / (bill.totalAmount || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Dashboard`, graphicContent)}

      <main className="px-6 space-y-8 mt-4">
        
        {/* === LIQUIDITY (ACCOUNTS MINI-VIEW) === */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Liquidity</h3>
            <button onClick={() => changeTab("accounts")} className="text-[10px] font-bold text-[#1877F2] uppercase tracking-widest flex items-center gap-1">View All <ArrowRight size={10} /></button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {accounts.length === 0 ? (
               <div className={`w-full p-6 rounded-[2rem] border border-dashed text-center flex flex-col items-center justify-center ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                 <Wallet size={24} className="text-slate-400 mb-2" />
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No accounts linked</p>
               </div>
            ) : (
              accounts.slice(0, 3).map(acc => (
                <div key={acc.id} onClick={() => changeTab("accounts")} className={`min-w-[140px] p-4 rounded-3xl border shadow-sm shrink-0 cursor-pointer transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-800 hover:bg-slate-800" : "bg-white border-slate-50 hover:bg-slate-50"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-3 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>{acc.icon}</div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest truncate mb-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{acc.name}</p>
                  <p className={`font-black text-sm truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* === THE FLIGHT PATH (UPCOMING BILLS) === */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">The Flight Path</h3>
            <button onClick={() => changeTab("bills")} className="text-[10px] font-bold text-[#1877F2] uppercase tracking-widest flex items-center gap-1">Manage <ArrowRight size={10} /></button>
          </div>
          
          <div className={`p-4 rounded-[2rem] border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {bills.filter(b => !b.isPaid).length === 0 ? (
               <div className="py-8 text-center flex flex-col items-center justify-center">
                 <CheckCircle2 size={32} className="text-[#10B981] mb-2 opacity-50" />
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All clear.</p>
               </div>
            ) : (
              <>
                {/* Due Now / Overdue */}
                {bills.filter(b => (b.payday === "Due Now" || b.isOverdue) && !b.isPaid).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2 pl-2 flex items-center gap-1"><AlertCircle size={10} /> Action Required</h4>
                    {bills.filter(b => (b.payday === "Due Now" || b.isOverdue) && !b.isPaid).map(renderBillCard)}
                  </div>
                )}
                
                {/* Next Up (Payday 1 or earliest upcoming) */}
                {["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map(pdId => {
                   const pdBills = bills.filter(b => b.payday === pdId && !b.isPaid);
                   if (pdBills.length === 0) return null;
                   return (
                     <div key={pdId} className="mb-4 last:mb-0">
                       <h4 className={`text-[9px] font-black uppercase tracking-widest mb-2 pl-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Upcoming • {formatPaydayDateStr(paydayConfig[pdId]?.date)}</h4>
                       {pdBills.slice(0, 3).map(renderBillCard)}
                     </div>
                   )
                })}
              </>
            )}
          </div>
        </section>

        {/* === RECENT ACTIVITY === */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Activity</h3>
            <button onClick={() => changeTab("activity")} className="text-[10px] font-bold text-[#1877F2] uppercase tracking-widest flex items-center gap-1">Ledger <ArrowRight size={10} /></button>
          </div>
          
          <div className={`p-4 rounded-[2rem] border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {transactions.length === 0 ? (
               <div className="py-6 text-center">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No activity yet.</p>
               </div>
            ) : (
              transactions.slice(0, 4).map((tx, idx) => (
                <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== Math.min(transactions.length, 4) - 1 ? "mb-1" : ""}`}>
                  <div className="flex items-center gap-4 truncate">
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-lg shrink-0 relative ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                      {tx.icon}
                    </div>
                    <div className="truncate pr-2">
                      <p className={`font-bold text-sm truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                         {tx.category || "Uncategorized"}
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
        </section>

      </main>
    </div>
  );
}
