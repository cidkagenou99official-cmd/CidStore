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

async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is not configured.");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );
    const result = (await response.json().catch(() => null)) as
      | { ok?: unknown }
      | null;

    if (!response.ok || result?.ok !== true) {
      console.error("Telegram sendMessage failed.", response.status);
      return false;
    }

    return true;
  } catch {
    console.error("Telegram sendMessage request failed.");
    return false;
  }
}

async function reply(chatId: number, text: string) {
  await sendTelegramMessage(chatId, text);
  return NextResponse.json({ ok: true });
}

const START_HELP_MESSAGE =
  "Selamat datang di CID Store! Bot ini membantu menghubungkan akun Telegram dengan akun CID Store. Untuk menghubungkan akun, buka halaman Akun di website CID Store lalu pilih Bind Telegram.";
const BOT_HELP_MESSAGE =
  "Bot CID Store aktif. Untuk menghubungkan akun, buka halaman Akun di website CID Store lalu pilih Bind Telegram dan ikuti petunjuk dari bot.";

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
      chat?: { id?: unknown; type?: unknown };
      text?: unknown;
    };
    const telegramId = telegramMessage.from?.id;
    const chatId = telegramMessage.chat?.id;
    const text = telegramMessage.text;

    if (
      telegramMessage.chat?.type !== "private" ||
      typeof chatId !== "number" ||
      !Number.isSafeInteger(chatId) ||
      chatId <= 0
    ) {
      return NextResponse.json({ ok: true });
    }

    if (typeof text !== "string") {
      return NextResponse.json({ ok: true });
    }

    const normalizedText = text.trim();
    const isStartCommand = /^\/start(?:@[A-Za-z0-9_]{5,32})?(?:\s|$)/.test(
      normalizedText,
    );

    if (!isStartCommand) {
      return reply(chatId, BOT_HELP_MESSAGE);
    }

    const startCommand = /^\/start(?:@[A-Za-z0-9_]{5,32})?(?:\s+(\S+))?$/.exec(
      normalizedText,
    );

    if (!startCommand) {
      return reply(
        chatId,
        "Format perintah tidak valid. Buat token binding baru dari halaman Akun CID Store, lalu kirim /start TOKEN ke bot.",
      );
    }

    const token = startCommand[1];

    if (!token) {
      return reply(chatId, START_HELP_MESSAGE);
    }

    if (!/^[A-Za-z0-9_-]{1,64}$/.test(token)) {
      return reply(
        chatId,
        "Token binding tidak valid. Buat token baru dari halaman Akun CID Store dan coba lagi.",
      );
    }

    if (
      typeof telegramId !== "number" ||
      !Number.isSafeInteger(telegramId) ||
      telegramId <= 0 ||
      chatId !== telegramId
    ) {
      return reply(
        chatId,
        "Binding hanya dapat dilakukan dari chat pribadi akun Telegram kamu.",
      );
    }

    const telegramUsername = telegramMessage.from?.username;

    if (
      telegramUsername !== undefined &&
      (typeof telegramUsername !== "string" ||
        !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegramUsername))
    ) {
      return reply(chatId, "Data akun Telegram tidak valid. Silakan coba lagi.");
    }

    const tokenHash = hashToken(token);

    const linkToken = await prisma.telegramLinkToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!linkToken) {
      return reply(
        chatId,
        "Token binding tidak ditemukan atau sudah tidak berlaku. Buat token baru dari halaman Akun CID Store.",
      );
    }

    if (
      linkToken.usedAt ||
      linkToken.expiresAt.getTime() <= Date.now()
    ) {
      return reply(
        chatId,
        "Token binding sudah digunakan atau kedaluwarsa. Buat token baru dari halaman Akun CID Store.",
      );
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
      return reply(
        chatId,
        "Akun Telegram ini sudah terhubung ke akun CID Store lain.",
      );
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

    return reply(
      chatId,
      linked
        ? "Berhasil! Akun Telegram kamu sudah terhubung dengan CID Store."
        : "Binding gagal. Token mungkin sudah digunakan atau akun CID Store sudah memiliki Telegram. Buat token baru dan coba lagi.",
    );
  } catch (error) {
    console.error("Telegram webhook error", error);

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    );
  }
}
