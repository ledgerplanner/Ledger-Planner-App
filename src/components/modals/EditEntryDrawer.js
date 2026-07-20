import React, { useState } from 'react';
import { X, Edit2, Calendar as CalendarIcon, ArrowDown, Trash2, CheckCircle2 } from 'lucide-react';
import { useLedger } from '../../context/LedgerContext';
import { db } from '../../firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function EditEntryDrawer({
  selectedEntry,
  setSelectedEntry,
  isEditingEntry,
  setIsEditingEntry,
  editEntryData,
  setEditEntryData,
  closeEntryDrawer,
  handleSaveEntryEdit,
  openGlobalAction,
  formatDisplayDate,
  accounts,
  signatureColor,
  isDarkMode,
  isDemoMode
}) {
  const { user, bills, setBills, transactions, setTransactions, modernCategories } = useLedger();
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  
  const categoryEmojis = ["💵", "💲", "🤑", "💰", "🏦", "💹", "₿", "💎", "💳", "🧾", "📋", "💼", "🏠", "🏢", "🔑", "🛋️", "🧹", "💧", "⚡", "📶", "📡", "☁️", "📺", "🎬", "🍿", "🎵", "🎧", "🚗", "🚲", "🚂", "✈️", "⛽", "🛠️", "🅿️", "🎫", "🚕", "🚇", "🛒", "🛍️", "📦", "👕", "👗", "👟", "💅", "💄", "💈", "🕶️", "💍", "🍔", "🍕", "🌮", "🍣", "🥗", "🍳", "☕", "🍦", "🍻", "🍹", "🍷", "🏥", "💊", "🦷", "👓", "🧘", "🏋️", "🐾", "🐶", "🎁", "🎉", "🎟️", "🎮", "🕹️", "📱", "💻", "⌚", "🤖", "🚀", "🌴", "🎓", "🏪", "🎯", "🏖️", "👶", "🛡️", "🏍️", "🎸", "⛵"];
  
  const categoriesToRender = modernCategories;
  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  const getEntryAmountColor = (entry) => {
    if (!entry) return "text-[#1877F2]";
    if (entry.isBillPayment || entry.fullDate !== undefined) return "text-[#1877F2]";
    if (entry.type === 'Income') return "text-[#10B981]";
    if (entry.type === 'Expense') return "text-[#F97316]";
    return "text-[#1877F2]";
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeEntryDrawer}></div>
      <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col max-h-[95vh] transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          
          {/* SURGICAL INJECTION: Official branding logo centered in place of generic avatar items */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center p-0.5 border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
              <img src="/login-logo.png" alt="Ledger Planner" className="w-full h-full object-cover rounded-full" />
            </div>
            <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{isEditingEntry ? "Edit Entry" : "Entry Details"}</h3>
          </div>
          <div className="flex items-center gap-2">
            {!isEditingEntry && (<button onClick={() => { setIsEditingEntry(true); setEditEntryData({ name: selectedEntry.name, amount: (selectedEntry.amount || 0).toFixed(2), category: selectedEntry.category, icon: selectedEntry.icon, rawDate: selectedEntry.rawDate || "", isRecurring: selectedEntry.isRecurring || false, isInstallment: selectedEntry.isInstallment || false, totalAmount: (selectedEntry.totalAmount || 0).toFixed(2) || "", paidAmount: (selectedEntry.paidAmount || 0).toFixed(2) || "", accountId: selectedEntry.accountId || "" }); }} className={closeButtonClass}><Edit2 size={16} /></button>)}
            <button onClick={closeEntryDrawer} className={closeButtonClass}><X size={18} /></button>
          </div>
        </div>
        <div className={`p-6 space-y-6 overflow-y-auto hide-scrollbar ${isDemoMode ? "pb-[140px] lg:pb-6" : ""}`}>
          {!isEditingEntry ? (
            <>
              <div className="text-center">
                <h2 className={`text-xl font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEntry.name}</h2>
                <p className={`text-5xl font-black tracking-tighter ${getEntryAmountColor(selectedEntry)}`}>
                  {selectedEntry.type === 'Income' ? '+' : selectedEntry.type === 'Expense' ? '-' : ''}${(selectedEntry.amount || 0).toFixed(2)}
                </p>
                <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <CalendarIcon size={14} className="text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{selectedEntry.fullDate || selectedEntry.date || "No Date"}</span>
                </div>
              </div>
              <div className={`rounded-2xl p-4 border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className={`flex justify-between py-2 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</span>
                  <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEntry.category || "Bill / Subscription"}</span>
                </div>
                {selectedEntry.type && (
                  <div className={`flex justify-between py-2 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</span>
                    <span className={`text-xs font-black ${selectedEntry.type === "Income" ? "text-[#10B981]" : "text-[#F97316]"}`}>{selectedEntry.type}</span>
                  </div>
                )}
                {selectedEntry.payday && (
                  <div className={`flex justify-between py-2 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned To</span>
                    <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEntry.payday}</span>
                  </div>
                )}
                {selectedEntry.isOverdue !== undefined && (
                  <div className="flex justify-between py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                    <span className={`text-xs font-black ${selectedEntry.isPaid ? "text-[#10B981]" : selectedEntry.isOverdue ? "text-red-500" : "text-[#F97316]"}`}>{selectedEntry.isPaid ? "Paid" : selectedEntry.isOverdue ? "Overdue" : "Pending"}</span>
                  </div>
                )}
              </div>
              <button onClick={() => { 
                openGlobalAction("Delete Entry", "Are you sure you want to permanently delete this entry?", "Delete", true, async () => {
                  const colName = selectedEntry.fullDate ? "bills" : "transactions"; 
                  if (isDemoMode) { 
                    if (colName === "bills") { setBills(bills.filter(b => b.id !== selectedEntry.id)); } 
                    else { setTransactions(transactions.filter(t => t.id !== selectedEntry.id)); } 
                  } else { 
                    await deleteDoc(doc(db, "users", user.uid, colName, selectedEntry.id));
                    if(!selectedEntry.fullDate && selectedEntry.accountId) { 
                      const acc = accounts.find(a => a.id === selectedEntry.accountId);
                      if(acc) { 
                        const revAmount = selectedEntry.type === "Income" ? -(selectedEntry.amount || 0) : (selectedEntry.amount || 0); 
                        await updateDoc(doc(db, "users", user.uid, "accounts", acc.id), { balance: (acc.balance || 0) + revAmount });
                      } 
                    } 
                  } 
                  setSelectedEntry(null);
                });
              }} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-500 shadow-[0_8px_16px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Delete Entry</button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="relative"><label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Name</label><input type="text" value={editEntryData.name || ""} onChange={(e) => setEditEntryData({...editEntryData, name: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} /></div>
                <div className="relative">
                  <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Amount</label>
                  <div className="relative w-full flex items-center">
                    <span className={`absolute left-4 top-[22px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                    <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={editEntryData.amount || ""} onChange={(e) => setEditEntryData({...editEntryData, amount: e.target.value})} onBlur={() => { if(!isNaN(parseFloat(editEntryData.amount)) && editEntryData.amount !== "") setEditEntryData({...editEntryData, amount: parseFloat(editEntryData.amount).toFixed(2)}) }} className={`w-full pt-6 pb-2 pl-7 pr-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                  </div>
                </div>
                <div className="relative cursor-pointer" onClick={() => setIsIconSelectorOpen(true)}>
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Icon</label>
                  <div className={`w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                     <span className="text-xl leading-none">{editEntryData.icon || "🧾"}</span>
                     <ArrowDown size={14} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                  </div>
                </div>
                <div className="relative">
                  <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Category</label>
                  <select value={editEntryData.category || ""} onChange={(e) => setEditEntryData({...editEntryData, category: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl border appearance-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                     <option value="" disabled>Select Category</option>
                     {categoriesToRender.map(group => ( <optgroup key={group.group} label={group.group} className={isDarkMode ? "bg-[#1E293B] text-white" : "bg-white text-slate-900"}> {group.items.map(item => <option key={item} value={item}>{item}</option>)} </optgroup> ))}
                  </select>
                </div>
                {selectedEntry.fullDate !== undefined && (
                  <>
                    <div className="relative w-full">
                      <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest pointer-events-none ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Due Date</label>
                      <div className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                         <span className={`font-bold text-base pointer-events-none ${!editEntryData.rawDate ? "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{editEntryData.rawDate ? formatDisplayDate(editEntryData.rawDate) : "mm/dd/yyyy"}</span>
                         <CalendarIcon size={18} className="shrink-0 pointer-events-none text-slate-400" style={{ color: editEntryData.rawDate ? signatureColor : undefined }} />
                         {/* SURGICAL INJECTION: Native date picker spanning entire container */}
                         <input type="date" value={editEntryData.rawDate || ""} onChange={(e) => setEditEntryData({...editEntryData, rawDate: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      </div>
                    </div>
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Recurring Bill</span>
                        <button onClick={() => { setEditEntryData({...editEntryData, isRecurring: !editEntryData.isRecurring}); }} className="w-12 h-6 rounded-full transition-colors relative bg-slate-300 dark:bg-slate-700" style={{ backgroundColor: editEntryData.isRecurring ? signatureColor : undefined }}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${editEntryData.isRecurring ? "translate-x-7" : "translate-x-1"}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Installment Plan</span>
                        <button onClick={() => { setEditEntryData({...editEntryData, isInstallment: !editEntryData.isInstallment}); }} className="w-12 h-6 rounded-full transition-colors relative bg-slate-300 dark:bg-slate-700" style={{ backgroundColor: editEntryData.isInstallment ? signatureColor : undefined }}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${editEntryData.isInstallment ? "translate-x-7" : "translate-x-1"}`}></div>
                        </button>
                      </div>
                      {editEntryData.isInstallment && (
                        <div className="grid grid-cols-2 gap-3 animate-fade-in mt-1">
                           <div className="relative">
                              <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Total Amount</label>
                              <div className="relative w-full flex items-center">
                                 <span className={`absolute left-4 top-[18px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                                 <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={editEntryData.totalAmount || ""} onChange={(e) => setEditEntryData({...editEntryData, totalAmount: e.target.value})} onBlur={() => { if(!isNaN(parseFloat(editEntryData.totalAmount)) && editEntryData.totalAmount !== "") setEditEntryData({...editEntryData, totalAmount: parseFloat(editEntryData.totalAmount).toFixed(2)}) }} className={`w-full pt-6 pb-2 pl-7 pr-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                              </div>
                           </div>
                           <div className="relative">
                              <label className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Already Paid</label>
                              <div className="relative w-full flex items-center">
                                 <span className={`absolute left-4 top-[18px] font-bold text-base ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                                 <input type="text" inputMode="decimal" pattern="[0-9.-]*" value={editEntryData.paidAmount || ""} onChange={(e) => setEditEntryData({...editEntryData, paidAmount: e.target.value})} onBlur={() => { if(!isNaN(parseFloat(editEntryData.paidAmount)) && editEntryData.paidAmount !== "") setEditEntryData({...editEntryData, paidAmount: parseFloat(editEntryData.paidAmount).toFixed(2)}) }} className={`w-full pt-6 pb-2 pl-7 pr-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`} />
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {selectedEntry.fullDate === undefined && (
                   <div className="relative">
                      <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Account</label>
                      <select disabled value={editEntryData.accountId || ""} onChange={(e) => setEditEntryData({...editEntryData, accountId: e.target.value})} className={`w-full pt-6 pb-2 px-5 rounded-2xl border appearance-none transition-colors opacity-70 cursor-not-allowed ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                         <option value="" disabled>Which account paid for this activity?</option>
                         {accounts.map((a) => (<option key={a.id} value={a.id} className={isDarkMode ? "bg-[#1E293B]" : "bg-white"}>{a.name}</option>))}
                      </select>
                   </div>
                )}
              </div>
              <button onClick={handleSaveEntryEdit} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2" style={{ backgroundColor: signatureColor }}><CheckCircle2 size={16} /> Save Changes</button>
            </>
          )}
        </div>
        {isIconSelectorOpen && isEditingEntry && (
           <div className={`absolute inset-0 z-[150] flex flex-col ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
              <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}><h3 className={`font-black uppercase text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Icon</h3><button onClick={() => setIsIconSelectorOpen(false)} className={closeButtonClass}><X size={18}/></button></div>
              <div className={`flex-1 overflow-y-auto hide-scrollbar p-4 ${isDemoMode ? "pb-[140px] lg:pb-6" : "pb-20 lg:pb-6"}`}>
                 <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">{categoryEmojis.map(emoji => (<button key={emoji} onClick={() => { setEditEntryData({...editEntryData, icon: emoji}); setIsIconSelectorOpen(false); }} className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border transition-all active:scale-90 ${editEntryData.icon === emoji ? 'text-white border-transparent shadow-md' : isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`} style={{ backgroundColor: editEntryData.icon === emoji ? signatureColor : undefined }}>{emoji}</button>))}</div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
