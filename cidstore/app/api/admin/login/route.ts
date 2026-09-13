import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, isAdminCredentialsConfigured } from "@/app/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!configuredEmail || !configuredPassword || !isAdminCredentialsConfigured()) {
      return NextResponse.json({ error: "Admin access is not configured." }, { status: 500 });
    }

    if (email !== configuredEmail || password !== configuredPassword) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }

    const authToken = createAdminSessionToken(configuredEmail);
    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: authToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Unable to login." }, { status: 500 });
  }
}
