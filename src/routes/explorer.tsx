import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, EyeOff } from "lucide-react";
import { StatusBadge } from "@/components/freight/StatusBadge";
import { useFreight, formatTimestamp } from "@/lib/freight-store";
import { fetchPublicLedger, type ShipmentBatch } from "@/lib/midnight-api";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Public Ledger Explorer — FreightVeil" },
      {
        name: "description",
        content:
          "Everything a random observer sees on the Midnight network: batch ID, status, timestamp and carrier count. No rates, distances or payout amounts.",
      },
      { property: "og:title", content: "Public Ledger Explorer — FreightVeil" },
      {
        property: "og:description",
        content: "Four public columns. No rates, no distances, no amounts.",
      },
    ],
  }),
  component: ExplorerPage,
});

function ExplorerPage() {
  const { batches } = useFreight();
  const [rows, setRows] = useState<ShipmentBatch[] | null>(null);

  useEffect(() => {
    let active = true;
    setRows(null);
    fetchPublicLedger(batches).then((res) => {
      if (active) setRows(res);
    });
    return () => {
      active = false;
    };
  }, [batches]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Public ledger explorer</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A simulation of a block explorer viewed by any anonymous observer — a competitor, a
          journalist, another carrier on the same batch.
        </p>
      </header>

      <div className="veil-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-5 py-3 font-medium">Batch ID</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Timestamp</th>
              <th className="px-5 py-3 text-right font-medium">Carrier count</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                  <span className="mt-3 block text-xs">Reading public contract state…</span>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.batchId} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5 font-mono text-primary">{row.batchId}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                    {formatTimestamp(row.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono">{row.carrierCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <EyeOff className="size-3.5" aria-hidden="true" />
        This is everything the public network sees. There are no columns for rate, distance or
        payout amount — those fields do not exist in public state.
      </p>
    </div>
  );
}
