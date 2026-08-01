import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFreight } from "@/lib/freight-store";
import { generateBatchId } from "@/lib/midnight-api";

export function CreateBatchForm() {
  const { createBatch } = useFreight();
  const [batchId, setBatchId] = useState("");
  const [budget, setBudget] = useState("");
  const [legs, setLegs] = useState("3");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setBatchId(generateBatchId()), []);

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
      setNotice(`Batch ${batch.batchId} locked on-chain. Budget discarded from this device.`);
    } finally {
      setCreating(false);
    }
  }

  return (
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
        <p className="text-xs text-muted-foreground">
          Share this ID with your carriers — they file claims against it.
        </p>
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
          Sent as a shielded witness. Not stored, not displayed, never visible to carriers.
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
      {notice ? <p className="font-mono text-xs text-success">{notice}</p> : null}
    </form>
  );
}
