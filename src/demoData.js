// src/demoData.js

export const demoAccounts = [
  { id: "acc1", name: "Chase Checking", type: "Checking", balance: 1850.50 },
  { id: "acc2", name: "High-Yield Savings", type: "Savings", balance: 4500.00 },
  { id: "acc3", name: "Company 401k", type: "Investment", balance: 14250.00 },
  { id: "acc4", name: "Capital One Quicksilver", type: "Credit", balance: -345.20 }
];

export const demoBills = [
  { id: "b1", name: "Rent/Mortgage", amount: 1250.00, isPaid: false, isOverdue: true, payday: "Due Now", fullDate: "Apr 1", icon: "🏠" },
  { id: "b2", name: "AEP Ohio - Electric", amount: 115.00, isPaid: false, isOverdue: false, payday: "Payday 1", fullDate: "Apr 5", icon: "⚡" },
  { id: "b3", name: "Spectrum Internet", amount: 75.00, isPaid: false, isOverdue: false, payday: "Payday 1", fullDate: "Apr 10", icon: "📺" },
  { id: "b4", name: "FastCash Payday Loan", amount: 185.00, isPaid: false, isOverdue: false, payday: "Payday 1", fullDate: "Apr 12", icon: "💸", isInstallment: true, paidAmount: 185, totalAmount: 750 },
  { id: "b5", name: "Progressive Auto Ins", amount: 110.00, isPaid: false, isOverdue: false, payday: "Payday 1", fullDate: "Apr 15", icon: "🚗" },
  { id: "b6", name: "Auto Loan", amount: 350.00, isPaid: false, isOverdue: false, payday: "Payday 2", fullDate: "Apr 20", icon: "🚘", isInstallment: true, paidAmount: 6500, totalAmount: 18000 },
  { id: "b7", name: "Student Loan", amount: 210.00, isPaid: false, isOverdue: false, payday: "Payday 2", fullDate: "Apr 24", icon: "🎓", isInstallment: true, paidAmount: 4200, totalAmount: 24000 },
  { id: "b8", name: "Netflix", amount: 15.99, isPaid: false, isOverdue: false, payday: "Payday 2", fullDate: "Apr 28", icon: "🍿", isRecurring: true }
];

export const demoTransactions = [
  { id: "t1", name: "Meijer / Kroger", amount: 145.30, type: "Expense", date: "TODAY, 9:15 AM", icon: "🛒" },
  { id: "t2", name: "Direct Deposit", amount: 2121.00, type: "Income", date: "YESTERDAY", icon: "💻" },
  { id: "t3", name: "Speedway / Sheetz", amount: 42.00, type: "Expense", date: "APR 2", icon: "⛽" },
  { id: "t4", name: "Condado Tacos", amount: 35.75, type: "Expense", date: "APR 1", icon: "🌮" }
];

export const demoTodos = [
  { id: "td1", text: "Cancel unused streaming service", priority: 3, isCompleted: false },
  { id: "td2", text: "Pick up dry cleaning", priority: 2, isCompleted: false }
];

export const demoPaydayConfig = {
  "Payday 1": { date: "2026-04-05", income: "2121" },
  "Payday 2": { date: "2026-04-20", income: "2121" }
};
