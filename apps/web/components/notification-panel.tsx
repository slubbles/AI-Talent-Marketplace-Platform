"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, CalendarDays, CheckCircle2, BadgeCheck,
  XCircle, AlertTriangle, ShieldCheck, Info,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const initialNotifications = [
  { id: 1, read: false, icon: Sparkles, color: "#EFFE5E", title: "AI found 12 candidates for Senior ML Engineer", time: "2 minutes ago" },
  { id: 2, read: false, icon: CalendarDays, color: "#3B82F6", title: "Interview with Sarah Chen set for Mar 18", time: "15 minutes ago" },
  { id: 3, read: false, icon: CheckCircle2, color: "#22C55E", title: "Marcus Reed accepted your offer for Frontend Lead", time: "1 hour ago" },
  { id: 4, read: true, icon: BadgeCheck, color: "#22C55E", title: "Your role 'Product Designer' has been approved", time: "3 hours ago" },
  { id: 5, read: true, icon: XCircle, color: "#EF4444", title: "Lena Park declined your offer for DevOps Architect", time: "5 hours ago" },
  { id: 6, read: true, icon: AlertTriangle, color: "#F59E0B", title: "Changes requested for 'Data Analyst'", time: "Yesterday" },
  { id: 7, read: true, icon: ShieldCheck, color: "#22C55E", title: "David Park's profile has been verified", time: "Yesterday" },
  { id: 8, read: true, icon: Info, color: "#3B82F6", title: "Platform maintenance scheduled for March 20", time: "2 days ago" },
];

export function NotificationPanel({ open, onClose }: Props) {
  const [notifs, setNotifs] = useState(initialNotifications);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open, onClose]);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute top-[56px] right-0 w-[360px] bg-[#0A0A0A] border border-[#27272A] rounded-b-lg z-50"
          style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.7)" }}
        >
          <div className="sticky top-0 bg-[#0A0A0A] z-10 border-b border-[#27272A] px-4 py-3 flex items-center justify-between">
            <span className="text-base font-semibold text-white">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-[#EFFE5E] hover:text-[#BBB906]">Mark all read</button>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {notifs.map((n, i) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-[#1A1A1A] transition-colors ${
                    i < notifs.length - 1 ? "border-b border-[#27272A]" : ""
                  } ${!n.read ? "border-l-2 border-[#EFFE5E] bg-[rgba(239,254,94,0.04)]" : ""}`}
                >
                  <div className="flex gap-3">
                    <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: n.color }} />
                    <div>
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-[#52525B] mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
