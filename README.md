# Crowdfunding DApp (Hardhat v3 + React + viem)

## How to run (local)

1. Install deps
```
npm install
```
2. Start local chain
```
npm run node
```
3. In another terminal, deploy contracts
```
npm run deploy
```
4. Start frontend
```
cd frontend
npm run dev
```
Open http://localhost:5173 and connect MetaMask to Localhost (Hardhat).

## Contract addresses (local)
- KYCRegistry_Student: 0x5FbDB2315678afecb367f032d93F642f64180aa3
- Crowdfunding_Student: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

## Features Checklist (for screenshots)
- KYC approval snapshots
  - Submit KYC via UI
  - Approve/Reject in Admin Panel (connect as Account #0)
- Campaign creation snapshots
  - Create campaign with title/desc/goal
- Contributions snapshots
  - Contribute to campaign (e.g., 0.01 ETH)
- Withdrawal snapshots
  - After goal reached (or set small goal), withdraw as creator

## Notes
- Contract names include `_Student` suffix; share your name/roll to rename and set footer.
