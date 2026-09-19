import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { creditWalletBalance } from "../wallet-balance-service";

describe("creditWalletBalance", () => {
  it("exports the credit function", () => {
    expect(creditWalletBalance).toBeTypeOf("function");
  });

  it("credits the wallet exactly once", async () => {
    const updateMany = vi
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const upsert = vi.fn().mockResolvedValue({
      id: "balance-1",
      userId: "user-1",
      asset: "USDT",
      network: "ERC20",
      balance: new Prisma.Decimal("10.5"),
      locked: new Prisma.Decimal("0"),
    });

    const tx = {
      depositTransaction: {
        updateMany,
      },
      walletBalance: {
        upsert,
      },
    } as unknown as Prisma.TransactionClient;

    const first = await creditWalletBalance(tx, {
      depositTransactionId: "deposit-1",
      userId: "user-1",
      asset: "USDT",
      network: "ERC20",
      amount: "10.5",
    });

    expect(first.credited).toBe(true);
    expect(upsert).toHaveBeenCalledTimes(1);

    const replay = await creditWalletBalance(tx, {
      depositTransactionId: "deposit-1",
      userId: "user-1",
      asset: "USDT",
      network: "ERC20",
      amount: "10.5",
    });

    expect(replay.credited).toBe(false);
    expect(replay.reason).toBe("ALREADY_CREDITED");
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
