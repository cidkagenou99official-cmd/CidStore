"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/app/types";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  WAITING_VERIFICATION: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  PAYMENT_VERIFIED: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  PROCESSING: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  COMPLETED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  CANCELLED: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  REJECTED: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  WAITING_CRYPTO: "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        const data = (await response.json()) as Order[];

        if (isMounted) {
          setOrders(data);
        }
      } catch {
        if (isMounted) {
          setOrders([]);
        }
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.push("/admin/login");
    router.refresh();
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status === "PENDING").length;
  const waitingVerification = orders.filter((order) => order.status === "WAITING_VERIFICATION").length;
  const processingOrders = orders.filter((order) => order.status === "PROCESSING").length;
  const completedOrders = orders.filter((order) => order.status === "COMPLETED").length;
  const cancelledOrders = orders.filter((order) => order.status === "CANCELLED").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Admin dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">CID Store operations</h1>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/60 hover:text-white"
          >
            View Store
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Orders" value={String(totalOrders)} />
        <StatCard label="Pending" value={String(pendingOrders)} />
        <StatCard label="Waiting Verification" value={String(waitingVerification)} />
        <StatCard label="Processing" value={String(processingOrders)} />
        <StatCard label="Completed" value={String(completedOrders)} />
        <StatCard label="Cancelled" value={String(cancelledOrders)} />
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-6 py-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent orders</div>
          <Link
            href="/admin/orders"
            className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200"
          >
            View all orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 bg-slate-950/60 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Crypto</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/10 last:border-b-0 hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-cyan-300 hover:text-cyan-200">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString("en-CA")}</td>
                    <td className="px-6 py-4">{order.type}</td>
                    <td className="px-6 py-4">{order.crypto}</td>
                    <td className="px-6 py-4">{order.total}</td>
                    <td className="px-6 py-4">{order.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
