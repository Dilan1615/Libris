# 📚 Libris - Documentación de API REST

Bienvenido a la documentación técnica de la aplicación **Libris**, una plataforma móvil para gestionar y compartir bibliotecas digitales.

## 📖 Contenido de la Documentación

Esta documentación está organizada en varios documentos especializados:

### 1. 📡 [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Referencia Completa
**La guía técnica más completa.** Contiene:
- ✅ Descripción de todos los endpoints REST
- ✅ Estructura de requests y responses
- ✅ Códigos de estado HTTP explicados
- ✅ Ejemplos de uso en Flutter
- ✅ Manejo de errores y autenticación

**Ideal para:**
- Desarrolladores que necesitan referencia técnica completa
- Entender la estructura de cada endpoint
- Ver ejemplos detallados de requests/responses

---

### 2. ⚡ [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Guía Rápida
**La referencia de bolsillo.** Contiene:
- 🚀 Tabla de endpoints principales
- ⏱️ Códigos HTTP de un vistazo
- 💡 Patrones comunes de uso
- 🔧 Cheat sheets prácticos
- 🆘 Checklist para debugging

**Ideal para:**
- Consultas rápidas durante desarrollo
- Recordar rápidamente un endpoint
- Resolver problemas comunes

---

### 3. 📊 [HTTP_STATUS_CODES.md](HTTP_STATUS_CODES.md) - Códigos HTTP Detallado
**Guía exhaustiva de códigos de estado.** Contiene:
- 📋 Tabla completa de códigos 2xx, 4xx, 5xx
- 🎯 Cuándo aparece cada código
- 🔄 Cómo manejar cada error
- 💻 Código Dart de ejemplo para cada error
- 📊 Tabla de decisión (¿Reintentar? ¿Logout?)

**Ideal para:**
- Entender completamente los códigos de error
- Implementar manejo robusto de errores
- Testing de escenarios de error

---

### 4. 💻 [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Guía de Implementación
**Cómo integrar en tu código Flutter.** Contiene:
- 🔧 Configuración inicial del proyecto
- 📡 Implementación de ApiClient
- 🔐 Manejo de autenticación
- 📚 Ejemplos de cada endpoint
- 🎨 Código de páginas completas
- 📦 Uso de ChangeNotifier

**Ideal para:**
- Implementar la API en tu app
- Ver código Flutter real y funcional
- Entender el flujo de datos

---

### 5. 📊 [DATA_MODELS.md](DATA_MODELS.md) - Modelos de Datos
**Estructura de los objetos intercambiados.** Contiene:
- 👤 UserProfile
- 📚 ReadingItem
- 📖 ReadingRecord
- ⭐ Rating
- 💬 UserComment
- 🔗 Mapeos y validaciones
- 🎨 Extensiones útiles

**Ideal para:**
- Entender la estructura de datos
- Validar datos antes de enviar
- Construir modelos locales

---

## 🚀 Comenzar Rápido

### Para Principiantes
1. Lee [QUICK_REFERENCE.md](QUICK_REFERENCE.md) para entender qué hace la API
2. Lee [DATA_MODELS.md](DATA_MODELS.md) para entender los datos
3. Lee [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) para implementar

### Para Desarrolladores Experimentados
1. Consulta [API_DOCUMENTATION.md](API_DOCUMENTATION.md) para referencia completa
2. Usa [QUICK_REFERENCE.md](QUICK_REFERENCE.md) como cheat sheet
3. Consulta [HTTP_STATUS_CODES.md](HTTP_STATUS_CODES.md) para manejo de errores

### Para Debugging
1. Consulta [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Debugging Checklist
2. Revisa [HTTP_STATUS_CODES.md](HTTP_STATUS_CODES.md) - Troubleshooting

---

## 🎯 Endpoints Principales

```
🔐 AUTENTICACIÓN
POST /api/login/           → Iniciar sesión
POST /api/register/        → Registrarse
POST /api/refresh/         → Refrescar token

📚 CATÁLOGO (Solo lectura)
GET /api/libros/           → Obtener libros
GET /api/mangas/           → Obtener mangas
GET /api/novelas/          → Obtener novelas
GET /api/material/         → Obtener material

📖 MIS LECTURAS (CRUD)
GET    /api/registros/              → Listar
POST   /api/registros/              → Crear
PATCH  /api/registros/{id}/         → Actualizar
DELETE /api/registros/{id}/         → Eliminar

⭐ CALIFICACIONES (CRUD)
GET    /api/calificaciones/         → Listar
POST   /api/calificaciones/         → Crear
PATCH  /api/calificaciones/{id}/    → Actualizar
DELETE /api/calificaciones/{id}/    → Eliminar

💬 COMENTARIOS (CRUD)
GET    /api/comentarios/            → Listar
POST   /api/comentarios/            → Crear
PATCH  /api/comentarios/{id}/       → Actualizar
DELETE /api/comentarios/{id}/       → Eliminar
```

---

## 🔐 Autenticación

### Token Flow
```
1. POST /api/login/ 
   ↓ Recibir access_token + refresh_token
2. Guardar en almacenamiento seguro
   ↓
3. Incluir en header: Authorization: Bearer <token>
   ↓
4. Si 401: POST /api/refresh/
   ↓ Obtener nuevo token
5. Reintentar request original
```

### Headers Requeridos
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>  # Solo si autenticado
```

---

## 📊 Estructura de Respuestas

### Éxito (200, 201)
```json
{
  "id": 1,
  "titulo": "El Señor de los Anillos",
  "tipo": "Libro",
  ...
}
```

### Error (4xx, 5xx)
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Descripción del error",
  "details": {
    "campo": ["Mensaje de validación"]
  }
}
```

---

## ⏱️ Códigos de Estado HTTP

| Código | Significado | Acción |
|--------|-------------|--------|
| **200** | OK | Continuar |
| **201** | Created | Recurso creado |
| **204** | No Content | Eliminado |
| **400** | Bad Request | Validar datos |
| **401** | Unauthorized | Refrescar token / Login |
| **403** | Forbidden | Sin permisos |
| **404** | Not Found | ID no existe |
| **409** | Conflict | Ya existe |
| **500** | Server Error | Reintentar después |

---

## 🛠️ Configuración

### Base URL por Plataforma
```dart
// Web
'http://localhost:8000'

// Android Emulador
'http://10.0.2.2:8000'

// Android Dispositivo / iOS
'http://192.168.110.53:8000'
```

### Dependencias Requeridas
```yaml
dio: ^5.4.3+1                    # HTTP Client
provider: ^6.1.5+1               # State Management
flutter_secure_storage: ^9.0.0   # Token Storage
```

---

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

**P: "Token inválido" (401)**
- R: El token expiró. La app intenta refrescarlo automáticamente. Si falla, hacer login de nuevo.
- Ver: [HTTP_STATUS_CODES.md - 401 Unauthorized](HTTP_STATUS_CODES.md#401-unauthorized)

**P: "Email ya existe" (409)**
- R: El email ya está registrado. Usar otro o hacer login con credenciales existentes.
- Ver: [HTTP_STATUS_CODES.md - 409 Conflict](HTTP_STATUS_CODES.md#409-conflict)

**P: "Connection timeout"**
- R: Verificar internet, URL del servidor, o que el servidor esté corriendo.
- Ver: [QUICK_REFERENCE.md - ¿No funciona?](QUICK_REFERENCE.md#debugging-checklist)

**P: "Rating fuera de rango" (400)**
- R: La calificación debe estar entre 1 y 5.
- Ver: [HTTP_STATUS_CODES.md - 400 Bad Request](HTTP_STATUS_CODES.md#400-bad-request)

---

## 🎨 Flujo de la Aplicación

```
Splash Screen
    ↓
¿Tokens guardados?
├─ Sí → Validar → Home
└─ No → Login
    ↓
Login/Register
├─ Éxito → Guardar tokens → Home
└─ Error → Mostrar mensaje
    ↓
Home (Catálogo)
├─ GET /api/libros/
├─ GET /api/mangas/
├─ GET /api/novelas/
└─ GET /api/material/
    ↓
Seleccionar Material
├─ Ver detalles
├─ POST /api/registros/ → Agregar a mis lecturas
├─ POST /api/calificaciones/ → Calificar
└─ POST /api/comentarios/ → Comentar
    ↓
Perfil
├─ Ver mis lecturas
├─ PATCH /api/registros/{id}/ → Actualizar progreso
├─ DELETE /api/registros/{id}/ → Eliminar
└─ Logout
```

---

## 📚 Tipos de Material

| Tipo | Endpoint | Query | Descripción |
|------|----------|-------|-------------|
| Libro | `/api/libros/` | `libro={id}` | Libro tradicional |
| Manga | `/api/mangas/` | `manga={id}` | Manga japonés |
| Novela | `/api/novelas/` | `novela={id}` | Novela literaria |
| Material | `/api/material/` | `material={id}` | Material educativo |

---

## ⭐ Estados de Lectura

```
"leyendo"    → En progreso
"completado" → Terminado
"pausado"    → En pausa
"abandonado" → Descartado
```

---

## ⭐ Escala de Calificaciones

```
1 ⭐              → Muy malo
2 ⭐⭐            → Malo
3 ⭐⭐⭐          → Regular
4 ⭐⭐⭐⭐        → Bueno
5 ⭐⭐⭐⭐⭐      → Excelente
```

---

## 🔗 Enlaces Rápidos

### Documentación Completa
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Referencia técnica exhaustiva
- [HTTP_STATUS_CODES.md](HTTP_STATUS_CODES.md) - Todos los códigos HTTP explicados
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Guía de implementación en Flutter

### Guías Rápidas
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Referencia rápida
- [DATA_MODELS.md](DATA_MODELS.md) - Estructura de datos

### En el Código
- `lib/api/api_client.dart` - Implementación del cliente HTTP
- `lib/api/models.dart` - Modelos de datos
- `lib/providers/libris_state.dart` - Estado global de la app

---

## 💡 Tips Útiles

### 1. Usa Try-Catch para Manejo de Errores
```dart
try {
  await apiClient.login(username, password);
} on DioException catch (e) {
  if (e.response?.statusCode == 401) {
    showError("Usuario o contraseña incorrectos");
  }
}
```

### 2. Valida Datos Antes de Enviar
```dart
if (rating < 1 || rating > 5) {
  showError("Rating debe estar entre 1 y 5");
  return;
}
```

### 3. Reintentos Automáticos para Errores Transitorios
```dart
for (int i = 0; i < 3; i++) {
  try {
    return await apiCall();
  } catch (e) {
    if (i == 2) rethrow;
    await Future.delayed(Duration(seconds: 1 << i));
  }
}
```

### 4. Usa Provider para Estado Global
```dart
Consumer<LibrisState>(
  builder: (context, state, _) {
    if (state.isLoading) return CircularProgressIndicator();
    if (state.error != null) return Text(state.error);
    return ListView(...);
  },
)
```

---

## 📞 Información de Contacto

- **Backend URL:** `http://192.168.110.53:8000`
- **Timeout Conexión:** 60 segundos
- **Timeout Recepción:** 60 segundos

---

## 📝 Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 1/2/2026 | Documentación inicial |

---

## 📄 Licencia

Esta documentación es parte de la aplicación Libris y es de uso interno.

---

**Última Actualización:** 1 de febrero de 2026  
**Versión API:** 1.0.0  
**Versión Flutter:** 3.10.7+
