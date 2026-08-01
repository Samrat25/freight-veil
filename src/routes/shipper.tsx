import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/freight/StatusBadge";
import { Confidential } from "@/components/freight/Confidential";
import { useFreight, formatTimestamp } from "@/lib/freight-store";
import { generateBatchId } from "@/lib/midnight-api";

export const Route = createFileRoute("/shipper")({
  head: () => ({
    meta: [
      { title: "Shipper Console — FreightVeil" },
      {
        name: "description",
        content:
          "Create shipment batches with a private budget, track locked, settled and disputed batches, and trigger on-chain settlement.",
      },
      { property: "og:title", content: "Shipper Console — FreightVeil" },
      {
        property: "og:description",
        content: "Lock funds for multi-leg shipments without publishing budgets or rates.",
      },
    ],
  }),
  component: ShipperPage,
});

function ShipperPage() {
  const { batches, createBatch, settle, dispute } = useFreight();
  const [batchId, setBatchId] = useState("");
  const [budget, setBudget] = useState("");
  const [legs, setLegs] = useState("3");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setBatchId(generateBatchId()), []);

  const selectedBatch = batches.find((b) => b.batchId === selected) ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!budget || creating) return;
    setCreating(true);
    setNotice(null);
    try {
      const batch = await createBatch({
        batchId,
        totalBudget: budget,
        carrierCount: Math.max(1, Number(legs) || 1),
      });
      setBudget("");
      setBatchId(generateBatchId());
      setSelected(batch.batchId);
      setNotice("Batch locked on-chain. Budget discarded from this device.");
    } finally {
      setCreating(false);
    }
  }

  async function run(action: () => Promise<void>, id: string) {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Shipper console</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lock a budget for a multi-leg shipment. The amount is a private input — it is never shown
          again after submit.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={handleCreate} className="veil-panel h-fit space-y-5 p-6">
          <h2 className="text-base font-semibold">Create shipment batch</h2>

          <div className="space-y-2">
            <Label htmlFor="batchId">Batch ID</Label>
            <div className="flex gap-2">
              <Input id="batchId" value={batchId} readOnly className="font-mono text-sm" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Regenerate batch ID"
                onClick={() => setBatchId(generateBatchId())}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">
              Total budget <span className="text-primary">· private</span>
            </Label>
            <Input
              id="budget"
              type="password"
              inputMode="decimal"
              placeholder="••••••"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="font-mono"
              required
            />
            <p className="text-xs text-muted-foreground">
              Sent as a shielded witness. Not stored, not displayed, not published.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legs">Number of carrier legs</Label>
            <Input
              id="legs"
              type="number"
              min={1}
              max={40}
              value={legs}
              onChange={(e) => setLegs(e.target.value)}
              className="font-mono"
            />
          </div>

          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {creating ? "Generating proof & locking…" : "Lock batch"}
          </Button>
          {notice ? <p className="text-xs text-success">{notice}</p> : null}
        </form>

        <section className="space-y-4">
          <h2 className="text-base font-semibold">Your batches</h2>
          <ul className="space-y-3">
            {batches.map((batch) => (
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
                      <Confidential
                        label="Per-carrier rates"
                        note="Each leg is proven in isolation."
                      />
                    </div>

                    <Field label="Budget commitment" value={batch.budgetCommitment} mono />

                    {batch.status === "locked" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === batch.batchId}
                          onClick={() => run(() => settle(batch.batchId), batch.batchId)}
                        >
                          {busyId === batch.batchId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
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
          {selectedBatch === null && batches.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Select a batch to inspect its public fields.
            </p>
          ) : null}
        </section>
      </div>
    </div>
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
