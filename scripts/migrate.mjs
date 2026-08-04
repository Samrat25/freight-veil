/**
 * Apply FreightVeil migrations via Supabase admin RPC
 * Run: node scripts/migrate.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Load .env manually
const envLines = readFileSync(join(ROOT, ".env"), "utf8").split("\n");
const env = {};
for (const line of envLines) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const URL_BASE = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !SERVICE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const migrations = [
  "supabase/migrations/001_initial_schema.sql",
  "supabase/migrations/002_rls_policies.sql",
];

for (const file of migrations) {
  const sql = readFileSync(join(ROOT, file), "utf8");
  console.log(`\nApplying ${file}...`);

  // Use Supabase SQL endpoint (requires service_role)
  const resp = await fetch(`${URL_BASE}/rest/v1/`, {
    method: "GET",
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    },
  });

  // Try the pg-meta endpoint
  const pgResp = await fetch(`${URL_BASE}/pg/query`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (pgResp.ok) {
    const data = await pgResp.json();
    console.log(`  ✅ Success:`, data);
  } else {
    const text = await pgResp.text();
    console.log(`  ⚠️  Status ${pgResp.status}: ${text}`);
    console.log(`  → Please run this SQL manually in the Supabase Dashboard SQL Editor`);
  }
}
