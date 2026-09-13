import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/app/lib/admin-auth";
import { getCurrentUser } from "@/app/lib/customer-auth";
import { getOrderById, updateOrderStatus } from "@/app/lib/order-service";
import type { OrderStatus, PaymentStatus } from "@/app/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const currentUser = await getCurrentUser();

    if (session) {
      return NextResponse.json(order);
    }

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (order.userId && order.userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!order.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to get order", error);
    return NextResponse.json({ error: "Unable to load order." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const nextStatus = body.status as OrderStatus | undefined;

    if (!nextStatus) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }

    let updated;

    try {
      updated = await updateOrderStatus(id, nextStatus, {
        paymentStatus: body.paymentStatus as PaymentStatus | undefined,
        paymentProof: body.paymentProof ? String(body.paymentProof) : undefined,
        verifiedAt: body.verifiedAt ? String(body.verifiedAt) : undefined,
        adminNote: body.adminNote ? String(body.adminNote) : undefined,
        updatedAt: body.updatedAt ? String(body.updatedAt) : undefined,
        paymentSubmittedAt: body.paymentSubmittedAt ? String(body.paymentSubmittedAt) : undefined,
      });
    } catch (transitionError) {
      const message = transitionError instanceof Error ? transitionError.message : "Invalid order status transition.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update order", error);
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
