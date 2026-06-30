import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private platform = inject(Platform);
  private router = inject(Router);

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    
    // Detecta si es una plataforma nativa (iOS o Android a través de Capacitor)
    if (this.platform.is('capacitor')) {
      this.router.navigate(['/mobile-app']);
    } else {
      // Si es navegador web de escritorio
      this.router.navigate(['/web-portal']);
    }
  }
}