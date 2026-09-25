"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";

type Withdrawal = {
  id: string;
  userId: string;
  asset: string;
  network: string;
  amount: string;
  fee: string;
  receiveAmount: string;
  address: string;
  status: string;
  txHash: string | null;
  provider: string | null;
  processedAt: string | null;
  createdAt: string;
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  async function loadWithdrawals() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/withdrawals");

      const data = (await response.json()) as {
        withdrawals?: Withdrawal[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load withdrawals.");
      }

      setWithdrawals(data.withdrawals ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load withdrawals.",
      );
    } finally {
      setLoading(false);
    }
  }

 useEffect(() => {
  const timer = setTimeout(() => {
    void loadWithdrawals();
  }, 0);

  return () => clearTimeout(timer);
}, []);

  async function updateStatus(
    withdrawalId: string,
    status: "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED",
  ) {
    setActionLoading(`${withdrawalId}:${status}`);
    setError("");

    try {
      const response = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          withdrawalId,
          status,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update withdrawal.");
      }

      await loadWithdrawals();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update withdrawal.",
      );
    } finally {
      setActionLoading("");
    }
  }

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold">Withdrawal Management</h1>
          <p className="mt-2 text-sm text-white/45">
            Kelola withdrawal crypto customer.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] py-16 text-sm text-white/40">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading withdrawals...
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/40">
            Belum ada withdrawal.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold">
                        {withdrawal.amount} {withdrawal.asset}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          withdrawal.status === "COMPLETED"
                            ? "bg-emerald-400/10 text-emerald-300"
                            : withdrawal.status === "FAILED" ||
                                withdrawal.status === "CANCELLED"
                              ? "bg-red-400/10 text-red-300"
                              : withdrawal.status === "PROCESSING"
                                ? "bg-blue-400/10 text-blue-300"
                                : "bg-yellow-400/10 text-yellow-300"
                        }`}
                      >
                        {withdrawal.status}
                      </span>
                    </div>

                    <p className="mt-2 break-all text-xs text-white/35">
                      ID: {withdrawal.id}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-white/35">User ID</p>
                        <p className="mt-1 break-all text-sm">
                          {withdrawal.userId}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/35">Network</p>
                        <p className="mt-1 text-sm">
                          {withdrawal.network}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/35">Fee</p>
                        <p className="mt-1 text-sm">
                          {withdrawal.fee} {withdrawal.asset}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/35">
                          Customer receives
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-300">
                          {withdrawal.receiveAmount} {withdrawal.asset}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs text-white/35">
                        Destination wallet
                      </p>
                      <p className="mt-2 break-all text-sm">
                        {withdrawal.address}
                      </p>
                    </div>

                    <div className="mt-4 text-xs text-white/35">
                      Created:{" "}
                      {new Date(
                        withdrawal.createdAt,
                      ).toLocaleString("id-ID")}
                    </div>

                    {withdrawal.txHash && (
                      <div className="mt-2 break-all text-xs text-white/35">
                        TX Hash: {withdrawal.txHash}
                      </div>
                    )}
                  </div>

                  {withdrawal.status === "PENDING" && (
                    <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            withdrawal.id,
                            "PROCESSING",
                          )
                        }
                        disabled={actionLoading !== ""}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-400/20 disabled:opacity-40"
                      >
                        <Clock3 className="h-4 w-4" />
                        Processing
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            withdrawal.id,
                            "COMPLETED",
                          )
                        }
                        disabled={actionLoading !== ""}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            withdrawal.id,
                            "FAILED",
                          )
                        }
                        disabled={actionLoading !== ""}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-400/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-40"
                      >
                        <XCircle className="h-4 w-4" />
                        Failed
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            withdrawal.id,
                            "CANCELLED",
                          )
                        }
                        disabled={actionLoading !== ""}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/5 disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {withdrawal.status === "PROCESSING" && (
                    <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            withdrawal.id,
                            "COMPLETED",
                          )
                        }
                        disabled={actionLoading !== ""}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            withdrawal.id,
                            "FAILED",
                          )
                        }
                        disabled={actionLoading !== ""}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-400/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-40"
                      >
                        <XCircle className="h-4 w-4" />
                        Failed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
