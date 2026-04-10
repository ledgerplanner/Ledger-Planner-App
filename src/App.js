import React, { useState, useEffect, useRef } from "react";
import {
  Home, Wallet, Calendar as CalendarIcon, CreditCard, CheckSquare,
  Bell, Moon, Sun, X, Plus, ArrowRight, CheckCircle2, Trash2, ArrowDown
} from "lucide-react";

// === FIREBASE INITIALIZATION ===
import { auth, db } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

// === COMPONENTS ===
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Bills from "./components/Bills";
import Activity from "./components/Activity";
import Todo from "./components/Todo";

export default function App() {
  // === APP & AUTH STATE ===
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Auth Form State
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const scrollRef = useRef(null);

  // === FIREBASE CLOUD DATA STATE ===
  const [bills, setBills] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [todos, setTodos] = useState([]);

  // === UI & MODAL STATE ===
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editEntryAmount, setEditEntryAmount] = useState("0");
  const [collapsedPaydays, setCollapsedPaydays] = useState({ "Payday 2": true, "Payday 3": true, "Payday 4": true, "Payday 5": true });
  
  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  const [paydayConfig, setPaydayConfig] = useState({ "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" }, "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" }, "Payday 5": { date: "", income: "" } });
  const [editPaydayConfig, setEditPaydayConfig] = useState(paydayConfig);
  
  const [paymentModalConfig, setPaymentModalConfig] = useState({ isOpen: false, billId: null, accountId: "" });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("0");
  
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editAccountBalance, setEditAccountBalance] = useState("0");
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Activity & Todo Component State 
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("All");
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [selectedTodo, setSelectedTodo] = useState(null);

  // === FAB (QUICK ADD) STATE ===
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabStep, setFabStep] = useState(1);
  const [drawerTab, setDrawerTab] = useState("bills");
  const [inputValue, setInputValue] = useState("0");
  const [entryName, setEntryName] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryIcon, setEntryIcon] = useState("🏠");
  const [entryAccount, setEntryAccount] = useState("");
  const [entryIsInstallment, setEntryIsInstallment] = useState(false);
  const [entryTotalAmount, setEntryTotalAmount] = useState("");
  const [entryPaidAmount, setEntryPaidAmount] = useState("");

  const categoryEmojis = ["📋", "🏠", "💧", "⚡", "📺", "🚗", "⛽", "🚕", "🚇", "✈️", "🌴", "🏋️", "💳", "🎓", "🛒", "🛍️", "👗", "👟", "💅", "💈", "🍔", "🌮", "🍣", "☕", "🍻", "🍹", "🏥", "💊", "🐶", "🐾", "🎉", "🎟️", "🎬", "🎮", "🕹️", "📱", "💻", "💼", "💵", "💰", "₿", "💎", "⌚"];

  // === CLOUD SYNC ENGINE ===
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setAccounts([]); setBills([]); setTransactions([]); setTodos([]);
      return;
    }
    const userRef = doc(db, "users", user.uid);

    const unsubAcc = onSnapshot(collection(userRef, "accounts"), (snap) => setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBills = onSnapshot(collection(userRef, "bills"), (snap) => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTxs = onSnapshot(query(collection(userRef, "transactions"), orderBy("createdAt", "desc")), (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTodos = onSnapshot(query(collection(userRef, "todos"), orderBy("createdAt", "desc")), (snap) => setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const unsubConfig = onSnapshot(doc(userRef, "settings", "paydayConfig"), (docSnap) => {
      if (docSnap.exists()) setPaydayConfig(docSnap.data());
    });

    return () => { unsubAcc(); unsubBills(); unsubTxs(); unsubTodos(); unsubConfig(); };
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === AUTH ACTIONS ===
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError("");
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update Firebase Auth Profile with First Name
        await updateProfile(userCredential.user, { displayName: firstName });
        
        // Save user data securely in the database
        await setDoc(doc(db, "users", userCredential.user.uid), {
          firstName: firstName,
          email: email,
          createdAt: serverTimestamp()
        }, { merge: true });

        // Update local state instantly so the UI catches the new name without refreshing
        setUser({ ...userCredential.user, displayName: firstName });
      }
    } catch (error) {
      let errorMsg = "Authentication failed. Please try again.";
      if (error.code === 'auth/invalid-credential') errorMsg = "Invalid email or password.";
      if (error.code === 'auth/email-already-in-use') errorMsg = "An account with this email already exists.";
      setAuthError(errorMsg);
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError("Google Sign-In failed or was cancelled.");
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => { await signOut(auth); setActiveTab("home"); };

  // === HELPERS & MATH ===
  // This now checks user.displayName first, falling back to email, and then "Founder"
  const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Founder";
  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatPaydayDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
  };

  const changeTab = (tabId) => { setActiveTab(tabId); if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" }); };
  const toggleCollapse = (payday) => setCollapsedPaydays((prev) => ({ ...prev, [payday]: !prev[payday] }));

  // === GLOBAL RENDER HERO ===
  const renderHeroShell = (title, graphicContent) => (
    <header className={`px-6 pt-12 pb-5 rounded-b-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-colors duration-500 mb-8 ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#1877F2]/10 rounded-full blur-3xl"></div>
      <div className="flex justify-between items-center mb-8 relative z-10 h-10">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center -top-1">
          <span className="text-[11px] font-black text-[#1877F2] uppercase tracking-[0.2em] leading-none mb-0.5">Ledger</span>
          <span className="text-[16px] font-black text-[#1877F2] uppercase tracking-[0.15em] leading-none">Planner</span>
        </div>
        <button onClick={() => setIsNotificationsOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
          <Bell size={18} />
          <span className={`absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 ${isDarkMode ? "border-[#1E293B]" : "border-white"}`}></span>
        </button>
      </div>
      <div className="flex justify-between items-end mb-6 relative z-10">
        <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h2>
        <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">Logout</button>
      </div>
      {graphicContent}
      <div className={`relative z-10 pt-4 border-t flex justify-between items-center ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{formattedDate}</span>
        <span className="text-[9px] font-black uppercase tracking-wider text-[#1877F2]">{formattedTime}</span>
      </div>
    </header>
  );

  // === SMART PAYMENT ENGINE ===
  const handleBillClick = async (id) => {
    const bill = bills.find(b => b.id === id);
    if (!bill.isPaid) {
      setPaymentModalConfig({ isOpen: true, billId: id, accountId: accounts.find(a => a.type === "Checking" || a.type === "Cash")?.id || (accounts[0]?.id || "") });
    } else {
      const refundAccountId = bill.paidFromAccountId;
      const targetAcc = accounts.find(a => a.id === refundAccountId);
      let newPaidAmount = bill.paidAmount;
      if (bill.isInstallment) newPaidAmount = bill.paidAmount - bill.amount;

      await updateDoc(doc(db, "users", user.uid, "bills", id), { isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null, linkedTxId: null });
      if (targetAcc) await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance + bill.amount });
      if (bill.linkedTxId) await deleteDoc(doc(db, "users", user.uid, "transactions", bill.linkedTxId));
    }
  };

  const confirmPaymentRoute = async () => {
    const bill = bills.find(b => b.id === paymentModalConfig.billId);
    const targetAcc = accounts.find(a => a.id === paymentModalConfig.accountId);
    if (!bill || !targetAcc) return;

    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    const txRef = await addDoc(collection(db, "users", user.uid, "transactions"), {
      name: bill.name, icon: bill.icon, amount: bill.amount, date: autoTimeStamp, type: "Expense", category: "Bill Payment", accountId: targetAcc.id, createdAt: serverTimestamp()
    });

    let newPaidAmt = bill.paidAmount;
    if (bill.isInstallment) newPaidAmt = bill.paidAmount + bill.amount;
    await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id });
    await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance - bill.amount });

    setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
  };

  // === FAB (QUICK ADD) ACTIONS ===
  const closeFab = () => { setIsFabOpen(false); setFabStep(1); setInputValue("0"); setEntryName(""); setEntryDate(""); setEntryIcon("🏠"); setEntryAccount(""); setEntryIsInstallment(false); setEntryTotalAmount(""); setEntryPaidAmount(""); };
  
  const handleNumpad = (btn) => {
    if (btn === "=") {
      try {
        const toEval = inputValue.replace(/×/g, "*").replace(/÷/g, "/");
        if (/^[0-9+\-*/. ]+$/.test(toEval)) setInputValue(String(Function('"use strict";return (' + toEval + ")")()));
      } catch (e) { setInputValue("Error"); setTimeout(() => setInputValue("0"), 1000); }
    } else if (inputValue === "0" && btn !== ".") setInputValue(btn);
    else setInputValue(inputValue + btn);
  };

  const calculatePaydayGroup = (dateString) => {
    if (!dateString) return "Payday 1";
    const billDate = new Date(dateString);
    const activePaydays = [];
    for (let i = 1; i <= 5; i++) {
      const pdId = `Payday ${i}`;
      if (paydayConfig[pdId] && paydayConfig[pdId].date) {
        const d = new Date(paydayConfig[pdId].date);
        if (!isNaN(d.getTime())) activePaydays.push({ id: pdId, date: d });
      }
    }
    if (activePaydays.length === 0) return "Payday 1";
    activePaydays.sort((a, b) => a.date - b.date);
    if (billDate < activePaydays[0].date) return "Due Now";
    let assignedPd = activePaydays[0].id;
    for (let i = 0; i < activePaydays.length; i++) {
      if (billDate >= activePaydays[i].date) assignedPd = activePaydays[i].id;
      else break;
    }
    return assignedPd;
  };

  const handleConfirmAction = async () => {
    const amountToProcess = parseFloat(inputValue);
    if (isNaN(amountToProcess) || amountToProcess <= 0) return;
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

    if (drawerTab === "bills") {
      let displayDate = "TBD", sortableDay = 31;
      if (entryDate) {
        const dateObj = new Date(entryDate);
        sortableDay = dateObj.getUTCDate();
        displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      }
      await addDoc(collection(db, "users", user.uid, "bills"), {
        name: entryName || "New Bill", icon: entryIcon || "📋", amount: amountToProcess,
        date: sortableDay, fullDate: displayDate, payday: calculatePaydayGroup(entryDate), isPaid: false, isOverdue: false,
        isInstallment: entryIsInstallment, totalAmount: entryIsInstallment ? parseFloat(entryTotalAmount) || 0 : 0,
        paidAmount: entryIsInstallment ? parseFloat(entryPaidAmount) || 0 : 0, linkedTxId: null
      });
    } else if (drawerTab === "income" || drawerTab === "transactions") {
      const targetAcc = accounts.find(a => a.id === entryAccount) || accounts[0];
      if (targetAcc) {
        const isIncome = drawerTab === "income";
        await addDoc(collection(db, "users", user.uid, "transactions"), {
          name: entryName || (isIncome ? "Income" : "Expense"), icon: isIncome ? "💵" : entryIcon, amount: amountToProcess, date: autoTimeStamp, 
          type: isIncome ? "Income" : "Expense", category: isIncome ? "Deposit" : "Purchase", accountId: targetAcc.id, createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance + (isIncome ? amountToProcess : -amountToProcess) });
      }
    }
    closeFab();
  };

  // === RENDER LOGIC ===
  if (!user || isAuthLoading) {
    return <Login 
      isAuthLoading={isAuthLoading} 
      isLoginMode={isLoginMode} 
      setIsLoginMode={setIsLoginMode} 
      handleAuthSubmit={handleAuthSubmit} 
      handleGoogleLogin={handleGoogleLogin}
      authError={authError} 
      setAuthError={setAuthError} 
      email={email} 
      setEmail={setEmail} 
      password={password} 
      setPassword={setPassword}
      firstName={firstName}
      setFirstName={setFirstName}
    />;
  }

  return (
    <div className={`h-screen font-sans relative overflow-hidden flex justify-center transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <div className={`w-full max-w-md h-full relative shadow-2xl flex flex-col transition-colors duration-500 overflow-hidden ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        
        {/* MAIN VIEW ROUTER */}
        <div className="flex-1 overflow-y-auto hide-scrollbar" ref={scrollRef}>
          {activeTab === "home" && <Dashboard userName={userName} accounts={accounts} bills={bills} paydayConfig={paydayConfig} setEditPaydayConfig={setEditPaydayConfig} setIsPaydaySetupOpen={setIsPaydaySetupOpen} collapsedPaydays={collapsedPaydays} toggleCollapse={toggleCollapse} handleBillClick={handleBillClick} setSelectedEntry={setSelectedEntry} isDarkMode={isDarkMode} formatPaydayDateStr={formatPaydayDateStr} renderHeroShell={renderHeroShell} />}
          {activeTab === "accounts" && <Accounts userName={userName} accounts={accounts} isDarkMode={isDarkMode} setIsTransferOpen={setIsTransferOpen} setIsAddAccountOpen={setIsAddAccountOpen} setSelectedAccount={setSelectedAccount} setEditAccountBalance={setEditAccountBalance} renderHeroShell={renderHeroShell} />}
          {activeTab === "bills" && <Bills userName={userName} bills={bills} isDarkMode={isDarkMode} handleBillClick={handleBillClick} setSelectedEntry={setSelectedEntry} renderHeroShell={renderHeroShell} />}
          {activeTab === "activity" && <Activity userName={userName} transactions={transactions} activitySearch={activitySearch} setActivitySearch={setActivitySearch} activityFilter={activityFilter} setActivityFilter={setActivityFilter} isDarkMode={isDarkMode} setSelectedEntry={setSelectedEntry} renderHeroShell={renderHeroShell} />}
          {activeTab === "todo" && <Todo userName={userName} todos={todos} newTodoText={newTodoText} setNewTodoText={setNewTodoText} newTodoPriority={newTodoPriority} setNewTodoPriority={setNewTodoPriority} isDarkMode={isDarkMode} handleAddTodo={async (e) => { e.preventDefault(); if(!newTodoText.trim()) return; await addDoc(collection(db, "users", user.uid, "todos"), { text: newTodoText, priority: newTodoPriority, type: "task", isCompleted: false, createdAt: serverTimestamp() }); setNewTodoText(""); setNewTodoPriority(3); }} toggleTodoStatus={async (id) => { const todo = todos.find(t => t.id === id); await updateDoc(doc(db, "users", user.uid, "todos", id), { isCompleted: !todo.isCompleted }); }} setSelectedTodo={setSelectedTodo} renderHeroShell={renderHeroShell} />}
        </div>

        {/* MODALS & DRAWERS */}
        {selectedEntry && (
          <div className="absolute inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedEntry(null)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setSelectedEntry(null)} className="absolute top-6 right-6 p-2 rounded-full z-20"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
              <div className="px-8 pt-6 pb-12 flex flex-col h-full">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
                <div className="flex justify-between mb-6">
                  <div className="flex gap-5">
                    <div className="w-16 h-16 rounded-[2rem] bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-4xl shadow-sm">{selectedEntry.icon}</div>
                    <div>
                      <h2 className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEntry.name}</h2>
                      <p className="text-xs font-bold text-[#1877F2] uppercase">{selectedEntry.category || "Entry"}</p>
                    </div>
                  </div>
                  <div className="text-right mt-2"><p className={`text-3xl font-black ${selectedEntry.type === "Income" ? "text-emerald-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>${Math.abs(selectedEntry.amount).toFixed(2)}</p></div>
                </div>
                <button onClick={async () => { 
                  if (selectedEntry.fullDate) await deleteDoc(doc(db, "users", user.uid, "bills", selectedEntry.id));
                  else await deleteDoc(doc(db, "users", user.uid, "transactions", selectedEntry.id));
                  setSelectedEntry(null); 
                }} className="w-full mt-4 pt-4 pb-2 text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl"><Trash2 size={14} /> Delete Entry</button>
              </div>
            </div>
          </div>
        )}

        {isFabOpen && (
          <div className="absolute inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeFab}></div>
            <div className={`w-full rounded-t-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={closeFab} className="absolute top-5 right-5 p-2 rounded-full z-20"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
              <div className={`px-6 pt-6 pb-4 border-b shrink-0 ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                {fabStep === 1 ? (
                  <div className={`flex rounded-xl p-1 mb-6 mr-8 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <button onClick={() => { setDrawerTab("bills"); setEntryIcon("🏠"); }} className={`flex-1 py-2 text-sm font-bold rounded-lg ${drawerTab === "bills" ? (isDarkMode ? "bg-slate-700 text-[#1877F2]" : "bg-white text-[#1877F2]") : "text-slate-400"}`}>Bills</button>
                    <button onClick={() => setDrawerTab("income")} className={`flex-1 py-2 text-sm font-bold rounded-lg ${drawerTab === "income" ? (isDarkMode ? "bg-slate-700 text-emerald-400" : "bg-white text-[#10B981]") : "text-slate-400"}`}>Income</button>
                    <button onClick={() => { setDrawerTab("transactions"); setEntryIcon("💳"); }} className={`flex-1 py-2 text-sm font-bold rounded-lg ${drawerTab === "transactions" ? (isDarkMode ? "bg-slate-700 text-orange-400" : "bg-white text-[#F97316]") : "text-slate-400"}`}>Activity</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 mb-6 -mt-2"><button onClick={() => setFabStep(1)} className="p-2 rounded-full text-slate-400 hover:text-slate-600">←</button><h3 className="font-bold text-sm uppercase tracking-widest text-[#1877F2]">Add Details</h3></div>
                )}
                <div className="text-center mb-4 relative flex justify-center items-center"><span className="text-5xl font-extrabold tracking-tighter text-[#1877F2]">${inputValue}</span>{fabStep === 1 && <button onClick={() => setInputValue(inputValue.slice(0, -1) || "0")} className="absolute right-0 text-slate-400 p-2">⌫</button>}</div>
              </div>
              <div className={`p-6 mt-auto rounded-b-[2.5rem] flex-1 flex flex-col overflow-y-auto ${isDarkMode ? "bg-[#0F172A]" : "bg-slate-50"}`}>
                {fabStep === 1 ? (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                        <button key={btn} onClick={() => handleNumpad(btn)} className={`h-14 rounded-2xl text-xl font-bold flex items-center justify-center transition-colors shadow-sm ${["÷", "×", "-", "+", "="].includes(btn) ? isDarkMode ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500" : isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"}`}>{btn}</button>
                      ))}
                    </div>
                    <button onClick={() => { if (parseFloat(inputValue) > 0) setFabStep(2); }} disabled={parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue))} className={`w-full mt-4 h-14 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 ${parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue)) ? "bg-slate-300 opacity-50" : "bg-[#1877F2]"}`}>Next Step <ArrowRight size={20} /></button>
                  </>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="space-y-4 flex-1 pb-6">
                      <input type="text" placeholder="Name" value={entryName} onChange={(e) => setEntryName(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm border ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200"}`} />
                      {drawerTab === "bills" && <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm border ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200"}`} />}
                      {(drawerTab === "income" || drawerTab === "transactions") && (
                        <select value={entryAccount} onChange={(e) => setEntryAccount(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm border ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200"}`}>
                          <option value="" disabled>Select Account</option>
                          {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>))}
                        </select>
                      )}
                    </div>
                    <button onClick={handleConfirmAction} className="w-full mt-4 h-14 shrink-0 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 bg-[#1877F2]">Confirm Entry</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <div className="absolute bottom-24 right-6 z-40">
          <button onClick={() => setIsFabOpen(true)} className={`w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#1877F2] shadow-[0_12px_24px_rgba(24,119,242,0.4)] border-4 ${isDarkMode ? "border-[#0F172A]" : "border-white"}`}><Plus size={28} /></button>
        </div>

        <div className={`absolute bottom-0 left-0 w-full backdrop-blur-md border-t px-2 pt-3 pb-6 flex justify-between items-center z-40 ${isDarkMode ? "bg-[#1E293B]/95 border-slate-800" : "bg-white/95 border-slate-100"}`}>
          {[{ id: "home", icon: Home, label: "Home" }, { id: "accounts", icon: Wallet, label: "Accounts" }, { id: "bills", icon: CalendarIcon, label: "Bills" }, { id: "activity", icon: CreditCard, label: "Activity" }, { id: "todo", icon: CheckSquare, label: "To-Do" }].map((tab) => (
            <button key={tab.id} onClick={() => changeTab(tab.id)} className="flex-1 flex flex-col items-center gap-1 group">
              <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={`transition-all duration-300 ${activeTab === tab.id ? "text-[#1877F2] transform -translate-y-1" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === tab.id ? "text-[#1877F2]" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{tab.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
