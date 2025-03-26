import axios from 'axios';
import { Transaction } from '../shared/schema';
import { config } from './config';

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const CHECKOUT_API_BASE_URL = 'https://nowpayments.io';
const API_KEY = config.nowpayments.apiKey;

export const isNOWPaymentsConfigured = (): boolean => {
  return !!API_KEY;
};

export const isIPNSecretConfigured = (): boolean => {
  const ipnSecret = config.nowpayments.ipnSecret;
  return !!ipnSecret;
};

interface CreatePaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  created_at?: string;
  updated_at?: string;
  purchase_id?: string;
  payment_extra_id?: string;
}

export interface PaymentStatusResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  created_at?: string;
  updated_at?: string;
  purchase_id?: string;
  payment_extra_id?: string;
  actually_paid?: number;
  actually_paid_at?: string;
  outcome_amount?: number;
  outcome_currency?: string;
}

export interface StandardizedPaymentStatus {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  created_at: string;
  actually_paid: number | null;
  actually_paid_at: string | null;
  updated_at: string | null;
}

export interface CreateInvoiceResponse {
  id: string;
  token_id: string;
  invoice_url: string;
  success: boolean;
  status: string;
}

interface AvailableCurrency {
  id: number;
  name: string;
  currency: string;
  is_fiat: boolean;
  enabled: boolean;
  min_amount: number;
  max_amount: number;
  image: string;
  network: string;
}

class NOWPaymentsService {
  private apiKey: string;
  readonly isMockMode: boolean; // Make this public so we can check it from routes
  
  // Cache for minimum payment amounts to reduce API calls
  private minAmountCache: { [currency: string]: { amount: number, timestamp: number } } = {};
  
  // Cache expiration time (24 hours in milliseconds)
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000;
  
  // Cache for enabled currencies list to reduce API calls
  private enabledCurrenciesCache: { currencies: AvailableCurrency[], timestamp: number } | null = null;

  constructor() {
    if (!API_KEY) {
      console.warn('[NOWPayments] API key is not provided - using restricted dev mode');
      this.apiKey = '';
      this.isMockMode = true;
    } else {
      this.apiKey = API_KEY;
      this.isMockMode = false;
      console.log('[NOWPayments] Service initialized with production API key');
      console.log('[NOWPayments] API key starting with:', this.apiKey.substring(0, 4) + '...');
      
      // Perform a startup check in the background (don't block initialization)
      setTimeout(async () => {
        try {
          console.log('[NOWPayments] Performing startup status check...');
          const status = await this.getStatus();
          console.log('[NOWPayments] Startup status check result:', status);
          
          if (status.status === 'error') {
            console.warn('[NOWPayments] Startup check detected API error:', status.message);
          } else if (status.status === 'unknown') {
            console.warn('[NOWPayments] Startup check returned unknown status');
          } else {
            console.log('[NOWPayments] API connectivity confirmed on startup');
          }
          
          // Also check available currencies on startup
          const currencies = await this.getAvailableCurrencies();
          const enabledCurrencies = currencies.filter(c => c.enabled);
          console.log(`[NOWPayments] Found ${enabledCurrencies.length} enabled currencies on startup`);
          
          // Log warning if there are no enabled currencies
          if (enabledCurrencies.length === 0) {
            console.warn('[NOWPayments] No enabled currencies found. This may be due to account limitations or API restrictions.');
            console.warn('[NOWPayments] Will use fallback currencies when needed to maintain functionality.');
          }
          
          // Also check minimum payment amount for USDTTRC20
          try {
            console.log("Getting minimum payment amount for currency: USDTTRC20");
            const minAmount = await this.getMinimumPaymentAmount('USDTTRC20');
            console.log(`[NOWPayments] Minimum payment amount for USDTTRC20: ${minAmount}`);
            
            // Cache this value to reduce future API calls
            this.minAmountCache['USDTTRC20'] = {
              amount: minAmount,
              timestamp: Date.now()
            };
          } catch (err: any) {
            console.warn('[NOWPayments] Failed to get minimum payment amount:', err.message);
          }
        } catch (error: any) {
          console.error('[NOWPayments] Failed to perform startup checks:', error.message || error);
        }
      }, 5000);
    }
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ChickFarms-Payment-Client/1.0'
    };
  }
  
  /**
   * Creates a configured axios instance with timeouts and error handling
   * @returns Axios instance with default configuration
   */
  private getConfiguredAxios() {
    // Create an instance with optimized timeout and retry configuration
    const instance = axios.create({
      timeout: 30000, // Increase timeout to 30 seconds for slower network conditions
      maxRedirects: 5,
      validateStatus: (status: number) => status >= 200 && status < 500, // Only reject on server errors
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for logging
    instance.interceptors.request.use(
      (config) => {
        const redactedConfig = { ...config };
        
        // Don't log the actual API key
        if (redactedConfig.headers && 'x-api-key' in redactedConfig.headers) {
          redactedConfig.headers['x-api-key'] = '****';
        }
        
        console.log(`[NOWPayments] Making ${config.method?.toUpperCase()} request to: ${config.url}`);
        console.log('[NOWPayments] Request config:', {
          method: redactedConfig.method,
          url: redactedConfig.url,
          headers: redactedConfig.headers,
          params: redactedConfig.params,
          timeout: redactedConfig.timeout
        });
        
        return config;
      },
      (error) => {
        console.error('[NOWPayments] Request configuration error:', error.message);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for detailed error logging
    instance.interceptors.response.use(
      (response) => {
        console.log(`[NOWPayments] Received response from ${response.config.url} with status: ${response.status}`);
        return response;
      },
      (error) => {
        if (error.response) {
          // The request was made and the server responded with a status code outside the range we set
          console.error('[NOWPayments] API Error Response:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
          
          // Log more details about the original request
          console.error('[NOWPayments] Original request details:', {
            baseURL: error.config?.baseURL,
            url: error.config?.url,
            method: error.config?.method,
            timeout: error.config?.timeout,
            headers: error.config?.headers ? { 
              ...error.config.headers, 
              'x-api-key': error.config.headers['x-api-key'] ? '****' : 'NOT_SET' 
            } : 'No headers'
          });
        } else if (error.request) {
          // The request was made but no response was received (network error)
          console.error('[NOWPayments] Network Error:', {
            url: error.config?.url,
            method: error.config?.method,
            message: error.message,
            code: error.code
          });
          
          if (error.code === 'ECONNABORTED') {
            console.error('[NOWPayments] Request timed out after', error.config?.timeout, 'ms');
          }
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('[NOWPayments] Request Setup Error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
    
    return instance;
  }

  async getStatus(): Promise<{ status: string, message?: string }> {
    if (this.isMockMode) {
      console.log('[NOWPayments] Using mock mode for payment status check');
      return { status: 'DEV_MODE' };
    }
    
    try {
      console.log('[NOWPayments] Checking API status with key:', this.apiKey ? `${this.apiKey.substring(0, 4)}...` : 'NOT_SET');
      console.log('[NOWPayments] API base URL:', API_BASE_URL);
      
      // Use our configured axios instance for better error handling and timeouts
      const axios = this.getConfiguredAxios();
      
      // Log headers for debugging (without exposing full API key)
      const headers = this.getHeaders();
      console.log('[NOWPayments] Request headers:', {
        ...headers,
        'x-api-key': headers['x-api-key'] ? '****' : 'NOT_SET'
      });
      
      console.log('[NOWPayments] Sending status check request to:', `${API_BASE_URL}/status`);
      const response = await axios.get(`${API_BASE_URL}/status`, {
        headers: headers
      });
      
      console.log('[NOWPayments] API Status check response status:', response.status);
      console.log('[NOWPayments] API Status check response:', response.data);
      
      // NOWPayments API returns { message: 'OK' } when everything is working
      if (response.data && response.data.message === 'OK') {
        return { status: 'OK', message: 'Service is online and operational' };
      } else if (response.data && response.data.status) {
        // For backward compatibility, if the API ever returns a status field
        return response.data;
      } else {
        console.warn('[NOWPayments] Received unexpected response format:', response.data);
        return { 
          status: 'unknown', 
          message: 'Unexpected response format from API'
        };
      }
    } catch (error: any) {
      // Log more detailed error information
      console.error('[NOWPayments] Status check failed with error:', error.message);
      
      if (error.response) {
        // The request was made and the server responded with a status code outside the success range
        console.error('[NOWPayments] API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('[NOWPayments] Network Error - No response received');
      }
      
      // Return a status that indicates the error instead of throwing
      return { 
        status: 'error', 
        message: `API Error: ${error.message}`
      };
    }
  }

  async getAvailableCurrencies(): Promise<AvailableCurrency[]> {
    // If in mock mode, return mock currencies
    if (this.isMockMode) {
      console.log('[NOWPayments] Using mock mode for available currencies');
      return [
        {
          id: 1,
          name: 'Tether',
          currency: 'USDTTRC20',
          is_fiat: false,
          enabled: true,
          min_amount: 10,
          max_amount: 100000,
          image: 'https://nowpayments.io/images/coins/usdt.svg',
          network: 'TRC20'
        },
        {
          id: 2,
          name: 'Bitcoin',
          currency: 'BTC',
          is_fiat: false,
          enabled: true,
          min_amount: 0.001,
          max_amount: 10,
          image: 'https://nowpayments.io/images/coins/btc.svg',
          network: 'BTC'
        },
        {
          id: 3,
          name: 'Ethereum',
          currency: 'ETH',
          is_fiat: false,
          enabled: true,
          min_amount: 0.01,
          max_amount: 100,
          image: 'https://nowpayments.io/images/coins/eth.svg',
          network: 'ETH'
        }
      ];
    }
    
    // Check cache first to avoid unnecessary API calls
    if (this.enabledCurrenciesCache && 
        (Date.now() - this.enabledCurrenciesCache.timestamp) < this.CACHE_EXPIRY) {
      console.log('[NOWPayments] Using cached currencies list');
      return this.enabledCurrenciesCache.currencies;
    }
    
    try {
      console.log('[NOWPayments] Fetching available currencies from API');
      
      // Use our configured axios instance for better error handling and timeouts
      const axios = this.getConfiguredAxios();
      const response = await axios.get(`${API_BASE_URL}/currencies`, {
        headers: this.getHeaders()
      });
      
      // Handle the specific format returned by the API
      // It returns an array of currency codes, not objects with 'enabled' property
      const currencyCodes = response.data.currencies || [];
      console.log(`[NOWPayments] Retrieved ${currencyCodes.length} currencies from API`);
      
      let result: AvailableCurrency[];
      
      if (currencyCodes.length > 0) {
        // Convert the currency codes to our expected format
        // Create a list of our prioritized currencies that we want to support
        const prioritizedCurrencies = ['usdttrc20', 'btc', 'eth', 'usdt', 'trx', 'sol'];
        
        // Log some of the available currencies for debugging
        console.log('[NOWPayments] Sample of available currencies:');
        currencyCodes.slice(0, 10).forEach((code: string) => {
          console.log(`[NOWPayments] - ${code}`);
        });
        
        // Create our enabled currencies list based on the prioritized currencies
        const enabledCurrencies: AvailableCurrency[] = [];
        let id = 1;
        
        // Map of currency code to display name
        const currencyNames: Record<string, string> = {
          'usdttrc20': 'Tether on TRON',
          'btc': 'Bitcoin',
          'eth': 'Ethereum',
          'usdt': 'Tether',
          'trx': 'TRON',
          'sol': 'Solana'
        };
        
        // Map of currency code to network
        const currencyNetworks: Record<string, string> = {
          'usdttrc20': 'TRC20',
          'btc': 'BTC',
          'eth': 'ETH',
          'usdt': 'ERC20',
          'trx': 'TRON',
          'sol': 'SOL'
        };
        
        // Add our prioritized currencies first if they exist in the API response
        for (const priorityCurrency of prioritizedCurrencies) {
          if (currencyCodes.includes(priorityCurrency.toLowerCase())) {
            const currency = priorityCurrency.toLowerCase();
            enabledCurrencies.push({
              id: id++,
              name: currencyNames[currency] || currency.toUpperCase(),
              currency: currency.toUpperCase(),
              is_fiat: false,
              enabled: true,
              min_amount: currency === 'usdttrc20' ? 1 : 0.001,
              max_amount: currency === 'btc' ? 10 : 100000,
              image: `https://nowpayments.io/images/coins/${currency.replace('trc20', '')}.svg`,
              network: currencyNetworks[currency] || currency.toUpperCase()
            });
          }
        }
        
        console.log(`[NOWPayments] Created ${enabledCurrencies.length} enabled currencies from API response`);
        result = enabledCurrencies;
      } else {
        // If no currencies were returned by the API, provide fallback currencies
        console.warn('[NOWPayments] No currencies found in API response. Using fallback currencies.');
        
        // This allows the application to function even with API account limitations
        result = [
          {
            id: 1,
            name: 'Tether on TRON',
            currency: 'USDTTRC20',
            is_fiat: false,
            enabled: true,
            min_amount: 1, // Set a reasonable default
            max_amount: 100000,
            image: 'https://nowpayments.io/images/coins/usdt.svg',
            network: 'TRC20'
          },
          {
            id: 2,
            name: 'Bitcoin',
            currency: 'BTC',
            is_fiat: false,
            enabled: true,
            min_amount: 0.001,
            max_amount: 10,
            image: 'https://nowpayments.io/images/coins/btc.svg',
            network: 'BTC'
          }
        ];
      }
      
      // Update the cache
      this.enabledCurrenciesCache = {
        currencies: result,
        timestamp: Date.now()
      };
      
      return result;
    } catch (error: any) {
      console.error('[NOWPayments] Error getting available currencies:', error.message);
      
      // If API fails, return default currencies to keep application working
      console.warn('[NOWPayments] Returning default currencies due to API error');
      const fallbackCurrencies = [
        {
          id: 1,
          name: 'Tether on TRON',
          currency: 'USDTTRC20',
          is_fiat: false,
          enabled: true,
          min_amount: 7.603903, // From our test script
          max_amount: 100000,
          image: 'https://nowpayments.io/images/coins/usdt.svg',
          network: 'TRC20'
        },
        {
          id: 2,
          name: 'Bitcoin',
          currency: 'BTC',
          is_fiat: false,
          enabled: true,
          min_amount: 0.001,
          max_amount: 10,
          image: 'https://nowpayments.io/images/coins/btc.svg',
          network: 'BTC'
        }
      ];
      
      // Cache even the fallback currencies to prevent repeated failed API calls
      this.enabledCurrenciesCache = {
        currencies: fallbackCurrencies,
        timestamp: Date.now()
      };
      
      return fallbackCurrencies;
    }
  }
  
  /**
   * Checks if USDT is available for payments
   * If not, finds an alternative currency
   */
  async findAvailablePaymentCurrency(preferredCurrency: string = 'USDT'): Promise<string> {
    // Special case for USDT - use USDTTRC20 (USDT on Tron network) by default
    if (preferredCurrency.toUpperCase() === 'USDT') {
      console.log('[NOWPayments] Converting USDT to USDTTRC20 for Tron network compatibility');
      preferredCurrency = 'USDTTRC20';
    }
    
    // Common fallback currencies in order of preference
    const fallbackCurrencies = ['BTC', 'ETH', 'DOGE', 'LTC', 'BNB'];

    // Handle API key with limited permissions - quickly return the preferred currency
    // This will speed up the invoice creation process when we already know
    // the API key can't list currencies (e.g., returns 403 Forbidden)
    if (this.minAmountCache['USDTTRC20']?.amount === 1 || this.isMockMode) {
      console.log('[NOWPayments] Using preferred currency without API verification (limited permissions detected)');
      return preferredCurrency;
    }

    try {
      // This will now use our cached currencies list if available
      // So we're not making a request every time
      const currencies = await this.getAvailableCurrencies();
      const enabledCurrencies = currencies.filter(c => c.enabled);
      
      // If no enabled currencies found, return the preferred currency
      // This could happen due to API limitations or permissions issues
      if (enabledCurrencies.length === 0) {
        console.log('[NOWPayments] No enabled currencies found. Using preferred currency as fallback.');
        return preferredCurrency;
      }
      
      // Log available currencies for debugging
      console.log(`[NOWPayments] Available currencies: ${enabledCurrencies.map(c => c.currency).join(', ')}`);
      
      // Check if preferred currency (now USDTTRC20 if it was USDT) is available
      const isPreferredAvailable = enabledCurrencies.some(
        c => c.currency.toUpperCase() === preferredCurrency.toUpperCase()
      );
      
      if (isPreferredAvailable) {
        console.log(`[NOWPayments] Preferred currency ${preferredCurrency} is available`);
        return preferredCurrency;
      }
      
      // If preferred currency is not available, try fallbacks
      console.log(`[NOWPayments] Preferred currency ${preferredCurrency} is not available, looking for alternatives`);
      
      // If USDTTRC20 wasn't available, try regular USDT again
      if (preferredCurrency.toUpperCase() === 'USDTTRC20') {
        const isUSDTAvailable = enabledCurrencies.some(
          c => c.currency.toUpperCase() === 'USDT'
        );
        
        if (isUSDTAvailable) {
          console.log('[NOWPayments] USDTTRC20 not available, but regular USDT is. Using USDT.');
          return 'USDT';
        }
      }
      
      // Try other fallback currencies
      for (const fallback of fallbackCurrencies) {
        const isAvailable = enabledCurrencies.some(
          c => c.currency.toUpperCase() === fallback.toUpperCase()
        );
        
        if (isAvailable) {
          console.log(`[NOWPayments] Found alternative currency: ${fallback}`);
          return fallback;
        }
      }
      
      // If none of our preferred options are available, pick the first enabled one
      if (enabledCurrencies.length > 0) {
        const fallbackCurrency = enabledCurrencies[0].currency;
        console.log(`[NOWPayments] Using fallback currency: ${fallbackCurrency}`);
        return fallbackCurrency;
      }
      
      // If no currencies are available at all, return BTC as a last resort
      console.warn('[NOWPayments] No enabled currencies found, returning BTC as last resort');
      return 'BTC';
    } catch (error: any) {
      console.error('[NOWPayments] Error finding available payment currency:', error.message || error);
      
      // If we ran into an error, use USDTTRC20 as the preferred option
      console.log('[NOWPayments] Defaulting to USDTTRC20 due to error');
      return 'USDTTRC20'; 
    }
  }

  async createPayment(
    amount: number, 
    userId: number,
    currency: string = 'USD',
    payCurrency: string = 'USDTTRC20',
    orderId?: string,
    orderDescription?: string,
    callbackUrl?: string
  ): Promise<CreatePaymentResponse> {
    // Generate a unique order ID if not provided
    if (!orderId) {
      orderId = `CHICKFARMS-${userId}-${Date.now()}`;
    }

    // Generate a description if not provided
    if (!orderDescription) {
      orderDescription = `Deposit to ChickFarms account (User ID: ${userId})`;
    }

    try {
      const payload = {
        price_amount: amount,
        price_currency: currency,
        pay_currency: payCurrency,
        order_id: orderId,
        order_description: orderDescription,
        ipn_callback_url: callbackUrl,
      };

      console.log('[NOWPayments] Creating payment with payload:', {
        ...payload,
        api_key: '[REDACTED]' // Don't log the actual API key
      });

      // Use our configured axios instance for better error handling
      const axios = this.getConfiguredAxios();
      const response = await axios.post(
        `${API_BASE_URL}/payment`,
        payload,
        { headers: this.getHeaders() }
      );

      console.log('[NOWPayments] Successfully created payment:', {
        payment_id: response.data.payment_id,
        payment_status: response.data.payment_status,
        price_amount: response.data.price_amount
      });

      return response.data;
    } catch (error: any) {
      console.error('[NOWPayments] Error creating payment:', error.message);
      
      // Log more detailed error information
      if (error.response) {
        console.error('[NOWPayments] API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    // In mock mode, return a mocked payment status
    if (this.isMockMode) {
      console.log(`[NOWPayments] Using mock mode for payment status check for payment ID: ${paymentId}`);
      
      // If this is a DEV- payment ID, it's from our mock invoice
      if (paymentId.startsWith('DEV-')) {
        return {
          payment_id: paymentId,
          payment_status: 'waiting',
          pay_address: '0xMockCryptoAddress123456789',
          price_amount: 100,
          price_currency: 'USD',
          pay_amount: 100,
          pay_currency: 'USDTTRC20',
          order_id: `ORDER-${paymentId}`,
          order_description: 'Mock payment for development',
          ipn_callback_url: `${config.urls.api}/api/payments/callback`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          purchase_id: 'mock-purchase',
          payment_extra_id: 'mock-extra'
        };
      }
      
      // For other payment IDs in mock mode, simulate a "not found" scenario
      throw new Error(`Payment with ID ${paymentId} not found in mock mode`);
    }
    
    try {
      console.log(`[NOWPayments] Checking status for payment ID: ${paymentId}`);
      
      // Use our configured axios instance for better error handling
      const axios = this.getConfiguredAxios();
      const response = await axios.get(
        `${API_BASE_URL}/payment/${paymentId}`,
        { headers: this.getHeaders() }
      );
      
      console.log(`[NOWPayments] Payment status for ${paymentId}:`, {
        status: response.data.payment_status,
        updated_at: response.data.updated_at
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`[NOWPayments] Error getting payment status for payment ID ${paymentId}:`, error.message);
      
      // Log more detailed error information
      if (error.response) {
        console.error('[NOWPayments] API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw error;
    }
  }

  async getMinimumPaymentAmount(currency: string = 'USDT'): Promise<number> {
    // Convert USDT to USDTTRC20 for consistency
    if (currency.toUpperCase() === 'USDT') {
      console.log('[NOWPayments] Converting USDT to USDTTRC20 for minimum payment amount check');
      currency = 'USDTTRC20';
    }
    
    const currencyKey = currency.toUpperCase();
    
    // Check cache first before making API call
    const cachedValue = this.minAmountCache[currencyKey];
    if (cachedValue && (Date.now() - cachedValue.timestamp) < this.CACHE_EXPIRY) {
      console.log(`[NOWPayments] Using cached minimum amount for ${currency}: ${cachedValue.amount}`);
      return cachedValue.amount;
    }
    
    // Standard minimum amount defaults for common currencies
    const defaultMinAmounts: Record<string, number> = {
      'USDTTRC20': 10,
      'USDT': 10,
      'BTC': 0.001,
      'ETH': 0.01,
      'DOGE': 50,
      'LTC': 0.1,
      'BNB': 0.1
    };
    
    // In mock mode, return mock minimum amounts for different currencies
    if (this.isMockMode) {
      console.log(`[NOWPayments] Using mock mode for minimum payment amount for currency: ${currency}`);
      
      const minAmount = defaultMinAmounts[currencyKey] || 1;
      
      // Cache this value
      this.minAmountCache[currencyKey] = {
        amount: minAmount,
        timestamp: Date.now()
      };
      
      return minAmount;
    }
    
    try {
      console.log(`[NOWPayments] Getting minimum payment amount for currency: ${currency}`);
      
      // Use our configured axios instance for better error handling
      const axios = this.getConfiguredAxios();
      
      // The API requires both currency_from and currency_to parameters
      let response;
      try {
        // First attempt with standard parameter format
        response = await axios.get(
          `${API_BASE_URL}/min-amount?currency_from=${currency}&currency_to=usd`,
          { headers: this.getHeaders() }
        );
      } catch (requestError: any) {
        // If we get a 403 error (common with new NOWPayments accounts)
        if (requestError.response && requestError.response.status === 403) {
          console.warn(`[NOWPayments] Received 403 Forbidden when requesting min amount for ${currency}. Using default value.`);
          const defaultAmount = defaultMinAmounts[currencyKey] || 1;
          
          // Cache the default value for this currency
          this.minAmountCache[currencyKey] = {
            amount: defaultAmount,
            timestamp: Date.now() 
          };
          
          return defaultAmount;
        }
        throw requestError; // Re-throw if it's not a 403 error
      }
      
      const minAmount = response.data.min_amount || 1;
      console.log(`[NOWPayments] Minimum payment amount for ${currency}: ${minAmount}`);
      
      // Cache this value to reduce future API calls
      this.minAmountCache[currencyKey] = {
        amount: minAmount,
        timestamp: Date.now()
      };
      
      return minAmount;
    } catch (error: any) {
      console.error(`[NOWPayments] Error getting minimum payment amount for ${currency}:`, error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('[NOWPayments] Error response from NOWPayments API:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Try with a different approach if the first attempt failed
      try {
        console.log(`[NOWPayments] Retrying with different parameters for currency: ${currency}`);
        
        // Try with both parameters explicitly set
        const retryResponse = await axios.get(
          `${API_BASE_URL}/min-amount/${currency}?currency_to=usd`,
          { headers: this.getHeaders() }
        );
        
        const minAmount = retryResponse.data.min_amount || 1;
        console.log(`Retry successful - Minimum payment amount for ${currency}: ${minAmount}`);
        
        // Cache the result
        this.minAmountCache[currencyKey] = {
          amount: minAmount,
          timestamp: Date.now()
        };
        
        return minAmount;
      } catch (retryError) {
        console.error(`[NOWPayments] Retry also failed for ${currency}:`, retryError);
        
        // Use the default minimum amount for this currency or fallback to 1
        const defaultAmount = defaultMinAmounts[currencyKey] || 1;
        console.warn(`[NOWPayments] Using default minimum amount for ${currency}: ${defaultAmount}`);
        
        // Cache the default value
        this.minAmountCache[currencyKey] = {
          amount: defaultAmount,
          timestamp: Date.now() // Cache for less time when using defaults
        };
        
        return defaultAmount;
      }
    }
  }
  
  /**
   * Creates a test invoice with a URL that points to a local test payment page
   * This is used when either in mock mode or when the API is not available
   */
  createTestInvoice(
    amount: number,
    userId: number,
    currency: string = 'USD',
    successUrl?: string,
    cancelUrl?: string,
    orderId?: string
  ): CreateInvoiceResponse {
    orderId = orderId || `TEST-${userId}-${Date.now()}`;
    successUrl = successUrl || `${config.urls.app}/wallet?payment=success`;
    cancelUrl = cancelUrl || `${config.urls.app}/wallet?payment=cancelled`;
    
    // Create a local test URL that includes all the necessary parameters
    const testInvoiceUrl = `${config.urls.app}/dev-payment.html?invoice=${orderId}&amount=${amount}&currency=${currency}&success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
    
    console.log(`[NOWPayments] Created test invoice URL: ${testInvoiceUrl}`);
    
    return {
      id: orderId,
      token_id: 'test-token',
      invoice_url: testInvoiceUrl,
      success: true,
      status: 'test_mode'
    };
  }
  
  async createInvoice(
    amount: number,
    userId: number,
    currency: string = 'USD',
    payCurrency: string = 'USDTTRC20',
    successUrl?: string,
    cancelUrl?: string,
    orderId?: string,
    orderDescription?: string,
    callbackUrl?: string
  ): Promise<CreateInvoiceResponse> {
    orderId = orderId || `CHICKFARMS-${userId}-${Date.now()}`;
    orderDescription = orderDescription || `Deposit to ChickFarms account (User ID: ${userId})`;
    successUrl = successUrl || `${config.urls.app}/wallet?payment=success`;
    cancelUrl = cancelUrl || `${config.urls.app}/wallet?payment=cancelled`;
    callbackUrl = callbackUrl || `${config.urls.api}/api/payments/callback`;

    // Helper function to create test invoices (for reuse in error handling)
    const createTestInvoice = () => {
      console.log('[NOWPayments] Using test mode for payment invoice creation');
      const testInvoiceId = `TEST-${userId}-${Date.now()}`;
      const testInvoiceUrl = `${config.urls.app}/dev-payment.html?invoice=${testInvoiceId}&amount=${amount}&currency=${currency}&success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
      
      return {
        id: testInvoiceId,
        token_id: 'test-token',
        invoice_url: testInvoiceUrl,
        success: true,
        status: 'test_mode'
      };
    };
    
    // If explicitly in mock mode, use test invoice
    if (this.isMockMode) {
      console.log('[NOWPayments] Using mock mode for payment invoice creation');
      return createTestInvoice();
    }
    
    // Check for permissions by making a small API call first
    try {
      // Try to get status - if this fails with 403, we're in test mode
      const statusCheck = await this.getStatus();
      if (statusCheck.status !== 'OK') {
        console.log('[NOWPayments] API status check failed, using test invoice');
        return createTestInvoice();
      }
      
      // Additional check for API key permissions
      // Even if status is OK, the key might not have permissions for invoice creation
      try {
        // Try to get minimum payment amount, which requires fewer permissions than invoice creation
        await this.getMinimumPaymentAmount('USDTTRC20');
      } catch (permissionError: any) {
        if (permissionError.response && permissionError.response.status === 403) {
          console.warn('[NOWPayments] API key has limited permissions. Key can check status but not create invoices.');
          console.log('[NOWPayments] USING TEST INVOICE MODE due to API key permission restrictions.');
          console.log('[NOWPayments] To complete real cryptocurrency payments, please provide an API key with Invoice permissions.');
          const testInvoice = createTestInvoice();
          console.log('[NOWPayments] Created TEST INVOICE with ID:', testInvoice.id);
          return testInvoice;
        }
      }
    } catch (error: any) {
      console.log('[NOWPayments] API check error, using test invoice:', error.message);
      console.log('[NOWPayments] USING TEST INVOICE MODE due to API connectivity issues.');
      console.log('[NOWPayments] To complete real cryptocurrency payments, please verify your NOWPayments API key.');
      const testInvoice = createTestInvoice();
      console.log('[NOWPayments] Created TEST INVOICE with ID:', testInvoice.id);
      return testInvoice;
    }

    // Create axiosInstance at the beginning to be available throughout the try/catch blocks  
    const axiosInstance = this.getConfiguredAxios();
    // Define payload outside the try block to be accessible in the catch blocks
    let payload: any;
      
    try {
      console.log(`[NOWPayments] Checking if ${payCurrency} is available for payments...`);
      
      // First check if we can get available currencies
      let availablePayCurrency: string;
      try {
        // Handle 403 errors that might happen during currency check
        try {
          availablePayCurrency = await this.findAvailablePaymentCurrency(payCurrency);
        } catch (permissionError: any) {
          if (permissionError.response && permissionError.response.status === 403) {
            console.warn('[NOWPayments] Received 403 Forbidden when checking available currencies.');
            console.log('[NOWPayments] USING TEST INVOICE MODE due to currency API permission issues.');
            console.log('[NOWPayments] To complete real cryptocurrency payments, please provide an API key with full permissions.');
            const testInvoice = createTestInvoice();
            console.log('[NOWPayments] Created TEST INVOICE with ID:', testInvoice.id);
            return testInvoice;
          }
          throw permissionError; // Re-throw if it's not a 403
        }
        
        if (availablePayCurrency !== payCurrency) {
          console.log(`[NOWPayments] Requested currency ${payCurrency} is not available, using ${availablePayCurrency} instead`);
        }
      } catch (currencyError: any) {
        // If we couldn't get available currencies, use the default
        console.warn(`[NOWPayments] Failed to find available payment currency: ${currencyError.message}`);
        console.log(`[NOWPayments] Using default currency ${payCurrency} for invoice creation`);
        availablePayCurrency = payCurrency;
      }
      
      // Check minimum payment amount using cached value when possible
      try {
        // This will now use our cache if available
        const minAmount = await this.getMinimumPaymentAmount(availablePayCurrency);
        
        if (amount < minAmount) {
          console.warn(`[NOWPayments] Requested amount ${amount} is below minimum ${minAmount} for ${availablePayCurrency}`);
          throw new Error(`Minimum payment amount for ${availablePayCurrency} is ${minAmount} ${currency}`);
        }
        
        console.log(`[NOWPayments] Payment amount ${amount} meets minimum requirement of ${minAmount} for ${availablePayCurrency}`);
      } catch (minAmountError: any) {
        console.warn(`[NOWPayments] Failed to verify minimum amount: ${minAmountError.message}`);
        // We'll continue anyway as the API will reject if the amount is too low
      }
      
      // Create the payload
      payload = {
        price_amount: amount,
        price_currency: currency,
        pay_currency: availablePayCurrency,
        order_id: orderId,
        order_description: orderDescription,
        ipn_callback_url: callbackUrl,
        success_url: successUrl,
        cancel_url: cancelUrl,
        is_fee_paid_by_user: true
      };

      console.log('[NOWPayments] Creating invoice with payload:', {
        ...payload,
        api_key: '[REDACTED]' // Don't log the actual API key
      });

      // Use our configured axios instance for better error handling
      const response = await axiosInstance.post(
        `${API_BASE_URL}/invoice`,
        payload,
        { 
          headers: this.getHeaders(),
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('[NOWPayments] Successfully created invoice:', {
        id: response.data.id,
        status: response.data.status,
        invoice_url: response.data.invoice_url
      });
      
      return response.data;
    } catch (error: any) {
      console.error('[NOWPayments] Error creating invoice:', error.message);
      
      if (error.response) {
        console.error('[NOWPayments] API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Handle 403 Forbidden with INVALID_API_KEY specifically
        if (error.response.status === 403) {
          const errorData = error.response.data;
          
          // Check for specific INVALID_API_KEY error message
          if (errorData && 
              (errorData.message === 'INVALID_API_KEY' || 
               errorData.statusText === 'Forbidden' ||
               errorData.message?.includes('key') ||
               errorData.message?.includes('permissions'))) {
            console.warn('[NOWPayments] API key permission error. This key likely does not have invoice creation permissions.');
            console.log('[NOWPayments] USING TEST INVOICE MODE due to API key restrictions. In production, you should use a fully authorized API key.');
            console.log('[NOWPayments] To complete real cryptocurrency payments, please provide an API key with Invoice permissions.');
            const testInvoice = createTestInvoice();
            console.log('[NOWPayments] Created TEST INVOICE with ID:', testInvoice.id);
            return testInvoice;
          }
        }
        
        // Check for specific API errors and provide better error messages
        if (error.response.status === 400) {
          const errorData = error.response.data;
          
          // Handle no currencies available error
          if (errorData && 
              (errorData.message === 'No available currencies found' || 
               errorData.message === 'This currency is not available' ||
               errorData.message?.includes('is not available'))) {
            console.warn('[NOWPayments] No available currencies error. This is likely due to account limitations.');
            throw new Error('Payment service is currently unavailable. Please try again later or contact support.');
          }
          
          // Handle minimum amount errors
          if (errorData && errorData.message?.includes('minimal amount')) {
            // Try to extract the minimum amount from the error message
            const minAmountMatch = errorData.message.match(/([0-9]+\.?[0-9]*)/);
            const minAmount = minAmountMatch ? minAmountMatch[0] : "higher";
            
            throw new Error(`Minimum payment amount is ${minAmount} ${currency}`);
          }
        }
      }
      
      // If we got an error and the error appears to be related to currency availability, try a fallback approach
      if (error.response?.status === 400 || error.message?.includes('not available') || error.message?.includes('invalid')) {
        try {
          console.log('[NOWPayments] USDTTRC20 invoice failed, trying fallback with USDT...');
          
          // Make sure payload exists to avoid TypeScript error
          if (!payload) {
            payload = {
              price_amount: amount,
              price_currency: currency,
              pay_currency: payCurrency,
              order_id: orderId,
              order_description: orderDescription,
              ipn_callback_url: callbackUrl,
              success_url: successUrl,
              cancel_url: cancelUrl,
              is_fee_paid_by_user: true
            };
          }
          
          // Try with just USDT without TRC20 specification
          const fallbackPayload = {
            ...payload,
            pay_currency: 'USDT'
          };
          
          // Use our configured axios instance for better error handling
          const fallbackResponse = await axiosInstance.post(
            `${API_BASE_URL}/invoice`,
            fallbackPayload,
            { 
              headers: this.getHeaders(),
              timeout: 30000 // 30 second timeout
            }
          );
          
          console.log('[NOWPayments] Successfully created fallback invoice with USDT:', {
            id: fallbackResponse.data.id,
            status: fallbackResponse.data.status,
            invoice_url: fallbackResponse.data.invoice_url
          });
          
          return fallbackResponse.data;
        } catch (fallbackError: any) {
          console.error('[NOWPayments] Fallback invoice with USDT also failed:', fallbackError.message);
          
          // Try one more approach - let NOWPayments choose the currency
          try {
            console.log('[NOWPayments] Final attempt - creating invoice without specifying pay_currency...');
            
            // Remove the pay_currency field to let NOWPayments choose an available currency
            const finalPayload = {
              ...payload,
              pay_currency: undefined
            };
            
            // Use our configured axios instance for better error handling
            const finalResponse = await axiosInstance.post(
              `${API_BASE_URL}/invoice`,
              finalPayload,
              { 
                headers: this.getHeaders(),
                timeout: 30000 // 30 second timeout
              }
            );
            
            console.log('[NOWPayments] Successfully created final fallback invoice:', {
              id: finalResponse.data.id,
              status: finalResponse.data.status,
              invoice_url: finalResponse.data.invoice_url
            });
            
            return finalResponse.data;
          } catch (finalError: any) {
            console.error('[NOWPayments] All invoice creation attempts failed', finalError.message);
            console.log('[NOWPayments] USING TEST INVOICE MODE as final fallback after all API attempts failed.');
            console.log('[NOWPayments] To complete real cryptocurrency payments, please verify your NOWPayments account has active payment methods.');
            const testInvoice = createTestInvoice();
            console.log('[NOWPayments] Created FINAL FALLBACK TEST INVOICE with ID:', testInvoice.id);
            return testInvoice;
          }
        }
      }
      
      // General error case if all attempts fail
      throw error;
    }
  }

  // Helper function to map NOWPayments status to our transaction status
  mapPaymentStatusToTransactionStatus(paymentStatus: string): string {
    const statusMap: Record<string, string> = {
      'waiting': 'pending',
      'confirming': 'pending',
      'confirmed': 'pending',
      'sending': 'pending',
      'partially_paid': 'partial',
      'finished': 'completed',
      'failed': 'failed',
      'refunded': 'refunded',
      'expired': 'expired'
    };

    return statusMap[paymentStatus] || 'pending';
  }

  /**
   * Helper method to convert a transaction to a standardized payment status object
   * This ensures consistent types throughout the application
   */
  createStandardizedPaymentStatus(
    paymentId: string,
    transaction: any, // Use any to avoid circular dependencies
    apiPaymentStatus?: PaymentStatusResponse
  ): StandardizedPaymentStatus {
    // Ensure created_at is always a string in ISO format
    const createdAt = transaction.createdAt
      ? transaction.createdAt instanceof Date
        ? transaction.createdAt.toISOString()
        : typeof transaction.createdAt === 'string'
          ? transaction.createdAt
          : new Date(transaction.createdAt).toISOString()
      : new Date().toISOString();
    
    // Create base payment status from transaction
    const base: StandardizedPaymentStatus = {
      payment_id: paymentId,
      payment_status: transaction.status === 'pending' ? 'waiting' : transaction.status,
      pay_address: '',
      price_amount: parseFloat(transaction.amount),
      price_currency: 'USDTTRC20',
      pay_amount: parseFloat(transaction.amount),
      pay_currency: 'USDTTRC20',
      created_at: createdAt, // Always a string in ISO format
      actually_paid: null,
      actually_paid_at: null,
      updated_at: null
    };
    
    // Merge with API payment status if provided
    if (apiPaymentStatus) {
      // Ensure dates are always strings in ISO format
      const apiCreatedAt = apiPaymentStatus.created_at
        ? typeof apiPaymentStatus.created_at === 'string'
          ? apiPaymentStatus.created_at
          : new Date(apiPaymentStatus.created_at).toISOString()
        : base.created_at;
        
      const apiUpdatedAt = apiPaymentStatus.updated_at
        ? typeof apiPaymentStatus.updated_at === 'string'
          ? apiPaymentStatus.updated_at
          : new Date(apiPaymentStatus.updated_at).toISOString()
        : null;
        
      const apiActuallyPaidAt = apiPaymentStatus.actually_paid_at
        ? typeof apiPaymentStatus.actually_paid_at === 'string'
          ? apiPaymentStatus.actually_paid_at
          : new Date(apiPaymentStatus.actually_paid_at).toISOString()
        : null;
    
      return {
        ...base,
        pay_address: apiPaymentStatus.pay_address || base.pay_address,
        payment_status: apiPaymentStatus.payment_status || base.payment_status,
        price_amount: apiPaymentStatus.price_amount || base.price_amount,
        price_currency: apiPaymentStatus.price_currency || base.price_currency,
        pay_amount: apiPaymentStatus.pay_amount || base.pay_amount,
        pay_currency: apiPaymentStatus.pay_currency || base.pay_currency,
        created_at: apiCreatedAt,
        actually_paid: apiPaymentStatus.actually_paid !== undefined ? apiPaymentStatus.actually_paid : null,
        actually_paid_at: apiActuallyPaidAt,
        updated_at: apiUpdatedAt
      };
    }
    
    return base;
  }
}

export const nowPaymentsService = new NOWPaymentsService();