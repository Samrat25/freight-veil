/**
 * FreightVeil — Wallet Auth Edge Function
 *
 * POST /functions/v1/wallet-auth
 * Body: { walletAddress: string, message: string, signature: string }
 *
 * Verifies the wallet's signed challenge, then issues a custom JWT
 * with sub = walletAddress and role = 'authenticated'.
 *
 * Deploy with:
 *   supabase functions deploy wallet-auth
 *
 * Set secrets:
 *   supabase secrets set SUPABASE_JWT_SECRET=<your-jwt-secret>
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { walletAddress, message, signature } = await req.json() as {
      walletAddress: string;
      message: string;
      signature: string;
    };

    // ── Validate inputs ────────────────────────────────────────────────────
    if (!walletAddress || !message || !signature) {
      return new Response(
        JSON.stringify({ error: "Missing walletAddress, message, or signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Signature verification ─────────────────────────────────────────────
    // Midnight wallets use Ed25519. In production, verify using the Midnight
    // wallet SDK's `verifySignature(message, signature, publicKey)`.
    //
    // For the hackathon, we perform a basic structural check and trust the
    // wallet extension to have signed correctly. Replace the block below with
    // real Ed25519 verification before going to mainnet.
    //
    // import { ed25519 } from 'npm:@noble/curves/ed25519';
    // const publicKey = derivePublicKey(walletAddress);
    // const isValid = ed25519.verify(
    //   hexToBytes(signature),
    //   new TextEncoder().encode(message),
    //   publicKey
    // );
    // if (!isValid) throw new Error('Invalid signature');

    const isWellFormed =
      walletAddress.startsWith("mn_") &&
      typeof signature === "string" &&
      signature.length > 0 &&
      message.includes("FreightVeil wallet authentication");

    if (!isWellFormed) {
      return new Response(
        JSON.stringify({ error: "Signature verification failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Issue JWT ──────────────────────────────────────────────────────────
    const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("SUPABASE_JWT_SECRET is not configured");
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    const expiresIn = 3600; // 1 hour
    const accessToken = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: walletAddress,
        role: "authenticated",
        iss: "supabase",
        iat: getNumericDate(0),
        exp: getNumericDate(expiresIn),
        // Custom claims — accessible in RLS as auth.jwt() ->> 'wallet_address'
        wallet_address: walletAddress,
      },
      key,
    );

    return new Response(
      JSON.stringify({ access_token: accessToken, expires_in: expiresIn }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[wallet-auth] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
