import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/models.dart';
import '../main.dart';
import '../theme/app_theme.dart';
import 'material_detail_page.dart';
import 'profile_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<LibrisState>().ensureCatalogLoaded();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<LibrisState>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Libris'),
        elevation: 0,
        centerTitle: false,
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
      ),
      body: Container(
        decoration: AppTheme.animeBackgroundGradient,
        child: SafeArea(
          child: _currentIndex == 0
              ? CatalogView(state: state)
              : _currentIndex == 2
              ? const ProfilePage()
              : const SizedBox.shrink(),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: AppTheme.primaryBlue.withOpacity(0.2),
              width: 1,
            ),
          ),
        ),
        child: BottomNavigationBar(
          backgroundColor: AppTheme.darkBackground,
          currentIndex: _currentIndex,
          onTap: (index) async {
            if (index == 1) {
              // Cerrar sesión
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  backgroundColor: AppTheme.cardBackground,
                  title: const Text(
                    '¿Cerrar sesión?',
                    style: TextStyle(color: Colors.white),
                  ),
                  content: const Text(
                    '¿Estás seguro de que deseas cerrar sesión?',
                    style: TextStyle(color: Color(0xFF94A3B8)),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancelar'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text(
                        'Cerrar sesión',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              );

              if (confirmed == true && mounted) {
                await context.read<LibrisState>().logout();
                if (mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (context) => const LoginForm()),
                    (route) => false,
                  );
                }
              }
            } else {
              setState(() {
                _currentIndex = index;
              });
            }
          },
          selectedItemColor: AppTheme.primaryPurple,
          unselectedItemColor: const Color(0xFF64748B),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.library_books),
              label: 'Catálogo',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.logout),
              label: 'Cerrar Sesión',
            ),
            BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
          ],
        ),
      ),
    );
  }
}

class CatalogView extends StatelessWidget {
  const CatalogView({super.key, required this.state});

  final LibrisState state;

  @override
  Widget build(BuildContext context) {
    final items = state.items;

    if (state.loading && items.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation(AppTheme.primaryPurple),
        ),
      );
    }

    return RefreshIndicator(
      color: AppTheme.primaryPurple,
      backgroundColor: AppTheme.cardBackground,
      onRefresh: state.fetchCatalog,
      child: items.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 200),
                Center(
                  child: Text(
                    'No hay materiales todavía',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Divider(
                  color: AppTheme.primaryBlue.withOpacity(0.1),
                  height: 1,
                  indent: 12,
                  endIndent: 12,
                ),
              ),
              itemBuilder: (context, index) {
                final item = items[index];
                return _buildMaterialCard(context, item);
              },
            ),
    );
  }

  Widget _buildMaterialCard(BuildContext context, ReadingItem item) {
    final api = context.read<LibrisState>().apiClient;
    final coverPath = item.portada;
    final coverUrl = coverPath == null ? null : api.buildMediaUri(coverPath);
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155), width: 1),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryBlue.withOpacity(0.08),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => MaterialDetailPage(item: item)),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 54,
                  height: 74,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primaryBlue, AppTheme.primaryPurple],
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: coverUrl == null
                      ? Center(
                          child: Text(
                            item.tipo[0].toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                        )
                      : ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(
                            coverUrl.toString(),
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Center(
                              child: Text(
                                item.tipo[0].toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.titulo,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        [
                          item.tipo,
                          if (item.autor != null) item.autor!,
                        ].join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: const Color(0xFF94A3B8),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                if (item.archivo != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryBlue.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.picture_as_pdf,
                      color: AppTheme.primaryBlue,
                      size: 20,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
