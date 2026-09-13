import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminOrdersPage from "@/app/admin/orders/_components/admin-orders-page";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/app/lib/admin-auth";

export default async function AdminOrdersRoutePage() {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  return <AdminOrdersPage />;
}
