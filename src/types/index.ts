export interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Type: 'movie' | 'series';
  Poster: string;
  Plot?: string;
  imdbRating?: string;
  aiReason?: string;
}

export interface UserRating {
  user_id?: string;
  tmdb_id: number;
  media_type: 'movie' | 'series';
  title: string;
  poster_path: string;
  rating: number;
  user_note?: string;
  watched_at?: string;
}

export interface WatchlistItem {
  id?: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'series';
  title: string;
  poster_path: string;
  status: 'pending' | 'watching' | 'completed';
  ai_reason?: string;
  added_at?: string;
}
