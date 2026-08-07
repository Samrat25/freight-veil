# FreightVeil — Product Proposal

## Chosen Idea: Private Payroll / Splits

> **"Distribute funds without exposing amounts"**

---

## 1. Problem Statement

In traditional freight logistics, **multi-carrier settlement** involves a shipper paying multiple carriers for different legs of a shipment route. This process currently suffers from critical privacy failures:

| Problem | Impact |
|---------|--------|
| Carrier per-km rates are visible to competitors | Carriers lose negotiating power and face rate undercutting |
| Shipper budgets are exposed on public ledgers | Competitors gain unfair intelligence on operational costs |
| Payment amounts are traceable on-chain | Third parties can reverse-engineer business relationships |
| Settlement records link carrier identities to routes | Operational route intelligence leaks to competitors |

Traditional blockchain solutions (Ethereum, Solana, etc.) record all payment amounts transparently on a public ledger. Even "private" payment channels still expose the total value locked and the number of participants.

---

## 2. Solution: FreightVeil

FreightVeil is a **confidential multi-carrier settlement platform** built on the **Midnight blockchain**. It implements the "Private Payroll / Splits" pattern for the logistics industry:

### How It Maps to "Private Payroll / Splits"

| Payroll / Splits Concept | FreightVeil Implementation |
|--------------------------|---------------------------|
| **Employer** (distributes funds) | **Shipper** (locks total freight budget in escrow) |
| **Employees** (receive split payments) | **Carriers** (claim per-leg contracted payouts) |
| **Private amounts** | Per-km rate × distance = payout — all computed inside ZK circuits, never published |
| **Verifiable distribution** | Compact ZK proofs verify `rate × distance ≤ budget` without revealing any values |
| **Anti-double-payment** | Cryptographic nullifiers prevent any carrier from claiming the same leg twice |

### Core Privacy Guarantees

1. **The shipper's total budget is a private witness** — it never appears on-chain or in any database
2. **Each carrier's per-km rate is a private witness** — competitors cannot learn what others charge
3. **Distance driven per leg is a private witness** — route intelligence stays confidential
4. **Only a mathematical proof is published** — the proof verifies `rate × distance ≤ cost` without revealing any of the three values

---

## 3. Privacy Model — What an Observer Can and Cannot Learn

### What IS Visible (Public Ledger State)

| Data Point | Visibility | Purpose |
|-----------|-----------|---------|
| Batch ID | Public `Bytes<32>` | Unique identifier for a shipment settlement batch |
| Batch Status | Public enum (`locked` / `settled` / `disputed`) | Settlement lifecycle state |
| Shipper Commitment | Public hash | Proves shipper registered without revealing identity |
| Carrier Commitment | Public hash | Proves carrier registered without revealing identity |
| Nullifier Hash | Public hash | Prevents double-settlement (anti-replay) |
| Stealth Payout Address | Public derived address | Unlinkable to carrier's persistent wallet |

### What is NOT Visible (Private / ZK-Protected)

| Data Point | Protection Method | Why It Matters |
|-----------|------------------|---------------|
| Total shipper budget | Private witness (never leaves browser) | Competitors cannot learn operational budgets |
| Per-km carrier rate | Private witness in ZK circuit | Carriers retain rate negotiation power |
| Distance per leg | Private witness in ZK circuit | Route intelligence stays confidential |
| Payout amount per carrier | Computed inside ZK circuit only | No one can see how much any carrier received |
| Shipper real identity | Hidden behind commitment hash | No PII on-chain |
| Carrier real identity | Hidden behind commitment hash + stealth address | Cannot link carrier wallet to payout |

### What the User PROVES Without Revealing

- **Shipper proves**: `budget ≥ total_freight_cost` (sufficient funds) — without revealing the budget amount
- **Carrier proves**: `rate × distance ≤ cost` (valid claim) — without revealing rate, distance, or cost
- **Both prove**: They hold a valid registered role commitment — without revealing their wallet address or private key
- **Nullifier proves**: This batch hasn't been settled before — without revealing which batches exist

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FreightVeil dApp                         │
├────────────────────┬────────────────────┬───────────────────────┤
│   Shipper Console  │  Carrier Console   │   Public Explorer     │
│   - Lock escrow    │  - Submit claim    │   - View batch status │
│   - Dispute batch  │  - Track payouts   │   - Verify proofs     │
└────────┬───────────┴────────┬───────────┴───────────┬───────────┘
         │                    │                       │
         ▼                    ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              1AM / Lace Wallet Extension (Browser)              │
│  - Private key storage     - ZK proof generation (in-browser)   │
│  - tNIGHT / tDUST balance  - Transaction signing popup         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Midnight Blockchain (Testnet)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              freightveil.compact Contract                 │   │
│  │                                                           │   │
│  │  Public State:              Private Witnesses:            │   │
│  │  - batchStatus (Map)        - localSecretKey              │   │
│  │  - shipperCommitment        - getShipperBudget()          │   │
│  │  - carrierCommitment        - getTotalFreightCost()       │   │
│  │  - spentNullifiers          - getCarrierRate()            │   │
│  │  - batchCount               - getCarrierDistance()        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Midnight Network (Preview / Preprod Testnet) |
| Smart Contract | Compact (Midnight's ZK circuit language) |
| Wallet | 1AM / Lace DApp Connector API v4 |
| Frontend | React 19, TypeScript, Vite, TanStack Router |
| Styling | Tailwind CSS, Glassmorphism, GSAP animations |
| Off-chain DB | Supabase PostgreSQL with Row-Level Security |
| CI/CD | GitHub Actions (build, test, lint, contract check) |
| Deployment | Vercel (SPA with rewrites) |

---

## 6. Target Users

| User | Role | Value Proposition |
|------|------|-------------------|
| **Freight Shippers** | Lock multi-carrier budgets | Budgets stay private; competitors can't learn operational costs |
| **Independent Carriers** | Claim per-leg payouts | Per-km rates are never exposed; prevents rate undercutting |
| **Logistics Brokers** | Audit settlement batches | Verify all payouts are valid without seeing private financial data |
| **Supply Chain Auditors** | Compliance verification | Cryptographic proof of correct settlement without accessing PII |

---

## 7. Competitive Advantage

| vs Traditional Systems | FreightVeil Advantage |
|-----------------------|----------------------|
| Bank wire / ACH settlements | On-chain verifiability without financial exposure |
| Ethereum smart contracts | Private amounts via Midnight ZK circuits (not possible on Ethereum) |
| Off-chain escrow services | Trustless — no intermediary holds funds |
| Manual rate negotiations | Cryptographic guarantee that carrier can't overclaim |
| Public blockchain settlements | Zero financial data visible to block explorers |

---

## 8. Test Suite (8/8 Passing)

| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | `registerAsShipper` succeeds | Shipper can register with commitment hash |
| 2 | `registerAsCarrier` succeeds | Carrier can register with commitment hash |
| 3 | `createShipmentBatch` succeeds | Shipper with sufficient budget can lock escrow |
| 4 | `createShipmentBatch` reverts for carrier | Role-gating prevents carriers from creating batches |
| 5 | `settleBatch` succeeds | Carrier with valid `rate × distance ≤ cost` can settle |
| 6 | `settleBatch` reverts for shipper | Role-gating prevents shippers from settling |
| 7 | `settleBatch` reverts on double-claim | Nullifier prevents re-settlement of same batch |
| 8 | `disputeBatch` succeeds for original shipper only | Only batch owner can dispute |

---

## 9. Links

- **Live Demo**: [https://freight-veil.vercel.app](https://freight-veil.vercel.app)
- **GitHub**: [https://github.com/Samrat25/freight-veil](https://github.com/Samrat25/freight-veil)
- **Demo Video**: [Watch on Google Drive](https://drive.google.com/file/d/176Yer44_DlC4WiHkqqNZYUBgogaRv9vk/view?usp=sharing)
- **Contract on Midnight Explorer**: [View on Preview Explorer](https://explorer.preview.midnight.network/address/0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4)
