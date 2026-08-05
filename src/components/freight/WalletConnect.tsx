import { useState, useEffect } from "react";
import { Loader2, Wallet, Check, Copy, ExternalLink, AlertCircle, Shield, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFreight } from "@/lib/freight-store";
import { RoleSelect } from "./RoleSelect";
import { RoleBadge } from "./RoleBadge";
import { truncateAddress, isLaceInstalled, getDetectedWallets, LACE_INSTALL_URL } from "@/lib/midnight-api";
import type { MidnightNetwork } from "@/lib/lace-wallet";
import { MIDNIGHT_FAUCET_URL } from "@/lib/lace-wallet";

export function WalletConnect({ size = "default" }: { size?: "default" | "lg" }) {
  const { wallet, role, connecting, connect, disconnect } = useFreight();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [laceDetected, setLaceDetected] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<MidnightNetwork>("preprod");

  // Simulated balances (real balance queries require indexer integration)
  const tNightBalance = 0;
  const tDustBalance = 0;

  useEffect(() => {
    const check = () => {
      setLaceDetected(isLaceInstalled());
      setDetectedWallets(getDetectedWallets());
    };
    check();
    const timer = setTimeout(check, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={size}
          variant={wallet ? "outline" : "default"}
          className={wallet ? "font-mono text-xs" : "font-medium"}
          id="wallet-connect-button"
        >
          <Wallet className="size-4" aria-hidden="true" />
          {wallet ? truncateAddress(wallet.address) : "Connect Wallet"}
          {wallet && role ? (
            <span className="ml-1" aria-label={`Role: ${role}`}>
              {role === "shipper" ? "🚢" : "🚚"}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Lace Wallet
          </DialogTitle>
          <DialogDescription className="uppercase tracking-widest text-[10px] text-muted-foreground">
            Midnight Blockchain · Zero-Knowledge Payments
          </DialogDescription>
        </DialogHeader>

        {wallet && !role ? (
          <RoleSelect onSelected={() => setOpen(false)} />
        ) : wallet ? (
          /* ── Connected state — MidRoll-style ── */
          <div className="space-y-4">
            {/* Status badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Connected</span>
              </div>
              <span className="rounded border border-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Extension Active
              </span>
            </div>

            {/* Unshielded Address */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Unshielded Address</p>
              <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2.5">
                <p className="flex-1 truncate font-mono text-xs text-foreground">{wallet.address}</p>
                <button
                  onClick={() => handleCopy(wallet.address, "address")}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "address" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Shielded Key Commitment */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Shield className="size-3" />
                Shielded Key Commitment
              </p>
              <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2.5">
                <p className="flex-1 truncate font-mono text-xs text-foreground">
                  {wallet.address.replace('mn_shield-addr_test1', '').slice(0, 16)}...{wallet.address.slice(-8)}
                </p>
                <button
                  onClick={() => handleCopy(wallet.address, "key")}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "key" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">tNight Balance</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  <span className="mr-1 text-muted-foreground">Ø</span>
                  {tNightBalance} <span className="text-xs font-normal text-muted-foreground">tNIGHT</span>
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">tDust ZK Fuel</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  <span className="mr-1 text-muted-foreground">Ø</span>
                  {tDustBalance} <span className="text-xs font-normal text-muted-foreground">tDUST</span>
                </p>
              </div>
            </div>

            {/* Network selector */}
            <div className="rounded-md border border-border p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-2">
                <Globe className="size-3" />
                Target Midnight Network
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['preview', 'devnet', 'preprod'] as MidnightNetwork[]).map((net) => (
                  <button
                    key={net}
                    onClick={() => setSelectedNetwork(net)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      selectedNetwork === net
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {net.charAt(0).toUpperCase() + net.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Role badge */}
            {role && (
              <div className="flex items-center gap-2">
                <RoleBadge role={role} />
                <span className="text-xs text-muted-foreground">{wallet.network}</span>
              </div>
            )}

            {/* Fund wallet link */}
            <a
              href={MIDNIGHT_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              Fund wallet with tNIGHT
              <ExternalLink className="size-3" />
            </a>

            {/* Disconnect */}
            <Button
              variant="outline"
              className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
              id="disconnect-wallet-button"
              onClick={async () => {
                await disconnect();
                setOpen(false);
              }}
            >
              ⏏ Disconnect Wallet
            </Button>
          </div>
        ) : (
          /* ── Not connected — show wallet picker ── */
          <div className="space-y-3">
            <button
              type="button"
              disabled={connecting}
              onClick={() => connect()}
              id="lace-connect-button"
              className="veil-panel flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                {connecting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Wallet className="size-5" />
                )}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">Lace — Midnight</span>
                <span className="block text-xs text-muted-foreground">
                  {connecting
                    ? "Awaiting wallet approval…"
                    : laceDetected
                    ? "Browser extension detected ✓"
                    : detectedWallets.length > 0
                    ? `Detected: ${detectedWallets.join(", ")}`
                    : "Browser extension"}
                </span>
              </span>
            </button>

            {!laceDetected && !connecting && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Lace wallet not detected.{" "}
                  <a
                    href={LACE_INSTALL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-amber-300"
                    id="install-lace-link"
                  >
                    Install Lace
                    <ExternalLink className="size-3" />
                  </a>{" "}
                  for Midnight to use real shielded transactions.
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {laceDetected
                ? "Click to connect your Lace wallet. The extension popup will ask you to approve."
                : "Without Lace, the app runs in demo mode — no real on-chain transactions."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
