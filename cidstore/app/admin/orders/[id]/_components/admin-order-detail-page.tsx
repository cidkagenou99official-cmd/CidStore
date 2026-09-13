"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllowedNextStatuses } from "@/app/lib/order-status";
import type { Order, OrderStatus } from "@/app/types";

export default function AdminOrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; action: OrderStatus | null }>({
    open: false,
    action: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = (await response.json()) as Order | { error?: string };

        if (isMounted && "id" in data) {
          setOrder(data);
        }
      } catch {
        if (isMounted) {
          setOrder(null);
        }
      }
    };

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/80 p-8 text-center">
          <p className="text-2xl font-semibold text-white">Order not found</p>
          <p className="mt-3 text-slate-300">The requested admin order could not be found.</p>
          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  const allowedNextStatuses = getAllowedNextStatuses(order.type, order.status);

  const adminOptions: Array<{ label: string; value: OrderStatus; disabled?: boolean }> =
    order.type === "SELL"
      ? order.status === "WAITING_CRYPTO"
        ? [
            { label: "MARK PROCESSING", value: "PROCESSING", disabled: !allowedNextStatuses.includes("PROCESSING") },
            { label: "CANCEL ORDER", value: "CANCELLED", disabled: !allowedNextStatuses.includes("CANCELLED") },
          ]
        : order.status === "PROCESSING"
          ? [
              { label: "MARK COMPLETED", value: "COMPLETED", disabled: !allowedNextStatuses.includes("COMPLETED") },
              { label: "CANCEL ORDER", value: "CANCELLED", disabled: !allowedNextStatuses.includes("CANCELLED") },
            ]
          : []
      : [
          { label: "VERIFY PAYMENT", value: "PAYMENT_VERIFIED", disabled: !allowedNextStatuses.includes("PAYMENT_VERIFIED") },
          { label: "REJECT PAYMENT", value: "REJECTED", disabled: !allowedNextStatuses.includes("REJECTED") },
          { label: "MARK PROCESSING", value: "PROCESSING", disabled: !allowedNextStatuses.includes("PROCESSING") },
          { label: "MARK COMPLETED", value: "COMPLETED", disabled: !allowedNextStatuses.includes("COMPLETED") },
          { label: "CANCEL ORDER", value: "CANCELLED", disabled: !allowedNextStatuses.includes("CANCELLED") },
        ];

  const handleStatusUpdate = async (nextStatus: OrderStatus) => {
    if (!order) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update order status.");
      }

      const updatedOrder = (await response.json()) as Order;
      setOrder(updatedOrder);
      setConfirmAction({ open: false, action: null });
    } catch {
      setConfirmAction({ open: false, action: null });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Admin order</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{order.id}</h1>
        </div>
        <Link
          href="/admin"
          className="inline-flex rounded-full border border-white/10 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60 hover:text-white"
        >
          Back to Admin
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Order details</p>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              {order.status}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoCard label="Order ID" value={order.id} />
            <InfoCard label="BUY / SELL" value={order.type} />
            <InfoCard label="Crypto" value={`${order.crypto} • ${order.cryptoName}`} />
            <InfoCard label="Network" value={order.network} />
            <InfoCard label="Crypto Amount" value={order.cryptoAmount} />
            <InfoCard label="IDR Amount" value={order.idrAmount} />
            <InfoCard label="Market Rate" value={order.marketRate} />
            <InfoCard label="Service Fee" value={order.serviceFee} />
            <InfoCard label="Network Fee" value={order.networkFee} />
            <InfoCard label="Payment Method" value={order.paymentMethod} />
            <InfoCard label="Customer Wallet Address" value={order.walletAddress} className="md:col-span-2" />
            <InfoCard label="Created At" value={new Date(order.createdAt).toLocaleString("en-CA")} className="md:col-span-2" />
            <InfoCard label="Status" value={order.status} className="md:col-span-2" />
            <InfoCard label="Payment Proof" value={order.paymentProof ? "Uploaded" : "Not uploaded yet"} className="md:col-span-2" />
            {order.paymentProof && (
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment proof preview</p>
                <Image src={order.paymentProof} alt="Payment proof preview" width={800} height={600} className="mt-4 max-h-72 rounded-2xl object-contain" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Admin actions</p>

          <div className="mt-5 space-y-3">
            {adminOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setConfirmAction({ open: true, action: option.value })}
                disabled={option.disabled}
                className={`w-full rounded-full border px-4 py-3 text-left text-sm font-semibold transition ${
                  option.disabled
                    ? "cursor-not-allowed border-white/5 bg-slate-950/40 text-slate-500"
                    : "border-white/10 bg-slate-950/60 text-slate-100 hover:border-cyan-400/60 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {confirmAction.open && confirmAction.action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/30">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Confirmation</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Update order status</h2>
            <p className="mt-3 text-slate-300">
              Are you sure you want to change this order to <span className="font-semibold text-white">{confirmAction.action}</span>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction({ open: false, action: null })}
                className="rounded-full border border-white/10 bg-slate-950/60 px-5 py-3 text-sm font-semibold text-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction.action) {
                    handleStatusUpdate(confirmAction.action);
                  }
                }}
                className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-950/60 p-4 ${className}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-medium text-white">{value}</p>
    </div>
  );
}
