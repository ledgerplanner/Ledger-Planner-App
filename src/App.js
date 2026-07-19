import React, { useState, useEffect, useRef } from "react";
import {
  Home, Wallet, Calendar as CalendarIcon, CreditCard, CheckSquare,
  Bell, Moon, Sun, Plus, Settings as SettingsIcon, LogOut, AlertCircle, X, CheckCircle2
} from "lucide-react";

// === FIREBASE INITIALIZATION ===
import { auth, db, messaging, VAPID_KEY } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, updateProfile 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc, collection, addDoc, deleteDoc, getDocs, getDoc } from "firebase/firestore";

// === CONTEXT & HOOKS ===
import { LedgerProvider, useLedger } from "./context/LedgerContext";
import { useLedgerData } from "./hooks/useLedgerData";

// === CORE VIEWS ===
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Bills from "./components/Bills";
import Activity from "./components/Activity";
import Todo from "./components/Todo";
import Settings from "./components/Settings";

// === EXTRACTED MODALS ===
import QuickAddModal from "./components/modals/QuickAddModal";
import CommandCenter from "./components/modals/CommandCenter";
import TransferEngine from "./components/modals/TransferEngine";
import AccountBuilder from "./components/modals/AccountBuilder";
import PaydaySetup from "./components/modals/PaydaySetup";
import EditEntryDrawer from "./components/modals/EditEntryDrawer";
import PaymentModal from "./components/modals/PaymentModal";

function LedgerApp() {
  // 1. INITIATE THE BACKGROUND DATA PUMP
  useLedgerData();

  // 2. PULL MASTER STATES FROM THE CLOUD
  const { 
    user, setUser, isDemoMode, setIsDemoMode, 
    accounts, setAccounts, bills, setBills, transactions, setTransactions, todos, setTodos, paydayConfig, setPaydayConfig,
    isDarkMode, setIsDarkMode, signatureColor, setSignatureColor,
    isEntrepreneurMode, setIsEntrepreneurMode 
  } = useLedger();

  // === DYNAMIC COMPUTATIONS ===
  const userNameDisplay = isDemoMode ? "Aaron" : user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Founder";

  // === LOCAL UI & ROUTING STATE ===
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  
  const [manualThemeOverride, setManualThemeOverride] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);
  const [aiBriefingText, setAiBriefingText] = useState("");
  const scrollRef = useRef(null);

  // === FORT KNOX OFFLINE ENGINE ===
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth Forms
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Modal Visibility Toggles
  const [isQabOpen, setIsQabOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCashOutOpen, setIsCashOutOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  const [collapsedPaydays, setCollapsedPaydays] = useState({});

  // Activity States
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("All");

  // Todo States
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoType, setNewTodoType] = useState("task");

  // Global Action Modal
  const [globalActionConfig, setGlobalActionConfig] = useState({
    isOpen: false, title: "", message: "", confirmText: "Confirm", isDestructive: false, isAlertOnly: false, onConfirm: null
  });

  // Master Buffers
  const [cashOutGoal, setCashOutGoal] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editEntryData, setEditEntryData] = useState({});
  const [paymentModalConfig, setPaymentModalConfig] = useState({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
  const [installmentPromptConfig, setInstallmentPromptConfig] = useState({ isOpen: false, billId: null, nextDate: "" });
  const [editPaydayConfig, setEditPaydayConfig] = useState(paydayConfig);
  const [currentCurrency, setCurrentCurrency] = useState("USD ($)");
  const [resetConfirm, setResetConfirm] = useState("");

  // Push Notifications
  const [isPushEnabled, setIsPushEnabled] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) return Notification.permission === "granted";
    return false;
  });

  const [showConfetti, setShowConfetti] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const sessionMonth = useRef(new Date().getMonth());

  // === UNIVERSAL UTILS ===
  const triggerHaptic = (pattern = 50) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };
  
  const triggerVictory = () => { 
    triggerHaptic([30, 50, 30]); 
    setShowConfetti(true); 
    setTimeout(() => setShowConfetti(false), 5200);
  };

  const closeGlobalAction = () => setGlobalActionConfig(prev => ({ ...prev, isOpen: false }));

  const openGlobalAction = (title, message, confirmText, isDestructive, onConfirm, isAlertOnly = false) => {
    triggerHaptic(20);
    setGlobalActionConfig({ isOpen: true, title, message, confirmText, isDestructive, isAlertOnly, onConfirm });
  };
  
  const executeGlobalAction = () => {
    if (globalActionConfig.onConfirm) globalActionConfig.onConfirm();
    closeGlobalAction();
  };

  // === OFFLINE INTERCEPTOR ===
  const triggerOfflineLock = () => {
    openGlobalAction(
      "Vault Locked",
      "You are currently offline. Ledger Planner is in Read-Only mode to protect your data. Please reconnect to log new transactions.",
      "Understood",
      false,
      null,
      true
    );
  };

  // INTERCEPTED MODAL OPENERS
  const handleOpenQab = () => { if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; } setIsQabOpen(true); };
  const handleOpenTransfer = () => { if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; } setIsTransferOpen(true); };
  const handleOpenAddAccount = () => { if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; } setIsAddAccountOpen(true); };
  const handleOpenAddGoal = () => { if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; } setIsAddGoalOpen(true); };
  const handleOpenPaydaySetup = () => { if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; } setIsPaydaySetupOpen(true); };

  const enablePushNotifications = async () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    triggerHaptic(50);
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setIsPushEnabled(true);
        if (messaging && user && !isDemoMode) {
          const token = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (token) {
            await setDoc(doc(db, "users", user.uid), { pushToken: token, pushTokenUpdatedAt: serverTimestamp() }, { merge: true });
          }
        }
        openGlobalAction("Notifications On", "The structural system channel bridges are live.", "Close", false, () => closeGlobalAction(), true);
      } else {
        setIsPushEnabled(false);
      }
    } catch (e) {
      console.error("Push system activation fault:", e);
    }
  };

  const handleScroll = (e) => { setIsScrolled(e.target.scrollTop > 20); };

  const changeTab = (tabId) => {
    triggerHaptic(20);
    setActiveTab(tabId);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEntryDrawer = (entry) => { setSelectedEntry(entry); setIsEditingEntry(false); };
  const closeEntryDrawer = () => { setSelectedEntry(null); setIsEditingEntry(false); };

  const toggleCollapse = (payday) => {
    triggerHaptic(15);
    setCollapsedPaydays(prev => ({ ...prev, [payday]: !prev[payday] }));
  };

  const clearPaydayConfig = () => { 
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    setEditPaydayConfig({ frequency: "Weekly", "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" }, "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" }, "Payday 5": { date: "", income: "" } });
    triggerHaptic(50); 
  };
  
  const savePaydayConfig = async () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    setPaydayConfig(editPaydayConfig);
    if (!isDemoMode && user) { await setDoc(doc(db, "users", user.uid, "settings", "paydayConfig"), editPaydayConfig); }
    setIsPaydaySetupOpen(false); 
    triggerVictory();
  };

  const handleSaveNextInstallmentDate = async () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    if (!installmentPromptConfig.nextDate) return;
    const bill = bills.find(b => b.id === installmentPromptConfig.billId);
    if(!bill) return;
    const dateObj = new Date(installmentPromptConfig.nextDate);
    if (isNaN(dateObj.getTime())) return;

    const sortableDay = dateObj.getUTCDate();
    const displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const newPayday = calculatePaydayGroup(installmentPromptConfig.nextDate);
    if (isDemoMode) {
      setBills(bills.map(b => b.id === bill.id ? { ...b, rawDate: installmentPromptConfig.nextDate, date: sortableDay, fullDate: displayDate, payday: newPayday, isOverdue: false } : b));
    } else {
      await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { rawDate: installmentPromptConfig.nextDate, date: sortableDay, fullDate: displayDate, payday: newPayday, isOverdue: false });
    }
    triggerVictory(); setInstallmentPromptConfig({ isOpen: false, billId: null, nextDate: "" });
  };

  const handleBillClick = async (id) => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    if (bill.isPaid) {
      const refundAccountId = bill.paidFromAccountId;
      const targetAcc = accounts.find(a => a.id === refundAccountId);
      const linkedTx = transactions.find(t => t.id === bill.linkedTxId);
      const exactRefundAmount = linkedTx ? (linkedTx.amount || 0) : (bill.amount || 0);

      let newPaidAmount = bill.paidAmount || 0;
      if (bill.isInstallment) newPaidAmount = Math.max(0, (bill.paidAmount || 0) - exactRefundAmount);

      if (isDemoMode) {
        setBills(bills.map(b => b.id === id ? { ...b, isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null, linkedTxId: null, settledDate: null } : b));
        if (targetAcc) setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: a.balance + exactRefundAmount } : a));
        if (bill.linkedTxId) setTransactions(transactions.filter(t => t.id !== bill.linkedTxId));
      } else {
        await updateDoc(doc(db, "users", user.uid, "bills", id), { isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null, linkedTxId: null, settledDate: null });
        if (targetAcc) await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance + exactRefundAmount });
        if (bill.linkedTxId) await deleteDoc(doc(db, "users", user.uid, "transactions", bill.linkedTxId));
      }
      triggerHaptic(50);
      return;
    }
    setPaymentModalConfig({ isOpen: true, billId: id, accountId: accounts.find(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash"))?.id || (accounts[0]?.id || ""), isPayInFull: false });
  };

  const confirmPaymentRoute = async () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    const bill = bills.find(b => b.id === paymentModalConfig.billId);
    let targetAcc = accounts.find(a => a.id === paymentModalConfig.accountId);
    if (!targetAcc) targetAcc = accounts.find(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")) || accounts[0];

    if (!bill || !targetAcc) return;
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    const settledDateStamp = currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    const remainingBalance = (bill.totalAmount || 0) - (bill.paidAmount || 0);
    const amountToPay = paymentModalConfig.isPayInFull ? remainingBalance : (bill.amount || 0);

    if (isDemoMode) {
      const txId = `tx_demo_${Date.now()}`;
      setTransactions([{ id: txId, name: bill.name || "Bill", icon: bill.icon || "🧾", amount: amountToPay, date: autoTimeStamp, type: "Expense", category: bill.category || "Bill Payment", accountId: targetAcc.id, isBillPayment: true }, ...transactions]);
      setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: (a.balance || 0) - amountToPay } : a));
      if (bill.isInstallment) {
        const newPaidAmt = (bill.paidAmount || 0) + amountToPay;
        if (newPaidAmt >= (bill.totalAmount || 0) || paymentModalConfig.isPayInFull) {
          setBills(bills.map(b => b.id === bill.id ? { ...b, isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAcc.id, linkedTxId: txId, settledDate: settledDateStamp } : b));
          triggerVictory();
          setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
        } else {
          setBills(bills.map(b => b.id === bill.id ? { ...b, paidAmount: newPaidAmt, isOverdue: false } : b));
          triggerHaptic(50); setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false }); setInstallmentPromptConfig({ isOpen: true, billId: bill.id, nextDate: "" });
        }
      } else {
        setBills(bills.map(b => b.id === bill.id ? { ...b, isPaid: true, paidAmount: 0, paidFromAccountId: targetAcc.id, linkedTxId: txId, settledDate: settledDateStamp } : b));
        triggerVictory();
        setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
      }
    } else {
      const txRef = await addDoc(collection(db, "users", user.uid, "transactions"), { name: bill.name || "Bill", icon: bill.icon || "🧾", amount: amountToPay, date: autoTimeStamp, type: "Expense", category: bill.category || "Bill Payment", accountId: targetAcc.id, isBillPayment: true, createdAt: serverTimestamp() });
      await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: (targetAcc.balance || 0) - amountToPay });
      if (bill.isInstallment) {
        const newPaidAmt = (bill.paidAmount || 0) + amountToPay;
        if (newPaidAmt >= (bill.totalAmount || 0) || paymentModalConfig.isPayInFull) {
          await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id, settledDate: settledDateStamp });
          triggerVictory();
          setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
        } else {
          await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { paidAmount: newPaidAmt, isOverdue: false });
          triggerHaptic(50); setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false }); setInstallmentPromptConfig({ isOpen: true, billId: bill.id, nextDate: "" });
        }
      } else {
        await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: true, paidAmount: 0, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id, settledDate: settledDateStamp });
        triggerVictory();
        setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
      }
    }
  };

  const handleSaveEntryEdit = async () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    if (!selectedEntry) return;
    
    const isTransaction = !bills.some(b => b.id === selectedEntry.id);
    const colName = isTransaction ? "transactions" : "bills";

    const newAmount = parseFloat(editEntryData.amount) || 0;
    const oldAmount = parseFloat(selectedEntry.amount) || 0;
    const amountDelta = newAmount - oldAmount;
    const updatePayload = {
      name: editEntryData.name || selectedEntry.name || "Unnamed",
      amount: newAmount,
      category: editEntryData.category || selectedEntry.category || "Other",
      icon: editEntryData.icon || selectedEntry.icon || "🧾"
    };

    if (!isTransaction) {
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

      updatePayload.isRecurring = editEntryData.isRecurring || false;
      updatePayload.isInstallment = editEntryData.isInstallment || false;
      if (editEntryData.isInstallment) {
        updatePayload.totalAmount = parseFloat(editEntryData.totalAmount) || 0;
        updatePayload.paidAmount = parseFloat(editEntryData.paidAmount) || 0;
      } else {
        updatePayload.totalAmount = 0;
        updatePayload.paidAmount = 0;
      }
    }

    if (isDemoMode) {
      if (colName === "bills") {
        setBills(bills.map(b => b.id === selectedEntry.id ? { ...b, ...updatePayload } : b));
      } else {
        setTransactions(transactions.map(t => t.id === selectedEntry.id ? { ...t, ...updatePayload } : t));
        if (selectedEntry.accountId && amountDelta !== 0) {
           const isIncome = selectedEntry.type === "Income";
           const balanceChange = isIncome ? amountDelta : -amountDelta;
           setAccounts(accounts.map(a => a.id === selectedEntry.accountId ? { ...a, balance: (a.balance || 0) + balanceChange } : a));
        }
      }
    } else {
      await updateDoc(doc(db, "users", user.uid, colName, selectedEntry.id), updatePayload);
      if (isTransaction && selectedEntry.accountId && amountDelta !== 0) {
        const targetAcc = accounts.find(a => a.id === selectedEntry.accountId);
        if (targetAcc) {
          const isIncome = selectedEntry.type === "Income";
          const balanceChange = isIncome ? amountDelta : -amountDelta;
          await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: (targetAcc.balance || 0) + balanceChange });
        }
      }
    }

    setSelectedEntry({ ...selectedEntry, ...updatePayload });
    setIsEditingEntry(false); triggerVictory();
  };

  const handleAddTodo = async (e, emojiPayload = "📝") => {
    e.preventDefault();
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    if (!user || !newTodoText.trim()) return;
    try {
      if (!isDemoMode) {
        await addDoc(collection(db, "users", user.uid, "todos"), {
          text: newTodoText.trim(),
          priority: newTodoPriority,
          type: newTodoType,
          emoji: emojiPayload,
          isCompleted: false,
          createdAt: serverTimestamp()
        });
      }
      triggerVictory();
      setNewTodoText("");
      newTodoPriority !== 3 && setNewTodoPriority(3);
    } catch (error) { console.error("Error adding todo:", error); }
  };

  const toggleTodoStatus = async (todoId) => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    triggerHaptic(20);
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    if (!isDemoMode) await updateDoc(doc(db, "users", user.uid, "todos", todoId), { isCompleted: !todo.isCompleted });
  };

  const clearCompletedTodos = () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    openGlobalAction(
      "Clear Completed",
      "Are you sure you want to permanently delete all completed tasks?",
      "Delete All",
      true,
      async () => {
        if (isDemoMode) return;
        const completedTasks = todos.filter(t => t.isCompleted);
        for (const t of completedTasks) await deleteDoc(doc(db, "users", user.uid, "todos", t.id));
        triggerHaptic(50);
      }
    );
  };

  const handleFactoryReset = async () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    if (resetConfirm !== "RESET" || isDemoMode) return;
    try {
      const collectionsToWipe = ["transactions", "bills", "accounts", "todos"];
      for (const col of collectionsToWipe) {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, col));
        const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, "users", user.uid, col, document.id)));
        await Promise.all(deletePromises);
      }
      setResetConfirm("");
      triggerVictory();
    } catch (error) {
      console.error("Factory reset failed:", error);
    }
  };

  const handleRolloverMonth = async () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    if (isDemoMode) return;
    openGlobalAction("Start New Month", "Advance active tracking timelines. This will archive completed bills.", "Start Over", true, async () => {
      const completedBills = bills.filter(b => b.isPaid && !b.isRecurring);
      for (const b of completedBills) await updateDoc(doc(db, "users", user.uid, "bills", b.id), { isArchived: true });
      const recurringBills = bills.filter(b => b.isRecurring);
      for (const b of recurringBills) {
        if (b.rawDate) {
          const d = new Date(b.rawDate);
          d.setUTCMonth(d.getUTCMonth() + 1);
          const nextDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          await updateDoc(doc(db, "users", user.uid, "bills", b.id), { 
            rawDate: nextDate, date: d.getUTCDate(), fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), isPaid: false, paidAmount: b.isInstallment ? b.paidAmount : 0, settledDate: null
          });
        }
      }
      triggerVictory();
    });
  };

  const handleUpdateDisplayName = async (newName) => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    if (!newName || !newName.trim() || !user) return;
    const finalName = newName.trim();
    if (isDemoMode) { triggerHaptic(50); return; }
    try {
      await updateProfile(auth.currentUser, { displayName: finalName });
      await setDoc(doc(db, "users", user.uid), { firstName: finalName }, { merge: true });
      setUser({ ...user, displayName: finalName });
    } catch (error) {
      console.error("Failed to update display name:", error);
    }
  };

  const handleExportData = (targetYear) => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    
    triggerHaptic(50);
    try {
      const yearStr = targetYear.toString();
      let csvContent = "Type,Name,Amount,Category,Date,Status/Account\n";
      
      bills.forEach(b => {
        if (b.rawDate && b.rawDate.startsWith(yearStr)) {
          const amount = b.amount || 0;
          const status = b.isPaid ? "Paid" : "Pending";
          const safeName = (b.name || "Unnamed").replace(/,/g, " "); 
          const safeCategory = (b.category || "N/A").replace(/,/g, " ");
          csvContent += `Bill,${safeName},${amount},${safeCategory},${b.rawDate},${status}\n`;
        }
      });
      
      transactions.forEach(t => {
        let tYear = new Date().getFullYear();
        if (t.createdAt && t.createdAt.toDate) {
          tYear = t.createdAt.toDate().getFullYear();
        }
        
        if (tYear === targetYear || isDemoMode) {
           const amount = t.amount || 0;
           const accName = accounts.find(a => a.id === t.accountId)?.name || "Unknown Account";
           const safeName = (t.name || "Unnamed").replace(/,/g, " ");
           const safeCategory = (t.category || "N/A").replace(/,/g, " ");
           const safeDate = (t.date || "N/A").replace(/,/g, " ");
           const safeAcc = accName.replace(/,/g, " ");
           csvContent += `Transaction (${t.type}),${safeName},${amount},${safeCategory},${safeDate},${safeAcc}\n`;
        }
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `LP_Financial_Vault_${targetYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerVictory();
      openGlobalAction("Export Complete", `Your ${targetYear} historical master ledger has been successfully compiled and downloaded.`, "Close", false, () => {}, true);
    } catch (error) {
      console.error("Export Engine failed:", error);
    }
  };

  // === SURGICAL INJECTION: INTEGRATED RETENTION ROUTING CAPTURE ENGINE ===
  useEffect(() => {
    setIsMounted(true);
    const isDemo = window.location.hostname.includes("demo");
    if (isDemo) setIsDemoMode(true);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Background push banner click detection listener route
      navigator.serviceWorker.addEventListener("message", (event) => {
        const payloadData = event.data?.data;
        if (payloadData?.route) {
          // Deep-link past dashboard screen right into CommandCenter drawer
          setTimeout(() => changeTab(payloadData.route), 100);
          
          if (payloadData.triggerBirthdayConfetti === "true") {
            setTimeout(() => triggerVictory(), 600);
          }
        }
      });
    }

    if (messaging) {
      // Foreground active push notification app listeners
      onMessage(messaging, (payload) => {
        if (payload.data?.route) {
          setIsNotificationsOpen(true); // Hydrate local state automatically if open live
          if (payload.data.triggerBirthdayConfetti === "true") {
            triggerVictory();
          }
        }
      });
    }
  }, [setIsDemoMode]);

  useEffect(() => {
    if (!isMounted || isDemoMode) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setTimeout(() => setIsAuthLoading(false), 1200);
    });
    return () => unsubscribeAuth();
  }, [isMounted, isDemoMode, setUser]);

  // BIRTHDAY CONFETTI ENGINE
  useEffect(() => {
    if (!user || isDemoMode) return;
    const fetchBirthday = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.birthday) {
            const today = new Date();
            const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const bdayStr = data.birthday.length > 5 ? data.birthday.substring(5) : data.birthday; 
            const bdayYear = today.getFullYear();
            const storageKey = `lp_bday_celebrated_${bdayYear}`;
            
            if (bdayStr === todayStr && localStorage.getItem(storageKey) !== "true") {
              triggerVictory();
              const activeName = data.firstName || user?.displayName?.split(' ')[0] || "Founder";
              openGlobalAction("Happy Birthday! 🎂", `Happy Birthday, ${activeName}. We at Ledger Planner wish you many more!`, "Let's Go", false, () => {}, true);
              localStorage.setItem(storageKey, "true");
            }
          }
        }
      } catch (err) {
        console.error("Failed to check birthday status:", err);
      }
    };
    fetchBirthday();
  }, [user, isDemoMode]);

  // LIVE AI STRATEGIST ROUTING
  useEffect(() => {
    if (!user || isDemoMode) return;
    
    const fetchAIBriefing = async () => {
       const now = new Date();
       const hour = now.getHours();
       const period = hour >= 5 && hour < 16 ? "AM" : "PM";
       const dateStr = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
       const cacheKey = `lp_ai_briefing_${user.uid}_${dateStr}_${period}`;
       
       const cachedBriefing = localStorage.getItem(cacheKey);
       if (cachedBriefing) {
           if (cachedBriefing === "DISMISSED") return;
           try {
               setAiBriefingText(JSON.parse(cachedBriefing));
               return; 
           } catch (e) {
               localStorage.removeItem(cacheKey);
           }
       }

       try {
           const distilledAccounts = accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance, isGoal: a.isGoal }));
           const distilledBills = bills.map(b => ({ name: b.name, amount: b.amount, isPaid: b.isPaid, dueDate: b.fullDate || b.rawDate, isOverdue: b.isOverdue }));
           const distilledTx = transactions.slice(0, 15).map(t => ({ name: t.name, amount: t.amount, type: t.type, date: t.date }));

           const response = await fetch(`/api/briefing?cb=${Date.now()}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   userName: userNameDisplay,
                   currentPeriod: period,
                   accounts: distilledAccounts,
                   bills: distilledBills,
                   transactions: distilledTx,
                   isEntrepreneurMode: isEntrepreneurMode
               })
           });

           if (response.ok) {
               const data = await response.json();
               if (data.briefing) {
                   setAiBriefingText(data.briefing);
                   localStorage.setItem(cacheKey, JSON.stringify(data.briefing));
               }
           }
       } catch (error) {
           console.error("Failed to establish secure relay link to AI engine:", error);
       }
    };

    const timer = setTimeout(() => {
       fetchAIBriefing();
    }, 3500);

    return () => clearTimeout(timer);
  }, [user, isDemoMode, accounts, bills, transactions, userNameDisplay, isEntrepreneurMode]);

  const handleDismissAIBriefing = () => {
       const now = new Date();
       const hour = now.getHours();
       const period = hour >= 5 && hour < 16 ? "AM" : "PM";
       const dateStr = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
       const cacheKey = `lp_ai_briefing_${user?.uid || 'demo'}_${dateStr}_${period}`;
       
       localStorage.setItem(cacheKey, "DISMISSED");
       setAiBriefingText("");
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (!manualThemeOverride) {
        const currentHour = now.getHours();
        setIsDarkMode(currentHour >= 22 || currentHour < 5);
      }
      if (now.getMonth() !== sessionMonth.current) setNeedsRefresh(true);
    }, 1000);
    return () => clearInterval(timer);
  }, [manualThemeOverride, setIsDarkMode]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); 
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    setIsAuthLoading(true); setAuthError("");
    try {
      if (isLoginMode) { await signInWithEmailAndPassword(auth, email, password); }
      else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: firstName });
        await setDoc(doc(db, "users", userCredential.user.uid), { firstName: firstName, email: email, createdAt: serverTimestamp() }, { merge: true });
        setUser({ ...userCredential.user, displayName: firstName });
      }
    } catch (error) {
      setAuthError("Authentication failed. Please try again."); 
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    setIsAuthLoading(true); setAuthError("");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (error) { setAuthError("Google Sign-In failed."); setIsAuthLoading(false); }
  };

  const handleLogout = () => {
    if (!isOnline && !isDemoMode) { triggerOfflineLock(); return; }
    openGlobalAction(
      "Log Out",
      "Are you sure you want to log out of your session?",
      "Log Out",
      true,
      async () => {
        if (isDemoMode) { window.location.href = "https://ledgerplanner.com"; return; }
        try { await signOut(auth); }
        catch (error) { console.error("Logout forced locally:", error); }
        finally { setUser(null); setActiveTab("home"); closeGlobalAction(); }
      }
    );
  };

  const getOrdinalNum = (n) => n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
  const heroDateTimeStr = `${currentTime.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}, ${currentTime.toLocaleDateString("en-US", { month: "long" }).toUpperCase()} ${getOrdinalNum(currentTime.getDate()).toUpperCase()}, ${currentTime.getFullYear()} — ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase()}`;

  const formatPaydayDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
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

  const todayForDynamic = new Date(); todayForDynamic.setHours(0, 0, 0, 0);
  const dynamicBills = bills.map(bill => {
    let currentPayday = bill.payday;
    let isOverdue = bill.isOverdue || false;
    if (bill.rawDate && !bill.isPaid) {
      const bDate = new Date(bill.rawDate);
      if (!isNaN(bDate.getTime())) {
          const localBDate = new Date(bDate.getUTCFullYear(), bDate.getUTCMonth(), bDate.getUTCDate());
          if (localBDate < todayForDynamic) { currentPayday = "Due Now"; isOverdue = true; } 
          else if (localBDate.getTime() === todayForDynamic.getTime()) { currentPayday = "Due Now"; isOverdue = false; } 
          else { currentPayday = calculatePaydayGroup(bill.rawDate); isOverdue = false; }
      }
    }
    return { ...bill, payday: currentPayday || "Unscheduled", isOverdue: isOverdue };
  }).sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
    if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
    if (!a.rawDate) return 1; if (!b.rawDate) return -1;
    return new Date(a.rawDate || 0) - new Date(b.rawDate || 0);
  });

  const currentLiveBalance = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const renderHeroShell = (title, graphicContent) => {
    const constellationBadgeRoute = dynamicBills.some(b => !b.isPaid && (b.isOverdue || b.payday === "Due Now"));

    return (
      <header className={`px-6 pt-12 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden mb-8 z-30 rounded-b-[3rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
        
        {!isOnline && (
          <div className="absolute top-0 left-0 w-full bg-[#F97316] text-white text-[10px] font-black uppercase tracking-widest py-1.5 flex items-center justify-center gap-1.5 z-50 shadow-md animate-slide-up">
            <AlertCircle size={12} strokeWidth={3} /> Connection Lost: Read-Only Mode
          </div>
        )}

        <div className={`flex justify-between items-center mb-6 relative z-30 h-10 ${!isOnline ? "mt-4" : ""}`}>
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsDarkMode(!isDarkMode); setManualThemeOverride(true); triggerHaptic(20); }} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsNotificationsOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-400"}`} style={{ color: isNotificationsOpen ? signatureColor : undefined }}>
              <Bell size={18} />
              {(constellationBadgeRoute || (!isPushEnabled && !isDemoMode)) && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-[1.5px] animate-pulse bg-red-500 border-red-500"></span>
              )}
            </button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-20 origin-top -top-5 lg:hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#1877F2]/20 blur-xl rounded-full -z-10 pointer-events-none" style={{ backgroundColor: `${signatureColor}33` }}></div>
            <img src="/login-logo.png" alt="Ledger Planner" className={`relative z-10 w-16 h-16 rounded-full shadow-[0_12px_24px_rgba(24,119,242,0.3)] object-cover border-[3px] transition-colors ${isDarkMode ? "border-slate-800" : "border-white"}`} style={{ shadowColor: signatureColor }} />
          </div>

          <div className="flex items-center gap-2 relative z-30">
            <button onClick={() => setIsSettingsOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-400"}`} style={{ color: isSettingsOpen ? signatureColor : undefined }}>
              <SettingsIcon size={18} />
            </button>
            <button onClick={handleLogout} className={`h-10 px-3.5 rounded-full flex items-center justify-center gap-2 border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-red-400 hover:bg-red-900/30" : "bg-white border-slate-100 text-red-500 hover:bg-red-50"}`}>
              <LogOut size={14} strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{isDemoMode ? "Exit" : "Logout"}</span>
            </button>
          </div>
        </div>
        <div className="relative z-10 flex justify-center px-1 mb-6">
          <h2 title={title || "Overview"} className={`text-3xl font-black tracking-tight leading-tight truncate max-w-full ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title || "Overview"}</h2>
        </div>
        <div className="relative z-10 w-full h-auto opacity-100">{graphicContent}</div>
        <div className={`relative z-10 pt-4 border-t flex justify-center items-center ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{heroDateTimeStr}</span>
        </div>
      </header>
    );
  };

  if (!isMounted) return <div className={`min-h-screen ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}></div>;
  if (isAuthLoading && !isDemoMode) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: signatureColor, borderTopColor: "transparent" }}></div>
      </div>
    );
  }
  if (!user && !isDemoMode) {
    return (
      <Login
        email={email} setEmail={setEmail} password={password} setPassword={setPassword}
        firstName={firstName} setFirstName={setFirstName} isLoginMode={isLoginMode} setIsLoginMode={setIsLoginMode}
        handleAuthSubmit={handleAuthSubmit} handleGoogleLogin={handleGoogleLogin}
        authError={authError} setAuthError={setAuthError} isAuthLoading={isAuthLoading}
      />
    );
  }

  return (
    <div onContextMenu={(e) => e.preventDefault()} className={`h-screen w-full font-sans relative flex transition-colors duration-500 select-none [-webkit-touch-callout:none] ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <div className={`w-full h-full relative flex flex-col lg:flex-row transition-colors duration-500 overflow-hidden ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        
        {/* DESKTOP SIDEBAR VIEWPORT CONTROLLER */}
        <div className={`hidden lg:flex w-[280px] flex-col border-r z-40 p-6 transition-colors duration-500 shrink-0 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-4 mb-8 mt-4 shrink-0">
            <img src="/login-logo.png" alt="Ledger Planner" className={`w-12 h-12 rounded-full object-cover border-[2px] transition-colors ${isDarkMode ? "border-slate-700" : "border-slate-100"}`} />
            <div>
              <h1 className={`font-black tracking-tighter text-lg leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ledger Planner</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isDemoMode ? "bg-[#F97316]" : "bg-[#10B981]"}`}></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isDemoMode ? "Demo Vault" : "Master Engine"}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[{ id: "home", icon: Home, label: "Dashboard" }, { id: "accounts", icon: Wallet, label: "Accounts" }, { id: "bills", icon: CalendarIcon, label: "Bills & Plans" }, { id: "activity", icon: CreditCard, label: "Activity" }, { id: "todo", icon: CheckSquare, label: "To-Do List" }].map((tab) => (
              <button key={tab.id} onClick={() => changeTab(tab.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? isDarkMode ? "bg-slate-800" : "bg-blue-50" : isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`} style={{ color: activeTab === tab.id ? signatureColor : undefined }}>
                <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} /><span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-auto pt-4 shrink-0">
            <button onClick={handleOpenQab} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-widest text-xs transition-transform active:scale-95 hover:-translate-y-1" style={{ backgroundColor: signatureColor }}><Plus size={18} /> Quick Add</button>
          </div>
        </div>

        {/* PRIMARY VIEWPORT ROUTER */}
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          <div className={`flex-1 overflow-y-auto hide-scrollbar lg:pb-0 ${isDemoMode ? "pb-[220px]" : "pb-28"}`} ref={scrollRef} onScroll={handleScroll}>
            {activeTab === "home" && (
              <Dashboard 
                userName={userNameDisplay} 
                accounts={accounts} 
                bills={dynamicBills} 
                transactions={transactions} 
                paydayConfig={paydayConfig} 
                setIsNotificationsOpen={setIsNotificationsOpen} 
                isDarkMode={isDarkMode} 
                renderHeroShell={renderHeroShell} 
                changeTab={changeTab} 
                signatureColor={signatureColor}
                formatPaydayDateStr={formatPaydayDateStr}
                setIsPaydaySetupOpen={handleOpenPaydaySetup}
                collapsedPaydays={collapsedPaydays}
                toggleCollapse={toggleCollapse}
                handleBillClick={handleBillClick}
                setSelectedEntry={openEntryDrawer}
                isEntrepreneurMode={isEntrepreneurMode} 
              />
            )}
            
            {activeTab === "accounts" && (
              <Accounts 
                userName={userNameDisplay} 
                accounts={accounts} 
                transactions={transactions} 
                paydayConfig={paydayConfig}
                isEntrepreneurMode={isEntrepreneurMode}
                isDarkMode={isDarkMode} 
                setIsTransferOpen={handleOpenTransfer}
                setIsAddAccountOpen={handleOpenAddAccount}
                setIsAddGoalOpen={handleOpenAddGoal}
                setSelectedAccount={setSelectedAccount} 
                setEditAccountBalance={() => {}} 
                renderHeroShell={renderHeroShell} 
                isDemoMode={isDemoMode} 
                triggerCelebration={triggerVictory} 
                setIsCashOutOpen={setIsCashOutOpen} 
                setCashOutGoal={setCashOutGoal} 
                signatureColor={signatureColor} 
              />
            )}

            {activeTab === "bills" && (
              <Bills 
                userName={userNameDisplay} 
                bills={dynamicBills} 
                paydayConfig={paydayConfig}
                isDarkMode={isDarkMode} 
                renderHeroShell={renderHeroShell} 
                accounts={accounts} 
                signatureColor={signatureColor} 
                handleBillClick={handleBillClick} 
                setSelectedEntry={openEntryDrawer} 
                collapsedPaydays={collapsedPaydays}
                toggleCollapse={toggleCollapse}
                liveHeroBalance={currentLiveBalance}
                isEntrepreneurMode={isEntrepreneurMode} 
                openGlobalAction={openGlobalAction}
              />
            )}

            {activeTab === "activity" && (
              <Activity 
                userName={userNameDisplay} 
                transactions={transactions} 
                isDarkMode={isDarkMode} 
                setSelectedEntry={openEntryDrawer} 
                renderHeroShell={renderHeroShell} 
                signatureColor={signatureColor} 
                activitySearch={activitySearch}
                setActivitySearch={setActivitySearch}
                activityFilter={activityFilter}
                setActivityFilter={setActivityFilter}
              />
            )}
            {activeTab === "todo" && (
              <Todo 
                userName={userNameDisplay} 
                todos={todos} 
                isDarkMode={isDarkMode} 
                renderHeroShell={renderHeroShell} 
                signatureColor={signatureColor} 
                triggerVictory={triggerVictory} 
                newTodoText={newTodoText}
                setNewTodoText={setNewTodoText}
                newTodoPriority={newTodoPriority}
                setNewTodoPriority={setNewTodoPriority}
                newTodoType={newTodoType}
                setNewTodoType={setNewTodoType}
                handleAddTodo={handleAddTodo}
                toggleTodoStatus={toggleTodoStatus}
                clearCompletedTodos={clearCompletedTodos}
                openGlobalAction={openGlobalAction}
              />
            )}
          </div>

          <div className={`fixed lg:hidden ${isDemoMode ? "bottom-[200px]" : "bottom-28"} right-6 z-50`}>
            <button onClick={() => { triggerHaptic(20); handleOpenQab(); }} className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 ${isDarkMode ? "border-[#0F172A]" : "border-white"}`} style={{ backgroundColor: signatureColor }}><Plus size={28} /></button>
          </div>

          {/* RESPONSIVE MOBILE NAVIGATION DOCK */}
          <div className={`lg:hidden fixed ${isDemoMode ? "bottom-[120px]" : "bottom-0"} left-0 w-full backdrop-blur-md border-t px-2 h-[88px] pb-4 pt-2 flex justify-between items-center z-[100] ${isDarkMode ? "bg-[#1E293B]/95 border-slate-800" : "bg-white/95 border-slate-100"}`}>
            {[{ id: "home", icon: Home, label: "Home" }, { id: "accounts", icon: Wallet, label: "Accounts" }, { id: "bills", icon: CalendarIcon, label: "Bills" }, { id: "activity", icon: CreditCard, label: "Activity" }, { id: "todo", icon: CheckSquare, label: "To-Do" }].map((tab) => (
              <button key={tab.id} onClick={() => changeTab(tab.id)} className="flex-1 flex flex-col items-center justify-center gap-1 group h-full">
                <tab.icon size={30} strokeWidth={2} className="transition-all duration-300" style={{ color: activeTab === tab.id ? signatureColor : isDarkMode ? "#FFFFFF" : "#64748B" }} />
                <span className="text-[10px] font-black uppercase tracking-wide transition-all" style={{ color: activeTab === tab.id ? signatureColor : isDarkMode ? "#FFFFFF" : "#64748B" }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* === THE CORE MODAL INJECTIONS === */}
        {isQabOpen && <QuickAddModal onClose={() => setIsQabOpen(false)} triggerHaptic={triggerHaptic} triggerVictory={triggerVictory} />}
        
        {isNotificationsOpen && <CommandCenter 
          setIsNotificationsOpen={setIsNotificationsOpen} 
          needsRefresh={needsRefresh} 
          dynamicBills={dynamicBills} 
          changeTab={changeTab} 
          userName={userNameDisplay} 
          formatPaydayDateStr={formatPaydayDateStr} 
          isPushEnabled={isPushEnabled} 
          enablePushNotifications={enablePushNotifications}
          aiBriefingText={aiBriefingText}
          handleDismissAIBriefing={handleDismissAIBriefing}
        />}
        
        <TransferEngine isTransferOpen={isTransferOpen} setIsTransferOpen={setIsTransferOpen} isCashOutOpen={isCashOutOpen} setIsCashOutOpen={setIsCashOutOpen} cashOutGoal={cashOutGoal} setCashOutGoal={setCashOutGoal} triggerHaptic={triggerHaptic} triggerVictory={triggerVictory} />
        
        <AccountBuilder 
          isAddAccountOpen={isAddAccountOpen} 
          setIsAddAccountOpen={setIsAddAccountOpen} 
          isAddGoalOpen={isAddGoalOpen} 
          setIsAddGoalOpen={setIsAddGoalOpen} 
          selectedAccount={selectedAccount} 
          setSelectedAccount={setSelectedAccount} 
          openGlobalAction={openGlobalAction} 
          triggerHaptic={triggerHaptic} 
          triggerVictory={triggerVictory} 
        />

        {isPaydaySetupOpen && (
          <PaydaySetup 
            setIsPaydaySetupOpen={setIsPaydaySetupOpen} 
            editPaydayConfig={editPaydayConfig}
            setEditPaydayConfig={setEditPaydayConfig}
            clearPaydayConfig={clearPaydayConfig}
            savePaydayConfig={savePaydayConfig}
            formatDisplayDate={formatDisplayDate}
            signatureColor={signatureColor}
            isDarkMode={isDarkMode}
            isDemoMode={isDemoMode}
          />
        )}
        
        {selectedEntry && !selectedAccount && (
          <EditEntryDrawer 
            selectedEntry={selectedEntry} 
            setSelectedEntry={setSelectedEntry}
            isEditingEntry={isEditingEntry}
            setIsEditingEntry={setIsEditingEntry}
            editEntryData={editEntryData}
            setEditEntryData={setEditEntryData}
            closeEntryDrawer={closeEntryDrawer}
            handleSaveEntryEdit={handleSaveEntryEdit}
            openGlobalAction={openGlobalAction}
            formatDisplayDate={formatDisplayDate}
            accounts={accounts}
            signatureColor={signatureColor}
            isDarkMode={isDarkMode}
            isDemoMode={isDemoMode}
          />
        )}
        
        {paymentModalConfig.isOpen && (
          <PaymentModal 
            paymentModalConfig={paymentModalConfig} 
            setPaymentModalConfig={setPaymentModalConfig}
            confirmPaymentRoute={confirmPaymentRoute}
            bills={bills}
            accounts={accounts}
            signatureColor={signatureColor}
            isDarkMode={isDarkMode}
          />
        )}

        {installmentPromptConfig.isOpen && (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setInstallmentPromptConfig({ isOpen: false, billId: null, nextDate: "" })}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col transition-colors duration-500 overflow-visible ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className={`font-black uppercase tracking-widest text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Next Installment</h3>
                <button onClick={() => setInstallmentPromptConfig({ isOpen: false, billId: null, nextDate: "" })} className={`p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}><X size={18}/></button>
              </div>
              <div className={`p-6 space-y-6 ${isDemoMode ? "pb-[140px] lg:pb-6" : ""}`}>
                <div className="text-center">
                  <h2 className={`text-lg font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Payment Logged!</h2>
                  <p className="text-xs font-bold text-slate-500">When is your next payment due?</p>
                </div>
                <div className="relative">
                   <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Next Due Date</label>
                   <div className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors overflow-visible ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                     <span className={`font-bold text-base ${!installmentPromptConfig.nextDate ? "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{installmentPromptConfig.nextDate ? formatDisplayDate(installmentPromptConfig.nextDate) : "mm/dd/yyyy"}</span>
                     <CalendarIcon size={18} className="shrink-0" style={{ color: signatureColor }} />
                     <input type="date" value={installmentPromptConfig.nextDate} onChange={(e) => setInstallmentPromptConfig({...installmentPromptConfig, nextDate: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" />
                   </div>
                </div>
                <button onClick={handleSaveNextInstallmentDate} disabled={!installmentPromptConfig.nextDate} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: !installmentPromptConfig.nextDate ? undefined : signatureColor }}><CalendarIcon size={16}/> Route to Payday</button>
              </div>
            </div>
          </div>
        )}

        {isSettingsOpen && (
          <Settings 
            userName={userNameDisplay}
            user={user} 
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setIsSettingsOpen={setIsSettingsOpen}
            handleRolloverMonth={handleRolloverMonth}
            handleFactoryReset={handleFactoryReset}
            resetConfirm={resetConfirm}
            setResetConfirm={setResetConfirm}
            isDemoMode={isDemoMode}
            openGlobalAction={openGlobalAction}
            signatureColor={signatureColor}
            setSignatureColor={setSignatureColor}
            currentCurrency={currentCurrency}
            setCurrentCurrency={setCurrentCurrency}
            handleUpdateDisplayName={handleUpdateDisplayName}
            isEntrepreneurMode={isEntrepreneurMode} 
            setIsEntrepreneurMode={setIsEntrepreneurMode}
            handleExportData={handleExportData} 
            triggerVictory={triggerVictory} 
          />
        )}

        {globalActionConfig.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeGlobalAction}></div>
            <div className={`relative w-full max-w-sm p-6 rounded-[2rem] shadow-2xl animate-slide-up ${isDarkMode ? "bg-[#1E293B] border border-slate-700" : "bg-white border border-slate-100"}`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${globalActionConfig.isDestructive ? "bg-red-50 text-red-500" : "bg-blue-50 text-[#1877F2]"}`}>
                  {globalActionConfig.isDestructive ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
                </div>
                <h3 className={`text-lg font-black uppercase tracking-widest mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{globalActionConfig.title}</h3>
                <p className={`text-sm font-bold leading-relaxed mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{globalActionConfig.message}</p>
                <div className="flex gap-3 w-full">
                  {!globalActionConfig.isAlertOnly && (
                    <button onClick={closeGlobalAction} className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>Cancel</button>
                  )}
                  <button onClick={executeGlobalAction} className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 ${globalActionConfig.isDestructive ? "bg-red-500 shadow-[0_8px_16px_rgba(239,68,68,0.3)]" : "bg-[#1877F2] shadow-[0_8px_16px_rgba(24,119,242,0.3)]"}`} style={{ backgroundColor: !globalActionConfig.isDestructive ? signatureColor : undefined }}>{globalActionConfig.confirmText}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfetti && (
         <div className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden" style={{ perspective: '1000px' }}>
            {[...Array(132)].map((_, i) => {
              const colors = [signatureColor, '#10B981', '#F97316'];
              const isStrip = Math.random() > 0.6;
              const peakX = (Math.random() - 0.5) * 1000;
              const peakY = -(Math.random() * 400 + 200); 
              const endX = peakX + (Math.random() - 0.5) * 500; 
              const endY = 800 + Math.random() * 300; 

              return (
                <div 
                  key={i} 
                  className="absolute animate-[confettiFall_ease-out_forwards]" 
                  style={{ 
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)], 
                    left: '50%', top: '60%',
                    width: isStrip ? '8px' : '12px', height: isStrip ? '24px' : '12px',
                    borderRadius: Math.random() > 0.5 && !isStrip ? '50%' : '2px',
                    transformStyle: 'preserve-3d',
                    animationDuration: `${Math.random() * 1.5 + 3.7}s`,
                    animationDelay: `${Math.random() * 0.3}s`,
                    animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
                    '--peak-x': `${peakX}px`, 
                    '--peak-y': `${peakY}px`, 
                    '--end-x': `${endX}px`, 
                    '--end-y': `${endY}px`,
                    '--tz': `${(Math.random() - 0.5) * 600}px`,
                    '--rx': `${(Math.random() > 0.5 ? 1 : -1) * (Math.random() * 1440 + 720)}deg`, 
                    '--ry': `${(Math.random() > 0.5 ? 1 : -1) * (Math.random() * 1440 + 720)}deg`, 
                    '--rz': `${(Math.random() > 0.5 ? 1 : -1) * (Math.random() * 720 + 360)}deg`,
                    '--scale': `${Math.random() * 0.6 + 0.6}`
                  }} 
                />
              )
            })}
            <style>{`
              @keyframes confettiFall { 
                0% { transform: translate3d(-50%, -50%, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(0); opacity: 1; } 
                15% { transform: translate3d(calc(-50% + var(--peak-x)), calc(-50% + var(--peak-y)), var(--tz)) rotateX(calc(var(--rx) * 0.15)) rotateY(calc(var(--ry) * 0.15)) rotateZ(calc(var(--rz) * 0.15)) scale(var(--scale)); opacity: 1; } 
                80% { opacity: 1; }
                100% { transform: translate3d(calc(-50% + var(--end-x)), calc(-50% + var(--end-y)), var(--tz)) rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz)) scale(var(--scale)); opacity: 0; } 
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <LedgerProvider>
      <LedgerApp />
    </LedgerProvider>
  );
}
