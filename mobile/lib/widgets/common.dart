import 'package:flutter/material.dart';

import '../core/config.dart';
import '../core/format.dart';
import '../core/theme.dart';
import '../models/models.dart';
import '../services/api_client.dart';

String errorText(Object error) =>
    error is ApiException ? error.message : 'Algo deu errado. Tente novamente.';

void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

InputDecoration fieldDecoration(String label, {String? hint}) {
  OutlineInputBorder border(Color color) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: color),
      );
  return InputDecoration(
    labelText: label,
    hintText: hint,
    filled: true,
    fillColor: AppColors.surface,
    border: border(AppColors.border),
    enabledBorder: border(AppColors.border),
    focusedBorder: border(AppColors.accent),
    errorBorder: border(AppColors.danger),
    focusedErrorBorder: border(AppColors.danger),
  );
}

Future<String?> pickOption(
  BuildContext context, {
  required String title,
  required List<MapEntry<String, String>> options,
  required String current,
}) {
  return showModalBottomSheet<String>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    builder: (sheetContext) => SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(sheetContext).size.height * 0.7,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text(
                title,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: [
                  for (final option in options)
                    ListTile(
                      title: Text(option.value),
                      trailing: option.key == current
                          ? const Icon(Icons.check, color: AppColors.accent)
                          : null,
                      onTap: () => Navigator.of(sheetContext).pop(option.key),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class AsyncView<T> extends StatefulWidget {
  const AsyncView({super.key, required this.loader, required this.builder});

  final Future<T> Function() loader;
  final Widget Function(
    BuildContext context,
    T data,
    Future<void> Function() reload,
  ) builder;

  @override
  State<AsyncView<T>> createState() => _AsyncViewState<T>();
}

class _AsyncViewState<T> extends State<AsyncView<T>> {
  late Future<T> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.loader();
  }

  Future<void> _reload() async {
    final next = widget.loader();
    setState(() {
      _future = next;
    });
    try {
      await next;
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.done &&
            snapshot.hasError) {
          return ErrorView(
            message: errorText(snapshot.error!),
            onRetry: _reload,
          );
        }
        if (snapshot.hasData) {
          return widget.builder(context, snapshot.data as T, _reload);
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 40, color: AppColors.muted),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: onRetry,
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(message, textAlign: TextAlign.center, style: mutedStyle),
      ),
    );
  }
}

class Panel extends StatelessWidget {
  const Panel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: AppColors.border),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: padding,
          child: SizedBox(width: double.infinity, child: child),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 22, 0, 10),
      child: Text(
        text,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class StatBox extends StatelessWidget {
  const StatBox({super.key, required this.value, required this.label, this.onTap});

  final int value;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              Text(
                '$value',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 2),
              Text(label, style: mutedStyle, textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}

class TagChip extends StatelessWidget {
  const TagChip(this.label, {super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.soft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: const TextStyle(fontSize: 12)),
    );
  }
}

class Poster extends StatelessWidget {
  const Poster({super.key, required this.url, this.width, this.fill = false});

  final String? url;
  final double? width;
  final bool fill;

  Widget _placeholder() => Container(
        color: AppColors.soft,
        alignment: Alignment.center,
        child: const Icon(Icons.movie_outlined, color: AppColors.muted),
      );

  @override
  Widget build(BuildContext context) {
    final resolved = AppConfig.resolve(url);
    final Widget image = resolved == null
        ? _placeholder()
        : Image.network(
            resolved,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, progress) =>
                progress == null ? child : _placeholder(),
            errorBuilder: (context, error, stack) => _placeholder(),
          );
    final clipped = ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: fill
          ? SizedBox.expand(child: image)
          : AspectRatio(aspectRatio: 2 / 3, child: image),
    );
    return width == null ? clipped : SizedBox(width: width, child: clipped);
  }
}

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, required this.user, this.radius = 18});

  final User? user;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final url = AppConfig.resolve(user?.avatarUrl);
    final name = user?.name ?? '?';
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.border,
      foregroundImage: url == null ? null : NetworkImage(url),
      onForegroundImageError: url == null ? null : (error, stack) {},
      child: Text(
        name.isEmpty ? '?' : name[0].toUpperCase(),
        style: TextStyle(
          color: AppColors.foreground,
          fontWeight: FontWeight.w600,
          fontSize: radius * 0.8,
        ),
      ),
    );
  }
}

class StarRating extends StatelessWidget {
  const StarRating({super.key, required this.value, this.size = 16});

  final double? value;
  final double size;

  @override
  Widget build(BuildContext context) {
    final current = value ?? 0;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final icon = current >= index + 0.75
            ? Icons.star
            : current >= index + 0.25
                ? Icons.star_half
                : Icons.star_border;
        return Icon(
          icon,
          size: size,
          color: value == null ? AppColors.border : AppColors.star,
        );
      }),
    );
  }
}

class StarPicker extends StatelessWidget {
  const StarPicker({super.key, required this.value, required this.onChanged});

  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (index) {
        final active = index < value;
        return IconButton(
          iconSize: 40,
          onPressed: () => onChanged(index + 1),
          icon: Icon(
            active ? Icons.star : Icons.star_border,
            color: active ? AppColors.star : AppColors.muted,
          ),
        );
      }),
    );
  }
}

class MovieCard extends StatelessWidget {
  const MovieCard({super.key, required this.movie, required this.onTap});

  final Movie movie;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final year = movie.releaseYear;
    final detail = year == null
        ? formatRating(movie.averageRating)
        : '${formatRating(movie.averageRating)} · $year';
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: Poster(url: movie.posterUrl, fill: true)),
          const SizedBox(height: 8),
          Text(
            movie.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              const Icon(Icons.star, size: 13, color: AppColors.star),
              const SizedBox(width: 3),
              Flexible(
                child: Text(
                  detail,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class MovieRow extends StatelessWidget {
  const MovieRow({
    super.key,
    required this.movie,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  final Movie movie;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final sub = subtitle;
    final end = trailing;
    return Panel(
      padding: const EdgeInsets.all(10),
      onTap: onTap,
      child: Row(
        children: [
          Poster(url: movie.posterUrl, width: 52),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  movie.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (sub != null) ...[
                  const SizedBox(height: 4),
                  Text(sub, style: mutedStyle),
                ],
              ],
            ),
          ),
          if (end != null) end,
        ],
      ),
    );
  }
}

class ReviewCard extends StatelessWidget {
  const ReviewCard({
    super.key,
    required this.review,
    this.showMovie = false,
    this.onTap,
  });

  final Review review;
  final bool showMovie;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final movie = review.movie;
    final user = review.user;
    final comment = review.comment?.trim();
    final title = showMovie ? (movie?.title ?? 'Filme') : (user?.name ?? 'Usuário');
    final Widget leading = showMovie
        ? Poster(url: movie?.posterUrl, width: 40)
        : UserAvatar(user: user);

    return Panel(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              leading,
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    if (showMovie && user != null)
                      Text('por ${user.name}', style: mutedStyle),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        StarRating(value: review.rating.toDouble()),
                        const SizedBox(width: 8),
                        Text(formatDate(review.watchedAt), style: mutedStyle),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (comment != null && comment.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(comment),
          ],
        ],
      ),
    );
  }
}