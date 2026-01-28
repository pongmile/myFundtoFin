'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Avatar,
  Collapse,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add,
  ExpandMore,
  ExpandLess,
  Delete,
  Edit,
  Refresh,
  TrendingUp,
  TrendingDown,
  ShowChart,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { getExchangeRate } from '@/lib/cache';
import axios from 'axios';

interface StockData {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  cost_basis: number;
  currency: string;
  data_source: string;
  data_url?: string;
  manual_price?: number;
  created_at?: string;
  current_price?: number;
  total_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
}

const STOCK_TYPES = [
  { value: 'stock_thai', label: 'หุ้นไทย', emoji: '🇹🇭', color: '#3B82F6' },
  { value: 'stock_foreign', label: 'หุ้นต่างประเทศ', emoji: '🌍', color: '#A855F7' },
  { value: 'fund_thai', label: 'กองทุนไทย', emoji: '📊', color: '#10B981' },
  { value: 'fund_foreign', label: 'กองทุนต่างประเทศ', emoji: '🌐', color: '#F59E0B' },
  { value: 'gold', label: 'ทองคำแท่ง (Gold Oz)', emoji: '🪙', color: '#F59E0B' },
];

const DATA_SOURCES = [
  { value: 'yahoo', label: 'Yahoo Finance' },
  { value: 'scbam', label: 'SCBAM' },
  { value: 'fundsupermart', label: 'FundSuperMart' },
  { value: 'gold_api', label: 'Gold Price API (Business Insider)' },
  { value: 'scb_robo', label: 'SCB Robo Advisor (AI Port)' },
  { value: 'guru_portfolio', label: 'Guru Portfolio (AI Port)' },
  { value: 'manual', label: 'กรอกราคาเอง (Manual)' },
];

const CURRENCIES = ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'SGD', 'HKD'];

export default function StocksAndFunds() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState(STOCK_TYPES[0]);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dataSource, setDataSource] = useState('yahoo');
  const [dataUrl, setDataUrl] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  const fetchPrice = async (stock: StockData): Promise<number> => {
    try {
      // Use manual price if available (for AI Port, Robo Advisor, Manual)
      if (['scb_robo', 'guru_portfolio', 'manual'].includes(stock.data_source)) {
        return stock.manual_price || 0;
      }
      
      // Use Gold API for gold commodities (USD per Troy Ounce)
      if (stock.type === 'gold' || stock.data_source === 'gold_api') {
        const res = await axios.get('/api/prices/gold');
        const priceUSD = res.data.price || 0; // USD per Troy Ounce
        const thbRate = await getExchangeRate('USD', 'THB');
        
        // Convert to THB per Troy Ounce
        const pricePerOz = priceUSD * thbRate;
        
        // If quantity is in grams, convert (1 Troy Ounce = 31.1035 grams)
        // For now, return price per Troy Ounce in THB
        return pricePerOz;
      }
      
      // Use SET API for Thai stocks
      if (stock.type === 'stock_thai' && stock.data_source === 'yahoo') {
        const res = await axios.get(`/api/prices/set?symbol=${stock.symbol}`);
        return res.data.price || 0; // Already in THB
      }
      
      // Use Yahoo Finance for foreign stocks
      if (stock.data_source === 'yahoo') {
        const res = await axios.get(`/api/prices/stock?symbol=${stock.symbol}`);
        let price = res.data.price || 0;

        if (stock.currency !== 'THB') {
          const rate = await getExchangeRate(stock.currency, 'THB');
          price *= rate;
        }

        return price;
      } else {
        // Use fund APIs for mutual funds
        const res = await axios.get(
          `/api/prices/fund?url=${encodeURIComponent(stock.data_url || '')}&source=${stock.data_source}&code=${stock.symbol}`
        );
        return res.data.price || 0;
      }
    } catch (error) {
      console.error(`Error fetching price for ${stock.symbol}:`, error);
      return 0;
    }
  };

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

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleOpenDialog = (stock?: StockData) => {
    if (stock) {
      setEditingId(stock.id);
      setSymbol(stock.symbol);
      setName(stock.name);
      setQuantity(stock.quantity.toString());
      setCostBasis(stock.cost_basis.toString());
      setCurrency(stock.currency);
      setDataSource(stock.data_source);
      setDataUrl(stock.data_url || '');
      setManualPrice(stock.manual_price ? stock.manual_price.toString() : '');
      const type = STOCK_TYPES.find(t => t.value === stock.type);
      setSelectedType(type || STOCK_TYPES[0]);
    } else {
      setEditingId(null);
      setSymbol('');
      setName('');
      setQuantity('');
      setCostBasis('');
      setCurrency('USD');
      setDataSource('yahoo');
      setDataUrl('');
      setManualPrice('');
      setSelectedType(STOCK_TYPES[0]);
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const stockData = {
        symbol: symbol.toUpperCase(),
        name,
        type: selectedType.value,
        quantity: parseFloat(quantity),
        cost_basis: parseFloat(costBasis),
        currency,
        data_source: dataSource,
        data_url: dataUrl || null,
        manual_price: ['scb_robo', 'guru_portfolio', 'manual'].includes(dataSource) && manualPrice 
          ? parseFloat(manualPrice) 
          : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('stocks')
          .update(stockData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('stocks').insert([stockData]);
        if (error) throw error;
      }

      handleCloseDialog();
      fetchStocks();
    } catch (error) {
      console.error('Error saving stock:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return;

    try {
      const { error } = await supabase.from('stocks').delete().eq('id', id);
      if (error) throw error;
      fetchStocks();
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        {/* Summary Card */}
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📈 หุ้น & กองทุนทั้งหมด
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(totalValue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stocks.length} รายการ
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 64, height: 64 }}>
                <ShowChart sx={{ fontSize: 36 }} />
              </Avatar>
            </Stack>

            {totalValue > 0 && (
              <Stack direction="row" spacing={2}>
                <Chip
                  icon={totalProfitLoss >= 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${totalProfitLoss >= 0 ? '+' : ''}${formatCurrency(totalProfitLoss)}`}
                  color={totalProfitLoss >= 0 ? 'success' : 'error'}
                />
                <Chip
                  label={`${totalProfitLossPercent >= 0 ? '+' : ''}${totalProfitLossPercent.toFixed(2)}%`}
                  color={totalProfitLossPercent >= 0 ? 'success' : 'error'}
                  variant="outlined"
                />
                <IconButton onClick={fetchStocks} disabled={refreshing} size="small">
                  <Refresh />
                </IconButton>
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Stocks List */}
        {stocks.length > 0 ? (
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  📋 รายการถือครอง
                </Typography>
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Stack>

              <Stack spacing={2}>
                {stocks.slice(0, expanded ? stocks.length : 3).map((stock) => {
                  const type = STOCK_TYPES.find(t => t.value === stock.type) || STOCK_TYPES[0];
                  const isProfit = (stock.profit_loss || 0) >= 0;

                  return (
                    <Card key={stock.id} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: type.color }}>
                            {type.emoji}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="body1" fontWeight="bold">
                              {stock.symbol}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {stock.name}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {stock.quantity} หน่วย × {formatCurrency(stock.current_price || 0)}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="h6" fontWeight="bold">
                              {formatCurrency(stock.total_value || 0)}
                            </Typography>
                            <Chip
                              size="small"
                              label={`${isProfit ? '+' : ''}${(stock.profit_loss_percent || 0).toFixed(2)}%`}
                              color={isProfit ? 'success' : 'error'}
                            />
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <IconButton size="small" onClick={() => handleOpenDialog(stock)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(stock.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>

              {stocks.length > 3 && !expanded && (
                <Box textAlign="center" mt={2}>
                  <Button onClick={() => setExpanded(true)} endIcon={<ExpandMore />}>
                    แสดงทั้งหมด ({stocks.length} รายการ)
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info">
            <Typography variant="body1" fontWeight="bold">
              ยังไม่มีหุ้นหรือกองทุน
            </Typography>
            <Typography variant="body2">
              กดปุ่ม + ด้านล่างเพื่อเพิ่มรายการแรก
            </Typography>
          </Alert>
        )}
      </Stack>

      {/* Add Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <Add />
      </Fab>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>
            {editingId ? '✏️ แก้ไขรายการ' : '➕ เพิ่มหุ้น/กองทุน'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} mt={1}>
              <TextField
                select
                label="ประเภท"
                value={selectedType.value}
                onChange={(e) => {
                  const type = STOCK_TYPES.find(t => t.value === e.target.value);
                  if (type) {
                    setSelectedType(type);
                    // Auto-set data source for gold
                    if (type.value === 'gold') {
                      setDataSource('gold_api');
                      setCurrency('USD');
                    }
                  }
                }}
                fullWidth
              >
                {STOCK_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{type.emoji}</span>
                      <span>{type.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label={selectedType.value === 'gold' ? 'ชื่อสินทรัพย์' : 'Symbol/รหัส'}
                value={symbol}
                onChange={(e) => setSymbol(selectedType.value === 'gold' ? e.target.value : e.target.value.toUpperCase())}
                required
                fullWidth
                placeholder={selectedType.value === 'gold' ? 'เช่น Gold Holdings, ทองแท่ง 1 Oz' : 'เช่น AAPL, KFMREF'}
              />

              <TextField
                label="ชื่อ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                placeholder="เช่น Apple Inc., กองทุนหุ้นไทย"
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label={selectedType.value === 'gold' ? 'จำนวน (Troy Oz)' : 'จำนวน'}
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  fullWidth
                  inputProps={{ step: selectedType.value === 'gold' ? '0.01' : '0.0001', min: '0' }}
                  helperText={selectedType.value === 'gold' ? '1 Troy Oz = 31.1035 กรัม' : ''}
                />

                <TextField
                  label="ต้นทุน (THB)"
                  type="number"
                  value={costBasis}
                  onChange={(e) => setCostBasis(e.target.value)}
                  required
                  fullWidth
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="สกุลเงิน"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  fullWidth
                  disabled={selectedType.value === 'gold'}
                  helperText={selectedType.value === 'gold' ? 'ทองคำใช้ USD/Oz อัตโนมัติ' : ''}
                >
                  {CURRENCIES.map((curr) => (
                    <MenuItem key={curr} value={curr}>
                      {curr}
                    </MenuItem>
                  ))}
                </TextField>

                {selectedType.value !== 'gold' && (
                  <TextField
                    select
                    label="แหล่งข้อมูล"
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value)}
                    fullWidth
                  >
                    {DATA_SOURCES.map((source) => (
                      <MenuItem key={source.value} value={source.value}>
                        {source.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                
                {selectedType.value === 'gold' && (
                  <TextField
                    label="แหล่งข้อมูล"
                    value="Gold API (Real-time)"
                    disabled
                    fullWidth
                    helperText="ราคาจาก Business Insider"
                  />
                )}
              </Stack>

              {dataSource !== 'yahoo' && !['scb_robo', 'guru_portfolio', 'manual'].includes(dataSource) && (
                <TextField
                  label="URL ข้อมูล"
                  value={dataUrl}
                  onChange={(e) => setDataUrl(e.target.value)}
                  fullWidth
                  placeholder="https://..."
                  helperText="URL สำหรับดึงราคากองทุน"
                />
              )}

              {['scb_robo', 'guru_portfolio', 'manual'].includes(dataSource) && (
                <TextField
                  label="ราคาปัจจุบัน (THB)"
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  required
                  fullWidth
                  inputProps={{ step: '0.01', min: '0' }}
                  helperText="กรอกราคาต่อหน่วยเป็น THB"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>฿</Typography>,
                  }}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>ยกเลิก</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
