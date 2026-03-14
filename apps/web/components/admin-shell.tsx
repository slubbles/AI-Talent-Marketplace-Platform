"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, User, ShieldCheck, BadgeCheck, UserSearch,
  Building2, BarChart3, Settings, LogOut, Bell, Search,
} from "lucide-react";
import { NotificationPanel } from "@/components/notification-panel";
import { CommandPalette } from "@/components/command-palette";

const navSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin", badge: null },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Users", icon: User, path: "/admin/users", badge: null },
      { label: "Verification", icon: ShieldCheck, path: "/admin/verification", badge: "3" },
      { label: "Approvals", icon: BadgeCheck, path: "/admin/approvals", badge: "5" },
      { label: "Concierge", icon: UserSearch, path: "/admin/concierge", badge: null },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Companies", icon: Building2, path: "/admin/companies", badge: null },
      { label: "Analytics", icon: BarChart3, path: "/admin/analytics", badge: null },
    ],
  },
];

interface AdminShellProps {
  children: React.ReactNode;
  userEmail: string;
  userRole: string;
}

export function AdminShell({ children, userEmail, userRole }: AdminShellProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbLabel = segments.length > 1 ? segments[segments.length - 1] : segments[0] || "admin";

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
      <aside className="w-[240px] border-r border-[#27272A] bg-[#0A0A0A] flex flex-col fixed h-full z-20">
        <div className="h-14 flex items-center px-6 border-b border-[#27272A]">
          <span className="text-[#EFFE5E] font-extrabold text-xl tracking-tight">TalentAI</span>
          <span className="bg-[#EFFE5E] text-[#000000] text-[10px] font-bold px-2 py-0.5 rounded-sm ml-2">ADMIN</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#52525B] mb-2">
                {section.label}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
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
                      {item.badge && (
                        <span className="bg-[#EFFE5E] text-[#000000] text-xs rounded-full min-w-[20px] text-center ml-auto px-1.5 py-0.5 font-bold leading-none">
                          {item.badge}
                        </span>
                      )}
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

      <main className="flex-1 ml-[240px] flex flex-col">
        <header className="h-14 border-b border-[#27272A] bg-[#0A0A0A] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="text-sm text-[#A1A1AA]">
            Admin <span className="mx-2 text-[#52525B]">/</span>{" "}
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
                placeholder="Search... ⌘K"
                className="bg-[#1A1A1A] border border-[#27272A] rounded-md pl-9 pr-4 py-1.5 text-xs w-64 text-[#A1A1AA] cursor-pointer"
              />
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
              {initials || "A"}
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
