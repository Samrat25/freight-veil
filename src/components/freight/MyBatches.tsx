import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Confidential } from "./Confidential";
import { useFreight, formatTimestamp } from "@/lib/freight-store";

export function MyBatches() {
  const { myBatches, settle, dispute } = useFreight();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  async function run(action: () => Promise<void>, id: string) {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  }

  if (myBatches.length === 0) {
    return (
      <p className="veil-panel p-6 text-sm text-muted-foreground">
        You haven't locked any batches with this identity yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {myBatches.map((batch) => (
        <li key={batch.batchId}>
          <button
            type="button"
            onClick={() => setSelected(selected === batch.batchId ? null : batch.batchId)}
            className={`veil-panel flex w-full flex-wrap items-center gap-4 p-4 text-left transition-colors hover:border-primary/40 ${
              selected === batch.batchId ? "border-primary/60" : ""
            }`}
          >
            <span className="font-mono text-sm text-primary">{batch.batchId}</span>
            <StatusBadge status={batch.status} />
            <span className="ml-auto text-xs text-muted-foreground">
              {batch.carrierCount} carriers · {formatTimestamp(batch.createdAt)}
            </span>
          </button>

          {selected === batch.batchId ? (
            <div className="veil-panel mt-2 space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Batch ID" value={batch.batchId} mono />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge status={batch.status} />
                  </div>
                </div>
                <Field label="Timestamp" value={formatTimestamp(batch.createdAt)} mono />
                <Field label="Carrier count" value={String(batch.carrierCount)} mono />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Confidential label="Total budget" note="Known only to the contract." />
                <Confidential label="Carrier claim details" note="Never exposed to shippers." />
              </div>

              <Field label="Budget commitment" value={batch.budgetCommitment} mono />

              {batch.status === "locked" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === batch.batchId}
                    onClick={() => run(() => settle(batch.batchId), batch.batchId)}
                  >
                    {busyId === batch.batchId ? <Loader2 className="size-4 animate-spin" /> : null}
                    {busyId === batch.batchId ? "Settling…" : "Settle batch"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === batch.batchId}
                    onClick={() => run(() => dispute(batch.batchId), batch.batchId)}
                  >
                    Flag dispute
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-1.5 break-all text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
