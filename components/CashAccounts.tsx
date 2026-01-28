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
  AttachMoney,
  TrendingUp,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { getExchangeRate } from '@/lib/cache';

interface CashAccount {
  id: string;
  account_name: string;
  bank_name: string;
  amount: number;
  currency: string;
  created_at?: string;
}

const THAI_BANKS = [
  { name: 'ธนาคารกรุงเทพ', icon: '🏦', color: '#1E3A8A' },
  { name: 'ธนาคารกสิกรไทย', icon: '🟢', color: '#16A34A' },
  { name: 'ธนาคารไทยพาณิชย์', icon: '🟣', color: '#9333EA' },
  { name: 'ธนาคารกรุงศรีอยุธยา', icon: '🔵', color: '#F97316' },
  { name: 'ธนาคารกรุงไทย', icon: '💙', color: '#0EA5E9' },
  { name: 'ธนาคารทหารไทยธนชาต', icon: '⚫', color: '#374151' },
  { name: 'ธนาคารออมสิน', icon: '🟠', color: '#EC4899' },
  { name: 'ธนาคารอาคารสงเคราะห์', icon: '🏠', color: '#EF4444' },
  { name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', icon: '🌾', color: '#65A30D' },
  { name: 'ธนาคารยูโอบี', icon: '🔷', color: '#1E3A8A' },
  { name: 'ธนาคารซิตี้แบงก์', icon: '🔷', color: '#0891B2' },
  { name: 'ธนาคารสแตนดาร์ดชาร์เตอร์ด', icon: '💚', color: '#0D9488' },
  { name: 'ธนาคารไอซีบีซี', icon: '🔴', color: '#DC2626' },
  { name: 'ธนาคารซูมิโตโม มิตซุย', icon: '🟢', color: '#059669' },
  { name: 'ธนาคารแห่งประเทศจีน', icon: '🔴', color: '#B91C1C' },
  { name: 'ธนาคารทิสโก้', icon: '🟡', color: '#D97706' },
  { name: 'ธนาคารแลนด์ แอนด์ เฮาส์', icon: '🏡', color: '#7C3AED' },
  { name: 'ธนาคารเกียรตินาคินภัทร', icon: '🟤', color: '#D97706' },
  { name: 'ธนาคารซีไอเอ็มบี ไทย', icon: '🔴', color: '#EF4444' },
  { name: 'Dime', icon: '💎', color: '#06B6D4' },
  { name: 'Kept', icon: '🔐', color: '#6366F1' },
  { name: 'อื่นๆ', icon: '📱', color: '#64748B' },
];

const CURRENCIES = ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'SGD', 'HKD'];

export default function CashAccounts() {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleOpenDialog = (account?: CashAccount) => {
    if (account) {
      setEditingId(account.id);
      setAccountName(account.account_name);
      setAmount(account.amount.toString());
      setCurrency(account.currency);
      const bank = THAI_BANKS.find(b => b.name === account.bank_name);
      setSelectedBank(bank || THAI_BANKS[0]);
    } else {
      setEditingId(null);
      setAccountName('');
      setAmount('');
      setCurrency('THB');
      setSelectedBank(THAI_BANKS[0]);
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
      const accountData = {
        account_name: accountName,
        bank_name: selectedBank.name,
        amount: parseFloat(amount),
        currency: currency,
      };

      if (editingId) {
        const { error } = await supabase
          .from('cash_accounts')
          .update(accountData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cash_accounts').insert([accountData]);
        if (error) throw error;
      }

      handleCloseDialog();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบบัญชีนี้?')) return;

    try {
      const { error } = await supabase.from('cash_accounts').delete().eq('id', id);
      if (error) throw error;
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  💵 เงินสดทั้งหมด
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(totalValue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {accounts.length} บัญชี
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64 }}>
                <AttachMoney sx={{ fontSize: 36 }} />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>

        {/* Accounts List */}
        {accounts.length > 0 ? (
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  📋 รายการบัญชี
                </Typography>
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Stack>

              <Stack spacing={2}>
                {accounts.slice(0, expanded ? accounts.length : 3).map((account, index) => {
                  const bank = THAI_BANKS.find(b => b.name === account.bank_name) || THAI_BANKS[THAI_BANKS.length - 1];
                  return (
                    <Card key={account.id} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: bank.color }}>
                            {bank.icon}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="body1" fontWeight="bold">
                              {account.account_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {bank.name}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="h6" fontWeight="bold">
                              {formatCurrency(account.amount)}
                            </Typography>
                            <Chip label={account.currency} size="small" variant="outlined" />
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <IconButton size="small" onClick={() => handleOpenDialog(account)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(account.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>

              {accounts.length > 3 && !expanded && (
                <Box textAlign="center" mt={2}>
                  <Button onClick={() => setExpanded(true)} endIcon={<ExpandMore />}>
                    แสดงทั้งหมด ({accounts.length} บัญชี)
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info">
            <Typography variant="body1" fontWeight="bold">
              ยังไม่มีบัญชีเงินสด
            </Typography>
            <Typography variant="body2">
              กดปุ่ม + ด้านล่างเพื่อเพิ่มบัญชีแรก
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
            {editingId ? '✏️ แก้ไขบัญชี' : '➕ เพิ่มบัญชีเงินสด'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} mt={1}>
              <TextField
                select
                label="ธนาคาร"
                value={selectedBank.name}
                onChange={(e) => {
                  const bank = THAI_BANKS.find(b => b.name === e.target.value);
                  if (bank) setSelectedBank(bank);
                }}
                fullWidth
              >
                {THAI_BANKS.map((bank) => (
                  <MenuItem key={bank.name} value={bank.name}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{bank.icon}</span>
                      <span>{bank.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="ชื่อบัญชี"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                fullWidth
                placeholder="เช่น บัญชีออมทรัพย์"
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="จำนวนเงิน"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  fullWidth
                  inputProps={{ step: '0.01', min: '0' }}
                />

                <TextField
                  select
                  label="สกุลเงิน"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  {CURRENCIES.map((curr) => (
                    <MenuItem key={curr} value={curr}>
                      {curr}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
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
