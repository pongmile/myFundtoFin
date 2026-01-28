import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Bitkub API endpoint
        const response = await fetch('https://api.bitkub.com/api/market/ticker', {
            next: { revalidate: 60 }, // Cache for 60 seconds
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from Bitkub API');
        }

        const data = await response.json();

        // Map symbols to Bitkub format
        const symbolMap: { [key: string]: string } = {
            'BTC': 'THB_BTC',
            'ETH': 'THB_ETH',
            'BNB': 'THB_BNB',
            'KUB': 'THB_KUB',
            'USDT': 'THB_USDT',
        };

        const bitkubSymbol = symbolMap[symbol.toUpperCase()];

        if (!bitkubSymbol || !data[bitkubSymbol]) {
            return NextResponse.json({
                error: 'Symbol not found on Bitkub',
                price: 0,
                change24h: 0
            }, { status: 404 });
        }

        const ticker = data[bitkubSymbol];

        // Convert THB to USD (approximate rate: 1 USD = 31 THB)
        const priceInUSD = ticker.last / 31;
        const change24h = ticker.percentChange || 0;

        return NextResponse.json({
            price: priceInUSD,
            priceThb: ticker.last,
            change24h: change24h,
            high24h: ticker.high,
            low24h: ticker.low,
            volume24h: ticker.baseVolume,
            source: 'bitkub'
        });

    } catch (error) {
        console.error('Bitkub API error:', error);
        return NextResponse.json({
            error: 'Failed to fetch price',
            price: 0,
            change24h: 0
        }, { status: 500 });
    }
}
