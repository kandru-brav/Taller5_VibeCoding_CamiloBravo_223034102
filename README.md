
# Campus+ — Sistema de Gestión de Estudiantes

## Descripción

Aplicación web Full Stack para administrar estudiantes mediante operaciones CRUD (Crear, Consultar, Actualizar y Eliminar).

Proyecto desarrollado con el enfoque de Vibe Coding, utilizando GitHub Copilot para apoyar la generación, integración y validación del software.

## Tecnologías

- Frontend: Angular 22 y PrimeNG 22.
- Backend: Python 3.11 y FastAPI.
- Base de datos: MySQL mediante XAMPP.
- Comunicación: API REST mediante HTTP.

## Estructura del proyecto

```text
Taller_FullStack_Estudiantes/
├── backend/
│   ├── database.sql
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── students.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── angular.json
└── documento/
```

## 1. Preparar MySQL

1. Abrir XAMPP e iniciar MySQL y Apache.
2. Entrar a `http://localhost/phpmyadmin`.
3. Importar el archivo `backend/database.sql`.
4. Comprobar que se haya creado la base de datos `DB_CamiloBravo`.
5. Verificar las tablas `formulario_crud` y `programas_academicos`.
6. Comprobar que existan los 10 programas académicos iniciales.

## 2. Configurar el backend

Abrir PowerShell en la carpeta principal del proyecto y ejecutar:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Crear el archivo `.env` a partir de `.env.example` y configurar los datos de conexión a MySQL, incluyendo usuario, contraseña, puerto y nombre de la base de datos.

Iniciar FastAPI:

```powershell
python -m uvicorn main:app --reload
```

API disponible en:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/health/db`

## 3. Configurar el frontend

Abrir una segunda terminal desde la carpeta principal del proyecto:

```powershell
cd frontend
npm ci
```

La aplicación utiliza una licencia de desarrollo PrimeUI Community. Cada entorno debe configurar una licencia válida en el archivo local `src/app/primeui-license.local.ts`, con el siguiente formato:

```typescript
export const PRIMEUI_LICENSE = 'CLAVE_DE_LICENCIA_DEL_ENTORNO';
```

No publicar claves personales de licencia en el repositorio.

Iniciar Angular:

```powershell
npm start
```

Abrir:

`http://localhost:4200/estudiantes`

## 4. Funcionalidades

- Registrar estudiantes con validaciones.
- Consultar estudiantes almacenados.
- Actualizar información académica y personal.
- Eliminar estudiantes con confirmación.
- Consultar dinámicamente los programas académicos desde MySQL.
- Mostrar mensajes de éxito y error mediante PrimeNG.

## 5. Pruebas

Desde la carpeta `frontend`:

```powershell
npm run build
npm test -- --watch=false
```

Última validación local: compilación exitosa y 14 pruebas automatizadas aprobadas.

También se comprobó el funcionamiento de las operaciones CRUD mediante Angular, FastAPI y MySQL.

## 6. Consideraciones

- Mantener MySQL activo mientras se utiliza la aplicación.
- FastAPI y Angular deben ejecutarse en terminales independientes.
- No compartir los archivos `.env` ni `primeui-license.local.ts`.
- No incluir `.venv`, `node_modules` ni `dist` en una entrega de código fuente.
- Los prompts enviados a Copilot se encuentran documentados por separado en el archivo Word de entrega.
