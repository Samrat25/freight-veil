import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/freight/RoleGate";
import { CreateBatchForm } from "@/components/freight/CreateBatchForm";
import { Confidential } from "@/components/freight/Confidential";

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
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Create shipment batch</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The budget is a private input — it is never shown again after submit.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <CreateBatchForm />
        <div className="veil-panel h-fit space-y-4 p-6">
          <h2 className="text-base font-semibold">What the chain records</h2>
          <p className="text-sm text-muted-foreground">
            Only the batch ID, a status flag, a timestamp and the number of carrier legs. Everything
            below stays shielded.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Confidential label="Total budget" note="Proved sufficient, never published." />
            <Confidential label="Per-carrier rates" note="Each leg is proven in isolation." />
          </div>
        </div>
      </div>
    </div>
  );
}
