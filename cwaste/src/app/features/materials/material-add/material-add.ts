/* src/app/features/materials/material-add/material-add.component.ts */
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MaterialService } from '../../../core/services/material';

@Component({
  selector: 'app-material-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './material-add.html',
  styleUrls: ['./material-add.scss'],
})
export class MaterialAddComponent implements OnInit, OnDestroy {
  form: FormGroup;
  selectedFile?: File;

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  private observer!: IntersectionObserver;
  private uploadSub?: Subscription;

  /** Options shown in the “Material Type” dropdown */
  readonly materialTypes = [
    { value: 'bricks', label: '🧱 Bricks' },
    { value: 'cement', label: '🏗️ Cement' },
    { value: 'steel', label: '🔩 Steel' },
    { value: 'wood',  label: '🪵 Wood' },
    { value: 'sand',  label: '🏖️ Sand' },
    { value: 'tiles', label: '🔲 Tiles' },
    { value: 'glass', label: '🪟 Glass' },
    { value: 'paint', label: '🎨 Paint' },
    { value: 'pipes', label: '🚰 Pipes' },
    { value: 'other', label: '📦 Other' },
  ];

  constructor(
    private fb: FormBuilder,
    private materialService: MaterialService,
    private router: Router
  ) {
    /** Reactive‑form definition */
    this.form = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(2)],
      ],
      type: ['', Validators.required],
      description: ['', Validators.maxLength(500)],
      quantity: [
        1,
        [Validators.required, Validators.min(1), Validators.max(10_000)],
      ],
      location: [
        '',
        [Validators.required, Validators.minLength(2)],
      ],
      price: [
        0,
        [Validators.min(0)],
      ],                                   // NEW
    });
  }

  /* ───────────────────────────── lifecycle ───────────────────────────── */

  ngOnInit(): void {
    // small delay so IntersectionObserver sees the elements
    setTimeout(() => this.initScrollAnimations(), 100);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.uploadSub?.unsubscribe();
  }

  /* ───────────────────────────── animations ──────────────────────────── */

  private initScrollAnimations(): void {
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('animate');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document
      .querySelectorAll('.fade-in')
      .forEach(el => this.observer.observe(el));
  }

  /* ───────────────────────────── form helpers ────────────────────────── */

  /** Friendly field labels for error messages */
  private getFieldLabel(field: string): string {
    const map: Record<string, string> = {
      name: 'Material name',
      type: 'Material type',
      description: 'Description',
      quantity: 'Quantity',
      location: 'Location',
      price: 'Price',
      // image handled separately
    };
    return map[field] ?? field;
  }

  /** Build a human‑readable error for a control */
  getFieldError(fieldName: string): string {
    const ctrl = this.form.get(fieldName);
    if (!(ctrl?.errors && ctrl.touched)) return '';

    if (ctrl.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (ctrl.errors['minlength']) {
      const n = ctrl.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${n} characters`;
    }
    if (ctrl.errors['maxlength']) {
      const n = ctrl.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must not exceed ${n} characters`;
    }
    if (ctrl.errors['min']) {
      return 'Value cannot be negative';
    }
    if (ctrl.errors['max']) {
      return `Quantity must not exceed ${ctrl.errors['max'].max}`;
    }
    return '';
  }

  /* ───────────────────────────── file handling ───────────────────────── */

  /** Triggered by `<input type="file" … (change)="onFileSelected($event)">` */
  onFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.selectedFile = input.files?.[0]; // undefined if user cancels
  }

  /* ───────────────────────────── submission ──────────────────────────── */

  submit(): void {
    // show validation errors if any
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      return;
    }

    const fd = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => {
      // skip empty optional fields
      if (v === null || v === undefined || v === '') return;
      fd.append(k, v as any);
    });
    if (this.selectedFile) fd.append('image', this.selectedFile);

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.uploadSub = this.materialService.create(fd).subscribe({
      next: () => {
        this.successMessage =
          'Material added successfully! Redirecting to dashboard…';
        this.form.reset();
        this.selectedFile = undefined;

        setTimeout(() => this.router.navigate(['/dashboard/donor']), 2000);
      },
      error: err => {
        this.errorMessage =
          err?.error?.message ?? 'Failed to create material. Please try again.';
      },
      complete: () => (this.isLoading = false),
    });
  }

  /* ───────────────────────────── navigation ──────────────────────────── */

  goBack(): void {
    this.router.navigate(['/dashboard/donor']);
  }
}
