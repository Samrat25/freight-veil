import { Activity, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { useFreight } from "@/lib/freight-store";

export function LiveProtocolLog() {
  const { logs } = useFreight();

  return (
    <div className="veil-panel flex flex-col h-full p-4 border border-border bg-card">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Live Protocol Log
          </h3>
        </div>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
          REAL-TIME
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1 font-mono text-xs text-muted-foreground">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <ShieldCheck className="mx-auto size-6 opacity-40 mb-1 text-primary" />
            <p>No circuit calls yet.</p>
            <p className="text-[10px] opacity-70 mt-1">
              Events stream live when circuits execute.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-md border p-2.5 transition-all text-[11px] ${
                log.status === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : log.status === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-border bg-muted/20 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  {log.status === "error" ? (
                    <AlertTriangle className="size-3 text-red-400" />
                  ) : (
                    <CheckCircle2 className="size-3 text-emerald-400" />
                  )}
                  {log.title}
                </span>
                <span className="text-[9px] opacity-70">{log.time}</span>
              </div>
              <p className="text-[10px] leading-relaxed opacity-90">{log.detail}</p>
              {log.txHash && (
                <p className="mt-1 text-[9px] text-muted-foreground truncate font-mono">
                  tx: {log.txHash}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
