import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import {
  DatosActualizacionEstudiante,
  Estudiante,
  EstudianteListado,
} from '../../models/estudiante';
import { ProgramaAcademico } from '../../models/programa-academico';
import { EstudianteApiService } from '../../core/services/estudiante-api.service';
import { StudentFormComponent } from '../student-form/student-form';
import { StudentTableComponent } from '../student-table/student-table';

@Component({
  imports: [
    ButtonModule,
    ConfirmDialogModule,
    RouterLink,
    StudentFormComponent,
    StudentTableComponent,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  selector: 'app-student-registration-page',
  styleUrl: './student-registration-page.css',
  templateUrl: './student-registration-page.html',
})
export class StudentRegistrationPage implements OnInit {
  private readonly api = inject(EstudianteApiService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly programas = signal<ProgramaAcademico[]>([]);
  protected readonly estudiantes = signal<EstudianteListado[]>([]);
  protected readonly cargandoProgramas = signal(false);
  protected readonly cargandoEstudiantes = signal(false);
  protected readonly cargandoEdicion = signal(false);
  protected readonly guardando = signal(false);
  protected readonly eliminandoCodigo = signal<string | null>(null);
  protected readonly errorProgramas = signal('');
  protected readonly errorEstudiantes = signal('');
  protected readonly codigoEdicion = signal<string | null>(null);

  @ViewChild(StudentFormComponent)
  private set studentForm(component: StudentFormComponent | undefined) {
    this.formComponent = component;
  }

  private formComponent?: StudentFormComponent;

  ngOnInit(): void {
    this.cargarProgramas();
    this.cargarEstudiantes();
  }

  cargarProgramas(): void {
    if (this.cargandoProgramas()) {
      return;
    }

    this.cargandoProgramas.set(true);
    this.errorProgramas.set('');
    this.api
      .obtenerProgramas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (programas) => {
          this.programas.set(programas);
          this.cargandoProgramas.set(false);
        },
        error: (error: unknown) => {
          this.cargandoProgramas.set(false);
          this.errorProgramas.set(this.mensajeError(error, 'programas'));
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudieron cargar los programas',
            detail: this.errorProgramas(),
            life: 6000,
          });
        },
      });
  }

  cargarEstudiantes(): void {
    if (this.cargandoEstudiantes()) {
      return;
    }

    this.cargandoEstudiantes.set(true);
    this.errorEstudiantes.set('');
    this.api
      .obtenerEstudiantes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (estudiantes) => {
          this.estudiantes.set(estudiantes);
          this.cargandoEstudiantes.set(false);
        },
        error: (error: unknown) => {
          this.cargandoEstudiantes.set(false);
          this.errorEstudiantes.set(this.mensajeError(error, 'consulta'));
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudieron cargar los estudiantes',
            detail: this.errorEstudiantes(),
            life: 6000,
          });
        },
      });
  }

  registrar(estudiante: Estudiante): void {
    const codigoOriginal = this.codigoEdicion();
    if (this.guardando() || this.cargandoProgramas() || this.programas().length === 0) {
      return;
    }

    this.guardando.set(true);
    const request = codigoOriginal
      ? this.api.actualizarEstudiante(codigoOriginal, this.datosActualizables(estudiante))
      : this.api.crearEstudiante(estudiante);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.formComponent?.resetForm();
        this.codigoEdicion.set(null);
        this.messageService.add({
          severity: 'success',
          summary: codigoOriginal ? 'Estudiante actualizado' : 'Estudiante registrado',
          detail: codigoOriginal
            ? `Los datos de ${codigoOriginal} se actualizaron correctamente.`
            : 'El estudiante se guardó correctamente.',
          life: 5000,
        });
        this.cargarEstudiantes();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: codigoOriginal
            ? 'No se pudo actualizar el estudiante'
            : 'No se pudo registrar el estudiante',
          detail: this.mensajeError(error, codigoOriginal ? 'actualizacion' : 'registro'),
          life: 7000,
        });
      },
    });
  }

  editar(estudiante: EstudianteListado): void {
    if (this.cargandoEdicion() || this.guardando()) {
      return;
    }

    this.cargandoEdicion.set(true);
    this.api
      .obtenerEstudiante(estudiante.codigo_estudiante)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actual) => {
          this.cargandoEdicion.set(false);
          this.codigoEdicion.set(actual.codigo_estudiante);
          this.formComponent?.cargarEstudiante(actual);
          document.getElementById('form-title')?.scrollIntoView?.({
            behavior: 'smooth',
            block: 'center',
          });
        },
        error: (error: unknown) => {
          this.cargandoEdicion.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo cargar el estudiante',
            detail: this.mensajeError(error, 'consulta'),
            life: 7000,
          });
          this.cargarEstudiantes();
        },
      });
  }

  cancelarEdicion(): void {
    this.codigoEdicion.set(null);
    this.formComponent?.resetForm();
  }

  confirmarEliminacion(estudiante: EstudianteListado): void {
    const nombre = `${estudiante.nombres} ${estudiante.apellidos}`.trim();
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Deseas eliminar al estudiante ${nombre} (código ${estudiante.codigo_estudiante})? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.eliminar(estudiante),
    });
  }

  private eliminar(estudiante: EstudianteListado): void {
    if (this.eliminandoCodigo()) {
      return;
    }

    this.eliminandoCodigo.set(estudiante.codigo_estudiante);
    this.api
      .eliminarEstudiante(estudiante.codigo_estudiante)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.eliminandoCodigo.set(null);
          if (this.codigoEdicion() === estudiante.codigo_estudiante) {
            this.cancelarEdicion();
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Estudiante eliminado',
            detail: `Se eliminó el registro ${estudiante.codigo_estudiante}.`,
            life: 5000,
          });
          this.cargarEstudiantes();
        },
        error: (error: unknown) => {
          this.eliminandoCodigo.set(null);
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo eliminar el estudiante',
            detail: this.mensajeError(error, 'eliminacion'),
            life: 7000,
          });
        },
      });
  }

  private datosActualizables(estudiante: Estudiante): DatosActualizacionEstudiante {
    return {
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      fecha_nacimiento: estudiante.fecha_nacimiento,
      genero: estudiante.genero,
      id_programa: estudiante.id_programa,
      direccion: estudiante.direccion,
      telefono_celular: estudiante.telefono_celular,
    };
  }

  private mensajeError(
    error: unknown,
    operacion: 'programas' | 'consulta' | 'registro' | 'actualizacion' | 'eliminacion',
  ): string {
    if (!(error instanceof HttpErrorResponse) || error.status === 0) {
      return 'No hay conexión con la API. Verifica que FastAPI esté ejecutándose en http://127.0.0.1:8000 e inténtalo de nuevo.';
    }

    if (operacion === 'programas') {
      if (error.status === 503) {
        return 'La API no puede consultar la base de datos. Comprueba MySQL en XAMPP e inténtalo de nuevo.';
      }
      return `No fue posible obtener los programas académicos (HTTP ${error.status}). Inténtalo de nuevo.`;
    }

    if (operacion === 'consulta' && error.status === 404) {
      return 'El estudiante ya no existe o fue eliminado. Actualiza la lista.';
    }

    switch (error.status) {
      case 400:
        return 'El programa académico seleccionado no existe. Actualiza la lista de programas e inténtalo de nuevo.';
      case 404:
        return 'No se encontró el estudiante solicitado. Actualiza la lista e inténtalo de nuevo.';
      case 409:
        return 'Ya existe un estudiante con ese código. Verifica el código ingresado.';
      case 422:
        return 'Los datos enviados no cumplen las validaciones del servidor. Revisa la información del formulario.';
      case 503:
        return 'El servicio o la base de datos no están disponibles. Inténtalo nuevamente en unos momentos.';
      default:
        return `Ocurrió un error durante la operación (HTTP ${error.status}). Inténtalo de nuevo.`;
    }
  }
}
