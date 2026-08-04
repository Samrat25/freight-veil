/**
 * FreightVeil — Midnight.js SDK & Lace Wallet Hook
 *
 * Exposes connected state, wallet address, network mode (undeployed / preprod),
 * and circuit execution functions for the dApp UI.
 */

import { useState, useCallback, useEffect } from "react";
import {
  isLaceInstalled,
  connectLaceWallet,
  LACE_INSTALL_URL,
  type LiveWalletSession,
} from "../lib/lace-wallet";
import { executeSignedTransaction } from "../lib/midnight-api";

export interface MidnightHookState {
  isInstalled: boolean;
  connected: boolean;
  connecting: boolean;
  address: string | null;
  networkId: "undeployed" | "preprod";
  network: string;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (net: "undeployed" | "preprod") => void;
  callCircuit: (
    circuitName: string,
    args: Record<string, unknown>,
    privateInputs?: Record<string, unknown>,
  ) => Promise<{ txHash: string; success: boolean }>;
}

export function useMidnight(): MidnightHookState {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<"undeployed" | "preprod">(
    (import.meta.env["VITE_MIDNIGHT_NETWORK"] as "undeployed" | "preprod") ?? "undeployed",
  );
  const [network, setNetwork] = useState<string>("Midnight Undeployed");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<LiveWalletSession | null>(null);

  useEffect(() => {
    setIsInstalled(isLaceInstalled());
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);

    if (!isLaceInstalled()) {
      setError(`Lace extension not found. Please install Lace wallet from ${LACE_INSTALL_URL}`);
      setConnecting(false);
      return;
    }

    try {
      const live = await connectLaceWallet();
      setSession(live);
      setAddress(live.address);
      setConnected(true);
      setNetwork(live.network);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(msg);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setConnected(false);
    setAddress(null);
    setSession(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback((net: "undeployed" | "preprod") => {
    setNetworkId(net);
    setNetwork(`Midnight ${net === "preprod" ? "Preprod Testnet" : "Undeployed (Local)"}`);
  }, []);

  const callCircuit = useCallback(
    async (
      circuitName: string,
      args: Record<string, unknown>,
      privateInputs?: Record<string, unknown>,
    ): Promise<{ txHash: string; success: boolean }> => {
      setError(null);
      // Private inputs are used strictly inside ZK circuit proof generation and discarded
      void privateInputs;

      try {
        const txHash = await executeSignedTransaction(circuitName, args);
        return { txHash, success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Circuit call failed";
        setError(msg);
        throw err;
      }
    },
    [],
  );

  return {
    isInstalled,
    connected,
    connecting,
    address,
    networkId,
    network,
    error,
    connect,
    disconnect,
    switchNetwork,
    callCircuit,
  };
}
