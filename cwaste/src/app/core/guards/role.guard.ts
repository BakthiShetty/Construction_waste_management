import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth';


export function roleGuard(expectedRoles: string[]): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.isLoggedIn() && expectedRoles.includes(auth.role ?? '')
      ? true
      : router.createUrlTree(['/unauthorized']);  // make a tiny 401 component later
  };
}
