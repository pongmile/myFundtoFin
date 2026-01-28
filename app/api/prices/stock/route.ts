import { NextRequest, NextResponse } from 'next/server';
import { getCachedPrice, setCachedPrice } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  try {
    // Check cache unless force refresh
    if (!forceRefresh) {
      const cached = await getCachedPrice('stock', symbol, 'THB');
      if (cached) {
        return NextResponse.json({ price: cached, source: 'cache' });
      }
    }

    // Fetch from Yahoo Finance
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      { next: { revalidate: 900 } } // 15 minutes
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Yahoo Finance');
    }

    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (!price) {
      throw new Error('Price not found in response');
    }

    // Cache the price
    await setCachedPrice('stock', symbol, price, 'USD', 'yahoo');

    return NextResponse.json({ 
      price, 
      currency: 'USD',
      source: 'yahoo' 
    });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    
    // Return cached price if available, even if expired
    const fallbackCache = await getCachedPrice('stock', symbol, 'USD');
    if (fallbackCache) {
      return NextResponse.json({ 
        price: fallbackCache, 
        source: 'cache_fallback',
        warning: 'Using cached data due to API error'
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch stock price' },
      { status: 500 }
    );
  }
}
