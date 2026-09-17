import { Prisma } from "@prisma/client";

export async function creditWalletBalance(
  tx: Prisma.TransactionClient,
  params: {
    depositTransactionId: string;
    userId: string;
    asset: string;
    network: string;
    amount: string | number | Prisma.Decimal;
  },
) {
  const amount = new Prisma.Decimal(String(params.amount));

  if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
    throw new Error("INVALID_CREDIT_AMOUNT");
  }

  // Claim credit secara atomik.
  // Hanya transaksi yang belum pernah credited yang boleh
  // menambah saldo.
  const claimed = await tx.depositTransaction.updateMany({
    where: {
      id: params.depositTransactionId,
      status: "CREDITED",
      creditedAt: null,
    },
    data: {
      creditedAt: new Date(),
    },
  });

  // Event/replay kedua akan berhenti di sini.
  if (claimed.count !== 1) {
    return {
      credited: false,
      reason: "ALREADY_CREDITED",
    } as const;
  }

  const balance = await tx.walletBalance.upsert({
    where: {
      userId_asset_network: {
        userId: params.userId,
        asset: params.asset,
        network: params.network,
      },
    },
    create: {
      userId: params.userId,
      asset: params.asset,
      network: params.network,
      balance: amount,
      locked: new Prisma.Decimal(0),
    },
    update: {
      balance: {
        increment: amount,
      },
    },
  });

  return {
    credited: true,
    reason: undefined,
    balance,
  } as const;
}
