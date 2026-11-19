import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._api) {
    _api.client.onUnauthorized = _expire;
  }

  static const _tokenKey = 'auth_token';

  final ApiService _api;
  User? _user;
  bool _ready = false;

  User? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get ready => _ready;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_tokenKey);
    if (saved != null) {
      _api.client.token = saved;
      try {
        _user = await _api.me();
      } on ApiException catch (error) {
        if (error.status == 401 || error.status == 404) await _clear();
      }
    }
    _ready = true;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final session = await _api.login(email.trim(), password);
    await _persist(session);
  }

  Future<void> register({
    required String email,
    required String password,
    String? displayName,
    String? username,
  }) async {
    final session = await _api.register(
      email: email.trim(),
      password: password,
      displayName: displayName?.trim(),
      username: username?.trim(),
    );
    await _persist(session);
  }

  Future<void> logout() => _clear();

  Future<void> refresh() async {
    if (!isLoggedIn) return;
    try {
      _user = await _api.me();
      notifyListeners();
    } on ApiException catch (_) {}
  }

  Future<void> updateProfile({String? displayName, String? bio}) async {
    await _api.updateProfile(displayName: displayName, bio: bio);
    await refresh();
  }

  Future<void> _persist(Session session) async {
    _api.client.token = session.token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, session.token);
    try {
      _user = await _api.me();
    } catch (_) {
      _user = session.user;
    }
    notifyListeners();
  }

  void _expire() {
    _clear();
  }

  Future<void> _clear() async {
    _api.client.token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    notifyListeners();
  }
}