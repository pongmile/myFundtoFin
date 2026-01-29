import { supabase } from './supabase';

export async function getMultipleCachedPrices(
  assets: Array<{ type: string; symbol: string; currency?: string }>
): Promise<Map<string, { price: number; source: string; cached_at: string }>> {
  try {
    const conditions = assets.map(asset => 
      `(asset_type = '${asset.type}' AND symbol = '${asset.symbol}' AND currency = '${asset.currency || 'THB'}')`
    ).join(' OR ');

    const { data, error } = await supabase
      .from('price_cache')
      .select('asset_type, symbol, price, currency, source, cached_at')
      .or(conditions);

    if (error || !data) return new Map();

    const result = new Map();
    data.forEach(item => {
      const key = `${item.asset_type}_${item.symbol}_${item.currency}`;
      result.set(key, {
        price: parseFloat(item.price as any),
        source: item.source,
        cached_at: item.cached_at
      });
    });

    return result;
  } catch (error) {
    console.error('Error fetching multiple cached prices:', error);
    return new Map();
  }
}

export async function setMultipleCachedPrices(
  prices: Array<{
    asset_type: string;
    symbol: string;
    price: number;
    currency?: string;
    source: string;
  }>
): Promise<void> {
  try {
    const records = prices.map(item => ({
      asset_type: item.asset_type,
      symbol: item.symbol,
      price: item.price,
      currency: item.currency || 'THB',
      source: item.source,
      cached_at: new Date().toISOString(),
    }));

    await supabase
      .from('price_cache')
      .upsert(records, {
        onConflict: 'asset_type,symbol,currency'
      });
  } catch (error) {
    console.error('Error setting multiple cached prices:', error);
  }
}

export async function refreshPricesInBackground(
  assets: Array<{ type: string; symbol: string; currency?: string }>
): Promise<void> {
  // Fire and forget - don't await this
  Promise.all(
    assets.map(async (asset) => {
      try {
        let url = '';
        let priceKey = '';
        
        if (asset.type === 'crypto') {
          // Try bitkub first for THB, then cryptoprices for USD
          if (asset.currency === 'THB') {
            url = `/api/crypto/bitkub?symbol=${asset.symbol}`;
          } else {
            url = `/api/crypto/price?symbol=${asset.symbol}`;
          }
        } else if (asset.type === 'stock') {
          url = `/api/prices/stock?symbol=${asset.symbol}`;
        }

        if (url) {
          await fetch(url, { cache: 'no-store' });
        }
      } catch (error) {
        console.error(`Background refresh failed for ${asset.symbol}:`, error);
      }
    })
  ).catch(error => {
    console.error('Background refresh batch error:', error);
  });
}
