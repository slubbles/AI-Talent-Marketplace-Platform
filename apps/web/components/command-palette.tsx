"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Sparkles, CalendarDays, Briefcase,
  LayoutDashboard, ListChecks, FileText, BarChart3, Settings,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const allItems = [
  { group: "Quick Actions", icon: Plus, label: "Create New Role", path: "/dashboard/roles/new" },
  { group: "Quick Actions", icon: Sparkles, label: "Search Talent", path: "/dashboard/search" },
  { group: "Quick Actions", icon: CalendarDays, label: "Schedule Interview", path: "/dashboard/interviews" },
  { group: "Recent Roles", icon: Briefcase, label: "Senior ML Engineer — Acme Corp", path: "/dashboard/roles/1" },
  { group: "Recent Roles", icon: Briefcase, label: "Frontend Lead — TechVision", path: "/dashboard/roles/2" },
  { group: "Recent Roles", icon: Briefcase, label: "Product Designer — DesignHub", path: "/dashboard/roles/3" },
  { group: "Navigation", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { group: "Navigation", icon: Briefcase, label: "Roles", path: "/dashboard/roles" },
  { group: "Navigation", icon: ListChecks, label: "Shortlists", path: "/dashboard/shortlists" },
  { group: "Navigation", icon: Sparkles, label: "Search", path: "/dashboard/search" },
  { group: "Navigation", icon: CalendarDays, label: "Interviews", path: "/dashboard/interviews" },
  { group: "Navigation", icon: FileText, label: "Offers", path: "/dashboard/offers" },
  { group: "Navigation", icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { group: "Navigation", icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const go = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
      setQuery("");
    },
    [router, onClose]
  );

  useEffect(() => {
    if (open) {
      setSelectedIdx(0);
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && filtered[selectedIdx]) { go(filtered[selectedIdx].path); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIdx, go, onClose]);

  const groups: Record<string, typeof filtered> = {};
  filtered.forEach((item) => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  let flatIdx = -1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="relative w-[560px] bg-[#1A1A1A] border border-[#3F3F46] rounded-xl shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 gap-3">
              <Search className="h-5 w-5 text-[#52525B]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles, talent, shortcuts..."
                className="flex-1 bg-transparent text-base text-white placeholder:text-[#52525B] outline-none"
              />
              <span className="text-[10px] bg-[#27272A] text-[#52525B] px-1.5 py-0.5 rounded">ESC</span>
            </div>
            <div className="border-t border-[#27272A]" />
            <div className="max-h-[320px] overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="text-sm text-[#A1A1AA] text-center py-8">No results found.</p>
              )}
              {Object.entries(groups).map(([group, items]) => (
                <div key={group}>
                  <p className="text-[10px] uppercase tracking-widest text-[#52525B] px-5 py-2">{group}</p>
                  {items.map((item) => {
                    flatIdx++;
                    const idx = flatIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label + item.path}
                        onClick={() => go(item.path)}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={`w-full h-10 px-5 mx-0 flex items-center gap-3 text-left transition-colors ${
                          selectedIdx === idx ? "bg-[#222222]" : ""
                        }`}
                      >
                        <Icon className="h-4 w-4 text-[#A1A1AA]" />
                        <span className="text-sm text-white">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
