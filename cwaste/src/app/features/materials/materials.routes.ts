import { Routes } from '@angular/router';
import { MaterialListComponent } from './material-list/material-list';
import { MaterialAddComponent } from './material-add/material-add';
import { MaterialDetailComponent } from './material-detail/material-detail';



export const materialsRoutes: Routes = [
  { path: '', component: MaterialListComponent },
  { path: 'mine', component: MaterialListComponent },
  { path: 'add', component: MaterialAddComponent },
  { path: ':id', component: MaterialDetailComponent }
 

];


