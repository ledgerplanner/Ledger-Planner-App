import React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";

export default function InstallmentPromptModal({
  isOpen = false,
  onClose,
  installmentPromptConfig,
  setInstallmentPromptConfig,
  handleSaveNextInstallmentDate,
  formatDisplayDate,
  signatureColor = "#1877F2",
  currencySymbol = "$",
  isDarkMode = false
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[120] flex items-end lg:items-center lg:justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div
        className={`w-full lg:max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[130] flex flex-col transition-colors duration-500 overflow-visible ${
          isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"
        }`}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h3
            className={`font-black uppercase tracking-widest text-sm ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Next Installment
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <h2
              className={`text-lg font-black mb-1 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Payment Logged!
            </h2>
            <p className="text-xs font-bold text-slate-500">
              When is your next payment due and how much will it be?
            </p>
          </div>

          {/* Next Due Date Field */}
          <div className="relative">
            <label
              className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest pointer-events-none ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Next Due Date
            </label>
            <div
              className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors overflow-visible ${
                isDarkMode
                  ? "bg-[#0F172A] border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <span
                className={`font-bold text-base pointer-events-none ${
                  !installmentPromptConfig.nextDate
                    ? "opacity-0"
                    : isDarkMode
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {installmentPromptConfig.nextDate
                  ? formatDisplayDate(installmentPromptConfig.nextDate)
                  : "mm/dd/yyyy"}
              </span>
              <CalendarIcon
                size={18}
                className="shrink-0 pointer-events-none"
                style={{ color: signatureColor }}
              />
              <input
                type="date"
                value={installmentPromptConfig.nextDate}
                onChange={(e) =>
                  setInstallmentPromptConfig({
                    ...installmentPromptConfig,
                    nextDate: e.target.value
                  })
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
          </div>

          {/* New Amount Due Field */}
          <div className="relative">
            <label
              className={`absolute left-4 top-2 z-10 text-[9px] font-bold uppercase tracking-widest pointer-events-none ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              New Amount Due
            </label>
            <div
              className={`relative w-full pt-6 pb-2 px-5 rounded-2xl border flex items-center justify-between transition-colors overflow-visible ${
                isDarkMode
                  ? "bg-[#0F172A] border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <span
                  className={`font-black text-base ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={installmentPromptConfig.nextAmountDue}
                  onChange={(e) =>
                    setInstallmentPromptConfig({
                      ...installmentPromptConfig,
                      nextAmountDue: e.target.value
                    })
                  }
                  className={`w-full font-bold text-base bg-transparent border-none outline-none ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveNextInstallmentDate}
            disabled={!installmentPromptConfig.nextDate}
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
            style={{
              backgroundColor: !installmentPromptConfig.nextDate
                ? undefined
                : signatureColor
            }}
          >
            <CalendarIcon size={16} /> Route to Payday
          </button>
        </div>
      </div>
    </div>
  );
}
