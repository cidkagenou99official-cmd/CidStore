import Link from "next/link";
import { ExchangeForm } from "@/app/components/exchange-form";
import { MarketOverview } from "@/app/components/market-overview";

export default function TradePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-400">
                Trade
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Buy &amp; Sell Crypto
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                Beli crypto menggunakan pembayaran IDR atau jual crypto yang
                kamu miliki dan terima pembayaran ke bank atau e-wallet.
              </p>
            </div>

            <Link
              href="/asset"
              className="w-fit rounded-full border border-white/10 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
            >
              View My Assets →
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              BUY
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Pay IDR → Receive Crypto
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Bayar menggunakan QRIS, DANA, atau metode pembayaran yang
              tersedia.
            </p>
          </div>

          <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              SELL
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Send Crypto → Receive IDR
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Kirim crypto ke wallet CID Store lalu terima pembayaran ke
              rekening atau e-wallet kamu.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              LIVE MARKET
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Real-time pricing
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Harga BTC, ETH, dan SOL mengikuti market feed secara real-time.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section>
            <ExchangeForm />
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Market
              </p>

              <MarketOverview compact />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                Trading flow
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">
                    1
                  </div>

                  <div>
                    <p className="font-medium text-white">
                      Choose BUY or SELL
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Tentukan arah transaksi crypto kamu.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-400/10 text-xs font-bold text-indigo-300">
                    2
                  </div>

                  <div>
                    <p className="font-medium text-white">
                      Enter transaction details
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Pilih asset, network, jumlah, dan tujuan transaksi.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-300">
                    3
                  </div>

                  <div>
                    <p className="font-medium text-white">
                      Review &amp; confirm
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Periksa rate, fee, dan total sebelum membuat order.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-yellow-400/20 bg-yellow-500/5 p-5">
              <p className="text-sm font-semibold text-yellow-300">
                Important
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Pastikan network dan wallet address sudah benar. Transaksi
                blockchain yang salah network atau salah address dapat
                menyebabkan asset tidak dapat dipulihkan.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
