# 📚 Libris

Este proyecto con enfoque en la seguridad y buenas prácticas en el backend, ofreciendo servicios de autenticación, autorización y gestión de datos de usuarios y libros.


🔐 Funcionalidades principales

- **🔑 Autenticación y autorización**: Implementación de flujo JWT y OAuth2 completamente funcional, asegurando que solo usuarios autorizados puedan acceder a recursos sensibles.

- **🛡️ Políticas de seguridad**: Configuración de CORS para controlar el acceso desde distintos orígenes y validaciones de entrada para proteger la integridad de los datos.

- **🧪 Pruebas y documentación**: Se incluye una colección de Postman y documentación en Swagger, permitiendo probar los endpoints de autenticación y operaciones sobre recursos de manera sencilla y segura.

- **🧩 Arquitectura visual**: Diagramas C4 actualizados, mostrando claramente los componentes relacionados con la seguridad, flujo de datos y estructura del backend.

## 📊 Diagramas de arquitectura

Los diagramas C4 incluidos en el proyecto ilustran la relación entre usuarios, servicios, bases de datos y componentes de seguridad, facilitando la comprensión y mantenimiento del sistema.

## 🛠️ Tecnologías Usadas

- Python 3.11            - Lenguaje principal
- Django 5.x             - Framework web
- Django REST Framework  - Creación de APIs REST
- SQLite / PostgreSQL    - Bases de datos
- JWT (JSON Web Token)   - Autenticación entre microservicios
- Git / GitHub           - Control de versiones y repositorio remoto
- HTML / CSS / Bootstrap - Interfaz básica para administración


## Indicaciones 


### 1. Clonar el repositorio
```
git clone https://github.com/Dilan1615/Libris.git
cd Contenedor_biblioteca
```
### 2. Crear y activar el entorno virtual
```
python -m venv venv
venv\Scripts\activate     # En Windows
source venv/bin/activate  # En Linux o Mac
```
### 3. Instalar dependencias
```
pip install -r requirements.txt
```

### 4. Realizar migraciones
```
python manage.py makemigrations
python manage.py migrate
```

## 🌐 Endpoints API

Base URL: http://127.0.0.1:8000/

### 👤 Usuarios
- `POST /api/register` - crear usuario
- `POST /api/login` - Iniciar sesion en la cuenta
- `POST /api/logout` - Cerrar sesion

### 📖 Materiales de lectura
- `GET /api/libros/ `- Listar libros
- `POST /api/libros/` - Crear libro
- `GET /api/mangas/ `- Listar mangas
- `POST /api/mangas/` - Crear manga
- `GET /api/novelas/ `- Listar novelas
- `POST /api/novelas/ `- Crear novela

### 📚 Registro de lectura
- `GET /api/lectura/` - Listar registros
- `POST /api/lectura/` - Crear registro de lectura
###  Comentarios
- `POST /comentarios/` - Comentar registro lectura
