/**
 * Calculate real-time portfolio values
 * This function should match the calculations in Dashboard components
 */

import { createClient } from '@supabase/supabase-js';
import { getExchangeRate } from './cache';
import axios from 'axios';

interface PortfolioValues {
  cashTotal: number;
  cryptoTotal: number;
  stocksTotal: number;
  liabilitiesTotal: number;
  totalWealth: number;
  cryptoCostBasis: number;
  stocksCostBasis: number;
}

export async function calculatePortfolioValues(
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<PortfolioValues> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all data
  const [cashData, cryptoData, stocksData, liabilitiesData] = await Promise.all([
    supabase.from('cash_accounts').select('*'),
    supabase.from('crypto').select('*'),
    supabase.from('stocks').select('*'),
    supabase.from('liabilities').select('*'),
  ]);

  // Calculate Cash Total (with currency conversion)
  let cashTotal = 0;
  if (cashData.data) {
    for (const account of cashData.data) {
      let amount = parseFloat(account.amount || 0);
      if (account.currency !== 'THB') {
        const rate = await getExchangeRate(account.currency, 'THB');
        amount *= rate;
      }
      cashTotal += amount;
    }
  }

  // Calculate Crypto Total (with real-time prices)
  let cryptoTotal = 0;
  let cryptoCostBasis = 0;
  if (cryptoData.data) {
    for (const asset of cryptoData.data) {
      cryptoCostBasis += parseFloat(asset.cost_basis || 0);
      
      try {
        const useBitkub = ['KUB', 'BTC', 'BNB', 'ETH', 'USDT', 'ADA'].includes(
          asset.symbol.toUpperCase()
        );
        const apiUrl = useBitkub
          ? `/api/crypto/bitkub?symbol=${asset.symbol}`
          : `/api/crypto/price?symbol=${asset.symbol}`;

        const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await axios.get(`${baseURL}${apiUrl}`);
        const currentPrice = response.data.priceThb || response.data.price || 0;
        const currentValue = currentPrice * parseFloat(asset.quantity || 0);
        cryptoTotal += currentValue;
      } catch (error) {
        console.error(`Error fetching price for ${asset.symbol}:`, error);
        // Fallback to cost basis if price fetch fails
        cryptoTotal += parseFloat(asset.cost_basis || 0);
      }
    }
  }

  // Calculate Stocks Total (with real-time prices)
  let stocksTotal = 0;
  let stocksCostBasis = 0;
  if (stocksData.data) {
    for (const stock of stocksData.data) {
      stocksCostBasis += parseFloat(stock.cost_basis || 0);

      try {
        let price = 0;

        // Manual price (for AI Port, Robo Advisor, etc.)
        if (['scb_robo', 'guru_portfolio', 'manual'].includes(stock.data_source)) {
          price = parseFloat(stock.manual_price || 0);
        }
        // Gold API
        else if (stock.type === 'gold' || stock.data_source === 'gold_api') {
          const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const res = await axios.get(`${baseURL}/api/prices/gold`);
          const priceUSD = res.data.price || 0;
          const thbRate = await getExchangeRate('USD', 'THB');
          price = priceUSD * thbRate;
        }
        // Thai stocks (SET)
        else if (stock.type === 'stock_thai' && stock.data_source === 'yahoo') {
          const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const res = await axios.get(`${baseURL}/api/prices/set?symbol=${stock.symbol}`);
          price = res.data.price || 0;
        }
        // Foreign stocks (Yahoo Finance)
        else if (stock.data_source === 'yahoo') {
          const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const res = await axios.get(`${baseURL}/api/prices/stock?symbol=${stock.symbol}`);
          price = res.data.price || 0;
          
          if (stock.currency !== 'THB') {
            const rate = await getExchangeRate(stock.currency, 'THB');
            price *= rate;
          }
        }
        // Mutual funds
        else {
          const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const res = await axios.get(
            `${baseURL}/api/prices/fund?url=${encodeURIComponent(
              stock.data_url || ''
            )}&source=${stock.data_source}&code=${stock.symbol}`
          );
          price = res.data.price || 0;
        }

        const value = price * parseFloat(stock.quantity || 0);
        stocksTotal += value;
      } catch (error) {
        console.error(`Error fetching price for ${stock.symbol}:`, error);
        // Fallback to cost basis if price fetch fails
        let costInTHB = parseFloat(stock.cost_basis || 0);
        if (stock.currency !== 'THB') {
          const rate = await getExchangeRate(stock.currency, 'THB');
          costInTHB *= rate;
        }
        stocksTotal += costInTHB;
      }
    }
  }

  // Calculate Liabilities (with currency conversion)
  let liabilitiesTotal = 0;
  if (liabilitiesData.data) {
    for (const liability of liabilitiesData.data) {
      let amount = parseFloat(liability.amount || 0);
      if (liability.currency !== 'THB') {
        const rate = await getExchangeRate(liability.currency, 'THB');
        amount *= rate;
      }
      liabilitiesTotal += amount;
    }
  }

  const totalWealth = cashTotal + cryptoTotal + stocksTotal;

  return {
    cashTotal,
    cryptoTotal,
    stocksTotal,
    liabilitiesTotal,
    totalWealth,
    cryptoCostBasis,
    stocksCostBasis,
  };
}
