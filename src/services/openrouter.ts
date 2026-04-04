import axios from 'axios';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface UserRating {
  title: string;
  rating: number;
  note?: string;
  media_type: 'movie' | 'series';
}

export interface RecommendationResponse {
  recommendations: Array<{
    title: string;
    media_type: 'movie' | 'series';
    year: string;
    ai_reason: string;
    imdb_id?: string;
  }>;
}

export const openRouterService = {
  getRecommendations: async (history: UserRating[]): Promise<RecommendationResponse> => {
    const prompt = `
Age como um especialista em cinema e séries. Com base no perfil de gostos do utilizador abaixo, recomenda 5 filmes ou séries que o utilizador provavelmente vai adorar.

Histórico do utilizador:
${history.map(item => `- ${item.title} (${item.media_type}): Nota ${item.rating}/10. Nota do utilizador: ${item.note || 'Sem nota'}`).join('\n')}

Regras:
1. Recomenda apenas 5 títulos que NÃO estejam no histórico acima.
2. Para cada um, dá o título original, o tipo (movie ou series), o ano de lançamento e uma justificação breve (máx 2 frases).
3. Responde APENAS em JSON válido com este schema exato:
{
  "recommendations": [
    { "title": "Título", "media_type": "movie" | "series", "year": "2024", "ai_reason": "Justificação" }
  ]
}
`;

    try {
      const { data } = await axios.post(
        OPENROUTER_API_URL,
        {
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'CineMatch'
          }
        }
      );

      const content = data.choices[0].message.content;
      return JSON.parse(content) as RecommendationResponse;
    } catch (error: any) {
      console.error('Erro na OpenRouter API:', error?.response?.data || error.message);
      throw error;
    }
  }
};