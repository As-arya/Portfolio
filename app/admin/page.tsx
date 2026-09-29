import { redirect } from "next/navigation";
import { sessionRole } from "../../lib/auth";
import Dashboard from "./dashboard";

export default async function AdminPage() {
  const role = await sessionRole();
  if (role === "recovery") redirect("/admin/recovery");
  if (role !== "primary") redirect("/admin/login");
  return <Dashboard />;
}
