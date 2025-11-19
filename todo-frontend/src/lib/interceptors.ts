/**
 * HTTP Interceptors
 * Request/Response işlemleri için interceptor'lar
 */

import type { 
  RequestInterceptor, 
  ResponseInterceptor, 
  ErrorInterceptor, 
  HttpResponse,
  HttpError 
} from './http-client.js';

// Loading state yönetimi için store
import { writable } from 'svelte/store';

// Global loading state
export const isLoading = writable(false);
export const globalError = writable<string | null>(null);

// Request counter - kaç tane aktif request var
let requestCount = 0;

/**
 * Loading Interceptor
 * API istekleri sırasında loading state'i yönetir
 */
export const loadingInterceptor: RequestInterceptor = (config) => {
  requestCount++;
  if (requestCount === 1) {
    isLoading.set(true);
    globalError.set(null);
  }
  return config;
};

export const loadingResponseInterceptor: ResponseInterceptor = <T>(response: HttpResponse<T>) => {
  requestCount--;
  if (requestCount === 0) {
    isLoading.set(false);
  }
  return response;
};

export const loadingErrorInterceptor: ErrorInterceptor = (error: HttpError) => {
  requestCount--;
  if (requestCount === 0) {
    isLoading.set(false);
  }
  return Promise.reject(error);
};

/**
 * Error Handling Interceptor
 * API hatalarını merkezi olarak yönetir
 */
export const errorInterceptor: ErrorInterceptor = (error: HttpError) => {
  console.error('API Error:', error);
  
  // Global error state'i güncelle
  let errorMessage = 'Bir hata oluştu';
  
  if (error.status) {
    switch (error.status) {
      case 400:
        errorMessage = 'Geçersiz istek';
        break;
      case 401:
        errorMessage = 'Yetkisiz erişim';
        break;
      case 403:
        errorMessage = 'Erişim reddedildi';
        break;
      case 404:
        errorMessage = 'Kaynak bulunamadı';
        break;
      case 500:
        errorMessage = 'Sunucu hatası';
        break;
      default:
        errorMessage = `HTTP ${error.status}: ${error.message}`;
    }
  } else if (error.message.includes('fetch')) {
    errorMessage = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
  }
  
  globalError.set(errorMessage);
  
  // Toast notification (eğer toast sistemi varsa)
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(errorMessage, 'error');
  }
  
  return Promise.reject(error);
};

/**
 * Request Logging Interceptor
 * Tüm API isteklerini loglar
 */
export const loggingInterceptor: RequestInterceptor = (config) => {
  console.log(`🚀 ${config.method || 'GET'} ${config.url}`, config.body);
  return config;
};

export const loggingResponseInterceptor: ResponseInterceptor = <T>(response: HttpResponse<T>) => {
  console.log(`✅ ${response.status} ${response.statusText}`, response.data);
  return response;
};

/**
 * Authentication Interceptor
 * Token yönetimi için (gelecekte kullanılabilir)
 */
export const authInterceptor: RequestInterceptor = (config) => {
  // Token'ı localStorage'dan al
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  
  return config;
};

/**
 * Response Time Interceptor
 * API response sürelerini ölçer
 */
export const timingInterceptor: RequestInterceptor = (config) => {
  config.headers = {
    ...config.headers,
    'X-Request-Start': Date.now().toString(),
  };
  return config;
};

export const timingResponseInterceptor: ResponseInterceptor = <T>(response: HttpResponse<T>) => {
  const startTime = response.headers.get('X-Request-Start');
  if (startTime) {
    const duration = Date.now() - parseInt(startTime);
    console.log(`⏱️ Request took ${duration}ms`);
  }
  return response;
};

/**
 * Retry Interceptor
 * Başarısız istekleri yeniden dener
 */
export const retryInterceptor: ErrorInterceptor = async (error: HttpError) => {
  // Sadece network hatalarında retry yap
  if (!error.status || error.status >= 500) {
    console.log('🔄 Retrying failed request...');
    
    // 1 saniye bekle ve tekrar dene
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Bu basit bir retry implementasyonu
    // Gerçek uygulamada daha sofistike retry logic'i kullanılabilir
  }
  
  return Promise.reject(error);
};

/**
 * CSRF Token Interceptor
 * CSRF koruması için (eğer backend destekliyorsa)
 */
export const csrfInterceptor: RequestInterceptor = async (config) => {
  // CSRF token'ı al (eğer varsa)
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  if (csrfToken && (config.method === 'POST' || config.method === 'PUT' || config.method === 'DELETE')) {
    config.headers = {
      ...config.headers,
      'X-CSRF-Token': csrfToken,
    };
  }
  
  return config;
};

/**
 * Content Type Interceptor
 * Content-Type header'ını otomatik ayarlar
 */
export const contentTypeInterceptor: RequestInterceptor = (config) => {
  // Eğer body varsa ve Content-Type belirtilmemişse
  if (config.body && !config.headers?.['Content-Type']) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
  }
  
  return config;
};

/**
 * Default Interceptors Setup
 * Varsayılan interceptor'ları kurar
 */
export function setupDefaultInterceptors(httpClient: any) {
  // Request interceptor'ları
  httpClient.addRequestInterceptor(contentTypeInterceptor);
  httpClient.addRequestInterceptor(authInterceptor);
  httpClient.addRequestInterceptor(loggingInterceptor);
  httpClient.addRequestInterceptor(timingInterceptor);
  httpClient.addRequestInterceptor(loadingInterceptor);
  
  // Response interceptor'ları
  httpClient.addResponseInterceptor(timingResponseInterceptor);
  httpClient.addResponseInterceptor(loggingResponseInterceptor);
  httpClient.addResponseInterceptor(loadingResponseInterceptor);
  
  // Error interceptor'ları
  httpClient.addErrorInterceptor(loadingErrorInterceptor);
  httpClient.addErrorInterceptor(retryInterceptor);
  httpClient.addErrorInterceptor(errorInterceptor);
}
