import { NextRequest, NextResponse } from 'next/server';
import { getCachedPrice, setCachedPrice } from '@/lib/cache';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const xpath = searchParams.get('xpath');
  const fundCode = searchParams.get('code');
  const source = searchParams.get('source') || 'scbam';
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!url && !fundCode) {
    return NextResponse.json({ error: 'URL or fund code required' }, { status: 400 });
  }

  const cacheKey = fundCode || url || '';

  try {
    // Check cache unless force refresh
    if (!forceRefresh) {
      const cached = await getCachedPrice('fund', cacheKey, 'THB');
      if (cached) {
        return NextResponse.json({ price: cached, source: 'cache' });
      }
    }

    let price: number | null = null;

    if (source === 'scbam' && url) {
      // Fetch SCBAM fund price
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch fund page');

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try multiple selectors for SCBAM based on XPath logic
    // Convert XPath to CSS selector approximation
    const selectors = [
      'div:nth-of-type(3) > div > div:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(2) > h4',
      '#tab-fillup1 > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(4) > h2',
    ];

    for (const selector of selectors) {
      try {
        const text = $(selector).text().trim();
        // Skip if value is "-" or empty
        if (text && text !== '-') {
        const parsed = parseFloat(text.replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
          price = parsed;
              break;
            }
          }
        } catch (err) {
          console.error(`Error parsing selector ${selector}:`, err);
        }
      }
    } else if (source === 'fundsupermart' && url) {
      // Fetch FundSuperMart price
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch fund page');

      const html = await response.text();
      const $ = cheerio.load(html);

      // Try to find the NAV price
      const navElement = $('table tbody tr:nth-child(2) td:nth-child(3) span').text();
      price = parseFloat(navElement.replace(/,/g, ''));
    }

    if (!price || isNaN(price)) {
      throw new Error('Price not found in response');
    }

    // Cache the price
    await setCachedPrice('fund', cacheKey, price, 'THB', source);

    return NextResponse.json({ 
      price, 
      currency: 'THB',
      source 
    });
  } catch (error) {
    console.error('Fund price API error:', error);
    
    // Return cached price if available, even if expired
    const fallbackCache = await getCachedPrice('fund', cacheKey, 'THB');
    if (fallbackCache) {
      return NextResponse.json({ 
        price: fallbackCache, 
        source: 'cache_fallback',
        warning: 'Using cached data due to API error'
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch fund price' },
      { status: 500 }
    );
  }
}
