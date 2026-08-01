import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/freight/RoleGate";
import { MyBatches } from "@/components/freight/MyBatches";

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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">My shipments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only batches locked by your session identity. Other shippers' batches are invisible to
          you, and carrier claim details are invisible to everyone but their author.
        </p>
      </header>
      <MyBatches />
    </div>
  );
}
