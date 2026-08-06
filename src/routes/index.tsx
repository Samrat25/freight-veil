import { createFileRoute } from "@tanstack/react-router";
import { WalletConnect } from "@/components/freight/WalletConnect";
import GradientText from "@/components/ui/GradientText";
import MagicBento from "@/components/ui/MagicBento";
import { ShieldCheck, Lock, Cpu, CheckCircle2, ArrowUpRight, Sparkles, Terminal, FileCode, Zap, Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FreightVeil — Confidential Multi-Carrier Settlement on Midnight" },
      {
        name: "description",
        content:
          "FreightVeil settles multi-leg freight payouts on Midnight: carriers get their contracted rate while rates, distances and budgets stay private.",
      },
      { property: "og:title", content: "FreightVeil — Confidential Multi-Carrier Settlement" },
      {
        property: "og:description",
        content:
          "Shippers lock funds, carriers get paid their contracted rate, and no one ever sees individual rates or distances.",
      },
    ],
  }),
  component: Landing,
});

/* ─── Data ──────────────────────────────────────────────── */

const pillars = [
  { num: "01", title: "Zero-Knowledge Settlement", icon: Cpu, desc: "Mathematical proof verification of contracted rate math without disclosing individual figures." },
  { num: "02", title: "Shielded Escrow", icon: Lock, desc: "Shipper budgets remain hidden witnesses on Midnight's ZK ledger while guaranteeing payouts." },
  { num: "03", title: "Selective Compliance", icon: ShieldCheck, desc: "Auditors verify total batch validity without accessing private carrier operational routes." },
];

const workflowSteps = [
  {
    num: "01",
    title: "Shielded Key Commitment",
    desc: "Carriers generate a private key commitment locally in 1AM Wallet; no real identities exposed.",
    icon: Lock,
    tag: "Client-Side ZK",
  },
  {
    num: "02",
    title: "Compact ZK Proof",
    desc: "The shipper dispatches escrow; Compact circuits generate zk-SNARK proofs locally in-browser.",
    icon: FileCode,
    tag: "Compact Compiler",
  },
  {
    num: "03",
    title: "tDUST Gas Execution",
    desc: "Transactions run on tDUST ZK fuel while payout amounts stay shielded on-chain.",
    icon: Zap,
    tag: "Zero Volatility",
  },
  {
    num: "04",
    title: "Verifiable Ledger",
    desc: "Midnight verifies the cryptographic proof, updating batch status with full auditability.",
    icon: CheckCircle2,
    tag: "On-Chain Audit",
  },
];

const capabilities = [
  {
    title: "Shielded Escrow",
    desc: "Shippers lock funds with zero-knowledge proof status; release dispatches privately.",
    highlight: "#9C8552",
    icon: Lock,
  },
  {
    title: "Anonymous Disputes",
    desc: "Batches can be disputed without revealing which party or why, publicly.",
    highlight: "#55776D",
    icon: ShieldCheck,
  },
  {
    title: "Nullifier Protection",
    desc: "Cryptographic guarantee no batch can be settled twice.",
    highlight: "#9C8552",
    icon: Cpu,
  },
  {
    title: "1AM Wallet Native",
    desc: "In-browser proving, key commitments, tNIGHT and tDUST handled out of the box.",
    highlight: "#55776D",
    icon: Zap,
  },
  {
    title: "Compact ZK Circuits",
    desc: "Formal mathematical proof verification directly on-chain.",
    highlight: "#9C8552",
    icon: FileCode,
  },
  {
    title: "Real-time Protocol Log",
    desc: "Stream live verification events and track batch status as it happens.",
    highlight: "#55776D",
    icon: Layers,
  },
];

const stats = [
  { value: "< 3s", label: "ZK VERIFICATION" },
  { value: "100%", label: "PRIVACY PRESERVED" },
  { value: "0.00", label: "GAS VOLATILITY" },
  { value: "256-bit", label: "KEY COMMITMENT" },
];

/* ─── Component ─────────────────────────────────────────── */

function Landing() {
  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative z-10 space-y-12">

      {/* ─── 1. HERO SECTION ─────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-gradient-to-tr from-[#9C8552]/10 via-[#55776D]/15 to-transparent blur-3xl opacity-60" />

        {/* Eyebrow Pill */}
        <div className="inline-flex items-center justify-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-[#12181F]/90 border border-[#9C8552]/40 shadow-[0_0_20px_rgba(156,133,82,0.15)] transition-transform duration-300 hover:scale-105">
          <span className="inline-block size-2 rounded-full bg-[#55776D] animate-pulse shadow-[0_0_8px_#55776D]" />
          <span
            className="text-[11px] font-medium uppercase tracking-[0.2em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#D4AF37" }}
          >
            Zero-Knowledge Freight Ledger
          </span>
          <Sparkles className="size-3 text-[#D4AF37]" />
        </div>

        {/* Main Heading */}
        <h1
          className="text-5xl sm:text-6xl lg:text-[3.4rem] font-medium leading-[1.1] tracking-tight transition-all duration-300 flex justify-center"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          <GradientText
            colors={["#EDE9DC", "#D4AF37", "#9C8552", "#34D399", "#EDE9DC"]}
            animationSpeed={6}
            showBorder={false}
          >
            Trust Through Transit.
          </GradientText>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#A9A390]">
          Confidential multi-carrier settlement, shielded escrow, and provable payout
          compliance — built on Midnight's zero-knowledge smart contract infrastructure.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="transition-transform duration-200 hover:scale-[1.03] shadow-[0_0_30px_rgba(156,133,82,0.2)] rounded-md">
            <WalletConnect size="lg" />
          </div>
          <a
            href="#how-it-works"
            onClick={scrollToHowItWorks}
            className="group flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-md border border-[#2A3138] bg-[#12181F]/70 text-[#A9A390] transition-all duration-200 hover:text-[#EDE9DC] hover:border-[#9C8552]/50 hover:bg-[#12181F]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            How It Works
            <ArrowUpRight className="size-4 text-[#9C8552] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </section>

      {/* ─── 2. WHAT FREIGHTVEIL DOES ────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-3xl">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.2em] mb-3 text-[#6B7178]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            What FreightVeil Does
          </p>
          <h2
            className="text-2xl sm:text-3xl font-medium leading-snug text-[#EDE9DC]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Settlement that builds trust & preserves privacy
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#A9A390]">
            FreightVeil decouples private settlement execution from public audit verification
            — shippers dispatch batch payouts while carrier rates and distances stay completely private.
          </p>
        </div>

        {/* Interactive 3-Column Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.num}
                className="group relative p-6 rounded-lg bg-[#12181F]/80 border border-[#1B2128] transition-all duration-300 hover:border-[#9C8552]/60 hover:bg-[#12181F] hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(156,133,82,0.12)]"
              >
                {/* Glowing top line indicator on hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg bg-gradient-to-r from-transparent via-[#9C8552] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-semibold text-[#6B7178] group-hover:text-[#D4AF37] transition-colors duration-200"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {p.num}
                  </span>
                  <div className="p-2 rounded-md bg-[#1B2128] text-[#9C8552] group-hover:bg-[#9C8552]/15 group-hover:text-[#D4AF37] transition-colors duration-200">
                    <Icon className="size-4" />
                  </div>
                </div>
                
                <h3 className="text-base font-semibold text-[#EDE9DC] group-hover:text-[#D4AF37] transition-colors duration-200">
                  {p.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#8A8478]">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 3. ARCHITECTURE & WORKFLOW ──────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-12 scroll-mt-24">
        <div className="max-w-3xl">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.2em] mb-3 text-[#6B7178]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Architecture & Workflow
          </p>
          <h2
            className="text-2xl sm:text-3xl font-medium leading-snug text-[#EDE9DC]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            How FreightVeil Operates on Midnight
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#A9A390]">
            Dual-state contracts compiled from Compact; FreightVeil uses zero-knowledge proofs
            to run settlement dispatches on-chain without revealing rate or distance data.
          </p>
        </div>

        {/* 4-Column Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group relative p-6 rounded-lg bg-[#12181F]/85 border border-[#1B2128] backdrop-blur-md transition-all duration-300 hover:border-[#9C8552]/60 hover:bg-[#12181F] hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgba(156,133,82,0.15)]"
              >
                {/* Step Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-3xl font-medium text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] to-[#9C8552]"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {step.num}
                  </span>
                  <span
                    className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-[#1B2128] text-[#A9A390] border border-[#2A3138] group-hover:border-[#9C8552]/40 group-hover:text-[#D4AF37] transition-colors"
                  >
                    {step.tag}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Icon className="size-4 text-[#55776D] group-hover:text-[#34D399] transition-colors" />
                  <h3 className="text-sm font-semibold text-[#EDE9DC] group-hover:text-[#D4AF37] transition-colors">
                    {step.title}
                  </h3>
                </div>

                <p className="text-xs leading-relaxed text-[#8A8478] mt-2">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 4. SETTLEMENT DISTRIBUTION LEDGER ───────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-3xl">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.2em] mb-3 text-[#6B7178]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Settlement Distribution Ledger
          </p>
          <h2
            className="text-2xl sm:text-3xl font-medium leading-snug text-[#EDE9DC]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Confidential Escrow & Carrier Payouts
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#A9A390]">
            Traditional blockchain payments leak carrier rates and shipper budgets;
            FreightVeil protects operations with native Midnight privacy.
          </p>
        </div>

        {/* Ledger Terminal Card */}
        <div className="mt-8 rounded-lg bg-[#12181F]/90 border border-[#1B2128] shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:border-[#9C8552]/50 hover:shadow-[0_20px_50px_rgba(156,133,82,0.12)]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-3 border-b border-dashed border-[#2A3138] bg-[#0B121A]/50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-[#9C8552]" />
              <span className="text-xs font-mono text-[#A9A390]">
                compact_circuit: <span className="text-[#D4AF37]">settle_batch</span>
              </span>
            </div>
            <span className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#55776D]/15 text-[#34D399] border border-[#55776D]/40 text-xs font-mono shadow-[0_0_12px_rgba(52,211,153,0.15)]">
              <span className="size-2 rounded-full bg-[#34D399] animate-pulse" />
              ZKP Active
            </span>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-[#1B2128]">
            {[
              { label: "Shielded Carriers", value: "14 Carriers", highlight: "text-[#EDE9DC]" },
              { label: "Total Freight Settled", value: "250,000 tNIGHT", highlight: "text-[#D4AF37]" },
              { label: "Public Visibility", value: "0% (Fully Shielded)", highlight: "text-[#34D399]" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#1B2128]/40"
              >
                <span className="text-xs text-[#8A8478] font-mono">{row.label}</span>
                <span className={`text-sm font-semibold font-mono ${row.highlight}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Footnote */}
          <div className="px-6 py-4 text-xs leading-relaxed text-[#8A8478] border-t border-dashed border-[#2A3138] bg-[#0B121A]/30 rounded-b-lg flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              Carriers receive funds instantly into their 1AM Wallet key commitments without
              public block explorers indexing rates.
            </span>
          </div>
        </div>
      </section>

      {/* ─── 5. COMPLETE CAPABILITIES (MagicBento Grid) ──── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-3xl mb-8">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.2em] mb-3 text-[#6B7178]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Complete Capabilities
          </p>
          <h2
            className="text-2xl sm:text-3xl font-medium leading-snug text-[#EDE9DC]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Enterprise Suite Built for Midnight
          </h2>
        </div>

        <MagicBento
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={320}
          particleCount={12}
          glowColor="156, 133, 82"
        />
      </section>

      {/* ─── 6. STAT ROW ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 my-8">
        <div className="rounded-xl border border-[#1B2128] bg-[#12181F]/60 backdrop-blur-md py-10 px-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center group transition-transform duration-300 hover:scale-105">
                <span
                  className="text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#EDE9DC] via-[#D4AF37] to-[#9C8552]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {s.value}
                </span>
                <p
                  className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#6B7178] group-hover:text-[#A9A390] transition-colors"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. FINAL CTA ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="relative p-10 sm:p-14 rounded-2xl border border-[#9C8552]/30 bg-gradient-to-b from-[#12181F]/90 via-[#12181F]/70 to-[#0B121A]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(156,133,82,0.15)] overflow-hidden">
          {/* Decorative ambient radial glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(156,133,82,0.15),transparent_70%)]" />

          <h2
            className="text-3xl sm:text-4xl font-medium text-[#EDE9DC]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Ready to Settle With Confidence?
          </h2>
          <p className="mt-4 text-sm max-w-lg mx-auto leading-relaxed text-[#A9A390]">
            Connect your Midnight wallet to launch the FreightVeil dispatch portal.
          </p>
          
          <div className="mt-8 flex justify-center transition-transform duration-200 hover:scale-105">
            <WalletConnect size="lg" />
          </div>
        </div>
      </section>

      {/* ─── 8. FOOTER ───────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-[#1B2128] bg-[#0B121A]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-[#6B7178]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            FreightVeil © 2026 Midnight ZK Protocol
          </span>
          <span className="text-[11px] text-[#6B7178]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Powered by Midnight Blockchain · Compact ZK Smart Contracts
          </span>
        </div>
      </footer>
    </div>
  );
}
