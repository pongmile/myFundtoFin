'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Liability } from '@/types';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function Liabilities() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card',
    amount: 0,
    currency: 'THB',
  });

  useEffect(() => {
    loadLiabilities();
  }, []);

  const loadLiabilities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('liabilities')
        .select('*')
        .order('name');

      if (error) throw error;
      setLiabilities(data || []);
    } catch (error) {
      console.error('Error loading liabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('liabilities')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('liabilities')
          .insert([formData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', type: 'credit_card', amount: 0, currency: 'THB' });
      loadLiabilities();
    } catch (error) {
      console.error('Error saving liability:', error);
      alert('เกิดข้อผิดพลาด: ' + (error as Error).message);
    }
  };

  const handleEdit = (liability: Liability) => {
    setEditingId(liability.id);
    setFormData({
      name: liability.name,
      type: liability.type,
      amount: liability.amount,
      currency: liability.currency,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบรายการนี้หรือไม่?')) return;

    try {
      const { error } = await supabase
        .from('liabilities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadLiabilities();
    } catch (error) {
      console.error('Error deleting liability:', error);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency === 'THB' ? 'THB' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      credit_card: 'บัตรเครดิต',
      car_loan: 'สินเชื่อรถยนต์',
      mortgage: 'สินเชื่อบ้าน',
      other: 'อื่นๆ',
    };
    return labels[type] || type;
  };

  const getTotalLiabilities = () => {
    return liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  };

  if (loading) {
    return <div className="text-center py-12">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">หนี้สิน</h1>
          <p className="text-xl text-red-600 mt-2 font-semibold">
            รวม: {formatCurrency(getTotalLiabilities(), 'THB')}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', type: 'credit_card', amount: 0, currency: 'THB' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={18} />
          เพิ่มหนี้สิน
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 mt-1" size={24} />
        <div>
          <h3 className="font-semibold text-yellow-800">คำเตือน</h3>
          <p className="text-sm text-yellow-700 mt-1">
            หนี้สินทั้งหมดจะถูกหักออกจากทรัพย์สินรวมของคุณในหน้า Dashboard
          </p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'แก้ไขหนี้สิน' : 'เพิ่มหนี้สินใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อหนี้สิน
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="เช่น บัตรเครดิต SCB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภท
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="credit_card">บัตรเครดิต</option>
                  <option value="car_loan">สินเชื่อรถยนต์</option>
                  <option value="mortgage">สินเชื่อบ้าน</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนเงิน
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
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
                  <option value="THB">THB (บาท)</option>
                  <option value="USD">USD (ดอลลาร์)</option>
                  <option value="CAD">CAD (ดอลลาร์แคนาดา)</option>
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

      {/* Liabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liabilities.map((liability) => (
          <div
            key={liability.id}
            className="bg-white rounded-xl p-6 shadow-lg border border-red-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">{liability.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                    {getTypeLabel(liability.type)}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(liability)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(liability.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                -{formatCurrency(liability.amount, liability.currency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{liability.currency}</p>
            </div>
          </div>
        ))}
      </div>

      {liabilities.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          ยังไม่มีหนี้สิน คลิกปุ่ม "เพิ่มหนี้สิน" เพื่อเริ่มต้น
        </div>
      )}
    </div>
  );
}
