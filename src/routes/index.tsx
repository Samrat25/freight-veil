import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeOff, Route as RouteIcon, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/freight/WalletConnect";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FreightVeil — Confidential Multi-Carrier Settlement" },
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

const pillars = [
  {
    Icon: ShieldCheck,
    title: "Funds locked, not disclosed",
    body: "A shipper commits a total budget as a private witness. The contract proves it covers every leg without publishing a number.",
  },
  {
    Icon: RouteIcon,
    title: "Per-leg proofs",
    body: "Each carrier submits distance and agreed rate privately. The contract verifies the contracted rate and releases exactly that payout.",
  },
  {
    Icon: EyeOff,
    title: "Nothing leaks sideways",
    body: "Competitors, other carriers on the same batch, and the public network see only status and carrier count.",
  },
];

function Landing() {
  return (
    <div>
      <section className="veil-grid relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[var(--gradient-veil)] opacity-70 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
            midnight · shielded settlement layer
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            <span className="text-gradient-veil">Pay every carrier fairly. Reveal nothing.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Shippers lock funds for multi-leg shipments; carriers get paid their contracted rate the
            moment their leg is proven; nobody — not competitors, not other carriers on the same
            batch, not the public — ever sees individual rates or distances. Settlement runs
            entirely inside a Midnight smart contract, so the only thing the network publishes is
            that a batch exists and whether it cleared.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <WalletConnect size="lg" />
            <Button asChild variant="outline" size="lg">
              <Link to="/explorer">
                See what the public sees
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map(({ Icon, title, body }) => (
            <article key={title} className="veil-panel p-6">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/12 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>

        <div className="veil-panel mt-14 grid gap-8 p-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Two consoles, one shielded batch</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Shippers open batches and trigger settlement. Carriers file leg claims and see a
              payout confirmation — never an amount belonging to anyone else.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/shipper">Shipper dashboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/carrier">Carrier dashboard</Link>
              </Button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 self-center">
            {[
              ["Public fields", "4"],
              ["Disclosed rates", "0"],
              ["Proof per leg", "1"],
              ["Settlement", "On-chain"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-border bg-muted/25 px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
                <dd className="mt-1 font-mono text-xl text-primary">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
