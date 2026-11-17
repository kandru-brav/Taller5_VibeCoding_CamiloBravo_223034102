-- Crear y seleccionar la base de datos con soporte para caracteres Unicode.
CREATE DATABASE IF NOT EXISTS DB_CamiloBravo
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE DB_CamiloBravo;

-- Catalogo de programas academicos.
CREATE TABLE IF NOT EXISTS programas_academicos (
    id_programa INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre_programa VARCHAR(120) NOT NULL,
    PRIMARY KEY (id_programa),
    UNIQUE KEY uq_programas_academicos_nombre (nombre_programa)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- INSERT IGNORE evita duplicar programas ya insertados al ejecutar de nuevo
-- este script; el nombre del programa tiene una restriccion UNIQUE.
INSERT IGNORE INTO programas_academicos (nombre_programa) VALUES
    ('Ingenieria de Sistemas'),
    ('Ingenieria Civil'),
    ('Ingenieria Industrial'),
    ('Medicina'),
    ('Enfermeria'),
    ('Derecho'),
    ('Administracion de Empresas'),
    ('Contaduria Publica'),
    ('Psicologia'),
    ('Diseno Grafico');

-- Informacion principal de los estudiantes y relacion con su programa.
CREATE TABLE IF NOT EXISTS formulario_crud (
    codigo_estudiante VARCHAR(20) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('Femenino', 'Masculino', 'Otro', 'Prefiero no decir') NULL,
    id_programa INT UNSIGNED NOT NULL,
    direccion VARCHAR(255) NULL,
    telefono_celular VARCHAR(20) NULL,
    PRIMARY KEY (codigo_estudiante),
    CONSTRAINT chk_formulario_crud_codigo_digitos
        CHECK (codigo_estudiante REGEXP '^[0-9]+$'),
    KEY idx_formulario_crud_programa (id_programa),
    CONSTRAINT fk_formulario_crud_programa
        FOREIGN KEY (id_programa)
        REFERENCES programas_academicos (id_programa)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
