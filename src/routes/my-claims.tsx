import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/freight/RoleGate";
import { MyClaims } from "@/components/freight/MyClaims";
import { FileCheck } from "lucide-react";

export const Route = createFileRoute("/my-claims")({
  head: () => ({
    meta: [
      { title: "My Claims — FreightVeil" },
      {
        name: "description",
        content:
          "Track the leg claims you submitted and your payout confirmations — scoped to your shielded carrier identity.",
      },
      { property: "og:title", content: "My Claims — FreightVeil" },
      {
        property: "og:description",
        content: "Your claims only: status and 'Payout settled' confirmations.",
      },
    ],
  }),
  component: () => (
    <RoleGate requires="carrier">
      <MyClaimsPage />
    </RoleGate>
  ),
});

function MyClaimsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 relative z-10 space-y-8">
      <header className="border-b border-[#1B2128] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileCheck className="size-4 text-[#34D399]" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#34D399]">
            Carrier Claim History
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDE9DC]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          My Claims
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A9A390] leading-relaxed">
          Only claims filed by your session identity. Payout confirmations show settlement status, never
          the raw contracted rate.
        </p>
      </header>
      <MyClaims />
    </div>
  );
}
