import { supabase } from './supabase';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export async function getCachedPrice(
  assetType: string,
  symbol: string,
  currency: string = 'THB'
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('price_cache')
      .select('price, cached_at')
      .eq('asset_type', assetType)
      .eq('symbol', symbol)
      .eq('currency', currency)
      .single();

    if (error || !data) return null;

    const cacheAge = Date.now() - new Date(data.cached_at).getTime();
    if (cacheAge < CACHE_DURATION) {
      return parseFloat(data.price as any);
    }

    return null;
  } catch {
    return null;
  }
}

export async function setCachedPrice(
  assetType: string,
  symbol: string,
  price: number,
  currency: string = 'THB',
  source: string = 'api'
): Promise<void> {
  try {
    await supabase
      .from('price_cache')
      .upsert({
        asset_type: assetType,
        symbol,
        price,
        currency,
        source,
        cached_at: new Date().toISOString(),
      }, {
        onConflict: 'asset_type,symbol,currency'
      });
  } catch (error) {
    console.error('Error caching price:', error);
  }
}

export async function getExchangeRate(
  from: string,
  to: string = 'THB'
): Promise<number> {
  if (from === to) return 1;

  // Try cache first
  const cached = await getCachedPrice('exchange_rate', `${from}${to}`, to);
  if (cached) return cached;

  try {
    // Try multiple sources for exchange rates
    // Source 1: Free exchange rate API
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates[to];
      if (rate) {
        await setCachedPrice('exchange_rate', `${from}${to}`, rate, to, 'exchangerate-api');
        return rate;
      }
    }

    // Fallback: rough estimate
    const fallbackRates: Record<string, number> = {
      'USDTHB': 35.5,
      'CADTHB': 26.0,
      'THBUSD': 0.028,
      'THBCAD': 0.038,
    };

    return fallbackRates[`${from}${to}`] || 1;
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return 1;
  }
}
