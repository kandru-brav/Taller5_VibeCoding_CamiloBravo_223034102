import logging
from contextlib import contextmanager
from typing import Any, Iterator, NoReturn

import mysql.connector
from fastapi import APIRouter, HTTPException, Path, status

from database import get_connection
from models import (
    ProgramResponse,
    StudentCode,
    StudentCreate,
    StudentData,
    StudentResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@contextmanager
def database_cursor() -> Iterator[tuple[mysql.connector.MySQLConnection, Any]]:
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor(dictionary=True)
        yield connection, cursor
    except Exception:
        if connection.in_transaction:
            try:
                connection.rollback()
            except mysql.connector.Error:
                logger.exception("No fue posible revertir la transaccion MySQL.")
        raise
    finally:
        try:
            if cursor is not None:
                cursor.close()
        finally:
            connection.close()


def raise_database_http_error(exc: mysql.connector.Error) -> NoReturn:
    logger.exception("Error al ejecutar una operacion de estudiantes en MySQL.")
    if exc.errno == 1062:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un estudiante con ese codigo.",
        ) from exc
    if exc.errno == 1452:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El programa academico seleccionado no existe.",
        ) from exc
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="No fue posible completar la operacion en la base de datos.",
    ) from exc


def ensure_program_exists(cursor: Any, id_programa: int) -> None:
    cursor.execute(
        "SELECT id_programa FROM programas_academicos WHERE id_programa = %s",
        (id_programa,),
    )
    if cursor.fetchone() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El programa academico seleccionado no existe.",
        )


def get_student_or_404(cursor: Any, codigo: str) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT e.codigo_estudiante, e.nombres, e.apellidos, e.fecha_nacimiento,
               e.genero, e.id_programa, e.direccion, e.telefono_celular,
               p.nombre_programa
        FROM formulario_crud AS e
        INNER JOIN programas_academicos AS p ON p.id_programa = e.id_programa
        WHERE e.codigo_estudiante = %s
        """,
        (codigo,),
    )
    student = cursor.fetchone()
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontro un estudiante con ese codigo.",
        )
    return student


@router.get("/programas", response_model=list[ProgramResponse])
def list_programs() -> list[dict[str, Any]]:
    try:
        with database_cursor() as (_, cursor):
            cursor.execute(
                """
                SELECT id_programa, nombre_programa
                FROM programas_academicos
                ORDER BY id_programa
                """
            )
            return cursor.fetchall()
    except mysql.connector.Error as exc:
        raise_database_http_error(exc)


@router.get("/estudiantes", response_model=list[StudentResponse])
def list_students() -> list[dict[str, Any]]:
    try:
        with database_cursor() as (_, cursor):
            cursor.execute(
                """
                SELECT e.codigo_estudiante, e.nombres, e.apellidos,
                       e.fecha_nacimiento, e.genero, e.id_programa,
                       e.direccion, e.telefono_celular, p.nombre_programa
                FROM formulario_crud AS e
                INNER JOIN programas_academicos AS p
                    ON p.id_programa = e.id_programa
                ORDER BY e.apellidos, e.nombres, e.codigo_estudiante
                """
            )
            return cursor.fetchall()
    except mysql.connector.Error as exc:
        raise_database_http_error(exc)


@router.get("/estudiantes/{codigo}", response_model=StudentResponse)
def get_student(
    codigo: StudentCode = Path(description="Codigo numerico del estudiante"),
) -> dict[str, Any]:
    try:
        with database_cursor() as (_, cursor):
            return get_student_or_404(cursor, codigo)
    except mysql.connector.Error as exc:
        raise_database_http_error(exc)


@router.post(
    "/estudiantes",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student(student: StudentCreate) -> dict[str, Any]:
    try:
        with database_cursor() as (connection, cursor):
            ensure_program_exists(cursor, student.id_programa)
            cursor.execute(
                """
                INSERT INTO formulario_crud
                    (codigo_estudiante, nombres, apellidos, fecha_nacimiento,
                     genero, id_programa, direccion, telefono_celular)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    student.codigo_estudiante,
                    student.nombres,
                    student.apellidos,
                    student.fecha_nacimiento,
                    student.genero.value if student.genero else None,
                    student.id_programa,
                    student.direccion,
                    student.telefono_celular,
                ),
            )
            connection.commit()
            return get_student_or_404(cursor, student.codigo_estudiante)
    except mysql.connector.Error as exc:
        raise_database_http_error(exc)


@router.put("/estudiantes/{codigo}", response_model=StudentResponse)
def update_student(
    student: StudentData,
    codigo: StudentCode = Path(description="Codigo numerico del estudiante"),
) -> dict[str, Any]:
    try:
        with database_cursor() as (connection, cursor):
            get_student_or_404(cursor, codigo)
            ensure_program_exists(cursor, student.id_programa)
            cursor.execute(
                """
                UPDATE formulario_crud
                SET nombres = %s, apellidos = %s, fecha_nacimiento = %s,
                    genero = %s, id_programa = %s, direccion = %s,
                    telefono_celular = %s
                WHERE codigo_estudiante = %s
                """,
                (
                    student.nombres,
                    student.apellidos,
                    student.fecha_nacimiento,
                    student.genero.value if student.genero else None,
                    student.id_programa,
                    student.direccion,
                    student.telefono_celular,
                    codigo,
                ),
            )
            connection.commit()
            return get_student_or_404(cursor, codigo)
    except mysql.connector.Error as exc:
        raise_database_http_error(exc)


@router.delete("/estudiantes/{codigo}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    codigo: StudentCode = Path(description="Codigo numerico del estudiante"),
) -> None:
    try:
        with database_cursor() as (connection, cursor):
            get_student_or_404(cursor, codigo)
            cursor.execute(
                "DELETE FROM formulario_crud WHERE codigo_estudiante = %s",
                (codigo,),
            )
            connection.commit()
    except mysql.connector.Error as exc:
        raise_database_http_error(exc)
