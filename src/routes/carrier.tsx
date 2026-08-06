import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Send, ListChecks, Eye, Lock, Globe, FileCheck, Layers, CheckCircle2 } from "lucide-react";
import { RoleGate } from "@/components/freight/RoleGate";
import { StatusBadge } from "@/components/freight/StatusBadge";
import { LiveProtocolLog } from "@/components/freight/LiveProtocolLog";
import MagicBento from "@/components/ui/MagicBento";
import { useFreight } from "@/lib/freight-store";
import { getWalletSession, truncateAddress } from "@/lib/midnight-api";

export const Route = createFileRoute("/carrier")({
  head: () => ({
    meta: [
      { title: "Carrier Console — FreightVeil" },
      {
        name: "description",
        content:
          "Carrier console: file shielded leg claims against a batch ID and confirm settled payouts without exposing rates.",
      },
      { property: "og:title", content: "Carrier Console — FreightVeil" },
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
  const { myClaims, wallet } = useFreight();
  const session = getWalletSession();
  const navigate = useNavigate();

  // Functional interactive toggle state
  const [claimType, setClaimType] = useState<"individual" | "multi">("individual");
  const [privacyLevel, setPrivacyLevel] = useState<"shielded" | "unshielded">("shielded");

  const displayAddress = session?.address || wallet?.address || "";
  const shortAddr = displayAddress ? truncateAddress(displayAddress) : "Carrier Session";

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleClaimTypeChange = (type: "individual" | "multi") => {
    setClaimType(type);
    if (type === "individual") {
      navigate({ to: "/submit-claim" });
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
            Good evening, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EDE9DC] to-[#34D399]">{shortAddr}</span>.
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12181F] border border-[#2A3138] shadow-[0_0_12px_rgba(85,119,109,0.1)]">
          <span className="size-2 rounded-full bg-[#34D399] animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#A9A390]">
            PREVIEW Network
          </span>
        </div>
      </header>

      {/* ─── 2. 4 TOP BALANCE & METRIC CARDS ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Shielded Token Balance */}
        <div className="relative p-5 rounded-xl bg-gradient-to-br from-[#12181F] via-[#0B121A] to-[#12181F] border border-[#55776D]/40 backdrop-blur-md shadow-[0_10px_30px_rgba(85,119,109,0.15)] overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="pointer-events-none absolute right-[-20px] top-[-20px] size-28 rounded-full bg-[#55776D]/10 blur-xl group-hover:bg-[#55776D]/20 transition-colors" />
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#A9A390]">
            SHIELDED TOKEN BALANCE
          </p>
          <p className="text-2xl font-bold font-mono text-[#EDE9DC] mt-3">
            0 <span className="text-base font-normal text-[#55776D]">tNIGHT</span>
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

        {/* Card 4: Total Claims */}
        <div className="p-5 rounded-xl bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.4)] group hover:scale-[1.02] hover:border-[#2A3138] transition-all">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6B7178]">
            TOTAL CLAIMS
          </p>
          <p className="text-2xl font-bold font-mono text-[#34D399] mt-3">
            {myClaims.length}
          </p>
          <p className="mt-3 text-[10px] font-mono text-[#34D399] flex items-center gap-1">
            <span>↑</span> Live Audit Velocity
          </p>
        </div>
      </div>

      {/* ─── 3. MAIN CONTENT GRID ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Console Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Submitter Console Card */}
          <div className="p-6 rounded-xl bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#1B2128]">
              <div className="p-2.5 rounded-lg bg-[#55776D]/20 text-[#34D399]">
                <FileCheck className="size-5" />
              </div>
              <div>
                <h2
                  className="text-lg font-semibold text-[#EDE9DC]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Carrier Claim Dispatcher
                </h2>
                <p className="text-xs text-[#8A8478] mt-0.5">
                  File and verify private leg claims against shipment batch IDs
                </p>
              </div>
            </div>

            {/* REAL FUNCTIONAL CONFIG TOGGLES */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Claim Type Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7178]">
                    CLAIM TYPE
                  </p>
                  <span className="text-[9px] font-mono text-[#34D399]">
                    Mode: {claimType === "individual" ? "Single Leg" : "Multi Roster"}
                  </span>
                </div>
                <div className="flex rounded-md p-1 bg-[#0B121A] border border-[#2A3138]">
                  <button
                    type="button"
                    onClick={() => handleClaimTypeChange("individual")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                      claimType === "individual"
                        ? "bg-[#55776D]/25 text-[#34D399] border border-[#55776D]/50 font-semibold shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                        : "text-[#8A8478] hover:text-[#EDE9DC]"
                    }`}
                  >
                    Individual Leg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClaimTypeChange("multi")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                      claimType === "multi"
                        ? "bg-[#55776D]/25 text-[#34D399] border border-[#55776D]/50 font-semibold shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                        : "text-[#8A8478] hover:text-[#EDE9DC]"
                    }`}
                  >
                    Multi-Route Roster
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
                Active Mode: <strong className="text-[#EDE9DC]">{claimType === "individual" ? "Individual Leg Prover" : "Multi-Route Roster Prover"}</strong>
              </span>
              <span className="text-[10px] text-[#34D399]">
                Witness: {privacyLevel === "shielded" ? "Compact ZK private rate proof" : "Unshielded public claim"}
              </span>
            </div>

            {/* Action Shortcut Buttons */}
            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              <Link
                to="/submit-claim"
                className="group flex flex-col p-4 rounded-lg bg-[#0B121A]/70 border border-[#2A3138] hover:border-[#55776D]/60 hover:bg-[#12181F] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#EDE9DC] group-hover:text-[#34D399]">
                    Submit Claim
                  </span>
                  <Send className="size-4 text-[#34D399]" />
                </div>
                <span className="text-[11px] text-[#8A8478]">
                  File leg against batch
                </span>
              </Link>

              <Link
                to="/my-claims"
                className="group flex flex-col p-4 rounded-lg bg-[#0B121A]/70 border border-[#2A3138] hover:border-[#55776D]/60 hover:bg-[#12181F] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#EDE9DC] group-hover:text-[#34D399]">
                    My Claims
                  </span>
                  <ListChecks className="size-4 text-[#55776D]" />
                </div>
                <span className="text-[11px] text-[#8A8478]">
                  Track payout status
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

          {/* Active Claim Submissions Overview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-base font-semibold text-[#EDE9DC]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Active Claim Submissions
              </h3>
              <Link to="/my-claims" className="text-xs font-mono text-[#55776D] hover:underline">
                View all ({myClaims.length}) →
              </Link>
            </div>

            {myClaims.slice(0, 4).map((claim) => (
              <div
                key={claim.claimId}
                className="group flex items-center justify-between p-4 rounded-lg bg-[#12181F]/80 border border-[#1B2128] transition-all hover:border-[#55776D]/40 hover:bg-[#12181F]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-[#1B2128] text-[#34D399]">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <span className="font-mono text-sm font-semibold text-[#34D399] block">
                      {claim.claimId}
                    </span>
                    <span className="text-[11px] font-mono text-[#8A8478]">
                      Batch: {claim.batchId}
                    </span>
                  </div>
                </div>
                <StatusBadge status={claim.status} />
              </div>
            ))}

            {myClaims.length === 0 ? (
              <div className="p-8 rounded-lg bg-[#12181F]/60 border border-[#1B2128] text-center text-xs text-[#8A8478]">
                No claims submitted yet. Click "Submit Claim" to file a claim against a batch ID.
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
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#55776D]">
            CARRIER PRIVACY & PROOF VERIFICATION
          </p>
          <h2
            className="text-2xl font-semibold text-[#EDE9DC] mt-1"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Zero-Knowledge Claim Protocol
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
          glowColor="85, 119, 109"
        />
      </section>
    </div>
  );
}
