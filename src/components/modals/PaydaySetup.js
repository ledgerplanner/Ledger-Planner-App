import React, { useState, useEffect } from 'react';
import { X, Save, Calendar as CalendarIcon, DollarSign, RefreshCw } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLedger } from '../../context/LedgerContext';

export default function PaydaySetup({ setIsPaydaySetupOpen }) {
  const { user, isDemoMode, isDarkMode, signatureColor, paydayConfig, setPaydayConfig } = useLedger();

  // Local State
  const [frequency, setFrequency] = useState("Weekly");
  const [paydays, setPaydays] = useState({
    "Payday 1": { date: "", income: "" },
    "Payday 2": { date: "", income: "" },
    "Payday 3": { date: "", income: "" },
    "Payday 4": { date: "", income: "" },
    "Payday 5": { date: "", income: "" }
  });

  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  const triggerHaptic = (pattern = 50) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  // Initialize from global config
  useEffect(() => {
    if (paydayConfig) {
      if (paydayConfig.frequency) setFrequency(paydayConfig.frequency);
      
      const loadedPaydays = { ...paydays };
      [1, 2, 3, 4, 5].forEach(num => {
        const key = `Payday ${num}`;
        if (paydayConfig[key]) {
          loadedPaydays[key] = {
            date: paydayConfig[key].date || "",
            income: paydayConfig[key].income || ""
          };
        }
      });
      setPaydays(loadedPaydays);
    }
  }, [paydayConfig]);

  const handlePaydayChange = (key, field, value) => {
    setPaydays(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    triggerHaptic(50);
    const newConfig = { frequency };
    
    // Clean and validate the data before saving
    Object.keys(paydays).forEach(key => {
      const pd = paydays[key];
      if (pd.date || pd.income) {
        newConfig[key] = {
          date: pd.date || "",
          income: parseFloat(pd.income) || 0
        };
      }
    });

    if (isDemoMode) {
      setPaydayConfig(newConfig);
    } else if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "settings", "paydayConfig"), newConfig, { merge: true });
      } catch (err) {
        console.error("Failed to save payday config:", err);
      }
    }
    
    setIsPaydaySetupOpen(false);
  };

  // Determine how many payday slots to show based on frequency
  let activeSlots = ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"];
  if (frequency === "Monthly") activeSlots = ["Payday 1"];
  if (frequency === "Semi-Monthly") activeSlots = ["Payday 1", "Payday 2"];
  if (frequency === "Bi-Weekly") activeSlots = ["Payday 1", "Payday 2", "Payday 3"];

  return (
    <div className="absolute inset-0 z-[140] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsPaydaySetupOpen(false)}></div>
      <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[150] flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border border-slate-700" : "bg-white border border-slate-100"}`}>
        
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
            <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Pay Schedule</h3>
          </div>
          <button onClick={() => setIsPaydaySetupOpen(false)} className={closeButtonClass}><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto hide-scrollbar flex-1 space-y-6">
          
          <div className="relative">
            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Pay Frequency</label>
            <select 
              value={frequency} 
              onChange={(e) => { triggerHaptic(15); setFrequency(e.target.value); }} 
              className={`w-full pt-6 pb-2 px-5 rounded-2xl border font-bold text-sm appearance-none outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white focus:border-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"}`}
            >
              <option value="Weekly">Weekly (Up to 5)</option>
              <option value="Bi-Weekly">Bi-Weekly (Up to 3)</option>
              <option value="Semi-Monthly">Semi-Monthly (2 Dates)</option>
              <option value="Monthly">Monthly (1 Date)</option>
            </select>
          </div>

          <div className="space-y-4">
            {activeSlots.map((pdKey) => (
              <div key={pdKey} className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100 shadow-sm"}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{pdKey}</h4>
                <div className="grid grid-cols-2 gap-3">
                  
                  <div className="relative">
                    <label className={`absolute left-3 top-1.5 z-10 text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Date</label>
                    <div className={`relative w-full pt-5 pb-1.5 px-3 rounded-xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-600" : "bg-slate-50 border-slate-200"}`}>
                      <span className={`font-bold text-xs ${!paydays[pdKey].date ? "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {paydays[pdKey].date ? new Date(paydays[pdKey].date + 'T00:00:00').toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Select"}
                      </span>
                      <CalendarIcon size={14} className="shrink-0 opacity-50" style={{ color: signatureColor }} />
                      <input 
                        type="date" 
                        value={paydays[pdKey].date} 
                        onChange={(e) => handlePaydayChange(pdKey, "date", e.target.value)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className={`absolute left-3 top-1.5 z-10 text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Income</label>
                    <div className={`relative w-full flex items-center pt-5 pb-1.5 px-3 rounded-xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-600" : "bg-slate-50 border-slate-200"}`}>
                      <DollarSign size={12} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        pattern="[0-9.-]*" 
                        placeholder="0.00"
                        value={paydays[pdKey].income} 
                        onChange={(e) => handlePaydayChange(pdKey, "income", e.target.value)} 
                        onBlur={() => {
                          const val = parseFloat(paydays[pdKey].income);
                          if (!isNaN(val)) handlePaydayChange(pdKey, "income", val.toFixed(2));
                        }}
                        className="w-full bg-transparent outline-none font-bold text-xs pl-1 text-slate-900 dark:text-white" 
                      />
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleSave} 
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            style={{ backgroundColor: signatureColor, boxShadow: `0 8px 16px ${signatureColor}40` }}
          >
            <Save size={16} /> Save Schedule
          </button>
          
        </div>
      </div>
    </div>
  );
}
