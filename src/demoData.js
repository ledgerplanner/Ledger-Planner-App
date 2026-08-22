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
const formatIsoToday = (year, monthIdx, day) => {
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
// 3. BILLS & PLANS (CURRENT ACTIVE + HISTORICAL MONTHLY OVERVIEWS)
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

// --- HISTORICAL SETTLED BILLS (Generates 100% Paid Overviews for Jan – Jul) ---
const historicalBills = [];
const pastMonthTemplates = [
  { name: "Short North Apartment Rent", amount: 1275.00, icon: "🏠", category: "Rent / Mortgage", day: 1 },
  { name: "AEP Ohio (Electric)", amount: 114.50, icon: "⚡", category: "Electric / Gas", day: 4 },
  { name: "Columbia Gas of Ohio", amount: 62.00, icon: "🔥", category: "Electric / Gas", day: 6 },
  { name: "Spectrum Internet", amount: 79.99, icon: "📶", category: "Internet / Wi-Fi", day: 7 },
  { name: "Progressive Auto Insurance", amount: 112.00, icon: "🚗", category: "Auto Loan / Maintenance", day: 7 },
  { name: "Auto Loan Note", amount: 295.00, icon: "🚘", category: "Auto Loan / Maintenance", day: 20 },
  { name: "Student Loan", amount: 165.00, icon: "🎓", category: "Debt Payoff", day: 22 },
  { name: "Verizon Wireless", amount: 82.00, icon: "📱", category: "Phone / Mobile", day: 24 }
];

for (let m = 0; m < currentMonth; m++) {
  pastMonthTemplates.forEach((tmpl, idx) => {
    historicalBills.push({
      id: `hb_${m}_${idx}`,
      name: tmpl.name,
      amount: tmpl.amount,
      isPaid: true,
      isOverdue: false,
      payday: "Payday 1",
      rawDate: formatIso(currentYear, m, tmpl.day),
      date: tmpl.day,
      fullDate: formatDisplayDate(currentYear, m, tmpl.day),
      icon: tmpl.icon,
      category: tmpl.category,
      hasReminder: false,
      paidAmount: tmpl.amount,
      linkedTxId: `tx_hist_${m}_${idx}`,
      paidFromAccountId: "acc1",
      settledDate: formatDisplayDate(currentYear, m, tmpl.day)
    });
  });
}

export const demoBills = [...currentMonthBills, ...historicalBills];

// ==========================================
// 4. TRANSACTIONS FEED (DYNAMIC TODAY + MULTI-CATEGORY INFLOWS + ROLLERCOASTER TRENDLINE)
// ==========================================
export const demoTransactions = [
  // --- GUARANTEED TODAY TRANSACTIONS ---
  {
    id: "t_today_1",
    name: "Kroger (Short North Fresh Market)",
    amount: 68.40,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, currentDay)}, 2:15 PM`,
    rawDate: formatIsoToday(currentYear, currentMonth, currentDay),
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
    rawDate: formatIsoToday(currentYear, currentMonth, currentDay),
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
    rawDate: formatIsoToday(currentYear, currentMonth, Math.max(1, currentDay - 1)),
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
    rawDate: formatIsoToday(currentYear, currentMonth, Math.max(1, currentDay - 1)),
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
    rawDate: formatIsoToday(currentYear, currentMonth, Math.max(1, currentDay - 3)),
    icon: "🌮",
    category: "Dining Out",
    accountId: "acc4"
  },

  // --- Settled Bill Records (Linked to Paid Bills) ---
  {
    id: "tx_demo_verizon",
    name: "Verizon Wireless",
    amount: 82.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 14)}, 9:00 AM`,
    rawDate: formatIsoToday(currentYear, currentMonth, 14),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 14),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 13),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 12),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 10),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 7),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 7),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 6),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 4),
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
    rawDate: formatIsoToday(currentYear, currentMonth, 1),
    icon: "🏠",
    category: "Rent / Mortgage",
    accountId: "acc1",
    isBillPayment: true
  },

  // ==========================================
  // MULTI-CATEGORY INFLOWS & HISTORICAL CALCULATION
  // ==========================================
  
  // --- JULY (Summer Rebound Peak) ---
  {
    id: "h_jul_inc_1",
    name: "Primary Salary",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 6, 15),
    rawDate: formatIsoToday(currentYear, 6, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_jul_inc_2",
    name: "Freelance UI & Web Retainer",
    amount: 850.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 6, 20),
    rawDate: formatIsoToday(currentYear, 6, 20),
    icon: "🎨",
    category: "Side Hustle & Freelance",
    accountId: "acc1"
  },
  {
    id: "h_jul_exp_1",
    name: "Summer Living & Utility Outflows",
    amount: 1400.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 6, 4),
    rawDate: formatIsoToday(currentYear, 6, 4),
    icon: "🎆",
    category: "Entertainment",
    accountId: "acc4"
  },

  // --- JUNE (Vacation Outflow Valley) ---
  {
    id: "h_jun_inc_1",
    name: "Primary Salary",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 5, 15),
    rawDate: formatIsoToday(currentYear, 5, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_jun_inc_2",
    name: "Vanguard Quarterly Dividend Yield",
    amount: 145.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 5, 28),
    rawDate: formatIsoToday(currentYear, 5, 28),
    icon: "📈",
    category: "Dividends & Capital Gains",
    accountId: "acc3"
  },
  {
    id: "h_jun_exp_1",
    name: "Lake Erie Summer Getaway & Hotel",
    amount: 2150.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 5, 18),
    rawDate: formatIsoToday(currentYear, 5, 18),
    icon: "🏖️",
    category: "Travel & Vacations",
    accountId: "acc1"
  },
  {
    id: "h_jun_exp_2",
    name: "Easton Town Center Shopping",
    amount: 620.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 5, 22),
    rawDate: formatIsoToday(currentYear, 5, 22),
    icon: "🛍️",
    category: "Shopping",
    accountId: "acc4"
  },

  // --- MAY (Steady Ascent) ---
  {
    id: "h_may_inc_1",
    name: "Primary Salary",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 4, 15),
    rawDate: formatIsoToday(currentYear, 4, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_may_inc_2",
    name: "Chase Sapphire Cashback Rewards",
    amount: 95.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 4, 25),
    rawDate: formatIsoToday(currentYear, 4, 25),
    icon: "💳",
    category: "Cashback & Bonuses",
    accountId: "acc1"
  },
  {
    id: "h_may_exp_1",
    name: "Home Depot (Patio & Home Essentials)",
    amount: 750.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 4, 10),
    rawDate: formatIsoToday(currentYear, 4, 10),
    icon: "🛠️",
    category: "Home Improvement",
    accountId: "acc1"
  },

  // --- APRIL (Spring Inflow Climb) ---
  {
    id: "h_apr_inc_1",
    name: "Primary Salary",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 3, 15),
    rawDate: formatIsoToday(currentYear, 3, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_apr_inc_2",
    name: "Etsy Digital Art Sales",
    amount: 320.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 3, 22),
    rawDate: formatIsoToday(currentYear, 3, 22),
    icon: "✨",
    category: "Side Hustle & Freelance",
    accountId: "acc1"
  },
  {
    id: "h_apr_inc_3",
    name: "Reimbursement & Stipend",
    amount: 180.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 3, 28),
    rawDate: formatIsoToday(currentYear, 3, 28),
    icon: "🪙",
    category: "Other Income",
    accountId: "acc1"
  },
  {
    id: "h_apr_exp_1",
    name: "Spring Auto Maintenance",
    amount: 620.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 3, 18),
    rawDate: formatIsoToday(currentYear, 3, 18),
    icon: "🚗",
    category: "Auto Loan / Maintenance",
    accountId: "acc1"
  },

  // --- MARCH ($0.00 VALLEY - Exact Net Delta Zeroes Out Balance) ---
  {
    id: "h_mar_inc_1",
    name: "IRS Federal Tax Refund",
    amount: 2450.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 2, 20),
    rawDate: formatIsoToday(currentYear, 2, 20),
    icon: "💵",
    category: "Tax Refund",
    accountId: "acc1"
  },
  {
    id: "h_mar_inc_2",
    name: "Q1 Performance Bonus",
    amount: 1200.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 2, 30),
    rawDate: formatIsoToday(currentYear, 2, 30),
    icon: "🏆",
    category: "Bonuses & Tips",
    accountId: "acc1"
  },
  {
    id: "h_mar_exp_1",
    name: "Emergency Medical & Major Repair Deduction",
    amount: 11000.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 2, 12),
    rawDate: formatIsoToday(currentYear, 2, 12),
    icon: "🏥",
    category: "Medical & Healthcare",
    accountId: "acc1"
  },

  // --- FEBRUARY ($0.00 VALLEY - Career Transition / Layoff) ---
  {
    id: "h_feb_inc_1",
    name: "Ohio Advisory Retainer",
    amount: 350.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 1, 20),
    rawDate: formatIsoToday(currentYear, 1, 20),
    icon: "💼",
    category: "Consulting & Advisory",
    accountId: "acc1"
  },
  {
    id: "h_feb_exp_1",
    name: "Emergency Reserve Outflow Drainage",
    amount: 350.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 1, 5),
    rawDate: formatIsoToday(currentYear, 1, 5),
    icon: "🏠",
    category: "Rent / Mortgage",
    accountId: "acc1"
  },

  // --- JANUARY (Baseline Beginning of Year Record) ---
  {
    id: "h_jan_inc_1",
    name: "Primary Salary",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 0, 15),
    rawDate: formatIsoToday(currentYear, 0, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_jan_inc_2",
    name: "New Year Sign-On Retainer",
    amount: 500.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 0, 5),
    rawDate: formatIsoToday(currentYear, 0, 5),
    icon: "🤝",
    category: "Bonuses & Tips",
    accountId: "acc1"
  },
  {
    id: "h_jan_exp_1",
    name: "Post-Holiday Catch-up Bills",
    amount: 1650.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 0, 12),
    rawDate: formatIsoToday(currentYear, 0, 12),
    icon: "💳",
    category: "Credit Card Payment",
    accountId: "acc1"
  }
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
