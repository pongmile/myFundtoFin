import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCashAccounts() {
    console.log('🏦 Inserting cash accounts...');

    const cashAccounts = [
        // SCB accounts
        { account_name: 'ลงทุน', bank_name: 'ธนาคารไทยพาณิชย์', amount: 10000.00, currency: 'THB' },
        { account_name: 'ออม', bank_name: 'ธนาคารไทยพาณิชย์', amount: 1005000.00, currency: 'THB' },
        { account_name: 'เงินเดือน', bank_name: 'ธนาคารไทยพาณิชย์', amount: 10000.00, currency: 'THB' },

        // UOB
        { account_name: 'หลัก', bank_name: 'ธนาคารยูโอบี', amount: 22000.00, currency: 'THB' },

        // Kasikorn
        { account_name: 'หลัก', bank_name: 'ธนาคารกสิกรไทย', amount: 14000.00, currency: 'THB' },
        { account_name: 'คอนโด', bank_name: 'ธนาคารกสิกรไทย', amount: 1000.00, currency: 'THB' },

        // Dime
        { account_name: 'Dime', bank_name: 'ธนาคารเกียรตินาคิน', amount: 11000.00, currency: 'THB' },

        // TTB
        { account_name: 'หลัก', bank_name: 'ธนาคารทหารไทยธนชาต', amount: 107000.00, currency: 'THB' },

        // Krungsri
        { account_name: 'หลัก', bank_name: 'ธนาคารกรุงศรีอยุธยา', amount: 38500.00, currency: 'THB' },

        // GHB
        { account_name: 'หลัก', bank_name: 'ธนาคารอาคารสงเคราะห์', amount: 280.00, currency: 'THB' },

        // Kept
        { account_name: 'Kept กรุงศรี', bank_name: 'กรุงศรี', amount: 200.00, currency: 'THB' },

        // Foreign currency
        { account_name: 'dime', bank_name: 'Dime', amount: 1500, currency: 'USD' },
        { account_name: 'หลัก', bank_name: 'อื่นๆ', amount: 1462, currency: 'CAD' },
        { account_name: 'หลัก', bank_name: 'อื่นๆ', amount: 230, currency: 'GBP' },
        { account_name: 'scb', bank_name: 'ธนาคารไทยพาณิชย์', amount: 4000.00, currency: 'THB' },
    ];

    const { data, error } = await supabase
        .from('cash_accounts')
        .insert(cashAccounts)
        .select();

    if (error) {
        console.error('❌ Error inserting cash accounts:', error);
        return false;
    }

    console.log(`✅ Inserted ${data.length} cash accounts`);
    return true;
}

async function seedCrypto() {
    console.log('₿ Inserting crypto holdings...');

    const cryptoHoldings = [
        { symbol: 'KUB', name: 'Bitkub Coin (Bitkub)', quantity: 70, cost_basis: 1000, api_source: 'bitkub' },
        { symbol: 'BTC', name: 'Bitcoin (Muun wallet)', quantity: 0.0003716, cost_basis: 490.00, api_source: 'bitkub' },
        { symbol: 'CAKE', name: 'PancakeSwap (Trust wallet)', quantity: 46.81877, cost_basis: 10000, api_source: 'coingecko' },
        { symbol: 'TWT', name: 'Trust Wallet Token (Trust wallet)', quantity: 119.506659, cost_basis: 0.001, api_source: 'coingecko' },
        { symbol: 'BTC', name: 'Bitcoin (Upbit)', quantity: 0.00108376, cost_basis: 1618.07, api_source: 'bitkub' },
        { symbol: 'ADA', name: 'Cardano (Upbit)', quantity: 10, cost_basis: 0.01, api_source: 'coingecko' },
        { symbol: 'BTC', name: 'Bitcoin (Bitkub)', quantity: 0.0034387, cost_basis: 9350.16, api_source: 'bitkub' },
        { symbol: 'APE', name: 'ApeCoin (Bitazza)', quantity: 1.1471, cost_basis: 500.00, api_source: 'coingecko' },
        { symbol: 'BTZ', name: 'Bitazza Token (Bitazza)', quantity: 1083.68, cost_basis: 500.00, api_source: 'coingecko' },
        { symbol: 'USDT', name: 'Tether (Bitkub)', quantity: 102.16, cost_basis: 1800.00, api_source: 'bitkub' },
        { symbol: 'BTC', name: 'Bitcoin (Trust wallet)', quantity: 0.026518, cost_basis: 0.001, api_source: 'bitkub' },
        { symbol: 'BTC', name: 'Bitcoin (Ledger)', quantity: 0.1272208, cost_basis: 20500.00, api_source: 'bitkub' },
        { symbol: 'BTC', name: 'Bitcoin (Binance)', quantity: 0.00171082, cost_basis: 1560.247587, api_source: 'bitkub' },
        { symbol: 'BTC', name: 'Bitcoin (Wallet of Satoshi)', quantity: 0.0003, cost_basis: 0.001, api_source: 'bitkub' },
        { symbol: 'BNB', name: 'Binance Coin (Binance)', quantity: 6.10305203, cost_basis: 97701.75815, api_source: 'bitkub' },
        { symbol: 'ETH', name: 'Ethereum (Binance)', quantity: 0.2431966, cost_basis: 18138.03653, api_source: 'bitkub' },
    ];

    const { data, error } = await supabase
        .from('crypto')
        .insert(cryptoHoldings)
        .select();

    if (error) {
        console.error('❌ Error inserting crypto:', error);
        return false;
    }

    console.log(`✅ Inserted ${data.length} crypto holdings`);
    return true;
}

async function seedStocks() {
  console.log('📈 Inserting stocks and funds...');
  
  const stocks = [
    // กองทุนไทย - FundSuperMart
    { symbol: 'KGARMF', name: 'KGARMF (k-my-fund)', type: 'fund_thai', quantity: 492.4474, cost_basis: 8000.00, currency: 'THB', data_source: 'fundsupermart', data_url: 'https://www.fundsupermart.in.th/fund-info.aspx?fcode=006507' },
    { symbol: 'K-ICT', name: 'K-ICT (k-my-fund)', type: 'fund_thai', quantity: 64.8954, cost_basis: 500.00, currency: 'THB', data_source: 'fundsupermart', data_url: 'https://www.fundsupermart.in.th/fund-info.aspx?fcode=006868' },
    { symbol: 'K-ESGSI-ThaiESG', name: 'K-ESGSI-ThaiESG (k-my-fund)', type: 'fund_thai', quantity: 1108.0991, cost_basis: 12500.00, currency: 'THB', data_source: 'fundsupermart', data_url: 'https://www.fundsupermart.in.th/fund-info.aspx?fcode=0061183' },
    { symbol: 'KKP INRMF', name: 'KKP INRMF (innovestX)', type: 'fund_thai', quantity: 129.3109, cost_basis: 2000.00, currency: 'THB', data_source: 'fundsupermart', data_url: 'https://www.fundsupermart.in.th/fund-info.aspx?fcode=014064' },
    { symbol: 'UNI-SSF', name: 'UNI-SSF (Truemoney)', type: 'fund_thai', quantity: 518.7139, cost_basis: 9000.00, currency: 'THB', data_source: 'fundsupermart', data_url: 'https://www.fundsupermart.in.th/fund-info.aspx?fcode=008462' },
    
    // กองทุนต่างประเทศ - SCBAM
    { symbol: 'SCBS&P500SSF', name: 'SCBS&P500SSF (SCB)', type: 'fund_foreign', quantity: 1854.7559, cost_basis: 46084.11, currency: 'THB', data_source: 'scbam', data_url: 'https://www.scbam.com/th/fund/reduce-taxes/fund-information/scbs-p500-ssf' },
    { symbol: 'SCBWORLD(E)', name: 'SCBWORLD(E) (fund click)', type: 'fund_foreign', quantity: 85.0680, cost_basis: 1000.00, currency: 'THB', data_source: 'scbam', data_url: 'https://www.scbam.com/th/fund/foreign-investment-fund-equity/fund-information/scbworlde' },
    { symbol: 'SCBS&P500SSF-TM', name: 'SCBS&P500SSF (Truemoney)', type: 'fund_foreign', quantity: 195.0431, cost_basis: 6000.00, currency: 'THB', data_source: 'scbam', data_url: 'https://www.scbam.com/th/fund/reduce-taxes/fund-information/scbs-p500-ssf' },
    { symbol: 'SCBRMWORLD(A)', name: 'SCBRMWORLD(A) (Truemoney)', type: 'fund_foreign', quantity: 1058.5174, cost_basis: 15500.00, currency: 'THB', data_source: 'scbam', data_url: 'https://www.scbam.com/th/fund/tax-rmf/fund-information/scbrmworlda' },
    { symbol: 'SCBVIET(SSF)', name: 'SCBVIET(SSF) (Truemoney)', type: 'fund_foreign', quantity: 1108.7206, cost_basis: 7300.00, currency: 'THB', data_source: 'scbam', data_url: 'https://www.scbam.com/th/fund/interesting-fund/fund-information/scbvietssf' },
    
    // Robo Advisors (จัดเป็น fund_thai, quantity = 1 เพราะไม่มีจำนวนหุ้น)
    { symbol: 'SCB-ROBO', name: 'Robo advisor SCB (ai port)', type: 'fund_thai', quantity: 1, cost_basis: 87400.00, currency: 'THB', data_source: 'scbam', data_url: '' },
    { symbol: 'GURU-PORT', name: 'Guru Portfolio (ai port)', type: 'fund_thai', quantity: 1, cost_basis: 19000.00, currency: 'THB', data_source: 'scbam', data_url: '' },
    
    // หุ้นต่างประเทศ - Dime port (Yahoo Finance)
    { symbol: 'IVV', name: 'iShares Core S&P 500 ETF (Dime)', type: 'stock_foreign', quantity: 3.9486113, cost_basis: 3.9486113 * 581.8755 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'MSFT', name: 'Microsoft (Dime)', type: 'stock_foreign', quantity: 1.0744825, cost_basis: 1.0744825 * 448.0389 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'NVDA', name: 'NVIDIA (Dime)', type: 'stock_foreign', quantity: 1.8354771, cost_basis: 1.8354771 * 135.4907 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'INTC', name: 'Intel (Dime)', type: 'stock_foreign', quantity: 6.8744940, cost_basis: 6.8744940 * 22.6604 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'COST', name: 'Costco (Dime)', type: 'stock_foreign', quantity: 0.4346327, cost_basis: 0.4346327 * 949.7904 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'AAPL', name: 'Apple (Dime)', type: 'stock_foreign', quantity: 1.1523999, cost_basis: 1.1523999 * 227.0653 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'GE', name: 'General Electric (Dime)', type: 'stock_foreign', quantity: 0.8961315, cost_basis: 0.8961315 * 240.6230 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'CAAP', name: 'Corporacion America Airports (Dime)', type: 'stock_foreign', quantity: 12.2328207, cost_basis: 12.2328207 * 20.5531 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'KLAC', name: 'KLA Corporation (Dime)', type: 'stock_foreign', quantity: 0.1228446, cost_basis: 0.1228446 * 1015.8364 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'MMM', name: '3M Company (Dime)', type: 'stock_foreign', quantity: 0.2660069, cost_basis: 0.2660069 * 127.3321 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'GEV', name: 'GE Vernova (Dime)', type: 'stock_foreign', quantity: 0.1347384, cost_basis: 0.1347384 * 554.4829 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'IBIT', name: 'iShares Bitcoin Trust (Dime)', type: 'stock_foreign', quantity: 0.1802151, cost_basis: 0.1802151 * 23.2500 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    
    // หุ้นต่างประเทศ - webull port
    { symbol: 'NVDA', name: 'NVIDIA (webull)', type: 'stock_foreign', quantity: 0.34032, cost_basis: 0.34032 * 91.1800 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    { symbol: 'AAPL', name: 'Apple (webull)', type: 'stock_foreign', quantity: 0.25060, cost_basis: 0.25060 * 119.8300 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    
    // Gold
    { symbol: 'GOLD', name: 'Gold (Dime)', type: 'stock_foreign', quantity: 0.0310, cost_basis: 0.0310 * 3577.4700 * 31, currency: 'USD', data_source: 'yahoo', data_url: '' },
    
    // หุ้นไทย - Thai port
    { symbol: 'AOT', name: 'ท่าอากาศยานไทย (Thai port)', type: 'stock_thai', quantity: 100, cost_basis: 100 * 43.0700, currency: 'THB', data_source: 'yahoo', data_url: '' },
    { symbol: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา (Thai port)', type: 'stock_thai', quantity: 100, cost_basis: 100 * 23.9400, currency: 'THB', data_source: 'yahoo', data_url: '' },
    { symbol: 'TCAP', name: 'ธนาคารธนชาต (Thai port)', type: 'stock_thai', quantity: 300, cost_basis: 300 * 52.6700, currency: 'THB', data_source: 'yahoo', data_url: '' },
  ];

  const { data, error } = await supabase
    .from('stocks')
    .insert(stocks)
    .select();

  if (error) {
    console.error('❌ Error inserting stocks:', error);
    return false;
  }

  console.log(`✅ Inserted ${data.length} stocks and funds`);
  return true;
}

async function clearData() {
  console.log('🗑️  Clearing existing data...');
  
  const { error: cashError } = await supabase.from('cash_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: cryptoError } = await supabase.from('crypto').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: stocksError } = await supabase.from('stocks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (cashError) console.error('Error clearing cash:', cashError);
  if (cryptoError) console.error('Error clearing crypto:', cryptoError);
  if (stocksError) console.error('Error clearing stocks:', stocksError);
  
  console.log('✅ Data cleared');
}

async function main() {
  console.log('🚀 Starting data seed...\n');

  // Clear existing data
  await clearData();
  
  // Insert new data
  const cashSuccess = await seedCashAccounts();
  const cryptoSuccess = await seedCrypto();
  const stocksSuccess = await seedStocks();

  if (cashSuccess && cryptoSuccess && stocksSuccess) {
        console.log('\n✅ All data seeded successfully!');
        console.log('📊 Go to your app to see the data with real-time prices');
    } else {
        console.log('\n❌ Some errors occurred during seeding');
    }
}

main();
