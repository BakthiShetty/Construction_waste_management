import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialService } from '../../../core/services/material';
import { RequestService } from '../../../core/services/request';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-donor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './donor-dashboard.html',
  styleUrls: ['./donor-dashboard.scss']
})
export class DonorDashboardComponent implements OnInit, OnDestroy {
  materialCount = 0;
  incomingRequests = 0;
  loadingMaterials = true;
  loadingRequests = true;
  private observer!: IntersectionObserver;

  // Dashboard stats
  stats = [
    { 
      icon: '📦', 
      title: 'Total Materials Posted', 
      value: 0, 
      color: 'blue',
      loading: true
    },
    { 
      icon: '📥', 
      title: 'Incoming Requests', 
      value: 0, 
      color: 'green',
      loading: true
    },
    { 
      icon: '✅', 
      title: 'Completed Donations', 
      value: 0, 
      color: 'purple',
      loading: false
    },
    { 
      icon: '🌱', 
      title: 'Environmental Impact', 
      value: '2.5T', 
      color: 'emerald',
      loading: false,
      suffix: ' CO₂ Saved'
    }
  ];

  // Quick actions
  quickActions = [
    {
      title: 'Post New Material',
      description: 'Add construction materials for donation',
      icon: '➕',
      route: '/materials/add',
      color: 'green',
      primary: false
    },
    {
      title: 'View Requests',
      description: 'Check requests for your materials',
      icon: '📋',
      route: '/requests/donor',
      color: 'green',
      primary: false
    },
    {
      title: 'My Materials',
      description: 'Manage your posted materials',
      icon: '👁️',
      route: '/materials/mine',
      color: 'yellow',
      primary: false
    }
  ];

  constructor(
    private materialService: MaterialService,
    private requestService: RequestService,
      private authService: AuthService,      // 👈 new
      private router: Router   
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    setTimeout(() => {
      this.initScrollAnimations();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
    logout(): void {
    this.authService.logout();            // clear token & role stream
    this.router.navigate(['/auth/login']); // redirect to login page
  }
  private initScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
      this.observer.observe(el);
    });
  }

  private loadDashboardData(): void {
    this.loadMaterials();
    this.loadDonorRequests();
  }

  private loadMaterials(): void {
    this.loadingMaterials = true;
    this.stats[0].loading = true;
    
    this.materialService.getMyMaterials().subscribe({
      next: materials => {
        this.materialCount = materials.length;
        this.stats[0].value = materials.length;
        this.stats[0].loading = false;
      },
      error: err => {
        console.error('Failed to fetch materials:', err);
        this.stats[0].loading = false;
      },
      complete: () => this.loadingMaterials = false
    });
  }

  private loadDonorRequests(): void {
    this.loadingRequests = true;
    this.stats[1].loading = true;
    this.stats[2].loading = true;
    
    this.requestService.getRequestsForDonor().subscribe({
      next: requests => {
      const pendingRequests = requests.filter(r => r.status === 'Pending'); 
      this.incomingRequests = pendingRequests.length;
      this.stats[1].value = pendingRequests.length;
      this.stats[1].loading = false;

        const approvedCount = requests.filter(r => r.status === 'Approved').length;
        this.stats[2].value = approvedCount;
        this.stats[2].loading = false;
      },
      error: err => {
        console.error('Failed to fetch requests:', err);
        this.stats[1].loading = false;
        this.stats[2].loading = false;
      },
      complete: () => this.loadingRequests = false
    });
  }

  getColorClasses(color: string) {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colorMap[color] || colorMap['blue'];

  }
}