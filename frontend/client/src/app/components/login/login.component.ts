import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

import { lowerCaseValidator } from './lowerCase.validator';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';
  loginType: 'user' | 'admin' = 'user';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email, lowerCaseValidator()]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  setLoginType(type: 'user' | 'admin'): void {
    this.loginType = type;
    // Auto-fill credentials for admin
    if (type === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@gmail.com',
        password: 'admin@123'
      });
    } else {
      // Clear form for user login
      this.loginForm.patchValue({
        email: '',
        password: ''
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Clear any pending booking data before login
    sessionStorage.removeItem('pendingBookingId');
    sessionStorage.removeItem('pendingPaymentMethod');

    const { email, password } = this.loginForm.value;
    
    // Handle different login types
    if (this.loginType === 'admin' && email === 'admin@gmail.com') {
      // Special admin login
      this.authService.login(email, password)
        .subscribe({
          next: (response) => {
            this.loading = false;
            console.log('Admin login successful in tab:', window.name);
            
            // Check if there's a return URL in query params
            const returnUrl = this.router.url.split('?')[1] ? 
              new URLSearchParams(this.router.url.split('?')[1]).get('returnUrl') : null;
            
            if (returnUrl) {
              this.router.navigateByUrl(returnUrl);
            } else {
              this.router.navigate(['/admin/dashboard']);
            }
          },
          error: (error) => {
            this.loading = false;
            this.error = error.error?.message || 'Admin login failed';
            console.error('Admin login error:', error);
          }
        });
    } else {
      // Regular user login
      this.authService.login(email, password)
        .subscribe({
          next: (response) => {
            this.loading = false;
            console.log('User login successful in tab:', window.name, response);
            
            // Check if there's a return URL in query params
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get('returnUrl');
            const orderOnly = urlParams.get('orderOnly');
            const totalPrice = urlParams.get('totalPrice');
            
            // Check if there's a pending order-only in session storage
            const pendingOrderOnly = sessionStorage.getItem('pendingOrderOnly');
            
            if (pendingOrderOnly) {
              // Process the pending order-only request
              const orderData = JSON.parse(pendingOrderOnly);
              sessionStorage.removeItem('pendingOrderOnly'); // Clean up
              
              // Navigate to booking with order-only params
              this.router.navigate(['/booking'], {
                queryParams: {
                  orderOnly: 'true',
                  totalPrice: orderData.totalPrice
                }
              });
            } else if (returnUrl && orderOnly === 'true' && totalPrice) {
              // Navigate back to booking with order-only params
              this.router.navigate([returnUrl], {
                queryParams: {
                  orderOnly: 'true',
                  totalPrice: parseFloat(totalPrice)
                }
              });
            } else if (returnUrl) {
              // Navigate to return URL if provided
              this.router.navigateByUrl(returnUrl);
            } else {
              // Default navigation
              this.router.navigate(['/home']);
            }
          },
          error: (error) => {
            this.loading = false;
            this.error = error.error?.message || 'Login failed';
            console.error('Login error:', error);
          }
        });
    }
  }
}