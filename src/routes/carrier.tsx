import { createFileRoute, Link } from "@tanstack/react-router";
import { Send, ListChecks, Eye, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/freight/RoleGate";
import { StatusBadge } from "@/components/freight/StatusBadge";
import { LiveProtocolLog } from "@/components/freight/LiveProtocolLog";
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
    <div className="mx-auto max-w-6xl px-6 py-12 relative z-10 space-y-8">
      {/* Header */}
      <header className="border-b border-[#1B2128] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="size-2 rounded-full bg-[#55776D] animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#55776D]">
            Carrier Console · Active Session
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDE9DC]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Carrier Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A9A390] leading-relaxed">
          Scoped to your session identity. You never see the shipper's total budget or any other
          carrier's rate.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Your Claims" value={String(myClaims.length)} icon={<FileText className="size-4 text-[#55776D]" />} />
            <Stat label="Pending Proof" value={String(count("pending") + count("verified"))} icon={<Clock className="size-4 text-[#9C8552]" />} />
            <Stat label="Settled Claims" value={String(count("settled"))} icon={<CheckCircle2 className="size-4 text-[#34D399]" />} />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Action
              to="/submit-claim"
              icon={<Send className="size-4 text-[#34D399]" />}
              label="Submit Claim"
              blurb="File a leg claim against a batch ID your shipper gave you."
            />
            <Action
              to="/my-claims"
              icon={<ListChecks className="size-4 text-[#55776D]" />}
              label="My Claims"
              blurb="Track your claims and payout confirmations."
            />
            <Action
              to="/explorer"
              icon={<Eye className="size-4 text-[#9C8552]" />}
              label="Public Ledger"
              blurb="See exactly what an outside observer can read."
            />
          </div>

          {/* Recent Claims */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-semibold text-[#EDE9DC]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Recent Claims
              </h2>
              <Link to="/my-claims" className="text-xs font-mono text-[#55776D] hover:underline">
                View all →
              </Link>
            </div>

            {myClaims.slice(0, 4).map((claim) => (
              <div
                key={claim.claimId}
                className="group flex flex-wrap items-center gap-4 p-4 rounded-lg bg-[#12181F]/80 border border-[#1B2128] backdrop-blur-md transition-all duration-200 hover:border-[#55776D]/40 hover:bg-[#12181F]"
              >
                <span className="font-mono text-sm font-semibold text-[#34D399]">
                  {claim.claimId}
                </span>
                <StatusBadge status={claim.status} />
                <span className="ml-auto font-mono text-xs text-[#8A8478]">
                  Batch: {claim.batchId}
                </span>
              </div>
            ))}

            {myClaims.length === 0 ? (
              <div className="p-8 rounded-lg bg-[#12181F]/60 border border-[#1B2128] text-center text-sm text-[#8A8478]">
                No claims filed yet. Click "Submit Claim" to file a claim against a batch.
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
    <div className="p-5 rounded-lg bg-[#12181F]/85 border border-[#1B2128] backdrop-blur-md transition-all duration-200 hover:border-[#55776D]/40">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#6B7178] font-mono">{label}</p>
        {icon}
      </div>
      <p className="font-mono text-3xl font-semibold text-[#34D399]">{value}</p>
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
    <div className="group flex flex-col gap-3 p-5 rounded-lg bg-[#12181F]/85 border border-[#1B2128] backdrop-blur-md transition-all duration-300 hover:border-[#55776D]/50 hover:bg-[#12181F] hover:-translate-y-1">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-[#1B2128] group-hover:bg-[#55776D]/20 transition-colors">
          {icon}
        </div>
        <p className="text-sm font-semibold text-[#EDE9DC] group-hover:text-[#34D399] transition-colors">{label}</p>
      </div>
      <p className="text-xs text-[#8A8478] leading-relaxed">{blurb}</p>
      <Button asChild size="sm" variant="secondary" className="mt-auto w-fit border border-[#2A3138] hover:border-[#55776D]/50">
        <Link to={to} className="flex items-center gap-1.5 font-mono text-xs">
          Open Console
        </Link>
      </Button>
    </div>
  );
}
