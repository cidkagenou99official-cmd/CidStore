"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Wallet } from "lucide-react";

type Balance = {
  id: string;
  asset: string;
  network: string;
  balance: string;
  locked: string;
};

const ASSET_NAMES: Record<string, string> = {
  USDT: "Tether USD",
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  TON: "Toncoin",
};

function formatBalance(value: string) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return number.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
}

export default function AssetPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBalances() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/wallet/balance", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil saldo.");
      }

      setBalances(data.balances || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil saldo.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  let cancelled = false;

  fetch("/api/wallet/balance", {
    cache: "no-store",
  })
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil saldo.");
      }

      if (!cancelled) {
        setBalances(data.balances || []);
        setError("");
      }
    })
    .catch((err) => {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil saldo.",
        );
      }
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, []);

  const totalBalance = useMemo(() => {
    return balances.reduce((total, item) => {
      return total + Number(item.balance);
    }, 0);
  }, [balances]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Wallet className="h-5 w-5 text-purple-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Asset</h1>
              <p className="text-sm text-white/50">
                Kelola aset crypto lu di CID Store.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm text-white/50">
            Total Asset
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold">
                {loading ? "Loading..." : `${formatBalance(String(totalBalance))} USDT*`}
              </p>

              <p className="mt-1 text-xs text-white/40">
                *Nilai sementara berdasarkan jumlah aset, belum konversi harga.
              </p>
            </div>

            <button
              type="button"
              onClick={loadBalances}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </section>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/asset/deposit"
            className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 transition hover:bg-purple-500/15"
          >
            <ArrowDownToLine className="mb-3 h-6 w-6 text-purple-400" />

            <h2 className="font-semibold">
              Deposit Crypto
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Kirim crypto dari wallet lu ke CID Store.
            </p>
          </Link>

          <Link
            href="/asset/withdraw"
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
          >
            <ArrowUpFromLine className="mb-3 h-6 w-6 text-white/70" />

            <h2 className="font-semibold">
              Withdraw Crypto
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Kirim crypto dari CID Store ke wallet lu.
            </p>
          </Link>
        </div>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Your Assets
            </h2>

            <p className="text-sm text-white/40">
              Saldo crypto yang tersimpan di akun lu.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
              Memuat saldo...
            </div>
          ) : balances.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <Wallet className="mx-auto mb-3 h-8 w-8 text-white/30" />

              <p className="font-medium">
                Belum ada saldo crypto
              </p>

              <p className="mt-1 text-sm text-white/40">
                Setelah deposit berhasil dikreditkan, saldo lu akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {balances.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div>
                    <p className="font-semibold">
                      {item.asset}
                    </p>

                    <p className="text-xs text-white/40">
                      {ASSET_NAMES[item.asset] || item.asset} · {item.network}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatBalance(item.balance)} {item.asset}
                    </p>

                    {Number(item.locked) > 0 && (
                      <p className="text-xs text-yellow-400/80">
                        Locked: {formatBalance(item.locked)} {item.asset}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
