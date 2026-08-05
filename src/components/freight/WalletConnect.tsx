import { useState, useEffect } from "react";
import { Loader2, Wallet, Check, Copy, ExternalLink, AlertCircle, Shield, Globe, Zap } from "lucide-react";
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
import { truncateAddress, isLaceInstalled, getDetectedWallets } from "@/lib/midnight-api";
import type { MidnightNetwork } from "@/lib/lace-wallet";
import { ONE_AM_INSTALL_URL, MIDNIGHT_FAUCET_URL } from "@/lib/lace-wallet";

export function WalletConnect({ size = "default" }: { size?: "default" | "lg" }) {
  const { wallet, role, connecting, connect, disconnect } = useFreight();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [walletDetected, setWalletDetected] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<MidnightNetwork>("preview");

  useEffect(() => {
    const check = () => {
      setWalletDetected(isLaceInstalled());
      setDetectedWallets(getDetectedWallets().map((w) => w.name));
    };
    check();
    const timer = setTimeout(check, 500);
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
          {wallet ? truncateAddress(wallet.address) : "Connect 1AM Wallet"}
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
            <Wallet className="size-5 text-primary" />
            1AM Wallet
          </DialogTitle>
          <DialogDescription className="uppercase tracking-widest text-[10px] text-muted-foreground flex items-center gap-1">
            Midnight Network · Zero-Dust ProofStation
          </DialogDescription>
        </DialogHeader>

        {wallet && !role ? (
          <RoleSelect onSelected={() => setOpen(false)} />
        ) : wallet ? (
          /* ── Connected State (1AM Wallet & MidRoll Dashboard style) ── */
          <div className="space-y-4">
            {/* Status badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">1AM Connected</span>
              </div>
              <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                <Zap className="size-3" />
                Zero-Dust Sponsored
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
                  {wallet.address.slice(0, 18)}...{wallet.address.slice(-8)}
                </p>
                <button
                  onClick={() => handleCopy(wallet.address, "key")}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "key" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border p-3 bg-card">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">tNIGHT Balance</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  0 <span className="text-xs font-normal text-muted-foreground">tNIGHT</span>
                </p>
                <span className="text-[9px] text-muted-foreground">Private ZK Ledger</span>
              </div>
              <div className="rounded-md border border-border p-3 bg-card">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">tDUST Fuel</p>
                <p className="mt-1 text-lg font-bold text-emerald-400">
                  0 <span className="text-xs font-normal text-muted-foreground">tDUST</span>
                </p>
                <span className="text-[9px] text-emerald-400/80">ProofStation Sponsored</span>
              </div>
            </div>

            {/* Network Selector */}
            <div className="rounded-md border border-border p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-2">
                <Globe className="size-3" />
                Target Midnight Network
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["preview", "preprod", "mainnet"] as MidnightNetwork[]).map((net) => (
                  <button
                    key={net}
                    onClick={() => setSelectedNetwork(net)}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                      selectedNetwork === net
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {net}
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

            {/* Faucet link */}
            <a
              href={MIDNIGHT_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary hover:bg-primary/20 transition-colors"
            >
              Get Testnet Tokens (Faucet)
              <ExternalLink className="size-3" />
            </a>

            {/* Disconnect button */}
            <Button
              variant="outline"
              className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
              id="disconnect-wallet-button"
              onClick={async () => {
                await disconnect();
                setOpen(false);
              }}
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          /* ── Not Connected — 1AM Extension Picker ── */
          <div className="space-y-3">
            <button
              type="button"
              disabled={connecting}
              onClick={() => connect()}
              id="1am-connect-button"
              className="veil-panel flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                {connecting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Zap className="size-5" />
                )}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">1AM Wallet (Midnight)</span>
                <span className="block text-xs text-muted-foreground">
                  {connecting
                    ? "Connecting to 1AM..."
                    : walletDetected
                    ? "1AM extension detected ✓"
                    : detectedWallets.length > 0
                    ? `Wallets: ${detectedWallets.join(", ")}`
                    : "Zero-dust sponsored transactions"}
                </span>
              </span>
            </button>

            {!walletDetected && !connecting && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  1AM wallet not detected.{" "}
                  <a
                    href={ONE_AM_INSTALL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-amber-300"
                    id="install-1am-link"
                  >
                    Install 1AM Wallet
                    <ExternalLink className="size-3" />
                  </a>{" "}
                  for zero-dust Midnight transactions.
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {walletDetected
                ? "Click to connect your 1AM wallet. ProofStation automatically sponsors transaction fees."
                : "Without 1AM wallet, the app operates in local simulation mode."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
