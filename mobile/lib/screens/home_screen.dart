import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';
import 'movie_detail_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.onExplore});

  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiService>();
    return Scaffold(
      appBar: AppBar(title: const Text('Cinema')),
      body: AsyncView<Highlights>(
        loader: api.highlights,
        builder: (context, data, reload) => RefreshIndicator(
          color: AppColors.accent,
          onRefresh: reload,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            children: [
              const Text(
                'UM LUGAR PARA QUEM GOSTA DE CINEMA',
                style: TextStyle(
                  color: AppColors.accent,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Todo filme merece uma boa conversa.',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  height: 1.2,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Descubra histórias, registre o que assistiu e compartilhe suas impressões.',
                style: TextStyle(color: AppColors.muted, fontSize: 15),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: onExplore,
                child: const Text('Explorar filmes'),
              ),
              const SectionTitle('Em destaque'),
              SizedBox(
                height: 230,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: data.movies.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final movie = data.movies[index];
                    return SizedBox(
                      width: 125,
                      child: MovieCard(
                        movie: movie,
                        onTap: () => openMovie(context, movie.id),
                      ),
                    );
                  },
                ),
              ),
              const SectionTitle('Avaliações recentes'),
              if (data.reviews.isEmpty)
                const EmptyView(message: 'Ainda não há avaliações.'),
              for (final review in data.reviews)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: ReviewCard(
                    review: review,
                    showMovie: true,
                    onTap: () => openMovie(context, review.movieId),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}