import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

import { getSession } from "../../../lib/session";
export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  return <SettingsClient user={session.user} accessToken={session.accessToken ?? ""} />;
}
