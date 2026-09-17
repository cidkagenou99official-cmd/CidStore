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

    const body = (await request.json()) as {
      message?: {
        from?: {
          id?: number;
          username?: string;
        };
        chat?: {
          id?: number;
        };
        text?: string;
      };
    };

    const message = body.message;
    const telegramId = message?.from?.id;
    const telegramUsername = message?.from?.username ?? "";
    const text = message?.text ?? "";

    if (!telegramId || !text.startsWith("/start ")) {
      return NextResponse.json({ ok: true });
    }

    const token = text.slice("/start ".length).trim();

    if (!token || token.length > 200) {
      return NextResponse.json({ ok: true });
    }

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

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: linkToken.userId,
        },
        data: {
          telegramId: String(telegramId),
          telegramUsername: telegramUsername || null,
        },
      });

      await tx.telegramLinkToken.update({
        where: {
          id: linkToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      ok: true,
      linked: true,
    });
  } catch (error) {
    console.error("Telegram webhook error", error);

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    );
  }
}
