import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config.dart';

class ApiException implements Exception {
  const ApiException(this.message, this.status);

  final String message;
  final int status;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  String? token;
  void Function()? onUnauthorized;

  Future<dynamic> get(String path, {Map<String, Object?>? query}) =>
      _send('GET', path, query: query);

  Future<dynamic> post(String path, {Object? body}) =>
      _send('POST', path, body: body);

  Future<dynamic> put(String path, {Object? body}) =>
      _send('PUT', path, body: body);

  Future<dynamic> patch(String path, {Object? body}) =>
      _send('PATCH', path, body: body);

  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, Object?>? query,
    Object? body,
  }) async {
    var uri = Uri.parse('${AppConfig.apiBase}$path');
    final params = <String, String>{};
    query?.forEach((key, value) {
      final text = value?.toString() ?? '';
      if (text.isNotEmpty) params[key] = text;
    });
    if (params.isNotEmpty) uri = uri.replace(queryParameters: params);

    final headers = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    final response = await _perform(
      method,
      uri,
      headers,
      body == null ? null : jsonEncode(body),
    );

    final text = utf8.decode(response.bodyBytes);
    dynamic data;
    if (text.isNotEmpty) {
      try {
        data = jsonDecode(text);
      } catch (_) {
        data = null;
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) return data;

    if (response.statusCode == 401 && token != null) onUnauthorized?.call();

    final raw = data is Map ? data['message'] : null;
    final message = raw is List
        ? raw.join('. ')
        : raw is String
            ? raw
            : 'Não foi possível concluir a solicitação. Tente novamente.';
    throw ApiException(message, response.statusCode);
  }

  Future<http.Response> _perform(
    String method,
    Uri uri,
    Map<String, String> headers,
    String? body,
  ) async {
    try {
      final Future<http.Response> request = switch (method) {
        'POST' => _client.post(uri, headers: headers, body: body),
        'PUT' => _client.put(uri, headers: headers, body: body),
        'PATCH' => _client.patch(uri, headers: headers, body: body),
        'DELETE' => _client.delete(uri, headers: headers),
        _ => _client.get(uri, headers: headers),
      };
      return await request.timeout(const Duration(seconds: 15));
    } on TimeoutException {
      throw const ApiException('A API demorou demais para responder.', 0);
    } catch (_) {
      throw const ApiException(
        'Não foi possível conectar à API. Verifique se o backend está em execução.',
        0,
      );
    }
  }
}