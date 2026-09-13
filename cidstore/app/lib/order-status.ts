import type { OrderStatus, OrderType, PaymentStatus } from "@/app/types";

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderType,
  Partial<Record<OrderStatus, OrderStatus[]>>
> = {
  BUY: {
    PENDING: ["WAITING_VERIFICATION"],
    WAITING_VERIFICATION: ["PAYMENT_VERIFIED", "REJECTED", "CANCELLED"],
    PAYMENT_VERIFIED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["COMPLETED", "CANCELLED"],
  },
  SELL: {
    WAITING_CRYPTO: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["COMPLETED", "CANCELLED"],
  },
};

export function getAllowedNextStatuses(orderType: OrderType, currentStatus: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[orderType]?.[currentStatus] ?? [];
}

export function isValidOrderTransition(orderType: OrderType, currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
  return getAllowedNextStatuses(orderType, currentStatus).includes(nextStatus);
}

export function getNextPaymentStatus(
  orderType: OrderType,
  nextStatus: OrderStatus,
  existingPaymentStatus?: PaymentStatus | null,
): PaymentStatus {
  switch (nextStatus) {
    case "WAITING_VERIFICATION":
      return "WAITING_VERIFICATION";
    case "PAYMENT_VERIFIED":
      return "PAYMENT_VERIFIED";
    case "REJECTED":
      return "REJECTED";
    case "PROCESSING":
      return existingPaymentStatus ?? "PAYMENT_VERIFIED";
    case "COMPLETED":
      return existingPaymentStatus ?? "PAYMENT_VERIFIED";
    case "CANCELLED":
      return existingPaymentStatus ?? (orderType === "BUY" ? "AWAITING_PAYMENT" : "AWAITING_CRYPTO");
    default:
      return existingPaymentStatus ?? (orderType === "BUY" ? "AWAITING_PAYMENT" : "AWAITING_CRYPTO");
  }
}
