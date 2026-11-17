import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProgramaAcademico } from '../../models/programa-academico';
import { StudentFormComponent } from './student-form';

describe('StudentFormComponent', () => {
  let fixture: ComponentFixture<StudentFormComponent>;
  let component: StudentFormComponent;
  const programas: ProgramaAcademico[] = [
    { id_programa: 7, nombre_programa: 'Programa recibido' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('programas', programas);
    fixture.detectChanges();
  });

  it('should render a standalone form with the programs provided as input', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Código de estudiante');
    expect(fixture.nativeElement.textContent).toContain('Programa académico');
    expect(fixture.nativeElement.textContent).not.toContain('Ingeniería de Sistemas');
  });

  it('should validate required fields, digits, and future dates', () => {
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({
      codigo_estudiante: '12A',
      nombres: '   ',
      apellidos: 'Pérez',
      fecha_nacimiento: new Date(new Date().getFullYear() + 1, 0, 1),
      id_programa: 7,
    });
    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.codigo_estudiante.hasError('pattern')).toBe(true);
    expect(component.form.controls.nombres.hasError('blank')).toBe(true);
    expect(component.form.controls.fecha_nacimiento.hasError('futureDate')).toBe(true);
  });

  it('should emit validated values with an ISO date and preserve leading zeroes', () => {
    const emitted: unknown[] = [];
    component.guardar.subscribe((student) => emitted.push(student));
    component.form.setValue({
      codigo_estudiante: '000123',
      nombres: ' Ana ',
      apellidos: ' Pérez ',
      fecha_nacimiento: new Date(2002, 3, 3),
      genero: 'Femenino',
      id_programa: 7,
      direccion: ' Calle 1 ',
      telefono_celular: '0312345678',
    });

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(emitted).toEqual([
      {
        codigo_estudiante: '000123',
        nombres: 'Ana',
        apellidos: 'Pérez',
        fecha_nacimiento: '2002-04-03',
        genero: 'Femenino',
        id_programa: 7,
        direccion: 'Calle 1',
        telefono_celular: '0312345678',
      },
    ]);
  });

  it('should clear form values without emitting', () => {
    const emit = vi.spyOn(component.guardar, 'emit');
    component.form.controls.codigo_estudiante.setValue('000123');
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const clearButton = Array.from(buttons).find((button) =>
      button.textContent.includes('Limpiar'),
    );
    expect(clearButton).toBeDefined();
    clearButton?.click();

    expect(component.form.controls.codigo_estudiante.value).toBe('');
    expect(emit).not.toHaveBeenCalled();
  });
});
