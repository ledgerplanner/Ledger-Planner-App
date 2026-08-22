// src/demoData.js

// DYNAMIC DATE ENGINE: Anchors demo sandbox to the live local date
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-indexed (e.g. 7 = August)
const currentDay = now.getDate(); // Exact active day for guaranteed "TODAY" match

// Helper to format local date strings (YYYY-MM-DD)
const formatIso = (year, monthIdx, day) => {
  const m = String(monthIdx + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

// Helper for local timestamps with explicit midday time to avoid UTC timezone offsets
const formatIsoMidday = (year, monthIdx, day) => {
  const m = String(monthIdx + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}T12:00:00`;
};

const formatDisplayDate = (year, monthIdx, day) => {
  const dateObj = new Date(year, monthIdx, day);
  return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ==========================================
// 1. ACCOUNTS & SAVINGS GOALS (COLUMBUS ARCHETYPE)
// ==========================================
export const demoAccounts = [
  { id: "acc1", name: "Huntington Checking", type: "Checking", balance: 1850.50, icon: "🏦" },
  { id: "acc2", name: "Cash Reserve", type: "Cash", balance: 240.00, icon: "💵" },
  { id: "acc3", name: "High-Yield Savings", type: "Savings", balance: 4650.00, icon: "📈" },
  { id: "acc4", name: "Chase Freedom Unlimited", type: "Credit", balance: -425.80, icon: "💳" },
  { id: "acc5", name: "Fidelity 401(k)", type: "Investment", balance: 16800.00, icon: "🌴" },
  { id: "acc6", name: "2019 Cadillac XTS", type: "Goal", balance: 6200.00, targetAmount: 14500.00, isGoal: true, icon: "🚘" }
];

// ==========================================
// 2. WEEKLY PAYDAY CONFIGURATION
// ==========================================
export const demoPaydayConfig = {
  frequency: "Weekly",
  "Payday 1": { date: formatIso(currentYear, currentMonth, 7), income: "950" },
  "Payday 2": { date: formatIso(currentYear, currentMonth, 14), income: "950" },
  "Payday 3": { date: formatIso(currentYear, currentMonth, 21), income: "950" },
  "Payday 4": { date: formatIso(currentYear, currentMonth, 28), income: "950" },
  "Payday 5": { date: "", income: "" }
};

// ==========================================
// 3. BILLS & PLANS (CURRENT ACTIVE + FULL VERTICAL ARCHITECTURE FOR JAN - JUL)
// ==========================================
const currentMonthBills = [
  // --- 10 PAID BILLS (Past Paydays 1 & 2) ---
  {
    id: "b1",
    name: "Short North Apartment Rent",
    amount: 1275.00,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 1",
    rawDate: formatIso(currentYear, currentMonth, 1),
    date: 1,
    fullDate: formatDisplayDate(currentYear, currentMonth, 1),
    icon: "🏠",
    category: "Rent / Mortgage",
    hasReminder: false,
    paidAmount: 1275.00,
    linkedTxId: "tx_demo_rent",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 1)
  },
  {
    id: "b2",
    name: "AEP Ohio (Electric)",
    amount: 118.00,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 1",
    rawDate: formatIso(currentYear, currentMonth, 4),
    date: 4,
    fullDate: formatDisplayDate(currentYear, currentMonth, 4),
    icon: "⚡",
    category: "Electric / Gas",
    hasReminder: false,
    paidAmount: 118.00,
    linkedTxId: "tx_demo_aep",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 4)
  },
  {
    id: "b3",
    name: "Columbia Gas of Ohio",
    amount: 58.00,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 1",
    rawDate: formatIso(currentYear, currentMonth, 6),
    date: 6,
    fullDate: formatDisplayDate(currentYear, currentMonth, 6),
    icon: "🔥",
    category: "Electric / Gas",
    hasReminder: false,
    paidAmount: 58.00,
    linkedTxId: "tx_demo_gas",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 6)
  },
  {
    id: "b4",
    name: "Spectrum Internet",
    amount: 79.99,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 1",
    rawDate: formatIso(currentYear, currentMonth, 7),
    date: 7,
    fullDate: formatDisplayDate(currentYear, currentMonth, 7),
    icon: "📶",
    category: "Internet / Wi-Fi",
    hasReminder: false,
    paidAmount: 79.99,
    linkedTxId: "tx_demo_spectrum",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 7)
  },
  {
    id: "b5",
    name: "Progressive Auto Insurance",
    amount: 112.00,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 1",
    rawDate: formatIso(currentYear, currentMonth, 7),
    date: 7,
    fullDate: formatDisplayDate(currentYear, currentMonth, 7),
    icon: "🚗",
    category: "Auto Loan / Maintenance",
    hasReminder: false,
    paidAmount: 112.00,
    linkedTxId: "tx_demo_prog",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 7)
  },
  {
    id: "b6",
    name: "Columbus Parking Garage Pass",
    amount: 85.00,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 2",
    rawDate: formatIso(currentYear, currentMonth, 10),
    date: 10,
    fullDate: formatDisplayDate(currentYear, currentMonth, 10),
    icon: "🅿️",
    category: "Auto Loan / Maintenance",
    hasReminder: false,
    paidAmount: 85.00,
    linkedTxId: "tx_demo_parking",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 10)
  },
  {
    id: "b7",
    name: "Planet Fitness (Grandview)",
    amount: 24.99,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 2",
    rawDate: formatIso(currentYear, currentMonth, 12),
    date: 12,
    fullDate: formatDisplayDate(currentYear, currentMonth, 12),
    icon: "🏋️",
    category: "Health & Fitness",
    hasReminder: false,
    paidAmount: 24.99,
    linkedTxId: "tx_demo_pf",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 12)
  },
  {
    id: "b8",
    name: "Netflix Premium",
    amount: 15.99,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 2",
    rawDate: formatIso(currentYear, currentMonth, 13),
    date: 13,
    fullDate: formatDisplayDate(currentYear, currentMonth, 13),
    icon: "🍿",
    isRecurring: true,
    category: "Streaming (Netflix/Hulu)",
    hasReminder: false,
    paidAmount: 15.99,
    linkedTxId: "tx_demo_netflix",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 13)
  },
  {
    id: "b9",
    name: "Spotify Family",
    amount: 16.99,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 2",
    rawDate: formatIso(currentYear, currentMonth, 14),
    date: 14,
    fullDate: formatDisplayDate(currentYear, currentMonth, 14),
    icon: "🎵",
    isRecurring: true,
    category: "Streaming (Netflix/Hulu)",
    hasReminder: false,
    paidAmount: 16.99,
    linkedTxId: "tx_demo_spotify",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 14)
  },
  {
    id: "b10",
    name: "Verizon Wireless",
    amount: 82.00,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 2",
    rawDate: formatIso(currentYear, currentMonth, 14),
    date: 14,
    fullDate: formatDisplayDate(currentYear, currentMonth, 14),
    icon: "📱",
    category: "Phone / Mobile",
    hasReminder: false,
    paidAmount: 82.00,
    linkedTxId: "tx_demo_verizon",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 14)
  },

  // --- 2 DUE NOW / IMMINENT BILLS ---
  {
    id: "b11",
    name: "City of Columbus Water & Sewer",
    amount: 48.50,
    isPaid: false,
    isOverdue: false,
    payday: "Due Now",
    rawDate: formatIso(currentYear, currentMonth, Math.min(28, currentDay + 1)),
    date: Math.min(28, currentDay + 1),
    fullDate: formatDisplayDate(currentYear, currentMonth, Math.min(28, currentDay + 1)),
    icon: "💧",
    category: "Water / Trash",
    hasReminder: true,
    reminderDays: 2
  },
  {
    id: "b12",
    name: "Grocery Allocation Reserve",
    amount: 150.00,
    isPaid: false,
    isOverdue: false,
    payday: "Due Now",
    rawDate: formatIso(currentYear, currentMonth, Math.min(28, currentDay + 2)),
    date: Math.min(28, currentDay + 2),
    fullDate: formatDisplayDate(currentYear, currentMonth, Math.min(28, currentDay + 2)),
    icon: "🛒",
    category: "Groceries",
    hasReminder: false
  },

  // --- 8 SCHEDULED UPCOMING BILLS (Paydays 3 & 4) ---
  {
    id: "b13",
    name: "Auto Loan",
    amount: 295.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 3",
    rawDate: formatIso(currentYear, currentMonth, 24),
    date: 24,
    fullDate: formatDisplayDate(currentYear, currentMonth, 24),
    icon: "🚘",
    isInstallment: true,
    paidAmount: 5900.00,
    totalAmount: 16500.00,
    category: "Auto Loan / Maintenance",
    hasReminder: true,
    reminderDays: 2
  },
  {
    id: "b14",
    name: "Student Loan (FedLoan)",
    amount: 165.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 3",
    rawDate: formatIso(currentYear, currentMonth, 25),
    date: 25,
    fullDate: formatDisplayDate(currentYear, currentMonth, 25),
    icon: "🎓",
    isInstallment: true,
    paidAmount: 3300.00,
    totalAmount: 18000.00,
    category: "Debt Payoff",
    hasReminder: true,
    reminderDays: 2
  },
  {
    id: "b15",
    name: "Klarna (Electronics Plan)",
    amount: 45.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 3",
    rawDate: formatIso(currentYear, currentMonth, 26),
    date: 26,
    fullDate: formatDisplayDate(currentYear, currentMonth, 26),
    icon: "💸",
    isInstallment: true,
    paidAmount: 135.00,
    totalAmount: 180.00,
    category: "Debt Payoff",
    hasReminder: false
  },
  {
    id: "b16",
    name: "Amazon Prime / Cloud",
    amount: 14.99,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 3",
    rawDate: formatIso(currentYear, currentMonth, 27),
    date: 27,
    fullDate: formatDisplayDate(currentYear, currentMonth, 27),
    icon: "☁️",
    isRecurring: true,
    category: "Subscriptions / Software",
    hasReminder: false
  },
  {
    id: "b17",
    name: "VCA PetCare Health Plan",
    amount: 38.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 4",
    rawDate: formatIso(currentYear, currentMonth, 28),
    date: 28,
    fullDate: formatDisplayDate(currentYear, currentMonth, 28),
    icon: "🐶",
    category: "Pets / Pet Care",
    hasReminder: false
  },
  {
    id: "b18",
    name: "Chase Freedom Min Payment",
    amount: 65.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 4",
    rawDate: formatIso(currentYear, currentMonth, 29),
    date: 29,
    fullDate: formatDisplayDate(currentYear, currentMonth, 29),
    icon: "💳",
    category: "Credit Card Payment",
    hasReminder: true,
    reminderDays: 2
  },
  {
    id: "b19",
    name: "AppleCare+ / Cloud",
    amount: 11.99,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 4",
    rawDate: formatIso(currentYear, currentMonth, 30),
    date: 30,
    fullDate: formatDisplayDate(currentYear, currentMonth, 30),
    icon: "🤖",
    isRecurring: true,
    category: "Subscriptions / Software",
    hasReminder: false
  },
  {
    id: "b20",
    name: "Roth IRA Auto Contribution",
    amount: 100.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 4",
    rawDate: formatIso(currentYear, currentMonth, 31),
    date: 31,
    fullDate: formatDisplayDate(currentYear, currentMonth, 31),
    icon: "💎",
    category: "Investments / Savings",
    hasReminder: false
  }
];

// --- HISTORICAL BILLS (Maps across Payday 1, 2, 3, 4 with seasonal variance for Jan - Jul) ---
const historicalBills = [];

const pastMonthConfigs = [
  { monthIdx: 0, rent: 1250, aep: 142, gas: 118, netflix: 15.99, spotify: 16.99, gym: 24.99, auto: 295, student: 165, card: 85, water: 42 }, // Jan
  { monthIdx: 1, rent: 1250, aep: 138, gas: 124, netflix: 15.99, spotify: 16.99, gym: 24.99, auto: 295, student: 165, card: 70, water: 44 }, // Feb
  { monthIdx: 2, rent: 1250, aep: 110, gas: 88,  netflix: 15.99, spotify: 16.99, gym: 24.99, auto: 295, student: 165, card: 60, water: 46 }, // Mar
  { monthIdx: 3, rent: 1275, aep: 96,  gas: 64,  netflix: 15.99, spotify: 16.99, gym: 24.99, auto: 295, student: 165, card: 95, water: 45 }, // Apr
  { monthIdx: 4, rent: 1275, aep: 104, gas: 52,  netflix: 15.99, spotify: 16.99, gym: 24.99, auto: 295, student: 165, card: 65, water: 48 }, // May
  { monthIdx: 5, rent: 1275, aep: 135, gas: 42,  netflix: 15.99, spotify: 16.99, gym: 24.99, auto: 295, student: 165, card: 120, water: 50 }, // Jun
  { monthIdx: 6, rent: 1275, aep: 148, gas: 38,  netflix: 15.99, spotify: 16.99, gym: 24.99, auto: 295, student: 165, card: 110, water: 52 }  // Jul
];

pastMonthConfigs.forEach(cfg => {
  if (cfg.monthIdx < currentMonth) {
    const m = cfg.monthIdx;
    const billsForMonth = [
      // Payday 1
      { name: "Short North Apartment Rent", amount: cfg.rent, payday: "Payday 1", day: 1, icon: "🏠", cat: "Rent / Mortgage" },
      { name: "AEP Ohio (Electric)", amount: cfg.aep, payday: "Payday 1", day: 4, icon: "⚡", cat: "Electric / Gas" },
      { name: "Columbia Gas of Ohio", amount: cfg.gas, payday: "Payday 1", day: 6, icon: "🔥", cat: "Electric / Gas" },
      
      // Payday 2
      { name: "Spectrum Internet", amount: 79.99, payday: "Payday 2", day: 8, icon: "📶", cat: "Internet / Wi-Fi" },
      { name: "Progressive Auto Insurance", amount: 112.00, payday: "Payday 2", day: 10, icon: "🚗", cat: "Auto Loan / Maintenance" },
      { name: "Planet Fitness (Grandview)", amount: cfg.gym, payday: "Payday 2", day: 12, icon: "🏋️", cat: "Health & Fitness" },
      { name: "Netflix Premium", amount: cfg.netflix, payday: "Payday 2", day: 14, icon: "🍿", cat: "Streaming (Netflix/Hulu)" },
      
      // Payday 3
      { name: "Auto Loan", amount: cfg.auto, payday: "Payday 3", day: 18, icon: "🚘", cat: "Auto Loan / Maintenance" },
      { name: "Spotify Family", amount: cfg.spotify, payday: "Payday 3", day: 20, icon: "🎵", cat: "Streaming (Netflix/Hulu)" },
      { name: "City of Columbus Water", amount: cfg.water, payday: "Payday 3", day: 21, icon: "💧", cat: "Water / Trash" },

      // Payday 4
      { name: "Student Loan (FedLoan)", amount: cfg.student, payday: "Payday 4", day: 25, icon: "🎓", cat: "Debt Payoff" },
      { name: "Chase Freedom Payment", amount: cfg.card, payday: "Payday 4", day: 27, icon: "💳", cat: "Credit Card Payment" },
      { name: "Verizon Wireless", amount: 82.00, payday: "Payday 4", day: 28, icon: "📱", cat: "Phone / Mobile" }
    ];

    billsForMonth.forEach((b, idx) => {
      historicalBills.push({
        id: `hb_${m}_${idx}`,
        name: b.name,
        amount: b.amount,
        isPaid: true,
        isOverdue: false,
        payday: b.payday,
        rawDate: formatIso(currentYear, m, b.day),
        date: b.day,
        fullDate: formatDisplayDate(currentYear, m, b.day),
        icon: b.icon,
        category: b.cat,
        hasReminder: false,
        paidAmount: b.amount,
        linkedTxId: `tx_hist_b_${m}_${idx}`,
        paidFromAccountId: "acc1",
        settledDate: formatDisplayDate(currentYear, m, b.day)
      });
    });
  }
});

export const demoBills = [...currentMonthBills, ...historicalBills];

// ==========================================
// 4. TRANSACTIONS FEED (DYNAMIC TODAY + HISTORICAL MONTHLY PAYROLLS & SETTLEMENTS)
// ==========================================
const historicalTransactions = [];

// Populate 4 weekly payroll deposits + extra income sources for Jan - Jul to feed the Overview Cards & Leaderboard
const pastMonthIncomes = [
  { m: 0, salary: 950, extra: [{ name: "New Year Sign-On Retainer", amt: 500, day: 5, cat: "Bonuses & Tips", icon: "🤝" }] },
  { m: 1, salary: 0,   extra: [{ name: "Ohio Advisory Retainer", amt: 350, day: 20, cat: "Consulting & Advisory", icon: "💼" }] },
  { m: 2, salary: 950, extra: [{ name: "IRS Federal Tax Refund", amt: 2450, day: 20, cat: "Tax Refund", icon: "💵" }, { name: "Q1 Performance Bonus", amt: 1200, day: 30, cat: "Bonuses & Tips", icon: "🏆" }] },
  { m: 3, salary: 950, extra: [{ name: "Etsy Digital Art Sales", amt: 320, day: 22, cat: "Side Hustle & Freelance", icon: "✨" }, { name: "Reimbursement & Stipend", amt: 180, day: 28, cat: "Other Income", icon: "🪙" }] },
  { m: 4, salary: 950, extra: [{ name: "Chase Sapphire Cashback", amt: 95, day: 25, cat: "Cashback & Bonuses", icon: "💳" }] },
  { m: 5, salary: 950, extra: [{ name: "Vanguard Dividend Yield", amt: 145, day: 28, cat: "Dividends & Capital Gains", icon: "📈" }] },
  { m: 6, salary: 950, extra: [{ name: "Freelance UI Retainer", amt: 850, day: 20, cat: "Side Hustle & Freelance", icon: "🎨" }] }
];

pastMonthIncomes.forEach(incCfg => {
  if (incCfg.m < currentMonth) {
    // 4 Weekly Salary Paydays
    if (incCfg.salary > 0) {
      [7, 14, 21, 28].forEach((pDay, pIdx) => {
        historicalTransactions.push({
          id: `h_pay_${incCfg.m}_${pIdx}`,
          name: "Employer Payroll Direct Deposit",
          amount: incCfg.salary,
          type: "Income",
          date: `${formatDisplayDate(currentYear, incCfg.m, pDay)}, 6:00 AM`,
          rawDate: formatIsoMidday(currentYear, incCfg.m, pDay),
          icon: "💻",
          category: "Primary Salary",
          accountId: "acc1"
        });
      });
    }

    // Additional categorized income streams
    incCfg.extra.forEach((ext, eIdx) => {
      historicalTransactions.push({
        id: `h_ext_${incCfg.m}_${eIdx}`,
        name: ext.name,
        amount: ext.amt,
        type: "Income",
        date: `${formatDisplayDate(currentYear, incCfg.m, ext.day)}, 11:00 AM`,
        rawDate: formatIsoMidday(currentYear, incCfg.m, ext.day),
        icon: ext.icon,
        category: ext.cat,
        accountId: "acc1"
      });
    });
  }
});

// Link historical settled bill transactions so expense sums balance out
historicalBills.forEach(hb => {
  historicalTransactions.push({
    id: hb.linkedTxId,
    name: hb.name,
    amount: hb.amount,
    type: "Expense",
    date: `${hb.fullDate}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, new Date(hb.rawDate).getMonth(), hb.date),
    icon: hb.icon,
    category: hb.category,
    accountId: hb.paidFromAccountId,
    isBillPayment: true
  });
});

export const demoTransactions = [
  // --- GUARANTEED TODAY TRANSACTIONS ---
  {
    id: "t_today_1",
    name: "Kroger (Short North Fresh Market)",
    amount: 68.40,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, currentDay)}, 2:15 PM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, currentDay),
    icon: "🛒",
    category: "Groceries",
    accountId: "acc1"
  },
  {
    id: "t_today_2",
    name: "Fox in the Snow (Italian Village)",
    amount: 12.50,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, currentDay)}, 9:30 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, currentDay),
    icon: "☕",
    category: "Dining Out",
    accountId: "acc1"
  },

  // --- Current Month Active Live Receipts ---
  {
    id: "t_cur_1",
    name: "Speedway (High St Fuel)",
    amount: 38.50,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, Math.max(1, currentDay - 1))}, 8:15 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, Math.max(1, currentDay - 1)),
    icon: "⛽",
    category: "Gas / Fuel",
    accountId: "acc4"
  },
  {
    id: "t_cur_2",
    name: "Employer Payroll Direct Deposit",
    amount: 950.00,
    type: "Income",
    date: `${formatDisplayDate(currentYear, currentMonth, Math.max(1, currentDay - 1))}, 6:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, Math.max(1, currentDay - 1)),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "t_cur_3",
    name: "Condado Tacos (Short North)",
    amount: 32.75,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, Math.max(1, currentDay - 3))}, 7:20 PM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, Math.max(1, currentDay - 3)),
    icon: "🌮",
    category: "Dining Out",
    accountId: "acc4"
  },

  // --- Current Month Settled Bill Records ---
  {
    id: "tx_demo_verizon",
    name: "Verizon Wireless",
    amount: 82.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 14)}, 9:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 14),
    icon: "📱",
    category: "Phone / Mobile",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_spotify",
    name: "Spotify Family",
    amount: 16.99,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 14)}, 8:30 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 14),
    icon: "🎵",
    category: "Streaming (Netflix/Hulu)",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_netflix",
    name: "Netflix Premium",
    amount: 15.99,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 13)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 13),
    icon: "🍿",
    category: "Streaming (Netflix/Hulu)",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_pf",
    name: "Planet Fitness (Grandview)",
    amount: 24.99,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 12)}, 7:30 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 12),
    icon: "🏋️",
    category: "Health & Fitness",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_parking",
    name: "Columbus Parking Garage Pass",
    amount: 85.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 10)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 10),
    icon: "🅿️",
    category: "Auto Loan / Maintenance",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_prog",
    name: "Progressive Auto Insurance",
    amount: 112.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 7)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 7),
    icon: "🚗",
    category: "Auto Loan / Maintenance",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_spectrum",
    name: "Spectrum Internet",
    amount: 79.99,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 7)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 7),
    icon: "📶",
    category: "Internet / Wi-Fi",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_gas",
    name: "Columbia Gas of Ohio",
    amount: 58.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 6)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 6),
    icon: "🔥",
    category: "Electric / Gas",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_aep",
    name: "AEP Ohio (Electric)",
    amount: 118.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 4)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 4),
    icon: "⚡",
    category: "Electric / Gas",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_rent",
    name: "Short North Apartment Rent",
    amount: 1275.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 1)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 1),
    icon: "🏠",
    category: "Rent / Mortgage",
    accountId: "acc1",
    isBillPayment: true
  },

  ...historicalTransactions
];

// ==========================================
// 5. TO-DO LIST (10 ITEMS: 5 TASKS / 5 SHOPPING)
// ==========================================
export const demoTodos = [
  // --- 5 TASKS (1 Completed) ---
  { id: "td1", text: "Transfer $150 to 2019 Cadillac XTS fund", priority: 5, type: "task", isCompleted: true },
  { id: "td2", text: "Review AEP Ohio electric statement before Payday 3", priority: 4, type: "task", isCompleted: false },
  { id: "td3", text: "Submit quarterly receipts for business tax audit", priority: 3, type: "task", isCompleted: false },
  { id: "td4", text: "Schedule routine oil change at Byers Dublin", priority: 2, type: "task", isCompleted: false },
  { id: "td5", text: "Verify Fidelity 401(k) employer match percentage", priority: 1, type: "task", isCompleted: false },

  // --- 5 SHOPPING / TO-BUYS (1 Completed) ---
  { id: "td6", text: "Target (Graceland): Household essentials & HVAC filters", priority: 4, type: "shopping", isCompleted: true },
  { id: "td7", text: "Kroger on High St: Weekly meal prep & fresh groceries", priority: 5, type: "shopping", isCompleted: false },
  { id: "td8", text: "Giant Eagle Market District: Specialty coffee beans", priority: 3, type: "shopping", isCompleted: false },
  { id: "td9", text: "Costco (Polaris): Paper goods & bulk household items", priority: 2, type: "shopping", isCompleted: false },
  { id: "td10", text: "Easton Town Center: Pick up birthday gift", priority: 1, type: "shopping", isCompleted: false }
];
