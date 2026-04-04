import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY não definida no .env');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

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
  }>;
}

export const geminiService = {
  getRecommendations: async (history: UserRating[]): Promise<RecommendationResponse> => {
    // Vamos experimentar o modelo gemini-2.0-flash com geração forçada de JSON
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const prompt = `
Tu és um especialista em cinema e séries. Com base no histórico de visualização do utilizador, recomenda 5 filmes ou séries.

Histórico:
${history.map(item => `- ${item.title}: ${item.rating}/10`).join('\n')}

Responde apenas com JSON:
{"recommendations": [{"title": "...", "media_type": "movie", "year": "...", "ai_reason": "..."}]}
`;

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });
      
      const response = await result.response;
      const text = response.text();
      console.log('Resposta da Gemini:', text);
      
      return JSON.parse(text) as RecommendationResponse;
    } catch (error: any) {
      console.error('Erro na Gemini API:', error.message || error);
      throw error;
    }
  }
};
