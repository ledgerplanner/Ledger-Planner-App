import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Home,
  Wallet,
  CreditCard,
  Calendar as CalendarIcon,
  CheckSquare,
  CheckCircle2,
  Circle,
  Bell,
  Moon,
  Sun,
  ChevronUp,
  ChevronDown,
  Mail,
  Lock,
  Trash2,
  Edit2,
  Loader2,
  X,
  ArrowRightLeft,
  ArrowDown,
  List,
  AlertCircle,
  Search,
  Star,
  ArrowRight,
  PlusCircle,
  Settings2,
} from "lucide-react";

export default function App() {
  // === APP STATE ===
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const scrollRef = useRef(null);

  // === UI INTERACTION STATE ===
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editEntryAmount, setEditEntryAmount] = useState("0");

  const [collapsedPaydays, setCollapsedPaydays] = useState({
    "Payday 2": true,
    "Payday 3": true,
    "Payday 4": true,
    "Payday 5": true,
  });
  const [activeChartNode, setActiveChartNode] = useState(5);

  // === PAYDAY CONFIGURATION STATE ===
  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  const [paydayConfig, setPaydayConfig] = useState({
    "Payday 1": { date: "2026-04-05", income: "2100" },
    "Payday 2": { date: "2026-04-19", income: "2100" },
    "Payday 3": { date: "", income: "" },
    "Payday 4": { date: "", income: "" },
    "Payday 5": { date: "", income: "" },
  });
  const [editPaydayConfig, setEditPaydayConfig] = useState(paydayConfig);

  // === SMART PAYMENT ROUTING STATE (NEW) ===
  const [paymentModalConfig, setPaymentModalConfig] = useState({
    isOpen: false,
    billId: null,
    accountId: "",
  });

  // === QUICK ADD (FAB) STATE ===
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabStep, setFabStep] = useState(1);
  const [drawerTab, setDrawerTab] = useState("bills");
  const [inputValue, setInputValue] = useState("0");
  const [entryName, setEntryName] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryIcon, setEntryIcon] = useState("🏠");
  const [entryAccount, setEntryAccount] = useState("");

  // Installment Specific State
  const [entryIsInstallment, setEntryIsInstallment] = useState(false);
  const [entryTotalAmount, setEntryTotalAmount] = useState("");
  const [entryPaidAmount, setEntryPaidAmount] = useState("");

  // Curated, Modern List of Emojis
  const categoryEmojis = [
    "📋", "🏠", "💧", "⚡", "📺", "🚗", "⛽", "🚕", "🚇", "✈️", "🌴", "🏋️",
    "💳", "🎓", "🛒", "🛍️", "👗", "👟", "💅", "💈", "🍔", "🌮", "🍣", "☕",
    "🍻", "🍹", "🏥", "💊", "🐶", "🐾", "🎉", "🎟️", "🎬", "🎮", "🕹️", "📱",
    "💻", "💼", "💵", "💰", "₿", "💎", "⌚",
  ];

  // === NOTIFICATION STATE ===
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      type: "alert",
      title: "Action Required",
      message: "Your Rent payment is currently 1 day past due.",
      time: "2h ago",
      icon: <AlertCircle size={20} className="text-red-500" />,
    },
    {
      id: 2,
      type: "info",
      title: "Upcoming Payday",
      message: "Check your setup! Your next allocation window is approaching.",
      time: "5h ago",
      icon: <CalendarIcon size={20} className="text-[#1877F2]" />,
    },
    {
      id: 3,
      type: "success",
      title: "Transfer Complete",
      message: "$50.00 was successfully moved to your High-Yield account.",
      time: "1d ago",
      icon: <CheckCircle2 size={20} className="text-[#10B981]" />,
    },
  ]);

  // === TRANSFER, EDIT & ADD ACCOUNT STATE ===
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("0");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editAccountBalance, setEditAccountBalance] = useState("0");

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");
  const [newAccType, setNewAccType] = useState("Cash");
  const [newAccDesc, setNewAccDesc] = useState("");

  // === ACTIVITY STATE ===
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("All");

  // === TO-DO STATE ===
  const [todos, setTodos] = useState([
    { id: 1, text: "Call Amex about annual fee", priority: 5, type: "task", isCompleted: false },
    { id: 2, text: "Cancel Netflix subscription", priority: 3, type: "task", isCompleted: false },
    { id: 3, text: "Move $500 to High-Yield Savings", priority: 4, type: "task", isCompleted: true },
    { id: 4, text: "New running shoes", priority: 2, type: "shopping", isCompleted: false },
    { id: 5, text: "Organic groceries for meal prep", priority: 5, type: "shopping", isCompleted: false },
  ]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoType, setNewTodoType] = useState("task");
  const [selectedTodo, setSelectedTodo] = useState(null);

  // === LOGIN STATE ===
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === MOCK DATA (REALISTIC EDITION WITH INSTALLMENTS) ===
  const userName = "Aaron";

  const [bills, setBills] = useState([
    {
      id: 1, name: "Rent", icon: "🏠", amount: 1200.0, date: 1, fullDate: "Apr 1",
      payday: "Due Now", isPaid: false, isOverdue: true, isInstallment: false,
    },
    {
      id: 2, name: "Water Bill", icon: "💧", amount: 45.5, date: 2, fullDate: "Apr 2",
      payday: "Due Now", isPaid: true, isOverdue: true, isInstallment: false, paidFromAccountId: 201
    },
    {
      id: 3, name: "AEP Electric", icon: "⚡", amount: 175.0, date: 5, fullDate: "Apr 5",
      payday: "Payday 1", isPaid: false, isOverdue: false, isInstallment: false,
    },
    {
      id: 4, name: "Student Loan", icon: "🎓", amount: 350.0, date: 10, fullDate: "Apr 10",
      payday: "Payday 1", isPaid: false, isOverdue: false, isInstallment: true,
      totalAmount: 24500, paidAmount: 8500,
    },
    {
      id: 5, name: "Car Insurance", icon: "🚗", amount: 115.0, date: 18, fullDate: "Apr 18",
      payday: "Payday 1", isPaid: false, isOverdue: false, isInstallment: false,
    },
    {
      id: 6, name: "Toyota Auto Loan", icon: "🚘", amount: 450.0, date: 22, fullDate: "Apr 22",
      payday: "Payday 2", isPaid: false, isOverdue: false, isInstallment: true,
      totalAmount: 18000, paidAmount: 4500,
    },
    {
      id: 7, name: "Chase Credit Card", icon: "💳", amount: 150.0, date: 28, fullDate: "Apr 28",
      payday: "Payday 2", isPaid: false, isOverdue: false, isInstallment: false,
    },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 101, name: "Starbucks", icon: "☕", amount: 6.5, date: "Today, 8:14 AM", type: "Expense", category: "Dining" },
    { id: 102, name: "Salary", icon: "💻", amount: 2100.0, date: "Today, 10:30 AM", type: "Income", category: "Job" },
    { id: 103, name: "Shell Station", icon: "⛽", amount: 45.0, date: "Yesterday", type: "Expense", category: "Auto" },
    { id: 104, name: "Netflix", icon: "🍿", amount: 15.99, date: "Yesterday", type: "Expense", category: "Entertainment" },
    { id: 105, name: "Target", icon: "🎯", amount: 84.5, date: "Apr 1", type: "Expense", category: "Shopping" },
    { id: 106, name: "Spotify", icon: "🎵", amount: 10.99, date: "Mar 28", type: "Expense", category: "Entertainment" },
    { id: 107, name: "Uber", icon: "🚕", amount: 24.5, date: "Mar 25", type: "Expense", category: "Transport" },
  ]);

  const [accounts, setAccounts] = useState([
    { id: 201, name: "Chase Checking", type: "Cash", balance: 4250.0, icon: "🏦" },
    { id: 202, name: "Ally High-Yield", type: "Cash", balance: 12500.0, icon: "📈" },
    { id: 203, name: "Amex Gold Card", type: "Credit", balance: -845.5, icon: "💳" },
    { id: 204, name: "Toyota Auto Loan", type: "Debt", balance: -14200.0, icon: "🚘" },
  ]);

  // === HERO MATH ENGINE REWIRE ===
  const totalIncomeBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const unpaidBillsAmount = bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  const aaronsBalance = totalIncomeBalance - unpaidBillsAmount;
  const isNegative = aaronsBalance < 0;

  const strokeDasharray = 251.2;
  const safePercentage = totalIncomeBalance > 0
      ? Math.max(0, Math.min((aaronsBalance / totalIncomeBalance) * 100, 100))
      : 0;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * safePercentage) / 100;

  // === HELPERS ===
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

  // === NEW SMART PAYMENT ROUTING ENGINE ===
  const handleBillClick = (id) => {
    const bill = bills.find(b => b.id === id);
    if (!bill.isPaid) {
      // Open Smart Payment Modal to choose account
      setPaymentModalConfig({
        isOpen: true,
        billId: id,
        accountId: accounts.find(a => a.type === "Cash")?.id || accounts[0].id
      });
    } else {
      // Reverse Payment
      const refundAccountId = bill.paidFromAccountId || 201; // Default to 201 if missing
      setBills(bills.map(b => {
        if (b.id === id) {
          let newPaidAmount = b.paidAmount;
          if (b.isInstallment) newPaidAmount = b.paidAmount - b.amount;
          return { ...b, isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null };
        }
        return b;
      }));
      setAccounts(accounts.map(acc => 
        acc.id === refundAccountId ? { ...acc, balance: acc.balance + bill.amount } : acc
      ));
    }
  };

  const confirmPaymentRoute = () => {
    const bill = bills.find(b => b.id === paymentModalConfig.billId);
    const targetAccId = parseInt(paymentModalConfig.accountId);

    // 1. Mark Bill as Paid
    setBills(bills.map(b => {
      if (b.id === bill.id) {
        let newPaidAmt = b.paidAmount;
        if (b.isInstallment) newPaidAmt = b.paidAmount + b.amount;
        return { ...b, isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAccId };
      }
      return b;
    }));

    // 2. Subtract from Correct Account
    setAccounts(accounts.map(acc =>
      acc.id === targetAccId ? { ...acc, balance: acc.balance - bill.amount } : acc
    ));

    // 3. Auto-Log to Recent Activity
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    setTransactions([
      { id: Date.now(), name: bill.name, icon: bill.icon, amount: bill.amount, date: autoTimeStamp, type: "Expense", category: "Bill Payment" },
      ...transactions
    ]);

    setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
  };

  // === ACTIONS ===
  const handleFakeLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
    }, 1500);
  };

  const changeTab = (tabId) => {
    setActiveTab(tabId);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCollapse = (payday) => setCollapsedPaydays((prev) => ({ ...prev, [payday]: !prev[payday] }));

  const handleAddAccount = () => {
    const startBal = parseFloat(newAccBalance);
    if (!newAccName.trim() || isNaN(startBal)) return;
    const isDebtOrCredit = newAccType === "Debt" || newAccType === "Credit";
    const newAccount = {
      id: Date.now(), name: newAccName, type: newAccType, description: newAccDesc,
      balance: isDebtOrCredit ? -Math.abs(startBal) : Math.abs(startBal),
      icon: newAccType === "Cash" ? "🏦" : newAccType === "Credit" ? "💳" : "📉",
    };
    setAccounts([...accounts, newAccount]);
    setIsAddAccountOpen(false);
    setNewAccName(""); setNewAccBalance(""); setNewAccDesc(""); setNewAccType("Cash");
  };

  const executeTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) return;
    setAccounts(accounts.map((acc) => {
      if (acc.id === parseInt(transferFrom)) return { ...acc, balance: acc.balance - amt };
      if (acc.id === parseInt(transferTo)) return { ...acc, balance: acc.balance + amt };
      return acc;
    }));
    setIsTransferOpen(false); setTransferAmount("0"); setTransferFrom(""); setTransferTo("");
  };

  const updateAccountBalance = () => {
    const newBal = parseFloat(editAccountBalance);
    if (isNaN(newBal)) return;
    const isDebt = selectedAccount.type === "Credit" || selectedAccount.type === "Debt";
    const finalBalance = isDebt ? -Math.abs(newBal) : Math.abs(newBal);
    setAccounts(accounts.map((acc) => acc.id === selectedAccount.id ? { ...acc, balance: finalBalance } : acc));
    setSelectedAccount(null);
  };

  const toggleTodoStatus = (id) => setTodos(todos.map((t) => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    setTodos([{ id: Date.now(), text: newTodoText, priority: newTodoPriority, type: newTodoType, isCompleted: false }, ...todos]);
    setNewTodoText(""); setNewTodoPriority(3);
  };
  const handleDeleteTodo = (id) => { setTodos(todos.filter((t) => t.id !== id)); setSelectedTodo(null); };

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
      } catch (e) {
        setInputValue("Error"); setTimeout(() => setInputValue("0"), 1000);
      }
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

  const handleConfirmAction = () => {
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
      const assignedPayday = calculatePaydayGroup(entryDate);
      const newBill = {
        id: Date.now(), name: entryName || "New Bill", icon: entryIcon || "📋", amount: amountToProcess,
        date: sortableDay, fullDate: displayDate, payday: assignedPayday, isPaid: false, isOverdue: false,
        isInstallment: entryIsInstallment, totalAmount: entryIsInstallment ? parseFloat(entryTotalAmount) || 0 : 0,
        paidAmount: entryIsInstallment ? parseFloat(entryPaidAmount) || 0 : 0,
      };
      setBills([...bills, newBill]);
    } else if (drawerTab === "income") {
      const targetAccId = entryAccount ? parseInt(entryAccount) : accounts.find((a) => a.type === "Cash")?.id || accounts[0].id;
      setTransactions([{ id: Date.now(), name: entryName || "Income Deposit", icon: "💵", amount: amountToProcess, date: autoTimeStamp, type: "Income", category: "Deposit" }, ...transactions]);
      setAccounts(accounts.map((acc) => acc.id === targetAccId ? { ...acc, balance: acc.balance + amountToProcess } : acc));
    } else if (drawerTab === "transactions") {
      const targetAccId = entryAccount ? parseInt(entryAccount) : accounts[0].id;
      setTransactions([{ id: Date.now(), name: entryName || "New Expense", icon: entryIcon || "💳", amount: amountToProcess, date: autoTimeStamp, type: "Expense", category: "Purchase" }, ...transactions]);
      setAccounts(accounts.map((acc) => acc.id === targetAccId ? { ...acc, balance: acc.balance - amountToProcess } : acc));
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

  // === SHARED HERO SHELL ===
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
      <h2 className={`text-3xl font-black tracking-tight mb-6 relative z-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h2>
      {graphicContent}
      <div className={`relative z-10 pt-4 border-t flex justify-between items-center ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{formattedDate}</span>
        <span className="text-[9px] font-black uppercase tracking-wider text-[#1877F2]">{formattedTime}</span>
      </div>
    </header>
  );

  // ==========================================
  // VIEW 1: THE LOGIN SCREEN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex justify-center font-sans overflow-hidden">
        <div className="w-full max-w-md bg-white h-full relative shadow-2xl flex flex-col px-8 pt-24 pb-10">
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 bg-[#1877F2]/10 rounded-3xl flex items-center justify-center text-[#1877F2] mb-6 shadow-sm border border-[#1877F2]/20">
              <Wallet size={40} strokeWidth={2.5} />
            </div>
            <div className="text-center mb-2">
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] block leading-none mb-1">Ledger</span>
              <span className="text-xl font-black text-[#1877F2] uppercase tracking-[0.15em] block leading-tight">Planner</span>
            </div>
            <p className="text-sm font-bold text-slate-400 mt-4 tracking-wide uppercase">Secure Entrance</p>
          </div>
          <form onSubmit={handleFakeLogin} className="space-y-5 flex-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Identifier</label>
              <div className="relative">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-all" placeholder="ledgerplanner@gmail.com" />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Keyphrase</label>
              <div className="relative">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-all" placeholder="••••••••" />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>
            <button type="submit" disabled={isLoading || !email || !password} className={`w-full mt-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isLoading || !email || !password ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#1877F2] text-white hover:bg-blue-600 active:scale-[0.98] shadow-[0_8px_20px_rgba(24,119,242,0.3)]"}`}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Initialize Ledger Planner"}
            </button>
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
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="12" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke={isNegative ? "#EF4444" : "#1877F2"} strokeWidth="12" strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
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

          {/* NEW HORIZONTAL PAYDAY DASHBOARD CARDS */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-2 -mx-2 px-3 snap-x">
            {["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((pd) => {
              const pdSettings = paydayConfig[pd];
              const isSet = pdSettings && (pdSettings.date || pdSettings.income);
              return (
                <div
                  key={pd}
                  className={`min-w-[140px] p-4 rounded-3xl snap-center shrink-0 border transition-all ${
                    isSet
                      ? isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100 shadow-sm"
                      : isDarkMode ? "bg-slate-800/30 border-dashed border-slate-700" : "bg-slate-50 border-dashed border-slate-200"
                  }`}
                >
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
              const isDueNow = payday === "Due Now";
              const isCollapsed = collapsedPaydays[payday];
              const checkTotal = groupBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
              const pdSettings = paydayConfig[payday];
              const expectedDateStr = isDueNow ? "Currently Due" : pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled";
              const expectedIncomeStr = pdSettings && pdSettings.income ? `+$${parseFloat(pdSettings.income).toLocaleString()} Expected` : "";
              const sortedBills = [...groupBills].sort((a, b) => a.date - b.date);

              return (
                <div key={payday} className="space-y-2">
                  <div className="flex justify-between items-center px-3 py-1 cursor-pointer" onClick={() => toggleCollapse(payday)}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{payday}</h3>
                        <div className="text-slate-400">{isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                        {expectedDateStr} {expectedIncomeStr && <span className="text-[#10B981]"> • {expectedIncomeStr}</span>}
                      </span>
                    </div>
                    <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      ${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {!isCollapsed && (
                    <div className={`rounded-[2rem] p-3 border ${isDueNow ? isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100" : isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                      {sortedBills.length === 0 ? (
                        <p className="text-center text-xs font-bold text-slate-400 py-2">No bills assigned.</p>
                      ) : (
                        sortedBills.map((bill, idx) => (
                          <div key={bill.id} className={`flex flex-col p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== sortedBills.length - 1 ? "mb-1" : ""}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                                  {bill.isPaid ? <CheckCircle2 className="text-[#1877F2] hover:scale-110 transition-transform" size={28} /> : <Circle className={`${isDarkMode ? "text-slate-600 hover:text-slate-500" : "text-slate-200 hover:text-slate-300"} hover:scale-110 transition-transform`} size={28} />}
                                </div>
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${bill.isOverdue ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>
                                    {bill.icon}
                                  </div>
                                  <div>
                                    <p className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{bill.name}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                                      {bill.isOverdue ? "Overdue • " : "Due "} {bill.fullDate}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className={`font-black text-sm tracking-tight cursor-pointer ${bill.isOverdue ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`} onClick={() => setSelectedEntry(bill)}>
                                ${bill.amount.toFixed(2)}
                              </div>
                            </div>
                            {bill.isInstallment && (
                              <div className="mt-2.5 ml-[60px] pr-2">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-wider mb-1 text-slate-400">
                                  <span className="text-[#1877F2]">${bill.paidAmount.toLocaleString()} Paid</span>
                                  <span>${bill.totalAmount.toLocaleString()} Total</span>
                                </div>
                                <div className="h-[5px] w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#1877F2] transition-all duration-500" style={{ width: `${Math.min((bill.paidAmount / bill.totalAmount) * 100, 100)}%` }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RECENT ACTIVITY FEED ON HOME PAGE */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Recent Activity</h3>
            <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              {transactions.slice(0, 5).map((tx, idx) => (
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
              ))}
              <button onClick={() => changeTab("activity")} className={`w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isDarkMode ? "bg-[#1877F2] text-white shadow-blue-900/20" : "bg-[#1877F2] text-white shadow-blue-500/30"}`}>
                <List size={16} /> See All Activity
              </button>
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
    const historyData = [
      { label: "Nov", val: netWorth * 0.45 }, { label: "Dec", val: netWorth * 0.55 },
      { label: "Jan", val: netWorth * 0.4 }, { label: "Feb", val: netWorth * 0.7 },
      { label: "Mar", val: netWorth * 0.85 }, { label: "Apr", val: netWorth },
    ];
    const maxChartVal = Math.max(...historyData.map((d) => d.val));
    const activeDataPoint = historyData[activeChartNode];

    const graphicContent = (
      <div className="relative z-10 mb-2">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth • <span className="text-[#1877F2]">{activeDataPoint.label} 2026</span></p>
            <p className={`text-5xl font-black tracking-tighter transition-all duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              ${activeDataPoint.val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="flex items-end justify-between h-48 gap-2 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
          {historyData.map((item, i) => {
            const heightPct = (item.val / maxChartVal) * 100;
            const isActive = activeChartNode === i;
            return (
              <div key={i} onClick={() => setActiveChartNode(i)} className="flex flex-col items-center justify-end h-full flex-1 cursor-pointer group">
                <div className="w-full relative flex justify-center h-full items-end">
                  <div className={`w-full max-w-[32px] rounded-t-xl transition-all duration-500 ease-out ${isActive ? "bg-[#1877F2] shadow-[0_0_15px_rgba(24,119,242,0.4)]" : isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"}`} style={{ height: `${heightPct}%`, minHeight: "8px" }}></div>
                </div>
                <span className={`text-[9px] font-black mt-3 uppercase tracking-wider transition-colors duration-300 ${isActive ? "text-[#1877F2]" : "text-slate-400"}`}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Accounts`, graphicContent)}
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
                const isDebt = acc.balance < 0;
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

    const graphicContent = (
      <div className="flex items-center justify-between relative z-10 mb-6">
        <div className="w-36 h-36 rounded-full border-[12px] flex items-center justify-center relative bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-inner">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#10B981 ${progressPercentage}%, transparent 0)` }}></div>
          <div className={`absolute inset-1.5 rounded-full flex items-center justify-center ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
            <span className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{progressPercentage}%</span>
          </div>
        </div>
        <div className="flex-1 pl-8 text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining This Month</p>
          <p className={`text-4xl font-black tracking-tighter mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>${remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <p className="text-xs font-bold text-slate-400">
            <span className="text-[#10B981]">${paidBillsAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span> paid of ${totalBillsAmount.toLocaleString()}
          </p>
        </div>
      </div>
    );

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Bills`, graphicContent)}
        <main className="px-6 space-y-8">
          <div className="space-y-4 mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">To Pay</h3>
            {unpaidBills.length === 0 ? (
              <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-400" : "border-slate-300 bg-slate-50 text-slate-500"}`}>
                <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500 opacity-50" />
                <p className="font-bold text-sm">All caught up!</p>
                <p className="text-xs mt-1 opacity-70">You have no pending bills.</p>
              </div>
            ) : (
              <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                {unpaidBills.map((bill, idx) => (
                  <div key={bill.id} className={`flex flex-col p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== unpaidBills.length - 1 ? "mb-1" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                          <Circle className={`${isDarkMode ? "text-slate-600 hover:text-[#1877F2]" : "text-slate-300 hover:text-[#1877F2]"} hover:scale-110 transition-all duration-300`} size={28} />
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
                    {bill.isInstallment && (
                      <div className="mt-2.5 ml-[60px] pr-2">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-wider mb-1 text-slate-400">
                          <span className="text-[#1877F2]">${bill.paidAmount.toLocaleString()} Paid</span>
                          <span>${bill.totalAmount.toLocaleString()} Total</span>
                        </div>
                        <div className="h-[5px] w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1877F2] transition-all duration-500" style={{ width: `${Math.min((bill.paidAmount / bill.totalAmount) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {paidBills.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Completed</h3>
              <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                {paidBills.map((bill, idx) => (
                  <div key={bill.id} className={`flex flex-col p-3 rounded-2xl transition-all duration-300 opacity-60 grayscale-[0.3] ${isDarkMode ? "hover:bg-slate-800/50 hover:opacity-100" : "hover:bg-slate-50/50 hover:opacity-100"} ${idx !== paidBills.length - 1 ? "mb-1" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative p-1 z-10 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                          <CheckCircle2 className="text-[#10B981] hover:scale-110 transition-transform" size={28} />
                        </div>
                        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-100"}`}>{bill.icon}</div>
                          <div>
                            <p className={`font-bold text-sm line-through ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{bill.name}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>Paid • {bill.fullDate}</p>
                          </div>
                        </div>
                      </div>
                      <div className={`font-black text-sm tracking-tight cursor-pointer ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} onClick={() => setSelectedEntry(bill)}>
                        ${bill.amount.toFixed(2)}
                      </div>
                    </div>
                    {bill.isInstallment && (
                      <div className="mt-2.5 ml-[60px] pr-2">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-wider mb-1 text-slate-400">
                          <span className="text-slate-400">${bill.paidAmount.toLocaleString()} Paid</span>
                          <span>${bill.totalAmount.toLocaleString()} Total</span>
                        </div>
                        <div className="h-[5px] w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#10B981] transition-all duration-500" style={{ width: `${Math.min((bill.paidAmount / bill.totalAmount) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  // ==========================================
  // VIEW 5: ACTIVITY PAGE
  // ==========================================
  const renderActivity = () => {
    const filteredTxs = transactions.filter((tx) => {
      const matchesSearch = tx.name.toLowerCase().includes(activitySearch.toLowerCase()) || tx.category.toLowerCase().includes(activitySearch.toLowerCase());
      const matchesFilter = activityFilter === "All" || tx.type === activityFilter;
      return matchesSearch && matchesFilter;
    });

    const totalIncome = transactions.filter((t) => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
    const totalActivity = totalIncome + totalExpense;
    const incomePct = totalActivity === 0 ? 50 : (totalIncome / totalActivity) * 100;
    const netFlow = totalIncome - totalExpense;

    const graphicContent = (
      <div className="flex flex-col relative z-10 mb-6">
        <div className="text-center mb-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Net Cash Flow</span>
          <p className={`text-5xl font-black tracking-tighter ${netFlow >= 0 ? "text-emerald-500" : "text-orange-500"}`}>
            {netFlow >= 0 ? "+" : "-"}${Math.abs(netFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex w-full h-10 rounded-2xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800">
          <div style={{ width: `${incomePct}%` }} className="bg-[#10B981] flex items-center pl-4 transition-all duration-1000">
            <span className="text-[10px] font-black text-white tracking-widest uppercase shadow-sm">In</span>
          </div>
          <div style={{ width: `${100 - incomePct}%` }} className="bg-[#F97316] flex items-center justify-end pr-4 transition-all duration-1000">
            <span className="text-[10px] font-black text-white tracking-widest uppercase shadow-sm">Out</span>
          </div>
        </div>
      </div>
    );

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Activities`, graphicContent)}
        <main className="px-6 space-y-6">
          <div className="relative shadow-sm">
            <input type="text" placeholder="Search transactions..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)} className={`w-full py-4 pl-12 pr-4 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white placeholder-slate-500 focus:border-[#1877F2]" : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-[#1877F2]"}`} />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
          <div className="flex gap-2">
            {["All", "Income", "Expense"].map((filterOption) => (
              <button key={filterOption} onClick={() => setActivityFilter(filterOption)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${activityFilter === filterOption ? "bg-[#1877F2] text-white shadow-[0_4px_15px_rgba(24,119,242,0.3)]" : isDarkMode ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-white text-slate-500 border border-slate-100 shadow-sm"}`}>
                {filterOption}
              </button>
            ))}
          </div>
          <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {filteredTxs.length === 0 ? (
              <div className={`p-8 text-center rounded-xl border border-dashed ${isDarkMode ? "border-slate-700 text-slate-500" : "border-slate-200 text-slate-400"}`}>
                <p className="font-bold text-sm">No results found.</p>
                <p className="text-[10px] mt-1 uppercase tracking-widest">Try adjusting your filters</p>
              </div>
            ) : (
              filteredTxs.map((tx, idx) => (
                <div key={tx.id} onClick={() => setSelectedEntry(tx)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== filteredTxs.length - 1 ? "mb-1" : ""}`}>
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
        </main>
      </div>
    );
  };

  // ==========================================
  // VIEW 6: TO-DO PAGE
  // ==========================================
  const renderTodo = () => {
    const completedCount = todos.filter((t) => t.isCompleted).length;
    const totalCount = todos.length;
    const progressPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const activeTasks = todos.filter((t) => !t.isCompleted && t.type === "task").sort((a, b) => b.priority - a.priority);
    const activeShopping = todos.filter((t) => !t.isCompleted && t.type === "shopping").sort((a, b) => b.priority - a.priority);
    const completedTodos = todos.filter((t) => t.isCompleted);

    const graphicContent = (
      <div className="flex items-center justify-between relative z-10 mb-6">
        <div className="w-36 h-36 rounded-full border-[12px] flex items-center justify-center relative bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-inner">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#1877F2 ${progressPercentage}%, transparent 0)` }}></div>
          <div className={`absolute inset-1.5 rounded-full flex items-center justify-center ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
            <span className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{progressPercentage}%</span>
          </div>
        </div>
        <div className="flex-1 pl-8 text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Operations</p>
          <p className={`text-4xl font-black tracking-tighter mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {completedCount} <span className="text-xl text-slate-400">/ {totalCount}</span>
          </p>
          <p className="text-xs font-bold text-slate-400">Total completed tasks</p>
        </div>
      </div>
    );

    return (
      <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Action Center`, graphicContent)}
        <main className="px-6 space-y-8">
          <form onSubmit={handleAddTodo} className={`p-4 rounded-3xl border shadow-sm transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            <input type="text" placeholder="Add a new item..." value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} className={`w-full py-3 px-4 mb-4 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-500 focus:border-[#1877F2]" : "bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:border-[#1877F2]"}`} />
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 bg-slate-50 dark:bg-[#0F172A] p-1 rounded-xl border dark:border-slate-700 border-slate-100">
                  <button type="button" onClick={() => setNewTodoType("task")} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${newTodoType === "task" ? "bg-white dark:bg-slate-700 shadow-sm text-[#1877F2]" : "text-slate-400"}`}>To-Do</button>
                  <button type="button" onClick={() => setNewTodoType("shopping")} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${newTodoType === "shopping" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-500" : "text-slate-400"}`}>To-Buy</button>
                </div>
                <div className="flex items-center gap-1 pl-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={18} onClick={() => setNewTodoPriority(star)} className={`cursor-pointer transition-colors ${star <= newTodoPriority ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-700 hover:text-yellow-200"}`} />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={!newTodoText.trim()} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${!newTodoText.trim() ? "bg-slate-300 text-slate-500" : "bg-[#1877F2] text-white shadow-[0_8px_20px_rgba(24,119,242,0.3)]"}`}>
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Pending Actions</h3>
            {activeTasks.length === 0 ? (
              <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-400" : "border-slate-300 bg-slate-50 text-slate-500"}`}>
                <CheckSquare size={32} className="mx-auto mb-3 text-[#1877F2] opacity-50" />
                <p className="font-bold text-sm">Task Zero</p>
                <p className="text-xs mt-1 opacity-70">You have no pending tasks right now.</p>
              </div>
            ) : (
              <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                {activeTasks.map((todo, idx) => (
                  <div key={todo.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== activeTasks.length - 1 ? "mb-1" : ""}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative p-1 z-10 cursor-pointer" onClick={() => toggleTodoStatus(todo.id)}>
                        <Circle className={`${isDarkMode ? "text-slate-600 hover:text-[#1877F2]" : "text-slate-300 hover:text-[#1877F2]"} hover:scale-110 transition-all duration-300`} size={26} />
                      </div>
                      <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTodo(todo)}>
                        <p className={`font-bold text-sm leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{todo.text}</p>
                        {renderStars(todo.priority)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Pending Shopping</h3>
            {activeShopping.length === 0 ? (
              <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-400" : "border-slate-300 bg-slate-50 text-slate-500"}`}>
                <CheckSquare size={32} className="mx-auto mb-3 text-emerald-500 opacity-50" />
                <p className="font-bold text-sm">Cart is Empty</p>
                <p className="text-xs mt-1 opacity-70">Nothing to buy right now.</p>
              </div>
            ) : (
              <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                {activeShopping.map((todo, idx) => (
                  <div key={todo.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== activeShopping.length - 1 ? "mb-1" : ""}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative p-1 z-10 cursor-pointer" onClick={() => toggleTodoStatus(todo.id)}>
                        <Circle className={`${isDarkMode ? "text-slate-600 hover:text-emerald-500" : "text-slate-300 hover:text-emerald-500"} hover:scale-110 transition-all duration-300`} size={26} />
                      </div>
                      <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTodo(todo)}>
                        <p className={`font-bold text-sm leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{todo.text}</p>
                        {renderStars(todo.priority)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {completedTodos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Done</h3>
              <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
                {completedTodos.map((todo, idx) => (
                  <div key={todo.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 opacity-60 grayscale-[0.3] ${isDarkMode ? "hover:bg-slate-800/50 hover:opacity-100" : "hover:bg-slate-50/50 hover:opacity-100"} ${idx !== completedTodos.length - 1 ? "mb-1" : ""}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative p-1 z-10 cursor-pointer" onClick={() => toggleTodoStatus(todo.id)}>
                        <CheckCircle2 className={`${todo.type === "shopping" ? "text-emerald-500" : "text-[#1877F2]"} hover:scale-110 transition-transform`} size={26} />
                      </div>
                      <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTodo(todo)}>
                        <p className={`font-bold text-sm line-through ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{todo.text}</p>
                        {renderStars(todo.priority)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  // ==========================================
  // MAIN APP RETURN (THE MASTER BOX)
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

        {/* =========================================
            OVERLAYS & DRAWERS
            ========================================= */}

        {/* 1. Detail Drawer (Transactions / Bills) */}
        {selectedEntry && (
          <div className="absolute inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setSelectedEntry(null); setIsEditingEntry(false); }}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col border-t max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => { setSelectedEntry(null); setIsEditingEntry(false); }} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
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
                                  const result = Function('"use strict";return (' + toEval + ")")();
                                  setEditEntryAmount(String(result));
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
                      onClick={() => {
                        const newAmount = parseFloat(editEntryAmount);
                        if (!isNaN(newAmount)) {
                          if (selectedEntry.fullDate) {
                            setBills(bills.map((b) => b.id === selectedEntry.id ? { ...b, amount: newAmount } : b));
                          } else {
                            setTransactions(transactions.map((t) => t.id === selectedEntry.id ? { ...t, amount: newAmount } : t));
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
                        <span className="text-[#1877F2]">${selectedEntry.paidAmount.toLocaleString()} Paid</span>
                        <span>${selectedEntry.totalAmount.toLocaleString()} Total</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1877F2] transition-all" style={{ width: `${Math.min((selectedEntry.paidAmount / selectedEntry.totalAmount) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button onClick={() => { setIsEditingEntry(true); setEditEntryAmount(Math.abs(selectedEntry.amount).toString()); }} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                      <Edit2 size={16} /> Edit
                    </button>
                    {selectedEntry.fullDate && (
                      <button onClick={() => { handleBillClick(selectedEntry.id); setSelectedEntry(null); }} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${selectedEntry.isPaid ? "bg-slate-200 text-slate-400" : "bg-[#1877F2] text-white shadow-blue-500/20"}`}>
                        {selectedEntry.isPaid ? "Mark Unpaid" : "Mark Paid"}
                      </button>
                    )}
                  </div>
                  <button onClick={() => { if (selectedEntry.fullDate) { setBills(bills.filter((b) => b.id !== selectedEntry.id)); } else { setTransactions(transactions.filter((t) => t.id !== selectedEntry.id)); } setSelectedEntry(null); }} className="w-full mt-4 pt-4 pb-2 text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                    <Trash2 size={14} /> Delete Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1.5 NEW SMART PAYMENT ROUTING MODAL */}
        {paymentModalConfig.isOpen && (() => {
          const bill = bills.find(b => b.id === paymentModalConfig.billId);
          return (
            <div className="absolute inset-0 z-[80] flex items-end">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" })}></div>
               <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
                 <button onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" })} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                   <X size={18} strokeWidth={3} />
                 </button>
                 <div className="px-8 pt-6 pb-8 overflow-y-auto hide-scrollbar">
                   <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                   <h2 className={`text-xl font-black tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Complete Payment</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Where is the money coming from?</p>

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
                       {accounts.map(a => (
                         <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                       ))}
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

        {/* 2. Edit Account Drawer */}
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
                <div className="text-center mt-8 mb-2 flex justify-center items-center relative">
                  <span className={`text-5xl font-extrabold tracking-tighter ${selectedAccount.type === "Credit" || selectedAccount.type === "Debt" ? "text-red-500" : "text-[#1877F2]"}`}>
                    {selectedAccount.type === "Credit" || selectedAccount.type === "Debt" ? "-" : ""}${editAccountBalance}
                  </span>
                  <button onClick={() => setEditAccountBalance(editAccountBalance.slice(0, -1) || "0")} className="absolute right-4 text-slate-400 p-2 hover:text-slate-600 transition-colors">⌫</button>
                </div>
              </div>
              <div className={`p-6 mt-auto rounded-b-[3rem] shrink-0 ${isDarkMode ? "bg-[#0F172A]" : "bg-slate-50"}`}>
                <div className="grid grid-cols-4 gap-3">
                  {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                    <button key={btn} onClick={() => {
                        if (btn === "=") {
                          try {
                            const toEval = editAccountBalance.replace(/×/g, "*").replace(/÷/g, "/");
                            if (/^[0-9+\-*/. ]+$/.test(toEval)) {
                              // eslint-disable-next-line no-new-func
                              const result = Function('"use strict";return (' + toEval + ")")();
                              setEditAccountBalance(String(result));
                            }
                          } catch (e) { setEditAccountBalance("0"); }
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
              </div>
            </div>
          </div>
        )}

        {/* 3. NEW ADD ACCOUNT DRAWER */}
        {isAddAccountOpen && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddAccountOpen(false)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setIsAddAccountOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
              </button>

              <div className="px-8 pt-6 pb-12 overflow-y-auto hide-scrollbar">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <h2 className={`text-xl font-black tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Add New Account</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Account Name (e.g., Citi Double Cash)" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"}`} />
                  <input type="number" placeholder="Starting Balance (e.g., 500.00)" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"}`} />
                  <div className="relative">
                    <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Account Type</label>
                    <select value={newAccType} onChange={(e) => setNewAccType(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <option value="Cash">Cash / Checking / Savings</option>
                      <option value="Credit">Credit Card</option>
                      <option value="Debt">Loan / Debt</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Short Description (e.g., Joint Account)" value={newAccDesc} onChange={(e) => setNewAccDesc(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"}`} />
                </div>
                <button onClick={handleAddAccount} disabled={!newAccName.trim() || isNaN(parseFloat(newAccBalance))} className={`w-full mt-8 h-14 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${!newAccName.trim() || isNaN(parseFloat(newAccBalance)) ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#1877F2] text-white hover:bg-blue-600 shadow-blue-500/30"}`}>
                  Create Vault
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. SMART QUICK ADD (UPGRADED TO 2 STEPS + INSTALLMENTS) */}
        {isFabOpen && (
          <div className="absolute inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeFab}></div>
            <div className={`w-full rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={closeFab} className={`absolute top-5 right-5 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
              </button>

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
                    <button onClick={() => setFabStep(1)} className={`p-2 rounded-full transition-colors ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>←</button>
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
                        <button key={btn} onClick={() => handleNumpad(btn)} className={`h-14 rounded-2xl text-xl font-bold flex items-center justify-center transition-colors shadow-sm ${["÷", "×", "-", "+", "="].includes(btn) ? isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-100" : isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-800 hover:bg-slate-100"}`}>
                          {btn}
                        </button>
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
                          <input type="text" placeholder="Bill Name (e.g., Netflix)" value={entryName} onChange={(e) => setEntryName(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"}`} />
                          <div className="relative">
                            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Due Date</label>
                            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                          </div>
                          <div className="relative">
                            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Select Icon</label>
                            <select value={entryIcon} onChange={(e) => setEntryIcon(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-xl outline-none border transition-colors appearance-none ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                              <option value="" disabled>Select Icon</option>
                              {categoryEmojis.map((emoji) => (
                                <option key={emoji} value={emoji}>{emoji}</option>
                              ))}
                            </select>
                          </div>
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => setEntryIsInstallment(!entryIsInstallment)}>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${entryIsInstallment ? "text-[#1877F2]" : "text-slate-400"}`}>Installment Plan?</span>
                              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${entryIsInstallment ? "bg-[#1877F2]" : "bg-slate-300 dark:bg-slate-600"}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${entryIsInstallment ? "translate-x-4" : "translate-x-0"}`}></div>
                              </div>
                            </div>
                            {entryIsInstallment && (
                              <div className="mt-4 space-y-3 animate-fade-in">
                                <div className="relative">
                                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Total Full Balance</label>
                                  <input type="number" placeholder="e.g., 5000" value={entryTotalAmount} onChange={(e) => setEntryTotalAmount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                                </div>
                                <div className="relative">
                                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Already Paid (Optional)</label>
                                  <input type="number" placeholder="e.g., 500" value={entryPaidAmount} onChange={(e) => setEntryPaidAmount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {drawerTab === "income" && (
                        <>
                          <input type="text" placeholder="Payer / Source (e.g., Employer, Venmo)" value={entryName} onChange={(e) => setEntryName(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"}`} />
                          <div className="relative">
                            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Deposit To</label>
                            <select value={entryAccount} onChange={(e) => setEntryAccount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                              <option value="" disabled>Select Deposit Account</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2 flex items-center justify-center gap-1">
                            <CheckCircle2 size={12} /> Date & Time Auto-Stamped
                          </p>
                        </>
                      )}

                      {drawerTab === "transactions" && (
                        <>
                          <input type="text" placeholder="Merchant Name (e.g., Target, Uber Eats)" value={entryName} onChange={(e) => setEntryName(e.target.value)} className={`w-full py-4 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"}`} />
                          <div className="relative">
                            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Pay From Account</label>
                            <select value={entryAccount} onChange={(e) => setEntryAccount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                              <option value="" disabled>Select Payment Account</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                              ))}
                            </select>
                          </div>
                          <div className="relative">
                            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Select Icon</label>
                            <select value={entryIcon} onChange={(e) => setEntryIcon(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-xl outline-none border transition-colors appearance-none ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                              <option value="" disabled>Select Icon</option>
                              {categoryEmojis.map((emoji) => (
                                <option key={emoji} value={emoji}>{emoji}</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2 flex items-center justify-center gap-1">
                            <CheckCircle2 size={12} /> Date & Time Auto-Stamped
                          </p>
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

        {/* 5. TRANSFER FUNDS DRAWER */}
        {isTransferOpen && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsTransferOpen(false)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setIsTransferOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
              </button>
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
                  <button onClick={() => setTransferAmount(transferAmount.slice(0, -1) || "0")} className="absolute right-0 text-slate-400 p-2 hover:text-slate-600 transition-colors">⌫</button>
                </div>
              </div>
              <div className={`p-6 mt-auto rounded-b-[3rem] shrink-0 ${isDarkMode ? "bg-[#0F172A]" : "bg-slate-50"}`}>
                <div className="grid grid-cols-4 gap-3">
                  {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                    <button key={btn} onClick={() => {
                        if (btn === "=") {
                          try {
                            const toEval = transferAmount.replace(/×/g, "*").replace(/÷/g, "/");
                            if (/^[0-9+\-*/. ]+$/.test(toEval)) {
                              // eslint-disable-next-line no-new-func
                              const result = Function('"use strict";return (' + toEval + ")")();
                              setTransferAmount(String(result));
                            }
                          } catch (e) { setTransferAmount("0"); }
                        } else if (transferAmount === "0" && btn !== ".") { setTransferAmount(btn); }
                        else { setTransferAmount(transferAmount + btn); }
                      }}
                      className={`h-14 rounded-2xl text-xl font-bold flex items-center justify-center transition-colors shadow-sm ${["÷", "×", "-", "+", "="].includes(btn) ? isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-100" : isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-800 hover:bg-slate-100"}`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
                <button onClick={executeTransfer} disabled={!transferFrom || !transferTo || transferAmount === "0" || transferFrom === transferTo} className={`w-full mt-4 h-14 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${!transferFrom || !transferTo || transferAmount === "0" || transferFrom === transferTo ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#1877F2] text-white hover:bg-blue-600 shadow-blue-500/30"}`}>
                  Confirm Transfer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. CONFIG PAYDAYS DRAWER */}
        {isPaydaySetupOpen && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsPaydaySetupOpen(false)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setIsPaydaySetupOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
              </button>
              <div className="px-8 pt-6 pb-4 overflow-y-auto hide-scrollbar">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <h2 className={`text-xl font-black tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Configure Roadmap</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Set your expected dates & income</p>
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
                <button onClick={() => { setPaydayConfig(editPaydayConfig); setIsPaydaySetupOpen(false); }} className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-[#1877F2] text-white hover:bg-blue-600 shadow-blue-500/30">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. NOTIFICATION CENTER DRAWER */}
        {isNotificationsOpen && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsNotificationsOpen(false)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col transition-colors duration-500 max-h-[85vh] min-h-[50vh] ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <button onClick={() => setIsNotificationsOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
              </button>
              <div className="px-8 pt-8 pb-4 flex-1 flex flex-col overflow-y-auto hide-scrollbar">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <h2 className={`text-xl font-black tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ledger Alerts</h2>
                <div className="space-y-4 pb-10 flex-1">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                      <div className="flex gap-4">
                        <div className="mt-1">{notif.icon}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>{notif.title}</h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{notif.time}</span>
                          </div>
                          <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. TO-DO ACTION DRAWER (Delete/Edit Task) */}
        {selectedTodo && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTodo(null)}></div>
            <div className={`w-full rounded-t-[3rem] shadow-2xl animate-slide-up relative z-10 flex flex-col p-8 pb-12 transition-colors duration-500 max-h-[90vh] ${isDarkMode ? "bg-[#1E293B] border-t border-slate-700" : "bg-white border-t border-slate-100"}`}>
              <button onClick={() => setSelectedTodo(null)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}>
                <X size={18} strokeWidth={3} />
              </button>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
              <div className="mb-8 overflow-y-auto hide-scrollbar">
                {renderStars(selectedTodo.priority)}
                <h2 className={`text-xl font-black leading-tight mt-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedTodo.text}</h2>
              </div>
              <div className="flex gap-4 mt-auto shrink-0">
                <button onClick={() => { toggleTodoStatus(selectedTodo.id); setSelectedTodo(null); }} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${selectedTodo.isCompleted ? "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500" : "bg-[#1877F2] text-white shadow-blue-500/20"}`}>
                  {selectedTodo.isCompleted ? "Mark Pending" : "Mark Complete"}
                </button>
                <button onClick={() => handleDeleteTodo(selectedTodo.id)} className={`w-14 rounded-2xl flex items-center justify-center transition-colors ${isDarkMode ? "bg-red-900/20 text-red-500 hover:bg-red-900/40" : "bg-red-50 text-red-500 hover:bg-red-100"}`}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            GLOBAL UI (FAB & BOTTOM NAV)
            ========================================= */}
        <div className="absolute bottom-24 right-6 z-40">
          <button onClick={() => setIsFabOpen(true)} className={`w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#1877F2] shadow-[0_12px_24px_rgba(24,119,242,0.4)] border-4 ${isDarkMode ? "border-[#0F172A]" : "border-white"}`}>
            <Plus size={28} />
          </button>
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
              <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === tab.id ? "text-[#1877F2]" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
