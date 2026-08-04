import { useState, useEffect } from "react";
import { Loader2, Wallet, Check, Copy, ExternalLink, AlertCircle } from "lucide-react";
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

export function WalletConnect({ size = "default" }: { size?: "default" | "lg" }) {
  const { wallet, role, connecting, connect, disconnect } = useFreight();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [laceDetected, setLaceDetected] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);

  // Check for wallet extension on mount and after a short delay
  // (extensions inject slightly after page load)
  useEffect(() => {
    const check = () => {
      const detected = isLaceInstalled();
      const wallets = getDetectedWallets();
      setLaceDetected(detected);
      setDetectedWallets(wallets);
    };
    check();
    const timer = setTimeout(check, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = async () => {
    await connect();
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
          <DialogTitle>
            {!wallet
              ? "Connect a Midnight wallet"
              : role
                ? "Wallet connected"
                : "Choose your role"}
          </DialogTitle>
          <DialogDescription>
            {wallet && !role
              ? "Your role decides which actions this session can take on-chain."
              : wallet
              ? "This session signs shielded transactions locally. Private inputs never leave your device."
              : "FreightVeil uses a shielded address. Rates, distances and budgets stay in your wallet."}
          </DialogDescription>
        </DialogHeader>

        {wallet && !role ? (
          <RoleSelect onSelected={() => setOpen(false)} />
        ) : wallet ? (
          /* ── Connected state ── */
          <div className="space-y-4">
            <div className="veil-panel p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Shielded address
              </p>
              <p className="mt-2 break-all font-mono text-sm text-primary">{wallet.address}</p>
              <div className="mt-3 flex items-center gap-2">
                {role ? <RoleBadge role={role} /> : null}
                <p className="text-xs text-muted-foreground">{wallet.network}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                id="copy-address-button"
                onClick={() => {
                  navigator.clipboard?.writeText(wallet.address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy address"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                id="disconnect-wallet-button"
                onClick={async () => {
                  await disconnect();
                  setOpen(false);
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          /* ── Not connected — show wallet picker ── */
          <div className="space-y-3">

            {/* ── Lace wallet button ── */}
            <button
              type="button"
              disabled={connecting}
              onClick={handleConnect}
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

            {/* ── Install prompt if Lace not detected ── */}
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
                  for Midnight to use real shielded transactions. The button above
                  continues in demo mode.
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {laceDetected
                ? "Click to connect your Lace wallet. You will be asked to approve the connection."
                : "Without Lace, the app runs in demo mode — no real on-chain transactions."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
