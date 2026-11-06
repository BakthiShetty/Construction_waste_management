import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RequestService } from '../../../core/services/request';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-form.html',
  styleUrls: ['./request-form.scss']
})
export class RequestFormComponent {
  @Input() materialId!: number;
  isSubmitting = false;

  constructor(
    private requestService: RequestService,
    private router: Router,
    private snackbar: MatSnackBar
  ) {}

  submitRequest(): void {
    if (!this.materialId) return;

    this.isSubmitting = true;
    this.requestService.create({
      materialId: this.materialId,
      quantity: 0
    }).subscribe({
      next: () => {
        this.snackbar.open('Request submitted successfully!', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/requests']);
      },
      error: (err) => {
        this.snackbar.open('Failed to submit request.', 'Dismiss', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }
}
