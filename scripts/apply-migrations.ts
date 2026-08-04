/**
 * FreightVeil — Apply Supabase Migrations
 *
 * Reads migration files and applies them via the Supabase SQL REST API.
 * Use this when the Supabase CLI is not available.
 *
 * Usage:
 *   node --import tsx scripts/apply-migrations.ts
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

// Load env
function loadEnv() {
  const envPath = join(ROOT, ".env");
  try {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.warn("Warning: .env not found");
  }
}

loadEnv();

const SUPABASE_URL = process.env["VITE_SUPABASE_URL"] ?? "";
const SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

async function runSQL(sql: string, label: string): Promise<void> {
  console.log(`\n  Applying: ${label} ...`);

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  // Try the management API endpoint instead if rpc fails
  if (!resp.ok) {
    const projectRef = SUPABASE_URL.split("//")[1]?.split(".")[0] ?? "";
    const mgmtResp = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (!mgmtResp.ok) {
      const body = await mgmtResp.text();
      throw new Error(`Migration failed: ${label}\n${body}`);
    }
    console.log(`  ✅ ${label} applied via management API`);
    return;
  }

  console.log(`  ✅ ${label} applied`);
}

async function main() {
  const migrationsDir = join(ROOT, "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  FreightVeil — Supabase Migration Runner");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Project URL  : ${SUPABASE_URL}`);
  console.log(`  Migrations   : ${files.length} files`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    await runSQL(sql, file);
  }

  console.log("\n  ✅ All migrations applied successfully");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error("\n  ❌ Migration failed:", err);
  process.exit(1);
});
