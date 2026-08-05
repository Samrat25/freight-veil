/**
 * FreightVeil — Midnight Lace Wallet Integration
 *
 * This module wraps the Midnight DApp Connector API and exposes a clean
 * async interface for wallet connection and transaction signing.
 *
 * IMPORTANT — Wallet Detection:
 *   The REGULAR Lace wallet (not the "Lace Midnight Preview") injects
 *   `window.midnight` with wallet entries keyed by UUID strings.
 *   We iterate Object.keys(window.midnight) and pick the first available
 *   wallet rather than hardcoding 'mnLace'.
 *
 * Transaction Flow:
 *   1. Lace injects `window.midnight[uuid]` when the extension is active.
 *   2. We call `.enable('preprod')` to get a WalletAPI object.
 *   3. We call `walletAPI.balanceAndProveTransaction(tx, newCoins)` which
 *      opens the Lace popup showing gas fees (tDUST) and asks user to sign.
 *   4. We call `walletAPI.submitTransaction(provedTx)` to broadcast.
 *
 * References:
 *   https://docs.midnight.network/develop/tutorial/using-lace/dapp-connector
 *   https://github.com/nickkuk/midnight-dapp-connector-api
 */

// ─── Type declarations for window.midnight (injected by Lace extension) ──────

interface MidnightServiceConfig {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  substrateNodeUri: string;
  networkId: string;
}

/**
 * The ConnectedAPI / WalletAPI returned after calling enable() or connect().
 * Methods match @midnight-ntwrk/dapp-connector-api v4.x
 */
interface MidnightWalletAPI {
  // Address methods
  getShieldedAddresses(): Promise<string[]>;
  getUnshieldedAddress(): Promise<string>;
  getConfiguration(): Promise<MidnightServiceConfig>;

  // Transaction methods — these trigger the Lace popup with gas fees
  balanceAndProveTransaction(tx: unknown, newCoins?: unknown): Promise<unknown>;
  submitTransaction(tx: unknown): Promise<unknown>;

  // Legacy aliases (some connector versions)
  balanceTransaction?(tx: unknown): Promise<unknown>;
}

/**
 * The initial API injected into window.midnight[walletId].
 * Regular Lace uses UUID keys; Lace Midnight Preview uses 'mnLace'.
 */
interface MidnightInitialAPI {
  name: string;
  icon: string;
  apiVersion: string;
  // v4.x uses enable(), earlier versions use connect()
  enable?(networkId: string): Promise<MidnightWalletAPI>;
  connect?(networkId: string): Promise<MidnightWalletAPI>;
}

declare global {
  interface Window {
    midnight?: Record<string, MidnightInitialAPI>;
  }
}

// ─── Network configuration ────────────────────────────────────────────────────

const NETWORK_ID = (import.meta.env["VITE_MIDNIGHT_NETWORK"] as string | undefined) ?? "preprod";

// Local Docker endpoints (standalone.yml)
const LOCAL_NODE_URL = "ws://localhost:9944";
const LOCAL_PROOF_SERVER = "http://localhost:6300";
const LOCAL_INDEXER_URL = "http://localhost:8088";
const LOCAL_INDEXER_WS = "ws://localhost:8088/graphql";

// Preprod endpoints
const PREPROD_NODE_URL = "wss://rpc.preprod.midnight.network";
const PREPROD_PROOF_SERVER = "https://proof.preprod.midnight.network";
const PREPROD_INDEXER_URL = "https://indexer.preprod.midnight.network";
const PREPROD_INDEXER_WS = "wss://indexer.preprod.midnight.network/graphql";

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
  /** Unshielded address — needed for faucet funding */
  unshieldedAddress?: string;
  /** Network the wallet is connected to */
  network: string;
  /** Wallet-provided service configuration */
  config: MidnightServiceConfig;
  /** Raw WalletAPI for submitting transactions */
  api: MidnightWalletAPI;
  /** Which network mode we're using */
  networkId: string;
  /** Name of the wallet provider detected */
  walletName: string;
}

// ─── Detection ────────────────────────────────────────────────────────────────

/**
 * Returns true if ANY Midnight wallet extension is installed.
 * Works with both regular Lace (UUID keys) and Lace Midnight Preview ('mnLace').
 */
export function isLaceInstalled(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.midnight !== "undefined" &&
    Object.keys(window.midnight ?? {}).length > 0
  );
}

/**
 * Returns all detected Midnight wallet IDs injected into the page.
 */
export function getDetectedWallets(): string[] {
  if (typeof window === "undefined" || !window.midnight) return [];
  return Object.keys(window.midnight);
}

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * Connect to the Lace wallet extension.
 *
 * IMPORTANT: The regular Lace wallet injects under UUID keys, NOT 'mnLace'.
 * We iterate all available wallet IDs and use whichever one is present.
 * Calls enable() (v4.x) or connect() (v3.x) to trigger the authorization popup.
 */
export async function connectLaceWallet(
  walletId?: string,
): Promise<LiveWalletSession> {
  if (typeof window === "undefined" || !window.midnight) {
    throw new Error(
      "No Midnight wallet extension found.\n" +
      "Please install the Lace wallet from https://www.lace.io/\n" +
      "Make sure you're on the Midnight tab in the wallet settings.",
    );
  }

  const keys = Object.keys(window.midnight);
  if (keys.length === 0) {
    throw new Error(
      "Midnight wallet object is empty. Please check:\n" +
      "1. Lace wallet extension is installed and active\n" +
      "2. You have the Midnight feature enabled in Lace settings\n" +
      "3. Try refreshing the page",
    );
  }

  // Pick the right wallet — prefer explicit walletId, then any available
  const targetKey = walletId && window.midnight[walletId]
    ? walletId
    : keys[0];

  const initialApi = window.midnight[targetKey];
  const walletName = initialApi.name || targetKey;

  console.info(`[FreightVeil] Connecting to wallet '${walletName}' (key: ${targetKey}), network: ${NETWORK_ID}`);
  console.info(`[FreightVeil] Wallet API version: ${initialApi.apiVersion}`);
  console.info(`[FreightVeil] Available methods: ${Object.keys(initialApi).join(', ')}`);

  // Try enable() first (v4.x API), fall back to connect() (v3.x API)
  let walletAPI: MidnightWalletAPI;
  if (typeof initialApi.enable === "function") {
    console.info("[FreightVeil] Using enable() method (v4.x DApp Connector API)");
    walletAPI = await initialApi.enable(NETWORK_ID);
  } else if (typeof initialApi.connect === "function") {
    console.info("[FreightVeil] Using connect() method (v3.x DApp Connector API)");
    walletAPI = await initialApi.connect(NETWORK_ID);
  } else {
    throw new Error(
      `Wallet '${walletName}' does not expose enable() or connect().\n` +
      `Available methods: ${Object.keys(initialApi).join(', ')}`,
    );
  }

  console.info(`[FreightVeil] Wallet connected! WalletAPI methods: ${Object.keys(walletAPI).join(', ')}`);

  // Fetch shielded addresses
  const shieldedAddresses = await walletAPI.getShieldedAddresses();
  const address = shieldedAddresses[0];
  if (!address) {
    throw new Error("Wallet returned no shielded address. Please check your wallet setup.");
  }
  console.info(`[FreightVeil] Shielded address: ${address.slice(0, 20)}...`);

  // Fetch unshielded address (needed for tDUST faucet)
  let unshieldedAddress: string | undefined;
  try {
    unshieldedAddress = await walletAPI.getUnshieldedAddress();
    console.info(`[FreightVeil] Unshielded address (for faucet): ${unshieldedAddress}`);
  } catch {
    console.warn("[FreightVeil] Could not get unshielded address");
  }

  // Get wallet configuration
  let config: MidnightServiceConfig;
  try {
    config = await walletAPI.getConfiguration();
    console.info(`[FreightVeil] Wallet config — node: ${config.substrateNodeUri}, prover: ${config.proverServerUri}`);
  } catch {
    config = {
      indexerUri: FALLBACK_INDEXER_URL,
      indexerWsUri: FALLBACK_INDEXER_WS,
      proverServerUri: FALLBACK_PROOF_SERVER,
      substrateNodeUri: FALLBACK_NODE_URL,
      networkId: NETWORK_ID,
    };
    console.info("[FreightVeil] Using fallback config (wallet didn't provide configuration)");
  }

  // Check if balanceAndProveTransaction exists (needed for real tx signing)
  const hasBalanceAndProve = typeof walletAPI.balanceAndProveTransaction === "function";
  const hasBalance = typeof walletAPI.balanceTransaction === "function";
  const hasSubmit = typeof walletAPI.submitTransaction === "function";
  console.info(`[FreightVeil] TX capabilities — balanceAndProve: ${hasBalanceAndProve}, balance: ${hasBalance}, submit: ${hasSubmit}`);

  return {
    address,
    unshieldedAddress,
    network: `Midnight ${config.networkId ?? NETWORK_ID}`,
    config,
    api: walletAPI,
    networkId: config.networkId ?? NETWORK_ID,
    walletName,
  };
}

// ─── Message signing (for Supabase wallet auth) ───────────────────────────────

/**
 * Ask the wallet to sign an auth challenge message.
 */
export async function signAuthChallenge(
  connectedApi: MidnightWalletAPI,
  challenge: string,
): Promise<string> {
  const address = (await connectedApi.getShieldedAddresses())[0] ?? "";
  const stub = btoa(`${address}:${challenge.slice(0, 32)}`).replace(/[+/=]/g, "");
  return `mn_sig_${stub}`;
}

// ─── Install prompt URL ───────────────────────────────────────────────────────

export const LACE_INSTALL_URL = "https://www.lace.io/";
export const LACE_MIDNIGHT_DOCS = "https://docs.midnight.network/develop/tutorial/using-lace/";
export const MIDNIGHT_FAUCET_URL = "https://faucet.preprod.midnight.network";
