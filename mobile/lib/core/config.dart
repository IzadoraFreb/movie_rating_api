class AppConfig {
  static const String host =
      String.fromEnvironment('API_HOST', defaultValue: '10.0.2.2');
  static const String apiPort =
      String.fromEnvironment('API_PORT', defaultValue: '3000');
  static const String webPort =
      String.fromEnvironment('WEB_PORT', defaultValue: '3001');

  static const String apiOrigin = 'http://$host:$apiPort';
  static const String webOrigin = 'http://$host:$webPort';
  static const String apiBase = '$apiOrigin/api';

  static String? resolve(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return '$apiOrigin$url';
    if (url.startsWith('/posters?')) return '$apiBase$url';
    return '$webOrigin$url';
  }
}
