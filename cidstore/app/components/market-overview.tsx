"use client";

import Link from "next/link";
import { marketCoins } from "@/app/lib/mock-data";
import {
  formatChangePercent,
  formatUsdPrice,
  useMarketData,
} from "@/app/lib/market-data";

export function MarketOverview({ compact = false }: { compact?: boolean }) {
  const { tickers, status, error } = useMarketData();

  const getTicker = (symbol: string) => {
    const fallbackCoin = marketCoins.find((coin) => coin.symbol === symbol);
    const price = fallbackCoin ? fallbackCoin.rateIdr / 16000 : 0;

    return tickers[symbol] ?? {
      symbol,
      price,
      changePercent: 0,
      source: "fallback" as const,
      updatedAt: 0,
    };
  };

  const renderPrice = (coin: (typeof marketCoins)[number]) => {
    const ticker = getTicker(coin.symbol);
    const precision = coin.symbol === "BTC" || coin.symbol === "ETH" || coin.symbol === "SOL" ? 2 : 2;

    return {
      ticker,
      displayPrice: formatUsdPrice(ticker.price, precision),
      displayChange: formatChangePercent(ticker.changePercent),
    };
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Market snapshot</p>
          <p className="mt-2 text-xs text-slate-500">
            {status === "loading" && "Syncing live price feed..."}
            {status === "live" && "Live market data • Binance public feed"}
            {status === "fallback" && "Cached market data • Binance unavailable"}
            {status === "error" && "Market feed warning"}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            status === "live"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : status === "fallback"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                : "border-slate-500/30 bg-slate-500/10 text-slate-200"
          }`}
        >
          {status}
        </span>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}

      {compact ? (
        <div className="space-y-3">
          {marketCoins.map((coin) => {
            const { displayPrice, displayChange, ticker } = renderPrice(coin);

            return (
              <div
                key={coin.symbol}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-white">{coin.symbol}</p>
                  <p className="text-xs text-slate-400">{ticker.source === "binance" ? "Live" : "Demo fallback"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-200">{displayPrice}</p>
                  <p className={`text-xs ${ticker.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {displayChange}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {marketCoins.map((coin) => {
            const { displayPrice, displayChange, ticker } = renderPrice(coin);

            return (
              <article
                key={coin.symbol}
                className="group rounded-[28px] border border-white/10 bg-slate-900/80 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${coin.accent} text-lg font-black text-slate-950 shadow-lg`}
                    >
                      {coin.symbol.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white">{coin.symbol}</p>
                      <p className="text-sm text-slate-400">{coin.name}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${ticker.changePercent >= 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
                    {displayChange}
                  </span>
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Price</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{displayPrice}</p>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    {ticker.source === "binance" ? "LIVE" : "Fallback"}
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href="/exchange"
                    className="flex-1 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950"
                  >
                    Buy
                  </Link>
                  <Link
                    href="/exchange"
                    className="flex-1 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2.5 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
                  >
                    Sell
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
