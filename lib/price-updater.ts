/**
 * Background Price Updater
 * Updates prices in the background without blocking UI
 * Uses localStorage cache for instant display
 */

interface CachedPrice {
  price: number;
  timestamp: number;
}

interface PriceCache {
  [symbol: string]: CachedPrice;
}

const CACHE_KEY = 'price_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class PriceUpdater {
  private static instance: PriceUpdater;
  private cache: PriceCache = {};
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;

  private constructor() {
    this.loadCache();
  }

  static getInstance(): PriceUpdater {
    if (!PriceUpdater.instance) {
      PriceUpdater.instance = new PriceUpdater();
    }
    return PriceUpdater.instance;
  }

  private loadCache() {
    if (typeof window === 'undefined') return;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error loading price cache:', error);
    }
  }

  private saveCache() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving price cache:', error);
    }
  }

  /**
   * Get cached price if available and not expired
   */
  getCachedPrice(symbol: string): number | null {
    const cached = this.cache[symbol];
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_DURATION) {
      return null; // Expired
    }

    return cached.price;
  }

  /**
   * Update price in cache
   */
  updatePrice(symbol: string, price: number) {
    this.cache[symbol] = {
      price,
      timestamp: Date.now(),
    };
    this.saveCache();
  }

  /**
   * Check if cache is fresh (less than 30 minutes old)
   */
  isCacheFresh(symbol: string): boolean {
    const cached = this.cache[symbol];
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    return age < CACHE_DURATION;
  }

  /**
   * Start background price updates
   */
  startBackgroundUpdates(
    symbols: Array<{ symbol: string; type: 'crypto' | 'stock' | 'fund'; config?: any }>,
    onUpdate?: (symbol: string, price: number) => void
  ) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update immediately if cache is old
    const needsUpdate = symbols.some(s => !this.isCacheFresh(s.symbol));
    if (needsUpdate && !this.isUpdating) {
      this.updatePrices(symbols, onUpdate);
    }

    // Then update every 30 minutes
    this.updateInterval = setInterval(() => {
      this.updatePrices(symbols, onUpdate);
    }, CACHE_DURATION);
  }

  /**
   * Stop background updates
   */
  stopBackgroundUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update all prices in parallel
   */
  private async updatePrices(
    symbols: Array<{ symbol: string; type: 'crypto' | 'stock' | 'fund'; config?: any }>,
    onUpdate?: (symbol: string, price: number) => void
  ) {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    console.log('🔄 Updating prices in background...');

    try {
      // Update in batches of 5 to avoid overwhelming the APIs
      const batchSize = 5;
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ({ symbol, type, config }) => {
            try {
              const price = await this.fetchPrice(symbol, type, config);
              this.updatePrice(symbol, price);
              
              if (onUpdate) {
                onUpdate(symbol, price);
              }
            } catch (error) {
              console.error(`Error updating price for ${symbol}:`, error);
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('✅ Price update complete');
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Fetch price from appropriate API
   */
  private async fetchPrice(
    symbol: string,
    type: 'crypto' | 'stock' | 'fund',
    config?: any
  ): Promise<number> {
    try {
      if (type === 'crypto') {
        const useBitkub = ['KUB', 'BTC', 'BNB', 'ETH', 'USDT', 'ADA'].includes(
          symbol.toUpperCase()
        );
        const apiUrl = useBitkub
          ? `/api/crypto/bitkub?symbol=${symbol}`
          : `/api/crypto/price?symbol=${symbol}`;

        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.priceThb || data.price || 0;
      } else if (type === 'stock') {
        // Handle different stock sources
        if (config?.type === 'stock_thai') {
          const response = await fetch(`/api/prices/set?symbol=${symbol}`);
          const data = await response.json();
          return data.price || 0;
        } else if (config?.dataSource === 'yahoo') {
          const response = await fetch(`/api/prices/stock?symbol=${symbol}`);
          const data = await response.json();
          return data.price || 0;
        }
      } else if (type === 'fund') {
        const response = await fetch(
          `/api/prices/fund?url=${encodeURIComponent(
            config?.url || ''
          )}&source=${config?.source}&code=${symbol}`
        );
        const data = await response.json();
        return data.price || 0;
      }

      return 0;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Force update all prices now
   */
  async forceUpdate(
    symbols: Array<{ symbol: string; type: 'crypto' | 'stock' | 'fund'; config?: any }>,
    onUpdate?: (symbol: string, price: number) => void
  ) {
    await this.updatePrices(symbols, onUpdate);
  }

  /**
   * Clear all cached prices
   */
  clearCache() {
    this.cache = {};
    this.saveCache();
  }
}

export const priceUpdater = PriceUpdater.getInstance();
