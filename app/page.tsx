'use client';

import { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  Container,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  AccountBalanceWallet,
  TrendingUp,
  CurrencyBitcoin,
  CreditCard,
} from '@mui/icons-material';
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
    { id: 'dashboard' as TabType, icon: DashboardIcon, label: 'หน้าหลัก' },
    { id: 'history' as TabType, icon: HistoryIcon, label: 'ลงทุน' },
    { id: 'cash' as TabType, icon: AccountBalanceWallet, label: 'เงินสด' },
    { id: 'stocks' as TabType, icon: TrendingUp, label: 'สินทรัพย์' },
    { id: 'crypto' as TabType, icon: CurrencyBitcoin, label: 'Crypto' },
    { id: 'liabilities' as TabType, icon: CreditCard, label: 'หนี้' },
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', pb: 8 }}>
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', py: 3 }}>
        <Container maxWidth="lg">
          {renderContent()}
        </Container>
      </Box>

      {/* Bottom Navigation - Material Design 3 */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: '24px 24px 0 0',
          backgroundColor: 'background.paper',
          backdropFilter: 'blur(10px)',
        }}
        elevation={8}
      >
        <BottomNavigation
          value={activeTab}
          onChange={(event, newValue) => {
            setActiveTab(newValue);
          }}
          showLabels
          sx={{
            backgroundColor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              },
              minWidth: 60,
              padding: '6px 12px 8px',
            },
          }}
        >
          {tabs.map((tab) => (
            <BottomNavigationAction
              key={tab.id}
              value={tab.id}
              label={tab.label}
              icon={<tab.icon />}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
