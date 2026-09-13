"use client";

import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart, CrosshairMode, type CandlestickData, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import {
  type CandleData,
  type CandleInterval,
  type MarketTicker,
  formatChangePercent,
  formatUsdPrice,
  getCandles,
  getCurrentPrice,
  subscribeKline,
  subscribeTicker,
} from "@/app/lib/market-data";
import type { CryptoSymbol } from "@/app/types";

const SYMBOLS: CryptoSymbol[] = ["BTC", "ETH", "SOL"];
const TIMEFRAMES: CandleInterval[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

function mapCandle(candle: CandleData): CandlestickData<Time> {
  return {
    time: candle.time as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

export function CryptoCandlestickChart() {
  const [selectedSymbol, setSelectedSymbol] = useState<CryptoSymbol>("BTC");
  const [selectedInterval, setSelectedInterval] = useState<CandleInterval>("1h");
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeTicker(selectedSymbol, (nextTicker) => {
      setTicker(nextTicker);
    });

    return () => unsubscribe();
  }, [selectedSymbol]);

  useEffect(() => {
    let isMounted = true;

    getCandles(selectedSymbol, selectedInterval, 200)
      .then((nextCandles) => {
        if (!isMounted) {
          return;
        }

        setCandles(nextCandles);
        setError(null);
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load candle history.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, selectedInterval]);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: "#020617" },
        textColor: "#cbd5e1",
      },
        grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.15)" },
        horzLines: { color: "rgba(148, 163, 184, 0.15)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.25)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.25)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderVisible: false,
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
      priceLineColor: "#60a5fa",
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) {
      return;
    }

    const series = seriesRef.current;
    if (!series) {
      return;
    }

    series.setData(candles.map(mapCandle));
  }, [candles]);

  useEffect(() => {
    if (!seriesRef.current) {
      return;
    }

    const unsubscribe = subscribeKline(selectedSymbol, selectedInterval, (nextCandle) => {
      const candle = mapCandle(nextCandle);
      const series = seriesRef.current;
      if (!series) {
        return;
      }

      series.update(candle);

      setCandles((previousCandles) => {
        const nextCandles = [...previousCandles];
        const existingIndex = nextCandles.findIndex((entry) => entry.time === nextCandle.time);

        if (existingIndex >= 0) {
          nextCandles[existingIndex] = nextCandle;
        } else {
          nextCandles.push(nextCandle);
        }

        return nextCandles.sort((a, b) => a.time - b.time).slice(-200);
      });
    });

    return () => unsubscribe();
  }, [selectedSymbol, selectedInterval]);

  const currentPrice = ticker?.price ?? getCurrentPrice(selectedSymbol) ?? 0;
  const currentChange = ticker?.changePercent ?? 0;

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-cyan-950/30 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Realtime Market</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {SYMBOLS.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => setSelectedSymbol(symbol)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  selectedSymbol === symbol
                    ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200"
                    : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-cyan-400/60 hover:text-white"
                }`}
              >
                {symbol}/USDT
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Last price</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-2xl font-semibold text-white">{formatUsdPrice(currentPrice, 2)}</span>
              <span
                className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  currentChange >= 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                }`}
              >
                {formatChangePercent(currentChange)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            LIVE
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TIMEFRAMES.map((interval) => (
          <button
            key={interval}
            type="button"
            onClick={() => setSelectedInterval(interval)}
            className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
              selectedInterval === interval
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200"
                : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-cyan-400/60 hover:text-white"
            }`}
          >
            {interval}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span>{selectedSymbol}/USDT</span>
          <span>{selectedInterval}</span>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
            {error}
          </div>
        )}

        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/70">
          <div ref={containerRef} className="h-[380px] w-full" />

          {isLoading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-[1px]">
              <div className="rounded-full border border-cyan-400/20 bg-slate-900/80 px-4 py-2 text-sm font-medium text-cyan-200">
                Loading candles...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
