export type Genre = { id: string; name: string; _count?: { movies: number } };
export type Movie = {
  id: string;
  title: string;
  releaseYear: number | null;
  director: string | null;
  duration: number | null;
  synopsis: string | null;
  posterUrl: string | null;
  genres: Genre[];
  averageRating: number | null;
  ratingCount: number;
  reviews?: Review[];
};
export type User = {
  id: string;
  username: string;
  displayName: string | null;
  email?: string;
  role?: 'USER' | 'ADMIN';
  _count?: { watched: number; reviews: number; watchlist?: number };
};
export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  watchedAt: string;
  createdAt: string;
  movieId: string;
  userId: string;
  movie: Movie;
  user: User;
};
export type PageResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
export type Activity = {
  watched: boolean;
  inWatchlist: boolean;
  review: Review | null;
};
export type Watched = {
  watchedAt: string;
  movie: Movie & { myRating: number | null };
};
export type WatchlistItem = { addedAt: string; movie: Movie };
export type Dashboard = {
  movies: number;
  genres: number;
  users: number;
  reviews: number;
  recent: Review[];
  distribution: Genre[];
};
