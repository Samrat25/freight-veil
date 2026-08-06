import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/freight/RoleGate";
import { SubmitClaimForm } from "@/components/freight/SubmitClaimForm";
import { Confidential } from "@/components/freight/Confidential";
import { Send, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/submit-claim")({
  head: () => ({
    meta: [
      { title: "Submit Leg Claim — FreightVeil" },
      {
        name: "description",
        content:
          "Carrier-only action: file a leg claim against a batch ID with private distance and agreed rate proven on Midnight.",
      },
      { property: "og:title", content: "Submit Leg Claim — FreightVeil" },
      {
        property: "og:description",
        content: "Prove your leg without revealing distance or rate.",
      },
    ],
  }),
  component: () => (
    <RoleGate requires="carrier">
      <SubmitClaimPage />
    </RoleGate>
  ),
});

function SubmitClaimPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 relative z-10 space-y-8">
      <header className="border-b border-[#1B2128] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Send className="size-4 text-[#34D399]" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#34D399]">
            Carrier Prover Witness Circuit
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDE9DC]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Submit Leg Claim
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A9A390] leading-relaxed">
          Distance and agreed rate are private inputs proven against the batch contract — never
          shared with the shipper or other carriers.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="p-6 rounded-lg bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          <SubmitClaimForm />
        </div>

        <div className="p-6 rounded-lg bg-[#12181F]/80 border border-[#1B2128] backdrop-blur-md space-y-5 h-fit shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#55776D]" />
            <h2
              className="text-lg font-semibold text-[#EDE9DC]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              What Stays Hidden
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Confidential label="Distance & Agreed Rate" note="Witness data, never transmitted." />
            <Confidential label="Shipper Budget" note="Carriers can never read it." />
          </div>

          <p className="text-xs leading-relaxed text-[#8A8478]">
            The chain records only your claim ID, the batch it belongs to, a status and a
            commitment hash.
          </p>

          <div className="p-4 rounded-md bg-[#0B121A]/60 border border-[#2A3138] text-xs font-mono text-[#A9A390] leading-relaxed">
            <code>circuit_execution: settle_batch_leg(rate * distance &lt;= budget) ✓</code>
          </div>
        </div>
      </div>
    </div>
  );
}
