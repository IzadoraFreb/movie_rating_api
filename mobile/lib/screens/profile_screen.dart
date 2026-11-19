import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';
import 'login_screen.dart';
import 'movie_detail_screen.dart';
import 'user_list_screen.dart';

Future<void> openProfile(BuildContext context, String username) {
  return Navigator.of(context).push<void>(
    MaterialPageRoute<void>(builder: (_) => ProfileScreen(username: username)),
  );
}

class _ProfileData {
  const _ProfileData({
    required this.profile,
    required this.reviews,
    required this.following,
  });

  final User profile;
  final List<Review> reviews;
  final bool following;
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.username});

  final String username;

  Future<_ProfileData> _load(ApiService api, User? me) async {
    final results = await Future.wait<Object>([
      api.profile(username),
      api.userReviews(username),
      api.connections(username, followers: true),
    ]);
    final followers = results[2] as List<User>;
    return _ProfileData(
      profile: results[0] as User,
      reviews: results[1] as List<Review>,
      following: me != null && followers.any((user) => user.id == me.id),
    );
  }

  void _openList(BuildContext context, bool followers) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => UserListScreen(username: username, followers: followers),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiService>();
    final me = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(title: Text('@$username')),
      body: AsyncView<_ProfileData>(
        loader: () => _load(api, me),
        builder: (context, data, reload) {
          final profile = data.profile;
          final bio = profile.bio?.trim();
          final isMe = me != null && me.username == profile.username;

          Future<void> toggleFollow() async {
            if (!await requireLogin(context)) return;
            try {
              if (data.following) {
                await api.unfollow(username);
              } else {
                await api.follow(username);
              }
              await reload();
            } catch (error) {
              if (context.mounted) showSnack(context, errorText(error));
            }
          }

          return RefreshIndicator(
            color: AppColors.accent,
            onRefresh: reload,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              children: [
                Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          UserAvatar(user: profile, radius: 32),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  profile.name,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text('@${profile.username}', style: mutedStyle),
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
                          StatBox(value: profile.reviews, label: 'Avaliações'),
                          StatBox(value: profile.watched, label: 'Assistidos'),
                          StatBox(
                            value: profile.followers,
                            label: 'Seguidores',
                            onTap: () => _openList(context, true),
                          ),
                          StatBox(
                            value: profile.following,
                            label: 'Seguindo',
                            onTap: () => _openList(context, false),
                          ),
                        ],
                      ),
                      if (!isMe) ...[
                        const SizedBox(height: 12),
                        data.following
                            ? OutlinedButton(
                                onPressed: toggleFollow,
                                child: const Text('Seguindo'),
                              )
                            : FilledButton(
                                onPressed: toggleFollow,
                                child: const Text('Seguir'),
                              ),
                      ],
                    ],
                  ),
                ),
                const SectionTitle('Avaliações'),
                if (data.reviews.isEmpty)
                  const EmptyView(message: 'Nenhuma avaliação publicada ainda.'),
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
          );
        },
      ),
    );
  }
}