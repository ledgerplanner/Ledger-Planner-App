import React from "react";
import { Plus, CheckSquare, Circle, Star } from "lucide-react";

export default function Todo({
  userName,
  todos,
  newTodoText,
  setNewTodoText,
  newTodoPriority,
  setNewTodoPriority,
  isDarkMode,
  handleAddTodo,
  toggleTodoStatus,
  setSelectedTodo,
  renderHeroShell
}) {
  // === TODO MATH & SORTING ===
  const activeTasks = todos.filter((t) => !t.isCompleted).sort((a, b) => b.priority - a.priority);

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
    <div className="mb-6">
      <p className="text-xl font-black text-white">Task Management</p>
    </div>
  );

  return (
    <div className={`animate-fade-in pb-32 transition-colors duration-500 ${isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {renderHeroShell(`${userName}'s Action Center`, graphicContent)}
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
            <button 
              type="submit" 
              disabled={!newTodoText.trim()} 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${!newTodoText.trim() ? "bg-slate-300 text-slate-500" : "bg-[#1877F2] text-white shadow-[0_8px_20px_rgba(24,119,242,0.3)]"}`}
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
        </form>

        {/* TASK LIST */}
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

      </main>
    </div>
  );
}
