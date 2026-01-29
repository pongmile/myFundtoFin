import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getExchangeRate } from '@/lib/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // VERSION: v2-correct-usd-conversion
    console.log('[SAVE API] Running version: v2-correct-usd-conversion');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Fetch all current data
    const [cashData, cryptoData, stocksData, liabilitiesData] = await Promise.all([
      supabase.from('cash_accounts').select('*'),
      supabase.from('crypto').select('*'),
      supabase.from('stocks').select('*'),
      supabase.from('liabilities').select('*'),
    ]);

    // Calculate cash total with currency conversion
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

    // For crypto and stocks, use cost_basis (current stored value in THB)
    // This should match what's shown in Dashboard
    const cryptoTotal = cryptoData.data?.reduce((sum, item) => sum + parseFloat(item.cost_basis || 0), 0) || 0;
    const cryptoCostBasis = cryptoTotal;

    // Calculate stocks total with currency conversion
    let stocksTotal = 0;
    if (stocksData.data) {
      console.log('[SAVE API] Processing stocks:', JSON.stringify(stocksData.data.map(s => ({
        symbol: s.symbol,
        cost_basis: s.cost_basis,
        currency: s.currency
      }))));
      
      for (const stock of stocksData.data) {
        let value = parseFloat(stock.cost_basis || 0);
        console.log(`[SAVE API] ${stock.symbol}: cost_basis=${stock.cost_basis} ${stock.currency}`);
        
        // cost_basis is stored in the stock's currency
        // Convert to THB if needed
        if (stock.currency === 'USD') {
          const rate = await getExchangeRate('USD', 'THB');
          console.log(`[SAVE API] Converting USD to THB: ${value} * ${rate} = ${value * rate}`);
          value *= rate;
        }
        
        console.log(`[SAVE API] Adding ${value} THB to stocksTotal`);
        stocksTotal += value;
      }
      console.log(`[SAVE API] Final stocksTotal: ${stocksTotal}`);
    }

    // Calculate liabilities with currency conversion
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

    // Get yesterday's data for calculating diffs
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const { data: yesterdayData } = await supabase
      .from('wealth_history')
      .select('*')
      .eq('date', yesterdayDate)
      .single();

    // Calculate diffs
    const cashDiff = yesterdayData ? cashTotal - parseFloat(yesterdayData.cash || 0) : 0;
    const cryptoDiff = yesterdayData ? cryptoTotal - parseFloat(yesterdayData.crypto || 0) : 0;
    const stocksDiff = yesterdayData ? stocksTotal - parseFloat(yesterdayData.stocks || 0) : 0;

    // Save today's snapshot
    const { data, error } = await supabase
      .from('wealth_history')
      .upsert({
        date: today,
        total_wealth: totalWealth,
        cash: cashTotal,
        crypto: cryptoTotal,
        stocks: stocksTotal,
        liabilities: liabilitiesTotal,
        cash_diff: cashDiff,
        crypto_diff: cryptoDiff,
        stocks_diff: stocksDiff,
        crypto_cost_basis: cryptoTotal,
        stocks_cost_basis: stocksTotal
      }, {
        onConflict: 'date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving wealth history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Wealth history saved for ${today}`
    });

  } catch (error: any) {
    console.error('Error in save wealth history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check if today's snapshot exists
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('wealth_history')
      .select('*')
      .eq('date', today)
      .single();

    return NextResponse.json({
      exists: !!data,
      data: data || null,
      date: today
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
