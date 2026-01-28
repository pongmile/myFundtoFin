'use client';

import { useEffect, useState } from 'react';
import { Wallet, Plus, Trash2, Edit, TrendingUp, Landmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExchangeRate } from '@/lib/cache';

interface CashAccount {
  id: string;
  account_name: string;
  bank_name: string;
  bank_logo?: string;
  amount: number;
  currency: string;
  created_at: string;
}

const THAI_BANKS = [
  'ธนาคารกรุงเทพ (BBL)',
  'ธนาคารกสิกรไทย (KBANK)',
  'ธนาคารกรุงไทย (KTB)',
  'ธนาคารทหารไทยธนชาต (TTB)',
  'ธนาคารไทยพาณิชย์ (SCB)',
  'ธนาคารกรุงศรีอยุธยา (BAY)',
  'ธนาคารเกียรตินาคินภัทร (KKP)',
  'ธนาคารซีไอเอ็มบีไทย (CIMB)',
  'ธนาคารทิสโก้ (TISCO)',
  'ธนาคารยูโอบี (UOB)',
  'ธนาคารธนชาต (THANACHART)',
  'ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)',
  'ธนาคารไอซีบีซี (ไทย) (ICBC)',
  'ธนาคารออมสิน (GSB)',
  'ธนาคารอาคารสงเคราะห์ (GHB)',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)',
  'ธนาคารอิสลามแห่งประเทศไทย (IBANK)',
  'ธนาคารเอ็กซิม (EXIM)',
  'อื่นๆ',
];

const BANK_EMOJIS: Record<string, string> = {
  'ธนาคารกรุงเทพ': '🏦',
  'ธนาคารกสิกรไทย': '💚',
  'ธนาคารกรุงไทย': '🔵',
  'ธนาคารทหารไทยธนชาต': '🪖',
  'ธนาคารไทยพาณิชย์': '💜',
  'ธนาคารกรุงศรีอยุธยา': '🟡',
  'ธนาคารออมสิน': '🐷',
  'ธนาคารอาคารสงเคราะห์': '🏠',
  'default': '💰',
};

export default function CashPage() {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [totalInTHB, setTotalInTHB] = useState(0);

  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: THAI_BANKS[0],
    amount: '',
    currency: 'THB',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cash_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAccounts(data);
      await calculateTotal(data);
    }
    setLoading(false);
  };

  const calculateTotal = async (accountsList: CashAccount[]) => {
    let total = 0;
    for (const account of accountsList) {
      let amount = parseFloat(account.amount?.toString() || '0');
      if (account.currency !== 'THB') {
        const rate = await getExchangeRate(account.currency, 'THB');
        amount *= rate;
      }
      total += amount;
    }
    setTotalInTHB(total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }

    if (!formData.account_name.trim()) {
      alert('กรุณาใส่ชื่อบัญชี');
      return;
    }

    const payload = {
      account_name: formData.account_name.trim(),
      bank_name: formData.bank_name,
      amount,
      currency: formData.currency,
    };

    if (editingId) {
      const { error } = await supabase
        .from('cash_accounts')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('cash_accounts').insert([payload]);

      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
    }

    resetForm();
    loadAccounts();
  };

  const handleEdit = (account: CashAccount) => {
    setEditingId(account.id);
    setFormData({
      account_name: account.account_name,
      bank_name: account.bank_name,
      amount: account.amount.toString(),
      currency: account.currency,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบบัญชีนี้?')) return;

    const { error } = await supabase.from('cash_accounts').delete().eq('id', id);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }

    loadAccounts();
  };

  const resetForm = () => {
    setFormData({
      account_name: '',
      bank_name: THAI_BANKS[0],
      amount: '',
      currency: 'THB',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'THB') {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
      }).format(amount);
    }
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const getBankEmoji = (bankName: string) => {
    const key = Object.keys(BANK_EMOJIS).find(k => bankName.includes(k));
    return key ? BANK_EMOJIS[key] : BANK_EMOJIS.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <Wallet size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">💵 เงินสด</h1>
            <p className="text-gray-400 text-sm">จัดการบัญชีธนาคารของคุณ</p>
          </div>
        </div>

        <div className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">💰 มูลค่ารวมทั้งหมด</p>
              <h2 className="text-4xl font-bold text-white">
                {new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                }).format(totalInTHB)}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">จำนวนบัญชี</p>
              <p className="text-3xl font-bold text-green-400">{accounts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full glass-card p-4 mb-6 hover:bg-gray-700/30 transition-all group border-dashed border-2 border-gray-600 hover:border-green-500"
      >
        <div className="flex items-center justify-center gap-3">
          <Plus size={24} className="text-green-400 group-hover:scale-110 transition-transform" />
          <span className="text-lg font-semibold text-gray-300 group-hover:text-white">
            {showForm ? 'ซ่อนฟอร์ม' : '+ เพิ่มบัญชีใหม่'}
          </span>
        </div>
      </button>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 mb-6 border-green-500/30">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Landmark size={24} className="text-green-400" />
            {editingId ? '✏️ แก้ไขบัญชี' : '➕ เพิ่มบัญชีใหม่'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                📝 ชื่อบัญชี <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                placeholder="เช่น บัญชีเงินเดือน, บัญชีออมทรัพย์"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                🏦 ธนาคาร <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
              >
                {THAI_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  💵 สกุลเงิน
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                >
                  <option value="THB">THB (฿)</option>
                  <option value="USD">USD ($)</option>
                  <option value="CAD">CAD (CA$)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  💰 จำนวนเงิน <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/50"
              >
                {editingId ? '💾 บันทึก' : '✅ เพิ่มบัญชี'}
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

      {/* Accounts List */}
      <div className="space-y-4">
        {accounts.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-2 border-gray-600">
            <Wallet size={64} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">ยังไม่มีบัญชีธนาคาร</p>
            <p className="text-gray-500 text-sm">คลิกปุ่ม "+ เพิ่มบัญชีใหม่" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="glass-card p-5 hover:bg-gray-700/30 transition-all group border-l-4 border-green-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-3xl flex-shrink-0">
                    {getBankEmoji(account.bank_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1">{account.account_name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{account.bank_name}</p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency(account.amount, account.currency)}
                      </p>
                      {account.currency !== 'THB' && (
                        <p className="text-sm text-gray-500">
                          ≈ {new Intl.NumberFormat('th-TH', {
                            style: 'currency',
                            currency: 'THB',
                          }).format(account.amount * (account.currency === 'USD' ? 35 : 25))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                    title="แก้ไข"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                    title="ลบ"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
