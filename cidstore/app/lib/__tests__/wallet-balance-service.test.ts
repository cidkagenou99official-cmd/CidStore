import { describe, expect, it } from "vitest";
import { creditWalletBalance } from "../wallet-balance-service";

describe("creditWalletBalance", () => {
  it("exports the credit function", () => {
    expect(creditWalletBalance).toBeTypeOf("function");
  });
});
