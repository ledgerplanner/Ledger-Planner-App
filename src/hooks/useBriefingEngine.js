import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, AlertCircle, Calendar as CalendarIcon, ArrowDown, CheckCircle2 } from "lucide-react";
import { useLedger } from '../context/LedgerContext';

export const useBriefingEngine = ({
  needsRefresh,
  dynamicBills,
  changeTab,
  setIsNotificationsOpen,
  handleOpenPaydaySetup,
  userName,
  hasConsumedAMBriefing,
  hasConsumedPMBriefing,
  formatPaydayDateStr,
  isEntrepreneurMode = false
}) => {
  const { accounts, bills, transactions, paydayConfig, user } = useLedger();

  const [aiBriefing, setAiBriefing] = useState(null);
  const [isFetchingBriefing, setIsFetchingBriefing] = useState(false);

  // === DYNAMIC ALERTS GENERATOR. ===
  const generateAlerts = () => {
    const currentAlerts = [];
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);

    // #7. System Update
    if (needsRefresh) {
      currentAlerts.unshift({
        id: 'refresh-required',
        type: 'danger',
        icon: <RefreshCw size={20} className="text-red-500 animate-[spin_3s_linear_infinite]" />,
        title: '🔄 System Update',
        message: 'New month detected. Refresh to initialize the new vault.',
        time: 'REQUIRED',
        action: () => window.location.reload()
      });
    }

    // #8. Action Required
    const actionBills = dynamicBills.filter(b => b.isOverdue || (!b.isPaid && b.payday === "Due Now"));
    actionBills.forEach(b => {
      currentAlerts.push({
        id: `action-${b.id}`, 
        type: 'danger', 
        icon: <AlertCircle size={20} className="text-red-500" />,
        title: '🚨 Action Required', 
        message: `Your ${b.name || "Bill"} is ${b.isOverdue ? 'past due' : 'due now'}.`,
        amount: b.amount || 0, 
        time: b.isOverdue ? 'URGENT' : 'TODAY',
        action: () => { setIsNotificationsOpen(false); changeTab("bills"); }
      });
    });

    // #9. Subscription Nudge
    const upcomingRecurring = dynamicBills.filter(b => !b.isPaid && b.isRecurring && !b.isOverdue && b.payday !== "Due Now" && b.payday !== "Unscheduled");
    upcomingRecurring.forEach(b => {
      if (b.rawDate) {
        const bDate = new Date(b.rawDate);
        if (!isNaN(bDate.getTime())) {
          const diffDays = Math.ceil((bDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 2) {
            currentAlerts.push({
              id: `sub-${b.id}`, 
              type: 'info', 
              icon: <RefreshCw size={20} className="text-[#10B981]" />,
              title: '🔔 Subscription Nudge', 
              message: `${b.name || "Subscription"} is recurring in ${diffDays} day(s).`,
              amount: b.amount || 0, 
              time: `${diffDays}D`,
              action: () => { setIsNotificationsOpen(false); changeTab("bills"); }
            });
          }
        }
      }
    });

    ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach(pdId => {
      const config = paydayConfig?.[pdId];
      if (config && config.date) {
        const pdDate = new Date(config.date);
        if (!isNaN(pdDate.getTime())) {
          pdDate.setUTCHours(0, 0, 0, 0);
          const diffDays = Math.ceil((pdDate - today) / (1000 * 60 * 60 * 24));
          
          // #10. Upcoming Payday
          if (diffDays >= 0 && diffDays <= 3) {
            currentAlerts.push({
              id: `payday-${pdId}`, 
              type: 'info', 
              icon: <CalendarIcon size={20} className="text-[#1877F2]" />,
              title: '💵 Upcoming Payday', 
              message: `${pdId} is approaching.`, 
              time: `${diffDays}D`,
              action: () => { setIsNotificationsOpen(false); handleOpenPaydaySetup(); }
            });
          }

          // #11. Payday Gap
          const pdBills = bills.filter(b => b.payday === pdId && !b.isPaid);
          const pdTotal = pdBills.reduce((sum, b) => sum + (b.amount || 0), 0);
          const pdIncome = parseFloat(config.income) || 0;
          if (pdTotal > pdIncome && pdIncome > 0) {
            currentAlerts.push({
              id: `gap-${pdId}`, 
              type: 'warning', 
              icon: <ArrowDown size={20} className="text-orange-500" />,
              title: '💸 Payday Gap', 
              message: `${pdId} is $${(pdTotal - pdIncome).toFixed(2)} short of covering your bills.`,
              time: 'WARNING', 
              action: () => { setIsNotificationsOpen(false); changeTab("bills"); }
            });
          }
        }
      }
    });

    // #12. Safe Spending Alert
    const liquidCash = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const upcomingBills = bills.filter(b => !b.isPaid && !b.isOverdue);
    const upcomingBurn = upcomingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const safeToSpend = liquidCash - upcomingBurn;

    if (safeToSpend < 100) {
      const isNegative = safeToSpend < 0;
      const formattedAmount = isNegative 
        ? `-$${Math.abs(safeToSpend).toFixed(2)}` 
        : `$${safeToSpend.toFixed(2)}`;

      currentAlerts.push({
        id: `redline`, 
        type: 'danger', 
        icon: <AlertCircle size={20} className="text-red-500" />,
        title: '🚨 Safe Spending Alert', 
        message: `Available cash is critically low (${formattedAmount}).`,
        time: 'ALERT', 
        action: () => { setIsNotificationsOpen(false); changeTab("home"); }
      });
    }

    // #13. Transfer Complete
    const recentTransfers = transactions.filter(tx => tx.category === "Transfers (Venmo/Zelle)" && tx.type === "Income");
    if (recentTransfers.length > 0) {
      const latestTransfer = recentTransfers[0];
      currentAlerts.push({
        id: `transfer-${latestTransfer.id}`, 
        type: 'success', 
        icon: <CheckCircle2 size={20} className="text-[#10B981]" />,
        title: '✅ Transfer Complete', 
        message: `$${(latestTransfer.amount || 0).toFixed(2)} was successfully moved.`,
        time: latestTransfer.date?.split(',')[0] || "Recent",
        action: () => { setIsNotificationsOpen(false); changeTab("activity"); }
      });
    }

    return currentAlerts;
  };

  // === DYNAMIC AI BRIEFING ENGINE (GEMINI 3.5 FLASH) ===
  const hours = new Date().getHours();
  // SURGICAL FIX: Shift window runs 5:00 AM (5) through 4:59 PM (16). 5:00 PM (17) triggers PM shift.
  const isAM = hours >= 5 && hours < 17;
  const currentPeriod = isAM ? 'AM' : 'PM';
  const isUnconsumedBriefing = isAM ? !hasConsumedAMBriefing : !hasConsumedPMBriefing;

  const isBirthdayToday = useMemo(() => {
    let bdayStr = "07-02"; 
    if (user?.birthday) {
      bdayStr = user.birthday.length > 5 ? user.birthday.substring(5) : user.birthday;
    }
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return bdayStr === todayStr;
  }, [user]);

  useEffect(() => {
    const fetchAIBriefing = async () => {
      setIsFetchingBriefing(true);
      try {
        const response = await fetch('/api/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: userName || user?.displayName || 'Founder',
            accounts,
            bills,
            transactions,
            currentPeriod,
            isBirthdayToday,
            isEntrepreneurMode
          })
        });
        
        if (!response.ok) throw new Error('API Fault');
        
        const data = await response.json();
        if (data?.briefing) {
          setAiBriefing(data.briefing);
        }
      } catch (error) {
        console.error("AI Briefing Fetch Error:", error);
        // Ironclad local fallback if network is completely severed
        setAiBriefing({
          insightType: "BUDGET INSIGHT",
          title: "📋 Stay on Track",
          body: "Review your upcoming bills for the week to ensure your ledger remains perfectly balanced."
        });
      } finally {
        setIsFetchingBriefing(false);
      }
    };

    fetchAIBriefing();
  }, [currentPeriod]); // Only trigger network calls when shifting between morning and evening

  return {
    activeAlerts: generateAlerts(),
    briefingData: {
      data: aiBriefing,
      isAM,
      isUnconsumed: isUnconsumedBriefing,
      isLoading: isFetchingBriefing
    },
    hasUnreadBriefing: isUnconsumedBriefing && !!aiBriefing
  };
};
