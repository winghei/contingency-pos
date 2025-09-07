import { Component, ChangeDetectionStrategy, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { SavedExport } from '../../services/export-import.service';

export interface ExportSelectionDialogData {
  exports: SavedExport[];
}

@Component({
  selector: 'app-export-selection-dialog',
  template: `
    <h2 mat-dialog-title>Select Export to Import</h2>
    <mat-dialog-content>
      <p>Choose an export to import:</p>
      <mat-list>
        @for (export of data.exports; track export.id) {
          <mat-list-item (click)="selectExport(export)" class="export-item">
            <mat-icon matListItemIcon>archive</mat-icon>
            <div matListItemTitle>{{ export.name }}</div>
            <div matListItemLine>
              {{ export.productCount }} products • {{ formatDate(export.exportedAt || export.uploadedAt || '') }}
            </div>
          </mat-list-item>
          @if (!$last) {
            <mat-divider></mat-divider>
          }
        }
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
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
      max-width: 90vw;
      max-height: 400px;
      padding: 16px;
    }
    
    mat-list {
      padding-top: 0;
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      mat-dialog-content {
        min-width: 320px;
        max-width: 95vw;
        max-height: 60vh;
        padding: 12px;
      }
      
      .export-item {
        min-height: 80px;
        padding: 12px 8px;
      }
      
      .export-item mat-icon[matListItemIcon] {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      
      h2[mat-dialog-title] {
        font-size: 20px;
        padding: 16px 12px 8px 12px;
      }
      
      mat-dialog-content p {
        font-size: 14px;
        margin-bottom: 16px;
        padding: 0 8px;
      }
      
      mat-dialog-actions {
        padding: 8px 12px 16px 12px;
      }
      
      mat-dialog-actions button {
        min-height: 44px;
        font-size: 16px;
      }
    }
    
    /* Extra small screens */
    @media (max-width: 480px) {
      mat-dialog-content {
        min-width: 300px;
        max-width: 98vw;
        max-height: 70vh;
        padding: 8px;
      }
      
      .export-item {
        min-height: 90px;
        padding: 16px 8px;
      }
      
      .export-item mat-icon[matListItemIcon] {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
      
      mat-dialog-content p {
        font-size: 16px;
        margin-bottom: 20px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule
  ]
})
export class ExportSelectionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExportSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportSelectionDialogData
  ) {
    // Debug logging to help troubleshoot date issues
    console.log('ExportSelectionDialog received data:', data);
    if (data.exports) {
      data.exports.forEach((exp, index) => {
        console.log(`Export ${index + 1}:`, {
          name: exp.name,
          exportedAt: exp.exportedAt,
          uploadedAt: exp.uploadedAt,
          productCount: exp.productCount
        });
      });
    }
  }

  selectExport(exportItem: SavedExport): void {
    this.dialogRef.close(exportItem);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  formatDate(dateString: string): string {
    try {
      if (!dateString) {
        return 'Unknown date';
      }
      
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Unknown date';
    }
  }
}
