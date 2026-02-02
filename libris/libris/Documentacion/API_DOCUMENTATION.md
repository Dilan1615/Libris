# 📚 Documentación API REST - Libris

## 📖 Descripción General

Esta documentación describe todos los endpoints REST que consume la aplicación móvil **Libris** desde el servidor backend. Libris es una aplicación para gestionar y compartir bibliotecas digitales con funcionalidades de lectura, calificaciones y comentarios.

**Base URL:** `http://192.168.110.53:8000`, es es para la red de la aplicacion y permitir conectarse al backend desde otros dispositivos en la misma red, se debe cambiar dependinedo a la red que se encuentra concetada el dispositivo

---

## 🔐 Autenticación

### Sistema de Tokens JWT

La aplicación utiliza autenticación basada en **JWT (JSON Web Tokens)** con los siguientes componentes:

- **Access Token**: Token de corta duración (típicamente 15-30 minutos) utilizado para autorizar requests
- **Refresh Token**: Token de larga duración utilizado para renovar el access token sin necesidad de volver a hacer login
- **Almacenamiento**: Los tokens se guardan en almacenamiento seguro del dispositivo

### Headers de Autenticación

Todos los endpoints protegidos requieren el siguiente header:

```
Authorization: Bearer <access_token>
```

---

## 🌐 Endpoints REST Disponibles

### 1. AUTENTICACIÓN

#### 1.1 Login
- **Método:** `POST`
- **Endpoint:** `/api/login/`
- **Descripción:** Autentica un usuario y devuelve tokens de acceso
- **Requiere Autenticación:** ❌ No
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
  ```
- **Códigos de Error:**
  - `400 Bad Request`: Credenciales inválidas o campos faltantes
  - `401 Unauthorized`: Usuario o contraseña incorrectos

---

#### 1.2 Registro
- **Método:** `POST`
- **Endpoint:** `/api/register/`
- **Descripción:** Registra un nuevo usuario en el sistema
- **Requiere Autenticación:** ❌ No
- **Request Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "password2": "string"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "string",
    "mensaje": "Usuario creado exitosamente"
  }
  ```
- **Códigos de Error:**
  - `400 Bad Request`: Validación fallida
  - `409 Conflict`: Usuario o email ya existe

---

#### 1.3 Refrescar Token
- **Método:** `POST`
- **Endpoint:** `/api/refresh/`
- **Descripción:** Genera un nuevo access token usando el refresh token
- **Requiere Autenticación:** ❌ No
- **Request Body:**
  ```json
  {
    "refresh": "string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
  ```
- **Códigos de Error:**
  - `401 Unauthorized`: Refresh token inválido o expirado

---

### 2. CATÁLOGO DE MATERIALES

#### 2.1 Obtener Libros
- **Método:** `GET`
- **Endpoint:** `/api/libros/`
- **Descripción:** Obtiene lista de todos los libros disponibles
- **Requiere Autenticación:** ✅ Sí
- **Query Parameters:**
  - `search` (opcional): Buscar por título o autor
  - `page` (opcional): Número de página para paginación
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "titulo": "string",
      "tipo": "Libro",
      "autor": "string",
      "descripcion": "string",
      "portada": "url_string",
      "archivo": "url_string",
      "contenido_pdf_url": "url_string",
      "numero_paginas": 300
    }
  ]
  ```
- **Códigos de Error:**
  - `401 Unauthorized`: Token inválido o expirado
  - `403 Forbidden`: Usuario no autorizado

---

#### 2.2 Obtener Mangas
- **Método:** `GET`
- **Endpoint:** `/api/mangas/`
- **Descripción:** Obtiene lista de todos los mangas disponibles
- **Requiere Autenticación:** ✅ Sí
- **Query Parameters:** Igual a libros
- **Response:** Mismo formato que libros pero con `tipo: "Manga"`
- **Códigos de Error:** Igual a libros

---

#### 2.3 Obtener Novelas
- **Método:** `GET`
- **Endpoint:** `/api/novelas/`
- **Descripción:** Obtiene lista de todas las novelas disponibles
- **Requiere Autenticación:** ✅ Sí
- **Query Parameters:** Igual a libros
- **Response:** Mismo formato que libros pero con `tipo: "Novela"`
- **Códigos de Error:** Igual a libros

---

#### 2.4 Obtener Material General
- **Método:** `GET`
- **Endpoint:** `/api/material/`
- **Descripción:** Obtiene lista de material general disponible
- **Requiere Autenticación:** ✅ Sí
- **Query Parameters:** Igual a libros
- **Response:** Mismo formato que libros pero con `tipo: "Material"`
- **Códigos de Error:** Igual a libros

---

### 3. REGISTROS DE LECTURA

#### 3.1 Obtener Registros de Lectura
- **Método:** `GET`
- **Endpoint:** `/api/registros/`
- **Descripción:** Obtiene todos los registros de lectura del usuario autenticado
- **Requiere Autenticación:** ✅ Sí
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "usuario": 1,
      "tipo": "libro",
      "libro": 5,
      "pagina_actual": 100,
      "estado": "leyendo",
      "fecha_creacion": "2024-01-15T10:30:00Z",
      "fecha_actualizacion": "2024-01-20T14:20:00Z"
    }
  ]
  ```
- **Estados Válidos:** `"leyendo"`, `"completado"`, `"pausado"`, `"abandonado"`
- **Códigos de Error:**
  - `401 Unauthorized`: Token inválido

---

#### 3.2 Crear Registro de Lectura
- **Método:** `POST`
- **Endpoint:** `/api/registros/`
- **Descripción:** Crea un nuevo registro de lectura para el usuario
- **Requiere Autenticación:** ✅ Sí
- **Request Body:**
  ```json
  {
    "tipo": "libro",
    "libro": 5,
    "pagina_actual": 0,
    "estado": "leyendo"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "usuario": 1,
    "tipo": "libro",
    "libro": 5,
    "pagina_actual": 0,
    "estado": "leyendo",
    "fecha_creacion": "2024-01-15T10:30:00Z",
    "fecha_actualizacion": "2024-01-15T10:30:00Z"
  }
  ```
- **Códigos de Error:**
  - `400 Bad Request`: Datos inválidos o materialId no válido
  - `401 Unauthorized`: Token inválido
  - `500 Internal Server Error`: Error del servidor

---

#### 3.3 Actualizar Registro de Lectura
- **Método:** `PATCH`
- **Endpoint:** `/api/registros/{id}/`
- **Descripción:** Actualiza un registro de lectura existente
- **Requiere Autenticación:** ✅ Sí
- **URL Parameters:**
  - `id` (requerido): ID del registro de lectura
- **Request Body:**
  ```json
  {
    "tipo": "libro",
    "libro": 5,
    "pagina_actual": 150,
    "estado": "leyendo"
  }
  ```
- **Response (200 OK):** Mismo formato que GET registros
- **Códigos de Error:**
  - `400 Bad Request`: Datos inválidos
  - `401 Unauthorized`: Token inválido
  - `404 Not Found`: Registro no encontrado
  - `500 Internal Server Error`: Error del servidor

---

#### 3.4 Eliminar Registro de Lectura
- **Método:** `DELETE`
- **Endpoint:** `/api/registros/{id}/`
- **Descripción:** Elimina un registro de lectura
- **Requiere Autenticación:** ✅ Sí
- **URL Parameters:**
  - `id` (requerido): ID del registro de lectura
- **Response:** 
  - `204 No Content`: Eliminado exitosamente
- **Códigos de Error:**
  - `401 Unauthorized`: Token inválido
  - `404 Not Found`: Registro no encontrado

---

### 4. CALIFICACIONES

#### 4.1 Obtener Calificaciones
- **Método:** `GET`
- **Endpoint:** `/api/calificaciones/`
- **Descripción:** Obtiene todas las calificaciones del usuario
- **Requiere Autenticación:** ✅ Sí
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "usuario": 1,
      "tipo": "libro",
      "libro": 5,
      "rating": 4,
      "fecha_creacion": "2024-01-15T10:30:00Z",
      "fecha_actualizacion": "2024-01-15T10:30:00Z"
    }
  ]
  ```
- **Escala de Rating:** 1-5 estrellas
- **Códigos de Error:**
  - `401 Unauthorized`: Token inválido

---

#### 4.2 Crear Calificación
- **Método:** `POST`
- **Endpoint:** `/api/calificaciones/`
- **Descripción:** Crea una nueva calificación para un material
- **Requiere Autenticación:** ✅ Sí
- **Request Body:**
  ```json
  {
    "tipo": "libro",
    "libro": 5,
    "rating": 4
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "usuario": 1,
    "tipo": "libro",
    "libro": 5,
    "rating": 4,
    "fecha_creacion": "2024-01-15T10:30:00Z",
    "fecha_actualizacion": "2024-01-15T10:30:00Z"
  }
  ```
- **Códigos de Error:**
  - `400 Bad Request`: Rating fuera de rango (1-5) o materialId no válido
  - `401 Unauthorized`: Token inválido
  - `500 Internal Server Error`: Error del servidor

---

#### 4.3 Actualizar Calificación
- **Método:** `PATCH`
- **Endpoint:** `/api/calificaciones/{id}/`
- **Descripción:** Actualiza una calificación existente
- **Requiere Autenticación:** ✅ Sí
- **URL Parameters:**
  - `id` (requerido): ID de la calificación
- **Request Body:**
  ```json
  {
    "rating": 5
  }
  ```
- **Response (200 OK):** Mismo formato que GET calificaciones
- **Códigos de Error:**
  - `400 Bad Request`: Rating inválido
  - `401 Unauthorized`: Token inválido
  - `404 Not Found`: Calificación no encontrada

---

#### 4.4 Eliminar Calificación
- **Método:** `DELETE`
- **Endpoint:** `/api/calificaciones/{id}/`
- **Descripción:** Elimina una calificación
- **Requiere Autenticación:** ✅ Sí
- **URL Parameters:**
  - `id` (requerido): ID de la calificación
- **Response:** 
  - `204 No Content`: Eliminado exitosamente
- **Códigos de Error:**
  - `401 Unauthorized`: Token inválido
  - `404 Not Found`: Calificación no encontrada

---

### 5. COMENTARIOS

#### 5.1 Obtener Comentarios de un Material
- **Método:** `GET`
- **Endpoint:** `/api/comentarios/?{material_query}={material_id}`
- **Descripción:** Obtiene todos los comentarios para un material específico
- **Requiere Autenticación:** ✅ Sí
- **Query Parameters:**
  - `libro`, `manga`, `novela`, o `material`: ID del material (usar el correspondiente al tipo)
- **Ejemplo:** `/api/comentarios/?libro=5`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "usuario": 1,
      "nombre_usuario": "username",
      "tipo": "libro",
      "libro": 5,
      "descripcion": "Comentario del usuario",
      "fecha_creacion": "2024-01-15T10:30:00Z",
      "fecha_actualizacion": "2024-01-15T10:30:00Z"
    }
  ]
  ```
- **Códigos de Error:**
  - `401 Unauthorized`: Token inválido

---

#### 5.2 Crear Comentario
- **Método:** `POST`
- **Endpoint:** `/api/comentarios/`
- **Descripción:** Crea un nuevo comentario para un material
- **Requiere Autenticación:** ✅ Sí
- **Request Body:**
  ```json
  {
    "tipo": "libro",
    "libro": 5,
    "descripcion": "Este libro es excelente!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "usuario": 1,
    "nombre_usuario": "username",
    "tipo": "libro",
    "libro": 5,
    "descripcion": "Este libro es excelente!",
    "fecha_creacion": "2024-01-15T10:30:00Z",
    "fecha_actualizacion": "2024-01-15T10:30:00Z"
  }
  ```
- **Códigos de Error:**
  - `400 Bad Request`: Descripción vacía o materialId no válido
  - `401 Unauthorized`: Token inválido
  - `500 Internal Server Error`: Error del servidor

---

#### 5.3 Actualizar Comentario
- **Método:** `PATCH`
- **Endpoint:** `/api/comentarios/{id}/`
- **Descripción:** Actualiza un comentario existente
- **Requiere Autenticación:** ✅ Sí
- **URL Parameters:**
  - `id` (requerido): ID del comentario
- **Request Body:**
  ```json
  {
    "descripcion": "Mi nuevo comentario actualizado"
  }
  ```
- **Response (200 OK):** Mismo formato que GET comentarios
- **Códigos de Error:**
  - `400 Bad Request`: Descripción vacía
  - `401 Unauthorized`: Token inválido
  - `404 Not Found`: Comentario no encontrado

---

#### 5.4 Eliminar Comentario
- **Método:** `DELETE`
- **Endpoint:** `/api/comentarios/{id}/`
- **Descripción:** Elimina un comentario
- **Requiere Autenticación:** ✅ Sí
- **URL Parameters:**
  - `id` (requerido): ID del comentario
- **Response:** 
  - `204 No Content`: Eliminado exitosamente
- **Códigos de Error:**
  - `401 Unauthorized`: Token inválido
  - `404 Not Found`: Comentario no encontrado

---

### 6. PERFIL DE USUARIO (Potencial)

Endpoints para gestionar el perfil del usuario (a implementar):
- `GET /api/perfil/` - Obtener datos del perfil
- `PUT /api/perfil/` - Actualizar perfil
- `GET /api/perfil/foto/` - Obtener foto de perfil
- `POST /api/perfil/foto/` - Actualizar foto de perfil

---

## 📊 Códigos de Estado HTTP

### Códigos 2xx (Éxito)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `200` | OK | Solicitud exitosa. Respuesta contiene el resultado. |
| `201` | Created | Recurso creado exitosamente. Típicamente usado en POST. |
| `204` | No Content | Solicitud exitosa pero sin contenido. Típico en DELETE. |

### Códigos 4xx (Error del Cliente)

| Código | Nombre | Descripción | Acción Recomendada |
|--------|--------|-------------|-------------------|
| `400` | Bad Request | Solicitud inválida (parámetros mal formados). | Validar datos antes de enviar. Revisar logs del servidor. |
| `401` | Unauthorized | Token inválido, expirado o ausente. | Refrescar token o rehacer login. |
| `403` | Forbidden | Usuario autenticado pero sin permisos. | Verificar rol del usuario. |
| `404` | Not Found | Recurso no encontrado. | Verificar que el ID del recurso existe. |
| `409` | Conflict | Conflicto (ej: usuario ya existe). | Usar otros parámetros o eliminar conflicto. |

### Códigos 5xx (Error del Servidor)

| Código | Nombre | Descripción | Acción Recomendada |
|--------|--------|-------------|-------------------|
| `500` | Internal Server Error | Error general del servidor. | Reintentar después. Contactar soporte. |
| `502` | Bad Gateway | Servidor no responde correctamente. | Verificar conexión. Reintentar. |
| `503` | Service Unavailable | Servidor no disponible (mantenimiento). | Esperar e intentar más tarde. |

---

## ❌ Tipos de Errores Comunes

### 1. Errores de Autenticación

#### Error: "Token Inválido"
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Token inválido o expirado"
}
```
**Causas Posibles:**
- Token expirado
- Token mal formado
- Token no incluido en el header Authorization
- Usuario eliminado después de generar el token

**Solución:**
```dart
// En ApiClient
if (error.response?.statusCode == 401 && _refreshToken != null) {
  final refreshed = await _refresh();
  if (refreshed) {
    // Reintentar la solicitud
  } else {
    // Hacer logout
  }
}
```

#### Error: "Credenciales Inválidas"
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Usuario o contraseña incorrectos"
}
```
**Causas Posibles:**
- Username incorrecto
- Contraseña incorrecta
- Usuario no existe
- Usuario desactivado

**Solución:**
```dart
// Mostrar mensaje de error amigable al usuario
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(content: Text("Usuario o contraseña incorrectos"))
);
```

---

### 2. Errores de Validación

#### Error 400: "Bad Request"
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Datos inválidos",
  "details": {
    "email": ["Ingrese un email válido"],
    "username": ["El username debe tener al menos 3 caracteres"]
  }
}
```
**Causas Posibles:**
- Campo requerido faltante
- Formato incorrecto
- Valor fuera de rango
- Datos que no cumplen validación del servidor

**Solución:**
```dart
// Validar en el cliente antes de enviar
if (username.length < 3) {
  throw Exception("Username debe tener al menos 3 caracteres");
}
if (!email.contains("@")) {
  throw Exception("Email inválido");
}
```

#### Error: "Recurso Duplicado (409)"
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "El email ya está registrado"
}
```
**Causas Posibles:**
- Username ya existe
- Email ya registrado
- Material ya calificado por el usuario

**Solución:**
```dart
// Verificar disponibilidad antes de registrar
try {
  await apiClient.register(username, email, password, password2);
} catch (e) {
  if (e.toString().contains("409")) {
    // Mostrar que el email ya existe
  }
}
```

---

### 3. Errores de Permisos

#### Error: "No Autorizado (403)"
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "No tienes permisos para acceder a este recurso"
}
```
**Causas Posibles:**
- Usuario intenta acceder a recurso de otro usuario
- Usuario sin rol suficiente
- Recurso limitado a ciertos roles

**Solución:**
```dart
// Mostrar mensaje de error
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(content: Text("No tienes permisos para esto"))
);
```

---

### 4. Errores de Conexión

#### Error: "Connection Timeout"
```
DioException: Connection timeout
```
**Causas Posibles:**
- Servidor no disponible
- Red lenta o desconectada
- URL incorrecta
- Firewall bloqueando conexión

**Solución:**
```dart
// Aumentar timeout
_dio = Dio(
  BaseOptions(
    connectTimeout: const Duration(seconds: 60),
    receiveTimeout: const Duration(seconds: 60),
  ),
);

// Reintentar con backoff exponencial
Future<T> _retryWithBackoff<T>(Future<T> Function() operation) async {
  int retries = 3;
  for (int i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (e) {
      if (i == retries - 1) rethrow;
      await Future.delayed(Duration(seconds: 2 << i)); // 2, 4, 8 segundos
    }
  }
  throw Exception("Max retries exceeded");
}
```

#### Error: "Connection Refused"
```
DioException: Failed host lookup
```
**Causas Posibles:**
- Servidor no está ejecutándose
- Base URL incorrecta
- DNS no resolviendo
- Emulador Android sin acceso a red

**Solución:**
```dart
// Verificar URL en tiempo de ejecución
print('📡 Conectando a: ${_dio.options.baseUrl}');

// Para Android emulador:
// Usar 10.0.2.2 en lugar de localhost
// Usar 192.168.x.x para dispositivo físico
```

---

### 5. Errores de Formato de Datos

#### Error: "Respuesta Inválida"
```
Exception: Invalid response format
```
**Causas Posibles:**
- Response no es JSON válido
- Respuesta es HTML (ej: página de error)
- Tipado incorrecto de campos

**Solución:**
```dart
// Validar respuesta
if (response.data is! Map<String, dynamic>) {
  throw Exception("Respuesta inválida del servidor");
}

// Usar try-catch para deserialización
try {
  final data = response.data as Map<String, dynamic>;
  return ReadingRecord.fromJson(data);
} catch (e) {
  print("Error deserializando: $e");
  throw Exception("Error procesando respuesta del servidor");
}
```

---

## 🔄 Flujo de Manejo de Errores Recomendado

```dart
Future<T> _handleApiCall<T>(Future<T> Function() apiCall) async {
  try {
    return await apiCall();
  } on DioException catch (e) {
    switch (e.response?.statusCode) {
      case 401:
        // Intentar refrescar token
        if (await _refresh()) {
          return await apiCall(); // Reintentar
        } else {
          // Hacer logout
          await logout();
          throw Exception("Sesión expirada. Por favor, inicia sesión de nuevo.");
        }
      
      case 403:
        throw Exception("No tienes permisos para acceder a este recurso.");
      
      case 404:
        throw Exception("El recurso solicitado no fue encontrado.");
      
      case 409:
        throw Exception("Este recurso ya existe o hay un conflicto.");
      
      case 400:
        // Error de validación
        final errorDetails = e.response?.data['details'] ?? {};
        throw Exception("Error de validación: ${errorDetails.toString()}");
      
      case 500:
      case 502:
      case 503:
        throw Exception("Error del servidor. Por favor, intenta más tarde.");
      
      default:
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          throw Exception("Tiempo de conexión agotado. Verifica tu conexión.");
        }
        if (e.type == DioExceptionType.unknown) {
          throw Exception("Error de conexión. Verifica tu internet.");
        }
        throw Exception("Ocurrió un error inesperado.");
    }
  } catch (e) {
    throw Exception("Error desconocido: ${e.toString()}");
  }
}
```

---

## 📱 Ejemplos de Uso en la App

### Ejemplo 1: Login
```dart
try {
  final success = await apiClient.login(username, password);
  if (success) {
    // Navegar a home
  }
} catch (e) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(e.toString()))
  );
}
```

### Ejemplo 2: Crear Registro de Lectura
```dart
try {
  final record = await apiClient.createReadingRecord(
    ReadingRecord(...),
    tipo: 'libro'
  );
  // Mostrar éxito
} on DioException catch (e) {
  if (e.response?.statusCode == 400) {
    // Material ID inválido
  } else if (e.response?.statusCode == 401) {
    // Token expirado
  }
}
```

### Ejemplo 3: Obtener Catálogo con Reintentos
```dart
Future<List<ReadingItem>> fetchCatalogWithRetry() async {
  int retries = 3;
  for (int i = 0; i < retries; i++) {
    try {
      return await apiClient.fetchCatalog();
    } catch (e) {
      if (i == retries - 1) rethrow;
      await Future.delayed(Duration(seconds: 2));
    }
  }
  throw Exception("No se pudo cargar el catálogo");
}
```

---

## 🎯 Resumen de Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/login/` | Login | ❌ |
| POST | `/api/register/` | Registro | ❌ |
| POST | `/api/refresh/` | Refrescar token | ❌ |
| GET | `/api/libros/` | Obtener libros | ✅ |
| GET | `/api/mangas/` | Obtener mangas | ✅ |
| GET | `/api/novelas/` | Obtener novelas | ✅ |
| GET | `/api/material/` | Obtener material | ✅ |
| GET | `/api/registros/` | Obtener registros | ✅ |
| POST | `/api/registros/` | Crear registro | ✅ |
| PATCH | `/api/registros/{id}/` | Actualizar registro | ✅ |
| DELETE | `/api/registros/{id}/` | Eliminar registro | ✅ |
| GET | `/api/calificaciones/` | Obtener calificaciones | ✅ |
| POST | `/api/calificaciones/` | Crear calificación | ✅ |
| PATCH | `/api/calificaciones/{id}/` | Actualizar calificación | ✅ |
| DELETE | `/api/calificaciones/{id}/` | Eliminar calificación | ✅ |
| GET | `/api/comentarios/` | Obtener comentarios | ✅ |
| POST | `/api/comentarios/` | Crear comentario | ✅ |
| PATCH | `/api/comentarios/{id}/` | Actualizar comentario | ✅ |
| DELETE | `/api/comentarios/{id}/` | Eliminar comentario | ✅ |

---

## 📝 Notas Importantes

1. **Manejo de Token Expirado**: La app implementa un interceptor que automáticamente intenta refrescar el token cuando recibe un 401.

2. **Almacenamiento Seguro**: Los tokens se guardan en almacenamiento seguro del dispositivo, no en preferencias de usuario normales.

3. **Paginación**: Algunos endpoints soportan paginación. Usar parámetro `page` en query string.

4. **Normalizacion de Tipos**: Los tipos de material (libro, manga, novela, material) se normalizan a minúsculas en algunas operaciones.

5. **Timestamps**: Las fechas devueltas por el servidor están en formato ISO 8601 (ej: "2024-01-15T10:30:00Z").

6. **Timeouts**: Configurados a 60 segundos para conexión y recepción.

---

**Última Actualización:** 1 de febrero de 2026
**Versión API:** 1.0.0
