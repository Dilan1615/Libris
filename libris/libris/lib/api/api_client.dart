import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'models.dart';

// Detectar plataforma y usar la URL correcta
String _getDefaultBaseUrl() {
  if (kIsWeb) {
    // En Flutter Web, usa localhost directamente
    return 'http://localhost:8000';
  } else {
    // En Android emulador, usa 10.0.2.2
    // Para dispositivo físico, cambia a tu IP LAN (ej: http://192.168.1.100:8000)
  
    return  'http://192.168.110.53:8000' ;
  } 
}

const String defaultBaseUrl = 'http://localhost:8000'; // Fallback
const String _genericErrorMessage = 'Ocurrió un error. Por favor, intenta de nuevo.';

class ApiClient {
  ApiClient({String? baseUrl})
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl ?? _getDefaultBaseUrl(),
          connectTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 60),
          validateStatus: (status) => true, // Aceptar todos los status codes
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      ) {
    // Debug: mostrar URL en logs
    print('📡 ApiClient conectando a: ${_dio.options.baseUrl}');
  }

  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  String? _accessToken;
  String? _refreshToken;

  String get baseUrl => _dio.options.baseUrl;

  Future<void> init() async {
    _accessToken = await _storage.read(key: 'access');
    _refreshToken = await _storage.read(key: 'refresh');
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.clear();
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Headers ya están en BaseOptions, pero asegurarse aquí también
          if (_accessToken != null) {
            options.headers['Authorization'] = 'Bearer $_accessToken';
          }
          print('📤 ${options.method} ${options.path}');
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          print('❌ Error ${error.type}: ${error.message}');
          if (error.response != null) {
            print(
              '📋 Response: ${error.response?.statusCode} - ${error.response?.data}',
            );
          }
          if (error.response?.statusCode == 401 && _refreshToken != null) {
            final refreshed = await _refresh();
            if (refreshed) {
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
      ),
    );
  }

  bool get isAuthenticated => _accessToken != null;

  Future<bool> login(String username, String password) async {
    try {
      print('🔐 Intentando login en: $baseUrl/api/login/');
      final response = await _dio.post<dynamic>(
        '/api/login/',
        data: {'username': username, 'password': password},
      );

      print('📊 Status: ${response.statusCode}');
      print('📋 Response type: ${response.data.runtimeType}');
      print('📋 Response data: ${response.data}');

      if (response.statusCode != 200) {
        print('❌ Login fallido');
        throw Exception('No se pudo iniciar sesión');
      }

      // Validar que la respuesta sea un Map<String, dynamic>
      if (response.data is! Map<String, dynamic>) {
        print('❌ Respuesta inválida del servidor');
        throw Exception('No se pudo iniciar sesión');
      }

      final data = response.data as Map<String, dynamic>;

      // El backend devuelve access_token y refresh_token (no access y refresh)
      _accessToken = data['access_token'] as String?;
      _refreshToken = data['refresh_token'] as String?;

      if (_accessToken == null) {
        print('❌ Token no recibido en la respuesta');
        throw Exception('No se pudo iniciar sesión');
      }

      print('✅ Login exitoso. Token guardado.');

      if (_accessToken != null) {
        await _storage.write(key: 'access', value: _accessToken);
      }
      if (_refreshToken != null) {
        await _storage.write(key: 'refresh', value: _refreshToken);
      }

      return true;
    } catch (e) {
      print('❌ Error en login: $e');
      throw Exception('No se pudo iniciar sesión');
    }
  }

  Future<bool> register(
    String username,
    String email,
    String password,
    String passwordConfirm,
  ) async {
    try {
      print('📝 Registrando usuario en: $baseUrl/api/register/');
      final response = await _dio.post<dynamic>(
        '/api/register/',
        data: {
          'username': username,
          'email': email,
          'password': password,
          'password2': passwordConfirm,
        },
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode != 201 && response.statusCode != 200) {
        print('❌ Registro fallido: ${response.statusCode}');
        throw Exception(_genericErrorMessage);
      }

      print('✅ Registro exitoso.');
      return true;
    } catch (e) {
      print('❌ Error en registro: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;
    await Future.wait([
      _storage.delete(key: 'access'),
      _storage.delete(key: 'refresh'),
    ]);
  }

  Future<bool> _refresh() async {
    if (_refreshToken == null) return false;
    try {
      print('🔄 Refrescando token...');
      final response = await _dio.post<Map<String, dynamic>>(
        '/api/refresh/',
        data: {'refresh': _refreshToken},
      );

      // El backend devuelve "access" en la respuesta de refresh
      final newAccessToken = response.data?['access'] as String?;
      if (newAccessToken != null) {
        _accessToken = newAccessToken;
        await _storage.write(key: 'access', value: _accessToken!);
        print('✅ Token refrescado exitosamente.');
        return true;
      }
    } catch (e) {
      print('❌ Error al refrescar token: $e');
      await logout();
    }
    return false;
  }

  Future<List<ReadingItem>> fetchCatalog() async {
    final results = <ReadingItem>[];
    results.addAll(await _fetchList('/api/libros/', tipo: 'Libro'));
    results.addAll(await _fetchList('/api/mangas/', tipo: 'Manga'));
    results.addAll(await _fetchList('/api/novelas/', tipo: 'Novela'));
    results.addAll(await _fetchList('/api/material/', tipo: 'Material'));
    return results;
  }

  Future<List<ReadingRecord>> fetchReadingRecords() async {
    try {
      final response = await _dio.get<dynamic>('/api/registros/');
      if (response.statusCode != 200) {
        print('❌ Error cargando registros de lectura: ${response.statusCode}');
        throw Exception(_genericErrorMessage);
      }
      final data = response.data;
      final list = data is List
          ? data
          : (data is Map<String, dynamic>
                ? data['results'] as List<dynamic>?
                : null);
      if (list == null) return [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(ReadingRecord.fromJson)
          .toList();
    } catch (e) {
      print('❌ Error en fetchReadingRecords: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  Future<ReadingRecord> createReadingRecord(
    ReadingRecord record, {
    String? tipo,
  }) async {
    try {
      // Validar que materialId no sea null
      if (record.materialId <= 0) {
        print('❌ materialId inválido: ${record.materialId}');
        throw Exception(_genericErrorMessage);
      }

      // Normalizar tipo a minúsculas
      final tipoNormalizado = (tipo ?? 'Libro').toLowerCase();
      final payload = _buildMaterialPayload(tipoNormalizado, record.materialId);
      payload['tipo'] = tipoNormalizado;
      payload['pagina_actual'] = record.paginaActual;
      payload['estado'] = record.estado;
      print('📦 Registro payload: $payload');
      final response = await _dio.post<dynamic>(
        '/api/registros/',
        data: payload,
      );

      if (response.statusCode != 201 && response.statusCode != 200) {
        print('❌ Error creando registro: ${response.statusCode}');
        throw Exception(_genericErrorMessage);
      }

      if (response.data is Map<String, dynamic>) {
        return ReadingRecord.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception(_genericErrorMessage);
    } on DioException catch (e) {
      if ((e.response?.statusCode == 400 || e.response?.statusCode == 500) &&
          tipo != null) {
        try {
          final tipoNormalizado = tipo.toLowerCase();
          final payload = _buildMaterialPayload(
            tipoNormalizado,
            record.materialId,
          );
          payload['tipo'] = tipoNormalizado;
          payload['pagina_actual'] = record.paginaActual;
          payload['estado'] = record.estado;
          print('📦 Registro payload (retry): $payload');
          final retry = await _dio.post<dynamic>(
            '/api/registros/',
            data: payload,
          );
          if (retry.statusCode != 201 && retry.statusCode != 200) {
            print('❌ Error en retry: ${retry.statusCode}');
            throw Exception(_genericErrorMessage);
          }
          if (retry.data is Map<String, dynamic>) {
            return ReadingRecord.fromJson(retry.data as Map<String, dynamic>);
          }
          throw Exception(_genericErrorMessage);
        } catch (e) {
          print('❌ Error en retry de registro: $e');
          throw Exception(_genericErrorMessage);
        }
      }
      print('❌ Error creando registro de lectura: $e');
      throw Exception(_genericErrorMessage);
    } catch (e) {
      print('❌ Error creando registro de lectura: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  Future<ReadingRecord> updateReadingRecord(
    int recordId,
    ReadingRecord record, {
    String? tipo,
  }) async {
    try {
      // Validar que materialId no sea null
      if (record.materialId <= 0) {
        print('❌ materialId inválido: ${record.materialId}');
        throw Exception(_genericErrorMessage);
      }

      // Normalizar tipo a minúsculas
      final tipoNormalizado = (tipo ?? 'Libro').toLowerCase();
      final payload = _buildMaterialPayload(tipoNormalizado, record.materialId);
      payload['tipo'] = tipoNormalizado;
      payload['pagina_actual'] = record.paginaActual;
      payload['estado'] = record.estado;
      print('📦 Actualizando registro payload: $payload');
      final response = await _dio.patch<dynamic>(
        '/api/registros/$recordId/',
        data: payload,
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        print('❌ Error actualizando registro: ${response.statusCode}');
        throw Exception(_genericErrorMessage);
      }

      if (response.data is Map<String, dynamic>) {
        return ReadingRecord.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception(_genericErrorMessage);
    } on DioException catch (e) {
      if ((e.response?.statusCode == 400 || e.response?.statusCode == 500) &&
          tipo != null) {
        try {
          final tipoNormalizado = tipo.toLowerCase();
          final payload = _buildMaterialPayload(
            tipoNormalizado,
            record.materialId,
          );
          payload['tipo'] = tipoNormalizado;
          payload['pagina_actual'] = record.paginaActual;
          payload['estado'] = record.estado;
          print('📦 Registro payload (retry): $payload');
          final retry = await _dio.patch<dynamic>(
            '/api/registros/$recordId/',
            data: payload,
          );
          if (retry.statusCode != 200 && retry.statusCode != 201) {
            print('❌ Error en retry: ${retry.statusCode}');
            throw Exception(_genericErrorMessage);
          }
          if (retry.data is Map<String, dynamic>) {
            return ReadingRecord.fromJson(retry.data as Map<String, dynamic>);
          }
          throw Exception(_genericErrorMessage);
        } catch (e) {
          print('❌ Error en retry de actualización: $e');
          throw Exception(_genericErrorMessage);
        }
      }
      print('❌ Error actualizando registro: $e');
      throw Exception(_genericErrorMessage);
    } catch (e) {
      print('❌ Error actualizando registro: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  @deprecated
  Future<ReadingRecord> createReadingRecordOld({
    required String tipo,
    required int materialId,
    required int paginaActual,
    required String estado,
  }) async {
    try {
      final payload = _buildMaterialPayload(tipo, materialId);
      payload['pagina_actual'] = paginaActual;
      payload['estado'] = estado;
      final response = await _dio.post<dynamic>('/api/registros/', data: payload);
      if (response.statusCode != 201 && response.statusCode != 200) {
        throw Exception(_genericErrorMessage);
      }
      if (response.data is Map<String, dynamic>) {
        return ReadingRecord.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception(_genericErrorMessage);
    } catch (e) {
      print('❌ Error en createReadingRecordOld: $e');
      throw Exception(_genericErrorMessage);
    }
  }


  @deprecated
  Future<ReadingRecord> updateReadingRecordOld({
    required int recordId,
    required int paginaActual,
    required String estado,
  }) async {
    try {
      final response = await _dio.put<dynamic>(
        '/api/registros/$recordId/',
        data: {'pagina_actual': paginaActual, 'estado': estado},
      );
      if (response.statusCode != 200) {
        throw Exception(_genericErrorMessage);
      }
      if (response.data is Map<String, dynamic>) {
        return ReadingRecord.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception(_genericErrorMessage);
    } catch (e) {
      print('❌ Error en updateReadingRecordOld: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  Future<void> deleteReadingRecord(int recordId) async {
    try {
      final response = await _dio.delete<dynamic>('/api/registros/$recordId/');
      if (response.statusCode != 204 && response.statusCode != 200) {
        print('❌ Error eliminando registro: ${response.statusCode}');
        throw Exception(_genericErrorMessage);
      }
    } catch (e) {
      print('❌ Error en deleteReadingRecord: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  Future<List<Rating>> fetchRatings() async {
    try {
      final response = await _dio.get<dynamic>('/api/calificaciones/');
      if (response.statusCode != 200) {
        print('❌ Error cargando calificaciones: ${response.statusCode}');
        throw Exception(_genericErrorMessage);
      }
      final data = response.data;
      final list = data is List
          ? data
          : (data is Map<String, dynamic>
                ? data['results'] as List<dynamic>?
                : null);
      if (list == null) return [];
      return list.whereType<Map<String, dynamic>>().map(Rating.fromJson).toList();
    } catch (e) {
      print('❌ Error en fetchRatings: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  Future<Rating> createRating({
    required String tipo,
    required int materialId,
    required int rating,
  }) async {
    try {
      // Validar que materialId no sea null
      if (materialId <= 0) {
        print('❌ materialId inválido: $materialId');
        throw Exception(_genericErrorMessage);
      }

      // Normalizar tipo a minúsculas
      final tipoNormalizado = tipo.toLowerCase();
      final payload = _buildMaterialPayload(tipoNormalizado, materialId);
      payload['tipo'] = tipoNormalizado;
      payload['rating'] = rating;
      print('📦 Calificación payload: $payload');
      final response = await _dio.post<dynamic>(
        '/api/calificaciones/',
        data: payload,
      );
      if (response.statusCode != 201 && response.statusCode != 200) {
        print('❌ Error creando calificación: ${response.statusCode}');
        throw Exception(_genericErrorMessage);
      }
      if (response.data is Map<String, dynamic>) {
        return Rating.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception(_genericErrorMessage);
    } on DioException catch (e) {
      if (e.response?.statusCode == 400 || e.response?.statusCode == 500) {
        try {
          final tipoNormalizado = tipo.toLowerCase();
          final payload = _buildMaterialPayload(tipoNormalizado, materialId);
          payload['tipo'] = tipoNormalizado;
          payload['rating'] = rating;
          print('📦 Calificación payload (retry): $payload');
          final retry = await _dio.post<dynamic>(
            '/api/calificaciones/',
            data: payload,
          );
          if (retry.statusCode != 201 && retry.statusCode != 200) {
            print('❌ Error en retry: ${retry.statusCode}');
            throw Exception(_genericErrorMessage);
          }
          if (retry.data is Map<String, dynamic>) {
            return Rating.fromJson(retry.data as Map<String, dynamic>);
          }
          throw Exception(_genericErrorMessage);
        } catch (e) {
          print('❌ Error en retry de calificación: $e');
          throw Exception(_genericErrorMessage);
        }
      }
      print('❌ Error creando calificación: $e');
      throw Exception(_genericErrorMessage);
    } catch (e) {
      print('❌ Error creando calificación: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  Future<Rating> updateRating({
    required int ratingId,
    required int rating,
  }) async {
    try {
      final response = await _dio.patch<dynamic>(
        '/api/calificaciones/$ratingId/',
        data: {'rating': rating},
      );
      if (response.statusCode != 200 && response.statusCode != 201) {
        print('❌ Error actualizando calificación: ${response.statusCode}');
        throw Exception(_genericErrorMessage);
      }
      if (response.data is Map<String, dynamic>) {
        return Rating.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception(_genericErrorMessage);
    } catch (e) {
      print('❌ Error en updateRating: $e');
      throw Exception(_genericErrorMessage);
    }
  }

  Future<void> deleteRating(int ratingId) async {
    final response = await _dio.delete<dynamic>(
      '/api/calificaciones/$ratingId/',
    );
    if (response.statusCode != 204 && response.statusCode != 200) {
      throw Exception('No se pudo eliminar calificación');
    }
  }

  Future<List<UserComment>> fetchCommentsFor({
    required String tipo,
    required int materialId,
  }) async {
    final param = _materialQueryParam(tipo);
    final response = await _dio.get<dynamic>(
      '/api/comentarios/?$param=$materialId',
    );
    if (response.statusCode != 200) {
      throw Exception('No se pudo cargar comentarios');
    }
    final data = response.data;
    final list = data is List
        ? data
        : (data is Map<String, dynamic>
              ? data['results'] as List<dynamic>?
              : null);
    if (list == null) return [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(UserComment.fromJson)
        .toList();
  }

  Future<UserComment> createComment({
    required String tipo,
    required int materialId,
    required String descripcion,
  }) async {
    final payload = _buildMaterialPayload(tipo, materialId);
    payload['descripcion'] = descripcion;
    final response = await _dio.post<dynamic>(
      '/api/comentarios/',
      data: payload,
    );
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('No se pudo crear comentario');
    }
    if (response.data is Map<String, dynamic>) {
      return UserComment.fromJson(response.data as Map<String, dynamic>);
    }
    throw Exception('Respuesta inválida al crear comentario');
  }

  Future<UserComment> updateComment({
    required int commentId,
    required String descripcion,
  }) async {
    final response = await _dio.put<dynamic>(
      '/api/comentarios/$commentId/',
      data: {'descripcion': descripcion},
    );
    if (response.statusCode != 200) {
      throw Exception('No se pudo actualizar comentario');
    }
    if (response.data is Map<String, dynamic>) {
      return UserComment.fromJson(response.data as Map<String, dynamic>);
    }
    throw Exception('Respuesta inválida al actualizar comentario');
  }

  Future<UserProfile?> fetchUserProfile() async {
    try {
      final response = await _dio.get<dynamic>('/api/profile/');
      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        print('✅ Perfil obtenido: $data');
        return UserProfile.fromJson(data);
      }
      print(
        '❌ Error al obtener perfil: ${response.statusCode} - ${response.data?.runtimeType}',
      );
      return null;
    } catch (e) {
      print('❌ Error en fetchUserProfile: $e');
      rethrow;
    }
  }

  Future<List<AdminUser>> fetchUsers() async {
    final response = await _dio.get<dynamic>('/api/usuarios/');
    if (response.statusCode != 200) {
      throw Exception('No se pudo cargar usuarios');
    }
    final data = response.data;
    final list = data is List
        ? data
        : (data is Map<String, dynamic>
              ? data['results'] as List<dynamic>?
              : null);
    if (list == null) return [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(AdminUser.fromJson)
        .toList();
  }

  Future<void> updateUserRole(int userId, String role) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/usuarios/$userId/',
      data: {'rol': role},
    );
    if (response.statusCode != 200 && response.statusCode != 202) {
      throw Exception('No se pudo actualizar el rol');
    }
  }

  Future<List<AdminComment>> fetchComments() async {
    final response = await _dio.get<dynamic>('/api/comentarios/');
    if (response.statusCode != 200) {
      throw Exception('No se pudo cargar comentarios');
    }
    final data = response.data;
    final list = data is List
        ? data
        : (data is Map<String, dynamic>
              ? data['results'] as List<dynamic>?
              : null);
    if (list == null) return [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(AdminComment.fromJson)
        .toList();
  }

  Future<void> deleteComment(int commentId) async {
    final response = await _dio.delete<dynamic>('/api/comentarios/$commentId/');
    if (response.statusCode != 204 && response.statusCode != 200) {
      throw Exception('No se pudo eliminar el comentario');
    }
  }

  Future<void> createLibro(FormData data) async {
    final response = await _dio.post<dynamic>('/api/libros/', data: data);
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('No se pudo crear el libro');
    }
  }

  Future<void> createManga(FormData data) async {
    final response = await _dio.post<dynamic>('/api/mangas/', data: data);
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('No se pudo crear el manga');
    }
  }

  Future<void> createNovela(FormData data) async {
    final response = await _dio.post<dynamic>('/api/novelas/', data: data);
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('No se pudo crear la novela');
    }
  }

  Future<List<ReadingItem>> _fetchList(
    String path, {
    required String tipo,
  }) async {
    final response = await _dio.get<dynamic>(path);
    final data = response.data;

    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map((json) => ReadingItem.fromJson(json, tipo: tipo))
          .toList();
    }

    if (data is Map<String, dynamic>) {
      final results = <Map<String, dynamic>>[];
      final firstPage = data['results'] as List<dynamic>? ?? <dynamic>[];
      results.addAll(firstPage.whereType<Map<String, dynamic>>());

      var nextUrl = data['next'] as String?;
      while (nextUrl != null && nextUrl.isNotEmpty) {
        final nextResponse = await _dio.get<dynamic>(nextUrl);
        final nextData = nextResponse.data;
        if (nextData is Map<String, dynamic>) {
          final nextResults =
              nextData['results'] as List<dynamic>? ?? <dynamic>[];
          results.addAll(nextResults.whereType<Map<String, dynamic>>());
          nextUrl = nextData['next'] as String?;
        } else {
          break;
        }
      }

      return results
          .map((json) => ReadingItem.fromJson(json, tipo: tipo))
          .toList();
    }

    return [];
  }

  Uri buildMediaUri(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Uri.parse(path);
    }
    if (path.startsWith('/media/')) {
      return Uri.parse('$baseUrl$path');
    }
    if (path.startsWith('media/')) {
      return Uri.parse('$baseUrl/$path');
    }
    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return Uri.parse('$baseUrl/media/$normalizedPath');
  }

  Map<String, dynamic> _buildMaterialPayload(String tipo, int materialId) {
    if (materialId <= 0) {
      throw Exception('materialId inválido: $materialId');
    }
    final normalized = tipo.trim().toLowerCase();
    if (normalized.contains('manga')) {
      return {'manga': materialId};
    } else if (normalized.contains('novela')) {
      return {'novela': materialId};
    } else {
      return {'libro': materialId};
    }
  }

  String _materialQueryParam(String tipo) {
    final normalized = tipo.trim().toLowerCase();
    if (normalized.contains('manga')) return 'manga';
    if (normalized.contains('novela')) return 'novela';
    return 'libro';
  }

  static late ApiClient _instance;

  static ApiClient get instance => _instance;

  static Future<void> initialize({String? baseUrl}) async {
    _instance = ApiClient(baseUrl: baseUrl);
    await _instance.init();
  }
}
