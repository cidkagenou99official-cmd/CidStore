export type CryptoSymbol = "BTC" | "ETH" | "SOL" | "USDT" | "USDC" | "TRX" | "BNB";

export type OrderType = "BUY" | "SELL";

export type PaymentMethod = "QRIS" | "DANA";

export type OrderStatus =
  | "PENDING"
  | "WAITING_VERIFICATION"
  | "PAYMENT_VERIFIED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "WAITING_CRYPTO";

export type PaymentStatus =
  | "AWAITING_PAYMENT"
  | "WAITING_VERIFICATION"
  | "PAYMENT_VERIFIED"
  | "AWAITING_CRYPTO"
  | "REJECTED";

export interface CryptoDefinition {
  symbol: CryptoSymbol;
  name: string;
  rateIdr: number;
  networks: string[];
  accent: string;
}

export interface QuoteBreakdown {
  cryptoAmount: number;
  idrAmount: number;
  marketRate: number;
  serviceFee: number;
  networkFee: number;
  total: number;
}

export interface Order {
  id: string;
  type: OrderType;
  crypto: CryptoSymbol;
  cryptoName: string;
  network: string;
  cryptoAmount: string;
  idrAmount: string;
  marketRate: string;
  serviceFee: string;
  networkFee: string;
  paymentMethod: PaymentMethod;
  walletAddress: string;
  total: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentProof?: string | null;
  paymentSubmittedAt?: string | null;
  verifiedAt?: string | null;
  adminNote?: string | null;
  updatedAt?: string | null;
  customerContact?: string | null;
  userId?: string | null;
  depositAddressId?: string | null;
}
