import { prisma } from "@/app/lib/prisma";
import { getNextPaymentStatus, isValidOrderTransition } from "@/app/lib/order-status";
import type { Order as OrderRecord, OrderStatus, PaymentStatus, PaymentMethod, OrderType } from "@/app/types";

export type CreateOrderInput = {
  id: string;
  type: OrderType;
  crypto: OrderRecord["crypto"];
  cryptoName: string;
  network: string;
  cryptoAmount: string;
  fiatAmount: string;
  fee: string;
  networkFee: string;
  serviceFee: string;
  paymentMethod: PaymentMethod;
  walletAddress: string;
  total: string;
  paymentProof?: string | null;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerContact?: string | null;
  userId?: string | null;
  depositAddressId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function createOrder(input: CreateOrderInput) {
  const now = new Date();

  const created = await prisma.order.create({
    data: {
      id: input.id,
      type: input.type,
      crypto: input.crypto,
      cryptoName: input.cryptoName,
      network: input.network,
      cryptoAmount: input.cryptoAmount,
      fiatAmount: input.fiatAmount,
      fee: input.fee,
      networkFee: input.networkFee,
      serviceFee: input.serviceFee,
      paymentMethod: input.paymentMethod,
      walletAddress: input.walletAddress,
      total: input.total,
      paymentProof: input.paymentProof ?? null,
      depositAddressId: input.depositAddressId ?? null,
      status: input.status ?? "PENDING",
      paymentStatus: input.paymentStatus ?? (input.type === "BUY" ? "AWAITING_PAYMENT" : "AWAITING_CRYPTO"),
      customerContact: input.customerContact ?? input.walletAddress ?? null,
      userId: input.userId ?? null,
      createdAt: input.createdAt ? new Date(input.createdAt) : now,
      updatedAt: input.updatedAt ? new Date(input.updatedAt) : now,
      paymentSubmittedAt: input.paymentProof ? now : null,
    },
  });

  return mapOrderFromDb(created);
}

export async function listOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapOrderFromDb);
}

export async function listOrdersByUser(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapOrderFromDb);
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
  });

  return order ? mapOrderFromDb(order) : null;
}

export async function updateOrderStatus(
  id: string,
  nextStatus: OrderStatus,
  update: Partial<Pick<OrderRecord, "paymentStatus" | "paymentProof" | "verifiedAt" | "adminNote" | "updatedAt" | "paymentSubmittedAt">> = {},
) {
  const existing = await prisma.order.findUnique({ where: { id } });

  if (!existing) {
    return null;
  }

  if (!isValidOrderTransition(existing.type, existing.status, nextStatus)) {
    throw new Error(
      `Invalid order status transition from ${existing.status} to ${nextStatus} for ${existing.type} orders.`,
    );
  }

  const paymentStatus =
    update.paymentStatus ??
    getNextPaymentStatus(existing.type, nextStatus, existing.paymentStatus ?? undefined);

  const now = new Date();

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: nextStatus,
      paymentStatus,
      paymentProof: update.paymentProof ?? existing.paymentProof,
      paymentSubmittedAt: update.paymentSubmittedAt ? new Date(update.paymentSubmittedAt) : existing.paymentSubmittedAt,
      verifiedAt: update.verifiedAt ?? (nextStatus === "PAYMENT_VERIFIED" ? now : existing.verifiedAt),
      adminNote: update.adminNote ?? existing.adminNote,
      updatedAt: update.updatedAt ? new Date(update.updatedAt) : now,
    },
  });

  return mapOrderFromDb(updated);
}

function mapOrderFromDb(order: {
  id: string;
  type: OrderType;
  crypto: string;
  cryptoName: string;
  network: string;
  cryptoAmount: string;
  fiatAmount: string;
  fee: string;
  networkFee: string;
  serviceFee: string;
  paymentMethod: PaymentMethod;
  walletAddress: string | null;
  total: string;
  paymentProof: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
  customerContact: string | null;
  userId: string | null;
  depositAddressId: string | null;
  createdAt: Date;
  updatedAt: Date;
  paymentSubmittedAt: Date | null;
  verifiedAt: Date | null;
  adminNote: string | null;
}): OrderRecord {
  return {
    id: order.id,
    type: order.type,
    crypto: order.crypto as OrderRecord["crypto"],
    cryptoName: order.cryptoName,
    network: order.network,
    cryptoAmount: order.cryptoAmount,
    idrAmount: order.fiatAmount,
    marketRate: order.fee,
    serviceFee: order.serviceFee,
    networkFee: order.networkFee,
    paymentMethod: order.paymentMethod,
    walletAddress: order.walletAddress ?? "",
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    paymentStatus: order.paymentStatus ?? undefined,
    paymentProof: order.paymentProof ?? null,
    paymentSubmittedAt: order.paymentSubmittedAt?.toISOString() ?? null,
    verifiedAt: order.verifiedAt?.toISOString() ?? null,
    adminNote: order.adminNote ?? null,
    updatedAt: order.updatedAt.toISOString(),
    customerContact: order.customerContact ?? null,
    userId: order.userId ?? null,
    depositAddressId: order.depositAddressId ?? null,
  };
}
