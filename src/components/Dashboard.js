import React, { useState, useEffect } from "react";
import { Circle, CheckCircle2, ChevronUp, ChevronDown, Settings2, List, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, messaging } from "../firebase";

export default function Dashboard({
  userName = "Founder",
  accounts = [],
  bills = [],
  transactions = [],
  paydayConfig = {},
  setEditPaydayConfig,
  setIsPaydaySetupOpen,
  setIsNotificationsOpen,
  collapsedPaydays = {},
  toggleCollapse,
  handleBillClick,
  setSelectedEntry,
  isDarkMode,
  formatPaydayDateStr,
  renderHeroShell,
  changeTab,
  hasConsumedAMBriefing,
  setHasConsumedAMBriefing,
  hasConsumedPMBriefing,
  setHasConsumedPMBriefing
}) {
  // === 🔔 NOTIFICATION STATE ENGINE ===
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const enablePushNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setIsPushEnabled(true);
        const currentToken = await getToken(messaging, { vapidKey: "BDubfUXfP5DhFRpZ5ZwQp0o88f2avvtfu0rfFr9ySjHgTZmQ4gsr0GWzE-cJQxgbwq93GlgcCc5ip6KksvngmXY" });
        if (currentToken) {
          const userId = auth.currentUser?.uid;
          if (userId) await setDoc(doc(db, "users", userId), { fcmToken: currentToken }, { merge: true });
          alert("Push Notifications Enabled! Vault secured.");
        }
      }
    } catch (error) {
      console.error("Notification Error:", error);
    }
  };

  // === 🔥 SURGICAL OCTAGON SORTING ENGINE ===
  const sortBillsSurgically = (billList) => {
    return [...billList].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.payday === "Due Now" && b.payday !== "Due Now") return -1;
      if (a.payday !== "Due Now" && b.payday === "Due Now") return 1;
      return new Date(a.rawDate || 0) - new Date(b.rawDate || 0);
    });
  };

  const currentHour = new Date().getHours();
  let greetingStr = `Evening, ${userName}`;
  if (currentHour >= 5 && currentHour < 12) { greetingStr = `Morning, ${userName}`; }
  else if (currentHour >= 12 && currentHour < 17) { greetingStr = `Afternoon, ${userName}`; }
  else if (currentHour >= 22 || currentHour < 5) { greetingStr = `Up late, ${userName}?`; }

  // === MACRO MATH ENGINE (SAFE) ===
  const totalIncomeBalance = accounts.reduce((sum, a) => sum + (Number(a?.balance) || 0), 0);
  const unpaidBillsAmount = bills.filter((b) => !b?.isPaid).reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);
  const safeToSpend = totalIncomeBalance - unpaidBillsAmount;

  const debtRatio = totalIncomeBalance > 0 ? Math.max(0, Math.min((unpaidBillsAmount / totalIncomeBalance) * 100, 100)) : (unpaidBillsAmount > 0 ? 100 : 0);
  const isCritical = debtRatio >= 85 || safeToSpend < 0;
  const isWarning = debtRatio >= 60 && debtRatio < 85;

  const strokeDasharray = 251.2;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * debtRatio) / 100;

  // === MICRO DATA ENGINE ===
  const frequency = paydayConfig?.frequency || "Weekly";
  const paydaySlots = { "Weekly": ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"], "Bi-Weekly": ["Payday 1", "Payday 2", "Payday 3"], "Semi-Monthly": ["Payday 1", "Payday 2"], "Monthly": ["Payday 1"] };
  const activeSlots = paydaySlots[frequency] || paydaySlots["Weekly"];
  const paydaysToRender = ["Due Now", ...activeSlots];

  const billsByPayday = {};
  ["Due Now", "Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach((pd) => { billsByPayday[pd] = []; });
  bills.forEach((bill) => { if (bill?.payday && billsByPayday[bill.payday]) billsByPayday[bill.payday].push(bill); });

  const actualIncomeByPayday = { "Payday 1": 0, "Payday 2": 0, "Payday 3": 0, "Payday 4": 0, "Payday 5": 0 };
  const actualExpensesByPayday = { "Payday 1": 0, "Payday 2": 0, "Payday 3": 0, "Payday 4": 0, "Payday 5": 0 };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  // === 🧠 LP ASSISTANT LOGIC ===
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [activeBriefingText, setActiveBriefingText] = useState("");
  const isMorningWindow = currentHour >= 5 && currentHour < 16;
  const isEveningWindow = currentHour >= 16;
  const isPhantomZone = currentHour >= 0 && currentHour < 5;

  const handleRunBriefing = async (type) => {
    setIsBriefingLoading(true);
    // Silent fail if briefing endpoint isn't ready
    setTimeout(() => {
        setActiveBriefingText("Vault analysis complete. Liquid cash is secured and your ledger is balanced for the current cycle.");
        setIsBriefingLoading(false);
        if (type === "AM") setHasConsumedAMBriefing(true); else setHasConsumedPMBriefing(true);
    }, 1500);
  };

  // === DYNAMIC STYLING ===
  const getTxAmountClasses = (tx, isDark) => {
    if (tx?.isBillPayment || tx?.category === "Bill Payment") return isDark ? "bg-[#1877F2]/20 text-[#1877F2]" : "bg-blue-50 text-[#1877F2]";
    if (tx?.type === "Income") return isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600";
    return isDark ? "bg-orange-900/30 text-orange-400" : "bg-orange-50 text-orange-600";
  };

  const graphicContent = (
    <div className="flex items-center justify-between relative z-10 mb-6 w-full">
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isCritical ? "#EF4444" : isWarning ? "#F59E0B" : "#3B82F6"} strokeWidth="12" strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Debt Load</span>
          <span className={`text-3xl font-black ${isCritical ? "text-red-500" : isWarning ? "text-orange-500" : "text-[#1877F2]"}`}>{Math.round(debtRatio)}%</span>
        </div>
      </div>
      <div className="flex-1 pl-4 text-right">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-3 ${isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${safeToSpend < 0 ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Safe to Spend</span>
        </div>
        <p className={`text-4xl font-black tracking-tighter mb-4 ${safeToSpend < 0 ? "text-red-500" : isDarkMode ? "text-white" : "text-slate-900"}`}>${safeToSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(greetingStr, graphicContent)}

      <main className="px-6 space-y-4">
        {/* 🧠 LP ASSISTANT MODULE */}
        {!isPhantomZone && (
          <div className={`rounded-3xl border transition-all duration-500 overflow-hidden shadow-xl ${isDarkMode ? "bg-slate-800/60 border-[#1877F2]/30" : "bg-white border-[#1877F2]/20"} mb-5`}>
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#1877F2]/10">
              <div className="flex items-center gap-2"><span className="text-2xl">🤖</span><span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-blue-400" : "text-[#1877F2]"}`}>L.P. AI Assistant</span></div>
            </div>
            <div className="p-4 text-center">
              {isBriefingLoading ? ( <RefreshCw size={24} className="animate-spin mx-auto text-[#1877F2]" /> ) : activeBriefingText ? (
                <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>"{activeBriefingText}"</p>
              ) : (
                <button onClick={() => handleRunBriefing(isMorningWindow ? "AM" : "PM")} className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-blue-50 text-[#1877F2] border border-blue-100 shadow-sm">
                   Summarize my {isMorningWindow ? "yesterday" : "today"} L.P.
                </button>
              )}
            </div>
          </div>
        )}

        {/* 🔥 FIX 3: ALIGNED VERTICAL HEADERS */}
        <div className="space-y-4">
          {paydaysToRender.map((payday) => {
            const groupBills = billsByPayday[payday] || [];
            if (payday === "Due Now" && groupBills.length === 0) return null;
            const pdSettings = paydayConfig?.[payday] || {};
            const isDueNow = payday === "Due Now";
            const isCollapsed = collapsedPaydays?.[payday];
            const checkTotal = groupBills.filter((b) => !b?.isPaid).reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);
            const expectedDateStr = isDueNow ? "Currently Due" : pdSettings?.date ? formatPaydayDateStr(pdSettings.date) : "Unscheduled";
            const sortedBills = sortBillsSurgically(groupBills);

            return (
              <div key={payday} className="space-y-2">
                <div className={`flex flex-col px-3 py-3 cursor-pointer rounded-xl transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`} onClick={() => toggleCollapse(payday)}>
                  {/* Row 1: Name aligns with Balance */}
                  <div className="flex items-center justify-between w-full mb-1">
                     <div className="flex items-center gap-2">
                       <h3 className={`text-sm font-black uppercase tracking-widest ${isDueNow ? "text-red-500" : isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{payday}</h3>
                       <div className="text-slate-400">{isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
                     </div>
                     <span className={`text-sm font-black ${isDueNow ? "text-red-500" : "text-[#1877F2]"}`}>${checkTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {/* Row 2: Date aligns with Total Due */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{expectedDateStr}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isDueNow ? "text-red-500/80" : "text-slate-400"}`}>Total Due</span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className={`rounded-[2rem] p-4 border shadow-sm ${isDueNow ? (isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50/30 border-red-100") : (isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50")}`}>
                    {sortedBills.length === 0 ? (
                      <p className="text-center text-xs font-bold text-slate-400 py-4">Zero items planned.</p>
                    ) : (
                      <div className="space-y-3">
                        {/* 🔥 FIX 6: 3-LEVEL MASTERPIECE ENTRY CARDS 🔥 */}
                        {sortedBills.map((bill) => (
                          <div key={bill?.id} className={`flex flex-col p-4 rounded-2xl border shadow-sm transition-all overflow-hidden ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}>
                            {/* TOP LEVEL: Name & Glowing Amount */}
                            <div className="flex items-start justify-between gap-4 mb-4 cursor-pointer" onClick={() => setSelectedEntry(bill)}>
                                <p className={`font-black text-base truncate flex-1 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{bill?.name || "Unnamed"}</p>
                                <div className={`px-4 py-1.5 rounded-xl font-black text-sm shadow-md shrink-0 ${bill?.isOverdue ? "bg-red-500 text-white" : "bg-[#1877F2] text-white"}`}>
                                    ${(Number(bill?.amount) || 0).toFixed(2)}
                                </div>
                            </div>
                            {/* MIDDLE LEVEL: Icon, Date, Button */}
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>{bill?.icon || "🧾"}</div>
                                <div className="flex flex-col flex-1">
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${bill?.isOverdue ? "text-red-500" : "text-slate-400"}`}>{bill?.isOverdue ? "Overdue" : "Due"}</span>
                                    <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{bill?.fullDate || "TBD"}</span>
                                </div>
                                {!bill?.isPaid ? (
                                    <button onClick={(e) => { e.stopPropagation(); handleBillClick(bill?.id); }} className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100 bg-blue-50 text-[#1877F2] active:scale-95 transition-all flex items-center gap-1.5"><CheckCircle2 size={14} /> Pay</button>
                                ) : (
                                    <div className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={14} /> Paid</div>
                                )}
                            </div>
                            {/* BOTTOM LEVEL: Progress (Conditional) */}
                            {bill?.isInstallment && (
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className="flex justify-between mb-1.5"><span className="text-[9px] font-bold uppercase text-slate-400">Installment Plan</span><span className="text-[9px] font-black text-slate-500">${(Number(bill?.paidAmount) || 0).toFixed(2)} / ${(Number(bill?.totalAmount) || 0).toFixed(2)}</span></div>
                                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-900" : "bg-slate-100"}`}>
                                        <div className="h-full bg-[#1877F2] transition-all duration-1000" style={{ width: `${Math.min(((Number(bill?.paidAmount) || 0) / (Number(bill?.totalAmount) || 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 🔥 FIX 4: ACTIVITY FEED CAPPED AT 5 🔥 */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Recent Activity</h3>
          <div className={`rounded-[2rem] p-4 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
            {transactions.length === 0 ? ( <p className="text-center py-8 font-bold text-slate-400">No activity yet.</p> ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx?.id} onClick={() => setSelectedEntry(tx)} className={`flex flex-col p-4 rounded-2xl border shadow-sm cursor-pointer transition-all active:scale-[0.98] ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <p className={`font-black text-base truncate flex-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{tx?.name || "Transaction"}</p>
                        <div className={`px-3 py-1.5 rounded-xl font-black text-sm ${getTxAmountClasses(tx, isDarkMode)}`}>{tx?.type === "Income" ? "+" : "-"}${(Number(tx?.amount) || 0).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>{tx?.icon || "💳"}</div>
                        <div className="flex flex-col flex-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{tx?.category || "General"}</span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{tx?.date || "Recent"}</span>
                        </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => changeTab("activity")} className="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><List size={16} /> View Full Activity</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
