// Set VITE_KYC_ADDRESS / VITE_CROWDFUND_ADDRESS at build time (e.g. Render env vars) for Sepolia.
// Fallbacks are the local Hardhat deployment (Chain ID 31337, Port 8546) used by `npm run dev`.
export const KYC_ADDRESS = (import.meta.env.VITE_KYC_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;
export const CROWDFUND_ADDRESS = (import.meta.env.VITE_CROWDFUND_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as `0x${string}`;
