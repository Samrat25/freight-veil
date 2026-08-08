# FreightVeil — Product Proposal

## What is it?

FreightVeil is a confidential multi-carrier shipment settlement platform built on the Midnight blockchain. In traditional freight logistics, shippers coordinate multi-leg routes involving several independent transport carriers, requiring escrowed funds to be disbursed upon completed delivery. FreightVeil allows shippers to lock escrowed funds for a shipment batch while carriers claim their contracted payouts for completed legs. Financial terms — including per-kilometer freight rates, individual leg distances, and the shipper's total budget — are verified mathematically correct using zero-knowledge circuits and never appear on the public ledger or in any off-chain database.

## Who is it for?

FreightVeil is designed specifically for independent freight brokers and regional logistics coordinators who manage multi-carrier routes (typically coordinating 3 to 10 carriers per shipment batch). Currently, these brokers rely on shared spreadsheets, email chains, or centralized portals where freight rates and total route budgets are exposed to counterparties. This creates a critical business pain point: when carriers observe what competing carriers are paid, or when competing brokers discover a shipper's total budget, the broker loses rate negotiation leverage, suffers margin compression through rate undercutting, and risks losing carrier partnerships. FreightVeil eliminates this exposure while guaranteeing valid payment distribution.

## Why Midnight specifically?

Choosing the right platform for confidential financial settlements requires evaluating trade-offs across three distinct architectures:

1. **Public Blockchains (Ethereum, Solana, etc.)**: Public ledgers expose every transaction amount, wallet balance, and contract state to anyone inspecting the blockchain. On a public chain, competitors and carriers could easily read exact per-km rates, route costs, and shipper budgets directly from a block explorer — creating the exact privacy leak FreightVeil exists to eliminate.
2. **Centralized Databases (PostgreSQL, AWS, etc.)**: A centralized server can keep rate data hidden from the general public, but it forces all parties to place total trust in a single central operator. If the central database is misconfigured, breached, or subpoenaed, confidential commercial agreements are leaked. Furthermore, centralized databases offer zero cryptographic proof that payouts were calculated honestly without administrative tampering.
3. **Midnight's Compact ZK Circuits**: Midnight solves both failure modes by enabling zero-knowledge privacy directly inside smart contracts written in Compact. Using local zero-knowledge circuits executed on the user's own device, the shipper proves that `allocated_budget >= total_freight_cost`, while the carrier proves that `agreed_rate × leg_distance <= contracted_cost`. Midnight's on-chain ledger verifies the validity of these mathematical proofs without the raw dollar amounts, rates, or distances ever leaving the user's local device.

## Feasibility

FreightVeil is not a conceptual proposal or a future roadmap — it is a production-grade application with all core mechanisms fully built, tested, and deployed today:

- **100% Passing Automated Test Suite**: 11/11 automated unit tests passing under Vitest (`tests/freightveil.test.ts` and `tests/counter.test.ts`), covering role-gating, budget validation, rate multiplication proofs, and nullifier-based anti-double-claim protection.
- **Live Testnet Deployments**: Smart contracts compiled and deployed on both Midnight Preview Testnet (Contract Address: `0x62a27ceda5eb600263e208768d5d285c659d47f2cd6b14a20c62b160f4da46f3`, Block `#317,084`, viewable on [MidnightExplorer](https://midnightexplorer.com/contracts/0x62a27ceda5eb600263e208768d5d285c659d47f2cd6b14a20c62b160f4da46f3)) and Midnight Preprod Testnet.
- **Automated CI/CD Pipeline**: Active GitHub Actions workflow (`.github/workflows/compact-ci.yml`) performing automated contract compilation, test suite execution, and production build checks on every push, backed by a live passing badge in `README.md`.
- **Multi-Tenant Off-Chain Infrastructure**: Supabase PostgreSQL database with Row-Level Security (RLS) policies and custom wallet challenge-signature authentication (`supabase/migrations/`).
- **Live Production Application**: Fully functional web application deployed at [https://freight-veil.vercel.app](https://freight-veil.vercel.app), integrated with the Midnight DApp Connector v4 API supporting 1AM and Lace wallet extensions.

---

### Project Resources

- **Live Application**: [https://freight-veil.vercel.app](https://freight-veil.vercel.app)
- **GitHub Repository**: [https://github.com/Samrat25/freight-veil](https://github.com/Samrat25/freight-veil)
- **Demo Video**: [Watch on Google Drive](https://drive.google.com/file/d/16ssJqi7vh3jSoQmJ7WR9x_cNmJQLDdlN/view?usp=sharing)
- **Verified Explorer Link**: [View on MidnightExplorer](https://midnightexplorer.com/contracts/0x62a27ceda5eb600263e208768d5d285c659d47f2cd6b14a20c62b160f4da46f3)
