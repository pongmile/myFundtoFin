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
    { id: 'crypto' as TabType, name: 'Crypto', icon: Bitcoin, label: 'รายการ' },
    { id: 'liabilities' as TabType, name: 'Liabilities', icon: CreditCard, label: 'ฉัน' },
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1525] to-[#1a0f2e]">
      {/* Main Content with bottom padding for nav */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#12172d]/95 backdrop-blur-xl border-t border-gray-800/50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-500'
                }`}
              >
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></div>
                  )}
                </div>
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
