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
    
    // Filtrar apenas filmes e séries que têm poster
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
  }
};
