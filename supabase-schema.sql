-- Database Schema for Wealth Portfolio Tracker

-- Cash Accounts Table
CREATE TABLE IF NOT EXISTS cash_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL DEFAULT 'บัญชีหลัก',
  bank_name TEXT NOT NULL,
  bank_logo TEXT,
  amount DECIMAL(15, 4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Stocks/ETF/Funds Table
CREATE TABLE IF NOT EXISTS stocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'stock_thai', 'stock_foreign', 'etf', 'fund'
  quantity DECIMAL(15, 4) NOT NULL DEFAULT 0,
  cost_basis DECIMAL(15, 4) NOT NULL DEFAULT 0, -- Total cost in THB or USD
  currency TEXT NOT NULL DEFAULT 'THB',
  data_source TEXT, -- 'yahoo', 'scbam', 'fundsupermart', 'scb_robo', 'guru_portfolio', 'manual'
  data_url TEXT,
  xpath_selector TEXT,
  manual_price DECIMAL(15, 4), -- For manual price input (AI Port, Robo Advisor, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Cryptocurrency Table
CREATE TABLE IF NOT EXISTS crypto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(15, 8) NOT NULL DEFAULT 0,
  cost_basis DECIMAL(15, 4) NOT NULL DEFAULT 0, -- Total cost in THB
  api_source TEXT, -- 'bitkub', 'coinranking', 'cryptoprices'
  api_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Liabilities Table
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'credit_card', 'car_loan', 'mortgage', 'other'
  amount DECIMAL(15, 4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Wealth History Table
CREATE TABLE IF NOT EXISTS wealth_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_wealth DECIMAL(15, 4) NOT NULL DEFAULT 0,
  cash DECIMAL(15, 4) NOT NULL DEFAULT 0,
  crypto DECIMAL(15, 4) NOT NULL DEFAULT 0,
  stocks DECIMAL(15, 4) NOT NULL DEFAULT 0,
  liabilities DECIMAL(15, 4) NOT NULL DEFAULT 0,
  cash_diff DECIMAL(15, 4) DEFAULT 0,
  crypto_diff DECIMAL(15, 4) DEFAULT 0,
  stocks_diff DECIMAL(15, 4) DEFAULT 0,
  crypto_cost_basis DECIMAL(15, 4) DEFAULT 0,
  stocks_cost_basis DECIMAL(15, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Price Cache Table (for 15-minute caching)
CREATE TABLE IF NOT EXISTS price_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_type TEXT NOT NULL, -- 'stock', 'crypto', 'fund', 'exchange_rate', 'gold'
  symbol TEXT NOT NULL,
  price DECIMAL(15, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  source TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(asset_type, symbol, currency)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wealth_history_date ON wealth_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_price_cache_lookup ON price_cache(asset_type, symbol, cached_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_cash_accounts_updated_at BEFORE UPDATE ON cash_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_updated_at BEFORE UPDATE ON crypto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_liabilities_updated_at BEFORE UPDATE ON liabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
