import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import * as chain from "./midnight-api";
import type { LegClaim, ShipmentBatch, WalletSession } from "./midnight-api";

const seedBatches: ShipmentBatch[] = [
  {
    batchId: "FV-2026-8A31C4",
    status: "settled",
    createdAt: "2026-07-14T09:24:00.000Z",
    carrierCount: 4,
    budgetCommitment: "0x9f31c0aa47be2d5518c7a0e6b41d9f27c8ea5d13",
  },
  {
    batchId: "FV-2026-2D77F0",
    status: "locked",
    createdAt: "2026-07-22T16:02:00.000Z",
    carrierCount: 7,
    budgetCommitment: "0x41b7e9d2c6035fa881de47cc90b23f6a15e8d704",
  },
  {
    batchId: "FV-2026-B10E93",
    status: "disputed",
    createdAt: "2026-07-29T11:47:00.000Z",
    carrierCount: 3,
    budgetCommitment: "0x77ac1de50934b8f2610ca7d3e825bb4f09d6172e",
  },
];

const seedClaims: LegClaim[] = [
  {
    claimId: "LEG-4C1A9",
    batchId: "FV-2026-8A31C4",
    status: "settled",
    submittedAt: "2026-07-14T12:10:00.000Z",
    claimCommitment: "0x2ba5710fe8c94d3617ab0e52cc7f81d940e3a6b2",
  },
  {
    claimId: "LEG-9D02F",
    batchId: "FV-2026-2D77F0",
    status: "verified",
    submittedAt: "2026-07-23T08:35:00.000Z",
    claimCommitment: "0x5e08cc12ba7943df60a1e37bb2495c8d017fa6e3",
  },
];

interface FreightState {
  wallet: WalletSession | null;
  connecting: boolean;
  batches: ShipmentBatch[];
  claims: LegClaim[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  createBatch: (input: {
    batchId: string;
    totalBudget: string;
    carrierCount: number;
  }) => Promise<ShipmentBatch>;
  settle: (batchId: string) => Promise<void>;
  dispute: (batchId: string) => Promise<void>;
  submitClaim: (input: {
    batchId: string;
    distanceKm: string;
    agreedRate: string;
  }) => Promise<LegClaim>;
}

const FreightContext = createContext<FreightState | null>(null);

export function FreightProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [batches, setBatches] = useState<ShipmentBatch[]>(seedBatches);
  const [claims, setClaims] = useState<LegClaim[]>(seedClaims);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      setWallet(await chain.connectWallet());
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await chain.disconnectWallet();
    setWallet(null);
  }, []);

  const createBatch = useCallback<FreightState["createBatch"]>(async (input) => {
    const batch = await chain.createShipmentBatch(input);
    setBatches((prev) => [batch, ...prev]);
    return batch;
  }, []);

  const settle = useCallback(async (batchId: string) => {
    const res = await chain.settleBatch(batchId);
    setBatches((prev) =>
      prev.map((b) => (b.batchId === res.batchId ? { ...b, status: res.status } : b)),
    );
    setClaims((prev) =>
      prev.map((c) => (c.batchId === res.batchId ? { ...c, status: "settled" as const } : c)),
    );
  }, []);

  const dispute = useCallback(async (batchId: string) => {
    const res = await chain.disputeBatch(batchId);
    setBatches((prev) =>
      prev.map((b) => (b.batchId === res.batchId ? { ...b, status: res.status } : b)),
    );
  }, []);

  const submitClaim = useCallback<FreightState["submitClaim"]>(async (input) => {
    const claim = await chain.submitCarrierClaim(input);
    setClaims((prev) => [claim, ...prev]);
    return claim;
  }, []);

  const value = useMemo(
    () => ({
      wallet,
      connecting,
      batches,
      claims,
      connect,
      disconnect,
      createBatch,
      settle,
      dispute,
      submitClaim,
    }),
    [wallet, connecting, batches, claims, connect, disconnect, createBatch, settle, dispute, submitClaim],
  );

  return <FreightContext.Provider value={value}>{children}</FreightContext.Provider>;
}

export function useFreight() {
  const ctx = useContext(FreightContext);
  if (!ctx) throw new Error("useFreight must be used inside FreightProvider");
  return ctx;
}

export function formatTimestamp(iso: string) {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
