import React, { useMemo, useState } from 'react';
import { X, Bell, AlertCircle, CheckCircle2, TrendingUp, Sparkles, BellRing, Calendar } from 'lucide-react';
import { useLedger } from '../../context/LedgerContext';
import { useBriefingEngine } from '../../hooks/useBriefingEngine';

export default function CommandCenter({
  setIsNotificationsOpen,
  needsRefresh,
  dynamicBills = [],
  changeTab,
  handleOpenPaydaySetup,
  userName,
  formatPaydayDateStr,
  isPushEnabled,
  enablePushNotifications,
  handleDismissAIBriefing,
  hasConsumedAMBriefing,
  hasConsumedPMBriefing,
  isDemoMode
}) {
  const { user, isDarkMode, signatureColor, currencySymbol = "$" } = useLedger();

  const [isAiBannerDismissed, setIsAiBannerDismissed] = useState(false);

  const { activeAlerts = [], briefingData, hasUnreadBriefing } = useBriefingEngine({
    needsRefresh,
    dynamicBills,
    changeTab,
    setIsNotificationsOpen,
    handleOpenPaydaySetup,
    userName,
    formatPaydayDateStr,
    hasConsumedAMBriefing,
    hasConsumedPMBriefing
  });

  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  const isBirthdayToday = useMemo(() => {
    let bdayStr = "07-02"; 
    if (user?.birthday) {
      bdayStr = user.birthday.length > 5 ? user.birthday.substring(5) : user.birthday;
    }
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return bdayStr === todayStr;
  }, [user]);

  // LIVE BILL REMINDER DETECTION ENGINE
  const reminderAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMillis = today.getTime();

    return dynamicBills.filter(bill => {
      if (bill.isPaid || !bill.rawDate) return false;
      
      const hasReminderSet = bill.hasReminder !== false;
      const reminderDays = bill.reminderDays !== undefined ? Number(bill.reminderDays) : 2;
      
      const parts = bill.rawDate.split("-");
      if (parts.length !== 3) return false;
      const billDate = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
      billDate.setHours(0, 0, 0, 0);
      const billMillis = billDate.getTime();

      const diffDays = Math.round((billMillis - todayMillis) / (1000 * 60 * 60 * 24));
      
      return hasReminderSet && diffDays >= 0 && diffDays <= reminderDays;
    }).map(bill => {
      const parts = bill.rawDate.split("-");
      const billDate = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
      billDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((billDate.getTime() - todayMillis) / (1000 * 60 * 60 * 24));
      
      let timingText = "Due Today";
      if (diffDays === 1) timingText = "Due Tomorrow";
      else if (diffDays > 1) timingText = `Due in ${diffDays} Days`;

      return {
        id: `reminder_${bill.id}`,
        title: `Upcoming: ${bill.name}`,
        message: `${currencySymbol}${(Number(bill.amount) || 0).toFixed(2)} due on ${bill.fullDate || bill.rawDate}.`,
        time: timingText,
        icon: <BellRing size={16} className="text-amber-500" />,
        action: () => {
          setIsNotificationsOpen(false);
          if (changeTab) changeTab('bills');
        }
      };
    });
  }, [dynamicBills, currencySymbol, setIsNotificationsOpen, changeTab]);

  const onDismissAI = () => {
    setIsAiBannerDismissed(true);
    if (typeof handleDismissAIBriefing === 'function') {
       handleDismissAIBriefing();
    }
  };

  const aiData = briefingData?.data;
  const isLoadingAI = briefingData?.isLoading;
  const isAM = briefingData?.isAM;

  const allAlerts = [...reminderAlerts, ...activeAlerts];

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
      <div className={`w-full sm:max-w-sm h-full shadow-2xl relative z-[130] flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A] border-l border-slate-800" : "bg-white border-l border-slate-100"}`}>
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center p-0.5 border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
              <img src="/login-logo.png" alt="Ledger Planner" className="w-full h-full object-cover rounded-full" />
            </div>
            <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Command Center</h3>
          </div>
          <button onClick={() => setIsNotificationsOpen(false)} className={closeButtonClass}><X size={18} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4 flex-1 hide-scrollbar">
          
          {isBirthdayToday && (
            <div className="p-4 rounded-2xl shadow-lg relative overflow-hidden bg-gradient-to-r from-blue-500 via-orange-500 to-emerald-500">
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

          {isLoadingAI && !isAiBannerDismissed && (
            <div className={`relative p-5 rounded-[2rem] border overflow-hidden shadow-2xl transition-all duration-300 animate-pulse ${
              isDarkMode 
                ? "bg-gradient-to-br from-slate-900 to-[#0A0F1C] border-[#D4AF37]/30 shadow-[0_8px_30px_rgba(212,175,55,0.08)]" 
                : "bg-gradient-to-br from-[#FFFAF0] to-white border-[#D4AF37]/40 shadow-[0_8px_30px_rgba(212,175,55,0.15)]"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="font-black uppercase tracking-widest text-[11px] text-[#D4AF37]">
                  {isAM ? "🤖 GENERATING AI MORNING BRIEFING..." : "🤖 COMPILING AI EVENING RECAP..."}
                </h4>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-3/4 bg-slate-500/20 rounded"></div>
                <div className="h-2 w-full bg-slate-500/10 rounded"></div>
                <div className="h-2 w-5/6 bg-slate-500/10 rounded"></div>
              </div>
            </div>
          )}

          {!isLoadingAI && aiData && !isAiBannerDismissed && (
            <div className={`relative p-5 rounded-[2rem] border overflow-hidden shadow-2xl transition-all duration-300 ${
              isDarkMode 
                ? "bg-gradient-to-br from-slate-900 to-[#0A0F1C] border-[#D4AF37]/30 shadow-[0_8px_30px_rgba(212,175,55,0.08)]" 
                : "bg-gradient-to-br from-[#FFFAF0] to-white border-[#D4AF37]/40 shadow-[0_8px_30px_rgba(212,175,55,0.15)]"
            }`}>
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#D4AF37]/20 blur-3xl rounded-full pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <h4 className="font-black uppercase tracking-widest text-[11px] text-[#D4AF37]">
                    {isAM ? "🤖 AI MORNING BRIEFING" : "🤖 AI EVENING RECAP"}
                  </h4>
                </div>
                <button 
                  onClick={onDismissAI}
                  className={`p-1 rounded-full transition-colors ${
                    isDarkMode 
                      ? "text-slate-400 hover:text-white hover:bg-slate-800" 
                      : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <X size={13} strokeWidth={3} />
                </button>
              </div>
              
              <div className="relative z-10 space-y-2.5">
                <h4 className={`text-sm font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {aiData.title}
                </h4>
                <p className={`text-[11px] font-bold leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {aiData.body}
                </p>
              </div>
            </div>
          )}

          {allAlerts.length === 0 && !isBirthdayToday && (!aiData || isAiBannerDismissed) ? (
            <div className="text-center py-20 opacity-100 flex flex-col items-center justify-center h-full">
              <div className="p-4 rounded-full bg-emerald-50 mb-4 dark:bg-emerald-900/20">
                <CheckCircle2 size={36} className="text-[#10B981] drop-shadow-sm" />
              </div>
              <p className={`font-black text-xs uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>No Action Items</p>
              <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Your ledger is perfectly balanced</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allAlerts.map(alert => (
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
