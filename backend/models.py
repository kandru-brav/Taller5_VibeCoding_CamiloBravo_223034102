from datetime import date
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator


StudentCode = Annotated[
    str,
    StringConstraints(strict=True, min_length=1, max_length=20, pattern=r"^[0-9]+$"),
]


class Gender(str, Enum):
    FEMENINO = "Femenino"
    MASCULINO = "Masculino"
    OTRO = "Otro"
    PREFIERO_NO_DECIR = "Prefiero no decir"


class StudentData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombres: Annotated[
        str, StringConstraints(strict=True, min_length=1, max_length=100)
    ]
    apellidos: Annotated[
        str, StringConstraints(strict=True, min_length=1, max_length=100)
    ]
    fecha_nacimiento: date
    genero: Gender | None = None
    id_programa: Annotated[int, Field(gt=0)]
    direccion: Annotated[str | None, StringConstraints(strict=True, max_length=255)] = None
    telefono_celular: Annotated[
        str | None,
        StringConstraints(strict=True, max_length=20, pattern=r"^[0-9]+$"),
    ] = None

    @field_validator("nombres", "apellidos")
    @classmethod
    def require_nonblank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El campo no puede contener solamente espacios.")
        return value

    @field_validator("fecha_nacimiento")
    @classmethod
    def reject_future_birth_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("La fecha de nacimiento no puede ser futura.")
        return value


class StudentCreate(StudentData):
    codigo_estudiante: StudentCode


class StudentResponse(StudentData):
    codigo_estudiante: StudentCode
    nombre_programa: str


class ProgramResponse(BaseModel):
    id_programa: int
    nombre_programa: str
