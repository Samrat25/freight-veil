/**
 * FreightVeil — Supabase Client
 *
 * Typed Supabase browser client. Import `supabase` anywhere in the app.
 *
 * Environment variables (set in .env):
 *   VITE_SUPABASE_URL      — your project URL
 *   VITE_SUPABASE_ANON_KEY — public anon key (safe to expose in browser)
 *
 * The service-role key is used server-side in Edges and sync helpers.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env["VITE_SUPABASE_ANON_KEY"] as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_URL !== "https://placeholder.supabase.co" &&
  !SUPABASE_URL.includes("placeholder")
);

if (!isSupabaseConfigured) {
  console.info(
    "[FreightVeil] Running in local/offline state mode (Supabase unconfigured or using placeholder URL).",
  );
}

// ─── Typed client ─────────────────────────────────────────────────────────────

export const supabase = createClient<Database>(
  SUPABASE_URL ?? "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY ?? "placeholder",
  {
    auth: {
      // We use custom JWT auth (wallet signatures), not Supabase's built-in
      // email/password flow. The session is set manually after verification.
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      // Enable real-time for notifications table so UI updates instantly
      // when a counterparty triggers a status change.
      params: { eventsPerSecond: 2 },
    },
  },
);

const SERVICE_ROLE_KEY =
  (import.meta.env["VITE_SUPABASE_SERVICE_ROLE_KEY"] as string | undefined) ||
  SUPABASE_ANON_KEY;

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL ?? "https://placeholder.supabase.co",
  SERVICE_ROLE_KEY ?? "placeholder",
  {
    auth: { persistSession: false },
  },
);

// ─── Typed table helpers ──────────────────────────────────────────────────────

/** Typed helper: profiles table */
export const profilesTable = () => supabase.from("profiles");

/** Typed helper: batches_view table */
export const batchesTable = () => supabase.from("batches_view");

/** Typed helper: notifications table */
export const notificationsTable = () => supabase.from("notifications");

/** Typed helper: batches_public view (anon-accessible) */
export const batchesPublicView = () => supabase.from("batches_public");

// ─── Connection test (dev only) ───────────────────────────────────────────────
if (import.meta.env.DEV && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase
    .from("batches_public")
    .select("batch_id", { count: "exact", head: true })
    .then(({ error }) => {
      if (error) {
        console.warn("[FreightVeil] Supabase connection test failed:", error.message);
      } else {
        console.info("[FreightVeil] Supabase connection OK ✅");
      }
    });
}
