import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, Wallet } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLedger } from '../../context/LedgerContext';

export default function PaymentModal({ config, setConfig, triggerHaptic, triggerVictory }) {
  const { 
    user, isDemoMode, isDarkMode, signatureColor, 
    accounts, setAccounts, bills, setBills, transactions, setTransactions 
  } = useLedger();

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const targetBill = bills.find(b => b.id === config.billId);

  useEffect(() => {
    if (targetBill) {
      setPaymentAmount(String(targetBill.amount || 0));
    }
  }, [targetBill]);

  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  const handleClose = () => {
    setConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
    setSelectedAccountId("");
  };

  const handlePaymentSubmit = async () => {
    if (!targetBill || !selectedAccountId) return;
    
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;

    triggerHaptic(50);
    
    const targetAcc = accounts.find(a => a.id === selectedAccountId);
    if (!targetAcc) return;

    const currentTime = new Date();
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

    // 1. Generate the formal Transaction Node
    const newTxNode = {
      id: `tx_payment_${Date.now()}`,
      name: targetBill.name,
      icon: targetBill.icon || "🧾",
      amount: amt,
      date: autoTimeStamp,
      type: "Expense",
      category: targetBill.category || "Bill Payment",
      accountId: targetAcc.id,
      isBillPayment: true,
      linkedBillId: targetBill.id
    };

    // 2. Calculate the new Account Balance
    const newAccBalance = (targetAcc.balance || 0) - amt;

    // 3. Process the Bill Updates (Handling Installment Math)
    let newPaidAmount = (targetBill.paidAmount || 0) + amt;
    
    const billUpdates = {
       isPaid: true,
       paidAmount: targetBill.isInstallment ? newPaidAmount : (targetBill.paidAmount || 0)
    };

    if (isDemoMode) {
      setTransactions([newTxNode, ...transactions]);
      setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: newAccBalance } : a));
      setBills(bills.map(b => b.id === targetBill.id ? { ...b, ...billUpdates } : b));
    } else if (user) {
      try {
        await addDoc(collection(db, "users", user.uid, "transactions"), { ...newTxNode, createdAt: serverTimestamp() });
        await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: newAccBalance });
        await updateDoc(doc(db, "users", user.uid, "bills", targetBill.id), billUpdates);
      } catch (e) {
        console.error("Payment pipeline sync error:", e);
      }
    }

    triggerVictory();
    handleClose();
  };

  if (!config.isOpen || !targetBill) return null;

  const validAccounts = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Savings" || a.type === "Cash"));

  return (
    <div className="absolute inset-0 z-[140] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={handleClose}></div>
      <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[150] flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border border-slate-700" : "bg-white border border-slate-100"}`}>
        
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
              {targetBill.icon || "🧾"}
            </div>
            <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Record Payment
            </h3>
          </div>
          <button onClick={handleClose} className={closeButtonClass}><X size={18} /></button>
        </div>

        <div className="p-6 flex flex-col space-y-5 pb-[120px] lg:pb-6">
          
          <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Clearing Obligation</p>
            <p className={`font-black text-xl leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{targetBill.name}</p>
          </div>

          <div className="relative">
            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest z-10 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Payment Source
            </label>
            <select 
              value={selectedAccountId} 
              onChange={(e) => setSelectedAccountId(e.target.value)} 
              className={`w-full pt-6 pb-2 px-5 rounded-2xl border font-bold text-sm appearance-none outline-none transition-colors relative z-10 bg-transparent ${isDarkMode ? "text-white focus:border-slate-500" : "text-slate-900 focus:border-slate-400"}`}
            >
              <option value="" disabled className={isDarkMode ? "bg-[#1E293B]" : "bg-white"}>Select an account...</option>
              {validAccounts.map(a => (
                <option key={a.id} value={a.id} className={isDarkMode ? "bg-[#1E293B]" : "bg-white"}>
                  {a.name} (${(a.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
            <div className={`absolute inset-0 rounded-2xl border transition-colors ${isDarkMode ? "border-slate-700 bg-[#0F172A]" : "border-slate-200 bg-white"}`}></div>
          </div>

          <div className="relative">
            <label className={`absolute left-4 top-2 z-20 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Amount Deducted</label>
            <div className="relative w-full flex items-center z-10">
              <span className={`absolute left-5 top-[22px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
              <input 
                type="text" 
                inputMode="decimal" 
                pattern="[0-9.-]*" 
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(e.target.value)} 
                onBlur={() => {
                  const val = parseFloat(paymentAmount);
                  if (!isNaN(val)) setPaymentAmount(val.toFixed(2));
                }}
                className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border font-bold text-base outline-none transition-colors bg-transparent relative z-10 ${isDarkMode ? "text-white focus:border-slate-500" : "text-slate-900 focus:border-slate-400"}`} 
              />
              <div className={`absolute inset-0 rounded-2xl border transition-colors ${isDarkMode ? "border-slate-700 bg-[#0F172A]" : "border-slate-200 bg-white"}`}></div>
            </div>
          </div>

          <button 
            onClick={handlePaymentSubmit} 
            disabled={!selectedAccountId || parseFloat(paymentAmount) <= 0 || isNaN(parseFloat(paymentAmount))}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 mt-2 ${(!selectedAccountId || parseFloat(paymentAmount) <= 0 || isNaN(parseFloat(paymentAmount))) ? "opacity-50 cursor-not-allowed bg-slate-400 shadow-none" : "shadow-lg active:scale-95 hover:-translate-y-0.5"}`}
            style={{ backgroundColor: (!selectedAccountId || parseFloat(paymentAmount) <= 0 || isNaN(parseFloat(paymentAmount))) ? undefined : signatureColor, boxShadow: (!selectedAccountId || parseFloat(paymentAmount) <= 0 || isNaN(parseFloat(paymentAmount))) ? undefined : `0 8px 16px ${signatureColor}40` }}
          >
            <CheckCircle2 size={16} /> Confirm Payment
          </button>
          
        </div>
      </div>
    </div>
  );
}
