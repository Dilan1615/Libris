# 💻 Guía de Implementación - Consumo de API REST en Flutter

## 📌 Estructura del Proyecto

```
libris/
├── lib/
│   ├── api/
│   │   ├── api_client.dart      ← Lógica de HTTP
│   │   ├── models.dart          ← Modelos de datos
│   │   └── exceptions.dart      ← Clases de excepciones
│   ├── pages/
│   │   ├── login_page.dart
│   │   ├── register_page.dart
│   │   ├── home_page.dart
│   │   └── ...
│   ├── widgets/
│   │   ├── error_dialog.dart
│   │   └── loading_spinner.dart
│   ├── providers/
│   │   └── libris_state.dart    ← ChangeNotifier
│   ├── main.dart
│   └── theme/
│       └── app_theme.dart
└── pubspec.yaml
```

---

## 🔧 Configuración Inicial

### 1. Dependencias en pubspec.yaml

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP Client
  dio: ^5.4.3+1                    # Cliente HTTP con interceptores
  
  # State Management
  provider: ^6.1.5+1               # Provider para estado global
  
  # Seguridad
  flutter_secure_storage: ^9.0.0   # Almacenamiento de tokens
  
  # Utilities
  google_fonts: ^6.2.0             # Fuentes
  url_launcher: ^6.1.0             # Abrir URLs
```

### 2. Inicialización en main.dart

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'api/api_client.dart';
import 'providers/libris_state.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicializar ApiClient y cargar tokens guardados
  await ApiClient.initialize();
  
  runApp(const LibrisApp());
}

class LibrisApp extends StatelessWidget {
  const LibrisApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => LibrisState(ApiClient.instance),
      child: MaterialApp(
        title: 'Libris',
        theme: AppTheme.darkTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.dark,
        home: const AuthWrapper(),
      ),
    );
  }
}
```

---

## 📡 Implementación de ApiClient

### 1. Estructura Base

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  ApiClient({String? baseUrl})
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl ?? _getDefaultBaseUrl(),
          connectTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 60),
          validateStatus: (status) => true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

  static ApiClient? _instance;
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  String? _accessToken;
  String? _refreshToken;

  // Singleton pattern
  static ApiClient get instance => _instance!;

  static Future<void> initialize() async {
    _instance = ApiClient();
    await _instance!.init();
  }

  Future<void> init() async {
    _accessToken = await _storage.read(key: 'access');
    _refreshToken = await _storage.read(key: 'refresh');
    _setupInterceptors();
  }

  // ... resto del código
}
```

### 2. Interceptores para Autenticación

```dart
void _setupInterceptors() {
  _dio.interceptors.clear();
  _dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        print('📤 ${options.method} ${options.path}');
        
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        
        return handler.next(options);
      },
      
      onError: (DioException error, handler) async {
        print('❌ Error ${error.type}: ${error.message}');
        
        // Manejar 401 (Token expirado)
        if (error.response?.statusCode == 401 && _refreshToken != null) {
          final refreshed = await _refresh();
          if (refreshed) {
            // Reintentar request original
            final requestOptions = error.requestOptions;
            requestOptions.headers['Authorization'] = 'Bearer $_accessToken';
            
            try {
              final retryResponse = await _dio.fetch<dynamic>(requestOptions);
              return handler.resolve(retryResponse);
            } catch (_) {
              return handler.reject(error);
            }
          }
        }
        
        return handler.next(error);
      },
      
      onResponse: (response, handler) {
        print('✅ ${response.statusCode}');
        return handler.next(response);
      },
    ),
  );
}
```

### 3. Método de Refresco de Token

```dart
Future<bool> _refresh() async {
  if (_refreshToken == null) return false;
  
  try {
    print('🔄 Refrescando token...');
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/refresh/',
      data: {'refresh': _refreshToken},
    );

    final newAccessToken = response.data?['access'] as String?;
    if (newAccessToken != null) {
      _accessToken = newAccessToken;
      await _storage.write(key: 'access', value: _accessToken!);
      print('✅ Token refrescado');
      return true;
    }
  } catch (e) {
    print('❌ Error al refrescar: $e');
    await logout();
  }
  
  return false;
}
```

---

## 🔐 Endpoints de Autenticación

### 1. Login

```dart
Future<bool> login(String username, String password) async {
  try {
    print('🔐 Login: $username');
    
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/login/',
      data: {
        'username': username,
        'password': password,
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Login fallido');
    }

    final data = response.data!;
    _accessToken = data['access_token'] as String?;
    _refreshToken = data['refresh_token'] as String?;

    if (_accessToken == null) {
      throw Exception('Token no recibido');
    }

    // Guardar tokens en almacenamiento seguro
    await _storage.write(key: 'access', value: _accessToken!);
    if (_refreshToken != null) {
      await _storage.write(key: 'refresh', value: _refreshToken!);
    }

    print('✅ Login exitoso');
    return true;
    
  } catch (e) {
    print('❌ Error en login: $e');
    throw Exception('No se pudo iniciar sesión');
  }
}
```

### 2. Registro

```dart
Future<bool> register(
  String username,
  String email,
  String password,
  String passwordConfirm,
) async {
  try {
    print('📝 Registrando: $username');
    
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/register/',
      data: {
        'username': username,
        'email': email,
        'password': password,
        'password2': passwordConfirm,
      },
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      final error = response.data?['message'] ?? 'Error en registro';
      throw Exception(error);
    }

    print('✅ Registro exitoso');
    return true;
    
  } catch (e) {
    print('❌ Error en registro: $e');
    throw Exception(_parseError(e));
  }
}
```

### 3. Logout

```dart
Future<void> logout() async {
  _accessToken = null;
  _refreshToken = null;
  
  await Future.wait([
    _storage.delete(key: 'access'),
    _storage.delete(key: 'refresh'),
  ]);
  
  print('👋 Logout completado');
}
```

---

## 📚 Endpoints de Catálogo

### 1. Obtener Libros (Con Búsqueda)

```dart
Future<List<ReadingItem>> fetchBooks({
  String? searchTerm,
  int page = 1,
}) async {
  try {
    print('📖 Cargando libros...');
    
    final params = <String, dynamic>{
      'page': page,
    };
    
    if (searchTerm != null && searchTerm.isNotEmpty) {
      params['search'] = searchTerm;
    }
    
    final response = await _dio.get<dynamic>(
      '/api/libros/',
      queryParameters: params,
    );

    if (response.statusCode != 200) {
      throw Exception('Error cargando libros');
    }

    final list = response.data is List
        ? response.data as List<dynamic>
        : (response.data is Map<String, dynamic>
            ? response.data['results'] as List<dynamic>?
            : null) ?? [];

    return list
        .whereType<Map<String, dynamic>>()
        .map((json) => ReadingItem.fromJson(json, tipo: 'Libro'))
        .toList();
        
  } catch (e) {
    print('❌ Error cargando libros: $e');
    throw Exception('No se pudo cargar los libros');
  }
}
```

### 2. Obtener Catálogo Completo

```dart
Future<List<ReadingItem>> fetchCatalog() async {
  try {
    print('📚 Cargando catálogo...');
    
    final results = <ReadingItem>[];
    
    results.addAll(await _fetchList('/api/libros/', tipo: 'Libro'));
    results.addAll(await _fetchList('/api/mangas/', tipo: 'Manga'));
    results.addAll(await _fetchList('/api/novelas/', tipo: 'Novela'));
    results.addAll(await _fetchList('/api/material/', tipo: 'Material'));
    
    print('✅ Catálogo cargado: ${results.length} items');
    return results;
    
  } catch (e) {
    print('❌ Error cargando catálogo: $e');
    throw Exception('No se pudo cargar el catálogo');
  }
}

Future<List<ReadingItem>> _fetchList(String endpoint, {required String tipo}) async {
  try {
    final response = await _dio.get<dynamic>(endpoint);
    
    if (response.statusCode != 200) return [];
    
    final list = response.data is List
        ? response.data as List<dynamic>
        : (response.data is Map<String, dynamic>
            ? response.data['results'] as List<dynamic>?
            : null) ?? [];

    return list
        .whereType<Map<String, dynamic>>()
        .map((json) => ReadingItem.fromJson(json, tipo: tipo))
        .toList();
        
  } catch (e) {
    print('❌ Error en $endpoint: $e');
    return [];
  }
}
```

---

## 📖 Endpoints de Lecturas

### 1. Obtener Mis Lecturas

```dart
Future<List<ReadingRecord>> fetchReadingRecords() async {
  try {
    print('📚 Cargando mis lecturas...');
    
    final response = await _dio.get<dynamic>('/api/registros/');
    
    if (response.statusCode != 200) {
      throw Exception('Error cargando registros');
    }

    final list = response.data is List
        ? response.data as List<dynamic>
        : (response.data is Map<String, dynamic>
            ? response.data['results'] as List<dynamic>?
            : null) ?? [];

    return list
        .whereType<Map<String, dynamic>>()
        .map(ReadingRecord.fromJson)
        .toList();
        
  } catch (e) {
    print('❌ Error cargando registros: $e');
    throw Exception('No se pudo cargar tus lecturas');
  }
}
```

### 2. Crear Lectura

```dart
Future<ReadingRecord> createReadingRecord(
  ReadingRecord record, {
  String? tipo,
}) async {
  try {
    if (record.materialId <= 0) {
      throw Exception('Material inválido');
    }

    print('📝 Creando registro de lectura...');
    
    final tipoNormalizado = (tipo ?? 'Libro').toLowerCase();
    final payload = _buildMaterialPayload(tipoNormalizado, record.materialId);
    
    payload['tipo'] = tipoNormalizado;
    payload['pagina_actual'] = record.paginaActual;
    payload['estado'] = record.estado;

    final response = await _dio.post<Map<String, dynamic>>(
      '/api/registros/',
      data: payload,
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Error creando registro');
    }

    print('✅ Registro creado');
    return ReadingRecord.fromJson(response.data!);
    
  } catch (e) {
    print('❌ Error: $e');
    throw Exception('No se pudo crear el registro');
  }
}
```

### 3. Actualizar Lectura

```dart
Future<ReadingRecord> updateReadingRecord(
  int recordId,
  ReadingRecord record, {
  String? tipo,
}) async {
  try {
    print('✏️ Actualizando registro $recordId...');
    
    final tipoNormalizado = (tipo ?? 'Libro').toLowerCase();
    final payload = _buildMaterialPayload(tipoNormalizado, record.materialId);
    
    payload['tipo'] = tipoNormalizado;
    payload['pagina_actual'] = record.paginaActual;
    payload['estado'] = record.estado;

    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/registros/$recordId/',
      data: payload,
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Error actualizando');
    }

    print('✅ Registro actualizado');
    return ReadingRecord.fromJson(response.data!);
    
  } catch (e) {
    print('❌ Error: $e');
    throw Exception('No se pudo actualizar el registro');
  }
}
```

### 4. Eliminar Lectura

```dart
Future<void> deleteReadingRecord(int recordId) async {
  try {
    print('🗑️ Eliminando registro $recordId...');
    
    final response = await _dio.delete<dynamic>('/api/registros/$recordId/');
    
    if (response.statusCode != 204 && response.statusCode != 200) {
      throw Exception('Error al eliminar');
    }

    print('✅ Registro eliminado');
    
  } catch (e) {
    print('❌ Error: $e');
    throw Exception('No se pudo eliminar el registro');
  }
}
```

---

## ⭐ Endpoints de Calificaciones

### 1. Crear Calificación

```dart
Future<Rating> createRating({
  required String tipo,
  required int materialId,
  required int rating,
}) async {
  try {
    if (materialId <= 0) {
      throw Exception('Material inválido');
    }
    
    if (rating < 1 || rating > 5) {
      throw Exception('Rating debe estar entre 1 y 5');
    }

    print('⭐ Creando calificación...');
    
    final tipoNormalizado = tipo.toLowerCase();
    final payload = _buildMaterialPayload(tipoNormalizado, materialId);
    
    payload['tipo'] = tipoNormalizado;
    payload['rating'] = rating;

    final response = await _dio.post<Map<String, dynamic>>(
      '/api/calificaciones/',
      data: payload,
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Error creando calificación');
    }

    print('✅ Calificación creada');
    return Rating.fromJson(response.data!);
    
  } catch (e) {
    print('❌ Error: $e');
    throw Exception(_parseError(e));
  }
}
```

### 2. Actualizar Calificación

```dart
Future<Rating> updateRating({
  required int ratingId,
  required int rating,
}) async {
  try {
    if (rating < 1 || rating > 5) {
      throw Exception('Rating debe estar entre 1 y 5');
    }

    print('⭐ Actualizando calificación $ratingId...');
    
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/calificaciones/$ratingId/',
      data: {'rating': rating},
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Error actualizando');
    }

    print('✅ Calificación actualizada');
    return Rating.fromJson(response.data!);
    
  } catch (e) {
    print('❌ Error: $e');
    throw Exception('No se pudo actualizar la calificación');
  }
}
```

---

## 💬 Endpoints de Comentarios

### 1. Obtener Comentarios

```dart
Future<List<UserComment>> fetchCommentsFor({
  required String tipo,
  required int materialId,
}) async {
  try {
    print('💬 Cargando comentarios...');
    
    final param = _materialQueryParam(tipo);
    final response = await _dio.get<dynamic>(
      '/api/comentarios/?$param=$materialId',
    );

    if (response.statusCode != 200) {
      return [];
    }

    final list = response.data is List
        ? response.data as List<dynamic>
        : (response.data is Map<String, dynamic>
            ? response.data['results'] as List<dynamic>?
            : null) ?? [];

    return list
        .whereType<Map<String, dynamic>>()
        .map(UserComment.fromJson)
        .toList();
        
  } catch (e) {
    print('❌ Error cargando comentarios: $e');
    return [];
  }
}
```

### 2. Crear Comentario

```dart
Future<UserComment> createComment({
  required String tipo,
  required int materialId,
  required String descripcion,
}) async {
  try {
    if (descripcion.trim().isEmpty) {
      throw Exception('El comentario no puede estar vacío');
    }

    print('💬 Creando comentario...');
    
    final payload = _buildMaterialPayload(tipo, materialId);
    payload['descripcion'] = descripcion;

    final response = await _dio.post<Map<String, dynamic>>(
      '/api/comentarios/',
      data: payload,
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Error creando comentario');
    }

    print('✅ Comentario creado');
    return UserComment.fromJson(response.data!);
    
  } catch (e) {
    print('❌ Error: $e');
    throw Exception('No se pudo crear el comentario');
  }
}
```

---

## 🎯 ChangeNotifier para Estado Global

### LibrisState

```dart
import 'package:flutter/foundation.dart';
import 'api/api_client.dart';
import 'api/models.dart';

class LibrisState extends ChangeNotifier {
  final ApiClient apiClient;

  LibrisState(this.apiClient);

  // Estado
  List<ReadingItem> _catalog = [];
  List<ReadingRecord> _myReadings = [];
  List<Rating> _myRatings = [];
  UserProfile? _userProfile;
  String? _error;
  bool _isLoading = false;

  // Getters
  List<ReadingItem> get catalog => _catalog;
  List<ReadingRecord> get myReadings => _myReadings;
  List<Rating> get myRatings => _myRatings;
  UserProfile? get userProfile => _userProfile;
  String? get error => _error;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => apiClient.isAuthenticated;

  // Login
  Future<bool> login(String username, String password) async {
    try {
      _setLoading(true);
      _error = null;
      
      await apiClient.login(username, password);
      await fetchCatalog();
      
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Cargar catálogo
  Future<void> fetchCatalog() async {
    try {
      _setLoading(true);
      _error = null;
      
      _catalog = await apiClient.fetchCatalog();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // Cargar mis lecturas
  Future<void> fetchMyReadings() async {
    try {
      _setLoading(true);
      _error = null;
      
      _myReadings = await apiClient.fetchReadingRecords();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // Crear lectura
  Future<void> addReading(ReadingRecord record, String tipo) async {
    try {
      _setLoading(true);
      _error = null;
      
      final newRecord = await apiClient.createReadingRecord(record, tipo: tipo);
      _myReadings.add(newRecord);
      
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  // Actualizar lectura
  Future<void> updateReading(int recordId, ReadingRecord record, String tipo) async {
    try {
      _setLoading(true);
      _error = null;
      
      final updated = await apiClient.updateReadingRecord(
        recordId,
        record,
        tipo: tipo,
      );
      
      final index = _myReadings.indexWhere((r) => r.id == recordId);
      if (index != -1) {
        _myReadings[index] = updated;
      }
      
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  // Eliminar lectura
  Future<void> deleteReading(int recordId) async {
    try {
      await apiClient.deleteReadingRecord(recordId);
      _myReadings.removeWhere((r) => r.id == recordId);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await apiClient.logout();
      _catalog = [];
      _myReadings = [];
      _myRatings = [];
      _userProfile = null;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
```

---

## 🎨 Páginas de Ejemplo

### Login Page

```dart
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  late TextEditingController _usernameController;
  late TextEditingController _passwordController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _usernameController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_usernameController.text.isEmpty || _passwordController.text.isEmpty) {
      _showError("Por favor completa todos los campos");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final state = context.read<LibrisState>();
      final success = await state.login(
        _usernameController.text,
        _passwordController.text,
      );

      if (success && mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      } else if (mounted) {
        _showError(state.error ?? "Error en login");
      }
    } catch (e) {
      if (mounted) {
        _showError(e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Iniciar Sesión")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _usernameController,
              decoration: const InputDecoration(labelText: "Usuario"),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: "Contraseña"),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleLogin,
              child: _isLoading
                  ? const CircularProgressIndicator()
                  : const Text("Iniciar Sesión"),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Catálogo Page

```dart
class CatalogPage extends StatefulWidget {
  const CatalogPage({super.key});

  @override
  State<CatalogPage> createState() => _CatalogPageState();
}

class _CatalogPageState extends State<CatalogPage> {
  @override
  void initState() {
    super.initState();
    _loadCatalog();
  }

  Future<void> _loadCatalog() async {
    final state = context.read<LibrisState>();
    await state.fetchCatalog();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadCatalog,
      child: Consumer<LibrisState>(
        builder: (context, state, _) {
          if (state.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("Error: ${state.error}"),
                  ElevatedButton(
                    onPressed: _loadCatalog,
                    child: const Text("Reintentar"),
                  ),
                ],
              ),
            );
          }

          if (state.catalog.isEmpty) {
            return const Center(child: Text("No hay libros disponibles"));
          }

          return ListView.builder(
            itemCount: state.catalog.length,
            itemBuilder: (context, index) {
              final item = state.catalog[index];
              return ListTile(
                title: Text(item.titulo),
                subtitle: Text(item.autor ?? "Autor desconocido"),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MaterialDetailPage(item: item),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
```

---

## 🆘 Utilidades para Manejo de Errores

### Error Helper

```dart
String _parseError(dynamic error) {
  if (error is DioException) {
    if (error.type == DioExceptionType.connectionTimeout) {
      return 'Conexión lenta. Intenta de nuevo.';
    }
    if (error.type == DioExceptionType.unknown) {
      return 'Sin conexión a internet.';
    }
    
    final statusCode = error.response?.statusCode;
    final data = error.response?.data as Map<String, dynamic>?;
    
    switch (statusCode) {
      case 400:
        return data?['message'] ?? 'Datos inválidos';
      case 401:
        return 'Usuario o contraseña incorrectos';
      case 409:
        return data?['message'] ?? 'Este recurso ya existe';
      case 500:
        return 'Error del servidor. Intenta más tarde.';
      default:
        return 'Error desconocido';
    }
  }
  
  return error.toString();
}
```

---

**Última Actualización:** 1 de febrero de 2026
