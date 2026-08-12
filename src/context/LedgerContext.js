import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // === ONBOARDING TOUR ENGINE STATE ===
  const [isTourActive, setIsTourActive] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lp_tour_completed");
      return saved ? !JSON.parse(saved) : false;
    }
    return false;
  });

  const [currentTourStep, setCurrentTourStep] = useState(1);

  const startTour = () => {
    setCurrentTourStep(1);
    setIsTourActive(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("lp_tour_completed", JSON.stringify(false));
    }
  };

  const skipTour = () => {
    setIsTourActive(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("lp_tour_completed", JSON.stringify(true));
    }
  };

  const advanceTour = (stepId) => {
    setCurrentTourStep(stepId);
  };

  const completeTourStep = (stepId) => {
    if (stepId === 1) setCurrentTourStep(2);
    else if (stepId === 2) setCurrentTourStep('3A');
    else if (stepId === '3A') setCurrentTourStep('3B');
    else if (stepId === '3B') setCurrentTourStep('3C');
    else if (stepId === '3C') {
      setIsTourActive(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("lp_tour_completed", JSON.stringify(true));
      }
    }
  };

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

  // === GLOBAL PREFERENCES (With Permanent Memory) ===
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [signatureColor, setSignatureColor] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lp_signature_color");
      if (saved) return saved;
    }
    return "#1877F2";
  });

  const [currentCurrency, setCurrentCurrency] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lp_currency");
      if (saved) return saved;
    }
    return "USD ($)";
  });

  // SYNC THEME & CURRENCY PREFERENCES TO LOCAL STORAGE
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lp_signature_color", signatureColor);
    }
  }, [signatureColor]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lp_currency", currentCurrency);
    }
  }, [currentCurrency]);

  // DERIVE DYNAMIC SYMBOL FOR GLOBAL APP-WIDE CONSUMPTION
  const currencySymbol = (() => {
    if (currentCurrency.includes("€")) return "€";
    if (currentCurrency.includes("£")) return "£";
    if (currentCurrency.includes("¥")) return "¥";
    return "$";
  })();

  // === INJECTED ENTREPRENEUR MODE STATE (With Permanent Memory) ===
  const [isEntrepreneurMode, setIsEntrepreneurMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lp_entrepreneur_mode");
      if (saved) return JSON.parse(saved);
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lp_entrepreneur_mode", JSON.stringify(isEntrepreneurMode));
    }
  }, [isEntrepreneurMode]);

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

  // Memory Notebook Loaders
  const [recentBillCategories, setRecentBillCategories] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lp_recent_bill_cat");
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
  
  const [recentIncomeCategories, setRecentIncomeCategories] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lp_recent_inc_cat");
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
  
  const [recentExpenseCategories, setRecentExpenseCategories] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lp_recent_exp_cat");
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // === THE GLOBAL NERVOUS SYSTEM PAYLOAD ===
  const value = {
    user, setUser,
    isDemoMode, setIsDemoMode,
    isTourActive, setIsTourActive,
    currentTourStep, setCurrentTourStep,
    startTour, skipTour, advanceTour, completeTourStep,
    bills, setBills,
    transactions, setTransactions,
    accounts, setAccounts,
    todos, setTodos,
    paydayConfig, setPaydayConfig,
    isDarkMode, setIsDarkMode,
    signatureColor, setSignatureColor,
    currentCurrency, setCurrentCurrency,
    currencySymbol,
    isEntrepreneurMode, setIsEntrepreneurMode,
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
