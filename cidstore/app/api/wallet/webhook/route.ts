import { NextResponse } from "next/server";
import { mockWalletProvider } from "@/app/lib/mock-wallet-provider";
import { processDepositEvent } from "@/app/lib/deposit-event-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const event = await mockWalletProvider.handleWebhook({
      provider: "MockWalletProvider",
      rawEvent: body,
    });

    const result = await processDepositEvent(event);

    return NextResponse.json({
      success: true,
      event,
      result,
    });
  } catch (error) {
    console.error("Mock wallet webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Webhook processing failed.",
      },
      { status: 500 },
    );
  }
}
