import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/freight/RoleGate";
import { CreateBatchForm } from "@/components/freight/CreateBatchForm";
import { Confidential } from "@/components/freight/Confidential";
import { ShieldCheck, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/create-batch")({
  head: () => ({
    meta: [
      { title: "Create Shipment Batch — FreightVeil" },
      {
        name: "description",
        content:
          "Shipper-only action: lock a private budget on-chain for a multi-leg shipment batch without publishing the amount.",
      },
      { property: "og:title", content: "Create Shipment Batch — FreightVeil" },
      {
        property: "og:description",
        content: "Lock a shielded budget and hand the batch ID to your carriers.",
      },
    ],
  }),
  component: () => (
    <RoleGate requires="shipper">
      <CreateBatchPage />
    </RoleGate>
  ),
});

function CreateBatchPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 relative z-10 space-y-8">
      <header className="border-b border-[#1B2128] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <PlusCircle className="size-4 text-[#D4AF37]" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
            Compact ZK Escrow Circuit
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDE9DC]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Create Shipment Batch
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A9A390] leading-relaxed">
          The budget is a private input witness — it is proved sufficient on-chain and never shown again after submission.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="p-6 rounded-lg bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          <CreateBatchForm />
        </div>

        <div className="p-6 rounded-lg bg-[#12181F]/80 border border-[#1B2128] backdrop-blur-md space-y-5 h-fit shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#55776D]" />
            <h2
              className="text-lg font-semibold text-[#EDE9DC]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              What the Chain Records
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-[#8A8478]">
            Only the batch ID, a status flag, a timestamp and the number of carrier legs. Everything
            below stays shielded.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Confidential label="Total Budget" note="Proved sufficient, never published." />
            <Confidential label="Per-Carrier Rates" note="Each leg is proven in isolation." />
          </div>

          <div className="p-4 rounded-md bg-[#0B121A]/60 border border-[#2A3138] text-xs font-mono text-[#A9A390] leading-relaxed">
            <code>compact_proof: zk_snark_generated_locally ✓</code>
          </div>
        </div>
      </div>
    </div>
  );
}
