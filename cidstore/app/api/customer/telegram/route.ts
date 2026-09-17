import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/customer-auth";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const telegramId =
      typeof body.telegramId === "string"
        ? body.telegramId.trim()
        : "";

    const telegramUsername =
      typeof body.telegramUsername === "string"
        ? body.telegramUsername.trim().replace(/^@/, "")
        : "";

    if (!telegramId) {
      return NextResponse.json(
        { error: "Telegram ID is required." },
        { status: 400 },
      );
    }

    if (!/^\d+$/.test(telegramId)) {
      return NextResponse.json(
        { error: "Invalid Telegram ID." },
        { status: 400 },
      );
    }

    if (telegramUsername.length > 50) {
      return NextResponse.json(
        { error: "Telegram username is too long." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        telegramId,
        NOT: {
          id: user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This Telegram account is already linked to another account." },
        { status: 409 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        telegramId,
        telegramUsername: telegramUsername || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Telegram account linked successfully.",
      user: {
        id: updatedUser.id,
        telegramId: updatedUser.telegramId,
        telegramUsername: updatedUser.telegramUsername,
      },
    });
  } catch (error) {
    console.error("Failed to link Telegram account", error);

    return NextResponse.json(
      { error: "Unable to link Telegram account." },
      { status: 500 },
    );
  }
}
