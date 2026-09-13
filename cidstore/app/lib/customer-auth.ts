import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export const CUSTOMER_SESSION_COOKIE = "cidstore_customer_session";

export type CustomerSession = {
  userId: string;
  exp: number;
};

const SESSION_DURATION_MS = 60 * 60 * 1000;

function getCustomerSessionSecret(): string | null {
  return process.env.CUSTOMER_SESSION_SECRET?.trim() || null;
}

function base64UrlEncode(input: Buffer | Uint8Array | string): string {
  const source = Buffer.isBuffer(input)
    ? input
    : typeof input === "string"
      ? Buffer.from(input)
      : Buffer.from(input);

  return source.toString("base64url");
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function createCustomerSessionToken(userId: string): string {
  const customerSessionSecret = getCustomerSessionSecret();

  if (!customerSessionSecret) {
    throw new Error("CUSTOMER_SESSION_SECRET is not configured.");
  }

  const payload = {
    userId,
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", customerSessionSecret).update(encodedPayload).digest();

  return `${encodedPayload}.${signature.toString("base64url")}`;
}

export function verifyCustomerSession(token?: string): CustomerSession | null {
  if (!token) {
    return null;
  }

  const customerSessionSecret = getCustomerSessionSecret();

  if (!customerSessionSecret) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", customerSessionSecret).update(encodedPayload).digest();
  const providedSignature = Buffer.from(signature, "base64url");

  if (expectedSignature.length !== providedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload).toString("utf8");
    const payload = JSON.parse(payloadJson) as Partial<CustomerSession>;

    if (!payload.userId || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return {
      userId: payload.userId,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = verifyCustomerSession(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
  });
}

export function createPasswordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");

  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, expectedHash] = passwordHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const derivedKey = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");

  return timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(derivedKey, "hex"));
}

export async function isCustomerAuthenticated() {
  return Boolean(await getCurrentUser());
}
