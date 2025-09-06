import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Product } from '../types/product.types';

export interface ExportData {
  products: Product[];
  metadata: {
    exportName: string;
    exportedAt: string;
    productCount: number;
    version: string;
  };
}

export interface SavedExport {
  id: string;
  name: string;
  productCount: number;
  exportedAt: string;
  originalName?: string;
  filename?: string;
  size?: number;
  uploadedAt?: string;
  type?: string;
  owner?: string; // Add owner field to track who owns the export
}

export interface UserWithExports {
  username: string;
  exportCount: number;
}

export interface SaveExportRequest {
  username: string;
  products: Product[];
  exportName?: string;
}

export interface SaveExportResponse {
  success: boolean;
  message: string;
  export: {
    id: string;
    name: string;
    productCount: number;
    exportedAt: string;
  };
}

export interface LoadExportResponse {
  success: boolean;
  export: ExportData;
}

@Injectable({
  providedIn: 'root'
})
export class ExportImportService {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  /**
   * Save exported product data to the server
   */
  async saveExportToServer(request: SaveExportRequest): Promise<SaveExportResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<SaveExportResponse>(`${this.baseUrl}/export/save`, request)
      );
      return response;
    } catch (error) {
      console.error('Failed to save export to server:', error);
      throw new Error('Failed to save export to server');
    }
  }

  /**
   * Get list of saved exports for a user
   */
  async getSavedExports(username: string): Promise<SavedExport[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ exports: SavedExport[] }>(`${this.baseUrl}/export/list/${username}`)
      );
      // Add owner information to each export
      const exports = (response.exports || []).map(exp => ({
        ...exp,
        owner: username
      }));
      return exports;
    } catch (error) {
      console.error('Failed to get saved exports:', error);
      return [];
    }
  }

  /**
   * Get list of users who have exports
   */
  async getUsersWithExports(): Promise<UserWithExports[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ users: UserWithExports[] }>(`${this.baseUrl}/export/users`)
      );
      return response.users || [];
    } catch (error) {
      console.error('Failed to get users with exports:', error);
      return [];
    }
  }

  /**
   * Load a specific saved export from the server
   */
  async loadExportFromServer(username: string, filename: string): Promise<ExportData> {
    try {
      const response = await firstValueFrom(
        this.http.get<LoadExportResponse>(`${this.baseUrl}/export/load/${username}/${filename}`)
      );
      return response.export;
    } catch (error) {
      console.error('Failed to load export from server:', error);
      throw new Error('Failed to load export from server');
    }
  }

  /**
   * Delete a saved export from the server
   */
  async deleteExportFromServer(username: string, filename: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/files/${username}/${filename}`)
      );
      return response.success;
    } catch (error) {
      console.error('Failed to delete export from server:', error);
      return false;
    }
  }

  /**
   * Export products to local file (existing functionality)
   */
  exportToLocalFile(products: Product[], filename?: string): void {
    try {
      const dataStr = JSON.stringify(products, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = filename || `pos-products-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error('Failed to export to local file:', error);
      throw new Error('Failed to export to local file');
    }
  }

  /**
   * Import products from local file (existing functionality)
   */
  importFromLocalFile(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            console.log('File content preview:', content.substring(0, 200) + '...');
            
            const data = JSON.parse(content);
            console.log('Parsed data structure:', {
              isArray: Array.isArray(data),
              hasProducts: data && typeof data === 'object' && 'products' in data,
              keys: data && typeof data === 'object' ? Object.keys(data) : 'not an object'
            });
            
            // Handle various file formats
            let products: Product[];
            
            if (Array.isArray(data)) {
              // Old format: direct array of products
              products = data;
              console.log('Detected format: Direct array of products');
            } else if (data && typeof data === 'object' && data.products && Array.isArray(data.products)) {
              // New format: object with products array and metadata
              products = data.products;
              console.log('Detected format: Object with products array');
            } else if (data && typeof data === 'object' && Array.isArray(data.items)) {
              // Alternative format: object with items array
              products = data.items;
              console.log('Detected format: Object with items array');
            } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
              // Alternative format: object with data array
              products = data.data;
              console.log('Detected format: Object with data array');
            } else {
              // Try to find any array property that might contain products
              const arrayProperties = Object.keys(data).filter(key => Array.isArray(data[key]));
              if (arrayProperties.length > 0) {
                console.log('Found array properties:', arrayProperties);
                products = data[arrayProperties[0]];
                console.log(`Using array property: ${arrayProperties[0]}`);
              } else {
                throw new Error(`Invalid file format. Expected an array of products or an object with a 'products' array, but found: ${typeof data} with keys: ${Object.keys(data || {}).join(', ')}`);
              }
            }
            
            // Validate that we have products
            if (!Array.isArray(products)) {
              throw new Error('No valid product array found in file');
            }
            
            if (products.length === 0) {
              throw new Error('File contains no products');
            }
            
            // Basic validation of first product to ensure it looks like a product
            const firstProduct = products[0];
            if (!firstProduct || typeof firstProduct !== 'object') {
              throw new Error('Invalid product data structure');
            }
            
            console.log(`Successfully parsed ${products.length} products from file`);
            resolve(products);
          } catch (error) {
            console.error('File parsing error:', error);
            reject(new Error('Failed to parse file: ' + (error as Error).message));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
      };

      input.oncancel = () => {
        reject(new Error('File selection cancelled'));
      };

      input.click();
    });
  }
}
