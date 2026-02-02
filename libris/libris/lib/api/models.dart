class UserProfile {
  UserProfile({
    required this.id,
    required this.username,
    required this.email,
    required this.rol,
    this.firstName,
    this.lastName,
    this.fotoPerfil,
    required this.isActive,
  });

  final int id;
  final String username;
  final String email;
  final String rol;
  final String? firstName;
  final String? lastName;
  final String? fotoPerfil;
  final bool isActive;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as int? ?? 0,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      rol: json['rol'] as String? ?? '',
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      fotoPerfil: json['foto_perfil'] as String?,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  String get fullName {
    final first = firstName ?? '';
    final last = lastName ?? '';
    final name = '$first $last'.trim();
    return name.isEmpty ? username : name;
  }
}

class AdminUser {
  AdminUser({
    required this.id,
    required this.username,
    required this.email,
    required this.rol,
    required this.isActive,
  });

  final int id;
  final String username;
  final String email;
  final String rol;
  final bool isActive;

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: (json['id'] as num?)?.toInt() ?? 0,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      rol: json['rol'] as String? ?? 'USER',
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

class AdminComment {
  AdminComment({
    required this.id,
    required this.descripcion,
    required this.fecha,
    required this.nombreUsuario,
    required this.tituloMaterial,
    required this.tipoMaterial,
  });

  final int id;
  final String descripcion;
  final String fecha;
  final String nombreUsuario;
  final String tituloMaterial;
  final String tipoMaterial;

  factory AdminComment.fromJson(Map<String, dynamic> json) {
    return AdminComment(
      id: (json['id'] as num?)?.toInt() ?? 0,
      descripcion: json['descripcion'] as String? ?? '',
      fecha: json['fecha'] as String? ?? '',
      nombreUsuario: json['nombre_usuario'] as String? ?? 'Usuario',
      tituloMaterial: json['titulo_material'] as String? ?? 'Sin material',
      tipoMaterial: json['tipo_material'] as String? ?? 'desconocido',
    );
  }
}

class ReadingItem {
  ReadingItem({
    required this.id,
    required this.titulo,
    required this.tipo,
    this.autor,
    this.descripcion,
    this.portada,
    this.archivo,
    this.pdfUrl,
    this.numeroPaginas,
  });

  final int id;
  final String titulo;
  final String tipo;
  final String? autor;
  final String? descripcion;
  final String? portada;
  final String? archivo;
  final String? pdfUrl;
  final int? numeroPaginas;

  factory ReadingItem.fromJson(
    Map<String, dynamic> json, {
    required String tipo,
  }) {
    String? _findByExtension(List<String> exts) {
      for (final value in json.values) {
        if (value is String) {
          final lower = value.toLowerCase();
          if (exts.any((ext) => lower.contains(ext))) {
            return value;
          }
        }
      }
      return null;
    }

    final portada =
        (json['portada'] as String?) ??
        (json['portada_url'] as String?) ??
        (json['imagen'] as String?) ??
        (json['cover'] as String?) ??
        _findByExtension(['.jpg', '.jpeg', '.png', '.webp']);

    final pdfUrl =
        (json['contenido_pdf_url'] as String?) ??
        (json['contenido_pdf'] as String?) ??
        (json['archivo'] as String?) ??
        (json['pdf'] as String?) ??
        (json['archivo_pdf'] as String?) ??
        (json['pdf_url'] as String?) ??
        (json['contenido'] as String?) ??
        _findByExtension(['.pdf']);

    return ReadingItem(
      id: (json['id'] as num?)?.toInt() ?? 0,
      titulo:
          (json['titulo'] as String?) ??
          (json['nombre'] as String?) ??
          (json['title'] as String?) ??
          'Sin título',
      autor: (json['autor'] as String?) ?? (json['author'] as String?),
      descripcion:
          (json['descripcion'] as String?) ??
          (json['sinopsis'] as String?) ??
          (json['description'] as String?),
      portada: portada,
      archivo: pdfUrl,
      pdfUrl: pdfUrl,
      numeroPaginas:
          (json['numero_paginas'] as num?)?.toInt() ??
          (json['num_paginas'] as num?)?.toInt() ??
          (json['pages'] as num?)?.toInt(),
      tipo: tipo,
    );
  }
}

class ReadingRecord {
  ReadingRecord({
    required this.id,
    required this.materialId,
    this.tipo,
    this.titulo,
    this.tituloMaterial,
    this.tipoMaterial,
    this.portada,
    this.totalPaginas,
    required this.paginaActual,
    required this.estado,
    required this.fechaInicio,
    this.fechaFinalizacion,
    this.usuarioId,
  });

  final int id;
  final int materialId;
  final String? tipo;
  final String? titulo;
  final String? tituloMaterial;
  final String? tipoMaterial;
  final String? portada;
  final int? totalPaginas;
  final int paginaActual;
  final String estado;
  final DateTime fechaInicio;
  final DateTime? fechaFinalizacion;
  final int? usuarioId;

  factory ReadingRecord.fromJson(Map<String, dynamic> json) {
    final rawTipo = (json['tipo'] as String?)?.trim().toLowerCase();
    int materialId = (json['material'] as num?)?.toInt() ?? 0;
    String? inferredTipo;
    String? tituloMaterial;
    String? portada;
    int? totalPaginas;

    String? _extractTitle(Map<String, dynamic> data) {
      return data['titulo'] as String? ??
          data['nombre'] as String? ??
          data['title'] as String?;
    }

    String? _extractCover(Map<String, dynamic> data) {
      return data['portada'] as String? ??
          data['portada_url'] as String? ??
          data['imagen'] as String? ??
          data['cover'] as String?;
    }

    if (materialId == 0) {
      final libroRaw = json['libro'];
      final mangaRaw = json['manga'];
      final novelaRaw = json['novela'];

      if (libroRaw is num) {
        materialId = libroRaw.toInt();
        inferredTipo = 'libro';
      } else if (libroRaw is Map<String, dynamic>) {
        materialId = (libroRaw['id'] as num?)?.toInt() ?? 0;
        inferredTipo = 'libro';
        tituloMaterial ??= _extractTitle(libroRaw);
        portada ??= _extractCover(libroRaw);
      } else if (mangaRaw is num) {
        materialId = mangaRaw.toInt();
        inferredTipo = 'manga';
      } else if (mangaRaw is Map<String, dynamic>) {
        materialId = (mangaRaw['id'] as num?)?.toInt() ?? 0;
        inferredTipo = 'manga';
        tituloMaterial ??= _extractTitle(mangaRaw);
        portada ??= _extractCover(mangaRaw);
      } else if (novelaRaw is num) {
        materialId = novelaRaw.toInt();
        inferredTipo = 'novela';
      } else if (novelaRaw is Map<String, dynamic>) {
        materialId = (novelaRaw['id'] as num?)?.toInt() ?? 0;
        inferredTipo = 'novela';
        tituloMaterial ??= _extractTitle(novelaRaw);
        portada ??= _extractCover(novelaRaw);
      }
    }

    if (tituloMaterial == null) {
      final materialRaw = json['material'];
      if (materialRaw is Map<String, dynamic>) {
        tituloMaterial = _extractTitle(materialRaw);
        portada ??= _extractCover(materialRaw);
      }
    }

    final materialInfo = json['material_info'];
    if (materialInfo is Map<String, dynamic>) {
      materialId = (materialInfo['id'] as num?)?.toInt() ?? materialId;
      tituloMaterial ??= _extractTitle(materialInfo);
      portada ??= _extractCover(materialInfo);
      totalPaginas =
          (materialInfo['numero_paginas'] as num?)?.toInt() ??
          (materialInfo['num_paginas'] as num?)?.toInt() ??
          (materialInfo['pages'] as num?)?.toInt();
    }

    return ReadingRecord(
      id: (json['id'] as num?)?.toInt() ?? 0,
      materialId: materialId,
      tipo: rawTipo ?? inferredTipo,
      titulo: json['titulo'] as String?,
      tituloMaterial: tituloMaterial ?? (json['titulo_material'] as String?),
      tipoMaterial: (json['tipo_material'] as String?)?.trim().toLowerCase(),
      portada: portada,
      totalPaginas: totalPaginas,
      paginaActual: (json['pagina_actual'] as num?)?.toInt() ?? 0,
      estado: json['estado'] as String? ?? 'PENDIENTE',
      fechaInicio: json['fecha_inicio'] != null
          ? DateTime.parse(json['fecha_inicio'] as String)
          : DateTime.now(),
      fechaFinalizacion: json['fecha_finalizacion'] != null
          ? DateTime.parse(json['fecha_finalizacion'] as String)
          : null,
      usuarioId: (json['usuario'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'material': materialId,
      'pagina_actual': paginaActual,
      'estado': estado,
      'fecha_inicio': fechaInicio.toIso8601String(),
      'fecha_finalizacion': fechaFinalizacion?.toIso8601String(),
    };
  }
}

class Rating {
  Rating({required this.id, required this.rating, this.materialId});

  final int id;
  final int rating;
  final int? materialId;

  factory Rating.fromJson(Map<String, dynamic> json) {
    return Rating(
      id: (json['id'] as num?)?.toInt() ?? 0,
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      materialId: (json['material'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'rating': rating,
      if (materialId != null) 'material': materialId,
    };
  }
}

class UserComment {
  UserComment({
    required this.id,
    required this.descripcion,
    required this.fecha,
    required this.nombreUsuario,
  });

  final int id;
  final String descripcion;
  final String fecha;
  final String nombreUsuario;

  factory UserComment.fromJson(Map<String, dynamic> json) {
    return UserComment(
      id: (json['id'] as num?)?.toInt() ?? 0,
      descripcion: json['descripcion'] as String? ?? '',
      fecha: json['fecha'] as String? ?? '',
      nombreUsuario: json['nombre_usuario'] as String? ?? 'Usuario',
    );
  }
}
