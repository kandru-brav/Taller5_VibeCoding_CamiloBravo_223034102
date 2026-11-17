import logging

import mysql.connector
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_connection
from students import router as students_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="API de gestion de estudiantes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students_router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "La API de gestion de estudiantes esta funcionando."}


@app.get("/health/db")
def check_database_health() -> dict[str, str]:
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        return {"status": "ok", "message": "Conexion a MySQL exitosa."}
    except (mysql.connector.Error, ValueError) as exc:
        logger.exception("No fue posible verificar la conexion con MySQL.")
        raise HTTPException(
            status_code=503,
            detail="No fue posible conectar con la base de datos. Revisa la configuracion.",
        ) from exc
    finally:
        try:
            if cursor is not None:
                cursor.close()
        finally:
            if connection is not None:
                connection.close()
