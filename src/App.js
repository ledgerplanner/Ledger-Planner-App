import React, { useState, useEffect, useRef } from "react";
import {
  Home, Wallet, Calendar as CalendarIcon, CreditCard, CheckSquare,
  Bell, Moon, Sun, Plus, Settings as SettingsIcon, LogOut, CheckCircle2, AlertCircle, X
} from "lucide-react";

// === FIREBASE INITIALIZATION ===
import { auth, db } from "./firebase";
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, updateProfile 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc, collection, addDoc } from "firebase/firestore";

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

function LedgerApp() {
  // 1. INITIATE THE BACKGROUND DATA PUMP
  useLedgerData();

  // 2. PULL MASTER STATES FROM THE CLOUD (Added setBills for Dashboard interactions)
  const { 
    user, setUser, isDemoMode, setIsDemoMode, 
    accounts, bills, setBills, transactions, todos, paydayConfig,
    isDarkMode, setIsDarkMode, signatureColor, currentCurrency
  } = useLedger();

  // === LOCAL UI & ROUTING STATE ===
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  
  const [manualThemeOverride, setManualThemeOverride] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

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
  
  // RESTORED DASHBOARD STATES
  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  const [collapsedPaydays, setCollapsedPaydays] = useState({});

  // Cross-Component Transfer Buffers
  const [cashOutGoal, setCashOutGoal] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [paymentModalConfig, setPaymentModalConfig] = useState({ isOpen: false, billId: null, accountId: "", isPayInFull: false });
  
  // Briefing Engine Consumption Memory
  const [hasConsumedAMBriefing, setHasConsumedAMBriefing] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`lp_briefing_am_${new Date().toISOString().split('T')[0]}`) === "true";
    return false;
  });
  const [hasConsumedPMBriefing, setHasConsumedPMBriefing] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`lp_briefing_pm_${new Date().toISOString().split('T')[0]}`) === "true";
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

  const handleScroll = (e) => { setIsScrolled(e.target.scrollTop > 20); };

  const changeTab = (tabId) => {
    triggerHaptic(20);
    setActiveTab(tabId);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  // RESTORED DASHBOARD LOGIC FUNCTIONS
  const toggleCollapse = (payday) => {
    triggerHaptic(15);
    setCollapsedPaydays(prev => ({ ...prev, [payday]: !prev[payday] }));
  };

  const handleBillClick = async (billId) => {
    triggerHaptic(50);
    if (isDemoMode) {
      setBills(bills.map(b => b.id === billId ? { ...b, isPaid: true } : b));
    } else {
      try {
        await updateDoc(doc(db, "users", user.uid, "bills", billId), { isPaid: true });
      } catch (e) {
        console.error("Error paying bill:", e);
      }
    }
  };

  // === LIFECYCLE & AUTH HOOKS ===
  useEffect(() => {
    setIsMounted(true);
    const isDemo = window.location.hostname.includes("demo");
    if (isDemo) setIsDemoMode(true);
  }, [setIsDemoMode]);

  useEffect(() => {
    if (!isMounted || isDemoMode) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setTimeout(() => setIsAuthLoading(false), 1200);
    });
    return () => unsubscribeAuth();
  }, [isMounted, isDemoMode, setUser]);

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
      setAuthError("Authentication failed. Please try again."); 
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true); setAuthError("");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (error) { setAuthError("Google Sign-In failed."); setIsAuthLoading(false); }
  };

  const handleLogout = async () => {
    if (isDemoMode) { window.location.href = "https://ledgerplanner.com"; return; }
    try { await signOut(auth); }
    catch (error) { console.error("Logout forced locally:", error); }
    finally { setUser(null); setActiveTab("home"); }
  };

  // === DYNAMIC COMPUTATIONS ===
  const userName = isDemoMode ? "Aaron" : user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Founder";
  const getOrdinalNum = (n) => n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
  const heroDateTimeStr = `${currentTime.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}, ${currentTime.toLocaleDateString("en-US", { month: "long" }).toUpperCase()} ${getOrdinalNum(currentTime.getDate()).toUpperCase()}, ${currentTime.getFullYear()} — ${currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase()}`;

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

  const formatPaydayDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
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

  const renderHeroShell = (title, graphicContent) => {
    const hasOverdueOrDueNow = dynamicBills.some(b => !b.isPaid && (b.isOverdue || b.payday === "Due Now"));
    const hours = new Date().getHours();
    const isAM = hours >= 5 && hours < 12;
    const isUnconsumedBriefing = isAM ? !hasConsumedAMBriefing : !hasConsumedPMBriefing;

    return (
      <header className={`px-6 pt-12 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden mb-8 z-30 rounded-b-[3rem] ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
        <div className="flex justify-between items-center mb-6 relative z-30 h-10">
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsDarkMode(!isDarkMode); setManualThemeOverride(true); triggerHaptic(20); }} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#1877F2]" : "bg-white border-slate-100 text-slate-400 hover:text-[#1877F2]"}`}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsNotificationsOpen(true)} className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-400"}`} style={{ color: isSettingsOpen ? undefined : signatureColor }}>
              <Bell size={18} />
              {(hasOverdueOrDueNow || isUnconsumedBriefing) && (
                <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-[1.5px] animate-pulse ${hasOverdueOrDueNow ? "bg-red-500 border-red-500" : isUnconsumedBriefing ? "bg-[#1877F2] border-[#1877F2]" : "bg-red-500 border-red-500"} ${isDarkMode ? "border-t-transparent border-l-transparent" : "border-white"}`} style={{ backgroundColor: isUnconsumedBriefing && !hasOverdueOrDueNow ? signatureColor : undefined, borderColor: isUnconsumedBriefing && !hasOverdueOrDueNow ? signatureColor : undefined }}></span>
              )}
            </button>
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
            <button onClick={() => setIsQabOpen(true)} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-widest text-xs transition-transform active:scale-95 hover:-translate-y-1" style={{ backgroundColor: signatureColor }}><Plus size={18} /> Quick Add</button>
          </div>
        </div>

        {/* PRIMARY VIEWPORT ROUTER */}
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          <div className={`flex-1 overflow-y-auto hide-scrollbar lg:pb-0 ${isDemoMode ? "pb-[220px]" : "pb-28"}`} ref={scrollRef} onScroll={handleScroll}>
            {activeTab === "home" && (
              <Dashboard 
                userName={userName} 
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
                setIsPaydaySetupOpen={setIsPaydaySetupOpen}
                collapsedPaydays={collapsedPaydays}
                toggleCollapse={toggleCollapse}
                handleBillClick={handleBillClick}
                setSelectedEntry={setSelectedEntry}
                hasConsumedAMBriefing={hasConsumedAMBriefing}
                setHasConsumedAMBriefing={setHasConsumedAMBriefing}
                hasConsumedPMBriefing={hasConsumedPMBriefing}
                setHasConsumedPMBriefing={setHasConsumedPMBriefing}
              />
            )}
            {activeTab === "accounts" && <Accounts userName={userName} accounts={accounts} transactions={transactions} isDarkMode={isDarkMode} setIsTransferOpen={setIsTransferOpen} setIsAddAccountOpen={setIsAddAccountOpen} setIsAddGoalOpen={setIsAddGoalOpen} renderHeroShell={renderHeroShell} triggerCelebration={triggerVictory} setIsCashOutOpen={setIsCashOutOpen} setCashOutGoal={setCashOutGoal} signatureColor={signatureColor} />}
            {activeTab === "bills" && <Bills userName={userName} bills={dynamicBills} isDarkMode={isDarkMode} renderHeroShell={renderHeroShell} accounts={accounts} signatureColor={signatureColor} />}
            {activeTab === "activity" && <Activity userName={userName} transactions={transactions} isDarkMode={isDarkMode} setSelectedEntry={setSelectedEntry} renderHeroShell={renderHeroShell} signatureColor={signatureColor} />}
            {activeTab === "todo" && <Todo userName={userName} todos={todos} isDarkMode={isDarkMode} renderHeroShell={renderHeroShell} signatureColor={signatureColor} triggerVictory={triggerVictory} />}
          </div>

          <div className={`fixed lg:hidden ${isDemoMode ? "bottom-[200px]" : "bottom-28"} right-6 z-50`}>
            <button onClick={() => { triggerHaptic(20); setIsQabOpen(true); }} className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 ${isDarkMode ? "border-[#0F172A]" : "border-white"}`} style={{ backgroundColor: signatureColor }}><Plus size={28} /></button>
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

        {/* === THE MODAL INJECTIONS === */}
        {isQabOpen && <QuickAddModal onClose={() => setIsQabOpen(false)} triggerHaptic={triggerHaptic} triggerVictory={triggerVictory} />}
        {isNotificationsOpen && <CommandCenter setIsNotificationsOpen={setIsNotificationsOpen} needsRefresh={needsRefresh} dynamicBills={dynamicBills} changeTab={changeTab} userName={userName} hasConsumedAMBriefing={hasConsumedAMBriefing} setHasConsumedAMBriefing={setHasConsumedAMBriefing} hasConsumedPMBriefing={hasConsumedPMBriefing} setHasConsumedPMBriefing={setHasConsumedPMBriefing} formatPaydayDateStr={formatPaydayDateStr} />}
        <TransferEngine isTransferOpen={isTransferOpen} setIsTransferOpen={setIsTransferOpen} isCashOutOpen={isCashOutOpen} setIsCashOutOpen={setIsCashOutOpen} cashOutGoal={cashOutGoal} setCashOutGoal={setCashOutGoal} triggerHaptic={triggerHaptic} triggerVictory={triggerVictory} />
        <AccountBuilder isAddAccountOpen={isAddAccountOpen} setIsAddAccountOpen={setIsAddAccountOpen} isAddGoalOpen={isAddGoalOpen} setIsAddGoalOpen={setIsAddGoalOpen} triggerHaptic={triggerHaptic} triggerVictory={triggerVictory} />

        {/* SETTINGS AND GLOBAL ACTIONS */}
        {isSettingsOpen && <Settings setIsSettingsOpen={setIsSettingsOpen} />}

        {showConfetti && (
         <div className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden" style={{ perspective: '800px' }}>
            {[...Array(132)].map((_, i) => {
              const colors = [signatureColor, '#10B981', '#F97316'];
              const isStrip = Math.random() > 0.6;
              return (
                <div 
                  key={i} 
                  className="absolute animate-[explode3D_5.2s_cubic-bezier(0.1,1,0.1,1)_forwards]" 
                  style={{ 
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)], 
                    left: '50%', top: '50%', 
                    width: isStrip ? '8px' : '12px', height: isStrip ? '24px' : '12px',
                    borderRadius: Math.random() > 0.5 && !isStrip ? '50%' : '2px',
                    transformStyle: 'preserve-3d',
                    '--tx': `${(Math.random() - 0.5) * 1020}px`, 
                    '--ty': `${(Math.random() - 0.3) * 1020 - 400}px`, 
                    '--tz': `${(Math.random() - 0.5) * 600}px`,
                    '--rx': `${Math.random() * 1080}deg`, '--ry': `${Math.random() * 1080}deg`, '--rz': `${Math.random() * 1080}deg`,
                    '--scale': `${Math.random() * 0.8 + 0.5}`
                  }} 
                />
              )
            })}
            <style>{`@keyframes explode3D { 0% { transform: translate3d(-50%, -50%, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1); opacity: 1; } 100% { transform: translate3d(calc(-50% + var(--tx)), calc(-50% + var(--ty)), var(--tz)) rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz)) scale(var(--scale)); opacity: 0; } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. THE GLOBAL WRAPPER: Injects the Context Provider over the App
export default function AppWrapper() {
  return (
    <LedgerProvider>
      <LedgerApp />
    </LedgerProvider>
  );
}
