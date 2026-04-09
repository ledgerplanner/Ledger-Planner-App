import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Home, Wallet, CreditCard, Calendar as CalendarIcon, CheckSquare,
  CheckCircle2, Circle, Bell, Moon, Sun, ChevronUp, ChevronDown, Mail,
  Lock, Trash2, Edit2, Loader2, X, ArrowRightLeft, ArrowDown, List,
  AlertCircle, Search, Star, ArrowRight, PlusCircle, Settings2, LogOut
} from "lucide-react";

// === FIREBASE INITIALIZATION ===
import { initializeApp } from "firebase/app";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut 
} from "firebase/auth";
import { 
  getFirestore, collection, doc, setDoc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, orderBy, serverTimestamp 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRtXAjd-2KpZOlQL-bWrGoz6S3HuK4jDI",
  authDomain: "ledger-planner-38ab7.firebaseapp.com",
  projectId: "ledger-planner-38ab7",
  storageBucket: "ledger-planner-38ab7.firebasestorage.app",
  messagingSenderId: "624261529539",
  appId: "1:624261529539:web:80aec4cca266a3a6008776"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  // === APP & AUTH STATE ===
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const scrollRef = useRef(null);

  // === UI INTERACTION STATE ===
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editEntryAmount, setEditEntryAmount] = useState("0");
  const [collapsedPaydays, setCollapsedPaydays] = useState({
    "Payday 2": true, "Payday 3": true, "Payday 4": true, "Payday 5": true,
  });
  const [activeChartNode, setActiveChartNode] = useState(5);

  // === PAYDAY CONFIGURATION STATE ===
  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  const [paydayConfig, setPaydayConfig] = useState({
    "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" },
    "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" },
    "Payday 5": { date: "", income: "" },
  });
  const [editPaydayConfig, setEditPaydayConfig] = useState(paydayConfig);
  const [paymentModalConfig, setPaymentModalConfig] = useState({ isOpen: false, billId: null, accountId: "" });

  // === QUICK ADD (FAB) STATE ===
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

  const categoryEmojis = [
    "📋", "🏠", "💧", "⚡", "📺", "🚗", "⛽", "🚕", "🚇", "✈️", "🌴", "🏋️",
    "💳", "🎓", "🛒", "🛍️", "👗", "👟", "💅", "💈", "🍔", "🌮", "🍣", "☕",
    "🍻", "🍹", "🏥", "💊", "🐶", "🐾", "🎉", "🎟️", "🎬", "🎮", "🕹️", "📱",
    "💻", "💼", "💵", "💰", "₿", "💎", "⌚",
  ];

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

  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("All");

  // === FIREBASE CLOUD DATA STATE ===
  const [bills, setBills] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoType, setNewTodoType] = useState("task");
  const [selectedTodo, setSelectedTodo] = useState(null);

  // === LOGIN STATE ===
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

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

    // Sync Accounts
    const unsubAcc = onSnapshot(collection(userRef, "accounts"), (snap) => {
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Sync Bills
    const unsubBills = onSnapshot(collection(userRef, "bills"), (snap) => {
      setBills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Sync Transactions
    const unsubTxs = onSnapshot(query(collection(userRef, "transactions"), orderBy("createdAt", "desc")), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Sync Todos
    const unsubTodos = onSnapshot(query(collection(userRef, "todos"), orderBy("createdAt", "desc")), (snap) => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Sync Payday Config
    const unsubConfig = onSnapshot(doc(userRef, "settings", "paydayConfig"), (docSnap) => {
      if (docSnap.exists()) {
        setPaydayConfig(docSnap.data());
      }
    });

    return () => { unsubAcc(); unsubBills(); unsubTxs(); unsubTodos(); unsubConfig(); };
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === AUTHENTICATION ACTIONS ===
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError("");
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      let errorMsg = "Authentication failed. Please try again.";
      if (error.code === 'auth/invalid-credential') errorMsg = "Invalid email or password.";
      if (error.code === 'auth/email-already-in-use') errorMsg = "An account with this email already exists.";
      setAuthError(errorMsg);
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab("home");
  };

  // === HERO MATH ENGINE ===
  const userName = user?.email?.split('@')[0] || "Founder";
  const totalIncomeBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const unpaidBillsAmount = bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  const aaronsBalance = totalIncomeBalance - unpaidBillsAmount;
  const isNegative = aaronsBalance < 0;

  const strokeDasharray = 251.2;
  const safePercentage = totalIncomeBalance > 0 ? Math.max(0, Math.min((aaronsBalance / totalIncomeBalance) * 100, 100)) : 0;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * safePercentage) / 100;

  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatPaydayDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return dateString;
  };

  // === SMART PAYMENT ROUTING ENGINE ===
  const handleBillClick = async (id) => {
    const bill = bills.find(b => b.id === id);
    if (!bill.isPaid) {
      setPaymentModalConfig({
        isOpen: true, billId: id, accountId: accounts.find(a => a.type === "Checking" || a.type === "Cash")?.id || (accounts[0]?.id || "")
      });
    } else {
      // Unpay logic
      const refundAccountId = bill.paidFromAccountId;
      const targetAcc = accounts.find(a => a.id === refundAccountId);
      
      let newPaidAmount = bill.paidAmount;
      if (bill.isInstallment) newPaidAmount = bill.paidAmount - bill.amount;

      await updateDoc(doc(db, "users", user.uid, "bills", id), {
        isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null, linkedTxId: null
      });

      if (targetAcc) {
        await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), {
          balance: targetAcc.balance + bill.amount
        });
      }

      if (bill.linkedTxId) {
        await deleteDoc(doc(db, "users", user.uid, "transactions", bill.linkedTxId));
      }
    }
  };

  const confirmPaymentRoute = async () => {
    const bill = bills.find(b => b.id === paymentModalConfig.billId);
    const targetAcc = accounts.find(a => a.id === paymentModalConfig.accountId);
    if (!bill || !targetAcc) return;

    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    
    // 1. Create Transaction
    const txRef = await addDoc(collection(db, "users", user.uid, "transactions"), {
      name: bill.name, icon: bill.icon, amount: bill.amount, date: autoTimeStamp, 
      type: "Expense", category: "Bill Payment", accountId: targetAcc.id, createdAt: serverTimestamp()
    });

    // 2. Update Bill
    let newPaidAmt = bill.paidAmount;
    if (bill.isInstallment) newPaidAmt = bill.paidAmount + bill.amount;
    await updateDoc(doc(db, "users", user.uid, "bills", bill.id), {
      isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id
    });

    // 3. Deduct from Account
    await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), {
      balance: targetAcc.balance - bill.amount
    });

    setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
  };

  // === ACTIONS ===
  const changeTab = (tabId) => { setActiveTab(tabId); if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" }); };
  const toggleCollapse = (payday) => setCollapsedPaydays((prev) => ({ ...prev, [payday]: !prev[payday] }));

  const handleAddAccount = async () => {
    const startBal = parseFloat(newAccBalance);
    if (!newAccName.trim() || isNaN(startBal)) return;
    
    const isCreditCard = newAccType === "Credit Card";
    const finalBalance = isCreditCard ? -Math.abs(startBal) : Math.abs(startBal);
    const getIcon = (type) => {
      if (type === "Credit Card") return "💳";
      if (type === "401k / Retirement") return "🌴";
      if (type === "Savings") return "📈";
      return "🏦";
    };

    const accRef = await addDoc(collection(db, "users", user.uid, "accounts"), {
      name: newAccName, type: newAccType, description: newAccDesc, balance: finalBalance, icon: getIcon(newAccType)
    });

    if (Math.abs(startBal) > 0) {
      const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        name: `${newAccName} (Opening)`, icon: getIcon(newAccType), amount: Math.abs(startBal), 
        date: autoTimeStamp, type: isCreditCard ? "Expense" : "Income", 
        category: isCreditCard ? "Initial Debt" : "Opening Balance", accountId: accRef.id, createdAt: serverTimestamp()
      });
    }

    setIsAddAccountOpen(false); setNewAccName(""); setNewAccBalance(""); setNewAccDesc(""); setNewAccType("Checking");
  };

  const executeTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0 || !transferFrom || !transferTo) return;
    
    const fromAcc = accounts.find(a => a.id === transferFrom);
    const toAcc = accounts.find(a => a.id === transferTo);
    
    await updateDoc(doc(db, "users", user.uid, "accounts", fromAcc.id), { balance: fromAcc.balance - amt });
    await updateDoc(doc(db, "users", user.uid, "accounts", toAcc.id), { balance: toAcc.balance + amt });

    setIsTransferOpen(false); setTransferAmount("0"); setTransferFrom(""); setTransferTo("");
  };

  const updateAccountBalance = async () => {
    const newBal = parseFloat(editAccountBalance);
    if (isNaN(newBal)) return;
    const isCreditCard = selectedAccount.type === "Credit Card";
    const finalBalance = isCreditCard ? -Math.abs(newBal) : Math.abs(newBal);
    await updateDoc(doc(db, "users", user.uid, "accounts", selectedAccount.id), { balance: finalBalance });
    setSelectedAccount(null);
  };

  const toggleTodoStatus = async (id) => {
    const todo = todos.find(t => t.id === id);
    await updateDoc(doc(db, "users", user.uid, "todos", id), { isCompleted: !todo.isCompleted });
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    await addDoc(collection(db, "users", user.uid, "todos"), {
      text: newTodoText, priority: newTodoPriority, type: newTodoType, isCompleted: false, createdAt: serverTimestamp()
    });
    setNewTodoText(""); setNewTodoPriority(3);
  };

  const closeFab = () => {
    setIsFabOpen(false); setFabStep(1); setInputValue("0"); setEntryName("");
    setEntryDate(""); setEntryIcon("🏠"); setEntryAccount(""); setEntryIsInstallment(false);
    setEntryTotalAmount(""); setEntryPaidAmount("");
  };

  const handleNumpad = (btn) => {
    if (btn === "=") {
      try {
        const toEval = inputValue.replace(/×/g, "*").replace(/÷/g, "/");
        if (/^[0-9+\-*/. ]+$/.test(toEval)) {
          // eslint-disable-next-line no-new-func
          setInputValue(String(Function('"use strict";return (' + toEval + ")")()));
        }
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
    } else if (drawerTab === "income") {
      const targetAcc = accounts.find(a => a.id === entryAccount) || accounts.find(a => a.type === "Checking") || accounts[0];
      if (targetAcc) {
        await addDoc(collection(db, "users", user.uid, "transactions"), {
          name: entryName || "Income Deposit", icon: "💵", amount: amountToProcess, date: autoTimeStamp, 
          type: "Income", category: "Deposit", accountId: targetAcc.id, createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance + amountToProcess });
      }
    } else if (drawerTab === "transactions") {
      const targetAcc = accounts.find(a => a.id === entryAccount) || accounts[0];
      if (targetAcc) {
        await addDoc(collection(db, "users", user.uid, "transactions"), {
          name: entryName || "New Expense", icon: entryIcon || "💳", amount: amountToProcess, date: autoTimeStamp, 
          type: "Expense", category: "Purchase", accountId: targetAcc.id, createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance - amountToProcess });
      }
    }
    closeFab();
  };

  const renderStars = (priority) => (
    <div className="flex gap-[2px] mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={10} className={star <= priority ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-700"} />
      ))}
    </div>
  );

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
        <div className="flex items-center gap-2">
          <button onClick={() => setIsNotificationsOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
            <Bell size={18} />
            <span className={`absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 ${isDarkMode ? "border-[#1E293B]" : "border-white"}`}></span>
          </button>
        </div>
      </div>
      <div className="flex justify-between items-end mb-6 relative z-10">
        <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h2>
        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2"><LogOut size={20} /></button>
      </div>
      {graphicContent}
      <div className={`relative z-10 pt-4 border-t flex justify-between items-center ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{formattedDate}</span>
        <span className="text-[9px] font-black uppercase tracking-wider text-[#1877F2]">{formattedTime}</span>
      </div>
    </header>
  );

  // ==========================================
  // VIEW 1: LOGIN SCREEN
  // ==========================================
  if (isAuthLoading) {
    return <div className="h-screen bg-[#F8FAFC] flex justify-center items-center font-sans"><Loader2 className="animate-spin text-[#1877F2]" size={48} /></div>;
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex justify-center font-sans overflow-hidden">
        <div className="w-full max-w-md bg-white h-full relative shadow-2xl flex flex-col px-8 pt-24 pb-10">
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white overflow-hidden bg-white">
              <img src="/login-logo.png" alt="Ledger Planner Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-center mb-2">
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] block leading-none mb-1">Ledger</span>
              <span className="text-xl font-black text-[#1877F2] uppercase tracking-[0.15em] block leading-tight">Planner</span>
            </div>
            <p className="text-sm font-bold text-slate-400 mt-4 tracking-wide uppercase">{isLoginMode ? "Secure Entrance" : "Create Account"}</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-5 flex-1">
            {authError && <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16} /> {authError}</div>}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Email</label>
              <div className="relative">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#1877F2]" placeholder="name@email.com" />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#1877F2]" placeholder="••••••••" />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>
            <button type="submit" disabled={!email || !password} className={`w-full mt-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!email || !password ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#1877F2] text-white shadow-[0_8px_20px_rgba(24,119,242,0.3)]"}`}>
              {isLoginMode ? "Unlock Vault" : "Initialize Account"}
            </button>
            <div className="text-center mt-6">
              <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(""); }} className="text-xs font-bold text-slate-400 hover:text-[#1877F2] transition-colors">
                {isLoginMode ? "Need an account? Create one." : "Already have an account? Log in."}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: HOME PAGE
  // ==========================================
  const renderHome = () => {
    const billsByPayday = {};
    ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach((pd) => { billsByPayday[pd] = []; });
    bills.forEach((bill) => { if (billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });

    const graphicContent = (
      <div className="flex items-center justify-between relative z-10 mb-6">
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="redGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="12" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke={isNegative ? "url(#redGlow)" : "url(#blueGlow)"} strokeWidth="12" strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Left</span>
            <span className={`text-2xl font-black ${isNegative ? "text-red-500" : "text-[#1877F2]"}`}>{Math.round(safePercentage)}%</span>
          </div>
        </div>
        <div className="flex-1 pl-6 text-right">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-3 ${isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isNegative ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{userName}'s Balance</span>
          </div>
          <p className={`text-4xl font-black tracking-tighter mb-4 ${isNegative ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
            ${aaronsBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-end gap-2 text-xs font-bold uppercase">
              <span className="text-slate-400 text-[10px]">Total Income</span>
              <span className={isDarkMode ? "text-emerald-400 bg-emerald-900/30 px-2 rounded" : "text-emerald-600 bg-emerald-50 px-2 rounded"}>
                ${totalIncomeBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold uppercase">
              <span className="text-slate-400 text-[10px]">Unpaid</span>
              <span className={isDarkMode ? "text-slate-300 bg-slate-800 px-2 rounded" : "text-slate-700 bg-slate-100 px-2 rounded"}>
                ${unpaidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`Hi, ${userName} 🚀`, graphicContent)}

        <main className="px-6 space-y-4">
          <div className="flex justify-between items-center px-1 mt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pay Day Setup</h3>
            <button onClick={() => { setEditPaydayConfig(paydayConfig); setIsPaydaySetupOpen(true); }} className={`text-[9px] font-black uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-800 text-[#1877F2] hover:bg-slate-700" : "bg-blue-50 text-[#1877F2] hover:bg-blue-100"}`}>
              <Settings2 size={12} strokeWidth={3} /> Configure
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-2 -mx-2 px-3 snap-x">
            {["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((pd) => {
              const pdSettings = paydayConfig[pd];
              const isSet = pdSettings && (pdSettings.date || pdSettings.income);
              return (
                <div key={pd} className={`min-w-[140px] p-4 rounded-3xl snap-center shrink-0 border transition-all ${isSet ? isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100 shadow-sm" : isDarkMode ? "bg-slate-800/30 border-dashed border-slate-700" : "bg-slate-50 border-dashed border-slate-200"}`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isSet ? "text-[#1877F2]" : "text-slate-400"}`}>{pd}</p>
                  <p className={`text-lg font-black tracking-tight mb-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {pdSettings?.income ? `$${parseFloat(pdSettings.income).toLocaleString()}` : "$0.00"}
                  </p>
                  <p className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            {Object.entries(billsByPayday).map(([payday, groupBills]) => {
              if (payday === "Due Now" && groupBills.length === 0) return null;
              const pdSettings = paydayConfig[payday];
              if (!pdSettings?.date && !pdSettings?.income && groupBills.length === 0) return null;

              const isDueNow = payday === "Due Now";
              const isCollapsed = collapsedPaydays[payday];
              const checkTotal = groupBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
              const expectedDateStr = isDueNow ? "Currently Due" : pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled";
              const sortedBills = [...groupBills].sort((a, b) => a.date - b.date);

              return (
                <div key={payday} className="space-y-2">
                  <div className="flex justify-between items-center px-3 py-1 cursor-pointer" onClick={() => toggleCollapse(payday)}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{payday}</h3>
                        <div className="text-slate-400">{isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{expectedDateStr}</span>
                    </div>
                    <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      ${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {!isCollapsed && (
                    <div className={`rounded-[2rem] p-3 border ${isDueNow ? isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100" : isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                      {sortedBills.length === 0 ? (
                        <p className="text-center text-xs font-bold text-slate-400 py-4">No bills assigned to this payday.</p>
                      ) : (
                        sortedBills.map((bill, idx) => (
                          <div key={bill.id} className={`flex flex-col p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== sortedBills.length - 1 ? "mb-1" : ""}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                                  {bill.isPaid ? <CheckCircle2 className="text-[#1877F2] hover:scale-110 transition-transform" size={28} /> : <Circle className={`${isDarkMode ? "text-slate-600 hover:text-slate-500" : "text-slate-200 hover:text-slate-300"} hover:scale-110 transition-transform`} size={28} />}
                                </div>
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${bill.isOverdue ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>{bill.icon}</div>
                                  <div>
                                    <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{bill.isOverdue ? "Overdue • " : "Due "} {bill.fullDate}</p>
                                  </div>
                                </div>
                              </div>
                              <div className={`font-black text-sm tracking-tight cursor-pointer ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`} onClick={() => setSelectedEntry(bill)}>
                                ${bill.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Recent Activity</h3>
            <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              {transactions.length === 0 ? (
                <div className="py-8 text-center"><p className="font-bold text-sm text-slate-400">No recent activity.</p></div>
              ) : (
                transactions.slice(0, 5).map((tx, idx) => (
                  <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== Math.min(transactions.length, 5) - 1 ? "mb-1" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>{tx.icon}</div>
                      <div>
                        <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</p>
                      </div>
                    </div>
                    <div className={`font-black text-sm tracking-tight ${tx.type === "Income" ? "text-emerald-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  };

  // ==========================================
  // VIEW 3: ACCOUNTS PAGE
  // ==========================================
  const renderAccounts = () => {
    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
    const historyData = [{ label: "Apr", val: netWorth }];
    const activeDataPoint = historyData[0];

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Accounts`, (
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth</p>
              <p className={`text-5xl font-black tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                ${activeDataPoint.val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
        <main className="px-6 space-y-6">
          <button onClick={() => setIsTransferOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1877F2] text-white shadow-blue-900/20" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
            <ArrowRightLeft size={16} /> Transfer Funds
          </button>
          <button onClick={() => setIsAddAccountOpen(true)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
            <PlusCircle size={16} /> Add New Account
          </button>
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">All Accounts</h3>
            <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              {accounts.map((acc, idx) => {
                const isDebt = acc.type === "Credit Card";
                return (
                  <div key={acc.id} onClick={() => { setSelectedAccount(acc); setEditAccountBalance(Math.abs(acc.balance).toString()); }} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== accounts.length - 1 ? "mb-1" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl bg-opacity-10 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"}`}>{acc.icon}</div>
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
  };

  // ==========================================
  // VIEW 4: BILLS PAGE
  // ==========================================
  const renderBills = () => {
    const totalBillsAmount = bills.reduce((sum, b) => sum + b.amount, 0);
    const paidBillsAmount = bills.filter((b) => b.isPaid).reduce((sum, b) => sum + b.amount, 0);
    const remainingAmount = totalBillsAmount - paidBillsAmount;
    const progressPercentage = Math.round((paidBillsAmount / totalBillsAmount) * 100) || 0;
    const unpaidBills = [...bills].filter((b) => !b.isPaid).sort((a, b) => a.date - b.date);
    const paidBills = [...bills].filter((b) => b.isPaid).sort((a, b) => a.date - b.date);

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Bills`, (
          <div className="flex items-center justify-between relative z-10 mb-6">
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#1E293B" : "#F1F5F9"} strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeLinecap="round" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{progressPercentage}%</span>
              </div>
            </div>
            <div className="flex-1 pl-8 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining This Month</p>
              <p className={`text-4xl font-black tracking-tighter mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>${remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        ))}
        <main className="px-6 space-y-8">
          <div className="space-y-4 mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">To Pay</h3>
            <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              {unpaidBills.map((bill, idx) => (
                <div key={bill.id} className={`flex flex-col p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                        <Circle className={`${isDarkMode ? "text-slate-600 hover:text-[#1877F2]" : "text-slate-300 hover:text-[#1877F2]"} hover:scale-110 transition-all duration-300`} size={28} />
                      </div>
                      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>{bill.icon}</div>
                        <div>
                          <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{bill.fullDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`font-black text-sm tracking-tight cursor-pointer ${isDarkMode ? "text-white" : "text-slate-900"}`} onClick={() => setSelectedEntry(bill)}>
                      ${bill.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  };

  // ==========================================
  // VIEW 5: ACTIVITY PAGE
  // ==========================================
  const renderActivity = () => {
    const filteredTxs = transactions.filter((tx) => {
      const matchesSearch = tx.name.toLowerCase().includes(activitySearch.toLowerCase());
      const matchesFilter = activityFilter === "All" || tx.type === activityFilter;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Activities`, <div className="mb-6"><p className="text-xl font-black text-white">Recent Transactions</p></div>)}
        <main className="px-6 space-y-6">
          <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {filteredTxs.map((tx, idx) => (
              <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>{tx.icon}</div>
                  <div>
                    <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{tx.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</p>
                  </div>
                </div>
                <div className={`font-black text-sm tracking-tight ${tx.type === "Income" ? "text-emerald-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  };

  // ==========================================
  // VIEW 6: TO-DO PAGE
  // ==========================================
  const renderTodo = () => {
    const activeTasks = todos.filter((t) => !t.isCompleted).sort((a, b) => b.priority - a.priority);

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Action Center`, <div className="mb-6"><p className="text-xl font-black text-white">Task Management</p></div>)}
        <main className="px-6 space-y-8">
          <form onSubmit={handleAddTodo} className={`p-4 rounded-3xl border shadow-sm transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            <input type="text" placeholder="Add a new item..." value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} className={`w-full py-3 px-4 mb-4 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400"}`} />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 pl-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={18} onClick={() => setNewTodoPriority(star)} className={`cursor-pointer transition-colors ${star <= newTodoPriority ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-700"}`} />
                ))}
              </div>
              <button type="submit" disabled={!newTodoText.trim()} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${!newTodoText.trim() ? "bg-slate-300 text-slate-500" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}><Plus size={24} strokeWidth={3} /></button>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Pending Actions</h3>
            <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              {activeTasks.map((todo) => (
                <div key={todo.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative p-1 z-10 cursor-pointer" onClick={() => toggleTodoStatus(todo.id)}>
                      <Circle className={`${isDarkMode ? "text-slate-600 hover:text-[#1877F2]" : "text-slate-300 hover:text-[#1877F2]"} hover:scale-110 transition-all duration-300`} size={26} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <p className={`font-bold text-sm leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{todo.text}</p>
                      {renderStars(todo.priority)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  };

  // ==========================================
  // MAIN APP RETURN (OVERLAYS & NAV)
  // ==========================================
  return (
    <div className={`h-screen font-sans relative overflow-hidden flex justify-center transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <div className={`w-full max-w-md h-full relative shadow-2xl flex flex-col transition-colors duration-500 overflow-hidden ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        <div className="flex-1 overflow-y-auto hide-scrollbar" ref={scrollRef}>
          {activeTab === "home" && renderHome()}
          {activeTab === "accounts" && renderAccounts()}
          {activeTab === "bills" && renderBills()}
          {activeTab === "activity" && renderActivity()}
          {activeTab === "todo" && renderTodo()}
        </div>

        {/* OVERLAYS & DRAWERS */}
        {selectedEntry && (
          <div className="absolute inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setSelectedEntry(null); setIsEditingEntry(false); }}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col border-t max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => { setSelectedEntry(null); setIsEditingEntry(false); }} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}><X size={18} strokeWidth={3} /></button>
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
                <div className="grid grid-cols-2 gap-4 mt-auto">
                  {selectedEntry.fullDate && (
                    <button onClick={() => { handleBillClick(selectedEntry.id); setSelectedEntry(null); }} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${selectedEntry.isPaid ? "bg-slate-200 text-slate-400" : "bg-[#1877F2] text-white shadow-blue-500/20"}`}>
                      {selectedEntry.isPaid ? "Mark Unpaid" : "Mark Paid"}
                    </button>
                  )}
                </div>
                <button onClick={async () => { 
                    if (selectedEntry.fullDate) { 
                      await deleteDoc(doc(db, "users", user.uid, "bills", selectedEntry.id));
                    } else { 
                      if (selectedEntry.accountId) {
                        const acc = accounts.find(a => a.id === selectedEntry.accountId);
                        if (acc) await updateDoc(doc(db, "users", user.uid, "accounts", acc.id), { balance: selectedEntry.type === "Expense" ? acc.balance + selectedEntry.amount : acc.balance - selectedEntry.amount });
                      }
                      await deleteDoc(doc(db, "users", user.uid, "transactions", selectedEntry.id));
                    } 
                    setSelectedEntry(null); 
                  }} className="w-full mt-4 pt-4 pb-2 text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                  <Trash2 size={14} /> Delete Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT MODAL */}
        {paymentModalConfig.isOpen && (() => {
          const bill = bills.find(b => b.id === paymentModalConfig.billId);
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

        {/* ADD ACCOUNT MODAL */}
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

        {/* QUICK ADD FAB */}
        {isFabOpen && (
          <div className="absolute inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeFab}></div>
            <div className={`w-full rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={closeFab} className={`absolute top-5 right-5 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}><X size={18} strokeWidth={3} /></button>
              <div className={`px-6 pt-6 pb-4 border-b shrink-0 overflow-hidden ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
                <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}></div>
                {fabStep === 1 && (
                  <div className={`flex rounded-xl p-1 mb-6 mr-8 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <button onClick={() => { setDrawerTab("bills"); setEntryIcon("🏠"); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${drawerTab === "bills" ? isDarkMode ? "bg-slate-700 text-[#1877F2] shadow-sm" : "bg-white text-[#1877F2] shadow-sm" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Bills</button>
                    <button onClick={() => setDrawerTab("income")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${drawerTab === "income" ? isDarkMode ? "bg-slate-700 text-emerald-400 shadow-sm" : "bg-white text-[#10B981] shadow-sm" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Income</button>
                    <button onClick={() => { setDrawerTab("transactions"); setEntryIcon("💳"); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${drawerTab === "transactions" ? isDarkMode ? "bg-slate-700 text-orange-400 shadow-sm" : "bg-white text-[#F97316] shadow-sm" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Activity</button>
                  </div>
                )}
                {fabStep === 2 && (
                  <div className="flex items-center gap-4 mb-6 -mt-2">
                    <button onClick={() => setFabStep(1)} className={`p-2 rounded-full transition-colors ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>←</button>
                    <h3 className={`font-bold text-sm uppercase tracking-widest ${drawerTab === "bills" ? "text-[#1877F2]" : drawerTab === "income" ? "text-[#10B981]" : "text-[#F97316]"}`}>Add Details</h3>
                  </div>
                )}
                <div className="text-center mb-4 relative flex justify-center items-center">
                  <span className={`text-5xl font-extrabold tracking-tighter ${drawerTab === "bills" ? "text-[#1877F2]" : drawerTab === "income" ? "text-[#10B981]" : "text-[#F97316]"}`}>${inputValue}</span>
                  {fabStep === 1 && <button onClick={() => setInputValue(inputValue.slice(0, -1) || "0")} className="absolute right-0 text-slate-400 p-2 hover:text-slate-600 transition-colors">⌫</button>}
                </div>
              </div>
              <div className={`p-6 mt-auto rounded-b-[2.5rem] flex-1 flex flex-col ${fabStep === 1 ? "justify-end" : "justify-start pt-2"} overflow-y-auto hide-scrollbar ${isDarkMode ? "bg-[#0F172A]" : "bg-slate-50"}`}>
                {fabStep === 1 ? (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                        <button key={btn} onClick={() => handleNumpad(btn)} className={`h-14 rounded-2xl text-xl font-bold flex items-center justify-center transition-colors shadow-sm ${["÷", "×", "-", "+", "="].includes(btn) ? isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-100" : isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-800 hover:bg-slate-100"}`}>{btn}</button>
                      ))}
                    </div>
                    <button onClick={() => { if (parseFloat(inputValue) > 0) setFabStep(2); }} disabled={parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue))} className={`w-full mt-4 shrink-0 h-14 rounded-2xl font-bold text-lg text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue)) ? "bg-slate-300 opacity-50 cursor-not-allowed" : drawerTab === "bills" ? "bg-[#1877F2]" : drawerTab === "income" ? "bg-[#10B981]" : "bg-[#F97316]"}`}>
                      Next Step <ArrowRight size={20} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col h-full animate-fade-in">
                    <div className="space-y-4 flex-1 pb-6">
                      {drawerTab === "bills" && (
                        <>
                          <input type="text" placeholder="Bill Name" value={entryName} onChange={(e) => setEntryName(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                          <div className="relative">
                            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Due Date</label>
                            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                          </div>
                        </>
                      )}
                      {(drawerTab === "income" || drawerTab === "transactions") && (
                        <>
                          <input type="text" placeholder="Name / Source" value={entryName} onChange={(e) => setEntryName(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                          <div className="relative">
                            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Account</label>
                            <select value={entryAccount} onChange={(e) => setEntryAccount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                              <option value="" disabled>Select Account</option>
                              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    <button onClick={handleConfirmAction} className={`w-full mt-4 h-14 shrink-0 rounded-2xl font-bold text-lg text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${drawerTab === "bills" ? "bg-[#1877F2] shadow-blue-500/30" : drawerTab === "income" ? "bg-[#10B981] shadow-emerald-500/30" : "bg-[#F97316] shadow-orange-500/30"}`}>
                      Confirm Entry
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-24 right-6 z-40">
          <button onClick={() => setIsFabOpen(true)} className={`w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#1877F2] shadow-[0_12px_24px_rgba(24,119,242,0.4)] border-4 ${isDarkMode ? "border-[#0F172A]" : "border-white"}`}><Plus size={28} /></button>
        </div>

        <div className={`absolute bottom-0 left-0 w-full backdrop-blur-md border-t px-2 pt-3 pb-6 flex justify-between items-center z-40 ${isDarkMode ? "bg-[#1E293B]/95 border-slate-800" : "bg-white/95 border-slate-100"}`}>
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "accounts", icon: Wallet, label: "Accounts" },
            { id: "bills", icon: CalendarIcon, label: "Bills" },
            { id: "activity", icon: CreditCard, label: "Activity" },
            { id: "todo", icon: CheckSquare, label: "To-Do" },
          ].map((tab) => (
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
