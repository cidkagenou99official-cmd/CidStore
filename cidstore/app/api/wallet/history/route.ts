import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/customer-auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const [deposits, withdrawals] = await Promise.all([
      prisma.depositTransaction.findMany({
        where: {
          depositAddress: {
            userId: user.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
        select: {
          id: true,
          asset: true,
          network: true,
          amount: true,
          status: true,
          txHash: true,
          confirmations: true,
          detectedAt: true,
          confirmedAt: true,
          creditedAt: true,
          createdAt: true,
        },
      }),

      prisma.withdrawal.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
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
      }),
    ]);

    const history = [
      ...deposits.map((item) => ({
        id: item.id,
        type: "DEPOSIT" as const,
        asset: item.asset,
        network: item.network,
        amount: item.amount ?? "0",
        fee: "0",
        receiveAmount: item.amount ?? "0",
        address: null,
        status: item.status,
        txHash: item.txHash,
        confirmations: item.confirmations,
        provider: null,
        detectedAt: item.detectedAt,
        confirmedAt: item.confirmedAt,
        creditedAt: item.creditedAt,
        processedAt: null,
        createdAt: item.createdAt,
      })),

      ...withdrawals.map((item) => ({
        id: item.id,
        type: "WITHDRAWAL" as const,
        asset: item.asset,
        network: item.network,
        amount: item.amount.toString(),
        fee: item.fee.toString(),
        receiveAmount: item.receiveAmount.toString(),
        address: item.address,
        status: item.status,
        txHash: item.txHash,
        confirmations: null,
        provider: item.provider,
        detectedAt: null,
        confirmedAt: null,
        creditedAt: null,
        processedAt: item.processedAt,
        createdAt: item.createdAt,
      })),
    ].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return NextResponse.json({
      history: history.slice(0, 100).map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        detectedAt: item.detectedAt?.toISOString() ?? null,
        confirmedAt: item.confirmedAt?.toISOString() ?? null,
        creditedAt: item.creditedAt?.toISOString() ?? null,
        processedAt: item.processedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch wallet history", error);

    return NextResponse.json(
      { error: "Unable to fetch wallet history." },
      { status: 500 },
    );
  }
}
