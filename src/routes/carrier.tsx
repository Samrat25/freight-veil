import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/freight/StatusBadge";
import { Confidential } from "@/components/freight/Confidential";
import { useFreight, formatTimestamp } from "@/lib/freight-store";

export const Route = createFileRoute("/carrier")({
  head: () => ({
    meta: [
      { title: "Carrier Console — FreightVeil" },
      {
        name: "description",
        content:
          "Submit leg claims with private distance and agreed rate, track claim status, and confirm settled payouts without exposing amounts.",
      },
      { property: "og:title", content: "Carrier Console — FreightVeil" },
      {
        property: "og:description",
        content: "File shielded leg claims and confirm payouts — amounts stay private.",
      },
    ],
  }),
  component: CarrierPage,
});

function CarrierPage() {
  const { claims, submitClaim } = useFreight();
  const [batchId, setBatchId] = useState("");
  const [distance, setDistance] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastClaim, setLastClaim] = useState<string | null>(null);

  const settled = claims.filter((c) => c.status === "settled");

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
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Carrier console</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          File a leg claim. Distance and agreed rate are private inputs proven against the batch
          contract — never shared with the shipper's other carriers.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
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

        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Submitted claims</h2>
            <ul className="space-y-3">
              {claims.map((claim) => (
                <li key={claim.claimId} className="veil-panel p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm text-primary">{claim.claimId}</span>
                    <StatusBadge status={claim.status} />
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {claim.batchId}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-muted-foreground/80">
                    {formatTimestamp(claim.submittedAt)} · commitment {claim.claimCommitment}
                  </p>
                  <div className="mt-3">
                    <Confidential label="Distance & agreed rate" />
                  </div>
                </li>
              ))}
              {claims.length === 0 ? (
                <li className="veil-panel p-6 text-sm text-muted-foreground">No claims yet.</li>
              ) : null}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold">Payout confirmations</h2>
            {settled.length === 0 ? (
              <p className="veil-panel p-6 text-sm text-muted-foreground">
                No settled legs yet. Confirmations appear here once the batch clears.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {settled.map((claim) => (
                  <li key={claim.claimId} className="veil-panel p-5">
                    <span className="flex size-9 items-center justify-center rounded-md bg-success/12 text-success">
                      <CheckCircle2 className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-base font-semibold text-success">Payout settled</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {claim.claimId} · {claim.batchId}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Amount is intentionally not displayed — verify it in your wallet balance.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
