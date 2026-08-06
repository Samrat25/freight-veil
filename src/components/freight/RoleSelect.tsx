import { useNavigate } from "@tanstack/react-router";
import { useFreight } from "@/lib/freight-store";
import type { AppRole } from "@/lib/midnight-api";

const options: { role: AppRole; emoji: string; title: string; blurb: string; path: string }[] = [
  {
    role: "shipper",
    emoji: "🚢",
    title: "I'm a Shipper",
    blurb: "Lock budgets, track your own batches, raise disputes.",
    path: "/shipper",
  },
  {
    role: "carrier",
    emoji: "🚚",
    title: "I'm a Carrier",
    blurb: "File leg claims against a batch ID, track your payouts.",
    path: "/carrier",
  },
];

export function RoleSelect({ onSelected }: { onSelected?: () => void }) {
  const { selectRole } = useFreight();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#EDE9DC]" style={{ fontFamily: "'Fraunces', serif" }}>
          Select Session Role
        </p>
        <p className="text-xs text-[#8A8478] mt-1">
          Choose your perspective. You will be forwarded to your dedicated console.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.role}
            type="button"
            onClick={() => {
              selectRole(option.role);
              onSelected?.();
              navigate({ to: option.path });
            }}
            className="group relative p-4 text-left rounded-lg bg-[#12181F] border border-[#1B2128] transition-all duration-300 hover:border-[#9C8552] hover:bg-[#1B2128]/70 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(156,133,82,0.15)] cursor-pointer"
          >
            <span className="text-3xl block mb-2 transition-transform group-hover:scale-110" aria-hidden="true">
              {option.emoji}
            </span>
            <span className="block text-sm font-semibold text-[#EDE9DC] group-hover:text-[#D4AF37] transition-colors">
              {option.title}
            </span>
            <span className="mt-1 block text-xs text-[#8A8478] leading-relaxed">
              {option.blurb}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-[#6B7178] font-mono">
        💡 Chosen once per session. Role + shielded address form your session identity.
      </p>
    </div>
  );
}
