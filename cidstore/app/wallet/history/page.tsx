"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  ExternalLink,
  RefreshCw,
  Wallet,
} from "lucide-react";

type HistoryItem = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  asset: string;
  network: string;
  amount: string;
  fee: string;
  receiveAmount: string;
  address: string | null;
  status: string;
  txHash: string | null;
  confirmations: number | null;
  provider: string | null;
  detectedAt: string | null;
  confirmedAt: string | null;
  creditedAt: string | null;
  processedAt: string | null;
  createdAt: string;
};

const ASSET_NAMES: Record<string, string> = {
  USDT: "Tether USD",
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  TON: "Toncoin",
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

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClass(status: string) {
  if (
    status === "COMPLETED" ||
    status === "CONFIRMED" ||
    status === "CREDITED"
  ) {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (
    status === "FAILED" ||
    status === "REJECTED" ||
    status === "CANCELLED" ||
    status === "REORGED"
  ) {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
}

export default function WalletHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/wallet/history", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil riwayat wallet.");
      }

      setHistory(data.history || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil riwayat wallet.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/asset"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-400" />
                <h1 className="text-2xl font-bold">
                  Wallet History
                </h1>
              </div>

              <p className="mt-1 text-sm text-white/50">
                Riwayat deposit dan withdrawal crypto lu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
            Memuat riwayat wallet...
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <Wallet className="mx-auto mb-4 h-10 w-10 text-white/30" />

            <h2 className="font-semibold">
              Belum ada riwayat
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Deposit atau withdrawal crypto lu akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const isDeposit = item.type === "DEPOSIT";

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                          isDeposit
                            ? "bg-green-500/10 text-green-400"
                            : "bg-purple-500/10 text-purple-400"
                        }`}
                      >
                        {isDeposit ? (
                          <ArrowDownToLine className="h-5 w-5" />
                        ) : (
                          <ArrowUpFromLine className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">
                            {isDeposit ? "Deposit" : "Withdrawal"}
                          </h2>

                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                            {item.asset}
                          </span>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${getStatusClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-white/40">
                          {ASSET_NAMES[item.asset] || item.asset} ·{" "}
                          {item.network}
                        </p>

                        <p className="mt-2 text-xs text-white/30">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold">
                        {isDeposit ? "+" : "-"}
                        {formatAmount(item.amount)} {item.asset}
                      </p>

                      {!isDeposit && (
                        <p className="mt-1 text-xs text-white/40">
                          Receive: {formatAmount(item.receiveAmount)}{" "}
                          {item.asset}
                        </p>
                      )}

                      {!isDeposit && Number(item.fee) > 0 && (
                        <p className="text-xs text-white/40">
                          Fee: {formatAmount(item.fee)} {item.asset}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-2">
                    {item.txHash && (
                      <div>
                        <p className="text-white/30">
                          Transaction Hash
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="break-all text-white/60">
                            {item.txHash}
                          </span>

                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/30" />
                        </div>
                      </div>
                    )}

                    {item.confirmations !== null && (
                      <div>
                        <p className="text-white/30">
                          Confirmations
                        </p>

                        <p className="mt-1 text-white/60">
                          {item.confirmations}
                        </p>
                      </div>
                    )}

                    {item.address && (
                      <div className="sm:col-span-2">
                        <p className="text-white/30">
                          Withdrawal Address
                        </p>

                        <p className="mt-1 break-all text-white/60">
                          {item.address}
                        </p>
                      </div>
                    )}

                    {item.provider && (
                      <div>
                        <p className="text-white/30">
                          Provider
                        </p>

                        <p className="mt-1 text-white/60">
                          {item.provider}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
