import '../models/models.dart';
import 'api_client.dart';

class ApiService {
  ApiService(this.client);

  final ApiClient client;

  Future<Session> login(String email, String password) async {
    final json = await client.post(
      '/auth/login',
      body: {'email': email, 'password': password},
    );
    return Session(
      user: User.fromJson(jMap(json['user'])!),
      token: json['accessToken'] as String,
    );
  }

  Future<Session> register({
    required String email,
    required String password,
    String? displayName,
    String? username,
  }) async {
    final json = await client.post(
      '/auth/register',
      body: {
        'email': email,
        'password': password,
        if (displayName != null && displayName.isNotEmpty)
          'displayName': displayName,
        if (username != null && username.isNotEmpty) 'username': username,
      },
    );
    return Session(
      user: User.fromJson(jMap(json['user'])!),
      token: json['accessToken'] as String,
    );
  }

  Future<User> me() async => User.fromJson(jMap(await client.get('/users/me'))!);

  Future<User> updateProfile({String? displayName, String? bio}) async {
    final json = await client.patch(
      '/users/me',
      body: {
        if (displayName != null) 'displayName': displayName,
        if (bio != null) 'bio': bio,
      },
    );
    return User.fromJson(jMap(json)!);
  }

  Future<PageResult<Movie>> movies({
    String? q,
    String? genre,
    String? year,
    String? rating,
    int page = 1,
    int limit = 12,
  }) async {
    final json = await client.get(
      '/movies',
      query: {
        'q': q,
        'genre': genre,
        'year': year,
        'rating': rating,
        'page': page,
        'limit': limit,
      },
    );
    return PageResult<Movie>(
      data: jList(json['data']).map(Movie.fromJson).toList(),
      total: jInt(json['total']) ?? 0,
      page: jInt(json['page']) ?? page,
    );
  }

  Future<List<int>> years() async {
    final json = await client.get('/movies/filters');
    final list = json['years'];
    if (list is! List) return <int>[];
    return list.whereType<num>().map((year) => year.toInt()).toList();
  }

  Future<Highlights> highlights() async {
    final json = await client.get('/movies/highlights');
    return Highlights(
      movies: jList(json['movies']).map(Movie.fromJson).toList(),
      reviews: jList(json['recentReviews']).map(Review.fromJson).toList(),
    );
  }

  Future<Movie> movie(String id) async =>
      Movie.fromJson(jMap(await client.get('/movies/$id'))!);

  Future<List<Genre>> genres() async =>
      jList(await client.get('/genres')).map(Genre.fromJson).toList();

  Future<Activity> activity(String movieId) async =>
      Activity.fromJson(jMap(await client.get('/movies/$movieId/activity'))!);

  Future<void> markWatched(String movieId) async {
    await client.put('/movies/$movieId/watched');
  }

  Future<Review> saveReview(String movieId, int rating, String comment) async {
    final json = await client.put(
      '/movies/$movieId/review',
      body: {'rating': rating, 'comment': comment},
    );
    return Review.fromJson(jMap(json)!);
  }

  Future<void> deleteReview(String movieId) async {
    await client.delete('/movies/$movieId/review');
  }

  Future<List<WatchlistItem>> watchlist() async =>
      jList(await client.get('/watchlist')).map(WatchlistItem.fromJson).toList();

  Future<void> addToWatchlist(String movieId) async {
    await client.post('/watchlist/$movieId');
  }

  Future<void> removeFromWatchlist(String movieId) async {
    await client.delete('/watchlist/$movieId');
  }

  Future<List<WatchedItem>> watched() async =>
      jList(await client.get('/users/me/watched'))
          .map(WatchedItem.fromJson)
          .toList();

  Future<User> profile(String username) async => User.fromJson(
        jMap(await client.get('/users/${Uri.encodeComponent(username)}'))!,
      );

  Future<List<Review>> userReviews(String username) async => jList(
        await client.get('/users/${Uri.encodeComponent(username)}/reviews'),
      ).map(Review.fromJson).toList();

  Future<List<User>> connections(
    String username, {
    required bool followers,
  }) async {
    final kind = followers ? 'followers' : 'following';
    final json = await client.get(
      '/users/${Uri.encodeComponent(username)}/$kind',
    );
    return jList(json).map(User.fromJson).toList();
  }

  Future<void> follow(String username) async {
    await client.post('/users/${Uri.encodeComponent(username)}/follow');
  }

  Future<void> unfollow(String username) async {
    await client.delete('/users/${Uri.encodeComponent(username)}/follow');
  }
}