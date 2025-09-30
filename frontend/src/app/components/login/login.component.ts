import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleSignInButton', { static: true }) 
  googleSignInButton!: ElementRef<HTMLDivElement>;

  isLoading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      // User is already authenticated, no need to navigate since parent handles this
      return;
    }

    // Initialize Google Auth
    this.authService.initializeGoogleAuth()
      .then(() => {
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Failed to initialize Google Auth:', error);
        this.error = 'Failed to initialize Google authentication. Please refresh the page and try again.';
        this.isLoading = false;
      });
  }

  ngAfterViewInit(): void {
    // Subscribe to auth state changes - parent app component handles navigation
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // User successfully logged in, parent app component will handle display
        console.log('User logged in successfully');
      }
    });

    // Render Google Sign-In button after view init
    setTimeout(() => {
      if (!this.isLoading && this.googleSignInButton) {
        this.authService.renderSignInButton(this.googleSignInButton.nativeElement, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular'
        });
      }
    }, 100);
  }

  retryInitialization(): void {
    this.isLoading = true;
    this.error = null;
    this.ngOnInit();
  }

  signInWithGoogle(): void {
    // Direct redirect to backend OAuth endpoint  
    window.location.href = 'http://localhost:3000/auth/google';
  }
}