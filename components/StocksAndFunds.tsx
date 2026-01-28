'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getExchangeRate, getCachedPrice } from '@/lib/cache';
import { StockData } from '@/types';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';

export default function StocksAndFunds() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stock_foreign',
    quantity: 0,
    cost_basis: 0,
    currency: 'USD',
    data_source: 'yahoo',
    data_url: '',
  });

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('name');

      if (error) throw error;

      // Fetch current prices
      const stocksWithPrices = await Promise.all(
        (data || []).map(async (stock) => {
          const price = await fetchPrice(stock);
          const totalValue = price * stock.quantity;
          const costPerShare = stock.cost_basis / stock.quantity;
          const profitLoss = totalValue - stock.cost_basis;
          const profitLossPercent = (profitLoss / stock.cost_basis) * 100;

          return {
            ...stock,
            current_price: price,
            total_value: totalValue,
            profit_loss: profitLoss,
            profit_loss_percent: profitLossPercent,
          };
        })
      );

      setStocks(stocksWithPrices);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrice = async (stock: StockData): Promise<number> => {
    try {
      if (stock.data_source === 'yahoo') {
        const res = await fetch(`/api/prices/stock?symbol=${stock.symbol}`);
        const data = await res.json();
        let price = data.price || 0;

        // Convert to THB if needed
        if (stock.currency === 'THB' && data.currency === 'USD') {
          const rate = await getExchangeRate('USD', 'THB');
          price *= rate;
        }

        return price;
      } else if (stock.data_source === 'scbam' || stock.data_source === 'fundsupermart') {
        const res = await fetch(
          `/api/prices/fund?url=${encodeURIComponent(stock.data_url || '')}&source=${stock.data_source}&code=${stock.symbol}`
        );
        const data = await res.json();
        return data.price || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching price:', error);
      return 0;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStocks();
    setRefreshing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('stocks')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stocks')
          .insert([formData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        symbol: '',
        name: '',
        type: 'stock_foreign',
        quantity: 0,
        cost_basis: 0,
        currency: 'USD',
        data_source: 'yahoo',
        data_url: '',
      });
      loadStocks();
    } catch (error) {
      console.error('Error saving stock:', error);
      alert('เกิดข้อผิดพลาด: ' + (error as Error).message);
    }
  };

  const handleEdit = (stock: StockData) => {
    setEditingId(stock.id);
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      type: stock.type,
      quantity: stock.quantity,
      cost_basis: stock.cost_basis,
      currency: stock.currency,
      data_source: stock.data_source,
      data_url: stock.data_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบรายการนี้หรือไม่?')) return;

    try {
      const { error } = await supabase
        .from('stocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadStocks();
    } catch (error) {
      console.error('Error deleting stock:', error);
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

  const formatNumber = (value: number, decimals: number = 4) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  if (loading) {
    return <div className="text-center py-12">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">หุ้น & กองทุน</h1>
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
                type: 'stock_foreign',
                quantity: 0,
                cost_basis: 0,
                currency: 'USD',
                data_source: 'yahoo',
                data_url: '',
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl m-4">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภท
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="stock_thai">หุ้นไทย</option>
                    <option value="stock_foreign">หุ้นต่างประเทศ</option>
                    <option value="etf">ETF</option>
                    <option value="fund">กองทุนรวม</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    แหล่งข้อมูล
                  </label>
                  <select
                    value={formData.data_source}
                    onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="yahoo">Yahoo Finance</option>
                    <option value="scbam">SCBAM</option>
                    <option value="fundsupermart">FundSuperMart</option>
                  </select>
                </div>
              </div>

              {(formData.data_source === 'scbam' || formData.data_source === 'fundsupermart') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.data_url}
                    onChange={(e) => setFormData({ ...formData, data_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ต้นทุนรวม
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
                    สกุลเงิน
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="THB">THB</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
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

      {/* Stocks Table */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภท</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ต้นทุนรวม</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ราคาปัจจุบัน</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">มูลค่าปัจจุบัน</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">กำไร/ขาดทุน</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stocks.map((stock) => (
                <tr key={stock.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stock.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stock.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {stock.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatNumber(stock.quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(stock.cost_basis)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(stock.current_price || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(stock.total_value || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={(stock.profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(stock.profit_loss || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={(stock.profit_loss_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {(stock.profit_loss_percent || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(stock)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(stock.id)}
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

        {stocks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ยังไม่มีรายการ คลิกปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น
          </div>
        )}
      </div>
    </div>
  );
}
