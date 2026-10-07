"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const flash = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={flash}>
      {children}
      {msg && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[70] rounded-full bg-ink px-6 py-3 text-sm text-cream shadow-toast"
          style={{ transform: "translateX(-50%)", animation: "mannaToast .3s cubic-bezier(.2,.7,.2,1) both" }}
        >
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}
