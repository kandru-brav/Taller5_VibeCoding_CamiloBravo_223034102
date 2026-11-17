import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { EstudianteListado } from '../../models/estudiante';

@Component({
  imports: [ButtonModule, TableModule],
  selector: 'app-student-table',
  styleUrl: './student-table.css',
  templateUrl: './student-table.html',
})
export class StudentTableComponent {
  @Input() estudiantes: EstudianteListado[] = [];
  @Input() cargando = false;
  @Input() eliminandoCodigo: string | null = null;
  @Input() error = '';

  @Output() refrescar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<EstudianteListado>();
  @Output() eliminar = new EventEmitter<EstudianteListado>();

  protected formatFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }
}
