import 'package:flutter/material.dart';

class CreditsScreen extends StatelessWidget {
  const CreditsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Créditos')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Sobre o projeto',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          const Text(
            'Projeto acadêmico de catálogo e avaliação de filmes, '
            'desenvolvido para fins educacionais.',
          ),
          const SizedBox(height: 28),
          Text(
            'Dados e imagens',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: Image.asset(
              'assets/tmdb-logo.png',
              width: 150,
              fit: BoxFit.contain,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'As informações e imagens dos filmes vinculados ao TMDB '
            'são fornecidas pela API do The Movie Database.',
          ),
          const SizedBox(height: 12),
          const Text(
            'This product uses the TMDB API but is not endorsed '
            'or certified by TMDB.',
          ),
          const SizedBox(height: 12),
          const SelectableText('https://www.themoviedb.org'),
          const SizedBox(height: 28),
          Text(
            'Avaliações da comunidade',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          const Text(
            'As avaliações e notas dos usuários deste aplicativo '
            'são independentes das notas do TMDB.',
          ),
        ],
      ),
    );
  }
}