export interface PriceData {
  price: number;
  symbol: string;
  currency: string;
  source: string;
  timestamp: string;
}

export interface ExchangeRates {
  USD: number;
  CAD: number;
  THB: number;
}

export interface StockData {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  cost_basis: number;
  currency: string;
  data_source: string;
  data_url?: string;
  xpath_selector?: string;
  current_price?: number;
  total_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
}

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  cost_basis: number;
  api_source: string;
  api_url?: string;
  current_price?: number;
  total_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
}

export interface CashAccount {
  id: string;
  account_name?: string;
  bank_name: string;
  bank_logo?: string;
  amount: number;
  currency: string;
  created_at?: string;
}

export interface Liability {
  id: string;
  name: string;
  type: string;
  amount: number;
  currency: string;
}

export interface WealthHistory {
  date: string;
  total_wealth: number;
  cash: number;
  crypto: number;
  stocks: number;
  liabilities: number;
  cash_diff: number;
  crypto_diff: number;
  stocks_diff: number;
  crypto_cost_basis: number;
  stocks_cost_basis: number;
}
