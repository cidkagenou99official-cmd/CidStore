import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/customer-auth";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        telegramId: null,
        telegramUsername: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Telegram berhasil diputuskan.",
    });
  } catch (error) {
    console.error("Failed to unlink Telegram", error);

    return NextResponse.json(
      { error: "Unable to disconnect Telegram." },
      { status: 500 },
    );
  }
}
