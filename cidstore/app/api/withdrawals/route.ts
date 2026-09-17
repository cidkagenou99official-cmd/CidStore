import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/customer-auth";

const WITHDRAWAL_CONFIG = {
  USDT: {
    EVM: 2.5,
    TRON: 1,
  },
  ETH: {
    EVM: 0.002,
  },
  BTC: {
    BITCOIN: 0.0001,
  },
  SOL: {
    SOLANA: 0.005,
  },
  TON: {
    TON: 0.05,
  },
} as const;

function isValidDecimal(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }

  const text = String(value).trim();

  return /^\d+(\.\d{1,18})?$/.test(text) && Number(text) > 0;
}

function decimal(value: string | number) {
  return new Prisma.Decimal(String(value));
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      asset?: unknown;
      network?: unknown;
      amount?: unknown;
      address?: unknown;
    };

    const asset =
      typeof body.asset === "string"
        ? body.asset.trim().toUpperCase()
        : "";

    const network =
      typeof body.network === "string"
        ? body.network.trim().toUpperCase()
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const amount =
      typeof body.amount === "string" || typeof body.amount === "number"
        ? String(body.amount).trim()
        : "";

    if (!asset || !network || !address || !amount) {
      return NextResponse.json(
        { error: "Asset, network, amount, and address are required." },
        { status: 400 },
      );
    }

    if (address.length < 8 || address.length > 256) {
      return NextResponse.json(
        { error: "Invalid destination wallet address." },
        { status: 400 },
      );
    }

    if (!isValidDecimal(amount)) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount." },
        { status: 400 },
      );
    }

    const assetConfig =
      WITHDRAWAL_CONFIG[
        asset as keyof typeof WITHDRAWAL_CONFIG
      ];

    if (!assetConfig) {
      return NextResponse.json(
        { error: "Unsupported withdrawal asset." },
        { status: 400 },
      );
    }

    const fee =
      assetConfig[
        network as keyof typeof assetConfig
      ];

    if (fee === undefined) {
      return NextResponse.json(
        { error: "Unsupported withdrawal network." },
        { status: 400 },
      );
    }

    const amountDecimal = decimal(amount);
    const feeDecimal = decimal(fee);

    if (amountDecimal.lessThanOrEqualTo(feeDecimal)) {
      return NextResponse.json(
        {
          error:
            "Withdrawal amount must be greater than the network fee.",
        },
        { status: 400 },
      );
    }

    const receiveAmount = amountDecimal.minus(feeDecimal);

    const withdrawal = await prisma.$transaction(async (tx) => {
      /*
       * Reserve the withdrawal amount atomically.
       *
       * Available balance = balance - locked.
       *
       * The update only succeeds when the customer has enough
       * available balance. This also protects against two
       * withdrawals being created at the same time.
       */
      const reserved = await tx.walletBalance.updateMany({
        where: {
          userId: user.id,
          asset,
          network,
          balance: {
            gte: amountDecimal,
          },
        },
        data: {
          locked: {
            increment: amountDecimal,
          },
        },
      });

      if (reserved.count !== 1) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const withdrawalRecord = await tx.withdrawal.create({
        data: {
          userId: user.id,
          asset,
          network,
          amount: amountDecimal,
          fee: feeDecimal,
          receiveAmount,
          address,
          status: "PENDING",
        },
        select: {
          id: true,
          asset: true,
          network: true,
          amount: true,
          fee: true,
          receiveAmount: true,
          address: true,
          status: true,
          txHash: true,
          provider: true,
          processedAt: true,
          createdAt: true,
        },
      });

      return withdrawalRecord;
    });

    return NextResponse.json(
      {
        success: true,
        withdrawal: {
          ...withdrawal,
          amount: withdrawal.amount.toString(),
          fee: withdrawal.fee.toString(),
          receiveAmount: withdrawal.receiveAmount.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INSUFFICIENT_BALANCE"
    ) {
      return NextResponse.json(
        {
          error: "Insufficient available balance.",
        },
        { status: 400 },
      );
    }

    console.error("Failed to create withdrawal", error);

    return NextResponse.json(
      { error: "Unable to create withdrawal." },
      { status: 500 },
    );
  }
}
