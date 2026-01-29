import { NextResponse } from 'next/server';
import { getMultipleCachedPrices, refreshPricesInBackground } from '@/lib/batch-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const type = searchParams.get('type'); // 'crypto' or 'stock'
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!symbols || !type) {
    return NextResponse.json({ error: 'Symbols and type are required' }, { status: 400 });
  }

  try {
    const symbolArray = symbols.split(',').map(s => s.trim());
    const assets = symbolArray.map(symbol => ({
      type,
      symbol,
      currency: type === 'crypto' ? 'THB' : 'USD'
    }));

    // Get cached prices for all symbols at once
    const cachedPrices = await getMultipleCachedPrices(assets);
    
    const results = symbolArray.map(symbol => {
      const key = `${type}_${symbol}_${type === 'crypto' ? 'THB' : 'USD'}`;
      const cached = cachedPrices.get(key);
      
      if (cached && !forceRefresh) {
        return {
          symbol,
          price: cached.price,
          source: `${type}_cache`,
          cached: true,
          cached_at: cached.cached_at
        };
      }
      
      return {
        symbol,
        price: 0,
        source: 'not_cached',
        cached: false
      };
    });

    // Trigger background refresh for all symbols
    if (!forceRefresh) {
      refreshPricesInBackground(assets);
    }

    return NextResponse.json({
      type,
      results,
      cached: !forceRefresh,
      source: 'batch_cache'
    });

  } catch (error) {
    console.error('Batch price fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch prices' },
      { status: 500 }
    );
  }
}
