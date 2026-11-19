import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/root_shell.dart';
import 'services/api_client.dart';
import 'services/api_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MovieApp());
}

class MovieApp extends StatelessWidget {
  const MovieApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>(create: (_) => ApiService(ApiClient())),
        ChangeNotifierProvider<AuthProvider>(
          lazy: false,
          create: (context) =>
              AuthProvider(context.read<ApiService>())..init(),
        ),
      ],
      child: MaterialApp(
        title: 'Cinema',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(),
        home: const _Gate(),
      ),
    );
  }
}

class _Gate extends StatelessWidget {
  const _Gate();

  @override
  Widget build(BuildContext context) {
    final ready = context.select<AuthProvider, bool>((auth) => auth.ready);
    if (!ready) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return const RootShell();
  }
}