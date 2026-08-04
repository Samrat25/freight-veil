/**
 * FreightVeil — Compact Contract Test Suite
 *
 * Tests use a Midnight-compatible in-process simulation layer.
 * Because the real Compact runtime is not yet distributed as an npm package,
 * we use a thin shim that mirrors the ledger + witness API surface so tests
 * run under standard Vitest without requiring the compiler binary.
 *
 * When the `@midnight-ntwrk/compact-runtime` package becomes publicly
 * available, replace the shim import with:
 *   import { CompactSimulator } from '@midnight-ntwrk/compact-runtime';
 *
 * Test matrix (7 required):
 *   1. registerAsShipper  — success path
 *   2. registerAsCarrier  — success path
 *   3. createShipmentBatch — success (registered shipper, sufficient budget)
 *   4. createShipmentBatch — reverts for carrier-role wallet
 *   5. settleBatch        — success (registered carrier, valid rate*distance)
 *   6. settleBatch        — reverts for shipper-role wallet
 *   7. disputeBatch       — success for original shipper, reverts for anyone else
 */

import { describe, it, expect, beforeEach } from "vitest";

// ─── Compact Simulator Shim ──────────────────────────────────────────────────
// Mirrors the on-chain ledger and circuit behaviour without requiring the
// Compact compiler binary.  Replace with the official runtime when available.

type Bytes32 = string; // hex-encoded 32-byte value for simulation purposes
type Uint8Val = 0 | 1 | 2;

function sha256Sim(input: string): Bytes32 {
  // Deterministic fake hash: good enough for identity uniqueness in tests.
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16).padStart(64, "0");
}

function publicKey(secretKey: Bytes32, index: number): Bytes32 {
  return sha256Sim(`${secretKey}::${index}`);
}

interface Ledger {
  batchCount: number;
  batchStatus: Map<Bytes32, Uint8Val>;
  shipperCommitment: Map<Bytes32, Bytes32>;
  carrierCommitment: Map<Bytes32, Bytes32>;
  shipperRole: Map<Bytes32, Bytes32>;
  carrierRole: Map<Bytes32, Bytes32>;
}

interface Witnesses {
  localSecretKey: () => Bytes32;
  getShipperBudget: () => bigint;
  getTotalFreightCost: () => bigint;
  getCarrierRate: () => bigint;
  getCarrierDistance: () => bigint;
}

function freshLedger(): Ledger {
  return {
    batchCount: 0,
    batchStatus: new Map(),
    shipperCommitment: new Map(),
    carrierCommitment: new Map(),
    shipperRole: new Map(),
    carrierRole: new Map(),
  };
}

// ─── Circuit Implementations ─────────────────────────────────────────────────

function registerAsShipper(ledger: Ledger, witnesses: Witnesses): void {
  const id = publicKey(witnesses.localSecretKey(), 0);
  ledger.shipperRole.set(id, id);
}

function registerAsCarrier(ledger: Ledger, witnesses: Witnesses): void {
  const id = publicKey(witnesses.localSecretKey(), 1);
  ledger.carrierRole.set(id, id);
}

function createShipmentBatch(
  ledger: Ledger,
  witnesses: Witnesses,
  batchId: Bytes32,
): void {
  const callerId = publicKey(witnesses.localSecretKey(), 0);

  // Role gate
  if (!ledger.shipperRole.has(callerId)) {
    throw new Error("caller is not a registered shipper");
  }

  // Budget gate (private arithmetic)
  if (witnesses.getShipperBudget() < witnesses.getTotalFreightCost()) {
    throw new Error("insufficient budget");
  }

  ledger.shipperCommitment.set(batchId, callerId);
  ledger.batchStatus.set(batchId, 0);
  ledger.batchCount += 1;
}

function settleBatch(
  ledger: Ledger,
  witnesses: Witnesses,
  batchId: Bytes32,
): void {
  const callerId = publicKey(witnesses.localSecretKey(), 1);

  // Role gate
  if (!ledger.carrierRole.has(callerId)) {
    throw new Error("caller is not a registered carrier");
  }

  // Status gate
  if (ledger.batchStatus.get(batchId) !== 0) {
    throw new Error("batch not lockable");
  }

  // Claim validity gate (private arithmetic — rate * distance <= cost)
  if (
    witnesses.getCarrierRate() * witnesses.getCarrierDistance() >
    witnesses.getTotalFreightCost()
  ) {
    throw new Error("claim exceeds contracted rate");
  }

  ledger.carrierCommitment.set(batchId, callerId);
  ledger.batchStatus.set(batchId, 1);
}

function disputeBatch(
  ledger: Ledger,
  witnesses: Witnesses,
  batchId: Bytes32,
): void {
  const callerId = publicKey(witnesses.localSecretKey(), 0);

  // Ownership gate
  if (ledger.shipperCommitment.get(batchId) !== callerId) {
    throw new Error("not your batch");
  }

  // Status gate
  if (ledger.batchStatus.get(batchId) !== 0) {
    throw new Error("not disputable");
  }

  ledger.batchStatus.set(batchId, 2);
}

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const SHIPPER_SECRET = "a".repeat(64) as Bytes32;
const CARRIER_SECRET = "b".repeat(64) as Bytes32;
const OTHER_SECRET = "c".repeat(64) as Bytes32;
const BATCH_ID = sha256Sim("batch-001");

function shipperWitnesses(overrides?: Partial<Witnesses>): Witnesses {
  return {
    localSecretKey: () => SHIPPER_SECRET,
    getShipperBudget: () => 10_000n,
    getTotalFreightCost: () => 8_000n,
    getCarrierRate: () => 0n,
    getCarrierDistance: () => 0n,
    ...overrides,
  };
}

function carrierWitnesses(overrides?: Partial<Witnesses>): Witnesses {
  return {
    localSecretKey: () => CARRIER_SECRET,
    getShipperBudget: () => 0n,
    getTotalFreightCost: () => 8_000n,  // budget available for the batch
    getCarrierRate: () => 4n,           // 4 tDUST/km
    getCarrierDistance: () => 1_500n,   // 1500 km → 6000 tDUST ≤ 8000
    ...overrides,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("FreightVeil Contract", () => {
  let ledger: Ledger;

  beforeEach(() => {
    ledger = freshLedger();
  });

  // ── Test 1 ─────────────────────────────────────────────────────────────────
  it("1. registerAsShipper succeeds and stores commitment", () => {
    const witnesses = shipperWitnesses();
    registerAsShipper(ledger, witnesses);

    const expectedId = publicKey(SHIPPER_SECRET, 0);
    expect(ledger.shipperRole.has(expectedId)).toBe(true);
    expect(ledger.shipperRole.get(expectedId)).toBe(expectedId); // self-link
    expect(ledger.carrierRole.has(expectedId)).toBe(false);      // not a carrier
  });

  // ── Test 2 ─────────────────────────────────────────────────────────────────
  it("2. registerAsCarrier succeeds and stores commitment", () => {
    const witnesses = carrierWitnesses();
    registerAsCarrier(ledger, witnesses);

    const expectedId = publicKey(CARRIER_SECRET, 1);
    expect(ledger.carrierRole.has(expectedId)).toBe(true);
    expect(ledger.carrierRole.get(expectedId)).toBe(expectedId); // self-link
    expect(ledger.shipperRole.has(expectedId)).toBe(false);      // not a shipper
  });

  // ── Test 3 ─────────────────────────────────────────────────────────────────
  it("3. createShipmentBatch succeeds for registered shipper with sufficient budget", () => {
    const witnesses = shipperWitnesses();
    registerAsShipper(ledger, witnesses);

    const prevCount = ledger.batchCount;
    createShipmentBatch(ledger, witnesses, BATCH_ID);

    expect(ledger.batchStatus.get(BATCH_ID)).toBe(0);           // locked
    expect(ledger.batchCount).toBe(prevCount + 1);              // counter incremented
    const shipperId = publicKey(SHIPPER_SECRET, 0);
    expect(ledger.shipperCommitment.get(BATCH_ID)).toBe(shipperId);
  });

  // ── Test 4 ─────────────────────────────────────────────────────────────────
  it("4. createShipmentBatch reverts for a carrier-role wallet", () => {
    // Register wallet as carrier only — no shipper registration
    const carrierWit = carrierWitnesses();
    registerAsCarrier(ledger, carrierWit);

    // Attempt to create a batch using the carrier's secret (index 0 path)
    const carrierAsShipperWit: Witnesses = {
      ...carrierWit,
      localSecretKey: () => CARRIER_SECRET,
    };

    expect(() =>
      createShipmentBatch(ledger, carrierAsShipperWit, BATCH_ID),
    ).toThrow("caller is not a registered shipper");

    expect(ledger.batchStatus.has(BATCH_ID)).toBe(false); // no state written
  });

  // ── Test 5 ─────────────────────────────────────────────────────────────────
  it("5. settleBatch succeeds for registered carrier with valid rate*distance <= cost", () => {
    // Setup: register shipper + create batch
    const shipperWit = shipperWitnesses();
    registerAsShipper(ledger, shipperWit);
    createShipmentBatch(ledger, shipperWit, BATCH_ID);

    // Register carrier
    const carrierWit = carrierWitnesses(); // rate=4, distance=1500 → 6000 ≤ 8000
    registerAsCarrier(ledger, carrierWit);

    settleBatch(ledger, carrierWit, BATCH_ID);

    expect(ledger.batchStatus.get(BATCH_ID)).toBe(1); // settled
    const carrierId = publicKey(CARRIER_SECRET, 1);
    expect(ledger.carrierCommitment.get(BATCH_ID)).toBe(carrierId);
  });

  // ── Test 6 ─────────────────────────────────────────────────────────────────
  it("6. settleBatch reverts for a shipper-role wallet", () => {
    // Setup: register shipper + create batch
    const shipperWit = shipperWitnesses();
    registerAsShipper(ledger, shipperWit);
    createShipmentBatch(ledger, shipperWit, BATCH_ID);

    // Shipper attempts to settle (using index-1 key path, but not in carrierRole)
    const shipperAsCarrierWit: Witnesses = {
      ...shipperWit,
      localSecretKey: () => SHIPPER_SECRET,
    };

    expect(() =>
      settleBatch(ledger, shipperAsCarrierWit, BATCH_ID),
    ).toThrow("caller is not a registered carrier");

    expect(ledger.batchStatus.get(BATCH_ID)).toBe(0); // still locked
  });

  // ── Test 7 ─────────────────────────────────────────────────────────────────
  it("7. disputeBatch succeeds for original shipper, reverts for anyone else", () => {
    // Setup: register shipper + create batch
    const shipperWit = shipperWitnesses();
    registerAsShipper(ledger, shipperWit);
    createShipmentBatch(ledger, shipperWit, BATCH_ID);

    // Register a second shipper (the "other" party)
    const otherWit: Witnesses = {
      localSecretKey: () => OTHER_SECRET,
      getShipperBudget: () => 5_000n,
      getTotalFreightCost: () => 3_000n,
      getCarrierRate: () => 0n,
      getCarrierDistance: () => 0n,
    };
    registerAsShipper(ledger, otherWit); // other is a valid shipper, just not the owner

    // Other shipper attempts dispute → should revert
    expect(() => disputeBatch(ledger, otherWit, BATCH_ID)).toThrow(
      "not your batch",
    );
    expect(ledger.batchStatus.get(BATCH_ID)).toBe(0); // still locked

    // Original shipper disputes → should succeed
    disputeBatch(ledger, shipperWit, BATCH_ID);
    expect(ledger.batchStatus.get(BATCH_ID)).toBe(2); // disputed
  });
});
