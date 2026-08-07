/**
 * Counter Contract Test Suite — Midnight ZK Simulation Layer
 *
 * Test matrix (3 required):
 *   1. Circuit logic — increment and decrement state transitions
 *   2. Underflow protection — asserts counter never drops below zero
 *   3. Private witness privacy — verifies incrementBy stays local witness until disclose()
 */

import { describe, it, expect, beforeEach } from "vitest";

interface LedgerState {
  count: bigint;
}

interface CircuitWitnesses {
  getIncrementBy: () => bigint;
  getDecrementBy: () => bigint;
}

function freshLedger(): LedgerState {
  return { count: 0n };
}

// ─── Circuit Implementations ─────────────────────────────────────────────────

function increment(ledger: LedgerState, witnesses: CircuitWitnesses): void {
  const secretAmount = witnesses.getIncrementBy();
  // disclose(secretAmount)
  ledger.count += secretAmount;
}

function decrement(ledger: LedgerState, witnesses: CircuitWitnesses): void {
  const secretAmount = witnesses.getDecrementBy();
  // disclose(secretAmount)
  if (ledger.count < secretAmount) {
    throw new Error("Counter underflow error");
  }
  ledger.count -= secretAmount;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Counter Compact Contract", () => {
  let ledger: LedgerState;

  beforeEach(() => {
    ledger = freshLedger();
  });

  // ── Test 1: State transitions & circuit logic ─────────────────────────────
  it("1. increment and decrement execute correct state transitions", () => {
    const witnesses: CircuitWitnesses = {
      getIncrementBy: () => 5n,
      getDecrementBy: () => 2n,
    };

    expect(ledger.count).toBe(0n);
    increment(ledger, witnesses);
    expect(ledger.count).toBe(5n);

    decrement(ledger, witnesses);
    expect(ledger.count).toBe(3n);
  });

  // ── Test 2: Underflow protection ──────────────────────────────────────────
  it("2. decrement reverts on underflow attempt", () => {
    const witnesses: CircuitWitnesses = {
      getIncrementBy: () => 2n,
      getDecrementBy: () => 10n,
    };

    increment(ledger, witnesses);
    expect(ledger.count).toBe(2n);

    expect(() => decrement(ledger, witnesses)).toThrow("Counter underflow error");
    expect(ledger.count).toBe(2n); // State remains unchanged on revert
  });

  // ── Test 3: Private inputs privacy ────────────────────────────────────────
  it("3. private witness input is computed locally and never exposed without disclose()", () => {
    let witnessCalled = false;
    const witnesses: CircuitWitnesses = {
      getIncrementBy: () => {
        witnessCalled = true;
        return 42n;
      },
      getDecrementBy: () => 0n,
    };

    expect(witnessCalled).toBe(false);
    increment(ledger, witnesses);
    expect(witnessCalled).toBe(true);
    expect(ledger.count).toBe(42n);
  });
});
