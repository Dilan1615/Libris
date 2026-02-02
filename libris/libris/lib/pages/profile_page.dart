import 'package:flutter/material.dart';
import 'package:collection/collection.dart';
import 'package:provider/provider.dart';

import '../api/models.dart';
import '../main.dart';
import '../theme/app_theme.dart';
import 'admin_panel_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late Future<UserProfile?> _profileFuture;
  late Future<List<ReadingRecord>> _historyFuture;

  Future<List<ReadingRecord>> _loadHistory(LibrisState state) async {
    await state.ensureCatalogLoaded();
    return state.apiClient.fetchReadingRecords();
  }

  @override
  void initState() {
    super.initState();
    final state = context.read<LibrisState>();
    _profileFuture = state.apiClient.fetchUserProfile();
    _historyFuture = _loadHistory(state);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mi Perfil'), elevation: 0),
      body: FutureBuilder<UserProfile?>(
        future: _profileFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError || snapshot.data == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('No se pudo cargar el perfil'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        final state = context.read<LibrisState>();
                        _profileFuture = state.apiClient.fetchUserProfile();
                      });
                    },
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }

          final profile = snapshot.data!;
          final isAdmin = _isAdminRole(profile.rol);
          return Container(
            decoration: AppTheme.animeBackgroundGradient,
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Encabezado de perfil con gradiente
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      vertical: 40,
                      horizontal: 16,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppTheme.primaryBlue, AppTheme.primaryPurple],
                      ),
                      boxShadow: [AppTheme.glowShadow],
                    ),
                    child: Column(
                      children: [
                        // Avatar con efecto glow
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryBlue.withOpacity(0.6),
                                blurRadius: 20,
                                spreadRadius: 4,
                              ),
                            ],
                          ),
                          child: profile.fotoPerfil != null
                              ? CircleAvatar(
                                  radius: 56,
                                  backgroundImage: NetworkImage(
                                    profile.fotoPerfil!,
                                  ),
                                  onBackgroundImageError: (_, __) {},
                                )
                              : CircleAvatar(
                                  radius: 56,
                                  backgroundColor: Colors.white.withOpacity(
                                    0.1,
                                  ),
                                  child: const Icon(
                                    Icons.person,
                                    size: 48,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          profile.fullName,
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '@${profile.username}',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: Colors.white70,
                                letterSpacing: 0.5,
                              ),
                        ),
                      ],
                    ),
                  ),
                  // Información del perfil
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildInfoSection(context, '👤 Información Personal', [
                          _buildInfoField(
                            context,
                            'Email',
                            profile.email,
                            Icons.mail_outline,
                          ),
                          _buildInfoField(
                            context,
                            'Nombre',
                            profile.firstName ?? 'No especificado',
                            Icons.person_outline,
                          ),
                          _buildInfoField(
                            context,
                            'Apellido',
                            profile.lastName ?? 'No especificado',
                            Icons.person_outline,
                          ),
                        ]),
                        const SizedBox(height: 32),
                        _buildInfoSection(context, '🔐 Estado de Cuenta', [
                          _buildInfoField(
                            context,
                            'Estado',
                            profile.isActive ? 'Activo' : 'Inactivo',
                            profile.isActive
                                ? Icons.check_circle_outline
                                : Icons.cancel_outlined,
                            valueColor: profile.isActive
                                ? AppTheme.accentCyan
                                : const Color(0xFFEF4444),
                          ),
                        ]),
                        const SizedBox(height: 32),
                        _buildReadingHistorySection(context),
                        if (isAdmin) ...[
                          const SizedBox(height: 32),
                          _buildAdminSection(context),
                        ],
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                              ),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(
                                    0xFFEF4444,
                                  ).withOpacity(0.3),
                                  blurRadius: 12,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton.icon(
                              onPressed: () {
                                context.read<LibrisState>().logout();
                                if (mounted) {
                                  Navigator.of(context).pop();
                                }
                              },
                              icon: const Icon(Icons.logout),
                              label: const Text('Cerrar Sesión'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                elevation: 0,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoSection(
    BuildContext context,
    String title,
    List<Widget> fields,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        ...fields,
      ],
    );
  }

  Widget _buildReadingHistorySection(BuildContext context) {
    final state = context.watch<LibrisState>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '📚 Historial de lectura',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        FutureBuilder<List<ReadingRecord>>(
          future: _historyFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation(AppTheme.primaryPurple),
                ),
              );
            }
            if (snapshot.hasError) {
              return _buildRetryHistory(context);
            }
            final records = snapshot.data ?? [];
            if (records.isEmpty) {
              return const Text(
                'No tienes historial aún.',
                style: TextStyle(color: Color(0xFF94A3B8)),
              );
            }

            return Column(
              children: records.map((record) {
                final item = _materialForRecord(record, state.items);
                final title =
                    item?.titulo ??
                    record.tituloMaterial ??
                    record.titulo ??
                    'Material';
                final statusLabel = _estadoLabel(record.estado);
                final portada = item?.portada ?? record.portada;
                final totalPages = record.totalPaginas ?? item?.numeroPaginas;
                final progress = (totalPages != null && totalPages > 0)
                    ? (record.paginaActual / totalPages).clamp(0.0, 1.0)
                    : null;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.cardBackground,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFF334155),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryBlue.withOpacity(0.08),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Portada o ícono
                      if (portada != null && portada.isNotEmpty)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Image.network(
                            state.apiClient.buildMediaUri(portada).toString(),
                            width: 50,
                            height: 70,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 50,
                              height: 70,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    AppTheme.primaryBlue,
                                    AppTheme.primaryPurple,
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(
                                Icons.menu_book,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                        )
                      else
                        Container(
                          width: 50,
                          height: 70,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                AppTheme.primaryBlue,
                                AppTheme.primaryPurple,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Icon(
                            Icons.menu_book,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              totalPages != null && totalPages > 0
                                  ? 'Página ${record.paginaActual} / $totalPages'
                                  : 'Página ${record.paginaActual}',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(color: const Color(0xFF94A3B8)),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(999),
                                    child: LinearProgressIndicator(
                                      value: progress,
                                      minHeight: 6,
                                      backgroundColor: const Color(0xFF1E293B),
                                      valueColor: AlwaysStoppedAnimation(
                                        progress == null
                                            ? const Color(0xFF475569)
                                            : AppTheme.primaryBlue,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _estadoColor(record.estado),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    statusLabel,
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelSmall
                                        ?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildRetryHistory(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'No se pudo cargar el historial.',
          style: TextStyle(color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: () {
            setState(() {
              final state = context.read<LibrisState>();
              _historyFuture = _loadHistory(state);
            });
          },
          child: const Text('Reintentar'),
        ),
      ],
    );
  }

  ReadingItem? _materialForRecord(
    ReadingRecord record,
    List<ReadingItem> items,
  ) {
    final tipo = record.tipo?.toLowerCase();
    return items.firstWhereOrNull(
      (item) =>
          item.id == record.materialId &&
          (tipo == null || item.tipo.toLowerCase() == tipo),
    );
  }

  String _estadoLabel(String estado) {
    switch (estado) {
      case 'LEIDO':
        return 'Leído';
      case 'FAVORITO':
        return 'Favorito';
      case 'ABANDONADO':
        return 'Abandonado';
      default:
        return 'Pendiente';
    }
  }

  Color _estadoColor(String estado) {
    switch (estado) {
      case 'LEIDO':
        return const Color(0xFF16A34A); // verde
      case 'PENDIENTE':
        return const Color(0xFFF59E0B); // naranja
      case 'FAVORITO':
        return const Color(0xFFEF4444); // rojo
      case 'ABANDONADO':
        return const Color(0xFF64748B); // gris
      default:
        return const Color(0xFFF59E0B);
    }
  }

  Widget _buildInfoField(
    BuildContext context,
    String label,
    String value,
    IconData icon, {
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.cardBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF334155), width: 1),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryBlue.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryBlue, AppTheme.primaryPurple],
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: const Color(0xFF94A3B8),
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: valueColor ?? Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _isAdminRole(String role) {
    final normalized = role.trim().toLowerCase();
    return normalized == 'admin' ||
        normalized == 'administrador' ||
        normalized == 'superadmin';
  }

  Widget _buildAdminSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '⚙️ Panel de administrador',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF6B5DFF), Color(0xFF8B5CF6)],
            ),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryPurple.withOpacity(0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AdminPanelPage()),
                );
              },
              borderRadius: BorderRadius.circular(14),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.admin_panel_settings,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ir al panel de administrador',
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Gestiona usuarios y contenido',
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(
                                  color: Colors.white70,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white.withOpacity(0.8),
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
