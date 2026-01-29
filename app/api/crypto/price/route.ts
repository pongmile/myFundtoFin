import { NextResponse } from 'next/server';
import axios from 'axios';
import { getCachedPrice, setCachedPrice } from '@/lib/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Check cache first for faster response
    if (!forceRefresh) {
      const cached = await getCachedPrice('crypto', symbol, 'USD');
      if (cached) {
        // Return cached data immediately
        const cachedResponse = NextResponse.json({
          symbol,
          price: cached,
          source: 'cryptoprices_cache',
          cached: true
        });

        // Update cache in background without waiting
        updateCacheInBackground(symbol);

        return cachedResponse;
      }
    }
    // Try CoinGecko API (free, no API key required)
    const coinGeckoId = getCoinGeckoId(symbol);
    const response = await fetch(`https://cryptoprices.cc/${symbol}/`);
    // const response = await axios.get(
    //   `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=thb&include_24hr_change=true`,
    //   { timeout: 5000 }
    // );

    if (response.ok) {
      const priceUSD = parseFloat(await response.text());
      if (!isNaN(priceUSD)) {
        // Cache the price for future requests
        await setCachedPrice('crypto', symbol, priceUSD, 'USD', 'cryptoprices');
        
        return NextResponse.json({
          symbol,
          price: priceUSD,
          source: 'cryptoprices',
          cached: false
        });
      }
      
      
    }

    // Fallback: try to return cached price
    const fallbackCache = await getCachedPrice('crypto', symbol, 'USD');
    if (fallbackCache) {
      return NextResponse.json({
        symbol,
        price: fallbackCache,
        source: 'cryptoprices_cache_fallback',
        cached: true,
        warning: 'Using cached data due to API failure'
      });
    }
    
    return NextResponse.json({
      symbol,
      price: 0,
      change_24h: 0,
      source: 'fallback',
    });
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    
    // Try to return cached price as fallback
    const fallbackCache = await getCachedPrice('crypto', symbol, 'USD');
    if (fallbackCache) {
      return NextResponse.json({
        symbol,
        price: fallbackCache,
        source: 'cryptoprices_cache_fallback',
        cached: true,
        warning: 'Using cached data due to API error'
      });
    }
    
    // Return 0 instead of error
    return NextResponse.json({
      symbol,
      price: 0,
      change_24h: 0,
      source: 'error',
    });
  }
}

// Background function to update cache
async function updateCacheInBackground(symbol: string) {
  try {
    const response = await fetch(`https://cryptoprices.cc/${symbol}/`);
    if (response.ok) {
      const priceUSD = parseFloat(await response.text());
      if (!isNaN(priceUSD)) {
        await setCachedPrice('crypto', symbol, priceUSD, 'USD', 'cryptoprices');
      }
    }
  } catch (error) {
    console.error('Background cache update failed:', error);
  }
}

// Map common crypto symbols to CoinGecko IDs
function getCoinGeckoId(symbol: string): string {
  const mapping: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    BNB: 'binancecoin',
    XRP: 'ripple',
    ADA: 'cardano',
    SOL: 'solana',
    DOGE: 'dogecoin',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
    SHIB: 'shiba-inu',
    LTC: 'litecoin',
    LINK: 'chainlink',
    UNI: 'uniswap',
    ATOM: 'cosmos',
    XLM: 'stellar',
    NEAR: 'near',
    APT: 'aptos',
    ARB: 'arbitrum',
    OP: 'optimism',
  };

  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
}
