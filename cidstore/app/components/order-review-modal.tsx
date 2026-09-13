import type { Order } from "@/app/types";

interface OrderReviewModalProps {
  isOpen: boolean;
  order: Order | null;
  onBack: () => void;
  onConfirm: () => void;
}

export function OrderReviewModal({ isOpen, order, onBack, onConfirm }: OrderReviewModalProps) {
  if (!isOpen || !order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/30 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Review order</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Confirm your demo exchange</h2>
          </div>
          <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Demo
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard label="Order Type" value={order.type} />
          <InfoCard label="Crypto" value={`${order.crypto} • ${order.cryptoName}`} />
          <InfoCard label="Network" value={order.network} />
          <InfoCard label="Crypto Amount" value={order.cryptoAmount} />
          <InfoCard label="IDR Amount" value={order.idrAmount} />
          <InfoCard label="Market Rate" value={order.marketRate} />
          <InfoCard label="Service Fee" value={order.serviceFee} />
          <InfoCard label="Network Fee" value={order.networkFee} />
          <InfoCard label="Payment Method" value={order.paymentMethod} />
          <InfoCard label="Wallet Address" value={order.walletAddress} className="md:col-span-2" />
          <InfoCard label="Total" value={order.total} className="md:col-span-2" />
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/10 bg-slate-950/60 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60 hover:text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-950/60 p-4 ${className}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-medium text-white">{value}</p>
    </div>
  );
}
