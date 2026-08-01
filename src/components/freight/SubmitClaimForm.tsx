import { useState } from "react";
import { Loader2, Send } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="veil-panel h-fit space-y-5 p-6">
      <h2 className="text-base font-semibold">Submit leg claim</h2>

      <div className="space-y-2">
        <Label htmlFor="claimBatch">Batch ID</Label>
        <Input
          id="claimBatch"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          placeholder="FV-2026-XXXXXX"
          className="font-mono text-sm"
          required
        />
        <p className="text-xs text-muted-foreground">
          Enter the ID your shipper gave you — carriers can't browse other batches.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="distance">
          Distance traveled (km) <span className="text-primary">· private</span>
        </Label>
        <Input
          id="distance"
          type="password"
          inputMode="decimal"
          placeholder="••••"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className="font-mono"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rate">
          Agreed rate <span className="text-primary">· private</span>
        </Label>
        <Input
          id="rate"
          type="password"
          inputMode="decimal"
          placeholder="••••"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="font-mono"
          required
        />
        <p className="text-xs text-muted-foreground">
          Both values stay in your wallet; only a proof is submitted.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {submitting ? "Building proof…" : "Submit claim"}
      </Button>
      {lastClaim ? (
        <p className="font-mono text-xs text-success">Claim {lastClaim} accepted.</p>
      ) : null}
    </form>
  );
}
