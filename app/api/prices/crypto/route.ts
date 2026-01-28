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
      const cached = await getCachedPrice('crypto', symbol, 'THB');
      if (cached) {
        return NextResponse.json({ price: cached, source: 'cache' });
      }
    }

    let price: number | null = null;
    let source = '';

    // Try Bitkub API first
    if (['BTC', 'ETH', 'KUB', 'USDT', 'ADA', 'DOGE'].includes(symbol)) {
      try {
        const response = await fetch('https://api.bitkub.com/api/market/ticker');
        if (response.ok) {
          const data = await response.json();
          const bitkubSymbol = `THB_${symbol}`;
          if (data[bitkubSymbol]?.last) {
            price = parseFloat(data[bitkubSymbol].last);
            source = 'bitkub';
          }
        }
      } catch (error) {
        console.error('Bitkub API error:', error);
      }
    }

    // Fallback to CryptoPrices.cc
    if (!price) {
      try {
        const response = await fetch(`https://cryptoprices.cc/${symbol}/`);
        if (response.ok) {
          const priceUSD = parseFloat(await response.text());
          if (!isNaN(priceUSD)) {
            // Convert to THB (approximate rate)
            const usdthb = 35.5; // Should fetch real rate
            price = priceUSD * usdthb;
            source = 'cryptoprices';
          }
        }
      } catch (error) {
        console.error('CryptoPrices API error:', error);
      }
    }

    // Fallback to CoinGecko
    if (!price) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=thb`
        );
        if (response.ok) {
          const data = await response.json();
          const coinId = symbol.toLowerCase();
          if (data[coinId]?.thb) {
            price = data[coinId].thb;
            source = 'coingecko';
          }
        }
      } catch (error) {
        console.error('CoinGecko API error:', error);
      }
    }

    if (!price) {
      throw new Error('Price not found from any source');
    }

    // Cache the price
    await setCachedPrice('crypto', symbol, price, 'THB', source);

    return NextResponse.json({ 
      price, 
      currency: 'THB',
      source 
    });
  } catch (error) {
    console.error('Crypto price API error:', error);
    
    // Return cached price if available, even if expired
    const fallbackCache = await getCachedPrice('crypto', symbol, 'THB');
    if (fallbackCache) {
      return NextResponse.json({ 
        price: fallbackCache, 
        source: 'cache_fallback',
        warning: 'Using cached data due to API error'
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch crypto price' },
      { status: 500 }
    );
  }
}
