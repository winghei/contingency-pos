import { Component, ChangeDetectionStrategy, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserWithExports, ExportImportService } from '../../services/export-import.service';

export interface UserSelectionDialogData {
  currentUser: string;
  title?: string;
}

@Component({
  selector: 'app-user-selection-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title || 'Select User' }}</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading users...</p>
        </div>
      } @else if (users().length === 0) {
        <div class="empty-state">
          <mat-icon>people</mat-icon>
          <p>No users with exports found</p>
          <p class="subtitle">Export some products first to see them here</p>
        </div>
      } @else {
        <div class="users-header">
          <p>Select a user to view their exports:</p>
        </div>
        
        <mat-list>
          @for (user of users(); track user.username) {
            <mat-list-item 
              (click)="selectUser(user)" 
              class="user-item"
              [class.current-user]="user.username === data.currentUser"
            >
              <mat-icon matListItemIcon>person</mat-icon>
              <div matListItemTitle>
                {{ user.username }}
                @if (user.username === data.currentUser) {
                  <span class="current-user-badge">(You)</span>
                }
              </div>
              <div matListItemLine>
                {{ user.exportCount }} export{{ user.exportCount === 1 ? '' : 's' }}
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
      <button mat-button (click)="close()">Cancel</button>
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
    
    .users-header {
      margin-bottom: 16px;
      padding: 0 16px;
    }
    
    .user-item {
      cursor: pointer;
      border-radius: 4px;
      margin: 4px 0;
    }
    
    .user-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .current-user {
      background-color: rgba(25, 118, 210, 0.08);
    }
    
    .current-user-badge {
      color: #1976d2;
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    }
    
    mat-dialog-content {
      min-width: 400px;
      max-height: 500px;
      overflow-y: auto;
    }
    
    mat-list {
      padding-top: 0;
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
    MatProgressSpinnerModule
  ]
})
export class UserSelectionDialogComponent {
  private exportImportService = inject(ExportImportService);
  
  users = signal<UserWithExports[]>([]);
  loading = signal<boolean>(true);

  constructor(
    public dialogRef: MatDialogRef<UserSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserSelectionDialogData
  ) {
    // Load users when dialog opens
    this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    try {
      this.loading.set(true);
      const users = await this.exportImportService.getUsersWithExports();
      this.users.set(users);
    } catch (error) {
      console.error('Failed to load users:', error);
      this.users.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  selectUser(user: UserWithExports): void {
    this.dialogRef.close({ selectedUser: user.username });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
