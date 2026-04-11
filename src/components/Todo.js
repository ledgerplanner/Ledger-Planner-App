import React, { useState } from "react";
import { CheckCircle2, Circle, Trash2, X, Plus, Zap, ShoppingBag, Flame, Star, CheckSquare } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase"; 

export default function Todo({
  userName, todos, newTodoText, setNewTodoText,
  newTodoPriority, setNewTodoPriority, newTodoType, setNewTodoType,
  isDarkMode, handleAddTodo, toggleTodoStatus, renderHeroShell
}) {
  const [activeModalTodo, setActiveModalTodo] = useState(null);

  // === DATA SORTING & PRIORITY LOGIC ===
  // Sorts dynamically: 5 Stars at the top, 1 Star at the bottom
  const sortTasks = (tasks) => tasks.sort((a, b) => parseInt(b.priority || 1) - parseInt(a.priority || 1));

  const pendingActions = sortTasks(todos.filter(t => !t.isCompleted && t.type === "task"));
  const pendingShopping = sortTasks(todos.filter(t => !t.isCompleted && t.type === "shopping"));
  const completedTasks = sortTasks(todos.filter(t => t.isCompleted));

  // === MOMENTUM MATH (MASSIVE RING) ===
  const totalTasks = todos.length;
  const completedCount = completedTasks.length;
  const momentumPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // SVG Math matching the Dashboard & Activity Ring
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (momentumPct / 100) * circumference;

  // Trigger haptics locally for the modal
  const triggerHaptic = () => { if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) window.navigator.vibrate(50); };

  // Surgical Delete Function
  const handleDeleteTask = async () => {
    if (!auth.currentUser || !activeModalTodo) return;
    if (window.confirm("Delete this task permanently?")) {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "todos", activeModalTodo.id));
      triggerHaptic();
      setActiveModalTodo(null);
    }
  };

  // Helper to render premium GOLD stars
  const renderStars = (priorityNum) => {
    const p = parseInt(priorityNum) || 1;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={10} className={i <= p ? "text-[#FBBF24] fill-[#FBBF24]" : "text-slate-200 dark:text-slate-700"} />
        ))}
      </div>
    );
  };

  // === PREMIUM HERO CONTENT (FLAT LAYOUT - NO SPILLAGE) ===
  const graphicContent = (
    <div className="relative z-10 w-full flex items-center justify-between px-2 pt-2 pb-4">
      {/* 📊 THE MASSIVE SPEEOMETER RING (LEFT ALIGNED) */}
      <div className="relative w-40 h-40 shrink-0 drop-shadow-xl">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke={isDarkMode ? "#334155" : "#F1F5F9"} strokeWidth="12" />
          <circle
            cx="50" cy="50" r={radius} fill="transparent"
            stroke={momentumPct === 100 ? "#10B981" : "#1877F2"} strokeWidth="12"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className={`text-4xl font-black tracking-tighter transition-colors duration-500 ${momentumPct === 100 ? "text-[#10B981]" : isDarkMode ? "text-white" : "text-slate-900"}`}>
             {momentumPct}%
           </span>
        </div>
      </div>
      
      {/* 📊 DAILY OPERATIONS STATS (RIGHT ALIGNED) */}
      <div className="flex-1 flex flex-col items-end text-right space-y-1">
        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>DAILY OPERATIONS</p>
        <div className="flex items-baseline gap-1.5 pt-1">
          <p className={`text-6xl font-black tracking-tighter leading-none transition-all duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{completedCount}</p>
          <p className={`text-3xl font-black tracking-tighter leading-none opacity-50 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>/ {totalTasks}</p>
        </div>
        <p className={`text-xs font-bold truncate pt-1 ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>Total completed tasks</p>
      </div>
    </div>
  );

  // === PREMIUM TASK RENDERER ===
  const renderTaskCard = (task) => {
    return (
      <div 
        key={task.id} 
        onClick={() => setActiveModalTodo(task)}
        className={`relative flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] shadow-sm border
          ${task.isCompleted 
            ? isDarkMode ? "bg-slate-800 border-transparent" : "bg-white border-transparent" 
            : isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-slate-100"
          }
        `}
      >
        <div className="flex items-center gap-4 truncate">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleTodoStatus(task.id); }}
            className={`shrink-0 transition-colors 
              ${task.isCompleted 
                ? parseInt(task.priority) === 5 ? "text-[#FBBF24]" : "text-[#F97316]" 
                : "text-slate-300 hover:text-[#1877F2]"
              }
            `}
          >
            {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          </button>
          
          <div className="truncate pr-4">
            <p className={`font-bold text-sm truncate transition-all ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              {task.text}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {task.type === "shopping" ? <ShoppingBag size={10} className="text-[#10B981]" /> : <Zap size={10} className="text-[#1877F2]" />}
              {renderStars(task.priority)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 min-h-screen ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      
      {/* 🚀 FIXED: Render Hero Shell cleanly without extra padding/wrappers */}
      {renderHeroShell(`${userName}'s Tasks`, graphicContent)}

      <main className="px-6 space-y-6 mt-4">
        
        {/* PREMIUM ADD TASK INPUT (CAPSULE DESIGN) */}
        <div className={`p-4 rounded-[2rem] border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
          <div className="flex gap-2 mb-3">
             <button onClick={() => setNewTodoType("task")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${newTodoType === "task" ? "bg-[#1877F2] text-white shadow-md shadow-blue-500/20" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}>Action</button>
             <button onClick={() => setNewTodoType("shopping")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${newTodoType === "shopping" ? "bg-[#10B981] text-white shadow-md shadow-emerald-500/20" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}>Shopping</button>
          </div>
          <form onSubmit={handleAddTodo} className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="What needs to get done?" 
              value={newTodoText} 
              onChange={(e) => setNewTodoText(e.target.value)}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-transparent border outline-none transition-colors dark:border-slate-700 dark:text-white dark:focus:border-[#1877F2] focus:border-[#1877F2]"
            />
            <button 
              type="submit" 
              disabled={!newTodoText.trim()}
              className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-all ${!newTodoText.trim() ? "bg-slate-200 text-slate-400" : "bg-[#1877F2] text-white shadow-lg shadow-blue-500/30 active:scale-95"}`}
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </form>
          
          {/* 5-STAR GOLD PRIORITY SELECTOR */}
          <div className="flex items-center justify-between mt-4 px-2">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priority Level</span>
             <div className="flex gap-1.5">
               {[1, 2, 3, 4, 5].map(star => (
                 <Star 
                   key={star} 
                   size={24} 
                   onClick={() => setNewTodoPriority(star)}
                   className={`cursor-pointer transition-colors active:scale-90 ${star <= newTodoPriority ? "text-[#FBBF24] fill-[#FBBF24]" : "text-slate-200 dark:text-slate-700 hover:text-[#FDE68A]"}`} 
                 />
               ))}
             </div>
          </div>
        </div>

        {/* BLANK SLATE MESSAGE */}
        {todos.length === 0 && (
           <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={32} className="text-slate-300 dark:text-slate-600" /></div>
              <h3 className={`text-lg font-black mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}>The slate is clean.</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No tasks pending.<br/>Build your empire.</p>
           </div>
        )}

        {/* PENDING ACTIONS (BLUE CARD CONTAINER) */}
        {pendingActions.length > 0 && (
          <section className={`p-4 rounded-[2rem] border shadow-sm animate-fade-in transition-colors ${isDarkMode ? "bg-blue-900/10 border-blue-900/30" : "bg-blue-50/60 border-blue-100"}`}>
            <div className="flex items-center gap-2 mb-4 px-2">
              <Zap size={16} className="text-[#1877F2]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1877F2]">Pending Actions</h3>
            </div>
            <div className="space-y-2">
              {pendingActions.map(renderTaskCard)}
            </div>
          </section>
        )}

        {/* PENDING SHOPPING (GREEN CARD CONTAINER) */}
        {pendingShopping.length > 0 && (
          <section className={`p-4 rounded-[2rem] border shadow-sm animate-fade-in transition-colors ${isDarkMode ? "bg-emerald-900/10 border-emerald-900/30" : "bg-emerald-50/60 border-emerald-100"}`}>
            <div className="flex items-center gap-2 mb-4 px-2">
              <ShoppingBag size={16} className="text-[#10B981]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">Pending Shopping</h3>
            </div>
            <div className="space-y-2">
              {pendingShopping.map(renderTaskCard)}
            </div>
          </section>
        )}

        {/* COMPLETED TASKS (ORANGE CARD CONTAINER) */}
        {completedTasks.length > 0 && (
          <section className={`p-4 rounded-[2rem] border shadow-sm animate-fade-in transition-colors ${isDarkMode ? "bg-orange-900/10 border-orange-900/30" : "bg-orange-50/60 border-orange-100"}`}>
            <div className="flex items-center gap-2 mb-4 px-2">
              <CheckCircle2 size={16} className="text-[#F97316]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#F97316]">Completed Tasks</h3>
            </div>
            <div className="space-y-2">
              {completedTasks.map(renderTaskCard)}
            </div>
          </section>
        )}
      </main>

      {/* ========================================================= */}
      {/* THE ACTION DRAWER (MODAL) */}
      {/* ========================================================= */}
      {activeModalTodo && (
        <div className="absolute inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setActiveModalTodo(null)}></div>
          <div className={`w-full rounded-t-[2.5rem] shadow-2xl animate-slide-up relative z-10 flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckSquare size={20} className={activeModalTodo.isCompleted ? parseInt(activeModalTodo.priority) === 5 ? "text-[#FBBF24]" : "text-[#F97316]" : "text-[#1877F2]"} />
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Task Details</h3>
              </div>
              <button onClick={() => setActiveModalTodo(null)} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center px-4">
                <h2 className={`text-xl font-black leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{activeModalTodo.text}</h2>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border dark:border-slate-700">
                  {activeModalTodo.type === "shopping" ? <ShoppingBag size={12} className="text-[#10B981]" /> : <Zap size={12} className="text-[#1877F2]" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {activeModalTodo.type === "shopping" ? "Shopping List" : "Action Item"}
                  </span>
                </div>
              </div>
              
              <div className={`rounded-2xl p-4 border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                  <span className={`text-xs font-black ${activeModalTodo.isCompleted ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
                    {activeModalTodo.isCompleted ? "Completed" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priority Level</span>
                  <div>{renderStars(activeModalTodo.priority)}</div>
                </div>
              </div>
              
              <button 
                onClick={handleDeleteTask} 
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-500 border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isDarkMode ? "bg-red-900/10 border-red-900/30 hover:bg-red-900/20" : "bg-red-50/50 border-red-100 hover:bg-red-50"}`}
              >
                <Trash2 size={16} /> Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
