import { createFileRoute, Link } from "@tanstack/react-router";
import { Send, ListChecks, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/freight/RoleGate";
import { StatusBadge } from "@/components/freight/StatusBadge";
import { useFreight } from "@/lib/freight-store";

export const Route = createFileRoute("/carrier")({
  head: () => ({
    meta: [
      { title: "Carrier Dashboard — FreightVeil" },
      {
        name: "description",
        content:
          "Carrier-only console: file shielded leg claims against a batch ID and confirm settled payouts without exposing rates.",
      },
      { property: "og:title", content: "Carrier Dashboard — FreightVeil" },
      {
        property: "og:description",
        content: "File shielded leg claims and confirm payouts — amounts stay private.",
      },
    ],
  }),
  component: () => (
    <RoleGate requires="carrier">
      <CarrierDashboard />
    </RoleGate>
  ),
});

function CarrierDashboard() {
  const { myClaims } = useFreight();
  const count = (status: string) => myClaims.filter((c) => c.status === status).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Carrier dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Scoped to your session identity. You never see the shipper's total budget or any other
          carrier's rate.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Your claims" value={String(myClaims.length)} />
        <Stat label="Awaiting proof check" value={String(count("pending") + count("verified"))} />
        <Stat label="Settled" value={String(count("settled"))} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Action to="/submit-claim" icon={<Send className="size-4" />} label="Submit Claim" blurb="File a leg claim against a batch ID your shipper gave you." />
        <Action to="/my-claims" icon={<ListChecks className="size-4" />} label="My Claims" blurb="Track your claims and payout confirmations." />
        <Action to="/explorer" icon={<Eye className="size-4" />} label="Public Ledger" blurb="See exactly what an outside observer can read." />
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="text-base font-semibold">Recent activity</h2>
        {myClaims.slice(0, 3).map((claim) => (
          <div key={claim.claimId} className="veil-panel flex flex-wrap items-center gap-4 p-4">
            <span className="font-mono text-sm text-primary">{claim.claimId}</span>
            <StatusBadge status={claim.status} />
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {claim.batchId}
            </span>
          </div>
        ))}
        {myClaims.length === 0 ? (
          <p className="veil-panel p-6 text-sm text-muted-foreground">No claims yet.</p>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="veil-panel p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl">{value}</p>
    </div>
  );
}

function Action({
  to,
  icon,
  label,
  blurb,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  blurb: string;
}) {
  return (
    <div className="veil-panel flex flex-col gap-3 p-5">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{blurb}</p>
      <Button asChild size="sm" variant="secondary" className="mt-auto w-fit">
        <Link to={to}>
          {icon}
          {label}
        </Link>
      </Button>
    </div>
  );
}
