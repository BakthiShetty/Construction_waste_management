// src/app/pages/pages.routes.ts
import { Routes } from '@angular/router';

export const PAGES_ROUTES: Routes = [
  {
    path: 'about',
    loadComponent: () =>
      import('./about/about').then((m) => m.AboutComponent),
    title: 'About Us',
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./contact/contact').then((m) => m.ContactComponent),
    title: 'Contact Us',
  }
];
