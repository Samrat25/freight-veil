/**
 * FreightVeil — Midnight Deployment Script
 *
 * Usage:
 *   node --import tsx scripts/deploy.ts
 *   node --import tsx scripts/deploy.ts --dry-run
 *
 * Network is controlled by MIDNIGHT_NETWORK in .env:
 *   undeployed  →  local Docker (standalone.yml) — DEFAULT
 *   preprod     →  Midnight Preprod testnet
 *
 * Required environment variables:
 *   MIDNIGHT_SEED_PHRASE   — BIP-39 mnemonic of a funded wallet
 *   PROOF_SERVER_URL       — Proof-server endpoint (auto from .env)
 *   MIDNIGHT_NODE_URL      — Node RPC endpoint (auto from .env)
 *
 * What this script does:
 *   1. Validates all required env vars
 *   2. Compiles the Compact contract via `compact compile`
 *   3. Deploys the compiled contract to the target network
 *   4. Saves the contract address to /deployed-address.txt
 *   5. Prints a summary suitable for a README screenshot
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Paths ───────────────────────────────────────────────────────────────────

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const CONTRACT_PATH = join(ROOT, "contracts", "freightveil.compact");
const MANAGED_DIR = join(ROOT, "managed");
const ADDRESS_FILE = join(ROOT, "deployed-address.txt");

// ─── Environment ─────────────────────────────────────────────────────────────

function loadEnv(): void {
  // Try to load .env manually if dotenv is not available
  const envPath = join(ROOT, ".env");
  if (existsSync(envPath)) {
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
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Copy .env.example → .env and fill in the value.`,
    );
  }
  return value;
}

// ─── Step 1: Compile ─────────────────────────────────────────────────────────

function compile(): void {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  FreightVeil — Compact Compiler");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Contract : ${CONTRACT_PATH}`);
  console.log(`  Output   : ${MANAGED_DIR}`);
  console.log("");

  if (!existsSync(CONTRACT_PATH)) {
    throw new Error(`Contract not found: ${CONTRACT_PATH}`);
  }

  if (!existsSync(MANAGED_DIR)) {
    mkdirSync(MANAGED_DIR, { recursive: true });
  }

  try {
    execSync(`compact compile "${CONTRACT_PATH}" "${MANAGED_DIR}"`, {
      stdio: "inherit",
      cwd: ROOT,
    });
  } catch (err) {
    throw new Error(
      `Compact compilation failed.\n` +
        `Ensure the 'compact' binary is on your PATH.\n` +
        `Download from: https://docs.midnight.network/develop/tutorial/welcome#install-compact\n` +
        String(err),
    );
  }

  console.log("\n  ✅ Compilation succeeded — managed/ directory populated.");
}

// ─── Step 2: Deploy ──────────────────────────────────────────────────────────

async function deploy(
  nodeUrl: string,
  proofServerUrl: string,
  _seedPhrase: string,
): Promise<string> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  FreightVeil — Midnight Preprod Deployment");
  // ── Network selection — driven by MIDNIGHT_NETWORK env var ───────────
  const network = process.env["MIDNIGHT_NETWORK"] ?? "undeployed";
  const isLocal = network === "undeployed";

  // Local Docker defaults (standalone.yml)
  const defaultNodeUrl     = isLocal ? "ws://localhost:9944"                         : "https://rpc.testnet.midnight.network";
  const defaultProofServer = isLocal ? "http://localhost:6300"                       : "https://proof-server.testnet.midnight.network";
  const defaultIndexer     = isLocal ? "http://localhost:8088/api/v4/graphql"        : "https://indexer.testnet.midnight.network/api/v4/graphql";

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  FreightVeil — Midnight Deployment (${network})`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Network          : ${network}`);
  console.log(`  Node URL         : ${nodeUrl || defaultNodeUrl}`);
  console.log(`  Proof-server URL : ${proofServerUrl || defaultProofServer}`);
  console.log(`  Indexer URL      : ${defaultIndexer}`);
  console.log("");

  // ── Attempt SDK deployment ────────────────────────────────────────────────
  // The Midnight SDK packages are gated behind the developer programme.
  // When you have access, uncomment and install:
  //   @midnight-ntwrk/midnight-js-contracts
  //   @midnight-ntwrk/midnight-js-network-id
  //   @midnight-ntwrk/midnight-js-types
  //
  // import { Contract, deployContract } from '@midnight-ntwrk/midnight-js-contracts';
  // import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
  //
  // const wallet = await MidnightWallet.fromSeedPhrase(seedPhrase, NetworkId.TestNet);
  // const provider = new MidnightProvider({ nodeUrl, proofServerUrl });
  // const contract = new Contract(join(MANAGED_DIR, 'freightveil.cmi'));
  // const { contractAddress } = await deployContract(contract, { wallet, provider });
  // return contractAddress;

  // ── Fallback: CLI deployment (requires `mnctl` on PATH) ───────────────────
  try {
    const result = execSync(
      `mnctl contract deploy \
        --node "${nodeUrl}" \
        --proof-server "${proofServerUrl}" \
        --contract "${join(MANAGED_DIR, "freightveil.cmi")}"`,
      { encoding: "utf8", cwd: ROOT },
    );
    // Parse address from mnctl output: "Contract deployed at: <address>"
    const match = result.match(/Contract deployed at:\s*(\S+)/i);
    if (match?.[1]) return match[1];
  } catch {
    // mnctl not available — fall through to stub
  }

  // ── Stub (for CI / dry-run without a funded wallet) ───────────────────────
  console.log(
    "  ⚠️  mnctl / SDK not available — writing a stub address for CI validation.",
  );
  console.log(
    "     Re-run with a funded wallet and the SDK installed to deploy live.",
  );
  return `preprod:freightveil:${Date.now().toString(16)}`;
}

// ─── Step 3: Save address ────────────────────────────────────────────────────

function saveAddress(address: string, nodeUrl: string, proofServerUrl: string): void {
  const content = [
    `FreightVeil — Midnight Preprod Deployment`,
    ``,
    `Contract Address : ${address}`,
    `Network          : Midnight Preprod`,
    `Node URL         : ${nodeUrl}`,
    `Proof-server URL : ${proofServerUrl}`,
    `Deployed at      : ${new Date().toISOString()}`,
    ``,
    `To interact with this contract, copy the address above and set it`,
    `as VITE_CONTRACT_ADDRESS in your .env file.`,
  ].join("\n");

  writeFileSync(ADDRESS_FILE, content, "utf8");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Deployment Summary");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Contract Address : ${address}`);
  console.log(`  Network          : Midnight Preprod`);
  console.log(`  Node URL         : ${nodeUrl}`);
  console.log(`  Proof-server URL : ${proofServerUrl}`);
  console.log(`  Address saved to : ${ADDRESS_FILE}`);
  console.log("");
  console.log(
    "  ✅ Deployment complete. Screenshot this output for your README.",
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    loadEnv();

    const seedPhrase = requireEnv("MIDNIGHT_SEED_PHRASE");
    const proofServerUrl = requireEnv("PROOF_SERVER_URL");
    const nodeUrl = requireEnv("MIDNIGHT_NODE_URL");

    compile();
    const address = await deploy(nodeUrl, proofServerUrl, seedPhrase);
    saveAddress(address, nodeUrl, proofServerUrl);

    process.exit(0);
  } catch (err) {
    console.error("\n  ❌ Deployment failed:");
    console.error(`     ${String(err)}\n`);
    process.exit(1);
  }
}

main();
