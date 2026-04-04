import axios from 'axios';

const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const BASE_URL = 'https://www.omdbapi.com/';

const omdbClient = axios.create({
  baseURL: BASE_URL,
  params: {
    apikey: OMDB_API_KEY,
  },
});

export interface OMDBMovie {
  imdbID: string;
  Title: string;
  Year: string;
  Type: 'movie' | 'series';
  Poster: string;
  Plot?: string;
  imdbRating?: string;
}

export const omdbService = {
  search: async (query: string): Promise<OMDBMovie[]> => {
    const { data } = await omdbClient.get('', {
      params: { s: query },
    });
    
    if (data.Response === 'False') return [];
    
    return data.Search.filter((item: any) => 
      (item.Type === 'movie' || item.Type === 'series') && item.Poster !== 'N/A'
    );
  },

  getDetails: async (imdbID: string): Promise<OMDBMovie | null> => {
    const { data } = await omdbClient.get('', {
      params: { i: imdbID, plot: 'short' },
    });
    
    if (data.Response === 'False') return null;
    return data;
  },

  getPopular: async (): Promise<OMDBMovie[]> => {
    const popularTitles = [
      'The Godfather', 'The Shawshank Redemption', 'The Dark Knight', 
      'Pulp Fiction', 'Forrest Gump', 'Inception', 'The Matrix', 
      'Goodfellas', 'Star Wars', 'Parasite', 'Interstellar', 'The Lord of the Rings'
    ];
    
    const shuffled = popularTitles.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    const results = await Promise.all(
      shuffled.map(async (title) => {
        const movies = await omdbService.search(title);
        return movies[0];
      })
    );
    
    return results.filter(Boolean) as OMDBMovie[];
  }
};
