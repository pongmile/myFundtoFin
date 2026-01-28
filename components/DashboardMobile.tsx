'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Wallet, Bitcoin, Eye, AlertCircle } from 'lucide-react';
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

      // Check for table errors
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

      // Calculate crypto with real-time prices
      const cryptoItems = cryptoData.data || [];
      let cryptoTotal = 0;
      for (const item of cryptoItems) {
        try {
          const response = await axios.get(`/api/crypto/price?symbol=${item.symbol}`);
          const currentPrice = response.data.price || 0;
          const quantity = parseFloat(item.quantity || 0);
          cryptoTotal += currentPrice * quantity;
        } catch (error) {
          console.warn(`Failed to get price for ${item.symbol}, using cost basis`);
          cryptoTotal += parseFloat(item.cost_basis || 0);
        }
      }

      const stockItems = stocksData.data || [];
      let stocksTotal = 0;
      for (const item of stockItems) {
        let value = parseFloat(item.cost_basis || 0);
        if (item.currency && item.currency !== 'THB') {
          const rate = await getExchangeRate(item.currency, 'THB');
          value *= rate;
        }
        stocksTotal += value;
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

      // Calculate real changes from wealth_history
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
    { name: 'เงินสด', value: summary.cash, color: '#10B981' },
    { name: 'หุ้น/กองทุน', value: summary.stocks, color: '#8B5CF6' },
    { name: 'Crypto', value: summary.crypto, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === 0) return '฿0.00';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (configError) {
    return (
      <div className="p-4">
        <div className="glass-card p-6 border-yellow-500/30">
          <div className="text-center">
            <div className="text-yellow-400 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">ต้องตั้งค่า Supabase</h3>
            <p className="text-gray-300 text-sm">กรุณาตั้งค่า .env.local ก่อนใช้งาน</p>
          </div>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="p-4">
        <div className="glass-card p-6 border-red-500/30">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-400 mb-2">ฐานข้อมูลยังไม่พร้อม</h3>
            <p className="text-gray-300 text-sm mb-4">{dbError}</p>
            <p className="text-gray-400 text-xs">รัน supabase-schema.sql ใน SQL Editor ของ Supabase</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin text-purple-400" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 px-1">
      {/* Mobile-First Header */}
      <div className="text-center pt-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <p className="text-gray-300 text-base font-medium">💰 สินทรัพย์ของฉัน</p>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">
          {formatCurrency(summary.netWealth)}
        </h1>
        <p className="text-gray-400 text-sm mb-4">
          📅 มูลค่าสินทรัพย์ทั้งหมด ({new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })})
        </p>
        {summary.netWealth > 0 && (
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full shadow-lg ${
          change.dailyPercent >= 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
        }`}>
          {change.dailyPercent >= 0 ? (
            <TrendingUp size={16} className="text-green-400" />
          ) : (
            <TrendingDown size={16} className="text-red-400" />
          )}
          <span className={`text-lg font-bold ${change.dailyPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change.dailyPercent >= 0 ? '+' : ''}{change.dailyPercent.toFixed(2)}%
          </span>
        </div>
        )}
      </div>

      {/* Tab Pills */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button className="px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-bold whitespace-nowrap shadow-lg hover:shadow-xl transition-all">
          🏠 ทั้งหมด
        </button>
        <button className="px-6 py-3 bg-gray-800/60 text-gray-300 rounded-full text-sm font-semibold whitespace-nowrap border border-gray-600 hover:bg-gray-700/60 transition-all">
          💵 เงินสด
        </button>
        <button className="px-6 py-3 bg-gray-800/60 text-gray-300 rounded-full text-sm font-semibold whitespace-nowrap border border-gray-600 hover:bg-gray-700/60 transition-all">
          📊 กองทุน
        </button>
        <button className="px-6 py-3 bg-gray-800/60 text-gray-300 rounded-full text-sm font-semibold whitespace-nowrap border border-gray-600 hover:bg-gray-700/60 transition-all">
          📈 หุ้น
        </button>
      </div>

      {/* Main Card with Chart */}
      <div className="glass-card p-6 shadow-2xl border-purple-500/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📊 สัดส่วนการลงทุน
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={loadData} 
            className="p-3 hover:bg-gray-700/50 rounded-xl transition-all group"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={20} className="text-gray-300 group-hover:text-white group-hover:rotate-180 transition-all duration-500" />
          </button>
        </div>
        
        {summary.totalWealth > 0 ? (
          <>
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    labelLine={false}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Total</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(summary.totalWealth)}</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-5 mt-6">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 hover:bg-gray-700/30 transition-all">
                  <div className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg" style={{ backgroundColor: item.color }}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 mb-1">{item.name}</p>
                    <p className="text-lg font-bold text-white">
                      {summary.totalWealth > 0 ? ((item.value / summary.totalWealth) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-300 text-lg font-semibold mb-2">ยังไม่มีข้อมูลสินทรัพย์</p>
            <p className="text-gray-500 text-sm">เพิ่มบัญชีเงินสด หุ้น หรือ Crypto เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>

      {/* Asset List Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🏦 ประเภทสินทรัพย์
        </h2>
        <button className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded-xl hover:bg-gray-700/30 transition-all font-medium">
          📋 จัดเรียง
        </button>
      </div>

      {/* Asset Cards */}
      <div className="space-y-4">
        {/* Cash Card */}
        <div className="glass-card p-5 hover:bg-gray-700/20 transition-all group border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Wallet size={28} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg mb-1">💵 เงินสด</h3>
              <p className="text-gray-400 text-sm">{summary.cashCount} บัญชี</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-xl">{formatCurrency(summary.cash)}</p>
              <p className="text-green-400 text-sm font-medium mt-1">
                {summary.totalWealth > 0 ? ((summary.cash / summary.totalWealth) * 100).toFixed(1) : '0'}%
              </p>
            </div>
          </div>
        </div>

        {/* Stocks Card */}
        <div className="glass-card p-5 hover:bg-gray-700/20 transition-all group border-l-4 border-purple-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp size={28} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg mb-1">📈 หุ้น & กองทุน</h3>
              <p className="text-gray-400 text-sm">{summary.stockCount} รายการ</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-xl">{formatCurrency(summary.stocks)}</p>
              <p className="text-purple-400 text-sm font-medium mt-1">
                {summary.totalWealth > 0 ? ((summary.stocks / summary.totalWealth) * 100).toFixed(1) : '0'}%
              </p>
            </div>
          </div>
        </div>

        {/* Crypto Card */}
        <div className="glass-card p-5 hover:bg-gray-700/20 transition-all group border-l-4 border-yellow-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Bitcoin size={28} className="text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg mb-1">🪙 Cryptocurrency</h3>
              <p className="text-gray-400 text-sm">{summary.cryptoCount} เหรียญ</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-xl">{formatCurrency(summary.crypto)}</p>
              <p className="text-yellow-400 text-sm font-medium mt-1">
                {summary.totalWealth > 0 ? ((summary.crypto / summary.totalWealth) * 100).toFixed(1) : '0'}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary - only show when there's data */}
      {summary.netWealth > 0 && (
        <div className="glass-card p-6 border-blue-500/20">
          <h3 className="text-white font-bold mb-5 text-xl flex items-center gap-2">
            📊 กำไรของสินทรัพย์ที่ถือครอง
          </h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📅</div>
                <span className="text-gray-300 font-medium">เปลี่ยนแปลงจากวันก่อน</span>
              </div>
              <span className={`font-bold text-lg ${change.dailyPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change.dailyPercent >= 0 ? '↗' : '↘'} {change.dailyPercent >= 0 ? '+' : ''}{change.dailyPercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📈</div>
                <span className="text-gray-300 font-medium">กำไรสะสม (30 วัน)</span>
              </div>
              <div className="text-right">
                <span className={`font-bold text-lg block ${change.monthlyPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change.monthlyPercent >= 0 ? '↗' : '↘'} {change.monthlyPercent >= 0 ? '+' : ''}{change.monthlyPercent.toFixed(2)}%
                </span>
                <span className={`text-sm ${change.monthlyPercent >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                  {formatCurrency(change.monthly)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
