import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    // Redirect to login if not authenticated
    return this.router.createUrlTree(['/login']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user && user.role === 'admin') {
        // Validate token with backend to ensure it's still valid
        return this.authService.validateToken().pipe(
          map(isValid => {
            if (isValid) {
              return true;
            } else {
              // Token is invalid, redirect to login
              return this.router.createUrlTree(['/login']);
            }
          }),
          catchError(() => {
            // If validation fails, redirect to login
            return of(this.router.createUrlTree(['/login']));
          })
        );
      }
    }
    
    // Redirect to home if not authenticated as admin
    return this.router.createUrlTree(['/']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return true;
    }
    
    // Redirect to dashboard if already authenticated
    return this.router.createUrlTree(['/dashboard']);
  }
}