import React, { useState } from "react";
import { CheckCircle2, Circle, Trash2, X, Plus, Zap, ShoppingBag, AlertCircle, Flame } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase"; // Needed for the surgical delete!

export default function Todo({
  userName, todos, newTodoText, setNewTodoText,
  newTodoPriority, setNewTodoPriority, newTodoType, setNewTodoType,
  isDarkMode, handleAddTodo, toggleTodoStatus, renderHeroShell
}) {
  // Local state for the new "Action Drawer"
  const [activeModalTodo, setActiveModalTodo] = useState(null);

  // === DATA SORTING ===
  const pendingActions = todos.filter(t => !t.isCompleted && t.type === "task");
  const pendingShopping = todos.filter(t => !t.isCompleted && t.type === "shopping");
  const completedTasks = todos.filter(t => t.isCompleted);

  // === MOMENTUM MATH (HERO BAR) ===
  const totalTasks = todos.length;
  const completedCount = completedTasks.length;
  const momentumPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

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

  // === PREMIUM HERO CONTENT ===
  const graphicContent = (
    <div className="relative z-10 mb-2 w-full px-4">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Execution Momentum</p>
          <p className={`text-5xl font-black tracking-tighter transition-all duration-300 ${momentumPct === 100 ? "text-[#10B981]" : isDarkMode ? "text-white" : "text-slate-900"}`}>
            {momentumPct}%
          </p>
        </div>
        <div className="flex items-center gap-1 mb-2">
           <Flame size={16} className={momentumPct > 0 ? "text-[#F97316]" : "text-slate-300 dark:text-slate-700"} />
           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{completedCount} / {totalTasks}</span>
        </div>
      </div>

      {/* MOMENTUM PROGRESS BAR */}
      <div className={`w-full h-4 rounded-full flex overflow-hidden shadow-inner ${isDarkMode ? "bg-[#1E293B]" : "bg-slate-100"}`}>
        <div 
          className={`h-full transition-all duration-1000 ease-out ${momentumPct === 100 ? "bg-[#10B981]" : "bg-[#1877F2]"}`} 
          style={{ width: `${momentumPct}%` }}
        ></div>
      </div>
    </div>
  );

  // === PREMIUM TASK RENDERER ===
  const renderTaskCard = (task) => {
    const isHighPriority = task.priority === "1" || task.priority === 1; // Assuming 1 is highest
    
    return (
      <div 
        key={task.id} 
        onClick={() => setActiveModalTodo(task)}
        className={`relative flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] mb-2 shadow-sm border
          ${task.isCompleted 
            ? isDarkMode ? "bg-slate-800/30 border-transparent opacity-60" : "bg-slate-50 border-transparent opacity-60" 
            : isHighPriority
              ? isDarkMode ? "bg-[#1E293B] border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "bg-white border-red-100 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
              : isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"
          }
        `}
      >
        <div className="flex items-center gap-4 truncate">
          {/* Checkbox (Stops click from opening modal so you can just check it off) */}
          <button 
            onClick={(e) => { e.stopPropagation(); toggleTodoStatus(task.id); }}
            className={`shrink-0 transition-colors ${task.isCompleted ? "text-[#10B981]" : "text-slate-300 hover:text-[#1877F2]"}`}
          >
            {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          </button>
          
          <div className="truncate pr-4">
            <p className={`font-bold text-sm truncate transition-all ${task.isCompleted ? "line-through text-slate-400" : isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              {task.text}
            </p>
            {!task.isCompleted && (
              <div className="flex items-center gap-2 mt-1">
                {task.type === "shopping" ? <ShoppingBag size={10} className="text-[#1877F2]" /> : <Zap size={10} className="text-[#F59E0B]" />}
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isHighPriority ? "text-red-500" : "text-slate-400"}`}>
                  {isHighPriority ? "High Priority" : "Standard"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 min-h-screen ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`Output & Tasks`, graphicContent)}

      <main className="px-6 space-y-8 mt-2">
        
        {/* PREMIUM ADD TASK INPUT */}
        <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
          <div className="flex gap-2 mb-3">
             <button onClick={() => setNewTodoType("task")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${newTodoType === "task" ? "bg-[#F59E0B] text-white shadow-md shadow-orange-500/20" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}>Action</button>
             <button onClick={() => setNewTodoType("shopping")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${newTodoType === "shopping" ? "bg-[#1877F2] text-white shadow-md shadow-blue-500/20" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}>Shopping</button>
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
          <div className="flex items-center justify-between mt-3 px-2 cursor-pointer" onClick={() => setNewTodoPriority(newTodoPriority === 1 ? 3 : 1)}>
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mark as High Priority?</span>
             <div className={`w-10 h-6 rounded-full p-1 transition-colors ${newTodoPriority === 1 ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"}`}>
               <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${newTodoPriority === 1 ? "translate-x-4" : "translate-x-0"}`}></div>
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

        {/* PENDING ACTIONS */}
        {pendingActions.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-3 px-2">
              <Zap size={14} className="text-[#F59E0B]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Actions</h3>
            </div>
            {pendingActions.map(renderTaskCard)}
          </section>
        )}

        {/* PENDING SHOPPING */}
        {pendingShopping.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-3 px-2">
              <ShoppingBag size={14} className="text-[#1877F2]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Shopping</h3>
            </div>
            {pendingShopping.map(renderTaskCard)}
          </section>
        )}

        {/* COMPLETED TASKS */}
        {completedTasks.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-3 px-2">
              <CheckCircle2 size={14} className="text-[#10B981]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed Tasks</h3>
            </div>
            {completedTasks.map(renderTaskCard)}
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
                <CheckSquare size={20} className={activeModalTodo.isCompleted ? "text-[#10B981]" : "text-[#1877F2]"} />
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Task Details</h3>
              </div>
              <button onClick={() => setActiveModalTodo(null)} className="p-2 rounded-full"><X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center px-4">
                <h2 className={`text-xl font-black leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{activeModalTodo.text}</h2>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border dark:border-slate-700">
                  {activeModalTodo.type === "shopping" ? <ShoppingBag size={12} className="text-[#1877F2]" /> : <Zap size={12} className="text-[#F59E0B]" />}
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
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priority Level</span>
                  <span className={`text-xs font-black ${activeModalTodo.priority === "1" || activeModalTodo.priority === 1 ? "text-red-500" : isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {activeModalTodo.priority === "1" || activeModalTodo.priority === 1 ? "High (CEO Level)" : "Standard"}
                  </span>
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
