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
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(11,18,26,0.88)",
        borderBottom: "1px solid #1B2128",
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: "'Fraunces', serif", color: "#EDE9DC" }}
          >
            FreightVeil
          </span>
          <span
            className="rounded-sm px-1.5 py-0.5 text-[9px] font-medium tracking-wider uppercase"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              backgroundColor: "#1B2128",
              color: "#A9A390",
              border: "1px solid #2A3138",
            }}
          >
            Midnight ZK
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "!text-[#EDE9DC]" }}
              className="rounded-md px-3 py-1.5 text-sm transition-colors hover:text-[#EDE9DC]"
              style={{ color: "#8A8478" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {role ? <RoleBadge role={role} className="hidden sm:inline-flex" /> : null}
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
