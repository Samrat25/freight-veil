import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Plus, Lock, ShieldCheck } from "lucide-react";
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
    <form
      onSubmit={handleCreate}
      className="relative p-6 rounded-xl bg-gradient-to-br from-[#12181F]/95 via-[#0B121A]/95 to-[#12181F]/95 border border-[#9C8552]/40 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-5 overflow-hidden group hover:border-[#9C8552]/70 transition-all duration-300"
    >
      {/* Glossy top sheen overlay */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />

      <div className="flex items-center justify-between border-b border-[#1B2128] pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#D4AF37] flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[#55776D]" /> Escrow Batcher Circuit
          </span>
          <h2
            className="text-lg font-semibold text-[#EDE9DC] mt-1"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Lock Shipment Escrow Batch
          </h2>
        </div>
        <div className="p-2 rounded-lg bg-[#9C8552]/15 text-[#D4AF37] border border-[#9C8552]/30">
          <Lock className="size-4" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="batchId" className="text-xs font-mono text-[#A9A390]">
          Batch ID <span className="text-[#6B7178]">(Public Witness)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="batchId"
            value={batchId}
            readOnly
            className="font-mono text-sm bg-[#0B121A]/80 border-[#2A3138] text-[#D4AF37]"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Regenerate batch ID"
            onClick={() => setBatchId(generateBatchId())}
            className="border-[#2A3138] hover:border-[#9C8552]/50 hover:bg-[#1B2128]"
          >
            <RefreshCw className="size-4 text-[#9C8552]" />
          </Button>
        </div>
        <p className="text-[11px] text-[#8A8478]">
          Share this ID with your carriers — they file claims against it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget" className="text-xs font-mono text-[#A9A390]">
          Total Budget <span className="text-[#34D399]">· Shielded ZK Witness</span>
        </Label>
        <Input
          id="budget"
          type="password"
          inputMode="decimal"
          placeholder="••••••"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="font-mono bg-[#0B121A]/80 border-[#2A3138] text-[#EDE9DC] focus:border-[#9C8552]"
          required
        />
        <p className="text-[11px] text-[#8A8478]">
          Sent as a shielded witness. Not stored, not displayed, never visible to carriers.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="legs" className="text-xs font-mono text-[#A9A390]">
          Number of Carrier Legs
        </Label>
        <Input
          id="legs"
          type="number"
          min={1}
          max={40}
          value={legs}
          onChange={(e) => setLegs(e.target.value)}
          className="font-mono bg-[#0B121A]/80 border-[#2A3138] text-[#EDE9DC]"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#9C8552] to-[#B89C5D] text-[#0B121A] font-semibold hover:from-[#B89C5D] hover:to-[#D4AF37] shadow-[0_0_20px_rgba(156,133,82,0.3)] transition-all duration-300"
        disabled={creating}
      >
        {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        {creating ? "Generating proof & locking…" : "Lock Batch on Midnight"}
      </Button>

      {notice ? (
        <div className="p-3 rounded-lg bg-[#55776D]/15 border border-[#55776D]/40 font-mono text-xs text-[#34D399]">
          ✓ {notice}
        </div>
      ) : null}
    </form>
  );
}
