# 📚 Libris

**Libris** es un sistema de gestión de biblioteca basado en **microservicios Django**, diseñado para ofrecer modularidad, seguridad y escalabilidad.  

El proyecto se compone de dos microservicios principales:

- 🔐 **auth_service**: gestiona la **autenticación** y administración de usuarios mediante **JWT**.  
- 📖 **Backend**: administra los **materiales de lectura** (libros, mangas, novelas, etc.) y realiza el **seguimiento de la actividad** de los usuarios.

💡 Ambos microservicios se comunican de forma segura mediante **tokens JWT** y se ejecutan dentro de contenedores **Docker**, garantizando independencia, escalabilidad y fácil despliegue en cualquier entorno.

## 📦 Estructura del Proyecto
```
LibraryV1/
├── auth_service/          # Microservicio de autenticación y gestión de usuarios
│   ├── auth_service/      # Código principal de Django (settings, urls, wsgi)
│   ├── migrations/        # Archivos de migraciones de la base de datos
│   ├── admin.py           # Configuración del panel de administración
│   ├── models.py          # Modelos de usuario y roles
│   ├── views.py           # Vistas y lógica de endpoints
│   └── serializers.py     # Serializadores para la API REST
├── Backend/               # Microservicio de biblioteca y gestión de lectura
│   ├── Backend/           # Código principal de Django (settings, urls, wsgi)
│   ├── migrations/        # Archivos de migraciones de la base de datos
│   ├── Dockerfile         # Dockerfile para construir la imagen del contenedor
│   ├── manage.py          # Script principal de Django para comandos (migrate, runserver, etc.)
│   ├── models.py          # Modelos de materiales y registros de lectura
│   ├── views.py           # Vistas y lógica de endpoints
│   └── serializers.py     # Serializadores para la API REST
└── docker-compose.yml     # Orquestación de contenedores Docker para ambos microservicios

```

## 🛠️ Tecnologías Usadas

- Python 3.11            - Lenguaje principal
- Django 5.x             - Framework web
- Django REST Framework  - Creación de APIs REST
- SQLite / PostgreSQL    - Bases de datos
- Docker                 - Contenedores para microservicios
- Docker Compose         - Orquestación de contenedores
- JWT (JSON Web Token)   - Autenticación entre microservicios
- Git / GitHub           - Control de versiones y repositorio remoto
- HTML / CSS / Bootstrap - Interfaz básica para administración


## Indicaciones 


### 1. Clonar el repositorio
```
git clone https://github.com/Dilan1615/Contenedor_biblioteca.git
cd Contenedor_biblioteca
```
### 2. Construir y levantar los contenedores
```
docker compose build
docker compose up -d
```
### 3. Verificar que los servicios estén corriendo
```
docker ps
docker logs -f auth_service_libris
docker logs -f lectura_api_libris
```

## 🌐 Endpoints API

Base URL: http://127.0.0.1:8001/

### 👤 Usuarios
- `POST /api/register` - crear usuario
- `POST /api/login` - Iniciar sesion en la cuenta
- `POST /api/logout` - Cerrar sesion

Base URL: http://127.0.0.1:8003/

### 📖 Backend - Materiales de lectura
- `GET /api/libros/ `- Listar libros
- `POST /api/libros/` - Crear libro
- `GET /api/mangas/ `- Listar mangas
- `POST /api/mangas/` - Crear manga
- `GET /api/novelas/ `- Listar novelas
- `POST /api/novelas/ `- Crear novela

### 📚 Registro de lectura
- `GET /api/lectura/` - Listar registros
- `POST /api/lectura/` - Crear registro de lectura
