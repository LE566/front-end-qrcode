import { Routes } from '@angular/router';

export const routes: Routes = [
  // Si la ruta está vacía, la manejaremos dinámicamente en el app.component
  {
    path: 'web-portal',
    loadComponent: () => import('./pages/web-portal/web-portal.page').then( m => m.WebPortalPage)
  },
  {
    path: 'mobile-app',
    loadComponent: () => import('./pages/mobile-app/mobile-app.page').then( m => m.MobileAppPage)
  },
  // Ruta comodín en caso de que alguien escriba una URL que no existe
  {
    path: '**',
    redirectTo: 'web-portal',
    pathMatch: 'full'
  }
];