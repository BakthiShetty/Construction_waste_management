import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPasswordComponent {
  form: FormGroup;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const email = this.form.value.email;

    this.http.post('http://localhost:5004/api/Auth/forgot-password', { email }).subscribe({
      next: () => {
        this.successMessage = 'Password reset link sent! Please check your email.';
        this.errorMessage = '';
        this.form.reset();
      },
      error: err => {
        this.successMessage = '';
        if (err.status === 404) {
          this.errorMessage = 'No user found with this email.';
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
