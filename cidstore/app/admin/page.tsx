import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminDashboard from "@/app/admin/_components/admin-dashboard";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/app/lib/admin-auth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}

