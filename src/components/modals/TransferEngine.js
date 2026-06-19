import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLedger } from '../../context/LedgerContext';

export default function TransferEngine({
  isTransferOpen,
  setIsTransferOpen,
  isCashOutOpen,
  setIsCashOutOpen,
  cashOutGoal,
  setCashOutGoal,
  triggerHaptic,
  triggerVictory
}) {
  const { user, isDemoMode, accounts, setAccounts, transactions, setTransactions, isDarkMode, signatureColor } = useLedger();

  // Authentic State Buffers
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("0");
  
  const [cashOutAmount, setCashOutAmount] = useState("0");
  const [cashOutToAccount, setCashOutToAccount] = useState("");

  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  // === AUTHENTIC TRANSFER LOGIC ===
  const handleTransferNumpad = (btn) => {
    triggerHaptic(15);
    if (btn === "=") {
      try { 
        const toEval = transferAmount.replace(/×/g, "*").replace(/÷/g, "/"); 
        if (/^[0-9+\-*/. ]+$/.test(toEval)) setTransferAmount(String(Function('"use strict";return (' + toEval + ")")())); 
      }
      catch (e) { setTransferAmount("Error"); setTimeout(() => setTransferAmount("0"), 1000); }
    } else if (transferAmount === "0" && btn !== ".") setTransferAmount(btn);
    else setTransferAmount(transferAmount + btn);
  };

  const executeTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0 || !transferFrom || !transferTo) return;
    const fromAcc = accounts.find(a => a.id === transferFrom);
    const toAcc = accounts.find(a => a.id === transferTo);
    if (!fromAcc || !toAcc) return;

    const currentTime = new Date();
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    const sentName = `${fromAcc.name} → ${toAcc.name} (Sent)`;
    const receivedName = `${fromAcc.name} → ${toAcc.name} (Received)`;

    const oldToBalance = toAcc.balance || 0;
    const newToBalance = oldToBalance + amt;
    const isGoalCompleted = toAcc.isGoal && oldToBalance < (toAcc.targetAmount || 0) && newToBalance >= (toAcc.targetAmount || 0);

    if (isDemoMode) {
      setAccounts(accounts.map(a => {
        if(a.id === fromAcc.id) return { ...a, balance: a.balance - amt };
        if(a.id === toAcc.id) return { ...a, balance: a.balance + amt };
        return a;
      }));
      const txId1 = `tx_demo_${Date.now()}_1`;
      const txId2 = `tx_demo_${Date.now()}_2`;
      setTransactions([
        { id: txId1, name: sentName, icon: "🔀", amount: amt, date: autoTimeStamp, type: "Expense", category: "Transfers (Venmo/Zelle)", accountId: fromAcc.id },
        { id: txId2, name: receivedName, icon: "🔀", amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: toAcc.id },
        ...transactions
      ]);
    } else {
      await updateDoc(doc(db, "users", user.uid, "accounts", fromAcc.id), { balance: fromAcc.balance - amt });
      await updateDoc(doc(db, "users", user.uid, "accounts", toAcc.id), { balance: toAcc.balance + amt });
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: sentName, icon: "🔀", amount: amt, date: autoTimeStamp, type: "Expense", category: "Transfers (Venmo/Zelle)", accountId: fromAcc.id, createdAt: serverTimestamp() });
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: receivedName, icon: "🔀", amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: toAcc.id, createdAt: serverTimestamp() });
    }

    // === CONFETTI WIRE-UP: INFLOW TO GOALS ===
    if (isGoalCompleted || toAcc.isGoal) {
      triggerVictory(); 
    } else {
      triggerHaptic(50);
    }
    
    setIsTransferOpen(false); setTransferAmount("0"); setTransferFrom(""); setTransferTo("");
  };

  // === AUTHENTIC CASH OUT LOGIC ===
  const handleCashOutNumpad = (btn) => {
    triggerHaptic(15);
    if (!cashOutGoal) return;
    if (btn === "CLR") {
      setCashOutAmount("0");
    } else if (cashOutAmount === "0" && btn !== ".") {
      setCashOutAmount(btn);
    } else {
      const nextVal = cashOutAmount + btn;
      if (parseFloat(nextVal) <= cashOutGoal.balance) {
        setCashOutAmount(nextVal);
      }
    }
  };

  const handleCashOutGoalSubmit = async (e) => {
    if (e) e.preventDefault();
    const amt = parseFloat(cashOutAmount);
    if (isNaN(amt) || amt <= 0 || !cashOutGoal || !cashOutToAccount) return;
    if (amt > cashOutGoal.balance) return; 

    const destAcc = accounts.find(a => a.id === cashOutToAccount);
    if (!destAcc) return;

    const currentTime = new Date();
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    
    // UPDATE 1: Clean Copywriting
    const txName = `Cash Out: ${cashOutGoal.name} → ${destAcc.name}`;

    if (isDemoMode) {
      setAccounts(accounts.map(a => {
        if (a.id === cashOutGoal.id) return { ...a, balance: a.balance - amt };
        if (a.id === destAcc.id) return { ...a, balance: a.balance + amt };
        return a;
      }));
      setTransactions([
        // UPDATE 2: Dynamic Icon Inheritance
        { id: `tx_demo_co_${Date.now()}`, name: txName, icon: cashOutGoal.icon, amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: destAcc.id, isCashOut: true },
        ...transactions
      ]);
    } else {
      await updateDoc(doc(db, "users", user.uid, "accounts", cashOutGoal.id), { balance: cashOutGoal.balance - amt });
      await updateDoc(doc(db, "users", user.uid, "accounts", destAcc.id), { balance: destAcc.balance + amt });
      // UPDATE 2: Dynamic Icon Inheritance
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: txName, icon: cashOutGoal.icon, amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: destAcc.id, createdAt: serverTimestamp(), isCashOut: true });
    }

    // === CONFETTI WIRE-UP: CASH OUT FROM GOALS ===
    triggerVictory();
    
    setIsCashOutOpen(false);
    setCashOutGoal(null);
    setCashOutAmount("0");
    setCashOutToAccount("");
  };

  return (
    <>
      {/* AUTHENTIC TRANSFER DRAWER */}
      {isTransferOpen && (
        <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTransferOpen(false)}></div>
          <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col overflow-hidden transition-all ${isDarkMode ? "bg-[#1E293B] border border-slate-800" : "bg-white border border-slate-100"}`}>
            <div className="p-6 border-b flex justify-between items-center shrink-0">
              <h3 className={`font-black uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}><ArrowRightLeft size={16}/> Internal Transfer</h3>
              <button onClick={() => setIsTransferOpen(false)} className={closeButtonClass}><X size={18} /></button>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="grid grid-cols-2 gap-3 mb-4 items-center relative">
                <div className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[82px] transition-colors relative ${isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-slate-50 border-slate-100 shadow-inner"}`}>
                  <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Source</span>
                  <span className="text-xl leading-none mb-1">{accounts.find(a => a.id === transferFrom)?.icon || "🏦"}</span>
                  <span className={`text-xs font-black truncate max-w-full leading-tight uppercase tracking-wider ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{accounts.find(a => a.id === transferFrom)?.name || "Select Account..."}</span>
                  <span className="text-[10px] font-extrabold text-[#10B981] mt-0.5">${(accounts.find(a => a.id === transferFrom)?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20">
                    <option value="">Select Account...</option>
                    {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                  </select>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border flex items-center justify-center z-10 shadow-md transform bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                  <ArrowRightLeft size={14} className="animate-[spin_4s_linear_infinite]" />
                </div>
                <div className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[82px] transition-colors relative ${isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-slate-50 border-slate-100 shadow-inner"}`}>
                  <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Destination</span>
                  <span className="text-xl leading-none mb-1">{accounts.find(a => a.id === transferTo)?.icon || "🏦"}</span>
                  <span className={`text-xs font-black truncate max-w-full leading-tight uppercase tracking-wider ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{accounts.find(a => a.id === transferTo)?.name || "Select Account..."}</span>
                  <span className="text-[10px] font-extrabold text-[#10B981] mt-0.5">${(accounts.find(a => a.id === transferTo)?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20">
                    <option value="">Select Account...</option>
                    {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                  </select>
                </div>
              </div>

              <div className="text-center relative flex justify-center items-center mb-4 min-h-[70px] border border-dashed rounded-2xl dark:border-slate-800 border-slate-200/80 px-4 bg-slate-50/20 dark:bg-slate-900/10">
                <span className="text-5xl font-black tracking-tighter drop-shadow-sm" style={{ color: signatureColor }}>${transferAmount}</span>
                <button onClick={() => { triggerHaptic(15); setTransferAmount(transferAmount.slice(0, -1) || "0"); }} className="absolute right-4 p-3 rounded-full text-2xl active:scale-90 transition-all text-slate-400 hover:text-red-500"> ⌫ </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                  <button key={btn} onClick={() => handleTransferNumpad(btn)} className={`w-full h-12 rounded-xl text-xl font-bold flex items-center justify-center transition-all border active:scale-95 touch-manipulation ${isDarkMode ? "bg-slate-800/40 border-slate-700/50 text-slate-200 hover:bg-slate-700/40" : "bg-slate-100 border-slate-200/60 text-slate-800 hover:bg-slate-200/50"}`}>
                    {btn}
                  </button>
                ))}
              </div>

              <button onClick={executeTransfer} disabled={parseFloat(transferAmount) <= 0 || !transferFrom || !transferTo} className="w-full mt-4 h-14 shrink-0 rounded-2xl font-black uppercase tracking-widest text-xs text-white transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: (parseFloat(transferAmount) <= 0 || !transferFrom || !transferTo) ? undefined : signatureColor }}>Execute Transfer <ArrowRightLeft size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTIC CASH OUT DRAWER */}
      {isCashOutOpen && cashOutGoal && (
        <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsCashOutOpen(false); setCashOutGoal(null); }}></div>
          <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col overflow-hidden transition-all ${isDarkMode ? "bg-[#1E293B] border border-slate-800" : "bg-white border border-slate-100"}`}>
            <div className="p-6 border-b flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cashOutGoal.icon}</span>
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Cash Out: {cashOutGoal.name}</h3>
              </div>
              <button onClick={() => { setIsCashOutOpen(false); setCashOutGoal(null); }} className={closeButtonClass}><X size={18} /></button>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <div className="relative mb-4">
                <label className={`absolute left-4 top-2 text-[9px] font-black uppercase tracking-widest z-10 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>CASH OUT TO WHICH ACCOUNT?</label>
                <select value={cashOutToAccount} onChange={(e) => setCashOutToAccount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border font-bold text-sm appearance-none transition-colors outline-none focus:border-slate-400 dark:focus:border-slate-500 bg-transparent relative z-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  <option value="" disabled>Select Account...</option>
                  {accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Savings" || a.type === "Cash")).map(a => (
                    <option key={a.id} value={a.id} className={isDarkMode ? "bg-[#1E293B]" : "bg-white"}>{a.name} (${(a.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}). </option>
                  ))}
                </select>
              </div>

              <div className="text-center relative flex justify-center items-center mb-4 min-h-[64px] border border-dashed rounded-2xl dark:border-slate-800 border-slate-200/80 px-4 bg-slate-50/20 dark:bg-slate-900/10">
                <span className="text-4xl font-black tracking-tighter text-[#10B981]">${cashOutAmount}</span>
                <div className="absolute right-4 flex items-center gap-2">
                  <button onClick={() => { triggerHaptic(20); setCashOutAmount(String(cashOutGoal.balance.toFixed(2))); }} className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-transparent" style={{ backgroundColor: `${signatureColor}1A`, color: signatureColor }}>MAX</button>
                  <button onClick={() => handleCashOutNumpad("CLR")} className="p-2 rounded-full text-sm text-slate-400 hover:text-red-500">⌫</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((num) => (
                  <button key={num} onClick={() => handleCashOutNumpad(num)} className={`h-11 rounded-xl text-lg font-bold flex items-center justify-center transition-all border active:scale-95 ${isDarkMode ? "bg-slate-800/40 border-slate-700/50 text-slate-200 hover:bg-slate-700" : "bg-slate-100 border-slate-200/60 text-slate-800 hover:bg-slate-200"}`}>{num}</button>
                ))}
              </div>

              <button onClick={handleCashOutGoalSubmit} disabled={parseFloat(cashOutAmount) <= 0 || parseFloat(cashOutAmount) > cashOutGoal.balance || !cashOutToAccount} className={`w-full mt-4 h-14 shrink-0 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${parseFloat(cashOutAmount) <= 0 || parseFloat(cashOutAmount) > cashOutGoal.balance || !cashOutToAccount ? "bg-slate-300 opacity-40 shadow-none cursor-not-allowed" : "bg-[#10B981] shadow-[0_8px_20px_rgba(16,185,129,0.35)]"}`}>Disburse Funds <CheckCircle2 size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
