"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock3, ShoppingCart, Tag } from "lucide-react";
import type { Order } from "@/app/types";

const statusStyles: Record<string, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  WAITING_VERIFICATION:
    "border-violet-500/30 bg-violet-500/10 text-violet-200",
  PAYMENT_VERIFIED:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  PROCESSING: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  COMPLETED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  CANCELLED:
    "border-rose-500/30 bg-rose-500/10 text-rose-200",
  REJECTED:
    "border-rose-500/30 bg-rose-500/10 text-rose-200",
  WAITING_CRYPTO:
    "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

function formatAmount(value: string) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return number.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
}

function formatIDR(value: string) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return `Rp ${number.toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal mengambil riwayat order.");
        }

        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-purple-400">
              Orders
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Order History
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Lihat riwayat pembelian dan penjualan crypto lu di CID Store.
            </p>
          </div>

          <Link
            href="/exchange"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400"
          >
            New Exchange
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <p className="text-sm text-white/50">
              Memuat riwayat order...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
            <Clock3 className="mx-auto h-10 w-10 text-white/20" />

            <h2 className="mt-4 text-xl font-semibold">
              Belum ada order
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
              Order BUY atau SELL yang lu buat akan muncul di halaman ini.
            </p>

            <Link
              href="/exchange"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20"
            >
              Mulai Exchange
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <div>
                <p className="text-sm font-medium text-white">
                  Total Orders
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Semua order yang terkait dengan akun lu.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white">
                {orders.length}
              </span>
            </div>

            {orders.map((order) => {
              const isBuy = order.type === "BUY";

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-purple-500/30 hover:bg-white/[0.06] sm:p-6"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            isBuy
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-orange-500/10 text-orange-400"
                          }`}
                        >
                          {isBuy ? (
                            <ShoppingCart className="h-5 w-5" />
                          ) : (
                            <Tag className="h-5 w-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold text-white">
                              {order.type} {order.crypto}
                            </h2>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                isBuy
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                  : "border-orange-500/30 bg-orange-500/10 text-orange-300"
                              }`}
                            >
                              {order.type}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-white/40">
                            Order ID: {order.id}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          statusStyles[order.status] ||
                          "border-white/10 bg-white/5 text-white/70"
                        }`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-white/40">
                          Crypto Amount
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {formatAmount(order.cryptoAmount)} {order.crypto}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/40">
                          Total IDR
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {formatIDR(order.total)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/40">
                          Network
                        </p>

                        <p className="mt-1 font-medium text-white">
                          {order.network}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/40">
                          Payment
                        </p>

                        <p className="mt-1 font-medium text-white">
                          {order.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        {formatDate(order.createdAt)}
                      </span>

                      <span className="inline-flex items-center gap-1 text-purple-300">
                        View Detail
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
