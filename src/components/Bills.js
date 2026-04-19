import React from "react";
import { CheckCircle2, Circle, RefreshCw } from "lucide-react";

export default function Bills({
  userName,
  bills,
  isDarkMode,
  handleBillClick,
  setSelectedEntry,
  renderHeroShell,
  handleRolloverMonth
}) {
  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
      if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return new Date(a.rawDate) - new Date(b.rawDate);
    });
  };

  const unpaidBills = sortBillsSurgically(bills.filter((b) => !b.isPaid));
  const paidBills = bills.filter((b) => b.isPaid).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  const totalBillsAmount = bills.reduce((sum, b) => sum + b.amount, 0);
  const paidBillsAmount = paidBills.reduce((sum, b) => sum + b.amount, 0);
  const progressPercentage = totalBillsAmount === 0 ? 0 : Math.max(0, Math.min((paidBillsAmount / totalBillsAmount) * 100, 100));

  const graphicContent = (
    <div className="flex items-center justify-between relative z-10 mb-6 w-full">
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="billGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#1E293B" : "#F1F5F9"} strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#billGlow)" strokeWidth="12" strokeLinecap="round" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{Math.round(progressPercentage)}%</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paid</span>
        </div>
      </div>
      <div className="flex-1 pl-4 text-right">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Progress</p>
        <p className={`text-4xl font-black tracking-tighter mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          ${paidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })} <span className="text-xl text-slate-400">/ {totalBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
        </p>
        <button onClick={handleRolloverMonth} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm ${isDarkMode ? "bg-slate-800 text-[#10B981] hover:bg-slate-700" : "bg-white border-slate-200 border text-[#10B981] hover:bg-emerald-50"}`}>
          <RefreshCw size={14} strokeWidth={3} /> Start New Month
        </button>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Bills`, graphicContent)}

      <main className="px-6 space-y-8">
        
        {/* UNPAID BILLS LIST */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Unpaid Bills</h3>
          {unpaidBills.length === 0 ? (
            <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-400" : "border-slate-300 bg-slate-50 text-slate-500"}`}>
              <CheckCircle2 size={32} className="mx-auto mb-3 text-[#10B981] opacity-50" />
              <p className="font-bold text-sm">All Caught Up</p>
              <p className="text-xs mt-1 opacity-70">You have no unpaid bills on the board.</p>
            </div>
          ) : (
            /* 🔥 THE BENTO BOX MAIN CARD 🔥 */
            <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              <div className="space-y-3">
                {unpaidBills.map((bill) => {
                  // 🔥 FIX 2: INSTALLMENT PROGRESS MATH 🔥
                  const leftToPay = Math.max(0, (bill.totalAmount || 0) - (bill.paidAmount || 0));
                  const remainingPct = bill.totalAmount > 0 ? (leftToPay / bill.totalAmount) * 100 : 0;
                  
                  return (
                    /* 🔥 THE INDIVIDUAL INNER CARD 🔥 */
                    <div key={bill.id} className={`flex flex-col p-3.5 rounded-2xl border shadow-sm transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                            <Circle className={`${isDarkMode ? "text-slate-600 hover:text-slate-500" : "text-slate-300 hover:text-slate-400"} hover:scale-110 transition-transform`} size={28} />
                          </div>
                          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${bill.isOverdue || bill.payday === "Due Now" ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>{bill.icon}</div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                                {bill.isRecurring && !bill.isPaid && <RefreshCw size={12} className="text-[#10B981] shrink-0" />}
                              </div>
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${bill.isOverdue || bill.payday === "Due Now" ? "text-red-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                                {bill.isOverdue ? "Overdue • " : bill.payday === "Due Now" ? "Due Now • " : "Due "} 
                                {bill.fullDate}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight cursor-pointer transition-colors ${bill.isOverdue || bill.payday === "Due Now" ? isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600" : isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-900"}`} onClick={() => setSelectedEntry(bill)}>
                          ${bill.amount.toFixed(2)}
                        </div>
                      </div>

                      {/* 🔥 THE DEBT DEMOLITION BAR (LEFT TO PAY) 🔥 */}
                      {bill.isInstallment && !bill.isPaid && (
                        <div className={`mt-4 pt-3 border-t w-full animate-fade-in ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}>
                          <div className="flex justify-between items-end mb-2 px-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#1877F2]">
                              ${leftToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} REMAINING
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                              OF ${(bill.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900 shadow-inner" : "bg-slate-200"}`}>
                            <div 
                              className="h-full bg-[#1877F2] transition-all duration-500 ease-out" 
                              style={{ width: `${Math.min(remainingPct, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* PAID BILLS LIST */}
        {paidBills.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Paid & Settled</h3>
            <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              <div className="space-y-3">
                {paidBills.map((bill) => (
                  <div key={bill.id} className={`flex flex-col p-3.5 rounded-2xl border shadow-sm transition-all duration-300 opacity-60 grayscale-[0.3] ${isDarkMode ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800/80 hover:opacity-100 hover:grayscale-0" : "bg-white border-slate-100 hover:bg-slate-50 hover:opacity-100 hover:grayscale-0"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                          <CheckCircle2 className="text-[#10B981] hover:scale-110 transition-transform" size={28} />
                        </div>
                        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>{bill.icon}</div>
                          <div>
                            <p className={`font-bold text-sm line-through ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{bill.name}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                              {bill.isRecurring === false ? "One-Time" : "Recurring"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl font-black text-sm tracking-tight cursor-pointer ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`} onClick={() => setSelectedEntry(bill)}>
                        ${bill.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
