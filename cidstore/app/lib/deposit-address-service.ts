import { prisma } from "@/app/lib/prisma";
import { getWalletProvider } from "@/app/lib/provider-registry";

const INITIAL_NETWORK_CONFIGS = [
  { asset: "USDT", network: "BEP20", displayName: "USDT / BEP20", explorerBaseUrl: "https://bscscan.com", enabled: true },
  { asset: "USDT", network: "TRC20", displayName: "USDT / TRC20", explorerBaseUrl: "https://tronscan.org", enabled: true },
  { asset: "USDT", network: "ERC20", displayName: "USDT / ERC20", explorerBaseUrl: "https://etherscan.io", enabled: true },
  { asset: "USDT", network: "Base", displayName: "USDT / Base", explorerBaseUrl: "https://basescan.org", enabled: true },
  { asset: "USDT", network: "Arbitrum", displayName: "USDT / Arbitrum", explorerBaseUrl: "https://arbiscan.io", enabled: true },
  { asset: "ETH", network: "Ethereum", displayName: "ETH / Ethereum", explorerBaseUrl: "https://etherscan.io", enabled: true },
  { asset: "ETH", network: "Base", displayName: "ETH / Base", explorerBaseUrl: "https://basescan.org", enabled: true },
  { asset: "ETH", network: "Arbitrum", displayName: "ETH / Arbitrum", explorerBaseUrl: "https://arbiscan.io", enabled: true },
  { asset: "BTC", network: "Bitcoin", displayName: "BTC / Bitcoin", explorerBaseUrl: "https://mempool.space", enabled: true },
  { asset: "SOL", network: "Solana", displayName: "SOL / Solana", explorerBaseUrl: "https://solscan.io", enabled: true },
  { asset: "USDT", network: "Solana", displayName: "USDT / Solana", explorerBaseUrl: "https://solscan.io", enabled: false },
  { asset: "USDT", network: "Robinhood", displayName: "USDT / Robinhood", explorerBaseUrl: null, enabled: false },
] as const;

export type DepositAddressServiceStatus =
  | "configured"
  | "not-configured"
  | "disabled"
  | "unsupported"
  | "unverified";

export async function ensureNetworkConfigs() {
  await Promise.all(
    INITIAL_NETWORK_CONFIGS.map((config) =>
      prisma.networkConfig.upsert({
        where: {
          asset_network: {
            asset: config.asset,
            network: config.network,
          },
        },
        update: {
          displayName: config.displayName,
          explorerBaseUrl: config.explorerBaseUrl,
          enabled: config.enabled,
        },
        create: {
          asset: config.asset,
          network: config.network,
          displayName: config.displayName,
          explorerBaseUrl: config.explorerBaseUrl,
          enabled: config.enabled,
        },
      }),
    ),
  );
}

export async function getOrCreateDepositAddress(userId: string, asset: string, network: string) {
  const normalizedAsset = asset.trim();
  const normalizedNetwork = network.trim();

  if (!normalizedAsset || !normalizedNetwork) {
    return {
      userId,
      asset: normalizedAsset,
      network: normalizedNetwork,
      depositAddressId: null,
      address: null,
      enabled: false,
      status: "not-configured" as const,
      providerSupportVerified: false,
      supportStatus: "NOT_SUPPORTED" as const,
      warning: "Missing asset or network.",
    };
  }

  await ensureNetworkConfigs();

  const walletProvider = getWalletProvider();
  const support = walletProvider.getNetworkSupport(normalizedAsset, normalizedNetwork);

  if (support.supportStatus === "NOT_SUPPORTED") {
    return {
      userId,
      asset: normalizedAsset,
      network: normalizedNetwork,
      depositAddressId: null,
      address: null,
      enabled: false,
      status: "unsupported" as const,
      providerSupportVerified: support.providerSupportVerified,
      supportStatus: support.supportStatus,
      warning: support.reason ?? "This asset/network combination is not supported by the current architecture matrix.",
    };
  }

  const existing = await prisma.depositAddress.findUnique({
    where: {
      userId_asset_network: {
        userId,
        asset: normalizedAsset,
        network: normalizedNetwork,
      },
    },
  });

  if (existing) {
    const existingAddress = existing.address?.trim() || null;

    if (!existingAddress && support.supportStatus === "SUPPORTED_FOR_ARCHITECTURE") {
      const providerResult = await walletProvider.createDepositAddress({ userId, asset: normalizedAsset, network: normalizedNetwork });

      const updated = await prisma.depositAddress.update({
        where: { id: existing.id },
        data: {
          address: providerResult.address ?? null,
          enabled: providerResult.supportStatus !== "NOT_SUPPORTED",
        },
      });

      return {
        userId,
        asset: normalizedAsset,
        network: normalizedNetwork,
        depositAddressId: updated.id,
        address: updated.address ?? null,
        enabled: updated.enabled,
        status: updated.address ? ("configured" as const) : ("not-configured" as const),
        providerSupportVerified: providerResult.providerSupportVerified,
        supportStatus: providerResult.supportStatus,
        warning: providerResult.warning ?? undefined,
      };
    }

    return {
      userId,
      asset: normalizedAsset,
      network: normalizedNetwork,
      depositAddressId: existing.id,
      address: existingAddress,
      enabled: existing.enabled,
      status: existingAddress ? ("configured" as const) : ("not-configured" as const),
      providerSupportVerified: support.providerSupportVerified,
      supportStatus: support.supportStatus,
      warning:
        support.supportStatus === "UNVERIFIED_PROVIDER_SUPPORT"
          ? "This asset/network is architecture-supported but provider support is still unverified."
          : undefined,
    };
  }

  const config = await prisma.networkConfig.findUnique({
    where: {
      asset_network: {
        asset: normalizedAsset,
        network: normalizedNetwork,
      },
    },
  });

  const providerResult = await walletProvider.createDepositAddress({ userId, asset: normalizedAsset, network: normalizedNetwork });

  const created = await prisma.depositAddress.create({
    data: {
      userId,
      asset: normalizedAsset,
      network: normalizedNetwork,
      address: providerResult.address ?? null,
      derivationIndex: null,
      enabled: config?.enabled ?? true,
    },
  });

  return {
    userId,
    asset: normalizedAsset,
    network: normalizedNetwork,
    depositAddressId: created.id,
    address: created.address ?? null,
    enabled: created.enabled,
    status:
      providerResult.supportStatus === "UNVERIFIED_PROVIDER_SUPPORT"
        ? ("unverified" as const)
        : created.address
          ? ("configured" as const)
          : ("not-configured" as const),
    providerSupportVerified: providerResult.providerSupportVerified,
    supportStatus: providerResult.supportStatus,
    warning: providerResult.warning ?? undefined,
  };
}

export async function resolveSellDepositAddressForOrder(
  userId: string,
  asset: string,
  network: string,
) {
  return getOrCreateDepositAddress(userId, asset, network);
}
