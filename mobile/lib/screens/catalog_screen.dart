import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';
import 'movie_detail_screen.dart';
import '../providers/auth_provider.dart';
import 'import_movies_screen.dart';
import 'credits_screen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key, this.initialGenre, this.title = 'Filmes'});

  final Genre? initialGenre;
  final String title;

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final _search = TextEditingController();
  final _scroll = ScrollController();
  final List<Movie> _movies = [];
  Timer? _debounce;
  List<Genre> _genres = [];
  List<int> _years = [];
  String _genre = '';
  String _year = '';
  String _rating = '';
  int _page = 1;
  int _total = 0;
  int _request = 0;
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _genre = widget.initialGenre?.id ?? '';
    _scroll.addListener(_onScroll);
    _loadFilters();
    _fetch(reset: true);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    _scroll.dispose();
    super.dispose();
  }

  String get _genreLabel {
    if (_genre.isEmpty) return 'Gênero';
    for (final genre in _genres) {
      if (genre.id == _genre) return genre.name;
    }
    return widget.initialGenre?.name ?? 'Gênero';
  }

  String get _ratingLabel {
    if (_rating.isEmpty) return 'Nota';
    if (_rating == 'unrated') return 'Sem avaliações';
    return '$_rating estrelas';
  }

  Future<void> _loadFilters() async {
    final api = context.read<ApiService>();
    try {
      final genres = await api.genres();
      final years = await api.years();
      if (!mounted) return;
      setState(() {
        _genres = genres;
        _years = years;
      });
    } catch (_) {}
  }

  Future<void> _fetch({bool reset = false}) async {
    final api = context.read<ApiService>();
    final id = ++_request;
    final nextPage = reset ? 1 : _page + 1;
    setState(() {
      if (reset) {
        _loading = true;
        _error = null;
      } else {
        _loadingMore = true;
      }
    });
    try {
      final result = await api.movies(
        q: _search.text.trim(),
        genre: _genre,
        year: _year,
        rating: _rating,
        page: nextPage,
      );
      if (!mounted || id != _request) return;
      setState(() {
        if (reset) _movies.clear();
        _movies.addAll(result.data);
        _page = result.page;
        _total = result.total;
      });
    } catch (error) {
      if (!mounted || id != _request) return;
      if (_movies.isEmpty) {
        setState(() {
          _error = errorText(error);
        });
      } else {
        showSnack(context, errorText(error));
      }
    } finally {
      if (mounted && id == _request) {
        setState(() {
          _loading = false;
          _loadingMore = false;
        });
      }
    }
  }

  void _onScroll() {
    if (!_scroll.hasClients) return;
    final position = _scroll.position;
    if (position.pixels >= position.maxScrollExtent - 300 &&
        !_loading &&
        !_loadingMore &&
        _movies.length < _total) {
      _fetch();
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 450), _applyFilters);
  }

  void _applyFilters() {
    if (_scroll.hasClients) _scroll.jumpTo(0);
    setState(() {
      _movies.clear();
    });
    _fetch(reset: true);
  }

  void _clearFilters() {
    setState(() {
      _genre = '';
      _year = '';
      _rating = '';
    });
    _applyFilters();
  }

  Future<void> _pickGenre() async {
    final value = await pickOption(
      context,
      title: 'Gênero',
      current: _genre,
      options: [
        const MapEntry('', 'Todos os gêneros'),
        for (final genre in _genres) MapEntry(genre.id, genre.name),
      ],
    );
    if (value == null || !mounted) return;
    setState(() {
      _genre = value;
    });
    _applyFilters();
  }

  Future<void> _pickYear() async {
    final value = await pickOption(
      context,
      title: 'Ano',
      current: _year,
      options: [
        const MapEntry('', 'Todos os anos'),
        for (final year in _years) MapEntry('$year', '$year'),
      ],
    );
    if (value == null || !mounted) return;
    setState(() {
      _year = value;
    });
    _applyFilters();
  }

  Future<void> _pickRating() async {
    final value = await pickOption(
      context,
      title: 'Nota',
      current: _rating,
      options: [
        const MapEntry('', 'Todas as notas'),
        for (final stars in [5, 4, 3, 2, 1])
          MapEntry('$stars', '$stars ${stars == 1 ? 'estrela' : 'estrelas'}'),
        const MapEntry('unrated', 'Sem avaliações'),
      ],
    );
    if (value == null || !mounted) return;
    setState(() {
      _rating = value;
    });
    _applyFilters();
  }

  Widget _chip(
    String label,
    bool active,
    VoidCallback onTap, {
    IconData? icon,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: active,
        avatar: icon == null ? null : Icon(icon, size: 16),
        onSelected: (_) => onTap(),
      ),
    );
  }

  Widget _body() {
    if (_loading && _movies.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _movies.isEmpty) {
      return ErrorView(message: _error!, onRetry: () => _fetch(reset: true));
    }
    if (_movies.isEmpty) {
      return const EmptyView(message: 'Nenhum filme encontrado com esses filtros.');
    }
    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () => _fetch(reset: true),
      child: GridView.builder(
        controller: _scroll,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 190,
          mainAxisSpacing: 16,
          crossAxisSpacing: 12,
          childAspectRatio: 0.56,
        ),
        itemCount: _movies.length,
        itemBuilder: (context, index) {
          final movie = _movies[index];
          return MovieCard(
            movie: movie,
            onTap: () => openMovie(context, movie.id),
          );
        },
      ),
    );
  }

Future<void> _openImport() async {
  final imported = await Navigator.of(context).push<bool>(
    MaterialPageRoute<bool>(
      builder: (_) => const ImportMoviesScreen(),
    ),
  );

  if (!mounted || imported != true) return;

  showSnack(context, 'Filme adicionado ao catálogo.');

  await _loadFilters();

  if (!mounted) return;

  _search.clear();
  _debounce?.cancel();
  _clearFilters();
}

  @override
  Widget build(BuildContext context) {
    final hasFilters =
        _genre.isNotEmpty || _year.isNotEmpty || _rating.isNotEmpty;
    return Scaffold(
      appBar: AppBar(
  title: Text(widget.title),
  actions: [
    if (context.watch<AuthProvider>().user?.role == 'ADMIN')
      IconButton(
        tooltip: 'Importar do TMDB',
        icon: const Icon(Icons.add),
        onPressed: _openImport,
      ),
    IconButton(
      tooltip: 'Créditos',
      icon: const Icon(Icons.info_outline),
      onPressed: () {
        Navigator.of(context).push<void>(
          MaterialPageRoute<void>(
            builder: (_) => const CreditsScreen(),
          ),
        );
      },
    ),
  ],
),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: TextField(
              controller: _search,
              onChanged: _onSearchChanged,
              textInputAction: TextInputAction.search,
              decoration: fieldDecoration('Buscar por título ou direção')
                  .copyWith(prefixIcon: const Icon(Icons.search), isDense: true),
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _chip(_genreLabel, _genre.isNotEmpty, _pickGenre),
                _chip(_year.isEmpty ? 'Ano' : _year, _year.isNotEmpty, _pickYear),
                _chip(_ratingLabel, _rating.isNotEmpty, _pickRating),
                if (hasFilters)
                  _chip('Limpar', false, _clearFilters, icon: Icons.close),
              ],
            ),
          ),
          if (!_loading && _movies.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('$_total filmes', style: mutedStyle),
              ),
            ),
          Expanded(child: _body()),
          if (_loadingMore) const LinearProgressIndicator(minHeight: 3),
        ],
      ),
    );
  }
}