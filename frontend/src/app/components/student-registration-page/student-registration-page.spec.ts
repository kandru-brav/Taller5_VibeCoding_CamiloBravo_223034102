import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ConfirmationService } from 'primeng/api';

import { EstudianteListado } from '../../models/estudiante';
import { StudentFormComponent } from '../student-form/student-form';
import { StudentRegistrationPage } from './student-registration-page';

const estudiantePrueba: EstudianteListado = {
  codigo_estudiante: '99999999999999999999',
  nombres: 'Estudiante',
  apellidos: 'De prueba',
  fecha_nacimiento: '2002-04-03',
  genero: 'Femenino',
  id_programa: 4,
  direccion: null,
  telefono_celular: '0312345678',
  nombre_programa: 'Programa recibido por API',
};

describe('StudentRegistrationPage', () => {
  let fixture: ComponentFixture<StudentRegistrationPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentRegistrationPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StudentRegistrationPage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads program options from the API', () => {
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([]);
    const request = http.expectOne('http://127.0.0.1:8000/programas');
    expect(request.request.method).toBe('GET');
    request.flush([{ id_programa: 4, nombre_programa: 'Programa desde API' }]);
    fixture.detectChanges();

    const formComponent = fixture.debugElement.query(
      By.directive(StudentFormComponent),
    ).componentInstance as StudentFormComponent;
    expect(formComponent.programas).toEqual([
      { id_programa: 4, nombre_programa: 'Programa desde API' },
    ]);
  });

  it('retries program loading after a connection error', () => {
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([]);
    http.expectOne('http://127.0.0.1:8000/programas').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay conexión con la API');

    const retryButton = fixture.nativeElement.querySelector(
      '.program-error button',
    ) as HTMLButtonElement;
    retryButton.click();
    const retry = http.expectOne('http://127.0.0.1:8000/programas');
    expect(retry.request.method).toBe('GET');
    retry.flush([{ id_programa: 4, nombre_programa: 'Programa desde API' }]);
  });

  it('posts the validated student payload and clears the form on success', () => {
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([]);
    http.expectOne('http://127.0.0.1:8000/programas').flush([
      { id_programa: 4, nombre_programa: 'Programa desde API' },
    ]);
    fixture.detectChanges();

    const formComponent = fixture.debugElement.query(
      By.directive(StudentFormComponent),
    ).componentInstance as StudentFormComponent;
    formComponent.form.setValue({
      codigo_estudiante: '000123',
      nombres: ' Ana ',
      apellidos: ' Pérez ',
      fecha_nacimiento: new Date(2002, 3, 3),
      genero: 'Femenino',
      id_programa: 4,
      direccion: '',
      telefono_celular: '0312345678',
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    const request = http.expectOne('http://127.0.0.1:8000/estudiantes');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      codigo_estudiante: '000123',
      nombres: 'Ana',
      apellidos: 'Pérez',
      fecha_nacimiento: '2002-04-03',
      genero: 'Femenino',
      id_programa: 4,
      direccion: null,
      telefono_celular: '0312345678',
    });
    request.flush({
      ...request.request.body,
      nombre_programa: 'Programa desde API',
    }, { status: 201, statusText: 'Created' });
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([{
      ...request.request.body,
      nombre_programa: 'Programa desde API',
    }]);
    fixture.detectChanges();

    expect(formComponent.form.controls.codigo_estudiante.value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Estudiante registrado');
  });

  it('shows a friendly conflict message and preserves input on duplicate code', () => {
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([]);
    http.expectOne('http://127.0.0.1:8000/programas').flush([
      { id_programa: 4, nombre_programa: 'Programa desde API' },
    ]);
    fixture.detectChanges();

    const formComponent = fixture.debugElement.query(
      By.directive(StudentFormComponent),
    ).componentInstance as StudentFormComponent;
    formComponent.form.setValue({
      codigo_estudiante: '000123',
      nombres: 'Ana',
      apellidos: 'Pérez',
      fecha_nacimiento: new Date(2002, 3, 3),
      genero: null,
      id_programa: 4,
      direccion: '',
      telefono_celular: '',
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    http.expectOne('http://127.0.0.1:8000/estudiantes').flush(
      { detail: 'duplicate' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(formComponent.form.controls.codigo_estudiante.value).toBe('000123');
    expect(fixture.nativeElement.textContent).toContain('Ya existe un estudiante con ese código');
  });

  it('loads current values for editing and updates by the original code', () => {
    http.expectOne('http://127.0.0.1:8000/programas').flush([
      { id_programa: 4, nombre_programa: estudiantePrueba.nombre_programa },
    ]);
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([estudiantePrueba]);
    fixture.detectChanges();

    fixture.componentInstance.editar(estudiantePrueba);
    const detailRequest = http.expectOne(
      'http://127.0.0.1:8000/estudiantes/99999999999999999999',
    );
    expect(detailRequest.request.method).toBe('GET');
    detailRequest.flush(estudiantePrueba);
    fixture.detectChanges();

    const formComponent = fixture.debugElement.query(
      By.directive(StudentFormComponent),
    ).componentInstance as StudentFormComponent;
    expect(formComponent.form.controls.fecha_nacimiento.value).toEqual(new Date(2002, 3, 3));
    expect(formComponent.form.controls.codigo_estudiante.value).toBe('99999999999999999999');
    formComponent.form.controls.nombres.setValue('Nombre actualizado');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    const updateRequest = http.expectOne(
      'http://127.0.0.1:8000/estudiantes/99999999999999999999',
    );
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual({
      nombres: 'Nombre actualizado',
      apellidos: 'De prueba',
      fecha_nacimiento: '2002-04-03',
      genero: 'Femenino',
      id_programa: 4,
      direccion: null,
      telefono_celular: '0312345678',
    });
    updateRequest.flush({
      ...estudiantePrueba,
      nombres: 'Nombre actualizado',
    });
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([{
      ...estudiantePrueba,
      nombres: 'Nombre actualizado',
    }]);

    expect(formComponent.form.controls.codigo_estudiante.value).toBe('');
  });

  it('does not delete until confirmation is accepted, then refreshes the list', () => {
    http.expectOne('http://127.0.0.1:8000/programas').flush([]);
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([estudiantePrueba]);
    fixture.detectChanges();

    const confirmation = fixture.debugElement.injector.get(ConfirmationService);
    let accept: (() => void) | undefined;
    vi.spyOn(confirmation, 'confirm').mockImplementation((options) => {
      accept = options.accept;
      return confirmation;
    });
    fixture.componentInstance.confirmarEliminacion(estudiantePrueba);

    http.expectNone('http://127.0.0.1:8000/estudiantes/99999999999999999999');
    expect(accept).toBeDefined();
    accept?.();

    const deleteRequest = http.expectOne(
      'http://127.0.0.1:8000/estudiantes/99999999999999999999',
    );
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne('http://127.0.0.1:8000/estudiantes').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Aún no hay estudiantes registrados',
    );
  });
});
