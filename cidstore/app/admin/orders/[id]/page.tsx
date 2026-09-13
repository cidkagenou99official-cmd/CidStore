import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminOrderDetailPage from "@/app/admin/orders/[id]/_components/admin-order-detail-page";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/app/lib/admin-auth";

export default async function AdminOrderDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  return <AdminOrderDetailPage orderId={id} />;
}
