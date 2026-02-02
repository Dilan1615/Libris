# Libris - AI Coding Assistant Instructions

## Project Overview
**Libris** is a Flutter mobile app for managing and sharing digital libraries (books, manga, novels, educational materials). It connects to a Django REST API backend, implementing JWT authentication, catalog browsing, reading progress tracking, ratings, and comments.

## Architecture

### State Management Pattern
- **Provider-based global state**: Single `LibrisState` (ChangeNotifier) in [lib/main.dart](lib/main.dart#L102)
- Wraps entire app with `ChangeNotifierProvider` at app root
- State class holds `ApiClient` instance and manages loading/error states
- Use `context.watch<LibrisState>()` in build methods, `context.read<LibrisState>()` for event handlers

### API Client Design
- **Singleton pattern**: `ApiClient.instance` initialized in `main()` via `ApiClient.initialize()`
- **Dio-based HTTP client** with automatic token refresh interceptor ([lib/api/api_client.dart](lib/api/api_client.dart#L54-L89))
- **Token management**: JWT access/refresh tokens stored in `flutter_secure_storage`
- **Platform-specific base URLs**: Web uses `localhost:8000`, Android emulator uses `10.0.2.2`, devices use LAN IP (currently `192.168.110.53:8000`)
- **Error handling**: All API methods throw `Exception(_genericErrorMessage)` on failure, interceptor handles 401 with automatic token refresh

### Key Backend Integration Patterns
1. **Material type normalization**: Backend expects lowercase material types (`libro`, `manga`, `novela`, `material`)
2. **Payload construction**: Use `_buildMaterialPayload(tipo, materialId)` helper - creates correct field name (`libro_id`, `manga_id`, etc.) based on type
3. **Paginated responses**: Handle both direct arrays and `{results: [...]}` objects
4. **Retry logic**: Create/update operations retry with normalized tipo on 400/500 errors

### Data Models ([lib/api/models.dart](lib/api/models.dart))
- **ReadingItem**: Universal material model with smart field detection (tries multiple field names for PDF/cover URLs)
- **ReadingRecord**: User's reading progress (estado: "Pendiente"/"Leyendo"/"Finalizado")
- **Rating**: 1-5 star ratings linked to materials
- **UserComment**: Comments on materials
- **UserProfile**: User info with `fullName` getter (falls back to username)

## Development Workflow

### Running the App
```bash
flutter run                          # Default device
flutter run -d windows               # Windows desktop
flutter run -d chrome                # Web browser
flutter run -d <device-id>           # Specific device (see flutter devices)
```

### Backend Connection
- **Update base URL** in [lib/api/api_client.dart](lib/api/api_client.dart#L7-L16) `_getDefaultBaseUrl()` for your network
- For physical devices: Change to your LAN IP (e.g., `http://192.168.1.100:8000`)
- Backend must be running at configured URL with all endpoints documented in `Documentacion/API_DOCUMENTATION.md`

### Build Commands
```bash
flutter pub get                      # Install dependencies
flutter clean                        # Clean build artifacts
flutter build apk --release          # Android release APK
flutter build appbundle              # Android App Bundle (Google Play)
```

## Code Conventions

### Theming
- **Dark theme only**: [lib/theme/app_theme.dart](lib/theme/app_theme.dart) defines all colors/styles
- **Primary colors**: `primaryBlue` (#6B5DFF), `primaryPurple` (#8B5CF6), `darkBackground` (#0F172A)
- **Typography**: Google Fonts Poppins across all text
- **Gradients**: Use `AppTheme.animeBackgroundGradient` for consistent background styling

### Navigation
- **No named routes**: Direct `Navigator.push` with `MaterialPageRoute`
- **Page structure**: All pages in `lib/pages/`, typically StatefulWidget with private State class
- Example: `Navigator.push(context, MaterialPageRoute(builder: (context) => MaterialDetailPage(item: item)))`

### Error Handling
- API errors display generic message to users: "Ocurrió un error. Por favor, intenta de nuevo."
- Extensive debug logging: `print()` statements with emoji prefixes (📡 network, ❌ errors, ✅ success)
- State error field: Set `LibrisState._error` string, UI checks and displays

### Form Validation
- Use `GlobalKey<FormState>` for forms
- TextFormField validators return `null` for valid, error string for invalid
- Example: `validator: (val) => val == null || val.isEmpty ? 'Campo requerido' : null`

## Critical Patterns

### Authentication Flow
1. User logs in → `ApiClient.login()` stores tokens in secure storage
2. `AuthWrapper` widget checks auth on startup, validates by attempting catalog fetch
3. All authenticated requests include `Authorization: Bearer <token>` header (auto-injected by interceptor)
4. On 401 response → interceptor calls `_refresh()` → retries original request with new token

### Material Type Handling
When creating/updating records or ratings:
```dart
final tipoNormalizado = tipo.toLowerCase();  // "Libro" → "libro"
final payload = _buildMaterialPayload(tipoNormalizado, materialId);
// Creates: {"libro_id": 123} for tipo="libro", {"manga_id": 123} for tipo="manga", etc.
```

### Catalog Loading Pattern
- Fetch all material types in parallel: `fetchCatalog()` combines results from `/api/libros/`, `/api/mangas/`, `/api/novelas/`, `/api/material/`
- Each item tagged with `tipo` field during parsing
- Use `ensureCatalogLoaded()` to avoid redundant fetches

## File Structure
```
lib/
├── main.dart               # App entry, AuthWrapper, LibrisState, LoginForm
├── api/
│   ├── api_client.dart     # Singleton HTTP client, all API methods
│   └── models.dart         # Data models (ReadingItem, UserProfile, etc.)
├── pages/                  # Full-page screens
│   ├── home_page.dart      # Main catalog view with bottom nav
│   ├── material_detail_page.dart
│   ├── pdf_reader_page.dart
│   ├── profile_page.dart
│   ├── admin_panel_page.dart
│   └── register_page.dart
└── theme/
    └── app_theme.dart      # ThemeData, colors, text styles
```

## Dependencies
- **dio**: HTTP client with interceptors for API calls
- **provider**: State management
- **flutter_secure_storage**: Encrypted token storage (note: not available in web builds)
- **pdfx**: PDF rendering for reading materials
- **google_fonts**: Poppins font family
- **file_picker**: Upload files in admin panel
- **url_launcher**: Open external URLs

## Testing
- No current test suite implemented
- `test/widget_test.dart` is template boilerplate

## Documentation
Extensive Spanish documentation in `Documentacion/`:
- **API_DOCUMENTATION.md**: Complete REST API reference (all 18 endpoints)
- **IMPLEMENTATION_GUIDE.md**: Flutter implementation patterns
- **DATA_MODELS.md**: Model structures and JSON examples
- **STRUCTURE.md**: Visual ASCII diagrams of API structure
- **HTTP_STATUS_CODES.md**: Error code handling guide
