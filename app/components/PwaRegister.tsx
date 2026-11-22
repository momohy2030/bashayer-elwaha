"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed:", err));
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 md:left-auto md:w-96 z-50 bg-amber-500 text-stone-950 px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-extrabold print:hidden">
      <WifiOff size={16} className="shrink-0" />
      <span>أنت تعمل الآن بدون إنترنت — يتم الحفظ محلياً وستتم المزامنة تلقائياً عند عودة الشبكة.</span>
    </div>
  );
}