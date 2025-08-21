import axios from 'axios';
import { networkUtils } from '../utils/networkUtils';

class AxiosService {
  private api: any;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't auto-initialize in constructor to avoid race conditions
    console.log('🔧 AxiosService constructor called');
  }

  private async initializeApi() {
    if (this.isInitialized && this.api) {
      console.log('🔧 API already initialized, skipping...');
      return;
    }

    console.log('🔧 Starting API initialization...');
    
    try {
      // Clear any existing API instance
      if (this.api) {
        console.log('🧹 Clearing existing API instance...');
        this.api = null;
      }

      const timeout = await networkUtils.getRecommendedTimeout();
      console.log('🔧 Initializing Axios API with timeout:', timeout + 'ms');
      
      this.api = axios.create({
        baseURL: 'https://jsonplaceholder.typicode.com/',
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      // Add request interceptor for logging
      this.api.interceptors.request.use(
        (config: any) => {
          console.log('📤 REQUEST START:', {
            url: config.url,
            method: config.method?.toUpperCase(),
            timeout: config.timeout + 'ms',
            timestamp: new Date().toISOString(),
          });
          return config;
        },
        (error: any) => {
          console.error('❌ REQUEST INTERCEPTOR ERROR:', error);
          return Promise.reject(error);
        }
      );

      // Add response interceptor for logging
      this.api.interceptors.response.use(
        (response: any) => {
          console.log('📥 RESPONSE SUCCESS:', {
            url: response.config.url,
            status: response.status,
            statusText: response.statusText,
            responseTime: Date.now() - new Date(response.config.metadata?.startTime || Date.now()).getTime() + 'ms',
            timestamp: new Date().toISOString(),
          });
          return response;
        },
        (error: any) => {
          console.error('❌ RESPONSE ERROR:', {
            url: error.config?.url,
            status: error.response?.status,
            statusText: error.response?.statusText,
            code: error.code,
            message: error.message,
            responseTime: error.config?.metadata?.startTime ? 
              Date.now() - new Date(error.config.metadata.startTime).getTime() + 'ms' : 'unknown',
            timestamp: new Date().toISOString(),
          });
          return Promise.reject(error);
        }
      );

      this.isInitialized = true;
      console.log('✅ API initialization completed successfully');
    } catch (error) {
      console.error('❌ API initialization failed:', error);
      this.isInitialized = false;
      this.api = null;
      throw error;
    }
  }

  // Retry configuration with exponential backoff
  private maxRetries = 3;
  private baseRetryDelay = 1000; // 1 second
  private maxRetryDelay = 8000; // 8 seconds

  // Request deduplication
  private pendingRequests = new Map<string, Promise<any>>();

  // Exponential backoff delay calculation
  private getRetryDelay(attempt: number): number {
    const delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.maxRetryDelay);
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.maxRetries,
    attempt: number = 1
  ): Promise<T> {
    try {
      console.log(`🔄 RETRY ATTEMPT ${attempt}/${this.maxRetries + 1}`);
      return await requestFn();
    } catch (error: any) {
      if (retries > 0 && this.shouldRetry(error)) {
        const delay = this.getRetryDelay(attempt);
        console.log(`⏳ RETRYING request... (${attempt}/${this.maxRetries}) after ${delay}ms delay`);
        console.log(`📊 RETRY REASON:`, {
          errorCode: error.code,
          errorMessage: error.message,
          status: error.response?.status,
          remainingRetries: retries - 1,
        });
        await this.delay(delay);
        return this.retryRequest(requestFn, retries - 1, attempt + 1);
      }
      console.log(`💥 MAX RETRIES REACHED or non-retryable error`);
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (axios.isAxiosError(error)) {
      // Retry on network errors, timeouts, and 5xx server errors
      const shouldRetry = (
        !error.response || // Network error
        error.code === 'ECONNABORTED' || // Timeout
        error.code === 'ERR_NETWORK' || // Network error
        error.code === 'ERR_INTERNET_DISCONNECTED' || // Internet disconnected
        (error.response && error.response.status >= 500) // Server error
      );
      
      console.log('🔍 RETRY DECISION:', {
        code: error.code,
        status: error.response?.status,
        shouldRetry,
        message: error.message,
        hasResponse: !!error.response,
      });
      
      return shouldRetry;
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Request deduplication to prevent multiple identical requests
  private getRequestKey(url: string): string {
    return url;
  }

  private async deduplicatedRequest<T>(url: string, requestFn: () => Promise<T>): Promise<T> {
    const requestKey = this.getRequestKey(url);
    
    if (this.pendingRequests.has(requestKey)) {
      console.log('🔄 REQUEST DEDUPLICATION: Request already in progress, waiting for existing request...');
      return this.pendingRequests.get(requestKey)!;
    }

    console.log('🆕 NEW REQUEST: Starting fresh request');
    const requestPromise = requestFn().finally(() => {
      console.log('✅ REQUEST COMPLETED: Cleaning up pending request');
      this.pendingRequests.delete(requestKey);
    });

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  async getRandomPost(): Promise<any> {
    console.log('🚀 STARTING getRandomPost request');
    
    // Ensure API is initialized with proper error handling
    if (!this.isInitialized || !this.api) {
      console.log('🔧 API not initialized, initializing now...');
      if (this.initializationPromise) {
        console.log('⏳ Waiting for existing initialization...');
        await this.initializationPromise;
      } else {
        this.initializationPromise = this.initializeApi();
        await this.initializationPromise;
        this.initializationPromise = null;
      }
    }
    
    // Log network configuration for debugging
    await networkUtils.logNetworkConfig();
    
    const randomId = Math.floor(Math.random() * 100) + 1; // IDs range from 1 to 100
    const url = `/posts/${randomId}`;
    
    console.log('🎲 SELECTED POST ID:', randomId);
    
    return this.deduplicatedRequest(url, () => 
      this.retryRequest(async () => {
        try {
          console.log(`📡 FETCHING post with ID: ${randomId}`);
          const startTime = Date.now();
          
          // Add start time to config for response interceptor
          const config = { metadata: { startTime } };
          
          const response = await this.api.get(url, config);
          
          const endTime = Date.now();
          const duration = endTime - startTime;
          console.log(`✅ POST FETCHED SUCCESSFULLY:`, {
            id: randomId,
            duration: duration + 'ms',
            status: response.status,
            dataSize: JSON.stringify(response.data).length + ' chars',
          });
          return response.data;
        } catch (error: any) {
          if (axios.isAxiosError(error)) {
            const errorDetails = {
              message: error.message,
              code: error.code,
              status: error.response?.status,
              statusText: error.response?.statusText,
              url: error.config?.url,
              timeout: error.config?.timeout,
            };
            
            console.error('💥 AXIOS ERROR DETAILS:', errorDetails);
            
            // Provide more specific error messages
            if (error.code === 'ECONNABORTED') {
              throw new Error('Request timed out. Please check your internet connection and try again.');
            } else if (error.code === 'ERR_NETWORK') {
              throw new Error('Network error. Please check your internet connection.');
            } else if (error.code === 'ERR_INTERNET_DISCONNECTED') {
              throw new Error('Internet connection lost. Please reconnect and try again.');
            } else if (!error.response) {
              throw new Error('Network error. Please check your internet connection.');
            } else {
              throw new Error(`Server error: ${error.response.status} - ${error.response.statusText}`);
            }
          } else {
            console.error('💥 UNEXPECTED ERROR:', error);
            throw new Error('An unexpected error occurred. Please try again.');
          }
        }
      })
    );
  }

  // Method to clear pending requests (useful for cleanup)
  clearPendingRequests(): void {
    console.log('🧹 CLEARING all pending requests');
    this.pendingRequests.clear();
  }

  // Method to reset the service (useful for app restart scenarios)
  async reset(): Promise<void> {
    console.log('🔄 RESETTING AxiosService...');
    this.clearPendingRequests();
    this.isInitialized = false;
    this.api = null;
    this.initializationPromise = null;
    console.log('✅ AxiosService reset completed');
  }

  // Method to force re-initialization
  async reinitialize(): Promise<void> {
    console.log('🔄 FORCE RE-INITIALIZING AxiosService...');
    await this.reset();
    await this.initializeApi();
  }
}

export default new AxiosService();
