import React, { useState, useEffect } from "react";

export default function LiveClockHeader({ isDarkMode = false }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getOrdinalNum = (n) =>
    n + (n > 0 ? ["th", "st", "nd", "rd"][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : "");

  const heroDateTimeStr = `${time
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase()}, ${time
    .toLocaleDateString("en-US", { month: "long" })
    .toUpperCase()} ${getOrdinalNum(time.getDate()).toUpperCase()}, ${time.getFullYear()} — ${time
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .toUpperCase()}`;

  return (
    <div
      className={`relative z-10 pt-4 border-t flex justify-center items-center ${
        isDarkMode ? "border-slate-800" : "border-slate-50"
      }`}
    >
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${
          isDarkMode ? "text-white" : "text-slate-900"
        }`}
      >
        {heroDateTimeStr}
      </span>
    </div>
  );
}
