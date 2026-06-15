import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Target, Calendar as CalendarIcon, ArrowDown, Trash2, Save } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLedger } from '../../context/LedgerContext';

export default function AccountBuilder({
  isAddAccountOpen,
  setIsAddAccountOpen,
  isAddGoalOpen,
  setIsAddGoalOpen,
  selectedAccount,
  setSelectedAccount,
  openGlobalAction,
  triggerHaptic,
  triggerVictory
}) {
  const { user, isDemoMode, accounts, setAccounts, transactions, bills, isDarkMode, signatureColor } = useLedger();

  // --- ADD ACCOUNT STATE ---
  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");
  const [newAccType, setNewAccType] = useState("Checking");
  const [newAccDesc, setNewAccDesc] = useState("");
  const [newAccIsNegative, setNewAccIsNegative] = useState(false);

  // --- ADD GOAL STATE ---
  const [newGoalIcon, setNewGoalIcon] = useState("🎯");
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");

  // --- EDIT ACCOUNT STATE ---
  const [editAccountBalance, setEditAccountBalance] = useState("0");
  const [editAccountDesc, setEditAccountDesc] = useState("");
  const [editAccIsNegative, setEditAccIsNegative] = useState(false);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountIcon, setEditAccountIcon] = useState("🏦");
  const [editAccountTargetDate, setEditAccountTargetDate] = useState("");

  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [activeIconField, setActiveIconField] = useState(null);

  const categoryEmojis = ["💵", "💲", "🤑", "💰", "🏦", "💹", "₿", "💎", "💳", "🧾", "📋", "💼", "🏠", "🏢", "🔑", "🛋️", "🧹", "💧", "⚡", "📶", "📡", "☁️", "📺", "🎬", "🍿", "🎵", "🎧", "🚗", "🚲", "🚂", "✈️", "⛽", "🛠️", "🅿️", "🎫", "🚕", "🚇", "🛒", "🛍️", "📦", "👕", "👗", "👟", "💅", "💄", "💈", "🕶️", "💍", "🍔", "🍕", "🌮", "🍣", "🥗", "🍳", "☕", "🍦", "🍻", "🍹", "🍷", "🏥", "💊", "🦷", "👓", "🧘", "🏋️", "🐾", "🐶", "🎁", "🎉", "🎟️", "🎮", "🕹️", "📱", "💻", "⌚", "🤖", "🚀", "🌴", "🎓", "🏪", "🎯", "🏖️", "👶", "🛡️", "🏍️", "🎸", "⛵"];
  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  const formatDisplayDate = (dString) => {
    if (!dString) return "";
    const parts = dString.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return dString;
  };

  useEffect(() => {
    if (selectedAccount) {
      setEditAccountBalance(Math.abs(selectedAccount.balance || 0).toFixed(2));
      setEditAccountDesc(selectedAccount.description || "");
      setEditAccIsNegative((selectedAccount.balance || 0) < 0);
      setEditAccountName(selectedAccount.name || "");
      setEditAccountIcon(selectedAccount.icon || (selectedAccount.isGoal ? "🎯" : "🏦"));
      setEditAccountTargetDate(selectedAccount.targetDate || "");
    }
  }, [selectedAccount]);

  const handleAddAccount = async () => {
    const startBal = parseFloat(newAccBalance);
    if (!newAccName.trim() || isNaN(startBal)) return;

    const sanitizedName = newAccName.trim().toUpperCase();
    let finalBalance = Math.abs(startBal);
    if (newAccIsNegative) finalBalance = -finalBalance;

    const getIcon = (type) => { 
      if (type === "Credit Card") return "💳";
      if (type === "401k / Retirement") return "🌴"; 
      if (type === "Savings") return "📈";
      if (type === "Cash") return "💵"; 
      return "🏦"; 
    };

    if (isDemoMode) {
      const newAcc = { id: `acc_demo_${Date.now()}`, name: sanitizedName, type: newAccType, description: newAccDesc, balance: finalBalance, icon: getIcon(newAccType) };
      setAccounts([...accounts, newAcc]);
    } else {
      const accRef = await addDoc(collection(db, "users", user.uid, "accounts"), { name: sanitizedName, type: newAccType, description: newAccDesc, balance: finalBalance, icon: getIcon(newAccType), isArchived: false });
      if (Math.abs(startBal) > 0) {
        const currentTime = new Date();
        const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        await addDoc(collection(db, "users", user.uid, "transactions"), { name: `${sanitizedName} (Opening)`, icon: getIcon(newAccType), amount: Math.abs(startBal), date: autoTimeStamp, type: finalBalance < 0 ? "Expense" : "Income", category: finalBalance < 0 ? "Initial Debt" : "Opening Balance", accountId: accRef.id, createdAt: serverTimestamp() });
      }
    }
    triggerVictory(); setIsAddAccountOpen(false); setNewAccName(""); setNewAccBalance(""); setNewAccDesc(""); setNewAccType("Checking"); setNewAccIsNegative(false);
  };

  const handleAddGoal = async () => {
    const targetBal = parseFloat(newGoalAmount);
    if (!newGoalName.trim() || isNaN(targetBal) || targetBal <= 0 || !newGoalDate || !newGoalIcon) return;

    const sanitizedGoalName = newGoalName.trim().toUpperCase();
    const newGoal = {
      name: sanitizedGoalName,
      type: "Goal",
      description: "Savings Goal",
      balance: 0,
      targetAmount: targetBal,
      targetDate: newGoalDate,
      icon: newGoalIcon,
      isGoal: true,
      isArchived: false
    };
    if (isDemoMode) {
      setAccounts([...accounts, { id: `goal_demo_${Date.now()}`, ...newGoal }]);
    } else {
      await addDoc(collection(db, "users", user.uid, "accounts"), newGoal);
    }
    triggerVictory();
    setIsAddGoalOpen(false);
    setNewGoalName("");
    setNewGoalAmount("");
    setNewGoalDate("");
    setNewGoalIcon("🎯");
  };

  const updateAccountBalance = async () => {
    const newBal = parseFloat(editAccountBalance);
    if (isNaN(newBal) || !selectedAccount) return;

    let finalBalance = Math.abs(newBal);
    if (editAccIsNegative) finalBalance = -finalBalance;

    const diff = finalBalance - (selectedAccount.balance || 0);

    const updatePayload = {
      balance: finalBalance,
      description: editAccountDesc,
      name: editAccountName,
      icon: editAccountIcon
    };
    if (selectedAccount.isGoal) {
      updatePayload.targetDate = editAccountTargetDate;
    }

    if (isDemoMode) {
      setAccounts(accounts.map(a => a.id === selectedAccount.id ? { ...a, ...updatePayload } : a));
    } else {
      if (Math.abs(diff) > 0.01) {
        const currentTime = new Date();
        const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        await addDoc(collection(db, "users", user.uid, "transactions"), { name: "Balance Adjustment", icon: "⚖️", amount: Math.abs(diff), date: autoTimeStamp, type: diff > 0 ? "Income" : "Expense", category: "Refunds & Adjustments", accountId: selectedAccount.id, createdAt: serverTimestamp() });
      }
      await updateDoc(doc(db, "users", user.uid, "accounts", selectedAccount.id), updatePayload);
    }
    triggerVictory(); setSelectedAccount(null);
  };

  const deleteAccount = async () => {
    if (!selectedAccount) return;

    openGlobalAction("Delete Account", `Are you sure you want to permanently delete ${selectedAccount.name}? This will unlink related transactions.`, "Delete", true, async () => {
      const accId = selectedAccount.id;
      if (isDemoMode) { setAccounts(accounts.filter(a => a.id !== accId)); }
      else {
        await deleteDoc(doc(db, "users", user.uid, "accounts", accId));
        const txsToDelete = transactions.filter(tx => tx.accountId === accId);
        const batchPromises = txsToDelete.map(tx => deleteDoc(doc(db, "users", user.uid, "transactions", tx.id)));
        const billsToReset = bills.filter(b => b.paidFromAccountId === accId);
        billsToReset.forEach(b => { batchPromises.push(updateDoc(doc(db, "users", user.uid, "bills", b.id), { isPaid: false, paidAmount: b.isInstallment ? (b.paidAmount || 0) - (b.amount || 0) : 0, paidFromAccountId: null, linkedTxId: null })); });
        await Promise.all(batchPromises);
      }
      triggerHaptic(50); setSelectedAccount(null);
    });
  };

  const isAddAccountDisabled = !newAccName.trim() || isNaN(parseFloat(newAccBalance));
  const isAddGoalDisabled = !newGoalName.trim() || isNaN(parseFloat(newGoalAmount)) || parseFloat(newGoalAmount) <= 0 || !newGoalDate || !newGoalIcon;

  return (
    <>
      {isAddAccountOpen && (
        <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddAccountOpen(false)}></div>
          <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Add Account</h3>
              <button onClick={() => setIsAddAccountOpen(false)} className={closeButtonClass}><X size={18} /></button>
            </div>
            <div className={`p-6 space-y-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : ""}`}>
              <div className="relative"><label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Account Name</label><input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors uppercase ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} /></div>
              <div className="relative">
                <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Current Balance</label>
                <div className="relative w-full flex items-center">
                  <span className={`absolute left-5 top-[22px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                  <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} onBlur={() => { if(!isNaN(parseFloat(newAccBalance)) && newAccBalance !== "") setNewAccBalance(parseFloat(newAccBalance).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                </div>
                <div className="flex items-center justify-between mt-3 ml-2 pr-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Negative Balance (Debt)</span>
                  <button onClick={() => { triggerHaptic(20); setNewAccIsNegative(!newAccIsNegative); }} className={`w-10 h-5 rounded-full transition-colors relative ${newAccIsNegative ? "bg-red-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${newAccIsNegative ? "translate-x-5" : "translate-x-1"}`}></div>
                  </button>
                </div>
              </div>
              <div className="relative mt-2"><label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Account Type</label><select value={newAccType} onChange={(e) => setNewAccType(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border appearance-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}><option>Checking</option><option>Savings</option><option>Credit Card</option><option>Cash</option><option>401k / Retirement</option></select></div>
              <div className="relative"><label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Account Details</label><input type="text" placeholder={newAccType} value={newAccDesc} onChange={(e) => setNewAccDesc(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-600" : "bg-white border-slate-200 text-slate-900 placeholder-slate-300"}`} /></div>
              
              <button 
                onClick={handleAddAccount} 
                disabled={isAddAccountDisabled} 
                className={`w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${isAddAccountDisabled ? "bg-slate-300 dark:bg-slate-700 opacity-50 cursor-not-allowed" : "shadow-lg active:scale-95"}`} 
                style={{ backgroundColor: isAddAccountDisabled ? undefined : signatureColor }}
              >
                Save Account <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddGoalOpen && (
        <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddGoalOpen(false)}></div>
          <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Create a Savings Goal</h3>
              <button onClick={() => setIsAddGoalOpen(false)} className={closeButtonClass}><X size={18} /></button>
            </div>
            <div className={`p-6 space-y-4 relative ${isDemoMode ? "pb-[140px] lg:pb-6" : ""}`}>
              <div className="relative">
                <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Goal Name</label>
                <input type="text" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors outline-none uppercase ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
              </div>
              
              <div className="relative cursor-pointer" onClick={() => { setIsIconSelectorOpen(true); setActiveIconField("goal"); }}>
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Goal Icon</label>
                  <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                     <span className="text-xl leading-none">{newGoalIcon}</span>
                     <ArrowDown size={14} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                  </div>
              </div>
              
              <div className="relative">
                <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Goal Amount</label>
                <div className="relative w-full flex items-center">
                  <span className={`absolute left-5 top-[22px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                  <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={newGoalAmount} onChange={(e) => setNewGoalAmount(e.target.value)} onBlur={() => { if(!isNaN(parseFloat(newGoalAmount)) && newGoalAmount !== "") setNewGoalAmount(parseFloat(newGoalAmount).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border transition-colors outline-none ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                </div>
              </div>
              <div className="relative">
                <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Goal Date</label>
                <div className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                  <span className={`font-bold text-base ${!newGoalDate ? "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{newGoalDate ? formatDisplayDate(newGoalDate) : "mm/dd/yyyy"}</span>
                  <CalendarIcon size={18} className="shrink-0" style={{ color: signatureColor }} />
                  <input type="date" value={newGoalDate} onChange={(e) => setNewGoalDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>

              <button 
                onClick={handleAddGoal} 
                disabled={isAddGoalDisabled} 
                className={`w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${isAddGoalDisabled ? "bg-slate-300 dark:bg-slate-700 opacity-50 cursor-not-allowed" : "shadow-lg active:scale-95"}`} 
                style={{ backgroundColor: isAddGoalDisabled ? undefined : signatureColor }}
              >
                Lock In Goal <Target size={16} />
              </button>

              {isIconSelectorOpen && activeIconField === "goal" && (
                <div className={`absolute inset-0 z-[150] flex flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
                  <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}><h3 className={`font-black uppercase text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Icon</h3><button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button></div>
                  <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                    <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">
                      {categoryEmojis.map(emoji => (
                        <button key={emoji} onClick={() => { setNewGoalIcon(emoji); setIsIconSelectorOpen(false); }} className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 ${newGoalIcon === emoji ? 'text-white border-transparent shadow-md' : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`} style={{ backgroundColor: newGoalIcon === emoji ? signatureColor : undefined }}>{emoji}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAccount && !isAddAccountOpen && !isAddGoalOpen && (
        <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedAccount(null)}></div>
          <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-slate-100 dark:bg-slate-800">{editAccountIcon}</div>
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedAccount.isGoal ? "Edit Goal" : "Edit Account"}</h3>
              </div>
              <button onClick={() => setSelectedAccount(null)} className={closeButtonClass}><X size={18} /></button>
            </div>
            <div className={`p-6 space-y-4 overflow-y-auto hide-scrollbar ${isDemoMode ? "pb-[140px] lg:pb-6" : ""}`}>
              {selectedAccount.isGoal && (
                <>
                  <div className="relative">
                     <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Name</label>
                     <input type="text" value={editAccountName} onChange={(e) => setEditAccountName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                  </div>
                  <div className="relative cursor-pointer" onClick={() => { setIsIconSelectorOpen(true); setActiveIconField("edit"); }}>
                     <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Icon</label>
                     <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                        <span className="text-xl leading-none">{editAccountIcon}</span>
                        <ArrowDown size={14} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                     </div>
                  </div>
                  <div className="relative">
                     <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Target Goal Amount</label>
                     <div className="relative w-full flex items-center">
                        <span className={`absolute left-5 top-[22px] font-bold text-base ${isDarkMode ? "text-white opacity-50" : "text-slate-900 opacity-50"}`}>$</span>
                        <input type="text" value={(selectedAccount.targetAmount || 0).toFixed(2)} disabled className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border transition-colors opacity-60 cursor-not-allowed ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                     </div>
                  </div>
                  <div className="relative">
                     <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Target Goal Date</label>
                     <div className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                        <span className={`font-bold text-base ${!editAccountTargetDate ? "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{editAccountTargetDate ? formatDisplayDate(editAccountTargetDate) : "mm/dd/yyyy"}</span>
                        <CalendarIcon size={18} className="shrink-0" style={{ color: signatureColor }} />
                        <input type="date" value={editAccountTargetDate || ""} onChange={(e) => setEditAccountTargetDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                     </div>
                  </div>
                </>
              )}
              
              <div className="relative">
                <label className="absolute left-4 top-2 text-[9px] font-black uppercase tracking-widest z-10" style={{ color: signatureColor }}>{selectedAccount.isGoal ? "CURRENT BALANCE" : "QUICK BALANCE UPDATE"}</label>
                <div className="relative w-full flex items-center">
                  <span className={`absolute left-5 top-[22px] font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                  <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={editAccountBalance} onChange={(e) => setEditAccountBalance(e.target.value)} onFocus={() => setEditAccountBalance(Math.abs(selectedAccount.balance || 0).toFixed(2))} onBlur={() => { if(!isNaN(parseFloat(editAccountBalance)) && editAccountBalance !== "") setEditAccountBalance(parseFloat(editAccountBalance).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                </div>
                {!selectedAccount.isGoal && (
                  <div className="flex items-center justify-between mt-3 ml-2 pr-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Negative Balance (Debt)</span>
                    <button onClick={() => { triggerHaptic(20); setEditAccIsNegative(!editAccIsNegative); }} className={`w-10 h-5 rounded-full transition-colors relative ${editAccIsNegative ? "bg-red-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${editAccIsNegative ? "translate-x-5" : "translate-x-1"}`}></div>
                    </button>
                  </div>
                )}
              </div>
              <div className="relative mt-2">
                <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 z-10 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{selectedAccount.isGoal ? "Goal Details" : "Account Details"}</label>
                <input type="text" placeholder={selectedAccount.type} value={editAccountDesc} onChange={(e) => setEditAccountDesc(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-600" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"}`} />
              </div>
              <button onClick={updateAccountBalance} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: signatureColor }}><Save size={16} /> Save Changes</button>
              <button onClick={deleteAccount} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-500 shadow-[0_8px_16px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16}/> {selectedAccount.isGoal ? "Delete Goal" : "Delete Account"}</button>
            </div>
            {isIconSelectorOpen && selectedAccount.isGoal && activeIconField === "edit" && (
              <div className={`absolute inset-0 z-[150] flex flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
                 <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}><h3 className={`font-black uppercase text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Icon</h3><button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button></div>
                 <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                    <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">{categoryEmojis.map(emoji => (<button key={emoji} onClick={() => { setEditAccountIcon(emoji); setIsIconSelectorOpen(false); }} className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 ${editAccountIcon === emoji ? 'text-white border-transparent shadow-md' : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`} style={{ backgroundColor: editAccountIcon === emoji ? signatureColor : undefined }}>{emoji}</button>))}</div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
