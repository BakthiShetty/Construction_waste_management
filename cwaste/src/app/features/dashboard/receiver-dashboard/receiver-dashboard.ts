import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialService } from '../../../core/services/material';
import { RequestService } from '../../../core/services/request';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-receiver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './receiver-dashboard.html',
  styleUrls: ['./receiver-dashboard.scss']
})
export class ReceiverDashboardComponent implements OnInit, OnDestroy {
  availableMaterials = 0;
  myRequests = 0;
  loadingMaterials = true;
  loadingRequests = true;
  private observer!: IntersectionObserver;

  /* -------- Dashboard stats -------- */
  stats = [
    {
      icon: '📦',
      title: 'Materials Available',
      value: 0,
      color: 'blue',
      loading: true
    },
    {
      icon: '📋',
      title: 'My Active Requests',
      value: 0,
      color: 'green',
      loading: true
    },
    {
      icon: '✅',
      title: 'Completed Requests',
      value: 0,
      color: 'purple',
      loading: true
    }
  ];

  /* -------- Quick actions -------- */
  quickActions = [
    {
      title: 'Browse Materials',
      description: 'Find available construction materials',
      icon: '🔍',
      route: '/requests/browse',
      color: 'blue',
      primary: false
    },
    {
      title: 'My Requests',
      description: 'Track and manage your requests',
      icon: '📋',
      route: '/requests',
      color: 'green',
      primary: false
    }
  ];

  constructor(
    private materialService: MaterialService,
    private requestService: RequestService,
    private authService: AuthService,
    private router: Router
  ) {}

  /* ---------------- Lifecycle ---------------- */
  ngOnInit(): void {
    this.loadDashboardData();
    setTimeout(() => this.initScrollAnimations(), 100);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /* ---------------- Public helpers ---------------- */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getColorClasses(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return map[color] ?? map['blue'];
  }

  /* ---------------- Private ---------------- */
  private loadDashboardData(): void {
    this.loadMaterials();
    this.loadReceiverRequests();
  }

  private loadMaterials(): void {
    this.loadingMaterials = true;
    this.stats[0].loading = true;

    this.materialService.getAll().subscribe({
      
      next: materials => {
        this.availableMaterials = materials.length;
        this.stats[0].value = materials.length;
        this.stats[0].loading = false;
      },
      error: err => {
        console.error('Failed to fetch materials:', err);
        this.stats[0].loading = false;
      },
      complete: () => (this.loadingMaterials = false)
    });
  }

  private loadReceiverRequests(): void {
    this.loadingRequests = true;
    this.stats[1].loading = true;
    this.stats[2].loading = true;

    this.requestService.getMyRequests().subscribe({
      next: requests => {
        /* Separate active vs completed */
        const active = requests.filter(r => r.status === 'Pending');
        const completed = requests.filter(r => r.status === 'Approved');

        this.myRequests = active.length;
        this.stats[1].value = active.length;
        this.stats[1].loading = false;

        this.stats[2].value = completed.length;
        this.stats[2].loading = false;
      },
      error: err => {
        console.error('Failed to fetch requests:', err);
        this.stats[1].loading = this.stats[2].loading = false;
      },
      complete: () => (this.loadingRequests = false)
    });
  }

  private initScrollAnimations(): void {
    const opts = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting && e.target.classList.add('animate'));
    }, opts);

    document.querySelectorAll('.fade-in').forEach(el => this.observer.observe(el));
  }
}
