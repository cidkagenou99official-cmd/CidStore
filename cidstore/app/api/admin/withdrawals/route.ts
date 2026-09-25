import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/admin-auth";
import { prisma } from "@/app/lib/prisma";

const ALLOWED_STATUSES = [
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return (
    typeof value === "string" &&
    ALLOWED_STATUSES.includes(value as AllowedStatus)
  );
}

function serializeWithdrawal(withdrawal: {
  id: string;
  userId: string;
  asset: string;
  network: string;
  amount: Prisma.Decimal;
  fee: Prisma.Decimal;
  receiveAmount: Prisma.Decimal;
  address: string;
  status: string;
  txHash: string | null;
  provider: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
}) {
  return {
    ...withdrawal,
    amount: withdrawal.amount.toString(),
    fee: withdrawal.fee.toString(),
    receiveAmount: withdrawal.receiveAmount.toString(),
  };
}

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
} as const;

const WITHDRAWAL_SELECT = {
  id: true,
  userId: true,
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
  updatedAt: true,
  user: {
    select: USER_SELECT,
  },
} as const;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = verifyAdminSession(
      cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    );

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: WITHDRAWAL_SELECT,
    });

    return NextResponse.json({
      withdrawals: withdrawals.map(serializeWithdrawal),
    });
  } catch (error) {
    console.error("Failed to list admin withdrawals", error);

    return NextResponse.json(
      { error: "Unable to load withdrawals." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = verifyAdminSession(
      cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    );

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      withdrawalId?: unknown;
      status?: unknown;
    };

    const withdrawalId =
      typeof body.withdrawalId === "string"
        ? body.withdrawalId.trim()
        : "";

    if (!withdrawalId) {
      return NextResponse.json(
        { error: "Withdrawal ID is required." },
        { status: 400 },
      );
    }

    if (!isAllowedStatus(body.status)) {
      return NextResponse.json(
        { error: "Invalid withdrawal status." },
        { status: 400 },
      );
    }

    const nextStatus = body.status;

    const updated = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: {
          id: withdrawalId,
        },
      });

      if (!withdrawal) {
        throw new Error("WITHDRAWAL_NOT_FOUND");
      }

      if (
        withdrawal.status === "COMPLETED" ||
        withdrawal.status === "FAILED" ||
        withdrawal.status === "CANCELLED"
      ) {
        throw new Error("WITHDRAWAL_ALREADY_TERMINAL");
      }

      if (
        withdrawal.status !== "PENDING" &&
        withdrawal.status !== "PROCESSING"
      ) {
        throw new Error("INVALID_CURRENT_STATUS");
      }

      if (
        nextStatus === "PROCESSING" &&
        withdrawal.status !== "PENDING"
      ) {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      if (
        nextStatus === "COMPLETED" &&
        withdrawal.status !== "PENDING" &&
        withdrawal.status !== "PROCESSING"
      ) {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      if (
        (nextStatus === "FAILED" || nextStatus === "CANCELLED") &&
        withdrawal.status !== "PENDING" &&
        withdrawal.status !== "PROCESSING"
      ) {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      if (nextStatus === "PROCESSING") {
        return tx.withdrawal.update({
          where: {
            id: withdrawal.id,
          },
          data: {
            status: "PROCESSING",
          },
          select: WITHDRAWAL_SELECT,
        });
      }

      if (nextStatus === "COMPLETED") {
        const updatedBalance = await tx.$executeRaw`
          UPDATE "WalletBalance"
          SET
            "balance" = "balance" - ${withdrawal.amount},
            "locked" = "locked" - ${withdrawal.amount},
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE
            "userId" = ${withdrawal.userId}
            AND "asset" = ${withdrawal.asset}
            AND "network" = ${withdrawal.network}
            AND "locked" >= ${withdrawal.amount}
            AND "balance" >= ${withdrawal.amount}
        `;

        if (updatedBalance !== 1) {
          throw new Error("BALANCE_SETTLEMENT_FAILED");
        }

        return tx.withdrawal.update({
          where: {
            id: withdrawal.id,
          },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
          select: WITHDRAWAL_SELECT,
        });
      }

      const released = await tx.$executeRaw`
        UPDATE "WalletBalance"
        SET
          "locked" = "locked" - ${withdrawal.amount},
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE
          "userId" = ${withdrawal.userId}
          AND "asset" = ${withdrawal.asset}
          AND "network" = ${withdrawal.network}
          AND "locked" >= ${withdrawal.amount}
      `;

      if (released !== 1) {
        const balance = await tx.walletBalance.findUnique({
          where: {
            userId_asset_network: {
              userId: withdrawal.userId,
              asset: withdrawal.asset,
              network: withdrawal.network,
            },
          },
          select: {
            locked: true,
          },
        });

        if (balance && !balance.locked.isZero()) {
          throw new Error("BALANCE_RELEASE_FAILED");
        }
      }

      return tx.withdrawal.update({
        where: {
          id: withdrawal.id,
        },
        data: {
          status: nextStatus,
          processedAt: new Date(),
        },
        select: WITHDRAWAL_SELECT,
      });
    });

    return NextResponse.json({
      success: true,
      withdrawal: serializeWithdrawal(updated),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "WITHDRAWAL_NOT_FOUND") {
        return NextResponse.json(
          { error: "Withdrawal not found." },
          { status: 404 },
        );
      }

      if (error.message === "WITHDRAWAL_ALREADY_TERMINAL") {
        return NextResponse.json(
          { error: "Withdrawal is already in a final status." },
          { status: 400 },
        );
      }

      if (
        error.message === "INVALID_CURRENT_STATUS" ||
        error.message === "INVALID_STATUS_TRANSITION"
      ) {
        return NextResponse.json(
          { error: "Invalid withdrawal status transition." },
          { status: 400 },
        );
      }

      if (
        error.message === "BALANCE_SETTLEMENT_FAILED" ||
        error.message === "BALANCE_RELEASE_FAILED"
      ) {
        return NextResponse.json(
          { error: "Unable to update wallet balance safely." },
          { status: 409 },
        );
      }
    }

    console.error("Failed to update admin withdrawal", error);

    return NextResponse.json(
      { error: "Unable to update withdrawal." },
      { status: 500 },
    );
  }
}
