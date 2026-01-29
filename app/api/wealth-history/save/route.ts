import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Fetch all current data
    const [cashData, cryptoData, stocksData, liabilitiesData] = await Promise.all([
      supabase.from('cash_accounts').select('*'),
      supabase.from('crypto').select('*'),
      supabase.from('stocks').select('*'),
      supabase.from('liabilities').select('*'),
    ]);

    // Calculate totals (simplified - should include real-time prices)
    const cashTotal = cashData.data?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;
    const cryptoTotal = cryptoData.data?.reduce((sum, item) => sum + parseFloat(item.cost_basis || 0), 0) || 0;
    const stocksTotal = stocksData.data?.reduce((sum, item) => sum + parseFloat(item.cost_basis || 0), 0) || 0;
    const liabilitiesTotal = liabilitiesData.data?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;

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
        crypto_cost_basis: cryptoTotal, // Should use actual cost basis
        stocks_cost_basis: stocksTotal, // Should use actual cost basis
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
