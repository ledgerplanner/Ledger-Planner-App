import React, { useState } from "react";
import { CheckCircle2, Circle, Trash2, X, Plus, Zap, ShoppingBag, Flame, Star, CheckSquare, Edit2, Save } from "lucide-react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase"; 

export default function Todo({
  userName, todos, newTodoText, setNewTodoText,
  newTodoPriority, setNewTodoPriority, newTodoType, setNewTodoType,
  isDarkMode, handleAddTodo, toggleTodoStatus, renderHeroShell, clearCompletedTodos, openGlobalAction
}) {
  const [activeModalTodo, setActiveModalTodo] = useState(null);
  
  // === NEW: EDIT STATE ===
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskData, setEditTaskData] = useState({ text: "", priority: 3, type: "task" });

  // === DATA SORTING & PRIORITY LOGIC ===
  const sortTasks = (tasks) => tasks.sort((a, b) => parseInt(b.priority || 1) - parseInt(a.priority || 1));

  const pendingActions = sortTasks(todos.filter(t => !t.isCompleted && t.type === "task"));
  const pendingShopping = sortTasks(todos.filter(t => !t.isCompleted && t.type === "shopping"));
  const completedTasks = sortTasks(todos.filter(t => t.isCompleted));

  // === MOMENTUM MATH (MASSIVE RING) ===
  const totalTasks = todos.length;
  const completedCount = completedTasks.length;
  const momentumPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (momentumPct / 100) * circumference;

  const triggerHaptic = () => { if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) window.navigator.vibrate(50); };

  // Surgical Delete Function (Upgraded to Premium Modal)
  const handleDeleteTask = () => {
    if (!auth.currentUser || !activeModalTodo) return;
    
    openGlobalAction(
      "Delete Task", 
      "Are you sure you want to permanently delete this task?", 
      "Delete", 
      true, // isDanger = true (Red Button)
      async () => {
        try {
          await deleteDoc(doc(db, "users", auth.currentUser.uid, "todos", activeModalTodo.id));
          triggerHaptic();
          setActiveModalTodo(null);
          setIsEditingTask(false);
          
          // Failsafe to auto-close the global modal since Todo.js doesn't have direct access to setGlobalActionConfig
          setTimeout(() => {
            const cancelBtns = Array.from(document.querySelectorAll('button')).filter(btn => btn.textContent.trim().toUpperCase() === "CANCEL");
            if (cancelBtns.length > 0) cancelBtns[0].click();
          }, 50);
        } catch (error) {
          console.error("Error deleting task:", error);
        }
      }
    );
  };

  // 🔥 NEW: Surgical Edit Function
  const handleSaveEdit = async () => {
    if (!auth.currentUser || !activeModalTodo || !editTaskData.text.trim()) return;
    
    await updateDoc(doc(db, "users", auth.currentUser.uid, "todos", activeModalTodo.id), {
        text: editTaskData.text,
        priority: editTaskData.priority,
        type: editTaskData.type
    });
    
    triggerHaptic();
    setIsEditingTask(false);
    // Locally update the active modal so it reflects the new data immediately
    setActiveModalTodo({ ...activeModalTodo, ...editTaskData });
  };

  const renderStars = (priorityNum) => {
    const p = parseInt(priorityNum) || 1;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={10} className={i <= p ? "text-[#FBBF24] fill-[#FBBF24]" : (isDarkMode ? "text-slate-700" : "text-slate-200")} />
        ))}
      </div>
    );
  };

  // === PREMIUM HERO CONTENT ===
  const graphicContent = (
    <div className="relative z-10 w-full flex items-center justify-between px-2 pt-2 pb-4">
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
      
      <div className="flex-1 flex flex-col items-end text-right space-y-1">
        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>DAILY OPERATIONS</p>
        <div className="flex items-baseline gap-1.5 pt-1">
          <p className="text-6xl font-black tracking-tighter leading-none transition-all duration-300 text-[#1877F2]">{completedCount}</p>
          <p className={`text-3xl font-black tracking-tighter leading-none opacity-50 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>/ {totalTasks}</p>
        </div>
        <p className={`text-xs font-bold truncate pt-1 ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>Total completed tasks</p>
      </div>
    </div>
  );

  const renderTaskCard = (task) => {
    return (
      <div 
        key={task.id} 
        onClick={() => {
            setActiveModalTodo(task);
            setIsEditingTask(false);
        }}
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
                ? "text-[#F97316]" // 🔥 FORCE ALL COMPLETED CHECKMARKS TO VIBRANT ORANGE
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
      
      {renderHeroShell(`${userName}'s Tasks`, graphicContent)}

      <main className="px-6 space-y-6 mt-4">
        
        <div className={`p-4 rounded-[2rem] border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
          <div className="flex gap-2 mb-3">
             <button onClick={() => setNewTodoType("task")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${newTodoType === "task" ? "bg-[#1877F2] text-white shadow-md shadow-blue-500/20" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}>Action</button>
             <button onClick={() => setNewTodoType("shopping")} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${newTodoType === "shopping" ? "bg-[#10B981] text-white shadow-md shadow-emerald-500/20" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}>Shopping</button>
          </div>
          <form onSubmit={handleAddTodo} className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="New task or future purchase?" 
              value={newTodoText} 
              onChange={(e) => setNewTodoText(e.target.value)}
              className={`flex-1 min-w-0 py-3 px-4 rounded-xl text-sm font-bold bg-transparent border outline-none transition-colors focus:border-[#1877F2] ${isDarkMode ? "text-white border-slate-700" : "text-slate-900 border-slate-200"}`}
            />
            <button 
              type="submit" 
              disabled={!newTodoText.trim()}
              className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-all ${!newTodoText.trim() ? "bg-slate-200 text-slate-400" : "bg-[#1877F2] text-white shadow-[0_8px_16px_rgba(24,119,242,0.3)] active:scale-95"}`}
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </form>
          
          <div className="flex items-center justify-between mt-4 px-2">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priority Level</span>
             <div className="flex gap-1.5">
               {[1, 2, 3, 4, 5].map(star => (
                 <Star 
                   key={star} 
                   size={24} 
                   onClick={() => setNewTodoPriority(star)}
                   className={`cursor-pointer transition-colors active:scale-90 ${star <= newTodoPriority ? "text-[#FBBF24] fill-[#FBBF24]" : (isDarkMode ? "text-slate-700 hover:text-[#FDE68A]" : "text-slate-200 hover:text-[#FDE68A]")}`} 
                 />
               ))}
             </div>
          </div>
        </div>

        {todos.length === 0 && (
           <div className="text-center py-12 px-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                 <CheckCircle2 size={32} className={isDarkMode ? "text-slate-600" : "text-slate-300"} />
              </div>
              <h3 className={`text-lg font-black mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}>The slate is clean.</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No tasks pending.<br/>Build your empire.</p>
           </div>
        )}

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

        {completedTasks.length > 0 && (
          <section className={`p-4 rounded-[2rem] border shadow-sm animate-fade-in transition-colors ${isDarkMode ? "bg-orange-900/10 border-orange-900/30" : "bg-orange-50/60 border-orange-100"}`}>
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#F97316]" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#F97316]">Completed Tasks</h3>
              </div>
              <button 
                onClick={clearCompletedTodos}
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all active:scale-95 ${isDarkMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 border-orange-200 hover:bg-orange-200"}`}
              >
                Delete All
              </button>
            </div>
            <div className="space-y-2">
              {completedTasks.map(renderTaskCard)}
            </div>
          </section>
        )}
      </main>

      {/* ========================================================= */}
      {/* 🔥 REBUILT: PREMIUM ACTION DRAWER (WITH EDIT MODE) 🔥 */}
      {/* ========================================================= */}
      {activeModalTodo && (
        <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => { setActiveModalTodo(null); setIsEditingTask(false); }}></div>
          <div className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col transition-colors duration-500 ${isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center gap-2">
                <CheckSquare size={20} className={activeModalTodo.isCompleted ? parseInt(activeModalTodo.priority) === 5 ? "text-[#FBBF24]" : "text-[#F97316]" : "text-[#1877F2]"} />
                <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>{isEditingTask ? "Edit Task" : "Task Details"}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isEditingTask && (
                  <button 
                    onClick={() => { 
                      setIsEditingTask(true); 
                      setEditTaskData({ text: activeModalTodo.text, priority: activeModalTodo.priority, type: activeModalTodo.type }); 
                    }} 
                    className="p-2 rounded-full"
                  >
                    <Edit2 size={16} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                  </button>
                )}
                <button onClick={() => { setActiveModalTodo(null); setIsEditingTask(false); }} className="p-2 rounded-full">
                  <X size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 pb-[120px] lg:pb-6">
              {!isEditingTask ? (
                <>
                  <div className="text-center px-4">
                    <h2 className={`text-xl font-black leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{activeModalTodo.text}</h2>
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                      {activeModalTodo.type === "shopping" ? <ShoppingBag size={12} className="text-[#10B981]" /> : <Zap size={12} className="text-[#1877F2]" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {activeModalTodo.type === "shopping" ? "Shopping List" : "Action Item"}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl p-4 border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <div className={`flex justify-between py-2 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
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
                    className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-500 shadow-[0_8px_16px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Delete Task
                  </button>
                </>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="relative">
                    <label className={`absolute left-4 top-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Task Name</label>
                    <input 
                      type="text" 
                      value={editTaskData.text} 
                      onChange={(e) => setEditTaskData({...editTaskData, text: e.target.value})} 
                      className={`w-full pt-6 pb-2 px-5 rounded-2xl font-bold text-sm border focus:outline-none transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} 
                    />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setEditTaskData({...editTaskData, type: "task"})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${editTaskData.type === "task" ? "bg-[#1877F2] text-white shadow-md shadow-blue-500/20" : isDarkMode ? "bg-[#0F172A] text-slate-400 border border-slate-700" : "bg-white text-slate-400 border border-slate-200"}`}>Action</button>
                    <button onClick={() => setEditTaskData({...editTaskData, type: "shopping"})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${editTaskData.type === "shopping" ? "bg-[#10B981] text-white shadow-md shadow-emerald-500/20" : isDarkMode ? "bg-[#0F172A] text-slate-400 border border-slate-700" : "bg-white text-slate-400 border border-slate-200"}`}>Shopping</button>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-white border-slate-200"}`}>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priority Level</span>
                     <div className="flex gap-1.5">
                       {[1, 2, 3, 4, 5].map(star => (
                         <Star 
                           key={star} 
                           size={24} 
                           onClick={() => setEditTaskData({...editTaskData, priority: star})}
                           className={`cursor-pointer transition-colors active:scale-90 ${star <= editTaskData.priority ? "text-[#FBBF24] fill-[#FBBF24]" : (isDarkMode ? "text-slate-700 hover:text-[#FDE68A]" : "text-slate-200 hover:text-[#FDE68A]")}`} 
                         />
                       ))}
                     </div>
                  </div>

                  <button 
                    onClick={handleSaveEdit} 
                    className="w-full mt-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-[#1877F2] shadow-[0_8px_16px_rgba(24,119,242,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
