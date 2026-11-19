import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';
import 'catalog_screen.dart';

class GenresScreen extends StatelessWidget {
  const GenresScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiService>();
    return Scaffold(
      appBar: AppBar(title: const Text('Explore por gênero')),
      body: AsyncView<List<Genre>>(
        loader: api.genres,
        builder: (context, genres, reload) {
          if (genres.isEmpty) {
            return const EmptyView(message: 'Nenhum gênero cadastrado.');
          }
          return RefreshIndicator(
            color: AppColors.accent,
            onRefresh: reload,
            child: GridView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 260,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 2.2,
              ),
              itemCount: genres.length,
              itemBuilder: (context, index) {
                final genre = genres[index];
                return Panel(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CatalogScreen(
                        initialGenre: genre,
                        title: genre.name,
                      ),
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        genre.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text('${genre.movieCount} filmes', style: mutedStyle),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}