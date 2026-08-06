import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/freight/RoleGate";
import { MyBatches } from "@/components/freight/MyBatches";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/my-shipments")({
  head: () => ({
    meta: [
      { title: "My Shipments — FreightVeil" },
      {
        name: "description",
        content:
          "Track the shipment batches you created, settle them on-chain or flag a dispute — scoped to your shielded identity.",
      },
      { property: "og:title", content: "My Shipments — FreightVeil" },
      {
        property: "og:description",
        content: "Your batches only: status, settlement and disputes.",
      },
    ],
  }),
  component: () => (
    <RoleGate requires="shipper">
      <MyShipmentsPage />
    </RoleGate>
  ),
});

function MyShipmentsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 relative z-10 space-y-8">
      <header className="border-b border-[#1B2128] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="size-4 text-[#D4AF37]" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
            Shipper Ledger History
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDE9DC]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          My Shipments
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A9A390] leading-relaxed">
          Only batches locked by your session identity. Other shippers' batches are invisible to
          you, and carrier claim details are invisible to everyone but their author.
        </p>
      </header>
      <MyBatches />
    </div>
  );
}
