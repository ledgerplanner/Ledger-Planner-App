import React, { useState, useEffect, useRef } from "react";
import { 
  X, User, CreditCard, RefreshCw, AlertCircle, Trash2, LogOut, 
  ChevronRight, Sparkles, Globe, Palette, Shield, Check, HelpCircle, Briefcase,
  Download, FileText, ChevronLeft, TrendingUp
} from "lucide-react";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Settings({
  userName,
  user,
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
  setCurrentCurrency,
  handleUpdateDisplayName, 
  isEntrepreneurMode = false,
  setIsEntrepreneurMode,
  handleExportData,
  triggerVictory
}) {
  const [editName, setEditName] = useState(userName || "");
  const [editBirthday, setEditBirthday] = useState(""); 
  
  const birthdayInputRef = useRef(null);
  const [activeView, setActiveView] = useState("main"); // "main", "profile", "personalization", "offers", "security"
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

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
    { name: "Neon Yellow", hex: "#FBBF24" },
    { name: "Midnight Purple", hex: "#8B5CF6" },
    { name: "Crimson Forge", hex: "#EF4444" },
    { name: "Cyan Wave", hex: "#0EA5E9" },
    { name: "Rose Quartz", hex: "#EC4899" },
    { name: "Slate Charcoal", hex: "#64748B" },
    { name: "Volcanic Amber", hex: "#B45309" },
    { name: "Amethyst Wine", hex: "#6B21A8" },
    { name: "Teal Glacier", hex: "#0D9488" },
    { name: "Burnt Coral", hex: "#E11D48" },
    { name: "Electric Lavender", hex: "#C084FC" }
  ];

  const previousYear = new Date().getFullYear() - 1;

  useEffect(() => {
    if (!user || isDemoMode) return;
    const fetchBirthday = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().birthday) {
          setEditBirthday(docSnap.data().birthday);
        }
      } catch (err) {
        console.error("Failed to load user birthday:", err);
      }
    };
    fetchBirthday();
  }, [user, isDemoMode]);

  const handleUpdateBirthday = async (newDate) => {
    if (!newDate || !user) return;
    if (isDemoMode) {
       openGlobalAction("Demo Mode Active", "Data synchronization disabled in demo environment.", "Close", false, () => {}, true);
       return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid), { birthday: newDate });
      openGlobalAction("Birthday Date Set", "Happy Birthday to you, and to you many more!", "Close", false, () => {}, true);
      if (triggerVictory) triggerVictory(); 
    } catch (err) {
      console.error("Failed to sync birthday date:", err);
    }
  };

  const closeButtonClass = `p-2 rounded-full transition-colors ${
    isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
  }`;

  const DirectoryRow = ({ icon: Icon, title, description, colorClass, targetView }) => (
    <button
      onClick={() => setActiveView(targetView)}
      className={`w-full flex items-center p-4 rounded-[1.5rem] border text-left transition-all active:scale-[0.99] gap-4 mb-3 ${
        isDarkMode 
          ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80" 
          : "bg-white border-slate-200 hover:bg-slate-50/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className={`p-3 rounded-2xl shrink-0 ${isDarkMode ? "bg-slate-900/60" : "bg-slate-50"} ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-xs font-black uppercase tracking-wider truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
          {title}
        </h4>
        <p className={`text-[10px] font-bold mt-1 leading-snug truncate ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
          {description}
        </p>
      </div>
      <ChevronRight size={16} className={isDarkMode ? "text-slate-600" : "text-slate-300"} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
      
      <div className={`w-full lg:max-w-md h-[90vh] rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative z-[130] flex flex-col overflow-hidden border ${
        isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-[#F8FAFC] border-slate-100"
      }`}>
        
        {/* DYNAMIC HEADER */}
        <div className={`p-5 border-b flex justify-between items-center shrink-0 relative z-30 transition-colors ${
          isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200/60 shadow-sm"
        }`}>
          {activeView === "main" ? (
            <h3 className={`font-black uppercase tracking-widest text-sm flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              <Shield size={16} style={{ color: signatureColor }} strokeWidth={2.5} /> Settings Vault
            </h3>
          ) : (
            <button onClick={() => setActiveView("main")} className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
              <ChevronLeft size={16} strokeWidth={2.5} /> Back to Settings Vault
            </button>
          )}
          <button onClick={() => setIsSettingsOpen(false)} className={closeButtonClass}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className={`p-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${
          isDemoMode ? "pb-[140px] lg:pb-6" : "pb-12 lg:pb-6"
        }`}>

          {/* ========================================= */}
          {/* VIEW: MAIN DIRECTORY HUB                  */}
          {/* ========================================= */}
          {activeView === "main" && (
            <div className="animate-fade-in space-y-2">
              <div className={`p-5 rounded-[2rem] border relative overflow-hidden bg-gradient-to-br transition-all duration-300 mb-8 ${
                isDarkMode 
                  ? "from-slate-900 via-slate-800 to-black border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.5)]" 
                  : "from-white via-slate-50 to-slate-100 border-slate-200 shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Account Status</span>
                    <p className={`text-base font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ledger Planner Pro</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
                      <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Account Active</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => openGlobalAction("Subscription Portal", "Establishing secure handshakes to billing validation channels...", "Close", false, () => {}, true)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${
                      isDarkMode 
                        ? "border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700" 
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    Manage
                  </button>
                </div>
              </div>

              <h4 className={`text-[10px] font-black uppercase tracking-widest px-2 pb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Ledger Planner Settings
              </h4>

              <DirectoryRow 
                icon={User} 
                title="Profile" 
                description="Display Name, Set Birthday" 
                colorClass="text-blue-500" 
                targetView="profile" 
              />
              <DirectoryRow 
                icon={Palette} 
                title="Personalization & System" 
                description="Theme Color, Currency, Income Structure" 
                colorClass="text-orange-500" 
                targetView="personalization" 
              />
              
              {/* SURGICAL INJECTION: CREDIT MONITORING & OFFERS */}
              <DirectoryRow 
                icon={TrendingUp} 
                title="Credit Monitoring & Offers" 
                description="Credit Score Offer, More Offers" 
                colorClass="text-purple-500" 
                targetView="offers" 
              />

              <DirectoryRow 
                icon={Shield} 
                title="Security & Export" 
                description="Data Downloads, Support, Factory Reset" 
                colorClass="text-emerald-500" 
                targetView="security" 
              />
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW: PROFILE                             */}
          {/* ========================================= */}
          {activeView === "profile" && (
            <div className="animate-slide-up space-y-4">
              <h4 className={`text-[14px] font-black uppercase tracking-widest px-2 mb-2 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                <User size={16} strokeWidth={2.5} className="text-blue-500" /> Profile
              </h4>

              {/* Preferred Display Name */}
              <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  👤 PREFERRED DISPLAY NAME
                </label>
                <div className="flex flex-col gap-2.5">
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs border focus:outline-none transition-colors ${
                      isDarkMode ? "bg-[#0F172A] border-slate-700 text-white focus:border-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"
                    }`} 
                  />
                  <button 
                    onClick={() => {
                      if (handleUpdateDisplayName) handleUpdateDisplayName(editName);
                      openGlobalAction("Display Name Updated", "Your name has been successfully updated.", "Close", false, () => {}, true);
                      if (triggerVictory) triggerVictory();
                    }}
                    disabled={!editName.trim() || editName === userName}
                    className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: (editName.trim() && editName !== userName) ? signatureColor : isDarkMode ? "#1E293B" : "#E2E8F0", color: (editName.trim() && editName !== userName) ? "#FFFFFF" : "#94A3B8" }}
                  >
                    UPDATE DISPLAY NAME
                  </button>
                </div>
              </div>

              {/* Master Signature Line */}
              <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

              {/* Set Birthday Picker */}
              <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  🎂 SET BIRTHDAY
                </label>
                <div className="flex flex-col gap-2.5">
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => {
                      try {
                        if (birthdayInputRef.current && typeof birthdayInputRef.current.showPicker === 'function') {
                          birthdayInputRef.current.showPicker();
                        }
                      } catch (e) {
                        if (birthdayInputRef.current) birthdayInputRef.current.focus();
                      }
                    }}
                  >
                    <input 
                      type="date" 
                      ref={birthdayInputRef}
                      value={editBirthday} 
                      onChange={(e) => setEditBirthday(e.target.value)} 
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs border focus:outline-none transition-colors cursor-pointer ${
                        isDarkMode ? "bg-[#0F172A] border-slate-700 text-white focus:border-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"
                      }`} 
                    />
                  </div>
                  <button 
                    onClick={() => handleUpdateBirthday(editBirthday)}
                    disabled={!editBirthday}
                    className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: editBirthday ? signatureColor : isDarkMode ? "#1E293B" : "#E2E8F0", color: editBirthday ? "#FFFFFF" : "#94A3B8" }}
                  >
                    SET BIRTHDAY DATE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW: PERSONALIZATION & SYSTEM            */}
          {/* ========================================= */}
          {activeView === "personalization" && (
            <div className="animate-slide-up space-y-4">
              <h4 className={`text-[14px] font-black uppercase tracking-widest px-2 mb-2 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                <Palette size={16} strokeWidth={2.5} className="text-orange-500" /> Personalization
              </h4>

              {/* Select Theme Color */}
              <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  🎨 SELECT THEME COLOR
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {premiumPalette.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSignatureColor && setSignatureColor(color.hex)}
                      className="h-10 rounded-xl relative transition-transform active:scale-90 flex items-center justify-center border shadow-sm"
                      style={{ backgroundColor: color.hex, borderColor: signatureColor === color.hex ? "#FFFFFF" : "transparent" }}
                    >
                      {color.hex === "#1877F2" && (
                        <span className="absolute -top-3 -right-2 bg-slate-800 text-white text-[5px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-slate-600 shadow-xl z-10">
                          DEFAULT
                        </span>
                      )}
                      {signatureColor === color.hex && (
                        <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Signature Line */}
              <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

              {/* Select Currency */}
              <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  🌐 SELECT CURRENCY
                </label>
                <div className="flex flex-col gap-2.5">
                  <div className={`w-full py-3 px-4 rounded-xl font-bold text-xs border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-blue-400" />
                      <span>Active Currency</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded border ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900"}`}>{currentCurrency}</span>
                  </div>
                  <button
                    onClick={() => setIsCurrencyOpen(true)}
                    className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: signatureColor }}
                  >
                    CHANGE CURRENCY
                  </button>
                </div>
              </div>

              {/* Master Signature Line */}
              <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

              {/* Income Structure */}
              <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  💼 INCOME STRUCTURE
                </label>
                <div className="flex flex-col gap-2.5">
                  <div className={`w-full py-3 px-4 rounded-xl font-bold text-xs border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-emerald-500" />
                      <span>Active Mode</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded border ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                      {isEntrepreneurMode ? "Entrepreneur" : "Standard"}
                    </span>
                  </div>
                  <div className={`flex p-1 rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                    
                    <button
                      onClick={() => {
                        if (!isEntrepreneurMode) return; 
                        if (setIsEntrepreneurMode) setIsEntrepreneurMode(false);
                        openGlobalAction("Standard Mode Active", "Standard W-2 Payday routing restored successfully.", "Close", false, () => {}, true);
                      }}
                      disabled={!isEntrepreneurMode}
                      className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        !isEntrepreneurMode
                          ? "text-white shadow-sm cursor-not-allowed opacity-90"
                          : isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                      }`}
                      style={{ backgroundColor: !isEntrepreneurMode ? signatureColor : undefined }}
                    >
                      Standard
                    </button>

                    <button
                      onClick={() => {
                        if (isEntrepreneurMode) return; 
                        if (setIsEntrepreneurMode) setIsEntrepreneurMode(true);
                        openGlobalAction("Entrepreneur Mode Active", "Entrepreneur income routing successfully activated.", "Close", false, () => {}, true);
                      }}
                      disabled={isEntrepreneurMode}
                      className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        isEntrepreneurMode
                          ? "text-white shadow-sm cursor-not-allowed opacity-90"
                          : isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                      }`}
                      style={{ backgroundColor: isEntrepreneurMode ? signatureColor : undefined }}
                    >
                      Entrepreneur
                    </button>

                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================= */}
          {/* VIEW: LEDGER EXCLUSIVES & OFFERS          */}
          {/* ========================================= */}
          {activeView === "offers" && (
            <div className="animate-slide-up space-y-4">
              <h4 className={`text-[14px] font-black uppercase tracking-widest px-2 mb-2 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                <TrendingUp size={16} strokeWidth={2.5} className="text-purple-500" /> Credit Monitoring & Offers
              </h4>

              {/* Exclusive Credit Offer Card */}
              <div className={`relative rounded-[2rem] p-5 border flex flex-col text-center overflow-hidden transition-all duration-300 ${
                isDarkMode 
                  ? "bg-gradient-to-br from-slate-900 via-slate-800 to-black border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.5)]" 
                  : "bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200 shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/15 blur-2xl rounded-full pointer-events-none"></div>
                <h3 className={`text-sm font-black tracking-tight mb-2 relative z-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Exclusive Credit Offer!</h3>
                <p className={`text-[10px] font-bold mb-5 px-4 relative z-10 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <span className="block">Access your 3-Bureau Credit Score</span>
                  <span className="block">with 24/7 monitoring and identity protection.</span>
                </p>
                <a 
                  href={`https://www.smartcredit.com/join/?pid=65366&sid=${user?.uid || "UNKNOWN_USER"}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="relative z-10 w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                  style={{ backgroundColor: user?.creditStatus === "trial_active" ? "#64748B" : "#1877F2" }}
                >
                  {user?.creditStatus === "trial_active" ? (
                    <>⏳ Credit Trial Linked</>
                  ) : (
                    <><TrendingUp size={16} strokeWidth={2.5} /> Unlock My 7-Day Credit Trial for $1</>
                  )}
                </a>
              </div>

              {/* Master Signature Line */}
              <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

              {/* Placeholder Card */}
              <div className={`p-6 rounded-[2rem] border border-dashed flex items-center justify-center text-center transition-all ${isDarkMode ? "bg-slate-800/20 border-slate-700" : "bg-slate-50/50 border-slate-200"}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  More partner offers coming soon...
                </p>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW: SECURITY & EXPORT                   */}
          {/* ========================================= */}
          {activeView === "security" && (
            <div className="animate-slide-up space-y-4">
              <h4 className={`text-[14px] font-black uppercase tracking-widest px-2 mb-2 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                <Shield size={16} strokeWidth={2.5} className="text-emerald-500" /> Security
              </h4>

              {/* Export Ledger */}
              <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  📄 EXPORT MASTER LEDGER
                </label>
                <div className="flex flex-col gap-2.5">
                  <div className={`w-full py-3 px-4 rounded-xl font-bold text-xs border flex items-center justify-between transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[#10B981]" />
                      <span>File Format</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded border ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900"}`}>CSV Spreadsheet</span>
                  </div>
                  <button
                    onClick={() => { 
                      if (handleExportData) handleExportData(previousYear); 
                    }}
                    className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: signatureColor }}
                  >
                    EXPORT {previousYear} DATA
                  </button>
                </div>
              </div>

              {/* Master Signature Line */}
              <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

              {/* Support */}
              <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  🛠️ CONTACT SUPPORT
                </label>
                <div className="flex flex-col gap-2.5">
                  <div className={`w-full py-3 px-4 rounded-xl font-bold text-xs border text-center transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    Response Window: Under 24 Hours
                  </div>
                  <button
                    onClick={() => {
                      window.location.href = `mailto:support@ledgerplanner.com?subject=Ledger Planner 2.0 - Support Ticket [${userName || "User"}]`;
                    }}
                    className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: signatureColor }}
                  >
                    OPEN SUPPORT TICKET
                  </button>
                </div>
              </div>

              {/* Master Signature Line */}
              <div className={`border-t ${isDarkMode ? "border-[#FFFFFF]" : "border-slate-300"}`}></div>

              {/* Nuke Zone */}
              <div className={`p-5 rounded-[2rem] border ${isDarkMode ? "bg-red-950/10 border-red-900/30" : "bg-red-50/40 border-red-200 shadow-sm"}`}>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                  ⚠️ LEDGER PLANNER FACTORY RESET
                </label>
                <p className={`text-[11px] font-medium leading-relaxed mb-4 text-center ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Performing a Factory Reset wipes your data clean. This action cannot be reversed.
                  <br /><br />
                  Type <strong className="text-red-500 font-bold">RESET</strong> in all caps below to permanently wipe your system.
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
                  onClick={() => {
                    openGlobalAction(
                      "Factory Reset", 
                      "Are you absolutely certain you want to permanently wipe all tracking ledgers? This action cannot be undone.", 
                      "Execute Wipe", 
                      true, 
                      handleFactoryReset
                    );
                  }}
                  disabled={resetConfirm !== "RESET"}
                  className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all border border-transparent flex items-center justify-center gap-2 ${
                    resetConfirm === "RESET" 
                      ? "bg-red-600 shadow-[0_6px_16px_rgba(220,38,38,0.3)] active:scale-[0.98] hover:bg-red-700" 
                      : "bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50 shadow-none"
                  }`}
                >
                  <Trash2 size={14} strokeWidth={2.5} /> RESET MY LEDGER
                </button>
              </div>

            </div>
          )}
          
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
                    openGlobalAction("Currency Updated", `Ledger Planner has been set to ${currency.symbol}. Your currency has been updated.`, "Close", false, () => {}, true);
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
    </div>
  );
}
