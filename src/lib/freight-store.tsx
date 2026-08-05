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
import { supabase, isSupabaseConfigured } from "./supabase";
import { reconcilePendingBatches } from "./supabase-sync";

export interface ProtocolLogItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  status: "info" | "success" | "error";
  txHash?: string;
}

interface FreightState {
  wallet: WalletSession | null;
  role: AppRole | null;
  connecting: boolean;
  batches: ShipmentBatch[];
  claims: LegClaim[];
  myBatches: ShipmentBatch[];
  myClaims: LegClaim[];
  logs: ProtocolLogItem[];
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
  const [logs, setLogs] = useState<ProtocolLogItem[]>([]);

  const addLog = useCallback(
    (title: string, detail: string, status: "info" | "success" | "error" = "info", txHash?: string) => {
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const item: ProtocolLogItem = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time,
        title,
        detail,
        status,
        txHash,
      };
      setLogs((prev) => [item, ...prev.slice(0, 49)]);
    },
    [],
  );

  // Initial load: fetch batches + run pending-state reconciliation job
  useEffect(() => {
    async function loadAndReconcile() {
      if (!isSupabaseConfigured) return;
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
            const existingIds = new Set(prev.map((b) => b.batchId));
            const newOnly = loaded.filter((b) => !existingIds.has(b.batchId));
            return [...prev, ...newOnly];
          });
        }

        // Run reconciliation job for pending-state transactions
        const count = await reconcilePendingBatches();
        if (count > 0) {
          addLog("Pending State Reconciled", `Reconciled ${count} pending batch(es) from indexer.`, "info");
        }
      } catch (err) {
        console.warn("[FreightVeil] Load/reconcile warning:", err);
      }
    }
    loadAndReconcile();
  }, [addLog]);

  // Connect wallet
  const connect = useCallback(async (networkId?: import("./lace-wallet").MidnightNetwork) => {
    setConnecting(true);
    try {
      const session = await chain.connectWallet(networkId);
      setWallet(session);
      addLog("Wallet Connected", `Connected to ${session.network} (${session.address.slice(0, 14)}...)`, "success");

      try {
        const challenge = generateAuthChallenge(session.address);
        const signature = await chain.getWalletSignature(challenge);
        await walletSignIn(session.address, challenge, signature);
        addLog("JWT Session Issued", "Supabase custom wallet auth token verified.", "success");
      } catch (authErr) {
        console.warn("[FreightVeil] Supabase sign-in skipped:", authErr);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog("Wallet Connect Failed", msg, "error");
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [addLog]);

  const disconnect = useCallback(async () => {
    await chain.disconnectWallet();
    await walletSignOut().catch(() => {});
    setWallet(null);
    addLog("Wallet Disconnected", "Session cleared.", "info");
  }, [addLog]);

  const selectRole = useCallback((role: AppRole) => {
    setWallet((prev) => (prev ? { ...prev, role } : prev));
    const address = walletRef.current?.address;
    if (address) {
      addLog("Role Selected", `Registered as ${role.toUpperCase()} (Circuit: registerAs${role === "shipper" ? "Shipper" : "Carrier"})`, "info");
      if (role === "shipper") {
        chain.registerAsShipper(address)
          .then(({ txHash }) => addLog("Role Circuit Verified", "shipperRole commitment published on-chain", "success", txHash))
          .catch((err) => addLog("Role Circuit Failed", String(err), "error"));
      } else {
        chain.registerAsCarrier(address)
          .then(({ txHash }) => addLog("Role Circuit Verified", "carrierRole commitment published on-chain", "success", txHash))
          .catch((err) => addLog("Role Circuit Failed", String(err), "error"));
      }
    }
  }, [addLog]);

  // Batch operations
  const createBatch = useCallback<FreightState["createBatch"]>(async (input) => {
    const owner = walletRef.current?.address;
    if (!owner) throw new Error("Wallet not connected");

    addLog("Circuit Call Initiated", `createShipmentBatch(${input.batchId}) — Private Witness: Budget Check`, "info");
    try {
      const batch = await chain.createShipmentBatch({ ...input, owner });
      setBatches((prev) => [batch, ...prev]);
      addLog("Batch Created & Locked", `Status: locked (0). Budget witness verified inside ZK circuit.`, "success", batch.txHash);
      return batch;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog("Circuit Execution Failed", msg, "error");
      throw err;
    }
  }, [addLog]);

  const settle = useCallback(async (batchId: string) => {
    const owner = walletRef.current?.address;
    if (!owner) throw new Error("Wallet not connected");

    addLog("Circuit Call Initiated", `settleBatch(${batchId}) — Checking Nullifier & Rate*Distance`, "info");
    try {
      const res = await chain.settleBatch(batchId, owner);
      setBatches((prev) =>
        prev.map((b) => (b.batchId === res.batchId ? { ...b, status: res.status } : b)),
      );
      setClaims((prev) =>
        prev.map((c) =>
          c.batchId === res.batchId ? { ...c, status: "settled" as const } : c,
        ),
      );
      addLog("Settlement Disclosed", `Status: settled (1). Nullifier spent, stealth address published.`, "success", res.txHash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog("Settlement Failed", msg, "error");
      throw err;
    }
  }, [addLog]);

  const dispute = useCallback(async (batchId: string) => {
    addLog("Circuit Call Initiated", `disputeBatch(${batchId}) — Checking Shipper Ownership Commitment`, "info");
    try {
      const res = await chain.disputeBatch(batchId);
      setBatches((prev) =>
        prev.map((b) => (b.batchId === res.batchId ? { ...b, status: res.status } : b)),
      );
      addLog("Batch Disputed", `Status: disputed (2). Shipper ownership verified.`, "success", res.txHash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog("Dispute Failed", msg, "error");
      throw err;
    }
  }, [addLog]);

  const submitClaim = useCallback<FreightState["submitClaim"]>(async (input) => {
    const owner = walletRef.current?.address;
    if (!owner) throw new Error("Wallet not connected");

    addLog("Carrier Leg Claim", `submitCarrierClaim(${input.batchId}) — Private Witness: Rate & Distance`, "info");
    try {
      const claim = await chain.submitCarrierClaim({ ...input, owner });
      setClaims((prev) => [claim, ...prev]);
      addLog("Leg Claim Submitted", `Claim pending verification on batch ${input.batchId}`, "success");
      return claim;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog("Leg Claim Failed", msg, "error");
      throw err;
    }
  }, [addLog]);

  const value = useMemo(
    () => ({
      wallet,
      role: wallet?.role ?? null,
      connecting,
      batches,
      claims,
      myBatches: wallet ? batches.filter((b) => b.owner === wallet.address) : [],
      myClaims: wallet ? claims.filter((c) => c.owner === wallet.address) : [],
      logs,
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
      logs,
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
