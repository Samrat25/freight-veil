import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/freight/RoleGate";
import { MyClaims } from "@/components/freight/MyClaims";

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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">My claims</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only claims filed by your session identity. Payout confirmations show settlement, never
          the amount.
        </p>
      </header>
      <MyClaims />
    </div>
  );
}
