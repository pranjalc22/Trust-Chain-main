import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
import { TARGET_CHAIN_ID, TARGET_NETWORK } from '../config';
import { resetProviderCache } from '../services/contracts';
import * as api from '../services/api';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [network, setNetwork] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [provider, setProvider] = useState(null);

  const targetNetworkName = TARGET_NETWORK.chainName;

  // Track if we already attempted auto-reconnect on mount
  const didAutoConnect = useRef(false);

  // ─── Utility ────────────────────────────────────────────

  const formatAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }, []);

  // ─── Authenticate with the backend ────────────────────

  const signInWithBackend = useCallback(async (addr, prov) => {
    if (!addr || !prov) return;
    try {
      const { message } = await api.requestAuthNonce(addr);
      const signer = await prov.getSigner();
      const signature = await signer.signMessage(message);
      const { token } = await api.verifyAuthSignature(addr, signature);
      if (token) localStorage.setItem('trustchain_jwt', token);
    } catch (err) {
      // Keep wallet usable when the backend is offline; writes will simply be unauthenticated.
      console.warn('Backend sign-in failed:', err.message);
      localStorage.removeItem('trustchain_jwt');
    }
  }, []);

  // ─── Refresh balance ───────────────────────────────────

  const refreshBalance = useCallback(async (addr, prov) => {
    if (!addr || !prov) return;
    try {
      const bal = await prov.getBalance(addr);
      const symbol = TARGET_CHAIN_ID === 31337 ? 'ETH' : 'MATIC';
      setBalance(`${parseFloat(formatEther(bal)).toFixed(4)} ${symbol}`);
    } catch {
      setBalance('—');
    }
  }, []);

  // ─── Check if on the correct network ──────────────────

  const checkNetwork = useCallback(async (prov) => {
    try {
      const net = await prov.getNetwork();
      const currentChainId = Number(net.chainId);
      setChainId(currentChainId);
      setNetwork(
        currentChainId === TARGET_CHAIN_ID
          ? TARGET_NETWORK.chainName
          : `Unknown Network (${currentChainId})`
      );
      const correct = currentChainId === TARGET_CHAIN_ID;
      setIsCorrectNetwork(correct);
      return correct;
    } catch {
      setIsCorrectNetwork(false);
      return false;
    }
  }, []);

  // ─── Connect Wallet ───────────────────────────────────

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to use TrustChain.');
      return null;
    }
    setIsConnecting(true);
    try {
      const prov = new BrowserProvider(window.ethereum);
      const accounts = await prov.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        const addr = accounts[0];
        setProvider(prov);
        setAccount(addr);
        setIsConnected(true);
        resetProviderCache();
        await checkNetwork(prov);
        await refreshBalance(addr, prov);
        await signInWithBackend(addr, prov);
        localStorage.setItem('trustchain_connected', 'true');
        return addr;
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
    return null;
  }, [checkNetwork, refreshBalance, signInWithBackend]);

  // ─── Disconnect ───────────────────────────────────────

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
    setProvider(null);
    setBalance('0');
    setIsCorrectNetwork(false);
    resetProviderCache();
    localStorage.removeItem('trustchain_connected');
    localStorage.removeItem('trustchain_jwt');
  }, []);

  // ─── Switch to target network ─────────────────────────

  const switchToTargetNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    setIsSwitchingNetwork(true);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARGET_NETWORK.chainId }],
      });
    } catch (switchError) {
      // 4902 = chain not added — try adding it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [TARGET_NETWORK],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    } finally {
      setIsSwitchingNetwork(false);
    }
  }, []);

  // ─── Auto-reconnect on mount ──────────────────────────

  useEffect(() => {
    if (didAutoConnect.current) return;
    didAutoConnect.current = true;

    if (window.ethereum && localStorage.getItem('trustchain_connected') === 'true') {
      (async () => {
        try {
          const prov = new BrowserProvider(window.ethereum);
          const accounts = await prov.send('eth_accounts', []);
          if (accounts.length > 0) {
            const addr = accounts[0];
            setProvider(prov);
            setAccount(addr);
            setIsConnected(true);
            resetProviderCache();
            await checkNetwork(prov);
            await refreshBalance(addr, prov);
            await signInWithBackend(addr, prov);
          }
        } catch (err) {
          console.warn('Auto-reconnect failed:', err.message);
        }
      })();
    }
  }, [checkNetwork, refreshBalance, signInWithBackend]);

  // ─── MetaMask event listeners ─────────────────────────

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const addr = accounts[0];
        setAccount(addr);
        setIsConnected(true);
        resetProviderCache();
        const prov = new BrowserProvider(window.ethereum);
        setProvider(prov);
        await checkNetwork(prov);
        await refreshBalance(addr, prov);
        await signInWithBackend(addr, prov);
      }
    };

    const handleChainChanged = async () => {
      resetProviderCache();
      const prov = new BrowserProvider(window.ethereum);
      setProvider(prov);
      await checkNetwork(prov);
      if (account) await refreshBalance(account, prov);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, checkNetwork, disconnectWallet, refreshBalance, signInWithBackend]);

  // ─── Context Value ────────────────────────────────────

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnected,
        isConnecting,
        network,
        chainId,
        balance,
        isCorrectNetwork,
        isSwitchingNetwork,
        targetNetworkName,
        provider,
        connectWallet,
        disconnectWallet,
        switchToTargetNetwork,
        formatAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
