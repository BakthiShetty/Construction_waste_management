import { Routes } from '@angular/router';
import { DonorDashboardComponent } from './donor-dashboard/donor-dashboard';
import { ReceiverDashboardComponent } from './receiver-dashboard/receiver-dashboard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';


export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'donor',
    canMatch: [authGuard, roleGuard(['Donor'])],
    component: DonorDashboardComponent,
    title: 'Donor Dashboard'
  },
  {
    path: 'receiver',
    canMatch: [authGuard, roleGuard(['Receiver'])],
    component: ReceiverDashboardComponent,
    title: 'Receiver Dashboard'
  },
  {
    path: 'admin',
    canMatch: [authGuard, roleGuard(['Admin'])],
    component: AdminDashboardComponent,
    title: 'Admin Dashboard'
  }
];
