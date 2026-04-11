import React, { useState, useEffect, useRef } from "react";
import {
  Home, Wallet, Calendar as CalendarIcon, CreditCard, CheckSquare,
  Bell, Moon, Sun, X, Plus, ArrowRight, CheckCircle2, Trash2, ArrowDown, AlertCircle, Edit2, LogOut
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
  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");
  const [newAccType, setNewAccType] = useState("Checking");
  const [newAccDesc, setNewAccDesc] = useState("");

  // Activity & Todo
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("All");
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoType, setNewTodoType] = useState("task");
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
  const [entryIsRecurring, setEntryIsRecurring] = useState(true); // NEW: Recurring Tracker
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

    const unsubAcc = onSnapshot(collection(userRef, "accounts"), (snap) => {
      const allAccs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAccounts(allAccs.filter(a => !a.isArchived));
    });
    
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
        await updateProfile(userCredential.user, { displayName: firstName });
        await setDoc(doc(db, "users", userCredential.user.uid), { firstName: firstName, email: email, createdAt: serverTimestamp() }, { merge: true });
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

  // === HAPTIC FEEDBACK ENGINE ===
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  // === HELPERS & MATH ===
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

  // === MODAL FUNCTIONS ===
  const handleAddAccount = async () => {
    const startBal = parseFloat(newAccBalance);
    if (!newAccName.trim() || isNaN(startBal)) return;
    let finalBalance = startBal;
    if (newAccType === "Credit Card" && startBal > 0) finalBalance = -startBal;
    
    const getIcon = (type) => {
      if (type === "Credit Card") return "💳";
      if (type === "401k / Retirement") return "🌴";
      if (type === "Savings") return "📈";
      if (type === "Cash") return "💵";
      return "🏦";
    };

    const accRef = await addDoc(collection(db, "users", user.uid, "accounts"), { name: newAccName, type: newAccType, description: newAccDesc, balance: finalBalance, icon: getIcon(newAccType), isArchived: false });

    if (Math.abs(startBal) > 0) {
      const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: `${newAccName} (Opening)`, icon: getIcon(newAccType), amount: Math.abs(startBal), date: autoTimeStamp, type: finalBalance < 0 ? "Expense" : "Income", category: finalBalance < 0 ? "Initial Debt" : "Opening Balance", accountId: accRef.id, createdAt: serverTimestamp() });
    }
    triggerHaptic();
    setIsAddAccountOpen(false); setNewAccName(""); setNewAccBalance(""); setNewAccDesc(""); setNewAccType("Checking");
  };

  const executeTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0 || !transferFrom || !transferTo) return;
    const fromAcc = accounts.find(a => a.id === transferFrom);
    const toAcc = accounts.find(a => a.id === transferTo);
    await updateDoc(doc(db, "users", user.uid, "accounts", fromAcc.id), { balance: fromAcc.balance - amt });
    await updateDoc(doc(db, "users", user.uid, "accounts", toAcc.id), { balance: toAcc.balance + amt });
    triggerHaptic();
    setIsTransferOpen(false); setTransferAmount("0"); setTransferFrom(""); setTransferTo("");
  };

  const updateAccountBalance = async () => {
    const newBal = parseFloat(editAccountBalance);
    if (isNaN(newBal) || !selectedAccount) return;
    let finalBalance = newBal;
    if (selectedAccount.type === "Credit Card" && newBal > 0) finalBalance = -newBal;
    await updateDoc(doc(db, "users", user.uid, "accounts", selectedAccount.id), { balance: finalBalance });
    triggerHaptic();
    setSelectedAccount(null);
  };

  const savePaydayConfig = async () => {
    setPaydayConfig(editPaydayConfig);
    await setDoc(doc(db, "users", user.uid, "settings", "paydayConfig"), editPaydayConfig);
    setIsPaydaySetupOpen(false);
  };

  // === DYNAMIC TIME ENGINE ===
  const todayForDynamic = new Date();
  todayForDynamic.setHours(0, 0, 0, 0);

  const calculatePaydayGroup = (dateString) => {
    if (!dateString) return "Payday 1";
    const billDate = new Date(dateString);

    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    const localBillDate = new Date(billDate.getUTCFullYear(), billDate.getUTCMonth(), billDate.getUTCDate());
    if (localBillDate <= todayLocal) return "Due Now";

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

  const dynamicBills = bills.map(bill => {
    if (bill.rawDate && !bill.isPaid) {
      const bDate = new Date(bill.rawDate);
      const localBDate = new Date(bDate.getUTCFullYear(), bDate.getUTCMonth(), bDate.getUTCDate());
      if (localBDate <= todayForDynamic) {
        return { ...bill, payday: "Due Now", isOverdue: localBDate < todayForDynamic };
      }
    }
    return bill;
  });

  // === NEW: SMART ROLLOVER ENGINE ===
  const handleRolloverMonth = async () => {
    if (!window.confirm("Ready to start a new month? Paid recurring bills will automatically bump to next month, and one-time bills will be cleared from the board.")) return;
    
    const batchPromises = [];
    bills.forEach(bill => {
      if (bill.isPaid) {
        if (bill.isRecurring !== false) { 
          // It is recurring -> bump the date 1 month forward and mark unpaid
          let newRawDate = bill.rawDate;
          let displayDate = bill.fullDate;
          let newPayday = "Payday 1";
          
          if (bill.rawDate) {
            const oldDate = new Date(bill.rawDate);
            oldDate.setUTCMonth(oldDate.getUTCMonth() + 1);
            newRawDate = oldDate.toISOString().split('T')[0];
            displayDate = oldDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
            newPayday = calculatePaydayGroup(newRawDate);
          }
          
          let newPaidAmt = bill.isInstallment ? bill.paidAmount : 0;
          
          batchPromises.push(updateDoc(doc(db, "users", user.uid, "bills", bill.id), {
            isPaid: false,
            paidAmount: newPaidAmt,
            linkedTxId: null,
            paidFromAccountId: null,
            rawDate: newRawDate,
            fullDate: displayDate,
            payday: newPayday,
            isOverdue: false
          }));
        } else {
          // It was a one-time bill -> delete from board (receipt stays in Activity)
          batchPromises.push(deleteDoc(doc(db, "users", user.uid, "bills", bill.id)));
        }
      }
    });
    
    await Promise.all(batchPromises);
    triggerHaptic();
  };

  // === GLOBAL RENDER HERO ===
  const renderHeroShell = (title, graphicContent) => (
    <header className={`px-6 pt-12 pb-5 rounded-b-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-colors duration-500 mb-8 ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#1877F2]/10 rounded-full blur-3xl"></div>
      
      <div className="flex justify-between items-center mb-8 relative z-10 h-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setIsNotificationsOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
            <Bell size={18} />
            {dynamicBills.some(b => b.isOverdue || (!b.isPaid && b.payday === "Due Now")) && (
              <span className={`absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 ${isDarkMode ? "border-[#1E293B]" : "border-white"}`}></span>
            )}
          </button>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center -top-1">
          <span className="text-[11px] font-black text-[#1877F2] uppercase tracking-[0.2em] leading-none mb-0.5">Ledger</span>
          <span className="text-[16px] font-black text-[#1877F2] uppercase tracking-[0.15em] leading-none">Planner</span>
        </div>
        
        <button onClick={handleLogout} className={`h-10 px-3.5 rounded-full flex items-center justify-center gap-2 border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-red-400 hover:bg-red-900/30" : "bg-white border-slate-100 text-red-500 hover:bg-red-50"}`}>
          <LogOut size={14} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Logout</span>
        </button>
      </div>
      
      <div className="mb-6 relative z-10 flex justify-center px-1">
        <h2 title={title} className={`text-3xl font-black tracking-tight leading-tight truncate max-w-full ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {title}
        </h2>
      </div>
      
      <div className="relative z-10 w-full">
        {graphicContent}
      </div>
      
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
      triggerHaptic();
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

    triggerHaptic();
    setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
  };

  // === FAB (QUICK ADD 2.0) ACTIONS ===
  const closeFab = () => { setIsFabOpen(false); setFabStep(1); setInputValue("0"); setEntryName(""); setEntryDate(""); setEntryIcon("🏠"); setEntryAccount(""); setEntryIsRecurring(true); setEntryIsInstallment(false); setEntryTotalAmount(""); setEntryPaidAmount(""); };
  
  const handleNumpad = (btn) => {
    if (btn === "=") {
      try {
        const toEval = inputValue.replace(/×/g, "*").replace(/÷/g, "/");
        if (/^[0-9+\-*/. ]+$/.test(toEval)) setInputValue(String(Function('"use strict";return (' + toEval + ")")()));
      } catch (e) { setInputValue("Error"); setTimeout(() => setInputValue("0"), 1000); }
    } else if (inputValue === "0" && btn !== ".") setInputValue(btn);
    else setInputValue(inputValue + btn);
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
        date: sortableDay, fullDate: displayDate, rawDate: entryDate, payday: calculatePaydayGroup(entryDate), isPaid: false, isOverdue: false,
        isRecurring: entryIsRecurring, // SAVES THE TOGGLE
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
    triggerHaptic();
    closeFab();
  };

  // === RENDER LOGIC ===
  if (!user || isAuthLoading) {
    return <Login 
      isAuthLoading={isAuthLoading} isLoginMode={isLoginMode} setIsLoginMode={setIsLoginMode} 
      handleAuthSubmit={handleAuthSubmit} handleGoogleLogin={handleGoogleLogin} authError={authError} 
      setAuthError={setAuthError} email={email} setEmail={setEmail} password={password} 
      setPassword={setPassword} firstName={firstName} setFirstName={setFirstName}
    />;
  }

  return (
    <div className={`h-screen font-sans relative overflow-hidden flex justify-center transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <div className={`w-full max-w-md h-full relative shadow-2xl flex flex-col transition-colors duration-500 overflow-hidden ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        
        {/* MAIN VIEW ROUTER (PASSING ROLLOVER LOGIC) */}
        <div className="flex-1 overflow-y-auto hide-scrollbar" ref={scrollRef}>
          {activeTab === "home" && <Dashboard userName={userName} accounts={accounts} bills={dynamicBills} transactions={transactions} paydayConfig={paydayConfig} setEditPaydayConfig={setEditPaydayConfig} setIsPaydaySetupOpen={setIsPaydaySetupOpen} collapsedPaydays={collapsedPaydays} toggleCollapse={toggleCollapse} handleBillClick={handleBillClick} setSelectedEntry={setSelectedEntry} isDarkMode={isDarkMode} formatPaydayDateStr={formatPaydayDateStr} renderHeroShell={renderHeroShell} changeTab={changeTab} />}
          {activeTab === "accounts" && <Accounts userName={userName} accounts={accounts} isDarkMode={isDarkMode} setIsTransferOpen={setIsTransferOpen} setIsAddAccountOpen={setIsAddAccountOpen} setSelectedAccount={setSelectedAccount} setEditAccountBalance={setEditAccountBalance} renderHeroShell={renderHeroShell} />}
          
          {/* UPDATED BILLS COMPONENT */}
          {activeTab === "bills" && <Bills userName={userName} bills={dynamicBills} isDarkMode={isDarkMode} handleBillClick={handleBillClick} setSelectedEntry={setSelectedEntry} renderHeroShell={renderHeroShell} handleRolloverMonth={handleRolloverMonth} />}
          
          {activeTab === "activity" && <Activity userName={userName} transactions={transactions} activitySearch={activitySearch} setActivitySearch={setActivitySearch} activityFilter={activityFilter} setActivityFilter={setActivityFilter} isDarkMode={isDarkMode} setSelectedEntry={setSelectedEntry} renderHeroShell={renderHeroShell} />}
          {activeTab === "todo" && <Todo 
            userName={userName} todos={todos} newTodoText={newTodoText} setNewTodoText={setNewTodoText} 
            newTodoPriority={newTodoPriority} setNewTodoPriority={setNewTodoPriority} 
            newTodoType={newTodoType} setNewTodoType={setNewTodoType} isDarkMode={isDarkMode} 
            handleAddTodo={async (e) => { 
              e.preventDefault(); 
              if(!newTodoText.trim()) return; 
              await addDoc(collection(db, "users", user.uid, "todos"), { 
                text: newTodoText, priority: newTodoPriority, type: newTodoType, isCompleted: false, createdAt: serverTimestamp() 
              }); 
              triggerHaptic();
              setNewTodoText(""); setNewTodoPriority(3); 
            }} 
            toggleTodoStatus={async (id) => { 
              triggerHaptic();
              const todo = todos.find(t => t.id === id); 
              await updateDoc(doc(db, "users", user.uid, "todos", id), { isCompleted: !todo.isCompleted }); 
            }} 
            setSelectedTodo={setSelectedTodo} renderHeroShell={renderHeroShell} 
          />}
        </div>

        {/* ========================================================= */}
        {/* MODALS & DRAWERS */}
        {/* ========================================================= */}

        {/* 1. ENTRY DETAIL / EDIT / DELETE MODAL */}
        {selectedEntry && (
          <div className="absolute inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setSelectedEntry(null); setIsEditingEntry(false); }}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col border-t max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => { setSelectedEntry(null); setIsEditingEntry(false); }} className="absolute top-6 right-6 p-2 rounded-full z-20">
                <X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
              </button>

              {isEditingEntry ? (
                <>
                  <div className="px-8 pt-6 pb-4 overflow-y-auto hide-scrollbar">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl bg-opacity-10 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"}`}>{selectedEntry.icon}</div>
                      <div>
                        <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Edit {selectedEntry.name}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Amount</p>
                      </div>
                    </div>
                    <div className="text-center mt-8 mb-2 flex justify-center items-center relative">
                      <span className={`text-5xl font-extrabold tracking-tighter ${selectedEntry.type === "Income" ? "text-emerald-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>${editEntryAmount}</span>
                      <button onClick={() => setEditEntryAmount(editEntryAmount.slice(0, -1) || "0")} className="absolute right-4 text-slate-400 p-2 hover:text-slate-600 transition-colors">⌫</button>
                    </div>
                  </div>
                  <div className={`p-6 mt-auto rounded-b-[3rem] shrink-0 ${isDarkMode ? "bg-[#0F172A]" : "bg-slate-50"}`}>
                    <div className="grid grid-cols-4 gap-3">
                      {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                        <button
                          key={btn}
                          onClick={() => {
                            if (btn === "=") {
                              try {
                                const toEval = editEntryAmount.replace(/×/g, "*").replace(/÷/g, "/");
                                if (/^[0-9+\-*/. ]+$/.test(toEval)) {
                                  // eslint-disable-next-line no-new-func
                                  setEditEntryAmount(String(Function('"use strict";return (' + toEval + ")")()));
                                }
                              } catch (e) { setEditEntryAmount("0"); }
                            } else if (editEntryAmount === "0" && btn !== ".") {
                              setEditEntryAmount(btn);
                            } else { setEditEntryAmount(editEntryAmount + btn); }
                          }}
                          className={`h-14 rounded-2xl text-xl font-bold flex items-center justify-center transition-colors shadow-sm ${["÷", "×", "-", "+", "="].includes(btn) ? isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-100" : isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-800 hover:bg-slate-100"}`}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        const newAmount = parseFloat(editEntryAmount);
                        if (!isNaN(newAmount)) {
                          if (selectedEntry.fullDate) {
                            await updateDoc(doc(db, "users", user.uid, "bills", selectedEntry.id), { amount: newAmount });
                          } else {
                            await updateDoc(doc(db, "users", user.uid, "transactions", selectedEntry.id), { amount: newAmount });
                          }
                        }
                        setIsEditingEntry(false);
                        setSelectedEntry(null);
                      }}
                      className={`w-full mt-4 h-14 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-[#1877F2] text-white hover:bg-blue-600 shadow-blue-500/30`}
                    >
                      Save Amount
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-8 pt-6 pb-12 flex flex-col h-full overflow-y-auto hide-scrollbar">
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[2rem] bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-4xl shadow-sm shrink-0">{selectedEntry.icon}</div>
                      <div>
                        <h2 className={`text-2xl font-black tracking-tight leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEntry.name}</h2>
                        <p className="text-xs font-bold text-[#1877F2] uppercase tracking-widest">{selectedEntry.category || "Recurring Bill"}</p>
                      </div>
                    </div>
                    <div className="text-right mt-2 shrink-0">
                      <p className={`text-3xl font-black tracking-tighter ${selectedEntry.type === "Income" ? "text-emerald-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>${Math.abs(selectedEntry.amount).toFixed(2)}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">{selectedEntry.fullDate || selectedEntry.date}</p>
                    </div>
                  </div>

                  {selectedEntry.isInstallment && (
                    <div className={`mt-2 mb-6 p-4 rounded-2xl border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">
                        <span className="text-[#1877F2]">${selectedEntry.paidAmount?.toLocaleString() || 0} Paid</span>
                        <span>${selectedEntry.totalAmount?.toLocaleString() || 0} Total</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1877F2] transition-all" style={{ width: `${Math.min(((selectedEntry.paidAmount || 0) / (selectedEntry.totalAmount || 1)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button 
                      onClick={() => { setIsEditingEntry(true); setEditEntryAmount(Math.abs(selectedEntry.amount).toString()); }} 
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    {selectedEntry.fullDate && (
                      <button 
                        onClick={() => { handleBillClick(selectedEntry.id); setSelectedEntry(null); }} 
                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${selectedEntry.isPaid ? "bg-slate-200 text-slate-400" : "bg-slate-200 text-slate-400"}`}
                      >
                        {selectedEntry.isPaid ? "Mark Unpaid" : "Mark Paid"}
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={async () => { 
                      if (selectedEntry.fullDate) await deleteDoc(doc(db, "users", user.uid, "bills", selectedEntry.id));
                      else {
                        if (selectedEntry.accountId) {
                          const acc = accounts.find(a => a.id === selectedEntry.accountId);
                          if (acc) await updateDoc(doc(db, "users", user.uid, "accounts", acc.id), { balance: selectedEntry.type === "Expense" ? acc.balance + selectedEntry.amount : acc.balance - selectedEntry.amount });
                        }
                        await deleteDoc(doc(db, "users", user.uid, "transactions", selectedEntry.id));
                      }
                      setSelectedEntry(null); 
                    }} 
                    className="w-full mt-4 pt-4 pb-2 text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={14} /> Delete Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. EDIT / ARCHIVE ACCOUNT BALANCE MODAL */}
        {selectedAccount && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedAccount(null)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setSelectedAccount(null)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
              </button>

              <div className="px-8 pt-6 pb-4 overflow-y-auto hide-scrollbar">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl bg-opacity-10 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"}`}>{selectedAccount.icon}</div>
                  <div>
                    <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedAccount.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Update Balance</p>
                  </div>
                </div>
                
                {(() => {
                  const currentEditVal = parseFloat(editAccountBalance) || 0;
                  const isEditingNegative = currentEditVal < 0 || editAccountBalance === "-";
                  const displayEditVal = editAccountBalance.startsWith("-") ? editAccountBalance.substring(1) : editAccountBalance;
                  return (
                    <div className="text-center mt-8 mb-2 flex justify-center items-center relative">
                      <span className={`text-5xl font-extrabold tracking-tighter ${isEditingNegative ? "text-red-500" : "text-[#1877F2]"}`}>
                        {isEditingNegative ? "-" : ""}${displayEditVal}
                      </span>
                      <button onClick={() => setEditAccountBalance(editAccountBalance.slice(0, -1) || "0")} className="absolute right-4 text-slate-400 p-2 hover:text-slate-600 transition-colors">⌫</button>
                    </div>
                  );
                })()}
              </div>
              <div className={`p-6 mt-auto rounded-b-[3rem] shrink-0 ${isDarkMode ? "bg-[#0F172A]" : "bg-slate-50"}`}>
                <div className="grid grid-cols-4 gap-3">
                  {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                    <button key={btn} onClick={() => {
                        if (btn === "=") {
                          try {
                            const toEval = editAccountBalance.replace(/×/g, "*").replace(/÷/g, "/");
                            if (/^[0-9+\-*/. ]+$/.test(toEval)) setEditAccountBalance(String(Function('"use strict";return (' + toEval + ")")()));
                          } catch (e) { setEditAccountBalance("0"); }
                        } else if (btn === "-") {
                          if (editAccountBalance === "0" || editAccountBalance === "") setEditAccountBalance("-");
                          else setEditAccountBalance(editAccountBalance + "-");
                        } else if (editAccountBalance === "0" && btn !== ".") { setEditAccountBalance(btn); }
                        else { setEditAccountBalance(editAccountBalance + btn); }
                      }}
                      className={`h-14 rounded-2xl text-xl font-bold flex items-center justify-center transition-colors shadow-sm ${["÷", "×", "-", "+", "="].includes(btn) ? isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-100" : isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-800 hover:bg-slate-100"}`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
                <button onClick={updateAccountBalance} className={`w-full mt-4 h-14 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-[#1877F2] text-white hover:bg-blue-600 shadow-blue-500/30`}>Save Balance</button>
                
                {/* SECURE ACCOUNT ARCHIVE BUTTON */}
                <button 
                  onClick={async () => { 
                    if (window.confirm(`Are you sure you want to close your ${selectedAccount.name} vault? This will safely archive the account and preserve your historical data.`)) {
                      await updateDoc(doc(db, "users", user.uid, "accounts", selectedAccount.id), { isArchived: true, balance: 0 });
                      triggerHaptic();
                      setSelectedAccount(null);
                    }
                  }} 
                  className="w-full mt-4 pt-4 pb-2 text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                >
                  <Trash2 size={14} /> Archive Vault
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CONFIRM PAYMENT ROUTING MODAL */}
        {paymentModalConfig.isOpen && (() => {
          const bill = dynamicBills.find(b => b.id === paymentModalConfig.billId);
          return (
            <div className="absolute inset-0 z-[80] flex items-end">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" })}></div>
               <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
                 <button onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" })} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}><X size={18} strokeWidth={3} /></button>
                 <div className="px-8 pt-6 pb-8 overflow-y-auto hide-scrollbar">
                   <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                   <h2 className={`text-xl font-black tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Complete Payment</h2>
                   <div className={`flex items-center gap-4 p-4 rounded-2xl mb-6 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm border ${isDarkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-white border-slate-100'}`}>{bill?.icon}</div>
                      <div>
                        <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{bill?.name}</p>
                        <p className={`text-lg font-black tracking-tight mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-[#1877F2]'}`}>${bill?.amount.toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="relative">
                     <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Select Account</label>
                     <select value={paymentModalConfig.accountId} onChange={(e) => setPaymentModalConfig({...paymentModalConfig, accountId: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                       {accounts.map(a => (<option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>))}
                     </select>
                   </div>
                   <button onClick={confirmPaymentRoute} className="w-full mt-6 h-14 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-[#1877F2] text-white hover:bg-blue-600 shadow-blue-500/30">
                     Confirm & Pay <ArrowRight size={18} />
                   </button>
                 </div>
               </div>
            </div>
          )
        })()}

        {/* 4. CONFIGURE PAYDAYS MODAL */}
        {isPaydaySetupOpen && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsPaydaySetupOpen(false)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setIsPaydaySetupOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}><X size={18} strokeWidth={3} /></button>
              <div className="px-8 pt-6 pb-4 overflow-y-auto hide-scrollbar">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <h2 className={`text-xl font-black tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Configure Roadmap</h2>
                
                <div className="flex justify-between items-center mb-8">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Set your expected dates & income</p>
                  <button 
                    onClick={() => setEditPaydayConfig({ "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" }, "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" }, "Payday 5": { date: "", income: "" } })}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-4">
                  {["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((pd) => (
                    <div key={pd} className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <h4 className={`text-xs font-black uppercase tracking-widest mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{pd}</h4>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className={`text-[9px] font-bold uppercase tracking-widest mb-1 block ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Date</label>
                          <input type="date" value={editPaydayConfig[pd]?.date || ""} onChange={(e) => setEditPaydayConfig({ ...editPaydayConfig, [pd]: { ...editPaydayConfig[pd], date: e.target.value } })} className={`w-full py-3 px-3 rounded-xl font-bold text-xs outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                        </div>
                        <div className="flex-1">
                          <label className={`text-[9px] font-bold uppercase tracking-widest mb-1 block ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Expected Income</label>
                          <input type="number" placeholder="Optional" value={editPaydayConfig[pd]?.income || ""} onChange={(e) => setEditPaydayConfig({ ...editPaydayConfig, [pd]: { ...editPaydayConfig[pd], income: e.target.value } })} className={`w-full py-3 px-3 rounded-xl font-bold text-xs outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white placeholder-slate-600" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-6 mt-auto rounded-b-[3rem] shrink-0 ${isDarkMode ? "bg-[#0F172A]" : "bg-white border-t border-slate-100"}`}>
                <button onClick={savePaydayConfig} className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-[#1877F2] text-white hover:bg-blue-600 shadow-blue-500/30">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. NOTIFICATIONS / ALERTS MODAL */}
        {isNotificationsOpen && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsNotificationsOpen(false)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col transition-colors duration-500 max-h-[85vh] min-h-[50vh] ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setIsNotificationsOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}><X size={18} strokeWidth={3} /></button>
              <div className="px-8 pt-8 pb-4 flex-1 flex flex-col overflow-y-auto hide-scrollbar">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <h2 className={`text-xl font-black tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ledger Alerts</h2>
                <div className="space-y-4 pb-10 flex-1">
                  
                  {/* Overdue Bills Alert Generator */}
                  {dynamicBills.filter(b => b.isOverdue || (!b.isPaid && b.payday === "Due Now")).map(overdueBill => (
                    <div key={`alert-${overdueBill.id}`} className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                      <div className="flex gap-4">
                        <div className="mt-1"><AlertCircle size={20} className="text-red-500" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Action Required</h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Now</span>
                          </div>
                          <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            Your {overdueBill.name} bill is currently due.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {dynamicBills.filter(b => b.isOverdue || (!b.isPaid && b.payday === "Due Now")).length === 0 && (
                    <div className="py-12 text-center text-slate-400 font-bold text-sm">
                      <CheckCircle2 size={32} className="mx-auto mb-3 text-[#10B981] opacity-50" />
                      All caught up! No active alerts.
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. ADD ACCOUNT MODAL */}
        {isAddAccountOpen && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddAccountOpen(false)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setIsAddAccountOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}><X size={18} strokeWidth={3} /></button>
              <div className="px-8 pt-6 pb-12 overflow-y-auto hide-scrollbar">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <h2 className={`text-xl font-black tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Add New Account</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Account Name (e.g., Citi)" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                  <input type="number" placeholder="Starting Balance (e.g., 500.00)" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                  <div className="relative">
                    <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Account Type</label>
                    <select value={newAccType} onChange={(e) => setNewAccType(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <option value="Checking">Checking</option><option value="Savings">Savings</option>
                      <option value="Cash">Cash</option><option value="Credit Card">Credit Card</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Short Description" value={newAccDesc} onChange={(e) => setNewAccDesc(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                </div>
                <button onClick={handleAddAccount} disabled={!newAccName.trim() || isNaN(parseFloat(newAccBalance))} className={`w-full mt-8 h-14 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${!newAccName.trim() || isNaN(parseFloat(newAccBalance)) ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
                  Create Vault
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. TRANSFER FUNDS MODAL */}
        {isTransferOpen && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsTransferOpen(false)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setIsTransferOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}><X size={18} strokeWidth={3} /></button>
              <div className="px-8 pt-6 pb-4 overflow-y-auto hide-scrollbar">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <h2 className={`text-xl font-black tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Transfer Funds</h2>
                <div className="space-y-3 mb-6">
                  <div className={`flex items-center justify-between p-3 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-12">From</span>
                    <select className={`flex-1 bg-transparent font-bold text-sm outline-none ${isDarkMode ? "text-white" : "text-slate-900"}`} value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}>
                      <option value="" disabled>Select Account</option>
                      {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>)}
                    </select>
                  </div>
                  <div className="flex justify-center -my-5 relative z-10 pointer-events-none">
                    <div className={`p-1.5 rounded-full border ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-white border-slate-200 text-slate-400"}`}><ArrowDown size={14} /></div>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-12">To</span>
                    <select className={`flex-1 bg-transparent font-bold text-sm outline-none ${isDarkMode ? "text-white" : "text-slate-900"}`} value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                      <option value="" disabled>Select Account</option>
                      {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>)}
                    </select>
                  </div>
                </div>
                <div className="text-center mb-2 flex justify-center items-center relative">
                  <span className="text-5xl font-extrabold tracking-tighter text-[#1877F2]">${transferAmount}</span>
                  <button onClick={() => setTransferAmount(transferAmount.slice(0, -1) || "0")} className="absolute right-0 text-slate-400 p-2">⌫</button>
                </div>
              </div>
              <div className={`p-6 mt-auto rounded-b-[3rem] shrink-0 ${isDarkMode ? "bg-[#0F172A]" : "bg-slate-50"}`}>
                <div className="grid grid-cols-4 gap-3">
                  {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                    <button key={btn} onClick={() => {
                        if (btn === "=") {
                          try {
                            const toEval = transferAmount.replace(/×/g, "*").replace(/÷/g, "/");
                            if (/^[0-9+\-*/. ]+$/.test(toEval)) setTransferAmount(String(Function('"use strict";return (' + toEval + ")")()));
                          } catch (e) { setTransferAmount("0"); }
                        } else if (transferAmount === "0" && btn !== ".") { setTransferAmount(btn); }
                        else { setTransferAmount(transferAmount + btn); }
                      }} className={`h-14 rounded-2xl text-xl font-bold flex items-center justify-center shadow-sm ${["÷", "×", "-", "+", "="].includes(btn) ? isDarkMode ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500" : isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"}`}>{btn}</button>
                  ))}
                </div>
                <button onClick={executeTransfer} disabled={!transferFrom || !transferTo || transferAmount === "0" || transferFrom === transferTo} className={`w-full mt-4 h-14 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${!transferFrom || !transferTo || transferAmount === "0" || transferFrom === transferTo ? "bg-slate-300 text-slate-500" : "bg-[#1877F2] text-white"}`}>Confirm Transfer</button>
              </div>
            </div>
          </div>
        )}

        {/* 8. QUICK ADD 2.0 (FAB) MODAL */}
        {isFabOpen && (() => {
          const activeText = drawerTab === "bills" ? "text-[#1877F2]" : drawerTab === "income" ? "text-[#10B981]" : "text-[#F97316]";
          const activeBg = drawerTab === "bills" ? "bg-[#1877F2]" : drawerTab === "income" ? "bg-[#10B981]" : "bg-[#F97316]";
          const activeShadow = drawerTab === "bills" ? "shadow-blue-500/40" : drawerTab === "income" ? "shadow-emerald-500/40" : "shadow-orange-500/40";
          const activeSoftBg = drawerTab === "bills" ? (isDarkMode ? "bg-blue-900/20" : "bg-blue-50") : drawerTab === "income" ? (isDarkMode ? "bg-emerald-900/20" : "bg-emerald-50") : (isDarkMode ? "bg-orange-900/20" : "bg-orange-50");
          const activeLabel = drawerTab === "bills" ? "New Bill" : drawerTab === "income" ? "New Income" : "New Expense";
          
          return (
            <div className="absolute inset-0 z-[60] flex items-end">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={closeFab}></div>
              <div className={`w-full rounded-t-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
                <button onClick={closeFab} className="absolute top-5 right-5 p-2 rounded-full z-20"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
                
                <div className={`px-6 pt-6 pb-6 border-b shrink-0 transition-colors duration-500 ${activeSoftBg} rounded-t-[2.5rem]`}>
                  <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 opacity-30 ${activeBg}`}></div>
                  
                  {fabStep === 1 ? (
                    <div className={`flex rounded-xl p-1 mb-6 mx-auto max-w-[280px] border shadow-sm ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white/80 border-slate-200 backdrop-blur-md"}`}>
                      <button onClick={() => { setDrawerTab("bills"); setEntryIcon("🏠"); }} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "bills" ? `${activeBg} text-white shadow-md` : "text-slate-400"}`}>Bills</button>
                      <button onClick={() => setDrawerTab("income")} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "income" ? `${activeBg} text-white shadow-md` : "text-slate-400"}`}>Income</button>
                      <button onClick={() => { setDrawerTab("transactions"); setEntryIcon("💳"); }} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "transactions" ? `${activeBg} text-white shadow-md` : "text-slate-400"}`}>Activity</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mb-6 -mt-2">
                      <button onClick={() => setFabStep(1)} className={`p-2 rounded-full transition-colors ${activeText} hover:bg-white/50`}><ArrowRight className="rotate-180" size={20} /></button>
                      <div className="flex flex-col">
                        <h3 className={`font-black text-sm uppercase tracking-widest ${activeText}`}>{activeLabel} Details</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step 2 of 2</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center relative flex justify-center items-center">
                    <span className={`text-6xl font-extrabold tracking-tighter drop-shadow-sm transition-colors duration-300 ${activeText}`}>${inputValue}</span>
                    {fabStep === 1 && <button onClick={() => setInputValue(inputValue.slice(0, -1) || "0")} className={`absolute right-4 p-3 rounded-full hover:bg-white/50 transition-colors ${activeText} opacity-70 hover:opacity-100`}>⌫</button>}
                  </div>
                </div>

                <div className={`p-6 mt-auto rounded-b-[2.5rem] flex-1 flex flex-col overflow-y-auto ${isDarkMode ? "bg-[#0F172A]" : "bg-white"}`}>
                  {fabStep === 1 ? (
                    <>
                      <div className="grid grid-cols-4 gap-3 mt-2">
                        {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => {
                          const isOp = ["÷", "×", "-", "+", "="].includes(btn);
                          return (
                            <button 
                              key={btn} 
                              onClick={() => handleNumpad(btn)} 
                              className={`h-14 rounded-2xl text-2xl font-bold flex items-center justify-center transition-all active:scale-95 ${isOp ? isDarkMode ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-500 border border-slate-200" : isDarkMode ? "bg-[#1E293B] text-white shadow-sm" : "bg-white text-slate-800 shadow-sm border border-slate-100"}`}
                            >
                              {btn}
                            </button>
                          );
                        })}
                      </div>
                      <button onClick={() => { if (parseFloat(inputValue) > 0) setFabStep(2); }} disabled={parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue))} className={`w-full mt-6 h-16 rounded-2xl font-black uppercase tracking-widest text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue)) ? "bg-slate-300 opacity-50 shadow-none cursor-not-allowed" : `${activeBg} ${activeShadow} hover:-translate-y-1`}`}>
                        Continue to Details <ArrowRight size={18} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col h-full animate-fade-in">
                      <div className="space-y-5 flex-1 pb-6">
                        
                        <div className="relative">
                           <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{drawerTab === 'income' ? 'Source / Payer' : drawerTab === 'transactions' ? 'Merchant' : 'Bill Name'}</label>
                           <input type="text" placeholder="e.g., Netflix, Salary, Target" value={entryName} onChange={(e) => setEntryName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white focus:border-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"}`} />
                        </div>

                        {drawerTab === "bills" && (
                          <div className="relative">
                             <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Due Date</label>
                             <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white focus:border-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"}`} />
                          </div>
                        )}

                        {(drawerTab === "income" || drawerTab === "transactions") && (
                          <div className="relative">
                             <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Select Account</label>
                             <select value={entryAccount} onChange={(e) => setEntryAccount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors appearance-none ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                               <option value="" disabled>Select Account...</option>
                               {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>))}
                             </select>
                          </div>
                        )}

                        <div className="relative">
                           <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Icon / Emoji</label>
                           <select value={entryIcon} onChange={(e) => setEntryIcon(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-xl border focus:outline-none transition-colors appearance-none ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                             {categoryEmojis.map((emoji) => (<option key={emoji} value={emoji}>{emoji}</option>))}
                           </select>
                        </div>

                        {drawerTab === "bills" && (
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                            
                            {/* NEW: RECURRING TOGGLE */}
                            <div className="flex items-center justify-between cursor-pointer mb-5" onClick={() => setEntryIsRecurring(!entryIsRecurring)}>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${entryIsRecurring ? activeText : "text-slate-400"}`}>Recurring Monthly?</span>
                              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${entryIsRecurring ? activeBg : "bg-slate-300 dark:bg-slate-600"}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${entryIsRecurring ? "translate-x-4" : "translate-x-0"}`}></div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => setEntryIsInstallment(!entryIsInstallment)}>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${entryIsInstallment ? activeText : "text-slate-400"}`}>Installment Plan?</span>
                              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${entryIsInstallment ? activeBg : "bg-slate-300 dark:bg-slate-600"}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${entryIsInstallment ? "translate-x-4" : "translate-x-0"}`}></div>
                              </div>
                            </div>
                            
                            {entryIsInstallment && (
                              <div className="mt-4 space-y-3 animate-fade-in">
                                <input type="number" placeholder="Total Full Balance (e.g., 5000)" value={entryTotalAmount} onChange={(e) => setEntryTotalAmount(e.target.value)} className={`w-full py-3 px-4 rounded-xl font-bold text-sm border focus:outline-none ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                                <input type="number" placeholder="Already Paid (Optional)" value={entryPaidAmount} onChange={(e) => setEntryPaidAmount(e.target.value)} className={`w-full py-3 px-4 rounded-xl font-bold text-sm border focus:outline-none ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                      <button onClick={handleConfirmAction} className={`w-full mt-4 h-16 shrink-0 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${activeBg} ${activeShadow}`}>
                        Confirm & Save <CheckCircle2 size={18} />
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        );
        })()}

        {/* 9. TO-DO DELETE MODAL */}
        {selectedTodo && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTodo(null)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setSelectedTodo(null)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
              </button>

              <div className="px-8 pt-6 pb-10 flex flex-col items-center text-center">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                   {selectedTodo.type === "shopping" ? "🛒" : "📋"}
                </div>
                <h3 className={`text-2xl font-black mb-1 tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedTodo.text}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-8 ${selectedTodo.isCompleted ? "text-emerald-500" : "text-[#1877F2]"}`}>
                  {selectedTodo.isCompleted ? "Completed" : "Pending"} • Priority {selectedTodo.priority}
                </p>
                <button 
                  onClick={async () => {
                    await deleteDoc(doc(db, "users", user.uid, "todos", selectedTodo.id));
                    triggerHaptic();
                    setSelectedTodo(null);
                  }}
                  className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-transform active:scale-95"
                >
                  <Trash2 size={18} /> Delete {selectedTodo.type === "shopping" ? "Item" : "Task"}
                </button>
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
