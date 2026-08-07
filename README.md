# 🚚 FreightVeil — Confidential Multi-Carrier Shipment Payouts

> A privacy-preserving logistics payout dApp on Midnight blockchain where shippers escrow funds and carriers claim contracted rates — with zero rates, distances, or budgets exposed on-chain.

---

## 🚀 Live Demo & Links

- **Live Application**: [https://freight-veil.vercel.app](https://freight-veil.vercel.app)
- **Demo Video**: [https://drive.google.com/file/d/176Yer44_DlC4WiHkqqNZYUBgogaRv9vk/view?usp=sharing](https://drive.google.com/file/d/16ssJqi7vh3jSoQmJ7WR9x_cNmJQLDdlN/view?usp=sharing)
- **GitHub Repository**: [https://github.com/Samrat25/freight-veil](https://github.com/Samrat25/freight-veil)

---

## 📜 Verifiable Contract Addresses & Explorer Links

| Network | Contract Address | Midnight Explorer Link | Status |
| :--- | :--- | :--- | :--- |
| **Midnight Preview Testnet** | `0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4` | [View on Preview Explorer](https://explorer.preview.midnight.network/address/0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4) | **Active / Deployed** |
| **Midnight Preprod Testnet** | `0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4` | [View on Preprod Explorer](https://explorer.preprod.midnight.network/address/0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4) | **Active / Deployed** |
| **Local Undeployed (Docker)** | `0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4` | `http://localhost:8080` | **Active** |

---

## 💡 What FreightVeil Does

FreightVeil is a decentralized logistics payout platform built on the Midnight blockchain. It allows logistics shippers to lock multi-carrier freight payouts in smart contracts and carriers to claim their contracted payout rates. Financial terms (per-km rates, distances, total budget, profit margins) are verified locally inside browser Zero-Knowledge circuits before settlement, ensuring zero financial leakages to competitors, public block explorers, or off-chain databases.

---

## 🔒 Privacy Model

- **What is PUBLIC**:
  - Batch ID (`Bytes<32>`)
  - Batch status (`locked` = 0, `settled` = 1, `disputed` = 2)
  - Shipper identity commitment (hash of public key derived from secret key)
  - Carrier identity commitment (hash of public key derived from secret key)
  - Nullifier hash (`spentNullifiers` - anti double-claim protection)
  - Stealth payout address (`deriveStealthAddress` - unlinks carrier persistent wallet from payout)

- **What is PRIVATE**:
  - Shipper's total allocated budget (`getShipperBudget`)
  - Contracted freight cost (`getTotalFreightCost`)
  - Carrier's agreed per-km rate (`getCarrierRate`)
  - Leg distance traveled in km (`getCarrierDistance`)
  - Local wallet secret key (`localSecretKey`)

- **What the user PROVES without revealing**:
  - **Shipper Proves**: Allocated budget is $\ge$ contracted freight cost ($\text{budget} \ge \text{cost}$).
  - **Carrier Proves**: Claimed rate $\times$ distance is $\le$ contracted cost ($\text{rate} \times \text{distance} \le \text{cost}$).
  - **Role Membership**: Caller holds a valid registered shipper/carrier identity commitment without revealing raw wallet address or private key.
  - **Nullifier Protection**: Spent nullifier prevents double-claiming payouts for the same batch.

---

## 🕵️ Privacy Claim

> **Specific Privacy Statement**:
> An on-chain observer or block explorer watching the Midnight network can see only that a shipment batch `0x...` transitioned from `locked` to `settled`, signed by shielded identity commitments `0x...`. An observer **cannot** see the dollar amount paid, the rate per km, the distance driven, the shipper's budget, or the identities of the counterparties. All database tables in Supabase store exclusively public batch IDs and statuses — zero financial data touches Supabase.

---

## 🧰 Tech Stack

- **Blockchain Network**: Midnight Network (Preview, Preprod, and Local Node Stack)
- **Smart Contract Language**: Compact (Midnight ZK language)
- **SDK & DApp Connector**: Midnight DApp Connector v4 API (`1AM` & `Lace` Wallet Extensions)
- **Zero-Dust Fee Sponsorship**: `1AM ProofStation` WASM fee sponsorship service
- **Frontend Framework**: React 19, Vite, TypeScript, Tailwind CSS, TanStack Router
- **Off-Chain Layer**: Supabase PostgreSQL with RLS and Custom Wallet Signature Auth

---

## 📌 Prerequisites & Wallet Setup

- **1AM / Lace Wallet Extension**: Download from [https://1am.xyz](https://1am.xyz) or [https://www.lace.io](https://www.lace.io)
- **Supported Networks**: Midnight Preview, Preprod, Local Node

---

## 🚀 Run & Test Locally

```bash
# 1. Clone repository
git clone https://github.com/Samrat25/freight-veil.git
cd freight-veil

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Compile Compact contract & generate managed TypeScript bindings
compact compile ./contracts/freightveil.compact ./managed

# 5. Run Vitest test suite (8/8 tests passing)
npx vitest run

# 6. Start local frontend dev server
npm run dev
```
Open **`http://localhost:8080`** in your browser.

---

## 🧪 Test Suite Results (8/8 Passing)

```
 RUN  v2.1.9 C:/Users/SAMRAT NATTA/OneDrive/Desktop/freight-veil

 ✓ tests/freightveil.test.ts > FreightVeil Contract > 1. registerAsShipper succeeds and stores commitment
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 2. registerAsCarrier succeeds and stores commitment
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 3. createShipmentBatch succeeds for registered shipper with sufficient budget
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 4. createShipmentBatch reverts for a carrier-role wallet
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 5. settleBatch succeeds for registered carrier with valid rate*distance <= cost
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 6. settleBatch reverts for a shipper-role wallet
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 7. settleBatch reverts on a second call against the same batch (nullifier reuse)
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 8. disputeBatch succeeds only for the original shipper, reverts for anyone else

 Test Files  1 passed (1)
      Tests  8 passed (8)
```

---

## 🎥 Demo Video

- **Video Walkthrough Link**: [Watch Demo Video on Google Drive](https://drive.google.com/file/d/176Yer44_DlC4WiHkqqNZYUBgogaRv9vk/view?usp=sharing)

---

## 📋 Level 2 Submission Checklist

- [x] **1AM / Lace wallet connect and disconnect working**
- [x] **Circuit called from frontend, proof generated and signed via extension popup**
- [x] **Observable privacy behavior**: Private inputs (rates, distances, budgets) stay strictly local
- [x] **Contract address in README.md** (`0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4`)
- [x] **Live demo link in README.md** (`https://freight-veil.vercel.app`)
- [x] **Demo video link in README.md** (`https://drive.google.com/file/d/176Yer44_DlC4WiHkqqNZYUBgogaRv9vk/view?usp=sharing`)
- [x] **Privacy Claim section in README.md**
- [x] **Minimum 8+ passing tests** in Vitest (`tests/freightveil.test.ts`)
- [x] **Supabase RLS & Multi-Tenant Company Isolation** (`supabase/migrations/`)
