import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DatosActualizacionEstudiante,
  Estudiante,
  EstudianteListado,
} from '../../models/estudiante';
import { ProgramaAcademico } from '../../models/programa-academico';

export interface EstudianteCreado extends Estudiante {
  nombre_programa: string;
}

@Injectable({ providedIn: 'root' })
export class EstudianteApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000';

  obtenerProgramas(): Observable<ProgramaAcademico[]> {
    return this.http.get<ProgramaAcademico[]>(`${this.apiUrl}/programas`);
  }

  crearEstudiante(estudiante: Estudiante): Observable<EstudianteCreado> {
    return this.http.post<EstudianteCreado>(`${this.apiUrl}/estudiantes`, estudiante);
  }

  obtenerEstudiantes(): Observable<EstudianteListado[]> {
    return this.http.get<EstudianteListado[]>(`${this.apiUrl}/estudiantes`);
  }

  obtenerEstudiante(codigo: string): Observable<EstudianteListado> {
    return this.http.get<EstudianteListado>(
      `${this.apiUrl}/estudiantes/${encodeURIComponent(codigo)}`,
    );
  }

  actualizarEstudiante(
    codigo: string,
    datos: DatosActualizacionEstudiante,
  ): Observable<EstudianteListado> {
    return this.http.put<EstudianteListado>(
      `${this.apiUrl}/estudiantes/${encodeURIComponent(codigo)}`,
      datos,
    );
  }

  eliminarEstudiante(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/estudiantes/${encodeURIComponent(codigo)}`);
  }
}
