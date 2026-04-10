import React from "react";
import { ArrowRightLeft, PlusCircle } from "lucide-react";

export default function Accounts({
  userName,
  accounts,
  isDarkMode,
  setIsTransferOpen,
  setIsAddAccountOpen,
  setSelectedAccount,
  setEditAccountBalance,
  renderHeroShell
}) {
  // === NET WORTH MATH ENGINE ===
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  const historyData = [{ label: "Apr", val: netWorth }];
  const activeDataPoint = historyData[0];

  // === GRAPHIC HEADER ===
  const graphicContent = (
    <div className="flex justify-between items-end mb-6">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth</p>
        <p className={`text-5xl font-black tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          ${activeDataPoint.val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Accounts`, graphicContent)}
      <main className="px-6 space-y-6">
        
        {/* ACTION BUTTONS */}
        <button onClick={() => setIsTransferOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1877F2] text-white shadow-blue-900/20" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
          <ArrowRightLeft size={16} /> Transfer Funds
        </button>
        <button onClick={() => setIsAddAccountOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
          <PlusCircle size={16} /> Add New Account
        </button>

        {/* ACCOUNTS LIST */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">All Accounts</h3>
          <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {accounts.map((acc, idx) => {
              const isDebt = acc.type === "Credit Card";
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
                  <div className={`font-black text-sm tracking-tight ${isDebt ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {isDebt ? "-" : ""}${Math.abs(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
