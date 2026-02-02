# 📡 Códigos de Estado HTTP y Manejo de Errores - Libris

## 📚 Referencia Completa de Códigos HTTP

### Familia 2xx - Éxito ✅

#### 200 OK
**Significado:** Solicitud procesada exitosamente
**Cuándo aparece:** GET, PATCH con datos modificados
**Respuesta típica:** Los datos solicitados
```json
{
  "id": 1,
  "titulo": "El Señor de los Anillos",
  "autor": "J.R.R. Tolkien",
  ...
}
```
**Acciones en la app:**
- Mostrar los datos
- Procesar y guardar en estado local
- Actualizar UI

---

#### 201 Created
**Significado:** Recurso creado exitosamente
**Cuándo aparece:** POST al crear nuevo recurso
**Respuesta típica:** El recurso creado con su ID
```json
{
  "id": 1,
  "usuario": 1,
  "tipo": "libro",
  "libro": 5,
  "pagina_actual": 0,
  "estado": "leyendo",
  "fecha_creacion": "2024-01-15T10:30:00Z"
}
```
**Acciones en la app:**
- Mostrar mensaje de éxito
- Navegar o actualizar lista
- Usar el ID devuelto para acciones futuras

**Endpoints que usan 201:**
- POST /api/register/
- POST /api/registros/
- POST /api/calificaciones/
- POST /api/comentarios/

---

#### 204 No Content
**Significado:** Operación exitosa sin contenido en la respuesta
**Cuándo aparece:** DELETE exitoso
**Respuesta típica:** Sin cuerpo (vacío)
```
(Sin contenido)
```
**Acciones en la app:**
- Mostrar confirmación de eliminación
- Remover item de lista
- Actualizar UI sin esperar datos

**Endpoints que usan 204:**
- DELETE /api/registros/{id}/
- DELETE /api/calificaciones/{id}/
- DELETE /api/comentarios/{id}/

---

### Familia 3xx - Redirección 🔄
**Nota:** Normalmente la app no vea estos, los clientes HTTP los manejan automáticamente.

#### 301 Moved Permanently
#### 302 Found
#### 304 Not Modified
*Generalmente no afectan a la app móvil*

---

### Familia 4xx - Error del Cliente ❌

#### 400 Bad Request
**Significado:** Solicitud mal formada o datos inválidos
**Cuándo aparece:** 
- Campos requeridos faltantes
- Formato incorrecto
- Datos fuera de rango
- JSON mal formado

**Respuesta típica:**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Errores de validación",
  "details": {
    "email": ["Ingrese un email válido"],
    "password": ["La contraseña debe tener al menos 8 caracteres"],
    "rating": ["La calificación debe estar entre 1 y 5"]
  }
}
```

**Causas posibles en Libris:**
- Rating no entre 1-5
- materialId = 0 o negativo
- Descripción vacía en comentario
- Estado de lectura inválido
- Página actual mayor que total de páginas
- Formato JSON inválido

**Manejo en la app:**
```dart
try {
  await apiClient.createRating(tipo: "libro", materialId: 5, rating: 10);
} on DioException catch (e) {
  if (e.response?.statusCode == 400) {
    final details = e.response?.data['details'];
    if (details['rating'] != null) {
      showError("Calificación debe estar entre 1 y 5");
    }
  }
}
```

---

#### 401 Unauthorized
**Significado:** Autenticación requerida o inválida
**Cuándo aparece:**
- No se envía token
- Token expirado
- Token inválido o malformado
- Usuario eliminado

**Respuesta típica:**
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Token inválido o expirado"
}
```

**Diferencia 401 vs 403:**
- `401`: "¿Quién eres?" (No autenticado)
- `403`: "Sé quién eres pero no tienes acceso" (No autorizado)

**Manejo en la app (Automático):**
```dart
// ApiClient manejador automático:
onError: (DioException error, handler) async {
  if (error.response?.statusCode == 401 && _refreshToken != null) {
    // Intenta refrescar token
    final refreshed = await _refresh();
    if (refreshed) {
      // Reintentar request original
      return handler.resolve(retryResponse);
    } else {
      // Token inválido, hacer logout
      await logout();
      return handler.reject(error);
    }
  }
  return handler.next(error);
}
```

**Casos en Libris:**
```
Caso 1: Token expirado (típico)
┌─ Recibir 401
├─ POST /api/refresh/ con refresh_token
├─ Si OK → Guardar nuevo token
├─ Reintentar request original
└─ Continuar

Caso 2: Refresh token inválido
┌─ Recibir 401
├─ POST /api/refresh/ → Falla
├─ Hacer logout automático
└─ Mostrar: "Sesión expirada. Inicia sesión de nuevo"

Caso 3: Usuario no envía token
┌─ Recibir 401
└─ Mostrar: "Debes iniciar sesión"
```

---

#### 403 Forbidden
**Significado:** Usuario autenticado pero sin permisos
**Cuándo aparece:**
- Usuario intenta acceder recurso de otro usuario
- Usuario rol insuficiente
- Recurso restringido a ciertos roles

**Respuesta típica:**
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "No tienes permisos para acceder a este recurso"
}
```

**Manejo en la app:**
```dart
try {
  await apiClient.someRestrictedOperation();
} on DioException catch (e) {
  if (e.response?.statusCode == 403) {
    showError("No tienes permisos para esto");
    // Opcionalmente hacer logout si es restricción global
  }
}
```

---

#### 404 Not Found
**Significado:** Recurso no existe
**Cuándo aparece:**
- ID del recurso no existe
- URL del endpoint incorrecta
- Recurso fue eliminado

**Respuesta típica:**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "El recurso solicitado no fue encontrado"
}
```

**Causas posibles en Libris:**
- PATCH /api/registros/999/ (ID no existe)
- DELETE /api/comentarios/999/ (Ya fue eliminado)
- GET /api/libros/999/ (Libro no existe)

**Manejo en la app:**
```dart
// Intentar actualizar registro
try {
  await apiClient.updateReadingRecord(999, record);
} on DioException catch (e) {
  if (e.response?.statusCode == 404) {
    showError("El registro no existe. Puede haber sido eliminado.");
    // Actualizar lista local
  }
}
```

---

#### 409 Conflict
**Significado:** Conflicto - recurso duplicado u otra condición conflictiva
**Cuándo aparece:**
- Intento de crear recurso duplicado
- Violación de constraint único
- Operación conflictiva

**Respuesta típica:**
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "El email ya está registrado en el sistema"
}
```

**Causas posibles en Libris:**
- POST /api/register/ con email existente
- POST /api/calificaciones/ si ya calificó ese material
- POST /api/registros/ si ya tiene registro de ese material

**Manejo en la app:**
```dart
// Registrar usuario
try {
  await apiClient.register(username, email, password, password2);
} on DioException catch (e) {
  if (e.response?.statusCode == 409) {
    if (e.response?.data['message'].contains('email')) {
      showError("Este email ya está registrado");
    } else if (e.response?.data['message'].contains('username')) {
      showError("Este usuario ya existe");
    }
  }
}

// Crear calificación
try {
  await apiClient.createRating(tipo: "libro", materialId: 5, rating: 4);
} on DioException catch (e) {
  if (e.response?.statusCode == 409) {
    showError("Ya has calificado este material. Puedes actualizar tu calificación.");
  }
}
```

---

#### 422 Unprocessable Entity
**Significado:** Solicitud bien formada pero con contenido semánticamente incorrecto
**Cuando aparece:** Datos válidos pero no pueden ser procesados
**Nota:** Podría aparecer si backend lo implementa

---

#### 429 Too Many Requests
**Significado:** Cliente enviando demasiadas solicitudes (Rate Limiting)
**Cuándo aparece:** Cuando hay límite de requests por tiempo
**Respuesta típica:**
```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Has excedido el límite de solicitudes. Intenta en 60 segundos."
}
```

**Manejo en la app:**
```dart
try {
  await apiClient.someEndpoint();
} on DioException catch (e) {
  if (e.response?.statusCode == 429) {
    showError("Has hecho muchas solicitudes. Espera un momento e intenta de nuevo.");
  }
}
```

---

### Familia 5xx - Error del Servidor ❌

#### 500 Internal Server Error
**Significado:** Error general no especificado en el servidor
**Cuándo aparece:**
- Excepción no controlada
- Error en lógica del servidor
- Base de datos inaccessible

**Respuesta típica:**
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "Ocurrió un error en el servidor"
}
```

**Manejo en la app:**
```dart
try {
  await apiClient.createReadingRecord(record, tipo: 'libro');
} on DioException catch (e) {
  if (e.response?.statusCode == 500) {
    showError("Error del servidor. Por favor, intenta más tarde.");
    // Opcionalmente: Log del error para soporte
    logger.error("Server error: ${e.response?.data}");
  }
}
```

---

#### 502 Bad Gateway
**Significado:** Gateway inválido - servidor intermediario recibió respuesta inválida
**Cuándo aparece:**
- Servidor backend caído
- Proxy/nginx en problemas
- Balanceador de carga en error

**Manejo similar a 500:**
```dart
if (e.response?.statusCode == 502) {
  showError("No se puede conectar al servidor. Intenta más tarde.");
}
```

---

#### 503 Service Unavailable
**Significado:** Servicio no disponible (típicamente mantenimiento)
**Cuándo aparece:**
- Mantenimiento programado
- Servidor reiniciándose
- Recursos agotados

**Respuesta típica:**
```json
{
  "status": 503,
  "error": "Service Unavailable",
  "message": "El servidor está en mantenimiento. Intenta más tarde."
}
```

**Manejo en la app:**
```dart
if (e.response?.statusCode == 503) {
  showError("El servidor está en mantenimiento. Intenta más tarde.");
}
```

---

#### 504 Gateway Timeout
**Significado:** Gateway agotó timeout esperando respuesta
**Cuándo aparece:** Servidor tarda demasiado

**Manejo:**
```dart
if (e.response?.statusCode == 504) {
  showError("La solicitud tardó demasiado. Intenta de nuevo.");
}
```

---

## 🛠️ Excepciones de DioException (No HTTP)

### DioExceptionType.connectionTimeout
**Causa:** Tiempo de conexión agotado
```dart
e.type == DioExceptionType.connectionTimeout
```
**Manejo:**
```dart
showError("Conexión lenta. Verifica tu internet.");
// Opcionalmente, mostrar opción para reintentar
```

---

### DioExceptionType.receiveTimeout
**Causa:** Tiempo de recepción agotado (servidor responde muy lentamente)
```dart
e.type == DioExceptionType.receiveTimeout
```
**Manejo:**
```dart
showError("El servidor está respondiendo lentamente. Intenta de nuevo.");
```

---

### DioExceptionType.unknown
**Causa:** Error desconocido, típicamente conexión perdida
```dart
e.type == DioExceptionType.unknown
```
**Manejo:**
```dart
if (e.error is SocketException) {
  showError("No hay conexión a internet.");
} else {
  showError("Ocurrió un error de conexión inesperado.");
}
```

---

### DioExceptionType.badResponse
**Causa:** Respuesta con status code inválido (aunque DioClient los acepta todos)
```dart
e.type == DioExceptionType.badResponse
```

---

### DioExceptionType.cancel
**Causa:** Solicitud fue cancelada
```dart
e.type == DioExceptionType.cancel
```

---

## 🔄 Flujo Completo de Manejo de Errores

```dart
class ApiClient {
  Future<T> _handleApiCall<T>(Future<T> Function() call) async {
    try {
      return await call();
    } on DioException catch (e) {
      
      // 1. Manejar timeouts
      if (e.type == DioExceptionType.connectionTimeout) {
        throw ApiException(
          code: 'TIMEOUT',
          message: 'Conexión lenta. Verifica tu internet.',
          isRetryable: true,
        );
      }
      
      // 2. Manejar errores de conexión
      if (e.type == DioExceptionType.unknown) {
        throw ApiException(
          code: 'NO_CONNECTION',
          message: 'No hay conexión a internet.',
          isRetryable: true,
        );
      }
      
      // 3. Manejar respuestas HTTP
      final statusCode = e.response?.statusCode;
      final data = e.response?.data as Map<String, dynamic>?;
      
      switch (statusCode) {
        case 400:
          // Bad Request - Error de validación
          final details = data?['details'] ?? {};
          throw ApiException(
            code: 'BAD_REQUEST',
            message: _formatValidationError(details),
            isRetryable: false,
          );
        
        case 401:
          // Unauthorized - Intentar refrescar token
          if (_refreshToken != null) {
            try {
              await _refresh();
              // Reintentar
              return await call();
            } catch (_) {
              await logout();
              throw ApiException(
                code: 'SESSION_EXPIRED',
                message: 'Sesión expirada. Por favor, inicia sesión de nuevo.',
                isRetryable: false,
              );
            }
          } else {
            throw ApiException(
              code: 'NOT_AUTHENTICATED',
              message: 'Debes iniciar sesión primero.',
              isRetryable: false,
            );
          }
        
        case 403:
          // Forbidden - Sin permisos
          throw ApiException(
            code: 'FORBIDDEN',
            message: 'No tienes permisos para acceder a este recurso.',
            isRetryable: false,
          );
        
        case 404:
          // Not Found - Recurso no existe
          throw ApiException(
            code: 'NOT_FOUND',
            message: 'El recurso solicitado no fue encontrado.',
            isRetryable: false,
          );
        
        case 409:
          // Conflict - Recurso duplicado
          final message = data?['message'] ?? 'Conflicto en la operación';
          throw ApiException(
            code: 'CONFLICT',
            message: message,
            isRetryable: false,
          );
        
        case 429:
          // Too Many Requests - Rate limiting
          throw ApiException(
            code: 'RATE_LIMIT',
            message: 'Has hecho demasiadas solicitudes. Espera un momento.',
            isRetryable: true,
          );
        
        case 500:
        case 502:
        case 503:
          // Server Error - Retryable
          throw ApiException(
            code: 'SERVER_ERROR',
            message: 'Error del servidor. Por favor, intenta más tarde.',
            isRetryable: true,
          );
        
        default:
          throw ApiException(
            code: 'UNKNOWN_ERROR',
            message: 'Ocurrió un error inesperado.',
            isRetryable: false,
          );
      }
    } catch (e) {
      // Otros errores no relacionados a HTTP
      throw ApiException(
        code: 'UNKNOWN_ERROR',
        message: 'Error desconocido: ${e.toString()}',
        isRetryable: false,
      );
    }
  }
  
  String _formatValidationError(Map<String, dynamic> details) {
    if (details.isEmpty) return 'Error de validación';
    
    final errors = <String>[];
    details.forEach((field, messages) {
      if (messages is List && messages.isNotEmpty) {
        errors.add(messages.first.toString());
      }
    });
    
    return errors.join('\n');
  }
}
```

---

## 📋 Tabla de Decisión - ¿Qué Hacer?

| Status | ¿Reintentar? | ¿Mostrar Error? | ¿Hacer Logout? |
|--------|:------------:|:---------------:|:--------------:|
| 200 | ❌ | ❌ | ❌ |
| 201 | ❌ | ❌ | ❌ |
| 204 | ❌ | ❌ | ❌ |
| 400 | ❌ | ✅ | ❌ |
| 401 | ✅ (refresh) | ✅ | ✅ |
| 403 | ❌ | ✅ | ❌ |
| 404 | ❌ | ✅ | ❌ |
| 409 | ❌ | ✅ | ❌ |
| 429 | ✅ (backoff) | ✅ | ❌ |
| 500 | ✅ (backoff) | ✅ | ❌ |
| 502 | ✅ (backoff) | ✅ | ❌ |
| 503 | ✅ (backoff) | ✅ | ❌ |
| Timeout | ✅ (backoff) | ✅ | ❌ |
| No Network | ✅ (backoff) | ✅ | ❌ |

---

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Crear Calificación con Manejo Completo
```dart
Future<void> rateBook(int bookId, int rating) async {
  try {
    // Validar antes de enviar
    if (rating < 1 || rating > 5) {
      _showError("Calificación debe estar entre 1 y 5");
      return;
    }
    
    final result = await apiClient.createRating(
      tipo: 'libro',
      materialId: bookId,
      rating: rating,
    );
    
    _showSuccess("Calificación guardada");
    _updateUI(result);
    
  } on ApiException catch (e) {
    if (e.code == 'CONFLICT') {
      _showInfo("Ya has calificado esto. ¿Deseas actualizar tu calificación?");
    } else if (e.isRetryable) {
      _showError("${e.message}\n\nIntentando de nuevo...");
      // Esperar y reintentar
      await Future.delayed(Duration(seconds: 2));
      await rateBook(bookId, rating);
    } else {
      _showError(e.message);
    }
  }
}
```

### Ejemplo 2: Obtener Libros con Reintentos
```dart
Future<List<ReadingItem>> fetchBooksWithRetry() async {
  const maxRetries = 3;
  
  for (int i = 0; i < maxRetries; i++) {
    try {
      return await apiClient.fetchCatalog();
    } on ApiException catch (e) {
      if (!e.isRetryable || i == maxRetries - 1) {
        _showError(e.message);
        return [];
      }
      
      final delay = Duration(seconds: 2 << i); // 2, 4, 8 segundos
      print("Reintentando en ${delay.inSeconds}s...");
      await Future.delayed(delay);
    }
  }
  
  return [];
}
```

### Ejemplo 3: Login con Validación Completa
```dart
Future<bool> login(String username, String password) async {
  try {
    // Validar entrada
    if (username.isEmpty || password.isEmpty) {
      _showError("Usuario y contraseña son requeridos");
      return false;
    }
    
    // Intentar login
    final success = await apiClient.login(username, password);
    
    if (success) {
      _showSuccess("Bienvenido");
      _navigateToHome();
      return true;
    }
    
  } on ApiException catch (e) {
    switch (e.code) {
      case 'BAD_REQUEST':
        _showError("Usuario o contraseña incorrectos");
        
      case 'NOT_FOUND':
        _showError("Usuario no existe");
        
      case 'RATE_LIMIT':
        _showError("Demasiados intentos. Intenta en unos minutos");
        
      case 'NO_CONNECTION':
        _showError("Verifica tu conexión a internet");
        
      default:
        _showError(e.message);
    }
  }
  
  return false;
}
```

---

## 🆘 Testing de Errores

### Script de Prueba (Curl)

```bash
# Test 400 - Bad Request
curl -X POST http://localhost:8000/api/calificaciones/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 10}'  # Rating fuera de rango

# Test 401 - Unauthorized (Token expirado)
curl http://localhost:8000/api/libros/ \
  -H "Authorization: Bearer INVALID_TOKEN"

# Test 404 - Not Found
curl http://localhost:8000/api/registros/999/ \
  -H "Authorization: Bearer TOKEN"

# Test 409 - Conflict (Email duplicado)
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "existing_user",
    "email": "existing@example.com",
    "password": "pass123",
    "password2": "pass123"
  }'
```

---

**Última Actualización:** 1 de febrero de 2026
