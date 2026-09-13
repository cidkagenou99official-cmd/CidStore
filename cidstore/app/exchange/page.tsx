import { ExchangeForm } from "@/app/components/exchange-form";

export default function ExchangePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Exchange</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
            Buy and sell crypto in seconds
          </h1>
        </div>
        <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">
          Demo rates • No real funds movement
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <ExchangeForm />

        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Market snapshot</p>
            <div className="mt-4 space-y-3">
              {[
                { symbol: "BTC", price: "$67,420.30", change: "+2.48%" },
                { symbol: "ETH", price: "$3,560.12", change: "+1.81%" },
                { symbol: "SOL", price: "$164.75", change: "+4.64%" },
                { symbol: "USDT", price: "$1.00", change: "+0.02%" },
              ].map((coin) => (
                <div
                  key={coin.symbol}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{coin.symbol}</p>
                    <p className="text-xs text-slate-400">{coin.change}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{coin.price}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Why traders choose CID Store</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                Fast-order matching in a secure demo environment.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-violet-400" />
                Transparent fees with mock payout summaries.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                Built for responsive mobile and desktop trading flows.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
