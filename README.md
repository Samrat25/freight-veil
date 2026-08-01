# Freight Veil

Build a web app called "FreightVeil" — a confidential logistics settlement 

dashboard for multi-carrier shipment payouts, built on a privacy-preserving 

blockchain (Midnight). The UI should NOT contain real payment logic — all 

settlement logic happens on-chain via a smart contract; this app is the 

frontend layer that will later be wired to real contract calls.

DESIGN AESTHETIC

Clean, professional fintech/logistics feel. Dark navy (#0B1220) background, 

teal/cyan accent (#2DD4BF), off-white text. Data-forward, generous spacing, 

monospace font for IDs/hashes, sans-serif for everything else. Think Stripe 

dashboard meets a shipping control tower.

PAGES/SCREENS

1. Landing page

   - Hero: "Pay every carrier fairly. Reveal nothing."

   - One-paragraph explainer: shippers lock funds for multi-leg shipments; 

     carriers get paid their contracted rate; nobody — not competitors, not 

     other carriers, not the public — ever sees individual rates or distances.

   - "Connect Wallet" CTA button (mock function `connectWallet()` for now)

2. Shipper Dashboard

   - "Create Shipment Batch" form: batch ID (auto-generated), total budget 

     (private input, never shown again after submit), number of carrier legs

   - List of the shipper's past batches with status badges: 

     🔒 Locked / ✅ Settled / ⚠️ Disputed

   - Clicking a batch shows ONLY: batch ID, status, timestamp, carrier count 

     — explicitly labeled "Confidential" next to where rate/cost would be

3. Carrier Dashboard

   - "Submit Leg Claim" form: batch ID, distance traveled, agreed rate 

     (both private inputs)

   - List of claims submitted with status

   - A payout confirmation view showing only "Payout settled" — no amount

4. Public Ledger Explorer (mock page — this is the key differentiator)

   - A simple table simulating what a blockchain explorer would show any 

     random observer: Batch ID | Status | Timestamp | Carrier Count

   - Explicitly NO columns for rate, distance, or payout amount

   - Small caption: "This is everything the public network sees."

5. Wallet connect flow

   - Mock a "Lace / Midnight Wallet" connect modal (button + fake address 

     display like mn_shield-addr_... truncated)

TECH NOTES

- React + Tailwind, single-page app with client-side routing

- All "submit" actions should call clearly-named placeholder functions 

  (e.g. createShipmentBatch(), settleBatch(), submitCarrierClaim()) that 

  currently just update local state — these will be replaced with real 

  Midnight contract calls later, so keep them isolated in one api.js-style 

  file

- Status badges use icons + color (green/amber/red), not just text

- Include loading/pending states for all async-looking actions

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3a6e8fa4-b2eb-446d-add4-8ec35a042720).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
