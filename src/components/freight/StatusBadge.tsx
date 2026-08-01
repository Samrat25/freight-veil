import { CheckCircle2, Lock, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import type { BatchStatus, ClaimStatus } from "@/lib/midnight-api";

const map = {
  locked: { label: "Locked", Icon: Lock, cls: "border-locked/40 bg-locked/10 text-locked" },
  settled: { label: "Settled", Icon: CheckCircle2, cls: "border-success/40 bg-success/10 text-success" },
  disputed: { label: "Disputed", Icon: AlertTriangle, cls: "border-destructive/40 bg-destructive/10 text-destructive" },
  pending: { label: "Pending proof", Icon: Clock, cls: "border-warning/40 bg-warning/10 text-warning" },
  verified: { label: "Verified", Icon: ShieldCheck, cls: "border-primary/40 bg-primary/10 text-primary" },
  rejected: { label: "Rejected", Icon: AlertTriangle, cls: "border-destructive/40 bg-destructive/10 text-destructive" },
} as const;

export function StatusBadge({ status }: { status: BatchStatus | ClaimStatus }) {
  const { label, Icon, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide ${cls}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
