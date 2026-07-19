import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export default function PaymentModal({
  paymentModalConfig,
  setPaymentModalConfig,
  confirmPaymentRoute,
  bills,
  accounts,
  signatureColor,
  isDarkMode
}) {
  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;
  
  const activeBill = bills.find(b => b.id === paymentModalConfig.billId);
  const remainingBal = activeBill?.isInstallment ? (activeBill.totalAmount || 0) - (activeBill.paidAmount || 0) : 0;
  const isPayInFullAvailable = activeBill?.isInstallment && remainingBal > (activeBill.amount || 0);

  return (
    <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false })}></div>
      <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
        <div className="p-6 border-b flex justify-between items-center">
          
          {/* SURGICAL INJECTION: Official branding logo centered in place inside the Payment Modal header block */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center p-0.5 border shrink-0 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
              <img src="/login-logo.png" alt="Ledger Planner" className="w-full h-full object-cover rounded-full" />
            </div>
            <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Confirm Payment</h3>
          </div>
          <button onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false })} className={closeButtonClass}><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          
          {/* THE SURGICALLY INJECTED PREVIEW SNAPSHOT CARD */}
          {activeBill && (
            <div className={`flex items-center justify-between p-4 rounded-[1.5rem] border shadow-sm mb-2 ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  {activeBill.icon || "🧾"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Target Bill</span>
                  <p className={`font-black text-base truncate leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    {activeBill.name}
                  </p>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-[8px] border font-black text-base tracking-tighter shrink-0 text-[#1877F2] drop-shadow-[0_0_12px_rgba(24,119,242,0.7)] ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} whitespace-nowrap`}>
                ${(Number(activeBill.amount) || 0).toFixed(2)}
              </div>
            </div>
          )}

          <div className="relative">
            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Pay From Account</label>
            <select value={paymentModalConfig.accountId} onChange={(e) => setPaymentModalConfig({ ...paymentModalConfig, accountId: e.target.value })} className={`w-full pt-6 pb-2 px-5 rounded-2xl border appearance-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
              {accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).map((a) => (<option key={a.id} value={a.id} className={isDarkMode ? "bg-[#1E293B]" : "bg-white"}>{a.name} (${(a.balance || 0).toFixed(2)})</option>))}
            </select>
          </div>
          {isPayInFullAvailable && (
            <div className={`p-4 rounded-2xl border border-dashed flex items-center justify-between cursor-pointer ${paymentModalConfig.isPayInFull ? "text-white shadow-md" : isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} onClick={() => { setPaymentModalConfig({...paymentModalConfig, isPayInFull: !paymentModalConfig.isPayInFull}); }} style={{ backgroundColor: paymentModalConfig.isPayInFull ? signatureColor : undefined, borderColor: paymentModalConfig.isPayInFull ? signatureColor : undefined }}>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-85">Pay In Full</span>
                <span className="font-black text-sm">Remaining: ${remainingBal.toFixed(2)}</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${paymentModalConfig.isPayInFull ? "bg-white/30" : isDarkMode ? "bg-slate-700" : "bg-slate-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${paymentModalConfig.isPayInFull ? "translate-x-7" : "translate-x-1"}`}></div>
              </div>
            </div>
          )}
          <button onClick={confirmPaymentRoute} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#10B981] shadow-[0_8px_16px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Complete Payment {paymentModalConfig.isPayInFull ? `($${remainingBal.toFixed(2)})` : (activeBill ? `($${(activeBill.amount || 0).toFixed(2)})` : '')}</button>
        </div>
      </div>
    </div>
  );
}
