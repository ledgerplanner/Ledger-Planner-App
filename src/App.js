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
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef(null);

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [collapsedPaydays, setCollapsedPaydays] = useState({
    "Payday 2": true, "Payday 3": true, "Payday 4": true, "Payday 5": true,
  });

  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  const [paydayConfig, setPaydayConfig] = useState({
    "Payday 1": { date: "", income: "" }, "Payday 2": { date: "", income: "" },
    "Payday 3": { date: "", income: "" }, "Payday 4": { date: "", income: "" },
    "Payday 5": { date: "", income: "" },
  });
  const [editPaydayConfig, setEditPaydayConfig] = useState(paydayConfig);
  const [paymentModalConfig, setPaymentModalConfig] = useState({ isOpen: false, billId: null, accountId: "" });

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabStep, setFabStep] = useState(1);
  const [drawerTab, setDrawerTab] = useState("bills");
  const [inputValue, setInputValue] = useState("0");
  const [entryName, setEntryName] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryIcon, setEntryIcon] = useState("🏠");
  const [entryAccount, setEntryAccount] = useState("");

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

  const [bills, setBills] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubAcc = onSnapshot(collection(userRef, "accounts"), (snap) => setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBills = onSnapshot(collection(userRef, "bills"), (snap) => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTxs = onSnapshot(query(collection(userRef, "transactions"), orderBy("createdAt", "desc")), (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTodos = onSnapshot(query(collection(userRef, "todos"), orderBy("createdAt", "desc")), (snap) => setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubConfig = onSnapshot(doc(userRef, "settings", "paydayConfig"), (docSnap) => { if (docSnap.exists()) { setPaydayConfig(docSnap.data()); setEditPaydayConfig(docSnap.data()); } });
    return () => { unsubAcc(); unsubBills(); unsubTxs(); unsubTodos(); unsubConfig(); };
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (isLoginMode) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { setAuthError("Google Sign-In failed."); setIsAuthLoading(false); }
  };

  const handleLogout = async () => { await signOut(auth); setActiveTab("home"); };

  const userName = user?.email?.split('@')[0] || "Founder";
  const totalIncomeBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const unpaidBillsAmount = bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  const aaronsBalance = totalIncomeBalance - unpaidBillsAmount;
  const isNegative = aaronsBalance < 0;

  const strokeDasharray = 251.2;
  const safePercentage = totalIncomeBalance > 0 ? Math.max(0, Math.min((aaronsBalance / totalIncomeBalance) * 100, 100)) : 0;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * safePercentage) / 100;

  const formatPaydayDateStr = (dateString) => {
    if (!dateString) return "TBD";
    const parts = dateString.split("-");
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return dateString;
  };

  const handleBillClick = async (id) => {
    const bill = bills.find(b => b.id === id);
    if (!bill.isPaid) setPaymentModalConfig({ isOpen: true, billId: id, accountId: accounts[0]?.id || "" });
    else {
      const targetAcc = accounts.find(a => a.id === bill.paidFromAccountId);
      await updateDoc(doc(db, "users", user.uid, "bills", id), { isPaid: false, paidFromAccountId: null, linkedTxId: null });
      if (targetAcc) await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance + bill.amount });
      if (bill.linkedTxId) await deleteDoc(doc(db, "users", user.uid, "transactions", bill.linkedTxId));
    }
  };

  const confirmPaymentRoute = async () => {
    const bill = bills.find(b => b.id === paymentModalConfig.billId);
    const targetAcc = accounts.find(a => a.id === paymentModalConfig.accountId);
    if (!bill || !targetAcc) return;
    const txRef = await addDoc(collection(db, "users", user.uid, "transactions"), { name: bill.name, icon: bill.icon, amount: bill.amount, date: currentTime.toLocaleString(), type: "Expense", category: "Bill", accountId: targetAcc.id, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "users", user.uid, "bills", bill.id), { isPaid: true, paidFromAccountId: targetAcc.id, linkedTxId: txRef.id });
    await updateDoc(doc(db, "users", user.uid, "accounts", targetAcc.id), { balance: targetAcc.balance - bill.amount });
    setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" });
  };

  const changeTab = (tabId) => { setActiveTab(tabId); window.scrollTo(0, 0); };

  const handleAddAccount = async () => {
    const bal = parseFloat(newAccBalance) || 0;
    await addDoc(collection(db, "users", user.uid, "accounts"), { name: newAccName, type: newAccType, balance: bal, icon: newAccType === "Credit Card" ? "💳" : "🏦" });
    setIsAddAccountOpen(false); setNewAccName(""); setNewAccBalance("");
  };

  const closeFab = () => { setIsFabOpen(false); setFabStep(1); setInputValue("0"); setEntryName(""); };

  const handleNumpad = (btn) => {
    if (btn === "=") { try { setInputValue(String(eval(inputValue.replace(/×/g, "*").replace(/÷/g, "/")))); } catch { setInputValue("0"); } }
    else if (inputValue === "0" && btn !== ".") setInputValue(btn);
    else setInputValue(inputValue + btn);
  };

  const handleConfirmAction = async () => {
    const amt = parseFloat(inputValue);
    if (drawerTab === "bills") {
      await addDoc(collection(db, "users", user.uid, "bills"), { name: entryName, icon: "📋", amount: amt, payday: "Payday 1", isPaid: false, fullDate: entryDate });
    } else {
      const acc = accounts.find(a => a.id === entryAccount) || accounts[0];
      await addDoc(collection(db, "users", user.uid, "transactions"), { name: entryName, amount: amt, type: drawerTab === "income" ? "Income" : "Expense", createdAt: serverTimestamp(), icon: "💳", date: currentTime.toLocaleDateString() });
      if (acc) await updateDoc(doc(db, "users", user.uid, "accounts", acc.id), { balance: drawerTab === "income" ? acc.balance + amt : acc.balance - amt });
    }
    closeFab();
  };

  const renderHeroShell = (title, graphicContent) => (
    <header className={`px-6 pt-12 pb-5 rounded-b-[3rem] shadow-sm relative overflow-hidden transition-colors duration-500 mb-8 ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
      <div className="flex justify-between items-center mb-8 relative z-10 h-10">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
        <div className="flex flex-col items-center"><span className="text-[11px] font-black text-[#1877F2] uppercase tracking-[0.2em]">Ledger Planner</span></div>
        <button onClick={() => setIsNotificationsOpen(true)} className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center"><Bell size={18} /></button>
      </div>
      <div className="flex justify-between items-end mb-6 relative z-10">
        <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h2>
        <button onClick={handleLogout} className="text-slate-400 p-2"><LogOut size={20} /></button>
      </div>
      {graphicContent}
    </header>
  );

  if (isAuthLoading) return <div className="h-screen bg-[#F8FAFC] flex justify-center items-center"><Loader2 className="animate-spin text-[#1877F2]" size={48} /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl p-8 flex flex-col items-center">
        <div className="w-24 h-24 bg-[#1877F2] rounded-full mb-6 flex items-center justify-center text-white font-black text-2xl">LP</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Ledger Planner</h1>
        <p className="text-sm font-bold text-slate-400 mb-8">Secure Entrance</p>
        <form onSubmit={handleAuthSubmit} className="w-full space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#1877F2]" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#1877F2]" />
          <button type="submit" className="w-full py-4 bg-[#1877F2] text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 uppercase tracking-widest">Unlock Vault</button>
          <button type="button" onClick={handleGoogleLogin} className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3">Continue with Google</button>
        </form>
      </div>
    </div>
  );

  const renderHome = () => {
    const billsByPayday = {};
    ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach(pd => billsByPayday[pd] = []);
    bills.forEach(bill => { if (billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });
    const dueNowTotal = billsByPayday["Due Now"]?.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0) || 0;

    return (
      <div className={`animate-fade-in pb-32 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`Hi, ${userName} 🚀`, (
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1877F2" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(safePercentage)}%</span></div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance</p>
              <p className={`text-4xl font-black tracking-tighter ${isNegative ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>${aaronsBalance.toFixed(2)}</p>
            </div>
          </div>
        ))}

        <main className="px-6 space-y-6">
          {/* DUE NOW SUMMARY BOX */}
          <div className={`p-6 rounded-[2rem] border transition-all ${dueNowTotal > 0 ? "bg-red-500 text-white shadow-xl shadow-red-500/20" : isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}>
             <div className="flex justify-between items-center">
                <div>
                   <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dueNowTotal > 0 ? "text-red-100" : "text-slate-400"}`}>Action Required</p>
                   <p className="text-2xl font-black tracking-tight">Due Now</p>
                </div>
                <p className="text-3xl font-black tracking-tighter">${dueNowTotal.toFixed(2)}</p>
             </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Payday Scroller</h3>
            <button onClick={() => setIsPaydaySetupOpen(true)} className="text-[10px] font-black uppercase text-[#1877F2]">Configure</button>
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-2 px-3">
            {["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].map(pd => {
              const settings = paydayConfig[pd];
              return (
                <div key={pd} className={`min-w-[150px] p-4 rounded-3xl border ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100 shadow-sm"}`}>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{pd}</p>
                  <p className="text-lg font-black text-emerald-500 tracking-tight">${parseFloat(settings?.income || 0).toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-slate-400">{formatPaydayDateStr(settings?.date)}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            {Object.entries(billsByPayday).map(([payday, groupBills]) => {
              if (groupBills.length === 0 && payday !== "Payday 1") return null;
              return (
                <div key={payday} className="space-y-2">
                  <div className="flex justify-between px-2" onClick={() => setCollapsedPaydays(prev => ({ ...prev, [payday]: !prev[payday] }))}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{payday}</h3>
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                  {!collapsedPaydays[payday] && (
                    <div className={`rounded-[2rem] p-2 border ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50 shadow-sm"}`}>
                      {groupBills.map(bill => (
                        <div key={bill.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                           <div className="flex items-center gap-4">
                              <button onClick={() => handleBillClick(bill.id)}>{bill.isPaid ? <CheckCircle2 className="text-[#1877F2]" /> : <Circle className="text-slate-200" />}</button>
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">{bill.icon}</div>
                              <div>
                                 <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{bill.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">{bill.fullDate}</p>
                              </div>
                           </div>
                           <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>${bill.amount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  };

  const renderAccounts = () => {
    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
    const data = [netWorth * 0.7, netWorth * 0.8, netWorth * 0.6, netWorth * 0.9, netWorth];
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 70}`).join(" ");

    return (
      <div className={`animate-fade-in pb-32 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell(`${userName}'s Net Worth`, (
          <div>
            <p className="text-5xl font-black tracking-tighter mb-4">${netWorth.toLocaleString()}</p>
            <div className="h-20 w-full mb-4">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline points={points} fill="none" stroke="#1877F2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ))}
        <main className="px-6 space-y-4">
           <button onClick={() => setIsAddAccountOpen(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-black text-xs uppercase tracking-widest">+ Add New Account</button>
           <div className={`rounded-[2rem] p-4 border ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
             {accounts.map(acc => (
               <div key={acc.id} className="flex justify-between items-center p-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">{acc.icon}</div>
                    <div><p className="font-bold text-sm">{acc.name}</p><p className="text-[10px] font-bold text-slate-400">{acc.type}</p></div>
                  </div>
                  <p className={`font-black ${acc.type === "Credit Card" ? "text-red-500" : ""}`}>${acc.balance.toFixed(2)}</p>
               </div>
             ))}
           </div>
        </main>
      </div>
    );
  };

  const renderActivity = () => {
    const data = [30, 70, 45, 90, 65, 85];
    return (
      <div className={`animate-fade-in pb-32 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {renderHeroShell("Cash Flow", (
           <div className="flex items-end justify-between h-24 gap-2 mb-4">
              {data.map((h, i) => (
                <div key={i} className="flex-1 bg-blue-100 dark:bg-slate-800 rounded-t-lg relative overflow-hidden">
                   <div className="absolute bottom-0 w-full bg-[#1877F2] transition-all duration-1000" style={{ height: `${h}%` }}></div>
                </div>
              ))}
           </div>
        ))}
        <main className="px-6">
           <div className={`rounded-[2rem] p-4 border ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}>
              {transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">{tx.icon}</div>
                      <div><p className="font-bold text-sm">{tx.name}</p><p className="text-[10px] font-bold text-slate-400">{tx.date}</p></div>
                   </div>
                   <p className={`font-black ${tx.type === "Income" ? "text-emerald-500" : ""}`}>{tx.type === "Income" ? "+" : "-"}${tx.amount.toFixed(2)}</p>
                </div>
              ))}
           </div>
        </main>
      </div>
    );
  };

  return (
    <div className={`h-screen flex justify-center font-sans ${isDarkMode ? "bg-[#0F172A] text-white" : "bg-[#F8FAFC] text-slate-900"}`}>
      <div className="w-full max-w-md h-full relative flex flex-col overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {activeTab === "home" && renderHome()}
          {activeTab === "accounts" && renderAccounts()}
          {activeTab === "bills" && <div className="p-12 text-center text-slate-400">Bills View (Under Setup)</div>}
          {activeTab === "activity" && renderActivity()}
          {activeTab === "todo" && <div className="p-12 text-center text-slate-400">Todo View (Under Setup)</div>}
        </div>

        {/* OVERLAYS */}
        {paymentModalConfig.isOpen && (
           <div className="absolute inset-0 z-50 flex items-end">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPaymentModalConfig({ isOpen: false, billId: null, accountId: "" })}></div>
              <div className={`w-full p-8 rounded-t-[3rem] animate-slide-up relative z-10 ${isDarkMode ? "bg-[#1E293B]" : "bg-white shadow-2xl"}`}>
                 <h2 className="text-xl font-black mb-6">Confirm Payment</h2>
                 <select className="w-full p-4 mb-6 rounded-2xl bg-slate-50 border border-slate-200" onChange={(e) => setPaymentModalConfig(prev => ({ ...prev, accountId: e.target.value }))}>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>)}
                 </select>
                 <button onClick={confirmPaymentRoute} className="w-full py-4 bg-[#1877F2] text-white rounded-2xl font-black">Confirm & Pay</button>
              </div>
           </div>
        )}

        {isPaydaySetupOpen && (
           <div className="absolute inset-0 z-50 flex items-end">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaydaySetupOpen(false)}></div>
              <div className={`w-full p-8 rounded-t-[3rem] animate-slide-up relative z-10 max-h-[80vh] overflow-y-auto ${isDarkMode ? "bg-[#1E293B]" : "bg-white shadow-2xl"}`}>
                 <h2 className="text-xl font-black mb-6">Payday Setup</h2>
                 {Object.keys(paydayConfig).map(pd => (
                   <div key={pd} className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <p className="text-[10px] font-black uppercase mb-2">{pd}</p>
                      <div className="flex gap-2">
                         <input type="date" value={editPaydayConfig[pd].date} onChange={(e) => setEditPaydayConfig({ ...editPaydayConfig, [pd]: { ...editPaydayConfig[pd], date: e.target.value } })} className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-700" />
                         <input type="number" value={editPaydayConfig[pd].income} onChange={(e) => setEditPaydayConfig({ ...editPaydayConfig, [pd]: { ...editPaydayConfig[pd], income: e.target.value } })} placeholder="Income" className="w-24 p-2 rounded-lg bg-white dark:bg-slate-700" />
                      </div>
                   </div>
                 ))}
                 <button onClick={async () => { await setDoc(doc(db, "users", user.uid, "settings", "paydayConfig"), editPaydayConfig); setIsPaydaySetupOpen(false); }} className="w-full py-4 bg-[#1877F2] text-white rounded-2xl font-black">Save Settings</button>
              </div>
           </div>
        )}

        {/* FAB & NAV */}
        <div className="absolute bottom-24 right-6 z-40">
          <button onClick={() => setIsFabOpen(true)} className="w-14 h-14 rounded-full bg-[#1877F2] text-white shadow-xl flex items-center justify-center"><Plus size={28} /></button>
        </div>

        {isFabOpen && (
           <div className="absolute inset-0 z-[60] flex items-end">
              <div className="absolute inset-0 bg-slate-900/40" onClick={closeFab}></div>
              <div className={`w-full p-8 rounded-t-[3rem] animate-slide-up relative z-10 ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
                 <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
                    {["bills", "income", "expense"].map(t => <button key={t} onClick={() => setDrawerTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase ${drawerTab === t ? "bg-white text-[#1877F2]" : "text-slate-400"}`}>{t}</button>)}
                 </div>
                 <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full text-center text-4xl font-black text-[#1877F2] mb-6 outline-none bg-transparent" />
                 <input type="text" placeholder="Entry Name" value={entryName} onChange={(e) => setEntryName(e.target.value)} className="w-full p-4 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800" />
                 <button onClick={handleConfirmAction} className="w-full py-4 bg-[#1877F2] text-white rounded-2xl font-black">Confirm Entry</button>
              </div>
           </div>
        )}

        <nav className={`h-24 border-t flex justify-around items-center px-4 transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "accounts", icon: Wallet, label: "Vault" },
            { id: "activity", icon: CreditCard, label: "Flow" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => changeTab(tab.id)} className={`flex flex-col items-center gap-1 ${activeTab === tab.id ? "text-[#1877F2]" : "text-slate-400"}`}>
              <tab.icon size={24} />
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
