'use client';

import { useEffect, useState } from 'react';
import { Bitcoin, Plus, ChevronDown, ChevronUp, TrendingUp, TrendingDown, RefreshCw, X } from 'lucide-react';
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

interface AssetWithPrice extends CryptoAsset {
    currentPrice: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
    change24h: number;
}

const POPULAR_CRYPTOS = [
    { symbol: 'BTC', name: 'Bitcoin', emoji: '₿', color: 'from-orange-500 to-yellow-500' },
    { symbol: 'ETH', name: 'Ethereum', emoji: 'Ξ', color: 'from-blue-500 to-purple-500' },
    { symbol: 'BNB', name: 'Binance Coin', emoji: '🔸', color: 'from-yellow-500 to-orange-500' },
    { symbol: 'ADA', name: 'Cardano', emoji: '🎴', color: 'from-blue-600 to-indigo-600' },
    { symbol: 'KUB', name: 'Bitkub Coin', emoji: '🔷', color: 'from-green-500 to-teal-500' },
    { symbol: 'CAKE', name: 'PancakeSwap', emoji: '🥞', color: 'from-pink-500 to-purple-500' },
    { symbol: 'TWT', name: 'Trust Wallet Token', emoji: '💼', color: 'from-blue-400 to-cyan-400' },
    { symbol: 'APE', name: 'ApeCoin', emoji: '🦍', color: 'from-blue-600 to-indigo-600' },
    { symbol: 'BTZ', name: 'Bitazza Token', emoji: '⚡', color: 'from-purple-600 to-pink-600' },
    { symbol: 'USDT', name: 'Tether', emoji: '💵', color: 'from-green-600 to-emerald-600' },
];

export default function Cryptocurrency() {
    const [assets, setAssets] = useState<AssetWithPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [totalValue, setTotalValue] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [totalChange24h, setTotalChange24h] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [selectedCrypto, setSelectedCrypto] = useState(POPULAR_CRYPTOS[0]);
    const [quantity, setQuantity] = useState('');
    const [costBasis, setCostBasis] = useState('');

    const fetchAssets = async () => {
        try {
            setRefreshing(true);
            const { data, error } = await supabase
                .from('crypto')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const assetsWithPrices = await Promise.all(
                (data || []).map(async (asset) => {
                    try {
                        // Use Bitkub API for KUB, BTC, BNB, ETH
                        const useBitkub = ['KUB', 'BTC', 'BNB', 'ETH' ,'USDT'].includes(asset.symbol.toUpperCase());
                        const apiUrl = useBitkub
                            ? `/api/crypto/bitkub?symbol=${asset.symbol}`
                            : `/api/crypto/price?symbol=${asset.symbol}`;

                        const response = await axios.get(apiUrl);
                        const currentPrice = response.data.priceThb || (response.data.price) || 0;
                        const change24h = response.data.change24h || 0;
                        const currentValue = currentPrice * asset.quantity;
                        const profitLoss = currentValue - asset.cost_basis;
                        const profitLossPercent = asset.cost_basis > 0 ? (profitLoss / asset.cost_basis) * 100 : 0;

                        return {
                            ...asset,
                            currentPrice,
                            currentValue,
                            profitLoss,
                            profitLossPercent,
                            change24h,
                        };
                    } catch (err) {
                        console.error(`Error fetching price for ${asset.symbol}:`, err);
                        return {
                            ...asset,
                            currentPrice: 0,
                            currentValue: 0,
                            profitLoss: -asset.cost_basis,
                            profitLossPercent: -100,
                            change24h: 0,
                        };
                    }
                })
            );

            setAssets(assetsWithPrices);

            const total = assetsWithPrices.reduce((sum, asset) => sum + asset.currentValue, 0);
            const cost = assetsWithPrices.reduce((sum, asset) => sum + asset.cost_basis, 0);
            const weightedChange = assetsWithPrices.reduce((sum, asset) => {
                const weight = asset.currentValue / total;
                return sum + (asset.change24h * weight);
            }, 0);

            setTotalValue(total);
            setTotalCost(cost);
            setTotalChange24h(weightedChange);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { error } = await supabase.from('crypto').insert([
                {
                    symbol: selectedCrypto.symbol,
                    name: selectedCrypto.name,
                    quantity: parseFloat(quantity),
                    cost_basis: parseFloat(costBasis),
                    api_source: 'coingecko',
                },
            ]);

            if (error) throw error;

            setShowAddModal(false);
            setQuantity('');
            setCostBasis('');
            setSelectedCrypto(POPULAR_CRYPTOS[0]);
            fetchAssets();
        } catch (error) {
            console.error('Error adding asset:', error);
            alert('เกิดข้อผิดพลาดในการเพิ่มสินทรัพย์');
        }
    };

    const handleEditAsset = (asset: AssetWithPrice) => {
        setEditingId(asset.id);
        const crypto = POPULAR_CRYPTOS.find(c => c.symbol === asset.symbol) || POPULAR_CRYPTOS[0];
        setSelectedCrypto(crypto);
        setQuantity(asset.quantity.toString());
        setCostBasis(asset.cost_basis.toString());
        setShowAddModal(true);
        setExpanded(false);
    };

    const handleUpdateAsset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingId) return;

        try {
            const { error } = await supabase
                .from('crypto')
                .update({
                    symbol: selectedCrypto.symbol,
                    name: selectedCrypto.name,
                    quantity: parseFloat(quantity),
                    cost_basis: parseFloat(costBasis),
                })
                .eq('id', editingId);

            if (error) throw error;

            setShowAddModal(false);
            setEditingId(null);
            setQuantity('');
            setCostBasis('');
            setSelectedCrypto(POPULAR_CRYPTOS[0]);
            fetchAssets();
        } catch (error) {
            console.error('Error updating asset:', error);
            alert('เกิดข้อผิดพลาดในการอัพเดทสินทรัพย์');
        }
    };

    const handleDeleteAsset = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('ต้องการลบสินทรัพย์นี้?')) return;

        try {
            const { error } = await supabase.from('crypto').delete().eq('id', id);
            if (error) throw error;
            fetchAssets();
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('เกิดข้อผิดพลาดในการลบสินทรัพย์');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                        <Bitcoin className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Crypto</h1>
                        <p className="text-gray-400 text-sm">Cryptocurrency Assets</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchAssets}
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
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                        เพิ่ม Crypto ใหม่
                    </h2>

                    <form onSubmit={editingId ? handleUpdateAsset : handleAddAsset} className="space-y-6">
                        {/* Crypto Selection */}
                        <div>
                            <label className="block text-white text-sm font-bold mb-3">เลือก Cryptocurrency</label>
                            <div className="grid grid-cols-5 gap-3">
                                {POPULAR_CRYPTOS.map((crypto) => (
                                    <button
                                        key={crypto.symbol}
                                        type="button"
                                        onClick={() => setSelectedCrypto(crypto)}
                                        className={`glass-button p-4 transition-all ${selectedCrypto.symbol === crypto.symbol
                                                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 shadow-lg'
                                                : 'hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 bg-gradient-to-br ${crypto.color} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 shadow-lg`}>
                                            {crypto.emoji}
                                        </div>
                                        <p className="text-white text-xs font-bold">{crypto.symbol}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Quantity */}
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">จำนวน</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full glass-button px-4 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="0.00000000"
                                    required
                                />
                            </div>

                            {/* Cost Basis */}
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">ต้นทุน (฿)</label>
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full gradient-primary py-4 rounded-xl text-white font-bold hover:shadow-2xl transition-all"
                        >
                            {editingId ? 'อัพเดท' : 'เพิ่ม'} {selectedCrypto.name}
                        </button>
                    </form>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : assets.length === 0 ? (
                <div className="text-center py-20">
                    <Bitcoin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">ยังไม่มี Crypto</p>
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
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                        <Bitcoin className="w-6 h-6 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-xl">Crypto Portfolio</p>
                                        <p className="text-gray-400 text-sm">{assets.length} สินทรัพย์</p>
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

                                <div className="flex items-center gap-6 text-sm flex-wrap">
                                    <div className={`glass-button px-4 py-3 rounded-xl flex items-center gap-2 ${totalChange24h >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {totalChange24h >= 0 ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                                        <div>
                                            <span className={`font-bold text-base ${totalChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {totalChange24h >= 0 ? '+' : ''}{totalChange24h.toFixed(2)}%
                                            </span>
                                            <span className="text-gray-500 text-xs ml-2">24h</span>
                                        </div>
                                    </div>
                                    <div className={`glass-button px-4 py-3 rounded-xl flex items-center gap-2 ${(totalValue - totalCost) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
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
                            </div>
                        </button>

                        {/* Expanded Details */}
                        {expanded && (
                            <div className="border-t border-white/10 px-6 pb-6">
                                <div className="space-y-4 mt-6">
                                    {assets.map((asset) => {
                                        const crypto = POPULAR_CRYPTOS.find(c => c.symbol === asset.symbol) || POPULAR_CRYPTOS[0];
                                        return (
                                            <div
                                                key={asset.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditAsset(asset);
                                                }}
                                                className="glass-card p-6 hover:bg-white/5 cursor-pointer group transition-all relative"
                                            >
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => handleDeleteAsset(asset.id, e)}
                                                    className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="ลบ"
                                                >
                                                    <X className="w-4 h-4 text-red-400" />
                                                </button>

                                                {/* Header Row */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-14 h-14 bg-gradient-to-br ${crypto.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                                                            {crypto.emoji}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-white font-bold text-xl">{asset.symbol}</h3>
                                                            <p className="text-gray-400 text-sm">{crypto.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-white font-bold text-2xl mb-1">
                                                            {asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                        <p className="text-gray-500 text-sm">≈ {(asset.currentPrice * 31).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB</p>
                                                    </div>
                                                </div>

                                                {/* Stats Row */}
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-gray-500 text-xs mb-1">จำนวนหุ้นคงเหลือ</p>
                                                        <p className="text-white font-bold text-lg">{asset.quantity.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs mb-1">ราคา และ % เปลี่ยน 1 วัน</p>
                                                        <p className="text-white font-bold text-lg">{asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        <p className={`text-sm font-bold ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {asset.change24h >= 0 ? '↗ ' : '↘ '}{Math.abs(asset.change24h).toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Bottom Row */}
                                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                                    <div>
                                                        <p className="text-gray-500 text-xs mb-1">ต้นทุนต่อหุ้น (THB)</p>
                                                        <p className="text-white font-bold text-base">{(asset.cost_basis / asset.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs mb-1">ต้นทุนรวม (THB)</p>
                                                        <p className="text-white font-bold text-base">{asset.cost_basis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                </div>

                                                {/* Profit/Loss Badge */}
                                                <div className="mt-4 flex justify-end">
                                                    <div className={`px-4 py-2 rounded-xl inline-flex items-center gap-2 ${asset.profitLoss >= 0 ? 'bg-green-500/20' : 'bg-red-400/20'}`}>
                                                        {asset.profitLoss >= 0 ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                                                        <div>
                                                            <span className={`font-bold text-lg ${asset.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {asset.profitLoss >= 0 ? '↗ ' : '↘ '}{Math.abs(asset.profitLossPercent).toFixed(2)}%
                                                            </span>
                                                            <p className={`text-sm ${asset.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                ({asset.profitLoss >= 0 ? '+' : ''}{asset.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB)
                                                            </p>
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
