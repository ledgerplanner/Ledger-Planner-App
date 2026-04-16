// src/demoData.js

export const demoAccounts = [
  { id: "acc1", name: "Chase Checking", type: "Checking", balance: 1850.50, icon: "🏦" },
  { id: "acc2", name: "High-Yield Savings", type: "Savings", balance: 4500.00, icon: "📈" },
  { id: "acc3", name: "Company 401k", type: "Investment", balance: 14250.00, icon: "🌴" },
  { id: "acc4", name: "Capital One Quicksilver", type: "Credit", balance: -345.20, icon: "💳" }
];

export const demoBills = [
  { id: "b1", name: "Rent/Mortgage", amount: 1250.00, isPaid: false, isOverdue: true, payday: "Due Now", fullDate: "Apr 1", icon: "🏠", category: "Rent / Mortgage" },
  { id: "b2", name: "AEP Ohio - Electric", amount: 115.00, isPaid: false, isOverdue: false, payday: "Payday 1", fullDate: "Apr 5", icon: "⚡", category: "Electric / Gas" },
  
  // FIX: This bill is now completed
  { id: "b3", name: "Spectrum Internet", amount: 75.00, isPaid: true, isOverdue: false, payday: "Payday 1", fullDate: "Apr 10", icon: "📺", category: "Internet / Wi-Fi", paidAmount: 75, linkedTxId: "tx_demo_spectrum", paidFromAccountId: "acc1" },
  
  { id: "b4", name: "FastCash Payday Loan", amount: 185.00, isPaid: false, isOverdue: false, payday: "Payday 1", fullDate: "Apr 12", icon: "💸", isInstallment: true, paidAmount: 185, totalAmount: 750, category: "PayDay Loans" },
  { id: "b5", name: "Progressive Auto Ins", amount: 110.00, isPaid: false, isOverdue: false, payday: "Payday 1", fullDate: "Apr 15", icon: "🚗", category: "Auto Loan / Maintenance" },
  { id: "b6", name: "Auto Loan", amount: 350.00, isPaid: false, isOverdue: false, payday: "Payday 2", fullDate: "Apr 20", icon: "🚘", isInstallment: true, paidAmount: 6500, totalAmount: 18000, category: "Auto Loan / Maintenance" },
  { id: "b7", name: "Student Loan", amount: 210.00, isPaid: false, isOverdue: false, payday: "Payday 2", fullDate: "Apr 24", icon: "🎓", isInstallment: true, paidAmount: 4200, totalAmount: 24000, category: "Debt Payoff" },
  { id: "b8", name: "Netflix", amount: 15.99, isPaid: false, isOverdue: false, payday: "Payday 2", fullDate: "Apr 28", icon: "🍿", isRecurring: true, category: "Streaming (Netflix/Hulu)" }
];

export const demoTransactions = [
  { id: "t1", name: "Meijer / Kroger", amount: 145.30, type: "Expense", date: "TODAY, 9:15 AM", icon: "🛒", category: "Groceries", accountId: "acc1" },
  { id: "t2", name: "Direct Deposit", amount: 2121.00, type: "Income", date: "YESTERDAY", icon: "💻", category: "Primary Salary", accountId: "acc1" },
  { id: "t3", name: "Speedway / Sheetz", amount: 42.00, type: "Expense", date: "APR 2", icon: "⛽", category: "Gas / Fuel", accountId: "acc4" },
  { id: "t4", name: "Condado Tacos", amount: 35.75, type: "Expense", date: "APR 1", icon: "🌮", category: "Dining Out", accountId: "acc4" },
  { id: "tx_demo_spectrum", name: "Spectrum Internet", amount: 75.00, type: "Expense", date: "MAR 28, 2026", icon: "📺", category: "Internet / Wi-Fi", accountId: "acc1" }
];

export const demoTodos = [
  // Task Actions
  { id: "td1", text: "Move $200 to High-Yield Savings", priority: 5, type: "task", isCompleted: false },
  { id: "td2", text: "Cancel unused Peacock subscription", priority: 3, type: "task", isCompleted: false },
  { id: "td3", text: "Compare AEP Ohio rates for next month", priority: 2, type: "task", isCompleted: false },
  
  // FIX: Shopping Actions mapped to "shopping" instead of "buy"
  { id: "td4", text: "Meijer: Groceries for weekly meal prep", priority: 5, type: "shopping", isCompleted: false },
  { id: "td5", text: "Home Depot: HVAC Air Filters", priority: 3, type: "shopping", isCompleted: false },
  { id: "td6", text: "Amazon: New workout shoes", priority: 2, type: "shopping", isCompleted: false }
];

export const demoPaydayConfig = {
  "Payday 1": { date: "2026-04-05", income: "2121" },
  "Payday 2": { date: "2026-04-20", income: "2121" }
};
