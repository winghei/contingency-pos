import { Component, ChangeDetectionStrategy, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SavedExport, ExportImportService } from '../../services/export-import.service';

export interface ExportManagementDialogData {
  exports: SavedExport[];
  username: string;
  currentUser: string;
}

@Component({
  selector: 'app-export-management-dialog',
  template: `
    <h2 mat-dialog-title>
      Manage Saved Exports
      @if (data.username !== data.currentUser) {
        <span class="user-context">({{ data.username }}'s exports)</span>
      }
    </h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading exports...</p>
        </div>
      } @else if (exports().length === 0) {
        <div class="empty-state">
          <mat-icon>archive</mat-icon>
          <p>No saved exports found</p>
          <p class="subtitle">Export your products to save them to the server</p>
        </div>
      } @else {
        <div class="exports-header">
          @if (data.username === data.currentUser) {
            <p>You have {{ exports().length }} saved export{{ exports().length === 1 ? '' : 's' }}</p>
          } @else {
            <p>{{ data.username }} has {{ exports().length }} saved export{{ exports().length === 1 ? '' : 's' }}</p>
            <p class="read-only-notice">You can view and import these exports, but cannot delete them.</p>
          }
        </div>
        
        <mat-list>
          @for (export of exports(); track export.id) {
            <mat-list-item class="export-item">
              <mat-icon matListItemIcon>archive</mat-icon>
              <div matListItemTitle>{{ export.name || export.originalName || 'Unnamed Export' }}</div>
              <div matListItemLine>
                {{ export.productCount }} products • {{ formatDate(export.exportedAt || export.uploadedAt || '') }}
                @if (export.size) {
                  • {{ formatFileSize(export.size) }}
                }
              </div>
              <div matListItemMeta>
                <button 
                  mat-icon-button 
                  (click)="importExport(export)"
                  matTooltip="Import this export"
                  color="primary"
                >
                  <mat-icon>cloud_download</mat-icon>
                </button>
                @if (data.username === data.currentUser) {
                  <button 
                    mat-icon-button 
                    (click)="deleteExport(export)"
                    [disabled]="deleting()"
                    matTooltip="Delete export"
                    color="warn"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                } @else {
                  <span class="read-only-indicator" matTooltip="Cannot delete other users' exports">
                    <mat-icon>lock</mat-icon>
                  </span>
                }
              </div>
            </mat-list-item>
            @if (!$last) {
              <mat-divider></mat-divider>
            }
          }
        </mat-list>
      }
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      gap: 16px;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      gap: 16px;
      text-align: center;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }
    
    .subtitle {
      color: #666;
      font-size: 14px;
    }
    
    .exports-header {
      margin-bottom: 16px;
      padding: 0 16px;
    }
    
    .export-item {
      cursor: pointer;
      border-radius: 4px;
      margin: 4px 0;
    }
    
    .export-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    mat-dialog-content {
      min-width: 500px;
      max-height: 500px;
      overflow-y: auto;
    }
    
    mat-list {
      padding-top: 0;
    }
    
    mat-dialog-actions {
      justify-content: space-between;
    }
    
    .user-context {
      font-size: 14px;
      color: #666;
      font-weight: normal;
    }
    
    .read-only-notice {
      color: #666;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .read-only-indicator {
      color: #ccc;
      display: flex;
      align-items: center;
    }
    
    .mat-mdc-list-item-meta {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class ExportManagementDialogComponent {
  private snackBar = inject(MatSnackBar);
  private exportImportService = inject(ExportImportService);
  
  exports = signal<SavedExport[]>([]);
  loading = signal<boolean>(false);
  deleting = signal<boolean>(false);

  constructor(
    public dialogRef: MatDialogRef<ExportManagementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportManagementDialogData
  ) {
    console.log('ExportManagementDialog received data:', data);
    this.exports.set(data.exports || []);
    
    // Debug: Log each export to see what names we're getting
    if (data.exports) {
      data.exports.forEach((exp, index) => {
        console.log(`Export ${index + 1}:`, {
          id: exp.id,
          name: exp.name,
          originalName: exp.originalName,
          filename: exp.filename,
          productCount: exp.productCount
        });
      });
    }
  }

  formatDate(dateString: string): string {
    try {
      if (!dateString) {
        return 'Unknown date';
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Unknown date';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async deleteExport(exportItem: SavedExport): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${exportItem.name}"? This action cannot be undone.`)) {
      return;
    }

    this.deleting.set(true);
    
    try {
      const success = await this.exportImportService.deleteExportFromServer(this.data.username, exportItem.filename!);
      
      if (success) {
        // Remove it from the local list
        this.exports.update(exports => exports.filter(exp => exp.id !== exportItem.id));
        
        this.snackBar.open(`Export "${exportItem.name}" deleted successfully`, "Close", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
      } else {
        throw new Error('Server returned failure status');
      }
    } catch (error) {
      this.snackBar.open(`Failed to delete export: ${(error as Error).message}`, "Close", {
        duration: 5000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    } finally {
      this.deleting.set(false);
    }
  }

  importExport(exportItem: SavedExport): void {
    this.dialogRef.close({ action: 'import', export: exportItem });
  }

  close(): void {
    this.dialogRef.close({ action: 'close' });
  }
}
