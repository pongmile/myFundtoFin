'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExchangeRate } from '@/lib/cache';

interface PortfolioSummary {
  totalWealth: number;
  cash: number;
  crypto: number;
  stocks: number;
  liabilities: number;
  netWealth: number;
}

interface WealthChange {
  daily: number;
  dailyPercent: number;
  monthly: number;
  monthlyPercent: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalWealth: 0,
    cash: 0,
    crypto: 0,
    stocks: 0,
    liabilities: 0,
    netWealth: 0,
  });
  const [change, setChange] = useState<WealthChange>({
    daily: 0,
    dailyPercent: 0,
    monthly: 0,
    monthlyPercent: 0,
  });
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setConfigError(false);
    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here' || !supabaseUrl.startsWith('http')) {
        setConfigError(true);
        setLoading(false);
        return;
      }

      // Fetch all data
      const [cashData, cryptoData, stocksData, liabilitiesData, historyData] = await Promise.all([
        supabase.from('cash_accounts').select('*'),
        supabase.from('crypto').select('*'),
        supabase.from('stocks').select('*'),
        supabase.from('liabilities').select('*'),
        supabase.from('wealth_history').select('*').order('date', { ascending: false }).limit(90),
      ]);

      // Calculate cash total
      let cashTotal = 0;
      if (cashData.data) {
        for (const account of cashData.data) {
          let amount = parseFloat(account.amount || 0);
          if (account.currency !== 'THB') {
            const rate = await getExchangeRate(account.currency, 'THB');
            amount *= rate;
          }
          cashTotal += amount;
        }
      }

      // Calculate crypto total (simplified - will fetch prices in real implementation)
      const cryptoTotal = cryptoData.data?.reduce((sum, item) => {
        return sum + parseFloat(item.cost_basis || 0);
      }, 0) || 0;

      // Calculate stocks total (simplified)
      const stocksTotal = stocksData.data?.reduce((sum, item) => {
        let value = parseFloat(item.cost_basis || 0);
        if (item.currency === 'USD') {
          value *= 35.5; // Should use real exchange rate
        }
        return sum + value;
      }, 0) || 0;

      // Calculate liabilities
      let liabilitiesTotal = 0;
      if (liabilitiesData.data) {
        for (const liability of liabilitiesData.data) {
          let amount = parseFloat(liability.amount || 0);
          if (liability.currency !== 'THB') {
            const rate = await getExchangeRate(liability.currency, 'THB');
            amount *= rate;
          }
          liabilitiesTotal += amount;
        }
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
      });

      // Calculate changes
      if (historyData.data && historyData.data.length > 0) {
        const today = historyData.data[0];
        const yesterday = historyData.data[1];
        const monthAgo = historyData.data[29]; // Approximately 30 days ago

        if (yesterday) {
          const dailyDiff = netWealth - parseFloat(yesterday.total_wealth || 0);
          const dailyPercent = (dailyDiff / parseFloat(yesterday.total_wealth || 1)) * 100;
          setChange(prev => ({ ...prev, daily: dailyDiff, dailyPercent }));
        }

        if (monthAgo) {
          const monthlyDiff = netWealth - parseFloat(monthAgo.total_wealth || 0);
          const monthlyPercent = (monthlyDiff / parseFloat(monthAgo.total_wealth || 1)) * 100;
          setChange(prev => ({ ...prev, monthly: monthlyDiff, monthlyPercent }));
        }
      }

      // Format history for chart
      if (historyData.data) {
        const formatted = historyData.data.reverse().map(item => ({
          date: new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
          wealth: parseFloat(item.total_wealth || 0),
        }));
        setHistoryData(formatted);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pieData = [
    { name: 'เงินสด', value: summary.cash, color: '#5B8FF9' },
    { name: 'Crypto', value: summary.crypto, color: '#F6BD16' },
    { name: 'หุ้น & กองทุน', value: summary.stocks, color: '#E86452' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (configError) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="glass-card p-8 shadow-2xl border-yellow-500/30">
          <div className="flex items-start gap-4">
            <div className="text-yellow-400 text-4xl">⚠️</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">ต้องตั้งค่า Supabase ก่อนใช้งาน</h2>
              <p className="text-gray-300 mb-4">
                ระบบต้องการการเชื่อมต่อกับฐานข้อมูล Supabase เพื่อเก็บและแสดงข้อมูลพอร์ตโฟลิโอของคุณ
              </p>
              
              <div className="bg-[#1a1f35] rounded-lg p-6 mb-4 border border-gray-800/50">
                <h3 className="font-semibold text-gray-200 mb-3">วิธีตั้งค่า:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-400">
                  <li>ไปที่ <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">https://supabase.com</a> และสร้าง New Project</li>
                  <li>รอให้โปรเจคสร้างเสร็จ (ประมาณ 2-3 นาที)</li>
                  <li>ไปที่ <strong className="text-gray-300">Settings → API</strong></li>
                  <li>คัดลอก <strong className="text-gray-300">Project URL</strong> และ <strong className="text-gray-300">anon/public key</strong></li>
                  <li>เปิดไฟล์ <code className="bg-gray-800/50 px-2 py-1 rounded text-blue-400">.env.local</code> ในโปรเจค</li>
                  <li>แทนที่ค่า <code className="bg-gray-800/50 px-2 py-1 rounded text-blue-400">your_supabase_url_here</code> ด้วย URL จริง</li>
                  <li>บันทึกไฟล์และรีเฟรชหน้านี้</li>
                  <li>รัน SQL schema จากไฟล์ <code className="bg-gray-800/50 px-2 py-1 rounded text-blue-400">supabase-schema.sql</code> ใน Supabase SQL Editor</li>
                </ol>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  💡 <strong>หมายเหตุ:</strong> การใช้งาน Supabase ฟรีรองรับ:
                </p>
                <ul className="text-sm text-blue-400 mt-2 ml-6 list-disc">
                  <li>ฐานข้อมูล PostgreSQL 500 MB</li>
                  <li>Bandwidth 5 GB/เดือน</li>
                  <li>50,000 Monthly Active Users</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Overview ของพอร์ตโฟลิโอทั้งหมด</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105"
        >
          <RefreshCw size={18} />
          รีเฟรช
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white rounded-2xl p-6 shadow-2xl shadow-blue-500/30">
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium">ทรัพย์สินรวม</p>
            <p className="text-4xl font-bold mt-2">{formatCurrency(summary.netWealth)}</p>
            <div className="flex items-center gap-2 mt-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
              {change.daily >= 0 ? (
                <TrendingUp size={16} className="text-green-300" />
              ) : (
                <TrendingDown size={16} className="text-red-300" />
              )}
              <span className={`text-sm font-semibold ${change.daily >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {change.daily >= 0 ? '+' : ''}{formatCurrency(change.daily)} ({change.dailyPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="glass-card p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-gray-700/50">
          <p className="text-gray-400 text-sm font-medium">เงินสด</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{formatCurrency(summary.cash)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {((summary.cash / summary.totalWealth) * 100).toFixed(1)}% ของพอร์ต
          </p>
        </div>

        <div className="glass-card p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-gray-700/50">
          <p className="text-gray-400 text-sm font-medium">Crypto</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{formatCurrency(summary.crypto)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {((summary.crypto / summary.totalWealth) * 100).toFixed(1)}% ของพอร์ต
          </p>
        </div>

        <div className="glass-card p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-gray-700/50">
          <p className="text-gray-400 text-sm font-medium">หุ้น & กองทุน</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">{formatCurrency(summary.stocks)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {((summary.stocks / summary.totalWealth) * 100).toFixed(1)}% ของพอร์ต
          </p>
        </div>
      </div>

      {/* Change Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 shadow-xl border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">การเปลี่ยนแปลงรายวัน</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-100">
                {change.daily >= 0 ? '+' : ''}{formatCurrency(change.daily)}
              </p>
              <p className={`text-lg font-semibold ${change.daily >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change.dailyPercent >= 0 ? '+' : ''}{change.dailyPercent.toFixed(2)}%
              </p>
            </div>
            {change.daily >= 0 ? (
              <TrendingUp size={48} className="text-green-400" />
            ) : (
              <TrendingDown size={48} className="text-red-400" />
            )}
          </div>
        </div>

        <div className="glass-card p-6 shadow-xl border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">การเปลี่ยนแปลงรายเดือน</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-100">
                {change.monthly >= 0 ? '+' : ''}{formatCurrency(change.monthly)}
              </p>
              <p className={`text-lg font-semibold ${change.monthly >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change.monthlyPercent >= 0 ? '+' : ''}{change.monthlyPercent.toFixed(2)}%
              </p>
            </div>
            {change.monthly >= 0 ? (
              <TrendingUp size={48} className="text-green-400" />
            ) : (
              <TrendingDown size={48} className="text-red-400" />
            )}
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 shadow-xl border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">การกระจายพอร์ตโฟลิโอ</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                contentStyle={{
                  backgroundColor: '#1a1f35',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>


        <div className="glass-card p-6 shadow-xl border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">การเติบโตของทรัพย์สิน (90 วันล่าสุด)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                contentStyle={{
                  backgroundColor: '#1a1f35',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend wrapperStyle={{ color: '#9CA3AF' }} />
              <Line 
                type="monotone" 
                dataKey="wealth" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                name="ทรัพย์สินรวม"
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {summary.liabilities > 0 && (
        <div className="glass-card border-red-500/30 p-6 bg-red-500/5">
          <h3 className="text-lg font-semibold text-red-400 mb-2">หนี้สิน</h3>
          <p className="text-gray-300">
            คุณมีหนี้สินรวม <span className="font-bold text-red-400">{formatCurrency(summary.liabilities)}</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            หนี้สินถูกหักออกจากทรัพย์สินรวมแล้ว
          </p>
        </div>
      )}
    </div>
  );
}
