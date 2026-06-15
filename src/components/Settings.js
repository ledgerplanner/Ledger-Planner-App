import React, { useState } from "react";
import { 
  X, User, CreditCard, RefreshCw, AlertCircle, Trash2, LogOut, 
  ChevronRight, Sparkles, Globe, Palette, Users, Shield, Check, HelpCircle
} from "lucide-react";

export default function Settings({
  userName,
  isDarkMode,
  setIsDarkMode,
  setIsSettingsOpen,
  handleRolloverMonth,
  handleFactoryReset,
  resetConfirm,
  setResetConfirm,
  isDemoMode,
  openGlobalAction,
  signatureColor = "#1877F2",
  setSignatureColor,
  currentCurrency = "USD ($)",
  setCurrentCurrency
}) {
  const [editName, setEditName] = useState(userName || "");

  // Slide-up Drawers and Sub-Modals
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isCoOpOpen, setIsCoOpOpen] = useState(false);
  const [isMergeWizardOpen, setIsMergeWizardOpen] = useState(false);

  // Co-Op Invitation Workflow State Variables
  const [inviteEmail, setInviteEmail] = useState("");
  const [coOpStep, setCoOpStep] = useState(1); // 1: Input, 2: Active Alert, 3: Linked Vault Details

  // Mock Checklist State Matrix for the Vault Merge Wizard
  const [mergeAccounts, setMergeAccounts] = useState({
    "Primary Checking": true,
    "Emergency Savings": true,
    "Amex Gold Credit Card": false
  });
  const [mergeBills, setMergeBills] = useState({
    "Monthly House Rent": true,
    "Electric Utility Bill": true,
    "Netflix Subscription": false
  });

  const availableCurrencies = [
    { code: "USD ($)", symbol: "$" },
    { code: "EUR (€)", symbol: "€" },
    { code: "GBP (£)", symbol: "£" },
    { code: "CAD ($)", symbol: "$" },
    { code: "AUD ($)", symbol: "$" },
    { code: "JPY (¥)", symbol: "¥" }
  ];

  const premiumPalette = [
    { name: "Classic Ledger Blue", hex: "#1877F2" },
    { name: "Emerald Growth", hex: "#10B981" },
    { name: "Vibrant Horizon", hex: "#F97316" },
    { name: "Crimson Forge", hex: "#EF4444" },
    { name: "Royal Velocity", hex: "#8B5CF6" },
    { name: "Rose Quartz", hex: "#EC4899" }
  ];

  // HIGH-PRECISION RE-ENGINEERED 2-LAYER STACKED ROW CARD COMPONENT
  const SettingRow = ({ icon: Icon, title, statusText, colorClass = "", onClick }) => {
    return (
      <button
        onClick={onClick}
        className={`w-full flex flex-col p-4 rounded-[1.5rem] border text-left transition-all active:scale-[0.99] gap-3 ${
          isDarkMode 
            ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80" 
            : "bg-white border-slate-100 hover:bg-slate-50/80 shadow-sm"
        }`}
      >
        {/* Layer 1: Comprehensive Label Block spanning complete horizontal track */}
        <div className="flex items-center gap-3 w-full min-w-0">
          <div className={`p-2.5 rounded-xl shrink-0 ${isDarkMode ? "bg-slate-900/60" : "bg-slate-50"} ${colorClass}`}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
          <span className={`text-xs font-black uppercase tracking-wider truncate flex-1 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
            {title}
          </span>
        </div>

        {/* Layer 2: Dedicated Interactive Action Utility Row Panel */}
        <div className={`flex items-center justify-between w-full pt-2 border-t ${
          isDarkMode ? "border-slate-800/60" : "border-slate-100"
        }`}>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
            isDarkMode ? "bg-slate-900/40 border-slate-700/80 text-slate-400" : "bg-slate-100/60 border-slate-200/60 text-slate-500"
          }`}>
            {statusText}
          </span>
          <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Configure</span>
            <ChevronRight size={12} strokeWidth={2.5} />
          </div>
        </div>
      </button>
    );
  };

  const closeButtonClass = `p-2 rounded-full transition-colors ${
    isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
  }`;

  return (
    <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
      {/* Dimmed Overlay Panel backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
      
      {/* Master Base Component Layout Shell */}
      <div className={`w-full lg:max-w-md h-[90vh] rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative z-[130] flex flex-col overflow-hidden border ${
        isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-[#F8FAFC] border-slate-100"
      }`}>
        
        {/* Pinned Title Bar Block */}
        <div className={`p-5 border-b flex justify-between items-center shrink-0 relative z-30 ${
          isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200/60 shadow-sm"
        }`}>
          <h3 className={`font-black uppercase tracking-widest text-sm flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            <Shield size={16} style={{ color: signatureColor }} strokeWidth={2.5} /> Settings Vault
          </h3>
          <button onClick={() => setIsSettingsOpen(false)} className={closeButtonClass}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Dynamic Nested Scrolling Content Panel Base Segment */}
        <div className={`p-6 overflow-y-auto space-y-6 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${
          isDemoMode ? "pb-[140px] lg:pb-6" : "pb-12 lg:pb-6"
        }`}>
          
          {/* Section Apex Element: High-Contrast Premium Dark-Canvas Subscription Hero Block */}
          <div className={`p-5 rounded-[2rem] border relative overflow-hidden bg-gradient-to-br transition-all duration-300 ${
            isDarkMode 
              ? "from-slate-950 via-slate-900 to-slate-950 border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.4)]" 
              : "from-black via-slate-950 to-black border-black shadow-[0_16px_36px_rgba(15,23,42,0.45)]"
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-0.5">Account Status</span>
                <p className="text-base font-black text-white">Ledger Planner Pro</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
                  <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Account Active</p>
                </div>
              </div>
              <button 
                onClick={() => openGlobalAction("Subscription Portal", "Establishing secure handshakes to billing validation channels...", "Close", false, () => {}, true)}
                className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 shadow-sm transition-all active:scale-95"
              >
                Manage
              </button>
            </div>
          </div>

          {/* SIGNATURE SEPARATION LINE TRACK (Accounts-Ledger Calibration Style) */}
          <div className={`border-t w-full my-2 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

          {/* UPGRADED STANDALONE NODE: SHARE MY ACCOUNT Premium Dark Canvas Row Block */}
          <button
            onClick={() => setIsCoOpOpen(true)}
            className={`w-full flex flex-col p-4 rounded-[1.5rem] border text-left transition-all active:scale-[0.99] gap-3 bg-gradient-to-br ${
              isDarkMode 
                ? "from-slate-950 via-slate-900 to-slate-950 border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.4)]" 
                : "from-black via-slate-950 to-black border-black shadow-[0_16px_36px_rgba(15,23,42,0.45)]"
            }`}
          >
            {/* Layer 1: Label Block */}
            <div className="flex items-center gap-3 w-full min-w-0">
              <div className="p-2.5 rounded-xl shrink-0 bg-slate-900/60 text-purple-400">
                <Users size={16} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider truncate flex-1 text-white">
                SHARE MY ACCOUNT
              </span>
            </div>

            {/* Layer 2: Action Utility Base */}
            <div className="flex items-center justify-between w-full pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border bg-slate-900/40 border-slate-700/80 text-slate-400">
                {coOpStep === 3 ? "2 Users Linked" : "Inactive Setup"}
              </span>
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Configure</span>
                <ChevronRight size={12} strokeWidth={2.5} />
              </div>
            </div>
          </button>

          {/* SIGNATURE SEPARATION LINE TRACK (Accounts-Ledger Calibration Style) */}
          <div className={`border-t w-full my-2 ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

          {/* CENTRAL MASTER MODULE GROUP: Personalization Parameters Layout Shell */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-1.5">
              <Palette size={12} strokeWidth={2.5} /> Custom Settings
            </h4>
            <div className={`p-4 rounded-[2rem] border space-y-3 ${isDarkMode ? "bg-slate-800/20 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
              
              {/* [POSITION #1 NODE]: User Profile Naming Vector Field Configuration Component */}
              <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-[#0F172A]/40 border-slate-700/50" : "bg-slate-50/60 border-slate-200/50"}`}>
                <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">PREFERRED DISPLAY NAME</label>
                <div className="flex flex-col gap-2.5">
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs border focus:outline-none transition-colors ${
                      isDarkMode ? "bg-[#0F172A] border-slate-700 text-white focus:border-slate-500" : "bg-white border-slate-200 text-slate-900 focus:border-slate-400"
                    }`} 
                  />
                  <button 
                    onClick={() => openGlobalAction("Identity Updated", "Local cache verification synchronized successfully.", "Close", false, () => {}, true)}
                    disabled={!editName.trim() || editName === userName}
                    className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: (editName.trim() && editName !== userName) ? signatureColor : isDarkMode ? "#1E293B" : "#E2E8F0", color: (editName.trim() && editName !== userName) ? "#FFFFFF" : "#94A3B8" }}
                  >
                    UPDATE DISPLAY NAME
                  </button>
                </div>
              </div>

              {/* [POSITION #2 NODE]: Nested Individual Theme Active Switch Toggle Card Module */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] border text-left transition-all active:scale-[0.99] ${
                  isDarkMode ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80" : "bg-white border-slate-100 hover:bg-slate-50/80 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl text-amber-400 shrink-0 ${isDarkMode ? "bg-slate-900/60" : "bg-slate-50"}`}>
                    <Sparkles size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                      THEME COLOR
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {isDarkMode ? "Dark Mode Active" : "Light Mode Active"}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-5 rounded-full relative bg-slate-300 dark:bg-slate-700 transition-colors shrink-0" style={{ backgroundColor: isDarkMode ? signatureColor : undefined }}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${isDarkMode ? "translate-x-5" : "translate-x-1"}`}></div>
                </div>
              </button>

              {/* [POSITION #3 NODE]: UNIFIED 2-LAYER SELECTION NODE: Palette Swapper Grid Interface */}
              <div className={`w-full flex flex-col p-4 rounded-[1.5rem] border text-left gap-3 ${
                isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-100 shadow-sm"
              }`}>
                <div className="flex items-center gap-3 w-full min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${isDarkMode ? "bg-slate-900/60" : "bg-slate-50"}`} style={{ color: signatureColor }}>
                    <Palette size={16} strokeWidth={2.5} />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-wider truncate flex-1 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    SELECT THEME COLOR
                  </span>
                </div>
                <div className={`w-full pt-3 border-t ${isDarkMode ? "border-slate-800/60" : "border-slate-100"}`}>
                  <div className="grid grid-cols-6 gap-2">
                    {premiumPalette.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSignatureColor && setSignatureColor(color.hex)}
                        className="h-8 rounded-xl relative transition-transform active:scale-90 flex items-center justify-center border shadow-sm"
                        style={{ backgroundColor: color.hex, borderColor: signatureColor === color.hex ? "#FFFFFF" : "transparent" }}
                      >
                        {signatureColor === color.hex && (
                          <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* [POSITION #4 NODE]: Global Localization & Internationalization Currency Link Row */}
              <SettingRow 
                icon={Globe} 
                title="SELECT CURRENCY" 
                statusText={currentCurrency} 
                colorClass="text-blue-400"
                onClick={() => setIsCurrencyOpen(true)}
              />
            </div>
          </div>

          {/* CLUSTER MODULE GROUP 3: Core Maintenance Tools & Critical Overrides */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-1.5">
              <RefreshCw size={12} strokeWidth={2.5} /> SYSTEM SETTINGS
            </h4>
            <div className={`p-4 rounded-[2rem] border space-y-3 ${isDarkMode ? "bg-slate-800/20 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
              
              {/* RE-ENGINEERED 1-LAYER INSTANT ACTION MONTH TRANSITION COMPONENT */}
              <button
                onClick={handleRolloverMonth}
                className={`w-full flex items-center gap-3 p-4 rounded-[1.5rem] border text-left transition-all active:scale-[0.99] ${
                  isDarkMode 
                    ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 text-slate-200" 
                    : "bg-white border-slate-100 hover:bg-slate-50/80 text-slate-800 shadow-sm"
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${isDarkMode ? "bg-slate-900/60" : "bg-slate-50"} text-emerald-400`}>
                  <RefreshCw size={16} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider truncate flex-1">
                  START NEW MONTH
                </span>
              </button>

              <SettingRow 
                icon={HelpCircle} 
                title="Glitch Report Vector Channel" 
                statusText="Support Live" 
                colorClass="text-sky-400"
                onClick={() => openGlobalAction("Support Vector", "Opening secure mail transfer protocols to support documentation channels...", "Close", false, () => {}, true)}
              />
            </div>
          </div>

          {/* DANGER ZONE CRITICAL STORAGE WIPE OVERLAY CAPTURE SYSTEM BLOCK CARD MODULE */}
          <div className={`p-5 rounded-[2rem] border ${
            isDarkMode ? "bg-red-950/10 border-red-900/30" : "bg-red-50/40 border-red-100"
          }`}>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3 flex items-center gap-2">
              <AlertCircle size={14} strokeWidth={2.5} /> Critical System Overrides (Nuke Zone)
            </h4>
            <p className={`text-[11px] font-medium leading-relaxed mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Executing a Factory Reset wipes all database entities permanently from cloud architecture storage pools. Type <strong className="text-red-500 font-bold">RESET</strong> into the channel lock below to validate authorization parameters.
            </p>
            <input
              type="text"
              placeholder="TYPE RESET"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs tracking-widest text-center uppercase focus:outline-none transition-all border mb-3 ${
                isDarkMode 
                  ? "bg-[#0F172A] border-slate-700/80 text-white focus:border-red-500" 
                  : "bg-white border-slate-200 text-slate-900 focus:border-red-400 shadow-inner"
              }`}
            />
            <button
              onClick={handleFactoryReset}
              disabled={resetConfirm !== "RESET"}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all border border-transparent flex items-center justify-center gap-2 ${
                resetConfirm === "RESET" 
                  ? "bg-red-600 shadow-[0_6px_16px_rgba(220,38,38,0.3)] active:scale-[0.98] hover:bg-red-700" 
                  : "bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50 shadow-none"
              }`}
            >
              <Trash2 size={14} strokeWidth={2.5} /> Destroy Vault Architecture
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBSYSTEM INTERACTIVE SLIDE-UP DRAWER LAYER 1: SELECT CURRENCY DRAWER */}
      {/* ========================================================================= */}
      {isCurrencyOpen && (
        <div className="absolute inset-0 z-[140] flex items-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsCurrencyOpen(false)}></div>
          <div className={`w-full rounded-t-[2.5rem] shadow-2xl animate-slide-up relative z-[150] flex flex-col max-h-[60vh] ${
            isDarkMode ? "bg-[#1E293B]" : "bg-white"
          }`}>
            <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
              <h3 className={`font-black uppercase text-xs tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Select Active Currency Presets</h3>
              <button onClick={() => setIsCurrencyOpen(false)} className={closeButtonClass}><X size={18} strokeWidth={2.5} /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-2 flex-1">
              {availableCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    if (setCurrentCurrency) setCurrentCurrency(currency.code);
                    setIsCurrencyOpen(false);
                    openGlobalAction("Currency Realignment", `Recalibrating layout engines to real-time translation metrics (${currency.symbol})`, "Close", false, () => {}, true);
                  }}
                  className={`w-full p-4 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                    currentCurrency === currency.code
                      ? "text-white shadow-sm border-transparent"
                      : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                  }`}
                  style={{ backgroundColor: currentCurrency === currency.code ? signatureColor : undefined }}
                >
                  <span>{currency.code}</span>
                  <span className="text-sm font-black">{currency.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBSYSTEM INTERACTIVE SLIDE-UP DRAWER LAYER 2: CO-OP COLLABORATIVE ACCESS DRAWER */}
      {/* ========================================================================= */}
      {isCoOpOpen && (
        <div className="absolute inset-0 z-[140] flex items-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsCoOpOpen(false)}></div>
          <div className={`w-full rounded-t-[2.5rem] shadow-2xl animate-slide-up relative z-[150] flex flex-col max-h-[80vh] ${
            isDarkMode ? "bg-[#1E293B]" : "bg-white"
          }`}>
            <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
              <h3 className={`font-black uppercase text-xs tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Co-Op Node Shared Operations Engine</h3>
              <button onClick={() => setIsCoOpOpen(false)} className={closeButtonClass}><X size={18} strokeWidth={2.5} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {coOpStep === 1 && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border flex gap-3 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-blue-50/50 border-blue-100"}`}>
                    <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      Enter your partner or roommate's registry document email configuration coordinate below to map an outbound synchronization invitation thread payload vector.
                    </p>
                  </div>
                  <div className="relative">
                    <label className="absolute left-4 top-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Target User Coordinate Email</label>
                    <input
                      type="email"
                      placeholder="partner@ledgerplanner.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className={`w-full pt-5 pb-1.5 px-4 rounded-xl font-bold text-xs border focus:outline-none transition-all ${
                        isDarkMode ? "bg-[#0F172A] border-slate-700 text-white focus:border-slate-500" : "bg-white border-slate-200 text-slate-900 focus:border-slate-400"
                      }`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!inviteEmail.trim()) return;
                      setCoOpStep(2);
                    }}
                    disabled={!inviteEmail.trim()}
                    className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: inviteEmail.trim() ? signatureColor : isDarkMode ? "#1E293B" : "#E2E8F0", color: inviteEmail.trim() ? "#FFFFFF" : "#94A3B8" }}
                  >
                    Dispatch Vault Outbound Request
                  </button>

                  <div className={`border-t pt-4 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Simulate Mock Incoming Vectors (Testing Node)</p>
                    <button 
                      onClick={() => setCoOpStep(2)}
                      className={`w-full py-2.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-colors ${
                        isDarkMode ? "bg-purple-950/20 border-purple-900/40 text-purple-300 hover:bg-purple-900/30" : "bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      Trigger Pending Remote Incoming Invitation Simulation
                    </button>
                  </div>
                </div>
              )}

              {coOpStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className={`p-5 rounded-2xl border text-center ${
                    isDarkMode ? "bg-purple-950/20 border-purple-900/40" : "bg-purple-50/60 border-purple-100"
                  }`}>
                    <span className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg mx-auto mb-3">🤝</span>
                    <h4 className={`text-sm font-black uppercase tracking-wider mb-1 ${isDarkMode ? "text-purple-300" : "text-purple-800"}`}>
                      Incoming Connection Request Detected
                    </h4>
                    <p className={`text-[11px] font-medium leading-relaxed max-w-xs mx-auto mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      An external account entity (<span className="font-bold underline text-slate-400">co-op-partner@ledgerplanner.com</span>) is requesting authorization to bridge structural synchronization ledgers.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCoOpStep(1)}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-colors ${
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          setIsMergeWizardOpen(true);
                        }}
                        className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-md active:scale-95 transition-transform"
                        style={{ backgroundColor: signatureColor }}
                      >
                        Accept & Deploy Bridge
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {coOpStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Connected Partner Ledger</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">co-op-partner@ledgerplanner.com</p>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                      Linked Synchronized
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCoOpStep(1);
                      openGlobalAction("Vault Disconnection", "Severing asynchronous cryptographic synchronization tokens. Data branches separated.", "Close", true, () => {}, false);
                    }}
                    className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                  >
                    Sever Collaborative Node Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBSYSTEM INTERACTIVE MODAL INTERCEPTOR LAYER 3: THE VAULT MERGE WIZARD */}
      {/* ========================================================================= */}
      {isMergeWizardOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border animate-scale-up flex flex-col max-h-[85vh] ${
            isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-100"
          }`}>
            <div className={`p-5 border-b flex justify-between items-center shrink-0 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-slate-50 border-slate-200/60"}`}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" strokeWidth={2.5} />
                <h3 className={`font-black uppercase text-xs tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Vault Merge Wizard (Bulk Initialization)
                </h3>
              </div>
              <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md uppercase tracking-widest">
                Onboarding Step 1/1
              </span>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 hide-scrollbar">
              <div className="text-center max-w-xs mx-auto">
                <h4 className={`font-black text-sm uppercase tracking-wider mb-1 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                  Batch Update Backlog Allocation
                </h4>
                <p className="text-[11px] font-medium leading-relaxed text-slate-400">
                  Select which existing historical nodes to migrate from private boundaries into the shared workspace environment framework automatically.
                </p>
              </div>

              {/* Checklist Group Component 1: Accounts Migration Matrix */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Historical Account Entities Visibility Checklist</span>
                <div className="space-y-2">
                  {Object.keys(mergeAccounts).map((accName) => (
                    <button
                      key={accName}
                      onClick={() => setMergeAccounts({ ...mergeAccounts, [accName]: !mergeAccounts[accName] })}
                      className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                        mergeAccounts[accName]
                          ? isDarkMode ? "bg-slate-800/80 border-slate-600 text-white" : "bg-slate-50 border-slate-300 text-slate-900 font-bold"
                          : isDarkMode ? "bg-slate-900/30 border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wide truncate pr-4">{accName}</span>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        mergeAccounts[accName] ? "bg-purple-500 border-transparent text-white" : "border-slate-300 dark:border-slate-700"
                      }`}>
                        {mergeAccounts[accName] && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist Group Component 2: Recurring Bills Migration Matrix */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Historical Recurring Expense Elements Checklist</span>
                <div className="space-y-2">
                  {Object.keys(mergeBills).map((billName) => (
                    <button
                      key={billName}
                      onClick={() => setMergeBills({ ...mergeBills, [billName]: !mergeBills[billName] })}
                      className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                        mergeBills[billName]
                          ? isDarkMode ? "bg-slate-800/80 border-slate-600 text-white" : "bg-slate-50 border-slate-300 text-slate-900 font-bold"
                          : isDarkMode ? "bg-slate-900/30 border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wide truncate pr-4">{billName}</span>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        mergeBills[billName] ? "bg-purple-500 border-transparent text-white" : "border-slate-300 dark:border-slate-700"
                      }`}>
                        {mergeBills[billName] && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-5 border-t shrink-0 ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-slate-50 border-slate-100"}`}>
              <button
                onClick={() => {
                  setIsMergeWizardOpen(false);
                  setCoOpStep(3); // Set sharing connection active
                  setIsCoOpOpen(false); // Close out sheets back to main view panel tree
                  openGlobalAction("Handshake Finalized", "Batch transformation execution processed successfully in 12.4 seconds.", "Close", false, () => {}, true);
                }}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: signatureColor }}
              >
                Execute Batch Vault Synchronization Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
