# 📚 Libris
![Django](https://img.shields.io/badge/django-%23092e20.svg?style=for-the-badge&logo=django&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

Este proyecto con enfoque en la seguridad y buenas prácticas en el backend, ofreciendo servicios de autenticación, autorización y gestión de datos de usuarios y libros.


🔐 Funcionalidades principales

- **🔑 Autenticación y autorización**: Implementación de flujo JWT y OAuth2 completamente funcional, asegurando que solo usuarios autorizados puedan acceder a recursos sensibles.

- **🛡️ Políticas de seguridad**: Configuración de CORS para controlar el acceso desde distintos orígenes y validaciones de entrada para proteger la integridad de los datos.

- **🧪 Pruebas y documentación**: Se incluye una colección de Postman y documentación en Swagger, permitiendo probar los endpoints de autenticación y operaciones sobre recursos de manera sencilla y segura.

- **🧩 Arquitectura visual**: Diagramas C4 actualizados, mostrando claramente los componentes relacionados con la seguridad, flujo de datos y estructura del backend.

## 📊 Diagramas de arquitectura

Los diagramas C4 incluidos en el proyecto ilustran la relación entre usuarios, servicios, bases de datos y componentes de seguridad, facilitando la comprensión y mantenimiento del sistema.

## 🛠️ Tecnologías Usadas

### ⚙️ Backend
- **Python 3.11** - Lenguaje principal.
- **Django 5.x** - Framework web de alto nivel.
- **Django REST Framework** - Creación de APIs REST.
- **JWT (JSON Web Token)** - Autenticación segura.
- **SQLite / PostgreSQL** - Motores de base de datos.

### 🎨 Frontend
- **React** - Biblioteca de JavaScript para interfaces dinámicas.
- **Axios** - Cliente HTTP para comunicación con la API.
- **PDF.js** - Visor de documentos integrado.

### 🔧 Herramientas
- **Git / GitHub** - Control de versiones.
- **Postman** - Pruebas de endpoints.
- **Swagger** - Documentación interactiva de la API.

  
## Indicaciones 


### 1. Clonar el repositorio
```
git clone https://github.com/Dilan1615/Libris.git
cd biblioteca
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

### 4.1 Ejecutar el servidor backend
```
python manage.py runserver
```
### 5. Verificar que Node este instalado
```
node -v
npm -v
```
### 6. Entrar a la carpeta del frontend ( donde se ubique el package.json)
```
cd FRONT
```
### 7. Instalar dependencias
```
npm install
```

### 8. Ejecutar el proyecto
```
npm run dev
```
### 9. Estrctura del proyecto
```
biblioteca/
```
#### 9.2 Backend
```
biblioteca/
├── api/                       # Aplicación principal de la API
│   ├── authentications.py     # Lógica personalizada de autenticación/JWT
│   ├── middleware.py          # Procesamiento de peticiones (CORS, logs, etc.)
│   ├── models.py              # Definición de la base de datos (Libros, Usuarios)
│   ├── serializers.py         # Conversión de modelos a formato JSON
│   ├── views.py               # Lógica de los endpoints y respuestas
│   └── utils.py               # Funciones auxiliares reutilizables
├── biblioteca/                # Configuración global del proyecto
│   ├── settings.py            # Configuración de BD, Apps y Middleware
│   ├── urls.py                # Enrutador principal del proyecto
│   └── wsgi.py / asgi.py      # Puntos de entrada para el servidor web
├── media/                     # Almacenamiento de archivos estáticos subidos
│   ├── contenidos/            # Archivos PDF (Libros, Mangas, Novelas)
│   │   ├── manga/
│   │   ├──libros/
│   │   └──novelas/
│   └── portadas/              # Imágenes de las portadas (Libros, Mangas, Novelas)
│       ├── manga/
│       ├──libros/
│       └──novelas/
├── db.sqlite3                 # Base de datos local (Desarrollo)
└── manage.py                  # Utilidad de comandos de Django
```
#### 9.2 Frontend
```
FRONT/
├── public/
│   └── pdfjs/
│       └── viewer.html        # Visor de archivos PDF integrado
├── src/
│   ├── api/                   # Servicios de comunicación con el backend
│   │   ├── adminService.js    # Lógica para administración
│   │   ├── apiClient.js       # Configuración base de Axios/Fetch
│   │   ├── authService.js     # Lógica de autenticación (Login/Registro)
│   │   ├── materialService.js # Gestión de materiales (libros, documentos)
│   │   └── ratingService.js   # Gestión de calificaciones y reseñas
│   ├── components/            # Componentes reutilizables de la interfaz
│   │   ├── AccessibleButton.jsx
│   │   ├── AdminTable.jsx
│   │   ├── CommentModal.jsx
│   │   ├── MaterialCard.jsx
│   │   ├── RatingStars.jsx
│   │   └── RegistroCard.jsx
│   ├── context/               # Gestión de estado global
│   │   └── AuthContext.jsx    # Contexto para manejar la sesión del usuario
│   ├── pages/                 # Páginas principales de la aplicación
│   │   ├── AdminDashboard_old.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── DetalleMaterialPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── LeerPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── RegisterPage.jsx
│   ├── styles/                # Archivos de estilos (CSS/SASS)
│   ├── App.jsx                # Componente raíz y definición de rutas
│   └── main.jsx               # Punto de entrada de la aplicación
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
### 💬 Comentarios
- `POST /comentarios/` - Comentar registro lectura
