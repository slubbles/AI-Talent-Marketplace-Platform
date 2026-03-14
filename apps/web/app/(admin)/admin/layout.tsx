import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";

import { getSession } from "../../../lib/session";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user || !session.accessToken || !session.user.isActive) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminShell userEmail={session.user.email ?? ""} userRole={session.user.role ?? ""}>
      {children}
    </AdminShell>
  );
}