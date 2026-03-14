"use client";

import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";

const sections = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
];

function getStrength(pw: string) {
  if (!pw) return { level: 0, label: "", color: "" };
  if (pw.length < 6) return { level: 1, label: "Weak", color: "#EF4444" };
  if (pw.length < 8) return { level: 2, label: "Fair", color: "#F59E0B" };
  if (pw.length >= 12 && /[!@#$%^&*]/.test(pw)) return { level: 4, label: "Strong", color: "#22C55E" };
  if (pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw)) return { level: 3, label: "Good", color: "#EFFE5E" };
  return { level: 2, label: "Fair", color: "#F59E0B" };
}

const defaultNotifs = [
  { label: "AI Shortlist Generated", desc: "Get notified when AI finds candidates for your roles.", on: true },
  { label: "Interview Scheduled", desc: "Get notified when interviews are booked.", on: true },
  { label: "Offer Accepted", desc: "Know immediately when a candidate accepts.", on: true },
  { label: "Offer Declined", desc: "Know when a candidate declines your offer.", on: true },
  { label: "Demand Approved", desc: "Notification when admin approves your role.", on: false },
  { label: "Demand Rejected", desc: "Notification when admin requests changes.", on: true },
];

type SettingsClientProps = {
  user: { name?: string | null; email?: string | null };
  accessToken: string;
};

export function SettingsClient({ user }: SettingsClientProps) {
  const [activeSection, setActiveSection] = useState("profile");
  const nameParts = (user.name ?? "").split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [jobTitle, setJobTitle] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [notifs, setNotifs] = useState(defaultNotifs);
  const [message, setMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const strength = getStrength(newPw);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { root: container, threshold: 0.4 }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const inputClass = "w-full bg-[#1A1A1A] border border-[#27272A] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#EFFE5E]";

  return (
    <div className="flex gap-8">
      {/* Mini nav */}
      <div className="w-[200px] shrink-0">
        <div className="sticky top-0 bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`block w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                activeSection === s.id
                  ? "border-l-2 border-[#EFFE5E] bg-[rgba(239,254,94,0.08)] text-white"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 space-y-8 pb-16">
        {message ? <p className="text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 text-sm">{message}</p> : null}

        {/* Profile */}
        <section id="profile">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="text-sm text-[#A1A1AA]">Manage your personal information.</p>
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 mt-4 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-xl">
                {initials}
              </div>
              <button className="text-xs text-[#EFFE5E] hover:text-[#BBB906]">Change Avatar</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-1">First Name</label>
                <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-1">Last Name</label>
                <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#A1A1AA] mb-1">Email</label>
              <input className={`${inputClass} opacity-60 cursor-not-allowed`} value={user.email ?? ""} readOnly />
            </div>
            <div>
              <label className="block text-sm text-[#A1A1AA] mb-1">Job Title</label>
              <input className={inputClass} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <button
              onClick={() => { setMessage("Profile updated."); setTimeout(() => setMessage(null), 3000); }}
              className="bg-[#EFFE5E] text-[#000000] font-bold px-5 py-2.5 rounded-md hover:bg-[#BBB906] text-sm"
            >
              Save Profile
            </button>
          </div>
        </section>

        {/* Security */}
        <section id="security">
          <h2 className="text-lg font-semibold text-white">Security</h2>
          <p className="text-sm text-[#A1A1AA]">Change your password.</p>
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 mt-4 space-y-5">
            <div>
              <label className="block text-sm text-[#A1A1AA] mb-1">Current Password</label>
              <input type="password" className={inputClass} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-[#A1A1AA] mb-1">New Password</label>
              <input type="password" className={inputClass} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              {newPw && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full"
                        style={{ backgroundColor: i <= strength.level ? strength.color : "#27272A" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-[#A1A1AA] mb-1">Confirm New Password</label>
              <input type="password" className={inputClass} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </div>
            <button
              onClick={() => { setMessage("Password changed. You may need to sign in again."); setTimeout(() => setMessage(null), 3000); }}
              className="bg-[#EFFE5E] text-[#000000] font-bold px-5 py-2.5 rounded-md hover:bg-[#BBB906] text-sm"
            >
              Change Password
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section id="notifications">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <p className="text-sm text-[#A1A1AA]">Choose which notifications you receive.</p>
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 mt-4">
            {notifs.map((n, i) => (
              <div
                key={n.label}
                className={`flex items-center justify-between py-4 ${
                  i < notifs.length - 1 ? "border-b border-[#27272A]" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-white">{n.label}</p>
                  <p className="text-xs text-[#A1A1AA]">{n.desc}</p>
                </div>
                <Switch
                  checked={n.on}
                  onCheckedChange={(checked) => {
                    const copy = [...notifs];
                    copy[i] = { ...copy[i], on: checked };
                    setNotifs(copy);
                  }}
                  className="data-[state=checked]:bg-[#EFFE5E] data-[state=unchecked]:bg-[#27272A]"
                />
              </div>
            ))}
            <button
              onClick={() => { setMessage("Notification preferences saved."); setTimeout(() => setMessage(null), 3000); }}
              className="bg-[#EFFE5E] text-[#000000] font-bold px-5 py-2.5 rounded-md hover:bg-[#BBB906] text-sm mt-4"
            >
              Save Preferences
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
