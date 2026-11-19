import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/common.dart';

class ReviewScreen extends StatefulWidget {
  const ReviewScreen({super.key, required this.movie, this.existing});

  final Movie movie;
  final Review? existing;

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  static const _labels = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

  final _comment = TextEditingController();
  int _rating = 0;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _rating = widget.existing?.rating ?? 0;
    _comment.text = widget.existing?.comment ?? '';
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_rating == 0) {
      setState(() {
        _error = 'Escolha uma nota de 1 a 5.';
      });
      return;
    }
    final api = context.read<ApiService>();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await api.saveReview(widget.movie.id, _rating, _comment.text.trim());
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = errorText(error);
        _busy = false;
      });
    }
  }

  Future<void> _delete() async {
    final api = context.read<ApiService>();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Excluir avaliação?'),
        content: const Text('Seu registro de filme assistido será mantido.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text(
              'Excluir',
              style: TextStyle(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await api.deleteReview(widget.movie.id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = errorText(error);
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.existing != null;
    return Scaffold(
      appBar: AppBar(title: Text(editing ? 'Editar avaliação' : 'Avaliar filme')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Poster(url: widget.movie.posterUrl, width: 56),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.movie.title,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Center(child: Text('Sua nota', style: mutedStyle)),
          StarPicker(
            value: _rating,
            onChanged: (value) => setState(() {
              _rating = value;
              _error = null;
            }),
          ),
          Center(
            child: Text(
              _labels[_rating],
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _comment,
            maxLines: 5,
            maxLength: 2000,
            decoration: fieldDecoration('Comentário (opcional)'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: AppColors.danger)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _save,
            child: Text(_busy ? 'Salvando…' : 'Salvar avaliação'),
          ),
          if (editing) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: _busy ? null : _delete,
              child: const Text(
                'Excluir avaliação',
                style: TextStyle(color: AppColors.danger),
              ),
            ),
          ],
        ],
      ),
    );
  }
}