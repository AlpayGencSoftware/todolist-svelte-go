/**
 * API Services Index
 * Tüm API servislerini merkezi olarak export eder
 */

import { httpClient } from '../http-client.js';
import { setupDefaultInterceptors } from '../interceptors.js';
import { todoApiService } from './todo-api.js';

// Varsayılan interceptor'ları kur
setupDefaultInterceptors(httpClient);

// API servislerini export et
export { todoApiService };
export type { Todo, CreateTodoRequest, UpdateTodoRequest } from './todo-api.js';

// HTTP client'i de export et (gerekirse direkt kullanım için)
export { httpClient };
