import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";

const { db, getCurrentUser } = vi.hoisted(() => ({
  db: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    telegramLinkToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  getCurrentUser: vi.fn(),
}));

vi.mock("@/app/lib/prisma", () => ({ prisma: db }));
vi.mock("@/app/lib/customer-auth", () => ({ getCurrentUser }));

import { PATCH as updateLegacyTelegram } from "@/app/api/customer/telegram/route";
import { PATCH as updateProfile } from "@/app/api/customer/profile/route";
import { POST as unlinkTelegram } from "@/app/api/customer/telegram/unlink/route";
import { POST as telegramWebhook } from "@/app/api/telegram/webhook/route";

const currentUser = {
  id: "user-1",
  email: "customer@example.test",
  name: "Customer",
  phone: null,
  telegramId: null,
  telegramUsername: "official_handle",
  language: "id",
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

function webhookRequest(message: unknown, secret = "test-secret") {
  return new Request("http://localhost/api/telegram/webhook", {
    method: "POST",
    headers: { "x-telegram-bot-api-secret-token": secret },
    body: JSON.stringify({ message }),
  });
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "test-secret");
  getCurrentUser.mockResolvedValue(currentUser);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Telegram account binding", () => {
  it("rejects the legacy manual binding endpoint without writing", async () => {
    const response = await updateLegacyTelegram();

    expect(response.status).toBe(410);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("does not let profile updates overwrite the webhook username", async () => {
    db.user.update.mockResolvedValue({
      ...currentUser,
      telegramId: "123456",
    });

    const response = await updateProfile(
      new Request("http://localhost/api/customer/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Updated Customer",
          telegramUsername: "forged_handle",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: currentUser.id },
      data: { name: "Updated Customer" },
    });
    expect(body.user.telegramUsername).toBe("official_handle");
    expect(body.user.telegramConnected).toBe(true);
  });

  it("clears pending tokens when Telegram is unlinked", async () => {
    const tx = {
      user: { update: vi.fn().mockResolvedValue({}) },
      telegramLinkToken: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    db.$transaction.mockImplementation(async (callback) => callback(tx));

    const response = await unlinkTelegram();

    expect(response.status).toBe(200);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: currentUser.id },
      data: { telegramId: null, telegramUsername: null },
    });
    expect(tx.telegramLinkToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: currentUser.id, usedAt: null },
    });
  });

  it("does not consume expired link tokens", async () => {
    const token = "expired-token";
    db.telegramLinkToken.findUnique.mockResolvedValue({
      id: "link-1",
      userId: currentUser.id,
      usedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
    });

    const response = await telegramWebhook(
      webhookRequest({
        from: { id: 123456, username: "official_handle" },
        chat: { id: 123456 },
        text: `/start ${token}`,
      }),
    );

    expect(response.status).toBe(200);
    expect(db.telegramLinkToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: tokenHash(token) },
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("accepts a valid private bot update and stores its official username", async () => {
    const token = "valid-token";
    db.telegramLinkToken.findUnique.mockResolvedValue({
      id: "link-1",
      userId: currentUser.id,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    db.user.findFirst.mockResolvedValue(null);

    const tx = {
      telegramLinkToken: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    db.$transaction.mockImplementation(async (callback) => callback(tx));

    const response = await telegramWebhook(
      webhookRequest({
        from: { id: 123456, username: "official_handle" },
        chat: { id: 123456 },
        text: `/start ${token}`,
      }),
    );
    const body = await response.json();

    expect(body).toEqual({ ok: true, linked: true });
    expect(tx.telegramLinkToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "link-1", usedAt: null }),
      }),
    );
    expect(tx.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: currentUser.id, telegramId: null },
        data: {
          telegramId: "123456",
          telegramUsername: "official_handle",
        },
      }),
    );
  });

  it("ignores /start updates from group chats", async () => {
    const response = await telegramWebhook(
      webhookRequest({
        from: { id: 123456, username: "official_handle" },
        chat: { id: -987654 },
        text: "/start valid-token",
      }),
    );

    expect(response.status).toBe(200);
    expect(db.telegramLinkToken.findUnique).not.toHaveBeenCalled();
  });

  it("rejects updates without the configured webhook secret", async () => {
    const response = await telegramWebhook(
      webhookRequest({ text: "/start valid-token" }, "wrong-secret"),
    );

    expect(response.status).toBe(401);
    expect(db.telegramLinkToken.findUnique).not.toHaveBeenCalled();
  });
});