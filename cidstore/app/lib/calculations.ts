import { getPriceInIdr } from "@/app/lib/market-data";
import { marketCoins, networkFeeMap } from "@/app/lib/mock-data";
import type { CryptoDefinition, QuoteBreakdown, CryptoSymbol } from "@/app/types";

const SERVICE_FEE_RATE = 0.01;

export function getCryptoDefinition(symbol: CryptoSymbol): CryptoDefinition {
  return marketCoins.find((coin) => coin.symbol === symbol) ?? marketCoins[0];
}

export function calculateQuote({
  crypto,
  network,
  amount,
  amountMode,
  type,
}: {
  crypto: CryptoSymbol;
  network: string;
  amount: number;
  amountMode: "crypto" | "idr";
  type: "BUY" | "SELL";
}): QuoteBreakdown {
  const cryptoDefinition = getCryptoDefinition(crypto);
  const marketRate = getPriceInIdr(crypto) || cryptoDefinition.rateIdr;

  const cryptoAmount = amountMode === "crypto" ? amount : amount / marketRate;
  const idrAmount = amountMode === "idr" ? amount : amount * marketRate;

  const serviceFee = idrAmount * SERVICE_FEE_RATE;
  const networkFee = networkFeeMap[network] ?? 0;

  const total =
    type === "BUY"
      ? idrAmount + serviceFee + networkFee
      : Math.max(idrAmount - serviceFee - networkFee, 0);

  return {
    cryptoAmount,
    idrAmount,
    marketRate,
    serviceFee,
    networkFee,
    total,
  };
}
