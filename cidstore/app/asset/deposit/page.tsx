"use client";

import { useEffect, useMemo, useState } from "react";

const assets = [
  {
    symbol: "USDT",
    name: "Tether",
    networks: ["ERC20", "TRC20"],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    networks: ["Ethereum"],
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    networks: ["Bitcoin"],
  },
  {
    symbol: "SOL",
    name: "Solana",
    networks: ["Solana"],
  },
  {
    symbol: "TON",
    name: "Toncoin",
    networks: ["TON"],
  },
];

type DepositAddressResponse = {
  depositAddress?: {
    id: string;
    asset: string;
    network: string;
    address: string | null;
    enabled: boolean;
  };
  warning?: string;
  error?: string;
};

export default function DepositPage() {
  const [selectedAsset, setSelectedAsset] = useState("USDT");
  const [selectedNetwork, setSelectedNetwork] = useState("ERC20");
  const [address, setAddress] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const currentAsset = useMemo(
    () => assets.find((asset) => asset.symbol === selectedAsset) ?? assets[0],
    [selectedAsset],
  );


  useEffect(() => {
    let cancelled = false;

    async function fetchDepositAddress() {
      setLoading(true);
      setError("");
      setWarning("");
      setAddress("");
      setCopied(false);

      try {
        const response = await fetch("/api/wallet/deposit-address", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            asset: selectedAsset,
            network: selectedNetwork,
          }),
        });

        const data = (await response.json()) as DepositAddressResponse;

        if (cancelled) return;

        if (!response.ok) {
          setError(data.error ?? "Failed to load deposit address.");
          return;
        }

        setAddress(data.depositAddress?.address ?? "");
        setWarning(data.warning ?? "");
      } catch {
        if (!cancelled) {
          setError("Unable to connect to the server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchDepositAddress();

    return () => {
      cancelled = true;
    };
  }, [selectedAsset, selectedNetwork]);

  function handleAssetChange(value: string) {
    const asset = assets.find((item) => item.symbol === value);

    if (!asset) return;

    setSelectedAsset(value);
    setSelectedNetwork(asset.networks[0]);
  }

  async function copyAddress() {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            Asset
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Deposit Crypto
          </h1>

          <p className="mt-2 text-slate-400">
            Gunakan address deposit yang dibuat khusus untuk akun kamu.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">Select Asset</h2>

            <p className="mt-1 text-sm text-slate-400">
              Pilih crypto yang ingin kamu deposit.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => {
                const active = asset.symbol === selectedAsset;

                return (
                  <button
                    key={asset.symbol}
                    type="button"
                    onClick={() => handleAssetChange(asset.symbol)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-cyan-400/60 bg-cyan-400/10"
                        : "border-white/10 bg-slate-950/40 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-300">
                        {asset.symbol.slice(0, 1)}
                      </div>

                      <div>
                        <p className="font-semibold">{asset.symbol}</p>

                        <p className="text-xs text-slate-400">
                          {asset.name}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">Select Network</h2>

            <p className="mt-1 text-sm text-slate-400">
              Pastikan network sama dengan network saat mengirim crypto.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {currentAsset.networks.map((network) => {
                const active = network === selectedNetwork;

                return (
                  <button
                    key={network}
                    type="button"
                    onClick={() => setSelectedNetwork(network)}
                    className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {network}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">Deposit Address</p>

                <h2 className="mt-1 text-xl font-bold">
                  {selectedAsset} • {selectedNetwork}
                </h2>
              </div>

              <span className="w-fit rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-300">
                TEST / MOCK
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              {loading ? (
                <p className="text-sm text-slate-400">
                  Membuat / mengambil deposit address...
                </p>
              ) : error ? (
                <p className="text-sm text-red-300">{error}</p>
              ) : address ? (
                <>
                  <p className="break-all font-mono text-sm leading-7 text-cyan-300">
                    {address}
                  </p>

                  <button
                    type="button"
                    onClick={copyAddress}
                    className="mt-5 w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    {copied ? "Address Copied ✓" : "Copy Address"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  Deposit address belum tersedia.
                </p>
              )}
            </div>

            {warning ? (
              <p className="mt-4 text-sm leading-6 text-yellow-300">
                {warning}
              </p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
            <h2 className="font-semibold text-red-300">Important</h2>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li>
                • Kirim hanya {selectedAsset} melalui network{" "}
                {selectedNetwork}.
              </li>

              <li>
                • Jangan mengirim asset atau network yang berbeda ke address
                ini.
              </li>

              <li>
                • Salah network dapat menyebabkan asset tidak dapat
                dipulihkan.
              </li>

              <li>
                • Address yang ditampilkan saat ini masih berasal dari Mock
                Wallet Provider.
              </li>

              <li>
                • Jangan kirim crypto sungguhan ke address TEST / MOCK ini.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
