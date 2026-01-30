import { NextResponse } from 'next/server';
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
            const cached = await getCachedPrice('crypto', symbol, 'THB');
            if (cached) {
                // Return cached data immediately
                const cachedResponse = NextResponse.json({
                    price: cached / 31, // Convert THB to USD
                    priceThb: cached,
                    source: 'bitkub_cache',
                    cached: true
                });

                // Update cache in background without waiting
                updateCacheInBackground(symbol);

                return cachedResponse;
            }
        }
        // Bitkub API endpoint v3
        const response = await fetch('https://api.bitkub.com/api/v3/market/ticker', {
            next: { revalidate: 60 }, // Cache for 60 seconds
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from Bitkub API');
        }

        const data = await response.json();

        // Map symbols to Bitkub v3 format (BNB_THB, BTC_THB, etc.)
        const symbolMap: { [key: string]: string } = {
            'BTC': 'BTC_THB',
            'ETH': 'ETH_THB',
            'BNB': 'BNB_THB',
            'KUB': 'KUB_THB',
            'USDT': 'USDT_THB',
            'ADA': 'ADA_THB',
        };

        const bitkubSymbol = symbolMap[symbol.toUpperCase()];

        // v3 API returns an array, find the matching symbol
        const ticker = data.find((item: any) => item.symbol === bitkubSymbol);

        if (!ticker) {
            return NextResponse.json({
                error: 'Symbol not found on Bitkub',
                price: 0,
                change24h: 0
            }, { status: 404 });
        }

        // Parse v3 API response (snake_case fields)
        const priceInUSD = parseFloat(ticker.last) / 31;
        const change24h = parseFloat(ticker.percent_change) || 0;

        // Cache the price for future requests
        await setCachedPrice('crypto', symbol, parseFloat(ticker.last), 'THB', 'bitkub');

        return NextResponse.json({
            price: priceInUSD,
            priceThb: parseFloat(ticker.last),
            change24h: change24h,
            high24h: parseFloat(ticker.high_24_hr),
            low24h: parseFloat(ticker.low_24_hr),
            volume24h: parseFloat(ticker.base_volume),
            source: 'bitkub',
            cached: false
        });

    } catch (error) {
        console.error('Bitkub API error:', error);
        
        // Try to return cached price as fallback
        const fallbackCache = await getCachedPrice('crypto', symbol, 'THB');
        if (fallbackCache) {
            return NextResponse.json({
                price: fallbackCache / 31,
                priceThb: fallbackCache,
                source: 'bitkub_cache_fallback',
                cached: true,
                warning: 'Using cached data due to API error'
            });
        }
        
        return NextResponse.json({
            error: 'Failed to fetch price',
            price: 0,
            change24h: 0
        }, { status: 500 });
    }
}

// Background function to update cache
async function updateCacheInBackground(symbol: string) {
    try {
        const response = await fetch('https://api.bitkub.com/api/v3/market/ticker');
        if (response.ok) {
            const data = await response.json();
            const symbolMap: { [key: string]: string } = {
                'BTC': 'BTC_THB',
                'ETH': 'ETH_THB',
                'BNB': 'BNB_THB',
                'KUB': 'KUB_THB',
                'USDT': 'USDT_THB',
                'ADA': 'ADA_THB',
            };
            
            const bitkubSymbol = symbolMap[symbol.toUpperCase()];
            const ticker = data.find((item: any) => item.symbol === bitkubSymbol);
            if (ticker) {
                await setCachedPrice('crypto', symbol, parseFloat(ticker.last), 'THB', 'bitkub');
            }
        }
    } catch (error) {
        console.error('Background cache update failed:', error);
    }
}
