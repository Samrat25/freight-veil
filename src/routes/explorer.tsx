import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, EyeOff, Terminal, ShieldAlert } from "lucide-react";
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
    <div className="mx-auto max-w-5xl px-6 py-12 relative z-10 space-y-8">
      <header className="border-b border-[#1B2128] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="size-4 text-[#9C8552]" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#9C8552]">
            Midnight Indexer · Network Witness
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDE9DC]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Public Ledger Explorer
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A9A390] leading-relaxed">
          A simulation of a block explorer viewed by any anonymous observer — a competitor, a
          journalist, another carrier on the same batch.
        </p>
      </header>

      {/* Explorer Table Card */}
      <div className="rounded-lg bg-[#12181F]/90 border border-[#1B2128] backdrop-blur-md overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#1B2128] bg-[#0B121A]/60">
              <tr className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#6B7178]">
                <th className="px-6 py-3.5 font-medium">Batch ID</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Timestamp</th>
                <th className="px-6 py-3.5 text-right font-medium">Carriers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B2128]">
              {rows === null ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-[#8A8478]">
                    <Loader2 className="mx-auto size-6 animate-spin text-[#9C8552]" />
                    <span className="mt-3 block text-xs font-mono">Reading public contract state…</span>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.batchId} className="transition-colors hover:bg-[#1B2128]/50">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-[#D4AF37]">
                      {row.batchId}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#8A8478]">
                      {formatTimestamp(row.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-[#EDE9DC]">
                      {row.carrierCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-[#12181F]/60 border border-[#1B2128] flex items-center gap-3 text-xs text-[#8A8478]">
        <ShieldAlert className="size-4 text-[#55776D] shrink-0" />
        <span>
          <strong className="text-[#EDE9DC]">Zero Disclosed Rates:</strong> This is everything the public network sees. There are no columns for rate, distance or
          payout amount — those fields do not exist in public state.
        </span>
      </div>
    </div>
  );
}
