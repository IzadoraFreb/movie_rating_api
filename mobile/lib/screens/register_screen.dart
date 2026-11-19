import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/common.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _username.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final auth = context.read<AuthProvider>();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await auth.register(
        email: _email.text,
        password: _password.text,
        displayName: _name.text,
        username: _username.text,
      );
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
    return Scaffold(
      appBar: AppBar(),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Crie sua conta',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            const Text(
              'Registre o que assistiu e compartilhe suas impressões.',
              style: mutedStyle,
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _name,
              decoration: fieldDecoration('Nome de exibição'),
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.isEmpty) return null;
                return text.length < 2 || text.length > 80
                    ? 'Use de 2 a 80 caracteres.'
                    : null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _username,
              autocorrect: false,
              decoration: fieldDecoration(
                'Nome de usuário (opcional)',
                hint: 'letras, números e _',
              ),
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.isEmpty) return null;
                return RegExp(r'^[a-zA-Z0-9_]{3,24}$').hasMatch(text)
                    ? null
                    : 'Use de 3 a 24 letras, números ou _.';
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              decoration: fieldDecoration('E-mail'),
              validator: (value) {
                final text = value?.trim() ?? '';
                if (!text.contains('@') || !text.contains('.')) {
                  return 'Informe um e-mail válido.';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _password,
              obscureText: _obscure,
              decoration: fieldDecoration('Senha').copyWith(
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() {
                    _obscure = !_obscure;
                  }),
                ),
              ),
              validator: (value) => (value ?? '').length < 8
                  ? 'A senha tem no mínimo 8 caracteres.'
                  : null,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: AppColors.danger)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: Text(_busy ? 'Criando…' : 'Criar conta'),
            ),
          ],
        ),
      ),
    );
  }
}