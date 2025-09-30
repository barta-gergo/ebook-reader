import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { EnvironmentService } from './environment.service';
import { 
  CredentialResponse, 
  GoogleIdConfig, 
  GoogleSignInButtonConfig, 
  User,
  JwtPayload
} from '../types/google-identity.types';

export interface LoginResponse {
  user: User;
  accessToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl: string;
  private readonly clientId = '1085117857479-ll9ski4lpfkjcgkgeg6t82eu0vre09og.apps.googleusercontent.com';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();
  
  private isSigningOut = false;

  constructor(
    private http: HttpClient,
    private environmentService: EnvironmentService
  ) {
    this.apiUrl = this.environmentService.getApiBaseUrl();
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('current_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearStoredAuth();
      }
    }
  }

  private clearStoredAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window.google === 'undefined') {
        // Wait for Google library to load
        const checkGoogle = setInterval(() => {
          if (typeof window.google !== 'undefined') {
            clearInterval(checkGoogle);
            this.setupGoogleAuth();
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkGoogle);
          reject(new Error('Google Identity Services failed to load'));
        }, 10000);
      } else {
        this.setupGoogleAuth();
        resolve();
      }
    });
  }

  private setupGoogleAuth(): void {
    const config: GoogleIdConfig = {
      client_id: this.clientId,
      callback: (response: CredentialResponse) => {
        this.handleGoogleSignIn(response);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    };

    window.google.accounts.id.initialize(config);
  }

  private handleGoogleSignIn(response: CredentialResponse): void {
    // For now, redirect to backend OAuth endpoint
    // In a real implementation, you might want to use popup or handle differently
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  private setAuthData(user: User, token: string): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  renderSignInButton(element: HTMLElement, options?: Partial<GoogleSignInButtonConfig>): void {
    const defaultOptions: GoogleSignInButtonConfig = {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    };

    const buttonConfig = { ...defaultOptions, ...options };
    window.google.accounts.id.renderButton(element, buttonConfig);
  }

  signOut(): void {
    // Prevent multiple simultaneous signout calls
    if (this.isSigningOut) {
      return;
    }
    
    this.isSigningOut = true;

    // Revoke Google token if possible
    const currentUser = this.currentUserSubject.value;
    if (currentUser && window.google) {
      window.google.accounts.id.revoke(currentUser.email, (response) => {
        console.log('Google token revoked:', response);
      });
    }

    // Only call backend logout if we have a token
    const hasToken = this.getAuthToken() !== null;

    // Clear local storage and state first to prevent loops
    this.clearStoredAuth();

    // Call backend logout endpoint only if we had a valid token
    if (hasToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
        next: () => {
          console.log('Logged out successfully');
          this.isSigningOut = false;
        },
        error: (error) => {
          console.error('Logout error:', error);
          this.isSigningOut = false;
        }
      });
    } else {
      this.isSigningOut = false;
    }
  }

  isAuthenticated(): boolean {
    return this.tokenSubject.value !== null && this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthToken(): string | null {
    return this.tokenSubject.value;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    if (token) {
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    return new HttpHeaders();
  }

  refreshUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(user => {
        localStorage.setItem('current_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Failed to refresh user profile:', error);
        if (error.status === 401) {
          this.signOut();
        }
        return of(null as any);
      })
    );
  }

  // Method to handle OAuth callback from URL
  handleOAuthCallback(token: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    }).pipe(
      tap(user => {
        this.setAuthData(user, token);
      }),
      catchError(error => {
        console.error('OAuth callback failed:', error);
        return of(null as any);
      })
    );
  }

  // User Profile Management Methods
  getUserProfile(): Promise<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  updateUserProfile(profileData: any): Promise<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, profileData, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  getUserSettings(): Promise<any> {
    return this.http.get(`${this.apiUrl}/auth/settings`, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  updateUserSettings(settingsData: any): Promise<any> {
    return this.http.put(`${this.apiUrl}/auth/settings`, settingsData, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  resetUserSettings(): Promise<any> {
    return this.http.post(`${this.apiUrl}/auth/settings/reset`, {}, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  // Helper method to decode JWT payload (for debugging)
  private decodeJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }
}