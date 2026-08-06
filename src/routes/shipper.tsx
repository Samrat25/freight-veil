import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ListChecks, Eye, ShieldCheck, Box, CheckCircle } from "lucide-react";
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
    <div className="mx-auto max-w-6xl px-6 py-12 relative z-10 space-y-8">
      {/* Header */}
      <header className="border-b border-[#1B2128] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="size-2 rounded-full bg-[#9C8552] animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#9C8552]">
            Shipper Console · Active Session
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDE9DC]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Shipper Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A9A390] leading-relaxed">
          Scoped to your session identity. Carrier claim submissions are never visible here — only
          the aggregate proof the Midnight contract verifies.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Bar */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Your Batches" value={String(myBatches.length)} icon={<Box className="size-4 text-[#9C8552]" />} />
            <Stat label="Locked Escrow" value={String(count("locked"))} icon={<ShieldCheck className="size-4 text-[#55776D]" />} />
            <Stat label="Settled Batches" value={String(count("settled"))} icon={<CheckCircle className="size-4 text-[#34D399]" />} />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Action
              to="/create-batch"
              icon={<Plus className="size-4 text-[#D4AF37]" />}
              label="Create Batch"
              blurb="Lock a private budget for a new multi-leg shipment."
            />
            <Action
              to="/my-shipments"
              icon={<ListChecks className="size-4 text-[#55776D]" />}
              label="My Shipments"
              blurb="Track status and settle or dispute your own batches."
            />
            <Action
              to="/explorer"
              icon={<Eye className="size-4 text-[#9C8552]" />}
              label="Public Ledger"
              blurb="See exactly what an outside observer can read."
            />
          </div>

          {/* Recent Activity Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-semibold text-[#EDE9DC]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Recent Batches
              </h2>
              <Link
                to="/my-shipments"
                className="text-xs font-mono text-[#9C8552] hover:underline"
              >
                View all →
              </Link>
            </div>

            {myBatches.slice(0, 4).map((batch) => (
              <div
                key={batch.batchId}
                className="group flex flex-wrap items-center gap-4 p-4 rounded-lg bg-[#12181F]/80 border border-[#1B2128] backdrop-blur-md transition-all duration-200 hover:border-[#9C8552]/40 hover:bg-[#12181F]"
              >
                <span
                  className="font-mono text-sm font-semibold text-[#D4AF37]"
                >
                  {batch.batchId}
                </span>
                <StatusBadge status={batch.status} />
                <span className="ml-auto text-xs font-mono text-[#8A8478]">
                  {batch.carrierCount} carrier leg(s)
                </span>
              </div>
            ))}

            {myBatches.length === 0 ? (
              <div className="p-8 rounded-lg bg-[#12181F]/60 border border-[#1B2128] text-center text-sm text-[#8A8478]">
                No batches created yet. Click "Create Batch" to start your first shipment.
              </div>
            ) : null}
          </section>
        </div>

        {/* Live Protocol Log Side Panel */}
        <div className="lg:col-span-1">
          <LiveProtocolLog />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="p-5 rounded-lg bg-[#12181F]/85 border border-[#1B2128] backdrop-blur-md transition-all duration-200 hover:border-[#9C8552]/40">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#6B7178] font-mono">{label}</p>
        {icon}
      </div>
      <p className="font-mono text-3xl font-semibold text-[#D4AF37]">{value}</p>
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
    <div className="group flex flex-col gap-3 p-5 rounded-lg bg-[#12181F]/85 border border-[#1B2128] backdrop-blur-md transition-all duration-300 hover:border-[#9C8552]/50 hover:bg-[#12181F] hover:-translate-y-1">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-[#1B2128] group-hover:bg-[#9C8552]/20 transition-colors">
          {icon}
        </div>
        <p className="text-sm font-semibold text-[#EDE9DC] group-hover:text-[#D4AF37] transition-colors">{label}</p>
      </div>
      <p className="text-xs text-[#8A8478] leading-relaxed">{blurb}</p>
      <Button asChild size="sm" variant="secondary" className="mt-auto w-fit border border-[#2A3138] hover:border-[#9C8552]/50">
        <Link to={to} className="flex items-center gap-1.5 font-mono text-xs">
          Open Console
        </Link>
      </Button>
    </div>
  );
}
