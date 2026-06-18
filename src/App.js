import React, { useState, useEffect, useRef } from "react";
import {
  Home, Wallet, Calendar as CalendarIcon, CreditCard, CheckSquare,
  Bell, Moon, Sun, X, Plus, ArrowRight, CheckCircle2, Trash2, ArrowDown, AlertCircle, Edit2, LogOut, RefreshCw, Save, ArrowRightLeft, Settings as SettingsIcon, Zap, User, HelpCircle,
  PlayCircle, ChevronUp, ChevronDown, ShieldCheck, TrendingUp, Target, Search
} from "lucide-react";

// === FIREBASE INITIALIZATION ===
import { auth, db, messaging } from "./firebase";
import { getToken } from "firebase/messaging";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

// === DEMO DATA IMPORT ===
import { demoAccounts, demoBills, demoTransactions, demoTodos, demoPaydayConfig } from "./demoData";

// === COMPONENTS ===
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Bills from "./components/Bills";
import Activity from "./components/Activity";
import Todo from "./components/Todo";
import Settings from "./components/Settings";

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // Centralized Preference Hooks
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [manualThemeOverride, setManualThemeOverride] = useState(false);
  const [signatureColor, setSignatureColor] = useState("#1877F2");
  const [currentCurrency, setCurrentCurrency] = useState("USD ($)"); 

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = (e) => { setIsScrolled(e.target.scrollTop > 20); };

  // Authentication Fields Data Nodes
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Primary Synchronized Ledger Data Arrays
  const [bills, setBills] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [todos, setTodos] = useState([]);

  // Inspection & Editing Focus Buffers
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editEntryData, setEditEntryData] = useState({});

  // Operational Cycle Flow Boundary States
  const [collapsedPaydays, setCollapsedPaydays] = useState({ "Due Now": true, "Payday 1": true, "Payday 2": true, "Payday 3": true, "Payday 4": true, "Payday 5": true, "Unscheduled": true });
  const hasInitializedCollapse = useRef(false);
  const [hasCheckedRollover, setHasCheckedRollover] = useState(false);

  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  const [paydayConfig, setPaydayConfig] = useState({ frequency: "Weekly", "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" }, "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" }, "Payday 5": { date: "", income: "" } });
  const [editPaydayConfig, setEditPaydayConfig] = useState(paydayConfig);

  // Interface Modal Controller Anchors
  const [paymentModalConfig, setPaymentModalConfig] = useState({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
  const [installmentPromptConfig, setInstallmentPromptConfig] = useState({ isOpen: false, billId: null, nextDate: "" });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Internal Value Shuffling State Toggles
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("0");

  const [isCashOutOpen, setIsCashOutOpen] = useState(false);
  const [cashOutGoal, setCashOutGoal] = useState(null);
  const [cashOutAmount, setCashOutAmount] = useState("0");
  const [cashOutToAccount, setCashOutToAccount] = useState("");

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editAccountBalance, setEditAccountBalance] = useState("0");
  const [editAccountDesc, setEditAccountDesc] = useState("");
  const [editAccIsNegative, setEditAccIsNegative] = useState(false);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountIcon, setEditAccountIcon] = useState("🏦");
  const [editAccountTargetDate, setEditAccountTargetDate] = useState("");

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");
  const [newAccType, setNewAccType] = useState("Checking");
  const [newAccDesc, setNewAccDesc] = useState("");
  const [newAccIsNegative, setNewAccIsNegative] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalIcon, setNewGoalIcon] = useState("🎯");
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalFundingAccount, setNewGoalFundingAccount] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");

  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("All");
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoType, setNewTodoType] = useState("task");
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [openManualId, setOpenManualId] = useState(null);
  const [hasConsumedAMBriefing, setHasConsumedAMBriefing] = useState(() => {
    if (typeof window !== "undefined") {
      const todayKey = new Date().toISOString().split('T')[0];
      return localStorage.getItem(`lp_briefing_am_${todayKey}`) === "true";
    }
    return false;
  });
  const [hasConsumedPMBriefing, setHasConsumedPMBriefing] = useState(() => {
    if (typeof window !== "undefined") {
      const todayKey = new Date().toISOString().split('T')[0];
      return localStorage.getItem(`lp_briefing_pm_${todayKey}`) === "true";
    }
    return false;
  });

  // QAB Engine Upgrade Parameters
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
  const [entryRefinedPaid, setEntryRefinedPaid] = useState("");
  const [entryPaidAmount, setEntryPaidAmount] = useState("");
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Real-time queries and collaborative state parameters
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [entryVisibility, setEntryVisibility] = useState("Shared");
  const [coOpStep, setCoOpStep] = useState(1); 

  // CUSTOM CATEGORY MODAL BUILDER ASSIGNMENT SUB-STATE BUFFER
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const sessionMonth = useRef(new Date().getMonth());
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [globalActionConfig, setGlobalActionConfig] = useState({ isOpen: false, title: "", message: "", confirmText: "Confirm", isDanger: true, isAlertOnly: false, action: null });

  const openGlobalAction = (title, message, confirmText, isDanger, action, isAlertOnly = false) => {
    if (isDanger) triggerWarning();
    else triggerHaptic(50);
    setGlobalActionConfig({ isOpen: true, title, message, confirmText, isDanger, isAlertOnly, action });
  };

  const [recentBillCategories, setRecentBillCategories] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('lp_recent_bill_cat');
      if (saved) { try { return JSON.parse(saved); } catch (e) { return []; } }
    }
    return [];
  });
  const [recentIncomeCategories, setRecentIncomeCategories] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('lp_recent_inc_cat');
      if (saved) { try { return JSON.parse(saved); } catch (e) { return []; } }
    }
    return [];
  });
  const [recentExpenseCategories, setRecentExpenseCategories] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('lp_recent_exp_cat');
      if (saved) { try { return JSON.parse(saved); } catch (e) { return []; } }
    }
    return [];
  });

  const categoryEmojis = ["💵", "💲", "🤑", "💰", "🏦", "💹", "₿", "💎", "💳", "🧾", "📋", "💼", "🏠", "🏢", "🔑", "🛋️", "🧹", "💧", "⚡", "📶", "📡", "☁️", "📺", "🎬", "🍿", "🎵", "🎧", "🚗", "🚲", "🚂", "✈️", "⛽", "🛠️", "🅿️", "🎫", "🚕", "🚇", "🛒", "🛍️", "📦", "👕", "👗", "👟", "💅", "💄", "💈", "🕶️", "💍", "🍔", "🍕", "🌮", "🍣", "🥗", "🍳", "☕", "🍦", "🍻", "🍹", "🍷", "🏥", "💊", "🦷", "👓", "🧘", "🏋️", "🐾", "🐶", "🎁", "🎉", "🎟️", "🎮", "🕹️", "📱", "💻", "⌚", "🤖", "🚀", "🌴", "🎓", "🏪", "🎯", "🏖️", "👶", "🛡️", "🏍️", "🎸", "⛵"];

  // CONSOLIDATED DYNAMIC COMPONENT DATA FOR TAXONOMY MATRIX
  const [modernCategories, setModernCategories] = useState([
    { group: "Income & Wealth", items: ["Primary Salary", "Side Hustle / Gig", "Tips / Cash", "Investments / Crypto", "Transfers (Venmo/Zelle)", "Refunds & Adjustments", "Cash App", "PayDay Loans", "Unemployment", "Retirement / 401k", "Benefits", "My Goals"] },
    { group: "Housing & Utilities", items: ["Rent / Mortgage", "Electric / Gas", "Water / Trash", "Internet / Wi-Fi", "Home Goods / Maintenance", "Cell Phone"] },
    { group: "Transit & Travel", items: ["Gas / Fuel", "Rideshare (Uber/Lyft)", "Public Transit", "Auto Loan / Maintenance", "Parking / Tolls", "Airplane / Flights", "Hotel / Lodging", "Taxi / Car Rental"] },
    { group: "Food & Drink", items: ["Groceries", "Dining Out", "Delivery (DoorDash/Eats)", "Coffee / Tea", "Bars / Nightlife", "Convenient Store", "Fast Food", "Gas Station"] },
    { group: "Digital Life", items: ["Streaming (Netflix/Hulu)", "Music (Spotify/Apple)", "Software / Cloud", "Gaming", "Creators (Patreon/Twitch)", "Google Play Store", "Apple App Store"] },
    { group: "Shopping & Lifestyle", items: ["Amazon / E-commerce", "Clothing / Fashion", "Personal Care / Grooming", "Fitness / Gym", "Events / Concerts", "Pet Care", "Fun Recreation"] },
    { group: "Financial", items: ["Savings Transfer", "Credit Card Payment", "Debt Payoff", "Bank Fees / Interest"] },
    { group: "Health", items: ["Medical / Doctor", "Pharmacy / Rx", "Dental / Vision", "Therapy / Mental Health", "Health Insurance", "Fitness / Wellness"] },
    { group: "Entrepreneur", items: ["Domain / Hosting", "Software / SaaS", "AI Subscriptions", "Marketing & Ads", "Contractors & Freelancers", "Business Fees / LLC", "Office Supplies"] },
    { group: "Other", items: ["Miscellaneous Expense", "Charity / Gifts", "Other"] }
  ]);

  const triggerHaptic = (pattern = 50) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };
  const triggerVictory = () => { triggerHaptic([30, 50, 30]); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000); };
  const triggerWarning = () => { triggerHaptic([50, 100, 50]); };

  const enablePushNotifications = async () => {
    triggerHaptic(50);
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setIsPushEnabled(true);
        if (messaging) {
          const token = await getToken(messaging, { vapidKey: "YOUR_PUBLIC_VAPID_KEY" });
          if (token && user) {
            await setDoc(doc(db, "users", user.uid, "settings", "push"), { token, updatedAt: serverTimestamp() }, { merge: true });
          }
        }
        openGlobalAction("Notifications On", "The structural system channel bridges are live.", "Close", false, () => setGlobalActionConfig(prev => ({...prev, isOpen: false})), true);
      } else {
        setIsPushEnabled(false);
      }
    } catch (e) {
      console.error("Push system activation fault:", e);
    }
  };

  // SMART DEFAULTING MATRIX STATE SYNCHRONIZATION HOOK
  useEffect(() => {
    if (drawerTab === "bills") setEntryVisibility("Shared");
    else if (drawerTab === "transactions") setEntryVisibility("Private");
    else if (drawerTab === "income") setEntryVisibility("Shared");
  }, [drawerTab]);

  // INITIALIZATION AND LIFECYCLE TRACKERS WITH IMPLEMENTED SILENT MIGRATION
  useEffect(() => {
    setIsMounted(true);
    const isDemo = window.location.hostname.includes("demo");
    setIsDemoMode(isDemo);
    if (isDemo) {
      setUser({ uid: "demo123", displayName: "Demo User", email: "demo@ledgerplanner.com" });
      setAccounts(demoAccounts || []);
      setBills(demoBills || []);
      setTransactions(demoTransactions || []);
      setTodos(demoTodos || []);
      setPaydayConfig({ frequency: "Weekly", ...(demoPaydayConfig || {}) });
      setIsAuthLoading(false);
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setIsPushEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (!isMounted || isDemoMode) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setTimeout(() => setIsAuthLoading(false), 1200);
    });
    return () => unsubscribeAuth();
  }, [isMounted, isDemoMode]);

  useEffect(() => {
    if (!isMounted || isDemoMode || !user) return;
    const userRef = doc(db, "users", user.uid);
    // 🚨 SURGICAL FIX: The ...d.data(), id: d.id order forces Firebase's secure ID to override any temporary local ID
    const unsubAcc = onSnapshot(collection(userRef, "accounts"), (snap) => setAccounts(snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(a => !a.isArchived)));
    const unsubBills = onSnapshot(collection(userRef, "bills"), (snap) => setBills(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubTxs = onSnapshot(query(collection(userRef, "transactions"), orderBy("createdAt", "desc")), (snap) => setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
  
    const unsubTodos = onSnapshot(query(collection(userRef, "todos"), orderBy("createdAt", "desc")), (snap) => setTodos(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubConfig = onSnapshot(doc(db, "users", user.uid, "settings", "paydayConfig"), (docSnap) => { if (docSnap.exists()) setPaydayConfig({ frequency: "Weekly", ...docSnap.data() });
    });
    
    // THE SILENT MIGRATION INITIALIZATION SCRIPT DETECTS AND RE-MAPS LEGACY KEYS
    const executeSilentMigration = async () => {
      try {
        const legacyFlatData = localStorage.getItem("lp_custom_categories_flat");
        if (legacyFlatData) {
          const parsedStrings = JSON.parse(legacyFlatData);
          if (Array.isArray(parsedStrings) && parsedStrings.length > 0) {
            setModernCategories(prev => {
              const duplicatedMatrix = [...prev];
              const targetBucket = duplicatedMatrix.find(g => g.group === "Other");
              if (targetBucket) {
                parsedStrings.forEach(str => {
                  if (!targetBucket.items.includes(str)) targetBucket.items.push(str);
                });
              }
              return duplicatedMatrix;
            });
            localStorage.removeItem("lp_custom_categories_flat");
          }
        }
      } catch (err) {
        console.error("Silent data architecture consolidation bypassed:", err);
      }
    };
    executeSilentMigration();

    return () => { unsubAcc(); unsubBills(); unsubTxs(); unsubTodos(); unsubConfig(); };
  }, [isMounted, isDemoMode, user]);

  useEffect(() => {
    if (!isMounted || isDemoMode || !user || hasCheckedRollover || bills.length === 0) return;
    const checkAutoRollover = async () => {
      try {
        const systemRef = doc(db, "users", user.uid, "settings", "system");
        const sysSnap = await getDoc(systemRef);
        const today = new Date();
        const currentMonthKey = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}`;
        if (sysSnap.exists()) {
          const data = sysSnap.data();
          if (data.lastActiveMonth && data.lastActiveMonth !== currentMonthKey) {
            const batchPromises = [];
            bills.forEach(bill => {
              if (bill.isPaid) {
                if (bill.isRecurring !== false) {
                  let newRawDate = bill.rawDate; let displayDate = bill.fullDate; let newPayday = "Payday 1";
                  if (bill.rawDate) {
                    const oldDate = new Date(bill.rawDate);
                    if (!isNaN(oldDate.getTime())) {
                      oldDate.setUTCMonth(oldDate.getUTCMonth() + 1);
                      newRawDate = oldDate.toISOString().split('T')[0];
                      displayDate = oldDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
                      newPayday = calculatePaydayGroup(newRawDate);
                    }
                  }
                  let newPaidAmt = bill.isInstallment ? (bill.paidAmount || 0) : 0;
                  batchPromises.push(updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: false, paidAmount: newPaidAmt, linkedTxId: null, paidFromAccountId: null, rawDate: newRawDate, fullDate: displayDate, payday: newPayday, isOverdue: false }));
                } else { batchPromises.push(deleteDoc(doc(db, "users", user.uid, "bills", bill.id))); }
              }
            });
            await Promise.all(batchPromises);
            await setDoc(systemRef, { lastActiveMonth: currentMonthKey }, { merge: true });
          } else if (!data.lastActiveMonth) {
            await setDoc(systemRef, { lastActiveMonth: currentMonthKey }, { merge: true });
          }
        } else {
          await setDoc(systemRef, { lastActiveMonth: currentMonthKey }, { merge: true });
        }
      } catch (e) {
        console.error("Auto-rollover silent fail:", e);
      } finally {
        setHasCheckedRollover(true);
      }
    };
    checkAutoRollover();
  }, [isMounted, isDemoMode, user, bills.length, hasCheckedRollover]);

  // === OPERATIONAL SYSTEM TIMER & MATRIX THEME DRIFT ENGINE ===
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (!manualThemeOverride) {
        const currentHour = now.getHours();
        if (currentHour >= 22 || currentHour < 5) {
          setIsDarkMode(true);
        } else {
          setIsDarkMode(false);
        }
      }
      if (now.getMonth() !== sessionMonth.current) {
        setNeedsRefresh(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [manualThemeOverride]);

  // === SELECTED ACCOUNT BOUND STATE POPULATOR ===
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

  // === AUTO-COLLAPSE INTENSITY PARSER ===
  useEffect(() => {
    if (!hasInitializedCollapse.current && bills.length > 0) {
      const todayLocal = new Date(); todayLocal.setHours(0, 0, 0, 0);
      const hasDueNow = bills.some(b => {
        if (b.isPaid) return false;
        if (b.payday === "Due Now" || b.isOverdue) return true;
        if (b.rawDate) {
            const d = new Date(b.rawDate);
            const localB = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
            if (localB <= todayLocal) return true;
        }
        return false;
      });
      setCollapsedPaydays(prev => ({
        ...prev,
        "Due Now": !hasDueNow,
        "Payday 1": hasDueNow
      }));
      hasInitializedCollapse.current = true;
    }
  }, [bills]);

  const handleOpenPaydaySetup = () => {
    setEditPaydayConfig(paydayConfig);
    setIsPaydaySetupOpen(true);
  };

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
    openGlobalAction("Log Out", "Are you sure you want to log out of your session?", "Log Out", true, async () => {
      if (isDemoMode) { window.location.href = "https://ledgerplanner.com"; return; }
      try { await signOut(auth); }
      catch (error) { console.error("Logout forced locally:", error); }
      finally { setUser(null); setActiveTab("home"); setGlobalActionConfig(prev => ({ ...prev, isOpen: false })); }
    });
  };

  // === DYNAMIC UTILITY CALCULATION ENGINE ===
  const userName = isDemoMode ? "Aaron" : user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Founder";
  const getOrdinalNum = (n) => n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
  const dayStr = currentTime.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const monthStr = currentTime.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  const dateNum = currentTime.getDate();
  const yearNum = currentTime.getFullYear();
  const timeStr = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase();
  const heroDateTimeStr = `${dayStr}, ${monthStr} ${getOrdinalNum(dateNum).toUpperCase()}, ${yearNum} — ${timeStr}`;
  
  const formatPaydayDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
  };

  const formatDisplayDate = (dString) => {
    if (!dString) return "";
    const parts = dString.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return dString;
  };

  const changeTab = (tabId) => {
    triggerHaptic(20);
    setActiveTab(tabId);
    if (tabId === "activity") { setActivityFilter("All"); setActivitySearch(""); }
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCollapse = (payday) => setCollapsedPaydays((prev) => ({ ...prev, [payday]: !prev[payday] }));
  const openEntryDrawer = (entry) => { setSelectedEntry(entry); setIsEditingEntry(false); };
  const closeEntryDrawer = () => { setSelectedEntry(null); setIsEditingEntry(false); };

  const executeRolloverCore = async () => {
    const batchPromises = [];
    bills.forEach(bill => {
      if (bill.isPaid) {
        if (bill.isRecurring !== false) {
          let newRawDate = bill.rawDate; let displayDate = bill.fullDate; let newPayday = "Payday 1";
          if (bill.rawDate) {
            const oldDate = new Date(bill.rawDate);
            if (!isNaN(oldDate.getTime())) {
                oldDate.setUTCMonth(oldDate.getUTCMonth() + 1);
                newRawDate = oldDate.toISOString().split('T')[0];
                displayDate = oldDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
                newPayday = calculatePaydayGroup(newRawDate);
            }
          }
          let newPaidAmt = bill.isInstallment ? (bill.paidAmount || 0) : 0;
          batchPromises.push(updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: false, paidAmount: newPaidAmt, linkedTxId: null, paidFromAccountId: null, rawDate: newRawDate, fullDate: displayDate, payday: newPayday, isOverdue: false }));
        } else { batchPromises.push(deleteDoc(doc(db, "users", user.uid, "bills", bill.id))); }
      }
    });
    await Promise.all(batchPromises);
  };

  const handleRolloverMonth = async () => {
    openGlobalAction("Force Rollover", "SYSTEM OVERRIDE: Are you sure you want to force a manual month rollover?", "Force Sync", true, async () => {
      if (isDemoMode) {
        openGlobalAction("Demo Mode Locked", "Rollover is disabled while exploring the Demo Vault.", "Close", false, () => setGlobalActionConfig(prev => ({...prev, isOpen: false})), true);
        return;
      }
      await executeRolloverCore();
      if (!isDemoMode && user) {
        const today = new Date();
        const currentMonthKey = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}`;
        await setDoc(doc(db, "users", user.uid, "settings", "system"), { lastActiveMonth: currentMonthKey }, { merge: true });
      }
      triggerVictory();
      setIsSettingsOpen(false);
      setGlobalActionConfig(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleFactoryReset = async () => {
    if (resetConfirm !== "RESET") return;
    if (isDemoMode) {
      openGlobalAction("Demo Mode Locked", "Factory reset is disabled while exploring the Demo Vault.", "Close", false, () => setGlobalActionConfig(prev => ({...prev, isOpen: false})), true);
      setResetConfirm(""); setIsSettingsOpen(false); return;
    }
    openGlobalAction("Wipe Vault", "FINAL WARNING: This will permanently delete all your accounts, bills, transactions, and tasks. Proceed?", "Destroy", true, async () => {
      try {
        const collectionsToClear = ["accounts", "bills", "transactions", "todos"];
        for (const colName of collectionsToClear) {
          const q = query(collection(db, "users", user.uid, colName));
          const snap = await getDocs(q);
          const promises = snap.docs.map(d => deleteDoc(doc(db, "users", user.uid, colName, d.id)));
          await Promise.all(promises);
        }
        await deleteDoc(doc(db, "users", user.uid, "settings", "paydayConfig"));
        await deleteDoc(doc(db, "users", user.uid, "settings", "system"));
        setAccounts([]);
        setBills([]);
        setTransactions([]);
        setTodos([]);
        setPaydayConfig({ frequency: "Weekly", "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" }, "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" }, "Payday 5": { date: "", income: "" } });
        setResetConfirm(""); setIsSettingsOpen(false); triggerVictory();
        openGlobalAction("Wipe Complete", "Vault wiped. Welcome to a clean slate.", "Close", false, () => setGlobalActionConfig(prev => ({...prev, isOpen: false})), true);
      } catch (e) { console.error("Factory reset failed", e); }
    });
  };

  const clearCompletedTodos = async () => {
    const completed = todos.filter(t => t.isCompleted);
    if (completed.length === 0) return;
    openGlobalAction("Clear Tasks", "Delete all completed tasks from the board?", "Delete", true, async () => {
      if (isDemoMode) {
          setTodos(todos.filter(t => !t.isCompleted));
      } else {
          setTodos(todos.filter(t => !t.isCompleted));
          const batchPromises = completed.map(t => deleteDoc(doc(db, "users", user.uid, "todos", t.id)));
          await Promise.all(batchPromises);
      }
      triggerHaptic(50);
      setGlobalActionConfig(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleBillClick = async (id) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    if (bill.isPaid) {
      const refundAccountId = bill.paidFromAccountId;
      const targetAcc = accounts.find(a => a.id === refundAccountId);
      
      // --- PRECISION REVERT MATH FIX ---
      const linkedTx = transactions.find(t => t.id === bill.linkedTxId);
      const exactRefundAmount = linkedTx ? (linkedTx.amount || 0) : (bill.amount || 0);

      let newPaidAmount = bill.paidAmount || 0;
      if (bill.isInstallment) newPaidAmount = Math.max(0, (bill.paidAmount || 0) - exactRefundAmount);
      if (isDemoMode) {
        setBills(bills.map(b => b.id === id ? { ...b, isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null, linkedTxId: null } : b));
        if (targetAcc) setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: a.balance + exactRefundAmount } : a));
        if (bill.linkedTxId) setTransactions(transactions.filter(t => t.id !== bill.linkedTxId));
      } else {
        await updateDoc(doc(db, "users", user.uid, "bills", id), { isPaid: false, paidAmount: newPaidAmount, paidFromAccountId: null, linkedTxId: null });
        if (targetAcc) await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance + exactRefundAmount });
        if (bill.linkedTxId) await deleteDoc(doc(db, "users", user.uid, "transactions", bill.linkedTxId));
      }
      triggerHaptic(50);
      return;
    }
    setPaymentModalConfig({ isOpen: true, billId: id, accountId: accounts.find(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash"))?.id || (accounts[0]?.id || ""), isPayInFull: false });
  };

  const handleSaveEntryEdit = async () => {
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

  const handleAddAccount = async () => {
    const startBal = parseFloat(newAccBalance);
    if (!newAccName.trim() || isNaN(startBal)) return;
    // UPDATE 1: Account Name Input Field to Default to ALL CAPS Data Layer Sanitization
    const sanitizedName = newAccName.trim().toUpperCase();
    let finalBalance = Math.abs(startBal);
    if (newAccIsNegative) finalBalance = -finalBalance;

    const getIcon = (type) => { if (type === "Credit Card") return "💳";
    if (type === "401k / Retirement") return "🌴"; if (type === "Savings") return "📈";
    if (type === "Cash") return "💵";
    return "🏦"; };

    if (isDemoMode) {
      const newAcc = { id: `acc_demo_${Date.now()}`, name: sanitizedName, type: newAccType, description: newAccDesc, balance: finalBalance, icon: getIcon(newAccType) };
      setAccounts([...accounts, newAcc]);
    } else {
      const accRef = await addDoc(collection(db, "users", user.uid, "accounts"), { name: sanitizedName, type: newAccType, description: newAccDesc, balance: finalBalance, icon: getIcon(newAccType), isArchived: false });
      if (Math.abs(startBal) > 0) {
        const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        await addDoc(collection(db, "users", user.uid, "transactions"), { name: `${sanitizedName} (Opening)`, icon: getIcon(newAccType), amount: Math.abs(startBal), date: autoTimeStamp, type: finalBalance < 0 ? "Expense" : "Income", category: finalBalance < 0 ? "Initial Debt" : "Opening Balance", accountId: accRef.id, createdAt: serverTimestamp() });
      }
    }
    triggerVictory(); setIsAddAccountOpen(false); setNewAccName(""); setNewAccBalance(""); setNewAccDesc(""); setNewAccType("Checking"); setNewAccIsNegative(false);
  };

  const handleAddGoal = async () => {
    const targetBal = parseFloat(newGoalAmount);
    if (!newGoalName.trim() || isNaN(targetBal) || targetBal <= 0 || !newGoalDate || !newGoalIcon) return;
    // UPDATE 3: Force "Goal Name" Input to Default to ALL CAPS Data Layer Sanitization
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

  const handleTransferNumpad = (btn) => {
    triggerHaptic(15);
    if (btn === "=") {
      try { const toEval = transferAmount.replace(/×/g, "*").replace(/÷/g, "/");
      if (/^[0-9+\-*/. ]+$/.test(toEval)) setTransferAmount(String(Function('"use strict";return (' + toEval + ")")())); }
      catch (e) { setTransferAmount("Error");
      setTimeout(() => setTransferAmount("0"), 1000); }
    } else if (transferAmount === "0" && btn !== ".") setTransferAmount(btn);
    else setTransferAmount(transferAmount + btn);
  };

  const executeTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0 || !transferFrom || !transferTo) return;
    const fromAcc = accounts.find(a => a.id === transferFrom);
    const toAcc = accounts.find(a => a.id === transferTo);
    if (!fromAcc || !toAcc) return;
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
        { id: txId1, name: sentName, icon: "🔄", amount: amt, date: autoTimeStamp, type: "Expense", category: "Transfers (Venmo/Zelle)", accountId: fromAcc.id },
        { id: txId2, name: receivedName, icon: "🔄", amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: toAcc.id },
        ...transactions
      ]);
    } else {
      await updateDoc(doc(db, "users", user.uid, "accounts", fromAcc.id), { balance: fromAcc.balance - amt });
      await updateDoc(doc(db, "users", user.uid, "accounts", toAcc.id), { balance: toAcc.balance + amt });
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: sentName, icon: "🔄", amount: amt, date: autoTimeStamp, type: "Expense", category: "Transfers (Venmo/Zelle)", accountId: fromAcc.id, createdAt: serverTimestamp() });
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: receivedName, icon: "🔄", amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: toAcc.id, createdAt: serverTimestamp() });
    }

    if (isGoalCompleted || toAcc.isGoal) {
      triggerVictory();
    } else {
      triggerHaptic(50);
    }
    setIsTransferOpen(false); setTransferAmount("0"); setTransferFrom(""); setTransferTo("");
  };

  const handleCashOutGoalSubmit = async (e) => {
    if (e) e.preventDefault();
    const amt = parseFloat(cashOutAmount);
    if (isNaN(amt) || amt <= 0 || !cashOutGoal || !cashOutToAccount) return;
    if (amt > cashOutGoal.balance) return;
    const destAcc = accounts.find(a => a.id === cashOutToAccount);
    if (!destAcc) return;
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    const txName = `Goal Cash Out: ${cashOutGoal.name} → ${destAcc.name}`;

    if (isDemoMode) {
      setAccounts(accounts.map(a => {
        if (a.id === cashOutGoal.id) return { ...a, balance: a.balance - amt };
        if (a.id === destAcc.id) return { ...a, balance: a.balance + amt };
        return a;
      }));
      setTransactions([
        // FIX 3: Property Tagging for Analytics Protection
        { id: `tx_demo_co_${Date.now()}`, name: txName, icon: "🎯", amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: destAcc.id, isCashOut: true },
        ...transactions
      ]);
    } else {
      await updateDoc(doc(db, "users", user.uid, "accounts", cashOutGoal.id), { balance: cashOutGoal.balance - amt });
      await updateDoc(doc(db, "users", user.uid, "accounts", destAcc.id), { balance: destAcc.balance + amt });
      // FIX 3: Property Tagging for Analytics Protection
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: txName, icon: "🎯", amount: amt, date: autoTimeStamp, type: "Income", category: "Transfers (Venmo/Zelle)", accountId: destAcc.id, createdAt: serverTimestamp(), isCashOut: true });
    }

    triggerVictory();
    setIsCashOutOpen(false);
    setCashOutGoal(null);
    setCashOutAmount("0");
    setCashOutToAccount("");
  };

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
      setGlobalActionConfig(prev => ({ ...prev, isOpen: false }));
    });
  };

  const clearPaydayConfig = () => { setEditPaydayConfig({ frequency: "Weekly", "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" }, "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" }, "Payday 5": { date: "", income: "" } });
    triggerHaptic(50); };
  const savePaydayConfig = async () => {
    setPaydayConfig(editPaydayConfig);
    if (!isDemoMode) { await setDoc(doc(db, "users", user.uid, "settings", "paydayConfig"), editPaydayConfig); }
    setIsPaydaySetupOpen(false); triggerVictory();
  };

  const todayForDynamic = new Date(); todayForDynamic.setHours(0, 0, 0, 0);
  
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

  const dynamicBills = bills.map(bill => {
    let currentPayday = bill.payday;
    let isOverdue = bill.isOverdue || false;
    if (bill.rawDate && !bill.isPaid) {
      const bDate = new Date(bill.rawDate);
      if (!isNaN(bDate.getTime())) {
          const localBDate = new Date(bDate.getUTCFullYear(), bDate.getUTCMonth(), bDate.getUTCDate());

          if (localBDate < todayForDynamic) {
              currentPayday = "Due Now";
              isOverdue = true;
          } else if (localBDate.getTime() === todayForDynamic.getTime()) {
              currentPayday = "Due Now";
              isOverdue = false;
          } else {
              currentPayday = calculatePaydayGroup(bill.rawDate);
              isOverdue = false;
          }
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

  const generateAlerts = () => {
    const currentAlerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (needsRefresh) {
      currentAlerts.unshift({
        id: 'refresh-required',
        type: 'danger',
        icon: <RefreshCw size={20} className="text-red-500 animate-[spin_3s_linear_infinite]" />,
        title: 'System Update',
        message: 'New month detected. Refresh to initialize the new vault.',
        time: 'REQUIRED',
        action: () => window.location.reload()
      });
    }
    const actionBills = dynamicBills.filter(b => b.isOverdue || (!b.isPaid && b.payday === "Due Now"));
    actionBills.forEach(b => { currentAlerts.push({ id: `action-${b.id}`, type: 'danger', icon: <AlertCircle size={20} className="text-red-500" />, title: 'Action Required', message: `Your ${b.name || "Bill"} is ${b.isOverdue ? 'past due' : 'due now'}.`, amount: b.amount || 0, time: b.isOverdue ? 'URGENT' : 'TODAY', action: () => { setIsNotificationsOpen(false); changeTab("bills"); } }); });
    const upcomingRecurring = dynamicBills.filter(b => !b.isPaid && b.isRecurring && !b.isOverdue && b.payday !== "Due Now" && b.payday !== "Unscheduled");
    upcomingRecurring.forEach(b => { if (b.rawDate) { const bDate = new Date(b.rawDate); if (!isNaN(bDate.getTime())) { const diffDays = Math.ceil((bDate - today) / (1000 * 60 * 60 * 24)); if (diffDays >= 0 && diffDays <= 2) { currentAlerts.push({ id: `sub-${b.id}`, type: 'info', icon: <RefreshCw size={20} className="text-[#10B981]" />, title: 'Subscription Nudge', message: `${b.name || "Subscription"} is recurring in ${diffDays} day(s).`, amount: b.amount || 0, time: `${diffDays}D`, action: () => { setIsNotificationsOpen(false); changeTab("bills"); } }); } } } });
    ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach(pdId => {
      const config = paydayConfig?.[pdId];
      if (config && config.date) {
        const pdDate = new Date(config.date);
        if (!isNaN(pdDate.getTime())) {
            pdDate.setUTCHours(0, 0, 0, 0);
            const diffDays = Math.ceil((pdDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3) { currentAlerts.push({ id: `payday-${pdId}`, type: 'info', icon: <CalendarIcon size={20} className="text-[#1877F2]" />, title: 'Upcoming Payday', message: `${pdId} is approaching.`, time: `${diffDays}D`, action: () => { setIsNotificationsOpen(false); handleOpenPaydaySetup(); } });
            }
            const pdBills = bills.filter(b => b.payday === pdId && !b.isPaid);
            const pdTotal = pdBills.reduce((sum, b) => sum + (b.amount || 0), 0);
            const pdIncome = parseFloat(config.income) || 0;
            if (pdTotal > pdIncome && pdIncome > 0) { currentAlerts.push({ id: `gap-${pdId}`, type: 'warning', icon: <ArrowDown size={20} className="text-orange-500" />, title: 'Liquidity Gap', message: `${pdId} is $${(pdTotal - pdIncome).toFixed(2)} short.`, time: 'WARNING', action: () => { setIsNotificationsOpen(false);
changeTab("bills"); } });
            }
        }
      }
    });
    const liquidCash = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const upcomingBills = bills.filter(b => !b.isPaid && !b.isOverdue);
    const upcomingBurn = upcomingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const safeToSpend = liquidCash - upcomingBurn;
    if (safeToSpend < 100 && safeToSpend >= 0) { currentAlerts.push({ id: `redline`, type: 'danger', icon: <AlertCircle size={20} className="text-red-500" />, title: 'Redline', message: `Buffer critically low ($${safeToSpend.toFixed(2)}).`, time: 'ALERT', action: () => { setIsNotificationsOpen(false); changeTab("home"); } });
    }

    const recentTransfers = transactions.filter(tx => tx.category === "Transfers (Venmo/Zelle)" && tx.type === "Income");
    if (recentTransfers.length > 0) { const latestTransfer = recentTransfers[0]; currentAlerts.push({ id: `transfer-${latestTransfer.id}`, type: 'success', icon: <CheckCircle2 size={20} className="text-[#10B981]" />, title: 'Transfer Complete', message: `$${(latestTransfer.amount || 0).toFixed(2)} was successfully moved.`, time: latestTransfer.date?.split(',')[0] || "Recent", action: () => { setIsNotificationsOpen(false); changeTab("activity"); } });
    }
    return currentAlerts;
  };
  const activeAlerts = generateAlerts();
  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ?
"text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  const confirmPaymentRoute = async () => {
    const bill = bills.find(b => b.id === paymentModalConfig.billId);
    let targetAcc = accounts.find(a => a.id === paymentModalConfig.accountId);
    if (!targetAcc) {
      targetAcc = accounts.find(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")) ||
accounts[0];
    }

    if (!bill || !targetAcc) return;
    const autoTimeStamp = `${currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    const remainingBalance = (bill.totalAmount || 0) - (bill.paidAmount || 0);
    const amountToPay = paymentModalConfig.isPayInFull ? remainingBalance : (bill.amount || 0);
    if (isDemoMode) {
      const txId = `tx_demo_${Date.now()}`;
      setTransactions([{ id: txId, name: bill.name || "Bill", icon: bill.icon || "🧾", amount: amountToPay, date: autoTimeStamp, type: "Expense", category: bill.category || "Bill Payment", accountId: targetAcc.id, isBillPayment: true }, ...transactions]);
      setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: (a.balance || 0) - amountToPay } : a));
      if (bill.isInstallment) {
        const newPaidAmt = (bill.paidAmount || 0) + amountToPay;
        if (newPaidAmt >= (bill.totalAmount || 0) || paymentModalConfig.isPayInFull) {
          setBills(bills.map(b => b.id === bill.id ? { ...b, isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAcc.id, linkedTxId: txId } : b));
          triggerVictory();
          setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
        } else {
          setBills(bills.map(b => b.id === bill.id ? { ...b, paidAmount: newPaidAmt, isOverdue: false } : b));
          triggerHaptic(50); setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false }); setInstallmentPromptConfig({ isOpen: true, billId: bill.id, nextDate: "" });
        }
      } else {
        setBills(bills.map(b => b.id === bill.id ? { ...b, isPaid: true, paidAmount: 0, paidFromAccountId: targetAcc.id, linkedTxId: txId } : b));
        triggerVictory();
        setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
      }
    } else {
      const txRef = await addDoc(collection(db, "users", user.uid, "transactions"), { name: bill.name || "Bill", icon: bill.icon || "🧾", amount: amountToPay, date: autoTimeStamp, type: "Expense", category: bill.category || "Bill Payment", accountId: targetAcc.id, isBillPayment: true, createdAt: serverTimestamp() });
      await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: (targetAcc.balance || 0) - amountToPay });
      if (bill.isInstallment) {
        const newPaidAmt = (bill.paidAmount || 0) + amountToPay;
        if (newPaidAmt >= (bill.totalAmount || 0) || paymentModalConfig.isPayInFull) {
          await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: true, paidAmount: newPaidAmt, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id });
          triggerVictory();
          setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
        } else {
          await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { paidAmount: newPaidAmt, isOverdue: false });
          triggerHaptic(50); setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false }); setInstallmentPromptConfig({ isOpen: true, billId: bill.id, nextDate: "" });
        }
      } else {
        await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: true, paidAmount: 0, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id });
        triggerVictory();
        setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
      }
    }
  };
  const handleSaveNextInstallmentDate = async () => {
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
  const closeQab = () => { setIsQabOpen(false); setQabStep(1); setInputValue("0"); setEntryName(""); setEntryDate(""); setEntryIcon("🧾"); setEntryCategory(""); setEntryAccount(""); setEntryIsRecurring(false); setEntryIsInstallment(false); setEntryTotalAmount(""); setEntryPaidAmount(""); setIsCategorySelectorOpen(false); setIsIconSelectorOpen(false);
  setCategorySearchQuery(""); setCustomCategoryInput(""); };
  
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
        } catch 
        (e) { return "0"; }
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
  const handleConfirmAction = () => {
    const sanitizedInput = String(inputValue).replace(/\s+/g, "");
    const amountToProcess = parseFloat(sanitizedInput);
    if (isNaN(amountToProcess) || (drawerTab === "bills" ? amountToProcess < 0 : amountToProcess <= 0)) return;
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
        name: entryName.trim() ||
"New Bill",
        icon: entryIcon ||
"🧾",
        category: entryCategory ||
"Other",
        amount: amountToProcess,
        date: sortableDay,
        fullDate: displayDate,
        rawDate: entryDate,
        payday: calculatePaydayGroup(entryDate),
        isPaid: false,
        isOverdue: false,
        isRecurring: entryIsRecurring,
        isInstallment: entryIsInstallment,
        totalAmount: entryIsInstallment ?
        parseFloat(entryTotalAmount) || 0 : 0,
        paidAmount: entryIsInstallment ? parseFloat(entryPaidAmount) ||
        0 : 0,
        linkedTxId: null,
        vaultVisibility: entryVisibility,
      };
      if (isDemoMode) {
        setBills([...bills, newBillNode]);
      } else {
        addDoc(collection(db, "users", user.uid, "bills"), newBillNode).catch(e => console.log("Offline pipeline sync queued"));
      }
      triggerHaptic(50); closeQab();
    } else if (drawerTab === "income" || drawerTab === "transactions") {
      const targetAcc = accounts.find(a => a.id === entryAccount) ||
      accounts[0];
      if (targetAcc) {
        const isIncome = drawerTab === "income";
        const oldAccBalance = targetAcc.balance || 0;
        const netDelta = isIncome ? amountToProcess : -amountToProcess;
        const newAccBalance = oldAccBalance + netDelta;
        const isGoalCompleted = isIncome && targetAcc.isGoal && oldAccBalance < (targetAcc.targetAmount || 0) && newAccBalance >= (targetAcc.targetAmount || 0);
        const newTxNode = {
          id: `tx_master_${Date.now()}`,
          name: entryName.trim() ||
          (isIncome ? "Income" : "Expense"),
          icon: isIncome ?
          "💵" : entryIcon,
          category: entryCategory ||
          "Other",
          amount: amountToProcess,
          date: autoTimeStamp,
          type: isIncome ?
          "Income" : "Expense",
          accountId: targetAcc.id,
          vaultVisibility: entryVisibility,
          isDirectGoalEntry: targetAcc.isGoal ||
          targetAcc.type === "Goal" || false
        };
        if (isDemoMode) {
          setTransactions([newTxNode, ...transactions]);
          setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: newAccBalance } : a));
        } else {
          addDoc(collection(db, "users", user.uid, "transactions"), { ...newTxNode, createdAt: serverTimestamp() }).catch(e => console.log("Offline pipeline sync queued"));
          updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: newAccBalance }).catch(e => console.log("Offline pipeline sync queued"));
        }

        if (isGoalCompleted) triggerVictory(); else triggerHaptic(50);
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
  const categoriesToRender = drawerTab === 'income' ?
  modernCategories.filter(g => g.group === "Income & Wealth") : modernCategories;
  const currentRecentCategories = drawerTab === "bills" ?
  recentBillCategories : drawerTab === "income" ? recentIncomeCategories : recentExpenseCategories;
  
  const getEntryAmountColor = (entry) => {
    if (!entry) return "text-[#1877F2]";
    if (entry.isBillPayment || entry.fullDate !== undefined) return "text-[#1877F2]";
    if (entry.type === 'Income') return "text-[#10B981]";
    if (entry.type === 'Expense') return "text-[#F97316]";
    return "text-[#1877F2]";
  };

  const renderHeroShell = (title, graphicContent) => {
    const hasOverdueOrDueNow = dynamicBills.some(b => !b.isPaid && (b.isOverdue || b.payday === "Due Now"));
    const hours = new Date().getHours();
    const isAM = hours >= 5 && hours < 12;
    const isUnconsumedBriefing = isAM ?
    !hasConsumedAMBriefing : !hasConsumedPMBriefing;

    return (
      <header className={`px-6 pt-12 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden mb-8 z-30 rounded-b-[3rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
        <div className="flex justify-between items-center mb-6 relative z-30 h-10">
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsDarkMode(!isDarkMode); setManualThemeOverride(true); triggerHaptic(20); }} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
         
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsNotificationsOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-400"}`} style={{ color: isSettingsOpen ?
            undefined : signatureColor }}>
              <Bell size={18} />
              {(hasOverdueOrDueNow || isUnconsumedBriefing || !isPushEnabled) && (
                <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-[1.5px] animate-pulse ${hasOverdueOrDueNow ? "bg-red-500 border-red-500" : isUnconsumedBriefing ? "bg-[#1877F2] border-[#1877F2]" : "bg-red-500 border-red-500"} ${isDarkMode ? "border-t-transparent border-l-transparent" : "border-white"}`} style={{ backgroundColor: isUnconsumedBriefing && !hasOverdueOrDueNow ? signatureColor : undefined, borderColor: isUnconsumedBriefing && !hasOverdueOrDueNow ? signatureColor : undefined }}></span>
 
              )}
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-20 origin-top -top-5 lg:hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#1877F2]/20 blur-xl rounded-full -z-10 pointer-events-none" style={{ backgroundColor: `${signatureColor}33` }}></div>
            <img src="/login-logo.png" alt="Ledger Planner" className={`relative 
            z-10 w-16 h-16 rounded-full shadow-[0_12px_24px_rgba(24,119,242,0.3)] object-cover border-[3px] transition-colors ${isDarkMode ?
            "border-slate-800" : "border-white"}`} style={{ shadowColor: signatureColor }} />
          </div>
          
          <div className="flex items-center gap-2 relative z-30">
            <button onClick={() => { setEditName(userName || "");
            setIsSettingsOpen(true); }} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ?
            "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-400"}`} style={{ color: isSettingsOpen ?
            signatureColor : undefined }}>
              <SettingsIcon size={18} />
            </button>
            <button onClick={handleLogout} className={`h-10 px-3.5 rounded-full flex items-center justify-center gap-2 border transition-colors shadow-sm ${isDarkMode ?
            "bg-slate-800 border-slate-700 text-red-400 hover:bg-red-900/30" : "bg-white border-slate-100 text-red-500 hover:bg-red-50"}`}>
              <LogOut size={14} strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{isDemoMode ?
            "Exit" : "Logout"}</span>
            </button>
          </div>
        </div>
        <div className="relative z-10 flex justify-center px-1 mb-6">
          <h2 title={title ||
          "Overview"} className={`text-3xl font-black tracking-tight leading-tight truncate max-w-full ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title ||
          "Overview"}</h2>
        </div>

        <div className="relative z-10 w-full h-auto opacity-100">{graphicContent}</div>

        <div className={`relative z-10 pt-4 border-t flex justify-center items-center ${isDarkMode ?
          "border-slate-800" : "border-slate-50"}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ?
          "text-white" : "text-slate-900"}`}>{heroDateTimeStr}</span>
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
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        firstName={firstName} setFirstName={setFirstName}
        isLoginMode={isLoginMode} setIsLoginMode={setIsLoginMode}
        handleAuthSubmit={handleAuthSubmit} handleGoogleLogin={handleGoogleLogin}
        authError={authError} setAuthError={setAuthError} isAuthLoading={isAuthLoading}
      />
    );
  }

  // Calculate live liquidity for Bills.js sync
  const currentLiveBalance = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);
  return (
    <div 
      onContextMenu={(e) => e.preventDefault()} 
      className={`h-screen w-full font-sans relative flex transition-colors duration-500 select-none [-webkit-touch-callout:none] ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}
    >
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
   
         height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
      
      <div className={`w-full h-full relative flex flex-col lg:flex-row transition-colors duration-500 overflow-hidden ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        
        {/* DESKTOP SIDEBAR VIEWPORT CONTROLLER */}
        <div 
          className={`hidden lg:flex w-[280px] flex-col border-r z-40 p-6 transition-colors duration-500 shrink-0 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-4 mb-8 mt-4 shrink-0">
            <img src="/login-logo.png" alt="Ledger Planner" className={`w-12 h-12 rounded-full object-cover border-[2px] transition-colors ${isDarkMode ?
            "border-slate-700" : "border-slate-100"}`} />
            <div>
              <img src="/login-logo.png" alt="Ledger Planner" className="hidden" />
              <h1 className={`font-black tracking-tighter text-lg leading-tight ${isDarkMode ?
              "text-white" : "text-slate-900"}`}>Ledger Planner</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isDemoMode ?
                "bg-[#F97316]" : "bg-[#10B981]"}`}></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isDemoMode ?
                "Demo Vault" : "Master Engine"}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">Navigation</p>
            {[{ id: "home", icon: Home, label: "Dashboard" }, 
            { id: "accounts", icon: Wallet, label: "Accounts" }, { id: "bills", icon: CalendarIcon, label: "Bills & Plans" }, { id: "activity", icon: CreditCard, label: "Activity" }, { id: "todo", icon: CheckSquare, label: "To-Do List" }].map((tab) => (
              <button key={tab.id} onClick={() => changeTab(tab.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? isDarkMode ? "bg-slate-800" : "bg-blue-50" : isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`} style={{ color: activeTab === tab.id ? signatureColor : undefined }}>
        
               <tab.icon size={20} strokeWidth={activeTab === tab.id ?
               2.5 : 2} /><span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-auto pt-4 shrink-0">
            <button onClick={() => setIsQabOpen(true)} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-widest text-xs transition-transform active:scale-95 hover:-translate-y-1" style={{ backgroundColor: signatureColor 
            }}><Plus size={18} /> Quick Add</button>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          <div className={`flex-1 overflow-y-auto hide-scrollbar lg:pb-0 ${isDemoMode ?
          "pb-[220px]" : "pb-28"}`} ref={scrollRef} onScroll={handleScroll}>
            {activeTab === "home" && <Dashboard userName={userName} accounts={accounts} bills={dynamicBills} transactions={transactions} paydayConfig={paydayConfig} setEditPaydayConfig={setEditPaydayConfig} setIsPaydaySetupOpen={handleOpenPaydaySetup} setIsNotificationsOpen={setIsNotificationsOpen} collapsedPaydays={collapsedPaydays} toggleCollapse={toggleCollapse} handleBillClick={handleBillClick} setSelectedEntry={openEntryDrawer} isDarkMode={isDarkMode} formatPaydayDateStr={formatPaydayDateStr} renderHeroShell={renderHeroShell} changeTab={changeTab} hasConsumedAMBriefing={hasConsumedAMBriefing} setHasConsumedAMBriefing={setHasConsumedAMBriefing} hasConsumedPMBriefing={hasConsumedPMBriefing} setHasConsumedPMBriefing={setHasConsumedPMBriefing} signatureColor={signatureColor} />}
            {activeTab === "accounts" && <Accounts userName={userName} accounts={accounts} transactions={transactions} isDarkMode={isDarkMode} setIsTransferOpen={setIsTransferOpen} setIsAddAccountOpen={setIsAddAccountOpen} setIsAddGoalOpen={setIsAddGoalOpen} setSelectedAccount={setSelectedAccount} setEditAccountBalance={setEditAccountBalance} renderHeroShell={renderHeroShell} isDemoMode={isDemoMode} triggerCelebration={triggerVictory} setIsCashOutOpen={setIsCashOutOpen} setCashOutGoal={setCashOutGoal} signatureColor={signatureColor} />}
            
            {/* === 
            PROP SYNC FIX IS INJECTED HERE === */}
            {activeTab === "bills" && <Bills userName={userName} bills={dynamicBills} paydayConfig={paydayConfig} isDarkMode={isDarkMode} handleBillClick={handleBillClick} setSelectedEntry={openEntryDrawer} renderHeroShell={renderHeroShell} handleRolloverMonth={handleRolloverMonth} collapsedPaydays={collapsedPaydays} toggleCollapse={toggleCollapse} accounts={accounts} signatureColor={signatureColor} liveHeroBalance={currentLiveBalance} />}
            
            {activeTab === "activity" && <Activity userName={userName} transactions={transactions} activitySearch={activitySearch} setActivitySearch={setActivitySearch} activityFilter={activityFilter} setActivityFilter={setActivityFilter} isDarkMode={isDarkMode} setSelectedEntry={openEntryDrawer} renderHeroShell={renderHeroShell} signatureColor={signatureColor} />}
            {activeTab === "todo" && <Todo userName={userName} todos={todos} newTodoText={newTodoText} setNewTodoText={setNewTodoText} newTodoPriority={newTodoPriority} setNewTodoPriority={setNewTodoPriority} newTodoType={newTodoType} 
            setNewTodoType={setNewTodoType} isDarkMode={isDarkMode} handleAddTodo={async (e) => { e.preventDefault(); if(!newTodoText.trim()) return; if (isDemoMode) { setTodos([{ id: `todo_demo_${Date.now()}`, text: newTodoText, priority: newTodoPriority, type: newTodoType, isCompleted: false }, ...todos]);
            } else { await addDoc(collection(db, "users", user.uid, "todos"), { text: newTodoText, priority: newTodoPriority, type: newTodoType, isCompleted: false, createdAt: serverTimestamp() });
            } triggerVictory(); setNewTodoText(""); setNewTodoPriority(3); }} toggleTodoStatus={async (id) => { triggerHaptic(50); const todo = todos.find(t => t.id === id);
            if (isDemoMode) { setTodos(todos.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
            } else { await updateDoc(doc(db, "users", user.uid, "todos", id), { isCompleted: !todo.isCompleted });
            } }} setSelectedTodo={setSelectedTodo} renderHeroShell={renderHeroShell} clearCompletedTodos={clearCompletedTodos} openGlobalAction={openGlobalAction} signatureColor={signatureColor} />}
          </div>

          <div className={`fixed lg:hidden ${isDemoMode ?
          "bottom-[200px]" : "bottom-28"} right-6 z-50`}>
            <button onClick={() => { triggerHaptic(20);
            setIsQabOpen(true); }} className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 ${isDarkMode ?
            "border-[#0F172A]" : "border-white"}`} style={{ backgroundColor: signatureColor }}><Plus size={28} /></button>
          </div>

          {/* RESPONSIVE MOBILE NAVIGATION DOCK */}
          <div className={`lg:hidden fixed ${isDemoMode ?
          "bottom-[120px]" : "bottom-0"} left-0 w-full backdrop-blur-md border-t px-2 h-[88px] pb-4 pt-2 flex justify-between items-center z-[100] ${isDarkMode ?
          "bg-[#1E293B]/95 border-slate-800" : "bg-white/95 border-slate-100"}`}>
            {[{ id: "home", icon: Home, label: "Home" }, { id: "accounts", icon: Wallet, label: "Accounts" }, { id: "bills", icon: CalendarIcon, label: "Bills" }, { id: "activity", icon: CreditCard, label: "Activity" }, { id: "todo", icon: CheckSquare, label: "To-Do" }].map((tab) => (
              <button key={tab.id} onClick={() => changeTab(tab.id)} className="flex-1 flex flex-col items-center justify-center gap-1 group h-full">
                <tab.icon 
                size={30} strokeWidth={2} className="transition-all duration-300" style={{ color: activeTab === tab.id ? signatureColor : isDarkMode ? "#FFFFFF" : "#64748B" }} />
                <span className="text-[10px] font-black uppercase tracking-wide transition-all" style={{ color: activeTab === tab.id ? signatureColor : isDarkMode ? "#FFFFFF" : "#64748B" }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
{isSettingsOpen && (
 
         <Settings 
            userName={userName}
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
          />
        )}

    
        {isNotificationsOpen && (() => {
          const hasOverdueOrDueNow = dynamicBills.some(b => !b.isPaid && (b.isOverdue ||
          b.payday === "Due Now"));
          const hours = new Date().getHours();
          const isAM = hours >= 5 && hours < 12;
          const liquidCash = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);
          let nextPaydayDate = todayForDynamic;
          let activePaydayKey = "Payday 1";
          for (let i = 1; i <= 5; i++) {
            if (paydayConfig?.[`Payday ${i}`]?.date) {
              const d = new Date(paydayConfig[`Payday ${i}`].date);
              if (!isNaN(d.getTime()) && d >= todayForDynamic) {
                nextPaydayDate = d;
                activePaydayKey = `Payday ${i}`;
                break;
              }
            }
          }
          const daysLeft = Math.max(Math.ceil((nextPaydayDate - todayForDynamic) / (1000 * 60 * 60 * 24)), 1);
          const currentCycleBillsTotal = bills.filter(b => b.payday === activePaydayKey && !b.isPaid).reduce((sum, b) => sum + (b.amount || 0), 0);
          const trueRunwayAmount = Math.max((liquidCash - currentCycleBillsTotal) / daysLeft, 0);
          const totalCycleIncome = parseFloat(paydayConfig?.[activePaydayKey]?.income) || 0;
          const burnPercentage = totalCycleIncome > 0 ? Math.round((currentCycleBillsTotal / totalCycleIncome) * 100) : 0;
          const excessCushion = liquidCash;
          const isUnconsumedBriefing = isAM ? !hasConsumedAMBriefing : !hasConsumedPMBriefing;

          return (
            <div className="fixed inset-0 z-[120] flex justify-end">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
              <div className={`w-full sm:max-w-sm h-full shadow-2xl relative z-[130] flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A] border-l border-slate-800" : "bg-white border-l border-slate-100"}`}>
                <div className="p-6 border-b flex 
                justify-between items-center shrink-0">
                  <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Command Center</h3>
                  <button onClick={() => setIsNotificationsOpen(false)} className={closeButtonClass}><X size={18} /></button>
                </div>
                
               
                <div className="p-6 overflow-y-auto space-y-4 flex-1 hide-scrollbar">
                  {!isPushEnabled && !isDemoMode && (
                    <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ?
                    "bg-[#10B981]/10 border-[#10B981]/20" : "bg-emerald-50 border-emerald-100"}`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full text-white bg-[#10B981] shadow-[0_4px_10px_rgba(16,185,129,0.3)]"><Bell size={16} /></div>
                        <div><p className={`text-sm font-black ${isDarkMode ?
                        "text-[#10B981]" : "text-emerald-700"}`}>Enable Notifications</p><p className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                        "text-emerald-500/70" : "text-emerald-600/70"}`}>Never miss a payday</p></div>
                      </div>
                      <button onClick={enablePushNotifications} className="px-4 py-2 bg-[#10B981] text-white text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-transform shadow-md">Enable</button>
                    </div>
                  
                  )}

                  {isUnconsumedBriefing && (
                    <div className={`p-5 rounded-[1.8rem] border flex items-start gap-4 shadow-sm transition-all duration-500 ${isDarkMode ? "bg-slate-900/90 border-amber-500/20" : "bg-amber-50/80 border-amber-200/60"}`}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-500/10 text-xl">✨</div>
             
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ?
                          "text-amber-400" : "text-amber-800"}`}>{isAM ? "Morning Strategy" : "Evening Analysis"}</p>
                          <button onClick={() => { 
                            triggerHaptic(30);
                            const todayKey = new Date().toISOString().split('T')[0];
                            if (isAM) {
                              setHasConsumedAMBriefing(true);
                              localStorage.setItem(`lp_briefing_am_${todayKey}`, "true");
                            } else {
                              setHasConsumedPMBriefing(true);
                              localStorage.setItem(`lp_briefing_pm_${todayKey}`, "true");
                            }
                          }} className="text-slate-400 hover:text-slate-600 p-0.5">×</button>
                        </div>
                        <p className={`text-xs font-bold leading-relaxed ${isDarkMode ?
                        "text-slate-300" : "text-amber-950"}`}>
                          {isAM ?
                          (
                            burnPercentage > 60 ? (
                              `Heads up, ${userName}. This paycheck is a High-Burn cycle—${burnPercentage}% of this income is spoken for by fixed bills. It’s a great week to hold the line on non-essential spending and let your automation handle the heavy lifting.`
  
                            ) : burnPercentage < 30 ? (
                              `Good morning, ${userName}. This is a Low-Burn cycle—only ${burnPercentage}% of this income goes to bills. You have a prime opportunity this week to make an extra manual transfer toward your Savings Goal ahead of schedule.`
    
                            ) : (
                              `Good morning, ${userName}. After accounting for all bills in this cycle, your true safe-to-spend runway is exactly $${trueRunwayAmount.toFixed(2)} per day until your next paycheck drops on ${formatPaydayDateStr(paydayConfig?.[activePaydayKey]?.date)}. Keep daily spending under this line to maintain a perfect cushion.`
       
                             )
                          ) : (
                            `Good evening, ${userName}.
                            Payday Eve is active. You successfully navigated this cycle with a surplus of $${excessCushion.toFixed(2)} remaining in your baseline checking buffer.
                            Excellent discipline. Preparing the vault to initialize your incoming paycheck tomorrow morning.`
                          )}
                        </p>
                      </div>
                 
                    </div>
                  )}

                  {activeAlerts.length === 0 && !isUnconsumedBriefing ?
                  (
                    <div className="text-center py-20 opacity-100 flex flex-col items-center justify-center h-full">
                      <div className="p-4 rounded-full bg-emerald-50 mb-4 dark:bg-emerald-900/20">
                        <CheckCircle2 size={36} className="text-[#10B981] drop-shadow-sm" />
                 
                      </div>
                      <p className={`font-black text-xs uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>No Action Items</p>
                      <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Your ledger is perfectly balanced</p>
                    </div>
      
                    ) : (
                    <div className="space-y-3">
                      {activeAlerts.map(alert => (
                        <div key={alert.id} onClick={alert.action} className={`p-4 rounded-2xl border cursor-pointer transition-transform active:scale-[0.98] ${isDarkMode ?
                        "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"}`}>
                           <div className="flex gap-3">
                             <div className={`p-2.5 rounded-xl self-start ${isDarkMode ?
                             "bg-slate-900" : "bg-slate-50"}`}>
                               {alert.icon}
                             </div>
                             <div className="flex-1 min-w-0">
       
                                <div className="flex items-start justify-between gap-2 mb-1">
                                 <p className={`font-black text-xs uppercase tracking-wide truncate ${isDarkMode ?
                                 "text-white" : "text-slate-900"}`}>{alert.title}</p>
                                 <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${alert.type === 'danger' ?
                                 "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{alert.time}</span>
                               </div>
                               <p className={`text-[10px] font-bold leading-snug ${isDarkMode ?
                               "text-slate-400" : "text-slate-500"}`}>{alert.message}</p>
                             </div>
                           </div>
                        </div>
                  
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
          {isPaydaySetupOpen && (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaydaySetupOpen(false)}></div>
            <div className={`w-full lg:max-w-md h-[90vh] lg:h-[80vh] rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl relative z-[130] flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b flex justify-between items-center shrink-0">
  
                <div className="flex flex-col min-w-0 flex-1 pr-2">
                  <h3 className={`font-black uppercase tracking-widest leading-none mb-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Payday Routing</h3>
                  <p className={`text-[10px] font-bold leading-tight ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    *Note: Only configure Pay Dates/ Amounts 
                    for the month of {new Date().toLocaleString("en-US", { month: "long" })}.
                  </p>
                </div>
                <button onClick={() => setIsPaydaySetupOpen(false)} className={closeButtonClass}><X size={18} /></button>
              </div>
              <div className={`p-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${isDemoMode ?
              "pb-[140px] lg:pb-6" : ""}`}>
                <div className="mb-6">
                  <label className={`block text-[9px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ?
                  "text-slate-400" : "text-slate-500"}`}>Pay Frequency</label>
                  <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-2xl border ${isDarkMode ?
                  "bg-slate-800/80 border-slate-700" : "bg-slate-100/80 border-slate-200"}`}>
                    {["Weekly", "Bi-Weekly", "Semi-Monthly", "Monthly"].map(freq => (
                      <button key={freq} onClick={() => setEditPaydayConfig({...editPaydayConfig, frequency: freq})} className={`w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center text-center ${editPaydayConfig?.frequency === freq || (!editPaydayConfig?.frequency && freq === "Weekly") ? "text-white shadow-md" : isDarkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50" : "text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm"}`} style={{ backgroundColor: (editPaydayConfig?.frequency === freq || (!editPaydayConfig?.frequency 
                      && freq === "Weekly")) ? signatureColor : undefined }}>
                        {freq}
                      </button>
                    ))}
                  </div>
        
                </div>
                
                <div className="space-y-6">
                {(editPaydayConfig?.frequency === "Monthly" ?
                  ["Payday 1"] :
                  editPaydayConfig?.frequency === "Semi-Monthly" ?
                  ["Payday 1", "Payday 2"] :
                  editPaydayConfig?.frequency === "Bi-Weekly" ?
                  ["Payday 1", "Payday 2", "Payday 3"] :
                  ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"]).map((pd) => (
                  <div key={pd} className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                    <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{pd}</h4>
      
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`relative w-full h-[54px] rounded-xl border flex flex-col justify-end pb-1.5 px-3 transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                        <label className={`absolute top-2 left-0 w-full text-center text-[8px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Expected Pay Date</label>
   
                        <div className="flex items-center justify-between w-full relative z-10">
                           <span className={`font-bold text-sm text-left truncate flex-1 ${!editPaydayConfig?.[pd]?.date ?
                           "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{editPaydayConfig?.[pd]?.date ? formatDisplayDate(editPaydayConfig?.[pd]?.date) : "mm/dd/yy"}</span>
                           <CalendarIcon size={16} className="shrink-0" style={{ color: signatureColor }} />
                        </div>
                        <input type="date" value={editPaydayConfig?.[pd]?.date ||
                        ""} onChange={(e) => setEditPaydayConfig({...editPaydayConfig, [pd]: {...(editPaydayConfig?.[pd] || {}), date: e.target.value}})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                      </div>
                      <div className={`relative w-full h-[54px] rounded-xl border flex flex-col justify-end pb-1.5 px-3 transition-colors focus-within:border-slate-400 dark:focus-within:border-slate-500 ${isDarkMode ?
                      "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                        <label className={`absolute top-2 left-0 w-full text-center z-10 text-[8px] font-black uppercase tracking-widest pointer-events-none ${isDarkMode ?
                        "text-slate-400" : "text-slate-500"}`}>Expected Income</label>
                        <div className="flex items-center justify-center w-full relative z-10">
                          <span className={`font-bold text-sm ${isDarkMode ?
                          "text-white" : "text-slate-900"}`}>$</span>
                          <input type="text" inputMode="decimal" pattern="[0-9.-]*" placeholder="0.00" value={editPaydayConfig?.[pd]?.income ||
                          ""} onChange={(e) => setEditPaydayConfig({...editPaydayConfig, [pd]: {...(editPaydayConfig?.[pd] || {}), income: e.target.value}})} onBlur={(e) => { if(e.target.value && !isNaN(parseFloat(e.target.value))) { setEditPaydayConfig({...editPaydayConfig, [pd]: {...(editPaydayConfig?.[pd] || {}), income: parseFloat(e.target.value).toFixed(2)}});
                          } }} className={`bg-transparent outline-none font-bold text-sm w-[76px] ml-1 ${isDarkMode ?
                          "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`} />
                        </div>
                      </div>
                    </div>
                  </div>
           
                ))}
                </div>
              </div>
              <div className="p-6 border-t flex gap-3">
                <button onClick={clearPaydayConfig} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 ${isDarkMode ?
                "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"}`}>Clear All</button>
                <button onClick={savePaydayConfig} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: signatureColor }}>Save Engine</button>
              </div>
            </div>
          </div>
        )}

        {isAddAccountOpen && 
        (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddAccountOpen(false)}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b flex justify-between items-center">
                
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Add Account</h3>
                <button onClick={() => setIsAddAccountOpen(false)} className={closeButtonClass}><X size={18} /></button>
              </div>
              <div className={`p-6 space-y-4 ${isDemoMode ?
              "pb-[140px] lg:pb-6" : ""}`}>
                <div className="relative"><label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                "text-slate-400" : "text-slate-500"}`}>Account Name</label><input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors uppercase ${isDarkMode ?
                "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} /></div>
                <div className="relative">
                  <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                  "text-slate-400" : "text-slate-500"}`}>Current Balance</label>
                  <div className="relative w-full flex items-center">
                    <span className={`absolute left-5 top-[22px] font-bold text-base ${isDarkMode ?
                    "text-white" : "text-slate-900"}`}>$</span>
                    <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} onBlur={() => { if(!isNaN(parseFloat(newAccBalance)) && newAccBalance !== "") setNewAccBalance(parseFloat(newAccBalance).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border transition-colors ${isDarkMode ?
                    "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                  </div>
                  <div className="flex items-center justify-between mt-3 ml-2 pr-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ?
                    "text-slate-400" : "text-slate-500"}`}>Negative Balance (Debt)</span>
                    <button onClick={() => { triggerHaptic(20);
                    setNewAccIsNegative(!newAccIsNegative); }} className={`w-10 h-5 rounded-full transition-colors relative ${newAccIsNegative ? "bg-red-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${newAccIsNegative ?
                      "translate-x-5" : "translate-x-1"}`}></div>
                    </button>
                  </div>
                </div>
                <div className="relative mt-2"><label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                "text-slate-400" : "text-slate-500"}`}>Account Type</label><select value={newAccType} onChange={(e) => setNewAccType(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border appearance-none transition-colors ${isDarkMode ?
                "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}><option>Checking</option><option>Savings</option><option>Credit Card</option><option>Cash</option><option>401k / Retirement</option></select></div>
                <div className="relative"><label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                "text-slate-400" : "text-slate-500"}`}>Account Details</label><input type="text" placeholder={newAccType} value={newAccDesc} onChange={(e) => setNewAccDesc(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors ${isDarkMode ?
                "bg-[#0F172A] border-slate-700 text-white placeholder-slate-600" : "bg-white border-slate-200 text-slate-900 placeholder-slate-300"}`} /></div>
                <button onClick={handleAddAccount} disabled={!newAccName.trim() ||
                isNaN(parseFloat(newAccBalance))} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2" style={{ backgroundColor: (!newAccName.trim() || isNaN(parseFloat(newAccBalance))) ?
                undefined : signatureColor }}>Save Account <CheckCircle2 size={16} /></button>
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
              <div className={`p-6 space-y-4 relative ${isDemoMode ?
              "pb-[140px] lg:pb-6" : ""}`}>
                <div className="relative">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                  "text-slate-400" : "text-slate-500"}`}>Goal Name</label>
                  <input type="text" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors outline-none uppercase ${isDarkMode ?
                  "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                </div>
                
                <div className="relative cursor-pointer" onClick={() => setIsIconSelectorOpen(true)}>
                    <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                    "text-slate-400" : "text-slate-500"}`}>Goal Icon</label>
                    <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                    "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                       <span className="text-xl leading-none">{newGoalIcon}</span>
                       <ArrowDown size={14} className={isDarkMode ?
                       "text-slate-400" : "text-slate-500"} />
                    </div>
                </div>
                
                <div className="relative">
                  <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode 
                  ? "text-slate-400" : "text-slate-500"}`}>Goal Amount</label>
                  <div className="relative w-full flex items-center">
                    <span className={`absolute left-5 top-[22px] font-bold text-base ${isDarkMode ?
                    "text-white" : "text-slate-900"}`}>$</span>
                    <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={newGoalAmount} onChange={(e) => setNewGoalAmount(e.target.value)} onBlur={() => { if(!isNaN(parseFloat(newGoalAmount)) && newGoalAmount !== "") setNewGoalAmount(parseFloat(newGoalAmount).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border transition-colors outline-none ${isDarkMode ?
                    "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                  </div>
                </div>
                <div className="relative">
                  <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                  "text-slate-400" : "text-slate-500"}`}>Goal Date</label>
                  <div className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                  "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                    <span className={`font-bold text-base ${!newGoalDate ?
                    "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{newGoalDate ? formatDisplayDate(newGoalDate) : "mm/dd/yyyy"}</span>
                    <CalendarIcon size={18} className="shrink-0" style={{ color: signatureColor }} />
                    <input type="date" value={newGoalDate} onChange={(e) => setNewGoalDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
             
                 </div>
                <button onClick={handleAddGoal} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2" style={{ backgroundColor: signatureColor }}>Lock In Goal <Target size={16} /></button>

                {isIconSelectorOpen && (
                  <div className={`absolute inset-0 z-[150] flex flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
         
                    <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}><h3 className={`font-black uppercase text-sm ${isDarkMode ?
                    "text-white" : "text-slate-900"}`}>Select Icon</h3><button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button></div>
                    <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 ${isDemoMode ?
                    "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                      <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">
                        {categoryEmojis.map(emoji => (
                          <button key={emoji} onClick={() => { setNewGoalIcon(emoji); setIsIconSelectorOpen(false); }} className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 
                          ${newGoalIcon === emoji ? 'text-white border-transparent shadow-md' : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`} style={{ backgroundColor: newGoalIcon === emoji ? signatureColor : undefined }}>{emoji}</button>
                        ))}
                      </div>
                    </div>
        
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isTransferOpen && (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
   
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTransferOpen(false)}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col overflow-hidden transition-all ${isDarkMode ?
            "bg-[#1E293B] border border-slate-800" : "bg-white border border-slate-100"}`}>
              <div className="p-6 border-b flex justify-between items-center shrink-0">
                <h3 className={`font-black uppercase tracking-widest flex items-center gap-2 ${isDarkMode ?
                "text-white" : "text-slate-900"}`}><ArrowRightLeft size={16}/> Internal Transfer</h3>
                <button onClick={() => setIsTransferOpen(false)} className={closeButtonClass}><X size={18} /></button>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="grid grid-cols-2 gap-3 mb-4 items-center relative">
     
                   <div className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[82px] transition-colors relative ${isDarkMode ?
                   "bg-slate-800/60 border-slate-700/50" : "bg-slate-50 border-slate-100 shadow-inner"}`}>
                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Source</span>
                    <span className="text-xl leading-none mb-1">{accounts.find(a => a.id === transferFrom)?.icon ||
                    "🏦"}</span>
                    <span className={`text-xs font-black truncate max-w-full leading-tight uppercase tracking-wider ${isDarkMode ?
                    "text-slate-300" : "text-slate-700"}`}>{accounts.find(a => a.id === transferFrom)?.name || "Select Account..."}</span>
                    <span className="text-[10px] font-extrabold text-[#10B981] mt-0.5">${(accounts.find(a => a.id === transferFrom)?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20">
                      <option value="">Select Account...</option>
  
                      {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>
                  </div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border flex items-center justify-center z-10 shadow-md transform bg-white text-slate-500 border-slate-200 dark:bg-slate-800 
                  dark:border-slate-700 dark:text-slate-400">
                    <ArrowRightLeft size={14} className="animate-[spin_4s_linear_infinite]" />
                  </div>
                  <div className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[82px] transition-colors relative ${isDarkMode ?
                  "bg-slate-800/60 border-slate-700/50" : "bg-slate-50 border-slate-100 shadow-inner"}`}>
                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Destination</span>
                    <span className="text-xl leading-none mb-1">{accounts.find(a => a.id === transferTo)?.icon ||
                    "🏦"}</span>
                    <span className={`text-xs font-black truncate max-w-full leading-tight uppercase tracking-wider ${isDarkMode ?
                    "text-slate-300" : "text-slate-700"}`}>{accounts.find(a => a.id === transferTo)?.name || "Select Account..."}</span>
                    <span className="text-[10px] font-extrabold text-[#10B981] mt-0.5">${(accounts.find(a => a.id === transferTo)?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20">
                      <option value="">Select Account...</option>
  
                      {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>
                  </div>
                </div>

                <div className="text-center relative flex justify-center items-center 
                mb-4 min-h-[70px] border border-dashed rounded-2xl dark:border-slate-800 border-slate-200/80 px-4 bg-slate-50/20 dark:bg-slate-900/10">
                  <span className="text-5xl font-black tracking-tighter drop-shadow-sm" style={{ color: signatureColor }}>${transferAmount}</span>
                  <button onClick={() => { triggerHaptic(15);
                  setTransferAmount(transferAmount.slice(0, -1) || "0"); }} className="absolute right-4 p-3 rounded-full text-2xl active:scale-90 transition-all text-slate-400 hover:text-red-500"> ⌫ </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
               
                    <button key={btn} onClick={() => handleTransferNumpad(btn)} className={`w-full h-12 rounded-xl text-xl font-bold flex items-center justify-center transition-all border active:scale-95 touch-manipulation ${isDarkMode ? "bg-slate-800/40 border-slate-700/50 text-slate-200 hover:bg-slate-700/40" : "bg-slate-100 border-slate-200/60 text-slate-800 hover:bg-slate-200/50"}`}>
                      {btn}
                    </button>
                  ))}
        
                </div>

                <button onClick={executeTransfer} disabled={parseFloat(transferAmount) <= 0 ||
                !transferFrom || !transferTo} className="w-full mt-4 h-14 shrink-0 rounded-2xl font-black uppercase tracking-widest text-xs text-white transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: (parseFloat(transferAmount) <= 0 || !transferFrom || !transferTo) ?
                undefined : signatureColor }}>Execute Transfer <ArrowRightLeft size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {isCashOutOpen && cashOutGoal && (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { 
            setIsCashOutOpen(false); setCashOutGoal(null); }}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col overflow-hidden transition-all ${isDarkMode ? "bg-[#1E293B] border border-slate-800" : "bg-white border border-slate-100"}`}>
              <div className="p-6 border-b flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cashOutGoal.icon}</span>
       
                   <h3 className={`font-black uppercase tracking-widest ${isDarkMode ?
                   "text-white" : "text-slate-900"}`}>Cash Out: {cashOutGoal.name}</h3>
                </div>
                <button onClick={() => { setIsCashOutOpen(false);
                setCashOutGoal(null); }} className={closeButtonClass}><X size={18} /></button>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="relative mb-4">
                  <label className={`absolute left-4 top-2 text-[9px] font-black uppercase tracking-widest z-10 ${isDarkMode ?
                  "text-slate-400" : "text-slate-500"}`}>CASH OUT TO WHICH ACCOUNT?</label>
                  <select value={cashOutToAccount} onChange={(e) => setCashOutToAccount(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border font-bold text-sm appearance-none transition-colors outline-none focus:border-slate-400 dark:focus:border-slate-500 bg-transparent relative z-10 ${isDarkMode ?
                  "text-white" : "text-slate-900"}`}>
                    <option value="" disabled>Select Account...</option>
                    {accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Savings" || a.type === "Cash")).map(a => (
                      <option key={a.id} value={a.id} className={isDarkMode ? "bg-[#1E293B]" : "bg-white"}>{a.name} (${(a.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}). </option>
  
                    ))}
                  </select>
                </div>

                <div className="text-center relative flex justify-center items-center mb-4 min-h-[64px] border border-dashed rounded-2xl dark:border-slate-800 border-slate-200/80 px-4 bg-slate-50/20 dark:bg-slate-900/10">
                 
                 <span className="text-4xl font-black tracking-tighter text-[#10B981]">${cashOutAmount}</span>
                  <div className="absolute right-4 flex items-center gap-2">
                    <button onClick={() => { triggerHaptic(20);
                    setCashOutAmount(String(cashOutGoal.balance.toFixed(2))); }} className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-transparent" style={{ backgroundColor: `${signatureColor}1A`, color: signatureColor }}>MAX</button>
                    <button onClick={() => handleCashOutNumpad("CLR")} className="p-2 rounded-full text-sm text-slate-400 hover:text-red-500">⌫</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
   
                 {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((num) => (
                    <button key={num} onClick={() => handleCashOutNumpad(num)} className={`h-11 rounded-xl text-lg font-bold flex items-center justify-center transition-all border active:scale-95 ${isDarkMode ? "bg-slate-800/40 border-slate-700/50 text-slate-200 hover:bg-slate-700" : "bg-slate-100 border-slate-200/60 text-slate-800 hover:bg-slate-200"}`}>{num}</button>
                  ))}
          
                </div>

                <button onClick={handleCashOutGoalSubmit} disabled={parseFloat(cashOutAmount) <= 0 ||
                parseFloat(cashOutAmount) > cashOutGoal.balance || !cashOutToAccount} className={`w-full mt-4 h-14 shrink-0 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${parseFloat(cashOutAmount) <= 0 ||
                parseFloat(cashOutAmount) > cashOutGoal.balance || !cashOutToAccount ? "bg-slate-300 opacity-40 shadow-none cursor-not-allowed" : "bg-[#10B981] shadow-[0_8px_20px_rgba(16,185,129,0.35)]"}`}>Disburse Funds <CheckCircle2 size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {selectedAccount && !isAddAccountOpen && !isTransferOpen && !isAddGoalOpen && (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
       
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedAccount(null)}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 
                  rounded-full flex items-center justify-center text-lg bg-slate-100 dark:bg-slate-800">{editAccountIcon}</div>
                  <h3 className={`font-black uppercase tracking-widest ${isDarkMode ?
                  "text-white" : "text-slate-900"}`}>{selectedAccount.isGoal ? "Edit Goal" : "Edit Account"}</h3>
                </div>
                <button onClick={() => setSelectedAccount(null)} className={closeButtonClass}><X size={18} /></button>
              </div>
              <div className={`p-6 space-y-4 overflow-y-auto hide-scrollbar ${isDemoMode ?
              "pb-[140px] lg:pb-6" : ""}`}>
                {selectedAccount.isGoal && (
                  <>
                    <div className="relative">
                       <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Name</label>
     
                       <input type="text" value={editAccountName} onChange={(e) => setEditAccountName(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                    </div>
                    <div className="relative cursor-pointer" onClick={() => setIsIconSelectorOpen(true)}>
               
                      <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Icon</label>
                       <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                       "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                          <span className="text-xl leading-none">{editAccountIcon}</span>
                          <ArrowDown size={14} className={isDarkMode ?
                          "text-slate-400" : "text-slate-500"} />
                       </div>
                    </div>
                    <div className="relative">
                       <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode 
                       ? "text-slate-400" : "text-slate-500"}`}>Target Goal Amount</label>
                       <div className="relative w-full flex items-center">
                          <span className={`absolute left-5 top-[22px] font-bold text-base ${isDarkMode ?
                          "text-white opacity-50" : "text-slate-900 opacity-50"}`}>$</span>
                          <input type="text" value={(selectedAccount.targetAmount || 0).toFixed(2)} disabled className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border transition-colors opacity-60 cursor-not-allowed ${isDarkMode ?
                          "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                       </div>
                    </div>
                    <div className="relative">
                       <label className={`absolute left-4 top-2 z-10 text-[9px] 
                       font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Target Goal Date</label>
                       <div className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                       "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                          <span className={`font-bold text-base ${!editAccountTargetDate ?
                          "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{editAccountTargetDate ? formatDisplayDate(editAccountTargetDate) : "mm/dd/yyyy"}</span>
                          <CalendarIcon size={18} className="shrink-0" style={{ color: signatureColor }} />
                          <input type="date" value={editAccountTargetDate ||
                          ""} onChange={(e) => setEditAccountTargetDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                       </div>
                    </div>
                  </>
                )}
             
                <div className="relative">
                  <label className="absolute left-4 top-2 text-[9px] font-black uppercase tracking-widest z-10" style={{ color: signatureColor }}>{selectedAccount.isGoal ?
                  "CURRENT BALANCE" : "QUICK BALANCE UPDATE"}</label>
                  <div className="relative w-full flex items-center">
                    <span className={`absolute left-5 top-[22px] font-bold text-lg ${isDarkMode ?
                    "text-white" : "text-slate-900"}`}>$</span>
                    <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={editAccountBalance} onChange={(e) => setEditAccountBalance(e.target.value)} onFocus={() => setEditAccountBalance(Math.abs(selectedAccount.balance || 0).toFixed(2))} onBlur={() => { if(!isNaN(parseFloat(editAccountBalance)) && editAccountBalance !== "") setEditAccountBalance(parseFloat(editAccountBalance).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border focus:outline-none transition-colors ${isDarkMode ?
                    "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                  </div>
                  {!selectedAccount.isGoal && (
                    <div className="flex items-center justify-between mt-3 ml-2 pr-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 
                      "text-slate-400" : "text-slate-500"}`}>Negative Balance (Debt)</span>
                      <button onClick={() => { triggerHaptic(20); setEditAccIsNegative(!editAccIsNegative); }} className={`w-10 h-5 rounded-full transition-colors relative ${editAccIsNegative ? "bg-red-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${editAccIsNegative ? "translate-x-5" : "translate-x-1"}`}></div>
                     
                       </button>
                    </div>
                  )}
                </div>
                <div className="relative mt-2">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 
                  z-10 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{selectedAccount.isGoal ? "Goal Details" : "Account Details"}</label>
                  <input type="text" placeholder={selectedAccount.type} value={editAccountDesc} onChange={(e) => setEditAccountDesc(e.target.value)} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors ${isDarkMode ?
                  "bg-[#0F172A] border-slate-700 text-white placeholder-slate-600" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"}`} />
                </div>
                <button onClick={updateAccountBalance} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2" style={{ backgroundColor: signatureColor }}><Save size={16} /> Save Changes</button>
                <button onClick={deleteAccount} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-500 shadow-[0_8px_16px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16}/> {selectedAccount.isGoal ?
                "Delete Goal" : "Delete Account"}</button>
              </div>
              {isIconSelectorOpen && selectedAccount.isGoal && (
                <div className={`absolute inset-0 z-[150] flex flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
                   <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}><h3 className={`font-black uppercase text-sm ${isDarkMode ? "text-white" 
                   : "text-slate-900"}`}>Select Icon</h3><button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button></div>
                   <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                      <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">{categoryEmojis.map(emoji => (<button key={emoji} onClick={() => { setEditAccountIcon(emoji); setIsIconSelectorOpen(false); }} className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 ${editAccountIcon === emoji ?
                      'text-white border-transparent shadow-md' : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`} style={{ backgroundColor: editAccountIcon === emoji ?
                      signatureColor : undefined }}>{emoji}</button>))}</div>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {paymentModalConfig.isOpen && 
        (() => {
          const activeBill = bills.find(b => b.id === paymentModalConfig.billId);
          const remainingBal = activeBill?.isInstallment ? (activeBill.totalAmount || 0) - (activeBill.paidAmount || 0) : 0;
          const isPayInFullAvailable = activeBill?.isInstallment && remainingBal > (activeBill.amount || 0);

          return (
            <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
         
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false })}></div>
              <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col ${isDarkMode ?
              "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
                <div className="p-6 border-b flex justify-between items-center">
                  <h3 className={`font-black uppercase tracking-widest ${isDarkMode ?
                  "text-white" : "text-slate-900"}`}>Confirm Payment</h3>
                  <button onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "", isPayInFull: false })} className={closeButtonClass}><X size={18} /></button>
                </div>
                <div className={`p-6 space-y-4 ${isDemoMode ?
                "pb-[140px] lg:pb-6" : ""}`}>
                  <div className="relative">
                    <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                    "text-slate-400" : "text-slate-500"}`}>Pay From Account</label>
                    <select value={paymentModalConfig.accountId} onChange={(e) => setPaymentModalConfig({ ...paymentModalConfig, accountId: e.target.value })} className={`w-full pt-6 pb-2 px-5 rounded-2xl border appearance-none transition-colors ${isDarkMode ?
                    "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                      {accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).map((a) => (<option key={a.id} value={a.id} className={isDarkMode ? "bg-[#1E293B]" : "bg-white"}>{a.name} (${(a.balance || 0).toFixed(2)})</option>))}
                    </select>
                  </div>
            
                  {isPayInFullAvailable && (
                    <div className={`p-4 rounded-2xl border border-dashed flex items-center justify-between cursor-pointer ${paymentModalConfig.isPayInFull ? "text-white shadow-md" : isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} onClick={() => { triggerHaptic(20); setPaymentModalConfig({...paymentModalConfig, isPayInFull: !paymentModalConfig.isPayInFull}); }} style={{ backgroundColor: paymentModalConfig.isPayInFull ? signatureColor : undefined, borderColor: paymentModalConfig.isPayInFull ?
                    signatureColor : undefined }}>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-85">Pay In Full</span>
                        <span className="font-black text-sm">Remaining: ${remainingBal.toFixed(2)}</span>
               
                       </div>
                      <div className={`w-12 h-6 rounded-full transition-colors relative ${paymentModalConfig.isPayInFull ?
                      "bg-white/30" : isDarkMode ? "bg-slate-700" : "bg-slate-300"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${paymentModalConfig.isPayInFull ?
                        "translate-x-7" : "translate-x-1"}`}></div>
                      </div>
                    </div>
                  )}
                  <button onClick={confirmPaymentRoute} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#10B981] shadow-[0_8px_16px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Complete 
                  Payment {paymentModalConfig.isPayInFull ? `($${remainingBal.toFixed(2)})` : (activeBill ? `($${(activeBill.amount || 0).toFixed(2)})` : '')}</button>
                </div>
              </div>
            </div>
          );
        })()}

        {selectedEntry && !selectedAccount && (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeEntryDrawer}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col max-h-[95vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b flex justify-between items-center shrink-0">
  
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-slate-100 dark:bg-slate-800">{isEditingEntry ? (editEntryData.icon || selectedEntry.icon) : selectedEntry.icon}</div>
                  <h3 className={`font-black uppercase tracking-widest ${isDarkMode ?
                  "text-white" : "text-slate-900"}`}>{isEditingEntry ? "Edit Entry" : "Entry Details"}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingEntry && (<button onClick={() => { setIsEditingEntry(true); setEditEntryData({ name: selectedEntry.name, amount: (selectedEntry.amount || 0).toFixed(2), category: selectedEntry.category, icon: selectedEntry.icon, rawDate: selectedEntry.rawDate || "", isRecurring: selectedEntry.isRecurring || false, isInstallment: selectedEntry.isInstallment || false, totalAmount: (selectedEntry.totalAmount || 0).toFixed(2) || "", paidAmount: (selectedEntry.paidAmount || 
                  0).toFixed(2) || "", accountId: selectedEntry.accountId || "" }); }} className={closeButtonClass}><Edit2 size={16} /></button>)}
                  <button onClick={closeEntryDrawer} className={closeButtonClass}><X size={18} /></button>
                </div>
              </div>
              <div className={`p-6 space-y-6 overflow-y-auto hide-scrollbar ${isDemoMode ?
              "pb-[140px] lg:pb-6" : ""}`}>
                {!isEditingEntry ?
                (
                  <>
                    <div className="text-center">
                      <h2 className={`text-xl font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEntry.name}</h2>
                      <p className={`text-5xl font-black tracking-tighter ${getEntryAmountColor(selectedEntry)}`}>
     
                        {selectedEntry.type === 'Income' ? '+' : selectedEntry.type === 'Expense' ? '-' : ''}${(selectedEntry.amount || 0).toFixed(2)}
                      </p>
                      <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
        
                        <CalendarIcon size={14} className="text-slate-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{selectedEntry.fullDate || selectedEntry.date || "No Date"}</span>
                      </div>
                    </div>
     
                    <div className={`rounded-2xl p-4 border ${isDarkMode ?
                    "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <div className={`flex justify-between py-2 border-b ${isDarkMode ?
                      "border-slate-700" : "border-slate-200"}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</span>
                        <span className={`text-xs font-black ${isDarkMode ?
                        "text-white" : "text-slate-900"}`}>{selectedEntry.category || "Bill / Subscription"}</span>
                      </div>
                      {selectedEntry.type && (
                        <div className={`flex justify-between py-2 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
               
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</span>
                          <span className={`text-xs font-black ${selectedEntry.type === "Income" ? "text-[#10B981]" : "text-[#F97316]"}`}>{selectedEntry.type}</span>
                        </div>
                      )}
   
                      {selectedEntry.payday && (
                        <div className={`flex justify-between py-2 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned To</span>
              
                          <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEntry.payday}</span>
                        </div>
                      )}
                      {selectedEntry.isOverdue !== undefined && (
         
                        <div className="flex justify-between py-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                          <span className={`text-xs font-black ${selectedEntry.isPaid ?
                          "text-[#10B981]" : selectedEntry.isOverdue ? "text-red-500" : "text-[#F97316]"}`}>{selectedEntry.isPaid ? "Paid" : selectedEntry.isOverdue ?
                          "Overdue" : "Pending"}</span>
                        </div>
                      )}
                    </div>
                    {selectedEntry.isOverdue !== undefined && !selectedEntry.isPaid && (
      
                        <div className="space-y-3">
                        <button onClick={() => { setSelectedEntry(null); setPaymentModalConfig({ isOpen: true, billId: selectedEntry.id, accountId: accounts.find(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash"))?.id || (accounts[0]?.id || ""), isPayInFull: false }); }} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#10B981] shadow-[0_8px_16px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2">
              
                          <CheckCircle2 size={16} /> Mark as Paid
                        </button>
                      </div>
                    )}
                 
                   <button onClick={() => { 
                      openGlobalAction("Delete Entry", "Are you sure you want to permanently delete this entry?", "Delete", true, async () => {
                        const colName = selectedEntry.fullDate ?
                        "bills" : "transactions"; 
                        if (isDemoMode) { 
                          if (colName === "bills") { setBills(bills.filter(b => b.id !== selectedEntry.id));
                          } 
                          else { setTransactions(transactions.filter(t => t.id !== selectedEntry.id));
                          } 
                        } else { 
                          await deleteDoc(doc(db, "users", user.uid, colName, selectedEntry.id));
                          if(!selectedEntry.fullDate && selectedEntry.accountId) { 
                            const acc = accounts.find(a => a.id === selectedEntry.accountId);
                            if(acc) { 
                              const revAmount = selectedEntry.type === "Income" ?
                              -(selectedEntry.amount || 0) : (selectedEntry.amount || 0); 
                              await updateDoc(doc(db, "users", user.uid, "accounts", acc.id), { balance: (acc.balance || 0) + revAmount });
                            } 
                          } 
                        } 
                        setSelectedEntry(null);
                        triggerHaptic(50);
                        setGlobalActionConfig(prev => ({ ...prev, isOpen: false }));
                      });
                    }} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-500 shadow-[0_8px_16px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Delete Entry</button>
                  </>
                ) : (
                  <>
                 
                   <div className="space-y-4">
                      <div className="relative"><label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Name</label><input type="text" value={editEntryData.name || ""} onChange={(e) => setEditEntryData({...editEntryData, name: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} /></div>
                      <div className="relative">
            
                        <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                        "text-slate-400" : "text-slate-500"}`}>Amount</label>
                        <div className="relative w-full flex items-center">
                          <span className={`absolute left-5 top-[22px] font-bold text-base ${isDarkMode ?
                          "text-white" : "text-slate-900"}`}>$</span>
                          <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={editEntryData.amount ||
                          ""} onChange={(e) => setEditEntryData({...editEntryData, amount: e.target.value})} onBlur={() => { if(!isNaN(parseFloat(editEntryData.amount)) && editEntryData.amount !== "") setEditEntryData({...editEntryData, amount: parseFloat(editEntryData.amount).toFixed(2)}) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border transition-colors ${isDarkMode ?
                          "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                        </div>
                      </div>
                      <div className="relative cursor-pointer" onClick={() => setIsIconSelectorOpen(true)}>
                    
                        <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                        "text-slate-400" : "text-slate-500"}`}>Icon</label>
                        <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                        "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                          <span className="text-xl leading-none">{editEntryData.icon ||
                          "🧾"}</span>
                          <ArrowDown size={14} className={isDarkMode ?
                          "text-slate-400" : "text-slate-500"} />
                        </div>
                      </div>
                      <div className="relative">
                        <label className={`absolute left-4 top-2 
                        text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Category</label>
                        <select value={editEntryData.category ||
                        ""} onChange={(e) => setEditEntryData({...editEntryData, category: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl border appearance-none transition-colors ${isDarkMode ?
                        "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                           <option value="" disabled>Select Category</option>
                           {categoriesToRender.map(group => ( <optgroup key={group.group} label={group.group} className={isDarkMode ? "bg-[#1E293B] text-white" : "bg-white text-slate-900"}> {group.items.map(item => <option key={item} value={item}>{item}</option>)} </optgroup> ))}
                  
                        </select>
                      </div>
                      {selectedEntry.fullDate !== undefined && (
                        <>
                      
                          <div className="relative">
                            <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Due Date</label>
                            <div className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                            "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                               <span className={`font-bold text-base ${!editEntryData.rawDate ?
                               "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{editEntryData.rawDate ? formatDisplayDate(editEntryData.rawDate) : "mm/dd/yyyy"}</span>
                               <CalendarIcon size={18} className="shrink-0" style={{ color: signatureColor }} />
                               <input type="date" value={editEntryData.rawDate ||
                               ""} onChange={(e) => setEditEntryData({...editEntryData, rawDate: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                          </div>
                          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
   
                                                   <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Recurring Bill</span>
                              <button onClick={() => { triggerHaptic(20);
                              setEditEntryData({...editEntryData, isRecurring: !editEntryData.isRecurring}); }} className="w-12 h-6 rounded-full transition-colors relative bg-slate-300 dark:bg-slate-700" style={{ backgroundColor: editEntryData.isRecurring ?
                              signatureColor : undefined }}>
                                 <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${editEntryData.isRecurring ?
                                 "translate-x-7" : "translate-x-1"}`}></div>
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
         
                               <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Installment Plan</span>
                              <button onClick={() => { triggerHaptic(20);
                              setEditEntryData({...editEntryData, isInstallment: !editEntryData.isInstallment}); }} className="w-12 h-6 rounded-full transition-colors relative bg-slate-300 dark:bg-slate-700" style={{ backgroundColor: editEntryData.isInstallment ?
                              signatureColor : undefined }}>
                                 <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${editEntryData.isInstallment ?
                                 "translate-x-7" : "translate-x-1"}`}></div>
                              </button>
                            </div>
                            {editEntryData.isInstallment && (
          
                               <div className="grid grid-cols-2 gap-3 animate-fade-in mt-2">
                                <div className="relative">
                                  <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase 
                                  tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Total Amount</label>
                                  <div className="relative w-full flex items-center">
                                    <span className={`absolute left-4 top-[22px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
          
                                    <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={editEntryData.totalAmount || ""} onChange={(e) => setEditEntryData({...editEntryData, totalAmount: e.target.value})} onBlur={() => { if(!isNaN(parseFloat(editEntryData.totalAmount)) && editEntryData.totalAmount !== "") setEditEntryData({...editEntryData, totalAmount: parseFloat(editEntryData.totalAmount).toFixed(2)}) }} className={`w-full pt-6 pb-2 pl-7 pr-4 rounded-2xl border transition-colors ${isDarkMode ?
                                    "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                                  </div>
                                </div>
                           
                               <div className="relative">
                                  <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                                  "text-slate-400" : "text-slate-500"}`}>Already Paid</label>
                                  <div className="relative w-full flex items-center">
                                    <span className={`absolute left-4 top-[22px] font-bold text-base ${isDarkMode ?
                                    "text-white" : "text-slate-900"}`}>$</span>
                                    <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={editEntryData.paidAmount ||
                                    ""} onChange={(e) => setEditEntryData({...editEntryData, paidAmount: e.target.value})} onBlur={() => { if(!isNaN(parseFloat(editEntryData.paidAmount)) && editEntryData.paidAmount !== "") setEditEntryData({...editEntryData, paidAmount: parseFloat(editEntryData.paidAmount).toFixed(2)}) }} className={`w-full pt-6 pb-2 pl-7 pr-4 rounded-2xl border transition-colors ${isDarkMode ?
                                    "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                                  </div>
                                </div>
                           
                               </div>
                            )}
                          </div>
                        </>
                   
                       )}
                      {selectedEntry.fullDate === undefined && (
                         <div className="relative">
                            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Account</label>
     
                             <select disabled value={editEntryData.accountId || ""} onChange={(e) => setEditEntryData({...editEntryData, accountId: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl border appearance-none transition-colors opacity-70 cursor-not-allowed ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                               <option value="" disabled>Which account paid for this activity?</option>
           
                              {accounts.map((a) => (<option key={a.id} value={a.id} className={isDarkMode ?
                              "bg-[#1E293B]" : "bg-white"}>{a.name}</option>))}
                            </select>
                         </div>
                      )}
                    </div>
   
                    <button onClick={handleSaveEntryEdit} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2" style={{ backgroundColor: signatureColor }}><Save size={16} /> Save Changes</button>
                  </>
                )}
              </div>
             
               {isIconSelectorOpen && isEditingEntry && (
                 <div className={`absolute inset-0 z-[150] flex flex-col ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
                    <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}><h3 className={`font-black uppercase text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Icon</h3><button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button></div>
                    <div className={`flex-1 overflow-y-auto hide-scrollbar 
                    p-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                       <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">{categoryEmojis.map(emoji => (<button key={emoji} onClick={() => { setEditEntryData({...editEntryData, icon: emoji}); setIsIconSelectorOpen(false); }} className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 ${editEntryData.icon === emoji ? 'text-white border-transparent shadow-md' : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`} style={{ backgroundColor: editEntryData.icon === emoji ? signatureColor : undefined }}>{emoji}</button>))}</div>
                  
                   </div>
                 </div>
              )}
            </div>
          </div>
        )}

        {installmentPromptConfig.isOpen && (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
          
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setInstallmentPromptConfig({ isOpen: false, billId: null, nextDate: "" })}></div>
            <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col transition-colors duration-500 ${isDarkMode ?
            "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className={`font-black uppercase tracking-widest text-sm ${isDarkMode ?
                "text-white" : "text-slate-900"}`}>Next Installment</h3>
                <button onClick={() => setInstallmentPromptConfig({ isOpen: false, billId: null, nextDate: "" })} className={closeButtonClass}><X size={18}/></button>
              </div>
              <div className={`p-6 space-y-6 ${isDemoMode ?
              "pb-[140px] lg:pb-6" : ""}`}>
                <div className="text-center">
                  <h2 className={`text-lg font-black mb-1 ${isDarkMode ?
                  "text-white" : "text-slate-900"}`}>Payment Logged!</h2>
                  <p className="text-xs font-bold text-slate-500">When is your next payment due?</p>
                </div>
                <div className="relative">
                   <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                   "text-slate-400" : "text-slate-500"}`}>Next Due Date</label>
                   <div className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                   "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                     <span className={`font-bold text-base ${!installmentPromptConfig.nextDate ?
                     "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{installmentPromptConfig.nextDate ? formatDisplayDate(installmentPromptConfig.nextDate) : "mm/dd/yyyy"}</span>
                     <CalendarIcon size={18} className="shrink-0" style={{ color: signatureColor }} />
                     <input type="date" value={installmentPromptConfig.nextDate} onChange={(e) => setInstallmentPromptConfig({...installmentPromptConfig, nextDate: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   </div>
        
                 </div>
                <button onClick={handleSaveNextInstallmentDate} disabled={!installmentPromptConfig.nextDate} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: !installmentPromptConfig.nextDate ?
                undefined : signatureColor }}><CalendarIcon size={16}/> Route to Payday</button>
              </div>
            </div>
          </div>
        )}

        {isQabOpen && (
          <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeQab}></div>
     
             <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col h-auto max-h-[95vh] ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
               <div className={`p-6 border-b flex justify-between items-center shrink-0 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                  <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{qabActiveLabel}</h3>
                  <button onClick={closeQab} className={closeButtonClass}><X size={18} 
                  /></button>
               </div>
               
               <div className={`overflow-y-auto hide-scrollbar flex flex-col pb-6 ${isDemoMode ?
               "mb-[140px] lg:mb-0" : ""}`}>
                 {qabStep === 1 ?
                 (
                   <div className="p-4 flex flex-col space-y-2 h-auto">
                     <div className={`flex p-1 rounded-xl ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                       <button onClick={() => { triggerHaptic(20); setDrawerTab("bills"); setInputValue("0"); }} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "bills" ? "text-white shadow-sm" : isDarkMode 
                       ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`} style={{ backgroundColor: drawerTab === "bills" ? signatureColor : undefined }}>Bill</button>
                       <button onClick={() => { triggerHaptic(20); setDrawerTab("transactions"); setInputValue("0"); }} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "transactions" ? "bg-[#F97316] text-white shadow-sm" : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`}>Expense</button>
                       <button onClick={() => { triggerHaptic(20);
                       setDrawerTab("income"); setInputValue("0"); }} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${drawerTab === "income" ?
                       "bg-[#10B981] text-white shadow-sm" : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`}>Income</button>
                     </div>
                     
                     <div className="text-center relative flex justify-center items-center py-2">
                     
                       <span className={`text-5xl font-black tracking-tighter ${drawerTab === "bills" ? "" : qabActiveText}`} style={{ color: drawerTab === "bills" ?
                       signatureColor : undefined }}>${inputValue}</span>
                       <button 
                         onPointerDown={(e) => { e.preventDefault();
                         triggerHaptic(15); setInputValue(inputValue.slice(0, -1) || "0"); }} 
                         className="absolute right-4 p-2 text-xl active:scale-90 transition-transform opacity-70 hover:opacity-100" 
                         style={{ color: drawerTab === "bills" ?
                         signatureColor : undefined }}
                       >
                         ⌫
                       </button>
                     </div>
     
                  
                     <div className="grid grid-cols-4 gap-2 py-1">
                       {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", ".", "0", "=", "+"].map((btn) => (
                   
                         <button 
                           key={btn} 
                           onPointerDown={(e) => { e.preventDefault(); handleNumpad(btn); }} 
                           className={`w-full h-11 rounded-xl text-xl font-black 
                           flex items-center justify-center transition-all border mt-0 active:scale-95 touch-manipulation ${isDarkMode ? "bg-slate-800 border-slate-700 text-white active:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-900 active:bg-slate-200"}`}
                         >
                           {btn}
                         </button>
     
                       ))}
                     </div>
                     
                     <button onClick={() => { triggerHaptic(20);
                     setInputValue(parseFloat(String(inputValue).replace(/\s+/g, "")).toFixed(2)); setQabStep(2); }} disabled={!isQabAmountValid} className={`w-full h-14 shrink-0 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${!isQabAmountValid ?
                     "bg-slate-300 opacity-50 cursor-not-allowed shadow-none" : `active:scale-95 ${drawerTab === "bills" ?
                     "" : qabActiveBg} ${qabActiveShadow} hover:-translate-y-0.5`}`} style={{ backgroundColor: (isQabAmountValid && drawerTab === "bills") ?
                     signatureColor : undefined }}>Next Step <ArrowRight size={18} /></button>
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
                        <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                        "text-slate-400" : "text-slate-500"}`}>Amount</label>
                        <div className="relative w-full flex items-center">
                          <span className={`absolute left-5 top-[18px] font-bold text-base ${isDarkMode ?
                          "text-white" : "text-slate-900"}`}>$</span>
                          <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onBlur={() => { if(!isNaN(parseFloat(String(inputValue).replace(/\s+/g, ""))) && inputValue !== "") setInputValue(parseFloat(String(inputValue).replace(/\s+/g, "")).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-9 pr-5 rounded-2xl border font-bold text-base focus:outline-none transition-colors ${isDarkMode ?
                          "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                        </div>
                      </div>
                     <div className="relative cursor-pointer" onClick={() => setIsIconSelectorOpen(true)}>
                     
                       <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                       "text-slate-400" : "text-slate-500"}`}>Icon</label>
                        <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                        "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                           <span className="text-xl leading-none">{entryIcon}</span>
                           <ArrowDown size={14} className={isDarkMode ?
                           "text-slate-400" : "text-slate-500"} />
                        </div>
                     </div>
                     {currentRecentCategories.length > 0 && (
                        <div className="mb-1 mt-1">
 
                             <label className={`block text-[9px] font-bold uppercase tracking-widest mb-1 px-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Recent Categories</label>
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                           
                                 {/* UPDATE 1 INJECTED: Contextual UI Glows for QAB Category Pills */}
                                 {currentRecentCategories.map(cat => {
                                    const isSelected = entryCategory === cat;
       
                                     const tabColorHex = drawerTab === "bills" ? signatureColor : drawerTab === "income" ? "#10B981" : "#F97316";
                                    const tabShadowClass = drawerTab === "bills" ? "shadow-[0_0_12px_rgba(24,119,242,0.45)]" : drawerTab === "income" ?
                                    "shadow-[0_0_12px_rgba(16,185,129,0.45)]" : "shadow-[0_0_12px_rgba(249,115,22,0.45)]";

                                    return (
                                        <button 
                                            key={cat} 
          
                                            onClick={() => setEntryCategory(cat)} 
                                            className={`px-4 py-2 shrink-0 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${isSelected ? `text-white border-transparent ${tabShadowClass}` : isDarkMode ? "bg-slate-800 
                                            border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`} 
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
 
                         <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                         "text-slate-400" : "text-slate-500"}`}>Category Selector</label>
                        <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ?
                        "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                           <span className="text-xs font-bold uppercase tracking-wider text-left truncate">{entryCategory ||
                           "TAP TO CHOOSE CATEGORY..."}</span>
                           <ArrowDown size={14} className={isDarkMode ?
                           "text-slate-400" : "text-slate-500"} />
                        </div>
                     </div>
                     {drawerTab === "bills" && (
                        <>
   
                          <div className="relative">
                              <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Due Date</label>
                              <div 
                              className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                                 <span className={`font-bold text-base ${!entryDate ? "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{entryDate ? formatDisplayDate(entryDate) : "mm/dd/yyyy"}</span>
                                 <CalendarIcon size={18} 
                                 className="shrink-0" style={{ color: signatureColor }} />
                                 <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              </div>
                    
                           </div>
                           <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                             <div className="flex items-center justify-between">
                             
                               <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Recurring Bill</span>
                               <button onClick={() => { triggerHaptic(20);
                               setEntryIsRecurring(!entryIsRecurring); }} className="w-12 h-6 rounded-full transition-colors relative bg-slate-300 dark:bg-slate-700" style={{ backgroundColor: entryIsRecurring ?
                               signatureColor : undefined }}>
                                   <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${entryIsRecurring ?
                                   "translate-x-7" : "translate-x-1"}`}></div>
                               </button>
                             </div>
                             <div className="flex items-center justify-between">
      
                               <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Installment Plan</span>
                               <button onClick={() => { triggerHaptic(20);
                               setEntryIsInstallment(!entryIsInstallment); }} className="w-12 h-6 rounded-full transition-colors relative bg-slate-300 dark:bg-slate-700" style={{ backgroundColor: entryIsInstallment ?
                               signatureColor : undefined }}>
                                   <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${entryIsInstallment ?
                                   "translate-x-7" : "translate-x-1"}`}></div>
                               </button>
                             </div>
                             {entryIsInstallment && (
       
                                 <div className="grid grid-cols-2 gap-3 animate-fade-in mt-1">
                                   <div className="relative">
                                  
                                      <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase 
                                      tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Total Amount</label>
                                      <div className="relative w-full flex items-center">
                                        
                                         <span className={`absolute left-4 top-[18px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
          
                                        <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={entryTotalAmount} onChange={(e) => setEntryTotalAmount(e.target.value)} onBlur={() => { if(!isNaN(parseFloat(entryTotalAmount)) && entryTotalAmount !== "") setEntryTotalAmount(parseFloat(entryTotalAmount).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-7 pr-4 rounded-2xl border transition-colors ${isDarkMode ?
                                        "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                                      </div>
                                   </div>
                           
                                   <div className="relative">
                                      <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ?
                                      "text-slate-400" : "text-slate-500"}`}>Already Paid</label>
                                      <div className="relative w-full flex items-center">
                                         <span className={`absolute left-4 top-[18px] font-bold text-base ${isDarkMode ?
                                         "text-white" : "text-slate-900"}`}>$</span>
                                         <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={entryPaidAmount} onChange={(e) => setEntryPaidAmount(e.target.value)} onBlur={() => { if(!isNaN(parseFloat(entryPaidAmount)) && entryPaidAmount !== "") setEntryPaidAmount(parseFloat(entryPaidAmount).toFixed(2)) }} className={`w-full pt-6 pb-2 pl-7 pr-4 rounded-2xl border transition-colors ${isDarkMode ?
                                         "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
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
                   
                             <option value="" disabled>{drawerTab === "income" ?
                             "Place this deposit into which account?" : "WHICH ACCOUNT PAID FOR THIS ACTIVITY?"}</option>
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
                           <button onClick={() => { triggerHaptic(15);
                           setEntryVisibility("Private"); }} className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${entryVisibility === "Private" ?
                           "bg-red-500 text-white shadow-sm" : "text-slate-400"}`}>Private</button>
                           <button onClick={() => { triggerHaptic(15);
                           setEntryVisibility("Shared"); }} className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${entryVisibility === "Shared" ?
                           "text-white shadow-sm" : "text-slate-400"}`} style={{ backgroundColor: entryVisibility === "Shared" ?
                           signatureColor : undefined }}>Shared</button>
                         </div>
                       </div>
                     )}

                     <button onClick={handleConfirmAction} disabled={!canSubmitQab} className={`w-full mt-3 h-14 shrink-0 
                     rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${!canSubmitQab ?
                     "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60 shadow-none" : `active:scale-95 ${drawerTab === "bills" ?
                     "" : qabActiveBg} ${qabActiveShadow} hover:-translate-y-0.5`}`} style={{ backgroundColor: (canSubmitQab && drawerTab === "bills") ?
                     signatureColor : undefined }}>Confirm & Save <CheckCircle2 size={18} /></button>
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
                           <button onClick={() => { setIsCategorySelectorOpen(false);
                           setCategorySearchQuery(""); setCustomCategoryInput(""); }} className={closeButtonClass}><X size={18}/></button>
                        </div>
                        
                        <div className={`p-4 border-b shrink-0 ${isDarkMode ?
                        "bg-slate-900/30 border-slate-700" : "bg-slate-50/50 border-slate-100"}`}>
                          <div className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-colors ${isDarkMode ?
                          "bg-[#0F172A] border-slate-700 focus-within:border-slate-500" : "bg-white border-slate-200 focus-within:border-slate-400"}`}>
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

                        <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 ${isDemoMode ?
                        "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                           {filteredCategories.length === 0 ?
                           (
                             <div className="text-center py-10">
                               <AlertCircle size={24} className="mx-auto text-slate-500 mb-2" />
                               <p className="text-xs 
                               font-black text-slate-400 uppercase tracking-widest">No matching results found</p>
                             </div>
                           ) : (
                             filteredCategories.map(group => (
     
                                <div key={group.group} className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                                 {/* UPDATE 4 INJECTED: Domain Pop-Up Elimination (Inline Category Creator) */}
                   
                                  <div className="flex justify-between items-center mb-3 pb-1 border-b border-dashed dark:border-slate-800 border-slate-100">
                                   <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{group.group}</p>
                                   {customCategoryInput.startsWith(`[ADD]${group.group}:`) ?
                                   (
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
                                      <button key={item} onClick={() => { triggerHaptic(20);
                                      setEntryCategory(item); setIsCategorySelectorOpen(false); setCategorySearchQuery(""); }} className={`w-full p-3.5 text-left rounded-xl text-xs font-black uppercase tracking-wide border transition-all active:scale-[0.99] flex items-center justify-between ${entryCategory === item ?
                                      'text-white border-transparent shadow-sm' : isDarkMode ? "bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700/80" : "bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100/80"}`} style={{ backgroundColor: (entryCategory === item && drawerTab === "bills") ?
                                      signatureColor : undefined }}>
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

               {isIconSelectorOpen && !isEditingEntry && (
                  <div className={`absolute inset-0 z-[150] flex flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
                     <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                    
                       <h3 className={`font-black uppercase text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Icon</h3><button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button>
                     </div>
                     <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                        <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">
 
                           {categoryEmojis.map(emoji => (
                            <button key={emoji} onClick={() => { triggerHaptic(15);
                            setEntryIcon(emoji); setIsIconSelectorOpen(false); }} className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 ${entryIcon === emoji ?
                            'border-transparent shadow-md text-white' : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`} style={{ backgroundColor: (entryIcon === emoji && drawerTab === "bills") ?
                            signatureColor : undefined }}>{emoji}</button>
                          ))}
                        </div>
                     </div>
                  </div>
        
                )}
            </div>
          </div>
        )}

        {globalActionConfig.isOpen && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? "bg-[#1E293B] border border-slate-700" : "bg-white"}`}>
        
               <h3 className={`text-xl font-black mb-2 flex items-center gap-2 ${globalActionConfig.isDanger ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                   {globalActionConfig.isDanger ? <AlertCircle size={20} /> : <CheckCircle2 size={20} style={{ color: signatureColor }} />} {globalActionConfig.title}
                </h3>
                <p className={`text-sm mb-6 font-bold ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>{globalActionConfig.message}</p>
     
                 <div className="flex gap-3">
                   {!globalActionConfig.isAlertOnly && (
                       <button onClick={() => setGlobalActionConfig({ ...globalActionConfig, isOpen: false })} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ?
                       "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                         Cancel
                       </button>
                   )}
                   <button onClick={() => { if(globalActionConfig.action) { globalActionConfig.action();
                   } else { setGlobalActionConfig({ ...globalActionConfig, isOpen: false }); } }} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg ${globalActionConfig.isDanger ?
                   "bg-red-500 hover:bg-red-600 shadow-[0_8px_16px_rgba(239,68,68,0.3)]" : "hover:bg-blue-600 shadow-[0_8px_16px_rgba(24,119,242,0.3)]"}`} style={{ backgroundColor: globalActionConfig.isDanger ?
                   undefined : signatureColor }}>
                     {globalActionConfig.confirmText}
                   </button>
                </div>
             </div>
           </div>
        )}
       
  
        {/* UPDATE 4 INJECTED: Premium 3D Volumetric Confetti Engine */}
        {showConfetti && (
         <div className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden" style={{ perspective: '800px' }}>
            {[...Array(60)].map((_, i) => {
              const colors = [signatureColor, '#10B981', '#F97316'];
              const isStrip = Math.random() > 0.6;
 
              return (
                <div 
                  key={i} 
                  className="absolute animate-[explode3D_2.5s_cubic-bezier(0.25,1,0.5,1)_forwards]" 
                  style={{ 
           
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)], 
                    left: '50%', top: '50%', 
                    width: isStrip ?
                    '8px' : '12px',
                    height: isStrip ?
                    '24px' : '12px',
                    borderRadius: Math.random() > 0.5 && !isStrip ?
                    '50%' : '2px',
                    transformStyle: 'preserve-3d',
                    '--tx': `${(Math.random() - 0.5) * 1000}px`, 
                    '--ty': `${(Math.random() - 0.3) * 1000 - 300}px`, 
                    '--tz': `${(Math.random() - 
                    0.5) * 500}px`,
                    '--rx': `${Math.random() * 1080}deg`,
                    '--ry': `${Math.random() * 1080}deg`,
                    '--rz': `${Math.random() * 1080}deg`,
                    '--scale': `${Math.random() * 0.8 + 0.5}`
    
                  }} 
                />
              )
            })}
            <style>{`@keyframes explode3D { 0% { transform: translate3d(-50%, -50%, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
            opacity: 1; } 100% { transform: translate3d(calc(-50% + var(--tx)), calc(-50% + var(--ty)), var(--tz)) rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz)) scale(var(--scale)); opacity: 0;
            } }`}</style>
          </div>
        )}
      </div>

      {isDemoMode && (
        <div className="fixed bottom-0 left-0 w-full h-[120px] lg:h-[80px] text-white p-4 flex flex-col lg:flex-row justify-center lg:justify-between items-center z-[150] shadow-[0_-10px_40px_rgba(24,119,242,0.3)] gap-3 lg:gap-0" style={{ backgroundColor: signatureColor }}>
          <div className="flex flex-col text-center lg:text-left w-full lg:w-auto">
            <span className="font-black text-sm lg:text-lg tracking-tight uppercase flex items-center justify-center 
            lg:justify-start gap-2">
             <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>
              STOP GUESSING. START PLANNING.
            </span>
            <span className="text-[10px] lg:text-xs font-bold text-blue-200 mt-0.5">Demo Mode Active.
            Changes will not be saved.</span>
          </div>
          <button onClick={() => window.location.href = "https://ledgerplanner.com"} className="bg-white px-6 py-2.5 rounded-xl font-black text-xs lg:text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg border-2 border-transparent hover:border-white hover:bg-transparent hover:text-white w-full lg:w-auto" style={{ color: signatureColor }}>
            Start your FREE 14 day trial today!
          </button>
        </div>
      )}
    </div>
  );
}
