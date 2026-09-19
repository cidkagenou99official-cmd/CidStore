import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/customer-auth";
import { mockWalletProvider } from "@/app/lib/mock-wallet-provider";

const SUPPORTED_ASSETS = new Set(["USDT", "ETH", "BTC", "SOL", "TON"]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      asset?: string;
      network?: string;
    };

    const asset = body.asset?.trim().toUpperCase();
    const network = body.network?.trim();

    if (!asset || !network) {
      return NextResponse.json(
        { error: "Asset and network are required." },
        { status: 400 },
      );
    }

    if (!SUPPORTED_ASSETS.has(asset)) {
      return NextResponse.json(
        { error: "Asset is not supported." },
        { status: 400 },
      );
    }

    const support = mockWalletProvider.getNetworkSupport(asset, network);

    if (!support.architectureSupported) {
      return NextResponse.json(
        {
          error: "This asset/network is not supported.",
          support,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.depositAddress.findUnique({
      where: {
        userId_asset_network: {
          userId: user.id,
          asset,
          network,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        depositAddress: existing,
        support,
      });
    }

    const providerResult =
      await mockWalletProvider.createDepositAddress({
        userId: user.id,
        asset,
        network,
      });

    if (!providerResult.address) {
      return NextResponse.json(
        { error: "Provider did not return a deposit address." },
        { status: 502 },
      );
    }

    const depositAddress = await prisma.depositAddress.create({
      data: {
        userId: user.id,
        asset,
        network,
        address: providerResult.address,
        enabled: true,
      },
    });

    return NextResponse.json({
      depositAddress,
      support,
      provider: providerResult.provider,
      warning: providerResult.warning,
    });
  } catch (error) {
    console.error("Create deposit address error:", error);

    return NextResponse.json(
      { error: "Failed to create deposit address." },
      { status: 500 },
    );
  }
}
