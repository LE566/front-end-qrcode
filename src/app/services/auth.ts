// src/app/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export interface SolicitudAuth {
  _id: string;
  servicio: string;
  cuenta: string;
  estado: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'https://backend-qrcode-9he6b46t0-le566s-projects.vercel.app/api/auth';
  
  solicitudes = signal<SolicitudAuth[]>([]);

  cargarRegistros() {
    this.http.get<SolicitudAuth[]>(this.apiUrl).subscribe(data => {
      this.solicitudes.set(data);
    });
  }

  crearSolicitud(servicio: string, cuenta: string) {
    return this.http.post<{uri: string, auth: SolicitudAuth}>(this.apiUrl, { servicio, cuenta }).pipe(
      tap(() => this.cargarRegistros())
    );
  }

  revocarSolicitud(id: string) {
    return this.http.patch(`${this.apiUrl}/${id}`, {}).pipe(
      tap(() => this.cargarRegistros())
    );
  }

  verificarToken(cuenta: string, token: string) {
    return this.http.post<{success: boolean, message?: string, error?: string}>(`${this.apiUrl}/verify`, { cuenta, token }).pipe(
      tap(() => this.cargarRegistros()) // <-- Esto hace que la tabla se actualice sola
    );
  }
  verificarEscaneo(cuenta: string) {
    return this.http.get<{escaneado: boolean}>(`${this.apiUrl}/check-scan/${cuenta}`);
  }
}