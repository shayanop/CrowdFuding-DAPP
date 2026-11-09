// Set VITE_KYC_ADDRESS / VITE_CROWDFUND_ADDRESS at build time (e.g. Render env vars) for Sepolia.
// Fallbacks are the local Hardhat deployment (Chain ID 31337, Port 8546) used by `npm run dev`.
export const KYC_ADDRESS = (import.meta.env.VITE_KYC_ADDRESS || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9") as `0x${string}`;
export const CROWDFUND_ADDRESS = (import.meta.env.VITE_CROWDFUND_ADDRESS || "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9") as `0x${string}`;
