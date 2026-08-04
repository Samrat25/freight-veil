/**
 * FreightVeil — Wallet-Based Supabase Auth
 *
 * Auth flow:
 *   1. User connects Midnight wallet (Lace / Midnight wallet extension).
 *   2. Frontend calls `requestWalletSignature(challenge)` to get a signed message.
 *   3. `walletSignIn(address, message, signature)` verifies the signature and
 *      issues a Supabase session JWT with `sub = wallet_address`.
 *   4. All subsequent Supabase calls are authenticated via this JWT.
 *   5. Supabase RLS reads `auth.jwt() ->> 'sub'` to gate row access.
 *
 * IMPORTANT: We do NOT use Supabase email/password auth. The JWT is a custom
 * token signed with SUPABASE_JWT_SECRET (server-side only). The browser never
 * sees the service role key.
 *
 * This file runs in the browser. The actual JWT signing must happen server-side
 * (see the sign-jwt Edge Function in supabase/functions/sign-jwt/index.ts).
 */

import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletAuthSession {
  walletAddress: string;
  accessToken: string;
  expiresAt: number; // Unix timestamp
}

export interface SignInResult {
  session: WalletAuthSession;
  isNewUser: boolean;
}

// ─── Challenge generation ─────────────────────────────────────────────────────
// The challenge is a random nonce that the wallet signs. This prevents replay
// attacks: each sign-in requires a fresh signature.

export function generateAuthChallenge(walletAddress: string): string {
  const nonce = Math.random().toString(36).slice(2);
  const timestamp = Date.now();
  return (
    `FreightVeil wallet authentication\n\n` +
    `Address: ${walletAddress}\n` +
    `Nonce: ${nonce}\n` +
    `Issued: ${new Date(timestamp).toISOString()}\n\n` +
    `Sign this message to verify wallet ownership. ` +
    `This request will not trigger any blockchain transaction.`
  );
}

// ─── Wallet sign-in ───────────────────────────────────────────────────────────

/**
 * Authenticate with Supabase using a wallet signature.
 *
 * Steps:
 *   1. Send (address, message, signature) to the backend /api/auth endpoint
 *      which verifies the signature and returns a signed JWT.
 *   2. Set the JWT as the Supabase session.
 *   3. Ensure a profile row exists for this wallet.
 *
 * @param walletAddress - the wallet's shielded address
 * @param message       - the challenge message that was signed
 * @param signature     - the wallet's signature over the challenge
 */
export async function walletSignIn(
  walletAddress: string,
  message: string,
  signature: string,
): Promise<SignInResult> {
  // ── Step 1: Exchange signature for a JWT ──────────────────────────────────
  // In production this calls a server endpoint / Edge Function that:
  //   a) Verifies the Ed25519 signature using the Midnight wallet's public key
  //   b) Signs a JWT with { sub: walletAddress, role: 'authenticated' }
  //   c) Returns { access_token, expires_in }
  //
  // For now we call our local /api/auth/wallet endpoint (see server.ts) or
  // fall back to a dev-mode stub so the frontend works without a server.

  let accessToken: string;
  let expiresAt: number;

  try {
    const resp = await fetch("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, message, signature }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(err.error ?? "Auth endpoint returned an error");
    }

    const data = await resp.json() as {
      access_token: string;
      expires_in: number;
    };
    accessToken = data.access_token;
    expiresAt = Date.now() + data.expires_in * 1000;
  } catch (fetchErr) {
    // Dev-mode fallback: stub a JWT so the UI works without the backend.
    // The JWT is unsigned and will fail Supabase RLS — Supabase calls will
    // return empty rows (safe fallback, not a security hole in dev).
    if (import.meta.env.DEV) {
      console.warn(
        "[FreightVeil] Auth endpoint unavailable — using dev stub JWT.\n" +
          "Start the backend with `npm run dev` to enable full auth.",
      );
      const payload = btoa(
        JSON.stringify({ sub: walletAddress, role: "authenticated" }),
      );
      accessToken = `stub.${payload}.stub`;
      expiresAt = Date.now() + 3600 * 1000;
    } else {
      throw fetchErr;
    }
  }

  // ── Step 2: Hydrate Supabase session ─────────────────────────────────────
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: accessToken, // single-token flow — no separate refresh
  });

  // ── Step 3: Upsert profile ────────────────────────────────────────────────
  // We check if this is a new user by attempting to read the profile.
  // Role is NOT set here — it is set by the register circuit call.
  const { data: existing } = await supabase
    .from("profiles")
    .select("wallet_address")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  const isNewUser = !existing;

  return {
    session: { walletAddress, accessToken, expiresAt },
    isNewUser,
  };
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function walletSignOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Session refresh ──────────────────────────────────────────────────────────

export async function getAuthenticatedWallet(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
