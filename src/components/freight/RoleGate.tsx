import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "./WalletConnect";
import { RoleSelect } from "./RoleSelect";
import { roleMeta } from "./RoleBadge";
import { useFreight } from "@/lib/freight-store";
import type { AppRole } from "@/lib/midnight-api";

/**
 * Client-side role separation for the demo. Real enforcement lives in the
 * Midnight contract — this only makes the boundary visible in the UI.
 */
export function RoleGate({ requires, children }: { requires: AppRole; children: ReactNode }) {
  const { wallet, role } = useFreight();
  const meta = roleMeta[requires];

  if (!wallet) {
    return (
      <Shell
        title="Connect a wallet to continue"
        body="This console is scoped to a session identity — connect a Midnight wallet, then choose your role."
      >
        <WalletConnect />
      </Shell>
    );
  }

  if (!role) {
    return (
      <Shell title="Choose your role" body="Your wallet is connected but no role is set yet.">
        <div className="w-full max-w-xl text-left">
          <RoleSelect />
        </div>
      </Shell>
    );
  }

  if (role !== requires) {
    return (
      <Shell
        title={`This action requires ${meta.article} account`}
        body={`You're signed in as ${roleMeta[role].emoji} ${roleMeta[role].label}. ${meta.label} actions are blocked for this session identity — disconnect and reconnect to switch roles.`}
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link to={role === "shipper" ? "/shipper" : "/carrier"}>
              Back to {roleMeta[role].label} dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/explorer">View public ledger</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return <>{children}</>;
}

function Shell({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="veil-panel mx-auto flex max-w-2xl flex-col items-center gap-4 p-10 text-center">
        <span className="flex size-11 items-center justify-center rounded-md bg-warning/12 text-warning">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{body}</p>
        {children}
      </div>
    </div>
  );
}
