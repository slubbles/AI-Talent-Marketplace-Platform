"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors"
      onClick={() => {
        void signOut({ callbackUrl: "/login" });
      }}
      type="button"
    >
      Sign out
    </button>
  );
}