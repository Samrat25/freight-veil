import { useState } from "react";
import { Loader2, Wallet, Check, Copy } from "lucide-react";
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
import { truncateAddress } from "@/lib/midnight-api";

export function WalletConnect({ size = "default" }: { size?: "default" | "lg" }) {
  const { wallet, connecting, connect, disconnect } = useFreight();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
        >
          <Wallet className="size-4" aria-hidden="true" />
          {wallet ? truncateAddress(wallet.address) : "Connect Wallet"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{wallet ? "Wallet connected" : "Connect a Midnight wallet"}</DialogTitle>
          <DialogDescription>
            {wallet
              ? "This session signs shielded transactions locally. Private inputs never leave your device."
              : "FreightVeil uses a shielded address. Rates, distances and budgets stay in your wallet."}
          </DialogDescription>
        </DialogHeader>

        {wallet ? (
          <div className="space-y-4">
            <div className="veil-panel p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Shielded address
              </p>
              <p className="mt-2 break-all font-mono text-sm text-primary">{wallet.address}</p>
              <p className="mt-3 text-xs text-muted-foreground">{wallet.network}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
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
          <div className="space-y-3">
            <button
              type="button"
              disabled={connecting}
              onClick={handleConnect}
              className="veil-panel flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                {connecting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Wallet className="size-5" />
                )}
              </span>
              <span>
                <span className="block text-sm font-medium">Lace — Midnight</span>
                <span className="block text-xs text-muted-foreground">
                  {connecting ? "Awaiting wallet approval…" : "Browser extension"}
                </span>
              </span>
            </button>
            <p className="text-xs text-muted-foreground">
              Demo environment — no real wallet is contacted.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
