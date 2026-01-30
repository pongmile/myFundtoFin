'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
  Alert,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Refresh,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet,
  ShowChart,
  CurrencyBitcoin,
  Warning,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { getExchangeRate } from '@/lib/cache';
import axios from 'axios';

interface PortfolioSummary {
  totalWealth: number;
  cash: number;
  crypto: number;
  stocks: number;
  liabilities: number;
  netWealth: number;
  cashCount: number;
  stockCount: number;
  cryptoCount: number;
}

interface WealthChange {
  daily: number;
  dailyPercent: number;
  monthly: number;
  monthlyPercent: number;
}

const COLORS = ['#10B981', '#8B5CF6', '#F59E0B'];

export default function DashboardMobile() {
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalWealth: 0,
    cash: 0,
    crypto: 0,
    stocks: 0,
    liabilities: 0,
    netWealth: 0,
    cashCount: 0,
    stockCount: 0,
    cryptoCount: 0,
  });
  const [change, setChange] = useState<WealthChange>({
    daily: 0,
    dailyPercent: 0,
    monthly: 0,
    monthlyPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setConfigError(false);
    setDbError(null);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here' || !supabaseUrl.startsWith('http')) {
        setConfigError(true);
        setLoading(false);
        return;
      }

      const [cashData, cryptoData, stocksData, liabilitiesData, historyData] = await Promise.all([
        supabase.from('cash_accounts').select('*').then(r => r.error ? { data: [], error: r.error } : r),
        supabase.from('crypto').select('*').then(r => r.error ? { data: [], error: r.error } : r),
        supabase.from('stocks').select('*').then(r => r.error ? { data: [], error: r.error } : r),
        supabase.from('liabilities').select('*').then(r => r.error ? { data: [], error: r.error } : r),
        supabase.from('wealth_history').select('*').order('date', { ascending: false }).limit(30).then(r => r.error ? { data: [], error: r.error } : r),
      ]);

      if (cashData.error?.message?.includes('relation') || cashData.error?.message?.includes('does not exist')) {
        setDbError('กรุณารัน SQL schema ใน Supabase ก่อน');
        setLoading(false);
        return;
      }

      let cashTotal = 0;
      const cashItems = cashData.data || [];
      for (const account of cashItems) {
        let amount = parseFloat(account.amount || 0);
        if (account.currency && account.currency !== 'THB') {
          const rate = await getExchangeRate(account.currency, 'THB');
          amount *= rate;
        }
        cashTotal += amount;
      }

      const cryptoItems = cryptoData.data || [];
      let cryptoTotal = 0;
      for (const item of cryptoItems) {
        try {
          const useBitkub = ['KUB', 'BTC', 'BNB', 'ETH', 'USDT'].includes(item.symbol.toUpperCase());
          const apiUrl = useBitkub 
            ? `/api/crypto/bitkub?symbol=${item.symbol}`
            : `/api/crypto/price?symbol=${item.symbol}`;
          
          const response = await axios.get(apiUrl);
          const quantity = parseFloat(item.quantity || 0);
          
          if (useBitkub && response.data.priceThb) {
            cryptoTotal += response.data.priceThb * quantity;
          } else {
            const currentPriceUSD = response.data.price || 0;
            const thbRate = 31;
            cryptoTotal += currentPriceUSD * thbRate * quantity;
          }
        } catch (error) {
          console.warn(`Failed to get price for ${item.symbol}, using cost basis`);
          cryptoTotal += parseFloat(item.cost_basis || 0);
        }
      }

      const stockItems = stocksData.data || [];
      let stocksTotal = 0;
      for (const item of stockItems) {
        try {
          const quantity = parseFloat(item.quantity || 0);
          let price = 0;
          
          // Use manual price if available (for AI Port, Robo Advisor, Manual)
          if (['scb_robo', 'guru_portfolio', 'manual'].includes(item.data_source)) {
            price = parseFloat(item.manual_price || 0);
          }
          // Use Gold API for gold commodities (USD per Troy Ounce)
          else if (item.type === 'gold' || item.data_source === 'gold_api') {
            const res = await axios.get('/api/prices/gold');
            const priceUSD = res.data.price || 0;
            const thbRate = await getExchangeRate('USD', 'THB');
            price = priceUSD * thbRate; // THB per Troy Ounce
          }
          // Use SET API for Thai stocks
          else if (item.type === 'stock_thai' && item.data_source === 'yahoo') {
            const res = await axios.get(`/api/prices/set?symbol=${item.symbol}`);
            price = res.data.price || 0; // Already in THB
          }
          // Use Yahoo Finance for foreign stocks
          else if (item.data_source === 'yahoo') {
            const res = await axios.get(`/api/prices/stock?symbol=${item.symbol}`);
            price = res.data.price || 0;
            
            // Convert price to THB if needed
            if (item.currency && item.currency !== 'THB') {
              const rate = await getExchangeRate(item.currency, 'THB');
              price *= rate;
            }
          }
          // Use fund APIs for mutual funds
          else {
            const res = await axios.get(
              `/api/prices/fund?url=${encodeURIComponent(item.data_url || '')}&source=${item.data_source}&code=${item.symbol}`
            );
            price = res.data.price || 0; // Already in THB
          }
          
          const value = price * quantity;
          stocksTotal += value;
        } catch (error) {
          console.warn(`Failed to get price for ${item.symbol}, using cost basis`);
          stocksTotal += parseFloat(item.cost_basis || 0);
        }
      }

      let liabilitiesTotal = 0;
      const liabilityItems = liabilitiesData.data || [];
      for (const liability of liabilityItems) {
        let amount = parseFloat(liability.amount || 0);
        if (liability.currency && liability.currency !== 'THB') {
          const rate = await getExchangeRate(liability.currency, 'THB');
          amount *= rate;
        }
        liabilitiesTotal += amount;
      }

      const totalWealth = cashTotal + cryptoTotal + stocksTotal;
      const netWealth = totalWealth - liabilitiesTotal;

      setSummary({
        totalWealth,
        cash: cashTotal,
        crypto: cryptoTotal,
        stocks: stocksTotal,
        liabilities: liabilitiesTotal,
        netWealth,
        cashCount: cashItems.length,
        stockCount: stockItems.length,
        cryptoCount: cryptoItems.length,
      });

      const historyItems = historyData.data || [];
      if (historyItems.length > 0) {
        const today = netWealth;
        const yesterday = historyItems.length > 1 ? parseFloat(historyItems[1]?.total_wealth || 0) : netWealth;
        const monthAgo = historyItems.length > 29 ? parseFloat(historyItems[29]?.total_wealth || 0) : netWealth;

        const dailyDiff = today - yesterday;
        const dailyPercent = yesterday > 0 ? (dailyDiff / yesterday) * 100 : 0;
        const monthlyDiff = today - monthAgo;
        const monthlyPercent = monthAgo > 0 ? (monthlyDiff / monthAgo) * 100 : 0;

        setChange({
          daily: dailyDiff,
          dailyPercent,
          monthly: monthlyDiff,
          monthlyPercent,
        });
      } else {
        setChange({ daily: 0, dailyPercent: 0, monthly: 0, monthlyPercent: 0 });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDbError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pieData = [
    { name: 'Cash', value: summary.cash, color: COLORS[0] },
    { name: 'หุ้น/กองทุน', value: summary.stocks, color: COLORS[1] },
    { name: 'Crypto', value: summary.crypto, color: COLORS[2] },
  ].filter(item => item.value > 0);

  const formatCurrency = (value: number) => {
    return `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (configError) {
    return (
      <Alert severity="error" icon={<Warning />}>
        <Typography variant="h6">Configuration Error</Typography>
        <Typography variant="body2">Please configure Supabase credentials in .env.local</Typography>
      </Alert>
    );
  }

  if (dbError) {
    return (
      <Alert severity="error" icon={<Warning />}>
        <Typography variant="h6">{dbError}</Typography>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box textAlign="center">
        <Typography variant="body1" color="text.secondary" mb={2}>
          💰 สินทรัพย์ของฉัน
        </Typography>
        <Typography variant="h2" fontWeight="bold" mb={1}>
          {formatCurrency(summary.netWealth)}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          📅 {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>
        {summary.netWealth > 0 && (
          <Chip
            icon={change.dailyPercent >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${change.dailyPercent >= 0 ? '+' : ''}${change.dailyPercent.toFixed(2)}%`}
            color={change.dailyPercent >= 0 ? 'success' : 'error'}
            sx={{ fontWeight: 'bold' }}
          />
        )}
      </Box>

      {/* Chart Card */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                📊 สัดส่วนการลงทุน
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
            <IconButton onClick={loadData} size="small">
              <Refresh />
            </IconButton>
          </Stack>

          {summary.totalWealth > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <Stack direction="row" spacing={2} flexWrap="wrap" mt={2}>
                {pieData.map((item, index) => (
                  <Box key={index} flex="1 1 30%">
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <Box width={12} height={12} borderRadius="50%" bgcolor={item.color} />
                      <Typography variant="caption" color="text.secondary">
                        {item.name}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight="bold">
                      {summary.totalWealth > 0 ? ((item.value / summary.totalWealth) * 100).toFixed(1) : '0'}%
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </>
          ) : (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ยังไม่มีข้อมูลสินทรัพย์
              </Typography>
              <Typography variant="body2" color="text.disabled">
                เพิ่มบัญชีCash หุ้น หรือ Crypto เพื่อเริ่มต้น
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Asset Cards */}
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                <AccountBalanceWallet sx={{ fontSize: 28 }} />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  💵 Cash
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.cashCount} บัญชี
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(summary.cash)}
                </Typography>
                <Typography variant="body2" color="success.main">
                  {summary.totalWealth > 0 ? ((summary.cash / summary.totalWealth) * 100).toFixed(1) : '0'}%
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                <ShowChart sx={{ fontSize: 28 }} />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  📈 Stock&Fund
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.stockCount} รายการ
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(summary.stocks)}
                </Typography>
                <Typography variant="body2" color="secondary.main">
                  {summary.totalWealth > 0 ? ((summary.stocks / summary.totalWealth) * 100).toFixed(1) : '0'}%
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                <CurrencyBitcoin sx={{ fontSize: 28 }} />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  🪙 Cryptocurrency
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.cryptoCount} เหรียญ
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(summary.crypto)}
                </Typography>
                <Typography variant="body2" color="warning.main">
                  {summary.totalWealth > 0 ? ((summary.crypto / summary.totalWealth) * 100).toFixed(1) : '0'}%
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Performance Summary */}
      {summary.netWealth > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              📊 กำไรของสินทรัพย์ที่ถือครอง
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    📅 เปลี่ยนแปลงจากวันก่อน
                  </Typography>
                  <Chip
                    label={`${change.dailyPercent >= 0 ? '+' : ''}${change.dailyPercent.toFixed(2)}%`}
                    color={change.dailyPercent >= 0 ? 'success' : 'error'}
                    size="small"
                  />
                </Stack>
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    📈 กำไรสะสม (30 วัน)
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color={change.monthlyPercent >= 0 ? 'success.main' : 'error.main'}
                  >
                    {change.monthlyPercent >= 0 ? '+' : ''}{change.monthlyPercent.toFixed(2)}%
                  </Typography>
                </Stack>
                <Typography variant="caption" color={change.monthlyPercent >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(change.monthly)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
