import { useState } from "react";
import { Loader2, ShieldCheck, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMidnight } from "@/hooks/useMidnight";

interface CircuitCallProps {
  circuitName?: "registerAsShipper" | "registerAsCarrier" | "createShipmentBatch" | "settleBatch" | "disputeBatch";
  batchId?: string;
  privateBudget?: string;
  privateRate?: string;
  privateDistance?: string;
  onSuccess?: (txHash: string) => void;
}

export function CircuitCall({
  circuitName = "createShipmentBatch",
  batchId = "FV-2026-PREPROD01",
  privateBudget,
  privateRate,
  privateDistance,
  onSuccess,
}: CircuitCallProps) {
  const { connected, connect, callCircuit } = useMidnight();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCallCircuit = async () => {
    if (!connected) {
      await connect();
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Execute circuit with local witness proof generation
      const result = await callCircuit(
        circuitName,
        { batchId, carrierCount: 1 },
        {
          // Private witnesses stay local inside ZK proof generation and are NEVER rendered in UI
          getShipperBudget: privateBudget,
          getCarrierRate: privateRate,
          getCarrierDistance: privateDistance,
        },
      );

      setTxHash(result.txHash);
      if (onSuccess) onSuccess(result.txHash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Circuit call failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Execute Circuit: <code className="font-mono text-primary">{circuitName}</code>
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Proves circuit constraints locally via Midnight ZK proof engine.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="size-4" />
          <span>Proved without revealing your input</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Button
          onClick={handleCallCircuit}
          disabled={loading}
          className="w-full font-medium"
          variant="default"
          id="circuit-call-button"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Generating ZK Proof locally & submitting to Midnight...
            </>
          ) : (
            <>
              <Lock className="mr-2 size-4" />
              {connected ? `Call ${circuitName}` : "Connect Wallet & Execute Circuit"}
            </>
          )}
        </Button>

        {/* Loading state indicator */}
        {loading && (
          <div className="rounded-md border border-primary/20 bg-background/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-primary">⚡ Local Witness Proof Generation</p>
            <p className="mt-1">
              Private input (budget, rate, distance) is being verified inside your browser ZK circuit.
              Zero private data leaves this device.
            </p>
          </div>
        )}

        {/* Success Transaction Result Display */}
        {txHash && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span>Transaction Submitted On-Chain!</span>
            </div>
            <p className="mt-1 font-mono break-all text-[11px] text-emerald-200">
              Tx Hash: {txHash}
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-emerald-500/20 pt-2 text-[11px] text-emerald-400 font-medium">
              <span>Status: Verified & Committed</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300 font-mono">
                Proved without revealing your input
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <div className="flex items-center gap-1.5 font-semibold text-red-400">
              <AlertCircle className="size-4" />
              <span>Transaction Failed</span>
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
