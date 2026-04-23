import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  while (authService.isLoading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  while (authService.role() === null && authService.isAuthenticated()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
