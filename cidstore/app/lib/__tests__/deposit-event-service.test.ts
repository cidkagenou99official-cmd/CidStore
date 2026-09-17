import { describe, expect, it } from "vitest";
import type { NormalizedWalletWebhookEvent } from "../wallet-provider";
import {
  amountsMatch,
  buildCanonicalTxKey,
  deriveSafeTransactionStatus,
  normalizeDecimalString,
  sanitizeRawEvent,
} from "../deposit-event-service";

const baseEvent: NormalizedWalletWebhookEvent = {
  provider: "mock",
  providerEventId: "event-1",
  providerTransactionId: "tx-123",
  txHash: "hash-123",
  asset: "USDT",
  network: "TRON",
  status: "DETECTED",
  rawEvent: {},
};

describe("buildCanonicalTxKey", () => {
  it("uses the provider transaction id before the transaction hash", () => {
    expect(buildCanonicalTxKey(baseEvent)).toBe("mock:TRON:USDT:tx-123");
  });

  it("falls back to the hash and address context", () => {
    expect(
      buildCanonicalTxKey(
        { ...baseEvent, providerTransactionId: null, asset: null, network: null },
        { asset: "BTC", network: "BITCOIN" },
      ),
    ).toBe("mock:BITCOIN:BTC:hash-123");
  });

  it("returns null when no transaction identifier or context exists", () => {
    expect(buildCanonicalTxKey({ ...baseEvent, providerTransactionId: null, txHash: null })).toBeNull();
    expect(buildCanonicalTxKey({ ...baseEvent, asset: null, network: null })).toBeNull();
  });
});

describe("sanitizeRawEvent", () => {
  it("redacts sensitive keys recursively while preserving safe data", () => {
    expect(
      sanitizeRawEvent({
        eventId: "event-1",
        token: "secret-token",
        nested: { apiKey: "secret-key", amount: "12.50" },
        entries: [{ password: "secret-password", status: "confirmed" }],
      }),
    ).toEqual({
      eventId: "event-1",
      token: "[REDACTED]",
      nested: { apiKey: "[REDACTED]", amount: "12.50" },
      entries: [{ password: "[REDACTED]", status: "confirmed" }],
    });
  });

  it("preserves primitive values and null", () => {
    expect(sanitizeRawEvent([null, 42, "safe"])).toEqual([null, 42, "safe"]);
  });
});

describe("normalizeDecimalString", () => {
  it("normalizes whitespace, leading zeroes, and trailing fraction zeroes", () => {
    expect(normalizeDecimalString(" 0012.3400 ")).toBe("12.34");
    expect(normalizeDecimalString("000.000")).toBe("0");
  });

  it("returns null for missing or invalid decimal strings", () => {
    expect(normalizeDecimalString(null)).toBeNull();
    expect(normalizeDecimalString("12.")).toBeNull();
    expect(normalizeDecimalString("-1")).toBeNull();
  });
});

describe("amountsMatch", () => {
  it("matches equivalent positive decimal representations", () => {
    expect(amountsMatch("001.200", "1.2")).toBe(true);
  });

  it("rejects zero, missing, and invalid amounts", () => {
    expect(amountsMatch("0", "0.00")).toBe(false);
    expect(amountsMatch(undefined, "1")).toBe(false);
    expect(amountsMatch("1.2", "1.3")).toBe(false);
  });
});

describe("deriveSafeTransactionStatus", () => {
  it("only advances through the lifecycle and does not regress", () => {
    expect(deriveSafeTransactionStatus("PENDING", "CONFIRMED")).toBe("CONFIRMED");
    expect(deriveSafeTransactionStatus("CONFIRMED", "PENDING")).toBe("CONFIRMED");
  });

  it("keeps terminal statuses and handles unknown statuses safely", () => {
    expect(deriveSafeTransactionStatus("CREDITED", "FAILED")).toBe("CREDITED");
    expect(deriveSafeTransactionStatus("PENDING", "FAILED")).toBe("PENDING");
    expect(deriveSafeTransactionStatus("UNKNOWN", "PENDING")).toBe("PENDING");
    expect(deriveSafeTransactionStatus("PENDING", "UNKNOWN")).toBe("PENDING");
  });
});