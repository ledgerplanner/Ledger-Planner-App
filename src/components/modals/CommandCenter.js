import React, { useMemo } from 'react';
import { X, Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLedger } from '../../context/LedgerContext';
import { useBriefingEngine } from '../../hooks/useBriefingEngine';

export default function CommandCenter({
  setIsNotificationsOpen,
  needsRefresh,
  dynamicBills,
  changeTab,
  handleOpenPaydaySetup,
  userName,
  // === SURGICAL FIX: REMOVED BRIEFING PROPS (hasConsumedAMBriefing, etc.) ===
  formatPaydayDateStr,
  isPushEnabled,
  enablePushNotifications
}) {
  // 1. PULL GLOBAL STATE FROM THE CLOUD
  const { user, isDarkMode, signatureColor, isDemoMode } = useLedger();

  // 2. INITIALIZE THE NOTIFICATION ENGINE (BRIEFING DATA IGNORED/REMOVED)
  const { activeAlerts } = useBriefingEngine({
    needsRefresh,
    dynamicBills,
    changeTab,
    setIsNotificationsOpen,
    handleOpenPaydaySetup,
    userName,
    formatPaydayDateStr
  });

  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  // === SURGICAL FIX: INJECTED BIRTHDAY PINNED OVERRIDE ===
  const isBirthdayToday = useMemo(() => {
    // Default to July 2nd for testing/demo if no user data, otherwise use actual DB param
    let bdayStr = "07-02"; 
    if (user?.birthday) {
      bdayStr = user.birthday.length > 5 ? user.birthday.substring(5) : user.birthday;
    }
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return bdayStr === todayStr;
  }, [user]);

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
      <div className={`w-full sm:max-w-sm h-full shadow-2xl relative z-[130] flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A] border-l border-slate-800" : "bg-white border-l border-slate-100"}`}>
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Command Center</h3>
          <button onClick={() => setIsNotificationsOpen(false)} className={closeButtonClass}><X size={18} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4 flex-1 hide-scrollbar">
          
          {/* === PINNED BIRTHDAY BANNER INJECTION === */}
          {isBirthdayToday && (
            <div className="p-4 rounded-2xl shadow-lg relative overflow-hidden bg-gradient-to-r from-blue-500 via-orange-500 to-emerald-500">
              {/* Internal dark/light overlay to make text pop while keeping gradient vibrant */}
              <div className={`absolute inset-0.5 rounded-xl ${isDarkMode ? "bg-slate-900/90" : "bg-white/95"}`}></div>
              <div className="relative z-10 flex gap-3 items-center">
                <div className="p-2.5 text-2xl drop-shadow-sm self-start">🎂</div>
                <div className="flex-1 min-w-0 py-1">
                  <p className="font-black text-xs uppercase tracking-wide truncate bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-orange-500 to-emerald-500 drop-shadow-sm">
                    Happy Birthday, {userName}!
                  </p>
                  <p className={`text-[10px] font-bold leading-snug mt-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    We at Ledger Planner wish you many more!
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isPushEnabled && !isDemoMode && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? "bg-[#10B981]/10 border-[#10B981]/20" : "bg-emerald-50 border-emerald-100"}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full text-white bg-[#10B981] shadow-[0_4px_10px_rgba(16,185,129,0.3)]"><Bell size={16} /></div>
                <div><p className={`text-sm font-black ${isDarkMode ? "text-[#10B981]" : "text-emerald-700"}`}>Enable Notifications</p><p className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-emerald-500/70" : "text-emerald-600/70"}`}>Never miss a payday</p></div>
              </div>
              <button onClick={enablePushNotifications} className="px-4 py-2 bg-[#10B981] text-white text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-transform shadow-md">Enable</button>
            </div>
          )}

          {/* === SURGICAL FIX: BRIEFING UI BLOCK COMPLETELY REMOVED === */}

          {activeAlerts.length === 0 && !isBirthdayToday ? (
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
                <div key={alert.id} onClick={alert.action} className={`p-4 rounded-2xl border cursor-pointer transition-transform active:scale-[0.98] ${isDarkMode ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"}`}>
                   <div className="flex gap-3">
                     <div className={`p-2.5 rounded-xl self-start ${isDarkMode ? "bg-slate-900" : "bg-slate-50"}`}>
                       {alert.icon}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-start justify-between gap-2 mb-1">
                         <p className={`font-black text-xs uppercase tracking-wide truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>{alert.title}</p>
                         <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${alert.type === 'danger' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{alert.time}</span>
                       </div>
                       <p className={`text-[10px] font-bold leading-snug ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{alert.message}</p>
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
}
