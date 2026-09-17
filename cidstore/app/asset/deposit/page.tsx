"use client";

import { useMemo, useState } from "react";

const assets = [
  {
    symbol: "USDT",
    name: "Tether",
    networks: ["EVM", "TRON"],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    networks: ["EVM"],
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    networks: ["BITCOIN"],
  },
  {
    symbol: "SOL",
    name: "Solana",
    networks: ["SOLANA"],
  },
  {
    symbol: "TON",
    name: "Toncoin",
    networks: ["TON"],
  },
];

const depositAddresses: Record<string, string> = {
  EVM: "0xTEST_CID_STORE_EVM_ADDRESS",
  TRON: "TTEST_CID_STORE_TRON_ADDRESS",
  BITCOIN: "bc1qtestcidstorebitcoinaddress",
  SOLANA: "TEST_CID_STORE_SOLANA_ADDRESS",
  TON: "UQTEST_CID_STORE_TON_ADDRESS",
};

export default function DepositPage() {
  const [selectedAsset, setSelectedAsset] = useState("USDT");
  const [selectedNetwork, setSelectedNetwork] = useState("EVM");
  const [copied, setCopied] = useState(false);

  const currentAsset = useMemo(
    () => assets.find((asset) => asset.symbol === selectedAsset) ?? assets[0],
    [selectedAsset],
  );

  const address = depositAddresses[selectedNetwork] ?? "";

  function handleAssetChange(value: string) {
    const asset = assets.find((item) => item.symbol === value);

    if (!asset) return;

    setSelectedAsset(value);
    setSelectedNetwork(asset.networks[0]);
    setCopied(false);
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
            Kirim crypto dari wallet kamu ke wallet CID Store.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">
              Select Asset
            </h2>

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
                        <p className="font-semibold">
                          {asset.symbol}
                        </p>

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
            <h2 className="text-lg font-semibold">
              Select Network
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Pastikan network sama dengan network yang digunakan
              saat mengirim crypto.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {currentAsset.networks.map((network) => {
                const active = network === selectedNetwork;

                return (
                  <button
                    key={network}
                    type="button"
                    onClick={() => {
                      setSelectedNetwork(network);
                      setCopied(false);
                    }}
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
                <p className="text-sm text-slate-400">
                  Deposit Address
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {selectedAsset} • {selectedNetwork}
                </h2>
              </div>

              <span className="w-fit rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-300">
                TEST ADDRESS
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
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
            </div>
          </section>

          <section className="rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
            <h2 className="font-semibold text-red-300">
              Important
            </h2>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li>
                • Kirim hanya {selectedAsset} melalui network{" "}
                {selectedNetwork}.
              </li>

              <li>
                • Jangan mengirim asset atau network yang berbeda
                ke address ini.
              </li>

              <li>
                • Salah network dapat menyebabkan asset tidak dapat
                dipulihkan.
              </li>

              <li>
                • Address di halaman ini masih merupakan address
                TEST dan belum merupakan wallet produksi.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}