import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';

class ImportMoviesScreen extends StatefulWidget {
  const ImportMoviesScreen({super.key});

  @override
  State<ImportMoviesScreen> createState() =>
      _ImportMoviesScreenState();
}

class _ImportMoviesScreenState extends State<ImportMoviesScreen> {
  final _search = TextEditingController();

  List<Map<String, dynamic>> _movies = [];
  bool _loading = false;
  bool _searched = false;
  int? _importing;
  String? _error;

  bool get _busy => _loading || _importing != null;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _findMovies() async {
    final query = _search.text.trim();

    if (query.isEmpty || _busy) return;

    setState(() {
      _loading = true;
      _error = null;
      _searched = false;
      _movies = [];
    });

    try {
      final movies =
          await context.read<ApiService>().searchTmdb(query);

      if (!mounted) return;

      setState(() {
        _movies = movies;
        _searched = true;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = errorText(error);
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _importMovie(int tmdbId) async {
    if (_busy) return;

    setState(() {
      _importing = tmdbId;
      _error = null;
    });

    try {
      await context.read<ApiService>().importTmdb(tmdbId);

      if (!mounted) return;

      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = errorText(error);
      });
    } finally {
      if (mounted) {
        setState(() {
          _importing = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin =
        context.watch<AuthProvider>().user?.role == 'ADMIN';

    if (!isAdmin) {
      return Scaffold(
        appBar: AppBar(title: const Text('Importar filmes')),
        body: const Center(
          child: Text('Esta opção é exclusiva do administrador.'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Importar do TMDB')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _search,
                    enabled: !_busy,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => _findMovies(),
                    decoration: const InputDecoration(
                      labelText: 'Nome do filme',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  tooltip: 'Pesquisar',
                  onPressed: _busy ? null : _findMovies,
                  icon: const Icon(Icons.search),
                ),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                _error!,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                ),
              ),
            ),
          if (_loading) const LinearProgressIndicator(),
          if (_searched && _movies.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Nenhum filme encontrado.'),
            ),
          Expanded(
            child: ListView.builder(
              itemCount: _movies.length,
              itemBuilder: (context, index) {
                final movie = _movies[index];
                final tmdbId = movie['tmdbId'] as int;
                final title = movie['title'] as String;
                final year = movie['releaseYear'];
                final path = movie['posterPath'] as String?;

                return ListTile(
                  leading: Poster(
                    url: path == null
                        ? null
                        : 'https://image.tmdb.org/t/p/w500$path',
                    width: 40,
                  ),
                  title: Text(title),
                  subtitle: Text(
                    year == null ? 'Ano não informado' : '$year',
                  ),
                  trailing: IconButton(
                    tooltip: 'Adicionar ao catálogo',
                    onPressed: _busy
                        ? null
                        : () => _importMovie(tmdbId),
                    icon: _importing == tmdbId
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                            ),
                          )
                        : const Icon(Icons.add),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}