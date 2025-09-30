import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-content">
        <div *ngIf="isProcessing" class="processing">
          <div class="spinner"></div>
          <h2>Completing sign in...</h2>
          <p>Please wait while we finish setting up your account.</p>
        </div>
        
        <div *ngIf="error" class="error">
          <h2>Sign In Failed</h2>
          <p>{{ error }}</p>
          <button (click)="retrySignIn()" class="retry-button">
            Try Again
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .callback-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      text-align: center;
      max-width: 400px;
    }

    .processing {
      h2 {
        color: #2d3748;
        margin-bottom: 1rem;
      }

      p {
        color: #718096;
        margin-bottom: 2rem;
      }
    }

    .error {
      h2 {
        color: #e53e3e;
        margin-bottom: 1rem;
      }

      p {
        color: #718096;
        margin-bottom: 2rem;
      }

      .retry-button {
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background: #5a67d8;
        }
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 2rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  isProcessing = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (error) {
        this.isProcessing = false;
        this.error = 'Authentication failed. Please try signing in again.';
        return;
      }

      if (token) {
        this.handleAuthCallback(token);
      } else {
        this.isProcessing = false;
        this.error = 'No authentication token received. Please try signing in again.';
      }
    });
  }

  private handleAuthCallback(token: string): void {
    this.authService.handleOAuthCallback(token).subscribe({
      next: (user) => {
        if (user) {
          // Success! Redirect to main app
          this.router.navigate(['/']);
        } else {
          this.isProcessing = false;
          this.error = 'Failed to retrieve user information. Please try signing in again.';
        }
      },
      error: (error) => {
        console.error('OAuth callback error:', error);
        this.isProcessing = false;
        this.error = 'Authentication failed. Please try signing in again.';
      }
    });
  }

  retrySignIn(): void {
    this.router.navigate(['/']);
  }
}