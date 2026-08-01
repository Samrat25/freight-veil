import { EyeOff } from "lucide-react";

export function Confidential({ label, note }: { label: string; note?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <EyeOff className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 font-mono text-sm text-muted-foreground/80">
        Confidential — shielded on-chain
      </p>
      {note ? <p className="mt-1 text-xs text-muted-foreground/70">{note}</p> : null}
    </div>
  );
}
