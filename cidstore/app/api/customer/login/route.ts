import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createCustomerSessionToken, CUSTOMER_SESSION_COOKIE, verifyPassword } from "@/app/lib/customer-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isPasswordValid = verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    const token = createCustomerSessionToken(user.id);

    response.cookies.set({
      name: CUSTOMER_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to login.";

    if (message.includes("CUSTOMER_SESSION_SECRET")) {
      return NextResponse.json(
        { error: "Customer authentication is not configured. Please set CUSTOMER_SESSION_SECRET in .env.local." },
        { status: 503 },
      );
    }

    console.error("Failed to login customer");
    return NextResponse.json({ error: "Unable to login." }, { status: 500 });
  }
}
