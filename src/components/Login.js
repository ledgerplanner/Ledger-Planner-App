import React from "react";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function Login({
  isAuthLoading,
  isLoginMode,
  setIsLoginMode,
  handleAuthSubmit,
  authError,
  setAuthError,
  email,
  setEmail,
  password,
  setPassword
}) {
  // If Firebase is still figuring out if the user is logged in, show the spinner
  if (isAuthLoading) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex justify-center items-center font-sans">
        <Loader2 className="animate-spin text-[#1877F2]" size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex justify-center font-sans overflow-hidden">
      <div className="w-full max-w-md bg-white h-full relative shadow-2xl flex flex-col px-8 pt-24 pb-10">
        
        {/* LOGO & HEADER */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white overflow-hidden bg-white">
            <img src="/login-logo.png" alt="Ledger Planner Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-center mb-2">
            <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] block leading-none mb-1">Ledger</span>
            <span className="text-xl font-black text-[#1877F2] uppercase tracking-[0.15em] block leading-tight">Planner</span>
          </div>
          <p className="text-sm font-bold text-slate-400 mt-4 tracking-wide uppercase">
            {isLoginMode ? "Secure Entrance" : "Create Account"}
          </p>
        </div>

        {/* AUTH FORM */}
        <form onSubmit={handleAuthSubmit} className="space-y-5 flex-1">
          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} /> {authError}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Email</label>
            <div className="relative">
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#1877F2]" 
                placeholder="name@email.com" 
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#1877F2]" 
                placeholder="••••••••" 
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={!email || !password} 
            className={`w-full mt-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!email || !password ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#1877F2] text-white shadow-[0_8px_20px_rgba(24,119,242,0.3)]"}`}
          >
            {isLoginMode ? "Unlock Vault" : "Initialize Account"}
          </button>
          
          <div className="text-center mt-6">
            <button 
              type="button" 
              onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(""); }} 
              className="text-xs font-bold text-slate-400 hover:text-[#1877F2] transition-colors"
            >
              {isLoginMode ? "Need an account? Create one." : "Already have an account? Log in."}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}
