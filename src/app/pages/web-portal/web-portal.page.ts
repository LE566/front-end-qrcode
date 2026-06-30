import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { QRCodeComponent } from 'angularx-qrcode';
import { AuthService } from '../../services/auth';
import { CommonModule, DatePipe } from '@angular/common';
import { 
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonList, IonBadge, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCodeOutline, trashOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-web-portal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, QRCodeComponent,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonItem, IonLabel, IonInput, IonButton, IonList, IonBadge, IonIcon, DatePipe
  ],
  template: `
    <ion-content class="ion-padding" style="--background: #f4f5f8;">
      <div style="display: flex; gap: 20px; max-width: 1000px; margin: 0 auto; margin-top: 20px;">
        
        <ion-card style="flex: 1; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <ion-card-header>
            <ion-card-title style="color: #2f3542; font-weight: bold;">Alta de autenticador</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <form [formGroup]="authForm" (ngSubmit)="generar()">
              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="stacked">Servicio</ion-label>
                <ion-input formControlName="servicio" placeholder="Servicio Demo"></ion-input>
              </ion-item>
              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="stacked">Cuenta</ion-label>
                <ion-input formControlName="cuenta" placeholder="usuario@empresa.com"></ion-input>
              </ion-item>
              <ion-button expand="block" type="submit" [disabled]="!authForm.valid || faseActual !== 1" color="primary">
                GENERAR QR
              </ion-button>
            </form>
          </ion-card-content>
        </ion-card>

        <ion-card style="flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <ion-card-content style="width: 100%;">
            
            @if (faseActual === 1) {
              <div style="padding: 40px 0;">
                <ion-icon name="qr-code-outline" style="font-size: 100px; color: #dcdde1;"></ion-icon>
                <h3 style="margin-top: 15px; color: #7f8fa6;">QR listo al crear el alta</h3>
              </div>
            }

            @if (faseActual === 2) {
              <div>
                <h4 style="color: #2f3542; font-weight: bold; margin-bottom: 5px;">1. Escanea el código</h4>
                <div style="background: white; padding: 10px; display: inline-block; border-radius: 10px; border: 2px dashed #cbd5e1; margin-bottom: 15px;">
                  <qrcode [qrdata]="qrData!" [width]="180" [errorCorrectionLevel]="'M'"></qrcode>
                </div>
                
                <h4 style="color: #2f3542; font-weight: bold; margin-bottom: 5px;">2. Activa tu cuenta</h4>
                <p style="color: #7f8fa6; font-size: 14px; margin-bottom: 15px;">Ingresa los 6 dígitos que muestra tu app para confirmar.</p>
                
                <form [formGroup]="verifyForm" (ngSubmit)="verificar()" style="display: flex; gap: 10px; justify-content: center; max-width: 300px; margin: 0 auto;">
                  <ion-input formControlName="tokenForm" placeholder="000000" type="number" style="background: #f1f2f6; border-radius: 6px; text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 5px;"></ion-input>
                  <ion-button type="submit" [disabled]="!verifyForm.valid" color="success">
                    VERIFICAR
                  </ion-button>
                </form>
              </div>
            }

            @if (faseActual === 3) {
              <div style="padding: 40px 0;">
                <ion-icon name="checkmark-circle-outline" style="font-size: 100px; color: #2ecc71;"></ion-icon>
                <h2 style="color: #2ecc71; font-weight: bold;">¡Activado!</h2>
                <p style="color: #7f8fa6;">La cuenta ha sido vinculada de forma segura.</p>
                <ion-button fill="clear" (click)="reiniciarProceso()">Vincular otra cuenta</ion-button>
              </div>
            }
            
          </ion-card-content>
        </ion-card>
      </div>

      <ion-card style="max-width: 1000px; margin: 20px auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <ion-card-header>
          <ion-card-title style="color: #2f3542; font-weight: bold;">Altas recientes</ion-card-title>
        </ion-card-header>
        <ion-list>
          @for (registro of authService.solicitudes(); track registro._id) {
            <ion-item lines="inset">
              <ion-label>
                <h2 style="font-weight: 600;">{{ registro.servicio }}</h2>
                <p>{{ registro.cuenta }}</p>
                <p style="font-size: 0.8em; color: #7f8fa6;">{{ registro.fecha | date:'short' }}</p>
              </ion-label>
              
              <ion-badge [color]="registro.estado === 'Revocado' ? 'medium' : (registro.estado === 'Activo' ? 'success' : 'warning')" slot="end">
                {{ registro.estado }}
              </ion-badge>
              
              @if (registro.estado !== 'Revocado') {
                <ion-button fill="clear" color="danger" slot="end" (click)="revocar(registro._id)">
                  <ion-icon name="trash-outline"></ion-icon>
                </ion-button>
              }
            </ion-item>
          } @empty {
            <ion-item><ion-label class="ion-text-center">No hay registros.</ion-label></ion-item>
          }
        </ion-list>
      </ion-card>
    </ion-content>
  `
})
export class WebPortalPage implements OnInit {
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  // Control de flujo (1 = Vacío, 2 = QR e Input listos, 3 = Éxito)
  faseActual: number = 1; 
  qrData: string | null = null;
  cuentaPendiente: string | null = null;

  authForm = this.fb.group({
    servicio: ['Servicio Demo', Validators.required],
    cuenta: ['usuario@empresa.com', [Validators.required, Validators.email]]
  });

  verifyForm = this.fb.group({
    tokenForm: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  constructor() {
    addIcons({ qrCodeOutline, trashOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.authService.cargarRegistros();
  }

  generar() {
    if (this.authForm.valid) {
      const { servicio, cuenta } = this.authForm.value;
      
      this.authService.crearSolicitud(servicio!, cuenta!).subscribe(res => {
        this.qrData = res.uri;
        this.cuentaPendiente = cuenta!;
        this.faseActual = 2; // Muestra QR y el formulario
        this.authForm.disable();
      });
    }
  }

  verificar() {
    if (this.verifyForm.valid && this.cuentaPendiente) {
      const { tokenForm } = this.verifyForm.value;
      
      this.authService.verificarToken(this.cuentaPendiente, tokenForm!.toString()).subscribe({
        next: () => {
          this.faseActual = 3; 
        },
        error: (err) => alert('❌ ' + (err.error?.error || 'Error de conexión'))
      });
    }
  }

  reiniciarProceso() {
    this.faseActual = 1;
    this.qrData = null;
    this.cuentaPendiente = null;
    this.authForm.enable();
    this.authForm.reset();
    this.verifyForm.reset();
  }

  revocar(id: string) {
    this.authService.revocarSolicitud(id).subscribe();
  }
}