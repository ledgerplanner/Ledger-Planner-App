import React, { useState, useEffect, useRef } from "react";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import Accounts from "./pages/Accounts";
import Bills from "./pages/Bills";
import Settings from "./pages/Settings";
import NavBar from "./components/NavBar";
import QuickAddMenu from "./components/QuickAddMenu";
import EntryForm from "./components/EntryForm";
import NotificationsPanel from "./components/NotificationsPanel";
import PaydaySetupOverlay from "./components/PaydaySetupOverlay";
import HapticFeedback from "./components/HapticFeedback";
import { generateAlerts } from "./utils/alertEngine";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPaydaySetupOpen, setIsPaydaySetupOpen] = useState(false);
  
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryType, setEntryType] = useState("Expense");
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // === NEW: Session Tracker for Rollover Alert ===
  const sessionMonth = useRef(new Date().getMonth());
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const [hasConsumedAMBriefing, setHasConsumedAMBriefing] = useState(false);
  const [hasConsumedPMBriefing, setHasConsumedPMBriefing] = useState(false);

  // === NEW: Custom Logout State ===
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // === MOCK DATA FOR DEMONSTRATION ===
  const [accounts, setAccounts] = useState([
    { id: "1", name: "Main Checking", type: "Checking", balance: 2450.00, icon: "🏦" },
    { id: "2", name: "Emergency Fund", type: "Savings", balance: 10000.00, icon: "🛡️" }
  ]);

  const [bills, setBills] = useState([
    { id: "1", name: "Rent", amount: 1200, rawDate: "2026-05-01", fullDate: "May 1st", isPaid: false, isOverdue: false, icon: "🏠", payday: "Due Now" },
    { id: "2", name: "Car Insurance", amount: 150, rawDate: "2026-05-15", fullDate: "May 15th", isPaid: false, isOverdue: false, icon: "🚗", payday: "Payday 2" }
  ]);

  const [transactions, setTransactions] = useState([
    { id: "1", name: "Grocery Store", amount: 85.50, type: "Expense", category: "Food", date: "May 1, 2026", rawDate: "2026-05-01", icon: "🛒" }
  ]);

  const [paydayConfig, setPaydayConfig] = useState({
    frequency: "Bi-Weekly",
    "Payday 1": { date: "2026-05-01", income: 2000 },
    "Payday 2": { date: "2026-05-15", income: 2000 },
    "Payday 3": { date: "", income: 0 },
    "Payday 4": { date: "", income: 0 },
    "Payday 5": { date: "", income: 0 }
  });

  // === CORE ENGINE CLOCK & REFRESH TRACKER ===
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const currentHour = now.getHours();
      setIsDarkMode(currentHour >= 22 || currentHour < 5);

      // Check if the actual month has drifted past the session month
      if (now.getMonth() !== sessionMonth.current) {
         setNeedsRefresh(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const alerts = generateAlerts(bills, accounts, paydayConfig, needsRefresh);

  const formatPaydayDateStr = (dateString) => {
    if (!dateString) return "Unscheduled";
    const d = new Date(dateString + "T00:00:00");
    if (isNaN(d)) return dateString;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleBillClick = (id) => {
    setBills(bills.map(b => b.id === id ? { ...b, isPaid: true } : b));
    HapticFeedback();
  };

  const handleSaveEntry = (entry) => {
    // Mock save logic
    if (entry.id) {
       // Update existing
    } else {
       // Add new
    }
    setSelectedEntry(null);
    setIsQuickAddOpen(false);
  };

  const renderHeroShell = (title, graphicContent) => (
    <div className={`relative pt-12 pb-10 px-6 rounded-b-[2.5rem] shadow-xl overflow-hidden ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
      <div className="absolute top-0 right-0 p-8 opacity-10">
         <Circle size={150} className={isDarkMode ? "text-slate-500" : "text-slate-300"} />
      </div>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <h1 className={`text-3xl font-black tracking-tighter w-2/3 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsNotificationsOpen(true)} className="relative p-2 rounded-full active:scale-95 transition-transform bg-transparent">
            <AlertCircle size={24} className={isDarkMode ? "text-slate-300" : "text-slate-600"} strokeWidth={2.5} />
            {alerts.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1E293B]"></span>}
          </button>
        </div>
      </div>
      {graphicContent}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent opacity-50"></div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A] text-slate-200" : "bg-[#F8FAFC] text-slate-800"}`}>
      
      {activeTab === "dashboard" && <Dashboard userName="King" accounts={accounts} bills={bills} transactions={transactions} paydayConfig={paydayConfig} setIsPaydaySetupOpen={setIsPaydaySetupOpen} setIsNotificationsOpen={setIsNotificationsOpen} handleBillClick={handleBillClick} setSelectedEntry={setSelectedEntry} isDarkMode={isDarkMode} formatPaydayDateStr={formatPaydayDateStr} renderHeroShell={renderHeroShell} changeTab={setActiveTab} hasConsumedAMBriefing={hasConsumedAMBriefing} setHasConsumedAMBriefing={setHasConsumedAMBriefing} hasConsumedPMBriefing={hasConsumedPMBriefing} setHasConsumedPMBriefing={setHasConsumedPMBriefing} />}
      {activeTab === "activity" && <Activity transactions={transactions} isDarkMode={isDarkMode} renderHeroShell={renderHeroShell} setSelectedEntry={setSelectedEntry} />}
      {activeTab === "accounts" && <Accounts userName="King" accounts={accounts} transactions={transactions} isDarkMode={isDarkMode} renderHeroShell={renderHeroShell} setSelectedAccount={setSelectedEntry} />}
      {activeTab === "bills" && <Bills userName="King" bills={bills} paydayConfig={paydayConfig} isDarkMode={isDarkMode} renderHeroShell={renderHeroShell} handleBillClick={handleBillClick} setSelectedEntry={setSelectedEntry} />}
      
      {/* TRIGGERING THE CUSTOM LOGOUT MODAL INSTEAD OF NATIVE ALERT */}
      {activeTab === "settings" && <Settings isDarkMode={isDarkMode} renderHeroShell={renderHeroShell} onLogout={() => setIsLogoutModalOpen(true)} />}

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} setIsQuickAddOpen={setIsQuickAddOpen} isDarkMode={isDarkMode} />
      
      {isQuickAddOpen && <QuickAddMenu onClose={() => setIsQuickAddOpen(false)} onSelectType={(type) => { setEntryType(type); setSelectedEntry({}); }} isDarkMode={isDarkMode} />}
      
      {selectedEntry && (
        <EntryForm 
          entry={selectedEntry} 
          type={selectedEntry.type || entryType} 
          onClose={() => setSelectedEntry(null)} 
          onSave={handleSaveEntry} 
          onDelete={() => setSelectedEntry(null)} 
          accounts={accounts} 
          isDarkMode={isDarkMode} 
        />
      )}

      {isNotificationsOpen && <NotificationsPanel alerts={alerts} onClose={() => setIsNotificationsOpen(false)} isDarkMode={isDarkMode} />}
      {isPaydaySetupOpen && <PaydaySetupOverlay config={paydayConfig} onClose={() => setIsPaydaySetupOpen(false)} onSave={setPaydayConfig} isDarkMode={isDarkMode} />}

      {/* === THE CUSTOM LOGOUT MODAL === */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? "bg-[#1E293B] border border-slate-700" : "bg-white"}`}>
              <h3 className={`text-xl font-black mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ledger Planner</h3>
              <p className={`text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Are you sure you want to log out of your session?</p>
              
              <div className="flex gap-3">
                 <button onClick={() => setIsLogoutModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    Cancel
                 </button>
                 <button onClick={() => { console.log("Logging out..."); setIsLogoutModalOpen(false); }} className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/30">
                    Log Out
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
