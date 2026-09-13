"use client";

import Link from "next/link";
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const response = await fetch("/api/orders");

        if (!response.ok) {
          throw new Error("Failed to load orders.");
        }

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Admin</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">All orders</h1>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/60 hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80">
        <div className="border-b border-white/10 bg-slate-950/60 px-6 py-4 text-xs uppercase tracking-[0.2em] text-slate-400">
          Database orders
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 bg-slate-950/60 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Crypto</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Order Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No orders found in the database.
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
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{order.crypto}</div>
                      <div className="text-xs text-slate-400">{order.cryptoName}</div>
                    </td>
                    <td className="px-6 py-4">{order.cryptoAmount}</td>
                    <td className="px-6 py-4">{order.total}</td>
                    <td className="px-6 py-4">{order.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleString("en-CA")}</td>
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
