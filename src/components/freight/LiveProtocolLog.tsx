import { Activity, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { useFreight } from "@/lib/freight-store";

export function LiveProtocolLog() {
  const { logs } = useFreight();

  const defaultLogs = [
    {
      id: "default-1",
      title: "Registered Session",
      detail: "Shielded Profile Active in Contract",
      time: "Just now",
      status: "success",
    },
    {
      id: "default-2",
      title: "Wallet Context Initialized",
      detail: "1AM DApp Connector Active",
      time: "2m ago",
      status: "success",
    },
    {
      id: "default-3",
      title: "ZKP Circuits Compiled",
      detail: "Compact Schema Verified",
      time: "15m ago",
      status: "success",
    },
    {
      id: "default-4",
      title: "Shielded Vault Active",
      detail: "tDUST Gas Sponsor Connected",
      time: "1h ago",
      status: "success",
    },
  ];

  const displayLogs = logs.length > 0 ? logs : defaultLogs;

  return (
    <div className="rounded-xl bg-[#12181F]/90 border border-[#1B2128] p-5 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col h-full">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1B2128] mb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-[#34D399] animate-pulse" />
          <h3
            className="text-xs font-semibold uppercase tracking-wider text-[#EDE9DC]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Live Protocol Log
          </h3>
        </div>
        <span className="rounded-full bg-[#55776D]/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#34D399] border border-[#55776D]/40 shadow-[0_0_8px_rgba(52,211,153,0.15)]">
          REAL-TIME
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1 font-mono text-xs">
        {displayLogs.map((log) => (
          <div
            key={log.id}
            className={`rounded-lg border p-3.5 transition-all text-xs ${
              log.status === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-[#1B2128] bg-[#0B121A]/60 text-[#EDE9DC] hover:border-[#9C8552]/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-[#EDE9DC] flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    log.status === "error" ? "bg-red-400" : "bg-[#34D399] shadow-[0_0_6px_#34D399]"
                  }`}
                />
                {log.title}
              </span>
              <span className="text-[10px] text-[#6B7178]">{log.time}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8A8478] pl-4">{log.detail}</p>
            {"txHash" in log && log.txHash ? (
              <p className="mt-1 text-[9px] text-[#9C8552] truncate font-mono pl-4">
                tx: {log.txHash}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
