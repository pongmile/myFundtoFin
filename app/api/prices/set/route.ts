import { NextRequest, NextResponse } from 'next/server';
import { getCachedPrice, setCachedPrice } from '@/lib/cache';
import * as cheerio from 'cheerio';

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
      const cached = await getCachedPrice('set_stock', symbol, 'THB');
      if (cached) {
        return NextResponse.json({ price: cached, source: 'cache' });
      }
    }

    // Fetch from SET website
    const url = `https://www.set.or.th/th/market/product/stock/quote/${symbol}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 } // 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from SET: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to find price in stock-info div
    let price = 0;
    
    // Method 1: Look for price in stock-info class
    $('.stock-info').each((_, element) => {
      const text = $(element).text().trim();
      // Look for numbers that look like stock prices (e.g., 123.45)
      const priceMatch = text.match(/(\d+\.?\d*)/);
      if (priceMatch && !price) {
        const parsedPrice = parseFloat(priceMatch[1]);
        if (parsedPrice > 0) {
          price = parsedPrice;
        }
      }
    });

    // Method 2: Try other common price selectors
    if (!price) {
      const selectors = [
        '.price',
        '.last-price',
        '[data-testid="last-price"]',
        '.stock-price',
        '.quote-price'
      ];

      for (const selector of selectors) {
        const element = $(selector).first();
        if (element.length) {
          const text = element.text().trim();
          const priceMatch = text.match(/(\d+\.?\d*)/);
          if (priceMatch) {
            const parsedPrice = parseFloat(priceMatch[1]);
            if (parsedPrice > 0) {
              price = parsedPrice;
              break;
            }
          }
        }
      }
    }

    if (!price || price === 0) {
      throw new Error('Price not found on SET page');
    }

    // Cache the price
    await setCachedPrice('set_stock', symbol, price, 'THB', 'set');

    return NextResponse.json({ 
      price, 
      currency: 'THB',
      source: 'set',
      symbol 
    });
  } catch (error) {
    console.error('SET API error:', error);
    
    // Return cached price if available, even if expired
    const cached = await getCachedPrice('set_stock', symbol, 'THB');
    if (cached) {
      return NextResponse.json({ 
        price: cached, 
        source: 'cache_fallback',
        warning: 'Using cached data due to API error' 
      });
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch stock price',
        message: error instanceof Error ? error.message : 'Unknown error',
        symbol 
      },
      { status: 500 }
    );
  }
}
