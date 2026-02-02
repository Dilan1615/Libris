import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'api/api_client.dart';
import 'api/models.dart';
import 'pages/home_page.dart';
import 'pages/register_page.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
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

// Widget para verificar autenticación antes de mostrar contenido
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _checking = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    // Usar Future.microtask para evitar setState durante build
    Future.microtask(_checkAuth);
  }

  Future<void> _checkAuth() async {
    try {
      final state = context.read<LibrisState>();
      // Intentar validar la autenticación intentando cargar el catálogo
      if (state.isLoggedIn) {
        await state.fetchCatalog();
        if (mounted) {
          setState(() {
            // Solo autenticado si NO hay error
            _isAuthenticated = state.error == null;
            _checking = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _isAuthenticated = false;
            _checking = false;
          });
        }
      }
    } catch (e) {
      // Si falla, no está autenticado
      if (mounted) {
        setState(() {
          _isAuthenticated = false;
          _checking = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return Scaffold(
        backgroundColor: AppTheme.darkBackground,
        body: Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation(AppTheme.primaryBlue),
          ),
        ),
      );
    }

    return _isAuthenticated ? const HomePage() : const LoginForm();
  }
}

class LibrisState extends ChangeNotifier {
  LibrisState(this.apiClient);

  final ApiClient apiClient;
  final List<ReadingItem> _items = [];
  bool _loading = false;
  bool _catalogLoaded = false;
  String? _error;

  bool get isLoggedIn => apiClient.isAuthenticated;
  bool get loading => _loading;
  String? get error => _error;
  List<ReadingItem> get items => List.unmodifiable(_items);

  Future<void> login(String username, String password) async {
    _setLoading(true);
    _error = null;
    try {
      final ok = await apiClient.login(username, password);
      if (!ok) {
        _error = 'No se pudo iniciar sesión';
      } else {
        await fetchCatalog();
      }
    } catch (e) {
      _error = 'Error: $e';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchCatalog() async {
    _setLoading(true);
    _error = null;
    try {
      _items
        ..clear()
        ..addAll(await apiClient.fetchCatalog());
      _catalogLoaded = true;
    } catch (e) {
      _error = 'No se pudo cargar el catálogo';
      _catalogLoaded = false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _error = null;
    try {
      await apiClient.logout();
      _items.clear();
      _catalogLoaded = false;
      notifyListeners();
    } catch (e) {
      _error = 'Error al cerrar sesión: $e';
      notifyListeners();
    }
  }

  Future<void> ensureCatalogLoaded() async {
    if (_catalogLoaded || _loading) return;
    await fetchCatalog();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}

class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _userController = TextEditingController();
  final _passController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _userController.dispose();
    _passController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<LibrisState>();

    return Scaffold(
      body: Container(
        decoration: AppTheme.animeBackgroundGradient,
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Logo animado
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppTheme.primaryBlue,
                              AppTheme.primaryPurple,
                            ],
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [AppTheme.glowShadow],
                        ),
                        child: const Icon(
                          Icons.library_books,
                          size: 56,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 32),
                      // Título
                      Column(
                        children: [
                          Text(
                            'Bienvenido a',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: const Color(0xFF94A3B8),
                                  letterSpacing: 1,
                                ),
                          ),
                          const SizedBox(height: 8),
                          ShaderMask(
                            shaderCallback: (bounds) => const LinearGradient(
                              colors: [
                                AppTheme.primaryBlue,
                                AppTheme.primaryPurple,
                                AppTheme.accentCyan,
                              ],
                            ).createShader(bounds),
                            child: Text(
                              'Libris',
                              style: Theme.of(context).textTheme.displaySmall
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 2,
                                  ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 48),
                      // Usuario
                      TextFormField(
                        controller: _userController,
                        decoration: InputDecoration(
                          labelText: 'Usuario',
                          prefixIcon: const Icon(Icons.person_outline),
                          prefixIconColor: MaterialStateColor.resolveWith(
                            (states) => states.contains(MaterialState.focused)
                                ? AppTheme.primaryBlue
                                : const Color(0xFF64748B),
                          ),
                          hintText: 'Ingresa tu usuario',
                          hintStyle: const TextStyle(color: Color(0xFF475569)),
                        ),
                        validator: (value) => value == null || value.isEmpty
                            ? 'Campo requerido'
                            : null,
                      ),
                      const SizedBox(height: 16),
                      // Contraseña
                      TextFormField(
                        controller: _passController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'Contraseña',
                          prefixIcon: const Icon(Icons.lock_outline),
                          prefixIconColor: MaterialStateColor.resolveWith(
                            (states) => states.contains(MaterialState.focused)
                                ? AppTheme.primaryBlue
                                : const Color(0xFF64748B),
                          ),
                          hintText: 'Ingresa tu contraseña',
                          hintStyle: const TextStyle(color: Color(0xFF475569)),
                        ),
                        validator: (value) => value == null || value.isEmpty
                            ? 'Campo requerido'
                            : null,
                      ),
                      const SizedBox(height: 32),
                      // Botón de login
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: Container(
                          decoration: state.loading
                              ? BoxDecoration(
                                  color: AppTheme.darkBlue,
                                  borderRadius: BorderRadius.circular(12),
                                )
                              : AppTheme.gradientButton,
                          child: ElevatedButton(
                            onPressed: state.loading
                                ? null
                                : () async {
                                    if (_formKey.currentState?.validate() ??
                                        false) {
                                      await state.login(
                                        _userController.text.trim(),
                                        _passController.text,
                                      );
                                      // Si el login fue exitoso, navegar a HomePage
                                      if (state.isLoggedIn &&
                                          state.error == null) {
                                        if (context.mounted) {
                                          Navigator.of(context).pushReplacement(
                                            MaterialPageRoute(
                                              builder: (context) =>
                                                  const HomePage(),
                                            ),
                                          );
                                        }
                                      }
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              elevation: 0,
                            ),
                            child: state.loading
                                ? const SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                : Text(
                                    'Iniciar Sesión',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 0.5,
                                        ),
                                  ),
                          ),
                        ),
                      ),
                      // Mensaje de error
                      if (state.error != null) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFFEF4444).withOpacity(0.5),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.error_outline,
                                color: Color(0xFFEF4444),
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  state.error!,
                                  style: const TextStyle(
                                    color: Color(0xFFEF4444),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      // Separador de registro
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: Divider(
                              color: Colors.white.withOpacity(0.1),
                              height: 1,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              'O',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: const Color(0xFF64748B)),
                            ),
                          ),
                          Expanded(
                            child: Divider(
                              color: Colors.white.withOpacity(0.1),
                              height: 1,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      // Botón de registro
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: OutlinedButton(
                          onPressed: state.loading
                              ? null
                              : () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          const RegisterPage(),
                                    ),
                                  );
                                },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: AppTheme.primaryBlue.withOpacity(0.5),
                              width: 2,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            'Crear nueva cuenta',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  color: AppTheme.primaryBlue,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.5,
                                ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
