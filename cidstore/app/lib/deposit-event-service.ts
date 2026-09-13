import type { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { isValidOrderTransition } from "@/app/lib/order-status";
import type { NormalizedWalletWebhookEvent } from "@/app/lib/wallet-provider";

export type DepositEventProcessingResult = {
  created: boolean;
  depositEventId: string;
  depositTransactionId: string | null;
  depositAddressId: string | null;
  orderUpdated: boolean;
  status: string;
  resolved: boolean;
  reason?: string;
};

type DepositTransactionRecord = {
  id: string;
  depositAddressId: string;
  orderId: string | null;
  provider: string | null;
  providerEventId: string | null;
  providerTransactionId: string | null;
  providerAddressReference: string | null;
  txHash: string | null;
  asset: string;
  network: string;
  amount: string | null;
  confirmations: number | null;
  status: string;
  canonicalTxKey: string;
  detectedAt: Date | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const LIFECYCLE_ORDER = ["DETECTED", "PENDING", "CONFIRMING", "CONFIRMED", "CREDITED"] as const;
const SENSITIVE_FIELD_PATTERN =
  /(authorization|cookie|bearer|token|secret|password|private[-_ ]?key|seed(?:[-_ ]?(?:phrase|words))?|api[-_ ]?key|api[-_ ]?secret|credential)/i;

export function normalizeDepositEvent(
  provider: string,
  rawEvent: Record<string, unknown>,
): NormalizedWalletWebhookEvent {
  const providerEventId = String(
    rawEvent.providerEventId ?? rawEvent.eventId ?? `provider_event_${Math.random().toString(36).slice(2, 10)}`,
  );

  const providerTransactionId = rawEvent.providerTransactionId ? String(rawEvent.providerTransactionId) : null;
  const providerAddressReference = rawEvent.providerAddressReference
    ? String(rawEvent.providerAddressReference)
    : rawEvent.address
      ? String(rawEvent.address)
      : rawEvent.externalReference
        ? String(rawEvent.externalReference)
        : rawEvent.depositAddressId
          ? String(rawEvent.depositAddressId)
          : null;

  const rawStatus = String(rawEvent.status ?? "DETECTED").toUpperCase();

  const normalizedStatus = (() => {
    switch (rawStatus) {
      case "PENDING":
        return "PENDING";
      case "CONFIRMING":
        return "CONFIRMING";
      case "CONFIRMED":
        return "CONFIRMED";
      case "FAILED":
        return "FAILED";
      case "REORGED":
        return "REORGED";
      case "CREDITED":
        return "CREDITED";
      case "REJECTED":
        return "REJECTED";
      default:
        return "DETECTED";
    }
  })();

  return {
    provider,
    providerEventId,
    providerTransactionId,
    providerAddressReference,
    txHash: rawEvent.txHash ? String(rawEvent.txHash) : providerTransactionId ? `mock_tx_${providerTransactionId}` : null,
    asset: rawEvent.asset ? String(rawEvent.asset) : null,
    network: rawEvent.network ? String(rawEvent.network) : null,
    amount: rawEvent.amount ? String(rawEvent.amount) : null,
    depositAddressId: rawEvent.depositAddressId ? String(rawEvent.depositAddressId) : null,
    externalReference: rawEvent.externalReference ? String(rawEvent.externalReference) : null,
    status: normalizedStatus,
    rawEvent,
  };
}

function buildCanonicalTxKey(
  event: NormalizedWalletWebhookEvent,
  depositAddress?: { asset: string; network: string } | null,
): string | null {
  const asset = event.asset ?? depositAddress?.asset ?? null;
  const network = event.network ?? depositAddress?.network ?? null;

  if (!event.provider || !asset || !network) {
    return null;
  }

  if (event.providerTransactionId) {
    return `${event.provider}:${network}:${asset}:${event.providerTransactionId}`;
  }

  if (event.txHash) {
    return `${event.provider}:${network}:${asset}:${event.txHash}`;
  }

  return null;
}

function sanitizeRawEvent(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeRawEvent(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
        if (SENSITIVE_FIELD_PATTERN.test(key)) {
          return [key, "[REDACTED]"];
        }

        return [key, sanitizeRawEvent(entryValue)];
      }),
    );
  }

  return value;
}

function normalizeDecimalString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const [wholePart, fractionPart = ""] = trimmed.split(".");
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, "") || "0";
  const normalizedFraction = fractionPart.replace(/0+$/, "");

  return normalizedFraction ? `${normalizedWhole}.${normalizedFraction}` : normalizedWhole;
}

function amountsMatch(expected: string | null | undefined, actual: string | null | undefined): boolean {
  const normalizedExpected = normalizeDecimalString(expected);
  const normalizedActual = normalizeDecimalString(actual);

  if (!normalizedExpected || !normalizedActual || normalizedExpected === "0" || normalizedActual === "0") {
    return false;
  }

  return normalizedExpected === normalizedActual;
}

function deriveSafeTransactionStatus(currentStatus: string, incomingStatus: string): string {
  if (currentStatus === "FAILED" || currentStatus === "REORGED" || currentStatus === "CREDITED") {
    return currentStatus;
  }

  const currentIndex = LIFECYCLE_ORDER.indexOf(currentStatus as (typeof LIFECYCLE_ORDER)[number]);
  const incomingIndex = LIFECYCLE_ORDER.indexOf(incomingStatus as (typeof LIFECYCLE_ORDER)[number]);

  if (currentIndex === -1) {
    return incomingStatus;
  }

  if (incomingIndex === -1) {
    return currentStatus;
  }

  return incomingIndex > currentIndex ? incomingStatus : currentStatus;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function resolveDepositAddress(event: NormalizedWalletWebhookEvent, tx: Prisma.TransactionClient) {
  if (event.depositAddressId) {
    const byId = await tx.depositAddress.findUnique({
      where: { id: event.depositAddressId },
    });

    if (byId) {
      return byId;
    }
  }

  if (event.providerAddressReference) {
    const byProviderReference = await tx.depositAddress.findFirst({
      where: {
        address: event.providerAddressReference,
      },
    });

    if (byProviderReference) {
      return byProviderReference;
    }
  }

  return null;
}

async function findMatchingTransactions(
  tx: Prisma.TransactionClient,
  normalizedEvent: NormalizedWalletWebhookEvent,
  depositAddress?: { id: string; asset: string; network: string } | null,
): Promise<{
  transaction: DepositTransactionRecord | null;
  conflict: boolean;
  reason?: string;
}> {
  const provider = normalizedEvent.provider;
  const asset = normalizedEvent.asset ?? depositAddress?.asset ?? null;
  const network = normalizedEvent.network ?? depositAddress?.network ?? null;

  if (!provider || !asset || !network) {
    return {
      transaction: null,
      conflict: false,
      reason: "UNRESOLVED_TRANSACTION_CONTEXT",
    };
  }

  const matches = new Map<string, DepositTransactionRecord>();

  const addMatch = (row: DepositTransactionRecord | null) => {
    if (!row) {
      return;
    }

    if (!matches.has(row.id)) {
      matches.set(row.id, row);
    }
  };

  if (normalizedEvent.providerTransactionId) {
    const rows = await tx.depositTransaction.findMany({
      where: {
        provider,
        asset,
        network,
        providerTransactionId: normalizedEvent.providerTransactionId,
      },
      orderBy: { createdAt: "asc" },
    });

    rows.forEach(addMatch);
  }

  if (normalizedEvent.txHash) {
    const rows = await tx.depositTransaction.findMany({
      where: {
        provider,
        asset,
        network,
        txHash: normalizedEvent.txHash,
      },
      orderBy: { createdAt: "asc" },
    });

    rows.forEach(addMatch);
  }

  const matchedRows = Array.from(matches.values());

  if (matchedRows.length > 1) {
    return {
      transaction: null,
      conflict: true,
      reason: "DATA_INTEGRITY_CONFLICT",
    };
  }

  if (matchedRows.length === 1) {
    const existingTransaction = matchedRows[0];

    if (depositAddress && existingTransaction.depositAddressId !== depositAddress.id) {
      return {
        transaction: null,
        conflict: true,
        reason: "DEPOSIT_ADDRESS_CONFLICT",
      };
    }

    return {
      transaction: existingTransaction,
      conflict: false,
    };
  }

  return {
    transaction: null,
    conflict: false,
  };
}

async function createOrUpdateCanonicalTransaction(
  tx: Prisma.TransactionClient,
  normalizedEvent: NormalizedWalletWebhookEvent,
  depositAddress?: { id: string; userId: string; asset: string; network: string } | null,
): Promise<{
  transaction: DepositTransactionRecord | null;
  conflict: boolean;
  reason?: string;
}> {
  const existingResult = await findMatchingTransactions(tx, normalizedEvent, depositAddress ?? null);

  if (existingResult.conflict) {
    return existingResult;
  }

  if (existingResult.transaction) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (!existingResult.transaction.provider && normalizedEvent.provider) {
      updateData.provider = normalizedEvent.provider;
    }

    if (!existingResult.transaction.providerEventId && normalizedEvent.providerEventId) {
      updateData.providerEventId = normalizedEvent.providerEventId;
    }

    if (!existingResult.transaction.providerTransactionId && normalizedEvent.providerTransactionId) {
      updateData.providerTransactionId = normalizedEvent.providerTransactionId;
    }

    if (!existingResult.transaction.txHash && normalizedEvent.txHash) {
      updateData.txHash = normalizedEvent.txHash;
    }

    if (!existingResult.transaction.amount && normalizedEvent.amount) {
      updateData.amount = normalizedEvent.amount;
    }

    if (!existingResult.transaction.asset && normalizedEvent.asset) {
      updateData.asset = normalizedEvent.asset;
    }

    if (!existingResult.transaction.network && normalizedEvent.network) {
      updateData.network = normalizedEvent.network;
    }

    if (depositAddress && existingResult.transaction.depositAddressId !== depositAddress.id) {
      return {
        transaction: null,
        conflict: true,
        reason: "DEPOSIT_ADDRESS_CONFLICT",
      };
    }

    const nextStatus = deriveSafeTransactionStatus(existingResult.transaction.status, normalizedEvent.status);

    if (nextStatus !== existingResult.transaction.status) {
      updateData.status = nextStatus;
    }

    if (!existingResult.transaction.detectedAt) {
      updateData.detectedAt = new Date();
    }

    if (
      (nextStatus === "CONFIRMED" || nextStatus === "CREDITED") &&
      !existingResult.transaction.confirmedAt
    ) {
      updateData.confirmedAt = new Date();
    }

    if (Object.keys(updateData).length > 1) {
      const updatedTransaction = await tx.depositTransaction.update({
        where: { id: existingResult.transaction.id },
        data: updateData,
      });

      return {
        transaction: updatedTransaction as DepositTransactionRecord,
        conflict: false,
      };
    }

    return {
      transaction: existingResult.transaction,
      conflict: false,
    };
  }

  const canonicalTxKey = buildCanonicalTxKey(normalizedEvent, depositAddress);

  if (!canonicalTxKey) {
    return {
      transaction: null,
      conflict: false,
      reason: "UNRESOLVED_TRANSACTION_CONTEXT",
    };
  }

  if (!depositAddress) {
    return {
      transaction: null,
      conflict: false,
      reason: "UNRESOLVED_DEPOSIT_ADDRESS",
    };
  }

  try {
    const createdTransaction = await tx.depositTransaction.create({
      data: {
        depositAddressId: depositAddress.id,
        provider: normalizedEvent.provider,
        providerEventId: normalizedEvent.providerEventId,
        providerTransactionId: normalizedEvent.providerTransactionId ?? null,
        providerAddressReference: normalizedEvent.providerAddressReference ?? null,
        txHash: normalizedEvent.txHash ?? null,
        asset: normalizedEvent.asset ?? depositAddress.asset,
        network: normalizedEvent.network ?? depositAddress.network,
        amount: normalizedEvent.amount ?? null,
        confirmations:
          normalizedEvent.status === "CONFIRMED" || normalizedEvent.status === "CREDITED" ? 1 : 0,
        status: normalizedEvent.status,
        canonicalTxKey,
        detectedAt: new Date(),
        confirmedAt:
          normalizedEvent.status === "CONFIRMED" || normalizedEvent.status === "CREDITED"
            ? new Date()
            : null,
      },
    });

    return {
      transaction: createdTransaction as DepositTransactionRecord,
      conflict: false,
    };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const replayResult = await findMatchingTransactions(tx, normalizedEvent, depositAddress);

    if (replayResult.conflict) {
      return replayResult;
    }

    if (replayResult.transaction) {
      return replayResult;
    }

    throw error;
  }
}

async function applySellOrderSideEffect(
  tx: Prisma.TransactionClient,
  depositAddress: { id: string; userId: string; asset: string; network: string },
  transaction: DepositTransactionRecord,
  normalizedEvent: NormalizedWalletWebhookEvent,
) {
  if (transaction.status !== "CONFIRMED" && transaction.status !== "CREDITED") {
    return {
      orderUpdated: false,
      reason: undefined,
    };
  }

  if (transaction.orderId) {
    const linkedOrder = await tx.order.findUnique({
      where: { id: transaction.orderId },
    });

    if (!linkedOrder) {
      return {
        orderUpdated: false,
        reason: "TRANSACTION_ORDER_LINK_BROKEN",
      };
    }

    if (linkedOrder.depositAddressId !== depositAddress.id) {
      return {
        orderUpdated: false,
        reason: "ORDER_DEPOSIT_ADDRESS_MISMATCH",
      };
    }

    return {
      orderUpdated: false,
      reason: "ORDER_ALREADY_PROCESSING",
    };
  }

  const eligibleOrders = await tx.order.findMany({
    where: {
      type: "SELL",
      depositAddressId: depositAddress.id,
      status: { in: ["WAITING_CRYPTO", "PROCESSING"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (eligibleOrders.length === 0) {
    return {
      orderUpdated: false,
      reason: undefined,
    };
  }

  if (eligibleOrders.length > 1) {
    return {
      orderUpdated: false,
      reason: "AMBIGUOUS_SELL_ORDER",
    };
  }

  const relatedOrder = eligibleOrders[0];

  if (relatedOrder.depositAddressId !== depositAddress.id) {
    return {
      orderUpdated: false,
      reason: "DEPOSIT_ADDRESS_MISMATCH",
    };
  }

  if (relatedOrder.userId && relatedOrder.userId !== depositAddress.userId) {
    return {
      orderUpdated: false,
      reason: "UNAUTHORIZED_ORDER_OWNERSHIP",
    };
  }

  if (relatedOrder.status === "PROCESSING") {
    return {
      orderUpdated: false,
      reason: "ORDER_ALREADY_PROCESSING",
    };
  }

  if (relatedOrder.status !== "WAITING_CRYPTO") {
    return {
      orderUpdated: false,
      reason: "ORDER_NOT_ELIGIBLE",
    };
  }

  if (relatedOrder.crypto !== (normalizedEvent.asset ?? transaction.asset)) {
    return {
      orderUpdated: false,
      reason: "ASSET_MISMATCH",
    };
  }

  if (relatedOrder.network !== (normalizedEvent.network ?? transaction.network)) {
    return {
      orderUpdated: false,
      reason: "NETWORK_MISMATCH",
    };
  }

  if (!amountsMatch(relatedOrder.cryptoAmount, transaction.amount ?? normalizedEvent.amount ?? null)) {
    return {
      orderUpdated: false,
      reason: "AMOUNT_MISMATCH",
    };
  }

  if (!isValidOrderTransition(relatedOrder.type, relatedOrder.status, "PROCESSING")) {
    return {
      orderUpdated: false,
      reason: "ORDER_STATUS_NOT_ELIGIBLE",
    };
  }

  await tx.depositTransaction.update({
    where: { id: transaction.id },
    data: {
      orderId: relatedOrder.id,
      updatedAt: new Date(),
    },
  });

  await tx.order.update({
    where: { id: relatedOrder.id },
    data: {
      status: "PROCESSING",
      paymentStatus: relatedOrder.paymentStatus ?? "AWAITING_CRYPTO",
      updatedAt: new Date(),
    },
  });

  return {
    orderUpdated: true,
    reason: undefined,
  };
}

function buildExistingEventResult(existingEvent: {
  id: string;
  status: string;
  depositTransactionId: string | null;
  depositTransaction?: {
    depositAddressId: string | null;
  } | null;
}): DepositEventProcessingResult {
  return {
    created: false,
    depositEventId: existingEvent.id,
    depositTransactionId: existingEvent.depositTransactionId,
    depositAddressId: existingEvent.depositTransaction?.depositAddressId ?? null,
    orderUpdated: false,
    status: existingEvent.status,
    resolved: Boolean(existingEvent.depositTransactionId),
    reason: existingEvent.depositTransactionId ? undefined : "EVENT_UNRESOLVED",
  };
}

export async function processDepositEvent(
  event: NormalizedWalletWebhookEvent,
): Promise<DepositEventProcessingResult> {
  if (!event.providerEventId) {
    throw new Error("providerEventId is required for deposit event processing.");
  }

  if (!event.provider) {
    throw new Error("provider is required for deposit event processing.");
  }

  const normalizedEvent = normalizeDepositEvent(event.provider, {
    ...event.rawEvent,
    providerEventId: event.providerEventId,
    providerTransactionId: event.providerTransactionId,
    providerAddressReference: event.providerAddressReference,
    txHash: event.txHash,
    asset: event.asset,
    network: event.network,
    amount: event.amount,
    depositAddressId: event.depositAddressId,
    externalReference: event.externalReference,
    status: event.status,
  });

  return prisma.$transaction(async (tx) => {
    const existingEvent = await tx.depositEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: normalizedEvent.provider,
          providerEventId: normalizedEvent.providerEventId,
        },
      },
      include: {
        depositTransaction: true,
      },
    });

    if (existingEvent) {
      return buildExistingEventResult(existingEvent);
    }

    const depositAddress = await resolveDepositAddress(normalizedEvent, tx);
    const transactionResolution = await createOrUpdateCanonicalTransaction(
      tx,
      normalizedEvent,
      depositAddress
        ? {
            id: depositAddress.id,
            userId: depositAddress.userId,
            asset: depositAddress.asset,
            network: depositAddress.network,
          }
        : null,
    );

    const depositTransaction = transactionResolution.transaction;
    const resolvedDepositAddressId =
      depositAddress?.id ?? depositTransaction?.depositAddressId ?? null;

    let eventResult: DepositEventProcessingResult | null = null;

    if (transactionResolution.conflict) {
      eventResult = {
        created: true,
        depositEventId: "",
        depositTransactionId: null,
        depositAddressId: resolvedDepositAddressId,
        orderUpdated: false,
        status: normalizedEvent.status,
        resolved: false,
        reason: transactionResolution.reason,
      };
    }

    let depositEvent;

    try {
      depositEvent = await tx.depositEvent.create({
        data: {
          provider: normalizedEvent.provider,
          providerEventId: normalizedEvent.providerEventId,
          providerTransactionId: normalizedEvent.providerTransactionId ?? null,
          txHash: normalizedEvent.txHash ?? null,
          status: normalizedEvent.status,
          processedAt: new Date(),
          rawEvent: sanitizeRawEvent(normalizedEvent.rawEvent) as Prisma.InputJsonValue,
          depositTransactionId: depositTransaction?.id ?? null,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const replayedEvent = await tx.depositEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: normalizedEvent.provider,
            providerEventId: normalizedEvent.providerEventId,
          },
        },
        include: {
          depositTransaction: true,
        },
      });

      if (!replayedEvent) {
        throw error;
      }

      return buildExistingEventResult(replayedEvent);
    }

    if (eventResult) {
      return {
        ...eventResult,
        depositEventId: depositEvent.id,
      };
    }

    let orderUpdated = false;
    let resolutionReason: string | undefined;

    if (depositTransaction && resolvedDepositAddressId) {
      const sideEffect = await applySellOrderSideEffect(
        tx,
        {
          id: resolvedDepositAddressId,
          userId: depositAddress?.userId ?? "",
          asset: depositTransaction.asset,
          network: depositTransaction.network,
        },
        depositTransaction,
        normalizedEvent,
      );

      orderUpdated = sideEffect.orderUpdated;
      resolutionReason = sideEffect.reason;
    }

    return {
      created: true,
      depositEventId: depositEvent.id,
      depositTransactionId: depositTransaction?.id ?? null,
      depositAddressId: resolvedDepositAddressId,
      orderUpdated,
      status: depositEvent.status,
      resolved: Boolean(depositTransaction),
      reason: resolutionReason,
    } satisfies DepositEventProcessingResult;
  });
}
