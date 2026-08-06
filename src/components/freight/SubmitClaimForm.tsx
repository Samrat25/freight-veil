import { useState } from "react";
import { Loader2, Send, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFreight } from "@/lib/freight-store";

export function SubmitClaimForm() {
  const { submitClaim } = useFreight();
  const [batchId, setBatchId] = useState("");
  const [distance, setDistance] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastClaim, setLastClaim] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const claim = await submitClaim({ batchId, distanceKm: distance, agreedRate: rate });
      setLastClaim(claim.claimId);
      setBatchId("");
      setDistance("");
      setRate("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative p-6 rounded-xl bg-gradient-to-br from-[#12181F]/95 via-[#0B121A]/95 to-[#12181F]/95 border border-[#55776D]/40 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-5 overflow-hidden group hover:border-[#55776D]/70 transition-all duration-300"
    >
      {/* Glossy top sheen overlay */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />

      <div className="flex items-center justify-between border-b border-[#1B2128] pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#34D399] flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[#55776D]" /> Carrier Prover Circuit
          </span>
          <h2
            className="text-lg font-semibold text-[#EDE9DC] mt-1"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Submit Leg Claim
          </h2>
        </div>
        <div className="p-2 rounded-lg bg-[#55776D]/20 text-[#34D399] border border-[#55776D]/40">
          <Lock className="size-4" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="claimBatch" className="text-xs font-mono text-[#A9A390]">
          Target Batch ID
        </Label>
        <Input
          id="claimBatch"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          placeholder="FV-2026-XXXXXX"
          className="font-mono text-sm bg-[#0B121A]/80 border-[#2A3138] text-[#34D399]"
          required
        />
        <p className="text-[11px] text-[#8A8478]">
          Enter the ID your shipper gave you — carriers can't browse other batches.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="distance" className="text-xs font-mono text-[#A9A390]">
          Distance Traveled (km) <span className="text-[#34D399]">· Shielded ZK Private</span>
        </Label>
        <Input
          id="distance"
          type="password"
          inputMode="decimal"
          placeholder="••••"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className="font-mono bg-[#0B121A]/80 border-[#2A3138] text-[#EDE9DC]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rate" className="text-xs font-mono text-[#A9A390]">
          Agreed Rate <span className="text-[#34D399]">· Shielded ZK Private</span>
        </Label>
        <Input
          id="rate"
          type="password"
          inputMode="decimal"
          placeholder="••••"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="font-mono bg-[#0B121A]/80 border-[#2A3138] text-[#EDE9DC]"
          required
        />
        <p className="text-[11px] text-[#8A8478]">
          Both values stay in your wallet; only a cryptographic proof is submitted.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#55776D] to-[#34D399] text-[#0B121A] font-semibold hover:from-[#34D399] hover:to-[#55776D] shadow-[0_0_20px_rgba(52,211,153,0.25)] transition-all duration-300"
        disabled={submitting}
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {submitting ? "Building Compact ZK Proof…" : "Submit Claim On-Chain"}
      </Button>

      {lastClaim ? (
        <div className="p-3 rounded-lg bg-[#55776D]/20 border border-[#55776D]/40 font-mono text-xs text-[#34D399]">
          ✓ Claim {lastClaim} accepted and verified.
        </div>
      ) : null}
    </form>
  );
}
