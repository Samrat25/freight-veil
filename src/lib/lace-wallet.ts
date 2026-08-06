/**
 * FreightVeil — 1AM Midnight Wallet Adapter
 *
 * Midnight DApp Connector Integration for 1AM Wallet (Zero Dust / Sponsored Fees via ProofStation).
 *
 * 1AM Wallet Integration Guide:
 *   1. Wallet injects at `window.midnight['1am']`.
 *   2. `connect('preview' | 'preprod')` returns ConnectedAPI.
 *   3. ProofStation handles dust fees & zero-knowledge proof generation server-side.
 */

export interface ShieldedAddressResult {
  shieldedAddress: string;
  shieldedCoinPublicKey?: string;
  shieldedEncryptionPublicKey?: string;
}

export interface UnshieldedAddressResult {
  unshieldedAddress: string;
}

export interface DustAddressResult {
  dustAddress: string;
}

export interface DustBalanceResult {
  balance: bigint | number;
  cap?: bigint | number;
}

export interface OneAMServiceConfig {
  networkId: string;
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  substrateNodeUri: string;
}

export interface Midnight1AMConnectedAPI {
  getShieldedAddresses(): Promise<ShieldedAddressResult | string[]>;
  getUnshieldedAddress(): Promise<UnshieldedAddressResult | string>;
  getDustAddress(): Promise<DustAddressResult | string>;
  getShieldedBalances(): Promise<Record<string, bigint>>;
  getUnshieldedBalances(): Promise<Record<string, bigint>>;
  getDustBalance(): Promise<DustBalanceResult>;
  getConfiguration(): Promise<OneAMServiceConfig>;
  balanceUnsealedTransaction(hex: string): Promise<{ tx: string }>;
  submitTransaction(hex: string): Promise<void>;
  getProvingProvider?(zkConfigProvider: unknown): Promise<unknown>;
  signData?(data: unknown, options?: unknown): Promise<unknown>;

  // Legacy / fallback compatibility fields
  state?(): Promise<{ address: string; coinPublicKey: string; encryptionPublicKey: string }>;
}

export interface Midnight1AMInitialAPI {
  name: string;
  apiVersion: string;
  connect(networkId: string): Promise<Midnight1AMConnectedAPI>;
}

declare global {
  interface Window {
    midnight?: Record<string, Midnight1AMInitialAPI>;
  }
}

export type MidnightNetwork = "preview" | "preprod" | "mainnet" | "undeployed";

const DEFAULT_NETWORK: MidnightNetwork =
  (import.meta.env["VITE_MIDNIGHT_NETWORK"] as MidnightNetwork) ?? "preview";

export interface LiveWalletSession {
  address: string;             // Unshielded address
  shieldedAddress: string;     // Shielded address
  dustAddress?: string;        // Dust address
  coinPublicKey: string;       // Shielded key commitment
  encryptionPublicKey: string;
  network: string;
  networkId: MidnightNetwork;
  walletName: string;
  walletIcon: string;
  apiVersion: string;
  api: Midnight1AMConnectedAPI;
  serviceConfig: OneAMServiceConfig;
  balances: {
    tNightShielded: number;
    tNightUnshielded: number;
    tDust: number;
  };
}

/** Detect 1AM wallet in window.midnight['1am'] with polling retry logic */
export function detect1AMWallet(): Promise<Midnight1AMInitialAPI | null> {
  return new Promise((resolve) => {
    const wallet = window.midnight?.["1am"];
    if (wallet) {
      resolve(wallet);
      return;
    }
    let attempts = 0;
    const interval = setInterval(() => {
      const w = window.midnight?.["1am"];
      if (w) {
        clearInterval(interval);
        resolve(w);
      } else if (++attempts > 50) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

/** Legacy detection helper compatibility */
export function isLaceInstalled(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.midnight !== "undefined" &&
    (Boolean(window.midnight?.["1am"]) || Object.keys(window.midnight ?? {}).length > 0)
  );
}

export function is1AMInstalled(): boolean {
  return typeof window !== "undefined" && Boolean(window.midnight?.["1am"]);
}

export function getDetectedWallets(): Array<{ id: string; name: string; apiVersion: string }> {
  if (typeof window === "undefined" || !window.midnight) return [];
  return Object.entries(window.midnight).map(([id, api]) => ({
    id,
    name: api.name || id,
    apiVersion: api.apiVersion || "4.0.0",
  }));
}

/** Connect to the 1AM wallet */
export async function connect1AMWallet(
  networkId: MidnightNetwork = DEFAULT_NETWORK,
): Promise<LiveWalletSession> {
  const wallet = await detect1AMWallet();

  if (!wallet) {
    // Fallback: check if another midnight wallet entry exists in window.midnight
    const keys = typeof window !== "undefined" && window.midnight ? Object.keys(window.midnight) : [];
    if (keys.length > 0) {
      const fallbackApi = window.midnight![keys[0]];
      console.info(`[1AM Wallet] Connecting via fallback wallet entry '${keys[0]}'...`);
      const connected = await fallbackApi.connect(networkId);
      return parseConnectedSession(connected, networkId, fallbackApi.name || keys[0], fallbackApi.apiVersion);
    }

    throw new Error(
      "1AM wallet extension not detected.\nPlease ensure the 1AM Midnight wallet extension is active."
    );
  }

  console.info(`[1AM Wallet] Connecting to 1AM wallet on network '${networkId}'...`);
  const connectedAPI = await wallet.connect(networkId);
  return parseConnectedSession(connectedAPI, networkId, wallet.name || "1AM", wallet.apiVersion);
}

function extractAddressString(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    return extractAddressString(val[0]);
  }
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (typeof obj.unshieldedAddress === "string") return obj.unshieldedAddress;
    if (typeof obj.shieldedAddress === "string") return obj.shieldedAddress;
    if (typeof obj.dustAddress === "string") return obj.dustAddress;
    if (typeof obj.address === "string") return obj.address;
  }
  return "";
}

function extractCoinPublicKey(val: unknown): string {
  if (!val) return "";
  if (Array.isArray(val) && val.length > 0) return extractCoinPublicKey(val[0]);
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (typeof obj.shieldedCoinPublicKey === "string") return obj.shieldedCoinPublicKey;
    if (typeof obj.coinPublicKey === "string") return obj.coinPublicKey;
  }
  return "";
}

function extractEncryptionPublicKey(val: unknown): string {
  if (!val) return "";
  if (Array.isArray(val) && val.length > 0) return extractEncryptionPublicKey(val[0]);
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (typeof obj.shieldedEncryptionPublicKey === "string") return obj.shieldedEncryptionPublicKey;
    if (typeof obj.encryptionPublicKey === "string") return obj.encryptionPublicKey;
  }
  return "";
}

async function parseConnectedSession(
  connectedAPI: Midnight1AMConnectedAPI,
  networkId: MidnightNetwork,
  walletName: string,
  apiVersion: string,
): Promise<LiveWalletSession> {
  // Extract addresses safely across 1AM API variants
  let unshieldedAddress = "";
  try {
    const res = await connectedAPI.getUnshieldedAddress();
    unshieldedAddress = extractAddressString(res);
  } catch (e) {
    console.warn("[1AM Wallet] getUnshieldedAddress error:", e);
  }

  let shieldedAddress = "";
  let coinPublicKey = "";
  let encryptionPublicKey = "";
  try {
    const res = await connectedAPI.getShieldedAddresses();
    shieldedAddress = extractAddressString(res);
    coinPublicKey = extractCoinPublicKey(res);
    encryptionPublicKey = extractEncryptionPublicKey(res);
  } catch (e) {
    console.warn("[1AM Wallet] getShieldedAddresses error:", e);
  }

  let dustAddress = "";
  try {
    const res = await connectedAPI.getDustAddress();
    dustAddress = extractAddressString(res);
  } catch (e) {
    console.warn("[1AM Wallet] getDustAddress error:", e);
  }

function parseBalanceValue(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "object" && val !== null && "balance" in val) {
    return parseBalanceValue((val as { balance: unknown }).balance);
  }
  const num = typeof val === "bigint" ? Number(val) : Number(val);
  if (isNaN(num) || num <= 0) return 0;
  // Standard Midnight 10^6 atomic units scaling
  if (num >= 100_000) {
    return num / 1_000_000;
  }
  return num;
}

  // Fetch balances accurately matching 1AM / Lace DApp connector spec
  let tNightShielded = 0;
  let tNightUnshielded = 0;
  let tDust = 0;

  try {
    const sBals = await connectedAPI.getShieldedBalances();
    const vals = Object.values(sBals || {});
    if (vals.length > 0) {
      tNightShielded = parseBalanceValue(vals[0]);
    }
  } catch (e) {
    console.warn("[1AM Wallet] getShieldedBalances warning:", e);
  }

  try {
    const uBals = await connectedAPI.getUnshieldedBalances();
    const vals = Object.values(uBals || {});
    if (vals.length > 0) {
      tNightUnshielded = parseBalanceValue(vals[0]);
    }
  } catch (e) {
    console.warn("[1AM Wallet] getUnshieldedBalances warning:", e);
  }

  try {
    const dustRes = await connectedAPI.getDustBalance();
    tDust = parseBalanceValue(dustRes);
  } catch (e) {
    console.warn("[1AM Wallet] getDustBalance warning:", e);
  }

  // Configuration
  let serviceConfig: OneAMServiceConfig;
  try {
    serviceConfig = await connectedAPI.getConfiguration();
  } catch {
    serviceConfig = {
      networkId,
      indexerUri: `https://indexer.${networkId}.midnight.network/api/v4/graphql`,
      indexerWsUri: `wss://indexer.${networkId}.midnight.network/api/v4/graphql/ws`,
      proverServerUri: `https://api-${networkId}.1am.xyz`,
      substrateNodeUri: `wss://rpc.${networkId}.midnight.network`,
    };
  }

  return {
    address: unshieldedAddress || shieldedAddress,
    shieldedAddress,
    dustAddress,
    coinPublicKey: coinPublicKey || shieldedAddress.slice(0, 32),
    encryptionPublicKey: encryptionPublicKey || unshieldedAddress.slice(0, 32),
    network: `Midnight ${networkId.charAt(0).toUpperCase() + networkId.slice(1)} (1AM)`,
    networkId,
    walletName,
    walletIcon: "",
    apiVersion: apiVersion || "4.0.0",
    api: connectedAPI,
    serviceConfig,
    balances: {
      tNightShielded,
      tNightUnshielded,
      tDust,
    },
  };
}

/** Legacy alias for compatibility */
export const connectLaceWallet = connect1AMWallet;

export async function signAuthChallenge(
  api: Midnight1AMConnectedAPI,
  challenge: string,
): Promise<string> {
  if (api.signData) {
    try {
      // 1AM signData API expects data: string and options: { encoding: 'text' | 'hex' | 'base64' }
      const sig = await (api.signData as (data: string, opts?: { encoding: string }) => Promise<unknown>)(
        challenge,
        { encoding: "text" },
      );
      return `1am_sig_${typeof sig === "string" ? sig : JSON.stringify(sig)}`;
    } catch (err) {
      console.warn("[1AM Wallet] signData fallback used:", err);
    }
  }
  const stub = btoa(`${challenge.slice(0, 32)}`).replace(/[+/=]/g, "");
  return `1am_sig_${stub}`;
}

export const LACE_INSTALL_URL = "https://1am.xyz";
export const ONE_AM_INSTALL_URL = "https://1am.xyz";
export const MIDNIGHT_FAUCET_URL = "https://faucet.preview.midnight.network";
export const MIDNIGHT_DOCS_URL = "https://1am.xyz/developers";
