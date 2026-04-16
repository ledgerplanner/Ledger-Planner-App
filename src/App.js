import React, { useState, useEffect, useRef } from "react";
import {
  Home, Wallet, Calendar as CalendarIcon, CreditCard, CheckSquare,
  Bell, Moon, Sun, X, Plus, ArrowRight, CheckCircle2, Trash2, ArrowDown, AlertCircle, Edit2, LogOut, RefreshCw, Save, DollarSign, ArrowRightLeft, PlusCircle
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

// === DEMO DATA IMPORT ===
import { demoAccounts, demoBills, demoTransactions, demoTodos, demoPaydayConfig } from "./demoData";

// === COMPONENTS ===
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Bills from "./components/Bills";
import Activity from "./components/Activity";
import Todo from "./components/Todo";

export default function App() {
  // === DEMO TRIPWIRE ===
  const isDemoMode = window.location.hostname.startsWith("demo");

  // === APP & AUTH STATE ===
  const [user, setUser] = useState(isDemoMode ? { uid: "demo123", displayName: "Demo User", email: "demo@ledgerplanner.com" } : null);
  const [isAuthLoading, setIsAuthLoading] = useState(!isDemoMode);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);
  const handleScroll = (e) => { setIsScrolled(e.target.scrollTop > 20); };
  
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [bills, setBills] = useState(isDemoMode ? demoBills : []);
  const [transactions, setTransactions] = useState(isDemoMode ? demoTransactions : []);
  const [accounts, setAccounts] = useState(isDemoMode ? demoAccounts : []);
  const [todos, setTodos] = useState(isDemoMode ? demoTodos : []);

  // === UI & MODAL STATE ===
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editEntryData, setEditEntryData] = useState({});
  const [collapsedPaydays, setCollapsedPaydays] = useState({ "Payday 2": true, "Payday 3": true, "Payday 4": true, "Payday 5": true });
  
  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  const [paydayConfig, setPaydayConfig] = useState(isDemoMode ? demoPaydayConfig : { "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" }, "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" }, "Payday 5": { date: "", income: "" } });
  const [editPaydayConfig, setEditPaydayConfig] = useState(paydayConfig);
  
  const [paymentModalConfig, setPaymentModalConfig] = useState({ isOpen: false, billId: null, accountId: "" });
  
  const [installmentPromptConfig, setInstallmentPromptConfig] = useState({ isOpen: false, billId: null, nextDate: "" });

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
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoType, setNewTodoType] = useState("task");
  const [selectedTodo, setSelectedTodo] = useState(null);

  // === QUICK ADD BUTTON STATE ===
  const [isQabOpen, setIsQabOpen] = useState(false);
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
  const [showConfetti, setShowConfetti] = useState(false);

  // === TAXONOMY & EMOJIS ===
  const categoryEmojis = ["💵", "💲", "🧾", "📋", "🏠", "💧", "⚡", "📺", "🚗", "⛽", "🚕", "🚇", "✈️", "🌴", "🏋️", "💳", "🎓", "🛒", "🛍️", "👗", "👟", "💅", "💈", "🍔", "🌮", "🍣", "☕", "🍻", "🍹", "🏥", "💊", "🐶", "🐾", "🎉", "🎟️", "🎬", "🎮", "🕹️", "📱", "💻", "💼", "💰", "₿", "💎", "⌚", "🎧", "🏪", "📶", "☁️", "🤖", "🚀"];
  const modernCategories = [
    { group: "Income & Wealth", items: ["Primary Salary", "Side Hustle / Gig", "Tips / Cash", "Investments / Crypto", "Transfers (Venmo/Zelle)", "Refunds & Adjustments", "Cash App"] },
    { group: "Housing & Utilities", items: ["Rent / Mortgage", "Electric / Gas", "Water / Trash", "Internet / Wi-Fi", "Home Goods / Maintenance", "Cell Phone"] },
    { group: "Modern Transit", items: ["Gas / Fuel", "Rideshare (Uber/Lyft)", "Scooters (Lime/Bird)", "Public Transit", "Auto Loan / Maintenance", "Parking / Tolls"] },
    { group: "Food & Drink", items: ["Groceries", "Dining Out", "Delivery (DoorDash/Eats)", "Coffee / Tea", "Bars / Nightlife", "Convenient Store"] },
    { group: "Digital Life", items: ["Streaming (Netflix/Hulu)", "Music (Spotify/Apple)", "Software / Cloud", "Gaming", "Creators (Patreon/Twitch)"] },
    { group: "Shopping & Lifestyle", items: ["Amazon / E-commerce", "Clothing / Fashion", "Personal Care / Grooming", "Fitness / Gym", "Events / Concerts", "Pet Care"] },
    { group: "Financial & Health", items: ["Savings Transfer", "Credit Card Payment", "Debt Payoff", "Bank Fees / Interest", "Medical / Pharmacy", "PayDay Loans"] },
    { group: "Entrepreneur (CEO)", items: ["Domain", "Hosting", "Software", "AI", "Marketing & Ads", "Contractors & Freelancers", "Business Fees / LLC"] },
    { group: "Other", items: ["Miscellaneous Expense", "Charity / Gifts"] }
  ];

  // === CLOUD SYNC ENGINE ===
  useEffect(() => {
    if (isDemoMode) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setTimeout(() => setIsAuthLoading(false), 1200);
    });
    return () => unsubscribeAuth();
  }, [isDemoMode]);

  useEffect(() => {
    if (isDemoMode) return;
    if (!user) { setAccounts([]); setBills([]); setTransactions([]); setTodos([]); return; }
    const userRef = doc(db, "users", user.uid);
    const unsubAcc = onSnapshot(collection(userRef, "accounts"), (snap) => setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => !a.isArchived)));
    const unsubBills = onSnapshot(collection(userRef, "bills"), (snap) => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTxs = onSnapshot(query(collection(userRef, "transactions"), orderBy("createdAt", "desc")), (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTodos = onSnapshot(query(collection(userRef, "todos"), orderBy("createdAt", "desc")), (snap) => setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubConfig = onSnapshot(doc(userRef, "settings", "paydayConfig"), (docSnap) => { if (docSnap.exists()) setPaydayConfig(docSnap.data()); });
    return () => { unsubAcc(); unsubBills(); unsubTxs(); unsubTodos(); unsubConfig(); };
  }, [user, isDemoMode]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === AUTH ACTIONS ===
  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setIsAuthLoading(true); setAuthError("");
    try {
      if (isLoginMode) { await signInWithEmailAndPassword(auth, email, password); } 
      else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: firstName });
        await setDoc(doc(db, "users", userCredential.user.uid), { firstName: firstName, email: email, createdAt: serverTimestamp() }, { merge: true });
        setUser({ ...userCredential.user, displayName: firstName });
      }
    } catch (error) {
      let errorMsg = "Authentication failed. Please try again.";
      if (error.code === 'auth/invalid-credential') errorMsg = "Invalid email or password.";
      if (error.code === 'auth/email-already-in-use') errorMsg = "An account with this email already exists.";
      setAuthError(errorMsg); setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true); setAuthError("");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (error) { setAuthError("Google Sign-In failed."); setIsAuthLoading(false); }
  };

  const handleLogout = async () => { 
    if (isDemoMode) {
      window.location.href = "https://ledgerplanner.com";
      return;
    }
    await signOut(auth); setActiveTab("home"); 
  };
  
  const triggerHaptic = () => { if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) window.navigator.vibrate(50); };
  const triggerVictory = () => { triggerHaptic(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2000); };

  const userName = isDemoMode ? "Aaron" : user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Founder";
  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatPaydayDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
  };

  const changeTab = (tabId) => { 
    setActiveTab(tabId); 
    if (tabId === "activity") { setActivityFilter("All"); setActivitySearch(""); }
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" }); 
  };
  
  const toggleCollapse = (payday) => setCollapsedPaydays((prev) => ({ ...prev, [payday]: !prev[payday] }));

  // === MODAL FUNCTIONS ===
  const openEntryDrawer = (entry) => { setSelectedEntry(entry); setIsEditingEntry(false); };
  const closeEntryDrawer = () => { setSelectedEntry(null); setIsEditingEntry(false); };

  const handleSaveEntryEdit = async () => {
    if (!selectedEntry) return;
    const colName = selectedEntry.fullDate !== undefined ? "bills" : "transactions";
    const updatePayload = { name: editEntryData.name || selectedEntry.name, amount: parseFloat(editEntryData.amount) || 0, category: editEntryData.category || selectedEntry.category, icon: editEntryData.icon || selectedEntry.icon };
    
    if (selectedEntry.fullDate !== undefined) {
        if (editEntryData.rawDate && editEntryData.rawDate !== selectedEntry.rawDate) {
            const dateObj = new Date(editEntryData.rawDate);
            updatePayload.rawDate = editEntryData.rawDate;
            updatePayload.date = dateObj.getUTCDate();
            updatePayload.fullDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
            updatePayload.payday = calculatePaydayGroup(editEntryData.rawDate);
            const todayLocal = new Date(); todayLocal.setHours(0, 0, 0, 0);
            const localBillDate = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
            updatePayload.isOverdue = localBillDate < todayLocal;
            if (localBillDate.getTime() === todayLocal.getTime()) updatePayload.payday = "Due Now";
        }
    }
    
    if (isDemoMode) {
      if (colName === "bills") {
        setBills(bills.map(b => b.id === selectedEntry.id ? { ...b, ...updatePayload } : b));
      } else {
        setTransactions(transactions.map(t => t.id === selectedEntry.id ? { ...t, ...updatePayload } : t));
      }
    } else {
      await updateDoc(doc(db, "users", user.uid, colName, selectedEntry.id), updatePayload);
    }
    
    setSelectedEntry({ ...selectedEntry, ...updatePayload });
    setIsEditingEntry(false); triggerVictory();
  };

  const handleAddAccount = async () => { 
    const startBal = parseFloat(newAccBalance);
    if (!newAccName.trim() || isNaN(startBal)) return;
    let finalBalance = startBal;
    if (newAccType === "Credit Card" && startBal > 0) finalBalance = -startBal;
    const getIcon = (type) => { if (type === "Credit Card") return "💳"; if (type === "401k / Retirement") return "🌴"; if (type === "Savings") return "📈"; if (type === "Cash") return "💵"; return "🏦"; };
    
    if (isDemoMode) {
      const newAcc = { id: `acc_demo_${Date.now()}`, name: newAccName, type: newAccType, description: newAccDesc, balance: finalBalance, icon: getIcon(newAccType) };
      setAccounts([...accounts, newAcc]);
    } else {
      const accRef = await addDoc(collection(db, "users", user.uid, "accounts"), { name: newAccName, type: newAccType, description: newAccDesc, balance: finalBalance, icon: getIcon(newAccType), isArchived: false });
      if (Math.abs(startBal) > 0) {
        const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        await addDoc(collection(db, "users", user.uid, "transactions"), { name: `${newAccName} (Opening)`, icon: getIcon(newAccType), amount: Math.abs(startBal), date: autoTimeStamp, type: finalBalance < 0 ? "Expense" : "Income", category: finalBalance < 0 ? "Initial Debt" : "Opening Balance", accountId: accRef.id, createdAt: serverTimestamp() });
      }
    }
    triggerVictory(); setIsAddAccountOpen(false); setNewAccName(""); setNewAccBalance(""); setNewAccDesc(""); setNewAccType("Checking");
  };

  const handleTransferNumpad = (btn) => {
    if (btn === "=") {
      try { const toEval = transferAmount.replace(/×/g, "*").replace(/÷/g, "/"); if (/^[0-9+\-*/. ]+$/.test(toEval)) setTransferAmount(String(Function('"use strict";return (' + toEval + ")")())); } 
      catch (e) { setTransferAmount("Error"); setTimeout(() => setTransferAmount("0"), 1000); }
    } else if (transferAmount === "0" && btn !== ".") setTransferAmount(btn);
    else setTransferAmount(transferAmount + btn);
  };

  const executeTransfer = async () => { 
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0 || !transferFrom || !transferTo) return;
    const fromAcc = accounts.find(a => a.id === transferFrom);
    const toAcc = accounts.find(a => a.id === transferTo);
    
    if (isDemoMode) {
       setAccounts(accounts.map(a => {
         if(a.id === fromAcc.id) return { ...a, balance: a.balance - amt };
         if(a.id === toAcc.id) return { ...a, balance: a.balance + amt };
         return a;
       }));
    } else {
      await updateDoc(doc(db, "users", user.uid, "accounts", fromAcc.id), { balance: fromAcc.balance - amt });
      await updateDoc(doc(db, "users", user.uid, "accounts", toAcc.id), { balance: toAcc.balance + amt });
      const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: `Transfer to ${toAcc.name}`, icon: "🔄", amount: amt, date: autoTimeStamp, type: "Expense", category: "Transfers (Venmo/Zelle)", accountId: fromAcc.id, createdAt: serverTimestamp() });
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: `Transfer from ${fromAcc.name}`, icon: "🔄", amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: toAcc.id, createdAt: serverTimestamp() });
    }
    triggerVictory(); setIsTransferOpen(false); setTransferAmount("0"); setTransferFrom(""); setTransferTo("");
  };

  const updateAccountBalance = async () => { 
    const newBal = parseFloat(editAccountBalance);
    if (isNaN(newBal) || !selectedAccount) return;
    let finalBalance = newBal;
    if (selectedAccount.type === "Credit Card" && newBal > 0) finalBalance = -newBal;
    const diff = finalBalance - selectedAccount.balance;
    
    if (isDemoMode) {
      setAccounts(accounts.map(a => a.id === selectedAccount.id ? { ...a, balance: finalBalance } : a));
    } else {
      if (Math.abs(diff) > 0.01) {
        const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        await addDoc(collection(db, "users", user.uid, "transactions"), { name: "Balance Adjustment", icon: "⚖️", amount: Math.abs(diff), date: autoTimeStamp, type: diff > 0 ? "Income" : "Expense", category: "Refunds & Adjustments", accountId: selectedAccount.id, createdAt: serverTimestamp() });
      }
      await updateDoc(doc(db, "users", user.uid, "accounts", selectedAccount.id), { balance: finalBalance });
    }
    triggerVictory(); setSelectedAccount(null);
  };

  const deleteAccount = async () => {
    if (!selectedAccount) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedAccount.name}?`)) return;
    const accId = selectedAccount.id;
    
    if (isDemoMode) {
      setAccounts(accounts.filter(a => a.id !== accId));
    } else {
      await deleteDoc(doc(db, "users", user.uid, "accounts", accId));
      const txsToDelete = transactions.filter(tx => tx.accountId === accId);
      const batchPromises = txsToDelete.map(tx => deleteDoc(doc(db, "users", user.uid, "transactions", tx.id)));
      const billsToReset = bills.filter(b => b.paidFromAccountId === accId);
      billsToReset.forEach(b => { batchPromises.push(updateDoc(doc(db, "users", user.uid, "bills", b.id), { isPaid: false, paidAmount: b.isInstallment ? b.paidAmount - b.amount : 0, paidFromAccountId: null, linkedTxId: null })); });
      await Promise.all(batchPromises);
    }
    triggerHaptic(); setSelectedAccount(null);
  };

  const clearPaydayConfig = () => { setEditPaydayConfig({ "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" }, "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" }, "Payday 5": { date: "", income: "" } }); triggerHaptic(); };
  const savePaydayConfig = async () => { 
    setPaydayConfig(editPaydayConfig); 
    if (!isDemoMode) {
      await setDoc(doc(db, "users", user.uid, "settings", "paydayConfig"), editPaydayConfig); 
    }
    setIsPaydaySetupOpen(false); triggerVictory(); 
  };

  const todayForDynamic = new Date(); todayForDynamic.setHours(0, 0, 0, 0);
  const calculatePaydayGroup = (dateString) => {
    if (!dateString) return "Payday 1";
    const billDate = new Date(dateString);
    const todayLocal = new Date(); todayLocal.setHours(0, 0, 0, 0);
    const localBillDate = new Date(billDate.getUTCFullYear(), billDate.getUTCMonth(), billDate.getUTCDate());
    
    if (localBillDate < todayLocal) return "Due Now";
    if (localBillDate.getTime() === todayLocal.getTime()) return "Due Now";

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
    if (billDate < activePaydays[0].date) return activePaydays[0].id;
    let assignedPd = activePaydays[0].id;
    for (let i = 0; i < activePaydays.length; i++) {
      if (billDate >= activePaydays[i].date) assignedPd = activePaydays[i].id; else break;
    }
    return assignedPd;
  };

  const dynamicBills = bills.map(bill => {
    if (bill.rawDate && !bill.isPaid) {
      const bDate = new Date(bill.rawDate);
      const localBDate = new Date(bDate.getUTCFullYear(), bDate.getUTCMonth(), bDate.getUTCDate());
      if (localBDate < todayForDynamic) return { ...bill, payday: "Due Now", isOverdue: true };
      if (localBDate.getTime() === todayForDynamic.getTime()) return { ...bill, payday: "Due Now", isOverdue: false };
    }
    return bill;
  }).sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
    if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
    if (!a.rawDate) return 1; if (!b.rawDate) return -1;
    return new Date(a.rawDate) - new Date(b.rawDate);
  });

  const handleRolloverMonth = async () => {
    if (!window.confirm("Ready to start a new month? Paid recurring bills will automatically bump to next month, and one-time bills will be cleared from the board.")) return;
    
    if (isDemoMode) {
      alert("Rollover is disabled in Demo Mode.");
      return;
    }

    const batchPromises = [];
    bills.forEach(bill => {
      if (bill.isPaid) {
        if (bill.isRecurring !== false) { 
          let newRawDate = bill.rawDate; let displayDate = bill.fullDate; let newPayday = "Payday 1";
          if (bill.rawDate) {
            const oldDate = new Date(bill.rawDate); oldDate.setUTCMonth(oldDate.getUTCMonth() + 1);
            newRawDate = oldDate.toISOString().split('T')[0];
            displayDate = oldDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
            newPayday = calculatePaydayGroup(newRawDate);
          }
          let newPaidAmt = bill.isInstallment ? bill.paidAmount : 0;
          batchPromises.push(updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: false, paidAmount: newPaidAmt, linkedTxId: null, paidFromAccountId: null, rawDate: newRawDate, fullDate: displayDate, payday: newPayday, isOverdue: false }));
        } else { batchPromises.push(deleteDoc(doc(db, "users", user.uid, "bills", bill.id))); }
      }
    });
    await Promise.all(batchPromises); triggerVictory();
  };

  // === SMART NOTIFICATION ENGINE ===
  const generateAlerts = () => {
    const currentAlerts = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const actionBills = dynamicBills.filter(b => b.isOverdue || (!b.isPaid && b.payday === "Due Now"));
    actionBills.forEach(b => { currentAlerts.push({ id: `action-${b.id}`, type: 'danger', icon: <AlertCircle size={20} className="text-red-500" />, title: 'Action Required', message: `Your ${b.name} bill is ${b.isOverdue ? 'past due' : 'due now'}.`, amount: b.amount, time: b.isOverdue ? 'URGENT' : 'TODAY', action: () => { setIsNotificationsOpen(false); changeTab("bills"); } }); });

    const upcomingRecurring = dynamicBills.filter(b => !b.isPaid && b.isRecurring && !b.isOverdue && b.payday !== "Due Now");
    upcomingRecurring.forEach(b => { if (b.rawDate) { const bDate = new Date(b.rawDate); const diffDays = Math.ceil((bDate - today) / (1000 * 60 * 60 * 24)); if (diffDays >= 0 && diffDays <= 2) { currentAlerts.push({ id: `sub-${b.id}`, type: 'info', icon: <RefreshCw size={20} className="text-[#10B981]" />, title: 'Subscription Nudge', message: `${b.name} is recurring in ${diffDays} day(s). Cancel or keep?`, amount: b.amount, time: `${diffDays}D`, action: () => { setIsNotificationsOpen(false); changeTab("bills"); } }); } } });

    ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach(pdId => {
      const config = paydayConfig[pdId];
      if (config && config.date) {
        const pdDate = new Date(config.date); pdDate.setUTCHours(0, 0, 0, 0);
        const diffDays = Math.ceil((pdDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) { currentAlerts.push({ id: `payday-${pdId}`, type: 'info', icon: <CalendarIcon size={20} className="text-[#1877F2]" />, title: 'Upcoming Payday', message: `${pdId} allocation window is approaching.`, time: `${diffDays}D`, action: () => { setIsNotificationsOpen(false); setIsPaydaySetupOpen(true); } }); }
        
        const pdBills = bills.filter(b => b.payday === pdId && !b.isPaid);
        const pdTotal = pdBills.reduce((sum, b) => sum + b.amount, 0);
        const pdIncome = parseFloat(config.income) || 0;
        if (pdTotal > pdIncome && pdIncome > 0) { currentAlerts.push({ id: `gap-${pdId}`, type: 'warning', icon: <ArrowDown size={20} className="text-orange-500" />, title: 'Liquidity Gap', message: `${pdId} income is $${(pdTotal - pdIncome).toFixed(2)} short.`, time: 'WARNING', action: () => { setIsNotificationsOpen(false); changeTab("bills"); } }); }
      }
    });

    const liquidCash = accounts.filter(a => a.type === "Checking" || a.type === "Cash").reduce((sum, acc) => sum + acc.balance, 0);
    const upcomingBills = bills.filter(b => !b.isPaid && !b.isOverdue);
    const upcomingBurn = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
    const safeToSpend = liquidCash - upcomingBurn;

    if (safeToSpend < 100 && safeToSpend >= 0) { currentAlerts.push({ id: `redline`, type: 'danger', icon: <AlertCircle size={20} className="text-red-500" />, title: 'Safe to Spend Redline', message: `Your buffer is critically low ($${safeToSpend.toFixed(2)}).`, time: 'ALERT', action: () => { setIsNotificationsOpen(false); changeTab("home"); } }); }

    const recentTransfers = transactions.filter(tx => tx.category === "Transfers (Venmo/Zelle)" && tx.type === "Income");
    if (recentTransfers.length > 0) { const latestTransfer = recentTransfers[0]; currentAlerts.push({ id: `transfer-${latestTransfer.id}`, type: 'success', icon: <CheckCircle2 size={20} className="text-[#10B981]" />, title: 'Transfer Complete', message: `$${latestTransfer.amount.toFixed(2)} was successfully moved.`, time: latestTransfer.date.split(',')[0], action: () => { setIsNotificationsOpen(false); changeTab("activity"); } }); }

    return currentAlerts;
  };

  const activeAlerts = generateAlerts();

  const renderHeroShell = (title, graphicContent) => (
    <header className={`px-6 pt-12 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden mb-8 z-30 rounded-b-[3rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#1877F2]/10 rounded-full blur-3xl"></div>
      <div className="flex justify-between items-center mb-6 relative z-30 h-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setIsNotificationsOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
            <Bell size={18} />
            {activeAlerts.length > 0 && <span className={`absolute top-2 right-2.5 w-2 h-2 rounded-full border-2 ${isDarkMode ? "border-[#1E293B]" : "border-white"} ${activeAlerts.some(a => a.type === 'danger' || a.type === 'warning') ? "bg-red-500" : "bg-[#1877F2]"}`}></span>}
          </button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-20 origin-top -top-5 lg:hidden">
          <img src="/login-logo.png" alt="Ledger Planner" className={`w-16 h-16 rounded-full shadow-[0_8px_20px_rgba(24,119,242,0.2)] object-cover border-[3px] transition-colors ${isDarkMode ? "border-slate-800" : "border-white"}`} />
        </div>
        <button onClick={handleLogout} className={`h-10 px-3.5 rounded-full flex items-center justify-center gap-2 border transition-colors shadow-sm lg:hidden ${isDarkMode ? "bg-slate-800 border-slate-700 text-red-400 hover:bg-red-900/30" : "bg-white border-slate-100 text-red-500 hover:bg-red-50"}`}>
          <LogOut size={14} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Logout</span>
        </button>
      </div>
      <div className="relative z-10 flex justify-center px-1 mb-6">
        <h2 title={title} className={`text-3xl font-black tracking-tight leading-tight truncate max-w-full ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h2>
      </div>
      <div className="relative z-10 w-full h-auto opacity-100">{graphicContent}</div>
      <div className={`relative z-10 pt-4 border-t flex justify-between items-center ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{formattedDate}</span>
        <span className="text-[9px] font-black uppercase tracking-wider text-[#1877F2]">{formattedTime}</span>
      </div>
    </header>
  );

  const handleBillClick = async (id) => {
    const bill = bills.find(b => b.id === id); 
    if (!bill.isPaid) { setPaymentModalConfig({ isOpen: true, billId: id, accountId: accounts.find(a => a.type === "Checking" || a.type === "Cash")?.id || (accounts[0]?.id || "") }); } 
    else {
      const refundAccountId = bill.paidFromAccountId;
      const targetAcc = accounts.find(a => a.id === refundAccountId);
      let newPaidAmount = bill.paidAmount; if (bill.isInstallment) newPaidAmount = bill.paidAmount - bill.amount;
      
      if (isDemoMode) {
        setBills(bills.map(b => b.id === id ? { ...b, isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null, linkedTxId: null } : b));
        if (targetAcc) setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: a.balance + bill.amount } : a));
        if (bill.linkedTxId) setTransactions(transactions.filter(t => t.id !== bill.linkedTxId));
      } else {
        await updateDoc(doc(db, "users", user.uid, "bills", id), { isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null, linkedTxId: null });
        if (targetAcc) await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance + bill.amount });
        if (bill.linkedTxId) await deleteDoc(doc(db, "users", user.uid, "transactions", bill.linkedTxId));
      }
      triggerHaptic();
    }
  };

  // 🔥 SURGICAL UPGRADE: INSTALLMENT LOGIC
  const confirmPaymentRoute = async () => {
    const bill = bills.find(b => b.id === paymentModalConfig.billId);
    const targetAcc = accounts.find(a => a.id === paymentModalConfig.accountId);
    if (!bill || !targetAcc) return;
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    
    if (isDemoMode) {
      const txId = `tx_demo_${Date.now()}`;
      setTransactions([{ id: txId, name: bill.name, icon: bill.icon, amount: bill.amount, date: autoTimeStamp, type: "Expense", category: bill.category || "Bill Payment", accountId: targetAcc.id }, ...transactions]);
      setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: a.balance - bill.amount } : a));
      
      if (bill.isInstallment) {
        const newPaidAmt = (bill.paidAmount || 0) + bill.amount;
        if (newPaidAmt >= bill.totalAmount) {
          setBills(bills.map(b => b.id === bill.id ? { ...b, isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAcc.id, linkedTxId: txId } : b));
          triggerVictory();
          setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
        } else {
          setBills(bills.map(b => b.id === bill.id ? { ...b, paidAmount: newPaidAmt, isOverdue: false } : b));
          triggerHaptic();
          setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
          setInstallmentPromptConfig({ isOpen: true, billId: bill.id, nextDate: "" });
        }
      } else {
        setBills(bills.map(b => b.id === bill.id ? { ...b, isPaid: true, paidAmount: 0, paidFromAccountId: targetAcc.id, linkedTxId: txId } : b));
        triggerVictory();
        setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
      }
    } else {
      const txRef = await addDoc(collection(db, "users", user.uid, "transactions"), { name: bill.name, icon: bill.icon, amount: bill.amount, date: autoTimeStamp, type: "Expense", category: bill.category || "Bill Payment", accountId: targetAcc.id, createdAt: serverTimestamp() });
      await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance - bill.amount });

      if (bill.isInstallment) {
        const newPaidAmt = (bill.paidAmount || 0) + bill.amount;
        const isFullyPaid = newPaidAmt >= bill.totalAmount;

        if (isFullyPaid) {
          await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id });
          triggerVictory();
          setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
        } else {
          await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { paidAmount: newPaidAmt, isOverdue: false });
          triggerHaptic();
          setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
          setInstallmentPromptConfig({ isOpen: true, billId: bill.id, nextDate: "" });
        }
      } else {
        await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: true, paidAmount: 0, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id });
        triggerVictory();
        setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
      }
    }
  };

  // 🔥 SURGICAL UPGRADE: SAVE NEXT INSTALLMENT DATE
  const handleSaveNextInstallmentDate = async () => {
    if (!installmentPromptConfig.nextDate) return;
    const bill = bills.find(b => b.id === installmentPromptConfig.billId);
    if(!bill) return;

    const dateObj = new Date(installmentPromptConfig.nextDate);
    const sortableDay = dateObj.getUTCDate();
    const displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const newPayday = calculatePaydayGroup(installmentPromptConfig.nextDate);

    if (isDemoMode) {
      setBills(bills.map(b => b.id === bill.id ? { ...b, rawDate: installmentPromptConfig.nextDate, date: sortableDay, fullDate: displayDate, payday: newPayday, isOverdue: false } : b));
    } else {
      await updateDoc(doc(db, "users", user.uid, "bills", bill.id), {
          rawDate: installmentPromptConfig.nextDate,
          date: sortableDay,
          fullDate: displayDate,
          payday: newPayday,
          isOverdue: false
      });
    }

    triggerVictory();
    setInstallmentPromptConfig({ isOpen: false, billId: null, nextDate: "" });
  };

  const closeQab = () => { setIsQabOpen(false); setQabStep(1); setInputValue("0"); setEntryName(""); setEntryDate(""); setEntryIcon("🧾"); setEntryCategory(""); setEntryAccount(""); setEntryIsRecurring(false); setEntryIsInstallment(false); setEntryTotalAmount(""); setEntryPaidAmount(""); setIsCategorySelectorOpen(false); };
  
  const handleNumpad = (btn) => {
    if (btn === "=") { try { const toEval = inputValue.replace(/×/g, "*").replace(/÷/g, "/"); if (/^[0-9+\-*/. ]+$/.test(toEval)) setInputValue(String(Function('"use strict";return (' + toEval + ")")())); } catch (e) { setInputValue("Error"); setTimeout(() => setInputValue("0"), 1000); } } 
    else if (inputValue === "0" && btn !== ".") setInputValue(btn);
    else setInputValue(inputValue + btn);
  };

  const handleConfirmAction = async () => {
    const amountToProcess = parseFloat(inputValue);
    if (isNaN(amountToProcess) || amountToProcess <= 0) return;
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    const finalCategory = entryCategory || "Uncategorized";

    if (drawerTab === "bills") {
      let displayDate = "TBD", sortableDay = 31;
      if (entryDate) {
        const dateObj = new Date(entryDate); sortableDay = dateObj.getUTCDate();
        displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      }
      
      if (isDemoMode) {
        setBills([...bills, {
          id: `b_demo_${Date.now()}`, name: entryName || "New Bill", icon: entryIcon || "🧾", category: finalCategory, amount: amountToProcess,
          date: sortableDay, fullDate: displayDate, rawDate: entryDate, payday: calculatePaydayGroup(entryDate), isPaid: false, isOverdue: false,
          isRecurring: entryIsRecurring, isInstallment: entryIsInstallment, totalAmount: entryIsInstallment ? parseFloat(entryTotalAmount) || 0 : 0,
          paidAmount: entryIsInstallment ? parseFloat(entryPaidAmount) || 0 : 0, linkedTxId: null
        }]);
      } else {
        await addDoc(collection(db, "users", user.uid, "bills"), {
          name: entryName || "New Bill", icon: entryIcon || "🧾", category: finalCategory, amount: amountToProcess,
          date: sortableDay, fullDate: displayDate, rawDate: entryDate, payday: calculatePaydayGroup(entryDate), isPaid: false, isOverdue: false,
          isRecurring: entryIsRecurring, isInstallment: entryIsInstallment, totalAmount: entryIsInstallment ? parseFloat(entryTotalAmount) || 0 : 0,
          paidAmount: entryIsInstallment ? parseFloat(entryPaidAmount) || 0 : 0, linkedTxId: null
        });
      }
      triggerHaptic(); closeQab();
    } else if (drawerTab === "income" || drawerTab === "transactions") {
      const targetAcc = accounts.find(a => a.id === entryAccount) || accounts[0];
      if (targetAcc) {
        const isIncome = drawerTab === "income";
        if (isDemoMode) {
          setTransactions([{ id: `tx_demo_${Date.now()}`, name: entryName || (isIncome ? "Income" : "Expense"), icon: isIncome ? "💵" : entryIcon, category: finalCategory, amount: amountToProcess, date: autoTimeStamp, type: isIncome ? "Income" : "Expense", accountId: targetAcc.id }, ...transactions]);
          setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: a.balance + (isIncome ? amountToProcess : -amountToProcess) } : a));
        } else {
          await addDoc(collection(db, "users", user.uid, "transactions"), { name: entryName || (isIncome ? "Income" : "Expense"), icon: isIncome ? "💵" : entryIcon, category: finalCategory, amount: amountToProcess, date: autoTimeStamp, type: isIncome ? "Income" : "Expense", accountId: targetAcc.id, createdAt: serverTimestamp() });
          await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance + (isIncome ? amountToProcess : -amountToProcess) });
        }
      }
      triggerVictory(); closeQab();
    }
  };

  if (isAuthLoading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#1877F2]"}`}>
         <img src="/login-logo.png" alt="Ledger Planner" className="w-36 h-36 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-pulse border-[6px] border-white/20 mb-8" />
         <div className="flex gap-2">
           <div className="w-2.5 h-2.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0ms' }}></div>
           <div className="w-2.5 h-2.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '150ms' }}></div>
           <div className="w-2.5 h-2.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '300ms' }}></div>
         </div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <Login isAuthLoading={isAuthLoading} isLoginMode={isLoginMode} setIsLoginMode={setIsLoginMode} handleAuthSubmit={handleAuthSubmit} handleGoogleLogin={handleGoogleLogin} authError={authError} setAuthError={setAuthError} email={email} setEmail={setEmail} password={password} setPassword={setPassword} firstName={firstName} setFirstName={setFirstName} />;
  }

  const categoriesToRender = drawerTab === 'income' ? modernCategories.filter(g => g.group === "Income & Wealth") : modernCategories;

  return (
    <div className={`h-screen w-full font-sans relative flex transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <div className={`w-full h-full relative flex flex-col lg:flex-row transition-colors duration-500 overflow-hidden ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        
        {/* DESKTOP SIDEBAR */}
        <div className={`hidden lg:flex w-[280px] flex-col border-r z-40 p-6 transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-4 mb-10 mt-4">
            <img src="/login-logo.png" alt="Ledger Planner" className={`w-12 h-12 rounded-full shadow-[0_4px_15px_rgba(24,119,242,0.2)] object-cover border-[2px] transition-colors ${isDarkMode ? "border-slate-700" : "border-slate-100"}`} />
            <div>
              <h1 className={`font-black tracking-tighter text-lg leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ledger Planner</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isDemoMode ? "Demo Mode" : "Master Engine"}</p>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">Navigation</p>
            {[{ id: "home", icon: Home, label: "Dashboard" }, { id: "accounts", icon: Wallet, label: "Accounts" }, { id: "bills", icon: CalendarIcon, label: "Bills & Plans" }, { id: "activity", icon: CreditCard, label: "Activity" }, { id: "todo", icon: CheckSquare, label: "To-Do List" }].map((tab) => (
              <button key={tab.id} onClick={() => changeTab(tab.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? isDarkMode ? "bg-slate-800 text-[#1877F2]" : "bg-blue-50 text-[#1877F2]" : isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-auto space-y-4">
            <button onClick={() => setIsQabOpen(true)} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white bg-[#1877F2] shadow-[0_8px_20px_rgba(24,119,242,0.3)] font-black uppercase tracking-widest text-xs transition-transform active:scale-95 hover:-translate-y-1`}><Plus size={18} /> Quick Add</button>
            <button onClick={handleLogout} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-red-400 hover:bg-red-900/30" : "bg-white border-slate-100 text-red-500 hover:bg-red-50"}`}><LogOut size={16} strokeWidth={2.5} /><span className="text-[10px] font-black uppercase tracking-widest">{isDemoMode ? "Exit Demo" : "Logout"}</span></button>
          </div>
        </div>

        {/* MAIN ROUTER CONTENT */}
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          <div className={`flex-1 overflow-y-auto hide-scrollbar lg:pb-0 ${isDemoMode ? "pb-56" : "pb-24"}`} ref={scrollRef} onScroll={handleScroll}>
            {activeTab === "home" && <Dashboard userName={userName} accounts={accounts} bills={dynamicBills} transactions={transactions} paydayConfig={paydayConfig} setEditPaydayConfig={setEditPaydayConfig} setIsPaydaySetupOpen={setIsPaydaySetupOpen} setIsNotificationsOpen={setIsNotificationsOpen} collapsedPaydays={collapsedPaydays} toggleCollapse={toggleCollapse} handleBillClick={handleBillClick} setSelectedEntry={openEntryDrawer} isDarkMode={isDarkMode} formatPaydayDateStr={formatPaydayDateStr} renderHeroShell={renderHeroShell} changeTab={changeTab} />}
            {activeTab === "accounts" && <Accounts userName={userName} accounts={accounts} transactions={transactions} isDarkMode={isDarkMode} setIsTransferOpen={setIsTransferOpen} setIsAddAccountOpen={setIsAddAccountOpen} setSelectedAccount={setSelectedAccount} setEditAccountBalance={setEditAccountBalance} renderHeroShell={renderHeroShell} />}
            {activeTab === "bills" && <Bills userName={userName} bills={dynamicBills} isDarkMode={isDarkMode} handleBillClick={handleBillClick} setSelectedEntry={openEntryDrawer} renderHeroShell={renderHeroShell} handleRolloverMonth={handleRolloverMonth} />}
            {activeTab === "activity" && <Activity userName={userName} transactions={transactions} activitySearch={activitySearch} setActivitySearch={setActivitySearch} activityFilter={activityFilter} setActivityFilter={setActivityFilter} isDarkMode={isDarkMode} setSelectedEntry={openEntryDrawer} renderHeroShell={renderHeroShell} />}
            {activeTab === "todo" && <Todo userName={userName} todos={todos} newTodoText={newTodoText} setNewTodoText={setNewTodoText} newTodoPriority={newTodoPriority} setNewTodoPriority={setNewTodoPriority} newTodoType={newTodoType} setNewTodoType={setNewTodoType} isDarkMode={isDarkMode} handleAddTodo={async (e) => { e.preventDefault(); if(!newTodoText.trim()) return; if (isDemoMode) { setTodos([{ id: `todo_demo_${Date.now()}`, text: newTodoText, priority: newTodoPriority, type: newTodoType, isCompleted: false }, ...todos]); } else { await addDoc(collection(db, "users", user.uid, "todos"), { text: newTodoText, priority: newTodoPriority, type: newTodoType, isCompleted: false, createdAt: serverTimestamp() }); } triggerVictory(); setNewTodoText(""); setNewTodoPriority(3); }} toggleTodoStatus={async (id) => { triggerHaptic(); const todo = todos.find(t => t.id === id); if (isDemoMode) { setTodos(todos.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)); } else { await updateDoc(doc(db, "users", user.uid, "todos", id), { isCompleted: !todo.isCompleted }); } }} setSelectedTodo={setSelectedTodo} renderHeroShell={renderHeroShell} />}
          </div>

          <div className={`absolute ${isDemoMode ? "bottom-[190px]" : "bottom-24"} right-6 z-40 lg:hidden`}><button onClick={() => setIsQabOpen(true)} className={`w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#1877F2] shadow-[0_12px_24px_rgba(24,119,242,0.4)] border-4 ${isDarkMode ? "border-[#0F172A]" : "border-white"}`}><Plus size={28} /></button></div>
          <div className={`lg:hidden absolute ${isDemoMode ? "bottom-[90px]" : "bottom-0"} left-0 w-full backdrop-blur-md border-t px-2 pt-3 pb-6 flex justify-between items-center z-40 ${isDarkMode ? "bg-[#1E293B]/95 border-slate-800" : "bg-white/95 border-slate-100"}`}>
            {[{ id: "home", icon: Home, label: "Home" }, { id: "accounts", icon: Wallet, label: "Accounts" }, { id: "bills", icon: CalendarIcon, label: "Bills" }, { id: "activity", icon: CreditCard, label: "Activity" }, { id: "todo", icon: CheckSquare, label: "To-Do" }].map((tab) => (
              <button key={tab.id} onClick={() => changeTab(tab.id)} className="flex-1 flex flex-col items-center gap-1 group">
                <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={`transition-all duration-300 ${activeTab === tab.id ? "text-[#1877F2] transform -translate-y-1" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === tab.id ? "text-[#1877F2]" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RECONSTRUCTED MODALS */}
        {/* ========================================================= */}

        {/* 1. NOTIFICATIONS MODAL */}
        {isNotificationsOpen && (
          <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsNotificationsOpen(false)}></div>
            <div className={`w-full lg:max-w-md h-[80vh] rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Command Center</h3>
                <button onClick={() => setIsNotificationsOpen(false)} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-10 opacity-50"><CheckCircle2 size={40} className="mx-auto mb-4 text-[#10B981]" /><p className="font-bold text-sm">All Systems Go</p><p className="text-xs mt-1">Zero active alerts.</p></div>
                ) : (
                  activeAlerts.map(alert => (
                    <div key={alert.id} onClick={alert.action} className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-transform active:scale-[0.98] border ${alert.type === 'danger' ? isDarkMode ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-100" : alert.type === 'warning' ? isDarkMode ? "bg-orange-900/20 border-orange-900/50" : "bg-orange-50 border-orange-100" : alert.type === 'success' ? isDarkMode ? "bg-emerald-900/20 border-emerald-900/50" : "bg-emerald-50 border-emerald-100" : isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                      <div className={`mt-1 p-2 rounded-full ${isDarkMode ? "bg-[#1E293B]" : "bg-white shadow-sm"}`}>{alert.icon}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`font-black text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{alert.title}</p>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${alert.type === 'danger' ? 'text-red-500' : 'text-slate-400'}`}>{alert.time}</span>
                        </div>
                        <p className={`text-xs font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{alert.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PAYDAY SETUP MODAL */}
        {isPaydaySetupOpen && (
          <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsPaydaySetupOpen(false)}></div>
            <div className={`w-full lg:max-w-md h-[90vh] lg:h-[80vh] rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Payday Routing</h3>
                <button onClick={() => setIsPaydaySetupOpen(false)} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map((pd) => (
                  <div key={pd} className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                    <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{pd}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Expected Date</label>
                        <input type="date" value={editPaydayConfig[pd]?.date || ""} onChange={(e) => setEditPaydayConfig({...editPaydayConfig, [pd]: {...editPaydayConfig[pd], date: e.target.value}})} className={`w-full p-3 rounded-xl font-bold text-xs border focus:outline-none ${isDarkMode ? "bg-[#1E293B] border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Expected Income</label>
                        <input type="number" placeholder="$0.00" value={editPaydayConfig[pd]?.income || ""} onChange={(e) => setEditPaydayConfig({...editPaydayConfig, [pd]: {...editPaydayConfig[pd], income: e.target.value}})} className={`w-full p-3 rounded-xl font-bold text-xs border focus:outline-none ${isDarkMode ? "bg-[#1E293B] border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`p-6 border-t flex gap-3 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                <button onClick={clearPaydayConfig} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all active:scale-[0.98] ${isDarkMode ? "text-slate-300 border-slate-700 hover:bg-slate-800" : "text-slate-500 border-slate-200 hover:bg-slate-50"}`}>Clear All</button>
                <button onClick={savePaydayConfig} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]">Save Engine</button>
              </div>
            </div>
          </div>
        )}

        {/* 3. ADD ACCOUNT MODAL */}
        {isAddAccountOpen && (
          <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddAccountOpen(false)}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Add Account</h3>
                <button onClick={() => setIsAddAccountOpen(false)} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="relative">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Account Name</label>
                  <input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                </div>
                <div className="relative">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Current Balance</label>
                  <input type="number" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                </div>
                <div className="relative">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Account Type</label>
                  <select value={newAccType} onChange={(e) => setNewAccType(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none appearance-none ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                    <option>Checking</option><option>Savings</option><option>Credit Card</option><option>Cash</option><option>401k / Retirement</option>
                  </select>
                </div>
                <button onClick={handleAddAccount} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]">Save Account</button>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRANSFER MODAL */}
        {isTransferOpen && (
          <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsTransferOpen(false)}></div>
            <div className={`w-full lg:max-w-md h-[85vh] lg:h-auto rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className={`font-black uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}><ArrowRightLeft size={16}/> Internal Transfer</h3>
                <button onClick={() => setIsTransferOpen(false)} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
              </div>
              <div className="p-6 flex-1 flex flex-col overflow-y-auto">
                <div className="flex items-center gap-2 mb-6">
                  <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs border appearance-none text-center ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}><option value="" disabled>From Account</option>{accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}</select>
                  <ArrowRight size={16} className={isDarkMode ? "text-slate-500" : "text-slate-400"} />
                  <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs border appearance-none text-center ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}><option value="" disabled>To Account</option>{accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}</select>
                </div>
                <div className="text-center mb-6">
                  <span className={`text-6xl font-extrabold tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>${transferAmount}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-auto">
                  {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => {
                    const isOp = ["÷", "×", "-", "+", "="].includes(btn);
                    return ( <button key={btn} onClick={() => handleTransferNumpad(btn)} className={`h-14 rounded-2xl text-2xl font-bold flex items-center justify-center transition-all active:scale-95 ${isOp ? isDarkMode ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-500 border border-slate-200" : isDarkMode ? "bg-[#0F172A] text-white shadow-sm" : "bg-white text-slate-800 shadow-sm border border-slate-100"}`}> {btn} </button> );
                  })}
                </div>
                <button onClick={executeTransfer} disabled={parseFloat(transferAmount) <= 0 || !transferFrom || !transferTo} className={`w-full mt-6 h-16 rounded-2xl font-black uppercase tracking-widest text-sm text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${parseFloat(transferAmount) <= 0 || !transferFrom || !transferTo ? "bg-slate-300 opacity-50 shadow-none" : "bg-[#1877F2] shadow-blue-500/40"}`}>Execute Transfer</button>
              </div>
            </div>
          </div>
        )}

        {/* 5. EDIT ACCOUNT MODAL */}
        {selectedAccount && !isAddAccountOpen && !isTransferOpen && (
          <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedAccount(null)}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>{selectedAccount.icon}</div>
                  <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedAccount.name}</h3>
                </div>
                <button onClick={() => setSelectedAccount(null)} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="relative">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Quick Update Balance</label>
                  <input type="number" value={editAccountBalance} onChange={(e) => setEditAccountBalance(e.target.value)} onFocus={() => setEditAccountBalance(Math.abs(selectedAccount.balance).toString())} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                </div>
                <button onClick={updateAccountBalance} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]">Save Balance</button>
                <button onClick={deleteAccount} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-500 border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/50 border-red-100"}`}><Trash2 size={16}/> Delete Account</button>
              </div>
            </div>
          </div>
        )}

        {/* 6. PAYMENT CONFIRMATION MODAL */}
        {paymentModalConfig.isOpen && (
          <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" })}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Confirm Payment</h3>
                <button onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" })} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="relative">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Pay From Account</label>
                  <select value={paymentModalConfig.accountId} onChange={(e) => setPaymentModalConfig({ ...paymentModalConfig, accountId: e.target.value })} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none appearance-none ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                    {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>))}
                  </select>
                </div>
                <button onClick={confirmPaymentRoute} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#10B981] shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Complete Payment</button>
              </div>
            </div>
          </div>
        )}

        {/* 7. ENTRY DETAILS & EDIT MODAL */}
        {selectedEntry && !selectedAccount && (
          <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={closeEntryDrawer}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>{isEditingEntry ? (editEntryData.icon || selectedEntry.icon) : selectedEntry.icon}</div>
                  <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{isEditingEntry ? "Edit Entry" : "Entry Details"}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingEntry && (
                    <button onClick={() => { setIsEditingEntry(true); setEditEntryData({ name: selectedEntry.name, amount: selectedEntry.amount, category: selectedEntry.category, icon: selectedEntry.icon, rawDate: selectedEntry.rawDate || "" }); }} className={`p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-[#1877F2]" : "text-slate-500 hover:bg-slate-100 hover:text-[#1877F2]"}`}><Edit2 size={16} /></button>
                  )}
                  <button onClick={closeEntryDrawer} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {!isEditingEntry ? (
                  <>
                    <div className="text-center">
                      <h2 className={`text-xl font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEntry.name}</h2>
                      <p className={`text-5xl font-black tracking-tighter ${selectedEntry.type === 'Income' ? 'text-[#10B981]' : selectedEntry.isPaid ? 'text-slate-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {selectedEntry.type === 'Income' ? '+' : selectedEntry.type === 'Expense' ? '-' : ''}${selectedEntry.amount?.toFixed(2)}
                      </p>
                      <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                        <CalendarIcon size={14} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{selectedEntry.fullDate || selectedEntry.date || "No Date"}</span>
                      </div>
                    </div>
                    
                    <div className={`rounded-2xl p-4 border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</span>
                        <span className={`text-xs font-black ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>{selectedEntry.category || "Bill / Subscription"}</span>
                      </div>
                      {selectedEntry.type && (
                        <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</span>
                          <span className={`text-xs font-black ${selectedEntry.type === "Income" ? "text-[#10B981]" : "text-[#F97316]"}`}>{selectedEntry.type}</span>
                        </div>
                      )}
                      {selectedEntry.payday && (
                        <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned To</span>
                          <span className={`text-xs font-black ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>{selectedEntry.payday}</span>
                        </div>
                      )}
                      {selectedEntry.isOverdue !== undefined && (
                        <div className="flex justify-between py-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                          <span className={`text-xs font-black ${selectedEntry.isPaid ? "text-[#10B981]" : selectedEntry.isOverdue ? "text-red-500" : "text-[#F97316]"}`}>{selectedEntry.isPaid ? "Paid" : selectedEntry.isOverdue ? "Overdue" : "Pending"}</span>
                        </div>
                      )}
                    </div>
                    
                    {selectedEntry.isOverdue !== undefined && !selectedEntry.isPaid && (
                      <button onClick={() => { setSelectedEntry(null); setPaymentModalConfig({ isOpen: true, billId: selectedEntry.id, accountId: accounts.find(a => a.type === "Checking" || a.type === "Cash")?.id || (accounts[0]?.id || "") }); }} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} /> Mark as Paid
                      </button>
                    )}

                    <button onClick={async () => { if(window.confirm("Are you sure you want to delete this entry?")) { const colName = selectedEntry.fullDate ? "bills" : "transactions"; if (isDemoMode) { if (colName === "bills") { setBills(bills.filter(b => b.id !== selectedEntry.id)); } else { setTransactions(transactions.filter(t => t.id !== selectedEntry.id)); } } else { await deleteDoc(doc(db, "users", user.uid, colName, selectedEntry.id)); if(!selectedEntry.fullDate && selectedEntry.accountId) { const acc = accounts.find(a => a.id === selectedEntry.accountId); if(acc) { const revAmount = selectedEntry.type === "Income" ? -selectedEntry.amount : selectedEntry.amount; await updateDoc(doc(db, "users", user.uid, "accounts", acc.id), { balance: acc.balance + revAmount }); } } } setSelectedEntry(null); triggerHaptic(); } }} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-500 border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isDarkMode ? "bg-red-900/10 border-red-900/30 hover:bg-red-900/20" : "bg-red-50/50 border-red-100 hover:bg-red-50"}`}>
                      <Trash2 size={16} /> Delete Entry
                    </button>
                  </>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="relative">
                       <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Name</label>
                       <input type="text" value={editEntryData.name || ""} onChange={(e) => setEditEntryData({...editEntryData, name: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                    </div>
                    <div className="relative">
                       <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Amount</label>
                       <input type="number" value={editEntryData.amount || ""} onChange={(e) => setEditEntryData({...editEntryData, amount: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                    </div>
                    <div className="relative">
                       <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Icon</label>
                       <select value={editEntryData.icon || ""} onChange={(e) => setEditEntryData({...editEntryData, icon: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-xl border focus:outline-none transition-colors appearance-none ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                         {categoryEmojis.map((emoji) => (<option key={emoji} value={emoji}>{emoji}</option>))}
                       </select>
                    </div>
                    <div className="relative">
                       <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Category</label>
                       <select value={editEntryData.category || ""} onChange={(e) => setEditEntryData({...editEntryData, category: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors appearance-none ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                         {modernCategories.map(group => ( <optgroup key={group.group} label={group.group}> {group.items.map(item => <option key={item} value={item}>{item}</option>)} </optgroup> ))}
                       </select>
                    </div>
                    {selectedEntry.fullDate !== undefined && (
                      <div className="relative">
                         <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Due Date</label>
                         <input type="date" value={editEntryData.rawDate || ""} onChange={(e) => setEditEntryData({...editEntryData, rawDate: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                      </div>
                    )}
                    <button onClick={handleSaveEntryEdit} className="w-full mt-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"><Save size={16} /> Save Changes</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. QUICK ADD BUTTON MODAL */}
        {isQabOpen && (() => {
          const activeText = drawerTab === "bills" ? "text-[#1877F2]" : drawerTab === "income" ? "text-[#10B981]" : "text-[#F97316]";
          const activeBg = drawerTab === "bills" ? "bg-[#1877F2]" : drawerTab === "income" ? "bg-[#10B981]" : "bg-[#F97316]";
          const activeShadow = drawerTab === "bills" ? "shadow-blue-500/40" : drawerTab === "income" ? "shadow-emerald-500/40" : "shadow-orange-500/40";
          const activeSoftBg = drawerTab === "bills" ? (isDarkMode ? "bg-blue-900/20" : "bg-blue-50") : drawerTab === "income" ? (isDarkMode ? "bg-emerald-900/20" : "bg-emerald-50") : (isDarkMode ? "bg-orange-900/20" : "bg-orange-50");
          const activeLabel = drawerTab === "bills" ? "New Bill" : drawerTab === "income" ? "New Income" : "New Expense";
          
          return (
            <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={closeQab}></div>
              <div className={`w-full lg:max-w-md lg:h-[80vh] rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col max-h-[95vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
                <button onClick={closeQab} className="absolute top-5 right-5 p-2 rounded-full z-20"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
                
                <div className={`px-6 pt-6 pb-6 border-b shrink-0 transition-colors duration-500 ${activeSoftBg} rounded-t-[2.5rem]`}>
                  <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 opacity-30 lg:hidden ${activeBg}`}></div>
                  {qabStep === 1 ? (
                    <div className={`flex rounded-xl p-1 mb-6 mx-auto max-w-[280px] border shadow-sm ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white/80 border-slate-200 backdrop-blur-md"}`}>
                      <button onClick={() => { setDrawerTab("bills"); setEntryIcon("🧾"); setEntryCategory(""); }} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "bills" ? `${activeBg} text-white shadow-md` : "text-slate-400"}`}>Bills</button>
                      <button onClick={() => { setDrawerTab("income"); setEntryIcon("💵"); setEntryCategory(""); }} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "income" ? `${activeBg} text-white shadow-md` : "text-slate-400"}`}>Income</button>
                      <button onClick={() => { setDrawerTab("transactions"); setEntryIcon("💳"); setEntryCategory(""); }} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "transactions" ? `${activeBg} text-white shadow-md` : "text-slate-400"}`}>Activity</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mb-6 -mt-2">
                      <button onClick={() => setQabStep(1)} className={`p-2 rounded-full transition-colors ${activeText} hover:bg-white/50`}><ArrowRight className="rotate-180" size={20} /></button>
                      <div className="flex flex-col">
                        <h3 className={`font-black text-sm uppercase tracking-widest ${activeText}`}>{activeLabel} Details</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step 2 of 2</p>
                      </div>
                    </div>
                  )}
                  <div className="text-center relative flex justify-center items-center">
                    <span className={`text-6xl font-extrabold tracking-tighter drop-shadow-sm transition-colors duration-300 ${activeText}`}>${inputValue}</span>
                    {qabStep === 1 && <button onClick={() => setInputValue(inputValue.slice(0, -1) || "0")} className={`absolute right-4 p-3 rounded-full hover:bg-white/50 transition-colors ${activeText} opacity-70 hover:opacity-100`}>⌫</button>}
                  </div>
                </div>

                <div className={`p-6 mt-auto lg:rounded-b-[2.5rem] flex-1 flex flex-col overflow-y-auto ${isDarkMode ? "bg-[#0F172A]" : "bg-white"}`}>
                  {qabStep === 1 ? (
                    <>
                      <div className="grid grid-cols-4 gap-3 mt-2">
                        {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => {
                          const isOp = ["÷", "×", "-", "+", "="].includes(btn);
                          return ( <button key={btn} onClick={() => handleNumpad(btn)} className={`h-14 rounded-2xl text-2xl font-bold flex items-center justify-center transition-all active:scale-95 ${isOp ? isDarkMode ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-500 border border-slate-200" : isDarkMode ? "bg-[#1E293B] text-white shadow-sm" : "bg-white text-slate-800 shadow-sm border border-slate-100"}`}> {btn} </button> );
                        })}
                      </div>
                      <button onClick={() => { if (parseFloat(inputValue) > 0) setQabStep(2); }} disabled={parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue))} className={`w-full mt-6 h-16 rounded-2xl font-black uppercase tracking-widest text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${parseFloat(inputValue) <= 0 || isNaN(parseFloat(inputValue)) ? "bg-slate-300 opacity-50 shadow-none cursor-not-allowed" : `${activeBg} ${activeShadow} hover:-translate-y-1`}`}>Continue to Details <ArrowRight size={18} /></button>
                    </>
                  ) : (
                    <div className="flex flex-col h-full animate-fade-in relative">
                      <div className="space-y-4 flex-1 pb-6">
                        <div className="relative">
                           <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{drawerTab === 'income' ? 'Source / Payer' : drawerTab === 'transactions' ? 'Merchant' : 'Bill Name'}</label>
                           <input type="text" placeholder="e.g., Netflix, Salary, Target" value={entryName} onChange={(e) => setEntryName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white focus:border-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"}`} />
                        </div>
                        <div className="relative cursor-pointer" onClick={() => setIsCategorySelectorOpen(true)}>
                           <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest pointer-events-none ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Category</label>
                           <div className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border transition-colors flex items-center justify-between ${isDarkMode ? "bg-[#1E293B] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}><span>{entryCategory || "Select a category..."}</span><ArrowDown size={14} className={isDarkMode ? "text-slate-500" : "text-slate-400"} /></div>
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
                               <option value="" disabled>{drawerTab === 'income' ? 'Which Account Does This Go Into?' : 'Which account is paying for this?'}</option>
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
                            <div className="flex items-center justify-between cursor-pointer mb-5" onClick={() => setEntryIsRecurring(!entryIsRecurring)}>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${entryIsRecurring ? activeText : "text-slate-400"}`}>Recurring Monthly?</span>
                              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${entryIsRecurring ? activeBg : "bg-slate-300 dark:bg-slate-600"}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${entryIsRecurring ? "translate-x-4" : "translate-x-0"}`}></div></div>
                            </div>
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => setEntryIsInstallment(!entryIsInstallment)}>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${entryIsInstallment ? activeText : "text-slate-400"}`}>Installment Plan?</span>
                              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${entryIsInstallment ? activeBg : "bg-slate-300 dark:bg-slate-600"}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${entryIsInstallment ? "translate-x-4" : "translate-x-0"}`}></div></div>
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
                      <button onClick={handleConfirmAction} className={`w-full mt-4 h-16 shrink-0 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${activeBg} ${activeShadow}`}>Confirm & Save <CheckCircle2 size={18} /></button>
                      
                      {isCategorySelectorOpen && (
                         <div className={`absolute inset-0 z-50 flex flex-col animate-slide-up rounded-2xl overflow-hidden ${isDarkMode ? "bg-[#0F172A]" : "bg-white"}`}>
                            <div className={`p-4 border-b flex justify-between items-center shrink-0 ${isDarkMode ? "border-slate-800 bg-[#1E293B]" : "border-slate-100 bg-slate-50"}`}>
                               <h3 className={`font-black uppercase tracking-widest text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Category</h3>
                               <button onClick={() => setIsCategorySelectorOpen(false)} className={`p-2 rounded-full ${isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"}`}><X size={18}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 hide-scrollbar">
                               {categoriesToRender.map(group => (
                                   <div key={group.group}>
                                       <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{group.group}</p>
                                       <div className="grid grid-cols-1 gap-2">
                                          {group.items.map(item => (
                                              <button key={item} onClick={() => { setEntryCategory(item); setIsCategorySelectorOpen(false); }} className={`w-full p-4 text-left rounded-xl text-xs font-bold border transition-colors ${entryCategory === item ? `${activeBg} text-white border-transparent` : isDarkMode ? "bg-[#1E293B] border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>{item}</button>
                                          ))}
                                       </div>
                                   </div>
                               ))}
                            </div>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 9. INSTALLMENT NEXT DATE MODAL */}
        {installmentPromptConfig.isOpen && (
          <div className="absolute inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setInstallmentPromptConfig({ isOpen: false, billId: null, nextDate: "" })}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className={`p-6 border-b flex justify-between items-center shrink-0 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                <h3 className={`font-black uppercase tracking-widest text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Next Installment Date</h3>
                <button onClick={() => setInstallmentPromptConfig({ isOpen: false, billId: null, nextDate: "" })} className={`p-2 rounded-full ${isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"}`}><X size={18}/></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <h2 className={`text-lg font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Payment Logged!</h2>
                  <p className={`text-xs font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>When is your next payment due for this installment plan?</p>
                </div>
                <div className="relative">
                   <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Next Due Date</label>
                   <input type="date" value={installmentPromptConfig.nextDate} onChange={(e) => setInstallmentPromptConfig({...installmentPromptConfig, nextDate: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white focus:border-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"}`} />
                </div>
                <button onClick={handleSaveNextInstallmentDate} disabled={!installmentPromptConfig.nextDate} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${!installmentPromptConfig.nextDate ? "bg-slate-300 opacity-50 shadow-none cursor-not-allowed" : "bg-[#1877F2] shadow-blue-500/30"}`}><CalendarIcon size={16}/> Route to Payday</button>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 MEGA-BURST CONFETTI OVERLAY 🔥 */}
        {showConfetti && (
          <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
            {[...Array(200)].map((_, i) => (
              <div key={i} className="absolute w-3 h-3 rounded-sm" style={{ 
                backgroundColor: ['#1877F2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#FFFFFF', '#FFD700', '#059669'][Math.floor(Math.random() * 8)], 
                left: '50%', top: '50%', transform: `translate(-50%, -50%)`, 
                animation: `explode 2s ease-out forwards`, 
                '--tx': `${(Math.random() - 0.5) * 1500}px`, 
                '--ty': `${(Math.random() - 0.5) * 1500}px`, 
                '--rot': `${Math.random() * 720}deg` 
              }} />
            ))}
            <style>{`@keyframes explode { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 1; } 80% { opacity: 1; } 100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(calc(var(--rot))) scale(0); opacity: 0; } }`}</style>
          </div>
        )}

      </div>

      {/* 🔥 DEMO MODE FLOATING SIGN UP BANNER 🔥 */}
      {isDemoMode && (
        <div className="fixed bottom-0 left-0 w-full min-h-[90px] bg-[#1877F2] text-white p-4 pb-8 lg:pb-4 flex justify-between items-center z-[100] shadow-[0_-10px_40px_rgba(24,119,242,0.3)]">
          <div className="flex flex-col">
            <span className="font-black text-sm lg:text-base tracking-tight uppercase flex items-center gap-2">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>
              Demo Mode Active
            </span>
            <span className="text-[10px] lg:text-xs font-bold text-blue-200">Changes will not be saved.</span>
          </div>
          <button 
            onClick={() => window.location.href = "https://ledgerplanner.com"} 
            className="bg-white text-[#1877F2] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg border-2 border-transparent hover:border-white hover:bg-transparent hover:text-white"
          >
            Sign Up to Save
          </button>
        </div>
      )}

    </div>
  );
}
