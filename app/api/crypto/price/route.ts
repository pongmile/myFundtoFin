import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
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
        return NextResponse.json({
          symbol,
          price: priceUSD,
          source: 'cryptoprices',
        });
      }
      
      
    }

    // Fallback: return 0 if not found
    return NextResponse.json({
      symbol,
      price: 0,
      change_24h: 0,
      source: 'fallback',
    });
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    
    // Return 0 instead of error
    return NextResponse.json({
      symbol,
      price: 0,
      change_24h: 0,
      source: 'error',
    });
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
