import { Injectable, signal, computed } from '@angular/core';

export interface User {
  username: string;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_KEY = 'contingency_pos_auth';
  private readonly HARDCODED_PASSWORD = 'ditsch';
  
  private _isAuthenticated = signal<boolean>(false);
  private _currentUser = signal<User | null>(null);

  // Public readonly signals
  isAuthenticated = this._isAuthenticated.asReadonly();
  currentUser = this._currentUser.asReadonly();

  constructor() {
    this.loadAuthFromStorage();
  }

  /**
   * Authenticate user with username and password
   * @param username Any string (not validated)
   * @param password Must be 'ditsch'
   * @returns true if authentication successful, false otherwise
   */
  login(username: string, password: string): boolean {
    if (password === this.HARDCODED_PASSWORD && username.trim().length > 0) {
      const user: User = {
        username: username.trim(),
        isAuthenticated: true
      };
      
      this._currentUser.set(user);
      this._isAuthenticated.set(true);
      
      // Save to localStorage
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
      
      return true;
    }
    
    return false;
  }

  /**
   * Logout the current user
   */
  logout(): void {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    localStorage.removeItem(this.AUTH_KEY);
  }

  /**
   * Load authentication state from localStorage
   */
  loadAuthFromStorage(): void {
    try {
      const storedAuth = localStorage.getItem(this.AUTH_KEY);
      if (storedAuth) {
        const user: User = JSON.parse(storedAuth);
        if (user.isAuthenticated && user.username) {
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
        }
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
      // Clear invalid data
      localStorage.removeItem(this.AUTH_KEY);
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isLoggedIn(): boolean {
    return this._isAuthenticated();
  }

  /**
   * Get current username
   */
  getCurrentUsername(): string | null {
    return this._currentUser()?.username || null;
  }
}
