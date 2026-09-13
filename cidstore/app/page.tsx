import Link from "next/link";
import { MarketOverview } from "@/app/components/market-overview";
import { CryptoCandlestickChart } from "@/app/components/crypto-candlestick-chart";

const benefits = [
  { title: "Fast Transaction", description: "Execute demo exchanges with a smooth, lightweight flow built for speed." },
  { title: "Secure Process", description: "Trade in a polished interface with transparent mock fees and audit-friendly summaries." },
  { title: "Multiple Payment Methods", description: "Test QRIS, DANA, and bank transfer scenarios through one exchange experience." },
  { title: "Customer Support", description: "Reach out through the support flow for real-time demo onboarding and follow-up." },
];

const steps = [
  "Select Crypto",
  "Enter Amount",
  "Choose Payment",
  "Confirm Order",
];

export default function HomePage() {
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_right,_rgba(99,102,241,0.18),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-cyan-200">
                Trusted Demo Exchange
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Fast &amp; Secure Crypto Exchange
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Buy and sell cryptocurrency quickly with your preferred payment method.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/exchange"
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02]"
                >
                  Start Exchange
                </Link>
                <Link
                  href="/#market"
                  className="rounded-full border border-white/10 bg-slate-900/70 px-6 py-3 text-center text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60 hover:text-white"
                >
                  View Market
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "24h Volume", value: "$12.6B" },
                  { label: "Markets", value: "280+" },
                  { label: "Support", value: "24/7" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-sm sm:p-6">
                <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Portfolio</p>
                      <p className="mt-2 text-3xl font-semibold text-white">$128,420</p>
                    </div>
                    <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                      +14.8%
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      ["BTC", "$67,420.30", "+2.48%"],
                      ["ETH", "$3,560.12", "+1.81%"],
                      ["SOL", "$164.75", "+4.64%"],
                    ].map(([symbol, price, change]) => (
                      <div key={symbol} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-sm font-black text-slate-950">
                            {symbol.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{symbol}</p>
                            <p className="text-xs text-slate-400">{price}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-emerald-300">{change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="market" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Market</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Explore trending pairs
            </h2>
          </div>
          <Link href="/exchange" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
            Open exchange →
          </Link>
        </div>

        <MarketOverview />

        <div className="mt-8">
          <CryptoCandlestickChart />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Why CID Store</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Built for confident crypto trading
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-indigo-500/30 text-cyan-200">
                <span className="text-xl">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">How It Works</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Trade in four simple steps
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  0{index + 1}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/40 to-transparent" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{step}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {index === 0 && "Choose your preferred cryptocurrency pair from a curated list of market favorites."}
                {index === 1 && "Enter the amount and review the mock exchange summary before moving forward."}
                {index === 2 && "Select a supported payment method including QRIS, DANA, or bank transfer."}
                {index === 3 && "Confirm the order and track its demo status from the orders dashboard."}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
