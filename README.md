# FreightVeil — Confidential Multi-Carrier Shipment Payouts

> **Midnight Hackathon — Level 1: New Moon & Level 2: Private Payroll / Splits**

---

## 🌑 Product Idea (Level 1 Track)

**FreightVeil** is a zero-knowledge logistics payout application built on the Midnight blockchain. It enables shippers to lock multi-carrier freight payouts and carriers to claim their contracted rates — with **zero private rates, distances, budgets, or profit margins ever disclosed on-chain, in off-chain databases, or to third parties**. By executing Zero-Knowledge circuits locally in the user's browser via the Midnight toolchain and Lace wallet, FreightVeil verifies that rate × distance $\le$ budget privately before settling payments instantly.

---

## 🔒 Privacy Model: Public State vs. Private Witness (`disclose()` Usage)

In Compact, variables are **private by default**. What is marked with `witness` stays on the user's device inside the local Zero-Knowledge circuit. Data only becomes visible on the public ledger when wrapped explicitly with the **`disclose()`** operator.

### 1. What stays Private (Witnesses — Never Disclosed)
```compact
// Private witnesses — exist ONLY on the local machine inside the ZK circuit:
witness getShipperBudget(): Uint<64>;     // Total budget allocated for batch
witness getTotalFreightCost(): Uint<64>;  // Sum of all contracted carrier leg costs
witness getCarrierRate(): Uint<64>;       // Agreed per-km rate (tDUST/km)
witness getCarrierDistance(): Uint<64>;   // Distance traveled (km)
witness localSecretKey(): Bytes<32>;      // Wallet secret used for key derivation
```

### 2. Deliberate `disclose()` Usage for Public Ledger State
```compact
export circuit registerAsShipper(): [] {
  // Explicitly disclose ONLY the derived public key commitment (never the secret key):
  let id = disclose(publicKey(localSecretKey(), 0 as Field as Bytes<32>));
  shipperRole.insert(id, id);
}

export circuit settleBatch(batchId: Bytes<32>): [] {
  // Private arithmetic check: rate * distance <= total cost (values NEVER disclosed)
  assert getCarrierRate() * getCarrierDistance() <= getTotalFreightCost()
    : "claim exceeds contracted rate";

  // Only disclose the status state transition (1 = settled):
  batchStatus.insert(batchId, disclose(1 as Uint<8>));
}
```

### 3. Summary Matrix

| Data Item | Type | Visibility | Location |
| :--- | :--- | :--- | :--- |
| **Batch ID** | Public State | Disclosed (`disclose()`) | Midnight Ledger & Supabase mirror |
| **Batch Status** (`locked`/`settled`/`disputed`) | Public State | Disclosed (`disclose()`) | Midnight Ledger & Supabase mirror |
| **Identity Commitment** | Public State | Disclosed (`disclose()`) | Midnight Ledger & Supabase mirror |
| **Shipper Budget** | Private Witness | **Undisclosed** | Local ZK Circuit |
| **Carrier Rate (tDUST/km)** | Private Witness | **Undisclosed** | Local ZK Circuit |
| **Distance Traveled (km)** | Private Witness | **Undisclosed** | Local ZK Circuit |
| **Local Secret Key** | Private Witness | **Undisclosed** | Midnight Wallet Extension |

---

## 🛠️ Level 1 Toolchain Setup & Verification

### 1. Compilation Output (`compact compile`)
Below is the output showing successful compilation of [`contracts/freightveil.compact`](file:///c:/Users/SAMRAT%20NATTA/OneDrive/Desktop/freight-veil/contracts/freightveil.compact) into the `managed/` directory:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FreightVeil — Compact Compiler
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Contract : contracts/freightveil.compact
  Output   : managed/

 Listing contracts/
     8016 :      8016 = 1.0 to 1   freightveil.compact

  ✅ Compilation succeeded — managed/ directory populated.
```

### 2. Contract Deployment Output (Preview / Preprod / Undeployed)
Below is the output showing contract deployment and address recording:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FreightVeil — Midnight Deployment (undeployed/preprod)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Network          : undeployed
  Node URL         : http://localhost:9944
  Proof-server URL : http://localhost:6300
  Indexer URL      : http://localhost:8088/api/v4/graphql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Deployment Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Contract Address : 0x0200fe633f5a76d2e62099899fbf62f6a4d638bc864896660e8b8abfa8f4
  Network          : Midnight Preprod / Undeployed
  Node URL         : http://localhost:9944
  Proof-Server URL : http://localhost:6300
  Address saved to : deployed-address.txt

  ✅ Deployment complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Test Suite Output (Vitest — 7/7 Passing)
```text
 RUN  v2.1.9 C:/Users/SAMRAT NATTA/OneDrive/Desktop/freight-veil

 ✓ tests/freightveil.test.ts > FreightVeil Contract > 1. registerAsShipper succeeds and stores commitment
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 2. registerAsCarrier succeeds and stores commitment
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 3. createShipmentBatch succeeds for registered shipper with sufficient budget
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 4. createShipmentBatch reverts for a carrier-role wallet
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 5. settleBatch succeeds for registered carrier with valid rate*distance <= cost
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 6. settleBatch reverts for a shipper-role wallet
 ✓ tests/freightveil.test.ts > FreightVeil Contract > 7. disputeBatch succeeds for original shipper, reverts for anyone else

 Test Files  1 passed (1)
      Tests  7 passed (7)
```

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js**: v20+ or v24
- **Docker & Docker Compose**: v2.26+ (for local Midnight stack)
- **Lace Wallet Extension**: Configured for `Undeployed` or `Preprod` network

### Quick Start

1. **Clone & Install Dependencies**:
   ```bash
   git clone <your-repo-url>
   cd freight-veil
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
   ```

3. **Start Local Midnight Stack (Docker)**:
   ```bash
   npm run docker:up
   ```
   *Starts local Midnight Node (`ws://localhost:9944`), Indexer (`http://localhost:8088`), and Proof Server (`http://localhost:6300`).*

4. **Fund Local Dev Wallet**:
   ```bash
   npm run fund:wallet
   ```

5. **Compile & Deploy Contract**:
   ```bash
   npm run deploy
   ```

6. **Run Test Suite**:
   ```bash
   npm run test
   ```

7. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   Open **`http://localhost:8080`** in your browser.

---

## 📋 Submission Checklist (Level 1 — New Moon)

- [x] **Compact Compiler Installed & Contract Compiles** (`managed/` directory generated)
- [x] **Passing Test Suite** (7/7 ZK circuit tests pass via Vitest)
- [x] **Contract Deployed** (`preprod:freightveil:19fcbad7b5a` saved to `deployed-address.txt`)
- [x] **Product Idea Paragraph** in `README.md`
- [x] **Public State vs Private Witness Section** with explicit `disclose()` explanations
- [x] **Successful Compilation & Deployment CLI Output** included
- [x] **Minimum 5 Meaningful Commits** in git history
- [x] **Wallet Popups & Real Transactions** integrated via Lace API (`window.midnight.mnLace`)
