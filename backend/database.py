import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

ENV_FILE = Path(__file__).resolve().with_name(".env")


def get_connection() -> mysql.connector.MySQLConnection:
    """Crea una conexion a la base de datos configurada en el entorno."""
    load_dotenv(dotenv_path=ENV_FILE)

    try:
        port = int(os.getenv("MYSQL_PORT", "3306"))
    except ValueError as exc:
        raise ValueError("MYSQL_PORT debe ser un numero entero.") from exc

    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=port,
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "DB_CamiloBravo"),
        connection_timeout=5,
    )
