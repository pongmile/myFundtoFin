'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getExchangeRate } from '@/lib/cache';
import { StockData } from '@/types';
import { Plus, TrendingUp, TrendingDown, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';

const STOCK_TYPES = [
    { value: 'stock_thai', label: 'หุ้นไทย', emoji: '🇹🇭', color: 'from-blue-600 to-indigo-600' },
    { value: 'stock_foreign', label: 'หุ้นต่างประเทศ', emoji: '🌍', color: 'from-purple-600 to-pink-600' },
    { value: 'fund_thai', label: 'กองทุนไทย', emoji: '📊', color: 'from-green-600 to-emerald-600' },
    { value: 'fund_foreign', label: 'กองทุนต่างประเทศ', emoji: '🌐', color: 'from-orange-600 to-red-600' },
];

const DATA_SOURCES = [
    { value: 'yahoo', label: 'Yahoo Finance' },
    { value: 'scbam', label: 'SCBAM' },
    { value: 'fundsupermart', label: 'FundSuperMart' },
];

export default function StocksAndFunds() {
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [totalValue, setTotalValue] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [selectedType, setSelectedType] = useState(STOCK_TYPES[0]);
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [costBasis, setCostBasis] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [dataSource, setDataSource] = useState('yahoo');
    const [dataUrl, setDataUrl] = useState('');

    const fetchStocks = async () => {
        try {
            setRefreshing(true);
            const { data, error } = await supabase
                .from('stocks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const stocksWithPrices = await Promise.all(
                (data || []).map(async (stock) => {
                    try {
                        const price = await fetchPrice(stock);
                        const currentValue = price * stock.quantity;
                        const profitLoss = currentValue - stock.cost_basis;
                        const profitLossPercent = stock.cost_basis > 0 ? (profitLoss / stock.cost_basis) * 100 : 0;

                        return {
                            ...stock,
                            current_price: price,
                            total_value: currentValue,
                            profit_loss: profitLoss,
                            profit_loss_percent: profitLossPercent,
                        };
                    } catch (err) {
                        console.error(`Error fetching price for ${stock.symbol}:`, err);
                        return {
                            ...stock,
                            current_price: 0,
                            total_value: 0,
                            profit_loss: -stock.cost_basis,
                            profit_loss_percent: -100,
                        };
                    }
                })
            );

            setStocks(stocksWithPrices);

            const total = stocksWithPrices.reduce((sum, stock) => sum + (stock.total_value || 0), 0);
            const cost = stocksWithPrices.reduce((sum, stock) => sum + stock.cost_basis, 0);

            setTotalValue(total);
            setTotalCost(cost);
        } catch (error) {
            console.error('Error fetching stocks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPrice = async (stock: StockData): Promise<number> => {
        try {
            if (stock.data_source === 'yahoo') {
                const res = await fetch(`/api/prices/stock?symbol=${stock.symbol}`);
                const data = await res.json();
                let price = data.price || 0;

                if (stock.currency !== 'THB') {
                    const rate = await getExchangeRate(stock.currency, 'THB');
                    price *= rate;
                }

                return price;
            } else {
                const res = await fetch(
                    `/api/prices/fund?url=${encodeURIComponent(stock.data_url || '')}&source=${stock.data_source}&code=${stock.symbol}`
                );
                const data = await res.json();
                return data.price || 0;
            }
        } catch (error) {
            console.error('Error fetching price:', error);
            return 0;
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    const handleEditStock = (stock: StockData) => {
        setEditingId(stock.id);
        const type = STOCK_TYPES.find(t => t.value === stock.type) || STOCK_TYPES[0];
        setSelectedType(type);
        setSymbol(stock.symbol);
        setName(stock.name);
        setQuantity(stock.quantity.toString());
        setCostBasis(stock.cost_basis.toString());
        setCurrency(stock.currency);
        setDataSource(stock.data_source);
        setDataUrl(stock.data_url || '');
        setShowAddModal(true);
        setExpanded(false);
    };

    const handleUpdateStock = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingId) return;

        try {
            const { error } = await supabase
                .from('stocks')
                .update({
                    symbol: symbol,
                    name: name,
                    type: selectedType.value,
                    quantity: parseFloat(quantity),
                    cost_basis: parseFloat(costBasis),
                    currency: currency,
                    data_source: dataSource,
                    data_url: dataUrl,
                })
                .eq('id', editingId);

            if (error) throw error;

            setShowAddModal(false);
            setEditingId(null);
            setSymbol('');
            setName('');
            setQuantity('');
            setCostBasis('');
            setCurrency('USD');
            setDataSource('yahoo');
            setDataUrl('');
            setSelectedType(STOCK_TYPES[0]);
            fetchStocks();
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('เกิดข้อผิดพลาดในการอัพเดทสินทรัพย์');
        }
    };

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { error } = await supabase.from('stocks').insert([
                {
                    symbol: symbol,
                    name: name,
                    type: selectedType.value,
                    quantity: parseFloat(quantity),
                    cost_basis: parseFloat(costBasis),
                    currency: currency,
                    data_source: dataSource,
                    data_url: dataUrl,
                },
            ]);

            if (error) throw error;

            setShowAddModal(false);
            setSymbol('');
            setName('');
            setQuantity('');
            setCostBasis('');
            setCurrency('USD');
            setDataSource('yahoo');
            setDataUrl('');
            setSelectedType(STOCK_TYPES[0]);
            fetchStocks();
        } catch (error) {
            console.error('Error adding stock:', error);
            alert('เกิดข้อผิดพลาดในการเพิ่มสินทรัพย์');
        }
    };

    const handleDeleteStock = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('ต้องการลบสินทรัพย์นี้?')) return;

        try {
            const { error } = await supabase.from('stocks').delete().eq('id', id);
            if (error) throw error;
            fetchStocks();
        } catch (error) {
            console.error('Error deleting stock:', error);
            alert('เกิดข้อผิดพลาดในการลบสินทรัพย์');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                        <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Stock&Fund</h1>
                        <p className="text-gray-400 text-sm">Stocks & Funds</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchStocks}
                        disabled={refreshing}
                        className="glass-button p-4"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowAddModal(!showAddModal)}
                        className={`px-8 py-4 rounded-2xl text-white font-bold flex items-center gap-3 transition-all ${showAddModal
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'gradient-primary'
                            }`}
                    >
                        {showAddModal ? <X className="w-5 h-5" strokeWidth={3} /> : <Plus className="w-5 h-5" strokeWidth={3} />}
                        <span>{showAddModal ? 'ปิด' : 'เพิ่ม'}</span>
                    </button>
                </div>
            </div>

            {/* Add Form - Top Section */}
            {showAddModal && (
                <div className="glass-card p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                        เพิ่มสินทรัพย์ใหม่
                    </h2>

                    <form onSubmit={editingId ? handleUpdateStock : handleAddStock} className="space-y-6">
                        {/* Stock Type Selection */}
                        <div>
                            <label className="block text-white text-sm font-bold mb-3">ประเภทสินทรัพย์</label>
                            <div className="grid grid-cols-2 gap-3">
                                {STOCK_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setSelectedType(type)}
                                        className={`glass-button p-4 transition-all ${selectedType.value === type.value
                                                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 shadow-lg'
                                                : 'hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-2 shadow-lg`}>
                                            {type.emoji}
                                        </div>
                                        <p className="text-white font-bold text-sm">{type.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Symbol */}
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">สัญลักษณ์</label>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    className="w-full glass-button px-4 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="AAPL, PTT"
                                    required
                                />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">ชื่อ</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full glass-button px-4 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="Apple Inc."
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Quantity */}
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">จำนวนหุ้น</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full glass-button px-4 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="0.000"
                                    required
                                />
                            </div>

                            {/* Cost Basis */}
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">ราคาที่ซื้อ</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={costBasis}
                                    onChange={(e) => setCostBasis(e.target.value)}
                                    className="w-full glass-button px-4 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Currency */}
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">สกุลเงิน</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full glass-button px-4 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                >
                                    <option value="THB">THB</option>
                                    <option value="USD">USD</option>
                                    <option value="CAD">CAD</option>
                                </select>
                            </div>

                            {/* Data Source */}
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">แหล่งข้อมูล</label>
                                <select
                                    value={dataSource}
                                    onChange={(e) => setDataSource(e.target.value)}
                                    className="w-full glass-button px-4 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                >
                                    <option value="yahoo">Yahoo Finance</option>
                                    <option value="scbam">SCBAM</option>
                                    <option value="fundsupermart">FundSuperMart</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full gradient-primary py-4 rounded-xl text-white font-bold hover:shadow-2xl transition-all"
                        >
                            {editingId ? 'อัพเดท' : 'เพิ่ม'} {selectedType.label}
                        </button>
                    </form>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : stocks.length === 0 ? (
                <div className="text-center py-20">
                    <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">ยังไม่มีสินทรัพย์</p>
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
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                        <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-xl">Stocks Portfolio</p>
                                        <p className="text-gray-400 text-sm">{stocks.length} สินทรัพย์</p>
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
                                    <p className="text-gray-400 text-sm mb-2">มูลค่าสินทรัพย์ทั้งหมด</p>
                                    <h2 className="text-4xl font-bold text-white mb-1">
                                        ฿{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h2>
                                </div>

                                <div className={`glass-button px-4 py-3 rounded-xl inline-flex items-center gap-2 ${(totalValue - totalCost) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    <div>
                                        <span className={`font-bold text-base ${(totalValue - totalCost) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(totalValue - totalCost) >= 0 ? '+' : ''}฿{Math.abs(totalValue - totalCost).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </span>
                                        <span className="text-gray-500 text-xs ml-2">
                                            ({((totalValue - totalCost) / totalCost * 100).toFixed(2)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Expanded Details */}
                        {expanded && (
                            <div className="border-t border-white/10 px-6 pb-6">
                                <div className="space-y-3 mt-6">
                                    {stocks.map((stock) => {
                                        const type = STOCK_TYPES.find(t => t.value === stock.type) || STOCK_TYPES[0];
                                        return (
                                            <div
                                                key={stock.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditStock(stock);
                                                }}
                                                className="glass-button p-5 hover:bg-white/10 cursor-pointer group relative"
                                            >
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => handleDeleteStock(stock.id, e)}
                                                    className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="ลบ"
                                                >
                                                    <X className="w-4 h-4 text-red-400" />
                                                </button>

                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                                                        {type.emoji}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-baseline gap-2">
                                                            <h3 className="text-white font-bold text-lg">{stock.symbol}</h3>
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-gray-400 text-sm truncate">{stock.name}</span>
                                                        </div>
                                                        <p className="text-gray-500 text-sm">{stock.quantity.toLocaleString()} หน่วย</p>
                                                        <p className="text-gray-500 text-sm">{type.label}</p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-white font-bold text-lg mb-1">
                                                            ฿{(stock.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        </p>
                                                        <div className={`glass-button px-3 py-1 rounded-lg inline-flex items-center gap-1 ${(stock.profit_loss || 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                            {(stock.profit_loss || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                            <span className={`text-sm font-bold ${(stock.profit_loss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {(stock.profit_loss || 0) >= 0 ? '+' : ''}{(stock.profit_loss_percent || 0).toFixed(2)}%
                                                            </span>
                                                        </div>
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
