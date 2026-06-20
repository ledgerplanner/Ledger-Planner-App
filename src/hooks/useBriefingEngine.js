import React from 'react';
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
  formatPaydayDateStr
}) => {
  const { accounts, bills, transactions, paydayConfig, user } = useLedger();

  // === DYNAMIC ALERTS GENERATOR ===
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
    actionBills.forEach(b => {
      currentAlerts.push({
        id: `action-${b.id}`, 
        type: 'danger', 
        icon: <AlertCircle size={20} className="text-red-500" />,
        title: 'Action Required', 
        message: `Your ${b.name || "Bill"} is ${b.isOverdue ? 'past due' : 'due now'}.`,
        amount: b.amount || 0, 
        time: b.isOverdue ? 'URGENT' : 'TODAY',
        action: () => { setIsNotificationsOpen(false); changeTab("bills"); }
      });
    });

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
              title: 'Subscription Nudge', 
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
          if (diffDays >= 0 && diffDays <= 3) {
            currentAlerts.push({
              id: `payday-${pdId}`, 
              type: 'info', 
              icon: <CalendarIcon size={20} className="text-[#1877F2]" />,
              title: 'Upcoming Payday', 
              message: `${pdId} is approaching.`, 
              time: `${diffDays}D`,
              action: () => { setIsNotificationsOpen(false); handleOpenPaydaySetup(); }
            });
          }
          const pdBills = bills.filter(b => b.payday === pdId && !b.isPaid);
          const pdTotal = pdBills.reduce((sum, b) => sum + (b.amount || 0), 0);
          const pdIncome = parseFloat(config.income) || 0;
          if (pdTotal > pdIncome && pdIncome > 0) {
            currentAlerts.push({
              id: `gap-${pdId}`, 
              type: 'warning', 
              icon: <ArrowDown size={20} className="text-orange-500" />,
              title: 'Liquidity Gap', 
              message: `${pdId} is $${(pdTotal - pdIncome).toFixed(2)} short.`,
              time: 'WARNING', 
              action: () => { setIsNotificationsOpen(false); changeTab("bills"); }
            });
          }
        }
      }
    });

    const liquidCash = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const upcomingBills = bills.filter(b => !b.isPaid && !b.isOverdue);
    const upcomingBurn = upcomingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const safeToSpend = liquidCash - upcomingBurn;

    if (safeToSpend < 100 && safeToSpend >= 0) {
      currentAlerts.push({
        id: `redline`, 
        type: 'danger', 
        icon: <AlertCircle size={20} className="text-red-500" />,
        title: 'Redline', 
        message: `Buffer critically low ($${safeToSpend.toFixed(2)}).`,
        time: 'ALERT', 
        action: () => { setIsNotificationsOpen(false); changeTab("home"); }
      });
    }

    const recentTransfers = transactions.filter(tx => tx.category === "Transfers (Venmo/Zelle)" && tx.type === "Income");
    if (recentTransfers.length > 0) {
      const latestTransfer = recentTransfers[0];
      currentAlerts.push({
        id: `transfer-${latestTransfer.id}`, 
        type: 'success', 
        icon: <CheckCircle2 size={20} className="text-[#10B981]" />,
        title: 'Transfer Complete', 
        message: `$${(latestTransfer.amount || 0).toFixed(2)} was successfully moved.`,
        time: latestTransfer.date?.split(',')[0] || "Recent",
        action: () => { setIsNotificationsOpen(false); changeTab("activity"); }
      });
    }

    return currentAlerts;
  };

  // === COMBINATORIAL MATRIX ENGINE ===
  const todayForDynamic = new Date();
  todayForDynamic.setHours(0, 0, 0, 0);

  const hours = new Date().getHours();
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, 5 = Friday
  const isAM = hours >= 5 && hours < 12;
  
  const liquidCash = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const allUnpaidBills = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + (b.amount || 0), 0);
  
  // FIX 1: True Cushion Math
  const trueSafeToSpend = liquidCash - allUnpaidBills;

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

  const daysUntilPayday = Math.max(Math.ceil((nextPaydayDate - todayForDynamic) / (1000 * 60 * 60 * 24)), 1);
  const currentCycleBillsTotal = bills.filter(b => b.payday === activePaydayKey && !b.isPaid).reduce((sum, b) => sum + (b.amount || 0), 0);
  const activeBillsCount = bills.filter(b => b.payday === activePaydayKey && !b.isPaid).length;
  const pastDueCount = bills.filter(b => b.isOverdue && !b.isPaid).length;

  const trueRunwayAmount = Math.max((liquidCash - currentCycleBillsTotal) / daysUntilPayday, 0);
  const totalCycleIncome = parseFloat(paydayConfig?.[activePaydayKey]?.income) || 0;
  const burnPercentage = totalCycleIncome > 0 ? Math.round((currentCycleBillsTotal / totalCycleIncome) * 100) : 0;
  
  const isUnconsumedBriefing = isAM ? !hasConsumedAMBriefing : !hasConsumedPMBriefing;
  const userNameDisplay = userName || "Founder";

  const seedString = (user?.uid || "demo") + new Date().toDateString();
  let seedVal = 0;
  for(let i = 0; i < seedString.length; i++) seedVal = Math.imul(31, seedVal) + seedString.charCodeAt(i) | 0;
  seedVal = Math.abs(seedVal);
  const pick = (arr, offset) => arr[(seedVal + offset) % arr.length];

  let briefingText = "";
  
  if (isAM) {
    if (activeBillsCount === 0) {
      // FIX 2: Zero Bills Clear Deck
      const t1 = ["Runway is wide open, {N}.", "Good morning, {N}. Your schedule is clear.", "Optimal start to the day, {N}.", "Zero structural drag detected, {N}."];
      const t2 = ["Your ledger is completely clear of bills for this current pay cycle.", "We are tracking absolutely zero fixed obligations on the board right now.", "There are no scheduled auto-drafts or bills required this week.", "Your incoming capital has zero fixed destinations scheduled."];
      const t3 = ["Enjoy the breathing room and consider accelerating a savings goal.", "Perfect time to route some excess cash into your vault.", "Maintain this flexibility and build your defensive cushion.", "Use this gap to make an aggressive manual transfer."];
      briefingText = `${pick(t1, 0).replace('{N}', userNameDisplay)} ${pick(t2, 1)} ${pick(t3, 2)}`;
    } else if (dayOfWeek === 1 && burnPercentage <= 60) {
      // FIX 4a: The Monday Blues (Morning)
      const t1 = ["New week, new targets, {N}.", "Monday morning sync complete, {N}.", "Let's set the baseline for the week, {N}.", "Vault is online for the week ahead, {N}."];
      const t2 = ["You have ${A} in daily safe-to-spend runway leading up to {D}.", "We are projecting a steady ${A} daily allowance until {D}.", "Your operational velocity is safely capped at ${A}/day through {D}."];
      const t3 = ["Start the week strong and protect the cushion.", "Lock in your spending pace early to secure the surplus.", "Command the baseline today to ensure a flawless week."];
      briefingText = `${pick(t1, 0).replace('{N}', userNameDisplay)} ${pick(t2, 1).replace('{A}', trueRunwayAmount.toFixed(2)).replace('{D}', formatPaydayDateStr ? formatPaydayDateStr(paydayConfig?.[activePaydayKey]?.date) : "TBD")} ${pick(t3, 2)}`;
    } else if (burnPercentage > 60) {
      const t1 = ["Capital lock-down active, {N}.", "Heads up, {N}, let's play defense today.", "Reviewing the payload trajectory, {N}.", "Defensive posture required, {N}.", "Attention on deck, {N}.", "Operational alert, {N}.", "Let's review the active burn rate, {N}.", "Tactical adjustment needed, {N}."];
      const t2 = ["This cycle is running hot with {P}% of your income locked into fixed bills.", "Fixed obligations are consuming a massive {P}% of your baseline pay.", "A steep {P}% of your incoming capital is strictly allocated.", "Telemetry shows {P}% of this paycheck is already spoken for.", "You are operating at a {P}% fixed-burn capacity.", "The ledger shows a heavy {P}% burn rate.", "Fixed outflow is critically high at {P}% for this cycle.", "We are tracking a heavy {P}% overhead on this capital."];
      const t3 = ["Freeze all non-essential outflows and let automation do the heavy lifting.", "Hold a rigid line on casual swiping until this wave passes.", "Focus purely on maintaining the cushion line.", "Execute strict operational discipline until the next influx clears.", "Minimize discretionary spending and let the system absorb the impact.", "Keep your powder dry and rely on pre-programmed allocations.", "Lock down your daily velocity and trust the vault's defenses.", "Maintain strict capital controls until the next cycle drops."];
      briefingText = `${pick(t1, 0).replace('{N}', userNameDisplay)} ${pick(t2, 1).replace('{P}', burnPercentage)} ${pick(t3, 2)}`;
    } else if (burnPercentage < 30) {
      const t1 = ["Optimal conditions detected, {N}.", "Good morning, {N}. We have a clear runway.", "System checks nominal, {N}.", "Green lights across the board, {N}.", "Strategic advantage secured, {N}.", "Capitalizing on the surplus, {N}.", "Excellent operational setup today, {N}.", "Morning analysis is highly favorable, {N}."];
      const t2 = ["This is a Low-Burn cycle—only {P}% of this income goes to fixed nodes.", "We are tracking a highly efficient {P}% overhead on this cycle.", "Your baseline burn is running at a pristine {P}% right now.", "Fixed obligations are incredibly light at just {P}%.", "You have massive flexibility with only {P}% fixed allocation.", "The vault is operating with a minimal {P}% drag factor.", "We are seeing extreme efficiency with a {P}% baseline burn.", "Your liquidity is dominant with just {P}% fixed capital."];
      const t3 = ["You have a prime opportunity to make an aggressive manual transfer toward your Savings Goal.", "Deploy excess capital toward your primary wealth targets ahead of schedule.", "Accelerate your savings timeline with a manual capital injection today.", "Consider sweeping the surplus directly into your investment layers.", "Use this velocity to strike your financial targets early.", "Route the excess runway into your highest-yield goal.", "Capitalize on this gap by fully funding a priority target.", "Command the surplus into your long-term vault structures."];
      briefingText = `${pick(t1, 3).replace('{N}', userNameDisplay)} ${pick(t2, 4).replace('{P}', burnPercentage)} ${pick(t3, 5)}`;
    } else {
      const t1 = ["Runway calculated, {N}.", "Morning telemetry is live, {N}.", "Baseline established, {N}.", "Reviewing your velocity metrics, {N}.", "Operational targets set, {N}.", "Good morning, {N}. Here is your trajectory.", "Checking the daily burn rate, {N}.", "Vault analysis complete, {N}."];
      const t2 = ["After fixed bills, your true safe-to-spend runway is exactly ${A} per day until {D}.", "You are holding a daily operational velocity of ${A} leading up to {D}.", "Your discretionary burn rate is safely capped at ${A}/day until {D}.", "We project a steady ${A} daily allowance until the next payload on {D}.", "The ledger clears you for ${A} in daily outflows until {D}.", "Your baseline cushion allows for a ${A} daily velocity through {D}.", "We've locked your maximum daily variance at ${A} leading into {D}.", "Operational models give you a strict ${A} daily limit until {D}."];
      const t3 = ["Keep daily spending under this line to maintain a perfect cushion.", "Hold this exact trajectory to secure your month-end surplus.", "Pace your outflows to match this mathematical baseline.", "Defend this threshold to guarantee a flawless cycle.", "Execute within these parameters to protect the vault.", "Maintain discipline on this number to arrive exactly on target.", "Do not exceed this velocity if you want to optimize savings.", "Command this baseline to ensure zero liquidity gaps."];
      briefingText = `${pick(t1, 6).replace('{N}', userNameDisplay)} ${pick(t2, 7).replace('{A}', trueRunwayAmount.toFixed(2)).replace('{D}', formatPaydayDateStr ? formatPaydayDateStr(paydayConfig?.[activePaydayKey]?.date) : "TBD")} ${pick(t3, 8)}`;
    }
  } else {
    if (daysUntilPayday === 1 && pastDueCount > 0) {
      // FIX 3: Payday Eve Ghost Town Intercept
      const t1 = ["Payday Eve is active, {N}, but we have a red flag.", "Final sweep before tomorrow's drop, {N}.", "We have incoming capital tomorrow, {N}, but action is needed."];
      const t2 = [`The system detects ${pastDueCount === 1 ? '1 bill' : `${pastDueCount} bills`} currently sitting past due in the ledger.`, `You have ${pastDueCount} overdue obligation(s) dragging on the vault's efficiency.`, `A past-due balance is currently unhandled on the board.`];
      const t3 = ["Clean that up tonight so tomorrow's paycheck lands on a fresh slate.", "Clear the red off the board before the new cycle officially begins.", "Resolve the deficit now to protect your incoming liquidity."];
      briefingText = `${pick(t1, 0).replace('{N}', userNameDisplay)} ${pick(t2, 1)} ${pick(t3, 2)}`;
    } else if (daysUntilPayday === 1) {
      const t1 = ["Payday Eve is active, {N}.", "Final cycle approach, {N}.", "Preparing for payload injection, {N}.", "Payday Eve protocols engaged, {N}.", "Closing out the cycle, {N}.", "Final sweep before the drop, {N}.", "Payday Eve is officially here, {N}.", "Securing the vault for tomorrow, {N}."];
      const t2 = ["You navigated this wave with a safe-to-spend surplus of ${E} remaining in your buffer.", "We are tracking a true ${E} excess cushion as we cross the finish line.", "You held the line beautifully with ${E} intact before tomorrow's deposit.", "The true math shows a solid ${E} remaining in liquidity after upcoming bills.", "You executed the plan and retained a ${E} tactical reserve.", "We're ending the cycle with a precise ${E} buffer.", "Your discipline preserved a ${E} operational surplus.", "The math holds true—you have ${E} remaining in the primary vault."];
      const t3 = ["Excellent discipline. Preparing the vault to initialize your incoming paycheck tomorrow.", "Outstanding execution. We are primed to receive capital tomorrow.", "Flawless run. The system is ready to route tomorrow's inbound funds.", "Mission accomplished. Stand by for capital deployment in the morning.", "Perfect pacing. Vault doors are open for tomorrow's influx.", "High-level execution. Preparing automated routing for the new cycle.", "Textbook finish. The ledger is clean and ready for tomorrow.", "Commanding performance. Initializing receiving protocols for payday."];
      briefingText = `${pick(t1, 9).replace('{N}', userNameDisplay)} ${pick(t2, 10).replace('{E}', trueSafeToSpend.toFixed(2))} ${pick(t3, 11)}`;
    } else if (dayOfWeek === 5) {
      // FIX 4b: Friday Evening Wrap-up
      const t1 = ["Weekend wrap-up, {N}.", "Clocking out for the week, {N}.", "Friday evening ledger sync, {N}.", "Week complete, {N}."];
      const t2 = ["We are holding steady with {D} days remaining until your next paycheck drops.", "The system is tracking a {D}-day timeline to your next funding event.", "The math shows {D} days left until the primary account is replenished."];
      const t3 = ["Enjoy the weekend. The automated systems are holding the line.", "Disconnect and relax. Your capital is locked and tracked.", "Zero weekend alerts active. The ledger is perfectly balanced."];
      briefingText = `${pick(t1, 0).replace('{N}', userNameDisplay)} ${pick(t2, 1).replace('{D}', daysUntilPayday)} ${pick(t3, 2)}`;
    } else {
      const t1 = ["Evening analysis complete, {N}.", "Wrapping up daily telemetry, {N}.", "End-of-day ledger sync, {N}.", "Nightly vault check, {N}.", "Reviewing today's velocity, {N}.", "Closing out the day's books, {N}.", "Evening baseline confirmed, {N}.", "System entering night mode, {N}."];
      const t2 = ["We are exactly {D} days out from your next scheduled capital injection.", "You have a {D}-day operational gap until the next paycheck drops.", "The system is tracking a {D}-day timeline to your next funding event.", "We are holding steady with {D} days remaining in this cycle.", "The math shows {D} days left until the primary account is replenished.", "We are pacing toward a payload drop in exactly {D} days.", "The countdown sits at {D} days until the next payday.", "You must sustain this trajectory for another {D} days."];
      const t3 = ["Rest easy, the automated systems are holding the line.", "Maintain your defensive posture through the remainder of the week.", "The baseline is secure. No further action is required tonight.", "Your capital is locked. Great execution today.", "Hold this exact pace and we will cross the finish line perfectly.", "Zero alerts active. The ledger is perfectly balanced.", "Stay disciplined tomorrow and trust the pre-planned allocations.", "The vault is secure. We ride this velocity to the end."];
      briefingText = `${pick(t1, 12).replace('{N}', userNameDisplay)} ${pick(t2, 13).replace('{D}', daysUntilPayday)} ${pick(t3, 14)}`;
    }
  }

  return {
    activeAlerts: generateAlerts(),
    briefingData: {
      text: briefingText,
      isAM,
      isUnconsumed: isUnconsumedBriefing
    }
  };
};
