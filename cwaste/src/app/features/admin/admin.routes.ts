import { Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list';
import { MaterialListComponent } from './material-list/material-list';
import { ReportsComponent } from './reports/reports';

// Optional: RoleGuard if you're using guards
// import { RoleGuard } from 'src/app/core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    component: UserListComponent,
    title: 'Manage Users',
    // canActivate: [RoleGuard],
    // data: { roles: ['Admin'] }
  },
  {
    path: 'materials',
    component: MaterialListComponent,
    title: 'Manage Materials',
    // canActivate: [RoleGuard],
    // data: { roles: ['Admin'] }
  },
  {
    path: 'reports',
    component: ReportsComponent,
    title: 'Manage Materials',
    // canActivate: [RoleGuard],
    // data: { roles: ['Admin'] }
  }
];
