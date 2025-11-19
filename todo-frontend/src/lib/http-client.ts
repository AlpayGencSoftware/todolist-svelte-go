/**
 * HTTP Client with Interceptor Support
 * Merkezi HTTP istek yönetimi için interceptor yapısı
 */

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface HttpError {
  message: string;
  status?: number;
  data?: any;
}

// Interceptor tipleri
export type RequestInterceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string };
export type ResponseInterceptor = <T>(response: HttpResponse<T>) => HttpResponse<T>;
export type ErrorInterceptor = (error: HttpError) => Promise<never> | HttpError;

export class HttpClient {
  private config: HttpConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: HttpConfig = {}) {
    this.config = {
      baseURL: 'http://localhost:8081',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  // Interceptor ekleme metodları
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // Request interceptor'ları çalıştır
  private async applyRequestInterceptors(config: RequestInit & { url: string }): Promise<RequestInit & { url: string }> {
    let processedConfig = { ...config };
    
    for (const interceptor of this.requestInterceptors) {
      processedConfig = interceptor(processedConfig);
    }
    
    return processedConfig;
  }

  // Response interceptor'ları çalıştır
  private async applyResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  // Error interceptor'ları çalıştır
  private async applyErrorInterceptors(error: HttpError): Promise<never> {
    let processedError = error;
    
    for (const interceptor of this.errorInterceptors) {
      try {
        processedError = await interceptor(processedError);
      } catch (e) {
        throw e;
      }
    }
    
    throw processedError;
  }

  // Ana HTTP metodu
  private async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<HttpResponse<T>> {
    try {
      // URL'i baseURL ile birleştir
      const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
      
      // Request konfigürasyonunu hazırla
      let requestConfig: RequestInit & { url: string } = {
        url: fullUrl,
        method: options.method || 'GET',
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        ...options,
      };

      // Request interceptor'ları uygula
      requestConfig = await this.applyRequestInterceptors(requestConfig);

      // Timeout kontrolü
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(requestConfig.url, {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Response'u işle
      const responseData: HttpResponse<T> = {
        data: await this.parseResponse<T>(response),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };

      // Başarısız response'ları error olarak işle
      if (!response.ok) {
        const error: HttpError = {
          message: response.statusText,
          status: response.status,
          data: responseData.data,
        };
        return this.applyErrorInterceptors(error);
      }

      // Response interceptor'ları uygula
      return this.applyResponseInterceptors(responseData);
    } catch (error) {
      // Network hatalarını işle
      if (error instanceof Error) {
        const httpError: HttpError = {
          message: error.message,
          data: error,
        };
        return this.applyErrorInterceptors(httpError);
      }
      throw error;
    }
  }

  // Response'u parse et
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    if (contentType?.includes('text/')) {
      return response.text() as unknown as T;
    }
    
    return response.blob() as unknown as T;
  }

  // HTTP metodları
  async get<T = any>(url: string, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(url: string, data?: any, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(url: string, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(url: string, data?: any, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Singleton instance
export const httpClient = new HttpClient();
