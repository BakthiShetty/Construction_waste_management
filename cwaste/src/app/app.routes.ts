import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './pages/home/home/home';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: 'materials',
    canMatch: [authGuard, roleGuard(['Donor'])],
    loadChildren: () =>
      import('./features/materials/materials.routes').then(m => m.materialsRoutes),
  },
  {
    path: 'requests',
    canMatch: [authGuard, roleGuard(['Receiver', 'Donor'])],
    loadChildren: () =>
      import('./features/requests/requests.routes').then(m => m.REQUEST_ROUTES),
  },
  {
    path: 'dashboard',
    canMatch: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'admin',
    canMatch: [authGuard, roleGuard(['Admin'])],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'pages',
    loadChildren: () =>
      import('./pages/pages.routes').then(m => m.PAGES_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
