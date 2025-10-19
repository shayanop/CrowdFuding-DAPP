import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { localhost } from "viem/chains";

// Override localhost chain to use Chain ID 31337 (Hardhat default) and port 8546
const localhost31337 = {
  ...localhost,
  id: 31337,
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8546'],
    },
    public: {
      http: ['http://127.0.0.1:8546'],
    },
  },
} as const;

export type Web3State = {
  account?: Address;
  chainId?: number;
};

export async function getWallet(): Promise<Web3State> {
  if (!(window as any).ethereum) return {};
  const [address] = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
  const chainIdHex = await (window as any).ethereum.request({ method: "eth_chainId" });
  const chainId = parseInt(chainIdHex, 16);
  return { account: address, chainId };
}

export function getClients() {
  const transport = (window as any).ethereum ? custom((window as any).ethereum) : http();
  const publicClient = createPublicClient({ chain: localhost31337, transport });
  const walletClient = createWalletClient({ chain: localhost31337, transport });
  return { publicClient, walletClient };
}


