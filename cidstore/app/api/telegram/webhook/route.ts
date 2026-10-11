import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/app/lib/prisma";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("TELEGRAM_WEBHOOK_SECRET is not configured.");

      return NextResponse.json(
        { ok: false },
        { status: 500 },
      );
    }

    const receivedSecret =
      request.headers.get("x-telegram-bot-api-secret-token") ?? "";

    if (!receivedSecret || !safeCompare(receivedSecret, webhookSecret)) {
      return NextResponse.json(
        { ok: false },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (!body || typeof body !== "object" || !("message" in body)) {
      return NextResponse.json({ ok: true });
    }

    const message = (body as { message?: unknown }).message;

    if (!message || typeof message !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const telegramMessage = message as {
      from?: { id?: unknown; username?: unknown };
      chat?: { id?: unknown };
      text?: unknown;
    };
    const telegramId = telegramMessage.from?.id;
    const chatId = telegramMessage.chat?.id;
    const text = telegramMessage.text;

    if (typeof text !== "string") {
      return NextResponse.json({ ok: true });
    }

    const startCommand = /^\/start(?:@[A-Za-z0-9_]{5,32})?\s+([A-Za-z0-9_-]{1,64})$/.exec(text);

    if (!startCommand) {
      return NextResponse.json({ ok: true });
    }

    if (
      typeof telegramId !== "number" ||
      !Number.isSafeInteger(telegramId) ||
      telegramId <= 0 ||
      typeof chatId !== "number" ||
      chatId !== telegramId
    ) {
      return NextResponse.json({ ok: true });
    }

    const telegramUsername = telegramMessage.from?.username;

    if (
      telegramUsername !== undefined &&
      (typeof telegramUsername !== "string" ||
        !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegramUsername))
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const token = startCommand[1];

    const tokenHash = hashToken(token);

    const linkToken = await prisma.telegramLinkToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!linkToken) {
      return NextResponse.json({ ok: true });
    }

    if (
      linkToken.usedAt ||
      linkToken.expiresAt.getTime() <= Date.now()
    ) {
      return NextResponse.json({ ok: true });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        telegramId: String(telegramId),
        NOT: {
          id: linkToken.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    const linked = await prisma.$transaction(async (tx) => {
      const claimedToken = await tx.telegramLinkToken.updateMany({
        where: {
          id: linkToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimedToken.count !== 1) {
        return false;
      }

      const updatedUser = await tx.user.updateMany({
        where: {
          id: linkToken.userId,
          telegramId: null,
        },
        data: {
          telegramId: String(telegramId),
          telegramUsername: telegramUsername ?? null,
        },
      });

      return updatedUser.count === 1;
    });

    return NextResponse.json({
      ok: true,
      linked,
    });
  } catch (error) {
    console.error("Telegram webhook error", error);

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    );
  }
}
