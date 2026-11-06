import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { RequestService } from '../../../core/services/request';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-detail.html',
  styleUrls: ['./request-detail.scss']
})
export class RequestDetailComponent implements OnInit {
  requestId!: number;
  request: any;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService
  ) {}

  ngOnInit(): void {
    this.requestId = +this.route.snapshot.paramMap.get('id')!;
    this.fetchRequest();
  }

  fetchRequest(): void {
    this.requestService.getRequestsForMaterial(this.requestId).subscribe({
      next: (res) => {
        this.request = res.find((r: any) => r.id === this.requestId);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  updateStatus(status: string): void {
    this.requestService.updateStatus(this.requestId, status).subscribe(() => {
      this.request.status = status;
    });
  }
}
