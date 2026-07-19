import React, { useRef } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';

export default function PaydaySetup({
  setIsPaydaySetupOpen,
  editPaydayConfig,
  setEditPaydayConfig,
  clearPaydayConfig,
  savePaydayConfig,
  formatDisplayDate,
  signatureColor,
  isDarkMode,
  isDemoMode
}) {
  const dateRefs = useRef({});
  const closeButtonClass = `p-2 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaydaySetupOpen(false)}></div>
      <div className={`w-full lg:max-w-md h-[90vh] lg:h-[80vh] rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl relative z-[130] flex flex-col ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          
          {/* SURGICAL INJECTION: Official branding logo centered in place inside the Payday Routing header block */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center p-0.5 border shrink-0 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
              <img src="/login-logo.png" alt="Ledger Planner" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h3 className={`font-black uppercase tracking-widest leading-none mb-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Payday Routing</h3>
              <p className={`text-[10px] font-bold leading-tight truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                *Month of {new Date().toLocaleString("en-US", { month: "long" })}
              </p>
            </div>
          </div>
          <button onClick={() => setIsPaydaySetupOpen(false)} className={closeButtonClass}><X size={18} /></button>
        </div>
        <div className={`p-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${isDemoMode ? "pb-[140px] lg:pb-6" : ""}`}>
          <div className="mb-6">
            <label className={`block text-[9px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Pay Frequency</label>
            <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-2xl border ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-100/80 border-slate-200"}`}>
              {["Weekly", "Bi-Weekly", "Semi-Monthly", "Monthly"].map(freq => (
                <button key={freq} onClick={() => setEditPaydayConfig({...editPaydayConfig, frequency: freq})} className={`w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center text-center ${editPaydayConfig?.frequency === freq || (!editPaydayConfig?.frequency && freq === "Weekly") ? "text-white shadow-md" : isDarkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50" : "text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm"}`} style={{ backgroundColor: (editPaydayConfig?.frequency === freq || (!editPaydayConfig?.frequency && freq === "Weekly")) ? signatureColor : undefined }}>
                  {freq}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
          {(editPaydayConfig?.frequency === "Monthly" ? ["Payday 1"] :
            editPaydayConfig?.frequency === "Semi-Monthly" ? ["Payday 1", "Payday 2"] :
            editPaydayConfig?.frequency === "Bi-Weekly" ? ["Payday 1", "Payday 2", "Payday 3"] :
            ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"]).map((pd) => (
            <div key={pd} className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-slate-50 border-slate-100"}`}>
              <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{pd}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div 
                  className={`relative w-full h-[54px] rounded-xl border flex flex-col justify-end pb-1.5 px-3 transition-colors cursor-pointer ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  onClick={() => {
                    if (dateRefs.current[pd] && dateRefs.current[pd].showPicker) {
                      try { dateRefs.current[pd].showPicker(); } catch (err) {}
                    }
                  }}
                >
                  <label className={`absolute top-2 left-0 w-full text-center text-[8px] font-black uppercase tracking-widest pointer-events-none ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Expected Pay Date</label>
                  <div className="flex items-center justify-between w-full relative z-10 pointer-events-none">
                      <span className={`font-bold text-sm text-left truncate flex-1 pointer-events-none ${!editPaydayConfig?.[pd]?.date ? "opacity-0" : isDarkMode ? "text-white" : "text-slate-900"}`}>{editPaydayConfig?.[pd]?.date ? formatDisplayDate(editPaydayConfig?.[pd]?.date) : "mm/dd/yy"}</span>
                      <CalendarIcon size={16} className="shrink-0 pointer-events-none" style={{ color: signatureColor }} />
                  </div>
                  <input type="date" ref={(el) => { if (el) dateRefs.current[pd] = el; }} value={editPaydayConfig?.[pd]?.date || ""} onChange={(e) => setEditPaydayConfig({...editPaydayConfig, [pd]: {...(editPaydayConfig?.[pd] || {}), date: e.target.value}})} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
                </div>
                <div className={`relative w-full h-[54px] rounded-xl border flex flex-col justify-end pb-1.5 px-3 transition-colors focus-within:border-slate-400 dark:focus-within:border-slate-500 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                  <label className={`absolute top-2 left-0 w-full text-center z-10 text-[8px] font-black uppercase tracking-widest pointer-events-none ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Expected Income</label>
                  <div className="flex items-center justify-center w-full relative z-10">
                    <span className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>$</span>
                    <input type="text" inputMode="decimal" pattern="[0-9.-]*" placeholder="0.00" value={editPaydayConfig?.[pd]?.income || ""} onChange={(e) => setEditPaydayConfig({...editPaydayConfig, [pd]: {...(editPaydayConfig?.[pd] || {}), income: e.target.value}})} onBlur={(e) => { if(e.target.value && !isNaN(parseFloat(e.target.value))) { setEditPaydayConfig({...editPaydayConfig, [pd]: {...(editPaydayConfig?.[pd] || {}), income: parseFloat(e.target.value).toFixed(2)}}); } }} className={`bg-transparent outline-none font-bold text-sm w-[76px] ml-1 ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          <div className={`mt-6 p-4 rounded-2xl border text-left transition-colors ${isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200/60"}`}>
            <p className={`text-[11px] font-bold leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              💡 PRO TIP: If your income varies or you don't follow a fixed payroll schedule, try activating Entrepreneur Mode. You can switch tracks anytime by opening the Settings Vault (⚙️) → Personalization & System → Income Structure.
            </p>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3">
          <button onClick={clearPaydayConfig} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"}`}>Clear All</button>
          <button onClick={savePaydayConfig} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: signatureColor }}>Save Engine</button>
        </div>
      </div>
    </div>
  );
}
