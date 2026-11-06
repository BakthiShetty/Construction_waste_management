import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnDestroy {
  form: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Clear error message when user starts typing
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.errorMessage) {
          this.errorMessage = '';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (this.form.invalid || this.isLoading) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = this.form.getRawValue() as { email: string; password: string };

    this.auth.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.handleLoginError(error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  private handleLoginSuccess(response: any): void {
    try {
      this.auth.saveToken(response.token);
      const role = this.auth.getRoleFromToken();
      
      // Navigate based on role
      const roleRoutes: { [key: string]: string } = {
        'Admin': '/dashboard/admin',
        'Donor': '/dashboard/donor',
        'Receiver': '/dashboard/receiver'
      };

      if (role === 'Admin') {
          this.router.navigate(['/dashboard/admin']);
        } else if (role === 'Donor') {
          this.router.navigate(['/dashboard/donor']);
        } else if (role === 'Receiver') {
          this.router.navigate(['/dashboard/receiver']);
        } else {
          this.router.navigate(['/']); // fallback
        }
      
    } catch (error) {
      this.errorMessage = 'Login successful but navigation failed. Please try again.';
      console.error('Navigation error:', error);
    }
  }

  private handleLoginError(error: any): void {
    console.error('Login error:', error);
    
    if (error.status === 401) {
      const message = error.error?.message;
      if (message === 'Your account is blocked by the admin.') {
        this.errorMessage = message;
      } else {
        this.errorMessage = 'Invalid email or password. Please try again.';
      }
    } else if (error.status === 429) {
      this.errorMessage = 'Too many login attempts. Please try again later.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else {
      this.errorMessage = error.error?.message || 'Login failed. Please try again.';
    }

  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  // Utility method to get error message for a field
  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
        // Navigation
  goBack(): void {
    this.router.navigate([""])
  }
}