import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/format.dart';
import '../core/theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';
import 'login_screen.dart';
import 'profile_screen.dart';
import 'review_screen.dart';

Future<void> openMovie(BuildContext context, String movieId) {
  return Navigator.of(context).push<void>(
    MaterialPageRoute<void>(
      builder: (_) => MovieDetailScreen(movieId: movieId),
    ),
  );
}

class _DetailData {
  const _DetailData(this.movie, this.activity);

  final Movie movie;
  final Activity? activity;
}

class MovieDetailScreen extends StatefulWidget {
  const MovieDetailScreen({super.key, required this.movieId});

  final String movieId;

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  Future<_DetailData> _load() async {
    final api = context.read<ApiService>();
    final auth = context.read<AuthProvider>();
    final movie = await api.movie(widget.movieId);
    Activity? activity;
    if (auth.isLoggedIn) {
      try {
        activity = await api.activity(widget.movieId);
      } on ApiException catch (_) {
        activity = null;
      }
    }
    return _DetailData(movie, activity);
  }

  Future<void> _markWatched(Future<void> Function() reload) async {
    if (!await requireLogin(context)) return;
    if (!mounted) return;
    final api = context.read<ApiService>();
    final auth = context.read<AuthProvider>();
    try {
      await api.markWatched(widget.movieId);
      await auth.refresh();
      await reload();
    } catch (error) {
      if (mounted) showSnack(context, errorText(error));
    }
  }

  Future<void> _toggleWatchlist(Future<void> Function() reload) async {
    if (!await requireLogin(context)) return;
    if (!mounted) return;
    final api = context.read<ApiService>();
    final auth = context.read<AuthProvider>();
    try {
      final current = await api.activity(widget.movieId);
      if (current.inWatchlist) {
        await api.removeFromWatchlist(widget.movieId);
      } else {
        await api.addToWatchlist(widget.movieId);
      }
      await auth.refresh();
      await reload();
    } catch (error) {
      if (mounted) showSnack(context, errorText(error));
    }
  }

  Future<void> _review(Movie movie, Future<void> Function() reload) async {
    if (!await requireLogin(context)) return;
    if (!mounted) return;
    final api = context.read<ApiService>();
    final auth = context.read<AuthProvider>();
    try {
      final activity = await api.activity(widget.movieId);
      if (!mounted) return;
      final saved = await Navigator.of(context).push<bool>(
        MaterialPageRoute<bool>(
          builder: (_) => ReviewScreen(movie: movie, existing: activity.review),
        ),
      );
      if (saved == true) {
        await auth.refresh();
        await reload();
      }
    } catch (error) {
      if (mounted) showSnack(context, errorText(error));
    }
  }

  Widget _content(
    BuildContext context,
    _DetailData data,
    Future<void> Function() reload,
  ) {
    final movie = data.movie;
    final activity = data.activity;
    final inList = activity?.inWatchlist ?? false;
    final watched = activity?.watched ?? false;
    final hasReview = activity?.review != null;
    final synopsis = movie.synopsis?.trim();
    final director = movie.director?.trim();

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: reload,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Poster(url: movie.posterUrl, width: 130),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      movie.title,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        height: 1.2,
                      ),
                    ),
                    if (movie.meta.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(movie.meta, style: mutedStyle),
                    ],
                    if (director != null && director.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text('Direção: $director', style: mutedStyle),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        StarRating(value: movie.averageRating, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          formatRating(movie.averageRating),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(width: 4),
                        Text('(${movie.ratingCount})', style: mutedStyle),
                      ],
                    ),
                    if (movie.genres.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          for (final genre in movie.genres) TagChip(genre.name),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: () => _review(movie, reload),
            icon: const Icon(Icons.star_outline),
            label: Text(hasReview ? 'Editar minha avaliação' : 'Avaliar este filme'),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: watched ? null : () => _markWatched(reload),
                  icon: Icon(
                    watched ? Icons.check_circle : Icons.check_circle_outline,
                  ),
                  label: Text(watched ? 'Assistido' : 'Já assisti'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _toggleWatchlist(reload),
                  icon: Icon(inList ? Icons.bookmark : Icons.bookmark_border),
                  label: Text(inList ? 'Na Watchlist' : 'Watchlist'),
                ),
              ),
            ],
          ),
          if (synopsis != null && synopsis.isNotEmpty) ...[
            const SectionTitle('Sinopse'),
            Text(synopsis, style: const TextStyle(height: 1.5)),
          ],
          SectionTitle('Avaliações (${movie.reviews.length})'),
          if (movie.reviews.isEmpty)
            const EmptyView(message: 'Ainda não há avaliações para este filme.'),
          for (final review in movie.reviews)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: ReviewCard(
                review: review,
                onTap: review.user == null
                    ? null
                    : () => openProfile(context, review.user!.username),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: AsyncView<_DetailData>(
        loader: _load,
        builder: _content,
      ),
    );
  }
}