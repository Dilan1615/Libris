import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/models.dart';
import '../main.dart';
import '../theme/app_theme.dart';

class AdminPanelPage extends StatefulWidget {
  const AdminPanelPage({super.key});

  @override
  State<AdminPanelPage> createState() => _AdminPanelPageState();
}


class _AdminPanelPageState extends State<AdminPanelPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final _formKey = GlobalKey<FormState>();
  final _tituloController = TextEditingController();
  final _autorController = TextEditingController();
  final _anioController = TextEditingController();
  final _editorialController = TextEditingController();
  final _descripcionController = TextEditingController();
  final _generosController = TextEditingController();

  final _isbnController = TextEditingController();
  final _paginasController = TextEditingController();

  final _tomoController = TextEditingController();
  final _capitulosController = TextEditingController();
  String _estadoPublicacion = 'EN_CURSO';

  final _volumenController = TextEditingController();
  final _numCapitulosController = TextEditingController();
  String _tipoNovela = 'LIGERA';

  String _materialType = 'libro';
  PlatformFile? _portada;
  PlatformFile? _pdf;
  bool _submitting = false;

  bool _usersLoading = false;
  String? _usersError;
  List<AdminUser> _users = [];

  bool _commentsLoading = false;
  String? _commentsError;
  List<AdminComment> _comments = [];



 

  @override
  void dispose() {
    _tabController.dispose();
    _tituloController.dispose();
    _autorController.dispose();
    _anioController.dispose();
    _editorialController.dispose();
    _descripcionController.dispose();
    _generosController.dispose();
    _isbnController.dispose();
    _paginasController.dispose();
    _tomoController.dispose();
    _capitulosController.dispose();
    _volumenController.dispose();
    _numCapitulosController.dispose();
    super.dispose();
  }
  

  @override
  Widget build(BuildContext context) {
    final state = context.read<LibrisState>();
    final adminUri = Uri.parse('${state.apiClient.baseUrl}/admin/');

    return Scaffold(
      appBar: AppBar(
        title: const Text('⚙️ Panel de administrador'),
        elevation: 0,
        backgroundColor: AppTheme.darkBackground,
        foregroundColor: Colors.white,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.darkBackground, Color(0xFF1E293B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Column(
            children: [
              TabBar(
                controller: _tabController,
                labelColor: AppTheme.primaryPurple,
                unselectedLabelColor: const Color(0xFF64748B),
                indicatorColor: AppTheme.primaryPurple,
                tabs: const [
                  Tab(text: '📚 Materiales'),
                  Tab(text: '👥 Usuarios'),
                  Tab(text: '💬 Comentarios'),
                ],
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new),
            tooltip: 'Abrir admin web',
            onPressed: () => _openAdmin(context, adminUri),
          ),
        ],
      ),
      body: Container(
        decoration: AppTheme.animeBackgroundGradient,
        child: SafeArea(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildMaterialsTab(context),
              _buildUsersTab(context),
              _buildCommentsTab(context),
            ],
          ),
        ),
      ),
    );
  }



  Widget _buildRetry({required String message, required Future<void> Function() onRetry}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              color: const Color(0xFFEF4444),
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 24),
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFFEF4444),
                    Color(0xFFF87171),
                  ],
                ),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFEF4444).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: onRetry,
                child: const Text(
                  'Reintentar',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label, {
    bool required = false,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? helper,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          labelText: label,
          helperText: helper,
          labelStyle: const TextStyle(
            color: Color(0xFF94A3B8),
            fontWeight: FontWeight.w500,
          ),
          helperStyle: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 12,
          ),
          filled: true,
          fillColor: AppTheme.cardBackground,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(0xFF334155),
              width: 1,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(0xFF334155),
              width: 1,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: AppTheme.primaryPurple,
              width: 2,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(0xFFEF4444),
              width: 1,
            ),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(0xFFEF4444),
              width: 2,
            ),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 12,
          ),
        ),
        validator: required
            ? (value) => value == null || value.trim().isEmpty
                ? 'Campo requerido'
                : null
            : null,
      ),
    );
  }

  Widget _buildDropdownField<T>({
    required T value,
    required String label,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DropdownButtonFormField<T>(
        value: value,
        items: items,
        onChanged: onChanged,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(
            color: Color(0xFF94A3B8),
            fontWeight: FontWeight.w500,
          ),
          filled: true,
          fillColor: AppTheme.cardBackground,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(0xFF334155),
              width: 1,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(0xFF334155),
              width: 1,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: AppTheme.primaryPurple,
              width: 2,
            ),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildFileButton({
    required VoidCallback onPressed,
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.withOpacity(0.7)],
        ),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pickPortada() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    setState(() => _portada = result.files.first);
  }

  Future<void> _pickPdf() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    setState(() => _pdf = result.files.first);
  }

  Future<void> _submitMaterial(BuildContext context) async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _submitting = true);

    try {
      final state = context.read<LibrisState>();
      final generos = _generosController.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();

      final data = <String, dynamic>{
        'titulo': _tituloController.text.trim(),
        'autor': _autorController.text.trim(),
        'anio_publicacion': int.parse(_anioController.text.trim()),
        'editorial': _editorialController.text.trim(),
        'descripcion': _descripcionController.text.trim(),
        if (generos.isNotEmpty) 'generos': generos,
      };

      if (_portada != null) {
        data['portada'] = await _multipartFromFile(_portada!);
      }
      if (_pdf != null) {
        data['contenido_pdf'] = await _multipartFromFile(_pdf!);
      }

      final formData = FormData.fromMap(data);

      if (_materialType == 'libro') {
        formData.fields.add(MapEntry('isbn', _isbnController.text.trim()));
        if (_paginasController.text.trim().isNotEmpty) {
          formData.fields.add(
            MapEntry('numero_paginas', _paginasController.text.trim()),
          );
        }
        await state.apiClient.createLibro(formData);
      } else if (_materialType == 'manga') {
        formData.fields.add(MapEntry('tomo', _tomoController.text.trim()));
        if (_capitulosController.text.trim().isNotEmpty) {
          formData.fields.add(
            MapEntry('capitulos', _capitulosController.text.trim()),
          );
        }
        formData.fields.add(
          MapEntry('estado_publicacion', _estadoPublicacion),
        );
        await state.apiClient.createManga(formData);
      } else {
        formData.fields.add(MapEntry('volumen', _volumenController.text.trim()));
        if (_numCapitulosController.text.trim().isNotEmpty) {
          formData.fields.add(
            MapEntry('numero_capitulos', _numCapitulosController.text.trim()),
          );
        }
        formData.fields.add(MapEntry('tipo', _tipoNovela));
        await state.apiClient.createNovela(formData);
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Material creado correctamente')),
        );
      }
      _clearMaterialForm();
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<MultipartFile> _multipartFromFile(PlatformFile file) async {
    if (file.bytes != null) {
      return MultipartFile.fromBytes(file.bytes!, filename: file.name);
    }
    if (file.path != null) {
      return MultipartFile.fromFile(file.path!, filename: file.name);
    }
    throw Exception('Archivo inválido');
  }

  void _clearMaterialForm() {
    _tituloController.clear();
    _autorController.clear();
    _anioController.clear();
    _editorialController.clear();
    _descripcionController.clear();
    _generosController.clear();
    _isbnController.clear();
    _paginasController.clear();
    _tomoController.clear();
    _capitulosController.clear();
    _volumenController.clear();
    _numCapitulosController.clear();
    setState(() {
      _portada = null;
      _pdf = null;
    });
  }

  Future<void> _loadUsers() async {
    setState(() {
      _usersLoading = true;
      _usersError = null;
    });
    try {
      final state = context.read<LibrisState>();
      final users = await state.apiClient.fetchUsers();
      setState(() => _users = users);
    } catch (e) {
      setState(() => _usersError = 'No se pudieron cargar usuarios');
    } finally {
      if (mounted) setState(() => _usersLoading = false);
    }
  }

  Future<void> _changeUserRole(
    BuildContext context,
    AdminUser user,
    String? role,
  ) async {
    if (role == null || role == user.rol) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cambiar rol'),
        content: Text(
          '¿Estás seguro de que quieres cambiar el rol de ${user.username} a $role?',
        ),
        backgroundColor: AppTheme.cardBackground,
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
        contentTextStyle: const TextStyle(
          color: Color(0xFF94A3B8),
          fontWeight: FontWeight.w500,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: Color(0xFF64748B)),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryBlue, AppTheme.primaryPurple],
              ),
              borderRadius: BorderRadius.circular(6),
            ),
            child: TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text(
                'Confirmar',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    ) ?? false;

    if (!confirmed) return;

    try {
      final state = context.read<LibrisState>();
      await state.apiClient.updateUserRole(user.id, role);
      setState(() {
        _users = _users
            .map((u) => u.id == user.id ? AdminUser(
                  id: u.id,
                  username: u.username,
                  email: u.email,
                  rol: role,
                  isActive: u.isActive,
                ) : u)
            .toList();
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Rol actualizado')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _loadComments() async {
    setState(() {
      _commentsLoading = true;
      _commentsError = null;
    });
    try {
      final state = context.read<LibrisState>();
      final comments = await state.apiClient.fetchComments();
      setState(() => _comments = comments);
    } catch (e) {
      setState(() => _commentsError = 'No se pudieron cargar comentarios');
    } finally {
      if (mounted) setState(() => _commentsLoading = false);
    }
  }

  Future<void> _deleteComment(BuildContext context, AdminComment comment) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar comentario'),
        content: const Text(
          '¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.',
        ),
        backgroundColor: AppTheme.cardBackground,
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
        contentTextStyle: const TextStyle(
          color: Color(0xFF94A3B8),
          fontWeight: FontWeight.w500,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: Color(0xFF64748B)),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFEF4444), Color(0xFFF87171)],
              ),
              borderRadius: BorderRadius.circular(6),
            ),
            child: TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text(
                'Eliminar',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    ) ?? false;

    if (!confirmed) return;

    try {
      final state = context.read<LibrisState>();
      await state.apiClient.deleteComment(comment.id);
      setState(() => _comments.removeWhere((c) => c.id == comment.id));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Comentario eliminado')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _openAdmin(BuildContext context, Uri uri) async {
    final can = await canLaunchUrl(uri);
    if (!can) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo abrir el panel admin')),
        );
      }
      return;
    }
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

 Widget _buildMaterialsTab(BuildContext context) {
  return SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Selector de tipo de material
          _buildDropdownField<String>(
            value: _materialType,
            label: 'Tipo de material',
            items: [
              const DropdownMenuItem(value: 'libro', child: Text('📚 Libro')),
              const DropdownMenuItem(value: 'manga', child: Text('🎨 Manga')),
              const DropdownMenuItem(value: 'novela', child: Text('📖 Novela')),
            ],
            onChanged: (value) {
              if (value != null) setState(() => _materialType = value);
            },
          ),
          
          // Campos comunes
          _buildTextField(_tituloController, 'Título', required: true),
          _buildTextField(_autorController, 'Autor', required: true),
          _buildTextField(_anioController, 'Año', required: true, keyboardType: TextInputType.number),
          _buildTextField(_editorialController, 'Editorial', required: true),
          _buildTextField(_descripcionController, 'Descripción', maxLines: 4),
          _buildTextField(
            _generosController,
            'Géneros (separados por comas)',
            helper: 'Ej: Ficción, Aventura, Misterio',
          ),
          
          // Portada y PDF
          Row(
            children: [
              Expanded(
                child: _buildFileButton(
                  onPressed: _pickPortada,
                  icon: Icons.image,
                  label: _portada?.name ?? 'Seleccionar portada',
                  color: AppTheme.primaryBlue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildFileButton(
                  onPressed: _pickPdf,
                  icon: Icons.picture_as_pdf,
                  label: _pdf?.name ?? 'Seleccionar PDF',
                  color: AppTheme.primaryPurple,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Campos específicos por tipo
          if (_materialType == 'libro') ...[
            _buildTextField(_isbnController, 'ISBN', required: true),
            _buildTextField(_paginasController, 'Número de páginas', keyboardType: TextInputType.number),
          ] else if (_materialType == 'manga') ...[
            _buildTextField(_tomoController, 'Tomo', required: true, keyboardType: TextInputType.number),
            _buildTextField(_capitulosController, 'Capítulos', keyboardType: TextInputType.number),
            _buildDropdownField<String>(
              value: _estadoPublicacion,
              label: 'Estado de publicación',
              items: [
                const DropdownMenuItem(value: 'EN_CURSO', child: Text('En curso')),
                const DropdownMenuItem(value: 'FINALIZADO', child: Text('Finalizado')),
                const DropdownMenuItem(value: 'HIATUS', child: Text('Hiatus')),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _estadoPublicacion = value);
              },
            ),
          ] else ...[
            _buildTextField(_volumenController, 'Volumen', required: true, keyboardType: TextInputType.number),
            _buildTextField(_numCapitulosController, 'Número de capítulos', keyboardType: TextInputType.number),
            _buildDropdownField<String>(
              value: _tipoNovela,
              label: 'Tipo de novela',
              items: [
                const DropdownMenuItem(value: 'LIGERA', child: Text('Ligera')),
                const DropdownMenuItem(value: 'WEB', child: Text('Web')),
                const DropdownMenuItem(value: 'VISUAL', child: Text('Visual')),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _tipoNovela = value);
              },
            ),
          ],
          
          const SizedBox(height: 24),
          
          // Botón de envío
          SizedBox(
            width: double.infinity,
            child: Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryBlue, AppTheme.primaryPurple],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                onPressed: _submitting ? null : () => _submitMaterial(context),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                      )
                    : const Text('Crear Material', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

  Widget _buildUsersTab(BuildContext context) {
  if (_usersLoading) {
    return const Center(child: CircularProgressIndicator());
  }
  if (_usersError != null) {
    return _buildRetry(
      message: _usersError!,
      onRetry: _loadUsers,
    );
  }
  if (_users.isEmpty) {
    return const Center(
      child: Text('No hay usuarios', style: TextStyle(color: Color(0xFF94A3B8))),
    );
  }
  return ListView.builder(
    itemCount: _users.length,
    itemBuilder: (context, index) {
      final user = _users[index];
      return Card(
        color: AppTheme.cardBackground,
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(user.username, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              Text(user.email, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButton<String>(
                      value: user.rol,
                      items: [
                        const DropdownMenuItem(value: 'USER', child: Text('Usuario')),
                        const DropdownMenuItem(value: 'ADMIN', child: Text('Admin')),
                      ],
                      onChanged: (value) => _changeUserRole(context, user, value),
                      style: const TextStyle(color: Colors.white),
                      dropdownColor: AppTheme.cardBackground,
                      isExpanded: true,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: user.isActive ? const Color(0xFF10B981) : const Color(0xFF6B7280),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      user.isActive ? 'Activo' : 'Inactivo',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
}
  Widget _buildCommentsTab(BuildContext context) {
  if (_commentsLoading) {
    return const Center(child: CircularProgressIndicator());
  }
  if (_commentsError != null) {
    return _buildRetry(
      message: _commentsError!,
      onRetry: _loadComments,
    );
  }
  if (_comments.isEmpty) {
    return const Center(
      child: Text('No hay comentarios', style: TextStyle(color: Color(0xFF94A3B8))),
    );
  }
  return ListView.builder(
    itemCount: _comments.length,
    itemBuilder: (context, index) {
      final comment = _comments[index];
      return Card(
        color: AppTheme.cardBackground,
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: ListTile(
          title: Text(comment.descripcion, style: const TextStyle(color: Colors.white)),
          subtitle: Text(
            'Por ${comment.nombreUsuario} • ${comment.fecha}',
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
          ),
          trailing: IconButton(
            icon: const Icon(Icons.delete, color: Color(0xFFEF4444)),
            onPressed: () => _deleteComment(context, comment),
          ),
        ),
      );
    },
  );
}
@override
void initState() {
  super.initState();
  _tabController = TabController(length: 3, vsync: this);
  _tabController.addListener(() {
    if (mounted) {
      if (_tabController.index == 1 && _users.isEmpty && !_usersLoading) {
        _loadUsers();
      }
      if (_tabController.index == 2 && _comments.isEmpty && !_commentsLoading) {
        _loadComments();
      }
    }
  });
}
}


