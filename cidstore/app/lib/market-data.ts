import { useSyncExternalStore } from "react";
import { marketCoins } from "@/app/lib/mock-data";

export type MarketStatus = "loading" | "live" | "fallback" | "error";
export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type MarketTicker = {
  symbol: string;
  price: number;
  changePercent: number;
  source: "binance" | "fallback";
  updatedAt: number;
};

export type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketSnapshot = {
  tickers: Record<string, MarketTicker>;
  status: MarketStatus;
  error?: string;
};

const LIVE_BINANCE_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
const USD_TO_IDR = 16000;

const FALLBACK_USD_PRICES: Record<string, number> = {
  BTC: 67420.3,
  ETH: 3560.12,
  SOL: 164.75,
  USDT: 1,
  USDC: 1,
  TRX: 0.27,
  BNB: 592.41,
};

const FALLBACK_CHANGE_PERCENT: Record<string, number> = {
  BTC: 2.48,
  ETH: 1.81,
  SOL: 4.64,
  USDT: 0.02,
  USDC: 0.01,
  TRX: 1.11,
  BNB: 1.86,
};

const FALLBACK_TICKERS = Object.fromEntries(
  Object.entries(FALLBACK_USD_PRICES).map(([symbol, price]) => {
    return [
      symbol,
      {
        symbol,
        price,
        changePercent: FALLBACK_CHANGE_PERCENT[symbol] ?? 0,
        source: "fallback" as const,
        updatedAt: Date.now(),
      },
    ];
  }),
) as Record<string, MarketTicker>;

const SERVER_MARKET_SNAPSHOT: MarketSnapshot = {
  tickers: FALLBACK_TICKERS,
  status: "loading",
};

let marketSnapshot: MarketSnapshot = {
  tickers: FALLBACK_TICKERS,
  status: "loading",
};

const listeners = new Set<() => void>();
const tickerSubscribers = new Map<string, Set<(ticker: MarketTicker) => void>>();
const candleListeners = new Map<string, Set<(candle: CandleData) => void>>();
const candleCache = new Map<string, CandleData[]>();

let subscriberCount = 0;
let websocket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let initPromise: Promise<void> | null = null;

let klineWebsocket: WebSocket | null = null;
let klineReconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let klineReconnectAttempt = 0;
let activeKlineStreams = new Set<string>();

function notify() {
  listeners.forEach((listener) => listener());
}

function normalizeSymbol(symbol: string) {
  const normalized = symbol.toUpperCase();

  return normalized.endsWith("USDT") ? normalized.slice(0, -4) : normalized;
}

function getBinancePair(symbol: string) {
  return `${normalizeSymbol(symbol)}USDT`;
}

function buildFallbackSnapshot(): Record<string, MarketTicker> {
  return Object.fromEntries(
    Object.entries(FALLBACK_TICKERS).map(([symbol, ticker]) => [
      symbol,
      {
        ...ticker,
        updatedAt: Date.now(),
      },
    ]),
  );
}

function triggerTickerSubscribers(nextTickers: Record<string, MarketTicker>) {
  Object.entries(nextTickers).forEach(([symbol, ticker]) => {
    const subscribers = tickerSubscribers.get(symbol);

    if (!subscribers) {
      return;
    }

    subscribers.forEach((callback) => callback(ticker));
  });
}

function updateSnapshot(nextSnapshot: Partial<MarketSnapshot>) {
  marketSnapshot = {
    ...marketSnapshot,
    ...nextSnapshot,
    tickers: {
      ...marketSnapshot.tickers,
      ...(nextSnapshot.tickers ?? {}),
    },
  };

  if (nextSnapshot.tickers) {
    triggerTickerSubscribers(nextSnapshot.tickers);
  }

  notify();
}

export function getMarketSnapshot(): MarketSnapshot {
  return marketSnapshot;
}

export function useMarketData(): MarketSnapshot {
  return useSyncExternalStore(
    (listener) => subscribeMarketData(listener),
    getMarketSnapshot,
    () => SERVER_MARKET_SNAPSHOT,
  );
}

export function getCurrentPrice(symbol: string): number | null {
  const normalized = normalizeSymbol(symbol);
  const ticker = marketSnapshot.tickers[normalized];

  if (ticker) {
    return ticker.price;
  }

  const fallbackCoin = marketCoins.find((coin) => coin.symbol === normalized);

  return fallbackCoin ? fallbackCoin.rateIdr / USD_TO_IDR : null;
}

export function getMarketPrice(symbol: string): number | null {
  return getCurrentPrice(symbol);
}

export function getPriceInIdr(symbol: string): number {
  const price = getCurrentPrice(symbol);

  if (price) {
    return price * USD_TO_IDR;
  }

  const fallbackCoin = marketCoins.find((coin) => coin.symbol === normalizeSymbol(symbol));

  return fallbackCoin?.rateIdr ?? 0;
}

export function formatUsdPrice(price: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
    minimumFractionDigits: 2,
  }).format(price);
}

export function formatChangePercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function subscribeTicker(symbol: string, callback: (ticker: MarketTicker) => void) {
  const normalized = normalizeSymbol(symbol);

  if (!tickerSubscribers.has(normalized)) {
    tickerSubscribers.set(normalized, new Set());
  }

  const subscribers = tickerSubscribers.get(normalized)!;
  subscribers.add(callback);

  const currentTicker = marketSnapshot.tickers[normalized];

  if (currentTicker) {
    callback(currentTicker);
  }

  return () => {
    subscribers.delete(callback);

    if (subscribers.size === 0) {
      tickerSubscribers.delete(normalized);
    }
  };
}

export async function getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<CandleData[]> {
  const normalized = normalizeSymbol(symbol);
  const cacheKey = `${normalized}:${interval}`;
  const cached = candleCache.get(cacheKey);

  if (cached && cached.length >= limit) {
    return cached.slice(-limit).map((candle) => ({ ...candle }));
  }

  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${getBinancePair(normalized)}&interval=${interval}&limit=${limit}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to load Binance candles (${response.status}).`);
  }

  const payload = (await response.json()) as Array<[number, string, string, string, string, string, number, number, number, number, number, string]>;

  const candles = payload.map(([time, open, high, low, close, volume]) => ({
    time: Math.floor(time / 1000),
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
    volume: Number(volume),
  }));

  candleCache.set(cacheKey, candles);

  return candles.slice(-limit).map((candle) => ({ ...candle }));
}

export function subscribeKline(
  symbol: string,
  interval: CandleInterval,
  callback: (candle: CandleData) => void,
) {
  const normalized = normalizeSymbol(symbol);
  const streamKey = `${getBinancePair(normalized).toLowerCase()}@kline_${interval}`;

  if (!candleListeners.has(streamKey)) {
    candleListeners.set(streamKey, new Set());
  }

  activeKlineStreams.add(streamKey);

  const listenersForStream = candleListeners.get(streamKey)!;
  listenersForStream.add(callback);

  ensureKlineWebSocket();

  return () => {
    listenersForStream.delete(callback);

    if (listenersForStream.size === 0) {
      candleListeners.delete(streamKey);
      activeKlineStreams.delete(streamKey);
    }

    if (activeKlineStreams.size === 0) {
      stopKlineWebSocket();
    } else {
      ensureKlineWebSocket();
    }
  };
}

async function fetchInitialSnapshot(): Promise<Record<string, MarketTicker>> {
  const settledResults = await Promise.allSettled(
    LIVE_BINANCE_SYMBOLS.map(async (symbol) => {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Binance public market unavailable (${response.status}).`);
      }

      const payload = (await response.json()) as { s?: string; c?: string; P?: string };

      if (!payload.s || payload.c === undefined || payload.P === undefined) {
        throw new Error("Malformed Binance ticker payload.");
      }

      const normalizedSymbol = normalizeSymbol(payload.s);

      return {
        symbol: normalizedSymbol,
        price: Number(payload.c),
        changePercent: Number(payload.P),
        source: "binance" as const,
        updatedAt: Date.now(),
      };
    }),
  );

  const liveTickers = settledResults.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    return [];
  });

  if (liveTickers.length === 0) {
    throw new Error("Unable to fetch initial Binance market snapshot.");
  }

  return Object.fromEntries(liveTickers.map((ticker) => [ticker.symbol, ticker]));
}

function applyBinanceTicker(payload: { s?: string; c?: string; P?: string }) {
  if (!payload.s || payload.c === undefined || payload.P === undefined) {
    return;
  }

  const symbol = normalizeSymbol(payload.s);

  const nextTicker: MarketTicker = {
    symbol,
    price: Number(payload.c),
    changePercent: Number(payload.P),
    source: "binance",
    updatedAt: Date.now(),
  };

  updateSnapshot({
    tickers: {
      [symbol]: nextTicker,
    },
    status: "live",
    error: undefined,
  });
}

function applyKlinePayload(payload: { s?: string; k?: { i?: string; t?: number; o?: string; h?: string; l?: string; c?: string; v?: string } }) {
  if (!payload.s || !payload.k?.i || payload.k.t === undefined) {
    return;
  }

  const symbol = normalizeSymbol(payload.s);
  const interval = payload.k.i as CandleInterval;
  const streamKey = `${payload.s.toLowerCase()}@kline_${interval}`;
  const candle: CandleData = {
    time: Math.floor(payload.k.t / 1000),
    open: Number(payload.k.o ?? 0),
    high: Number(payload.k.h ?? 0),
    low: Number(payload.k.l ?? 0),
    close: Number(payload.k.c ?? 0),
    volume: Number(payload.k.v ?? 0),
  };

  const cacheKey = `${symbol}:${interval}`;
  const cached = candleCache.get(cacheKey) ?? [];
  const existingIndex = cached.findIndex((entry) => entry.time === candle.time);

  if (existingIndex >= 0) {
    cached[existingIndex] = candle;
  } else {
    cached.push(candle);
  }

  candleCache.set(cacheKey, cached.slice(-500));

  const listenersForStream = candleListeners.get(streamKey);

  if (!listenersForStream) {
    return;
  }

  listenersForStream.forEach((callback) => callback(candle));
}

function scheduleReconnect() {
  if (reconnectTimeout) {
    return;
  }

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    startWebSocket();
  }, Math.min(30000, 1000 * 2 ** reconnectAttempt));
}

function startWebSocket() {
  if (typeof window === "undefined" || websocket) {
    return;
  }

  try {
    const streamQuery = LIVE_BINANCE_SYMBOLS.map((symbol) => `${symbol.toLowerCase()}@ticker`).join("/");
    const socketUrl = `wss://stream.binance.com:9443/stream?streams=${streamQuery}`;

    websocket = new WebSocket(socketUrl);

    websocket.onopen = () => {
      reconnectAttempt = 0;
      updateSnapshot({
        status: marketSnapshot.status === "fallback" ? "fallback" : "live",
        error: undefined,
      });
    };

    websocket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { data?: { s?: string; c?: string; P?: string } };
        applyBinanceTicker(payload.data ?? {});
      } catch {
        updateSnapshot({
          status: "error",
          error: "Unable to parse live market updates.",
        });
      }
    };

    websocket.onerror = () => {
      updateSnapshot({
        status: "fallback",
        error: "Live market connection temporarily lost. Showing cached prices.",
      });
    };

    websocket.onclose = () => {
      websocket = null;
      reconnectAttempt += 1;
      scheduleReconnect();
    };
  } catch {
    updateSnapshot({
      status: "fallback",
      error: "Live market connection is unavailable.",
    });
  }
}

function stopWebSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (websocket) {
    websocket.onclose = null;
    websocket.close();
    websocket = null;
  }
}

function scheduleKlineReconnect() {
  if (klineReconnectTimeout) {
    return;
  }

  klineReconnectTimeout = setTimeout(() => {
    klineReconnectTimeout = null;
    ensureKlineWebSocket();
  }, Math.min(30000, 1000 * 2 ** klineReconnectAttempt));
}

function ensureKlineWebSocket() {
  if (typeof window === "undefined") {
    return;
  }

  if (activeKlineStreams.size === 0) {
    stopKlineWebSocket();
    return;
  }

  if (klineWebsocket) {
    return;
  }

  const streams = Array.from(activeKlineStreams);
  const socketUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join("/")}`;

  klineWebsocket = new WebSocket(socketUrl);

  klineWebsocket.onopen = () => {
    klineReconnectAttempt = 0;
  };

  klineWebsocket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as {
        data?: {
          s?: string;
          k?: { i?: string; t?: number; o?: string; h?: string; l?: string; c?: string; v?: string };
        };
      };

      applyKlinePayload(payload.data ?? {});
    } catch {
      updateSnapshot({
        status: marketSnapshot.status === "live" ? "error" : marketSnapshot.status,
        error: "Unable to parse live candle updates.",
      });
    }
  };

  klineWebsocket.onerror = () => {
    updateSnapshot({
      status: marketSnapshot.status === "live" ? "fallback" : marketSnapshot.status,
      error: "Live chart connection is temporarily degraded.",
    });
  };

  klineWebsocket.onclose = () => {
    klineWebsocket = null;
    klineReconnectAttempt += 1;
    scheduleKlineReconnect();
  };
}

function stopKlineWebSocket() {
  if (klineReconnectTimeout) {
    clearTimeout(klineReconnectTimeout);
    klineReconnectTimeout = null;
  }

  if (klineWebsocket) {
    klineWebsocket.onclose = null;
    klineWebsocket.close();
    klineWebsocket = null;
  }
}

export async function initializeMarketData() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const liveTickers = await fetchInitialSnapshot();

      updateSnapshot({
        tickers: {
          ...buildFallbackSnapshot(),
          ...liveTickers,
        },
        status: "live",
        error: undefined,
      });
    } catch {
      updateSnapshot({
        tickers: buildFallbackSnapshot(),
        status: "fallback",
        error: "Live market data is temporarily unavailable. Cached prices are being used.",
      });
    }

    startWebSocket();
  })().finally(() => {
    initPromise = null;
  });

  return initPromise;
}

export function subscribeMarketData(listener: () => void) {
  listeners.add(listener);
  subscriberCount += 1;

  if (subscriberCount === 1) {
    void initializeMarketData();
  }

  return () => {
    listeners.delete(listener);
    subscriberCount -= 1;

    if (subscriberCount <= 0) {
      subscriberCount = 0;
      stopWebSocket();
      stopKlineWebSocket();
    }
  };
}

export function resetMarketDataForDebug() {
  stopWebSocket();
  stopKlineWebSocket();
  marketSnapshot = {
    tickers: buildFallbackSnapshot(),
    status: "loading",
  };
  listeners.clear();
  tickerSubscribers.clear();
  candleListeners.clear();
  candleCache.clear();
  activeKlineStreams = new Set<string>();
  subscriberCount = 0;
  initPromise = null;
}
