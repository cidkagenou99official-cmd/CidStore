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

    const balances = await prisma.walletBalance.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { asset: "asc" },
        { network: "asc" },
      ],
      select: {
        id: true,
        asset: true,
        network: true,
        balance: true,
        locked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      balances: balances.map((item) => ({
        ...item,
        balance: item.balance.toString(),
        locked: item.locked.toString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch wallet balances", error);

    return NextResponse.json(
      { error: "Unable to fetch wallet balances." },
      { status: 500 },
    );
  }
}
