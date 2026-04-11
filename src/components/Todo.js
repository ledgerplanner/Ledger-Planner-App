import React from "react";
import { Plus, CheckSquare, Circle, Star, CheckCircle2 } from "lucide-react";

export default function Todo({
  userName,
  todos,
  newTodoText,
  setNewTodoText,
  newTodoPriority,
  setNewTodoPriority,
  newTodoType,
  setNewTodoType,
  isDarkMode,
  handleAddTodo,
  toggleTodoStatus,
  setSelectedTodo,
  renderHeroShell
}) {
  // === TODO MATH & SORTING ===
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const totalCount = todos.length;
  const progressPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  
  const activeTasks = todos.filter((t) => !t.isCompleted && t.type === "task").sort((a, b) => b.priority - a.priority);
  const activeShopping = todos.filter((t) => !t.isCompleted && t.type === "shopping").sort((a, b) => b.priority - a.priority);
  const completedTodos = todos.filter((t) => t.isCompleted);

  const renderStars = (priority) => (
    <div className="flex gap-[2px] mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          size={10} 
          className={star <= priority ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-700"} 
        />
      ))}
    </div>
  );

  // === GRAPHIC HEADER ===
  const graphicContent = (
    <div className="flex items-center justify-between relative z-10 mb-6 w-full">
      {/* MASSIVE TASKS PROGRESS RING */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="todoGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#1E293B" : "#F1F5F9"} strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#todoGlow)" strokeWidth="12" strokeLinecap="round" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{progressPercentage}%</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Done</span>
        </div>
      </div>

      <div className="flex-1 pl-4 text-right">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Operations</p>
        <p className={`text-4xl font-black tracking-tighter mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {completedCount} <span className="text-xl text-slate-400">/ {totalCount}</span>
        </p>
        <p className="text-xs font-bold text-slate-400">Total completed tasks</p>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Tasks`, graphicContent)}
      <main className="px-6 space-y-8">
        
        {/* ADD TASK FORM */}
        <form onSubmit={handleAddTodo} className={`p-4 rounded-3xl border shadow-sm transition-colors ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
          <input 
            type="text" 
            placeholder="Add a new item..." 
            value={newTodoText} 
            onChange={(e) => setNewTodoText(e.target.value)} 
            className={`w-full py-3 px-4 mb-4 rounded-2xl font-bold text-sm outline-none border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder-slate-500 focus:border-[#1877F2]" : "bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:border-[#1877F2]"}`} 
          />
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <div className="flex gap-1 bg-slate-50 dark:bg-[#0F172A] p-1 rounded-xl border dark:border-slate-700 border-slate-100">
                <button type="button" onClick={() => setNewTodoType("task")} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${newTodoType === "task" ? "bg-white dark:bg-slate-700 shadow-sm text-[#1877F2]" : "text-slate-400"}`}>To-Do</button>
                <button type="button" onClick={() => setNewTodoType("shopping")} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${newTodoType === "shopping" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-500" : "text-slate-400"}`}>To-Buy</button>
              </div>
              <div className="flex items-center gap-1 pl-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={18} 
                    onClick={() => setNewTodoPriority(star)} 
                    className={`cursor-pointer transition-colors ${star <= newTodoPriority ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-700 hover:text-yellow-200"}`} 
                  />
                ))}
              </div>
            </div>
            <button 
              type="submit" 
              disabled={!newTodoText.trim()} 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${!newTodoText.trim() ? "bg-slate-300 text-slate-500" : "bg-[#1877F2] text-white shadow-[0_8px_20px_rgba(24,119,242,0.3)]"}`}
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
        </form>

        {/* PENDING TASKS LIST */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Pending Actions</h3>
          {activeTasks.length === 0 ? (
            <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-400" : "border-slate-300 bg-slate-50 text-slate-500"}`}>
              <CheckSquare size={32} className="mx-auto mb-3 text-[#1877F2] opacity-50" />
              <p className="font-bold text-sm">Task Zero</p>
              <p className="text-xs mt-1 opacity-70">You have no pending tasks right now.</p>
            </div>
          ) : (
            <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              {activeTasks.map((todo, idx) => (
                <div key={todo.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== activeTasks.length - 1 ? "mb-1" : ""}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative p-1 z-10 cursor-pointer" onClick={() => toggleTodoStatus(todo.id)}>
                      <Circle className={`${isDarkMode ? "text-slate-600 hover:text-[#1877F2]" : "text-slate-300 hover:text-[#1877F2]"} hover:scale-110 transition-all duration-300`} size={26} />
                    </div>
                    <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTodo(todo)}>
                      <p className={`font-bold text-sm leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{todo.text}</p>
                      {renderStars(todo.priority)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PENDING SHOPPING LIST */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Pending Shopping</h3>
          {activeShopping.length === 0 ? (
            <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-800/30 text-slate-400" : "border-slate-300 bg-slate-50 text-slate-500"}`}>
              <CheckSquare size={32} className="mx-auto mb-3 text-emerald-500 opacity-50" />
              <p className="font-bold text-sm">Cart is Empty</p>
              <p className="text-xs mt-1 opacity-70">Nothing to buy right now.</p>
            </div>
          ) : (
            <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              {activeShopping.map((todo, idx) => (
                <div key={todo.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"} ${idx !== activeShopping.length - 1 ? "mb-1" : ""}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative p-1 z-10 cursor-pointer" onClick={() => toggleTodoStatus(todo.id)}>
                      <Circle className={`${isDarkMode ? "text-slate-600 hover:text-emerald-500" : "text-slate-300 hover:text-emerald-500"} hover:scale-110 transition-all duration-300`} size={26} />
                    </div>
                    <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTodo(todo)}>
                      <p className={`font-bold text-sm leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{todo.text}</p>
                      {renderStars(todo.priority)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DONE LIST */}
        {completedTodos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Done</h3>
            <div className={`rounded-[2rem] p-3 border shadow-sm ${isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-50"}`}>
              {completedTodos.map((todo, idx) => (
                <div key={todo.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 opacity-60 grayscale-[0.3] ${isDarkMode ? "hover:bg-slate-800/50 hover:opacity-100" : "hover:bg-slate-50/50 hover:opacity-100"} ${idx !== completedTodos.length - 1 ? "mb-1" : ""}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative p-1 z-10 cursor-pointer" onClick={() => toggleTodoStatus(todo.id)}>
                      <CheckCircle2 className={`${todo.type === "shopping" ? "text-emerald-500" : "text-[#1877F2]"} hover:scale-110 transition-transform`} size={26} />
                    </div>
                    <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTodo(todo)}>
                      <p className={`font-bold text-sm line-through ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{todo.text}</p>
                      {renderStars(todo.priority)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
