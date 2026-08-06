import { Link } from "@tanstack/react-router";
import { WalletConnect } from "./WalletConnect";
import { RoleBadge } from "./RoleBadge";
import { useFreight } from "@/lib/freight-store";

const publicNav = [
  { to: "/", label: "Overview" },
  { to: "/explorer", label: "Public Ledger" },
] as const;

const shipperNav = [
  { to: "/shipper", label: "Dashboard" },
  { to: "/create-batch", label: "Create Batch" },
  { to: "/my-shipments", label: "My Shipments" },
  { to: "/explorer", label: "Public Ledger" },
] as const;

const carrierNav = [
  { to: "/carrier", label: "Dashboard" },
  { to: "/submit-claim", label: "Submit Claim" },
  { to: "/my-claims", label: "My Claims" },
  { to: "/explorer", label: "Public Ledger" },
] as const;

export function SiteHeader() {
  const { role } = useFreight();
  const nav = role === "shipper" ? shipperNav : role === "carrier" ? carrierNav : publicNav;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0B121A]/80 border-b border-[#1B2128]/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Top accent glow line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#9C8552]/50 via-50% to-transparent opacity-80" />
      
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center gap-2">
            <span
              className="text-base font-semibold tracking-tight transition-colors duration-200 group-hover:text-[#D4AF37]"
              style={{ fontFamily: "'Fraunces', serif", color: "#EDE9DC" }}
            >
              FreightVeil
            </span>
            <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase bg-[#12181F] border border-[#2A3138] shadow-[0_0_10px_rgba(85,119,109,0.1)]">
              <span className="size-1.5 rounded-full bg-[#55776D] animate-pulse shadow-[0_0_6px_#55776D]" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#A9A390" }}>
                Midnight ZK
              </span>
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex ml-4">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{
                className: "!text-[#EDE9DC] !bg-[#9C8552]/15 !border-[#9C8552]/40 shadow-[0_0_12px_rgba(156,133,82,0.15)]",
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium border border-transparent transition-all duration-200 hover:text-[#EDE9DC] hover:bg-[#12181F] hover:border-[#2A3138]"
              style={{ color: "#8A8478" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {role ? <RoleBadge role={role} className="hidden sm:inline-flex" /> : null}
          <div className="transition-transform duration-200 hover:scale-[1.02]">
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
}
