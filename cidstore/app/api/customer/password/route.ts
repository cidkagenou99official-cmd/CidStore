import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  getCurrentUser,
  verifyPassword,
  createPasswordHash,
} from "@/app/lib/customer-auth";

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

    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account does not have a password set." },
        { status: 400 },
      );
    }

    const currentPasswordValid = verifyPassword(
      currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current password." },
        { status: 400 },
      );
    }

    const newPasswordHash = createPasswordHash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Failed to change customer password", error);

    return NextResponse.json(
      { error: "Unable to change password." },
      { status: 500 },
    );
  }
}
