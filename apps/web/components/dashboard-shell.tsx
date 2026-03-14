"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Briefcase, ListChecks, Sparkles,
  CalendarDays, FileText, BarChart3, Settings, LogOut, Bell, Search,
} from "lucide-react";
import { NotificationPanel } from "@/components/notification-panel";
import { CommandPalette } from "@/components/command-palette";

const navSections = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Roles", icon: Briefcase, path: "/dashboard/roles" },
      { label: "Shortlists", icon: ListChecks, path: "/dashboard/shortlists" },
      { label: "Search", icon: Sparkles, path: "/dashboard/search" },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { label: "Interviews", icon: CalendarDays, path: "/dashboard/interviews" },
      { label: "Offers", icon: FileText, path: "/dashboard/offers" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
    ],
  },
];

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail: string;
  userRole: string;
}

export function DashboardShell({ children, userEmail, userRole }: DashboardShellProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbLabel = segments.length > 1 ? segments[segments.length - 1] : segments[0] || "dashboard";

  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const initials = userEmail
    .split("@")[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-screen bg-[#000000] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-[#27272A] bg-[#0A0A0A] flex flex-col fixed h-full z-20">
        <div className="h-14 flex items-center px-6 border-b border-[#27272A]">
          <span className="text-[#EFFE5E] font-extrabold text-xl tracking-tight drop-shadow-[0_0_10px_rgba(239,254,94,0.3)]">TalentAI</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#52525B] mb-2">
                {section.label}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[rgba(239,254,94,0.1)] text-white border-l-2 border-[#EFFE5E]"
                          : "text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white"
                      }`}
                    >
                      <item.icon className={`mr-3 h-4 w-4 ${isActive ? "text-[#EFFE5E]" : ""}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#27272A] space-y-0.5">
          <Link
            href="/dashboard/settings"
            className="flex items-center h-10 px-3 text-sm text-[#A1A1AA] hover:bg-[#1A1A1A] rounded-md transition-colors"
          >
            <Settings className="mr-3 h-4 w-4" /> Settings
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center h-10 px-3 text-sm text-[#A1A1AA] hover:bg-[#1A1A1A] rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[240px] flex flex-col">
        <header className="h-14 border-b border-[#27272A] bg-[#0A0A0A] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="text-sm text-[#A1A1AA]">
            App <span className="mx-2 text-[#52525B]">/</span>{" "}
            <span className="text-white capitalize">{breadcrumbLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#52525B]" />
              </div>
              <input
                readOnly
                onClick={() => setCmdOpen(true)}
                placeholder="Search..."
                className="bg-[#1A1A1A] border border-[#27272A] rounded-md pl-9 pr-14 py-1.5 text-xs w-64 text-[#A1A1AA] cursor-pointer hover:border-[#3f3f46] transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#52525B] bg-[#27272A] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>
            <div className="relative">
              <button
                onClick={() => setNotifOpen((p) => !p)}
                className="relative p-2 text-[#A1A1AA] hover:text-white transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#EFFE5E] rounded-full border-2 border-[#0A0A0A]" />
              </button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            <div className="h-8 w-8 rounded-full bg-[#EFFE5E] flex items-center justify-center text-[#000000] font-bold text-xs cursor-pointer" title={`${userEmail} (${userRole})`}>
              {initials || "U"}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1280px] w-full mx-auto flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
