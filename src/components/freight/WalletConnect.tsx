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
import { truncateAddress, isLaceInstalled, getDetectedWallets, getWalletSession } from "@/lib/midnight-api";
import type { MidnightNetwork } from "@/lib/lace-wallet";
import { ONE_AM_INSTALL_URL, MIDNIGHT_FAUCET_URL } from "@/lib/lace-wallet";

/** Safely scale raw balance → human-readable. If raw ≥ 1000 it's atomic (÷10^6). */
function scaleBalance(raw: number): number {
  if (isNaN(raw) || raw <= 0) return 0;
  if (raw >= 1_000) return raw / 1_000_000;
  return raw;
}

function formatDisplayAmount(val: unknown): string {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return "0.00";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toFixed(2);
}

export function WalletConnect({ size = "default" }: { size?: "default" | "lg" }) {
  const { wallet, role, connecting, connect, disconnect } = useFreight();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [walletDetected, setWalletDetected] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<MidnightNetwork>("preview");

  const [liveDust, setLiveDust] = useState<number | null>(null);
  const [liveUnshielded, setLiveUnshielded] = useState<number | null>(null);
  const [liveShielded, setLiveShielded] = useState<number | null>(null);

  const session = getWalletSession();

  useEffect(() => {
    const check = () => {
      setWalletDetected(isLaceInstalled());
      setDetectedWallets(getDetectedWallets().map((w) => w.name));
    };
    check();
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, []);

  // Live balance polling directly from connected 1AM wallet API
  useEffect(() => {
    if (!wallet) {
      setLiveDust(null);
      setLiveUnshielded(null);
      setLiveShielded(null);
      return;
    }

    const fetchLiveBalances = async () => {
      const liveSession = getWalletSession();
      if (!liveSession?.api) return;
      const api = liveSession.api as Record<string, Function>;

      try {
        if (typeof api.getDustBalance === "function") {
          const dustRes = await api.getDustBalance();
          const raw = dustRes?.balance !== undefined ? Number(dustRes.balance) : Number(dustRes);
          if (!isNaN(raw)) setLiveDust(scaleBalance(raw));
        }
        if (typeof api.getUnshieldedBalances === "function") {
          const uBals = await api.getUnshieldedBalances();
          const vals = Object.values(uBals || {});
          if (vals.length > 0) {
            const raw = Number(vals[0]);
            if (!isNaN(raw)) setLiveUnshielded(scaleBalance(raw));
          }
        }
        if (typeof api.getShieldedBalances === "function") {
          const sBals = await api.getShieldedBalances();
          const vals = Object.values(sBals || {});
          if (vals.length > 0) {
            const raw = Number(vals[0]);
            if (!isNaN(raw)) setLiveShielded(scaleBalance(raw));
          }
        }
      } catch (err) {
        console.warn("[FreightVeil] Live balance refresh warning:", err);
      }
    };

    fetchLiveBalances();
    const interval = setInterval(fetchLiveBalances, 2000);
    return () => clearInterval(interval);
  }, [wallet]);

  const displayDust = liveDust ?? session?.balances?.tDust ?? 0;
  const displayUnshieldedBal = liveUnshielded ?? session?.balances?.tNightUnshielded ?? 0;
  const displayShieldedBal = liveShielded ?? session?.balances?.tNightShielded ?? 0;

  const displayUnshieldedAddress =
    session?.address || wallet?.address || "";

  const displayShieldedAddress =
    session?.shieldedAddress || session?.coinPublicKey || "";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleNetworkSwitch = async (net: MidnightNetwork) => {
    setSelectedNetwork(net);
    if (wallet) {
      await connect(net);
    }
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
          {wallet ? truncateAddress(displayUnshieldedAddress || wallet.address) : "Connect 1AM Wallet"}
          {wallet && role ? (
            <span className="ml-1" aria-label={`Role: ${role}`}>
              {role === "shipper" ? "🚢" : "🚚"}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-w-[92vw] overflow-hidden p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-5 text-primary shrink-0" />
            1AM Wallet
          </DialogTitle>
          <DialogDescription className="uppercase tracking-widest text-[10px] text-muted-foreground">
            Midnight Network · Real Extension Signing
          </DialogDescription>
        </DialogHeader>

        {wallet && !role ? (
          <RoleSelect onSelected={() => setOpen(false)} />
        ) : wallet ? (
          /* ── Connected State ── */
          <div className="space-y-3 w-full min-w-0 overflow-hidden">
            {/* Status badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active</span>
              </div>
              <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-400 shrink-0">
                <Zap className="size-2.5" />
                Real Signing
              </span>
            </div>

            {/* Unshielded Address */}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Unshielded Address</p>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2 min-w-0">
                <p className="flex-1 min-w-0 truncate font-mono text-[11px] text-foreground">
                  {displayUnshieldedAddress || "—"}
                </p>
                <button
                  onClick={() => handleCopy(displayUnshieldedAddress, "address")}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "address" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Shielded Key Commitment */}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Shield className="size-3 shrink-0" />
                Shielded Key Commitment
              </p>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2 min-w-0">
                <p className="flex-1 min-w-0 truncate font-mono text-[11px] text-foreground">
                  {displayShieldedAddress || "—"}
                </p>
                <button
                  onClick={() => handleCopy(displayShieldedAddress, "key")}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "key" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border p-2.5 bg-card min-w-0 overflow-hidden">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">tNIGHT</p>
                <p className="mt-0.5 text-xs font-bold text-foreground truncate font-mono">
                  {formatDisplayAmount(displayShieldedBal)} <span className="text-[10px] font-normal text-muted-foreground">shielded</span>
                </p>
                <p className="text-xs font-bold text-foreground truncate font-mono">
                  {formatDisplayAmount(displayUnshieldedBal)} <span className="text-[10px] font-normal text-muted-foreground">unshielded</span>
                </p>
              </div>
              <div className="rounded-md border border-border p-2.5 bg-card min-w-0 overflow-hidden">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">tDUST Fuel</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-400 truncate font-mono">
                  {formatDisplayAmount(displayDust)}
                </p>
                <span className="text-[9px] text-emerald-400/70 block truncate">ProofStation</span>
              </div>
            </div>

            {/* Network Selector */}
            <div className="rounded-md border border-border p-2.5">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-1.5">
                <Globe className="size-3 shrink-0" />
                Network
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(["preview", "preprod", "undeployed"] as MidnightNetwork[]).map((net) => (
                  <button
                    key={net}
                    onClick={() => handleNetworkSwitch(net)}
                    className={`rounded border px-2 py-1 text-[11px] font-medium capitalize transition-colors ${
                      selectedNetwork === net
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {net === "undeployed" ? "Local" : net}
                  </button>
                ))}
              </div>
            </div>

            {/* Role badge */}
            {role && (
              <div className="flex items-center gap-2">
                <RoleBadge role={role} />
                <span className="text-xs text-muted-foreground truncate">{wallet.network}</span>
              </div>
            )}

            {/* Faucet link */}
            <a
              href={MIDNIGHT_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary hover:bg-primary/20 transition-colors w-full"
            >
              Get Testnet Tokens (Faucet)
              <ExternalLink className="size-3 shrink-0" />
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
          /* ── Not Connected ── */
          <div className="space-y-3 w-full min-w-0">
            <button
              type="button"
              disabled={connecting}
              onClick={() => connect(selectedNetwork)}
              id="1am-connect-button"
              className="veil-panel flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary shrink-0">
                {connecting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Zap className="size-5" />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium">1AM / Lace Wallet (Midnight)</span>
                <span className="block text-xs text-muted-foreground truncate">
                  {connecting
                    ? "Opening extension popup..."
                    : walletDetected
                    ? "Browser extension detected ✓"
                    : detectedWallets.length > 0
                    ? `Wallets: ${detectedWallets.join(", ")}`
                    : "Zero-dust sponsored transactions"}
                </span>
              </span>
            </button>

            {/* Network pre-selector before connecting */}
            <div className="rounded-md border border-border p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-2">
                <Globe className="size-3 shrink-0" />
                Select Network
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["preview", "preprod", "undeployed"] as MidnightNetwork[]).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setSelectedNetwork(net)}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                      selectedNetwork === net
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {net === "undeployed" ? "Local" : net}
                  </button>
                ))}
              </div>
            </div>

            {!walletDetected && !connecting && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  No wallet extension detected.{" "}
                  <a
                    href={ONE_AM_INSTALL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-amber-300"
                    id="install-1am-link"
                  >
                    Install 1AM
                    <ExternalLink className="size-3" />
                  </a>
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {walletDetected
                ? "Clicking connect opens your browser extension popup."
                : "Without an extension, the app operates in local dev mode."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
