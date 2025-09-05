import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

@Component({
  selector: 'app-pwa-install',
  template: `
    @if (showInstallPrompt()) {
      <mat-card class="pwa-install-card">
        <mat-card-content>
          <div class="install-content">
            <div class="install-icon">
              <mat-icon>get_app</mat-icon>
            </div>
            <div class="install-text">
              <h3>Install Contingency POS</h3>
              <p>Install this app on your device for quick access and offline functionality.</p>
            </div>
            <div class="install-actions">
              <button mat-raised-button color="primary" (click)="installApp()">
                <mat-icon>install_mobile</mat-icon>
                Install
              </button>
              <button mat-button (click)="dismissPrompt()">
                <mat-icon>close</mat-icon>
                Not now
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .pwa-install-card {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 400px;
      margin: 0 auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
    }

    .install-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .install-icon {
      color: var(--primary-color);
      
      mat-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
      }
    }

    .install-text {
      flex: 1;
      
      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        color: #333;
      }
      
      p {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
        line-height: 1.4;
      }
    }

    .install-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      button {
        min-width: 120px;
      }
    }

    @media (max-width: 768px) {
      .pwa-install-card {
        bottom: 10px;
        left: 10px;
        right: 10px;
      }
      
      .install-content {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
      }
      
      .install-actions {
        flex-direction: row;
        justify-content: center;
        width: 100%;
        
        button {
          flex: 1;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
})
export class PwaInstallComponent {
  private deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
  showInstallPrompt = signal(false);

  constructor() {
    this.setupInstallPrompt();
  }

  private setupInstallPrompt(): void {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt.set(e as BeforeInstallPromptEvent);
      // Show the install prompt
      this.showInstallPrompt.set(true);
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.showInstallPrompt.set(false);
      this.deferredPrompt.set(null);
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA is already installed');
      this.showInstallPrompt.set(false);
    }
  }

  async installApp(): Promise<void> {
    const prompt = this.deferredPrompt();
    if (!prompt) {
      return;
    }

    // Show the install prompt
    await prompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await prompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    this.deferredPrompt.set(null);
    this.showInstallPrompt.set(false);
  }

  dismissPrompt(): void {
    this.showInstallPrompt.set(false);
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }
}
