import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  token: string;
  user: User;
}

export interface PasswordChangeLog {
  _id: string;
  userId?: { _id: string; name: string; email: string; role: string };
  email: string;
  createdAt: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private token: string | null = null;
  private tabId!: string; // Will be initialized in constructor

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Generate unique tab ID
    if (isPlatformBrowser(this.platformId)) {
      this.tabId = this.getOrCreateTabId();
      console.log('AuthService initialized for tab:', this.tabId);
      
      // Check if user is already logged in this specific tab
      const savedUser = this.getFromSessionStorage('currentUser');
      const savedToken = this.getFromSessionStorage('token');
      console.log('Saved user in tab:', savedUser);
      console.log('Saved token in tab:', savedToken);
      
      if (savedUser && savedToken) {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
        this.token = savedToken;
        console.log('User restored from sessionStorage for tab:', this.tabId);
        console.log('Restored user role:', user.role);
      } else {
        console.log('No user found in sessionStorage for tab:', this.tabId);
      }
      
      // Listen for storage events to handle cross-tab logout
      this.setupStorageListener();
    }
  }

  // Setup storage event listener for cross-tab communication
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      // Only handle logout events from other tabs
      if (event.key === 'logout-event' && event.newValue) {
        const logoutTabId = event.newValue;
        // If this is not our tab, clear our session
        if (logoutTabId !== this.tabId) {
          console.log(`Logout detected from tab ${logoutTabId}, but keeping current tab ${this.tabId} session`);
          // Don't automatically logout - let user decide
          // This allows multiple tabs with different users
        }
      }
    });
  }

  // Generate or get existing tab ID
  private getOrCreateTabId(): string {
    // Try to get existing tab ID from window name (persists on refresh)
    if (window.name && window.name.startsWith('tab_')) {
      return window.name;
    }
    
    // Generate new unique ID for this tab
    const newTabId = 'tab_' + Math.random().toString(36).substr(2, 9);
    window.name = newTabId; // Store in window.name for persistence
    return newTabId;
  }

  // Get tab-specific key for sessionStorage
  private getTabKey(key: string): string {
    return `${key}_${this.tabId}`;
  }

  // Get value from tab-specific sessionStorage
  private getFromSessionStorage(key: string): string | null {
    try {
      return sessionStorage.getItem(this.getTabKey(key));
    } catch (e) {
      return null;
    }
  }

  // Set value in tab-specific sessionStorage
  private setInSessionStorage(key: string, value: string): void {
    try {
      sessionStorage.setItem(this.getTabKey(key), value);
    } catch (e) {
      console.error('SessionStorage error:', e);
    }
  }

  // Remove value from tab-specific sessionStorage
  private removeFromSessionStorage(key: string): void {
    try {
      sessionStorage.removeItem(this.getTabKey(key));
    } catch (e) {
      console.error('SessionStorage error:', e);
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.token) {
            this.setSession(response.user, response.token);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(error);
        })
      );
  }

  register(name: string, email: string, password: string, role?: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { name, email, password, role })
      .pipe(
        tap(response => {
          if (response.token) {
            this.setSession(response.user, response.token);
          }
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(error);
        })
      );
  }

  logout(): void {
    // Check if running in browser before accessing sessionStorage
    if (isPlatformBrowser(this.platformId)) {
      this.removeFromSessionStorage('currentUser');
      this.removeFromSessionStorage('token');
      // Clear any pending booking/payment data
      this.removeFromSessionStorage('pendingBookingId');
      this.removeFromSessionStorage('pendingPaymentMethod');
      
      // Broadcast logout to other tabs (optional)
      try {
        localStorage.setItem('logout-event', this.tabId);
        localStorage.removeItem('logout-event'); // Clean up immediately
      } catch (e) {
        console.error('Failed to broadcast logout event:', e);
      }
    }
    this.currentUserSubject.next(null);
    this.token = null;
  }

  isAuthenticated(): boolean {
    // Check if running in browser before accessing localStorage
    if (isPlatformBrowser(this.platformId)) {
      return !!this.token;
    }
    return false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.token;
  }

  private setSession(user: User, token: string): void {
    // Check if running in browser before accessing sessionStorage
    if (isPlatformBrowser(this.platformId)) {
      this.setInSessionStorage('currentUser', JSON.stringify(user));
      this.setInSessionStorage('token', token);
    }
    this.currentUserSubject.next(user);
    this.token = token;
  }

  private getAuthHeaders(): HttpHeaders {
    const headers = new HttpHeaders();
    if (this.token) {
      return headers.set('Authorization', `Bearer ${this.token}`);
    }
    return headers;
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('Get profile error:', error);
          // If profile request fails, token might be invalid
          if (error.status === 401 || error.status === 403) {
            console.log('Token appears to be invalid, logging out');
            this.logout();
          }
          return throwError(error);
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{message: string}> {
    return this.http.post(`${this.apiUrl}/change-password`, 
      { currentPassword, newPassword },
      { headers: this.getAuthHeaders(), observe: 'response', responseType: 'text' as const }
    ).pipe(
      map(res => {
        const body = res.body ?? '';
        try {
          const parsed = JSON.parse(body as unknown as string);
          return { message: parsed?.message || 'Password updated successfully' };
        } catch {
          return { message: String(body || 'Password updated successfully') };
        }
      }),
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(error);
      })
    );
  }

  getPasswordChangeLogs(): Observable<PasswordChangeLog[]> {
    return this.http.get<PasswordChangeLog[]>(
      `${this.apiUrl}/password-changes`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Fetch password changes error:', error);
        return throwError(error);
      })
    );
  }

  // Validate token with backend
  validateToken(): Observable<boolean> {
    return this.getProfile().pipe(
      map(user => {
        console.log('Token validation successful, user:', user);
        return true;
      }),
      catchError(error => {
        console.log('Token validation failed:', error);
        return of(false);
      })
    );
  }
}
