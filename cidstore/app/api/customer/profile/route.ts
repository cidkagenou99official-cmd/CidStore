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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        telegramUsername: user.telegramUsername,
        language: user.language,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to load customer profile", error);

    return NextResponse.json(
      { error: "Unable to load profile." },
      { status: 500 },
    );
  }
}

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

    const name =
      typeof body.name === "string" ? body.name.trim() : undefined;

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : undefined;

    const telegramUsername =
      typeof body.telegramUsername === "string"
        ? body.telegramUsername.trim().replace(/^@/, "")
        : undefined;

    const language =
      body.language === "id" || body.language === "en"
        ? body.language
        : undefined;

    if (name !== undefined && name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long." },
        { status: 400 },
      );
    }

    if (phone !== undefined && phone.length > 30) {
      return NextResponse.json(
        { error: "Phone number is too long." },
        { status: 400 },
      );
    }

    if (telegramUsername !== undefined && telegramUsername.length > 50) {
      return NextResponse.json(
        { error: "Telegram username is too long." },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(telegramUsername !== undefined
          ? { telegramUsername: telegramUsername || null }
          : {}),
        ...(language !== undefined ? { language } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        telegramUsername: updatedUser.telegramUsername,
        language: updatedUser.language,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to update customer profile", error);

    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 500 },
    );
  }
}
