import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { EscrowProvider } from './context/EscrowContext';
import { Navbar } from './components/common/Navbar';
import { NetworkCheck } from './components/common/NetworkCheck';
import { Toast } from './components/common/Toast';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateTransactionPage } from './pages/CreateTransactionPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ExplorePage } from './pages/ExplorePage';
import { DisputeArbitratorPage } from './pages/DisputeArbitratorPage';

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <EscrowProvider>
          <div className="min-h-screen bg-[#070d1d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
            <Navbar />
            <NetworkCheck />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/create" element={<CreateTransactionPage />} />
                <Route path="/transaction/:id" element={<TransactionDetailPage />} />
                <Route path="/profile/:address" element={<ProfilePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/search" element={<ExplorePage />} />
                <Route path="/disputes" element={<DisputeArbitratorPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Toast />
          </div>
        </EscrowProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
