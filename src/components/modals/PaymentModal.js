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
          <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Confirm Payment</h3>
          <button onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false })} className={closeButtonClass}><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
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
