export type GeneroEstudiante = 'Femenino' | 'Masculino' | 'Otro' | 'Prefiero no decir';

export interface Estudiante {
  codigo_estudiante: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: GeneroEstudiante | null;
  id_programa: number;
  direccion: string | null;
  telefono_celular: string | null;
}

export interface EstudianteListado extends Estudiante {
  nombre_programa: string;
}

export type DatosActualizacionEstudiante = Omit<Estudiante, 'codigo_estudiante'>;
