import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService } from '../../../core/services/request';
import { Router, RouterModule } from '@angular/router';
import { SignalRService } from '../../../core/services/signalr';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-donor-request-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './donor-request-list.html',
  styleUrls: ['./donor-request-list.scss']
})
export class DonorRequestListComponent implements OnInit, OnDestroy {
  requests: any[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private requestService: RequestService,
    private signalRService: SignalRService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();

    // ✅ Real-time updates (if needed)
    this.signalRService.newMaterial$
      .pipe(takeUntil(this.destroy$))
      .subscribe(material => {
        if (material && material.id) {
          const index = this.requests.findIndex(r => r.id === material.id);
          if (index !== -1) {
            this.requests[index] = material;
          } else {
            this.requests.unshift(material);
          }
        }
      });
  }

  loadRequests(): void {
    this.requestService.getRequestsForDonor().subscribe({
      next: res => {
        this.requests = res;
        this.loading = false;
      },
      error: err => {
        console.error('Failed to load donor requests', err);
        this.loading = false;
      }
    });
  }

  updateStatus(requestId: number, status: string): void {
    this.requestService.updateStatus(requestId, status).subscribe({
      next: () => {
        const req = this.requests.find(r => r.id === requestId);
        if (req) req.status = status;
        this.signalRService.notifyMaterialChanged(); // optional
      },
      error: () => alert('Failed to update status')
    });
  }

  deleteRequest(requestId: number): void {
    if (!confirm('Are you sure you want to delete this request?')) return;

    this.requestService.deleteRequest(requestId).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== requestId);
      },
      error: () => alert('Failed to delete request')
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/donor']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
