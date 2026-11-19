import '../core/format.dart';

Map<String, dynamic>? jMap(dynamic value) =>
    value is Map<String, dynamic> ? value : null;

List<Map<String, dynamic>> jList(dynamic value) => value is List
    ? value.whereType<Map<String, dynamic>>().toList()
    : <Map<String, dynamic>>[];

DateTime? jDate(dynamic value) =>
    value is String ? DateTime.tryParse(value) : null;

int? jInt(dynamic value) => value is num ? value.toInt() : null;

double? jDouble(dynamic value) => value is num ? value.toDouble() : null;

class Genre {
  const Genre({required this.id, required this.name, this.movieCount = 0});

  final String id;
  final String name;
  final int movieCount;

  factory Genre.fromJson(Map<String, dynamic> json) => Genre(
        id: json['id'] as String,
        name: json['name'] as String,
        movieCount: jInt(jMap(json['_count'])?['movies']) ?? 0,
      );
}

class User {
  const User({
    required this.id,
    required this.username,
    this.displayName,
    this.bio,
    this.avatarUrl,
    this.bannerUrl,
    this.email,
    this.role = 'USER',
    this.createdAt,
    this.reviews = 0,
    this.watched = 0,
    this.watchlist = 0,
    this.followers = 0,
    this.following = 0,
  });

  final String id;
  final String username;
  final String? displayName;
  final String? bio;
  final String? avatarUrl;
  final String? bannerUrl;
  final String? email;
  final String role;
  final DateTime? createdAt;
  final int reviews;
  final int watched;
  final int watchlist;
  final int followers;
  final int following;

  String get name {
    final value = displayName?.trim();
    return value == null || value.isEmpty ? username : value;
  }

  factory User.fromJson(Map<String, dynamic> json) {
    final counts = jMap(json['_count']);
    int count(String key) => jInt(counts?[key]) ?? 0;
    return User(
      id: json['id'] as String,
      username: json['username'] as String,
      displayName: json['displayName'] as String?,
      bio: json['bio'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      bannerUrl: json['bannerUrl'] as String?,
      email: json['email'] as String?,
      role: json['role'] as String? ?? 'USER',
      createdAt: jDate(json['createdAt']),
      reviews: count('reviews'),
      watched: count('watched'),
      watchlist: count('watchlist'),
      followers: count('followers'),
      following: count('following'),
    );
  }
}

class Movie {
  const Movie({
    required this.id,
    required this.title,
    this.releaseYear,
    this.director,
    this.duration,
    this.synopsis,
    this.posterUrl,
    this.genres = const [],
    this.averageRating,
    this.ratingCount = 0,
    this.reviews = const [],
    this.myRating,
  });

  final String id;
  final String title;
  final int? releaseYear;
  final String? director;
  final int? duration;
  final String? synopsis;
  final String? posterUrl;
  final List<Genre> genres;
  final double? averageRating;
  final int ratingCount;
  final List<Review> reviews;
  final int? myRating;

  String get meta {
    final parts = <String>[
      if (releaseYear != null) '$releaseYear',
      if (duration != null) formatDuration(duration),
    ];
    return parts.join(' · ');
  }

  String get yearAndGenres {
    final parts = <String>[
      if (releaseYear != null) '$releaseYear',
      if (genres.isNotEmpty) genres.map((genre) => genre.name).join(', '),
    ];
    return parts.join(' · ');
  }

  factory Movie.fromJson(Map<String, dynamic> json) => Movie(
        id: json['id'] as String,
        title: json['title'] as String,
        releaseYear: jInt(json['releaseYear']),
        director: json['director'] as String?,
        duration: jInt(json['duration']),
        synopsis: json['synopsis'] as String?,
        posterUrl: json['posterUrl'] as String?,
        genres: jList(json['genres']).map(Genre.fromJson).toList(),
        averageRating: jDouble(json['averageRating']),
        ratingCount: jInt(json['ratingCount']) ?? 0,
        reviews: jList(json['reviews']).map(Review.fromJson).toList(),
        myRating: jInt(json['myRating']),
      );
}

class Review {
  const Review({
    required this.id,
    required this.rating,
    required this.movieId,
    this.comment,
    this.watchedAt,
    this.user,
    this.movie,
  });

  final String id;
  final int rating;
  final String movieId;
  final String? comment;
  final DateTime? watchedAt;
  final User? user;
  final Movie? movie;

  factory Review.fromJson(Map<String, dynamic> json) {
    final user = jMap(json['user']);
    final movie = jMap(json['movie']);
    return Review(
      id: json['id'] as String,
      rating: jInt(json['rating']) ?? 0,
      movieId: json['movieId'] as String? ?? movie?['id'] as String? ?? '',
      comment: json['comment'] as String?,
      watchedAt: jDate(json['watchedAt']),
      user: user == null ? null : User.fromJson(user),
      movie: movie == null ? null : Movie.fromJson(movie),
    );
  }
}

class PageResult<T> {
  const PageResult({
    required this.data,
    required this.total,
    required this.page,
  });

  final List<T> data;
  final int total;
  final int page;
}

class Activity {
  const Activity({
    required this.watched,
    required this.inWatchlist,
    this.review,
  });

  final bool watched;
  final bool inWatchlist;
  final Review? review;

  factory Activity.fromJson(Map<String, dynamic> json) {
    final review = jMap(json['review']);
    return Activity(
      watched: json['watched'] == true,
      inWatchlist: json['inWatchlist'] == true,
      review: review == null ? null : Review.fromJson(review),
    );
  }
}

class WatchedItem {
  const WatchedItem({required this.watchedAt, required this.movie});

  final DateTime? watchedAt;
  final Movie movie;

  factory WatchedItem.fromJson(Map<String, dynamic> json) => WatchedItem(
        watchedAt: jDate(json['watchedAt']),
        movie: Movie.fromJson(json['movie'] as Map<String, dynamic>),
      );
}

class WatchlistItem {
  const WatchlistItem({required this.addedAt, required this.movie});

  final DateTime? addedAt;
  final Movie movie;

  factory WatchlistItem.fromJson(Map<String, dynamic> json) => WatchlistItem(
        addedAt: jDate(json['addedAt']),
        movie: Movie.fromJson(json['movie'] as Map<String, dynamic>),
      );
}

class Highlights {
  const Highlights({required this.movies, required this.reviews});

  final List<Movie> movies;
  final List<Review> reviews;
}

class Session {
  const Session({required this.user, required this.token});

  final User user;
  final String token;
}