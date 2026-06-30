import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import * as OTPAuth from 'otpauth'; // <-- Importamos la librería mágica
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
  IonInput, IonItem, IonCard, IonCardContent, IonIcon, IonProgressBar 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { scanOutline, closeCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mobile-app',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
    IonInput, IonItem, IonCard, IonCardContent, IonIcon, IonProgressBar
  ],
  template: `
    @if (!scanActive) {
      <ion-header class="ion-no-border">
        <ion-toolbar style="--background: #121929; --color: white;">
          <ion-title>Authenticator</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding" style="--background: #121929;">
        
        @if (!pinCreado) {
          <ion-card style="background: #1a2235; border-radius: 16px; margin-top: 10%;">
            <ion-card-content class="ion-text-center">
              <h5 style="color: #64748b; margin-bottom: 5px;">Secure TOTP</h5>
              <h2 style="color: white; font-weight: bold; margin-top: 0;">Bloqueado</h2>
              <div style="margin: 40px 0;">
                <h3 style="color: white;">Crear PIN</h3>
                <ion-item lines="none" style="--background: #252d40; border-radius: 8px; margin-top: 20px;">
                  <ion-input type="password" [(ngModel)]="pinIngresado" placeholder="PIN" style="color: white; text-align: center; font-size: 24px; letter-spacing: 10px;"></ion-input>
                </ion-item>
              </div>
              <ion-button expand="block" (click)="guardarPin()" color="primary" style="--border-radius: 8px; height: 50px;">
                CREAR
              </ion-button>
            </ion-card-content>
          </ion-card>
        } @else {
          <div style="margin-top: 20px;">
            <ion-button expand="block" (click)="iniciarEscaneo()" color="primary" style="--border-radius: 8px; height: 50px; margin-bottom: 30px;">
              <ion-icon name="scan-outline" slot="start"></ion-icon>
              ESCANEAR NUEVO QR
            </ion-button>
            
            @if (cuentaActiva) {
              <ion-card style="background: white; border-radius: 12px;">
                <ion-card-content class="ion-text-center">
                  <p style="color: #64748b; font-size: 14px; margin: 0;">Escaneo</p>
                  <h2 style="color: #1e293b; font-weight: bold; margin: 5px 0;">{{ cuentaActiva.issuer }}</h2>
                  <p style="color: #64748b; margin-bottom: 20px;">{{ cuentaActiva.account }}</p>
                  
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                    <h1 style="font-size: 48px; letter-spacing: 5px; margin: 0; color: #3b82f6; font-weight: bold;">
                      {{ codigoActual }}
                    </h1>
                  </div>
                  
                  <ion-progress-bar [value]="progresoTiempo" color="primary"></ion-progress-bar>
                  <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">El código cambia en {{ segundosRestantes }}s</p>
                </ion-card-content>
              </ion-card>
            } @else {
              <div class="ion-text-center" style="margin-top: 50px;">
                <p style="color: #94a3b8;">Aún no tienes cuentas vinculadas.</p>
              </div>
            }
          </div>
        }
      </ion-content>
    } @else {
      <div style="height: 100vh; width: 100vw; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.6);">
        <div style="width: 280px; height: 280px; border: 3px solid #3b82f6; border-radius: 20px; box-shadow: 0 0 0 4000px rgba(0,0,0,0.6);"></div>
        <ion-button fill="clear" color="light" (click)="detenerEscaneo()" style="position: absolute; bottom: 50px; font-size: 20px;">
          <ion-icon name="close-circle-outline" slot="start"></ion-icon>
          Cancelar
        </ion-button>
      </div>
    }
  `
})
export class MobileAppPage implements OnDestroy {
  pinCreado = false;
  pinIngresado = '';
  scanActive = false;
  
  // Variables para el TOTP
  cuentaActiva: any = null;
  totpObj: any = null;
  codigoActual: string = '000000';
  segundosRestantes: number = 30;
  progresoTiempo: number = 1;
  intervaloTimer: any;

  constructor() {
    addIcons({ scanOutline, closeCircleOutline, checkmarkCircleOutline });
  }

  guardarPin() {
    if (this.pinIngresado.length >= 4) {
      this.pinCreado = true;
    }
  }

  async iniciarEscaneo() {
    const allowed = await BarcodeScanner.checkPermission({ force: true });
    if (!allowed.granted) return;

    // 👇 LA LÍNEA MÁGICA PARA QUITAR LA PANTALLA NEGRA
    await BarcodeScanner.hideBackground(); 

    document.querySelector('body')?.classList.add('scanner-active');
    this.scanActive = true;

    const result = await BarcodeScanner.startScan();
    
    if (result.hasContent) {
      this.procesarURI(result.content); 
      this.detenerEscaneo();
    }
  }

  procesarURI(uri: string) {
    try {
      this.totpObj = OTPAuth.URI.parse(uri);
      
      this.cuentaActiva = {
        issuer: this.totpObj.issuer || 'Servicio Desconocido',
        account: this.totpObj.label || 'Usuario'
      };

      this.iniciarGeneradorTOTP();

      fetch('http://192.168.18.57:3000/api/auth/scanned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuenta: this.cuentaActiva.account })
      }).catch(err => console.error("Error avisando al servidor", err));

    } catch (e) {
      console.error("QR Invalido o no es formato TOTP", e);
    }
  }

  iniciarGeneradorTOTP() {
    // Limpiamos intervalos viejos si escanea otro código
    if (this.intervaloTimer) clearInterval(this.intervaloTimer);

    const actualizarCodigo = () => {
      // Generamos los 6 dígitos exactos para este momento
      this.codigoActual = this.totpObj.generate();
      
      // Calculamos cuánto tiempo falta para el siguiente ciclo de 30s
      const epoch = Math.floor(Date.now() / 1000);
      this.segundosRestantes = 30 - (epoch % 30);
      this.progresoTiempo = this.segundosRestantes / 30;
    };

    actualizarCodigo(); // Ejecutar inmediatamente
    this.intervaloTimer = setInterval(actualizarCodigo, 1000); // Refrescar cada segundo para la barra
  }

  detenerEscaneo() {
    BarcodeScanner.stopScan();
    this.scanActive = false;
    document.querySelector('body')?.classList.remove('scanner-active');
  }

  ngOnDestroy() {
    this.detenerEscaneo();
    if (this.intervaloTimer) clearInterval(this.intervaloTimer);
  }
}