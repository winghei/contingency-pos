import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

export interface UploadResponse {
  success: boolean;
  message: string;
  file: {
    id: string;
    originalName: string;
    size: number;
    uploadedAt: string;
  };
}

export interface FileInfo {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  username: string;
  uploadedAt: string;
  owner?: string; // Added for cross-user file access
}

export interface UserFilesResponse {
  files: FileInfo[];
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private readonly API_BASE_URL = '/api';

  /**
   * Upload a file to the backend server
   * @param file The file to upload
   * @param originalName The original name of the file
   * @returns Observable with upload response
   */
  uploadFile(file: Blob, originalName: string): Observable<UploadResponse> {
    const username = this.authService.getCurrentUsername();
    if (!username) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file, originalName);
    formData.append('username', username);

    return this.http.post<UploadResponse>(`${this.API_BASE_URL}/upload`, formData);
  }

  /**
   * Get all files for the current user
   * @returns Observable with user's files
   */
  getUserFiles(): Observable<UserFilesResponse> {
    const username = this.authService.getCurrentUsername();
    if (!username) {
      throw new Error('User not authenticated');
    }

    return this.http.get<UserFilesResponse>(`${this.API_BASE_URL}/files/${encodeURIComponent(username)}`);
  }

  /**
   * Get all files from all users
   * @returns Observable with all files
   */
  getAllFiles(): Observable<UserFilesResponse> {
    return this.http.get<UserFilesResponse>(`${this.API_BASE_URL}/files`);
  }

  /**
   * Download a file from the backend
   * @param filename The filename to download
   * @returns Observable with blob data
   */
  downloadFile(filename: string): Observable<Blob> {
    const username = this.authService.getCurrentUsername();
    if (!username) {
      throw new Error('User not authenticated');
    }

    return this.http.get(`${this.API_BASE_URL}/download/${encodeURIComponent(username)}/${encodeURIComponent(filename)}`, {
      responseType: 'blob'
    });
  }

  /**
   * Download a file from any user
   * @param owner The username who owns the file
   * @param filename The filename to download
   * @returns Observable with blob data
   */
  downloadFileFromUser(owner: string, filename: string): Observable<Blob> {
    return this.http.get(`${this.API_BASE_URL}/download/${encodeURIComponent(owner)}/${encodeURIComponent(filename)}`, {
      responseType: 'blob'
    });
  }

  /**
   * Delete a file from the backend
   * @param filename The filename to delete
   * @returns Observable with delete response
   */
  deleteFile(filename: string): Observable<{ success: boolean; message: string }> {
    const username = this.authService.getCurrentUsername();
    if (!username) {
      throw new Error('User not authenticated');
    }

    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_BASE_URL}/files/${encodeURIComponent(username)}/${encodeURIComponent(filename)}`
    );
  }

  /**
   * Convert a PDF blob to a file and upload it
   * @param pdfBlob The PDF blob to upload
   * @param filename The desired filename
   * @returns Observable with upload response
   */
  uploadPdf(pdfBlob: Blob, filename: string): Observable<UploadResponse> {
    return this.uploadFile(pdfBlob, filename);
  }

  /**
   * Trigger download of a file from the backend
   * @param filename The filename to download
   */
  triggerDownload(filename: string): void {
    this.downloadFile(filename).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Download failed:', error);
        // Fallback to showing error message
        alert('Failed to download file. Please try again.');
      }
    });
  }
}
