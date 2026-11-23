import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { AlertTriangle, RefreshCw, Wifi } from 'lucide-react';

/**
 * NetworkCheck — Shows a persistent banner when MetaMask is on the wrong network.
 * Offers a one-click "Switch Network" button using wallet_switchEthereumChain.
 */
export const NetworkCheck = () => {
  const { isConnected, isCorrectNetwork, switchToTargetNetwork, isSwitchingNetwork, targetNetworkName } = useWallet();

  // Don't show anything if wallet is not connected or already on correct network
  if (!isConnected || isCorrectNetwork) return null;

  return (
    <div className="sticky top-0 z-[60] bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-700/60 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-amber-200">
          <div className="p-1.5 rounded-lg bg-amber-800/60 border border-amber-700/50">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-100">Wrong Network Detected</span>
            <p className="text-[11px] text-amber-300/80">
              Please switch MetaMask to <strong className="text-amber-100">{targetNetworkName}</strong> to interact with TrustChain contracts.
            </p>
          </div>
        </div>

        <button
          onClick={switchToTargetNetwork}
          disabled={isSwitchingNetwork}
          className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
        >
          {isSwitchingNetwork ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Switching...</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Switch Network</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
