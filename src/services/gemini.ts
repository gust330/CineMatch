import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY não definida no .env');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

// Tentar vários modelos até encontrar um que funcione
const MODEL_NAME = 'gemini-1.5-flash-8b';

const model = genAI.getGenerativeModel({ 
  model: MODEL_NAME,
  generationConfig: {
    responseMimeType: "application/json",
  }
});

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
    imdb_id?: string; // Gemini pode tentar prever o ID ou apenas o título
  }>;
}

export const geminiService = {
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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text) as RecommendationResponse;
    } catch (error) {
      console.error('Erro na Gemini API:', error);
      throw error;
    }
  }
};
