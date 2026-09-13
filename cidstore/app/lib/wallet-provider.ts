export type WalletProviderSupportStatus =
  | "SUPPORTED_FOR_ARCHITECTURE"
  | "UNVERIFIED_PROVIDER_SUPPORT"
  | "NOT_SUPPORTED";

export type InternalDepositTransactionStatus =
  | "DETECTED"
  | "PENDING"
  | "CONFIRMING"
  | "CONFIRMED"
  | "FAILED"
  | "REORGED"
  | "CREDITED"
  | "REJECTED";

export type InternalPayoutStatus =
  | "REQUESTED"
  | "PENDING_APPROVAL"
  | "SUBMITTED"
  | "CONFIRMING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface WalletNetworkSupport {
  asset: string;
  network: string;
  supportStatus: WalletProviderSupportStatus;
  architectureSupported: boolean;
  providerSupportVerified: boolean;
  reason?: string;
}

export interface CreateDepositAddressRequest {
  userId: string;
  asset: string;
  network: string;
}

export interface CreateDepositAddressResult {
  provider: string;
  address: string | null;
  providerWalletId?: string | null;
  providerAddressId?: string | null;
  externalReference?: string | null;
  supportStatus: WalletProviderSupportStatus;
  architectureSupported: boolean;
  providerSupportVerified: boolean;
  assignedAt: string;
  warning?: string;
}

export interface GetDepositAddressRequest {
  userId: string;
  asset: string;
  network: string;
  providerAddressId?: string | null;
}

export type GetDepositAddressResult = CreateDepositAddressResult;

export interface GetDepositTransactionRequest {
  providerTransactionId?: string | null;
  asset?: string | null;
  network?: string | null;
  depositAddressId?: string | null;
}

export interface GetDepositTransactionResult {
  provider: string;
  providerTransactionId: string;
  txHash: string;
  asset?: string | null;
  network?: string | null;
  depositAddressId?: string | null;
  amount?: string | null;
  confirmations: number;
  status: InternalDepositTransactionStatus;
  detectedAt: string;
  confirmedAt?: string | null;
}

export interface RequestPayoutRequest {
  userId: string;
  asset: string;
  network: string;
  toAddress: string;
  amount: string;
}

export interface RequestPayoutResult {
  provider: string;
  payoutId: string;
  status: InternalPayoutStatus;
  txHash?: string | null;
  submittedAt: string;
  warning?: string;
}

export interface GetPayoutStatusRequest {
  payoutId: string;
}

export interface GetPayoutStatusResult {
  provider: string;
  payoutId: string;
  status: InternalPayoutStatus;
  txHash?: string | null;
  updatedAt: string;
}

export interface HandleWebhookRequest {
  provider: string;
  rawEvent: Record<string, unknown>;
}

export interface NormalizedWalletWebhookEvent {
  provider: string;
  providerEventId: string;
  providerTransactionId?: string | null;
  providerAddressReference?: string | null;
  txHash?: string | null;
  asset?: string | null;
  network?: string | null;
  amount?: string | null;
  depositAddressId?: string | null;
  externalReference?: string | null;
  status: InternalDepositTransactionStatus;
  rawEvent: Record<string, unknown>;
}

export interface HealthCheckResult {
  ok: boolean;
  provider: string;
  checkedAt: string;
}

export interface WalletProvider {
  readonly name: string;
  getNetworkSupport(asset: string, network: string): WalletNetworkSupport;
  createDepositAddress(input: CreateDepositAddressRequest): Promise<CreateDepositAddressResult>;
  getDepositAddress(input: GetDepositAddressRequest): Promise<GetDepositAddressResult>;
  getDepositTransaction(input: GetDepositTransactionRequest): Promise<GetDepositTransactionResult>;
  requestPayout(input: RequestPayoutRequest): Promise<RequestPayoutResult>;
  getPayoutStatus(input: GetPayoutStatusRequest): Promise<GetPayoutStatusResult>;
  handleWebhook(input: HandleWebhookRequest): Promise<NormalizedWalletWebhookEvent>;
  healthCheck(): Promise<HealthCheckResult>;
}
