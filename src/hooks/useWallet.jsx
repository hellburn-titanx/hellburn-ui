import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { CHAIN_ID, CHAIN_NAME } from "@/config/constants";

const WalletCtx = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0");
  const [connecting, setConnecting] = useState(false);

  const isCorrectChain = chainId === CHAIN_ID;
  const shortAddr = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "";

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install it.");
      return;
    }
    setConnecting(true);
    try {
      const p = new BrowserProvider(window.ethereum);
      const accounts = await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      const network = await p.getNetwork();
      const bal = await p.getBalance(accounts[0]);

      setProvider(p);
      setSigner(s);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setBalance(formatEther(bal));
    } catch (err) {
      console.error("Connect failed:", err);
    }
    setConnecting(false);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance("0");
  }, []);

  // Switch chain
  const switchChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (err) {
      console.error("Switch chain failed:", err);
    }
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnect();
      else setAccount(accounts[0]);
    };

    const handleChainChanged = (cid) => {
      setChainId(Number(cid));
      // Refresh provider
      if (account) connect();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, connect, disconnect]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (window.ethereum?.selectedAddress) connect();
  }, [connect]);

  return (
    <WalletCtx.Provider value={{
      account, provider, signer, chainId, balance, shortAddr,
      isCorrectChain, connecting,
      connect, disconnect, switchChain,
    }}>
      {children}
    </WalletCtx.Provider>
  );
}

export const useWallet = () => useContext(WalletCtx);
