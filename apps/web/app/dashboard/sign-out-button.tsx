"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="secondary-button dashboard-signout-button"
      onClick={() => {
        void signOut({ callbackUrl: "/login" });
      }}
      type="button"
    >
      Sign out
    </button>
  );
}