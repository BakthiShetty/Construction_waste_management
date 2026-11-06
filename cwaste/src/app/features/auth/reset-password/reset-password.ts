import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';   // ⬅️   RouterModule added
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  /* ⬇️  include RouterModule so routerLink works */
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordsMatch }
    );
  }

  /* ---------- lifecycle ---------- */
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = decodeURIComponent(params['token'] || '');
      const email = params['email'] || '';
      if (email) this.form.patchValue({ email });
    });
  }

  /* ---------- submit ---------- */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, newPassword } = this.form.getRawValue();   // email is disabled so use getRawValue
    const payload = { email, token: this.token, newPassword };

    this.isLoading = true;
    this.http.post('http://localhost:5004/api/Auth/reset-password', payload).subscribe({
      next: () => {
        this.successMessage = 'Password reset successfully! Redirecting to login...';
        this.errorMessage = '';
        this.form.reset();
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Something went wrong. Try again.';
        this.successMessage = '';
      },
      complete: () => (this.isLoading = false)
    });
  }

  /* ---------- custom validator ---------- */
  private passwordsMatch(group: FormGroup) {
    const pw  = group.get('newPassword')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { mismatch: true } : null;
  }
  
}
