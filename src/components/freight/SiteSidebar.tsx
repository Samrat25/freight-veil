import { useNavigate, useLocation } from "@tanstack/react-router";
import OptionWheel from "@/components/ui/OptionWheel";
import { Compass } from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", path: "/" },
  { label: "Shipper Console", path: "/shipper" },
  { label: "Carrier Console", path: "/carrier" },
  { label: "Public Ledger", path: "/explorer" },
  { label: "Create Batch", path: "/create-batch" },
  { label: "Submit Claim", path: "/submit-claim" },
];

export function SiteSidebar() {
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
    <aside className="hidden lg:flex flex-col w-56 h-[calc(100vh-3.5rem)] sticky top-14 z-30 border-r border-[#1B2128] bg-[#0B121A]/70 backdrop-blur-xl p-4">
      <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-[#1B2128]">
        <Compass className="size-4 text-[#9C8552] animate-spin-slow" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9C8552]">
          Wheel Navigator
        </span>
      </div>

      <div className="flex-1 relative w-full h-full my-auto overflow-hidden">
        <OptionWheel
          items={NAV_ITEMS.map((i) => i.label)}
          defaultSelected={activeIndex >= 0 ? activeIndex : 0}
          onChange={handleWheelChange}
          textColor="#8A8478"
          activeColor="#D4AF37"
          side="left"
          fontSize={0.95}
          spacing={1.7}
          curve={0.7}
          tilt={6}
          blur={1.5}
          fade={0.35}
          smoothing={180}
          inset={16}
          draggable
        />
      </div>

      <div className="pt-3 border-t border-[#1B2128] px-2 text-[10px] font-mono text-[#6B7178]">
        Scroll or drag wheel to navigate
      </div>
    </aside>
  );
}
