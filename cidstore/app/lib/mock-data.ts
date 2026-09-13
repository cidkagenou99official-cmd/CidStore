import type { CryptoDefinition, PaymentMethod } from "@/app/types";

export const qrisImagePath = "/payment/qris-baru.jpg";

export const danaPaymentDetails = {
  number: "085641463968",
  name: "TINI",
};

export const marketCoins: CryptoDefinition[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    rateIdr: 1800000000,
    networks: ["Bitcoin"],
    accent: "from-amber-400 to-orange-500",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    rateIdr: 65000000,
    networks: ["Ethereum"],
    accent: "from-sky-400 to-indigo-500",
  },
  {
    symbol: "SOL",
    name: "Solana",
    rateIdr: 2500000,
    networks: ["Solana"],
    accent: "from-violet-400 to-fuchsia-500",
  },
  {
    symbol: "USDT",
    name: "Tether",
    rateIdr: 16000,
    networks: ["TRC20", "ERC20", "BEP20"],
    accent: "from-emerald-400 to-teal-500",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    rateIdr: 16000,
    networks: ["ERC20", "Solana"],
    accent: "from-cyan-400 to-blue-500",
  },
  {
    symbol: "TRX",
    name: "TRON",
    rateIdr: 5000,
    networks: ["TRON"],
    accent: "from-red-400 to-rose-500",
  },
  {
    symbol: "BNB",
    name: "BNB",
    rateIdr: 18000000,
    networks: ["BNB Smart Chain"],
    accent: "from-yellow-400 to-amber-500",
  },
];

export const paymentMethods: PaymentMethod[] = ["QRIS", "DANA"];

export const paymentConfig = {
  qrisImage: qrisImagePath,
  danaAccounts: [danaPaymentDetails.number],
  danaAccountName: danaPaymentDetails.name,
  adminDemoCode: process.env.NEXT_PUBLIC_ADMIN_DEMO_CODE || "",
};

export const networkFeeMap: Record<string, number> = {
  Bitcoin: 2500,
  Ethereum: 12000,
  Solana: 2400,
  TRC20: 1000,
  ERC20: 8000,
  BEP20: 3000,
  TRON: 1000,
  "BNB Smart Chain": 4500,
};

export const storageKey = "cidstore-demo-orders";
