import { NextRequest, NextResponse } from 'next/server';
import { getCachedPrice, setCachedPrice } from '@/lib/cache';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    // Check cache unless force refresh
    if (!forceRefresh) {
      const cached = await getCachedPrice('gold', 'XAU', 'USD');
      if (cached) {
        return NextResponse.json({ price: cached, source: 'cache' });
      }
    }

    // Fetch from Business Insider
    const response = await fetch('https://markets.businessinsider.com/commodities/gold-price', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch gold price');

    const html = await response.text();
    const $ = cheerio.load(html);

    const priceText = $('.price-section__current-value').first().text().trim();
    const price = parseFloat(priceText.replace(/,/g, ''));

    if (isNaN(price)) {
      throw new Error('Invalid price format');
    }

    // Cache the price
    await setCachedPrice('gold', 'XAU', price, 'USD', 'businessinsider');

    return NextResponse.json({ 
      price, 
      currency: 'USD',
      source: 'businessinsider' 
    });
  } catch (error) {
    console.error('Gold price API error:', error);
    
    // Return cached price if available
    const fallbackCache = await getCachedPrice('gold', 'XAU', 'USD');
    if (fallbackCache) {
      return NextResponse.json({ 
        price: fallbackCache, 
        source: 'cache_fallback',
        warning: 'Using cached data due to API error'
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch gold price' },
      { status: 500 }
    );
  }
}
