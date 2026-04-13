import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import CircuitBreaker from 'opossum';
import { createLogger } from '../logger';

const logger = createLogger('HttpClient');

export interface HttpClientOptions {
    baseURL?: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
    circuitBreakerOptions?: CircuitBreaker.Options;
}

export class HttpClient {
    private client: AxiosInstance;
    private circuitBreaker: CircuitBreaker;

    constructor(options: HttpClientOptions = {}) {
        this.client = axios.create({
            baseURL: options.baseURL,
            timeout: options.timeout || 10000,
            headers: options.headers,
        });

        const retries = options.retries !== undefined ? options.retries : 3;

        // Configure Retries
        axiosRetry(this.client, {
            retries,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => {
                // Retry on network errors, 5xx, or 429
                return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
                       error.response?.status === 429 || 
                       (error.response?.status !== undefined && error.response.status >= 500);
            },
            onRetry: (retryCount, error, requestConfig) => {
                logger.warn(`Retrying request attempt ${retryCount} to ${requestConfig.url}: ${error.message}`);
            }
        });

        // Configure Circuit Breaker
        const cbOptions: CircuitBreaker.Options = {
            timeout: options.timeout || 10000, 
            errorThresholdPercentage: 50, // Open circuit after 50% failures
            resetTimeout: 30000, // Try again after 30 seconds
            ...options.circuitBreakerOptions
        };

        this.circuitBreaker = new CircuitBreaker(this.makeRequest.bind(this), cbOptions);

        this.circuitBreaker.on('open', () => logger.warn(`Circuit breaker OPEN for baseURL: ${options.baseURL || 'unknown'}`));
        this.circuitBreaker.on('close', () => logger.info(`Circuit breaker CLOSED for baseURL: ${options.baseURL || 'unknown'}`));
        this.circuitBreaker.on('halfOpen', () => logger.warn(`Circuit breaker HALF_OPEN for baseURL: ${options.baseURL || 'unknown'}`));
    }

    private async makeRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
        return this.client.request(config);
    }

    /**
     * Helper to execute GET
     */
    public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.circuitBreaker.fire({ ...config, method: 'get', url }) as Promise<AxiosResponse<T>>;
    }

    /**
     * Helper to execute POST
     */
    public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.circuitBreaker.fire({ ...config, method: 'post', url, data }) as Promise<AxiosResponse<T>>;
    }

    /**
     * Helper to execute PUT
     */
    public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.circuitBreaker.fire({ ...config, method: 'put', url, data }) as Promise<AxiosResponse<T>>;
    }

    /**
     * Helper to execute DELETE
     */
    public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.circuitBreaker.fire({ ...config, method: 'delete', url }) as Promise<AxiosResponse<T>>;
    }
}
