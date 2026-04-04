-- Script SQL para criar o esquema da base de dados do CineMatch
-- Pode executar isto no editor SQL (SQL Editor) do dashboard do Supabase

-- 1. Histórico de visualizações (watched_items)
CREATE TABLE IF NOT EXISTS public.watched_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  rating DECIMAL(3,1) CHECK (rating BETWEEN 0 AND 10),
  user_note TEXT,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Watchlist ("A Ver")
CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT,
  title TEXT NOT NULL,
  poster_path TEXT,
  status TEXT CHECK (status IN ('pending', 'watching', 'completed')) DEFAULT 'pending',
  ai_reason TEXT, -- Justificação da IA quando foi recomendado
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Feedback de recomendações recusadas (Para Fase 2, mas já deixamos a tabela criada)
CREATE TABLE IF NOT EXISTS public.rejected_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- Configuração de Segurança (Row Level Security - RLS)
-- Garante que um utilizador apenas acede aos seus próprios dados
-- ==============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.watched_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejected_suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas para watched_items
CREATE POLICY "Users can manage their own watched items"
  ON public.watched_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para watchlist_items
CREATE POLICY "Users can manage their own watchlist items"
  ON public.watchlist_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para rejected_suggestions
CREATE POLICY "Users can manage their own rejected suggestions"
  ON public.rejected_suggestions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
