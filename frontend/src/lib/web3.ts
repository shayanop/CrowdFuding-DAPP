import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { localhost, sepolia } from "viem/chains";

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

// `npm run dev` talks to the local Hardhat node; production builds use Sepolia.
const chain = import.meta.env.DEV ? localhost31337 : sepolia;
const chainIdHex = "0x" + chain.id.toString(16);

export type Web3State = {
  account?: Address;
  chainId?: number;
};

// Pick Rabby via EIP-6963 so it wins even when other wallets (e.g. MetaMask) also inject window.ethereum.
let rabbyProvider: any;
window.addEventListener("eip6963:announceProvider", (e: any) => {
  if (e.detail?.info?.rdns === "io.rabby") rabbyProvider = e.detail.provider;
});

function getRabby(): any {
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  const eth = (window as any).ethereum;
  return rabbyProvider ?? (eth?.isRabby ? eth : undefined);
}

async function ensureChain(rabby: any) {
  if ((await rabby.request({ method: "eth_chainId" })) === chainIdHex) return;
  try {
    await rabby.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
  } catch (e: any) {
    // Chain unknown to the wallet (e.g. local Hardhat). Spec says 4902, but wallets differ,
    // so try adding it on any error except the user rejecting the switch (4001).
    if (e?.code === 4001) throw e;
    await rabby.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: chainIdHex,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls.default.http,
      }],
    });
  }
}

async function connect(): Promise<Web3State> {
  const rabby = getRabby();
  if (!rabby) {
    console.warn("Rabby Wallet not found. Install it from https://rabby.io");
    return {};
  }
  // State is read once on mount, so reload when the user switches account/network in Rabby.
  rabby.on?.("accountsChanged", () => location.reload());
  // Don't reload when switching *to* our chain: that happens mid-transaction in ensureChain.
  rabby.on?.("chainChanged", (id: string) => { if (id.toLowerCase() !== chainIdHex) location.reload(); });
  const [address] = await rabby.request({ method: "eth_requestAccounts" });
  try {
    await ensureChain(rabby);
  } catch (e) {
    console.warn("Could not switch network", e);
  }
  const chainId = parseInt(await rabby.request({ method: "eth_chainId" }), 16);
  return { account: address, chainId };
}

// Several components call getWallet on mount; share one request so Rabby gets a single popup.
let pending: Promise<Web3State> | undefined;
export function getWallet(): Promise<Web3State> {
  pending ??= connect().catch((e) => {
    pending = undefined; // allow retry after a rejected/failed connect
    throw e;
  });
  return pending;
}

export function getClients() {
  // Reads go straight to the chain RPC so they never wait on (or depend on) the wallet.
  const publicClient = createPublicClient({ chain, transport: http() });
  const rabby = getRabby();
  const base = createWalletClient({ chain, transport: rabby ? custom(rabby) : http() });
  // Make sure Rabby is on the app's chain right before every transaction, not just at connect time.
  const walletClient = {
    ...base,
    writeContract: (async (args: any) => {
      if (rabby) await ensureChain(rabby);
      return base.writeContract(args);
    }) as typeof base.writeContract,
  };
  return { publicClient, walletClient };
}
