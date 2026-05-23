"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ARC_TESTNET_EXPLORER, arcTestnet } from "@/lib/arc-chain";

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type WalletProvider = {
  info: {
    uuid: string;
    name: string;
    icon?: string;
    rdns?: string;
  };
  provider: EthereumProvider;
};

type Eip6963ProviderEvent = Event & {
  detail?: WalletProvider;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    okxwallet?: EthereumProvider;
  }
}

type WalletRunState = "connect" | "switch" | "add" | null;

type ArcWalletContextValue = {
  wallets: WalletProvider[];
  selectedWalletId: string;
  selectedWallet?: WalletProvider;
  activeProvider: EthereumProvider | null;
  account: string | null;
  chainId: string | null;
  arcChainIdHex: string;
  isArcNetwork: boolean;
  running: WalletRunState;
  error: string | null;
  setSelectedWalletId: (id: string) => void;
  connectWallet: () => Promise<string | null>;
  addArcNetwork: () => Promise<void>;
  switchToArcNetwork: () => Promise<void>;
  ensureArcNetwork: () => Promise<void>;
  refreshChainId: () => Promise<string | null>;
  getProvider: () => EthereumProvider;
  clearError: () => void;
};

const ArcWalletContext = createContext<ArcWalletContextValue | null>(null);

export function walletErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null) {
    const maybe = err as { message?: unknown; code?: unknown; data?: unknown };
    const parts = [
      typeof maybe.message === "string" ? maybe.message : null,
      maybe.code !== undefined ? `code=${String(maybe.code)}` : null,
      maybe.data !== undefined ? `data=${JSON.stringify(maybe.data)}` : null,
    ].filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  if (typeof err === "string" && err) return err;
  return fallback;
}

function isUnknownChainError(message: string) {
  const lower = message.toLowerCase();
  return (
    message.includes("4902") ||
    lower.includes("unrecognized") ||
    lower.includes("not added") ||
    lower.includes("unknown chain")
  );
}

function walletRank(wallet: WalletProvider) {
  const label = `${wallet.info.name} ${wallet.info.rdns ?? ""}`.toLowerCase();
  if (label.includes("okx")) return 0;
  if (label.includes("metamask")) return 1;
  return 5;
}

function isSupportedWallet(wallet: WalletProvider) {
  const label = `${wallet.info.name} ${wallet.info.rdns ?? ""}`.toLowerCase();
  return label.includes("okx") || label.includes("metamask");
}

export function ArcWalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletProvider[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [running, setRunning] = useState<WalletRunState>(null);
  const [error, setError] = useState<string | null>(null);

  const arcChainIdHex = `0x${arcTestnet.id.toString(16)}`;

  useEffect(() => {
    const discovered = new Map<string, WalletProvider>();

    function isLegacyWallet(wallet: WalletProvider) {
      return wallet.info.uuid.startsWith("legacy-");
    }

    function addWallet(wallet: WalletProvider) {
      if (!isSupportedWallet(wallet)) return;

      const incomingIsLegacy = isLegacyWallet(wallet);
      const incomingName = wallet.info.name.toLowerCase();
      const incomingRdns = wallet.info.rdns?.toLowerCase();

      for (const [id, existing] of discovered.entries()) {
        const existingIsLegacy = isLegacyWallet(existing);
        const sameProvider = existing.provider === wallet.provider;
        const sameName = existing.info.name.toLowerCase() === incomingName;
        const sameRdns =
          incomingRdns && existing.info.rdns?.toLowerCase() === incomingRdns;

        if (sameProvider || sameName || sameRdns) {
          if (!incomingIsLegacy || existingIsLegacy) {
            discovered.delete(id);
          } else {
            return;
          }
        }
      }

      if (incomingIsLegacy && Array.from(discovered.values()).some((item) => !isLegacyWallet(item))) {
        return;
      }

      if (!incomingIsLegacy) {
        for (const [id, existing] of discovered.entries()) {
          if (isLegacyWallet(existing)) discovered.delete(id);
        }
      }

      discovered.set(wallet.info.uuid, wallet);
      const nextWallets = Array.from(discovered.values()).sort((a, b) => walletRank(a) - walletRank(b));
      setWallets(nextWallets);
      setSelectedWalletId((current) =>
        nextWallets.some((item) => item.info.uuid === current)
          ? current
          : nextWallets[0]?.info.uuid ?? wallet.info.uuid
      );
    }

    if (window.ethereum) {
      addWallet({
        info: { uuid: "legacy-window-ethereum", name: "Injected Wallet" },
        provider: window.ethereum,
      });
    }

    if (window.okxwallet) {
      addWallet({
        info: { uuid: "legacy-okx-wallet", name: "OKX Wallet" },
        provider: window.okxwallet,
      });
    }

    function onProvider(event: Event) {
      const detail = (event as Eip6963ProviderEvent).detail;
      if (detail?.provider && detail.info?.uuid) addWallet(detail);
    }

    window.addEventListener("eip6963:announceProvider", onProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => window.removeEventListener("eip6963:announceProvider", onProvider);
  }, []);

  const selectedWallet = wallets.find((wallet) => wallet.info.uuid === selectedWalletId);

  const activeProvider = useMemo(() => {
    if (selectedWallet?.provider) return selectedWallet.provider;
    if (typeof window === "undefined") return null;
    return window.okxwallet ?? window.ethereum ?? null;
  }, [selectedWallet]);

  const requireProvider = useCallback(() => {
    const provider =
      activeProvider ??
      (typeof window !== "undefined" ? window.okxwallet ?? window.ethereum : undefined);
    if (!provider) {
      throw new Error(
        "No supported wallet found. Enable OKX Wallet or MetaMask for this site, then reload."
      );
    }
    return provider;
  }, [activeProvider]);

  const refreshChainId = useCallback(async () => {
    const provider =
      activeProvider ??
      (typeof window !== "undefined" ? window.okxwallet ?? window.ethereum : undefined);
    if (!provider) return null;
    const id = (await provider.request({ method: "eth_chainId" })) as string;
    setChainId(id || null);
    return id;
  }, [activeProvider]);

  const addArcNetwork = useCallback(async () => {
    setRunning("add");
    setError(null);
    try {
      const provider = requireProvider();
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: arcChainIdHex,
            chainName: arcTestnet.name,
            nativeCurrency: arcTestnet.nativeCurrency,
            rpcUrls: arcTestnet.rpcUrls.default.http,
            blockExplorerUrls: [ARC_TESTNET_EXPLORER],
          },
        ],
      });
      await refreshChainId();
    } catch (err) {
      setError(walletErrorMessage(err, "Could not add Arc Testnet."));
      throw err;
    } finally {
      setRunning(null);
    }
  }, [arcChainIdHex, refreshChainId, requireProvider]);

  const switchToArcNetwork = useCallback(async () => {
    setRunning("switch");
    setError(null);
    try {
      const provider = requireProvider();
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: arcChainIdHex }],
      });
      await refreshChainId();
    } catch (err) {
      const message = walletErrorMessage(err, "");
      if (isUnknownChainError(message)) {
        await addArcNetwork();
        await refreshChainId();
        return;
      }
      setError(message || "Could not switch to Arc Testnet.");
      throw err;
    } finally {
      setRunning(null);
    }
  }, [addArcNetwork, arcChainIdHex, refreshChainId, requireProvider]);

  const ensureArcNetwork = useCallback(async () => {
    const current = await refreshChainId();
    if (current?.toLowerCase() === arcChainIdHex.toLowerCase()) return;
    await switchToArcNetwork();
    const next = await refreshChainId();
    if (next?.toLowerCase() !== arcChainIdHex.toLowerCase()) {
      throw new Error("Wallet did not switch to Arc Testnet.");
    }
  }, [arcChainIdHex, refreshChainId, switchToArcNetwork]);

  const connectWallet = useCallback(async () => {
    setRunning("connect");
    setError(null);
    try {
      const provider = requireProvider();
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const nextAccount = accounts[0] ?? null;
      setAccount(nextAccount);
      await refreshChainId();
      await ensureArcNetwork();
      return nextAccount;
    } catch (err) {
      setError(walletErrorMessage(err, "Wallet connection failed."));
      throw err;
    } finally {
      setRunning(null);
    }
  }, [ensureArcNetwork, refreshChainId, requireProvider]);

  useEffect(() => {
    if (!activeProvider?.on) return;

    function onAccountsChanged(args: unknown) {
      const accounts = Array.isArray(args) ? (args as string[]) : [];
      setAccount(accounts[0] ?? null);
    }

    function onChainChanged(nextChainId: unknown) {
      if (typeof nextChainId === "string") setChainId(nextChainId);
    }

    activeProvider.on("accountsChanged", onAccountsChanged);
    activeProvider.on("chainChanged", onChainChanged);

    return () => {
      activeProvider.removeListener?.("accountsChanged", onAccountsChanged);
      activeProvider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [activeProvider]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshChainId().catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshChainId]);

  const value: ArcWalletContextValue = {
    wallets,
    selectedWalletId,
    selectedWallet,
    activeProvider,
    account,
    chainId,
    arcChainIdHex,
    isArcNetwork: chainId?.toLowerCase() === arcChainIdHex.toLowerCase(),
    running,
    error,
    setSelectedWalletId,
    connectWallet,
    addArcNetwork,
    switchToArcNetwork,
    ensureArcNetwork,
    refreshChainId,
    getProvider: requireProvider,
    clearError: () => setError(null),
  };

  return <ArcWalletContext.Provider value={value}>{children}</ArcWalletContext.Provider>;
}

export function useArcWallet() {
  const value = useContext(ArcWalletContext);
  if (!value) throw new Error("useArcWallet must be used inside ArcWalletProvider");
  return value;
}
