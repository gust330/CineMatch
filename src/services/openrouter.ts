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
  }>;
}

export const openRouterService = {
  getRecommendations: async (history: UserRating[], rejectedTitles: string[] = []): Promise<RecommendationResponse> => {
    // Modelos gratuitos conhecidos por funcionar na OpenRouter
    const models = [
      'mistralai/mistral-7b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
      'google/gemma-2-9b-it'
    ];

    // Adicionar filmes rejeitados ao prompt para evitar repetidos
    const rejectedSection = rejectedTitles.length > 0 
      ? `\n\nALSO AVOID these titles that were already rejected by the user:\n${rejectedTitles.map(t => `- ${t}`).join('\n')}`
      : '';

    const prompt = `
You are a movie and series expert. Based on the user's viewing history below, recommend 4 movies or series they will probably love.

User's history:
${history.map(item => `- ${item.title} (${item.media_type}): Rating ${item.rating}/10`).join('\n')}${rejectedSection}

Rules:
1. Recommend only 4 titles NOT in the history above and NOT in the rejected list.
2. For each, give the original title, type (movie or series), release year, and a brief justification (max 2 sentences).
3. Respond ONLY in valid JSON:
{"recommendations": [{"title": "Title", "media_type": "movie", "year": "2024", "ai_reason": "Justification"}]}
`;

    // Try each model until one works
    let lastError = null;
    
    for (const modelName of models) {
      try {
        console.log(`Tentando modelo: ${modelName}...`);
        
        const { data } = await axios.post(
          OPENROUTER_API_URL,
          {
            model: modelName,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1200,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://cinematch.vercel.app',
              'X-Title': 'CineMatch'
            }
          }
        );

        const content = data.choices[0].message.content;
        console.log('Resposta do modelo:', content.substring(0, 200) + '...');
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Resposta não contém JSON válido');
        }
        
        return JSON.parse(jsonMatch[0]) as RecommendationResponse;
        
      } catch (error: any) {
        console.log(`Modelo ${modelName} falhou:`, error.response?.status, error.message);
        lastError = error;
        
        // Se for 404, continuar para o próximo modelo
        if (error.response?.status === 404) {
          continue;
        }
        // Se for outro erro,	throw logo
        throw error;
      }
    }
    
    throw lastError || new Error('Nenhum modelo disponível');
  }
};