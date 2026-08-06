import { createFileRoute } from "@tanstack/react-router";
import { WalletConnect } from "@/components/freight/WalletConnect";

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
  { num: "01", title: "Zero-Knowledge Settlement" },
  { num: "02", title: "Shielded Escrow" },
  { num: "03", title: "Selective Compliance" },
];

const workflowSteps = [
  {
    num: "01",
    title: "Shielded Key Commitment",
    desc: "Carriers generate a private key commitment locally in 1AM Wallet; no real identities exposed.",
  },
  {
    num: "02",
    title: "Compact ZK Proof",
    desc: "The shipper dispatches escrow; Compact circuits generate zk-SNARK proofs locally in-browser.",
  },
  {
    num: "03",
    title: "tDUST Gas Execution",
    desc: "Transactions run on tDUST ZK fuel while payout amounts stay shielded on-chain.",
  },
  {
    num: "04",
    title: "Verifiable Ledger",
    desc: "Midnight verifies the cryptographic proof, updating batch status with full auditability.",
  },
];

const capabilities = [
  {
    title: "Shielded Escrow",
    desc: "Shippers lock funds with zero-knowledge proof status; release dispatches privately.",
  },
  {
    title: "Anonymous Disputes",
    desc: "Batches can be disputed without revealing which party or why, publicly.",
  },
  {
    title: "Nullifier Protection",
    desc: "Cryptographic guarantee no batch can be settled twice.",
  },
  {
    title: "1AM Wallet Native",
    desc: "In-browser proving, key commitments, tNIGHT and tDUST handled out of the box.",
  },
  {
    title: "Compact ZK Circuits",
    desc: "Formal mathematical proof verification directly on-chain.",
  },
  {
    title: "Real-time Protocol Log",
    desc: "Stream live verification events and track batch status as it happens.",
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
    <div className="relative z-10">

      {/* ─── 2. HERO ─────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-16 md:pt-20 md:pb-24 text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#55776D" }} />
          <span
            className="text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#9C8552" }}
          >
            Zero-Knowledge Freight Ledger
          </span>
        </div>

        <h1
          className="text-4xl md:text-5xl lg:text-[2.6rem] font-medium leading-tight"
          style={{ fontFamily: "'Fraunces', serif", color: "#EDE9DC" }}
        >
          Trust Through Transit.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg leading-relaxed" style={{ color: "#A9A390" }}>
          Confidential multi-carrier settlement, shielded escrow, and provable payout
          compliance — built on Midnight's zero-knowledge smart contract infrastructure.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <WalletConnect size="lg" />
          <a
            href="#how-it-works"
            onClick={scrollToHowItWorks}
            className="text-sm underline underline-offset-4 transition-opacity hover:opacity-80"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#A9A390" }}
          >
            How It Works
          </a>
        </div>
      </section>

      {/* ─── 3. WHAT FREIGHTVEIL DOES ────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.18em] mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}
          >
            What FreightVeil Does
          </p>
          <h2
            className="text-2xl md:text-3xl font-medium leading-snug"
            style={{ fontFamily: "'Fraunces', serif", color: "#EDE9DC" }}
          >
            Settlement that builds trust & preserves privacy
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#A9A390" }}>
            FreightVeil decouples private settlement execution from public audit verification
            — shippers dispatch batch payouts while carrier rates and distances stay completely private.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mt-10">
          {pillars.map((p) => (
            <div key={p.num} className="py-5 px-1" style={{ borderTop: "1px solid #2A3138" }}>
              <span
                className="text-xs font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}
              >
                {p.num}
              </span>
              <p className="mt-1.5 text-sm font-medium" style={{ color: "#EDE9DC" }}>
                {p.title}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. ARCHITECTURE & WORKFLOW ──────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
        <div className="max-w-3xl">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.18em] mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}
          >
            Architecture & Workflow
          </p>
          <h2
            className="text-2xl md:text-3xl font-medium leading-snug"
            style={{ fontFamily: "'Fraunces', serif", color: "#EDE9DC" }}
          >
            How FreightVeil Operates on Midnight
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#A9A390" }}>
            Dual-state contracts compiled from Compact; FreightVeil uses zero-knowledge proofs
            to run settlement dispatches on-chain without revealing rate or distance data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className="p-5 backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(18,24,31,0.85)",
                border: "1px solid #1B2128",
                borderRadius: "6px",
              }}
            >
              <span
                className="text-2xl font-medium"
                style={{ fontFamily: "'Fraunces', serif", color: "#9C8552" }}
              >
                {step.num}
              </span>
              <h3 className="mt-3 text-sm font-semibold" style={{ color: "#EDE9DC" }}>
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "#8A8478" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. SETTLEMENT DISTRIBUTION LEDGER ───────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.18em] mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}
          >
            Settlement Distribution Ledger
          </p>
          <h2
            className="text-2xl md:text-3xl font-medium leading-snug"
            style={{ fontFamily: "'Fraunces', serif", color: "#EDE9DC" }}
          >
            Confidential Escrow & Carrier Payouts
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#A9A390" }}>
            Traditional blockchain payments leak carrier rates and shipper budgets;
            FreightVeil protects operations with native Midnight privacy.
          </p>
        </div>

        <div
          className="mt-10 backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(18,24,31,0.9)",
            border: "1px solid #1B2128",
            borderRadius: "6px",
          }}
        >
          {/* Header */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3.5 gap-2"
            style={{ borderBottom: "1px dashed #2A3138" }}
          >
            <span className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}>
              compact_circuit: settle_batch
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#55776D" }}>
              <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#55776D" }} />
              ZKP Active
            </span>
          </div>

          {/* Rows */}
          {[
            { label: "Shielded Carriers", value: "14 Carriers" },
            { label: "Total Freight Settled", value: "250,000 tNIGHT" },
            { label: "Public Visibility", value: "0% (Fully Shielded)" },
          ].map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: i < 2 ? "1px solid #1B2128" : "none" }}
            >
              <span className="text-xs" style={{ color: "#6B7178" }}>{row.label}</span>
              <span
                className="text-sm font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#EDE9DC" }}
              >
                {row.value}
              </span>
            </div>
          ))}

          {/* Footnote */}
          <div className="px-5 py-3 text-xs leading-relaxed" style={{ borderTop: "1px dashed #2A3138", color: "#8A8478" }}>
            💡 Carriers receive funds instantly into their 1AM Wallet key commitments without
            public block explorers indexing rates.
          </div>
        </div>
      </section>

      {/* ─── 6. COMPLETE CAPABILITIES ────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.18em] mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}
          >
            Complete Capabilities
          </p>
          <h2
            className="text-2xl md:text-3xl font-medium leading-snug"
            style={{ fontFamily: "'Fraunces', serif", color: "#EDE9DC" }}
          >
            Enterprise Suite Built for Midnight
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-10">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="p-5 backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(18,24,31,0.85)",
                border: "1px solid #1B2128",
                borderRadius: "6px",
              }}
            >
              <h3 className="text-sm font-semibold" style={{ color: "#EDE9DC" }}>{cap.title}</h3>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "#8A8478" }}>{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7. STAT ROW ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6" style={{ borderTop: "1px solid #1B2128", borderBottom: "1px solid #1B2128" }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <span
                className="text-2xl md:text-3xl font-medium"
                style={{ fontFamily: "'Fraunces', serif", color: "#9C8552" }}
              >
                {s.value}
              </span>
              <p
                className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 8. FINAL CTA ────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2
          className="text-2xl md:text-3xl font-medium"
          style={{ fontFamily: "'Fraunces', serif", color: "#EDE9DC" }}
        >
          Ready to Settle With Confidence?
        </h2>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "#A9A390" }}>
          Connect your Midnight wallet to launch the FreightVeil dispatch portal.
        </p>
        <div className="mt-6 flex justify-center">
          <WalletConnect size="lg" />
        </div>
      </section>

      {/* ─── 9. FOOTER ───────────────────────────────────── */}
      <footer className="py-5 px-6" style={{ borderTop: "1px solid #1B2128" }}>
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}>
            FreightVeil © 2026 Midnight ZK Protocol
          </span>
          <span className="text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7178" }}>
            Powered by Midnight Blockchain · Compact ZK Smart Contracts
          </span>
        </div>
      </footer>
    </div>
  );
}
