import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Radar className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">FreightVeil</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
