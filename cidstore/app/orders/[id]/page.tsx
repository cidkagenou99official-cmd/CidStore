"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import { danaPaymentDetails, qrisImagePath } from "@/app/lib/mock-data";
import type { Order } from "@/app/types";

const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentProof: "",
    paymentProofName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = (await response.json()) as Order | { error?: string };

        if (!isMounted) {
          return;
        }

        if ("id" in data) {
          setOrder(data);
          return;
        }

        setOrder(null);
      } catch {
        if (isMounted) {
          setOrder(null);
        }
      }
    };

    void fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/80 p-8 text-center">
          <p className="text-2xl font-semibold text-white">Order not found</p>
          <p className="mt-3 text-slate-300">The requested demo order could not be found.</p>
          <Link
            href="/orders"
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const showPaymentSection = order.type === "BUY" && order.paymentMethod !== undefined;
  const isSellOrder = order.type === "SELL";

  const handlePaymentProofChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPaymentForm({ paymentProof: "", paymentProofName: "" });
      setError("Please upload a valid image file for payment proof.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      setPaymentForm({ paymentProof: "", paymentProofName: "" });
      setError("Please upload a payment proof image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentForm((prev) => ({
        ...prev,
        paymentProof: typeof reader.result === "string" ? reader.result : "",
        paymentProofName: file.name,
      }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyDanaNumber = async () => {
    try {
      await navigator.clipboard.writeText(danaPaymentDetails.number);
      setStatusMessage("DANA number copied to clipboard.");
      setError(null);
    } catch {
      setError("Unable to copy automatically. Please copy the DANA number manually.");
    }
  };

  const handleSubmitPayment = async () => {
    if (isSubmittingPayment || order.status !== "PENDING") {
      return;
    }

    if (!paymentForm.paymentProof) {
      setError("Please upload a payment proof image before submitting.");
      return;
    }

    setIsSubmittingPayment(true);
    setError(null);
    setStatusMessage(null);

    const submittedAt = new Date().toISOString();

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "WAITING_VERIFICATION",
          paymentStatus: "WAITING_VERIFICATION",
          paymentProof: paymentForm.paymentProof,
          paymentSubmittedAt: submittedAt,
          updatedAt: submittedAt,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit payment proof.");
      }

      const updatedOrder = (await response.json().catch(() => data)) as Order;
      setOrder(updatedOrder);
      setPaymentForm({ paymentProof: "", paymentProofName: "" });
      setStatusMessage("Payment proof submitted successfully. Your order is now waiting for verification.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit payment proof right now.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const timelineItems =
    order.type === "SELL"
      ? ["Order Created", "Waiting Crypto", "Processing", "Completed"]
      : ["Order Created", "Waiting Payment", "Waiting Verification", "Payment Verified", "Processing", "Completed"];

  const timelineIndex =
    order.type === "SELL"
      ? order.status === "WAITING_CRYPTO"
        ? 1
        : order.status === "PROCESSING"
          ? 2
          : order.status === "COMPLETED"
            ? 3
            : 0
      : order.status === "PENDING"
        ? 1
        : order.status === "WAITING_VERIFICATION"
          ? 2
          : order.status === "PAYMENT_VERIFIED"
            ? 3
            : order.status === "PROCESSING"
              ? 4
              : order.status === "COMPLETED"
                ? 5
                : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">CID STORE</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Order {order.id}</h1>
        </div>
        <Link
          href="/orders"
          className="inline-flex rounded-full border border-white/10 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60 hover:text-white"
        >
          Back to Orders
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Status</p>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                {order.status}
              </span>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <InfoRow label="Order ID" value={order.id} />
              <InfoRow label="Order Type" value={order.type} />
              <InfoRow label="Crypto" value={`${order.crypto} • ${order.cryptoName}`} />
              <InfoRow label="Network" value={order.network} />
              <InfoRow label="Crypto Amount" value={order.cryptoAmount} />
              <InfoRow label="IDR Amount" value={order.idrAmount} />
              <InfoRow label="Market Rate" value={order.marketRate} />
              <InfoRow label="Service Fee" value={order.serviceFee} />
              <InfoRow label="Network Fee" value={order.networkFee} />
              <InfoRow label="Payment Method" value={order.paymentMethod} />
              <InfoRow label="Wallet Address" value={order.walletAddress} />
              <InfoRow label="Created At" value={formatDateTime(order.createdAt)} />
              <InfoRow label="Total" value={order.total} strong />
            </div>
          </div>

          {showPaymentSection && order.status === "PENDING" && (
            <div className="rounded-[28px] border border-cyan-400/20 bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Payment Instructions & Confirmation</p>

              <div className="mt-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoTile label="Order ID" value={order.id} />
                  <InfoTile label="Payment Method" value={order.paymentMethod} />
                  <InfoTile label="Crypto" value={`${order.crypto} • ${order.cryptoName}`} />
                  <InfoTile label="Network" value={order.network} />
                  <InfoTile label="Amount" value={order.cryptoAmount} />
                  <InfoTile label="Total" value={order.total} />
                </div>

                {order.paymentMethod === "QRIS" && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">QRIS PAYMENT</p>
                    <p className="mt-3 text-sm text-slate-300">Scan the QRIS below using your banking/e-wallet application.</p>
                    <div className="mt-4 rounded-2xl border border-dashed border-cyan-400/40 bg-slate-950/60 p-5">
                      <div className="flex min-h-52 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                        <div className="w-full max-w-xs rounded-2xl border border-cyan-400/20 bg-white p-4 text-center text-slate-700">
                          <Image
                            src={qrisImagePath}
                            alt="QRIS payment code"
                            width={200}
                            height={200}
                            className="mx-auto max-h-52 rounded-xl object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {order.paymentMethod === "DANA" && (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">DANA PAYMENT</p>
                    <div className="mt-4 space-y-4 text-sm text-slate-300">
                      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">DANA</p>
                        <p className="text-base font-medium text-white">{danaPaymentDetails.number}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">A/N {danaPaymentDetails.name}</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyDanaNumber}
                        className="w-full rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/60 hover:text-white"
                      >
                        Salin Nomor DANA
                      </button>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                        <p className="font-medium text-white">Payment Instructions</p>
                        <p className="mt-2">
                          Transfer sejumlah {order.total} ke DANA {danaPaymentDetails.number} atas nama {danaPaymentDetails.name}, lalu upload bukti pembayaran di bawah ini.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Payment Proof</p>

                  <div className="mt-5 space-y-4">
                    <label className="block space-y-2 text-sm text-slate-300">
                      <span className="font-medium">Upload payment proof image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProofChange}
                        className="w-full rounded-2xl border border-dashed border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                      />
                      {paymentForm.paymentProofName && <small className="text-xs text-cyan-200">Selected file: {paymentForm.paymentProofName}</small>}
                    </label>

                    {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
                    {statusMessage && <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-200">{statusMessage}</div>}

                    <button
                      type="button"
                      onClick={handleSubmitPayment}
                      disabled={isSubmittingPayment || !paymentForm.paymentProof}
                      className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingPayment ? "Submitting payment proof..." : "Submit Payment Proof"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSellOrder && (
            <div className="rounded-[28px] border border-sky-400/20 bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-300">Send Crypto</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoTile label="Order ID" value={order.id} />
                <InfoTile label="Direction" value={order.type} />
                <InfoTile label="Crypto" value={`${order.crypto} • ${order.cryptoName}`} />
                <InfoTile label="Network" value={order.network} />
                <InfoTile label="Amount" value={order.cryptoAmount} />
                <InfoTile label="Wallet / Address" value={order.walletAddress || "Not provided"} />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <p className="font-medium text-white">Deposit address</p>
                <p className="mt-2 text-sm text-slate-300">
                  CID Store will provide the deposit address for this SELL order. Please send the crypto only after the deposit address is shared by CID Store/admin.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-300">
                  {order.status === "WAITING_CRYPTO"
                    ? "Waiting for crypto transfer"
                    : order.status === "PROCESSING"
                      ? "Crypto received / payout in progress"
                      : order.status === "COMPLETED"
                        ? "Sell order completed"
                        : "Sell order status"}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {order.status === "WAITING_CRYPTO"
                    ? "Send the crypto to the deposit address provided by CID Store. Your order will move to processing after the transfer is manually confirmed."
                    : order.status === "PROCESSING"
                      ? "The crypto transfer has been received and is being reviewed by CID Store. The payout is currently being processed."
                      : order.status === "COMPLETED"
                        ? "This SELL order has been completed."
                        : `Current SELL order status: ${order.status}.`}
                </p>
              </div>
            </div>
          )}

          {order.status === "WAITING_VERIFICATION" && (
            <div className="rounded-[28px] border border-violet-400/20 bg-violet-500/5 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-violet-300">Awaiting admin verification</p>
              <p className="mt-3 text-slate-300">
                Your payment proof has been submitted and is currently waiting for manual review by an administrator.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Timeline</p>

          <div className="mt-6 space-y-4">
            {timelineItems.map((item, index) => (
              <div key={item} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                      index <= timelineIndex
                        ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
                        : "border-white/10 bg-slate-950 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < timelineItems.length - 1 && <div className="mt-2 h-7 w-px bg-white/10" />}
                </div>

                <div className="pt-1">
                  <p className="font-medium text-white">{item}</p>
                  {index === 0 && <p className="text-sm text-slate-400">{formatDateTime(order.createdAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={strong ? "text-base font-semibold text-white" : "text-base text-slate-200"}>{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-medium text-white">{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
