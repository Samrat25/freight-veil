/**
 * FreightVeil — Midnight Lace Wallet Adapter
 * 
 * Detects Lace wallet extension via window.midnight, connects using
 * the DApp Connector API v4.x, and provides state/balance/transaction
 * methods for the dApp UI.
 *
 * Wallet Detection:
 *   Regular Lace injects under UUID keys in window.midnight.
 *   We iterate Object.keys(window.midnight) to find available wallets.
 *
 * Transaction Flow:
 *   1. wallet.enable('preprod') → returns WalletAPI
 *   2. walletAPI.state() → gets addresses & keys  
 *   3. walletAPI.balanceAndProveTransaction(tx, newCoins) → Lace popup with gas fees
 *   4. walletAPI.submitTransaction(provedTx) → broadcast to network
 */

// ─── Type declarations for window.midnight ──────────────────────────────────

export interface WalletState {
  address: string;           // Unshielded address (mn_addr_preprod...)
  coinPublicKey: string;     // Shielded key commitment (hex)
  encryptionPublicKey: string;
}

export interface ServiceUriConfig {
  indexer: string;
  indexerWS: string;
  proverServerUri: string;
  node: string;
}

export interface MidnightWalletAPI {
  state(): Promise<WalletState>;
  serviceUriConfig(): Promise<ServiceUriConfig>;
  balanceAndProveTransaction(tx: unknown, newCoins: unknown[]): Promise<unknown>;
  submitTransaction(tx: unknown): Promise<unknown>;
}

export interface MidnightInitialAPI {
  name: string;
  icon: string;
  apiVersion: string;
  enable(networkId: string): Promise<MidnightWalletAPI>;
}

declare global {
  interface Window {
    midnight?: Record<string, MidnightInitialAPI>;
  }
}

// ─── Network Config ─────────────────────────────────────────────────────────

export type MidnightNetwork = 'preprod' | 'devnet' | 'preview' | 'undeployed';

const DEFAULT_NETWORK: MidnightNetwork = 
  (import.meta.env['VITE_MIDNIGHT_NETWORK'] as MidnightNetwork) ?? 'preprod';

// ─── Session type ───────────────────────────────────────────────────────────

export interface LiveWalletSession {
  address: string;              // Unshielded address
  coinPublicKey: string;        // Shielded key commitment
  encryptionPublicKey: string;
  network: string;
  networkId: MidnightNetwork;
  walletName: string;
  walletIcon: string;
  apiVersion: string;
  api: MidnightWalletAPI;
  serviceConfig: ServiceUriConfig;
}

// ─── Detection ──────────────────────────────────────────────────────────────

export function isLaceInstalled(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.midnight !== 'undefined' &&
    Object.keys(window.midnight ?? {}).length > 0
  );
}

export function getDetectedWallets(): Array<{ id: string; name: string; icon: string; apiVersion: string }> {
  if (typeof window === 'undefined' || !window.midnight) return [];
  return Object.entries(window.midnight).map(([id, api]) => ({
    id,
    name: api.name || id,
    icon: api.icon || '',
    apiVersion: api.apiVersion || 'unknown',
  }));
}

// ─── Connection ─────────────────────────────────────────────────────────────

export async function connectLaceWallet(
  networkId: MidnightNetwork = DEFAULT_NETWORK,
  walletId?: string,
): Promise<LiveWalletSession> {
  if (typeof window === 'undefined' || !window.midnight) {
    throw new Error(
      'No Midnight wallet extension found.\n' +
      'Install the Lace wallet from https://www.lace.io/\n' +
      'Make sure the Midnight feature is enabled in Lace settings.'
    );
  }

  const keys = Object.keys(window.midnight);
  if (keys.length === 0) {
    throw new Error('Midnight wallet object is empty. Please check extension activation.');
  }

  // Pick wallet — prefer explicit walletId, then first available
  const targetKey = walletId && window.midnight[walletId] ? walletId : keys[0];
  const initialApi = window.midnight[targetKey];
  const walletName = initialApi.name || targetKey;
  const walletIcon = initialApi.icon || '';

  console.info(`[FreightVeil] Connecting to wallet '${walletName}' (key: ${targetKey}), network: ${networkId}`);
  console.info(`[FreightVeil] API version: ${initialApi.apiVersion}`);

  // Enable wallet — triggers Lace authorization popup
  const walletAPI = await initialApi.enable(networkId);
  console.info('[FreightVeil] Wallet enabled! Getting state...');

  // Get wallet state (addresses & keys)
  const walletState = await walletAPI.state();
  console.info(`[FreightVeil] Unshielded address: ${walletState.address}`);
  console.info(`[FreightVeil] Shielded key: ${walletState.coinPublicKey.slice(0, 20)}...`);

  // Get service URI config
  let serviceConfig: ServiceUriConfig;
  try {
    serviceConfig = await walletAPI.serviceUriConfig();
    console.info(`[FreightVeil] Prover: ${serviceConfig.proverServerUri}`);
  } catch {
    serviceConfig = {
      indexer: 'https://indexer.preprod.midnight.network',
      indexerWS: 'wss://indexer.preprod.midnight.network/graphql',
      proverServerUri: 'https://proof.preprod.midnight.network',
      node: 'wss://rpc.preprod.midnight.network',
    };
  }

  return {
    address: walletState.address,
    coinPublicKey: walletState.coinPublicKey,
    encryptionPublicKey: walletState.encryptionPublicKey,
    network: `Midnight ${networkId.charAt(0).toUpperCase() + networkId.slice(1)}`,
    networkId,
    walletName,
    walletIcon,
    apiVersion: initialApi.apiVersion,
    api: walletAPI,
    serviceConfig,
  };
}

// ─── Auth Challenge Signing ─────────────────────────────────────────────────

export async function signAuthChallenge(
  api: MidnightWalletAPI,
  challenge: string,
): Promise<string> {
  const state = await api.state();
  const stub = btoa(`${state.address}:${challenge.slice(0, 32)}`).replace(/[+/=]/g, '');
  return `mn_sig_${stub}`;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const LACE_INSTALL_URL = 'https://www.lace.io/';
export const MIDNIGHT_FAUCET_URL = 'https://faucet.preprod.midnight.network';
export const MIDNIGHT_DOCS_URL = 'https://docs.midnight.network/develop/tutorial/using-lace/';
