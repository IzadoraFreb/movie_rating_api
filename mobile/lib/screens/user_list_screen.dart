import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';
import 'profile_screen.dart';

class UserListScreen extends StatelessWidget {
  const UserListScreen({
    super.key,
    required this.username,
    required this.followers,
  });

  final String username;
  final bool followers;

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiService>();
    return Scaffold(
      appBar: AppBar(title: Text(followers ? 'Seguidores' : 'Seguindo')),
      body: AsyncView<List<User>>(
        loader: () => api.connections(username, followers: followers),
        builder: (context, users, reload) {
          if (users.isEmpty) {
            return const EmptyView(message: 'Nenhum perfil por aqui ainda.');
          }
          return RefreshIndicator(
            color: AppColors.accent,
            onRefresh: reload,
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              itemCount: users.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final user = users[index];
                return Panel(
                  padding: const EdgeInsets.all(12),
                  onTap: () => openProfile(context, user.username),
                  child: Row(
                    children: [
                      UserAvatar(user: user, radius: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.name,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            Text('@${user.username}', style: mutedStyle),
                          ],
                        ),
                      ),
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