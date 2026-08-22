// src/demoData.js

// DYNAMIC DATE HELPER: Automatically anchors demo sandbox to the live current year & month
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-indexed (e.g. 7 = August)

const formatIso = (year, monthIdx, day) => {
  const m = String(monthIdx + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
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
// 3. BILLS & PLANS (20 TOTAL: 10 PAID / 50% GAUGE)
// ==========================================
export const demoBills = [
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
    rawDate: formatIso(currentYear, currentMonth, 22),
    date: 22,
    fullDate: formatDisplayDate(currentYear, currentMonth, 22),
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
    rawDate: formatIso(currentYear, currentMonth, 23),
    date: 23,
    fullDate: formatDisplayDate(currentYear, currentMonth, 23),
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

// ==========================================
// 4. TRANSACTIONS FEED (HISTORICAL & CURRENT LIVE AUDIT)
// ==========================================
export const demoTransactions = [
  // --- Current Month Active Live Receipts ---
  {
    id: "t_cur_1",
    name: "Kroger (Short North)",
    amount: 92.40,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 22)}, 3:45 PM`,
    rawDate: formatIso(currentYear, currentMonth, 22),
    icon: "🛒",
    category: "Groceries",
    accountId: "acc1"
  },
  {
    id: "t_cur_2",
    name: "Speedway (High St)",
    amount: 38.50,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 21)}, 8:15 AM`,
    rawDate: formatIso(currentYear, currentMonth, 21),
    icon: "⛽",
    category: "Gas / Fuel",
    accountId: "acc4"
  },
  {
    id: "t_cur_3",
    name: "Employer Payroll Direct Deposit",
    amount: 950.00,
    type: "Income",
    date: `${formatDisplayDate(currentYear, currentMonth, 21)}, 6:00 AM`,
    rawDate: formatIso(currentYear, currentMonth, 21),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "t_cur_4",
    name: "Condado Tacos",
    amount: 32.75,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 19)}, 7:20 PM`,
    rawDate: formatIso(currentYear, currentMonth, 19),
    icon: "🌮",
    category: "Dining Out",
    accountId: "acc4"
  },
  {
    id: "t_cur_5",
    name: "Fox in the Snow Cafe",
    amount: 14.25,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 18)}, 10:10 AM`,
    rawDate: formatIso(currentYear, currentMonth, 18),
    icon: "☕",
    category: "Dining Out",
    accountId: "acc1"
  },

  // --- Settled Bill Records (Linked to Paid Bills) ---
  {
    id: "tx_demo_verizon",
    name: "Verizon Wireless",
    amount: 82.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 14)}, 9:00 AM`,
    rawDate: formatIso(currentYear, currentMonth, 14),
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
    rawDate: formatIso(currentYear, currentMonth, 14),
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
    rawDate: formatIso(currentYear, currentMonth, 13),
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
    rawDate: formatIso(currentYear, currentMonth, 12),
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
    rawDate: formatIso(currentYear, currentMonth, 10),
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
    rawDate: formatIso(currentYear, currentMonth, 7),
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
    rawDate: formatIso(currentYear, currentMonth, 7),
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
    rawDate: formatIso(currentYear, currentMonth, 6),
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
    rawDate: formatIso(currentYear, currentMonth, 4),
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
    rawDate: formatIso(currentYear, currentMonth, 1),
    icon: "🏠",
    category: "Rent / Mortgage",
    accountId: "acc1",
    isBillPayment: true
  },

  // --- Historical Months (Jan - Jul) for Trendline Visuals ---
  {
    id: "h_jul_1",
    name: "Employer Payroll",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 6, 15),
    rawDate: formatIso(currentYear, 6, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_jul_2",
    name: "Red White & BOOM / Summer Festival",
    amount: 420.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 6, 4),
    rawDate: formatIso(currentYear, 6, 4),
    icon: "🎆",
    category: "Entertainment",
    accountId: "acc4"
  },
  {
    id: "h_jun_1",
    name: "Employer Payroll",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 5, 15),
    rawDate: formatIso(currentYear, 5, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_jun_2",
    name: "Easton Town Center Shopping",
    amount: 285.50,
    type: "Expense",
    date: formatDisplayDate(currentYear, 5, 18),
    rawDate: formatIso(currentYear, 5, 18),
    icon: "🛍️",
    category: "Shopping",
    accountId: "acc4"
  },
  {
    id: "h_may_1",
    name: "Employer Payroll",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 4, 15),
    rawDate: formatIso(currentYear, 4, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_may_2",
    name: "Home Depot (Yard & Household)",
    amount: 165.00,
    type: "Expense",
    date: formatDisplayDate(currentYear, 4, 10),
    rawDate: formatIso(currentYear, 4, 10),
    icon: "🛠️",
    category: "Home Improvement",
    accountId: "acc1"
  },
  {
    id: "h_apr_1",
    name: "Employer Payroll",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 3, 15),
    rawDate: formatIso(currentYear, 3, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_mar_1",
    name: "IRS Federal Tax Refund",
    amount: 1450.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 2, 20),
    rawDate: formatIso(currentYear, 2, 20),
    icon: "💵",
    category: "Tax Refund",
    accountId: "acc1"
  },
  {
    id: "h_mar_2",
    name: "Employer Payroll",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 2, 15),
    rawDate: formatIso(currentYear, 2, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_feb_1",
    name: "Employer Payroll",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 1, 15),
    rawDate: formatIso(currentYear, 1, 15),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },
  {
    id: "h_jan_1",
    name: "Employer Payroll",
    amount: 3800.00,
    type: "Income",
    date: formatDisplayDate(currentYear, 0, 15),
    rawDate: formatIso(currentYear, 0, 15),
    icon: "💻",
    category: "Primary Salary",
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
  { id: "td9", text: "Costco (Polaris): Paper goods & sparkling water bulk pack", priority: 2, type: "shopping", isCompleted: false },
  { id: "td10", text: "Easton Town Center: Pick up birthday gift", priority: 1, type: "shopping", isCompleted: false }
];
