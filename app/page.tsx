'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Wallet, 
  TrendingUp, 
  Bitcoin, 
  CreditCard,
  PieChart as PieChartIcon
} from 'lucide-react';
import Dashboard from '@/components/DashboardMobile';
import WealthHistory from '@/components/WealthHistory';
import CashAccounts from '@/components/CashAccounts';
import StocksAndFunds from '@/components/StocksAndFunds';
import Cryptocurrency from '@/components/Cryptocurrency';
import Liabilities from '@/components/Liabilities';

type TabType = 'dashboard' | 'history' | 'cash' | 'stocks' | 'crypto' | 'liabilities';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    { id: 'dashboard' as TabType, name: 'Dashboard', icon: LayoutDashboard, label: 'หน้าหลัก' },
    { id: 'history' as TabType, name: 'History', icon: History, label: 'ลงทุน' },
    { id: 'cash' as TabType, name: 'Cash', icon: Wallet, label: 'เงินสด' },
    { id: 'stocks' as TabType, name: 'Stocks', icon: PieChartIcon, label: 'สินทรัพย์' },
    { id: 'crypto' as TabType, name: 'Crypto', icon: Bitcoin, label: 'Crypto' },
    { id: 'liabilities' as TabType, name: 'Liabilities', icon: CreditCard, label: 'หนี้' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'history':
        return <WealthHistory />;
      case 'cash':
        return <CashAccounts />;
      case 'stocks':
        return <StocksAndFunds />;
      case 'crypto':
        return <Cryptocurrency />;
      case 'liabilities':
        return <Liabilities />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0a0e1a] via-[#1a1f35] to-[#0f1525]">
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-48 pt-4 mt-[50px]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation - Liquid Glass */}
      <nav className="glass-nav fixed bottom-0 left-0 right-0 z-[9999] safe-area-inset-bottom !pointer-events-auto">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center min-w-[70px] py-3 px-4 rounded-2xl transition-all ${
                    isActive
                      ? 'gradient-primary shadow-xl scale-110'
                      : 'glass-button hover:bg-white/10'
                  }`}
                >
                  <Icon size={26} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-white' : 'text-gray-400'} />
                  <span className={`text-xs mt-2 font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
