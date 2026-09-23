"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const assets = [
  {
    symbol: "USDT",
    name: "Tether USD",
    networks: ["ERC20", "TRC20"],
    fee: {
      EVM: 2.5,
      TRON: 1,
    },
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    networks: ["Ethereum"],
    fee: {
      EVM: 0.002,
    },
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    networks: ["Bitcoin"],
    fee: {
      BITCOIN: 0.0001,
    },
  },
  {
    symbol: "SOL",
    name: "Solana",
    networks: ["Solana"],
    fee: {
      SOLANA: 0.005,
    },
  },
  {
    symbol: "TON",
    name: "Toncoin",
    networks: ["TON"],
    fee: {
      TON: 0.05,
    },
  },
];

export default function WithdrawPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("USDT");
  const [balances, setBalances] = useState<Array<{ asset: string; network: string; balance: number; locked: number }>>([]);
  const [network, setNetwork] = useState("ERC20");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/wallet/balance")
      .then((res) => res.json())
      .then((data) => setBalances(data.balances ?? []))
      .catch(() => setBalances([]));
  }, []);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.symbol === selectedSymbol) ?? assets[0],
    [selectedSymbol],
  );

  const currentBalance = useMemo(() => {
    const item = balances.find(
      (balance) =>
        balance.asset === selectedAsset.symbol &&
        balance.network === network,
    );

    if (!item) return 0;

    return Math.max(item.balance - item.locked, 0);
  }, [balances, selectedAsset.symbol, network]);

  const fee =
    selectedAsset.fee[network as keyof typeof selectedAsset.fee] ?? 0;

  const numericAmount = Number(amount) || 0;
  const receiveAmount = Math.max(numericAmount - fee, 0);

  const isValidAmount =
    numericAmount > fee && numericAmount <= currentBalance;

  const isValidAddress = address.trim().length >= 8;

  function changeAsset(symbol: string) {
    const asset = assets.find((item) => item.symbol === symbol);

    if (!asset) return;

    setSelectedSymbol(symbol);
    setNetwork(asset.networks[0]);
    setAmount("");
    setSuccess("");
    setError("");
  }

  function setMaxAmount() {
    const max = Math.max(currentBalance, 0);

    setAmount(
      max.toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: 8,
      }),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!isValidAddress) {
      setError("Masukkan alamat wallet tujuan yang valid.");
      return;
    }

    if (!isValidAmount) {
      setError(
        `Jumlah withdrawal harus lebih besar dari fee dan tidak boleh melebihi saldo ${selectedAsset.symbol}.`,
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: selectedSymbol,
          network,
          amount,
          address: address.trim(),
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        withdrawal?: {
          id: string;
          status: string;
          receiveAmount: string;
        };
      };

      if (!response.ok || !data.success || !data.withdrawal) {
        throw new Error(
          data.error || "Withdrawal request gagal dibuat.",
        );
      }

      setSuccess(
        `Withdrawal berhasil dibuat. ID: ${data.withdrawal.id}`,
      );

      setAmount("");
      setAddress("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat membuat withdrawal.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/asset"
            className="text-sm text-white/45 transition hover:text-white"
          >
            ← Back to Asset
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-300">
              <ArrowDownToLine className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">Withdraw Crypto</h1>
              <p className="mt-1 text-sm text-white/45">
                Kirim crypto dari CID Store ke wallet eksternal kamu.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              Asset
            </label>

            <div className="relative">
              <select
                value={selectedSymbol}
                onChange={(event) => changeAsset(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-purple-400/60"
              >
                {assets.map((asset) => (
                  <option
                    key={asset.symbol}
                    value={asset.symbol}
                    className="bg-slate-950"
                  >
                    {asset.symbol} — {asset.name}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            </div>

            <p className="mt-2 text-xs text-white/40">
              Available balance:{" "}
              <span className="font-medium text-white/70">
                {currentBalance} {selectedAsset.symbol}
              </span>
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              Network
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              {selectedAsset.networks.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setNetwork(item);
                    setSuccess("");
                    setError("");
                  }}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    network === item
                      ? "border-purple-400/60 bg-purple-500/10 text-white"
                      : "border-white/10 bg-black/20 text-white/50 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span className="font-semibold">{item}</span>
                  <span className="mt-1 block text-xs text-white/35">
                    Withdrawal network
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              Destination wallet address
            </label>

            <div className="relative">
              <Wallet className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-white/30" />

              <input
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setSuccess("");
                  setError("");
                }}
                placeholder="Masukkan alamat wallet tujuan"
                className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60"
              />
            </div>

            <p className="mt-2 text-xs text-amber-300/70">
              Pastikan network dan alamat tujuan sudah benar. Transaksi
              blockchain yang sudah dikirim tidak dapat dibatalkan.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-white/70">
                Amount
              </label>

              <button
                type="button"
                onClick={setMaxAmount}
                className="text-xs font-semibold text-purple-300 transition hover:text-purple-200"
              >
                MAX
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setSuccess("");
                  setError("");
                }}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-20 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/50">
                {selectedSymbol}
              </span>
            </div>

            {numericAmount > currentBalance && (
              <p className="mt-2 text-xs text-red-300">
                Amount melebihi saldo yang tersedia.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Withdrawal Summary
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-white/40">Network</span>
                <span className="font-medium">{network}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-white/40">Withdrawal amount</span>
                <span>
                  {numericAmount || 0} {selectedSymbol}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-white/40">Network fee</span>
                <span>
                  {fee} {selectedSymbol}
                </span>
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-white/70">
                    You receive
                  </span>
                  <span className="font-bold text-emerald-300">
                    {receiveAmount} {selectedSymbol}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {success && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isValidAddress || !isValidAmount}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-4 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating Withdrawal..." : "Create Withdrawal"}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-purple-400/10 bg-purple-500/[0.04] p-4 text-xs leading-6 text-white/40">
          <p className="font-semibold text-white/70">Important</p>
          <p className="mt-1">
            Withdrawal yang dibuat akan masuk status PENDING. Pengiriman
            blockchain nyata belum dilakukan sampai wallet/provider CID Store
            dihubungkan.
          </p>
        </div>
      </div>
    </main>
  );
}
