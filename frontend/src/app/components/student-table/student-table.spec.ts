import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstudianteListado } from '../../models/estudiante';
import { StudentTableComponent } from './student-table';

describe('StudentTableComponent', () => {
  let fixture: ComponentFixture<StudentTableComponent>;
  let component: StudentTableComponent;
  const student: EstudianteListado = {
    codigo_estudiante: '99999999999999999999',
    nombres: 'Nombre de prueba',
    apellidos: 'Apellido de prueba',
    fecha_nacimiento: '2002-04-03',
    genero: 'Otro',
    id_programa: 9,
    direccion: null,
    telefono_celular: '0312345678',
    nombre_programa: 'Programa devuelto por la API',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('estudiantes', [student]);
    fixture.detectChanges();
  });

  it('renders the API program name and formats date without timezone conversion', () => {
    expect(fixture.nativeElement.textContent).toContain('Programa devuelto por la API');
    expect(fixture.nativeElement.textContent).toContain('03/04/2002');
    expect(fixture.nativeElement.textContent).toContain('99999999999999999999');
  });

  it('emits refresh, edit, and delete actions for the requested row', () => {
    const refresh = vi.spyOn(component.refrescar, 'emit');
    const edit = vi.spyOn(component.editar, 'emit');
    const remove = vi.spyOn(component.eliminar, 'emit');

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();
    buttons[2].click();

    expect(refresh).toHaveBeenCalledOnce();
    expect(edit).toHaveBeenCalledWith(student);
    expect(remove).toHaveBeenCalledWith(student);
  });

  it('shows an empty state when the API returns no students', () => {
    fixture.componentRef.setInput('estudiantes', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Aún no hay estudiantes registrados',
    );
  });
});
