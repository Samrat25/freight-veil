import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ListChecks, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/freight/RoleGate";
import { StatusBadge } from "@/components/freight/StatusBadge";
import { LiveProtocolLog } from "@/components/freight/LiveProtocolLog";
import { useFreight } from "@/lib/freight-store";

export const Route = createFileRoute("/shipper")({
  head: () => ({
    meta: [
      { title: "Shipper Dashboard — FreightVeil" },
      {
        name: "description",
        content:
          "Shipper-only console: lock private budgets, review your own shipment batches and raise disputes on Midnight.",
      },
      { property: "og:title", content: "Shipper Dashboard — FreightVeil" },
      {
        property: "og:description",
        content: "Lock funds for multi-leg shipments without publishing budgets or rates.",
      },
    ],
  }),
  component: () => (
    <RoleGate requires="shipper">
      <ShipperDashboard />
    </RoleGate>
  ),
});

function ShipperDashboard() {
  const { myBatches } = useFreight();
  const count = (status: string) => myBatches.filter((b) => b.status === status).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Shipper dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Scoped to your session identity. Carrier claim submissions are never visible here — only
          the aggregate proof the contract verifies.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Your batches" value={String(myBatches.length)} />
            <Stat label="Locked" value={String(count("locked"))} />
            <Stat label="Settled" value={String(count("settled"))} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Action to="/create-batch" icon={<Plus className="size-4" />} label="Create Batch" blurb="Lock a private budget for a new multi-leg shipment." />
            <Action to="/my-shipments" icon={<ListChecks className="size-4" />} label="My Shipments" blurb="Track status and settle or dispute your own batches." />
            <Action to="/explorer" icon={<Eye className="size-4" />} label="Public Ledger" blurb="See exactly what an outside observer can read." />
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-semibold">Recent activity</h2>
            {myBatches.slice(0, 4).map((batch) => (
              <div key={batch.batchId} className="veil-panel flex flex-wrap items-center gap-4 p-4">
                <span className="font-mono text-sm text-primary">{batch.batchId}</span>
                <StatusBadge status={batch.status} />
                <span className="ml-auto text-xs text-muted-foreground">
                  {batch.carrierCount} carrier(s)
                </span>
              </div>
            ))}
            {myBatches.length === 0 ? (
              <p className="veil-panel p-6 text-sm text-muted-foreground">No batches yet.</p>
            ) : null}
          </section>
        </div>

        {/* Live Protocol Log Side Panel (1 col) */}
        <div className="lg:col-span-1">
          <LiveProtocolLog />
        </div>
      </div>
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
