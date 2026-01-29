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
    // Check cache first for faster response
    if (!forceRefresh) {
      const cached = await getCachedPrice('stock', symbol, 'USD');
      if (cached) {
        // Return cached data immediately
        const cachedResponse = NextResponse.json({ 
          price: cached, 
          currency: 'USD',
          source: 'yahoo_cache',
          cached: true
        });

        // Update cache in background without waiting
        updateCacheInBackground(symbol);

        return cachedResponse;
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
      source: 'yahoo',
      cached: false
    });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    
    // Return cached price if available, even if expired
    const fallbackCache = await getCachedPrice('stock', symbol, 'USD');
    if (fallbackCache) {
      return NextResponse.json({ 
        price: fallbackCache, 
        currency: 'USD',
        source: 'yahoo_cache_fallback',
        cached: true,
        warning: 'Using cached data due to API error'
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch stock price' },
      { status: 500 }
    );
  }
}

// Background function to update cache
async function updateCacheInBackground(symbol: string) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      { next: { revalidate: 900 } } // 15 minutes
    );

    if (response.ok) {
      const data = await response.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      
      if (price) {
        await setCachedPrice('stock', symbol, price, 'USD', 'yahoo');
      }
    }
  } catch (error) {
    console.error('Background cache update failed:', error);
  }
}
