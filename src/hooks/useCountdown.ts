import { useEffect, useState } from "react";

export function useCountdown(endDate?: string | null) {
  const calc = () => {
    const ms = endDate ? Math.max(new Date(endDate).getTime() - Date.now(), 0) : 0;
    return {
      days: Math.floor(ms / 86400000),
      hours: Math.floor((ms / 3600000) % 24),
      minutes: Math.floor((ms / 60000) % 60),
      seconds: Math.floor((ms / 1000) % 60),
      done: ms === 0,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate]);
  return t;
}
