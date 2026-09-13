import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "cidstore_admin_session";

export type AdminSession = {
  email: string;
  exp: number;
};

const SESSION_DURATION_MS = 60 * 60 * 1000;

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  return { email, password };
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

export function isAdminCredentialsConfigured(): boolean {
  const { email, password } = getAdminCredentials();

  return Boolean(email && password);
}

export function createAdminSessionToken(email: string): string {
  const { password } = getAdminCredentials();

  if (!password) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  const payload = {
    email,
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", password).update(encodedPayload).digest();

  return `${encodedPayload}.${signature.toString("base64url")}`;
}

export function verifyAdminSession(token?: string): AdminSession | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const { password } = getAdminCredentials();

  if (!password) {
    return null;
  }

  const expectedSignature = createHmac("sha256", password).update(encodedPayload).digest();
  const providedSignature = Buffer.from(signature, "base64url");

  if (expectedSignature.length !== providedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload).toString("utf8");
    const payload = JSON.parse(payloadJson) as Partial<AdminSession>;

    if (!payload.email || typeof payload.exp !== "number") {
      return null;
    }

    const { email: configuredEmail } = getAdminCredentials();

    if (configuredEmail && payload.email !== configuredEmail) {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return {
      email: payload.email,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
