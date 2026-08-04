# 🚚 FreightVeil — Confidential Multi-Carrier Shipment Payouts

> A privacy-preserving logistics payout dApp on Midnight blockchain where shippers escrow funds and carriers claim contracted rates — with zero rates, distances, or budgets exposed on-chain.

---

## 🚀 Live Demo

**Deployed Application**: [https://freight-veil.vercel.app](https://freight-veil.vercel.app)

---

## 📜 Contract Address

| Network | Address |
| :--- | :--- |
| **Preprod** | `0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4` |
| **Undeployed (Local)** | `0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4` |

---

## 💡 What This Does

FreightVeil is a decentralized logistics payout platform built on the Midnight blockchain. It allows logistics shippers to lock multi-carrier freight payouts in smart contracts and carriers to claim their contracted payout rates. Financial terms (per-km rates, distances, total budget, profit margins) are verified locally inside browser Zero-Knowledge circuits before settlement, ensuring zero financial leakages to competitors, public block explorers, or off-chain databases.

---

## 🔒 Privacy Model

- **What is PUBLIC**:
  - Batch ID (`Bytes<32>`)
  - Batch status (`locked` = 0, `settled` = 1, `disputed` = 2)
  - Shipper identity commitment (hash of public key derived from secret key)
  - Carrier identity commitment (hash of public key derived from secret key)
  - Total batch count (`Counter`)

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

---

## 🕵️ Privacy Claim

> **Specific Privacy Statement**:
> An on-chain observer or block explorer watching the Midnight network can see only that a shipment batch `0x...` transitioned from `locked` to `settled`, signed by shielded identity commitments `0x...`. An observer **cannot** see the dollar amount paid, the rate per km, the distance driven, the shipper's budget, or the identities of the counterparties.

---

## 🧰 Tech Stack

- **Blockchain Network**: Midnight Network (Preprod Testnet & Local Undeployed Docker)
- **Smart Contract Language**: Compact (Midnight ZK language)
- **SDK & DApp Connector**: `@midnight-ntwrk/midnight-js-network-provider`, `@midnight-ntwrk/dapp-connector-api`
- **Frontend Framework**: React 19, Vite, TypeScript, Tailwind CSS, TanStack Router
- **Wallet Integration**: Lace Midnight Wallet browser extension (`window.midnight.mnLace`)
- **Off-Chain Mirror**: Supabase PostgreSQL with RLS and Custom Wallet Signature Auth

---

## 📌 Prerequisites

- **Lace Wallet Extension**: Installed from [https://www.lace.io/](https://www.lace.io/) (configured for `Preprod` or `Local Undeployed`)
- **Node.js**: v20+ or v22
- **Docker & Docker Compose**: (optional for running local Midnight node stack)

---

## 🚀 Run Locally

```bash
# 1. Clone repository
git clone https://github.com/Samrat25/freight-veil.git
cd freight-veil

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start local Midnight dev stack (Node, Indexer, Proof Server)
npm run docker:up

# 5. Fund local dev wallet
npm run fund:wallet

# 6. Compile & deploy Compact contract
npm run deploy

# 7. Run Vitest test suite (7/7 tests passing)
npm run test

# 8. Start local frontend dev server
npm run dev
```
Open **`http://localhost:8080`** in your browser.

---

## 🎥 Demo Video

> **Demo Video Link**: `[PLACEHOLDER — Record 2-minute video following checklist below]`

### 🎬 2-Minute Demo Video Recording Checklist:
1. **Connect Lace Wallet**: Click "Connect Wallet" — show the shielded wallet address appear on screen.
2. **Call Circuit**: Click "Call Circuit" (`createShipmentBatch` or `settleBatch`) — show the loading indicator during local ZK proof generation.
3. **Show On-Chain Result**: Display the returned signed transaction hash after submission.
4. **Highlight Privacy Guarantee**: Point out the label **`'Proved without revealing your input'`** and explain that private rates, budget, and distances were proved inside ZK circuits without appearing in the UI or on-chain.

---

## 📸 Screenshots & Verification Evidence

### 1. Compact Smart Contract Source Code
![Compact Contract Source](screenshots/contract.png)

### 2. Vitest Test Suite Output (7/7 Passing)
![Test Cases Output](screenshots/test_cases.png)

---

## 📋 Final Level 2 Submission Checklist

- [x] **Lace wallet connect and disconnect working**
- [x] **Circuit called from frontend, proof generated locally**
- [x] **Private input never shown in UI** (`'Proved without revealing your input'` label active)
- [x] **Contract address in README.md (MANDATORY)** (`0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4`)
- [x] **Live demo link in README.md** (`https://freight-veil.vercel.app`)
- [x] **Privacy Claim section in README.md**
- [x] **File structure matches Level 2 spec** (`WalletConnect.tsx`, `CircuitCall.tsx`, `useMidnight.ts`, `vercel.json`)
