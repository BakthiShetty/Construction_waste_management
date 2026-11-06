import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // ✅ added

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule], // ✅ added HttpClientModule
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class ContactComponent implements OnDestroy {
  
  contactForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  private destroy$ = new Subject<void>();
  
  contactInfo = [
    {
      icon: '📧',
      title: 'Email',
      value: 'praaj@eg.dk',
      link: 'mailto:praaj@eg.dk'
    },
    {
      icon: '📞',
      title: 'Phone',
      value: '+91 9901394608',
      link: 'tel:+919901394608'
    },
    {
      icon: '📍',
      title: 'Address',
      value: 'Panvel - Kochi - Kanyakumari Hwy, Malemar, Derebail, Mangaluru, Karnataka 575006',
      link: 'https://maps.app.goo.gl/bF6U21Z851zuGUbcA'
    },
    {
      icon: '🕒',
      title: 'Working Hours',
      value: 'Mon–Fri 9:00 AM – 6:00 PM',
      link: null
    }
  ];

  constructor(private fb: FormBuilder, private http: HttpClient,  private router: Router) {
    
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      body: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.contactForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.errorMessage = '';
        this.successMessage = '';
      });
    
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.contactForm.invalid || this.isLoading) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = {
    ...this.contactForm.value,
    toEmail: 'bakthishetty31@gmail.com'
  };


    this.http.post('http://localhost:5004/api/Contact', formData)
      .subscribe({
        next: (res: any) => {
          this.successMessage = 'Thank you for your message! We\'ll get back to you within 24 hours.';
          this.contactForm.reset();
        },
        error: (error) => {
          console.error('Contact form error:', error);
          this.errorMessage = 'Failed to send message. Please try again later.';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Name',
      'email': 'Email',
      'subject': 'Subject',
      'body': 'Message'
    };
    return displayNames[fieldName] || fieldName;
  }
      // Navigation
  goBack(): void {
    this.router.navigate([""])
  }
}
