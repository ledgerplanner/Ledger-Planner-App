import React from 'react';
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
  hasConsumedAMBriefing,
  setHasConsumedAMBriefing,
  hasConsumedPMBriefing,
  setHasConsumedPMBriefing,
  formatPaydayDateStr,
  isPushEnabled,
  enablePushNotifications
}) {
  // 1. PULL GLOBAL STATE FROM THE CLOUD
  const { isDarkMode, signatureColor, isDemoMode } = useLedger();

  // 2. INITIALIZE THE BRIEFING ENGINE
  const { activeAlerts, briefingData } = useBriefingEngine({
    needsRefresh,
    dynamicBills,
    changeTab,
    setIsNotificationsOpen,
    handleOpenPaydaySetup,
    userName,
    hasConsumedAMBriefing,
    hasConsumedPMBriefing,
    formatPaydayDateStr
  });

  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  const handleConsumeBriefing = () => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
    const todayKey = new Date().toISOString().split('T')[0];
    if (briefingData.isAM) {
      setHasConsumedAMBriefing(true);
      localStorage.setItem(`lp_briefing_am_${todayKey}`, "true");
    } else {
      setHasConsumedPMBriefing(true);
      localStorage.setItem(`lp_briefing_pm_${todayKey}`, "true");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
      <div className={`w-full sm:max-w-sm h-full shadow-2xl relative z-[130] flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A] border-l border-slate-800" : "bg-white border-l border-slate-100"}`}>
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Command Center</h3>
          <button onClick={() => setIsNotificationsOpen(false)} className={closeButtonClass}><X size={18} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4 flex-1 hide-scrollbar">
          {!isPushEnabled && !isDemoMode && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? "bg-[#10B981]/10 border-[#10B981]/20" : "bg-emerald-50 border-emerald-100"}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full text-white bg-[#10B981] shadow-[0_4px_10px_rgba(16,185,129,0.3)]"><Bell size={16} /></div>
                <div><p className={`text-sm font-black ${isDarkMode ? "text-[#10B981]" : "text-emerald-700"}`}>Enable Notifications</p><p className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-emerald-500/70" : "text-emerald-600/70"}`}>Never miss a payday</p></div>
              </div>
              <button onClick={enablePushNotifications} className="px-4 py-2 bg-[#10B981] text-white text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-transform shadow-md">Enable</button>
            </div>
          )}

          {briefingData.isUnconsumed && (
            <div className={`p-5 rounded-[1.8rem] border flex items-start gap-4 shadow-sm transition-all duration-500 ${isDarkMode ? "bg-slate-900/90 border-amber-500/20" : "bg-amber-50/80 border-amber-200/60"}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-500/10 text-xl">✨</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-amber-400" : "text-amber-800"}`}>{briefingData.isAM ? "Morning Strategy" : "Evening Analysis"}</p>
                  <button onClick={handleConsumeBriefing} className="text-slate-400 hover:text-slate-600 p-0.5">×</button>
                </div>
                <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? "text-slate-300" : "text-amber-950"}`}>
                  {briefingData.text}
                </p>
              </div>
            </div>
          )}

          {activeAlerts.length === 0 && !briefingData.isUnconsumed ? (
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
