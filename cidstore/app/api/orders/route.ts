import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/app/lib/admin-auth";
import { getCurrentUser } from "@/app/lib/customer-auth";
import { resolveSellDepositAddressForOrder } from "@/app/lib/deposit-address-service";
import { createOrder, listOrders, listOrdersByUser } from "@/app/lib/order-service";
import type { CryptoSymbol, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "@/app/types";

function validateWalletAddress(value: unknown): string {
  const walletAddress = String(value ?? "").trim();

  if (!walletAddress) {
    throw new Error("Wallet address is required.");
  }

  if (walletAddress.length < 8 || walletAddress.length > 255) {
    throw new Error("Wallet address looks invalid. Please enter a valid crypto wallet address.");
  }

  if (walletAddress.includes("\n") || walletAddress.includes("\r")) {
    throw new Error("Wallet address contains invalid characters.");
  }

  return walletAddress;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
    const currentUser = await getCurrentUser();

    if (session) {
      const orders = await listOrders();
      return NextResponse.json(orders);
    }

    if (currentUser) {
      const orders = await listOrdersByUser(currentUser.id);
      return NextResponse.json(orders);
    }

    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  } catch (error) {
    console.error("Failed to list orders", error);
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const walletAddress = validateWalletAddress(body.walletAddress);
    const currentUser = await getCurrentUser();

    let depositAddressId: string | null = null;
    let userId: string | null = null;

    if (body.type === "SELL") {
      if (!currentUser) {
        return NextResponse.json({ error: "Authentication required to create a SELL order." }, { status: 401 });
      }

      const resolvedDepositAddress = await resolveSellDepositAddressForOrder(currentUser.id, String(body.crypto ?? ""), String(body.network ?? ""));
      depositAddressId = resolvedDepositAddress.depositAddressId ?? null;
      userId = currentUser.id;
    } else if (currentUser) {
      userId = currentUser.id;
    }

    const order = await createOrder({
      id: String(body.id ?? ""),
      type: body.type as OrderType,
      crypto: body.crypto as CryptoSymbol,
      cryptoName: String(body.cryptoName ?? ""),
      network: String(body.network ?? ""),
      cryptoAmount: String(body.cryptoAmount ?? "0"),
      fiatAmount: String(body.idrAmount ?? body.fiatAmount ?? "0"),
      fee: String(body.marketRate ?? body.fee ?? "0"),
      networkFee: String(body.networkFee ?? "0"),
      serviceFee: String(body.serviceFee ?? "0"),
      paymentMethod: body.paymentMethod as PaymentMethod,
      walletAddress,
      total: String(body.total ?? "0"),
      paymentProof: body.paymentProof ? String(body.paymentProof) : null,
      status: body.status as OrderStatus | undefined,
      paymentStatus: body.paymentStatus as PaymentStatus | undefined,
      customerContact: body.customerContact ? String(body.customerContact) : null,
      userId,
      depositAddressId,
      createdAt: body.createdAt ? String(body.createdAt) : undefined,
      updatedAt: body.updatedAt ? String(body.updatedAt) : undefined,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order", error);

    const message = error instanceof Error ? error.message : "Unable to create order.";
    const status = message.includes("Wallet address") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
