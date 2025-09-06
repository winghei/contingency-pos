import { Component, ChangeDetectionStrategy, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ImportMethodDialogData {
  title: string;
}

@Component({
  selector: 'app-import-method-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>Choose how you want to import products:</p>
      <div class="import-options">
        <button 
          mat-raised-button 
          color="primary" 
          class="import-option"
          (click)="selectMethod('local')"
        >
          <mat-icon>upload</mat-icon>
          Import from Local File
        </button>
        <button 
          mat-raised-button 
          color="accent" 
          class="import-option"
          (click)="selectMethod('server')"
        >
          <mat-icon>cloud_download</mat-icon>
          Load from Server
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .import-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 16px 0;
    }
    
    .import-option {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-start;
      padding: 16px;
      min-height: 60px;
    }
    
    mat-dialog-content {
      min-width: 300px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class ImportMethodDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImportMethodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportMethodDialogData
  ) {}

  selectMethod(method: string): void {
    this.dialogRef.close(method);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
