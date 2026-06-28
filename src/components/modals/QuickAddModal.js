import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowDown, Search, AlertCircle, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLedger } from '../../context/LedgerContext';

export default function QuickAddModal({ onClose, triggerHaptic, triggerVictory }) {
  const {
    user, isDemoMode, isDarkMode, signatureColor,
    accounts, setAccounts, bills, setBills, transactions, setTransactions,
    modernCategories, setModernCategories, paydayConfig,
    recentBillCategories, setRecentBillCategories,
    recentIncomeCategories, setRecentIncomeCategories,
    recentExpenseCategories, setRecentExpenseCategories
  } = useLedger();

  // === LOCAL QAB STATE ENGINE ===
  const [qabStep, setQabStep] = useState(1);
  const [drawerTab, setDrawerTab] = useState("bills");
  const [inputValue, setInputValue] = useState("0");
  const [entryName, setEntryName] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryIcon, setEntryIcon] = useState("🧾");
  const [entryCategory, setEntryCategory] = useState("");
  const [entryAccount, setEntryAccount] = useState("");
  const [entryIsRecurring, setEntryIsRecurring] = useState(false);
  const [entryIsInstallment, setEntryIsInstallment] = useState(false);
  const [entryTotalAmount, setEntryTotalAmount] = useState("");
  const [entryPaidAmount, setEntryPaidAmount] = useState("");
  
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  
  const [entryVisibility, setEntryVisibility] = useState("Shared");
  const [coOpStep, setCoOpStep] = useState(1);

  const dateInputRef = useRef(null);

  const categoryEmojis = ["💵", "💲", "🤑", "💰", "🏦", "💹", "₿", "💎", "💳", "🧾", "📋", "💼", "🏠", "🏢", "🔑", "🛋️", "🧹", "💧", "⚡", "📶", "📡", "☁️", "📺", "🎬", "🍿", "🎵", "🎧", "🚗", "🚲", "🚂", "✈️", "⛽", "🛠️", "🅿️", "🎫", "🚕", "🚇", "🛒", "🛍️", "📦", "👕", "👗", "👟", "💅", "💄", "💈", "🕶️", "💍", "🍔", "🍕", "🌮", "🍣", "🥗", "🍳", "☕", "🍦", "🍻", "🍹", "🍷", "🏥", "💊", "🦷", "👓", "🧘", "🏋️", "🐾", "🐶", "🎁", "🎉", "🎟️", "🎮", "🕹️", "📱", "💻", "⌚", "🤖", "🚀", "🌴", "🎓", "🏪", "🎯", "🏖️", "👶", "🛡️", "🏍️", "🎸", "⛵"];
  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  useEffect(() => {
    if (drawerTab === "bills") setEntryVisibility("Shared");
    else if (drawerTab === "transactions") setEntryVisibility("Private");
    else if (drawerTab === "income") setEntryVisibility("Shared");
  }, [drawerTab]);

  const formatDisplayDate = (dString) => {
    if (!dString) return "";
    const parts = dString.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return dString;
  };

  const calculatePaydayGroup = (dateString) => {
    if (!dateString) return "Unscheduled";
    const billDate = new Date(dateString);
    if (isNaN(billDate.getTime())) return "Unscheduled";

    const todayLocal = new Date(); todayLocal.setHours(0, 0, 0, 0);
    const localBillDate = new Date(billDate.getUTCFullYear(), billDate.getUTCMonth(), billDate.getUTCDate());
    if (localBillDate < todayLocal || localBillDate.getTime() === todayLocal.getTime()) return "Due Now";
    const activePaydays = [];
    for (let i = 1; i <= 5; i++) {
      const pdId = `Payday ${i}`;
      if (paydayConfig && paydayConfig[pdId] && paydayConfig[pdId].date) {
        const d = new Date(paydayConfig[pdId].date);
        if (!isNaN(d.getTime())) activePaydays.push({ id: pdId, date: d });
      }
    }
    if (activePaydays.length === 0) return "Unscheduled";
    activePaydays.sort((a, b) => a.date - b.date);
    const lastPayday = activePaydays[activePaydays.length - 1].date;
    const horizonDate = new Date(lastPayday);
    horizonDate.setDate(horizonDate.getDate() + 7);
    if (localBillDate > horizonDate) return "Unscheduled";
    if (billDate < activePaydays[0].date) return activePaydays[0].id;
    let assignedPd = activePaydays[0].id;
    for (let i = 0; i < activePaydays.length; i++) {
      if (billDate >= activePaydays[i].date) assignedPd = activePaydays[i].id;
      else break;
    }
    return assignedPd;
  };

  const handleNumpad = (btn) => {
    triggerHaptic(15);
    if (btn === " ") return; 
    setInputValue(prev => {
      let current = String(prev).replace(/\s+/g, ""); 
      if (btn === "=") {
        try {
          const toEval = current.replace(/×/g, "*").replace(/÷/g, "/");
          if (/^[0-9+\-*/. ]+$/.test(toEval)) {
            return String(Function('"use strict";return (' + toEval + ")")()).replace(/\s+/g, "");
          }
        } catch (e) { return "0"; }
      }
      if (current === "0" && btn !== ".") return btn;
      return (current + btn).replace(/\s+/g, "");
    });
  };

  const handleAddCustomCategory = (groupName, newCatName) => {
    if (!newCatName.trim()) return;
    triggerHaptic(30);
    setModernCategories(prev => prev.map(g => g.group === groupName ? { ...g, items: [...g.items, newCatName.trim()] } : g));
  };

  const closeQab = () => {
    setQabStep(1); setInputValue("0"); setEntryName(""); setEntryDate(""); setEntryIcon("🧾");
    setEntryCategory(""); setEntryAccount(""); setEntryIsRecurring(false); setEntryIsInstallment(false);
    setEntryTotalAmount(""); setEntryPaidAmount(""); setIsCategorySelectorOpen(false); setIsIconSelectorOpen(false);
    setCategorySearchQuery(""); setCustomCategoryInput("");
    onClose();
  };

  const handleConfirmAction = () => {
    const sanitizedInput = String(inputValue).replace(/\s+/g, "");
    const amountToProcess = parseFloat(sanitizedInput);
    if (isNaN(amountToProcess) || (drawerTab === "bills" ? amountToProcess < 0 : amountToProcess <= 0)) return;
    
    const currentTime = new Date();
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    
    if (entryCategory) {
      if (drawerTab === "bills") {
        const updated = [entryCategory, ...recentBillCategories.filter(c => c !== entryCategory)].slice(0, 10);
        setRecentBillCategories(updated);
        if (typeof window !== 'undefined') localStorage.setItem('lp_recent_bill_cat', JSON.stringify(updated));
      } else if (drawerTab === "income") {
        const updated = [entryCategory, ...recentIncomeCategories.filter(c => c !== entryCategory)].slice(0, 10);
        setRecentIncomeCategories(updated);
        if (typeof window !== 'undefined') localStorage.setItem('lp_recent_inc_cat', JSON.stringify(updated));
      } else if (drawerTab === "transactions") {
        const updated = [entryCategory, ...recentExpenseCategories.filter(c => c !== entryCategory)].slice(0, 10);
        setRecentExpenseCategories(updated);
        if (typeof window !== 'undefined') localStorage.setItem('lp_recent_exp_cat', JSON.stringify(updated));
      }
    }

    if (drawerTab === "bills") {
      let displayDate = "TBD", sortableDay = 31;
      if (entryDate) {
          const dateObj = new Date(entryDate);
          if (!isNaN(dateObj.getTime())) {
              sortableDay = dateObj.getUTCDate();
              displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
          }
      }
      const newBillNode = {
        id: `b_master_${Date.now()}`,
        name: entryName.trim() || "New Bill",
        icon: entryIcon || "🧾",
        category: entryCategory || "Other",
        amount: amountToProcess,
        date: sortableDay,
        fullDate: displayDate,
        rawDate: entryDate,
        payday: calculatePaydayGroup(entryDate),
        isPaid: false,
        isOverdue: false,
        isRecurring: entryIsRecurring,
        isInstallment: entryIsInstallment,
        totalAmount: entryIsInstallment ? parseFloat(entryTotalAmount) || 0 : 0,
        paidAmount: entryIsInstallment ? parseFloat(entryPaidAmount) || 0 : 0,
        linkedTxId: null,
        vaultVisibility: entryVisibility,
      };

      if (isDemoMode) {
        setBills([...bills, newBillNode]);
      } else {
        addDoc(collection(db, "users", user.uid, "bills"), newBillNode).catch(e => console.log("Offline pipeline sync queued"));
      }
      triggerHaptic(50); 
      closeQab();
    } else if (drawerTab === "income" || drawerTab === "transactions") {
      const targetAcc = accounts.find(a => a.id === entryAccount) || accounts[0];
      if (targetAcc) {
        const isIncome = drawerTab === "income";
        const oldAccBalance = targetAcc.balance || 0;
        const netDelta = isIncome ? amountToProcess : -amountToProcess;
        const newAccBalance = oldAccBalance + netDelta;
        
        const isGoalCompleted = isIncome && targetAcc.isGoal && oldAccBalance < (targetAcc.targetAmount || 0) && newAccBalance >= (targetAcc.targetAmount || 0);

        const newTxNode = {
          id: `tx_master_${Date.now()}`,
          name: entryName.trim() || (isIncome ? "Income" : "Expense"),
          icon: isIncome ? "💵" : entryIcon,
          category: entryCategory || "Other",
          amount: amountToProcess,
          date: autoTimeStamp,
          type: isIncome ? "Income" : "Expense",
          accountId: targetAcc.id,
          vaultVisibility: entryVisibility,
          isDirectGoalEntry: targetAcc.isGoal || targetAcc.type === "Goal" || false
        };

        if (isDemoMode) {
          setTransactions([newTxNode, ...transactions]);
          setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: newAccBalance } : a));
        } else {
          addDoc(collection(db, "users", user.uid, "transactions"), { ...newTxNode, createdAt: serverTimestamp() }).catch(e => console.log("Offline pipeline sync queued"));
          updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: newAccBalance }).catch(e => console.log("Offline pipeline sync queued"));
        }

        if (isIncome || isGoalCompleted) {
          triggerVictory(); 
        } else { 
          triggerHaptic(50); 
        }
      }
      closeQab();
    }
  };

  const qabActiveText = drawerTab === "bills" ? "text-[#1877F2]" : drawerTab === "income" ? "text-[#10B981]" : "text-[#F97316]";
  const qabActiveBg = drawerTab === "bills" ? "bg-[#1877F2]" : drawerTab === "income" ? "bg-[#10B981]" : "bg-[#F97316]";
  const qabActiveShadow = drawerTab === "bills" ? "shadow-[0_8px_16px_rgba(24,119,242,0.3)]" : drawerTab === "income" ? "shadow-[0_8px_16px_rgba(16,185,129,0.3)]" : "shadow-[0_8px_16px_rgba(249,115,22,0.3)]";
  const qabActiveLabel = drawerTab === "bills" ? "New Bill" : drawerTab === "income" ? "New Income" : "New Expense";
  const qabParsedInput = parseFloat(String(inputValue).replace(/\s+/g, ""));
  const isQabAmountValid = !isNaN(qabParsedInput) && (drawerTab === "bills" ? qabParsedInput >= 0 : qabParsedInput > 0);
  
  const isQabFormValid = () => {
    const hasName = entryName.trim() !== "";
    const hasCategory = entryCategory.trim() !== "";
    if (drawerTab === "bills") {
      return hasName && hasCategory && entryDate !== "";
    } else {
      return hasName && hasCategory && entryAccount !== "";
    }
  };

  const canSubmitQab = isQabFormValid() && isQabAmountValid;
  const categoriesToRender = drawerTab === 'income' ? modernCategories.filter(g => g.group === "Income & Wealth") : modernCategories;
  const currentRecentCategories = drawerTab === "bills" ? recentBillCategories : drawerTab === "income" ? recentIncomeCategories : recentExpenseCategories;

  return (
    <div className="fixed inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeQab}></div>
      <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col h-auto max-h-[95vh] ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
        <div className={`p-6 border-b flex justify-between items-center shrink-0 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
          <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{qabActiveLabel}</h3>
          <button onClick={closeQab} className={closeButtonClass}><X size={18} /></button>
        </div>
        
        <div className={`overflow-y-auto hide-scrollbar flex flex-col pb-6 ${isDemoMode ? "mb-[140px] lg:mb-0" : ""}`}>
          {qabStep === 1 ? (
            <div className="p-4 flex flex-col space-y-2 h-auto">
              <div className={`flex p-1 rounded-xl ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                <button onClick={() => { triggerHaptic(20); setDrawerTab("bills"); setInputValue("0"); }} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "bills" ? "text-white shadow-sm" : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`} style={{ backgroundColor: drawerTab === "bills" ? signatureColor : undefined }}>Bill</button>
                <button onClick={() => { triggerHaptic(20); setDrawerTab("transactions"); setInputValue("0"); }} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "transactions" ? "bg-[#F97316] text-white shadow-sm" : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`}>Expense</button>
                <button onClick={() => { triggerHaptic(20); setDrawerTab("income"); setInputValue("0"); }} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "income" ? "bg-[#10B981] text-white shadow-sm" : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`}>Income</button>
              </div>
              
              <div className="text-center relative flex justify-center items-center py-2">
                <span className={`text-5xl font-black tracking-tighter ${drawerTab === "bills" ? "" : qabActiveText}`} style={{ color: drawerTab === "bills" ? signatureColor : undefined }}>${inputValue}</span>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); triggerHaptic(15); setInputValue(inputValue.slice(0, -1) || "0"); }} 
                  className="absolute right-4 p-2 text-xl active:scale-90 transition-transform opacity-70 hover:opacity-100" 
                  style={{ color: drawerTab === "bills" ? signatureColor : undefined }}
                >
                  ⌫
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 py-1">
                {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                  <button 
                    key={btn} 
                    onPointerDown={(e) => { e.preventDefault(); handleNumpad(btn); }} 
                    className={`w-full h-11 rounded-xl text-xl font-black flex items-center justify-center transition-all border mt-0 active:scale-95 touch-manipulation ${isDarkMode ? "bg-slate-800 border-slate-700 text-white active:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-900 active:bg-slate-200"}`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
              
              <button onClick={() => { triggerHaptic(20); setInputValue(parseFloat(String(inputValue).replace(/\s+/g, "")).toFixed(2)); setQabStep(2); }} disabled={!isQabAmountValid} className={`w-full h-14 shrink-0 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${!isQabAmountValid ? "bg-slate-300 opacity-50 cursor-not-allowed shadow-none" : `active:scale-95 ${drawerTab === "bills" ? "" : qabActiveBg} ${qabActiveShadow} hover:-translate-y-0.5`}`} style={{ backgroundColor: (isQabAmountValid && drawerTab === "bills") ? signatureColor : undefined }}>Next Step <ArrowRight size={18} /></button>
            </div>
          ) : (
            <div className="p-5 space-y-3 h-auto">
              <div className="relative">
                <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {drawerTab === "income" ? "Payer / Source" : "Name"}
                </label>
                <input 
                  type="text" 
                  value={entryName} 
                  onChange={(e) => setEntryName(e.target.value)} 
                  placeholder={drawerTab === "income" ? "ENTER PAYER..." : "ENTER NAME..."}
                  className={`w-full pt-6 pb-2 px-5 rounded-2xl border font-bold text-xs uppercase tracking-wider focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white focus:border-slate-500" : "bg-white border-slate-200 text-slate-900 focus:border-slate-400"}`} 
                />
              </div>
              <div className="relative">
                <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Amount</label>
                <div className="relative w-full flex items-center">
                  <span className={`absolute left-5 top-[18px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                  <input type="text" inputMode="decimal" pattern="[0-9.-]*" autoCorrect="off" autoCapitalize="none" value={inputValue} onChange={(e) => setInputValue(e.target.value.replace(/\s+/g, ""))} onBlur={() => { if(!isNaN(parseFloat(String(inputValue).replace(/\s+/g, ""))) && inputValue !== "") setInputValue(parseFloat(String(inputValue).replace(/\s+/g, "")).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border font-bold text-base focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                </div>
              </div>
              <div className="relative cursor-pointer" onClick={() => setIsIconSelectorOpen(true)}>
                <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Icon</label>
                <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                  <span className="text-xl leading-none">{entryIcon || "🧾"}</span>
                  <ArrowDown size={14} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                </div>
              </div>
              {currentRecentCategories.length > 0 && (
                <div className="mb-1 mt-1">
                  <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 px-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Recent Categories</label>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {currentRecentCategories.map(cat => {
                      const isSelected = entryCategory === cat;
                      const tabColorHex = drawerTab === "bills" ? signatureColor : drawerTab === "income" ? "#10B981" : "#F97316";
                      const tabShadowClass = drawerTab === "bills" ? "shadow-[0_0_12px_rgba(24,119,242,0.45)]" : drawerTab === "income" ? "shadow-[0_0_12px_rgba(16,185,129,0.45)]" : "shadow-[0_0_12px_rgba(249,115,22,0.45)]";

                      return (
                        <button 
                          key={cat} 
                          onClick={() => setEntryCategory(cat)} 
                          className={`px-4 py-2 shrink-0 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${isSelected ? `text-white border-transparent ${tabShadowClass}` : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`} 
                          style={{ backgroundColor: isSelected ? tabColorHex : undefined }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="relative cursor-pointer" onClick={() => setIsCategorySelectorOpen(true)}>
                <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Category Selector</label>
                <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-left truncate">{entryCategory || "TAP TO CHOOSE CATEGORY..."}</span>
                  <ArrowDown size={14} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                </div>
              </div>
              {drawerTab === "bills" && (
                <>
                  <div className="relative">
                    <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest pointer-events-none ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Due Date</label>
                    <div 
                      className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}
                      onClick={() => {
                        if (dateInputRef.current && dateInputRef.current.showPicker) {
                          try { dateInputRef.current.showPicker(); } catch (err) {}
                        }
                      }}
                    >
                      <span className={`font-bold text-base pointer-events-none ${!entryDate ? "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{entryDate ? formatDisplayDate(entryDate) : "mm/dd/yyyy"}</span>
                      <CalendarIcon size={18} className="shrink-0 pointer-events-none" style={{ color: signatureColor }} />
                      <input type="date" ref={dateInputRef} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Recurring Bill</span>
                      <button onClick={() => { triggerHaptic(20); setEntryIsRecurring(!entryIsRecurring); }} className="w-12 h-6 rounded-full transition-colors relative bg-slate-300 dark:bg-slate-700" style={{ backgroundColor: entryIsRecurring ? signatureColor : undefined }}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${entryIsRecurring ? "translate-x-7" : "translate-x-1"}`}></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Installment Plan</span>
                      <button onClick={() => { triggerHaptic(20); setEntryIsInstallment(!entryIsInstallment); }} className="w-12 h-6 rounded-full transition-colors relative bg-slate-300 dark:bg-slate-700" style={{ backgroundColor: entryIsInstallment ? signatureColor : undefined }}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${entryIsInstallment ? "translate-x-7" : "translate-x-1"}`}></div>
                      </button>
                    </div>
                    {entryIsInstallment && (
                      <div className="grid grid-cols-2 gap-3 animate-fade-in mt-1">
                        <div className="relative">
                          <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Total Amount</label>
                          <div className="relative w-full flex items-center">
                            <span className={`absolute left-4 top-[18px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                            <input type="text" inputMode="decimal" pattern="[0-9.-]*" autoCorrect="off" autoCapitalize="none" value={entryTotalAmount} onChange={(e) => setEntryTotalAmount(e.target.value.replace(/\s+/g, ""))} onBlur={() => { if(!isNaN(parseFloat(entryTotalAmount)) && entryTotalAmount !== "") setEntryTotalAmount(parseFloat(entryTotalAmount).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-7 pr-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                          </div>
                        </div>
                        <div className="relative">
                          <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Already Paid</label>
                          <div className="relative w-full flex items-center">
                            <span className={`absolute left-4 top-[18px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                            <input type="text" inputMode="decimal" pattern="[0-9.-]*" autoCorrect="off" autoCapitalize="none" value={entryPaidAmount} onChange={(e) => setEntryPaidAmount(e.target.value.replace(/\s+/g, ""))} onBlur={() => { if(!isNaN(parseFloat(entryPaidAmount)) && entryPaidAmount !== "") setEntryPaidAmount(parseFloat(entryPaidAmount).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-7 pr-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {(drawerTab === "income" || drawerTab === "transactions") && (
                <div className="relative">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Account mapping</label>
                  <select value={entryAccount} onChange={(e) => setEntryAccount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border font-bold text-xs uppercase tracking-wider appearance-none transition-colors focus:outline-none ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                    <option value="" disabled>{drawerTab === "income" ? "Place this deposit into which account?" : "WHICH ACCOUNT PAID FOR THIS ACTIVITY?"}</option>
                    {accounts.map((a) => (<option key={a.id} value={a.id} className={isDarkMode ? "bg-[#1E293B]" : "bg-white"}>{a.name}</option>))}
                  </select>
                </div>
              )}

              {coOpStep === 3 && (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vault Access Permissions</span>
                    <span className={`text-xs font-black uppercase tracking-wider mt-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                      {entryVisibility === "Shared" ? "👥 Shared Ledger Routing" : "🔒 Private Security Encrypted"}
                    </span>
                  </div>
                  <div className={`flex p-1 rounded-xl border shrink-0 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <button onClick={() => { triggerHaptic(15); setEntryVisibility("Private"); }} className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${entryVisibility === "Private" ? "bg-red-500 text-white shadow-sm" : "text-slate-400"}`}>Private</button>
                    <button onClick={() => { triggerHaptic(15); setEntryVisibility("Shared"); }} className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${entryVisibility === "Shared" ? "text-white shadow-sm" : "text-slate-400"}`} style={{ backgroundColor: entryVisibility === "Shared" ? signatureColor : undefined }}>Shared</button>
                  </div>
                </div>
              )}

              <button onClick={handleConfirmAction} disabled={!canSubmitQab} className={`w-full mt-3 h-14 shrink-0 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${!canSubmitQab ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60 shadow-none" : `active:scale-95 ${drawerTab === "bills" ? "" : qabActiveBg} ${qabActiveShadow} hover:-translate-y-0.5`}`} style={{ backgroundColor: (canSubmitQab && drawerTab === "bills") ? signatureColor : undefined }}>Confirm & Save <CheckCircle2 size={18} /></button>
            </div>
          )}
        </div>

        {isCategorySelectorOpen && (() => {
          const lowerQuery = categorySearchQuery.toLowerCase().trim();
          const filteredCategories = categoriesToRender.map(group => {
            const matchingItems = group.items.filter(item => item.toLowerCase().includes(lowerQuery));
            return { ...group, items: matchingItems };
          }).filter(group => group.items.length > 0);

          return (
            <div className={`absolute inset-0 z-[140] flex flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
              <div className={`p-4 border-b flex justify-between items-center shrink-0 ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                <h3 className={`font-black uppercase text-xs tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Category</h3>
                <button onClick={() => { setIsCategorySelectorOpen(false); setCategorySearchQuery(""); setCustomCategoryInput(""); }} className={closeButtonClass}><X size={18}/></button>
              </div>
              
              <div className={`p-4 border-b shrink-0 ${isDarkMode ? "bg-slate-900/30 border-slate-700" : "bg-slate-50/50 border-slate-100"}`}>
                <div className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 focus-within:border-slate-500" : "bg-white border-slate-200 focus-within:border-slate-400"}`}>
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input 
                    type="text"
                    placeholder="SEARCH CATEGORIES"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="w-full bg-transparent outline-none font-bold text-xs uppercase tracking-wider text-slate-400 placeholder-slate-400/60"
                  />
                  {categorySearchQuery && (
                    <button onClick={() => setCategorySearchQuery("")} className="text-[10px] font-black text-slate-500">CLEAR</button>
                  )}
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-10">
                    <AlertCircle size={24} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No matching results found</p>
                  </div>
                ) : (
                  filteredCategories.map(group => (
                    <div key={group.group} className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                      <div className="flex justify-between items-center mb-3 pb-1 border-b border-dashed dark:border-slate-800 border-slate-100">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{group.group}</p>
                        {customCategoryInput.startsWith(`[ADD]${group.group}:`) ? (
                          <div className="flex items-center gap-1">
                            <input 
                              autoFocus
                              type="text"
                              value={customCategoryInput.replace(`[ADD]${group.group}:`, '')}
                              onChange={(e) => setCustomCategoryInput(`[ADD]${group.group}:${e.target.value}`)}
                              placeholder="CATEGORY NAME"
                              className={`w-28 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border outline-none ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                            />
                            <button 
                              onClick={() => {
                                const val = customCategoryInput.replace(`[ADD]${group.group}:`, '');
                                if(val.trim()) {
                                  handleAddCustomCategory(group.group, val.trim());
                                  triggerVictory();
                                }
                                setCustomCategoryInput("");
                              }}
                              className="text-[9px] font-black text-white px-2 py-0.5 rounded transition-all active:scale-95 shadow-sm"
                              style={{ backgroundColor: signatureColor }}
                            >
                              SAVE
                            </button>
                            <button onClick={() => setCustomCategoryInput("")} className="text-[9px] text-slate-400 px-1 hover:text-red-500">✕</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setCustomCategoryInput(`[ADD]${group.group}:`)}
                            className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 transition-colors"
                            style={{ color: signatureColor, borderColor: `${signatureColor}40` }}
                          >
                            [ + New Category ]
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {group.items.map(item => (
                          <button key={item} onClick={() => { triggerHaptic(20); setEntryCategory(item); setIsCategorySelectorOpen(false); setCategorySearchQuery(""); }} className={`w-full p-3.5 text-left rounded-xl text-xs font-black uppercase tracking-wide border transition-all active:scale-[0.99] flex items-center justify-between ${entryCategory === item ? 'text-white border-transparent shadow-sm' : isDarkMode ? "bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700/80" : "bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100/80"}`} style={{ backgroundColor: (entryCategory === item && drawerTab === "bills") ? signatureColor : undefined }}>
                            <span>{item}</span>
                            {entryCategory === item && <CheckCircle2 size={14} className="text-white shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {isIconSelectorOpen && (
          <div className={`absolute inset-0 z-[150] flex flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
              <h3 className={`font-black uppercase text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Icon</h3><button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button>
            </div>
            <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
              <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">
                {categoryEmojis.map(emoji => (
                  <button key={emoji} onClick={() => { triggerHaptic(15); setEntryIcon(emoji); setIsIconSelectorOpen(false); }} className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 ${entryIcon === emoji ? 'border-transparent shadow-md text-white' : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`} style={{ backgroundColor: (entryIcon === emoji && drawerTab === "bills") ? signatureColor : undefined }}>{emoji}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
