import { Component, ChangeDetectionStrategy, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

export interface ExportNameDialogData {
  title: string;
}

@Component({
  selector: 'app-export-name-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>Enter a name for your export (optional):</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Export Name</mat-label>
        <input 
          matInput 
          [formControl]="exportNameControl"
          placeholder="e.g., My Product Catalog"
          maxlength="50"
        >
        <mat-hint>Leave empty for auto-generated name</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="confirm()"
        [disabled]="exportNameControl.invalid"
      >
        Continue
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
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
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ]
})
export class ExportNameDialogComponent {
  exportNameControl = new FormControl('', [
    Validators.maxLength(50),
    Validators.pattern(/^[a-zA-Z0-9\s\-_]*$/)
  ]);

  constructor(
    public dialogRef: MatDialogRef<ExportNameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportNameDialogData
  ) {}

  confirm(): void {
    const name = this.exportNameControl.value?.trim() || null;
    this.dialogRef.close(name);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
