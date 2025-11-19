/**
 * Todo API Service
 * Todo işlemleri için API servis katmanı
 */

import { httpClient } from '../http-client.js';

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
}

export interface UpdateTodoRequest {
  title?: string;
  done?: boolean;
}

export class TodoApiService {
  private basePath = '/todos';

  /**
   * Tüm todo'ları getir
   */
  async getTodos(): Promise<Todo[]> {
    const response = await httpClient.get<Todo[]>(this.basePath);
    return response.data;
  }

  /**
   * Yeni todo oluştur
   */
  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    const response = await httpClient.post<Todo>(this.basePath, data);
    return response.data;
  }

  /**
   * Todo durumunu değiştir (toggle)
   */
  async toggleTodo(id: string): Promise<Todo> {
    const response = await httpClient.post<Todo>(`${this.basePath}/${id}/toggle`);
    return response.data;
  }

  /**
   * Todo'yu sil
   */
  async deleteTodo(id: string): Promise<void> {
    await httpClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Todo'yu güncelle
   */
  async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
    const response = await httpClient.put<Todo>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Belirli bir todo'yu getir
   */
  async getTodo(id: string): Promise<Todo> {
    const response = await httpClient.get<Todo>(`${this.basePath}/${id}`);
    return response.data;
  }
}

// Singleton instance
export const todoApiService = new TodoApiService();
