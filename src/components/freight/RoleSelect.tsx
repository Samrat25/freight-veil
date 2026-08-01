import { useFreight } from "@/lib/freight-store";
import type { AppRole } from "@/lib/midnight-api";

const options: { role: AppRole; emoji: string; title: string; blurb: string }[] = [
  {
    role: "shipper",
    emoji: "🚢",
    title: "I'm a Shipper",
    blurb: "Lock budgets, track your own batches, raise disputes.",
  },
  {
    role: "carrier",
    emoji: "🚚",
    title: "I'm a Carrier",
    blurb: "File leg claims against a batch ID, track your payouts.",
  },
];

export function RoleSelect({ onSelected }: { onSelected?: () => void }) {
  const { selectRole } = useFreight();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">How are you using FreightVeil?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.role}
            type="button"
            onClick={() => {
              selectRole(option.role);
              onSelected?.();
            }}
            className="veil-panel p-4 text-left transition-colors hover:border-primary/60"
          >
            <span className="text-2xl" aria-hidden="true">
              {option.emoji}
            </span>
            <span className="mt-2 block text-sm font-semibold">{option.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{option.blurb}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Chosen once per session. Your role and shielded address together form the session identity.
      </p>
    </div>
  );
}
