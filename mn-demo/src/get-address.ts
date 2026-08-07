import { resolveNetwork, getOrCreateWallet } from './network.js';
import { createWallet } from './wallet.js';

const { network, config } = resolveNetwork();
const WALLET = getOrCreateWallet(network);
const seed = WALLET.seed;

console.log("\n==================================================");
console.log("  MIDNIGHT PREVIEW WALLET ADDRESS");
console.log("==================================================");
console.log(`  Network          : ${network}`);
console.log(`  Mnemonic Phrase  : ${WALLET.mnemonic}`);
console.log(`  Faucet URL       : ${config.faucet}`);

const walletCtx = await createWallet({ network, networkConfig: config, seed });
const address = walletCtx.unshieldedKeystore.getBech32Address().toString();
console.log(`  Wallet Address   : ${address}`);
console.log("==================================================\n");
process.exit(0);
