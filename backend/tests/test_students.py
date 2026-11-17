import unittest
from datetime import date, timedelta
from unittest.mock import Mock, patch

import mysql.connector
from fastapi import HTTPException
from pydantic import ValidationError

import students
from models import StudentCreate, StudentData


def student_row(codigo: str = "000123") -> dict[str, object]:
    return {
        "codigo_estudiante": codigo,
        "nombres": "Ana",
        "apellidos": "Lopez",
        "fecha_nacimiento": date(2002, 4, 3),
        "genero": "Femenino",
        "id_programa": 1,
        "direccion": None,
        "telefono_celular": "0312345678",
        "nombre_programa": "Ingenieria de Sistemas",
    }


def valid_student_data() -> dict[str, object]:
    return {
        "nombres": "  Ana  ",
        "apellidos": " Lopez ",
        "fecha_nacimiento": "2002-04-03",
        "genero": "Femenino",
        "id_programa": 1,
        "telefono_celular": "0312345678",
    }


class StudentApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = Mock()
        self.cursor = Mock()
        self.connection.cursor.return_value = self.cursor
        self.connection.in_transaction = True
        self.connection_factory = patch(
            "students.get_connection", return_value=self.connection
        )
        self.connection_factory.start()
        self.addCleanup(self.connection_factory.stop)

    def assert_database_closed(self) -> None:
        self.cursor.close.assert_called_once()
        self.connection.close.assert_called_once()

    def test_create_student_commits_and_preserves_leading_zeroes(self) -> None:
        self.cursor.fetchone.side_effect = [{"id_programa": 1}, student_row()]
        request = StudentCreate(codigo_estudiante="000123", **valid_student_data())

        result = students.create_student(request)

        self.assertEqual(result["codigo_estudiante"], "000123")
        self.assertEqual(result["nombres"], "Ana")
        self.connection.commit.assert_called_once()
        insert_parameters = self.cursor.execute.call_args_list[1].args[1]
        self.assertEqual(insert_parameters[0], "000123")
        self.assertEqual(insert_parameters[-1], "0312345678")
        self.assert_database_closed()

    def test_program_list_comes_from_database(self) -> None:
        programs = [
            {"id_programa": 1, "nombre_programa": "Ingenieria de Sistemas"},
            {"id_programa": 2, "nombre_programa": "Ingenieria Civil"},
        ]
        self.cursor.fetchall.return_value = programs

        result = students.list_programs()

        self.assertEqual(result, programs)
        self.assertIn("FROM programas_academicos", self.cursor.execute.call_args.args[0])
        self.assert_database_closed()

    def test_student_list_joins_program_name(self) -> None:
        rows = [student_row()]
        self.cursor.fetchall.return_value = rows

        result = students.list_students()

        self.assertEqual(result, rows)
        query = self.cursor.execute.call_args.args[0]
        self.assertIn("INNER JOIN programas_academicos", query)
        self.assert_database_closed()

    def test_duplicate_code_returns_conflict_and_rolls_back(self) -> None:
        self.cursor.fetchone.return_value = {"id_programa": 1}
        self.cursor.execute.side_effect = [
            None,
            mysql.connector.IntegrityError(msg="Duplicate", errno=1062),
        ]
        request = StudentCreate(codigo_estudiante="000123", **valid_student_data())

        with self.assertLogs("students", level="ERROR"):
            with self.assertRaises(HTTPException) as raised:
                students.create_student(request)

        self.assertEqual(raised.exception.status_code, 409)
        self.connection.rollback.assert_called_once()
        self.connection.commit.assert_not_called()
        self.assert_database_closed()

    def test_missing_program_returns_bad_request(self) -> None:
        self.cursor.fetchone.return_value = None
        request = StudentCreate(codigo_estudiante="000123", **valid_student_data())

        with self.assertRaises(HTTPException) as raised:
            students.create_student(request)

        self.assertEqual(raised.exception.status_code, 400)
        self.connection.rollback.assert_called_once()
        self.assert_database_closed()

    def test_update_commits_and_returns_updated_row(self) -> None:
        updated = student_row()
        updated["nombres"] = "Maria"
        self.cursor.fetchone.side_effect = [
            student_row(),
            {"id_programa": 1},
            updated,
        ]
        request = StudentData(**{**valid_student_data(), "nombres": "Maria"})

        result = students.update_student(request, "000123")

        self.assertEqual(result["nombres"], "Maria")
        self.connection.commit.assert_called_once()
        self.assert_database_closed()

    def test_delete_commits_after_student_is_found(self) -> None:
        self.cursor.fetchone.return_value = student_row()

        result = students.delete_student("000123")

        self.assertIsNone(result)
        self.cursor.execute.assert_called()
        self.connection.commit.assert_called_once()
        self.assert_database_closed()

    def test_delete_missing_student_does_not_commit(self) -> None:
        self.cursor.fetchone.return_value = None

        with self.assertRaises(HTTPException) as raised:
            students.delete_student("000123")

        self.assertEqual(raised.exception.status_code, 404)
        self.connection.commit.assert_not_called()
        self.assert_database_closed()

    def test_missing_student_returns_not_found(self) -> None:
        self.cursor.fetchone.return_value = None

        with self.assertRaises(HTTPException) as raised:
            students.get_student("000123")

        self.assertEqual(raised.exception.status_code, 404)
        self.assert_database_closed()

    def test_models_reject_invalid_values_and_normalize_names(self) -> None:
        request = StudentCreate(codigo_estudiante="000123", **valid_student_data())
        self.assertEqual(request.nombres, "Ana")
        self.assertEqual(request.apellidos, "Lopez")

        invalid_requests = [
            {"codigo_estudiante": "12A", **valid_student_data()},
            {"codigo_estudiante": "1" * 21, **valid_student_data()},
            {
                "codigo_estudiante": "12",
                **{**valid_student_data(), "nombres": "   "},
            },
            {
                "codigo_estudiante": "12",
                **{
                    **valid_student_data(),
                    "fecha_nacimiento": (date.today() + timedelta(days=1)).isoformat(),
                },
            },
            {
                "codigo_estudiante": "12",
                **{**valid_student_data(), "telefono_celular": "12-34"},
            },
        ]
        for data in invalid_requests:
            with self.subTest(data=data), self.assertRaises(ValidationError):
                StudentCreate(**data)


if __name__ == "__main__":
    unittest.main()
