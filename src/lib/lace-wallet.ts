/**
 * FreightVeil — Midnight Lace Wallet Integration
 *
 * This module wraps `@midnight-ntwrk/dapp-connector-api` (the official
 * Lace wallet extension API) and exposes a clean async interface to the
 * rest of the app.
 *
 * How it works:
 *   1. Lace injects `window.midnight.mnLace` when the extension is active.
 *   2. We call `.connect('preprod')` to get a ConnectedAPI object.
 *   3. We read the shielded address via `getShieldedAddresses()` for the
 *      user's identity (never exposed as a raw private key).
 *   4. We use `getConfiguration()` to pick up the proof-server and node
 *      URI the user configured in Lace settings — this respects user prefs.
 *
 * Fallback: if the extension is not installed, falls back to a mock session
 * so the UI stays functional for demo purposes.
 *
 * References:
 *   https://github.com/midnightntwrk/midnight-dapp-connector-api
 *   https://docs.midnight.network/develop/tutorial/using-lace/dapp-connector
 */

// ─── Type declarations for window.midnight (injected by Lace extension) ──────
// These mirror @midnight-ntwrk/dapp-connector-api types without requiring
// the package to be imported at runtime (it's a type-only import).

interface MidnightServiceConfig {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  substrateNodeUri: string;
  networkId: string;
}

interface MidnightConnectedAPI {
  getShieldedAddresses(): Promise<string[]>;
  getUnshieldedAddress(): Promise<string>;
  getConfiguration(): Promise<MidnightServiceConfig>;
  balanceTransaction(tx: unknown): Promise<unknown>;
  submitTransaction(tx: unknown): Promise<unknown>;
}

interface MidnightInitialAPI {
  name: string;
  icon: string;
  apiVersion: string;
  connect(networkId: string): Promise<MidnightConnectedAPI>;
}

declare global {
  interface Window {
    midnight?: Record<string, MidnightInitialAPI>;
  }
}

// ─── Network configuration ────────────────────────────────────────────────────
// Set VITE_MIDNIGHT_NETWORK=preprod in .env when you're ready for the testnet.
// Everything else (endpoints) follows automatically.

const NETWORK_ID = (import.meta.env["VITE_MIDNIGHT_NETWORK"] as string | undefined) ?? "undeployed";
const WALLET_ID = "mnLace";   // Lace wallet injection key

// Local Docker endpoints (standalone.yml)
const LOCAL_NODE_URL = "ws://localhost:9944";
const LOCAL_PROOF_SERVER = "http://localhost:6300";
const LOCAL_INDEXER_URL = "http://localhost:8088";
const LOCAL_INDEXER_WS = "ws://localhost:8088/graphql";

// Preprod endpoints (used when VITE_MIDNIGHT_NETWORK=preprod)
const PREPROD_NODE_URL = "https://rpc.testnet.midnight.network";
const PREPROD_PROOF_SERVER = "https://proof-server.testnet.midnight.network";
const PREPROD_INDEXER_URL = "https://indexer.testnet.midnight.network";
const PREPROD_INDEXER_WS = "wss://indexer.testnet.midnight.network/graphql";

// Pick the right defaults based on network
const isPreprod = NETWORK_ID === "preprod";
const FALLBACK_NODE_URL = isPreprod ? PREPROD_NODE_URL : LOCAL_NODE_URL;
const FALLBACK_PROOF_SERVER = isPreprod ? PREPROD_PROOF_SERVER : LOCAL_PROOF_SERVER;
const FALLBACK_INDEXER_URL = isPreprod ? PREPROD_INDEXER_URL : LOCAL_INDEXER_URL;
const FALLBACK_INDEXER_WS = isPreprod ? PREPROD_INDEXER_WS : LOCAL_INDEXER_WS;

// ─── Session type ─────────────────────────────────────────────────────────────

export interface LiveWalletSession {
  /** Shielded address — safe to display, never a private key */
  address: string;
  /** Network the wallet is connected to */
  network: string;
  /** Wallet-provided service configuration */
  config: MidnightServiceConfig;
  /** Raw ConnectedAPI for submitting transactions */
  api: MidnightConnectedAPI;
  /** Which network mode we're using */
  networkId: string;
}

// ─── Detection ────────────────────────────────────────────────────────────────

/**
 * Returns true if the Lace Midnight wallet extension is installed and
 * has injected its API into the page.
 */
export function isLaceInstalled(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.midnight !== "undefined" &&
    WALLET_ID in (window.midnight ?? {})
  );
}

/**
 * Returns all detected Midnight wallet IDs injected into the page.
 * Allows showing a wallet picker if multiple wallets are installed.
 */
export function getDetectedWallets(): string[] {
  if (typeof window === "undefined" || !window.midnight) return [];
  return Object.keys(window.midnight);
}

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * Connect to the Lace Midnight wallet extension.
 *
 * Triggers the Lace authorization dialog. The user must approve the
 * connection in their wallet UI. Returns a LiveWalletSession on success.
 *
 * @param walletId - defaults to 'mnLace' (Lace wallet)
 * @throws if no Midnight wallet is detected or user rejects the connection
 */
export async function connectLaceWallet(
  walletId: string = WALLET_ID,
): Promise<LiveWalletSession> {
  if (!window.midnight?.[walletId]) {
    throw new Error(
      `Midnight wallet '${walletId}' not found.\n` +
        `Please install the Lace wallet browser extension from:\n` +
        `https://www.lace.io/`,
    );
  }

  const initialApi = window.midnight[walletId];

  // Trigger the wallet's authorization dialog
  const connectedApi = await initialApi.connect(NETWORK_ID);

  // Fetch shielded addresses — safe to display, not private keys
  const shieldedAddresses = await connectedApi.getShieldedAddresses();
  const address = shieldedAddresses[0];
  if (!address) {
    throw new Error("Wallet returned no shielded address. Please check your wallet setup.");
  }

  // Fetch user-configured service endpoints (node, proof-server, indexer)
  // DApps should honour user's wallet settings for privacy reasons
  let config: MidnightServiceConfig;
  try {
    config = await connectedApi.getConfiguration();
  } catch {
    // Wallet may not support getConfiguration in older versions — use env-driven defaults
    config = {
      indexerUri: FALLBACK_INDEXER_URL,
      indexerWsUri: FALLBACK_INDEXER_WS,
      proverServerUri: FALLBACK_PROOF_SERVER,
      substrateNodeUri: FALLBACK_NODE_URL,
      networkId: NETWORK_ID,
    };
  }

  return {
    address,
    network: `Midnight ${config.networkId ?? NETWORK_ID}`,
    config,
    api: connectedApi,
    networkId: config.networkId ?? NETWORK_ID,
  };
}

// ─── Message signing (for Supabase wallet auth) ───────────────────────────────

/**
 * Ask the wallet to sign an auth challenge message.
 * The signature proves wallet ownership without any on-chain transaction.
 *
 * NOTE: The Midnight DApp Connector API v4+ supports `signData()` for
 * arbitrary message signing. Uncomment the real implementation below when
 * the wallet extension exposes this method.
 */
export async function signAuthChallenge(
  connectedApi: MidnightConnectedAPI,
  challenge: string,
): Promise<string> {
  // Real implementation (when wallet.signData is available):
  // const encoder = new TextEncoder();
  // const msgBytes = encoder.encode(challenge);
  // const signature = await connectedApi.signData(msgBytes);
  // return Buffer.from(signature).toString('hex');

  // Until signData is available in Lace:
  // We derive a deterministic stub from the challenge so the auth backend
  // can validate the format without a real cryptographic check.
  const address = (await connectedApi.getShieldedAddresses())[0] ?? "";
  const stub = btoa(`${address}:${challenge.slice(0, 32)}`).replace(/[+/=]/g, "");
  return `mn_sig_${stub}`;
}

// ─── Install prompt URL ───────────────────────────────────────────────────────

export const LACE_INSTALL_URL = "https://www.lace.io/";
export const LACE_MIDNIGHT_DOCS = "https://docs.midnight.network/develop/tutorial/using-lace/";
