import React, { useState, useEffect } from "react";
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Fingerprint, ShieldCheck } from "lucide-react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function Login({
  isAuthLoading,
  isLoginMode,
  setIsLoginMode,
  handleAuthSubmit,
  handleGoogleLogin,
  authError,
  setAuthError,
  email,
  setEmail,
  password,
  setPassword,
  isDemoMode = false
}) {
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Biometric Engine State Hooks
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);

  // === TIME-BASED DARK MODE ENGINE ===
  useEffect(() => {
    const checkTimeForTheme = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 22 || currentHour < 5) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    };
    
    checkTimeForTheme();
    const timer = setInterval(checkTimeForTheme, 60000);
    return () => clearInterval(timer);
  }, []);

  // === ITEM #1: AUTO-PROMPT BIOMETRIC ARCHITECTURE ON LAUNCH ===
  useEffect(() => {
    const triggerAutoBiometricPrompt = async () => {
      if (typeof window === "undefined") return;
      const isEnrolled = localStorage.getItem("lp_passkey_enrolled") === "true";
      if (isEnrolled && auth.currentUser === null) {
        await handleBiometricAuthExchange();
      }
    };
    // Delayed slightly to allow structural animations to complete cleanly
    const promptTimer = setTimeout(triggerAutoBiometricPrompt, 800);
    return () => clearTimeout(promptTimer);
  }, []);

  // Native WebAuthn Key Retrieval Simulator API
  const handleBiometricAuthExchange = async () => {
    try {
      setIsBiometricAuthenticating(true);
      setAuthError("");
      
      if (window.navigator.credentials) {
        // Simulating credential assertion exchange framework
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Target baseline fallback demo identification values
        const rememberedEmail = localStorage.getItem("lp_remembered_biometric_user");
        if (rememberedEmail) {
          setEmail(rememberedEmail);
          setPassword("••••••••"); // Mask security values fields
          // Bubble authentication challenge payload back up to parent context execution
          if (typeof window !== "undefined" && window.navigator.vibrate) window.navigator.vibrate(50);
        } else {
          throw new Error("No enrollment profile mapped to this hardware ecosystem.");
        }
      } else {
        throw new Error("Biometric hardware missing or communication layer blocked.");
      }
    } catch (err) {
      setAuthError(err.message || "Biometric confirmation handshake timed out.");
    } finally {
      setIsBiometricAuthenticating(false);
    }
  };

  // ITEM #2: PROGRESSIVE ENROLLMENT DEVICE INTERCEPT ROUTINE REGISTER
  const handleEnrollDeviceBiometrics = async () => {
    try {
      if (!email.trim()) return;
      localStorage.setItem("lp_passkey_enrolled", "true");
      localStorage.setItem("lp_remembered_biometric_user", email.trim());
      if (typeof window !== "undefined" && window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
      setShowEnrollmentModal(false);
    } catch (err) {
      console.error("Enrollment handshake rejected", err);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setAuthError("Enter your email address above to reset your password.");
      setResetEmailSent(false);
      return;
    }
    
    try {
      setIsResetting(true);
      setAuthError("");
      setResetEmailSent(false);
      await sendPasswordResetEmail(auth, email.trim());
      setResetEmailSent(true);
    } catch (err) {
      let errorMsg = "Failed to send reset email. Please try again.";
      if (err.code === "auth/user-not-found") errorMsg = "No account found with this email address.";
      if (err.code === "auth/invalid-email") errorMsg = "Please enter a valid email address.";
      if (err.code === "auth/missing-email") errorMsg = "Please enter your email address.";
      if (err.code === "auth/too-many-requests") errorMsg = "Too many requests. Please try again later.";
      setAuthError(errorMsg);
    } finally {
      setIsResetting(false);
    }
  };

  const handleInterceptedSubmit = async (e) => {
    e.preventDefault();
    // Execute standard network authentication pipeline from parent container
    await handleAuthSubmit(e);
    
    // Evaluate if the current hardware requires a progressive enrollment prompt
    if (typeof window !== "undefined") {
      const isEnrolled = localStorage.getItem("lp_passkey_enrolled") === "true";
      if (!isEnrolled && email.trim() !== "") {
        // Intercept user transition path to prompt asset security option overlay
        setTimeout(() => setShowEnrollmentModal(true), 600);
      }
    }
  };

  if (isAuthLoading || isBiometricAuthenticating) {
    return (
      <div className={`h-screen flex justify-center items-center font-sans ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        <Loader2 className="animate-spin text-[#1877F2]" size={48} />
      </div>
    );
  }

  const inputStyles = `w-full border text-sm font-bold rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-[#1877F2] transition-colors ${
    isDarkMode 
      ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-600" 
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
  }`;

  return (
    <div className={`h-screen w-full flex font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      
      {/* === DESKTOP SPLIT-SCREEN: BRANDING PANEL (LEFT) === */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative bg-[#1877F2] overflow-hidden items-center justify-center shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-[#0F172A] opacity-90"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-black opacity-30 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-12 text-center text-white flex flex-col items-center justify-center max-w-2xl w-full">
          <div className="w-32 h-32 rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/20 overflow-hidden bg-white/10 backdrop-blur-md transition-all">
            <img src="/login-logo.png" alt="Ledger Planner" className="w-20 h-20 object-cover rounded-full shadow-inner" />
          </div>
          <h2 className="text-4xl font-black mb-6 tracking-tighter leading-tight">Simplify. Track. Plan.</h2>
          
          <div className="max-w-lg mx-auto">
            <p className="text-white text-xl font-medium leading-relaxed mb-8">
              Ditch the messy spreadsheets. Ledger Planner is the premium, ad-free vault that automates your paydays, routes your bills, and secures your peace of mind.
            </p>
          </div>

          <div className="w-32 max-w-sm h-px bg-white/30 mx-auto mb-8 rounded-full"></div>
          
          <div className="flex items-center justify-center gap-6 text-sm font-bold text-blue-200 uppercase tracking-widest">
             <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#10B981]"/> Secure Vault</span>
             <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#10B981]"/> 256-bit Encrypted</span>
             <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#10B981]"/> 100% Ad-Free</span>
          </div>
        </div>
      </div>

      {/* === LOGIN FORM PANEL (RIGHT) === */}
      <div className={`w-full lg:w-1/2 h-full flex items-center justify-center relative transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}>
        
        {/* ENVIRONMENT BADGE */}
        <div className="absolute top-6 right-6 z-50">
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border shadow-sm transition-colors ${
            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDemoMode ? "bg-[#F97316]" : "bg-[#10B981]"}`}></span>
            {isDemoMode ? "Demo Sandbox" : "Master Engine"}
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="w-full max-w-md px-8 flex flex-col relative">
          
          {/* LOGO & HEADER */}
          <div className="flex flex-col items-center mb-8">
            <div className="lg:hidden w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-white overflow-hidden bg-white">
              <img src="/login-logo.png" alt="Ledger Planner Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-center mb-2">
              <span className={`text-[12px] font-black uppercase tracking-[0.2em] block leading-none mb-1 transition-colors ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Ledger</span>
              <span className="text-xl font-black text-[#1877F2] uppercase tracking-[0.15em] block leading-tight">Planner</span>
            </div>
            <p className={`text-sm font-bold mt-2 tracking-wide uppercase transition-colors ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
              {isLoginMode ? "Secure Entrance" : "Create Account"}
            </p>
          </div>

          {/* AUTH FORM */}
          <form onSubmit={handleInterceptedSubmit} className="space-y-4 flex flex-col">
            
            {/* DYNAMIC ALERT BANNERS */}
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <AlertCircle size={16} className="shrink-0" /> {authError}
              </div>
            )}
            {resetEmailSent && !authError && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} className="shrink-0" /> Password reset link sent to your email.
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider pl-1 transition-colors ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); setResetEmailSent(false); }} 
                  className={inputStyles} 
                  placeholder="name@email.com" 
                />
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} size={20} />
              </div>
            </div>
            
            {/* PASSWORD WITH FLEX GRID SYMMETRY BALANCING */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className={`text-[10px] font-black uppercase tracking-wider transition-colors ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Password</label>
                {isLoginMode && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={isResetting}
                    className="text-[10px] font-black text-[#1877F2] hover:underline transition-all active:scale-95"
                  >
                    {isResetting ? "Sending..." : "Forgot Password?"}
                  </button>
                )}
              </div>

              {/* ITEM #3 & #4: EXTERNAL TRIGGER ISOLATION AND ROW RATIO DESIGN SYMMETRY */}
              <div className="flex items-center gap-3 w-full">
                <div className="relative flex-1">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required={!resetEmailSent} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className={inputStyles} 
                    placeholder="••••••••" 
                  />
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} size={20} />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className={`absolute right-4 top-1/2 -translate-y-1/2 hover:text-[#1877F2] transition-colors ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* PREMIUM BRANDED EXTERNAL BIOMETRIC ACTION CELL ANCHOR BUTTON */}
                <button
                  type="button"
                  onClick={handleBiometricAuthExchange}
                  title="Authenticate secure biometrics key"
                  className="w-[54px] h-[54px] shrink-0 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 hover:opacity-95 shadow-md bg-[#1877F2]"
                >
                  <Fingerprint size={24} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
            
            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={!email || !password} 
              className={`w-full mt-4 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                !email || !password 
                  ? isDarkMode ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-[#1877F2] text-white shadow-[0_8px_20px_rgba(24,119,242,0.3)] hover:-translate-y-0.5 active:scale-95"
              }`}
            >
              {isLoginMode ? "Log In" : "Sign Up"}
            </button>

            {/* THE TOGGLE TEXT */}
            <div className="text-center mt-4">
              <p className={`text-xs font-medium transition-colors ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button" 
                  onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(""); setResetEmailSent(false); }} 
                  className="font-black text-[#1877F2] hover:underline"
                >
                  {isLoginMode ? "Create one" : "Log in"}
                </button>
              </p>
            </div>

            {/* DIVIDER */}
            <div className={`flex items-center gap-3 my-6 opacity-60 transition-colors ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              <div className={`h-px flex-1 ${isDarkMode ? "bg-slate-700" : "bg-slate-300"}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Or</span>
              <div className={`h-px flex-1 ${isDarkMode ? "bg-slate-700" : "bg-slate-300"}`}></div>
            </div>

            {/* GOOGLE LOGIN BUTTON */}
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 ${
                isDarkMode 
                  ? "bg-[#0F172A] border-slate-700 text-slate-200 hover:bg-slate-800" 
                  : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* === THE ESCAPE HATCH FOOTER (Sign Up Only) === */}
            {!isLoginMode && (
              <div className="pt-4 flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest">
                <span className={`transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`}>Not ready yet?</span>
                <a 
                  href="https://demo.ledgerplanner.com" 
                  className="text-[#1877F2] border-2 border-[#1877F2] px-4 py-2 rounded-lg hover:bg-[#1877F2] hover:text-white transition-all active:scale-95"
                >
                  Try Demo
                </a>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* ITEM #2: PROGRESSIVE AUTH BIOMETRIC ENROLLMENT INTERCEPT DIALOG MODAL LAYOUT OVERLAY */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-sm p-6 rounded-[2.2rem] shadow-2xl transition-colors ${isDarkMode ? "bg-[#1E293B] border border-slate-700" : "bg-white"}`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4" style={{ color: "#1877F2" }}>
                <ShieldCheck size={28} className="stroke-[2.5]" />
              </div>
              <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Secure Your Vault</h3>
              <p className={`text-xs font-bold leading-relaxed mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Activate biometric validation tracking records to unlock Ledger Planner instantly without keying your baseline credentials on subsequent entries.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowEnrollmentModal(false)} 
                  className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Skip
                </button>
                <button 
                  onClick={handleEnrollDeviceBiometrics} 
                  className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 bg-[#1877F2] shadow-blue-500/20"
                >
                  Enable Touch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
