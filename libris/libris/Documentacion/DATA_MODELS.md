# 📊 Modelos de Datos - Libris API

## 🎯 Descripción General

Este documento describe la estructura de los modelos de datos que se intercambian con la API REST. Cada modelo representa una entidad del sistema.

---

## 👤 UserProfile

**Descripción:** Información del perfil del usuario autenticado

**Clase Dart:**
```dart
class UserProfile {
  final int id;
  final String username;
  final String email;
  final String rol;
  final String? firstName;
  final String? lastName;
  final String? fotoPerfil;
  final bool isActive;
}
```

**Ejemplo JSON (Response):**
```json
{
  "id": 1,
  "username": "juan_perez",
  "email": "juan@example.com",
  "rol": "USER",
  "first_name": "Juan",
  "last_name": "Pérez",
  "foto_perfil": "https://api.example.com/media/profiles/juan.jpg",
  "is_active": true
}
```

**Campos:**
- `id`: ID único del usuario
- `username`: Nombre de usuario (único)
- `email`: Email (único)
- `rol`: Rol del usuario (USER, MODERATOR, ADMIN)
- `firstName`: Nombre del usuario (opcional)
- `lastName`: Apellido del usuario (opcional)
- `fotoPerfil`: URL de la foto de perfil (opcional)
- `isActive`: Si la cuenta está activa

**Uso en Libris:**
```dart
// Acceder al nombre completo
final name = userProfile.fullName; // "Juan Pérez" o "juan_perez"
```

---

## 📚 ReadingItem

**Descripción:** Un material de lectura (libro, manga, novela, material)

**Clase Dart:**
```dart
class ReadingItem {
  final int id;
  final String titulo;
  final String tipo;
  final String? autor;
  final String? descripcion;
  final String? portada;
  final String? archivo;
  final String? pdfUrl;
  final int? numeroPaginas;
}
```

**Ejemplo JSON (Response):**
```json
{
  "id": 1,
  "titulo": "El Señor de los Anillos",
  "tipo": "Libro",
  "autor": "J.R.R. Tolkien",
  "descripcion": "Una épica aventura en la Tierra Media...",
  "portada": "https://api.example.com/media/covers/lotr.jpg",
  "contenido_pdf_url": "https://api.example.com/media/pdfs/lotr.pdf",
  "numero_paginas": 1178
}
```

**Campos:**
- `id`: ID único del material
- `titulo`: Título del material
- `tipo`: Tipo de material (Libro, Manga, Novela, Material)
- `autor`: Autor/Creador (opcional)
- `descripcion`: Descripción o sinopsis (opcional)
- `portada`: URL de la portada (opcional)
- `archivo`: URL del archivo (opcional, puede ser PDF)
- `pdfUrl`: URL del PDF si está disponible (opcional)
- `numeroPaginas`: Número total de páginas (opcional)

**Tipos Válidos:**
- `"Libro"` - Libro tradicional
- `"Manga"` - Manga japonés
- `"Novela"` - Novela literaria
- `"Material"` - Material educativo

**Uso en Libris:**
```dart
// Mostrar material
print('${item.titulo} por ${item.autor ?? "Desconocido"}');

// Verificar si tiene PDF
if (item.pdfUrl != null) {
  // Mostrar botón de lectura
}
```

---

## 📖 ReadingRecord

**Descripción:** El registro de un usuario leyendo un material específico

**Clase Dart:**
```dart
class ReadingRecord {
  final int id;
  final int usuario;
  final String tipo;
  final int materialId;
  final int paginaActual;
  final String estado;
  final DateTime? fechaCreacion;
  final DateTime? fechaActualizacion;
}
```

**Ejemplo JSON (Response):**
```json
{
  "id": 1,
  "usuario": 1,
  "tipo": "libro",
  "libro": 5,
  "pagina_actual": 150,
  "estado": "leyendo",
  "fecha_creacion": "2024-01-15T10:30:00Z",
  "fecha_actualizacion": "2024-01-20T14:20:00Z"
}
```

**Ejemplo JSON (Request - Crear):**
```json
{
  "tipo": "libro",
  "libro": 5,
  "pagina_actual": 0,
  "estado": "leyendo"
}
```

**Campos:**
- `id`: ID único del registro
- `usuario`: ID del usuario propietario
- `tipo`: Tipo de material (libro, manga, novela, material)
- `materialId`: ID del material siendo leído
- `paginaActual`: Número de página actual
- `estado`: Estado actual de la lectura
- `fechaCreacion`: Cuándo se creó el registro
- `fechaActualizacion`: Cuándo se actualizó por última vez

**Estados Válidos:**
- `"leyendo"` - Actualmente leyendo
- `"completado"` - Terminado
- `"pausado"` - En pausa
- `"abandonado"` - Descartado

**Uso en Libris:**
```dart
// Crear nuevo registro
final record = ReadingRecord(
  id: 0, // Se asignará en el servidor
  usuario: 1,
  tipo: 'libro',
  materialId: 5,
  paginaActual: 0,
  estado: 'leyendo',
);

// Actualizar página
record.paginaActual = 150;
await apiClient.updateReadingRecord(record.id, record);

// Marcar como completado
record.estado = 'completado';
await apiClient.updateReadingRecord(record.id, record);
```

---

## ⭐ Rating

**Descripción:** Calificación de un usuario para un material

**Clase Dart:**
```dart
class Rating {
  final int id;
  final int usuario;
  final String tipo;
  final int materialId;
  final int rating;
  final DateTime? fechaCreacion;
  final DateTime? fechaActualizacion;
}
```

**Ejemplo JSON (Response):**
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

**Ejemplo JSON (Request - Crear):**
```json
{
  "tipo": "libro",
  "libro": 5,
  "rating": 4
}
```

**Campos:**
- `id`: ID único de la calificación
- `usuario`: ID del usuario
- `tipo`: Tipo de material (libro, manga, novela, material)
- `materialId`: ID del material siendo calificado
- `rating`: Calificación (1-5 estrellas)
- `fechaCreacion`: Cuándo se creó
- `fechaActualizacion`: Cuándo se actualizó

**Rango de Calificación:**
- `1` ⭐ - Muy malo
- `2` ⭐⭐ - Malo
- `3` ⭐⭐⭐ - Regular
- `4` ⭐⭐⭐⭐ - Bueno
- `5` ⭐⭐⭐⭐⭐ - Excelente

**Uso en Libris:**
```dart
// Calificar un libro
final rating = await apiClient.createRating(
  tipo: 'libro',
  materialId: 5,
  rating: 4,
);

// Actualizar calificación
await apiClient.updateRating(ratingId: rating.id, rating: 5);

// Convertir a estrellas para UI
String getStars(int rating) {
  return '⭐' * rating;
}
```

---

## 💬 UserComment

**Descripción:** Comentario de un usuario en un material

**Clase Dart:**
```dart
class UserComment {
  final int id;
  final int usuario;
  final String nombreUsuario;
  final String tipo;
  final int materialId;
  final String descripcion;
  final DateTime? fechaCreacion;
  final DateTime? fechaActualizacion;
}
```

**Ejemplo JSON (Response):**
```json
{
  "id": 1,
  "usuario": 1,
  "nombre_usuario": "juan_perez",
  "tipo": "libro",
  "libro": 5,
  "descripcion": "Este libro cambió mi vida! Muy recomendado.",
  "fecha_creacion": "2024-01-15T10:30:00Z",
  "fecha_actualizacion": "2024-01-15T10:30:00Z"
}
```

**Ejemplo JSON (Request - Crear):**
```json
{
  "tipo": "libro",
  "libro": 5,
  "descripcion": "Este libro cambió mi vida! Muy recomendado."
}
```

**Campos:**
- `id`: ID único del comentario
- `usuario`: ID del usuario autor
- `nombreUsuario`: Username del autor
- `tipo`: Tipo de material
- `materialId`: ID del material
- `descripcion`: Texto del comentario
- `fechaCreacion`: Cuándo se escribió
- `fechaActualizacion`: Última edición

**Restricciones:**
- Descripción no puede estar vacía
- Máximo caracteres: Típicamente 5000 (verificar backend)
- Solo el autor puede editar su comentario
- Admins pueden eliminar comentarios

**Uso en Libris:**
```dart
// Crear comentario
final comment = await apiClient.createComment(
  tipo: 'libro',
  materialId: 5,
  descripcion: 'Este libro es increíble!',
);

// Listar comentarios de un material
final comments = await apiClient.fetchCommentsFor(
  tipo: 'libro',
  materialId: 5,
);

// Mostrar en UI
for (final comment in comments) {
  print('${comment.nombreUsuario}: ${comment.descripcion}');
}
```

---

## 🔐 Tokens de Autenticación

**Respuesta de Login (Ejemplo):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1YzQ1ZDEwYzM5ZjQ0ZjE5YmY3YTYwNzA5YzNjM2E5ZCIsImlhdCI6MTUzODU0MDUyMCwiZXhwIjoxNTM4NTQ0MTIwLCJpc3MiOiJodHRwOi8vYXV0aDAuY29tLyIsImF1ZCI6Imh0dHA6Ly9hcGkuZXhhbXBsZS5jb20vIiwic3ViIjoiY29zcGxheSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImF1dGgwLWxvZ2luIn0.H_QfC6Oqxw0Dq-Rw3MwY_3cXkQ6Vqzz0Q3Z_z5z0z",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1YzQ1ZDEwYzM5ZjQ0ZjE5YmY3YTYwNzA5YzNjM2E5ZCIsImlhdCI6MTUzODU0MDUyMCwiZXhwIjoxNTM4NjI2OTIwLCJpc3MiOiJodHRwOi8vYXV0aDAuY29tLyIsImF1ZCI6Imh0dHA6Ly9hcGkuZXhhbXBsZS5jb20vIiwic3ViIjoiY29zcGxheSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImF1dGgwLWxvZ2luIn0.M_QgD7QpQx1Eo-Sw4NxZ_4dYlR7Wyy1R4Z_a6a1a7b"
}
```

**Estructura del JWT:**
```
Header.Payload.Signature
```

**Payload típico (decodificado):**
```json
{
  "user_id": 1,
  "username": "juan_perez",
  "email": "juan@example.com",
  "iat": 1538540520,
  "exp": 1538544120
}
```

**Tokens almacenados en:**
- Android: FlutterSecureStorage (encriptado)
- iOS: Keychain
- Web: LocalStorage (si es PWA)

---

## 🔗 Query Parameters

### Parámetro para Buscar Material
```
?libro={id}        # Para libros
?manga={id}        # Para mangas
?novela={id}       # Para novelas
?material={id}     # Para material general
```

### Parámetros de Paginación
```
?page=1            # Número de página
?page_size=20      # Elementos por página
```

### Parámetros de Búsqueda
```
?search=titulo     # Buscar por título
?search=autor      # Buscar por autor
```

**Ejemplo:**
```
GET /api/comentarios/?libro=5&page=1
GET /api/libros/?search=tolkien
```

---

## 🎯 Mapeo de Tipos

**En la API, los tipos se normalizan a minúsculas:**

| Tipo UI | En API | Endpoint | Query Param |
|---------|--------|----------|------------|
| Libro | libro | /api/libros/ | libro |
| Manga | manga | /api/mangas/ | manga |
| Novela | novela | /api/novelas/ | novela |
| Material | material | /api/material/ | material |

**Código auxiliar:**
```dart
// Normalizar tipo para enviar a API
String _normalizeTipo(String tipo) {
  return tipo.toLowerCase(); // "Libro" → "libro"
}

// Obtener query param según tipo
String _materialQueryParam(String tipo) {
  return tipo.toLowerCase(); // "libro", "manga", etc.
}

// Construir payload
Map<String, dynamic> _buildMaterialPayload(String tipo, int materialId) {
  return {
    tipo: materialId, // {"libro": 5}
  };
}
```

---

## 📋 Lista de Verificación - Validaciones

### Antes de Crear/Actualizar:

**ReadingRecord:**
- [ ] `materialId > 0`
- [ ] `paginaActual >= 0`
- [ ] `estado` en lista válida
- [ ] `paginaActual <= numeroPaginasTotal`

**Rating:**
- [ ] `materialId > 0`
- [ ] `rating` entre 1 y 5

**Comment:**
- [ ] `materialId > 0`
- [ ] `descripcion.trim().isNotEmpty`
- [ ] `descripcion.length <= 5000`

---

## 🔀 Conversiones Comunes

### DateTime
```dart
// De string ISO a DateTime
final dt = DateTime.parse("2024-01-15T10:30:00Z");

// De DateTime a string ISO
final iso = DateTime.now().toIso8601String();
```

### Enums para Estados
```dart
enum ReadingState {
  leyendo('leyendo'),
  completado('completado'),
  pausado('pausado'),
  abandonado('abandonado');

  final String value;
  const ReadingState(this.value);

  factory ReadingState.fromString(String state) {
    return ReadingState.values.firstWhere(
      (e) => e.value == state,
      orElse: () => ReadingState.leyendo,
    );
  }
}
```

---

## 🎨 Extensiones Útiles

```dart
extension RatingExtension on Rating {
  String get starsDisplay => '⭐' * rating;
  
  bool get isGood => rating >= 4;
  bool get isBad => rating <= 2;
}

extension ReadingRecordExtension on ReadingRecord {
  double get progress {
    // Calcular progreso (requiere número de páginas del item)
    return (paginaActual / 300) * 100; // Ej: 300 páginas totales
  }
  
  bool get isCompleted => estado == 'completado';
  bool get isReading => estado == 'leyendo';
}

extension ReadingItemExtension on ReadingItem {
  bool get hasPdf => pdfUrl != null && pdfUrl!.isNotEmpty;
  bool get hasCover => portada != null && portada!.isNotEmpty;
}
```

---

**Última Actualización:** 1 de febrero de 2026
