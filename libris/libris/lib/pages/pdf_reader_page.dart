import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:libris/api/api_client.dart';
import 'package:libris/api/models.dart';
import 'package:libris/theme/app_theme.dart';
import 'package:pdfx/pdfx.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;

class PdfReaderPage extends StatefulWidget {
  final ReadingItem material;

  const PdfReaderPage({super.key, required this.material});

  @override
  State<PdfReaderPage> createState() => _PdfReaderPageState();
}

class _PdfReaderPageState extends State<PdfReaderPage> {
  late PdfController pdfController;
  int currentPage = 1;
  int totalPages = 0;
  bool isLoading = true;
  bool isSaving = false;
  String? errorMessage;
  TextEditingController pageInputController = TextEditingController();
  ReadingRecord? readingRecord;

  @override
  void initState() {
    super.initState();
    _initializePdf();
  }

  Future<void> _initializePdf() async {
    try {
      // Cargar registro de lectura existente
      final records = await ApiClient.instance.fetchReadingRecords();
      readingRecord = records.firstWhere(
        (r) =>
            r.materialId == int.parse(widget.material.id.toString()) &&
            (r.tipo == null ||
                r.tipo!.toLowerCase() == widget.material.tipo.toLowerCase()),
        orElse: () => ReadingRecord(
          id: 0,
          materialId: int.parse(widget.material.id.toString()),
          tipo: widget.material.tipo,
          paginaActual: 1,
          estado: 'PENDIENTE',
          fechaInicio: DateTime.now(),
        ),
      );

      currentPage = readingRecord!.paginaActual;
      pageInputController.text = currentPage.toString();

      // Descargar PDF a archivo temporal
      setState(() {
        isLoading = true;
        errorMessage = 'Descargando PDF...';
      });

      final pdfUrl = widget.material.pdfUrl!;
      final tempDir = await getTemporaryDirectory();
      final fileName = 'temp_${widget.material.id}.pdf';
      final file = File('${tempDir.path}/$fileName');

      // Descargar el archivo
      final response = await http.get(Uri.parse(pdfUrl));
      if (response.statusCode == 200) {
        await file.writeAsBytes(response.bodyBytes);
      } else {
        throw Exception('Error al descargar PDF: ${response.statusCode}');
      }

      setState(() {
        errorMessage = 'Abriendo PDF...';
      });

      // Inicializar PDF desde archivo local
      final pdfDocument = await PdfDocument.openFile(file.path);
      totalPages = pdfDocument.pagesCount;

      // Crear el controlador con el archivo local
      pdfController = PdfController(
        document: PdfDocument.openFile(file.path),
        initialPage: currentPage,
      );

      setState(() {
        isLoading = false;
        errorMessage = null;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = 'Error al cargar PDF: ${e.toString()}';
      });
    }
  }

  Future<void> _saveProgress() async {
    setState(() => isSaving = true);
    try {
      final updatedRecord = ReadingRecord(
        id: readingRecord?.id ?? 0,
        materialId: readingRecord!.materialId,
        tipo: readingRecord?.tipo ?? widget.material.tipo,
        paginaActual: currentPage,
        estado: readingRecord!.estado,
        fechaInicio: readingRecord!.fechaInicio,
        fechaFinalizacion: readingRecord!.estado == 'LEIDO'
            ? DateTime.now()
            : null,
      );

      if (readingRecord!.id == 0) {
        await ApiClient.instance.createReadingRecord(
          updatedRecord,
          tipo: widget.material.tipo,
        );
      } else {
        await ApiClient.instance.updateReadingRecord(
          readingRecord!.id,
          updatedRecord,
          tipo: widget.material.tipo,
        );
      }

      readingRecord = updatedRecord;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Progreso guardado ✓'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      final message = _extractErrorMessage(e);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al guardar: $message'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

  Future<void> _markAsFinished() async {
    setState(() => isSaving = true);
    try {
      final updatedRecord = ReadingRecord(
        id: readingRecord!.id,
        materialId: readingRecord!.materialId,
        tipo: readingRecord?.tipo ?? widget.material.tipo,
        paginaActual: totalPages,
        estado: 'LEIDO',
        fechaInicio: readingRecord!.fechaInicio,
        fechaFinalizacion: DateTime.now(),
      );

      await ApiClient.instance.updateReadingRecord(
        readingRecord!.id,
        updatedRecord,
        tipo: widget.material.tipo,
      );

      readingRecord = updatedRecord;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Libro marcado como leído! 📖'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      final message = _extractErrorMessage(e);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $message'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

  void _goToPage(int page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      try {
        pdfController.jumpToPage(page);
      } catch (e) {
        print('Error navegando a página: $e');
      }
      pageInputController.text = page.toString();
      setState(() {});
    }
  }

  @override
  void dispose() {
    pdfController.dispose();
    pageInputController.dispose();
    _cleanupTempFile();
    super.dispose();
  }

  String _extractErrorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data != null) return data.toString();
      return error.message ?? error.toString();
    }
    return error.toString();
  }

  Future<void> _cleanupTempFile() async {
    try {
      final tempDir = await getTemporaryDirectory();
      final fileName = 'temp_${widget.material.id}.pdf';
      final file = File('${tempDir.path}/$fileName');
      if (await file.exists()) {
        await file.delete();
      }
    } catch (e) {
      print('Error al limpiar archivo temporal: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        await _saveProgress();
        return true;
      },
      child: Scaffold(
        backgroundColor: AppTheme.darkBackground,
        appBar: AppBar(
          backgroundColor: AppTheme.darkBackground,
          title: Text(widget.material.titulo),
          centerTitle: true,
          elevation: 0,
          foregroundColor: Colors.white,
        ),
        body: isLoading
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation(AppTheme.primaryBlue),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Cargando PDF...',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              )
            : errorMessage != null
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: Colors.red,
                      size: 48,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              )
            : Column(
                children: [
                  Expanded(
                    child: PdfView(
                      controller: pdfController,
                      onDocumentLoaded: (document) {
                        setState(() => totalPages = document.pagesCount);
                      },
                      onPageChanged: (page) {
                        setState(() {
                          currentPage = page;
                          pageInputController.text = page.toString();
                        });
                      },
                    ),
                  ),
                  // Controles de lectura
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.cardBackground,
                      border: Border(
                        top: BorderSide(
                          color: AppTheme.primaryBlue.withOpacity(0.3),
                        ),
                      ),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      spacing: 8,
                      children: [
                        // Barra de progreso
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: totalPages > 0
                                ? currentPage / totalPages
                                : 0,
                            minHeight: 8,
                            backgroundColor: Colors.grey.withOpacity(0.2),
                            valueColor: AlwaysStoppedAnimation(
                              AppTheme.primaryBlue,
                            ),
                          ),
                        ),
                        // Controles de página
                        Row(
                          spacing: 8,
                          children: [
                            IconButton(
                              onPressed: currentPage > 1
                                  ? () => _goToPage(currentPage - 1)
                                  : null,
                              icon: const Icon(Icons.chevron_left),
                              color: currentPage > 1
                                  ? Colors.white
                                  : Colors.grey,
                              splashRadius: 20,
                            ).expand(flex: 1),
                            Expanded(
                              flex: 3,
                              child: TextField(
                                controller: pageInputController,
                                keyboardType: TextInputType.number,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                                decoration: InputDecoration(
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    vertical: 8,
                                    horizontal: 8,
                                  ),
                                  hintText: 'Página',
                                  hintStyle: TextStyle(
                                    color: Colors.grey.withOpacity(0.5),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: AppTheme.primaryBlue.withOpacity(
                                        0.3,
                                      ),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: AppTheme.primaryBlue,
                                    ),
                                  ),
                                ),
                                onSubmitted: (value) {
                                  final page = int.tryParse(value);
                                  if (page != null) {
                                    _goToPage(page);
                                  }
                                },
                              ),
                            ),
                            Text(
                              '/ $totalPages',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                            ).expand(flex: 1),
                            IconButton(
                              onPressed: currentPage < totalPages
                                  ? () => _goToPage(currentPage + 1)
                                  : null,
                              icon: const Icon(Icons.chevron_right),
                              color: currentPage < totalPages
                                  ? Colors.white
                                  : Colors.grey,
                              splashRadius: 20,
                            ).expand(flex: 1),
                          ],
                        ),
                        // Botones de acción
                        Row(
                          spacing: 8,
                          children: [
                            ElevatedButton.icon(
                              onPressed: isSaving ? null : _saveProgress,
                              icon: const Icon(Icons.save),
                              label: isSaving
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text('Guardar'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryBlue,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                              ),
                            ).expand(),
                            if (currentPage >= totalPages)
                              ElevatedButton.icon(
                                onPressed: isSaving ? null : _markAsFinished,
                                icon: const Icon(Icons.check_circle),
                                label: const Text('Terminado'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                ),
                              ).expand(),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

extension on Widget {
  Widget expand({int flex = 1}) {
    return Expanded(flex: flex, child: this);
  }
}
