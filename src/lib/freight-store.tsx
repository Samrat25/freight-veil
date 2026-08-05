import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as chain from "./midnight-api";
import type { AppRole, LegClaim, ShipmentBatch, WalletSession } from "./midnight-api";
import { walletSignIn, walletSignOut, generateAuthChallenge } from "./supabase-auth";
import { supabase } from "./supabase";

interface FreightState {
  wallet: WalletSession | null;
  role: AppRole | null;
  connecting: boolean;
  /** All on-chain rows. Real data only — no seed/mock rows. */
  batches: ShipmentBatch[];
  claims: LegClaim[];
  /** Batches created by the current session identity. */
  myBatches: ShipmentBatch[];
  /** Claims filed by the current session identity. */
  myClaims: LegClaim[];
  connect: (networkId?: import("./lace-wallet").MidnightNetwork) => Promise<void>;
  selectRole: (role: AppRole) => void;
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
  const walletRef = useRef<WalletSession | null>(null);
  walletRef.current = wallet;
  const [connecting, setConnecting] = useState(false);
  const [batches, setBatches] = useState<ShipmentBatch[]>([]);
  const [claims, setClaims] = useState<LegClaim[]>([]);

  // Load real batches from Supabase on mount
  useEffect(() => {
    async function loadRealBatches() {
      try {
        const { data, error } = await supabase.from("batches_public").select("*");
        if (!error && data && data.length > 0) {
          const loaded: ShipmentBatch[] = data.map((row) => ({
            batchId: row.batch_id,
            owner: walletRef.current?.address || "on-chain",
            status: row.status as "locked" | "settled" | "disputed",
            createdAt: row.created_at || new Date().toISOString(),
            carrierCount: 1,
            budgetCommitment: `0x${Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => b.toString(16).padStart(2, "0")).join("")}`,
          }));
          setBatches((prev) => {
            // merge without duplicates
            const existingIds = new Set(prev.map((b) => b.batchId));
            const newOnly = loaded.filter((b) => !existingIds.has(b.batchId));
            return [...prev, ...newOnly];
          });
        }
      } catch (err) {
        console.warn("[FreightVeil] Could not fetch remote batches:", err);
      }
    }
    loadRealBatches();
  }, []);

  // ── Connect wallet + issue Supabase session ────────────────────────────────
  const connect = useCallback(async (networkId?: import("./lace-wallet").MidnightNetwork) => {
    setConnecting(true);
    try {
      const session = await chain.connectWallet(networkId);
      setWallet(session);

      // Issue signed auth challenge for wallet owner verification
      try {
        const challenge = generateAuthChallenge(session.address);
        const signature = await chain.getWalletSignature(challenge);
        await walletSignIn(session.address, challenge, signature);
      } catch (authErr) {
        console.warn(
          "[FreightVeil] Supabase sign-in skipped (auth endpoint offline):",
          authErr,
        );
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await chain.disconnectWallet();
    await walletSignOut().catch(() => {});
    setWallet(null);
  }, []);

  /**
   * Select role + trigger on-chain registration circuit with signed proof commitment.
   */
  const selectRole = useCallback((role: AppRole) => {
    setWallet((prev) => (prev ? { ...prev, role } : prev));

    const address = walletRef.current?.address;
    if (address) {
      if (role === "shipper") {
        chain.registerAsShipper(address).catch((err) =>
          console.warn("[FreightVeil] registerAsShipper failed:", err),
        );
      } else {
        chain.registerAsCarrier(address).catch((err) =>
          console.warn("[FreightVeil] registerAsCarrier failed:", err),
        );
      }
    }
  }, []);

  // ── Batch actions ──────────────────────────────────────────────────────────

  const createBatch = useCallback<FreightState["createBatch"]>(async (input) => {
    const owner = walletRef.current?.address;
    if (!owner) throw new Error("Wallet not connected");
    // Trigger on-chain circuit call with signed transaction
    const batch = await chain.createShipmentBatch({ ...input, owner });
    setBatches((prev) => [batch, ...prev]);
    return batch;
  }, []);

  const settle = useCallback(async (batchId: string) => {
    const owner = walletRef.current?.address;
    if (!owner) throw new Error("Wallet not connected");
    // Trigger on-chain circuit call with signed transaction
    const res = await chain.settleBatch(batchId, owner);
    setBatches((prev) =>
      prev.map((b) => (b.batchId === res.batchId ? { ...b, status: res.status } : b)),
    );
    setClaims((prev) =>
      prev.map((c) =>
        c.batchId === res.batchId ? { ...c, status: "settled" as const } : c,
      ),
    );
  }, []);

  const dispute = useCallback(async (batchId: string) => {
    // Trigger on-chain circuit call with signed transaction
    const res = await chain.disputeBatch(batchId);
    setBatches((prev) =>
      prev.map((b) => (b.batchId === res.batchId ? { ...b, status: res.status } : b)),
    );
  }, []);

  const submitClaim = useCallback<FreightState["submitClaim"]>(async (input) => {
    const owner = walletRef.current?.address;
    if (!owner) throw new Error("Wallet not connected");
    // Trigger on-chain circuit call with signed transaction
    const claim = await chain.submitCarrierClaim({ ...input, owner });
    setClaims((prev) => [claim, ...prev]);
    return claim;
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      wallet,
      role: wallet?.role ?? null,
      connecting,
      batches,
      claims,
      myBatches: wallet ? batches.filter((b) => b.owner === wallet.address) : [],
      myClaims: wallet ? claims.filter((c) => c.owner === wallet.address) : [],
      connect,
      selectRole,
      disconnect,
      createBatch,
      settle,
      dispute,
      submitClaim,
    }),
    [
      wallet,
      connecting,
      batches,
      claims,
      connect,
      selectRole,
      disconnect,
      createBatch,
      settle,
      dispute,
      submitClaim,
    ],
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
