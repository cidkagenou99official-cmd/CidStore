"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderReviewModal } from "@/app/components/order-review-modal";
import { Toast } from "@/app/components/toasts";
import { calculateQuote, getCryptoDefinition } from "@/app/lib/calculations";
import { getPriceInIdr } from "@/app/lib/market-data";
import {
  danaPaymentDetails,
  marketCoins,
  networkFeeMap,
  paymentMethods,
  qrisImagePath,
} from "@/app/lib/mock-data";
import type { CryptoSymbol, Order, OrderType, PaymentMethod } from "@/app/types";

const initialWalletAddress = "bc1q9x5...untrusted-demo";

export function ExchangeForm() {
  const router = useRouter();

  const [mode, setMode] = useState<OrderType>("BUY");
  const [crypto, setCrypto] = useState<CryptoSymbol>("BTC");
  const [network, setNetwork] = useState("Bitcoin");
  const [amountMode, setAmountMode] = useState<"crypto" | "idr">("crypto");
  const [amountValue, setAmountValue] = useState("0.0005");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [walletAddress, setWalletAddress] = useState(initialWalletAddress);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCrypto = getCryptoDefinition(crypto);
  const selectedNetworkOptions = selectedCrypto.networks;

  const parsedAmount = Number(amountValue || 0);

  const quote =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? calculateQuote({
          crypto,
          network,
          amount: parsedAmount,
          amountMode,
          type: mode,
        })
      : {
          cryptoAmount: 0,
          idrAmount: 0,
          marketRate: getPriceInIdr(crypto) || selectedCrypto.rateIdr,
          serviceFee: 0,
          networkFee: networkFeeMap[network] ?? 0,
          total: 0,
        };

  const canSubmit =
    Boolean(crypto) &&
    Boolean(network) &&
    Number(amountValue) > 0 &&
    Boolean(walletAddress.trim()) &&
    Boolean(paymentMethod);

  const handleCopyDanaNumber = async () => {
    try {
      await navigator.clipboard.writeText(danaPaymentDetails.number);
      setToast({ message: "DANA number copied to clipboard.", variant: "success" });
    } catch {
      setToast({ message: "Unable to copy automatically. Please copy the DANA number manually.", variant: "error" });
    }
  };

  const handleCryptoChange = (nextCrypto: CryptoSymbol) => {
    const nextDefinition = getCryptoDefinition(nextCrypto);
    setCrypto(nextCrypto);
    setNetwork(nextDefinition.networks[0]);
    setErrors((prev) => ({ ...prev, crypto: "", network: "" }));
  };

  const handleAmountChange = (value: string) => {
    setAmountValue(value);
    setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleOpenReview = () => {
    const nextErrors: Record<string, string> = {};

    if (!crypto) nextErrors.crypto = "Please select a cryptocurrency.";
    if (!network) nextErrors.network = "Please choose a network.";
    if (!Number(amountValue) || Number(amountValue) <= 0) nextErrors.amount = "Please enter an amount greater than zero.";
    if (!walletAddress.trim()) nextErrors.walletAddress = "Wallet address is required.";
    if (!paymentMethod) nextErrors.paymentMethod = "Please choose a payment method.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setToast({ message: "Please fix the highlighted validation errors.", variant: "error" });
      return;
    }

    setToast(null);
    setIsReviewOpen(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    const payload = {
      id: orderId,
      type: mode,
      crypto,
      cryptoName: selectedCrypto.name,
      network,
      cryptoAmount: formatCryptoAmount(quote.cryptoAmount, crypto),
      idrAmount: formatIdr(quote.idrAmount),
      marketRate: formatIdr(quote.marketRate),
      serviceFee: formatIdr(quote.serviceFee),
      networkFee: formatIdr(quote.networkFee),
      paymentMethod,
      walletAddress,
      total: formatIdr(quote.total),
      createdAt: now,
      updatedAt: now,
      status: mode === "BUY" ? "PENDING" : "WAITING_CRYPTO",
      paymentStatus: mode === "BUY" ? "AWAITING_PAYMENT" : "AWAITING_CRYPTO",
      customerContact: null,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Unable to create order.");
      }

      const createdOrder = (await response.json()) as Order;

      setIsSubmitting(false);
      setIsReviewOpen(false);
      setToast({ message: "Order created successfully.", variant: "success" });
      router.push(`/orders/${createdOrder.id}`);
    } catch (error) {
      setIsSubmitting(false);
      setToast({
        message: error instanceof Error ? error.message : "Unable to create order.",
        variant: "error",
      });
    }
  };

  const reviewOrder: Order | null = {
    id: "CID-REVIEW",
    type: mode,
    crypto,
    cryptoName: selectedCrypto.name,
    network,
    cryptoAmount: `${formatCryptoAmount(quote.cryptoAmount, crypto)}`,
    idrAmount: formatIdr(quote.idrAmount),
    marketRate: formatIdr(quote.marketRate),
    serviceFee: formatIdr(quote.serviceFee),
    networkFee: formatIdr(quote.networkFee),
    paymentMethod,
    walletAddress,
    total: formatIdr(quote.total),
    createdAt: new Date().toISOString(),
    status: mode === "BUY" ? "PENDING" : "WAITING_CRYPTO",
    paymentStatus: mode === "BUY" ? "AWAITING_PAYMENT" : "AWAITING_CRYPTO",
    paymentProof: null,
    paymentSubmittedAt: null,
    verifiedAt: null,
    adminNote: null,
    updatedAt: new Date().toISOString(),
  };

  return (
    <>
      {toast && <Toast message={toast.message} variant={toast.variant} />}

      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-cyan-950/30 sm:p-6">
        <div className="mb-6 flex flex-wrap gap-3 rounded-full border border-white/10 bg-slate-950/70 p-1">
          {(["BUY", "SELL"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === tab
                  ? "bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200 sm:text-xs">
          <span>MANUAL PAYMENT FLOW</span>
          <span>{mode === "BUY" ? "Pay IDR • Receive Crypto" : "Send Crypto • Receive IDR"}</span>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="font-medium">Cryptocurrency</span>
              <select
                value={crypto}
                onChange={(event) => handleCryptoChange(event.target.value as CryptoSymbol)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
              >
                {marketCoins.map((coin) => (
                  <option key={coin.symbol} value={coin.symbol}>
                    {coin.symbol} — {coin.name}
                  </option>
                ))}
              </select>
              {errors.crypto && <small className="text-xs text-red-300">{errors.crypto}</small>}
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="font-medium">Network</span>
              <select
                value={network}
                onChange={(event) => {
                  setNetwork(event.target.value);
                  setErrors((prev) => ({ ...prev, network: "" }));
                }}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
              >
                {selectedNetworkOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.network && <small className="text-xs text-red-300">{errors.network}</small>}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="font-medium">Amount Type</span>
              <div className="flex gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-1">
                {(["crypto", "idr"] as const).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setAmountMode(entry)}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                      amountMode === entry
                        ? "bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950"
                        : "text-slate-300"
                    }`}
                  >
                    {entry === "crypto" ? "Crypto Amount" : "IDR Amount"}
                  </button>
                ))}
              </div>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="font-medium">{amountMode === "crypto" ? "Crypto Amount" : "IDR Amount"}</span>
              <input
                type="number"
                min="0"
                step={amountMode === "crypto" ? "0.0001" : "1000"}
                value={amountValue}
                onChange={(event) => handleAmountChange(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder={amountMode === "crypto" ? "0.0005" : "1000000"}
              />
              {errors.amount && <small className="text-xs text-red-300">{errors.amount}</small>}
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Preview</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {amountMode === "crypto"
                    ? `${formatCryptoAmount(quote.cryptoAmount, crypto)}`
                    : formatIdr(quote.idrAmount)}
                </p>
              </div>
              <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-200">
                Market {selectedCrypto.symbol}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard label="Market Rate" value={formatIdr(quote.marketRate)} />
              <SummaryCard label={amountMode === "crypto" ? "Crypto Amount" : "IDR Amount"} value={amountMode === "crypto" ? formatCryptoAmount(quote.cryptoAmount, crypto) : formatIdr(quote.idrAmount)} />
              <SummaryCard label="Service Fee" value={formatIdr(quote.serviceFee)} />
              <SummaryCard label="Network Fee" value={formatIdr(quote.networkFee)} />
              <SummaryCard label="Total" value={formatIdr(quote.total)} className="sm:col-span-2" highlight />
            </div>
          </div>

          <label className="block space-y-2 text-sm text-slate-300">
            <span className="font-medium">Payment Method</span>
            <select
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(event.target.value as PaymentMethod);
                setErrors((prev) => ({ ...prev, paymentMethod: "" }));
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {errors.paymentMethod && <small className="text-xs text-red-300">{errors.paymentMethod}</small>}
          </label>

          {paymentMethod === "QRIS" && (
            <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">QRIS PAYMENT</p>
              <div className="mt-4 rounded-2xl border border-dashed border-cyan-400/40 bg-slate-950/60 p-5">
                <div className="flex min-h-52 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="w-full max-w-xs rounded-2xl border border-cyan-400/20 bg-white p-4 text-center text-slate-700">
                    <Image
                      src={qrisImagePath}
                      alt="QRIS payment code"
                      width={200}
                      height={200}
                      className="mx-auto max-h-52 rounded-xl object-contain"
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-300">Scan the QRIS below using your banking/e-wallet application.</p>
              </div>
            </div>
          )}

          {paymentMethod === "DANA" && (
            <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">DANA PAYMENT</p>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">DANA</p>
                  <p className="text-base font-medium text-white">{danaPaymentDetails.number}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">A/N {danaPaymentDetails.name}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyDanaNumber}
                  className="w-full rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/60 hover:text-white"
                >
                  Salin Nomor DANA
                </button>

                <p>
                  Transfer sesuai nominal yang ditampilkan di order dan simpan bukti pembayaran untuk verifikasi manual oleh admin.
                </p>
              </div>
            </div>
          )}

          <label className="block space-y-2 text-sm text-slate-300">
            <span className="font-medium">Wallet Address</span>
            <input
              type="text"
              value={walletAddress}
              onChange={(event) => {
                setWalletAddress(event.target.value);
                setErrors((prev) => ({ ...prev, walletAddress: "" }));
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
              placeholder="Enter destination wallet address"
            />
            {errors.walletAddress && <small className="text-xs text-red-300">{errors.walletAddress}</small>}
          </label>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Destination wallet</p>
            <p className="mt-2 font-medium text-white">{walletAddress || "Please provide a wallet address"}</p>
          </div>

          <button
            type="button"
            onClick={handleOpenReview}
            disabled={!canSubmit}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Review Order
          </button>
        </div>
      </div>

      <OrderReviewModal
        isOpen={isReviewOpen}
        order={reviewOrder}
        onBack={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmOrder}
      />

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-cyan-400/20 bg-slate-900 px-6 py-4 text-sm font-medium text-cyan-200">
            Creating demo order...
          </div>
        </div>
      )}
    </>
  );
}

function generateOrderId() {
  const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `CID-${formattedDate}-${randomSuffix}`;
}

function SummaryCard({
  label,
  value,
  highlight = false,
  className = "",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-950/60 p-3 ${highlight ? "border-cyan-400/30 bg-cyan-500/10" : ""} ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-xl font-semibold ${highlight ? "text-white" : "text-slate-200"}`}>{value}</p>
    </div>
  );
}

function formatIdr(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

function formatCryptoAmount(value: number, crypto: CryptoSymbol) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value)} ${crypto}`;
}
