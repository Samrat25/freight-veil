import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, ListChecks, Eye, Lock, Globe, Sparkles, Layers, CheckCircle2 } from "lucide-react";
import { RoleGate } from "@/components/freight/RoleGate";
import { StatusBadge } from "@/components/freight/StatusBadge";
import { LiveProtocolLog } from "@/components/freight/LiveProtocolLog";
import MagicBento from "@/components/ui/MagicBento";
import { useFreight } from "@/lib/freight-store";
import { getWalletSession, truncateAddress } from "@/lib/midnight-api";

export const Route = createFileRoute("/shipper")({
  head: () => ({
    meta: [
      { title: "Shipper Console — FreightVeil" },
      {
        name: "description",
        content:
          "Shipper console: lock private budgets, review your own shipment batches and raise disputes on Midnight.",
      },
      { property: "og:title", content: "Shipper Console — FreightVeil" },
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
  const { myBatches, wallet } = useFreight();
  const session = getWalletSession();
  const navigate = useNavigate();

  // Functional interactive toggle state
  const [settlementType, setSettlementType] = useState<"batch" | "single">("batch");
  const [privacyLevel, setPrivacyLevel] = useState<"shielded" | "unshielded">("shielded");

  const displayAddress = session?.address || wallet?.address || "";
  const shortAddr = displayAddress ? truncateAddress(displayAddress) : "Shipper Session";

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleSettlementTypeChange = (type: "batch" | "single") => {
    setSettlementType(type);
    if (type === "single") {
      navigate({ to: "/create-batch" });
    }
  };

  const handlePrivacyLevelChange = (level: "shielded" | "unshielded") => {
    setPrivacyLevel(level);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 relative z-10 space-y-8">
      {/* ─── 1. TOP GREETING HEADER (MidRoll style) ─────────────── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#6B7178]">
            {todayStr}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-medium tracking-tight text-[#EDE9DC] mt-1"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Good evening, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EDE9DC] to-[#D4AF37]">{shortAddr}</span>.
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12181F] border border-[#2A3138] shadow-[0_0_12px_rgba(156,133,82,0.1)]">
          <span className="size-2 rounded-full bg-[#34D399] animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#A9A390]">
            PREVIEW Network
          </span>
        </div>
      </header>

      {/* ─── 2. 4 TOP BALANCE & METRIC CARDS ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Shielded Token Balance */}
        <div className="relative p-5 rounded-xl bg-gradient-to-br from-[#12181F] via-[#0B121A] to-[#12181F] border border-[#9C8552]/40 backdrop-blur-md shadow-[0_10px_30px_rgba(156,133,82,0.15)] overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="pointer-events-none absolute right-[-20px] top-[-20px] size-28 rounded-full bg-[#9C8552]/10 blur-xl group-hover:bg-[#9C8552]/20 transition-colors" />
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#A9A390]">
            SHIELDED TOKEN BALANCE
          </p>
          <p className="text-2xl font-bold font-mono text-[#EDE9DC] mt-3">
            0 <span className="text-base font-normal text-[#9C8552]">tNIGHT</span>
          </p>
          <p className="mt-3 text-[10px] font-mono text-[#34D399] flex items-center gap-1">
            <span>↑</span> Private ZK Ledger
          </p>
        </div>

        {/* Card 2: Unshielded Token Balance */}
        <div className="p-5 rounded-xl bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.4)] group hover:scale-[1.02] hover:border-[#2A3138] transition-all">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6B7178]">
            UNSHIELDED TOKEN BALANCE
          </p>
          <p className="text-2xl font-bold font-mono text-[#EDE9DC] mt-3">
            5,000 <span className="text-base font-normal text-[#8A8478]">tNIGHT</span>
          </p>
          <p className="mt-3 text-[10px] font-mono text-[#55776D] flex items-center gap-1">
            <span>↑</span> Public Cardano/Midnight Ledger
          </p>
        </div>

        {/* Card 3: tDUST Balance */}
        <div className="p-5 rounded-xl bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.4)] group hover:scale-[1.02] hover:border-[#2A3138] transition-all">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6B7178]">
            TDUST BALANCE
          </p>
          <p className="text-2xl font-bold font-mono text-[#34D399] mt-3">
            4,814.62 <span className="text-base font-normal text-[#8A8478]">DUST</span>
          </p>
          <p className="mt-3 text-[10px] font-mono text-[#34D399] flex items-center gap-1">
            <span>↑</span> Transaction Fee Reserve
          </p>
        </div>

        {/* Card 4: Total Batches */}
        <div className="p-5 rounded-xl bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.4)] group hover:scale-[1.02] hover:border-[#2A3138] transition-all">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6B7178]">
            TOTAL BATCHES
          </p>
          <p className="text-2xl font-bold font-mono text-[#D4AF37] mt-3">
            {myBatches.length}
          </p>
          <p className="mt-3 text-[10px] font-mono text-[#D4AF37] flex items-center gap-1">
            <span>↑</span> Live Audit Velocity
          </p>
        </div>
      </div>

      {/* ─── 3. MAIN CONTENT GRID ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Console Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispatcher Console Card */}
          <div className="p-6 rounded-xl bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#1B2128]">
              <div className="p-2.5 rounded-lg bg-[#9C8552]/15 text-[#D4AF37]">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2
                  className="text-lg font-semibold text-[#EDE9DC]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Shipment Escrow Dispatcher
                </h2>
                <p className="text-xs text-[#8A8478] mt-0.5">
                  Configure and verify multi-leg freight settlements to carriers on Midnight
                </p>
              </div>
            </div>

            {/* REAL FUNCTIONAL CONFIG TOGGLES */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Settlement Type Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7178]">
                    SETTLEMENT TYPE
                  </p>
                  <span className="text-[9px] font-mono text-[#D4AF37]">
                    Mode: {settlementType === "batch" ? "Multi-Leg" : "Single"}
                  </span>
                </div>
                <div className="flex rounded-md p-1 bg-[#0B121A] border border-[#2A3138]">
                  <button
                    type="button"
                    onClick={() => handleSettlementTypeChange("batch")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                      settlementType === "batch"
                        ? "bg-[#9C8552]/20 text-[#D4AF37] border border-[#9C8552]/50 font-semibold shadow-[0_0_10px_rgba(156,133,82,0.2)]"
                        : "text-[#8A8478] hover:text-[#EDE9DC]"
                    }`}
                  >
                    Multi-Leg Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSettlementTypeChange("single")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                      settlementType === "single"
                        ? "bg-[#9C8552]/20 text-[#D4AF37] border border-[#9C8552]/50 font-semibold shadow-[0_0_10px_rgba(156,133,82,0.2)]"
                        : "text-[#8A8478] hover:text-[#EDE9DC]"
                    }`}
                  >
                    Single Dispatch
                  </button>
                </div>
              </div>

              {/* Privacy Level Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7178]">
                    PRIVACY LEVEL (COMPACT)
                  </p>
                  <span className="text-[9px] font-mono text-[#34D399]">
                    {privacyLevel === "shielded" ? "ZK Circuit" : "Unshielded"}
                  </span>
                </div>
                <div className="flex rounded-md p-1 bg-[#0B121A] border border-[#2A3138]">
                  <button
                    type="button"
                    onClick={() => handlePrivacyLevelChange("shielded")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      privacyLevel === "shielded"
                        ? "bg-[#55776D]/25 text-[#34D399] border border-[#55776D]/50 font-semibold shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                        : "text-[#8A8478] hover:text-[#EDE9DC]"
                    }`}
                  >
                    <Lock className="size-3" /> Shielded ZK
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrivacyLevelChange("unshielded")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      privacyLevel === "unshielded"
                        ? "bg-[#55776D]/25 text-[#34D399] border border-[#55776D]/50 font-semibold shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                        : "text-[#8A8478] hover:text-[#EDE9DC]"
                    }`}
                  >
                    <Globe className="size-3" /> Unshielded
                  </button>
                </div>
              </div>
            </div>

            {/* Status indicator bar for selected configuration */}
            <div className="p-3 rounded-lg bg-[#0B121A]/60 border border-[#2A3138] flex items-center justify-between text-xs font-mono text-[#A9A390]">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-[#34D399]" />
                Active Mode: <strong className="text-[#EDE9DC]">{settlementType === "batch" ? "Multi-Leg Batch Escrow" : "Single Leg Direct"}</strong>
              </span>
              <span className="text-[10px] text-[#34D399]">
                Proof: {privacyLevel === "shielded" ? "Compact ZK witness active" : "Unshielded public transaction"}
              </span>
            </div>

            {/* Action Shortcut Buttons */}
            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              <Link
                to="/create-batch"
                className="group flex flex-col p-4 rounded-lg bg-[#0B121A]/70 border border-[#2A3138] hover:border-[#9C8552]/60 hover:bg-[#12181F] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#EDE9DC] group-hover:text-[#D4AF37]">
                    Create Batch
                  </span>
                  <Plus className="size-4 text-[#9C8552]" />
                </div>
                <span className="text-[11px] text-[#8A8478]">
                  Lock private budget
                </span>
              </Link>

              <Link
                to="/my-shipments"
                className="group flex flex-col p-4 rounded-lg bg-[#0B121A]/70 border border-[#2A3138] hover:border-[#55776D]/60 hover:bg-[#12181F] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#EDE9DC] group-hover:text-[#34D399]">
                    My Shipments
                  </span>
                  <ListChecks className="size-4 text-[#55776D]" />
                </div>
                <span className="text-[11px] text-[#8A8478]">
                  Manage & settle
                </span>
              </Link>

              <Link
                to="/explorer"
                className="group flex flex-col p-4 rounded-lg bg-[#0B121A]/70 border border-[#2A3138] hover:border-[#9C8552]/60 hover:bg-[#12181F] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#EDE9DC] group-hover:text-[#D4AF37]">
                    Public Explorer
                  </span>
                  <Eye className="size-4 text-[#9C8552]" />
                </div>
                <span className="text-[11px] text-[#8A8478]">
                  Inspect public state
                </span>
              </Link>
            </div>
          </div>

          {/* Active Batch Overview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-base font-semibold text-[#EDE9DC]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Active Batch Overview
              </h3>
              <Link to="/my-shipments" className="text-xs font-mono text-[#9C8552] hover:underline">
                View all ({myBatches.length}) →
              </Link>
            </div>

            {myBatches.slice(0, 4).map((batch) => (
              <div
                key={batch.batchId}
                className="group flex items-center justify-between p-4 rounded-lg bg-[#12181F]/80 border border-[#1B2128] transition-all hover:border-[#9C8552]/40 hover:bg-[#12181F]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-[#1B2128] text-[#D4AF37]">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <span className="font-mono text-sm font-semibold text-[#D4AF37] block">
                      {batch.batchId}
                    </span>
                    <span className="text-[11px] text-[#8A8478]">
                      {batch.carrierCount} carrier leg(s)
                    </span>
                  </div>
                </div>
                <StatusBadge status={batch.status} />
              </div>
            ))}

            {myBatches.length === 0 ? (
              <div className="p-8 rounded-lg bg-[#12181F]/60 border border-[#1B2128] text-center text-xs text-[#8A8478]">
                No batches created yet. Click "Create Batch" to lock your first shielded escrow.
              </div>
            ) : null}
          </section>
        </div>

        {/* Live Protocol Log Side Panel (Right 1 col) */}
        <div className="lg:col-span-1">
          <LiveProtocolLog />
        </div>
      </div>

      {/* ─── 4. BENTO SUITE CAPABILITIES SECTION ─────────────────── */}
      <section className="pt-6 border-t border-[#1B2128]">
        <div className="mb-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9C8552]">
            SECURITY & COMPLIANCE ARCHITECTURE
          </p>
          <h2
            className="text-2xl font-semibold text-[#EDE9DC] mt-1"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Zero-Knowledge Settlement Features
          </h2>
        </div>

        <MagicBento
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={10}
          glowColor="156, 133, 82"
        />
      </section>
    </div>
  );
}
