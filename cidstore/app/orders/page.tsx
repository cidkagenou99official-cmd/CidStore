"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Order } from "@/app/types";

const statusStyles: Record<string, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  WAITING_VERIFICATION: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  PAYMENT_VERIFIED: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  PROCESSING: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  COMPLETED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  CANCELLED: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  REJECTED: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  WAITING_CRYPTO: "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

export default function OrdersPage() {
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Orders</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
            Demo transaction history
          </h1>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200">
          {orders.length} orders displayed
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/80 p-10 text-center">
          <p className="text-2xl font-semibold text-white">No transactions yet</p>
          <p className="mt-3 text-slate-300">Create a demo order to see your exchange activity here.</p>
          <Link
            href="/exchange"
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Start Exchange
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80">
          <div className="hidden grid-cols-[1.2fr_0.8fr_1fr_1fr_0.9fr_0.8fr] gap-4 border-b border-white/10 bg-slate-950/60 px-6 py-4 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
            <span>Order ID</span>
            <span>Type</span>
            <span>Crypto</span>
            <span>Total</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          <div className="divide-y divide-white/10">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="grid gap-4 px-4 py-4 transition hover:bg-slate-800/60 md:grid-cols-[1.2fr_0.8fr_1fr_1fr_0.9fr_0.8fr] md:px-6"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 md:hidden">Order ID</p>
                  <p className="mt-1 font-medium text-white">{order.id}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 md:hidden">Type</p>
                  <p className="mt-1 font-medium text-slate-200">{order.type}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 md:hidden">Crypto</p>
                  <p className="mt-1 text-slate-200">{order.crypto}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 md:hidden">Total</p>
                  <p className="mt-1 text-slate-200">{order.total}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 md:hidden">Status</p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 md:hidden">Date</p>
                  <p className="mt-1 text-slate-200">{new Date(order.createdAt).toLocaleDateString("en-CA")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
