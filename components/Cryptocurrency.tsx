'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CryptoData } from '@/types';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';

export default function Cryptocurrency() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    quantity: 0,
    cost_basis: 0,
    api_source: 'bitkub',
    api_url: '',
  });

  useEffect(() => {
    loadCryptos();
  }, []);

  const loadCryptos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crypto')
        .select('*')
        .order('name');

      if (error) throw error;

      // Fetch current prices
      const cryptosWithPrices = await Promise.all(
        (data || []).map(async (crypto) => {
          const price = await fetchPrice(crypto.symbol);
          const totalValue = price * crypto.quantity;
          const profitLoss = totalValue - crypto.cost_basis;
          const profitLossPercent = (profitLoss / crypto.cost_basis) * 100;

          return {
            ...crypto,
            current_price: price,
            total_value: totalValue,
            profit_loss: profitLoss,
            profit_loss_percent: profitLossPercent,
          };
        })
      );

      setCryptos(cryptosWithPrices);
    } catch (error) {
      console.error('Error loading cryptos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrice = async (symbol: string): Promise<number> => {
    try {
      const res = await fetch(`/api/prices/crypto?symbol=${symbol}`);
      const data = await res.json();
      return data.price || 0;
    } catch (error) {
      console.error('Error fetching crypto price:', error);
      return 0;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCryptos();
    setRefreshing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('crypto')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crypto')
          .insert([formData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        symbol: '',
        name: '',
        quantity: 0,
        cost_basis: 0,
        api_source: 'bitkub',
        api_url: '',
      });
      loadCryptos();
    } catch (error) {
      console.error('Error saving crypto:', error);
      alert('เกิดข้อผิดพลาด: ' + (error as Error).message);
    }
  };

  const handleEdit = (crypto: CryptoData) => {
    setEditingId(crypto.id);
    setFormData({
      symbol: crypto.symbol,
      name: crypto.name,
      quantity: crypto.quantity,
      cost_basis: crypto.cost_basis,
      api_source: crypto.api_source,
      api_url: crypto.api_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบรายการนี้หรือไม่?')) return;

    try {
      const { error } = await supabase
        .from('crypto')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCryptos();
    } catch (error) {
      console.error('Error deleting crypto:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 8) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const getTotalValue = () => {
    return cryptos.reduce((sum, crypto) => sum + (crypto.total_value || 0), 0);
  };

  const getTotalCost = () => {
    return cryptos.reduce((sum, crypto) => sum + crypto.cost_basis, 0);
  };

  const getTotalProfitLoss = () => {
    return getTotalValue() - getTotalCost();
  };

  if (loading) {
    return <div className="text-center py-12">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cryptocurrency</h1>
          <div className="flex gap-4 mt-2">
            <p className="text-sm text-gray-600">
              ต้นทุน: <span className="font-semibold">{formatCurrency(getTotalCost())}</span>
            </p>
            <p className="text-sm text-gray-600">
              มูลค่า: <span className="font-semibold">{formatCurrency(getTotalValue())}</span>
            </p>
            <p className={`text-sm ${getTotalProfitLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              กำไร/ขาดทุน: <span className="font-semibold">{formatCurrency(getTotalProfitLoss())}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            รีเฟรชราคา
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                symbol: '',
                name: '',
                quantity: 0,
                cost_basis: 0,
                api_source: 'bitkub',
                api_url: '',
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol (BTC, ETH, etc.)
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อเหรียญ
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนเหรียญ
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ต้นทุนรวม (THB)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.cost_basis}
                  onChange={(e) => setFormData({ ...formData, cost_basis: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  แหล่งข้อมูล
                </label>
                <select
                  value={formData.api_source}
                  onChange={(e) => setFormData({ ...formData, api_source: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bitkub">Bitkub</option>
                  <option value="coinranking">CoinRanking</option>
                  <option value="cryptoprices">CryptoPrices</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crypto Table */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวนเหรียญ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ต้นทุนรวม</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ราคา/เหรียญ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">มูลค่าปัจจุบัน</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">กำไร/ขาดทุน</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cryptos.map((crypto) => (
                <tr key={crypto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {crypto.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {crypto.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatNumber(crypto.quantity, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(crypto.cost_basis)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(crypto.current_price || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(crypto.total_value || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={(crypto.profit_loss || 0) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {formatCurrency(crypto.profit_loss || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={(crypto.profit_loss_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {(crypto.profit_loss_percent || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(crypto)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(crypto.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cryptos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ยังไม่มีรายการ คลิกปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น
          </div>
        )}
      </div>
    </div>
  );
}
