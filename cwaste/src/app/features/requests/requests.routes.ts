import { Routes } from '@angular/router';
import { RequestListComponent } from './request-list/request-list';
import { RequestDetailComponent } from './request-detail/request-detail';
import { ReceiverMaterialListComponent } from './reciver-material-list/reciver-material-list';
import { authGuard } from '../../core/guards/auth.guard';
import { DonorRequestListComponent } from './donor-request-list/donor-request-list';


export const REQUEST_ROUTES: Routes = [
  {
    path: '',
    component: RequestListComponent,
    title: 'My Requests',
    canActivate: [authGuard],
    data: { role: 'Receiver' },
  },
  {
    path: 'detail/:id',
    component: RequestDetailComponent,
    title: 'Request Detail',
    canActivate: [authGuard],
    data: { role: 'Receiver' },
  },
  {
    path: 'browse',
    component: ReceiverMaterialListComponent,
    canActivate: [authGuard],
    data: { role: 'Receiver' },
    title: 'Browse Materials'
  },
  {
    path: 'detail/:id',
    component: RequestDetailComponent,
    canActivate: [authGuard],
    data: { role: 'Receiver' },
    title: 'Request Detail'
  },
   {
    path: 'donor',
    component: DonorRequestListComponent,
    canActivate: [authGuard],
    data: { role: 'Donor' }
  }

];

