'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  Collapse,
  Avatar,
} from '@mui/material';
import {
  Add,
  Refresh,
  Close,
  TrendingUp,
  TrendingDown,
  CurrencyBitcoin,
  ExpandMore,
  ExpandLess,
  Delete,
} from '@mui/icons-material';
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
  { symbol: 'BTC', name: 'Bitcoin', emoji: '₿', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', emoji: 'Ξ', color: '#627EEA' },
  { symbol: 'BNB', name: 'Binance Coin', emoji: '🔸', color: '#F3BA2F' },
  { symbol: 'ADA', name: 'Cardano', emoji: '🎴', color: '#0033AD' },
  { symbol: 'KUB', name: 'Bitkub Coin', emoji: '🔷', color: '#00C853' },
  { symbol: 'CAKE', name: 'PancakeSwap', emoji: '🥞', color: '#D1884F' },
  { symbol: 'TWT', name: 'Trust Wallet Token', emoji: '💼', color: '#3375BB' },
  { symbol: 'APE', name: 'ApeCoin', emoji: '🦍', color: '#0052FF' },
  { symbol: 'BTZ', name: 'Bitazza Token', emoji: '⚡', color: '#7B1FA2' },
  { symbol: 'USDT', name: 'Tether', emoji: '💵', color: '#26A17B' },
];

export default function Cryptocurrency() {
  const [assets, setAssets] = useState<AssetWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
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

      // STEP 1: Load cached prices from price_cache for instant display
      const symbols = (data || []).map(a => a.symbol);
      const { data: cachedPrices } = await supabase
        .from('price_cache')
        .select('*')
        .eq('asset_type', 'crypto')
        .in('symbol', symbols);

      const priceMap = new Map(cachedPrices?.map(p => [p.symbol, p.price]) || []);

      const assetsWithCachedPrices = (data || []).map((asset) => {
        const cachedPrice = priceMap.get(asset.symbol) || 0;
        const currentValue = cachedPrice * asset.quantity;
        const profitLoss = currentValue - asset.cost_basis;
        const profitLossPercent = asset.cost_basis > 0 ? (profitLoss / asset.cost_basis) * 100 : 0;

        return {
          ...asset,
          currentPrice: cachedPrice,
          currentValue: currentValue || asset.cost_basis, // Fallback to cost_basis
          profitLoss: profitLoss,
          profitLossPercent: profitLossPercent,
          change24h: 0,
        };
      });

      setAssets(assetsWithCachedPrices);

      const total = assetsWithCachedPrices.reduce((sum, asset) => sum + asset.currentValue, 0);
      const cost = assetsWithCachedPrices.reduce((sum, asset) => sum + asset.cost_basis, 0);

      setTotalValue(total);
      setTotalCost(cost);
      setTotalChange24h(0);
      setLoading(false);
      setRefreshing(false);

      // STEP 2: Background update with real-time API (don't await, don't block)
      updatePricesInBackground(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updatePricesInBackground = async (assets: any[]) => {
    // Use batch API for better performance
    try {
      const symbols = assets.map(a => a.symbol).join(',');
      const response = await axios.get(`/api/prices/batch?symbols=${symbols}&type=crypto`);
      
      if (response.data.results) {
        // Update display with batch results
        response.data.results.forEach((result: any) => {
          const asset = assets.find(a => a.symbol === result.symbol);
          if (asset && result.price > 0) {
            const currentPrice = result.price;
            const currentValue = currentPrice * asset.quantity;
            const profitLoss = currentValue - asset.cost_basis;
            const profitLossPercent = asset.cost_basis > 0 ? (profitLoss / asset.cost_basis) * 100 : 0;

            setAssets(prev => prev.map(a => {
              if (a.symbol === asset.symbol) {
                return { ...a, currentPrice, currentValue, profitLoss, profitLossPercent, change24h: 0 };
              }
              return a;
            }));
          }
        });
      }
    } catch (error) {
      console.error('Batch update failed, falling back to individual updates:', error);
      
      // Fallback to individual updates
      for (const asset of assets) {
        try {
          const useBitkub = ['KUB', 'BTC', 'BNB', 'ETH', 'USDT', 'ADA'].includes(asset.symbol.toUpperCase());
          const apiUrl = useBitkub
            ? `/api/crypto/bitkub?symbol=${asset.symbol}`
            : `/api/crypto/price?symbol=${asset.symbol}`;

          const response = await axios.get(apiUrl);
          const currentPrice = response.data.priceThb || response.data.price || 0;
          const change24h = response.data.change24h || 0;

          // Update display
          setAssets(prev => prev.map(a => {
            if (a.symbol === asset.symbol) {
              const currentValue = currentPrice * a.quantity;
              const profitLoss = currentValue - a.cost_basis;
              const profitLossPercent = a.cost_basis > 0 ? (profitLoss / a.cost_basis) * 100 : 0;
              return { ...a, currentPrice, currentValue, profitLoss, profitLossPercent, change24h };
            }
            return a;
          }));
        } catch (err) {
          console.error(`Background update failed for ${asset.symbol}:`, err);
        }
      }
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleOpenDialog = () => {
    setEditingId(null);
    setQuantity('');
    setCostBasis('');
    setSelectedCrypto(POPULAR_CRYPTOS[0]);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setQuantity('');
    setCostBasis('');
    setSelectedCrypto(POPULAR_CRYPTOS[0]);
  };

  const handleEditAsset = (asset: AssetWithPrice) => {
    setEditingId(asset.id);
    const crypto = POPULAR_CRYPTOS.find((c) => c.symbol === asset.symbol) || POPULAR_CRYPTOS[0];
    setSelectedCrypto(crypto);
    setQuantity(asset.quantity.toString());
    setCostBasis(asset.cost_basis.toString());
    setShowDialog(true);
    setExpanded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
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
      } else {
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
      }

      handleCloseDialog();
      fetchAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteAsset = async (id: string) => {
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'warning.main' }}>
            <CurrencyBitcoin sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Crypto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cryptocurrency Assets
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={fetchAssets} disabled={refreshing} color="primary">
            <Refresh className={refreshing ? 'animate-spin' : ''} />
          </IconButton>
        </Stack>
      </Stack>

      {assets.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={8}>
              <CurrencyBitcoin sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ยังไม่มี Crypto
              </Typography>
              <Typography variant="body2" color="text.disabled">
                กดปุ่มเพิ่มเพื่อเริ่มต้น
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            {/* Summary Header */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              onClick={() => setExpanded(!expanded)}
              sx={{ cursor: 'pointer', mb: 2 }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <CurrencyBitcoin />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Crypto Portfolio
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assets.length} สินทรัพย์
                  </Typography>
                </Box>
              </Stack>
              <IconButton>{expanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
            </Stack>

            {/* Total Value */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                มูลค่าสินทรัพย์ทั้งหมด
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                ฿{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {/* Stats */}
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                icon={totalChange24h >= 0 ? <TrendingUp /> : <TrendingDown />}
                label={`${totalChange24h >= 0 ? '+' : ''}${totalChange24h.toFixed(2)}% 24h`}
                color={totalChange24h >= 0 ? 'success' : 'error'}
              />
              <Chip
                label={`${totalValue - totalCost >= 0 ? '+' : ''}฿${Math.abs(totalValue - totalCost).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${((totalValue - totalCost) / totalCost * 100).toFixed(2)}%)`}
                color={totalValue - totalCost >= 0 ? 'success' : 'error'}
              />
            </Stack>

            {/* Asset List */}
            <Collapse in={expanded}>
              <Stack spacing={2} mt={3}>
                {assets.map((asset) => {
                  const crypto = POPULAR_CRYPTOS.find((c) => c.symbol === asset.symbol) || POPULAR_CRYPTOS[0];
                  return (
                    <Card
                      key={asset.id}
                      variant="outlined"
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => handleEditAsset(asset)}
                    >
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: crypto.color, width: 48, height: 48, fontSize: 24 }}>
                              {crypto.emoji}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {asset.symbol}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {crypto.name}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box textAlign="right">
                              <Typography variant="h6" fontWeight="bold">
                                {asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ≈ {(asset.currentPrice * 31).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAsset(asset.id);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>

                        <Stack direction="row" spacing={2} flexWrap="wrap" mb={2}>
                          <Box flex="1 1 45%">
                            <Typography variant="caption" color="text.secondary">
                              จำนวนหุ้นคงเหลือ
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {asset.quantity.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                            </Typography>
                          </Box>
                          <Box flex="1 1 45%">
                            <Typography variant="caption" color="text.secondary">
                              ราคา และ % เปลี่ยน 1 วัน
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={asset.change24h >= 0 ? 'success.main' : 'error.main'}
                            >
                              {asset.change24h >= 0 ? '↗ ' : '↘ '}
                              {Math.abs(asset.change24h).toFixed(2)}%
                            </Typography>
                          </Box>
                          <Box flex="1 1 45%">
                            <Typography variant="caption" color="text.secondary">
                              ต้นทุนต่อหุ้น (THB)
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {(asset.cost_basis / asset.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                          <Box flex="1 1 45%">
                            <Typography variant="caption" color="text.secondary">
                              ต้นทุนรวม (THB)
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {asset.cost_basis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Stack>

                        <Box mt={2} display="flex" justifyContent="flex-end">
                          <Chip
                            icon={asset.profitLoss >= 0 ? <TrendingUp /> : <TrendingDown />}
                            label={`${asset.profitLoss >= 0 ? '↗ ' : '↘ '}${Math.abs(asset.profitLossPercent).toFixed(2)}% (${asset.profitLoss >= 0 ? '+' : ''}${asset.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB)`}
                            color={asset.profitLoss >= 0 ? 'success' : 'error'}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* FAB */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 24 }}
        onClick={handleOpenDialog}
      >
        <Add />
      </Fab>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{editingId ? 'แก้ไข' : 'เพิ่ม'} Crypto</Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3} mt={1}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  เลือก Cryptocurrency
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {POPULAR_CRYPTOS.map((crypto) => (
                    <Card
                      key={crypto.symbol}
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        border: selectedCrypto.symbol === crypto.symbol ? 2 : 1,
                        borderColor: selectedCrypto.symbol === crypto.symbol ? 'primary.main' : 'divider',
                        width: 80,
                        mb: 1,
                      }}
                      onClick={() => setSelectedCrypto(crypto)}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 1, '&:last-child': { pb: 1 } }}>
                        <Avatar sx={{ bgcolor: crypto.color, width: 40, height: 40, fontSize: 20, mx: 'auto', mb: 0.5 }}>
                          {crypto.emoji}
                        </Avatar>
                        <Typography variant="caption" fontWeight="bold">
                          {crypto.symbol}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>

              <TextField
                label="จำนวน"
                type="number"
                inputProps={{ step: '0.00000001' }}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="ต้นทุน (฿)"
                type="number"
                inputProps={{ step: '0.01' }}
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                required
                fullWidth
              />

              <Button type="submit" variant="contained" size="large" fullWidth>
                {editingId ? 'อัพเดท' : 'เพิ่ม'} {selectedCrypto.name}
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
