// src/demoData.js

// DYNAMIC DATE ENGINE: Anchors demo sandbox to the live local date
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-indexed (e.g. 8 = September)
const currentDay = now.getDate(); // Exact active day for guaranteed dynamic calendar matching

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
// 1. ACCOUNTS & SAVINGS GOALS (REALISTIC COLUMBUS ARCHETYPE)
// ==========================================
export const demoAccounts = [
  { id: "acc1", name: "Huntington Checking", type: "Checking", balance: 2450.50, icon: "🏦" },
  { id: "acc2", name: "Cash Reserve", type: "Cash", balance: 400.00, icon: "💵" },
  { id: "acc3", name: "Emergency High-Yield Savings", type: "Savings", balance: 4850.00, isGoal: true, icon: "📈" },
  { id: "acc4", name: "Chase Freedom Unlimited", type: "Credit", balance: -312.40, icon: "💳" },
  { id: "acc5", name: "Fidelity 401(k)", type: "Investment", balance: 18400.00, isGoal: true, icon: "🌴" },
  { id: "acc6", name: "2019 Cadillac XTS", type: "Goal", balance: 6800.00, targetAmount: 14500.00, isGoal: true, icon: "🚘" }
];

// ==========================================
// 2. 4-WEEK PAYDAY CONFIGURATION (CALIBRATED TO ~$45K - $50K NET)
// ==========================================
export const demoPaydayConfig = {
  frequency: "Weekly",
  "Payday 1": { date: formatIso(currentYear, currentMonth, 7), income: "850" },
  "Payday 2": { date: formatIso(currentYear, currentMonth, 14), income: "850" },
  "Payday 3": { date: formatIso(currentYear, currentMonth, 21), income: "850" },
  "Payday 4": { date: formatIso(currentYear, currentMonth, 28), income: "850" },
  "Payday 5": { date: "", income: "" }
};

// ==========================================
// 3. BILLS & PLANS (EXACT 50% RATIO: 6 PAID / 6 UNPAID ACROSS ALL 4 WEEKS)
// ==========================================
const currentMonthBills = [
  // --- WEEK 1 / PAYDAY 1 (PAID: 3/3) ---
  {
    id: "b1",
    name: "Short North Apartment Rent",
    amount: 1150.00,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 1",
    rawDate: formatIso(currentYear, currentMonth, 1),
    date: 1,
    fullDate: formatDisplayDate(currentYear, currentMonth, 1),
    icon: "🏠",
    category: "Rent / Mortgage",
    hasReminder: false,
    paidAmount: 1150.00,
    linkedTxId: "tx_demo_rent",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 1)
  },
  {
    id: "b2",
    name: "City of Columbus Water & Sewer",
    amount: 58.20,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 1",
    rawDate: formatIso(currentYear, currentMonth, 3),
    date: 3,
    fullDate: formatDisplayDate(currentYear, currentMonth, 3),
    icon: "💧",
    category: "Water / Trash",
    hasReminder: false,
    paidAmount: 58.20,
    linkedTxId: "tx_demo_water",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 3)
  },
  {
    id: "b3",
    name: "Spectrum Internet",
    amount: 79.99,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 1",
    rawDate: formatIso(currentYear, currentMonth, 6),
    date: 6,
    fullDate: formatDisplayDate(currentYear, currentMonth, 6),
    icon: "📶",
    category: "Internet / Wi-Fi",
    hasReminder: false,
    paidAmount: 79.99,
    linkedTxId: "tx_demo_spectrum",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 6)
  },

  // --- WEEK 2 / PAYDAY 2 (PAID: 3/3) ---
  {
    id: "b4",
    name: "Progressive Auto Insurance",
    amount: 115.00,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 2",
    rawDate: formatIso(currentYear, currentMonth, 9),
    date: 9,
    fullDate: formatDisplayDate(currentYear, currentMonth, 9),
    icon: "🚗",
    category: "Auto Loan / Maintenance",
    hasReminder: false,
    paidAmount: 115.00,
    linkedTxId: "tx_demo_prog",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 9)
  },
  {
    id: "b5",
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
    id: "b6",
    name: "Spotify & Netflix Bundle",
    amount: 32.98,
    isPaid: true,
    isOverdue: false,
    payday: "Payday 2",
    rawDate: formatIso(currentYear, currentMonth, 14),
    date: 14,
    fullDate: formatDisplayDate(currentYear, currentMonth, 14),
    icon: "🍿",
    isRecurring: true,
    category: "Streaming (Netflix/Hulu)",
    hasReminder: false,
    paidAmount: 32.98,
    linkedTxId: "tx_demo_stream",
    paidFromAccountId: "acc1",
    settledDate: formatDisplayDate(currentYear, currentMonth, 14)
  },

  // --- WEEK 3 / PAYDAY 3 (UNPAID: 0/3 — INCLUDES DYNAMIC "DUE TOMORROW" BILL) ---
  {
    id: "b7",
    name: "AEP Ohio (Electric)",
    amount: 124.50,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 3",
    rawDate: formatIso(currentYear, currentMonth, currentDay + 1),
    date: currentDay + 1,
    fullDate: formatDisplayDate(currentYear, currentMonth, currentDay + 1),
    icon: "⚡",
    category: "Electric / Gas",
    hasReminder: true,
    reminderDays: 1
  },
  {
    id: "b8",
    name: "Columbia Gas of Ohio",
    amount: 64.20,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 3",
    rawDate: formatIso(currentYear, currentMonth, 18),
    date: 18,
    fullDate: formatDisplayDate(currentYear, currentMonth, 18),
    icon: "🔥",
    category: "Electric / Gas",
    hasReminder: true,
    reminderDays: 2
  },
  {
    id: "b9",
    name: "Auto Loan",
    amount: 285.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 3",
    rawDate: formatIso(currentYear, currentMonth, 20),
    date: 20,
    fullDate: formatDisplayDate(currentYear, currentMonth, 20),
    icon: "🚘",
    isInstallment: true,
    paidAmount: 5700.00,
    totalAmount: 14250.00,
    category: "Auto Loan / Maintenance",
    hasReminder: true,
    reminderDays: 2
  },

  // --- WEEK 4 / PAYDAY 4 (UNPAID: 0/3) ---
  {
    id: "b10",
    name: "Verizon Wireless",
    amount: 85.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 4",
    rawDate: formatIso(currentYear, currentMonth, 24),
    date: 24,
    fullDate: formatDisplayDate(currentYear, currentMonth, 24),
    icon: "📱",
    category: "Phone / Mobile",
    hasReminder: false
  },
  {
    id: "b11",
    name: "Student Loan (FedLoan)",
    amount: 145.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 4",
    rawDate: formatIso(currentYear, currentMonth, 26),
    date: 26,
    fullDate: formatDisplayDate(currentYear, currentMonth, 26),
    icon: "🎓",
    isInstallment: true,
    paidAmount: 3190.00,
    totalAmount: 11600.00,
    category: "Debt Payoff",
    hasReminder: true,
    reminderDays: 2
  },
  {
    id: "b12",
    name: "Chase Freedom Statement",
    amount: 95.00,
    isPaid: false,
    isOverdue: false,
    payday: "Payday 4",
    rawDate: formatIso(currentYear, currentMonth, 28),
    date: 28,
    fullDate: formatDisplayDate(currentYear, currentMonth, 28),
    icon: "💳",
    category: "Credit Card Payment",
    hasReminder: false
  }
];

// --- HISTORICAL BILL CONFIGURATIONS (JAN - AUG) ---
const historicalBills = [];

const pastMonthConfigs = [
  { monthIdx: 0, rent: 1150, aep: 146, gas: 122, stream: 32.98, gym: 24.99, auto: 285, student: 145, card: 120, water: 54 }, // Jan: Post-holiday winter pinch
  { monthIdx: 1, rent: 1150, aep: 138, gas: 116, stream: 32.98, gym: 24.99, auto: 285, student: 145, card: 80,  water: 52 }, // Feb: Recovering
  { monthIdx: 2, rent: 1150, aep: 104, gas: 84,  stream: 32.98, gym: 24.99, auto: 285, student: 145, card: 70,  water: 55 }, // Mar: Strong spring
  { monthIdx: 3, rent: 1150, aep: 92,  gas: 58,  stream: 32.98, gym: 24.99, auto: 285, student: 145, card: 85,  water: 56 }, // Apr: Moderate
  { monthIdx: 4, rent: 1150, aep: 98,  gas: 46,  stream: 32.98, gym: 24.99, auto: 285, student: 145, card: 160, water: 58 }, // May: Car maintenance dip
  { monthIdx: 5, rent: 1150, aep: 130, gas: 38,  stream: 32.98, gym: 24.99, auto: 285, student: 145, card: 95,  water: 57 }, // Jun: Rising AC utility
  { monthIdx: 6, rent: 1150, aep: 148, gas: 34,  stream: 32.98, gym: 24.99, auto: 285, student: 145, card: 90,  water: 58 }, // Jul: Summer surge
  { monthIdx: 7, rent: 1150, aep: 135, gas: 36,  stream: 32.98, gym: 24.99, auto: 285, student: 145, card: 75,  water: 56 }  // Aug: Balanced
];

pastMonthConfigs.forEach(cfg => {
  if (cfg.monthIdx < currentMonth) {
    const m = cfg.monthIdx;
    const billsForMonth = [
      { name: "Short North Apartment Rent", amount: cfg.rent, payday: "Payday 1", day: 1, icon: "🏠", cat: "Rent / Mortgage" },
      { name: "City of Columbus Water & Sewer", amount: cfg.water, payday: "Payday 1", day: 3, icon: "💧", cat: "Water / Trash" },
      { name: "Spectrum Internet", amount: 79.99, payday: "Payday 1", day: 6, icon: "📶", cat: "Internet / Wi-Fi" },
      { name: "Progressive Auto Insurance", amount: 115.00, payday: "Payday 2", day: 9, icon: "🚗", cat: "Auto Loan / Maintenance" },
      { name: "Planet Fitness (Grandview)", amount: cfg.gym, payday: "Payday 2", day: 12, icon: "🏋️", cat: "Health & Fitness" },
      { name: "Spotify & Netflix Bundle", amount: cfg.stream, payday: "Payday 2", day: 14, icon: "🍿", cat: "Streaming (Netflix/Hulu)" },
      { name: "AEP Ohio (Electric)", amount: cfg.aep, payday: "Payday 3", day: 16, icon: "⚡", cat: "Electric / Gas" },
      { name: "Columbia Gas of Ohio", amount: cfg.gas, payday: "Payday 3", day: 18, icon: "🔥", cat: "Electric / Gas" },
      { name: "Auto Loan", amount: cfg.auto, payday: "Payday 3", day: 20, icon: "🚘", cat: "Auto Loan / Maintenance" },
      { name: "Verizon Wireless", amount: 85.00, payday: "Payday 4", day: 24, icon: "📱", cat: "Phone / Mobile" },
      { name: "Student Loan (FedLoan)", amount: cfg.student, payday: "Payday 4", day: 26, icon: "🎓", cat: "Debt Payoff" },
      { name: "Chase Freedom Payment", amount: cfg.card, payday: "Payday 4", day: 28, icon: "💳", cat: "Credit Card Payment" }
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
// 4. TRANSACTIONS & CASH FLOW ENGINE (CREATING DYNAMIC PEAKS & VALLEYS)
// ==========================================
const historicalTransactions = [];

// Realistic Monthly Inflow Profiles for Visual Rhythm:
// - Jan: Valley (Base payroll, tight budget)
// - Feb: Modest recovery
// - Mar: PEAK (Federal Tax Refund +$1,850 + Q1 Bonus)
// - Apr: Steady
// - May: VALLEY (Dip from reduced hours & car repairs)
// - Jun: Climbing
// - Jul: PEAK (Ohio summer freelance UI project +$950)
// - Aug: Solid normalized plateau
const historicalInflowProfiles = [
  { m: 0, weeklyPay: 850, extra: [] }, // Jan ($3,400)
  { m: 1, weeklyPay: 850, extra: [{ name: "Market Research Honorarium", amt: 175, day: 18, cat: "Side Hustle & Freelance", icon: "🪙" }] }, // Feb ($3,575)
  { m: 2, weeklyPay: 850, extra: [{ name: "IRS Federal Tax Refund", amt: 1850, day: 19, cat: "Tax Refund", icon: "💵" }, { name: "Q1 Team Milestone Bonus", amt: 600, day: 30, cat: "Bonuses & Tips", icon: "🏆" }] }, // Mar ($5,850 - HUGE PEAK)
  { m: 3, weeklyPay: 850, extra: [{ name: "Reimbursement & Stipend", amt: 120, day: 22, cat: "Other Income", icon: "✨" }] }, // Apr ($3,520)
  { m: 4, weeklyPay: 700, extra: [] }, // May ($2,800 - VALLEY: Unpaid personal days)
  { m: 5, weeklyPay: 850, extra: [{ name: "Chase Sapphire Cashback", amt: 145, day: 25, cat: "Cashback & Bonuses", icon: "💳" }] }, // Jun ($3,545)
  { m: 6, weeklyPay: 850, extra: [{ name: "Freelance Creative Retainer", amt: 950, day: 15, cat: "Side Hustle & Freelance", icon: "🎨" }] }, // Jul ($4,350 - SUMMER SURGE)
  { m: 7, weeklyPay: 850, extra: [{ name: "Vanguard Dividend Yield", amt: 110, day: 28, cat: "Dividends & Capital Gains", icon: "📈" }] } // Aug ($3,510)
];

historicalInflowProfiles.forEach(profile => {
  if (profile.m < currentMonth) {
    // 4 Weekly Deposits
    [7, 14, 21, 28].forEach((pDay, pIdx) => {
      historicalTransactions.push({
        id: `h_pay_${profile.m}_${pIdx}`,
        name: "Employer Payroll Direct Deposit",
        amount: profile.weeklyPay,
        type: "Income",
        date: `${formatDisplayDate(currentYear, profile.m, pDay)}, 6:00 AM`,
        rawDate: formatIsoMidday(currentYear, profile.m, pDay),
        icon: "💻",
        category: "Primary Salary",
        accountId: "acc1"
      });
    });

    // Peak Inflow Events
    profile.extra.forEach((ext, eIdx) => {
      historicalTransactions.push({
        id: `h_ext_${profile.m}_${eIdx}`,
        name: ext.name,
        amount: ext.amt,
        type: "Income",
        date: `${formatDisplayDate(currentYear, profile.m, ext.day)}, 11:00 AM`,
        rawDate: formatIsoMidday(currentYear, profile.m, ext.day),
        icon: ext.icon,
        category: ext.cat,
        accountId: "acc1"
      });
    });
  }
});

// Link historical settled bill transactions so expense lines mirror bill outlays
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
  // --- GOAL VAULT CONTRIBUTION (PROOF OF SAVINGS PROGRESS) ---
  {
    id: "tx_goal_cadillac",
    name: "Transfer to 2019 Cadillac XTS Vault",
    amount: 150.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, currentDay)}, 11:15 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, currentDay),
    icon: "🚘",
    category: "Savings Goal Transfer",
    accountId: "acc1",
    isDirectGoalEntry: true
  },

  // --- RECENT GREEN INFLOW (+) ---
  {
    id: "t_today_inflow",
    name: "Employer Payroll Direct Deposit",
    amount: 850.00,
    type: "Income",
    date: `${formatDisplayDate(currentYear, currentMonth, Math.max(1, currentDay - 1))}, 6:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, Math.max(1, currentDay - 1)),
    icon: "💻",
    category: "Primary Salary",
    accountId: "acc1"
  },

  // --- RECENT BLUE BILL OUTFLOW (-) ---
  {
    id: "tx_demo_stream",
    name: "Spotify & Netflix Bundle",
    amount: 32.98,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 14)}, 8:30 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 14),
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

  // --- RECENT ORANGE VARIABLE SPENDING (-) ---
  {
    id: "t_today_var1",
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
    id: "t_today_var2",
    name: "Fox in the Snow (Italian Village)",
    amount: 12.50,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, currentDay)}, 9:30 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, currentDay),
    icon: "☕",
    category: "Dining Out",
    accountId: "acc1"
  },
  {
    id: "t_today_var3",
    name: "Speedway (High St Fuel)",
    amount: 38.50,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, Math.max(1, currentDay - 2))}, 8:15 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, Math.max(1, currentDay - 2)),
    icon: "⛽",
    category: "Gas / Fuel",
    accountId: "acc4"
  },

  // --- SETTLED MONTHLY FIXED BILLS (FOR RECENT ACTIVITY HISTORY) ---
  {
    id: "tx_demo_prog",
    name: "Progressive Auto Insurance",
    amount: 115.00,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 9)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 9),
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
    date: `${formatDisplayDate(currentYear, currentMonth, 6)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 6),
    icon: "📶",
    category: "Internet / Wi-Fi",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_water",
    name: "City of Columbus Water & Sewer",
    amount: 58.20,
    type: "Expense",
    date: `${formatDisplayDate(currentYear, currentMonth, 3)}, 8:00 AM`,
    rawDate: formatIsoMidday(currentYear, currentMonth, 3),
    icon: "💧",
    category: "Water / Trash",
    accountId: "acc1",
    isBillPayment: true
  },
  {
    id: "tx_demo_rent",
    name: "Short North Apartment Rent",
    amount: 1150.00,
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
  { id: "td1", text: "Stash $150 into 2019 Cadillac XTS Vault", priority: 5, type: "task", isCompleted: true },
  { id: "td2", text: "Review AEP Ohio electric statement before Payday 3", priority: 4, type: "task", isCompleted: false },
  { id: "td3", text: "Verify Huntington checking cash buffer", priority: 3, type: "task", isCompleted: false },
  { id: "td4", text: "Schedule routine oil change at Byers Dublin", priority: 2, type: "task", isCompleted: false },
  { id: "td5", text: "Confirm Fidelity 401(k) company match allocation", priority: 1, type: "task", isCompleted: false },

  { id: "td6", text: "Target (Graceland): Household cleaning & air filters", priority: 4, type: "shopping", isCompleted: true },
  { id: "td7", text: "Kroger on High St: Weekly meal prep & fresh groceries", priority: 5, type: "shopping", isCompleted: false },
  { id: "td8", text: "Giant Eagle Market District: Whole bean espresso blend", priority: 3, type: "shopping", isCompleted: false },
  { id: "td9", text: "Costco (Polaris): Paper goods & bulk household supplies", priority: 2, type: "shopping", isCompleted: false },
  { id: "td10", text: "Easton Town Center: Pick up birthday gift", priority: 1, type: "shopping", isCompleted: false }
];
