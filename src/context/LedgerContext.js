import React, { createContext, useContext, useState } from 'react';

// 1. Initialize the Master Context Engine
const LedgerContext = createContext();

// 2. Export a custom hook for rapid data access across the app
export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error("useLedger must be used within a LedgerProvider");
  }
  return context;
};

// 3. The Centralized Provider Node
export const LedgerProvider = ({ children }) => {
  
  // === AUTH & SYSTEM STATE ===
  const [user, setUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // === PRIMARY LEDGER DATA ARRAYS ===
  const [bills, setBills] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [todos, setTodos] = useState([]);
  const [paydayConfig, setPaydayConfig] = useState({
    frequency: "Weekly",
    "Payday 1": { date: "", income: "" },
    "Payday 2": { date: "", income: "" },
    "Payday 3": { date: "", income: "" },
    "Payday 4": { date: "", income: "" },
    "Payday 5": { date: "", income: "" }
  });

  // === GLOBAL PREFERENCES ===
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [signatureColor, setSignatureColor] = useState("#1877F2");
  const [currentCurrency, setCurrentCurrency] = useState("USD ($)");

  // === TAXONOMY & CATEGORY MATRICES ===
  const [modernCategories, setModernCategories] = useState([
    { group: "Income & Wealth", items: ["Primary Salary", "Side Hustle / Gig", "Tips / Cash", "Investments / Crypto", "Transfers (Venmo/Zelle)", "Refunds & Adjustments", "Cash App", "PayDay Loans", "Unemployment", "Retirement / 401k", "Benefits", "My Goals"] },
    { group: "Housing & Utilities", items: ["Rent / Mortgage", "Electric / Gas", "Water / Trash", "Internet / Wi-Fi", "Home Goods / Maintenance", "Cell Phone"] },
    { group: "Transit & Travel", items: ["Gas / Fuel", "Rideshare (Uber/Lyft)", "Public Transit", "Auto Loan / Maintenance", "Parking / Tolls", "Airplane / Flights", "Hotel / Lodging", "Taxi / Car Rental"] },
    { group: "Food & Drink", items: ["Groceries", "Dining Out", "Delivery (DoorDash/Eats)", "Coffee / Tea", "Bars / Nightlife", "Convenient Store", "Fast Food", "Gas Station"] },
    { group: "Digital Life", items: ["Streaming (Netflix/Hulu)", "Music (Spotify/Apple)", "Software / Cloud", "Gaming", "Creators (Patreon/Twitch)", "Google Play Store", "Apple App Store"] },
    { group: "Shopping & Lifestyle", items: ["Amazon / E-commerce", "Clothing / Fashion", "Personal Care / Grooming", "Fitness / Gym", "Events / Concerts", "Pet Care", "Fun Recreation"] },
    { group: "Financial", items: ["Savings Transfer", "Credit Card Payment", "Debt Payoff", "Bank Fees / Interest"] },
    { group: "Health", items: ["Medical / Doctor", "Pharmacy / Rx", "Dental / Vision", "Therapy / Mental Health", "Health Insurance", "Fitness / Wellness"] },
    { group: "Entrepreneur", items: ["Domain / Hosting", "Software / SaaS", "AI Subscriptions", "Marketing & Ads", "Contractors & Freelancers", "Business Fees / LLC", "Office Supplies"] },
    { group: "Other", items: ["Miscellaneous Expense", "Charity / Gifts", "Other"] }
  ]);

  const [recentBillCategories, setRecentBillCategories] = useState([]);
  const [recentIncomeCategories, setRecentIncomeCategories] = useState([]);
  const [recentExpenseCategories, setRecentExpenseCategories] = useState([]);

  // === THE GLOBAL NERVOUS SYSTEM PAYLOAD ===
  const value = {
    user, setUser,
    isDemoMode, setIsDemoMode,
    bills, setBills,
    transactions, setTransactions,
    accounts, setAccounts,
    todos, setTodos,
    paydayConfig, setPaydayConfig,
    isDarkMode, setIsDarkMode,
    signatureColor, setSignatureColor,
    currentCurrency, setCurrentCurrency,
    modernCategories, setModernCategories,
    recentBillCategories, setRecentBillCategories,
    recentIncomeCategories, setRecentIncomeCategories,
    recentExpenseCategories, setRecentExpenseCategories
  };

  return (
    <LedgerContext.Provider value={value}>
      {children}
    </LedgerContext.Provider>
  );
};
