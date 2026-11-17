import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { Estudiante, GeneroEstudiante } from '../../models/estudiante';
import { ProgramaAcademico } from '../../models/programa-academico';

const notBlank = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value.trim().length > 0 ? null : { blank: true };

const notFutureDate = (control: AbstractControl<Date | null>): ValidationErrors | null => {
  const value = control.value;
  if (!value) {
    return null;
  }

  const today = new Date();
  const selectedDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return selectedDate <= todayDate ? null : { futureDate: true };
};

@Component({
  imports: [
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
  ],
  selector: 'app-student-form',
  styleUrl: './student-form.css',
  templateUrl: './student-form.html',
})
export class StudentFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  @Input() programas: ProgramaAcademico[] = [];
  @Input() cargandoProgramas = false;
  @Input() guardando = false;
  @Input() editando = false;
  @Output() guardar = new EventEmitter<Estudiante>();
  @Output() cancelarEdicion = new EventEmitter<void>();
  protected readonly maxDate = new Date();
  protected readonly generos: { label: GeneroEstudiante; value: GeneroEstudiante }[] = [
    { label: 'Femenino', value: 'Femenino' },
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Otro', value: 'Otro' },
    { label: 'Prefiero no decir', value: 'Prefiero no decir' },
  ];

  readonly form = this.formBuilder.group({
    codigo_estudiante: this.formBuilder.control('', {
      validators: [
        Validators.required,
        Validators.maxLength(20),
        Validators.pattern(/^[0-9]+$/),
      ],
      nonNullable: true,
    }),
    nombres: this.formBuilder.control('', {
      validators: [Validators.required, notBlank, Validators.maxLength(100)],
      nonNullable: true,
    }),
    apellidos: this.formBuilder.control('', {
      validators: [Validators.required, notBlank, Validators.maxLength(100)],
      nonNullable: true,
    }),
    fecha_nacimiento: this.formBuilder.control<Date | null>(null, {
      validators: [Validators.required, notFutureDate],
    }),
    genero: this.formBuilder.control<GeneroEstudiante | null>(null),
    id_programa: this.formBuilder.control<number | null>(null, Validators.required),
    direccion: this.formBuilder.control('', {
      validators: [Validators.maxLength(255)],
      nonNullable: true,
    }),
    telefono_celular: this.formBuilder.control('', {
      validators: [Validators.pattern(/^[0-9]*$/), Validators.maxLength(20)],
      nonNullable: true,
    }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.guardando || this.cargandoProgramas || this.programas.length === 0) {
      return;
    }

    const value = this.form.getRawValue();
    if (!value.fecha_nacimiento || value.id_programa === null) {
      return;
    }

    const date = value.fecha_nacimiento;
    const fechaNacimiento = [
      date.getFullYear().toString().padStart(4, '0'),
      (date.getMonth() + 1).toString().padStart(2, '0'),
      date.getDate().toString().padStart(2, '0'),
    ].join('-');

    this.guardar.emit({
      codigo_estudiante: value.codigo_estudiante,
      nombres: value.nombres.trim(),
      apellidos: value.apellidos.trim(),
      fecha_nacimiento: fechaNacimiento,
      genero: value.genero,
      id_programa: value.id_programa,
      direccion: value.direccion.trim() || null,
      telefono_celular: value.telefono_celular || null,
    });
  }

  resetForm(): void {
    this.form.reset({
      codigo_estudiante: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: null,
      genero: null,
      id_programa: null,
      direccion: '',
      telefono_celular: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  cargarEstudiante(estudiante: Estudiante): void {
    const [year, month, day] = estudiante.fecha_nacimiento.split('-').map(Number);
    this.form.setValue({
      codigo_estudiante: estudiante.codigo_estudiante,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      fecha_nacimiento: new Date(year, month - 1, day),
      genero: estudiante.genero,
      id_programa: estudiante.id_programa,
      direccion: estudiante.direccion ?? '',
      telefono_celular: estudiante.telefono_celular ?? '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  protected clear(): void {
    if (this.editando) {
      this.cancelarEdicion.emit();
    } else {
      this.resetForm();
    }
  }
}
