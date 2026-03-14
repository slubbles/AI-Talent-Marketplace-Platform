import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

import { getSession } from "../../lib/session";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user || !session.accessToken || !session.user.isActive) {
    redirect("/login");
  }

  if (session.user.role !== "RECRUITER" && session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardShell userEmail={session.user.email ?? ""} userRole={session.user.role ?? ""}>
      {children}
    </DashboardShell>
  );
}