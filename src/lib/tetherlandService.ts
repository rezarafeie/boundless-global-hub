interface TetherlandResponse {
  data: {
    currencies: {
      USDT: {
        price: number;
      };
    };
  };
}

export class TetherlandService {
  private static readonly API_URL = 'https://api.tetherland.com/currencies';
  private static cache: { rate: number; timestamp: number } | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch the latest USDT to IRR exchange rate
   */
  static async getUSDTToIRRRate(): Promise<number> {
    // Check cache first
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.rate;
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TetherlandResponse = await response.json();
      const rate = data.data.currencies.USDT.price;

      if (!rate || typeof rate !== 'number') {
        throw new Error('Invalid rate received from API');
      }

      // Update cache
      this.cache = {
        rate,
        timestamp: Date.now(),
      };

      return rate;
    } catch (error) {
      console.error('Failed to fetch USDT to IRR rate:', error);
      
      // Return cached rate if available, otherwise throw
      if (this.cache) {
        console.warn('Using cached exchange rate due to API error');
        return this.cache.rate;
      }
      
      throw new Error('Failed to fetch exchange rate and no cached rate available');
    }
  }

  /**
   * Convert USD to IRR using the latest exchange rate
   */
  static async convertUSDToIRR(usdAmount: number): Promise<number> {
    const rate = await this.getUSDTToIRRRate();
    return usdAmount * rate;
  }

  /**
   * Format IRR amount with proper comma separation
   */
  static formatIRRAmount(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
  }

  /**
   * Format USD amount
   */
  static formatUSDAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}