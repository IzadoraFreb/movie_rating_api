import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/format.dart';
import '../core/theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';
import 'edit_profile_screen.dart';
import 'login_screen.dart';
import 'movie_detail_screen.dart';
import 'profile_screen.dart';
import 'register_screen.dart';

class MyAreaScreen extends StatelessWidget {
  const MyAreaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Minha área'),
        actions: [
          if (user != null)
            IconButton(
              tooltip: 'Sair',
              icon: const Icon(Icons.logout),
              onPressed: auth.logout,
            ),
        ],
      ),
      body: user == null
          ? const _LoginPrompt()
          : _MyAreaContent(key: ValueKey(user.id)),
    );
  }
}

class _LoginPrompt extends StatelessWidget {
  const _LoginPrompt();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.person_outline, size: 48, color: AppColors.muted),
            const SizedBox(height: 12),
            const Text(
              'Entre para registrar o que assistiu, avaliar filmes e montar sua Watchlist.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<bool>(builder: (_) => const LoginScreen()),
              ),
              child: const Text('Entrar'),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<bool>(builder: (_) => const RegisterScreen()),
              ),
              child: const Text('Criar conta'),
            ),
          ],
        ),
      ),
    );
  }
}

class _MyData {
  const _MyData(this.watched, this.reviews, this.watchlist);

  final List<WatchedItem> watched;
  final List<Review> reviews;
  final List<WatchlistItem> watchlist;
}

class _MyAreaContent extends StatefulWidget {
  const _MyAreaContent({super.key});

  @override
  State<_MyAreaContent> createState() => _MyAreaContentState();
}

class _MyAreaContentState extends State<_MyAreaContent> {
  int _tab = 0;

  Future<_MyData> _load(ApiService api, String username) async {
    final results = await Future.wait<Object>([
      api.watched(),
      api.userReviews(username),
      api.watchlist(),
    ]);
    return _MyData(
      results[0] as List<WatchedItem>,
      results[1] as List<Review>,
      results[2] as List<WatchlistItem>,
    );
  }

  Future<void> _open(String movieId, Future<void> Function() reload) async {
    await openMovie(context, movieId);
    if (!mounted) return;
    await context.read<AuthProvider>().refresh();
    await reload();
  }

  Future<void> _removeFromWatchlist(
    String movieId,
    Future<void> Function() reload,
  ) async {
    final api = context.read<ApiService>();
    final auth = context.read<AuthProvider>();
    try {
      await api.removeFromWatchlist(movieId);
      await auth.refresh();
      await reload();
    } catch (error) {
      if (mounted) showSnack(context, errorText(error));
    }
  }

  Widget _header(User user) {
    final bio = user.bio?.trim();
    return Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              UserAvatar(user: user, radius: 32),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text('@${user.username}', style: mutedStyle),
                    if (user.email != null) Text(user.email!, style: mutedStyle),
                  ],
                ),
              ),
            ],
          ),
          if (bio != null && bio.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(bio),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              StatBox(value: user.watched, label: 'Assistidos'),
              StatBox(value: user.reviews, label: 'Avaliações'),
              StatBox(value: user.watchlist, label: 'Watchlist'),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const EditProfileScreen(),
                    ),
                  ),
                  child: const Text('Editar perfil'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => openProfile(context, user.username),
                  child: const Text('Perfil público'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _tabContent(_MyData data, Future<void> Function() reload) {
    if (_tab == 0) {
      if (data.watched.isEmpty) {
        return [const EmptyView(message: 'Seu histórico começa com o próximo filme.')];
      }
      return [
        for (final item in data.watched)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: MovieRow(
              movie: item.movie,
              subtitle: 'Assistido em ${formatDate(item.watchedAt)}',
              trailing: item.movie.myRating == null
                  ? null
                  : StarRating(value: item.movie.myRating!.toDouble()),
              onTap: () => _open(item.movie.id, reload),
            ),
          ),
      ];
    }
    if (_tab == 1) {
      if (data.reviews.isEmpty) {
        return [const EmptyView(message: 'Você ainda não avaliou nenhum filme.')];
      }
      return [
        for (final review in data.reviews)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: ReviewCard(
              review: review,
              showMovie: true,
              onTap: () => _open(review.movieId, reload),
            ),
          ),
      ];
    }
    if (data.watchlist.isEmpty) {
      return [const EmptyView(message: 'Sua Watchlist está vazia.')];
    }
    return [
      for (final item in data.watchlist)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: MovieRow(
            movie: item.movie,
            subtitle: item.movie.yearAndGenres,
            trailing: IconButton(
              tooltip: 'Remover da Watchlist',
              icon: const Icon(Icons.bookmark_remove_outlined),
              onPressed: () => _removeFromWatchlist(item.movie.id, reload),
            ),
            onTap: () => _open(item.movie.id, reload),
          ),
        ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user == null) return const SizedBox.shrink();
    final api = context.read<ApiService>();

    return AsyncView<_MyData>(
      loader: () => _load(api, user.username),
      builder: (context, data, reload) {
        final labels = [
          'Assistidos (${data.watched.length})',
          'Avaliações (${data.reviews.length})',
          'Watchlist (${data.watchlist.length})',
        ];
        return RefreshIndicator(
          color: AppColors.accent,
          onRefresh: reload,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            children: [
              _header(user),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (var index = 0; index < labels.length; index++)
                    ChoiceChip(
                      label: Text(labels[index]),
                      selected: _tab == index,
                      onSelected: (_) => setState(() {
                        _tab = index;
                      }),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              ..._tabContent(data, reload),
            ],
          ),
        );
      },
    );
  }
}