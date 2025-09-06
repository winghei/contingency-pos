import { Component, ChangeDetectionStrategy, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ExportMethodDialogData {
  title: string;
}

@Component({
  selector: 'app-export-method-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>Choose how you want to export your products:</p>
      <div class="export-options">
        <button 
          mat-raised-button 
          color="primary" 
          class="export-option"
          (click)="selectMethod('local')"
        >
          <mat-icon>download</mat-icon>
          Download to Local File
        </button>
        <button 
          mat-raised-button 
          color="accent" 
          class="export-option"
          (click)="selectMethod('server')"
        >
          <mat-icon>cloud_upload</mat-icon>
          Save to Server
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .export-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 16px 0;
    }
    
    .export-option {
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
export class ExportMethodDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExportMethodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportMethodDialogData
  ) {}

  selectMethod(method: string): void {
    this.dialogRef.close(method);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
