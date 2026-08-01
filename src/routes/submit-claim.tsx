import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/freight/RoleGate";
import { SubmitClaimForm } from "@/components/freight/SubmitClaimForm";
import { Confidential } from "@/components/freight/Confidential";

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
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Submit leg claim</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Distance and agreed rate are private inputs proven against the batch contract — never
          shared with the shipper or other carriers.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <SubmitClaimForm />
        <div className="veil-panel h-fit space-y-4 p-6">
          <h2 className="text-base font-semibold">What stays hidden</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Confidential label="Distance & agreed rate" note="Witness data, never transmitted." />
            <Confidential label="Shipper budget" note="Carriers can never read it." />
          </div>
          <p className="text-sm text-muted-foreground">
            The chain records only your claim ID, the batch it belongs to, a status and a
            commitment hash.
          </p>
        </div>
      </div>
    </div>
  );
}
