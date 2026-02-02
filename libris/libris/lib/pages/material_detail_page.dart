import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/models.dart';
import '../main.dart';
import '../theme/app_theme.dart';
import 'pdf_reader_page.dart';

class MaterialDetailPage extends StatefulWidget {
  const MaterialDetailPage({super.key, required this.item});

  final ReadingItem item;

  @override
  State<MaterialDetailPage> createState() => _MaterialDetailPageState();
}

class _MaterialDetailPageState extends State<MaterialDetailPage> {
  ReadingRecord? _record;
  Rating? _rating;
  List<UserComment> _comments = [];
  bool _loading = true;
  bool _saving = false;

  int _paginaActual = 0;
  String _estado = 'PENDIENTE';
  int _currentRating = 0;

  final _commentController = TextEditingController();
  final _pageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final api = context.read<LibrisState>().apiClient;
      final results = await Future.wait([
        api.fetchReadingRecords(),
        api.fetchRatings(),
        api.fetchCommentsFor(
          tipo: widget.item.tipo,
          materialId: widget.item.id,
        ),
      ]);

      final records = results[0] as List<ReadingRecord>;
      final ratings = results[1] as List<Rating>;
      final comments = results[2] as List<UserComment>;

      final record = records.firstWhere(
        (r) =>
            r.materialId == int.parse(widget.item.id.toString()) &&
            (r.tipo == null ||
                r.tipo!.toLowerCase() == widget.item.tipo.toLowerCase()),
        orElse: () => ReadingRecord(
          id: 0,
          materialId: int.parse(widget.item.id.toString()),
          tipo: widget.item.tipo,
          paginaActual: 0,
          estado: 'PENDIENTE',
          fechaInicio: DateTime.now(),
        ),
      );

      final rating = ratings.firstWhere(
        (r) => r.id == 0, // Ajustar este criterio según necesidad
        orElse: () => Rating(id: 0, rating: 0),
      );

      setState(() {
        _record = record.id == 0 ? null : record;
        _rating = rating.id == 0 ? null : rating;
        _comments = comments;
        _paginaActual = _record?.paginaActual ?? 0;
        _estado = _record?.estado ?? 'PENDIENTE';
        _currentRating = _rating?.rating ?? 0;
        _pageController.text = _paginaActual.toString();
      });
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveReadingRecord() async {
    setState(() => _saving = true);
    try {
      final api = context.read<LibrisState>().apiClient;
      final newRecord = ReadingRecord(
        id: _record?.id ?? 0,
        materialId: int.parse(widget.item.id.toString()),
        tipo: widget.item.tipo,
        paginaActual: _paginaActual,
        estado: _estado == 'LEYENDO' ? 'PENDIENTE' : _estado,
        fechaInicio: _record?.fechaInicio ?? DateTime.now(),
      );

      if (_record == null || _record!.id == 0) {
        final created = await api.createReadingRecord(
          newRecord,
          tipo: widget.item.tipo,
        );
        setState(() => _record = created);
      } else {
        final updated = await api.updateReadingRecord(
          _record!.id,
          newRecord,
          tipo: widget.item.tipo,
        );
        setState(() => _record = updated);
      }
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Progreso guardado')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _setRating(int value) async {
    setState(() => _currentRating = value);
    try {
      final api = context.read<LibrisState>().apiClient;
      if (_rating == null) {
        final created = await api.createRating(
          tipo: widget.item.tipo,
          materialId: widget.item.id,
          rating: value,
        );
        setState(() => _rating = created);
      } else {
        final updated = await api.updateRating(
          ratingId: _rating!.id,
          rating: value,
        );
        setState(() => _rating = updated);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _submitComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;
    setState(() => _saving = true);
    try {
      final api = context.read<LibrisState>().apiClient;
      final created = await api.createComment(
        tipo: widget.item.tipo,
        materialId: widget.item.id,
        descripcion: text,
      );
      setState(() {
        _comments = [created, ..._comments];
        _commentController.clear();
      });
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _openPdf() async {
    if (widget.item.pdfUrl == null || widget.item.pdfUrl!.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('PDF no disponible')));
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PdfReaderPage(material: widget.item),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<LibrisState>().apiClient;
    final coverPath = widget.item.portada;
    final coverUrl = coverPath == null ? null : api.buildMediaUri(coverPath);
    final canRead =
        widget.item.archivo != null && widget.item.archivo!.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.item.titulo),
        backgroundColor: AppTheme.darkBackground,
        foregroundColor: Colors.white,
      ),
      body: Container(
        decoration: AppTheme.animeBackgroundGradient,
        child: SafeArea(
          child: _loading
              ? const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation(AppTheme.primaryPurple),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 90,
                          height: 130,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: const LinearGradient(
                              colors: [
                                AppTheme.primaryBlue,
                                AppTheme.primaryPurple,
                              ],
                            ),
                          ),
                          child: coverUrl == null
                              ? const Icon(
                                  Icons.image,
                                  color: Colors.white,
                                  size: 36,
                                )
                              : ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.network(
                                    coverUrl.toString(),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.item.titulo,
                                style: Theme.of(context).textTheme.titleLarge
                                    ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                widget.item.autor ?? 'Autor desconocido',
                                style: Theme.of(context).textTheme.labelLarge
                                    ?.copyWith(color: const Color(0xFF94A3B8)),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                widget.item.tipo,
                                style: Theme.of(context).textTheme.labelMedium
                                    ?.copyWith(
                                      color: AppTheme.primaryPurple,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: canRead ? _openPdf : null,
                                  icon: const Icon(Icons.picture_as_pdf),
                                  label: const Text('Leer PDF'),
                                ),
                              ),
                              if (!canRead) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'No hay PDF disponible.',
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: const Color(0xFF94A3B8),
                                      ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                    if ((widget.item.descripcion ?? '').isNotEmpty) ...[
                      const SizedBox(height: 20),
                      Text(
                        '📖 Descripción',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.item.descripcion!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFFCBD5F5),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    Text(
                      '📚 Progreso de lectura',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _pageController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Página actual',
                      ),
                      onChanged: (value) {
                        final parsed = int.tryParse(value) ?? 0;
                        _paginaActual = parsed;
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _estado,
                      decoration: const InputDecoration(labelText: 'Estado'),
                      items: const [
                        DropdownMenuItem(value: 'LEIDO', child: Text('Leído')),
                        DropdownMenuItem(
                          value: 'PENDIENTE',
                          child: Text('Pendiente'),
                        ),
                        DropdownMenuItem(
                          value: 'FAVORITO',
                          child: Text('Favorito'),
                        ),
                        DropdownMenuItem(
                          value: 'ABANDONADO',
                          child: Text('Abandonado'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value == null) return;
                        setState(() => _estado = value);
                      },
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _saveReadingRecord,
                        child: Text(
                          _saving ? 'Guardando...' : 'Guardar progreso',
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      '⭐ Calificación',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: List.generate(5, (index) {
                        final value = index + 1;
                        return IconButton(
                          onPressed: () => _setRating(value),
                          icon: Icon(
                            value <= _currentRating
                                ? Icons.star
                                : Icons.star_border,
                            color: AppTheme.primaryPurple,
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      '💬 Comentarios',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _commentController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Escribe un comentario',
                      ),
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _submitComment,
                        child: Text(_saving ? 'Publicando...' : 'Publicar'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_comments.isEmpty)
                      const Text(
                        'No hay comentarios aún.',
                        style: TextStyle(color: Color(0xFF94A3B8)),
                      )
                    else
                      ..._comments.map(
                        (comment) => Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.cardBackground,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: const Color(0xFF334155),
                              width: 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                comment.nombreUsuario,
                                style: Theme.of(context).textTheme.labelMedium
                                    ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                comment.descripcion,
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(color: const Color(0xFFCBD5F5)),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
        ),
      ),
    );
  }
}
