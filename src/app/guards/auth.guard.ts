import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 */
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  let isAuthenticated = authService.isLoggedIn();
  
  // Fallback check: if service says not logged in but localStorage has valid auth, reload auth
  if (!isAuthenticated) {
    const storedAuth = localStorage.getItem('contingency_pos_auth');
    if (storedAuth) {
      try {
        const user = JSON.parse(storedAuth);
        if (user.isAuthenticated && user.username) {
          // Force reload auth from storage
          authService.loadAuthFromStorage();
          isAuthenticated = authService.isLoggedIn();
        }
      } catch (error) {
        console.error('Auth Guard - error parsing localStorage auth:', error);
      }
    }
  }

  if (isAuthenticated) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
