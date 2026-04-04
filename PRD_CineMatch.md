# PRD — CineMatch: Recomendador Inteligente de Filmes e Séries

**Versão:** 1.0  
**Data:** Abril 2026  
**Produto:** CineMatch Web App  
**Âmbito:** MVP + Features Fase 2

---

## 1. Visão Geral do Produto

### 1.1 Problema

Os utilizadores perdem demasiado tempo a decidir o que ver a seguir. As plataformas de streaming existentes (Netflix, Prime, etc.) fazem recomendações baseadas apenas no histórico da sua própria plataforma, ignorando gostos cross-platform e preferências mais nuançadas que o utilizador consegue articular.

### 1.2 Solução

CineMatch é uma webapp que usa IA (modelos gratuitos) para recomendar filmes e séries altamente personalizados, baseada em ratings explícitos e notas do utilizador sobre conteúdos que já viu — independentemente da plataforma onde os viu. A app aprende continuamente com os ratings dados após cada visualização.

### 1.3 Proposta de Valor

- Recomendações baseadas em gostos reais do utilizador, não em algoritmos de plataforma
- Interface simples: o utilizador regista o que viu, classifica, e recebe sugestões imediatas
- Funciona como um "diário cinematográfico" pessoal com inteligência incorporada
- Totalmente gratuito (sem custos de API de IA)

---

## 2. Utilizadores Alvo

### Persona Principal — O Cinéfilo Casual
- 18-35 anos, assina múltiplas plataformas de streaming
- Passa tempo considerável a escolher o que ver e acaba por não ver nada ("paradoxo da escolha")
- Quer recomendações que reflitam o seu gosto específico, não tendências gerais

### Persona Secundária — O Utilizador Social
- Quer partilhar a sua lista "a ver" com amigos
- Gosta de descobrir o que outros com gostos semelhantes estão a ver

---

## 3. Funcionalidades do Produto

### 3.1 MVP — Features Essenciais

#### F1 — Onboarding: Registo de Histórico Inicial

O utilizador introduz os últimos filmes/séries que se lembra de ter visto, com:
- **Título** (autocomplete via API gratuita TMDB)
- **Rating** (0–10, slider ou estrelas)
- **Nota opcional** (campo de texto livre, máx. 280 caracteres) — ex: "Adorei o ritmo mas o final foi fraco"

**Requisitos mínimos para primeira recomendação:** 3 títulos avaliados.  
**Máximo de entradas iniciais:** 10 (sem sobrecarga cognitiva).  
O utilizador pode sempre adicionar mais títulos ao histórico depois.

#### F2 — Engine de Recomendação por IA (Custo Zero)

**Modelo a usar:** Google Gemini API (tier gratuito — 15 req/min, 1 milhão tokens/dia) ou Hugging Face Inference API com modelos open-source (ex: Mistral-7B-Instruct).  
**Alternativa sem API key:** Integração com OpenRouter API (modelos gratuitos como `mistralai/mistral-7b-instruct:free`).

**Como funciona:**
1. O sistema constrói um prompt estruturado com o histórico do utilizador (títulos, ratings, notas)
2. Pede à IA: "Com base neste perfil de gostos, recomenda 5 filmes/séries que este utilizador provavelmente vai adorar. Para cada um, explica brevemente porquê."
3. Normaliza a resposta em JSON e cruza com a TMDB API para obter poster, sinopse e metadados
4. Apresenta ao utilizador as recomendações com explicação gerada pela IA

**Prompt Engineering Base:**
```
Perfil do utilizador:
- Viu e adorou (8-10): [lista]
- Gostou moderadamente (5-7): [lista]
- Não gostou (0-4): [lista]
- Notas do utilizador: [notas livres]

Géneros implícitos: [extraídos automaticamente via TMDB]
Recusa categorias: [aprendidas de notas negativas]

Recomenda 5 filmes/séries que ainda não estejam no histórico do utilizador.
Para cada um, dá: título, ano, justificação (max 2 frases).
Responde APENAS em JSON válido com este schema: [schema]
```

#### F3 — Interface de Recomendações

Após processamento, mostrar ao utilizador **3 a 5 opções simultaneamente** (não apenas 1), dispostas em cards com:
- Poster (via TMDB)
- Título e ano
- Géneros
- Rating médio global (TMDB)
- Onde ver (plataformas disponíveis via TMDB Watch Providers API — gratuita)
- Justificação da IA (2–3 frases)

**Ações disponíveis por card:**
- ✅ **"Quero ver"** — adiciona à lista "A Ver" do utilizador
- ❌ **"Não me interessa"** — remove e pede à IA nova sugestão em substituição
- 👁️ **"Já vi"** — redireciona para ecrã de avaliação rápida

#### F4 — Lista "A Ver" (Watchlist)

Secção dedicada no perfil do utilizador com todos os conteúdos marcados como "Quero ver".

Cada item na lista inclui:
- Poster + título
- Estado: **Pendente** / **A ver agora** / **Concluído**
- Botão "Já vi!" → abre modal de avaliação (rating 0–10 + nota opcional)

Após avaliação, o item move-se automaticamente para o **Histórico** e é incorporado no perfil de gostos para futuras recomendações.

#### F5 — Perfil e Histórico

Página de perfil com:
- Histórico completo de filmes/séries vistos com ratings
- Estatísticas básicas: total visto, rating médio dado, géneros favoritos (gráfico de barras simples)
- Possibilidade de editar ou remover entradas

---

### 3.2 Features Recomendadas — Fase 2

#### F6 — Sistema de Tags/Mood ("Estou com vontade de ver...")

Em vez de apenas listar o histórico, o utilizador pode dizer como está:
- Humor atual: "Quero algo leve e engraçado", "Quero chorar", "Quero ação sem pensar muito"
- Duração disponível: "Tenho 2 horas", "Quero um episódio curto (20-30 min)"

Este contexto é injetado no prompt da IA para recomendações situacionais. **Alto impacto com baixa complexidade técnica.**

#### F7 — Perfis Múltiplos (Modo Família/Casal)

Permite criar até 3 perfis na mesma conta. Funcionalidade "Quem está a ver agora?" no início da sessão. Recomendações separadas por perfil. Sem autenticação complexa no MVP — baseado em PIN simples de 4 dígitos.

#### F8 — "Ver Juntos" — Recomendação para Grupo

O utilizador convida um amigo (via link partilhável) e a IA combina os perfis de gostos de ambos para recomendar algo que os dois vão gostar. Resolve o problema eterno de "o que vemos os dois?". **Feature de diferenciação forte.**

#### F9 — Integração com Letterboxd (Import)

Permite ao utilizador importar o histórico de ratings do Letterboxd via upload de CSV (disponível na exportação do Letterboxd). Poupa o onboarding manual para utilizadores existentes da plataforma. **Muito solicitado pela comunidade de cinéfilos.**

#### F10 — Notificações "Lembrete da Watchlist"

Se o utilizador não acede à app há mais de 7 dias, envia notificação/email lembrando que tem X títulos na Watchlist. Incentiva retenção. Requer sistema de autenticação e email (pode usar Supabase Auth gratuito).

#### F11 — Score de Compatibilidade com o Utilizador

Além da recomendação da IA, calcular um **"Match Score"** (0–100%) baseado em similaridade com filmes do histórico do utilizador (embedding cosine similarity via API gratuita). Mostra ao utilizador "92% compatível com o teu gosto" em cada sugestão. Aumenta confiança na recomendação.

#### F12 — "Porque é que este não me agradou?" (Feedback Negativo Refinado)

Quando o utilizador recusa uma sugestão ou dá nota baixa a algo que viu, mostrar opções de razão:
- "Muito lento/aborrecido"
- "Não gostei do género"
- "Já tentei ver e desisti"
- "Não é para mim mas é bom"

Estes sinais refinam o prompt e melhoram a qualidade das recomendações futuras. **Feature simples com impacto grande na qualidade da IA.**

---

## 4. Arquitetura Técnica

### 4.1 Stack Recomendado

| Camada | Tecnologia | Justificação |
|--------|------------|--------------|
| Frontend | React + Vite | SPA moderna, fácil de desenvolver, vasta documentação |
| Styling | Tailwind CSS v4 | Utilitário, rápido de iterar |
| Backend | Supabase (BaaS) | Gratuito até 500MB, auth, database PostgreSQL, realtime |
| IA | Google Gemini API (free tier) | 1M tokens/dia grátis, excelente para texto |
| Metadados de filmes | TMDB API | Gratuita, completa, cobre filmes + séries |
| Deployment | Vercel (free tier) | Deploy automático, domínio gratuito |

### 4.2 Integrações API Gratuitas

**TMDB API**
- Base URL: `https://api.themoviedb.org/3/`
- Endpoints relevantes:
  - `GET /search/multi` — autocomplete de títulos
  - `GET /movie/{id}` e `GET /tv/{id}` — detalhes completos
  - `GET /movie/{id}/watch/providers` — onde ver (Netflix, Prime, etc.)
  - `GET /discover/movie` — descoberta por géneros
- Chave de API: gratuita em https://developer.themoviedb.org
- Rate limit: 50 req/s (suficiente para MVP)

**Google Gemini API (Free Tier)**
- Modelo: `gemini-1.5-flash` (mais rápido, gratuito)
- Limite: 15 requests/min, 1M tokens/dia
- SDK: `@google/generative-ai` (npm)
- Registo: https://aistudio.google.com

**Alternativa — OpenRouter (modelos gratuitos)**
- URL: `https://openrouter.ai/api/v1/chat/completions`
- Modelos gratuitos: `mistralai/mistral-7b-instruct:free`, `google/gemma-3-12b:free`
- Sem custo para modelos marcados como `:free`

### 4.3 Schema da Base de Dados (Supabase / PostgreSQL)

```sql
-- Utilizadores (gerido pelo Supabase Auth)
users (id, email, created_at)

-- Histórico de visualizações
watched_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tmdb_id INTEGER NOT NULL,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  rating DECIMAL(3,1) CHECK (rating BETWEEN 0 AND 10),
  user_note TEXT,
  watched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Watchlist ("A Ver")
watchlist_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tmdb_id INTEGER NOT NULL,
  media_type TEXT,
  title TEXT NOT NULL,
  poster_path TEXT,
  status TEXT CHECK (status IN ('pending', 'watching', 'completed')) DEFAULT 'pending',
  ai_reason TEXT, -- Justificação da IA quando foi recomendado
  added_at TIMESTAMP DEFAULT NOW()
)

-- Feedback de recomendações recusadas (para melhorar a IA)
rejected_suggestions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  rejection_reason TEXT, -- Fase 2: F12
  rejected_at TIMESTAMP DEFAULT NOW()
)
```

### 4.4 Fluxo de Dados — Geração de Recomendação

```
1. Frontend solicita recomendações
2. Backend (Supabase Edge Function ou API Route Next.js):
   a. Lê histórico do utilizador da DB
   b. Lê lista de IDs recusados/watchlist (para excluir da recomendação)
   c. Extrai géneros favoritos via TMDB dos filmes no histórico
   d. Constrói prompt estruturado
   e. Chama Gemini API com prompt
   f. Faz parse da resposta JSON
   g. Para cada título sugerido, busca detalhes completos na TMDB
   h. Retorna array de 5 recomendações ao frontend
3. Frontend renderiza cards de recomendação
```

### 4.5 Tratamento de Erros de IA

- Se a IA retornar JSON malformado: retry automático (máx. 2 tentativas)
- Se o título sugerido pela IA não for encontrado na TMDB: substituir pela próxima sugestão
- Se rate limit da Gemini for atingido: fallback para OpenRouter com modelo gratuito
- Cache de recomendações por utilizador: 30 minutos (evitar chamadas repetidas)

---

## 5. Design e UX

### 5.1 Princípios de Design

- **Mobile-first**: maioria do consumo de entretenimento ocorre em telemóvel
- **Rapidez**: da abertura da app à primeira recomendação em menos de 60 segundos
- **Visual rico**: posters de alta qualidade são o centro da experiência
- **Fricção mínima**: ratings com um toque (slider ou tap em estrelas), nunca formulários longos

### 5.2 Ecrãs Principais (MVP)

| Ecrã | Descrição |
|------|-----------|
| **Onboarding** | Wizard de 3 passos: criar conta → adicionar 3+ títulos vistos → ver primeira recomendação |
| **Home / Descobrir** | Cards de recomendação com ação principal "Quero ver" |
| **Watchlist** | Lista de conteúdos a ver, com botão "Já vi!" |
| **Histórico** | Grid de posters do que já foi visto, com ratings |
| **Perfil** | Estatísticas, géneros favoritos, configurações |

### 5.3 Componentes UI Chave

- **Rating Component**: Slider 0–10 com feedback visual por cor (vermelho → amarelo → verde)
- **Movie Card**: Poster + overlay gradiente com título, rating TMDB, onde ver, e justificação IA
- **Watchlist Item**: Lista compacta com status badge colorido (Pendente / A Ver / Visto)
- **Mood Picker (Fase 2)**: Grid de emojis/moods para contextualizar pedido de recomendação

### 5.4 Paleta de Cores

- Fundo escuro (dark mode como default): experiência cinematográfica
- Accent: Teal/Ciano — moderno, neutro, não associado a nenhuma plataforma concorrente
- Texto primário: branco/off-white sobre fundos escuros
- Cards: superfície ligeiramente elevada com bordas subtis

---

## 6. Autenticação e Dados do Utilizador

### 6.1 Autenticação (MVP)

- Supabase Auth com Email/Password
- OAuth opcional: Google Sign-In (gratuito, aumenta conversão)
- Sessão persistente (localStorage via Supabase SDK)

### 6.2 Privacidade

- Os dados de histórico e ratings são privados por default
- Nenhum dado é partilhado com terceiros além das APIs declaradas (TMDB, Gemini)
- Os prompts enviados à Gemini API não incluem informação pessoal identificável — apenas títulos e ratings
- RGPD: botão "Apagar todos os meus dados" na página de perfil

---

## 7. Monetização (Pós-MVP)

*Não aplicável ao MVP. Para referência futura:*

- **Freemium**: tier gratuito com 5 recomendações/dia; tier premium (€3/mês) com recomendações ilimitadas, perfis múltiplos e feature "Ver Juntos"
- **Afiliação**: links de tracking para plataformas de streaming (Amazon Prime, Apple TV)
- **Sem anúncios**: compromisso com experiência limpa

---

## 8. Métricas de Sucesso (KPIs)

| Métrica | Meta MVP (3 meses) |
|---------|-------------------|
| Utilizadores registados | 500 |
| DAU/MAU Ratio | > 25% |
| Títulos avaliados por utilizador (média) | > 15 |
| Taxa de aceitação de sugestões (Quero Ver / Total sugerido) | > 40% |
| Taxa de conclusão de watchlist items (Visto / Adicionado) | > 30% |
| Churn a 30 dias | < 50% |

---

## 9. Roadmap de Desenvolvimento

### Fase 1 — MVP (6–8 semanas)

| Semana | Milestone |
|--------|-----------|
| 1–2 | Setup projeto, autenticação Supabase, integração TMDB API |
| 3–4 | Onboarding flow, registo de histórico, componente de rating |
| 5–6 | Engine de recomendação com Gemini API, cards de resultado |
| 7 | Watchlist flow completo (adicionar → "já vi" → avaliar → histórico) |
| 8 | Perfil, estatísticas, polish UI, testes, deploy Vercel |

### Fase 2 — Crescimento (após validação MVP)

- F6: Mood Selector
- F9: Import Letterboxd CSV
- F12: Feedback negativo refinado
- F8: "Ver Juntos" (feature de maior complexidade)
- F11: Match Score (embeddings)
- F7: Perfis múltiplos

---

## 10. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Gemini API muda tier gratuito | Média | Alto | Manter fallback OpenRouter; código abstrai o provider de IA |
| TMDB remove acesso gratuito | Baixa | Alto | Avaliar OMDb API como alternativa; cache agressivo de dados |
| Qualidade das recomendações da IA insuficiente | Média | Alto | Iterar prompt engineering; adicionar F12 (feedback negativo) cedo |
| Baixa retenção (utilizadores não voltam após primeira visita) | Alta | Médio | Implementar F10 (notificações) e F6 (mood) rapidamente pós-MVP |
| Rate limiting da Gemini no pico de utilizadores | Média | Médio | Cache de 30 min; queue de requests; fallback para OpenRouter |

---

## 11. Dependências Externas e Setup

### 11.1 Contas e Chaves Necessárias (todas gratuitas)

1. **TMDB API Key** — https://developer.themoviedb.org/docs/getting-started
2. **Google AI Studio (Gemini)** — https://aistudio.google.com/app/apikey
3. **Supabase Project** — https://supabase.com (plano free: 500MB DB, 50MB storage, 50k MAU)
4. **Vercel Account** — https://vercel.com (deploy gratuito com domínio `.vercel.app`)
5. **OpenRouter Account** (fallback IA) — https://openrouter.ai

### 11.2 Variáveis de Ambiente Necessárias

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_TMDB_API_KEY=...
VITE_GEMINI_API_KEY=...
VITE_OPENROUTER_API_KEY=... (opcional, fallback)
```

**Atenção:** As API keys do Gemini e TMDB, se usadas no frontend, ficam expostas no bundle JavaScript. Para produção, implementar as chamadas às APIs de IA via Supabase Edge Functions (servidor), passando apenas o resultado ao frontend.

---

## 12. Considerações de Acessibilidade

- Contraste de cores WCAG AA em todos os textos
- Alt text em todos os posters (título + ano)
- Navegação por teclado em todos os fluxos principais
- Rating slider com suporte a teclado (setas) e leitor de ecrã
- Tamanho mínimo de toque: 44×44px em mobile

---

*Documento preparado para entrega a agente de desenvolvimento IA. Todos os endpoints, schemas e fluxos estão definidos com detalhe suficiente para implementação direta.*
