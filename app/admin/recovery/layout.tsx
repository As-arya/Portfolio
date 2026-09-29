import { redirect } from "next/navigation";
import { sessionRole } from "../../../lib/auth";

export default async function RecoveryLayout({ children }: { children: React.ReactNode }) {
  const role = await sessionRole();
  if (role === "primary") redirect("/admin");
  if (role !== "recovery") redirect("/admin/login");
  return children;
}
