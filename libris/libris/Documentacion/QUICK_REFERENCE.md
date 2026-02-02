# 🚀 Guía Rápida - API REST Libris

## 🎯 Endpoints Principales por Funcionalidad

### 🔐 Autenticación Rápida
```
POST /api/login/
POST /api/register/
POST /api/refresh/
```

### 📚 Catálogo (Solo Lectura)
```
GET /api/libros/
GET /api/mangas/
GET /api/novelas/
GET /api/material/
```

### 📖 Mis Lecturas (CRUD)
```
GET    /api/registros/              → Listar
POST   /api/registros/              → Crear
PATCH  /api/registros/{id}/         → Actualizar
DELETE /api/registros/{id}/         → Eliminar
```

### ⭐ Calificaciones (CRUD)
```
GET    /api/calificaciones/         → Listar
POST   /api/calificaciones/         → Crear
PATCH  /api/calificaciones/{id}/    → Actualizar
DELETE /api/calificaciones/{id}/    → Eliminar
```

### 💬 Comentarios (CRUD)
```
GET    /api/comentarios/?libro={id}  → Listar
POST   /api/comentarios/             → Crear
PATCH  /api/comentarios/{id}/        → Actualizar
DELETE /api/comentarios/{id}/        → Eliminar
```

---

## ⚡ Cheat Sheet - Códigos HTTP

| Código | Significado | Acción |
|--------|-------------|--------|
| **200** | ✅ OK | Éxito, continuar |
| **201** | ✅ Created | Recurso creado, OK |
| **204** | ✅ No Content | Eliminado, OK |
| **400** | ❌ Bad Request | Validar datos |
| **401** | ❌ Unauthorized | Refrescar token o login |
| **403** | ❌ Forbidden | Sin permisos |
| **404** | ❌ Not Found | ID no existe |
| **409** | ❌ Conflict | Ya existe |
| **500** | ❌ Server Error | Reintentar después |

---

## 🔄 Token Management

### Flujo de Autenticación
```
1. POST /api/login/ → Recibir access_token + refresh_token
2. Guardar tokens en almacenamiento seguro
3. Incluir en header: Authorization: Bearer <access_token>
4. Cuando 401: POST /api/refresh/ con refresh_token
5. Actualizar access_token
6. Reintentar request original
```

### Interceptor en Acción
```dart
// Automático en ApiClient:
DioException (401) 
  → Intenta _refresh()
  → Si OK: Reintentar request
  → Si FALLA: Logout
```

---

## 📦 Estructura de Respuestas

### Success (Listado)
```json
[
  {
    "id": 1,
    "titulo": "Título",
    "tipo": "Libro",
    "autor": "Autor",
    ...
  }
]
```

### Success (Individual)
```json
{
  "id": 1,
  "username": "usuario",
  "email": "user@example.com",
  ...
}
```

### Error
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Descripción del error",
  "details": { "campo": ["Mensaje de validación"] }
}
```

---

## 🛠️ Debugging Checklist

### ¿No funciona un request?
- [ ] ¿Incluyo Bearer token en header?
- [ ] ¿El token está vigente?
- [ ] ¿La URL es correcta?
- [ ] ¿Los parámetros son válidos?
- [ ] ¿El método HTTP es correcto?
- [ ] ¿El servidor está corriendo?

### Status 401 (Unauthorized)
- [ ] ¿El token expiró?
- [ ] ¿El token es válido?
- [ ] ¿El usuario fue eliminado?
- → Solución: Refrescar token o hacer login

### Status 400 (Bad Request)
- [ ] ¿Todos los campos requeridos?
- [ ] ¿Formatos correctos?
- [ ] ¿Valores dentro de rango?
- → Ver `details` en respuesta de error

### Status 404 (Not Found)
- [ ] ¿El ID existe?
- [ ] ¿El ID es número válido?
- → Verificar listado primero

### Status 500 (Server Error)
- → Reintentar después
- → Revisar logs del servidor
- → Contactar soporte

---

## 💡 Patrones Comunes

### Pattern 1: Listar + Filtrar
```dart
// Obtener todos
final items = await apiClient.fetchCatalog();

// Filtrar en cliente
final filtered = items.where((item) => 
  item.titulo.toLowerCase().contains(searchTerm)
).toList();
```

### Pattern 2: Crear + Actualizar
```dart
// Crear
final record = await apiClient.createReadingRecord(newRecord, tipo: 'libro');

// Después actualizar
final updated = await apiClient.updateReadingRecord(record.id, modifiedRecord);
```

### Pattern 3: Manejo de Errores
```dart
try {
  await apiClient.login(username, password);
} on DioException catch (e) {
  if (e.response?.statusCode == 401) {
    showError("Credenciales incorrectas");
  } else if (e.type == DioExceptionType.connectionTimeout) {
    showError("Conexión lenta. Intenta de nuevo");
  } else {
    showError("Error inesperado");
  }
}
```

### Pattern 4: Reintentos
```dart
Future<T> retryWithBackoff<T>(Future<T> Function() fn) async {
  for (int i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i == 2) rethrow;
      await Future.delayed(Duration(seconds: 1 << i)); // 1s, 2s, 4s
    }
  }
}
```

---

## 🎓 Ejemplos por Caso de Uso

### Caso 1: Usuario se registra
```
1. POST /api/register/ 
   ✅ 201 Created → Ir a login
   ❌ 400 Bad Request → Mostrar errores
   ❌ 409 Conflict → Email ya existe
```

### Caso 2: Usuario ve catálogo
```
1. GET /api/libros/
   ✅ 200 OK → Mostrar libros
   ❌ 401 Unauthorized → Token expirado → Refrescar
   ❌ 403 Forbidden → Usuario sin acceso
```

### Caso 3: Usuario agrega libro a sus lecturas
```
1. POST /api/registros/
   ✅ 201 Created → Mostrar confirmación
   ❌ 400 Bad Request → materialId inválido
   ❌ 409 Conflict → Ya está registrado
```

### Caso 4: Usuario califica material
```
1. POST /api/calificaciones/
   ✅ 201 Created → Mostrar éxito
   ❌ 400 Bad Request → Rating fuera de 1-5
   ❌ 409 Conflict → Ya calificó
   ❌ 404 Not Found → Material no existe
```

---

## 🔧 Configuración

### Base URL por Plataforma
```dart
// Web
'http://localhost:8000'

// Android Emulador
'http://10.0.2.2:8000'

// Android Dispositivo
'http://192.168.110.53:8000'

// iOS Simulator
'http://localhost:8000'

// iOS Dispositivo
'http://192.168.110.53:8000'
```

### Timeouts
```dart
connectTimeout: Duration(seconds: 60)
receiveTimeout: Duration(seconds: 60)
```

### Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}  // Solo si autenticado
```

---

## 📋 Tipos de Material

| Tipo | Endpoint | Query Param |
|------|----------|------------|
| Libro | `/api/libros/` | `libro={id}` |
| Manga | `/api/mangas/` | `manga={id}` |
| Novela | `/api/novelas/` | `novela={id}` |
| Material | `/api/material/` | `material={id}` |

---

## ⏱️ Estados de Lectura

```
"leyendo"    → En progreso
"completado" → Terminado
"pausado"    → En pausa
"abandonado" → Descartado
```

---

## ⭐ Escala de Calificaciones

```
1 ⭐    → Muy malo
2 ⭐⭐  → Malo
3 ⭐⭐⭐      → Regular
4 ⭐⭐⭐⭐    → Bueno
5 ⭐⭐⭐⭐⭐  → Excelente
```

---

## 🆘 Errores Comunes

### Error: "Token inválido"
```
Status: 401
Solución: Refrescar token o hacer login
```

### Error: "Email ya existe"
```
Status: 409
Solución: Usar otro email
```

### Error: "Rating fuera de rango"
```
Status: 400
Solución: Rating debe ser 1-5
```

### Error: "Connection timeout"
```
Tipo: DioExceptionType.connectionTimeout
Solución: Verificar internet, reintentar
```

### Error: "No autorizado"
```
Status: 403
Solución: Verificar permisos del usuario
```

---

## 📊 Flujo Completo de App

```
Splash Screen
    ↓
¿Tokens guardados?
├─ Sí → Validar con refresh → Home
├─ No → Login
    ↓
Login/Register
├─ Success → Guardar tokens → Home
├─ Error 401 → Mostrar error
├─ Error 409 → Email existe
└─ Error 400 → Validación fallida
    ↓
Home (Catálogo)
├─ GET /api/libros/ → Mostrar
├─ GET /api/mangas/
├─ GET /api/novelas/
└─ GET /api/material/
    ↓
Seleccionar Material
├─ POST /api/registros/ → Guardar lectura
├─ POST /api/calificaciones/ → Calificar
└─ POST /api/comentarios/ → Comentar
    ↓
Perfil
├─ Ver mis lecturas: GET /api/registros/
├─ Actualizar: PATCH /api/registros/{id}/
├─ Eliminar: DELETE /api/registros/{id}/
└─ Logout
```

---

## 🎯 Testing Manual

### 1. Verificar API accesible
```bash
curl http://192.168.110.53:8000/api/login/
# Debe devolver error 400 (Bad Request) sin parámetros
```

### 2. Login
```bash
curl -X POST http://192.168.110.53:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
# Debe devolver tokens
```

### 3. Usar Token
```bash
TOKEN="tu_access_token_aqui"
curl http://192.168.110.53:8000/api/libros/ \
  -H "Authorization: Bearer $TOKEN"
# Debe devolver lista de libros
```

---

**Última Actualización:** 1 de febrero de 2026
