import { CheckCircle2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Confidential } from "./Confidential";
import { useFreight, formatTimestamp } from "@/lib/freight-store";

export function MyClaims({ showPayouts = true }: { showPayouts?: boolean }) {
  const { myClaims } = useFreight();
  const settled = myClaims.filter((c) => c.status === "settled");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Submitted claims</h2>
        <ul className="space-y-3">
          {myClaims.map((claim) => (
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
          {myClaims.length === 0 ? (
            <li className="veil-panel p-6 text-sm text-muted-foreground">
              No claims filed with this identity yet.
            </li>
          ) : null}
        </ul>
      </section>

      {showPayouts ? (
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
      ) : null}
    </div>
  );
}
