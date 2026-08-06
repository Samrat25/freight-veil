import { useNavigate, useLocation, Link } from "@tanstack/react-router";
import OptionWheel from "@/components/ui/OptionWheel";
import { Compass } from "lucide-react";
import { WalletConnect } from "./WalletConnect";
import { RoleBadge } from "./RoleBadge";
import { useFreight } from "@/lib/freight-store";

const NAV_ITEMS = [
  { label: "Overview", path: "/" },
  { label: "Shipper Console", path: "/shipper" },
  { label: "Carrier Console", path: "/carrier" },
  { label: "Public Ledger", path: "/explorer" },
  { label: "Create Batch", path: "/create-batch" },
  { label: "Submit Claim", path: "/submit-claim" },
];

export function SiteSidebar() {
  const { wallet, role } = useFreight();
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.path === location.pathname)
  );

  const handleWheelChange = (index: number) => {
    const target = NAV_ITEMS[index];
    if (target && target.path !== location.pathname) {
      navigate({ to: target.path });
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 z-40 border-r border-[#1B2128] bg-[#0B121A]/90 backdrop-blur-xl p-4 shadow-[4px_0_30px_rgba(0,0,0,0.5)]">
      {/* Top Branding & Logo */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1B2128]">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="text-base font-semibold tracking-tight text-[#EDE9DC]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            FreightVeil
          </span>
          <span
            className="rounded-sm px-1.5 py-0.5 text-[9px] font-medium tracking-wider uppercase bg-[#12181F] text-[#A9A390] border border-[#2A3138]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            ZK
          </span>
        </Link>
        {role ? <RoleBadge role={role} /> : null}
      </div>

      {/* Navigator Header */}
      <div className="flex items-center gap-2 px-2 py-2 mt-2 mb-1">
        <Compass className="size-4 text-[#9C8552] animate-spin-slow" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9C8552]">
          Wheel Navigator
        </span>
      </div>

      {/* OptionWheel Interactive Component */}
      <div className="flex-1 relative w-full my-auto overflow-hidden min-h-[300px]">
        <OptionWheel
          items={NAV_ITEMS.map((i) => i.label)}
          defaultSelected={activeIndex >= 0 ? activeIndex : 0}
          onChange={handleWheelChange}
          textColor="#8A8478"
          activeColor="#D4AF37"
          side="left"
          fontSize={1.05}
          spacing={1.75}
          curve={0.8}
          tilt={6}
          blur={1.5}
          fade={0.35}
          smoothing={180}
          inset={18}
          draggable
        />
      </div>

      {/* Footer Wallet & Status */}
      <div className="pt-3 border-t border-[#1B2128] space-y-3">
        <div className="flex justify-center">
          <WalletConnect />
        </div>
        <p className="text-center text-[10px] font-mono text-[#6B7178]">
          Scroll or drag wheel to navigate
        </p>
      </div>
    </aside>
  );
}
