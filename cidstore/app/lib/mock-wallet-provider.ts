import type {
  CreateDepositAddressRequest,
  CreateDepositAddressResult,
  GetDepositAddressRequest,
  GetDepositAddressResult,
  GetDepositTransactionRequest,
  GetDepositTransactionResult,
  GetPayoutStatusRequest,
  GetPayoutStatusResult,
  HandleWebhookRequest,
  HealthCheckResult,
  InternalDepositTransactionStatus,
  NormalizedWalletWebhookEvent,
  RequestPayoutRequest,
  RequestPayoutResult,
  WalletNetworkSupport,
  WalletProvider,
} from "@/app/lib/wallet-provider";

const ARCHITECTURE_SUPPORTED_NETWORKS = new Map<string, WalletNetworkSupport>([
  ["ETH/Ethereum", { asset: "ETH", network: "Ethereum", supportStatus: "SUPPORTED_FOR_ARCHITECTURE", architectureSupported: true, providerSupportVerified: true }],
  ["ETH/Base", { asset: "ETH", network: "Base", supportStatus: "SUPPORTED_FOR_ARCHITECTURE", architectureSupported: true, providerSupportVerified: true }],
  ["ETH/Arbitrum", { asset: "ETH", network: "Arbitrum", supportStatus: "SUPPORTED_FOR_ARCHITECTURE", architectureSupported: true, providerSupportVerified: true }],
  ["BTC/Bitcoin", { asset: "BTC", network: "Bitcoin", supportStatus: "SUPPORTED_FOR_ARCHITECTURE", architectureSupported: true, providerSupportVerified: true }],
  ["SOL/Solana", { asset: "SOL", network: "Solana", supportStatus: "SUPPORTED_FOR_ARCHITECTURE", architectureSupported: true, providerSupportVerified: true }],
]);

const UNVERIFIED_PROVIDER_NETWORKS = new Map<string, WalletNetworkSupport>([
  ["USDT/BEP20", { asset: "USDT", network: "BEP20", supportStatus: "UNVERIFIED_PROVIDER_SUPPORT", architectureSupported: true, providerSupportVerified: false, reason: "Exact USDT token support on BNB Smart Chain must be confirmed with the provider." }],
  ["USDT/TRC20", { asset: "USDT", network: "TRC20", supportStatus: "UNVERIFIED_PROVIDER_SUPPORT", architectureSupported: true, providerSupportVerified: false, reason: "Exact USDT token support on TRON must be confirmed with the provider." }],
  ["USDT/ERC20", { asset: "USDT", network: "ERC20", supportStatus: "UNVERIFIED_PROVIDER_SUPPORT", architectureSupported: true, providerSupportVerified: false, reason: "Exact USDT token support on Ethereum ERC20 must be confirmed with the provider." }],
  ["USDT/Base", { asset: "USDT", network: "Base", supportStatus: "UNVERIFIED_PROVIDER_SUPPORT", architectureSupported: true, providerSupportVerified: false, reason: "Exact USDT token support on Base must be confirmed with the provider." }],
  ["USDT/Arbitrum", { asset: "USDT", network: "Arbitrum", supportStatus: "UNVERIFIED_PROVIDER_SUPPORT", architectureSupported: true, providerSupportVerified: false, reason: "Exact USDT token support on Arbitrum must be confirmed with the provider." }],
  ["USDT/Solana", { asset: "USDT", network: "Solana", supportStatus: "UNVERIFIED_PROVIDER_SUPPORT", architectureSupported: true, providerSupportVerified: false, reason: "USDT on Solana requires explicit provider verification; do not assume production support." }],
  ["USDT/Robinhood", { asset: "USDT", network: "Robinhood", supportStatus: "UNVERIFIED_PROVIDER_SUPPORT", architectureSupported: true, providerSupportVerified: false, reason: "Robinhood Chain asset support remains ambiguous and must be clarified before production use." }],
]);

const DEFAULT_UNSUPPORTED: WalletNetworkSupport = {
  asset: "",
  network: "",
  supportStatus: "NOT_SUPPORTED",
  architectureSupported: false,
  providerSupportVerified: false,
  reason: "This asset/network is not part of the verified architecture matrix for this mock provider.",
};

const mockState = {
  depositAddresses: new Map<string, CreateDepositAddressResult>(),
  transactions: new Map<string, GetDepositTransactionResult>(),
  payouts: new Map<string, GetPayoutStatusResult>(),
};

function makeMockId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export class MockWalletProvider implements WalletProvider {
  readonly name = "MockWalletProvider";

  getNetworkSupport(asset: string, network: string): WalletNetworkSupport {
    const key = `${asset}/${network}`;

    if (ARCHITECTURE_SUPPORTED_NETWORKS.has(key)) {
      return ARCHITECTURE_SUPPORTED_NETWORKS.get(key)!;
    }

    if (UNVERIFIED_PROVIDER_NETWORKS.has(key)) {
      return UNVERIFIED_PROVIDER_NETWORKS.get(key)!;
    }

    return {
      ...DEFAULT_UNSUPPORTED,
      asset,
      network,
      reason: `Asset/network combination ${asset} / ${network} is not part of the current mock provider architecture matrix.`,
    };
  }

  async createDepositAddress(input: CreateDepositAddressRequest): Promise<CreateDepositAddressResult> {
    const support = this.getNetworkSupport(input.asset, input.network);
    const now = new Date().toISOString();
    const providerWalletId = makeMockId("mock_wallet");
    const providerAddressId = makeMockId("mock_address");
    const externalReference = makeMockId("mock_ref");
    const address = `mock_address_${providerAddressId}`;

    const result: CreateDepositAddressResult = {
      provider: this.name,
      address,
      providerWalletId,
      providerAddressId,
      externalReference,
      supportStatus: support.supportStatus,
      architectureSupported: support.architectureSupported,
      providerSupportVerified: support.providerSupportVerified,
      assignedAt: now,
      warning:
        support.supportStatus === "UNVERIFIED_PROVIDER_SUPPORT"
          ? "TEST / MOCK ADDRESS — DO NOT SEND REAL CRYPTO. Provider support for this asset/network is unverified."
          : "TEST / MOCK ADDRESS — DO NOT SEND REAL CRYPTO.",
    };

    mockState.depositAddresses.set(result.providerAddressId ?? providerAddressId, result);

    return result;
  }

  async getDepositAddress(input: GetDepositAddressRequest): Promise<GetDepositAddressResult> {
    const support = this.getNetworkSupport(input.asset, input.network);
    const providerAddressId = input.providerAddressId ?? makeMockId("mock_address");

    const existing = mockState.depositAddresses.get(providerAddressId);

    if (existing) {
      return existing;
    }

    return {
      provider: this.name,
      address: `mock_address_${providerAddressId}`,
      providerWalletId: makeMockId("mock_wallet"),
      providerAddressId,
      externalReference: makeMockId("mock_ref"),
      supportStatus: support.supportStatus,
      architectureSupported: support.architectureSupported,
      providerSupportVerified: support.providerSupportVerified,
      assignedAt: new Date().toISOString(),
      warning:
        support.supportStatus === "UNVERIFIED_PROVIDER_SUPPORT"
          ? "TEST / MOCK ADDRESS — DO NOT SEND REAL CRYPTO. Provider support for this asset/network is unverified."
          : "TEST / MOCK ADDRESS — DO NOT SEND REAL CRYPTO.",
    };
  }

  async getDepositTransaction(input: GetDepositTransactionRequest): Promise<GetDepositTransactionResult> {
    const providerTransactionId = input.providerTransactionId ?? makeMockId("mock_tx");
    const txHash = `mock_tx_${providerTransactionId}`;

    const existing = mockState.transactions.get(providerTransactionId);

    if (existing) {
      return existing;
    }

    const result: GetDepositTransactionResult = {
      provider: this.name,
      providerTransactionId,
      txHash,
      asset: input.asset ?? "ETH",
      network: input.network ?? "Ethereum",
      depositAddressId: input.depositAddressId ?? null,
      amount: "0",
      confirmations: 0,
      status: "DETECTED",
      detectedAt: new Date().toISOString(),
      confirmedAt: null,
    };

    mockState.transactions.set(providerTransactionId, result);
    return result;
  }

  async requestPayout(input: RequestPayoutRequest): Promise<RequestPayoutResult> {
    void input;
    const payoutId = makeMockId("mock_payout");
    const now = new Date().toISOString();

    const result: RequestPayoutResult = {
      provider: this.name,
      payoutId,
      status: "REQUESTED",
      txHash: null,
      submittedAt: now,
      warning: "Mock payout request only; no real blockchain broadcast occurs.",
    };

    mockState.payouts.set(payoutId, {
      provider: this.name,
      payoutId,
      status: "REQUESTED",
      txHash: null,
      updatedAt: now,
    });

    return result;
  }

  async getPayoutStatus(input: GetPayoutStatusRequest): Promise<GetPayoutStatusResult> {
    const existing = mockState.payouts.get(input.payoutId);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const fallback: GetPayoutStatusResult = {
      provider: this.name,
      payoutId: input.payoutId,
      status: "PENDING_APPROVAL",
      txHash: null,
      updatedAt: now,
    };

    mockState.payouts.set(input.payoutId, fallback);
    return fallback;
  }

  async handleWebhook(input: HandleWebhookRequest): Promise<NormalizedWalletWebhookEvent> {
    const rawEvent = input.rawEvent ?? {};
    const providerEventId = String((rawEvent as Record<string, unknown>).eventId ?? makeMockId("mock_event"));
    const providerTransactionId = String((rawEvent as Record<string, unknown>).providerTransactionId ?? makeMockId("mock_tx"));

    const normalizedStatus: InternalDepositTransactionStatus =
      ((rawEvent as Record<string, unknown>).status as string | undefined) === "confirmed"
        ? "CONFIRMED"
        : "DETECTED";

    return {
      provider: this.name,
      providerEventId,
      providerTransactionId,
      txHash: String((rawEvent as Record<string, unknown>).txHash ?? `mock_tx_${providerTransactionId}`),
      asset: String((rawEvent as Record<string, unknown>).asset ?? "ETH"),
      network: String((rawEvent as Record<string, unknown>).network ?? "Ethereum"),
      amount: String((rawEvent as Record<string, unknown>).amount ?? "0"),
      depositAddressId: String((rawEvent as Record<string, unknown>).depositAddressId ?? ""),
      externalReference: String((rawEvent as Record<string, unknown>).externalReference ?? ""),
      status: normalizedStatus,
      rawEvent,
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      ok: true,
      provider: this.name,
      checkedAt: new Date().toISOString(),
    };
  }
}

export const mockWalletProvider = new MockWalletProvider();
