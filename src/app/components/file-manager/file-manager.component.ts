import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadService, FileInfo } from '../../services/file-upload.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-file-manager',
  template: `
    <div class="file-manager">
      <div class="header">
        <h3>All Exported Files</h3>
        <p class="user-info">Logged in as: {{ currentUsername() }} • You can download any file but only delete your own</p>
      </div>

      @if (isLoading()) {
        <div class="loading">
          <p>Loading files...</p>
        </div>
      } @else if (files().length === 0) {
        <div class="empty-state">
          <p>No files found. Export some orders to see them here.</p>
        </div>
      } @else {
        <div class="files-list">
          @for (file of files(); track file.filename) {
            <div class="file-item">
              <div class="file-info">
                <div class="file-name">{{ file.originalName }}</div>
                <div class="file-details">
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <span class="file-date">{{ formatDate(file.uploadedAt) }}</span>
                  @if (file.owner) {
                    <span class="file-owner">by {{ file.owner }}</span>
                  }
                </div>
              </div>
              <div class="file-actions">
                <button 
                  class="btn btn-primary btn-sm" 
                  (click)="downloadFile(file)"
                  [disabled]="isDownloading()">
                  @if (isDownloading()) {
                    Downloading...
                  } @else {
                    Download
                  }
                </button>
                <button 
                  class="btn btn-danger btn-sm" 
                  (click)="deleteFile(file)"
                  [disabled]="isDeleting() || !canDeleteFile(file)"
                  [title]="!canDeleteFile(file) ? 'You can only delete your own files' : ''">
                  @if (isDeleting()) {
                    Deleting...
                  } @else {
                    Delete
                  }
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (error()) {
        <div class="error-message">
          <p>{{ error() }}</p>
          <button class="btn btn-secondary btn-sm" (click)="loadFiles()">Retry</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .file-manager {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 20px;
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 15px;
    }

    .header h3 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .user-info {
      margin: 0;
      color: #666;
      font-size: 0.9em;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .files-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      background: #fff;
      transition: box-shadow 0.2s ease;
    }

    .file-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .file-details {
      display: flex;
      gap: 15px;
      font-size: 0.85em;
      color: #666;
    }

    .file-owner {
      color: #007bff;
      font-weight: 500;
    }

    .file-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85em;
      transition: background-color 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #c82333;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 0.8em;
    }

    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #f5c6cb;
      margin-top: 20px;
    }

    .error-message p {
      margin: 0 0 10px 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class FileManagerComponent {
  private fileUploadService = inject(FileUploadService);
  private authService = inject(AuthService);

  // Signals
  private _files = signal<FileInfo[]>([]);
  private _isLoading = signal(false);
  private _isDownloading = signal(false);
  private _isDeleting = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  files = this._files.asReadonly();
  isLoading = this._isLoading.asReadonly();
  isDownloading = this._isDownloading.asReadonly();
  isDeleting = this._isDeleting.asReadonly();
  error = this._error.asReadonly();

  // Computed
  currentUsername = computed(() => this.authService.getCurrentUsername() || 'Unknown');

  // Helper method to check if user can delete a file
  canDeleteFile(file: FileInfo): boolean {
    return !file.owner || file.owner === this.currentUsername();
  }

  ngOnInit() {
    this.loadFiles();
  }

  loadFiles() {
    // Check if user is authenticated before trying to load files
    if (!this.authService.isLoggedIn()) {
      this._error.set('Please log in to view files.');
      this._isLoading.set(false);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    // Load all files from all users
    this.fileUploadService.getAllFiles().subscribe({
      next: (response) => {
        this._files.set(response.files);
        this._isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load files:', error);
        this._error.set('Failed to load files. Please check if the backend server is running.');
        this._isLoading.set(false);
      }
    });
  }

  downloadFile(file: FileInfo) {
    // Check if user is authenticated before trying to download
    if (!this.authService.isLoggedIn()) {
      this._error.set('Please log in to download files.');
      return;
    }

    this._isDownloading.set(true);
    this._error.set(null);

    // Use the appropriate download method based on file ownership
    const downloadObservable = file.owner && file.owner !== this.currentUsername() 
      ? this.fileUploadService.downloadFileFromUser(file.owner, file.filename)
      : this.fileUploadService.downloadFile(file.filename);

    downloadObservable.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName || file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this._isDownloading.set(false);
      },
      error: (error) => {
        console.error('Download failed:', error);
        this._error.set('Failed to download file. Please try again.');
        this._isDownloading.set(false);
      }
    });
  }

  deleteFile(file: FileInfo) {
    // Check if user is authenticated before trying to delete
    if (!this.authService.isLoggedIn()) {
      this._error.set('Please log in to delete files.');
      return;
    }

    // Only allow deletion of own files
    if (file.owner && file.owner !== this.currentUsername()) {
      this._error.set('You can only delete your own files.');
      return;
    }

    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    this._isDeleting.set(true);
    this._error.set(null);

    this.fileUploadService.deleteFile(file.filename).subscribe({
      next: () => {
        // Remove file from local list
        this._files.update(files => files.filter(f => f.filename !== file.filename));
        this._isDeleting.set(false);
      },
      error: (error) => {
        console.error('Delete failed:', error);
        this._error.set('Failed to delete file. Please try again.');
        this._isDeleting.set(false);
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  trackByFilename(index: number, file: FileInfo): string {
    return file.filename;
  }
}
