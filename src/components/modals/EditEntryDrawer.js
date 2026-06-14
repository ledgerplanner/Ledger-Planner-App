import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar as CalendarIcon, DollarSign, Tag, Image as ImageIcon } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLedger } from '../../context/LedgerContext';

export default function EditEntryDrawer({ selectedEntry, onClose, triggerHaptic, triggerVictory }) {
  const { 
    user, isDemoMode, isDarkMode, signatureColor, modernCategories,
    transactions, setTransactions, bills, setBills 
  } = useLedger();

  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editDate, setEditDate] = useState("");
  
  const isTransaction = selectedEntry && selectedEntry.type !== undefined;
  const collectionName = isTransaction ? "transactions" : "bills";

  useEffect(() => {
    if (selectedEntry) {
      setEditName(selectedEntry.name || "");
      setEditAmount(selectedEntry.amount ? String(selectedEntry.amount) : "0");
      setEditCategory(selectedEntry.category || "");
      setEditIcon(selectedEntry.icon || "");
      setEditDate(isTransaction ? (selectedEntry.date || "") : (selectedEntry.rawDate || ""));
    }
  }, [selectedEntry, isTransaction]);

  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  const handleSave = async () => {
    if (!selectedEntry) return;
    triggerHaptic(50);

    const updatedAmount = parseFloat(editAmount);
    if (isNaN(updatedAmount)) return;

    const updatedData = {
      name: editName.trim(),
      amount: updatedAmount,
      category: editCategory,
      icon: editIcon
    };

    if (isTransaction) {
      updatedData.date = editDate;
    } else {
      updatedData.rawDate = editDate;
      // Basic formatting for the display date if rawDate is changed
      if (editDate) {
        const dParts = editDate.split('-');
        if (dParts.length === 3) {
           const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
           updatedData.fullDate = dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
      }
    }

    if (isDemoMode) {
      if (isTransaction) {
        setTransactions(transactions.map(tx => tx.id === selectedEntry.id ? { ...tx, ...updatedData } : tx));
      } else {
        setBills(bills.map(b => b.id === selectedEntry.id ? { ...b, ...updatedData } : b));
      }
    } else if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid, collectionName, selectedEntry.id), updatedData);
      } catch (err) {
        console.error("Failed to update entry:", err);
      }
    }
    
    triggerVictory();
    onClose();
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    triggerHaptic([30, 50]);

    if (isDemoMode) {
      if (isTransaction) {
        setTransactions(transactions.filter(tx => tx.id !== selectedEntry.id));
      } else {
        setBills(bills.filter(b => b.id !== selectedEntry.id));
      }
    } else if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, collectionName, selectedEntry.id));
      } catch (err) {
        console.error("Failed to delete entry:", err);
      }
    }
    
    onClose();
  };

  if (!selectedEntry) return null;

  return (
    <div className="absolute inset-0 z-[140] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[150] flex flex-col max-h-[90vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border border-slate-700" : "bg-white border border-slate-100"}`}>
        
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
              {editIcon || "📝"}
            </div>
            <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Edit {isTransaction ? "Activity" : "Bill"}
            </h3>
          </div>
          <button onClick={onClose} className={closeButtonClass}><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto hide-scrollbar flex-1 space-y-4 pb-[120px] lg:pb-6">
          
          <div className="relative">
            <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Name</label>
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              className={`w-full pt-6 pb-2 px-5 rounded-2xl border font-bold text-sm outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white focus:border-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"}`}
            />
          </div>

          <div className="relative">
            <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Amount</label>
            <div className={`relative w-full flex items-center pt-6 pb-2 px-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
              <DollarSign size={14} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
              <input 
                type="text" 
                inputMode="decimal" 
                pattern="[0-9.-]*" 
                value={editAmount} 
                onChange={(e) => setEditAmount(e.target.value)} 
                onBlur={() => {
                  const val = parseFloat(editAmount);
                  if (!isNaN(val)) setEditAmount(val.toFixed(2));
                }}
                className="w-full bg-transparent outline-none font-bold text-sm pl-1 text-slate-900 dark:text-white" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest z-10 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Category</label>
              <select 
                value={editCategory} 
                onChange={(e) => setEditCategory(e.target.value)} 
                className={`w-full pt-6 pb-2 px-4 rounded-2xl border font-bold text-xs uppercase tracking-wider appearance-none outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
              >
                <option value="Other">Other</option>
                {modernCategories.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Icon</label>
              <div className={`w-full pt-6 pb-2 px-4 rounded-2xl border flex items-center transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <input 
                  type="text" 
                  value={editIcon} 
                  onChange={(e) => setEditIcon(e.target.value)} 
                  maxLength={2}
                  className="w-full bg-transparent outline-none font-bold text-sm text-center text-slate-900 dark:text-white" 
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              {isTransaction ? "Timestamp" : "Due Date"}
            </label>
            <div className={`relative w-full flex items-center pt-6 pb-2 px-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
              <CalendarIcon size={14} className={`shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
              {isTransaction ? (
                <input 
                  type="text" 
                  value={editDate} 
                  onChange={(e) => setEditDate(e.target.value)} 
                  className="w-full bg-transparent outline-none font-bold text-xs uppercase tracking-wider pl-2 text-slate-900 dark:text-white" 
                />
              ) : (
                <input 
                  type="date" 
                  value={editDate} 
                  onChange={(e) => setEditDate(e.target.value)} 
                  className="w-full bg-transparent outline-none font-bold text-xs uppercase tracking-wider pl-2 text-slate-900 dark:text-white" 
                />
              )}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button 
              onClick={handleSave} 
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: signatureColor, boxShadow: `0 8px 16px ${signatureColor}40` }}
            >
              <Save size={16} /> Save Changes
            </button>
            <button 
              onClick={handleDelete} 
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-500 shadow-[0_8px_16px_rgba(239,68,68,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Delete {isTransaction ? "Activity" : "Bill"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
