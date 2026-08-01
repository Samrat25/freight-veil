import type { AppRole } from "@/lib/midnight-api";

export const roleMeta: Record<AppRole, { emoji: string; label: string; article: string }> = {
  shipper: { emoji: "🚢", label: "Shipper", article: "a Shipper" },
  carrier: { emoji: "🚚", label: "Carrier", article: "a Carrier" },
};

export function RoleBadge({ role, className = "" }: { role: AppRole; className?: string }) {
  const meta = roleMeta[role];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary ${className}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
