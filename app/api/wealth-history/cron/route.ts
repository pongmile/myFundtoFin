/**
 * Cron Job Endpoint for Daily Wealth History Snapshot
 * 
 * This endpoint should be called daily (e.g., at midnight) by:
 * - Vercel Cron (if using Vercel)
 * - GitHub Actions
 * - External cron service (cron-job.org, etc.)
 * 
 * Security: Add CRON_SECRET to .env.local and verify it here
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getExchangeRate } from '@/lib/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  // Verify secret token
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if today's snapshot already exists
    const { data: existingData } = await supabase
      .from('wealth_history')
      .select('*')
      .eq('date', today)
      .single();

    if (existingData) {
      return NextResponse.json({
        success: true,
        message: `Snapshot for ${today} already exists`,
        data: existingData,
        skipped: true
      });
    }

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

    // Use cost_basis for crypto and stocks (current values in database)
    const cryptoTotal = cryptoData.data?.reduce((sum, item) => sum + parseFloat(item.cost_basis || 0), 0) || 0;
    const cryptoCostBasis = cryptoTotal;

    let stocksTotal = 0;
    let stocksCostBasis = 0;
    if (stocksData.data) {
      for (const stock of stocksData.data) {
        let cost = parseFloat(stock.cost_basis || 0);
        stocksCostBasis += cost;
        
        // Convert to THB if needed
        if (stock.currency !== 'THB') {
          const rate = await getExchangeRate(stock.currency, 'THB');
          cost *= rate;
        }
        stocksTotal += cost;
      }
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

    // Get yesterday's data
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

    // Insert today's snapshot
    const { data, error } = await supabase
      .from('wealth_history')
      .insert({
        date: today,
        total_wealth: totalWealth,
        cash: cashTotal,
        crypto: cryptoTotal,
        stocks: stocksTotal,
        liabilities: liabilitiesTotal,
        cash_diff: cashDiff,
        crypto_diff: cryptoDiff,
        stocks_diff: stocksDiff,
        crypto_cost_basis: cryptoCostBasis,
        stocks_cost_basis: stocksCostBasis,
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
      message: `Wealth history snapshot saved for ${today}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint to test the cron job manually
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Daily wealth history cron endpoint',
    usage: 'POST with Authorization: Bearer <CRON_SECRET>',
    timestamp: new Date().toISOString()
  });
}
