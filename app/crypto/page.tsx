'use client';

import { useEffect, useState } from 'react';
import { Bitcoin, Plus, Trash2, Edit, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  cost_basis: number;
  api_source: string;
  created_at: string;
}

interface PriceData {
  currentPrice: number;
  change24h: number;
}

const CRYPTO_SOURCES = [
  { value: 'bitkub', label: 'Bitkub' },
  { value: 'coinranking', label: 'CoinRanking' },
  { value: 'coingecko', label: 'CoinGecko' },
];

const POPULAR_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', emoji: '₿' },
  { symbol: 'ETH', name: 'Ethereum', emoji: 'Ξ' },
  { symbol: 'BNB', name: 'Binance Coin', emoji: '🔸' },
  { symbol: 'XRP', name: 'Ripple', emoji: '💧' },
  { symbol: 'ADA', name: 'Cardano', emoji: '🎴' },
  { symbol: 'SOL', name: 'Solana', emoji: '☀️' },
  { symbol: 'DOGE', name: 'Dogecoin', emoji: '🐕' },
  { symbol: 'DOT', name: 'Polkadot', emoji: '⚫' },
  { symbol: 'MATIC', name: 'Polygon', emoji: '🟣' },
  { symbol: 'AVAX', name: 'Avalanche', emoji: '🔺' },
];

export default function CryptoPage() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [totalCostBasis, setTotalCostBasis] = useState(0);

  const [formData, setFormData] = useState({
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: '',
    cost_basis: '',
    api_source: 'bitkub',
  });

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    if (assets.length > 0) {
      fetchPrices();
    }
  }, [assets]);

  const loadAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('crypto')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAssets(data);
      const totalCost = data.reduce((sum, item) => sum + parseFloat(item.cost_basis || 0), 0);
      setTotalCostBasis(totalCost);
    }
    setLoading(false);
  };

  const fetchPrices = async () => {
    const priceData: Record<string, PriceData> = {};
    let totalMarketValue = 0;

    for (const asset of assets) {
      try {
        const response = await axios.get(`/api/crypto/price?symbol=${asset.symbol}`);
        const currentPrice = response.data.price || 0;
        const change24h = response.data.change_24h || 0;
        
        priceData[asset.symbol] = { currentPrice, change24h };
        totalMarketValue += currentPrice * parseFloat(asset.quantity.toString());
      } catch (error) {
        console.warn(`Failed to fetch price for ${asset.symbol}`);
        priceData[asset.symbol] = { currentPrice: 0, change24h: 0 };
      }
    }

    setPrices(priceData);
    setTotalValue(totalMarketValue);
  };

  const handleSymbolChange = (symbol: string) => {
    const crypto = POPULAR_CRYPTOS.find(c => c.symbol === symbol);
    if (crypto) {
      setFormData({
        ...formData,
        symbol: crypto.symbol,
        name: crypto.name,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = parseFloat(formData.quantity);
    const cost_basis = parseFloat(formData.cost_basis);

    if (isNaN(quantity) || quantity <= 0) {
      alert('กรุณาใส่จำนวนที่ถูกต้อง');
      return;
    }

    if (isNaN(cost_basis) || cost_basis < 0) {
      alert('กรุณาใส่ต้นทุนที่ถูกต้อง');
      return;
    }

    const payload = {
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      quantity,
      cost_basis,
      api_source: formData.api_source,
    };

    if (editingId) {
      const { error } = await supabase
        .from('crypto')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('crypto').insert([payload]);

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
    }

    resetForm();
    loadAssets();
  };

  const handleEdit = (asset: CryptoAsset) => {
    setEditingId(asset.id);
    setFormData({
      symbol: asset.symbol,
      name: asset.name,
      quantity: asset.quantity.toString(),
      cost_basis: asset.cost_basis.toString(),
      api_source: asset.api_source,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบเหรียญนี้?')) return;

    const { error } = await supabase.from('crypto').delete().eq('id', id);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }

    loadAssets();
  };

  const resetForm = () => {
    setFormData({
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: '',
      cost_basis: '',
      api_source: 'bitkub',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getCryptoEmoji = (symbol: string) => {
    const crypto = POPULAR_CRYPTOS.find(c => c.symbol === symbol);
    return crypto?.emoji || '🪙';
  };

  const totalProfitLoss = totalValue - totalCostBasis;
  const totalProfitLossPercent = totalCostBasis > 0 ? (totalProfitLoss / totalCostBasis) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Bitcoin size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">🪙 Cryptocurrency</h1>
            <p className="text-gray-400 text-sm">ติดตามสินทรัพย์ดิจิทัลของคุณ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="glass-card p-5 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <p className="text-gray-400 text-sm mb-2">💰 มูลค่าตลาดปัจจุบัน</p>
            <h2 className="text-3xl font-bold text-white">{formatCurrency(totalValue)}</h2>
          </div>

          <div className="glass-card p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <p className="text-gray-400 text-sm mb-2">📊 ต้นทุนรวม</p>
            <h2 className="text-3xl font-bold text-white">{formatCurrency(totalCostBasis)}</h2>
          </div>

          <div className={`glass-card p-5 bg-gradient-to-br ${
            totalProfitLoss >= 0 ? 'from-green-500/10 to-emerald-500/10 border-green-500/30' : 'from-red-500/10 to-rose-500/10 border-red-500/30'
          }`}>
            <p className="text-gray-400 text-sm mb-2">
              {totalProfitLoss >= 0 ? '📈 กำไร' : '📉 ขาดทุน'}
            </p>
            <h2 className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
            </h2>
            <p className={`text-sm mt-1 ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfitLoss >= 0 ? '↗' : '↘'} {totalProfitLossPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full glass-card p-4 mb-6 hover:bg-gray-700/30 transition-all group border-dashed border-2 border-gray-600 hover:border-yellow-500"
      >
        <div className="flex items-center justify-center gap-3">
          <Plus size={24} className="text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="text-lg font-semibold text-gray-300 group-hover:text-white">
            {showForm ? 'ซ่อนฟอร์ม' : '+ เพิ่มเหรียญใหม่'}
          </span>
        </div>
      </button>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 mb-6 border-yellow-500/30">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Coins size={24} className="text-yellow-400" />
            {editingId ? '✏️ แก้ไขรายการ' : '➕ เพิ่มเหรียญใหม่'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  🪙 Symbol (BTC, ETH, etc.) <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                >
                  {POPULAR_CRYPTOS.map((crypto) => (
                    <option key={crypto.symbol} value={crypto.symbol}>
                      {crypto.emoji} {crypto.symbol} - {crypto.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  📛 ชื่อเหรียญ
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                  placeholder="Bitcoin"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  🔢 จำนวน <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                  placeholder="0.00000000"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  💵 ต้นทุนรวม (THB) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_basis}
                  onChange={(e) => setFormData({ ...formData, cost_basis: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                🌐 แหล่งข้อมูล API
              </label>
              <select
                value={formData.api_source}
                onChange={(e) => setFormData({ ...formData, api_source: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
              >
                {CRYPTO_SOURCES.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-yellow-500/50"
              >
                {editingId ? '💾 บันทึก' : '✅ เพิ่มเหรียญ'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-semibold hover:bg-gray-600/50 transition-all border border-gray-600"
              >
                ❌ ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assets List */}
      <div className="space-y-4">
        {assets.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-2 border-gray-600">
            <Bitcoin size={64} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">ยังไม่มีเหรียญคริปโต</p>
            <p className="text-gray-500 text-sm">คลิกปุ่ม "+ เพิ่มเหรียญใหม่" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          assets.map((asset) => {
            const priceData = prices[asset.symbol] || { currentPrice: 0, change24h: 0 };
            const currentValue = priceData.currentPrice * parseFloat(asset.quantity.toString());
            const profitLoss = currentValue - asset.cost_basis;
            const profitLossPercent = asset.cost_basis > 0 ? (profitLoss / asset.cost_basis) * 100 : 0;

            return (
              <div
                key={asset.id}
                className="glass-card p-5 hover:bg-gray-700/30 transition-all group border-l-4 border-yellow-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-3xl flex-shrink-0">
                      {getCryptoEmoji(asset.symbol)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{asset.symbol}</h3>
                        <span className="text-gray-400 text-sm">({asset.name})</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        จำนวน: <span className="text-white font-semibold">{asset.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">มูลค่าปัจจุบัน</p>
                          <p className="text-xl font-bold text-yellow-400">{formatCurrency(currentValue)}</p>
                          {priceData.change24h !== 0 && (
                            <p className={`text-xs mt-1 ${priceData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {priceData.change24h >= 0 ? '↗' : '↘'} {priceData.change24h.toFixed(2)}% (24h)
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">กำไร/ขาดทุน</p>
                          <p className={`text-xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                          </p>
                          <p className={`text-xs mt-1 ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profitLoss >= 0 ? '↗' : '↘'} {profitLossPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                      title="แก้ไข"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                      title="ลบ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
