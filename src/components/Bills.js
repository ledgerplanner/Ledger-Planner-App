import React from "react";
import { CheckCircle2, Circle, RefreshCw, Calendar, ArrowRight, AlertCircle } from "lucide-react";

export default function Bills({ 
  userName, bills, isDarkMode, 
  handleBillClick, setSelectedEntry, renderHeroShell, handleRolloverMonth 
}) {

  // === MACRO MATH ===
  const upcomingBills = bills.filter(b => !b.isPaid);
  const totalUpcomingBurn = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
  
  const paidBills = bills.filter(b => b.isPaid);
  const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);

  // === PREMIUM HERO CONTENT ===
  const graphicContent = (
    <div className="relative z-10 w-full text-center px-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Unpaid Bills</p>
      <p className={`text-6xl font-black tracking-tighter transition-colors duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
        ${totalUpcomingBurn.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>

      {/* Paid So Far Badge */}
      <div className={`mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full border shadow-sm ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white/80 border-slate-100 backdrop-blur-md"}`}>
         <CheckCircle2 size={16} className="text-[#10B981]" />
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paid This Month</span>
         <span className="text-sm font-black text-[#10B981]">${totalPaid.toLocaleString()}</span>
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
      {renderHeroShell(`Bill Center`, graphicContent)}

      <main className="px-6 space-y-8 mt-4">
        
        {/* BLANK SLATE MESSAGE */}
        {bills.length === 0 ? (
           <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><Calendar size={32} className="text-slate-300 dark:text-slate-600" /></div>
              <h3 className={`text-lg font-black mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}>The slate is clean.</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No bills pending.<br/>Use the + button to add obligations.</p>
           </div>
        ) : (
          <div className="space-y-6">
            
            {/* Due Now / Overdue */}
            {bills.filter(b => (b.payday === "Due Now" || b.isOverdue) && !b.isPaid).length > 0 && (
              <section className="animate-fade-in">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <AlertCircle size={14} className="text-red-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500">Action Required</h3>
                </div>
                {bills.filter(b => (b.payday === "Due Now" || b.isOverdue) && !b.isPaid).map(renderBillCard)}
              </section>
            )}

            {/* Organized by Paydays */}
            {["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map(pdId => {
               const pdBills = bills.filter(b => b.payday === pdId && !b.isPaid);
               if (pdBills.length === 0) return null;
               
               const pdTotal = pdBills.reduce((sum, b) => sum + b.amount, 0);
               
               return (
                 <section key={pdId} className="animate-fade-in">
                   <div className="flex items-center justify-between mb-3 px-2">
                     <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{pdId}</h3>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>${pdTotal.toFixed(2)}</span>
                   </div>
                   {pdBills.map(renderBillCard)}
                 </section>
               )
            })}

            {/* Completed / Paid Bills */}
            {bills.filter(b => b.isPaid).length > 0 && (
              <section className="animate-fade-in mt-8 opacity-70">
                <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Completed</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest text-[#10B981]`}>${totalPaid.toFixed(2)}</span>
                </div>
                {bills.filter(b => b.isPaid).map(renderBillCard)}
              </section>
            )}
            
            {/* Rollover Month Button */}
            {bills.filter(b => b.isPaid).length > 0 && (
              <button 
                onClick={handleRolloverMonth}
                className={`w-full mt-8 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <RefreshCw size={18} className="text-[#1877F2]" /> Start New Month
              </button>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
