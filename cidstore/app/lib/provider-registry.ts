import { mockWalletProvider } from "@/app/lib/mock-wallet-provider";
import type { WalletProvider } from "@/app/lib/wallet-provider";

export function getWalletProvider(): WalletProvider {
  return mockWalletProvider;
}
