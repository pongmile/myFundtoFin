'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getExchangeRate } from '@/lib/cache';
import { CashAccount } from '@/types';
import { Plus, Wallet, ChevronDown, ChevronUp, TrendingUp, X } from 'lucide-react';

const THAI_BANKS = [
  { name: 'ธนาคารกรุงเทพ', icon: '🏦', color: 'from-blue-600 to-blue-800' },
  { name: 'ธนาคารกสิกรไทย', icon: '🟢', color: 'from-green-600 to-emerald-700' },
  { name: 'ธนาคารไทยพาณิชย์', icon: '🟣', color: 'from-purple-600 to-purple-800' },
  { name: 'ธนาคารกรุงศรีอยุธยา', icon: '🔵', color: 'from-yellow-500 to-orange-600' },
  { name: 'ธนาคารกรุงไทย', icon: '💙', color: 'from-sky-500 to-blue-600' },
  { name: 'ธนาคารทหารไทยธนชาต', icon: '⚫', color: 'from-gray-700 to-gray-900' },
  { name: 'ธนาคารออมสิน', icon: '🟠', color: 'from-pink-500 to-rose-600' },
  { name: 'ธนาคารอาคารสงเคราะห์', icon: '🏠', color: 'from-orange-500 to-red-600' },
  { name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', icon: '🌾', color: 'from-green-700 to-lime-600' },
  { name: 'ธนาคารยูโอบี', icon: '�', color: 'from-blue-800 to-indigo-900' },
  { name: 'ธนาคารซิตี้แบงก์', icon: '🔷', color: 'from-blue-500 to-cyan-600' },
  { name: 'ธนาคารสแตนดาร์ดชาร์เตอร์ด', icon: '💚', color: 'from-teal-600 to-cyan-700' },
  { name: 'ธนาคารไอซีบีซี', icon: '🔴', color: 'from-red-600 to-rose-700' },
  { name: 'ธนาคารซูมิโตโม มิตซุย', icon: '🟢', color: 'from-emerald-600 to-green-700' },
  { name: 'ธนาคารแห่งประเทศจีน', icon: '🔴', color: 'from-red-700 to-red-900' },
  { name: 'ธนาคารทิสโก้', icon: '🟡', color: 'from-yellow-600 to-amber-700' },
  { name: 'ธนาคารแลนด์ แอนด์ เฮาส์', icon: '🏡', color: 'from-indigo-600 to-purple-700' },
  { name: 'ธนาคารเกียรตินาคินภัทร', icon: '🟤', color: 'from-amber-700 to-orange-800' },
  { name: 'ธนาคารซีไอเอ็มบี ไทย', icon: '🔴', color: 'from-red-500 to-pink-600' },
  { name: 'Dime', icon: '💎', color: 'from-cyan-500 to-blue-500' },
  { name: 'Kept', icon: '🔐', color: 'from-indigo-500 to-purple-500' },
  { name: 'อื่นๆ', icon: '📱', color: 'from-gray-500 to-slate-600' },
];

export default function CashAccounts() {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  // Form states
  const [selectedBank, setSelectedBank] = useState(THAI_BANKS[0]);
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('THB');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate total in THB
      let total = 0;
      for (const account of data || []) {
        let amountInTHB = account.amount;
        if (account.currency !== 'THB') {
          const rate = await getExchangeRate(account.currency, 'THB');
          amountInTHB *= rate;
        }
        total += amountInTHB;
      }

      setAccounts(data || []);
      setTotalValue(total);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('cash_accounts').insert([
        {
          account_name: accountName,
          bank_name: selectedBank.name,
          amount: parseFloat(amount),
          currency: currency,
        },
      ]);

      if (error) throw error;

      setShowAddModal(false);
      setAccountName('');
      setAmount('');
      setCurrency('THB');
      setSelectedBank(THAI_BANKS[0]);
      fetchAccounts();
    } catch (error) {
      console.error('Error adding account:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มบัญชี');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('ต้องการลบบัญชีนี้?')) return;

    try {
      const { error } = await supabase.from('cash_accounts').delete().eq('id', id);
      if (error) throw error;
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('เกิดข้อผิดพลาดในการลบบัญชี');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
            <Wallet className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Cash</h1>
            <p className="text-gray-400 text-sm">Cash & Bank Accounts</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className={`px-8 py-4 rounded-2xl text-white font-bold flex items-center gap-3 transition-all ${
            showAddModal 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'gradient-primary'
          }`}
        >
          {showAddModal ? <X className="w-5 h-5" strokeWidth={3} /> : <Plus className="w-5 h-5" strokeWidth={3} />}
          <span>{showAddModal ? 'ปิด' : 'เพิ่ม'}</span>
        </button>
      </div>

      {/* Add Form - Top Section */}
      {showAddModal && (
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            เพิ่มบัญชีใหม่
          </h2>

          <form onSubmit={handleAddAccount} className="space-y-6">
            {/* Bank Selection */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">เลือกธนาคาร</label>
              <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {THAI_BANKS.map((bank) => (
                  <button
                    key={bank.name}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`glass-button p-3 transition-all ${
                      selectedBank.name === bank.name
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 shadow-lg'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${bank.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-1 shadow-lg`}>
                      {bank.icon}
                    </div>
                    <p className="text-white text-xs font-bold truncate">{bank.name.replace('ธนาคาร', '')}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields - แบ่งเป็นบรรทัดใหม่ */}
            <div className="space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-white text-sm font-bold mb-2">ชื่อบัญชี</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full glass-button px-6 py-4 text-white text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="บัญชีเงินเดือน, บัญชีออม, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-white text-sm font-bold mb-2">จำนวนเงิน</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full glass-button px-6 py-4 text-white text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-white text-sm font-bold mb-2">สกุลเงิน</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full glass-button px-6 py-4 text-white text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="THB">THB (บาท)</option>
                    <option value="USD">USD (ดอลลาร์)</option>
                    <option value="CAD">CAD (ดอลลาร์แคนาดา)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full gradient-primary py-4 rounded-xl text-white font-bold hover:shadow-2xl transition-all"
            >
              เพิ่มบัญชี {selectedBank.name.replace('ธนาคาร', '')}
            </button>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">ยังไม่มีบัญชี</p>
          <p className="text-gray-500 text-sm">กดปุ่มเพิ่มเพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Card - Collapsible */}
          <div className="glass-card overflow-hidden">
            {/* Header - Always Visible */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full p-8 text-left hover:bg-white/5 transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl">Cash Portfolio</p>
                    <p className="text-gray-400 text-sm">{accounts.length} บัญชี</p>
                  </div>
                </div>
                <div className="glass-button p-3 rounded-xl">
                  {expanded ? (
                    <ChevronUp className="w-6 h-6 text-gray-300" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-300" />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">มูลค่าCashทั้งหมด</p>
                  <h2 className="text-4xl font-bold text-white mb-1">
                    ฿{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expanded && (
              <div className="border-t border-white/10 px-6 pb-6">
                <div className="space-y-3 mt-6">
                  {accounts.map((account) => {
                    const bank = THAI_BANKS.find(b => b.name === account.bank_name) || THAI_BANKS[0];
                    return (
                      <div
                        key={account.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(account.id);
                        }}
                        className="glass-button p-5 hover:bg-white/10 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${bank.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                            {bank.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <h3 className="text-white font-bold text-lg">{account.account_name || account.bank_name}</h3>
                              <span className="text-gray-400 text-sm truncate">{account.bank_name}</span>
                            </div>
                            <p className="text-gray-500 text-sm">{account.currency}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-white font-bold text-lg mb-1">
                              {account.currency === 'THB' ? '฿' : account.currency} {account.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
